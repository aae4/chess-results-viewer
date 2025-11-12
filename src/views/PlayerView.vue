<template>
  <div>
    <!-- СОСТОЯНИЕ ЗАГРУЗКИ -->
    <div v-if="store.isLoadingDetails && !player" class="text-center pa-10">
      <v-progress-circular indeterminate color="primary" size="64"></v-progress-circular>
    </div>

    <div v-else-if="player">
      <!-- ======================================================= -->
      <!-- =========== ЕДИНЫЙ АДАПТИВНЫЙ МАКЕТ ============ -->
      <!-- ======================================================= -->
      <v-row>
        <!-- ======================================================= -->
        <!-- ============== ЛЕВАЯ КОЛОНКА / ОБЗОР ================ -->
        <!-- ======================================================= -->
        <v-col
          cols="12"
          md="4"
          :class="{ 'sticky-column': display.mdAndUp.value }"
        >
          <!-- Карточка игрока -->
          <v-card class="mb-6">
            <v-card-text class="d-flex align-center">
              <v-btn v-if="display.mdAndUp.value" icon="mdi-arrow-left" variant="text" @click="goBack" class="mr-4"></v-btn>
              <v-avatar color="primary" :size="display.mdAndUp.value ? 56 : 64" class="mr-4">
                <span :class="display.mdAndUp.value ? 'text-h5' : 'text-h4'" class="font-weight-light">{{ getInitials(player.canonical_name) }}</span>
              </v-avatar>
              <div>
                <h1 :class="display.mdAndUp.value ? 'text-h6' : 'text-h5'" class="font-weight-bold">{{ player.canonical_name }}</h1>
                <div class="text-body-1 text-medium-emphasis">{{ player.club_city || player.federation }}</div>
              </div>
            </v-card-text>
            <v-divider></v-divider>
            <div class="d-flex justify-space-around text-center pa-4">
              <div>
                <div class="text-caption">Место</div>
                <div :class="display.mdAndUp.value ? 'text-h5' : 'text-h4'" class="font-weight-bold">{{ player.final_rank || '-' }}</div>
              </div>
              <div>
                <div class="text-caption">Очки</div>
                <div :class="display.mdAndUp.value ? 'text-h5' : 'text-h4'" class="font-weight-bold">{{ player.score || '-' }}</div>
              </div>
            </div>
          </v-card>

          <!-- Мобильные табы -->
          <v-tabs v-if="!display.mdAndUp.value" v-model="tab" color="primary" grow class="mb-6">
            <v-tab value="overview">Обзор</v-tab>
            <v-tab value="games">Партии ({{ playerGames.length }})</v-tab>
          </v-tabs>
          
          <!-- ОБЩАЯ АНАЛИТИКА (появляется на десктопе и во вкладке "Обзор" на мобильных) -->
          <div v-if="display.mdAndUp.value || tab === 'overview'">
            <v-card class="mb-6">
              <v-card-text class="d-flex justify-space-around text-center">
                <div class="stat-item"><v-icon>mdi-chess-king</v-icon><div class="text-caption">Рейтинг</div><div class="text-subtitle-1 font-weight-medium">{{ player.rating_at_tournament }}</div></div>
                <div class="stat-item"><v-icon>mdi-finance</v-icon><div class="text-caption">Перфоманс</div><div class="text-subtitle-1 font-weight-medium">{{ player.performance_rating || '-' }}</div></div>
                <div class="stat-item"><v-icon>mdi-arrow-up-down-bold</v-icon><div class="text-caption">+/-</div><div class="text-subtitle-1 font-weight-medium" :class="ratingChangeColor">{{ ratingChangeText }}</div></div>
              </v-card-text>
            </v-card>
            <v-card class="mb-6">
              <v-card-title>Результативность по цвету</v-card-title>
              <v-card-text>
                <div class="d-flex align-center mb-3"><div style="width: 80px"><v-icon>mdi-circle-outline</v-icon> Белые</div><v-progress-linear :model-value="analysis.colorStats.white.percent" color="grey-lighten-2" height="20" rounded><strong>{{ analysis.colorStats.white.points }}/{{ analysis.colorStats.white.games }}</strong></v-progress-linear></div>
                <div class="d-flex align-center"><div style="width: 80px"><v-icon>mdi-circle</v-icon> Черные</div><v-progress-linear :model-value="analysis.colorStats.black.percent" color="grey-darken-2" height="20" rounded><strong>{{ analysis.colorStats.black.points }}/{{ analysis.colorStats.black.games }}</strong></v-progress-linear></div>
              </v-card-text>
            </v-card>
            <v-card>
              <v-card-title>Дебютный репертуар</v-card-title>
              <div v-if="analysis.openingStats.length > 0">
                <v-list lines="two" class="py-0">
                  <template v-for="(op, i) in analysis.openingStats" :key="op.name">
                    <v-list-item><v-list-item-title class="font-weight-medium">{{ op.name }}</v-list-item-title><v-list-item-subtitle>{{ op.eco }} · {{ op.count }} {{ op.count > 1 ? 'партии' : 'партия' }}</v-list-item-subtitle><template v-slot:append><v-chip label variant="tonal" class="font-weight-bold">{{ op.points }}/{{ op.count }}</v-chip></template></v-list-item>
                    <v-divider v-if="i < analysis.openingStats.length - 1"></v-divider>
                  </template>
                </v-list>
              </div>
              <v-card-text v-else class="text-center text-grey">Нет данных.</v-card-text>
            </v-card>
          </div>
        </v-col>

        <!-- ======================================================= -->
        <!-- ============ ПРАВАЯ КОЛОНКА / ПАРТИИ ============= -->
        <!-- ======================================================= -->
        <v-col
          cols="12"
          md="8"
          v-if="display.mdAndUp.value || tab === 'games'"
        >
          <v-card>
            <v-card-title>Партии ({{ playerGames.length }})</v-card-title>
            <v-divider></v-divider>
            
            <!-- УНИВЕРСАЛЬНЫЙ СПИСОК ПАРТИЙ -->
            <v-list class="py-0">
              <template v-for="(game, i) in playerGames" :key="game.game_id">
                <v-list-item
                  class="game-list-item"
                  :class="{ 'not-played': !isGamePlayed(game) }"
                  @click="viewGame(game)"
                  :disabled="!game.pgn_moves"
                  lines="two"
                >
                  <div class="d-flex align-center w-100">
                    <!-- Левая часть: Тур, Соперник -->
                    <div class="round-indicator text-center">
                      <div class="text-caption">Тур</div>
                      <div class="font-weight-medium">{{ game.round }}</div>
                    </div>
                    
                    <div class="flex-grow-1">
                      <div class="d-flex align-center">
                        <v-icon size="x-small" :icon="getColorIcon(game.color)" class="mr-2"></v-icon>
                        <span class="font-weight-bold">vs {{ game.opponent_name }}</span>
                      </div>
                      <div class="text-body-2 text-medium-emphasis ml-5">({{ game.opponent_rating || '-' }})</div>
                    </div>
                    
                    <!-- Правая часть: Результат, Иконка -->
                    <div class="ml-auto d-flex align-center">
                       <v-chip
                          :color="getResultChipColor(game)"
                          label
                          class="font-weight-bold result-chip"
                        >
                          {{ getResultText(game) }}
                        </v-chip>
                        <v-icon :style="{ opacity: game.pgn_moves ? 1 : 0 }" class="ml-2 text-medium-emphasis">mdi-chevron-right</v-icon>
                    </div>
                  </div>

                  <v-divider v-if="i < playerGames.length - 1" class="list-divider-mobile"></v-divider>
                </v-list-item>
                <v-divider v-if="i < playerGames.length - 1 && display.mdAndUp.value"></v-divider>
              </template>
            </v-list>
          </v-card>
        </v-col>
      </v-row>
    </div>

    <v-alert v-else type="warning" class="mt-4">Игрок не найден.</v-alert>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue';
import { useRouter } from 'vue-router';
import { useTournamentStore } from '@/stores/tournamentStore';
import { getInitials, getColorIcon, formatPlayerResult } from '@/utils/formatters';
import { calculatePlayerStatisticsInTournament } from '@/utils/statisticsCalculator';
import { useDisplay } from 'vuetify';

const props = defineProps({
  tournamentId: { type: [String, Number], required: true },
  playerId: { type: [String, Number], required: true }
});

const store = useTournamentStore();
const router = useRouter();
const display = useDisplay();
const tab = ref('overview');

const player = computed(() => store.activePlayer);
const playerGames = computed(() => store.activePlayerGames);

watch(() => props.playerId, (newPlayerId) => {
    if (newPlayerId && props.tournamentId) {
      store.fetchPlayerData(newPlayerId, props.tournamentId);
    }
  }, { immediate: true });

const goBack = () => router.back();
const viewGame = (game) => { if (game.pgn_moves) router.push({ name: 'Game', params: { gameId: game.id } }); };

const getResultChipColor = (game) => {
  if (!isGamePlayed(game)) return 'grey-lighten-1';
  const result = formatPlayerResult(game.result, game.color);
  if (result === '1') return 'success';
  if (result === '0') return 'error';
  return 'grey-darken-1';
};

const getResultText = (game) => {
  if (!isGamePlayed(game)) return 'Не сыграна';
  const result = formatPlayerResult(game.result, game.color);
  if (result === '1') return 'Победа';
  if (result === '0') return 'Поражение';
  return 'Ничья';
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

const isGamePlayed = (game) => {
  const result = formatPlayerResult(game.result, game.color);
  return result === '1' || result === '0' || result === '½';
};
</script>

<style scoped>
.sticky-column {
  position: sticky;
  top: 80px; /* 64px (app-bar) + 16px (отступ) */
}

.stat-item {
  min-width: 90px;
}

.round-indicator {
  width: 50px; 
  flex-shrink: 0; 
  margin-right: 16px;
}

.game-list-item {
  min-height: 72px;
}
.game-list-item .v-list-item-title, .game-list-item .v-list-item-subtitle {
  line-height: 1.4;
}

.result-chip {
  width: 110px;
  justify-content: center;
}

.not-played {
  opacity: 0.7;
}

/* Скрываем разделитель внутри элемента списка на десктопе */
@media (min-width: 960px) {
  .list-divider-mobile {
    display: none;
  }
}

/* Показываем разделитель внутри элемента списка на мобильных */
@media (max-width: 959px) {
  .game-list-item {
    padding-bottom: 0 !important;
  }
  .list-divider-mobile {
    margin-top: 12px;
    margin-left: -16px;
    margin-right: -16px;
  }
}
</style>