<template>
  <div>
    <!-- 1. ЗАКРЕПЛЕННАЯ ПАНЕЛЬ: ПОИСК И НАВИГАЦИЯ -->
    <div class="sticky-header mb-4 elevation-1">
      <v-container class="pa-2">
        <!-- Строка Поиска -->
        <v-text-field
          v-model="searchQuery"
          placeholder="Поиск по фамилии..."
          prepend-inner-icon="mdi-magnify"
          variant="outlined"
          density="compact"
          hide-details
          bg-color="surface"
          class="mb-3"
          rounded="lg"
        ></v-text-field>

        <!-- Навигатор по турам (Вместо скролла чипов) -->
        <div class="d-flex align-center justify-space-between">
          <!-- Кнопка НАЗАД -->
          <v-btn 
            icon="mdi-chevron-left" 
            variant="text" 
            @click="prevRound"
            :disabled="selectedRound <= 1"
          ></v-btn>

          <!-- Центральный выбор (Выпадающее меню) -->
          <v-menu>
            <template v-slot:activator="{ props }">
              <v-btn
                v-bind="props"
                variant="text"
                class="text-subtitle-1 font-weight-bold"
                append-icon="mdi-menu-down"
              >
                Тур {{ selectedRound }}
              </v-btn>
            </template>
            <v-list density="compact" max-height="300">
              <v-list-item
                v-for="r in roundsList"
                :key="r"
                :value="r"
                @click="selectedRound = r"
                :active="selectedRound === r"
                color="primary"
              >
                <v-list-item-title>Тур {{ r }}</v-list-item-title>
              </v-list-item>
            </v-list>
          </v-menu>

          <!-- Кнопка ВПЕРЕД -->
          <v-btn 
            icon="mdi-chevron-right" 
            variant="text" 
            @click="nextRound"
            :disabled="selectedRound >= maxRound"
          ></v-btn>
        </div>
      </v-container>
    </div>

    <!-- 2. СОСТОЯНИЕ ЗАГРУЗКИ -->
    <div v-if="store.isLoadingDetails" class="text-center pa-10">
      <v-progress-circular indeterminate color="primary" size="64"></v-progress-circular>
      <div class="text-medium-emphasis mt-4">Загрузка пар...</div>
    </div>
    
    <!-- 3. СОСТОЯНИЕ "НЕТ ДАННЫХ" -->
    <div v-else-if="filteredPairings.length === 0" class="text-center text-medium-emphasis pa-10">
      <v-icon size="64" class="mb-2">mdi-chess-king</v-icon>
      <div v-if="searchQuery">Партии с таким игроком не найдены</div>
      <div v-else>Нет данных о партиях в этом туре</div>
    </div>
    
    <!-- 4. СПИСОК ПАРТИЙ -->
    <div v-else>
      <!-- ДЕСКТОПНАЯ ТАБЛИЦА -->
      <v-card v-if="display.mdAndUp.value" border flat class="rounded-lg mx-4">
        <v-table class="rounds-table" hover>
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
              v-for="pairing in filteredPairings" 
              :key="pairing.id" 
              @click="goToGame(pairing)" 
              :class="{ 'clickable': pairing.pgn_moves }" 
              class="table-row"
            >
              <td class="text-center text-medium-emphasis">{{ pairing.board || '-' }}</td>
              
              <!-- Белые -->
              <td class="text-right">
                <div class="d-flex align-center justify-end">
                  <div class="mr-3">
                    <div 
                      class="font-weight-medium player-name-cell" 
                      :class="{ 'text-primary font-weight-bold': isWinner('white', pairing) }"
                      @click.stop="goToPlayer(pairing.white_player_id)"
                    >
                      {{ pairing.white_name }}
                    </div>
                    <div class="text-caption text-medium-emphasis">{{ pairing.white_rating }}</div>
                  </div>
                  <v-icon size="small" color="grey-lighten-1">mdi-chess-pawn</v-icon>
                </div>
              </td>

              <!-- Результат -->
              <td class="text-center">
                <v-chip 
                  v-if="pairing.black_player_id" 
                  :color="getResultColor(pairing.result)" 
                  variant="tonal" 
                  label 
                  class="font-weight-bold px-4"
                >
                  {{ formatResult(pairing.result) }}
                </v-chip>
                <v-chip v-else color="warning" variant="tonal" label>Bye</v-chip>
              </td>

              <!-- Черные -->
              <td class="text-left">
                <div class="d-flex align-center">
                  <v-icon size="small" color="grey-darken-3" class="mr-3">mdi-chess-pawn</v-icon>
                  <div v-if="pairing.black_player_id">
                    <div 
                      class="font-weight-medium player-name-cell" 
                      :class="{ 'text-primary font-weight-bold': isWinner('black', pairing) }"
                      @click.stop="goToPlayer(pairing.black_player_id)"
                    >
                      {{ pairing.black_name }}
                    </div>
                    <div class="text-caption text-medium-emphasis">{{ pairing.black_rating }}</div>
                  </div>
                  <span v-else class="text-medium-emphasis font-italic">Нет пары</span>
                </div>
              </td>
              
              <!-- Иконка перехода -->
              <td class="text-center">
                <v-icon v-if="pairing.pgn_moves" color="primary" class="chevron-icon">mdi-chevron-right</v-icon>
              </td>
            </tr>
          </tbody>
        </v-table>
      </v-card>
      
      <!-- МОБИЛЬНЫЙ СПИСОК (КАРТОЧКИ) -->
      <div v-else class="px-2">
        <v-row dense>
          <v-col v-for="pairing in filteredPairings" :key="pairing.id" cols="12">
            <v-card 
              class="mb-1 border-thin rounded-lg" 
              flat 
              @click="goToGame(pairing)" 
              :ripple="!!pairing.pgn_moves"
              :disabled="!pairing.pgn_moves && !!pairing.black_player_id"
            >
              <!-- Сценарий 1: Обычная игра -->
              <div v-if="pairing.black_player_id" class="d-flex align-center pa-3">
                <!-- Результат слева -->
                <div class="d-flex flex-column align-center justify-center mr-4" style="min-width: 40px;">
                  <div class="text-caption text-medium-emphasis mb-1">Доска {{ pairing.board }}</div>
                  <v-chip 
                    size="small" 
                    :color="getResultColor(pairing.result)" 
                    variant="tonal" 
                    label 
                    class="font-weight-bold"
                  >
                    {{ formatResult(pairing.result) }}
                  </v-chip>
                </div>

                <!-- Игроки -->
                <div class="flex-grow-1">
                  <!-- Белые -->
                  <div class="d-flex justify-space-between align-center mb-2">
                    <div class="d-flex align-center overflow-hidden">
                      <v-icon size="x-small" class="mr-2 text-medium-emphasis">mdi-circle-outline</v-icon>
                      <span 
                        class="text-body-2 text-truncate" 
                        :class="{ 'font-weight-bold text-primary': isWinner('white', pairing) }"
                      >
                        {{ pairing.white_name }}
                      </span>
                    </div>
                    <span class="text-caption text-medium-emphasis ml-2">{{ pairing.white_rating }}</span>
                  </div>
                  
                  <!-- Черные -->
                  <div class="d-flex justify-space-between align-center">
                    <div class="d-flex align-center overflow-hidden">
                      <v-icon size="x-small" class="mr-2 text-medium-emphasis">mdi-circle</v-icon>
                      <span 
                        class="text-body-2 text-truncate" 
                        :class="{ 'font-weight-bold text-primary': isWinner('black', pairing) }"
                      >
                        {{ pairing.black_name }}
                      </span>
                    </div>
                    <span class="text-caption text-medium-emphasis ml-2">{{ pairing.black_rating }}</span>
                  </div>
                </div>

                <!-- Шеврон -->
                <div class="ml-2 d-flex align-center" v-if="pairing.pgn_moves">
                   <v-icon color="primary">mdi-chevron-right</v-icon>
                </div>
              </div>

              <!-- Сценарий 2: Bye (Пропуск) -->
              <div v-else class="d-flex align-center pa-3 bg-grey-lighten-5">
                 <div class="mr-4 text-center" style="min-width: 40px;">
                    <v-chip size="small" color="warning" variant="tonal" label>Bye</v-chip>
                 </div>
                 <div class="d-flex align-center">
                    <v-icon size="x-small" class="mr-2">mdi-circle-outline</v-icon>
                    <span class="text-body-2 font-weight-bold">{{ pairing.white_name }}</span>
                    <span class="text-caption text-medium-emphasis ml-2">({{ pairing.white_rating }})</span>
                 </div>
              </div>
            </v-card>
          </v-col>
        </v-row>
      </div>
    </div>
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

// --- STATE ---
const searchQuery = ref('');

const selectedRound = computed({
  get() { return store.activeRound; },
  set(value) { store.activeRound = value; }
});

// --- COMPUTED ---
const roundsList = computed(() => {
  if (store.activeTournament?.rounds_count > 0) {
    return Array.from({ length: store.activeTournament.rounds_count }, (_, i) => i + 1);
  }
  if (store.games && store.games.length > 0) {
    const maxRound = Math.max(...store.games.map(g => parseInt(g.round) || 0));
    if (maxRound > 0) return Array.from({ length: maxRound }, (_, i) => i + 1);
  }
  return [1];
});

const maxRound = computed(() => {
  return roundsList.value.length > 0 ? Math.max(...roundsList.value) : 1;
});

// Фильтрация: Сначала по туру, потом по поиску
const filteredPairings = computed(() => {
  if (!store.games) return [];
  
  // 1. Берем игры только текущего тура
  let games = store.games.filter(g => parseInt(g.round) === selectedRound.value);

  // 2. Фильтруем по поиску (если введен)
  if (searchQuery.value) {
    const q = searchQuery.value.toLowerCase();
    games = games.filter(g => 
      g.white_name.toLowerCase().includes(q) || 
      (g.black_name && g.black_name.toLowerCase().includes(q))
    );
  }
  
  // 3. Сортируем по доске
  return games.sort((a, b) => (parseInt(a.board) || 0) - (parseInt(b.board) || 0));
});

// --- METHODS ---
const nextRound = () => {
  if (selectedRound.value < maxRound.value) {
    selectedRound.value++;
  }
};

const prevRound = () => {
  if (selectedRound.value > 1) {
    selectedRound.value--;
  }
};

const goToPlayer = (playerId) => {
  if (playerId) {
    router.push({ 
      name: 'Player', 
      params: { tournamentId: route.params.tournamentId, playerId } 
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

const getResultColor = (result) => {
  const res = formatResult(result);
  if (res === '1-0' || res === '0-1') return 'success'; 
  if (res === '½-½') return 'grey-darken-1';
  return 'default';
};
</script>

<style scoped>
.sticky-header {
  position: sticky;
  top: 64px;
  z-index: 10;
  background-color: rgb(var(--v-theme-surface)); /* Цвет фона карточки, а не фона страницы */
  border-bottom: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
  margin-left: -16px; /* Компенсация паддингов контейнера */
  margin-right: -16px;
  margin-top: -16px; /* Приклеиваем к самому верху */
}

/* Таблица */
.rounds-table th {
  text-transform: uppercase;
  font-size: 0.75rem !important;
  color: rgba(var(--v-theme-on-surface), 0.6) !important;
}

.rounds-table tr.clickable { cursor: pointer; }
.rounds-table tr.clickable:hover { background-color: rgba(var(--v-theme-primary), 0.04); }

/* Ссылка на игрока в таблице */
.player-name-cell {
  cursor: pointer;
}
.player-name-cell:hover {
  text-decoration: underline;
}

/* Иконка шеврона */
.table-row .chevron-icon {
  opacity: 0;
  transition: opacity 0.2s ease-in-out;
}
.table-row:hover .chevron-icon { opacity: 1; }
</style>