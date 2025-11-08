<template>
  <div v-if="player" class="player-dashboard">
    <!-- 1. "HERO" СЕКЦИЯ: Главная информация об игроке -->
    <v-card class="mb-6">
      <v-card-text class="d-flex align-center">
        <v-btn icon="mdi-arrow-left" variant="text" @click="goBack" class="mr-4"></v-btn>
        <v-avatar color="primary" size="64" class="mr-6">
          <span class="text-h4 font-weight-light">{{ getInitials(player.name) }}</span>
        </v-avatar>
        <div>
          <h1 class="text-h4 font-weight-bold">{{ player.name }}</h1>
          <div class="text-subtitle-1 text-grey-darken-1">{{ player.details['клуб/город'] || player.fed }}</div>
        </div>
        <v-spacer></v-spacer>
        <div class="text-center mx-4">
          <div class="text-caption text-grey">МЕСТО</div>
          <div class="text-h3 font-weight-bold">{{ player.details?.место || '-' }}</div>
        </div>
        <v-divider vertical class="mx-2"></v-divider>
        <div class="text-center mx-4">
          <div class="text-caption text-grey">ОЧКИ</div>
          <div class="text-h3 font-weight-bold">{{ player.details?.очки || '-' }}</div>
        </div>
      </v-card-text>
    </v-card>

    <v-row>
      <!-- Левая колонка: Аналитика -->
      <v-col cols="12" md="5">
        <v-row>
          <!-- 2. Ключевые показатели -->
          <v-col cols="12">
            <v-card>
              <v-card-text>
                <v-row>
                  <v-col class="text-center">
                    <v-icon color="grey-darken-1" class="mb-1">mdi-chess-king</v-icon>
                    <div class="text-caption text-grey">Рейтинг</div>
                    <div class="text-h6">{{ player.rating }}</div>
                  </v-col>
                  <v-col class="text-center">
                    <v-icon color="grey-darken-1" class="mb-1">mdi-finance</v-icon>
                    <div class="text-caption text-grey">Перфоманс</div>
                    <div class="text-h6">{{ player.details?.рейтинговый_перфоманс || '-' }}</div>
                  </v-col>
                  <v-col class="text-center">
                    <v-icon color="grey-darken-1" class="mb-1">mdi-arrow-up-down-bold</v-icon>
                    <div class="text-caption text-grey">+/- Рейтинга</div>
                    <div class="text-h6" :class="ratingChangeColor">{{ ratingChangeText }}</div>
                  </v-col>
                </v-row>
              </v-card-text>
            </v-card>
          </v-col>
          
          <!-- 3. Результативность по цвету -->
          <v-col cols="12">
            <v-card>
              <v-card-title class="text-subtitle-1">Результативность по цвету</v-card-title>
              <v-card-text>
                <div class="d-flex align-center mb-3">
                  <div style="width: 100px"><v-icon icon="mdi-circle-outline" class="mr-2"></v-icon>Белые</div>
                  <v-progress-linear :model-value="analysis.colorStats.white.percent" color="grey-lighten-2" height="22" rounded>
                    <strong>{{ analysis.colorStats.white.points }} / {{ analysis.colorStats.white.games }}</strong>
                  </v-progress-linear>
                </div>
                <div class="d-flex align-center">
                  <div style="width: 100px"><v-icon icon="mdi-circle" class="mr-2"></v-icon>Черные</div>
                  <v-progress-linear :model-value="analysis.colorStats.black.percent" color="grey-darken-2" height="22" rounded>
                    <strong>{{ analysis.colorStats.black.points }} / {{ analysis.colorStats.black.games }}</strong>
                  </v-progress-linear>
                </div>
              </v-card-text>
            </v-card>
          </v-col>

          <!-- 4. НОВЫЙ БЛОК: Дебютный репертуар -->
          <v-col cols="12">
            <v-card>
              <v-card-title class="text-subtitle-1">Дебютный репертуар</v-card-title>
              <v-card-text v-if="analysis.openingStats.length > 0">
                <v-table density="compact">
                  <thead><tr><th>Дебют</th><th class="text-center">Партий</th><th class="text-center">Результат</th></tr></thead>
                  <tbody>
                    <tr v-for="op in analysis.openingStats" :key="op.name">
                      <td><div>{{ op.name }}</div><div class="text-caption text-grey">{{ op.eco }}</div></td>
                      <td class="text-center">{{ op.count }}</td>
                      <td class="text-center font-weight-bold">{{ op.points }} / {{ op.count }}</td>
                    </tr>
                  </tbody>
                </v-table>
              </v-card-text>
              <v-card-text v-else class="text-center text-grey">
                Нет данных по дебютам.
              </v-card-text>
            </v-card>
          </v-col>
        </v-row>
      </v-col>

      <!-- Правая колонка: Список партий -->
      <v-col cols="12" md="7">
        <v-card class="fill-height">
          <v-card-title class="text-subtitle-1">Сыгранные партии ({{ player.games.length }})</v-card-title>
          <v-divider></v-divider>
          <!-- Используем v-list для более гибкого и красивого отображения -->
          <v-list class="game-list">
            <v-list-item 
              v-for="game in player.games" 
              :key="game.round" 
              @click="viewGame(game)" 
              :disabled="!game.pgn"
              class="game-list-item"
            >
              <template v-slot:prepend>
                <div class="mr-4 text-center" style="width: 40px">
                  <div class="text-caption text-grey">Тур</div>
                  <div class="text-body-1 font-weight-medium">{{ game.round }}</div>
                </div>
              </template>

              <v-list-item-title class="font-weight-bold d-flex align-center">
                <v-icon size="small" :icon="getColorIcon(game.color)" class="mr-2"></v-icon>
                <span>vs {{ game.opponent_name }}</span>
                <span class="text-caption text-grey ml-2">({{ getOpponentRating(game.opponent_start_no) }})</span>
              </v-list-item-title>

              <template v-slot:append>
                <v-chip
                  :color="getResultChipColor(game)"
                  label
                  class="font-weight-bold"
                  style="width: 50px; justify-content: center;"
                >
                  {{ game.result }}
                </v-chip>
                <v-icon v-if="game.pgn" class="ml-4 text-grey">mdi-chevron-right</v-icon>
              </template>
            </v-list-item>
          </v-list>
        </v-card>
      </v-col>
    </v-row>
  </div>
  <v-alert v-else type="warning" class="mt-4">Игрок не найден.</v-alert>
</template>

<script setup>
import { computed } from 'vue';
import { useRouter } from 'vue-router';
import { useTournamentStore } from '@/stores/tournament';
import { getPointsFromResult, getInitials, getColorIcon } from '@/utils/formatters';
import { historyToPgnString } from '@/utils/pgn';
import { Chess } from 'chess.js';

const props = defineProps({ start_no: { type: [String, Number], required: true } });

const store = useTournamentStore();
const router = useRouter();

const player = computed(() => store.getPlayerByStartNo(props.start_no));

const goBack = () => router.back();
const viewGame = (game) => {
  if (!game.pgn || !game.board) return;
  const gameId = `${game.round}-${game.board}`;
  router.push({ name: 'game', params: { id: gameId }, query: { pov: player.value.start_no } });
};

// Функция для получения рейтинга оппонента
const getOpponentRating = (startNo) => {
  const opponent = store.getPlayerByStartNo(startNo);
  return opponent?.rating || '-';
};

// Функция для цвета чипа результата
const getResultChipColor = (game) => {
  const points = getPointsFromResult(game.result);
  if (points === 1) return 'success';
  if (points === 0) return 'error';
  return 'grey';
};

// Динамика рейтинга
const ratingChange = computed(() => {
  const perf = parseInt(player.value?.details?.рейтинговый_перфоманс || 0);
  const rating = parseInt(player.value?.rating || 0);
  if (perf === 0 || rating === 0) return 0;
  return perf - rating;
});
const ratingChangeText = computed(() => {
  const change = ratingChange.value;
  return change > 0 ? `+${change}` : change;
});
const ratingChangeColor = computed(() => {
  const change = ratingChange.value;
  if (change > 0) return 'text-success';
  if (change < 0) return 'text-error';
  return '';
});

// ГЛАВНОЕ ИЗМЕНЕНИЕ: Пересчет всей аналитики
const analysis = computed(() => {
  const stats = {
    colorStats: { white: { games: 0, points: 0, percent: 0 }, black: { games: 0, points: 0, percent: 0 } },
    openingStats: [],
  };
  if (!player.value || !player.value.games) return stats;

  const openingAggregator = {};

  player.value.games.forEach(game => {
    const points = getPointsFromResult(game.result);
    if (points === null) return; // Пропускаем несыгранные

    // 1. Считаем статистику по цвету
    if (game.color === 'w') {
      stats.colorStats.white.games++;
      stats.colorStats.white.points += points;
    } else if (game.color === 'b') {
      stats.colorStats.black.games++;
      stats.colorStats.black.points += points;
    }

    // 2. Считаем статистику по дебютам
    console.log(store.ecoDatabase)
    if (game.pgn && store.ecoDatabase) {
      try {
        console.log("herer")
        const chess = new Chess();
        chess.loadPgn(game.pgn);
        const history = chess.history();
        let foundOpening = null;

        for (let i = Math.min(history.length, 20); i > 0; i--) { // Ищем не глубже 10 ходов (20 полуходов)
          const pgnStr = historyToPgnString(history.slice(0, i)); 
          if (store.ecoDatabase[pgnStr]) {
            foundOpening = store.ecoDatabase[pgnStr];
            break;
          }
        }

        if (foundOpening) {
          console.log("found")
          const key = foundOpening.e;
          if (!openingAggregator[key]) {
            openingAggregator[key] = { eco: key, name: foundOpening.n, count: 0, points: 0 };
          }
          openingAggregator[key].count++;
          openingAggregator[key].points += points;
        }
      } catch (e) { /* Игнорируем ошибки парсинга PGN */ }
    }
  });

  // 3. Форматируем результат
  if (stats.colorStats.white.games > 0) stats.colorStats.white.percent = (stats.colorStats.white.points / stats.colorStats.white.games) * 100;
  if (stats.colorStats.black.games > 0) stats.colorStats.black.percent = (stats.colorStats.black.points / stats.colorStats.black.games) * 100;

  stats.openingStats = Object.values(openingAggregator).sort((a, b) => b.count - a.count || b.points - a.points);
  
  return stats;
});
</script>

<style scoped>
.player-dashboard {
  max-width: 1200px;
  margin: auto;
}
.game-list {
  padding: 0;
}
.game-list-item {
  border-bottom: 1px solid rgba(var(--v-theme-on-surface), 0.12);
  cursor: pointer;
  transition: background-color 0.15s ease-in-out;
}
.game-list-item:hover {
  background-color: rgba(var(--v-theme-primary), 0.04);
}
.game-list-item:last-child {
  border-bottom: none;
}
.game-list-item[disabled] {
  cursor: default;
  opacity: 0.6;
}
.game-list-item[disabled]:hover {
  background-color: transparent;
}
</style>