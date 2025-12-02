<template>
  <div>
    <!-- Состояния загрузки и "нет данных" -->
    <div v-if="store.isLoadingDetails" class="text-center pa-10">
      <v-progress-circular indeterminate color="primary" size="64"></v-progress-circular>
    </div>
    
    <!-- Добавляем проверку на наличие партий с ходами для статистики -->
    <div v-else-if="!stats || totalGames === 0" class="text-center text-medium-emphasis pa-10">
      <v-icon size="64" class="mb-4">mdi-chart-bar-off</v-icon>
      <div class="text-h6">Статистика недоступна</div>
      <div class="text-body-2 mt-2">
        Пока недостаточно данных о сыгранных партиях. <br>
        Статистика появится после завершения первых игр и ввода ходов.
      </div>
    </div>

    <div v-else>
      <!-- 1. ВИТРИНА КЛЮЧЕВЫХ ПОКАЗАТЕЛЕЙ -->
      <v-row class="mb-4">
        <v-col cols="12" sm="4">
          <v-sheet rounded="lg" class="pa-4 text-center d-flex align-center stat-card">
            <v-icon size="48" color="primary" class="mr-4">mdi-account-group-outline</v-icon>
            <div>
              <div class="text-h4 font-weight-bold">{{ stats.totalPlayers }}</div>
              <div class="text-caption text-medium-emphasis">Участников</div>
            </div>
          </v-sheet>
        </v-col>
        <v-col cols="12" sm="4">
          <v-sheet rounded="lg" class="pa-4 text-center d-flex align-center stat-card">
            <v-icon size="48" color="primary" class="mr-4">mdi-recycle</v-icon>
            <div>
              <div class="text-h4 font-weight-bold">{{ stats.totalRounds }}</div>
              <div class="text-caption text-medium-emphasis">Туров</div>
            </div>
          </v-sheet>
        </v-col>
        <v-col cols="12" sm="4">
          <v-sheet rounded="lg" class="pa-4 text-center d-flex align-center stat-card">
            <v-icon size="48" color="primary" class="mr-4">mdi-finance</v-icon>
            <div>
              <div class="text-h4 font-weight-bold">{{ stats.averageRating }}</div>
              <div class="text-caption text-medium-emphasis">Средний рейтинг</div>
            </div>
          </v-sheet>
        </v-col>
      </v-row>

      <v-row>
        <!-- Левая колонка: Главные события -->
        <v-col cols="12" md="4">
          <v-row>
            <!-- 2. СЕТКА ДЛЯ ГЛАВНЫХ ИСТОРИЙ -->
            <v-col cols="12" sm="6" md="12">
              <v-card class="text-center pa-4 fill-height highlight-card">
                <v-icon size="x-large" color="amber">mdi-rocket-launch-outline</v-icon>
                <v-card-title class="text-wrap">Главный прорыв</v-card-title>
                <v-card-text v-if="stats.biggestOverperformer" class="d-flex flex-column flex-grow-1 justify-center">
                  <div class="text-h6 cursor-pointer" @click="goToPlayer(stats.biggestOverperformer.player.player_id)">{{ stats.biggestOverperformer.player.name }}</div>
                  <div class="text-h4 font-weight-bold text-success my-1">+{{ stats.biggestOverperformer.diff }}</div>
                  <div class="text-caption">пунктов перфоманса к рейтингу</div>
                </v-card-text>
                <v-card-text v-else class="text-medium-emphasis">Нет данных для расчета</v-card-text>
              </v-card>
            </v-col>
            <v-col cols="12" sm="6" md="12">
              <v-card class="text-center pa-4 fill-height highlight-card">
                <v-icon size="x-large" color="red-lighten-1">mdi-sword-cross</v-icon>
                <v-card-title class="text-wrap">Самый бескомпромиссный</v-card-title>
                <v-card-text v-if="stats.mostDecisivePlayer" class="d-flex flex-column flex-grow-1 justify-center">
                  <div class="text-h6 cursor-pointer" @click="goToPlayer(stats.mostDecisivePlayer.player.player_id)">{{ stats.mostDecisivePlayer.player.name }}</div>
                  <div class="text-h4 font-weight-bold my-1">{{ stats.mostDecisivePlayer.drawRate.toFixed(0) }}% ничьих</div>
                  <div class="text-caption">из {{ stats.mostDecisivePlayer.playedGames }} сыгранных партий</div>
                </v-card-text>
                <v-card-text v-else class="text-medium-emphasis">Нет данных для расчета</v-card-text>
              </v-card>
            </v-col>
            <v-col cols="12">
              <v-card>
                <v-card-title>Непобежденные игроки</v-card-title>
                <v-card-subtitle v-if="stats.undefeatedPlayers?.length > 0">Всего: {{ stats.undefeatedPlayers.length }}</v-card-subtitle>
                <v-card-text v-if="stats.undefeatedPlayers?.length > 0">
                  <v-chip v-for="p in stats.undefeatedPlayers" :key="p.id" class="ma-1" @click="goToPlayer(p.player_id)" label>{{ p.name }} ({{ p.score }})</v-chip>
                </v-card-text>
                <v-card-text v-else class="text-center text-medium-emphasis">Пока таких игроков нет.</v-card-text>
              </v-card>
            </v-col>
          </v-row>
        </v-col>

        <!-- Правая колонка: Аналитика и тренды -->
        <v-col cols="12" md="8">
          <v-card>
            <v-card-title>Аналитика турнира</v-card-title>
            <v-divider></v-divider>
            
            <!-- 3. БЛОК РЕЗУЛЬТАТОВ -->
            <v-card-text v-if="stats.resultDistribution">
              <h3 class="text-subtitle-1 font-weight-bold mb-3">Распределение результатов</h3>
              <div class="stacked-bar mb-2">
                <v-tooltip location="top"><template v-slot:activator="{ props }"><div v-bind="props" class="bar-segment bg-grey-lighten-2" :style="{ width: stats.resultDistribution.whiteWinPercent + '%' }"></div></template><span>Белые: {{ stats.resultDistribution.whiteWins }} ({{ stats.resultDistribution.whiteWinPercent }}%)</span></v-tooltip>
                <v-tooltip location="top"><template v-slot:activator="{ props }"><div v-bind="props" class="bar-segment bg-grey-darken-1" :style="{ width: stats.resultDistribution.drawPercent + '%' }"></div></template><span>Ничьи: {{ stats.resultDistribution.draws }} ({{ stats.resultDistribution.drawPercent }}%)</span></v-tooltip>
                <v-tooltip location="top"><template v-slot:activator="{ props }"><div v-bind="props" class="bar-segment bg-grey-darken-4" :style="{ width: stats.resultDistribution.blackWinPercent + '%' }"></div></template><span>Черные: {{ stats.resultDistribution.blackWins }} ({{ stats.resultDistribution.blackWinPercent }}%)</span></v-tooltip>
              </div>
              <div class="d-flex justify-center flex-wrap ga-4 text-caption">
                <div class="d-flex align-center"><v-icon icon="mdi-circle-slice-8" color="grey-lighten-2" class="mr-1"></v-icon> Победы белых ({{ stats.resultDistribution.whiteWinPercent }}%)</div>
                <div class="d-flex align-center"><v-icon icon="mdi-circle-slice-8" color="grey-darken-1" class="mr-1"></v-icon> Ничьи ({{ stats.resultDistribution.drawPercent }}%)</div>
                <div class="d-flex align-center"><v-icon icon="mdi-circle-slice-8" color="grey-darken-4" class="mr-1"></v-icon> Победы черных ({{ stats.resultDistribution.blackWinPercent }}%)</div>
              </div>
            </v-card-text>

            <v-divider class="mx-4"></v-divider>

            <v-card-text>
              <h3 class="text-subtitle-1 font-weight-bold mb-2">Динамика партий</h3>
              <v-list lines="two" density="compact">
                <!-- Безопасная проверка на существование game внутри stats.longestGame -->
                <v-list-item class="list-item-hover" v-if="stats.longestGame?.game" prepend-icon="mdi-timer-sand-complete" @click="goToGame(stats.longestGame.game.id)">
                  <v-list-item-title>Самая длинная партия: <strong>{{ stats.longestGame.moves }} ходов</strong></v-list-item-title>
                  <v-list-item-subtitle>{{ stats.longestGame.game.white_name }} vs {{ stats.longestGame.game.black_name }}</v-list-item-subtitle>
                </v-list-item>
                
                <v-list-item class="list-item-hover" v-if="stats.shortestGame?.game" prepend-icon="mdi-timer-sand-empty" @click="goToGame(stats.shortestGame.game.id)">
                  <v-list-item-title>Самая короткая партия: <strong>{{ stats.shortestGame.moves }} ходов</strong></v-list-item-title>
                  <v-list-item-subtitle>{{ stats.shortestGame.game.white_name }} vs {{ stats.shortestGame.game.black_name }}</v-list-item-subtitle>
                </v-list-item>
                
                <div v-if="!stats.longestGame && !stats.shortestGame" class="text-caption text-medium-emphasis text-center py-2">
                  Нет данных о ходах в партиях.
                </div>
              </v-list>
              <v-row dense class="text-center mt-2">
                <v-col><v-icon>mdi-timer-sand</v-icon><div class="font-weight-bold">{{stats.averageMoveCount}}</div><div class="text-caption">ср. длина</div></v-col>
                <v-col><v-icon>mdi-chess-rook</v-icon><div class="font-weight-bold">{{stats.totalCastles}}</div><div class="text-caption">рокировок</div></v-col>
                <v-col><v-icon>mdi-chess-pawn</v-icon><div class="font-weight-bold">{{stats.totalPromotions}}</div><div class="text-caption">превращений</div></v-col>
              </v-row>
            </v-card-text>
            
            <v-divider class="mx-4"></v-divider>
            
            <!-- 4. АДАПТИВНАЯ ТАБЛИЦА/СПИСОК ДЕБЮТОВ -->
            <v-card-text>
               <h3 class="text-subtitle-1 font-weight-bold mb-2">Дебютные тренды</h3>
            </v-card-text>
            
            <div v-if="stats.topOpenings?.length > 0">
              <v-data-table v-if="display.mdAndUp.value" :headers="openingsHeaders" :items="stats.topOpenings" :items-per-page="10" density="compact">
                <template v-slot:item.name="{ item }"><div>{{ item.name }}</div><div class="text-caption text-grey">{{ item.eco }}</div></template>
                <template v-slot:item.count="{ item }" v-if="stats.resultDistribution">{{ item.count }} ({{ totalGames > 0 ? ((item.count / totalGames) * 100).toFixed(0) : 0 }}%)</template>
                <template v-slot:item.results="{ item }">
                  <div class="stacked-bar-mini my-1">
                    <div class="bar-segment bg-grey-lighten-2" :style="{ width: (item.white / item.count * 100) + '%' }"></div>
                    <div class="bar-segment bg-grey-darken-1" :style="{ width: (item.draw / item.count * 100) + '%' }"></div>
                    <div class="bar-segment bg-grey-darken-4" :style="{ width: (item.black / item.count * 100) + '%' }"></div>
                  </div>
                </template>
              </v-data-table>
              <v-list v-else lines="three" class="py-0">
                <template v-for="(item, i) in stats.topOpenings" :key="item.eco">
                  <v-list-item>
                    <v-list-item-title class="font-weight-medium text-wrap">{{ item.name }}</v-list-item-title>
                    <v-list-item-subtitle class="mt-1">{{ item.eco }} · {{ item.count }} {{ item.count > 1 ? 'партии' : 'партия' }} ({{ totalGames > 0 ? ((item.count / totalGames) * 100).toFixed(0) : 0 }}%)</v-list-item-subtitle>
                    <div class="stacked-bar-mini my-2">
                      <div class="bar-segment bg-grey-lighten-2" :style="{ width: (item.white / item.count * 100) + '%' }"></div>
                      <div class="bar-segment bg-grey-darken-1" :style="{ width: (item.draw / item.count * 100) + '%' }"></div>
                      <div class="bar-segment bg-grey-darken-4" :style="{ width: (item.black / item.count * 100) + '%' }"></div>
                    </div>
                  </v-list-item>
                  <v-divider v-if="i < stats.topOpenings.length - 1"></v-divider>
                </template>
              </v-list>
            </div>
            <div v-else class="text-center text-medium-emphasis pa-4">
              Данных по дебютам пока нет.
            </div>
          </v-card>
        </v-col>
      </v-row>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue';
import { useRouter } from 'vue-router';
import { useTournamentStore } from '@/stores/tournamentStore';
import { calculateTournamentStatistics } from '@/utils/statisticsCalculator';
import { useDisplay } from 'vuetify';

const store = useTournamentStore();
const router = useRouter();
const display = useDisplay();

const stats = computed(() => {
  if (!store.participants.length || !store.statisticsData.length) return null;
  return calculateTournamentStatistics({
    participants: store.participants,
    gamesForStats: store.statisticsData,
    standings: store.standings,
    tournamentDetails: store.activeTournament,
    ecoDatabase: store.ecoDatabase,
  })
});

// Безопасное вычисление, чтобы не было деления на ноль или обращения к null
const totalGames = computed(() => {
  if (!stats.value || !stats.value.resultDistribution) return 0;
  return stats.value.resultDistribution.totalGames || 0;
});

const openingsHeaders = [
  { title: 'Дебют', key: 'name', sortable: false, align: 'start', width: '50%' },
  { title: 'Партий', key: 'count', sortable: false, align: 'center', width: '15%' },
  { title: 'Результаты (Б/Н/Ч)', key: 'results', sortable: false, align: 'start', width: '35%' },
];

const goToGame = (gameId) => {
  if (gameId) router.push({ name: 'Game', params: { gameId } });
};

const goToPlayer = (playerId) => {
  if (playerId) router.push({ name: 'Player', params: { tournamentId: store.activeTournament.id, playerId: playerId  } });
}

</script>

<style scoped>
.stat-card {
  border: 1px solid rgba(var(--v-theme-on-surface), 0.1);
  justify-content: center;
}

.highlight-card {
  display: flex;
  flex-direction: column;
}

.stacked-bar {
  display: flex;
  width: 100%;
  height: 24px;
  border-radius: 8px;
  overflow: hidden;
  border: 1px solid rgba(var(--v-theme-on-surface), 0.1);
}

.stacked-bar-mini {
  display: flex;
  width: 100%;
  max-width: 200px;
  height: 12px;
  border-radius: 4px;
  overflow: hidden;
  border: 1px solid rgba(var(--v-theme-on-surface), 0.1);
}

.bar-segment {
  height: 100%;
  transition: width 0.5s ease-in-out;
}

.list-item-hover:hover {
  background-color: rgba(var(--v-theme-on-surface), 0.04);
  cursor: pointer;
}

.cursor-pointer {
  cursor: pointer;
}
.cursor-pointer:hover {
  color: rgb(var(--v-theme-primary));
}
</style>