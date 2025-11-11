<template>
  <div>
    <!-- Состояние загрузки -->
    <div v-if="store.isLoadingDetails && !player" class="text-center pa-10">
      <v-progress-circular indeterminate color="primary" size="64"></v-progress-circular>
      <div class="mt-4 text-grey">Загрузка профиля игрока...</div>
    </div>

    <!-- Состояние контента -->
    <div v-else-if="player" class="player-dashboard">
      <!-- 1. "HERO" СЕКЦИЯ -->
      <v-card class="mb-6">
        <v-card-text class="d-flex align-center">
          <v-btn icon="mdi-arrow-left" variant="text" @click="goBack" class="mr-4"></v-btn>
          <v-avatar color="primary" size="64" class="mr-6">
            <span class="text-h4 font-weight-light">{{ getInitials(player.canonical_name) }}</span>
          </v-avatar>
          <div>
            <h1 class="text-h4 font-weight-bold">{{ player.canonical_name }}</h1>
            <div class="text-subtitle-1 text-grey-darken-1">{{ player.club_city || player.federation }}</div>
          </div>
          <v-spacer></v-spacer>
          <div class="text-center mx-4">
            <div class="text-caption text-grey">МЕСТО</div>
            <div class="text-h3 font-weight-bold">{{ player.final_rank || '-' }}</div>
          </div>
          <v-divider vertical class="mx-2"></v-divider>
          <div class="text-center mx-4">
            <div class="text-caption text-grey">ОЧКИ</div>
            <div class="text-h3 font-weight-bold">{{ player.score || '-' }}</div>
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
                      <div class="text-h6">{{ player.rating_at_tournament }}</div>
                    </v-col>
                    <v-col class="text-center">
                      <v-icon color="grey-darken-1" class="mb-1">mdi-finance</v-icon>
                      <div class="text-caption text-grey">Перфоманс</div>
                      <div class="text-h6">{{ player.performance_rating || '-' }}</div>
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

            <!-- 4. Дебютный репертуар -->
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
            <v-card-title class="text-subtitle-1">Сыгранные партии ({{ store.activePlayerGames.length }})</v-card-title>
            <v-divider></v-divider>
            <v-list class="game-list">
              <v-list-item 
                v-for="game in store.activePlayerGames" 
                :key="game.game_id" 
                @click="viewGame(game)" 
                :disabled="!game.pgn_moves"
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
                  <span class="text-caption text-grey ml-2">({{ game.opponent_rating || '-' }})</span>
                </v-list-item-title>
                <template v-slot:append>
                  <v-chip :color="getResultChipColor(game)" label class="font-weight-bold" style="width: 50px; justify-content: center;">
                    {{ formatPlayerResult(game.result, game.color) }}
                  </v-chip>
                  <v-icon v-if="game.pgn_moves" class="ml-4 text-grey">mdi-chevron-right</v-icon>
                </template>
              </v-list-item>
            </v-list>
          </v-card>
        </v-col>
      </v-row>
    </div>
    
    <v-alert v-else type="warning" class="mt-4">Игрок не найден.</v-alert>
  </div>
</template>

<script setup>
import { computed, watch } from 'vue';
import { useRouter } from 'vue-router';
import { useTournamentStore } from '@/stores/tournamentStore';
import { historyToPgnString } from '@/utils/pgn';
import { getInitials, getColorIcon, formatPlayerResult } from '@/utils/formatters';
import { calculatePlayerStatisticsInTournament } from '@/utils/statisticsCalculator';
import { Chess } from 'chess.js';

const props = defineProps({
  tournamentId: { type: [String, Number], required: true },
  playerId: { type: [String, Number], required: true }
});

const store = useTournamentStore();
const router = useRouter();

const player = computed(() => store.activePlayer);
const playerGames = computed(() => store.activePlayerGames);

watch(() => props.playerId, (newPlayerId) => {
    if (newPlayerId && props.tournamentId) {
      store.fetchPlayerData(newPlayerId, props.tournamentId);
    }
  }, { immediate: true }
);

const goBack = () => router.back();

const viewGame = (game) => {
  if (!game.pgn_moves) return;
  router.push({ name: 'Game', params: { gameId: game.id } });
};

const getResultChipColor = (game) => {
  const result = formatPlayerResult(game.result, game.color);
  if (result === '1') return 'success';
  if (result === '0') return 'error';
  return 'grey';
};

const ratingChange = computed(() => player.value?.rating_change || 0);
const ratingChangeText = computed(() => {
  const change = ratingChange.value;
  return change > 0 ? `+${change}` : (change || 0);
});
const ratingChangeColor = computed(() => {
  const change = ratingChange.value;
  if (change > 0) return 'text-success';
  if (change < 0) return 'text-error';
  return '';
});

const analysis = computed(() => {
  return calculatePlayerStatisticsInTournament({
    playerGames: store.activePlayerGames,
    ecoDatabase: store.ecoDatabase
  });
});
</script>

<style scoped>
/* Стили остаются без изменений */
.player-dashboard { max-width: 1200px; margin: auto; }
.game-list { padding: 0; }
.game-list-item { border-bottom: 1px solid rgba(var(--v-theme-on-surface), 0.12); cursor: pointer; transition: background-color 0.15s ease-in-out; }
.game-list-item:hover { background-color: rgba(var(--v-theme-primary), 0.04); }
.game-list-item:last-child { border-bottom: none; }
.game-list-item[disabled] { cursor: default; opacity: 0.6; }
.game-list-item[disabled]:hover { background-color: transparent; }
</style>