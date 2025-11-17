<template>
  <div>
    <!-- 1. СОСТОЯНИЕ ЗАГРУЗКИ -->
    <div v-if="store.isLoadingDetails" class="text-center pa-10">
      <v-progress-circular indeterminate color="primary"></v-progress-circular>
    </div>

    <!-- 2. ЕДИНАЯ АДАПТИВНАЯ ТАБЛИЦА -->
    <v-card v-else>
      <v-toolbar flat density="compact">
        <v-toolbar-title class="text-subtitle-1 font-weight-bold">Кросс-таблица</v-toolbar-title>
        <v-spacer></v-spacer>
        <v-menu location="bottom end">
          <template v-slot:activator="{ props }">
            <v-btn v-bind="props" icon="mdi-help-circle-outline" variant="text"></v-btn>
          </template>
          <v-list density="compact" class="legend-list">
            <v-list-subheader>УСЛОВНЫЕ ОБОЗНАЧЕНИЯ</v-list-subheader>
            <v-list-item>
              <div class="d-flex align-center">
                <div class="cell-example result-win"><div class="cell-content">18<v-icon icon="mdi-circle-outline" size="x-small" class="ml-1"></v-icon></div></div>
                <div class="ml-3 text-caption">Победа над №18 белыми</div>
              </div>
            </v-list-item>
            <v-list-item>
              <div class="d-flex align-center">
                <div class="cell-example result-draw"><div class="cell-content">19<v-icon icon="mdi-circle" size="x-small" class="ml-1"></v-icon></div></div>
                <div class="ml-3 text-caption">Ничья с №19 черными</div>
              </div>
            </v-list-item>
            <v-list-item>
              <div class="d-flex align-center">
                <div class="cell-example result-loss"><div class="cell-content is-technical">21<v-icon icon="mdi-circle" size="x-small" class="ml-1"></v-icon></div></div>
                <div class="ml-3 text-caption">Технический результат</div>
              </div>
            </v-list-item>
             <v-list-item>
              <div class="d-flex align-center">
                <div class="cell-example result-win"><div class="cell-content font-weight-bold">+</div></div>
                <div class="ml-3 text-caption">Bye (пропуск тура)</div>
              </div>
            </v-list-item>
          </v-list>
        </v-menu>
      </v-toolbar>
      <v-divider></v-divider>
      <div class="crosstable-wrapper">
        <!-- Добавляем динамический класс :class="{ 'is-mobile': mobile }" -->
        <v-table class="crosstable" :class="{ 'is-mobile': mobile }" density="compact">
          <thead>
            <tr>
              <th class="sticky-col rank-col">#</th>
              <th class="sticky-col player-col">Игрок</th>
              <th v-for="n in roundsList" :key="n" class="text-center round-col">{{ n }}</th>
              <th class="sticky-col-right points-col">Очки</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="player in crosstable" :key="player.player_id">
              <td class="sticky-col rank-col text-center">
                {{ player.starting_rank }}
              </td>
              <td class="sticky-col player-col">
                <!-- Используем тернарный оператор для форматирования имени на мобильных -->
                <div @click="goToPlayer(player.player_id)" class="player-link" :title="player.player_name">
                  {{ mobile ? formatPlayerName(player.player_name) : player.player_name }}
                </div>
              </td>
              <td 
                v-for="(result, i) in player.results" 
                :key="i" 
                class="text-center round-col result-cell"
                :class="getResultCellClass(result)"
                @click="goToGame(result)"
              >

                <v-tooltip v-if="result && result.is_bye" location="top">
                  <template v-slot:activator="{ props }">
                    <div v-bind="props" class="cell-content font-weight-bold text-success">
                      +
                    </div>
                  </template>
                  <span>Пропуск тура (Bye)</span>
                </v-tooltip>

                <v-tooltip v-else-if="result && result.is_technical" location="top">
                  <template v-slot:activator="{ props }">
                    <div v-bind="props" class="cell-content font-weight-bold is-technical">
                      <span class="mr-1">{{ result.opponent_starting_rank }}</span>
                      <v-icon :icon="getColorIcon(result.color)" size="x-small"></v-icon>
                    </div>
                  </template>
                  <span>{{ result.points === 1 ? 'Тех. победа' : 'Тех. поражение' }} vs {{ result.opponent_name }}</span>
                </v-tooltip>

                <v-tooltip v-else-if="result" location="top" :disabled="!result.opponent_name">
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
              <td class="sticky-col-right points-col text-center font-weight-bold">
                {{ player.totalPoints }}
              </td>
            </tr>
          </tbody>
        </v-table>
      </div>
    </v-card>
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
const { mobile } = useDisplay();

// Функция для сокращения имени на мобильных
const formatPlayerName = (name) => {
  if (!name) return '';
  const parts = name.replace(',', '').split(' ').filter(Boolean);
  if (parts.length >= 2) {
    const lastName = parts[0];
    const firstName = parts[1];
    return `${lastName} ${firstName.charAt(0)}.`; // "Смирнов А."
  }
  return name;
};

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
    router.push({ name: 'Player', params: { tournamentId: route.params.tournamentId, playerId } });
  }
};

const goToGame = (result) => {
  if (result && result.game_id && result.is_technical===0) {
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
</script>

<style scoped>
.crosstable-wrapper {
  overflow-x: auto;
  border-radius: inherit;
}
.crosstable.v-table {
  min-width: 700px;
}
.crosstable.v-table .v-table__wrapper > table > thead > tr > th {
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
  color: rgba(var(--v-theme-on-surface), 0.7);
  white-space: nowrap;
}
.crosstable.v-table .v-table__wrapper > table > tbody > tr:hover {
  background-color: rgba(var(--v-theme-primary), 0.04);
}
.sticky-col, .sticky-col-right {
  position: sticky;
  z-index: 2;
  background-color: rgb(var(--v-theme-surface));
}
.sticky-col {
  left: 0;
  border-right: 1px solid rgba(var(--v-theme-on-surface), 0.12);
}
th.sticky-col:nth-child(2),
td.sticky-col:nth-child(2) {
  left: 50px; /* Ширина rank-col по умолчанию */
  box-shadow: 2px 0 5px rgba(0,0,0,0.05);
}
.sticky-col-right {
  right: 0;
  border-left: 1px solid rgba(var(--v-theme-on-surface), 0.12);
  box-shadow: -2px 0 5px rgba(0,0,0,0.05);
}
.rank-col { width: 50px; min-width: 50px; }
.player-col { width: 220px; min-width: 220px; }
.round-col { width: 70px; min-width: 70px; }
.points-col { width: 80px; min-width: 80px; font-size: 1.2rem; }
.player-link {
  cursor: pointer;
  font-weight: 500;
  color: inherit;
  transition: color 0.2s;
  -webkit-tap-highlight-color: transparent;
}
.player-link:hover { color: rgb(var(--v-theme-primary)); }
.result-cell {
  cursor: pointer;
  transition: background-color 0.2s ease-in-out;
  -webkit-tap-highlight-color: transparent;
}
.result-cell:hover { background-color: rgba(var(--v-theme-on-surface), 0.08) !important; }
.cell-content { display: inline-flex; align-items: center; justify-content: center; padding: 4px; border-radius: 4px; }
.result-win { background-color: rgba(76, 175, 80, 0.1); }
.result-loss { background-color: rgba(244, 67, 54, 0.1); }
.result-draw { background-color: rgba(158, 158, 158, 0.1); }

/* --- СТИЛИ ДЛЯ МОБИЛЬНОЙ ВЕРСИИ (через класс .is-mobile) --- */
.crosstable.is-mobile {
  min-width: 0;
}
.crosstable.is-mobile .rank-col { width: 40px; min-width: 40px; }
.crosstable.is-mobile .player-col { width: 130px; min-width: 130px; }
.crosstable.is-mobile .round-col { width: 60px; min-width: 60px; }
.crosstable.is-mobile .points-col { width: 65px; min-width: 65px; font-size: 1.1rem; }

.crosstable.is-mobile th.sticky-col:nth-child(2),
.crosstable.is-mobile td.sticky-col:nth-child(2) {
  left: 40px; /* Новая ширина rank-col */
}

.crosstable.is-mobile .v-table__wrapper > table td,
.crosstable.is-mobile .v-table__wrapper > table th {
  padding: 0 8px; /* Более компактные отступы */
}

.crosstable.is-mobile .player-link {
  font-size: 0.9rem;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.cell-content.is-technical {
  border: 1px dashed rgba(var(--v-theme-on-surface), 0.4);
}
</style>