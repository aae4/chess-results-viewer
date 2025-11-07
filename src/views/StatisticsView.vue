<template>
  <div v-if="stats">
    <v-row>
      <!-- Левая колонка: Главные события -->
      <v-col cols="12" md="4">
        <v-row>
          <v-col cols="12">
            <v-card>
              <v-card-title>Обзор турнира</v-card-title>
              <v-list density="compact">
                <v-list-item :title="`${stats.totalPlayers}`" subtitle="Участников" prepend-icon="mdi-account-group-outline"></v-list-item>
                <v-list-item :title="`${stats.totalRounds}`" subtitle="Туров" prepend-icon="mdi-recycle"></v-list-item>
                <v-list-item :title="`${stats.averageRating}`" subtitle="Средний рейтинг" prepend-icon="mdi-finance"></v-list-item>
              </v-list>
            </v-card>
          </v-col>
          <v-col cols="12">
            <v-card class="text-center pa-4 fill-height">
              <v-icon size="x-large" color="amber">mdi-rocket-launch-outline</v-icon>
              <v-card-title>Главный прорыв</v-card-title>
              <v-card-text v-if="stats.biggestOverperformer">
                <div class="text-h6">{{ stats.biggestOverperformer.player.name }}</div>
                <div class="text-h5 font-weight-bold text-success">+{{ stats.biggestOverperformer.diff }}</div>
                <div class="text-caption">пунктов перфоманса к рейтингу</div>
              </v-card-text>
            </v-card>
          </v-col>
          <v-col cols="12">
            <v-card class="text-center pa-4 fill-height">
              <v-icon size="x-large" color="red-lighten-1">mdi-sword-cross</v-icon>
              <v-card-title>Самый бескомпромиссный</v-card-title>
              <v-card-text v-if="stats.mostDecisivePlayer">
                <div class="text-h6">{{ stats.mostDecisivePlayer.player.name }}</div>
                <div class="text-h5 font-weight-bold">{{ stats.mostDecisivePlayer.drawRate.toFixed(0) }}% ничьих</div>
                <div class="text-caption">самый низкий процент в турнире</div>
              </v-card-text>
            </v-card>
          </v-col>
          <v-col cols="12">
            <v-card>
              <v-card-title>Непобежденные игроки</v-card-title>
              <v-card-subtitle v-if="stats.undefeatedPlayers.length > 0">Всего: {{ stats.undefeatedPlayers.length }}</v-card-subtitle>
              <v-card-text v-if="stats.undefeatedPlayers.length > 0">
                <v-chip v-for="p in stats.undefeatedPlayers" :key="p.name" class="ma-1">{{ p.name }} ({{ p.points }})</v-chip>
              </v-card-text>
              <v-card-text v-else class="text-center text-grey">Таких игроков нет.</v-card-text>
            </v-card>
          </v-col>
        </v-row>
      </v-col>

      <!-- Правая колонка: Аналитика и тренды -->
      <v-col cols="12" md="8">
        <v-row>
          <v-col cols="12">
            <v-card>
              <v-card-title>Распределение результатов</v-card-title>
              <v-card-text>
                <div class="stacked-bar mb-4">
                  <v-tooltip location="top">
                    <template v-slot:activator="{ props }"><div v-bind="props" class="bar-segment white-wins" :style="{ width: stats.resultDistribution.whiteWinPercent + '%' }"></div></template>
                    <span>Белые: {{ stats.resultDistribution.whiteWins }} побед ({{ stats.resultDistribution.whiteWinPercent }}%)</span>
                  </v-tooltip>
                  <v-tooltip location="top">
                    <template v-slot:activator="{ props }"><div v-bind="props" class="bar-segment draws" :style="{ width: stats.resultDistribution.drawPercent + '%' }"></div></template>
                    <span>Ничьи: {{ stats.resultDistribution.draws }} ({{ stats.resultDistribution.drawPercent }}%)</span>
                  </v-tooltip>
                  <v-tooltip location="top">
                    <template v-slot:activator="{ props }"><div v-bind="props" class="bar-segment black-wins" :style="{ width: stats.resultDistribution.blackWinPercent + '%' }"></div></template>
                    <span>Черные: {{ stats.resultDistribution.blackWins }} побед ({{ stats.resultDistribution.blackWinPercent }}%)</span>
                  </v-tooltip>
                </div>
                <div class="results-legend">
                  <div class="legend-item"><span class="legend-dot white-wins"></span><div><div class="font-weight-bold">Победы белых</div><div class="text-caption">{{ stats.resultDistribution.whiteWins }} ({{ stats.resultDistribution.whiteWinPercent }}%)</div></div></div>
                  <div class="legend-item"><span class="legend-dot draws"></span><div><div class="font-weight-bold">Ничьи</div><div class="text-caption">{{ stats.resultDistribution.draws }} ({{ stats.resultDistribution.drawPercent }}%)</div></div></div>
                  <div class="legend-item"><span class="legend-dot black-wins"></span><div><div class="font-weight-bold">Победы черных</div><div class="text-caption">{{ stats.resultDistribution.blackWins }} ({{ stats.resultDistribution.blackWinPercent }}%)</div></div></div>
                </div>
              </v-card-text>
            </v-card>
          </v-col>
          <v-col cols="12">
            <v-card>
              <v-card-title>Динамика партий</v-card-title>
              <v-list>
                <v-list-item v-if="stats.longestGame" prepend-icon="mdi-timer-sand-complete" @click="goToGame(stats.longestGame.game)" style="cursor: pointer;">
                  <v-list-item-title>Самая длинная партия: {{ stats.longestGame.moves }} ходов</v-list-item-title>
                  <v-list-item-subtitle>{{ stats.longestGame.game.whitePlayer.name }} vs {{ stats.longestGame.game.blackPlayer.name }}</v-list-item-subtitle>
                </v-list-item>
                <v-list-item v-if="stats.shortestGame" prepend-icon="mdi-timer-sand-empty" @click="goToGame(stats.shortestGame.game)" style="cursor: pointer;">
                  <v-list-item-title>Самая короткая партия: {{ stats.shortestGame.moves }} ходов</v-list-item-title>
                  <v-list-item-subtitle>{{ stats.shortestGame.game.whitePlayer.name }} vs {{ stats.shortestGame.game.blackPlayer.name }}</v-list-item-subtitle>
                </v-list-item>
                <v-list-item prepend-icon="mdi-timer-sand" :title="`Средняя длина партии: ${stats.averageMoveCount} ходов`"></v-list-item>
                <v-list-item prepend-icon="mdi-chess-rook" :title="`Всего рокировок: ${stats.totalCastles}`"></v-list-item>
                <v-list-item prepend-icon="mdi-chess-pawn" :title="`Всего превращений пешек: ${stats.totalPromotions}`"></v-list-item>
              </v-list>
            </v-card>
          </v-col>
          <v-col cols="12">
            <v-card>
              <v-card-title>Дебютные тренды</v-card-title>
              <v-data-table
                :headers="openingsHeaders"
                :items="stats.topOpenings"
                :items-per-page="10"
                density="compact"
              >
                <template v-slot:item.name="{ item }"><div>{{ item.name }}</div><div class="text-caption text-grey">{{ item.eco }}</div></template>
                <template v-slot:item.count="{ item }">
                  <template v-if="stats.resultDistribution">
                    {{ item.count }} ({{ ((item.count / (stats.resultDistribution.whiteWins + stats.resultDistribution.blackWins + stats.resultDistribution.draws)) * 100).toFixed(0) }}%)
                  </template>
                </template>
                <template v-slot:item.results="{ item }">
                  <div class="stacked-bar-mini my-1">
                    <div class="bar-segment white-wins" :style="{ width: (item.white / item.count * 100) + '%' }"></div>
                    <div class="bar-segment draws" :style="{ width: (item.draw / item.count * 100) + '%' }"></div>
                    <div class="bar-segment black-wins" :style="{ width: (item.black / item.count * 100) + '%' }"></div>
                  </div>
                </template>
              </v-data-table>
            </v-card>
          </v-col>
        </v-row>
      </v-col>
    </v-row>
  </div>
</template>

<script setup>
import { computed } from 'vue';
import { useRouter } from 'vue-router';
import { useTournamentStore } from '@/stores/tournament';

const store = useTournamentStore();
const router = useRouter();

// Используем computed, чтобы не загромождать шаблон
const stats = computed(() => store.statistics);

const openingsHeaders = [
  { title: 'Дебют', key: 'name', sortable: false, align: 'start' },
  { title: 'Партий', key: 'count', sortable: false, align: 'center', width: '120px' },
  { title: 'Результаты (Б/Н/Ч)', key: 'results', sortable: false, align: 'center', width: '200px' },
];

const goToGame = (game) => {
  if (game && game.round && game.board) {
    const gameId = `${game.round}-${game.board}`;
    router.push({ name: 'game', params: { id: gameId } });
  }
};
</script>

<style scoped>
.stacked-bar { display: flex; width: 100%; height: 24px; border-radius: 8px; overflow: hidden; }
.bar-segment { height: 100%; transition: width 0.5s ease-in-out; }
.bar-segment.white-wins { background-color: #E0E0E0; }
.bar-segment.draws { background-color: #BDBDBD; }
.bar-segment.black-wins { background-color: #424242; }

.v-theme--dark .bar-segment.white-wins { background-color: #BDBDBD; }
.v-theme--dark .bar-segment.draws { background-color: #757575; }
.v-theme--dark .bar-segment.black-wins { background-color: #212121; }

.results-legend { display: flex; justify-content: space-around; flex-wrap: wrap; gap: 16px; }
.legend-item { display: flex; align-items: center; }
.legend-dot { width: 12px; height: 12px; border-radius: 50%; margin-right: 8px; }

.stacked-bar-mini {
  display: flex;
  width: 100%;
  height: 12px;
  border-radius: 4px;
  overflow: hidden;
  border: 1px solid rgba(var(--v-theme-on-surface), 0.1);
}
</style>