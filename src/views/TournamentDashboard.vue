<template>
  <div v-if="store.isLoadingDetails && !store.activeTournament" class="text-center pa-10">
    <v-progress-circular indeterminate color="primary" size="64"></v-progress-circular>
    <p class="mt-4 text-h6">Загрузка данных турнира...</p>
  </div>
  
  <v-alert v-else-if="store.error" type="error" prominent>
    Не удалось загрузить данные турнира: {{ store.error }}
  </v-alert>

  <div v-else-if="store.activeTournament">
    <div class="mb-4">
      <h1 class="text-h4 font-weight-bold">{{ store.activeTournament.name }}</h1>
      <div class="text-subtitle-1 text-grey-darken-1">
        <span>{{ store.activeTournament.city }}</span>
        <span class="mx-2">·</span>
        <span>{{ store.activeTournament.start_date }}</span>
      </div>
    </div>
    
    <v-tabs :model-value="$route.name" color="primary" class="mb-4">
      <v-tab :to="{ name: 'Standings', params: { tournamentId: props.tournamentId } }" value="Standings">Итоги</v-tab>
      <v-tab :to="{ name: 'Rounds', params: { tournamentId: props.tournamentId } }" value="Rounds">Туры</v-tab>
      <v-tab :to="{ name: 'Participants', params: { tournamentId: props.tournamentId } }" value="Participants">Участники</v-tab>
      <v-tab :to="{ name: 'Crosstable', params: { tournamentId: props.tournamentId } }" value="Crosstable">Кросс-таблица</v-tab>
      <v-tab :to="{ name: 'Statistics', params: { tournamentId: props.tournamentId } }" value="Statistics">Статистика</v-tab>
    </v-tabs>

    <router-view v-slot="{ Component }">
      <v-slide-x-transition mode="out-in">
        <component :is="Component" />
      </v-slide-x-transition>
    </router-view>
  </div>
</template>

<script setup>
import { onUnmounted, watch } from 'vue';
import { useTournamentStore } from '@/stores/tournamentStore';

const props = defineProps({
  tournamentId: { type: [String, Number], required: true }
});

const store = useTournamentStore();

watch(
  () => props.tournamentId,
  (newId) => {
    if (newId) store.fetchTournamentData(newId);
  },
  { immediate: true }
);

onUnmounted(() => {
  store.clearActiveData();
});
</script>