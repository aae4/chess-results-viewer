<template>
  <div>
    <v-chip-group v-model="selectedRound" mandatory color="primary" class="mb-4">
      <v-chip v-for="roundNum in roundsList" :key="roundNum" :value="roundNum" filter>
        Тур {{ roundNum }}
      </v-chip>
    </v-chip-group>
    
    <v-card>
      <v-card-title class="text-h5">
        Результаты {{ selectedRound }}-го тура
      </v-card-title>
      <v-divider></v-divider>

      <!-- 1. Состояние ЗАГРУЗКИ -->
      <div v-if="store.isLoadingDetails" class="text-center pa-10">
        <v-progress-circular indeterminate color="primary"></v-progress-circular>
        <div class="text-grey mt-2">Загрузка пар...</div>
      </div>
      
      <!-- 2. Состояние "НЕТ ДАННЫХ" -->
      <div v-else-if="currentRoundPairings.length === 0" class="text-center text-grey pa-10">
        <v-icon size="x-large">mdi-magnify-close</v-icon>
        <div class="mt-4">Нет данных о партиях в этом туре</div>
      </div>
      
      <!-- 3. Состояние КОНТЕНТА -->
      <div v-else>
        <!-- Адаптивный переключатель -->
        <v-table v-if="display.mdAndUp.value" class="rounds-table" hover>
          <thead>
            <tr>
              <th class="text-center" style="width: 10%;">Доска</th>
              <th class="text-right" style="width: 35%;">Белые</th>
              <th class="text-center" style="width: 15%;">Результат</th>
              <th class="text-left" style="width: 35%;">Черные</th>
              <th class="text-center" style="width: 5%;"></th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="pairing in currentRoundPairings" :key="pairing.id" @click="goToGame(pairing)" :class="{ 'clickable': pairing.pgn_moves }" class="table-row">
              <td class="text-center text-grey">{{ pairing.board || '-' }}</td>
              <!-- Белые (всегда есть) -->
              <td class="text-right">
                <a href="#" @click.prevent.stop="goToPlayer(pairing.white_player_id)" class="player-link" :class="{ 'font-weight-bold': isWinner('white', pairing) }">
                  {{ pairing.white_name }}
                </a>
                <div class="text-caption text-grey">{{ pairing.white_rating }}</div>
              </td>
              <!-- Результат -->
              <td class="text-center">
                <v-chip v-if="pairing.black_player_id" label variant="tonal" class="font-weight-bold">{{ formatResult(pairing.result) }}</v-chip>
                <v-chip v-else label variant="tonal" class="font-weight-bold">Bye</v-chip>
              </td>
              <!-- Черные (могут отсутствовать) -->
              <td class="text-left">
                <a v-if="pairing.black_player_id" href="#" @click.prevent.stop="goToPlayer(pairing.black_player_id)" class="player-link" :class="{ 'font-weight-bold': isWinner('black', pairing) }">
                  {{ pairing.black_name }}
                </a>
                <div v-if="pairing.black_player_id" class="text-caption text-grey">{{ pairing.black_rating }}</div>
                <span v-else class="text-medium-emphasis">Пропуск тура</span>
              </td>
              <td class="text-center">
                <v-icon v-if="pairing.pgn_moves" class="chevron-icon">mdi-chevron-right</v-icon>
              </td>
            </tr>
          </tbody>
        </v-table>
        
        <v-list v-else lines="two" class="mobile-list">
          <template v-for="(pairing, index) in currentRoundPairings" :key="pairing.id">
            <!-- Сценарий 1: Обычная игра -->
            <v-list-item v-if="pairing.black_player_id" @click="goToGame(pairing)" :disabled="!pairing.pgn_moves">
              <template v-slot:prepend>
                <div class="result-box">
                  <v-chip label variant="tonal" class="font-weight-bold">{{ formatResult(pairing.result) }}</v-chip>
                </div>
              </template>
              <div>
                <div class="d-flex align-baseline mb-1">
                  <v-icon size="x-small" class="mr-2">mdi-circle-outline</v-icon>
                  <div class="player-info">
                    <span class="player-name" :class="{ 'font-weight-bold': isWinner('white', pairing) }">{{ pairing.white_name }}</span>
                    <span class="player-rating text-body-2 text-grey-darken-1 ml-2">({{ pairing.white_rating }})</span>
                  </div>
                </div>
                <div class="d-flex align-baseline">
                  <v-icon size="x-small" class="mr-2">mdi-circle</v-icon>
                  <div class="player-info">
                    <span class="player-name" :class="{ 'font-weight-bold': isWinner('black', pairing) }">{{ pairing.black_name }}</span>
                    <span class="player-rating text-body-2 text-grey-darken-1 ml-2">({{ pairing.black_rating }})</span>
                  </div>
                </div>
              </div>
              <template v-slot:append>
                <v-icon v-if="pairing.pgn_moves">mdi-chevron-right</v-icon>
              </template>
            </v-list-item>

            <!-- Сценарий 2: Bye -->
            <v-list-item v-else>
              <template v-slot:prepend>
                <div class="result-box">
                  <v-chip label variant="tonal" class="font-weight-bold">Bye</v-chip>
                </div>
              </template>
              <div>
                 <div class="d-flex align-baseline">
                  <v-icon size="x-small" class="mr-2">mdi-circle-outline</v-icon>
                  <div class="player-info">
                    <span class="player-name font-weight-bold">{{ pairing.white_name }}</span>
                    <span class="player-rating text-body-2 text-grey-darken-1 ml-2">({{ pairing.white_rating }})</span>
                  </div>
                </div>
              </div>
            </v-list-item>

            <v-divider v-if="index < currentRoundPairings.length - 1"></v-divider>
          </template>
        </v-list>
      </div>
    </v-card>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useDisplay } from 'vuetify';
import { useTournamentStore } from '@/stores/tournamentStore';
import { formatResult } from '@/utils/formatters';

const store = useTournamentStore();
const router = useRouter();
const route = useRoute();
const display = useDisplay();

const selectedRound = computed({
  get() {
    return store.activeRound;
  },
  set(value) {
    store.activeRound = value;
  }
});

const roundsList = computed(() => {
  // 1. Приоритетный источник: данные о турнире
  if (store.activeTournament?.rounds_count > 0) {
    return Array.from({ length: store.activeTournament.rounds_count }, (_, i) => i + 1);
  }
  
  // 2. Запасной вариант: вычисляем по фактическому количеству партий
  if (store.games && store.games.length > 0) {
    const maxRound = Math.max(...store.games.map(g => parseInt(g.round) || 0));
    if (maxRound > 0) {
      return Array.from({ length: maxRound }, (_, i) => i + 1);
    }
  }
  
  // 3. Крайний случай: если данных нет вообще
  return [1];
});

const currentRoundPairings = computed(() => {
  if (!store.games) return [];
  return store.games.filter(g => parseInt(g.round) === selectedRound.value);
});

// === НОВАЯ ЛОГИКА: Правильная навигация ===
const goToPlayer = (playerId) => {
  if (playerId) {
    router.push({ 
      name: 'Player', 
      params: { 
        tournamentId: route.params.tournamentId,
        playerId: playerId
      } 
    });
  }
};

const goToGame = (game) => {
  if (!game.pgn_moves) return;
  router.push({ name: 'Game', params: { gameId: game.id } });
};

const isWinner = (color, game) => {
  const result = formatResult(game.result);

  if (color === 'white' && result === '1-0') return true;
  if (color === 'black' && result === '0-1') return true;
  return false;
};
</script>

<style scoped>
/* Стили для десктопной таблицы */
.rounds-table th {
  text-transform: uppercase;
  font-size: 0.75rem !important;
  color: rgba(var(--v-theme-on-surface), 0.6) !important;
}

.rounds-table tr.clickable {
  cursor: pointer;
}

/* hover-эффект для всей строки */
.rounds-table tr.clickable:hover {
  background-color: rgba(var(--v-theme-primary), 0.04);
}

.player-link {
  text-decoration: none;
  color: inherit;
  transition: color 0.2s;
}

.player-link:hover {
  text-decoration: underline;
  color: rgb(var(--v-theme-primary));
}

/* Скрываем иконку-шеврон и показываем при наведении */
.table-row .chevron-icon {
  opacity: 0;
  transition: opacity 0.2s ease-in-out;
}
.table-row:hover .chevron-icon {
  opacity: 1;
}


/* Стили для мобильного списка */
.mobile-list {
  padding: 0;
}

.result-box {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 80px;
  height: 100%;
  margin-right: 16px;
}

.player-info {
  /* Базовый размер шрифта для всей строки */
  font-size: 1rem; /* 16px по умолчанию */
  line-height: 1.4;
}

.player-name {
  /* Имя игрока */
  color: rgba(var(--v-theme-on-surface));
}

.player-rating {
  /* Рейтинг игрока - немного меньше и светлее */
  font-size: 0.875rem; /* 14px */
}
</style>