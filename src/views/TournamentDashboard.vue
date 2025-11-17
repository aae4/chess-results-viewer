<template>
  <div v-if="store.isLoadingDetails && !store.activeTournament" class="text-center pa-10">
    <v-progress-circular indeterminate color="primary" size="64"></v-progress-circular>
    <p class="mt-4 text-h6">Загрузка данных турнира...</p>
  </div>
  
  <v-alert v-else-if="store.error" type="error" prominent>
    Не удалось загрузить данные турнира: {{ store.error }}
  </v-alert>

  <div v-else-if="store.activeTournament">
    <!-- ЗАГОЛОВОК СТРАНИЦЫ -->
    <div class="mb-6 d-flex align-center">
      <!-- Левая часть: Название и дата -->
      <div class="flex-grow-1">
        <h1 class="text-h4 font-weight-bold">{{ store.activeTournament.name }}</h1>
        <div class="text-subtitle-1 text-medium-emphasis">
          <span>{{ store.activeTournament.city }}</span>
          <span class="mx-2">·</span>
          <span>{{ store.activeTournament.start_date }}</span>
        </div>
      </div>
      
      <!-- Правая часть: Адаптивная кнопка-ссылка -->
      <v-tooltip location="bottom">
        <template v-slot:activator="{ props }">
          <div v-bind="props">
            <!-- Кнопка для десктопа (с текстом) -->
            <v-btn
              :href="chessResultsUrl"
              target="_blank"
              variant="text"
              color="primary"
              class="d-none d-sm-flex"
              prepend-icon="mdi-open-in-new"
            >
              Chess-Results
            </v-btn>
            <!-- Кнопка для мобильных (только иконка) -->
            <v-btn
              :href="chessResultsUrl"
              target="_blank"
              icon="mdi-open-in-new"
              variant="text"
              color="primary"
              class="d-sm-none"
            ></v-btn>
          </div>
        </template>
        <span>Посмотреть на chess-results.com</span>
      </v-tooltip>
    </div>
    
    <!-- НАВИГАЦИЯ ДЛЯ ДЕСКТОПА -->
    <v-tabs v-if="display.mdAndUp.value && !isPlayerOrGamePage" :model-value="$route.name" color="primary" class="mb-6">
      <v-tab v-for="tab in tabs" :key="tab.value" :to="tab.to" :value="tab.value">{{ tab.text }}</v-tab>
    </v-tabs>

    <router-view v-slot="{ Component }">
      <v-slide-x-transition mode="out-in">
        <component :is="Component" />
      </v-slide-x-transition>
    </router-view>

    <!-- НИЖНЯЯ НАВИГАЦИЯ ДЛЯ МОБИЛЬНЫХ -->
    <v-bottom-navigation
      v-if="display.smAndDown.value"
      :model-value="$route.name"
      color="primary"
      grow
      app
    >
      <v-btn v-for="tab in tabs" :key="tab.value" :to="tab.to" :value="tab.value">
        <v-icon>{{ tab.icon }}</v-icon>
        <span>{{ tab.text }}</span>
      </v-btn>
    </v-bottom-navigation>
  </div>
</template>

<script setup>
import { onUnmounted, watch, computed } from 'vue';
import { useRoute } from 'vue-router';
import { useTournamentStore } from '@/stores/tournamentStore';
import { useDisplay } from 'vuetify';

const props = defineProps({
  tournamentId: { type: [String, Number], required: true }
});

const store = useTournamentStore();
const display = useDisplay();
const route = useRoute();

const chessResultsUrl = computed(() => {
  const tnrId = store.activeTournament?.tnr_id;
  return tnrId ? `https://chess-results.com/tnr${tnrId}.aspx?lan=11` : '#';
});

// Проверяем, является ли текущая страница одной из вкладок турнира
const isTournamentTabPage = computed(() => {
  return ['Standings', 'Rounds', 'Participants', 'Crosstable', 'Statistics'].includes(route.name);
});

// Скрываем навигацию, если мы на странице игрока (или любой другой, не из списка выше)
const isPlayerOrGamePage = computed(() => !isTournamentTabPage.value);

const tabs = computed(() => [
  { text: 'Итоги', value: 'Standings', icon: 'mdi-podium', to: { name: 'Standings', params: { tournamentId: props.tournamentId } } },
  { text: 'Туры', value: 'Rounds', icon: 'mdi-tournament', to: { name: 'Rounds', params: { tournamentId: props.tournamentId } } },
  { text: 'Участники', value: 'Participants', icon: 'mdi-account-group-outline', to: { name: 'Participants', params: { tournamentId: props.tournamentId } } },
  { text: 'Таблица', value: 'Crosstable', icon: 'mdi-table-large', to: { name: 'Crosstable', params: { tournamentId: props.tournamentId } } },
  { text: 'Статистика', value: 'Statistics', icon: 'mdi-chart-bar', to: { name: 'Statistics', params: { tournamentId: props.tournamentId } } },
]);

watch(() => props.tournamentId, (newId) => {
    if (newId) store.fetchTournamentData(newId);
  },
  { immediate: true }
);

onUnmounted(() => {
  store.clearActiveData();
});
</script>

<style scoped>
/* Добавляем отступ снизу для контента, чтобы его не перекрывала нижняя навигация */
.v-bottom-navigation ~ .v-main {
  padding-bottom: 64px;
}
</style>