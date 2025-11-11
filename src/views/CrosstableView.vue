<template>
  <v-card>
    <v-card-text class="crosstable-wrapper pa-0">
      <!-- Добавляем состояние загрузки -->
      <div v-if="store.isLoadingDetails" class="text-center pa-10">
        <v-progress-circular indeterminate color="primary"></v-progress-circular>
      </div>
      <v-table v-else class="crosstable" density="compact">
        <thead>
          <tr>
            <th class="rank-col sticky-col">#</th>
            <th class="player-col sticky-col">Игрок</th>
            <th v-for="n in roundsList" :key="n" class="text-center round-col">{{ n }}</th>
            <th class="text-center points-col">Очки</th>
          </tr>
        </thead>
        <tbody>
          <!-- Итерируемся по нашему новому computed `crosstable` -->
          <tr v-for="player in crosstable" :key="player.player_id">
            <td class="text-center rank-col sticky-col">{{ player.starting_rank }}</td>
            <td class="player-col sticky-col">
              <a href="#" @click.prevent="goToPlayer(player.player_id)" class="player-link text-subtitle-1 font-weight-medium">
                {{ player.player_name }}
              </a>
            </td>
            <td 
              v-for="(roundNum, i) in roundsList" 
              :key="i" 
              class="text-center round-col result-cell"
              :class="getResultCellClass(player.results[i])"
              @click="goToGame(player.results[i])"
            >
              <v-tooltip v-if="player.results[i]" location="top" :disabled="!player.results[i].opponent_name">
                <template v-slot:activator="{ props }">
                  <div v-bind="props" class="cell-content">
                    <span class="mr-1">{{ player.results[i].opponent_starting_rank }}</span>
                    <v-icon :icon="getColorIcon(player.results[i].color)" size="x-small"></v-icon>
                  </div>
                </template>
                <span>{{ getResultSymbol(player.results[i].points) }} vs {{ player.results[i].opponent_name }}</span>
              </v-tooltip>
              <!-- Если это пропуск тура (bye) или нет данных -->
              <span v-else>-</span>
            </td>

            <td class="text-center points-col font-weight-bold text-h6">{{ player.totalPoints }}</td>
          </tr>
        </tbody>
      </v-table>
    </v-card-text>
  </v-card>
</template>

<script setup>
import { computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useTournamentStore } from '@/stores/tournamentStore';
import { getColorIcon, getResultSymbol } from '@/utils/formatters';
import { buildCrosstable } from '@/utils/builders'; // <-- ИМПОРТ

const store = useTournamentStore();
const router = useRouter();
const route = useRoute();

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

const goToGame = (result) => {
  if (!result || !result.game_id) return;
  router.push({ name: 'Game', params: { gameId: result.game_id } });
};

const getResultCellClass = (result) => {
  if (!result) return '';
  if (result.points === 1) return 'result-win';
  if (result.points === 0.5) return 'result-draw';
  if (result.points === 0) return 'result-loss';
  return '';
};
</script>

<style scoped>
/* Обертка для скролла и тени */
.crosstable-wrapper {
  overflow-x: auto;
  border: 1px solid rgba(var(--v-theme-on-surface), 0.12);
  border-radius: 4px;
}

.crosstable.v-table .v-table__wrapper > table > thead > tr > th {
  text-transform: uppercase;
  font-size: 0.75rem;
  color: rgba(var(--v-theme-on-surface), 0.6);
}

.crosstable.v-table .v-table__wrapper > table > tbody > tr:hover {
  background-color: rgba(var(--v-theme-primary), 0.04);
}

/* Стили для "липких" колонок */
.sticky-col {
  position: sticky;
  left: 0;
  z-index: 2;
  background-color: rgb(var(--v-theme-surface));
}
/* Сдвигаем вторую колонку на ширину первой */
th.sticky-col:nth-child(2),
td.sticky-col:nth-child(2) {
  left: 60px; /* Должно совпадать с rank-col width */
}
/* Добавляем границу, чтобы было видно, где скролл */
.v-theme--light .sticky-col {
  border-right: 1px solid #e0e0e0;
}
.v-theme--dark .sticky-col {
  border-right: 1px solid #424242;
}


.rank-col { width: 60px; min-width: 60px; }
.player-col { width: 250px; min-width: 250px; }
.round-col { width: 90px; min-width: 90px; }
.points-col { width: 100px; min-width: 100px; }

.player-link {
  text-decoration: none;
  color: inherit;
  transition: color 0.2s;
}
.player-link:hover {
  text-decoration: underline;
  color: rgb(var(--v-theme-primary));
}

/* Стили для ячеек с результатами */
.result-cell {
  cursor: pointer;
  transition: filter 0.2s ease-in-out;
}
.result-cell:hover {
  filter: brightness(0.95);
}
.cell-content {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 4px 8px;
  border-radius: 4px;
}

/* Стили для "тепловой карты" */
.result-win { background-color: rgba(76, 175, 80, 0.15); }
.result-loss { background-color: rgba(244, 67, 54, 0.15); }
.result-draw { background-color: rgba(158, 158, 158, 0.15); }

/* Ячейка игры с самим собой */
.self-play-cell {
  background: repeating-linear-gradient(
    -45deg,
    rgba(var(--v-theme-on-surface), 0.05),
    rgba(var(--v-theme-on-surface), 0.05) 5px,
    transparent 5px,
    transparent 10px
  );
  height: 100%;
  width: 100%;
}
</style>