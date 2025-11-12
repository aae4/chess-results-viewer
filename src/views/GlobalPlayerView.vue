<template>
  <div>
    <!-- Состояния загрузки и ошибки -->
    <div v-if="store.isLoading && !profile" class="text-center pa-10">
      <v-progress-circular indeterminate color="primary" size="64"></v-progress-circular>
    </div>
    <v-alert v-else-if="store.error" type="error" prominent>
      Не удалось загрузить профиль игрока: {{ store.error }}
    </v-alert>

    <div v-else-if="profile">
      <!-- "Hero" Секция -->
      <v-card class="mb-6">
        <v-card-text class="d-flex flex-column flex-sm-row align-center">
          <v-avatar color="primary" size="80" class="mr-sm-6 mb-4 mb-sm-0">
            <span class="text-h3 font-weight-light">{{ getInitials(profile.canonical_name) }}</span>
          </v-avatar>
          <div class="text-center text-sm-left">
            <h1 class="text-h4 font-weight-bold">{{ profile.canonical_name }}</h1>
            <div class="text-subtitle-1 text-medium-emphasis">{{ profile.federation }}</div>
          </div>
          <v-spacer></v-spacer>
          <div class="d-flex justify-center ga-4 mt-4 mt-sm-0">
            <div class="text-center px-2">
              <div class="text-caption">Последний рейтинг</div>
              <div class="text-h5 font-weight-bold">{{ store.keyMetrics.latestRating || '-' }}</div>
            </div>
            <v-divider vertical></v-divider>
            <div class="text-center px-2">
              <div class="text-caption">Пиковый рейтинг</div>
              <div class="text-h5 font-weight-bold">{{ store.keyMetrics.peakRating || '-' }}</div>
            </div>
          </div>
        </v-card-text>
      </v-card>

      <!-- Вкладки для мобильных -->
      <v-tabs v-if="display.smAndDown.value" v-model="tab" color="primary" grow class="mb-6">
        <v-tab value="overview">Обзор</v-tab>
        <v-tab value="history">История</v-tab>
      </v-tabs>
      
      <v-row>
        <!-- Левая колонка / Вкладка "Обзор" -->
        <v-col cols="12" md="4" v-if="display.mdAndUp.value || tab === 'overview'">
          <v-card class="mb-6">
            <v-card-title>Карьерные достижения</v-card-title>
            <div class="d-flex justify-space-around text-center pa-4">
              <div><v-icon color="amber" size="32">mdi-trophy</v-icon><div class="text-h6 font-weight-bold">{{ store.careerStats.gold }}</div></div>
              <div><v-icon color="blue-grey-lighten-2" size="32">mdi-trophy</v-icon><div class="text-h6 font-weight-bold">{{ store.careerStats.silver }}</div></div>
              <div><v-icon color="brown-lighten-2" size="32">mdi-trophy</v-icon><div class="text-h6 font-weight-bold">{{ store.careerStats.bronze }}</div></div>
              <div><v-icon color="primary" size="32">mdi-tournament</v-icon><div class="text-h6 font-weight-bold">{{ store.careerStats.tournaments }}</div></div>
            </div>
          </v-card>
          <v-card>
            <v-card-title>График рейтинга</v-card-title>
            <v-card-text style="height: 300px;">
              <RatingChart v-if="!store.isLoading" :chart-data="store.ratingHistory" />
            </v-card-text>
          </v-card>
        </v-col>

        <!-- Правая колонка / Вкладка "История" -->
        <v-col cols="12" md="8" v-if="display.mdAndUp.value || tab === 'history'">
          <v-card>
            <v-card-title>История турниров</v-card-title>
            <v-data-table
              :headers="historyHeaders"
              :items="store.playerCareer"
              item-value="tournament_id"
              density="comfortable"
              hover
              @click:row="(_, { item }) => goToTournament(item.tournament_id)"
            >
              <template v-slot:item.tournament_name="{ item }">
                <div>{{ item.tournament_name }}</div>
                <div class="text-caption text-medium-emphasis">{{ item.start_date }}</div>
              </template>
              <template v-slot:item.final_rank="{ item }">
                <v-chip v-if="item.final_rank <= 3" :color="getPodiumColor(item.final_rank)" label size="small" class="font-weight-bold">
                  <v-icon start>mdi-trophy</v-icon> {{ item.final_rank }}
                </v-chip>
                <span v-else>{{ item.final_rank }}</span>
              </template>
               <template v-slot:item.rating_change="{ item }">
                <span :class="getRatingChangeColor(item.rating_change)">
                  {{ formatRatingChange(item.rating_change) }}
                </span>
              </template>
            </v-data-table>
          </v-card>
        </v-col>
      </v-row>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, onUnmounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { usePlayerStore } from '@/stores/playerStore';
import { useDisplay } from 'vuetify';
import { getInitials } from '@/utils/formatters';
import RatingChart from '@/components/RatingChart.vue';

const props = defineProps({
  playerId: { type: [String, Number], required: true }
});

const store = usePlayerStore();
const router = useRouter();
const display = useDisplay();
const tab = ref('overview');

const profile = computed(() => store.playerProfile);

watch(() => props.playerId, (newId) => {
  if (newId) {
    store.clearPlayerData();
    store.fetchPlayerData(newId);
  }
}, { immediate: true });

onUnmounted(() => {
  store.clearPlayerData();
});

const historyHeaders = [
  { title: 'Турнир', key: 'tournament_name', sortable: false },
  { title: 'Место', key: 'final_rank', align: 'center' },
  { title: 'Очки', key: 'score', align: 'center' },
  { title: 'Рейтинг', key: 'rating_at_tournament', align: 'center' },
  { title: '+/-', key: 'rating_change', align: 'center' },
];

const goToTournament = (tournamentId) => {
  router.push({ name: 'Standings', params: { tournamentId } });
};
const getPodiumColor = (rank) => {
  if (rank == 1) return 'amber'; if (rank == 2) return 'blue-grey-lighten-3'; if (rank == 3) return 'brown-lighten-2'; return 'default';
};
const formatRatingChange = (change) => {
  if (change === null || change === undefined) return '–'; const val = parseFloat(change); return val > 0 ? `+${val.toFixed(1)}` : val.toFixed(1);
};
const getRatingChangeColor = (change) => {
  if (change === null || change === undefined) return ''; return parseFloat(change) > 0 ? 'text-success' : 'text-error';
};
</script>

<style scoped>
.hero-card .v-card-text {
  color: rgba(var(--v-theme-on-primary), 0.9);
}
.hero-card .text-caption {
  color: rgba(var(--v-theme-on-primary), 0.7);
}

.achievement-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
}
</style>