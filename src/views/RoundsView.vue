<template>
  <div>
    <v-chip-group v-model="selectedRound" mandatory color="primary" class="mb-4">
      <v-chip v-for="roundNum in store.roundsList" :key="roundNum" :value="roundNum" filter>
        Тур {{ roundNum }}
      </v-chip>
    </v-chip-group>
    
    <v-card v-if="currentRoundData">
      <v-card-title class="text-h5">
        Результаты {{ selectedRound }}-го тура
      </v-card-title>
      <v-card-subtitle v-if="currentRoundData.byePlayer" class="pb-2">
        <v-icon size="small" color="grey" class="mr-1">mdi-coffee-outline</v-icon>
        {{ currentRoundData.byePlayer.name }} пропускает тур.
      </v-card-subtitle>
      <v-divider></v-divider>

      <!-- === АДАПТИВНЫЙ ПЕРЕКЛЮЧАТЕЛЬ ПРЕДСТАВЛЕНИЯ === -->

      <!-- 1. ПРЕДСТАВЛЕНИЕ ДЛЯ ДЕСКТОПА (большие экраны) -->
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
          <tr 
            v-for="pairing in currentRoundData.pairings" 
            :key="pairing.board"
            @click="goToGame(pairing)"
            :class="{ 'clickable': pairing.pgn }"
            class="table-row"
          >
            <td class="text-center text-grey">{{ pairing.board }}</td>
            <td class="text-right">
              <a href="#" @click.prevent.stop="goToPlayer(pairing.whitePlayer.start_no)" class="player-link" :class="{ 'font-weight-bold': isWinner('white', pairing) }">
                {{ pairing.white }}
              </a>
              <div class="text-caption text-grey">{{ pairing.whitePlayer?.rating }}</div>
            </td>
            <td class="text-center">
              <v-chip label variant="tonal" class="font-weight-bold">{{ formatResult(pairing.result) }}</v-chip>
            </td>
            <td class="text-left">
               <a href="#" @click.prevent.stop="goToPlayer(pairing.blackPlayer.start_no)" class="player-link" :class="{ 'font-weight-bold': isWinner('black', pairing) }">
                {{ pairing.black }}
               </a>
              <div class="text-caption text-grey">{{ pairing.blackPlayer?.rating }}</div>
            </td>
            <td class="text-center">
              <v-icon v-if="pairing.pgn" class="chevron-icon">mdi-chevron-right</v-icon>
            </td>
          </tr>
        </tbody>
      </v-table>

      <!-- 2. ПРЕДСТАВЛЕНИЕ ДЛЯ МОБИЛЬНЫХ (маленькие экраны) -->
      <v-list v-else lines="two" class="mobile-list">
        <template v-for="(pairing, index) in currentRoundData.pairings" :key="pairing.board">
          <v-list-item
            @click="goToGame(pairing)"
            :disabled="!pairing.pgn"
          >
            <!-- Левая часть: Результат -->
            <template v-slot:prepend>
              <div class="result-box">
                <v-chip label variant="tonal" class="font-weight-bold">
                  {{ formatResult(pairing.result) }}
                </v-chip>
              </div>
            </template>
            
            <!-- Основная часть: Игроки -->
            <div>
              <div class="d-flex align-baseline mb-1">
                <v-icon size="x-small" class="mr-2">mdi-circle-outline</v-icon>
                <div class="player-info">
                  <span class="player-name" :class="{ 'font-weight-bold': isWinner('white', pairing) }">{{ pairing.white }}</span>
                  <span class="player-rating text-body-2 text-grey-darken-1 ml-2">({{ pairing.whitePlayer?.rating }})</span>
                </div>
              </div>
              <div class="d-flex align-baseline">
                <v-icon size="x-small" class="mr-2">mdi-circle</v-icon>
                <div class="player-info">
                  <span class="player-name" :class="{ 'font-weight-bold': isWinner('black', pairing) }">{{ pairing.black }}</span>
                  <span class="player-rating text-body-2 text-grey-darken-1 ml-2">({{ pairing.blackPlayer?.rating }})</span>
                </div>
              </div>
            </div>

            <!-- Правая часть: Индикатор перехода -->
            <template v-slot:append>
              <v-icon v-if="pairing.pgn">mdi-chevron-right</v-icon>
            </template>
          </v-list-item>
          <!-- Разделитель между карточками -->
          <v-divider v-if="index < currentRoundData.pairings.length - 1"></v-divider>
        </template>
      </v-list>
    </v-card>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';
import { useRouter } from 'vue-router';
import { useDisplay } from 'vuetify';
import { useTournamentStore } from '@/stores/tournament';
import { formatResult } from '@/utils/formatters';

const store = useTournamentStore();
const router = useRouter();
const display = useDisplay();

const selectedRound = ref(1);

const currentRoundData = computed(() => store.roundsData[selectedRound.value] || null);

const goToPlayer = (startNo) => {
  if (startNo) {
    router.push({ name: 'player', params: { start_no: startNo } });
  }
};

const goToGame = (pairing) => {
  if (!pairing.pgn) return;
  const gameId = `${pairing.round}-${pairing.board}`;
  router.push({ name: 'game', params: { id: gameId } });
};

const isWinner = (color, pairing) => {
  const result = formatResult(pairing.result);
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