<template>
  <v-card class="crosstable-wrapper ">
    <v-table class="crosstable" density="compact">
      <thead>
        <tr>
          <!-- Добавляем класс для "липкой" колонки -->
          <th class="rank-col sticky-col">#</th>
          <th class="player-col sticky-col">Игрок</th>
          <th v-for="n in store.roundsList" :key="n" class="text-center round-col">{{ n }}</th>
          <th class="text-center points-col">Очки</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="player in store.crosstable" :key="player.start_no">
          <!-- Добавляем класс для "липкой" колонки -->
          <td class="text-center rank-col sticky-col">{{ player.start_no }}</td>
          <td class="player-col sticky-col">
            <a href="#" @click.prevent="goToPlayer(player.start_no)" class="player-link text-subtitle-1 font-weight-medium">
              {{ player.name }}
            </a>
          </td>
          
          <!-- Ячейки с результатами -->
          <td 
            v-for="(res, i) in player.results" 
            :key="i" 
            class="text-center round-col result-cell"
            :class="getResultCellClass(res, player.start_no)"
            @click="goToGame(res, i + 1, player.start_no)"
          >
            <!-- Если это ячейка игры с самим собой -->
            <div v-if="res && res.opponent_start_no === player.start_no" class="self-play-cell"></div>
            
            <!-- Если есть результат игры -->
            <v-tooltip v-else-if="res" location="top" :disabled="!res.opponent_name">
              <template v-slot:activator="{ props }">
                <div v-bind="props" class="cell-content">
                  <span class="mr-1">{{ res.opponent_start_no }}</span>
                  <v-icon :icon="getColorIcon(res.color)" size="x-small"></v-icon>
                </div>
              </template>
              <span>{{ getResultSymbol(res.points) }} vs {{ res.opponent_name }}</span>
            </v-tooltip>
            
            <!-- Если это пропуск тура (bye) или нет данных -->
            <span v-else>-</span>
          </td>

          <td class="text-center points-col font-weight-bold text-h6">{{ player.totalPoints }}</td>
        </tr>
      </tbody>
    </v-table>
  </v-card>
</template>

<script setup>
import { useRouter } from 'vue-router';
import { useTournamentStore } from '@/stores/tournament';
import { getColorIcon, getResultSymbol } from '@/utils/formatters';

const store = useTournamentStore();
const router = useRouter();

const goToPlayer = (startNo) => {
  if (startNo) {
    router.push({ name: 'player', params: { start_no: startNo } });
  }
};

const goToGame = (result, round, playerStartNo) => {
  // Переходим к партии только если есть результат, PGN (подразумевается, раз есть доска) и это не игра с собой
  if (!result || !result.board || result.opponent_start_no === playerStartNo) {
    return;
  }
  const gameId = `${round}-${result.board}`;
  router.push({ 
    name: 'game', 
    params: { id: gameId },
    query: { pov: playerStartNo } // Передаем, с чьей стороны смотреть
  });
};

// Функция для классов "тепловой карты"
const getResultCellClass = (result, playerStartNo) => {
  if (!result || !result.opponent_start_no) return '';
  if (result.opponent_start_no === playerStartNo) return 'self-play-cell';
  
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