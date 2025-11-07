<template>
  <div v-if="player">
    <v-card class="mx-auto" elevation="2">
      <v-card-title class="d-flex align-center">
        <v-btn icon="mdi-arrow-left" variant="text" @click="goBack" class="mr-2"></v-btn>
        Карточка игрока: {{ player.name }}
      </v-card-title>
      <v-card-subtitle>{{ player.details['клуб/город'] || player.fed }}</v-card-subtitle>
      <v-divider class="my-2"></v-divider>

      <v-card-text>
        <v-row dense>
          <v-col cols="6" sm="3"><v-sheet rounded="lg" class="pa-2 text-center" color="surface-variant"><div class="text-caption">Место</div><div class="font-weight-bold text-h6">{{ player.details?.место || '-' }}</div></v-sheet></v-col>
          <v-col cols="6" sm="3"><v-sheet rounded="lg" class="pa-2 text-center" color="surface-variant"><div class="text-caption">Очки</div><div class="font-weight-bold text-h6">{{ player.details?.очки || '-' }}</div></v-sheet></v-col>
          <v-col cols="6" sm="3"><v-sheet rounded="lg" class="pa-2 text-center" color="surface-variant"><div class="text-caption">Рейтинг</div><div class="font-weight-bold text-h6">{{ player.rating || '-' }}</div></v-sheet></v-col>
          <v-col cols="6" sm="3"><v-sheet rounded="lg" class="pa-2 text-center" color="surface-variant"><div class="text-caption">Перфоманс</div><div class="font-weight-bold text-h6">{{ player.details?.рейтинговый_перфоманс || '-' }}</div></v-sheet></v-col>
        </v-row>

        <v-card variant="outlined" class="mt-6">
          <v-card-title class="text-subtitle-1">Турнирный путь</v-card-title>
          <v-card-text>
            <div class="path-container">
              <svg class="path-graph" viewBox="0 0 1000 100" preserveAspectRatio="none">
                <polyline :points="analysis.tournamentPath.graphPoints" />
              </svg>
              <div class="path-results">
                <div v-for="item in analysis.tournamentPath.results" :key="item.round" class="path-item">
                  <v-chip :color="item.color" size="small">{{ item.label }}</v-chip>
                  <div class="text-caption text-grey">{{ item.round }}</div>
                </div>
              </div>
            </div>
          </v-card-text>
        </v-card>

        <v-row class="mt-4">
          <v-col cols="12" md="6">
            <v-card variant="tonal" class="fill-height">
              <v-card-title class="text-subtitle-1">Результативность по цвету</v-card-title>
              <v-card-text>
                <div class="d-flex align-center mb-2">
                  <div style="width: 80px"><v-icon icon="mdi-chess-king" class="mr-2"></v-icon>Белые</div>
                  <v-progress-linear :model-value="analysis.colorStats.white.percent" color="grey-lighten-2" height="20" rounded>
                    <strong>{{ analysis.colorStats.white.points }} / {{ analysis.colorStats.white.games }}</strong>
                  </v-progress-linear>
                </div>
                <div class="d-flex align-center">
                  <div style="width: 80px"><v-icon icon="mdi-chess-queen" class="mr-2"></v-icon>Черные</div>
                  <v-progress-linear :model-value="analysis.colorStats.black.percent" color="grey-darken-2" height="20" rounded>
                    <strong>{{ analysis.colorStats.black.points }} / {{ analysis.colorStats.black.games }}</strong>
                  </v-progress-linear>
                </div>
              </v-card-text>
            </v-card>
          </v-col>
          
          <v-col cols="12" md="6">
            <v-card variant="tonal" class="fill-height">
              <v-card-title class="text-subtitle-1">Анализ соперников</v-card-title>
              <v-list-item density="compact" prepend-icon="mdi-account-group-outline" :subtitle="`Средний рейтинг: ${analysis.opponentStats.averageRating}`"></v-list-item>
              <v-list-item density="compact" prepend-icon="mdi-arrow-up-bold-circle-outline" :subtitle="`Против > рейтинга: ${analysis.opponentStats.vsHigher}`"></v-list-item>
              <v-list-item density="compact" prepend-icon="mdi-arrow-down-bold-circle-outline" :subtitle="`Против < рейтинга: ${analysis.opponentStats.vsLower}`"></v-list-item>
            </v-card>
          </v-col>
        </v-row>

        <h3 class="mt-6 mb-2">Сыгранные партии</h3>
        <v-table density="compact">
          <thead>
            <tr><th class="text-left">Тур</th><th class="text-left">Цвет</th><th class="text-left">Соперник</th><th class="text-left">Результат</th><th></th></tr>
          </thead>
          <tbody>
            <tr v-for="game in player.games" :key="game.round">
              <td>{{ game.round }}</td>
              <td>{{ game.color === 'w' ? 'Белые' : 'Черные' }}</td>
              <td>{{ game.opponent_name }}</td>
              <td>{{ formatResult(game.result) }}</td>
              <td class="text-right">
                <v-btn v-if="game.pgn && game.board" size="small" variant="tonal" @click="viewGame(game)">
                  Смотреть<v-icon end icon="mdi-chevron-right"></v-icon>
                </v-btn>
              </td>
            </tr>
          </tbody>
        </v-table>
      </v-card-text>
    </v-card>
  </div>
  <v-alert v-else type="warning" class="mt-4" prominent border="start" icon="mdi-alert-circle-outline">
    Игрок с номером {{ start_no }} не найден. Возможно, данные еще загружаются или ссылка некорректна.
  </v-alert>
</template>

<script setup>
import { computed } from 'vue';
import { useRouter } from 'vue-router';
import { useTournamentStore } from '@/stores/tournament';
import { getPointsFromResult, formatResult } from '@/utils/formatters';

const props = defineProps({
  start_no: {
    type: [String, Number],
    required: true,
  },
});

const store = useTournamentStore();
const router = useRouter();

const player = computed(() => {
  return store.getPlayerByStartNo(props.start_no);
});

const goBack = () => {
  router.back();
};

const viewGame = (game) => {
  const gameId = `${game.round}-${game.board}`;
  router.push({ 
    name: 'game', 
    params: { id: gameId }, 
    // Добавляем query параметр, чтобы GameViewer знал, с чьей стороны показывать доску
    query: { pov: player.value.start_no } 
  });
};

const analysis = computed(() => {
  const stats = {
    colorStats: { white: { games: 0, points: 0, percent: 0 }, black: { games: 0, points: 0, percent: 0 } },
    opponentStats: { averageRating: 0, vsHigher: "0/0/0", vsLower: "0/0/0" },
    tournamentPath: { results: [], graphPoints: "0,100" },
  };

  if (!player.value || !player.value.games) return stats;

  const playerRating = parseInt(player.value.rating);
  let opponentRatingsSum = 0;
  let opponentCount = 0;
  let vsHigher = { w: 0, d: 0, l: 0 };
  let vsLower = { w: 0, d: 0, l: 0 };
  let currentPoints = 0;
  const graphData = [{ round: 0, points: 0 }];

  const sortedGames = [...player.value.games]
    .sort((a, b) => parseInt(a.round) - parseInt(b.round));

  sortedGames.forEach(game => {
    const points = getPointsFromResult(game.result);
    
    if (points === null) {
      if (game.opponent_name !== 'bye') {
          stats.tournamentPath.results.push({ round: game.round, label: '?', color: 'blue-grey-lighten-3' });
      }
      return;
    }
    
    currentPoints += points;
    graphData.push({ round: parseInt(game.round), points: currentPoints });

    if (game.color === 'w') {
      stats.colorStats.white.games++;
      stats.colorStats.white.points += points;
    } else if (game.color === 'b') {
      stats.colorStats.black.games++;
      stats.colorStats.black.points += points;
    }

    const opponent = store.players.find(p => p.start_no === game.opponent_start_no);
    if (opponent) {
      const opponentRating = parseInt(opponent.rating);
      if(!isNaN(opponentRating)) {
        opponentRatingsSum += opponentRating;
        opponentCount++;
        let record = opponentRating > playerRating ? vsHigher : vsLower;
        if (points === 1) record.w++;
        else if (points === 0.5) record.d++;
        else record.l++;
      }
    }

    stats.tournamentPath.results.push({
      round: game.round,
      label: points === 1 ? 'W' : (points === 0.5 ? 'D' : 'L'),
      color: points === 1 ? 'success' : (points === 0.5 ? 'grey' : 'error'),
    });
  });

  if (stats.colorStats.white.games > 0) stats.colorStats.white.percent = (stats.colorStats.white.points / stats.colorStats.white.games) * 100;
  if (stats.colorStats.black.games > 0) stats.colorStats.black.percent = (stats.colorStats.black.points / stats.colorStats.black.games) * 100;

  if (opponentCount > 0) stats.opponentStats.averageRating = Math.round(opponentRatingsSum / opponentCount);
  stats.opponentStats.vsHigher = `+${vsHigher.w} =${vsHigher.d} -${vsHigher.l}`;
  stats.opponentStats.vsLower = `+${vsLower.w} =${vsLower.d} -${vsLower.l}`;

  const playedRounds = graphData.length - 1;
  const maxPoints = playedRounds > 0 ? Math.max(...graphData.map(p => p.points)) : 1;
  stats.tournamentPath.graphPoints = graphData.map(p => {
    const x = playedRounds > 0 ? (p.round / playedRounds) * 1000 : 0;
    const y = maxPoints > 0 ? 100 - (p.points / maxPoints) * 90 : 100;
    return `${x},${y}`;
  }).join(' ');

  return stats;
});
</script>

<style scoped>
.path-container { position: relative; }
.path-graph { width: 100%; height: 60px; }
.path-graph polyline { fill: none; stroke: rgb(var(--v-theme-primary)); stroke-width: 3; stroke-linecap: round; stroke-linejoin: round; }
.path-results { display: flex; justify-content: space-around; margin-top: 8px; }
.path-item { display: flex; flex-direction: column; align-items: center; }
</style>