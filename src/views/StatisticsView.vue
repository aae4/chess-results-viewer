<template>
<div>
  <!-- Состояния загрузки и "нет данных" -->
  <div v-if="store.isLoadingDetails" class="text-center pa-10">
    <v-progress-circular indeterminate color="primary"></v-progress-circular>
  </div>
  <div v-else-if="!stats" class="text-center text-grey pa-10">
    Недостаточно данных для генерации статистики.
  </div>

  <!-- Основной контент -->
  <div v-else>
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
                <v-chip v-for="p in stats.undefeatedPlayers" :key="p.name" class="ma-1">{{ p.name }} ({{ p.score }})</v-chip>
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
                  <v-tooltip location="top"><template v-slot:activator="{ props }"><div v-bind="props" class="bar-segment white-wins" :style="{ width: stats.resultDistribution.whiteWinPercent + '%' }"></div></template><span>Белые: {{ stats.resultDistribution.whiteWins }} ({{ stats.resultDistribution.whiteWinPercent }}%)</span></v-tooltip>
                  <v-tooltip location="top"><template v-slot:activator="{ props }"><div v-bind="props" class="bar-segment draws" :style="{ width: stats.resultDistribution.drawPercent + '%' }"></div></template><span>Ничьи: {{ stats.resultDistribution.draws }} ({{ stats.resultDistribution.drawPercent }}%)</span></v-tooltip>
                  <v-tooltip location="top"><template v-slot:activator="{ props }"><div v-bind="props" class="bar-segment black-wins" :style="{ width: stats.resultDistribution.blackWinPercent + '%' }"></div></template><span>Черные: {{ stats.resultDistribution.blackWins }} ({{ stats.resultDistribution.blackWinPercent }}%)</span></v-tooltip>
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
                <v-list-item v-if="stats.longestGame" prepend-icon="mdi-timer-sand-complete" @click="goToGame(stats.longestGame.game.id)" style="cursor: pointer;">
                  <v-list-item-title>Самая длинная партия: {{ stats.longestGame.moves }} ходов</v-list-item-title>
                  <v-list-item-subtitle>{{ stats.longestGame.game.white_name }} vs {{ stats.longestGame.game.black_name }}</v-list-item-subtitle>
                </v-list-item>
                <v-list-item v-if="stats.shortestGame" prepend-icon="mdi-timer-sand-empty" @click="goToGame(stats.shortestGame.game.id)" style="cursor: pointer;">
                  <v-list-item-title>Самая короткая партия: {{ stats.shortestGame.moves }} ходов</v-list-item-title>
                  <v-list-item-subtitle>{{ stats.shortestGame.game.white_name }} vs {{ stats.shortestGame.game.black_name }}</v-list-item-subtitle>
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
              <v-data-table :headers="openingsHeaders" :items="stats.topOpenings" :items-per-page="10" density="compact">
                <!-- <span>{{stats.resultDistribution}}</span> -->
                <template v-slot:item.name="{ item }"><div>{{ item.name }}</div><div class="text-caption text-grey">{{ item.eco }}</div></template>
                <!-- <template v-slot:item.count="{ item }">{{ item.count }} ({{ ((item.count / stats.resultDistribution.whiteWins + stats.resultDistribution.blackWins + stats.resultDistribution.draws) * 100).toFixed(0) }}%)</template> -->
                <template v-slot:item.count="{ item }" v-if="stats.resultDistribution">
                  {{ item.count }} ({{ ((item.count / (stats.resultDistribution.whiteWins + stats.resultDistribution.blackWins + stats.resultDistribution.draws)) * 100).toFixed(0) }}%)
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
</div>
</template>

<script setup>
import { computed } from 'vue';
import { useRouter } from 'vue-router';
import { useTournamentStore } from '@/stores/tournamentStore';
import { formatResult } from '@/utils/formatters';
import { historyToPgnString } from '@/utils/pgn';
import { Chess } from 'chess.js';
// import { getEcoDatabase } from '@/services/ecoDatabase';

const store = useTournamentStore();
const router = useRouter();

const stats = computed(() => {
  const players = store.participants;
  const games = store.statisticsData; // Используем специальный набор данных для статистики
  const standings = store.standings;

  if (!players.length || !games.length || !standings.length) return null;

  const totalPlayers = players.length;
  const totalRounds = store.activeTournament?.rounds_count || 0;
  const averageRating = Math.round(players.reduce((sum, p) => sum + (p.rating || 0), 0) / players.length);

  let whiteWins = 0, blackWins = 0, draws = 0;
  let shortestGame = { moves: Infinity, game: null };
  let longestGame = { moves: 0, game: null };
  let totalMoves = 0;
  let gamesWithPgnCount = 0;
  const openingStats = {};
  const playerDrawCounts = {};
  let totalCastles = 0;
  let totalPromotions = 0;

  games.forEach(game => {
    const result = formatResult(game.result);
    if (result === '1-0') whiteWins++;
    else if (result === '0-1') blackWins++;
    else if (result === '½-½') {
      draws++;
      // Считаем ничьи для каждого игрока
      playerDrawCounts[game.white_player_id] = (playerDrawCounts[game.white_player_id] || 0) + 1;
      playerDrawCounts[game.black_player_id] = (playerDrawCounts[game.black_player_id] || 0) + 1;
    }

    if (game.pgn_moves) {
      const chess = new Chess();
      chess.loadPgn(game.pgn_moves);
      const history = chess.history();
      try {
        const chess = new Chess();
        chess.loadPgn(game.pgn_moves);
        const moveCount = chess.history().length / 2;
        if (moveCount > 0) {
          gamesWithPgnCount++;
          totalMoves += moveCount;
          if (moveCount < shortestGame.moves) shortestGame = { moves: Math.ceil(moveCount), game };
          if (moveCount > longestGame.moves) longestGame = { moves: Math.ceil(moveCount), game };
        }
      } catch (e) { /* ignore pgn errors */ }

      history.forEach(move => {
          if (move === 'O-O' || move === 'O-O-O') totalCastles++;
          if (move.includes('=')) totalPromotions++;
      });
      if (game.pgn_moves && store.ecoDatabase) {
        try {
          let foundOpening = null;

          for (let i = Math.min(history.length, 20); i > 0; i--) { // Ищем не глубже 10 ходов (20 полуходов)
            const pgnStr = historyToPgnString(history.slice(0, i)); 
            if (store.ecoDatabase[pgnStr]) {
              foundOpening = store.ecoDatabase[pgnStr];
              break;
            }
          }

          if (foundOpening) {
            const key = foundOpening.e;
            if (!openingStats[key]) {
              openingStats[key] = { eco: key, name: foundOpening.n, count: 0, white: 0, draw: 0, black: 0 };
            }
            openingStats[key].count++;
            if (result === '1-0') openingStats[key].white++;
            else if (result === '0-1') openingStats[key].black++;
            else if (result === '½-½') openingStats[key].draw++;
          }
        } catch (e) { /* Игнорируем ошибки парсинга PGN */ }
      }
    }
  });

  const totalGames = whiteWins + blackWins + draws;
  const resultDistribution = {
    whiteWins, blackWins, draws,
    whiteWinPercent: totalGames > 0 ? Math.round((whiteWins / totalGames) * 100) : 0,
    blackWinPercent: totalGames > 0 ? Math.round((blackWins / totalGames) * 100) : 0,
    drawPercent: totalGames > 0 ? Math.round((draws / totalGames) * 100) : 0,
  };

  const mostDecisivePlayer = players
    .map(p => {
        const playedGames = games.filter(g => g.white_player_id === p.id || g.black_player_id === p.id).length;
        const drawsCount = playerDrawCounts[p.id] || 0;
        return { player: p, drawRate: playedGames > 0 ? (drawsCount / playedGames) * 100 : 100 };
    })
    .sort((a, b) => a.drawRate - b.drawRate)[0];

  const biggestOverperformer = standings
    .filter(p => p.performance_rating && p.rating_at_tournament)
    .map(p => ({ player: p, diff: p.performance_rating - p.rating_at_tournament }))
    .sort((a, b) => b.diff - a.diff)[0];

  const undefeatedPlayers = standings.filter(p => {
    const playerGames = games.filter(g => g.white_player_id === p.player_id || g.black_player_id === p.player_id);
    return !playerGames.some(g => {
      const result = formatResult(g.result);
      if (g.white_player_id === p.player_id && result === '0-1') return true;
      if (g.black_player_id === p.player_id && result === '1-0') return true;
      return false;
    });
  });

  const topOpenings = Object.values(openingStats)
    .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name))
    .slice(0, 10);

  return {
    totalPlayers,
    totalRounds,
    averageRating,
    resultDistribution,
    shortestGame,
    longestGame,
    averageMoveCount: gamesWithPgnCount > 0 ? Math.round(totalMoves / gamesWithPgnCount) : 0,
    biggestOverperformer,
    undefeatedPlayers,
    mostDecisivePlayer,
    topOpenings,
    totalCastles,
    totalPromotions,
  };
});

const openingsHeaders = [
  { title: 'Дебют', key: 'name', sortable: false, align: 'start' },
  { title: 'Партий', key: 'count', sortable: false, align: 'center', width: '120px' },
  { title: 'Результаты (Б/Н/Ч)', key: 'results', sortable: false, align: 'center', width: '200px' },
];

const goToGame = (gameId) => {
  if (gameId) {
    router.push({ name: 'Game', params: { gameId } });
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