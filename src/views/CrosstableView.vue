<template>
  <div>
    <!-- 1. СОСТОЯНИЕ ЗАГРУЗКИ (ОБЩЕЕ ДЛЯ ОБЕИХ ВЕРСИЙ) -->
    <div v-if="store.isLoadingDetails" class="text-center pa-10">
      <v-progress-circular indeterminate color="primary"></v-progress-circular>
    </div>

    <!-- 2. ВЕРСИЯ ДЛЯ БОЛЬШИХ ЭКРАНОВ (ПЛАНШЕТЫ И ДЕСКТОПЫ) -->
    <v-card v-else-if="display.mdAndUp.value">
      <v-card-text class="crosstable-wrapper pa-0">
        <v-table class="crosstable" density="compact">
          <thead>
            <tr>
              <th class="rank-col sticky-col">#</th>
              <th class="player-col sticky-col">Игрок</th>
              <th v-for="n in roundsList" :key="n" class="text-center round-col">{{ n }}</th>
              <th class="text-center points-col">Очки</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="player in crosstable" :key="player.player_id">
              <td class="text-center rank-col sticky-col">{{ player.starting_rank }}</td>
              <td class="player-col sticky-col">
                <div @click="goToPlayer(player.player_id)" class="player-link text-subtitle-1 font-weight-medium">
                  {{ player.player_name }}
                </div>
              </td>
              <td 
                v-for="(result, i) in player.results" 
                :key="i" 
                class="text-center round-col result-cell"
                :class="getResultCellClass(result)"
                @click="goToGame(result)"
              >
                <v-tooltip v-if="result" location="top" :disabled="!result.opponent_name">
                  <template v-slot:activator="{ props }">
                    <div v-bind="props" class="cell-content">
                      <span class="mr-1">{{ result.opponent_starting_rank }}</span>
                      <v-icon :icon="getColorIcon(result.color)" size="x-small"></v-icon>
                    </div>
                  </template>
                  <span>{{ getResultSymbol(result.points) }} vs {{ result.opponent_name }}</span>
                </v-tooltip>
                <span v-else>-</span>
              </td>
              <td class="text-center points-col font-weight-bold text-h6">{{ player.totalPoints }}</td>
            </tr>
          </tbody>
        </v-table>
      </v-card-text>
    </v-card>

    <!-- ВЕРСИЯ ДЛЯ МОБИЛЬНЫХ -->
    <div v-else class="mobile-crosstable">
      <v-expansion-panels variant="accordion">
        <v-expansion-panel
          v-for="player in crosstable"
          :key="player.player_id"
          rounded="lg"
          class="mb-2 elevation-1"
        >
          <v-expansion-panel-title>
            <div class="d-flex align-center w-100">
              <span class="mr-4 text-medium-emphasis">{{ player.starting_rank }}</span>
              <div class="d-flex flex-column">
                <span class="font-weight-bold text-subtitle-1">{{ player.player_name.split(',')[0] }}</span>
                <span class="text-caption">{{ player.player_name.split(',')[1] }}</span>
              </div>
              <v-spacer></v-spacer>
              <v-chip label size="large" class="font-weight-bold" variant="tonal" color="primary">{{ player.totalPoints }}</v-chip>
            </div>
          </v-expansion-panel-title>
          
          <v-expansion-panel-text class="pa-0">
            <v-divider></v-divider>
            <v-list class="py-0">
              <template v-for="(result, index) in player.results">
                <!-- Отображаем сыгранные партии или "bye" -->
                <div v-if="result || isBye(player, index + 1)" :key="index">
                  <v-list-item
                    :disabled="!result || !result.game_id"
                    @click="goToGame(result)"
                    class="game-list-item"
                    lines="two"
                  >
                    <!-- ОСНОВНОЙ КОНТЕНТ КАРТОЧКИ ПАРТИИ -->
                    <div class="d-flex flex-column h-100">
                      <!-- Уровень 1: Тур и Результат -->
                      <div class="d-flex justify-space-between align-center mb-1">
                        <span class="text-caption font-weight-bold text-medium-emphasis">ТУР {{ index + 1 }}</span>
                        <v-chip v-if="result" :color="getResultChipColor(result.points)" label size="small" variant="text" class="font-weight-bold px-1">
                          {{ getResultSymbol(result.points) }}
                        </v-chip>
                        <v-chip v-else-if="isBye(player, index + 1)" label size="small" variant="text" class="font-weight-bold px-1">
                          +1 (Bye)
                        </v-chip>
                      </div>
                      
                      <!-- Уровень 2: Соперник и Цвет -->
                      <div class="d-flex align-center">
                        <v-icon v-if="result" :icon="getColorIcon(result.color)" size="small" class="mr-2"></v-icon>
                        <span v-if="result" class="opponent-name text-body-1">vs {{ result.opponent_name }}</span>
                        <span v-else class="opponent-name text-body-1 text-medium-emphasis">Пропуск тура</span>
                      </div>
                    </div>

                    <template v-slot:append>
                      <v-icon v-if="result && result.game_id" color="medium-emphasis">mdi-chevron-right</v-icon>
                    </template>
                  </v-list-item>
                  <v-divider></v-divider>
                </div>
              </template>
            </v-list>
          </v-expansion-panel-text>
        </v-expansion-panel>
      </v-expansion-panels>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useTournamentStore } from '@/stores/tournamentStore';
import { getColorIcon, getResultSymbol } from '@/utils/formatters';
import { buildCrosstable } from '@/utils/builders';
import { useDisplay } from 'vuetify';

const store = useTournamentStore();
const router = useRouter();
const route = useRoute();
const display = useDisplay();

const roundsList = computed(() => {
  if (store.activeTournament?.rounds_count > 0) {
    return Array.from({ length: store.activeTournament.rounds_count }, (_, i) => i + 1);
  }
  if (store.games?.length > 0) {
    const maxRound = Math.max(...store.games.map(g => parseInt(g.round) || 0));
    return maxRound > 0 ? Array.from({ length: maxRound }, (_, i) => i + 1) : [1];
  }
  return [1];
});

const crosstable = computed(() => {
  return buildCrosstable(store.crosstableData, roundsList.value.length);
});

const isBye = (player, roundNum) => {
  const result = player.results[roundNum - 1];
  // Если результата нет, но у игрока растут очки, это, скорее всего, bye
  const pointsBefore = player.results.slice(0, roundNum - 1).reduce((sum, r) => sum + (r?.points || 0), 0);
  const pointsAtRound = player.results.slice(0, roundNum).reduce((sum, r) => sum + (r?.points || 0), 0);
  return !result && pointsAtRound > pointsBefore;
};

const goToPlayer = (playerId) => {
  if (playerId) {
    router.push({ 
      name: 'Player', 
      params: { tournamentId: route.params.tournamentId, playerId } 
    });
  }
};

const goToGame = (result) => {
  if (result && result.game_id) {
    router.push({ name: 'Game', params: { gameId: result.game_id } });
  }
};

const getResultCellClass = (result) => {
  if (!result) return '';
  if (result.points === 1) return 'result-win';
  if (result.points === 0.5) return 'result-draw';
  if (result.points === 0) return 'result-loss';
  return '';
};

// Вспомогательные функции для мобильной версии
const getResultChipColor = (points) => {
  if (points === 1) return 'success';
  if (points === 0.5) return 'grey';
  if (points === 0) return 'error';
  return 'default';
};

const getResultText = (points) => {
  if (points === 1) return 'Победа';
  if (points === 0.5) return 'Ничья';
  if (points === 0) return 'Поражение';
  return '–';
};
const getResultIcon = (points) => {
  if (points === 1) return 'mdi-plus-thick';
  if (points === 0.5) return 'mdi-equal-thick';
  if (points === 0) return 'mdi-minus-thick';
  return 'mdi-help';
};
</script>

<style scoped>
/* --- СТИЛИ ДЛЯ ДЕСКТОПНОЙ ВЕРСИИ --- */
.crosstable-wrapper {
  overflow-x: auto;
  border-radius: 8px; /* Vuetify 3 uses 'lg' for 8px */
}
.crosstable.v-table .v-table__wrapper > table > thead > tr > th {
  text-transform: uppercase;
  font-size: 0.75rem;
  color: rgba(var(--v-theme-on-surface), 0.6);
}
.crosstable.v-table .v-table__wrapper > table > tbody > tr:hover {
  background-color: rgba(var(--v-theme-primary), 0.04);
}
.sticky-col {
  position: sticky;
  left: 0;
  z-index: 2;
  background-color: rgb(var(--v-theme-surface));
}
th.sticky-col:nth-child(2),
td.sticky-col:nth-child(2) {
  left: 60px;
}
.v-theme--light .sticky-col { border-right: 1px solid #e0e0e0; }
.v-theme--dark .sticky-col { border-right: 1px solid #424242; }

.rank-col { width: 60px; min-width: 60px; }
.player-col { width: 250px; min-width: 250px; }
.round-col { width: 90px; min-width: 90px; }
.points-col { width: 100px; min-width: 100px; }
.player-link { text-decoration: none; color: inherit; transition: color 0.2s; cursor: pointer; }
.player-link:hover { text-decoration: underline; color: rgb(var(--v-theme-primary)); }
.result-cell { cursor: pointer; transition: filter 0.2s ease-in-out; }
.result-cell:hover { filter: brightness(0.95); }
.cell-content { display: inline-flex; align-items: center; justify-content: center; padding: 4px 8px; border-radius: 4px; }
.result-win { background-color: rgba(76, 175, 80, 0.1); }
.result-loss { background-color: rgba(244, 67, 54, 0.1); }
.result-draw { background-color: rgba(158, 158, 158, 0.1); }

/* --- СТИЛИ ДЛЯ МОБИЛЬНОЙ ВЕРСИИ --- */
.mobile-crosstable .v-expansion-panel {
  border: 1px solid rgba(var(--v-theme-on-surface), 0.12);
  background-color: rgb(var(--v-theme-surface));
}
.mobile-crosstable .v-expansion-panel-title {
  padding: 12px 16px;
  min-height: 68px;
}
.mobile-crosstable .v-list-item {
  padding-top: 12px;
  padding-bottom: 12px;
  min-height: 72px; /* Фиксированная высота для ритма */
}
.opponent-name {
  white-space: normal; /* Позволяет имени переноситься, если оно сверхдлинное */
  line-height: 1.4;
}
/* Убираем лишний отступ у последнего разделителя в списке */
.mobile-crosstable .v-list .v-list-item:last-child + .v-divider {
  display: none;
}
</style>