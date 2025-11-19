<template>
  <div>
    <!-- 1. Панель управления: Поиск и Фильтр по году -->
    <v-card class="mb-6" flat border>
      <v-toolbar flat color="transparent">
        <v-toolbar-title class="mx-2">Все турниры</v-toolbar-title>
        <v-spacer></v-spacer>
        <v-text-field
          v-model="searchQuery"
          label="Поиск по названию..."
          prepend-inner-icon="mdi-magnify"
          variant="outlined"
          density="compact"
          hide-details
          clearable
          class="search-field"
        ></v-text-field>
        <v-select
          v-model="selectedYear"
          :items="availableYears"
          label="Год"
          variant="outlined"
          density="compact"
          hide-details
          clearable
          class="year-select"
        ></v-select>
      </v-toolbar>
    </v-card>

    <!-- Состояния загрузки, ошибки или полного отсутствия данных -->
    <div v-if="store.isLoadingList" class="text-center pa-10">
      <v-progress-circular indeterminate color="primary" size="64"></v-progress-circular>
    </div>
    <v-alert v-else-if="store.error" type="error" prominent>
      Не удалось загрузить список турниров: {{ store.error }}
    </v-alert>
    <div v-else-if="filteredTournaments.length === 0" class="text-center text-grey pa-10">
      <v-icon size="x-large">mdi-database-off-outline</v-icon>
      <div class="mt-4 text-h6">Турниры не найдены</div>
      <div class="mt-1">По вашему запросу ничего не найдено. Попробуйте изменить фильтры.</div>
    </div>

    <!-- Основной контент, когда есть данные -->
    <div v-else>
      <!-- 2. "HERO" СЕКЦИЯ: Последний турнир -->
      <v-card 
        v-if="currentTournamentForHero" 
        class="mb-8 hero-card"
        :to="{ name: 'Overview', params: { tournamentId: currentTournamentForHero.id } }"
        :variant="currentTournamentInfo.variant"
        :color="currentTournamentInfo.color"
      >
        <v-card-text class="d-flex align-center">
          <div>
            <v-chip :color="currentTournamentInfo.chipColor" label class="mb-2 font-weight-bold">
              <v-icon start :icon="currentTournamentInfo.icon"></v-icon>
              {{ currentTournamentInfo.text }}
            </v-chip>
            <h2 class="text-h4 font-weight-bold">{{ currentTournamentForHero.name }}</h2>
            <div class="text-subtitle-1 mt-1">{{ currentTournamentForHero.start_date }}</div>
          </div>
          <v-spacer></v-spacer>
          <v-icon size="64" class="d-none d-sm-block chevron-icon">mdi-chevron-right</v-icon>
        </v-card-text>
      </v-card>

      <!-- 3. Основной список с пагинацией -->
      <v-list lines="two" class="py-0">
        <v-list-item
          v-for="tournament in paginatedTournaments"
          :key="tournament.id"
          :to="{ name: 'Overview', params: { tournamentId: tournament.id } }"
          class="list-item-card mb-2"
          border
          rounded
        >
          <template v-slot:prepend>
            <v-icon color="grey" size="large">mdi-trophy-variant-outline</v-icon>
          </template>
          <v-list-item-title class="text-h6 font-weight-medium">{{ tournament.name }}</v-list-item-title>
          <v-list-item-subtitle>{{ tournament.start_date }}</v-list-item-subtitle>
        </v-list-item>
      </v-list>
      
      <!-- 4. Пагинация -->
      <v-pagination
        v-if="totalPages > 1"
        v-model="currentPage"
        :length="totalPages"
        rounded="circle"
        class="mt-6"
      ></v-pagination>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue';
import { useTournamentStore } from '@/stores/tournamentStore';

const store = useTournamentStore();

const searchQuery = ref('');
const selectedYear = ref(null);
const currentPage = ref(1);
const itemsPerPage = 10;

onMounted(() => {
  if (store.tournamentsList.length === 0) {
    store.fetchAllTournaments();
  }
});

watch([searchQuery, selectedYear], () => {
  // Как только пользователь меняет поисковый запрос или выбирает год,
  // мы принудительно возвращаем его на первую страницу результатов.
  currentPage.value = 1;
});

const currentTournamentForHero = computed(() => {
  // Показываем Hero блок только если нет активных фильтров
  if (searchQuery.value || selectedYear.value) {
    return null;
  }
  return store.currentTournament;
});

const currentTournamentInfo = computed(() => {
  const status = store.currentTournament?.status;
  if (status === 'live') {
    return { text: 'LIVE', icon: 'mdi-broadcast', color: 'primary', variant: 'tonal', chipColor: 'primary' };
  }
  if (status === 'upcoming') {
    return { text: 'СКОРО', icon: 'mdi-calendar-clock', color: 'secondary', variant: 'tonal', chipColor: 'secondary' };
  }
  if (status === 'recent') {
    return { text: 'НЕДАВНО ЗАВЕРШИЛСЯ', icon: 'mdi-history', color: undefined, variant: 'elevated', chipColor: 'primary' };
  }
  // Запасной вариант, если currentTournament не определен
  return { text: 'Последний турнир', icon: 'mdi-new-box', color: undefined, variant: 'elevated', chipColor: 'primary' };
});

const availableYears = computed(() => {
  if (!store.tournamentsList) return [];
  const years = new Set(store.tournamentsList.map(t => t.start_date.substring(0, 4)));
  return Array.from(years).sort((a, b) => b - a);
});

const allTournamentsForList = computed(() => store.tournamentsList);

// const filteredTournaments = computed(() => {
//   let tournaments = [...allTournamentsForList.value];
//   if (selectedYear.value) { /* ... */ }
//   if (searchQuery.value) { /* ... */ }
//   return tournaments;
// });

const filteredTournaments = computed(() => {
  if (!store.tournamentsList) return [];
  let tournaments = [...allTournamentsForList.value];

  if (selectedYear.value) {
    tournaments = tournaments.filter(t => t.start_date.startsWith(selectedYear.value));
  }
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase();
    tournaments = tournaments.filter(t => t.name.toLowerCase().includes(query));
  }
  return tournaments;
});

const listForPagination = computed(() => {
  const list = filteredTournaments.value;
  // Если есть Hero блок (т.е. нет фильтров), исключаем из списка текущий турнир, чтобы не дублировать
  if (currentTournamentForHero.value) {
    return list.filter(t => t.id !== currentTournamentForHero.value.id);
  }
  return list;
});

const totalPages = computed(() => {
  return Math.ceil(listForPagination.value.length / itemsPerPage);
});

const paginatedTournaments = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage;
  const end = start + itemsPerPage;
  return listForPagination.value.slice(start, end);
});
</script>

<style scoped>
.search-field {
  max-width: 400px;
}
.year-select {
  max-width: 150px;
}
.hero-card {
  transition: all 0.2s ease-in-out;
  border: 1px solid transparent;
}
.hero-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 30px rgba(var(--v-theme-primary-rgb), 0.15) !important;
  border-color: rgba(var(--v-theme-primary-rgb), 0.3);
}
.list-item-card {
  transition: border-color 0.2s ease-in-out;
}
.list-item-card:hover {
  border-color: rgba(var(--v-theme-primary-rgb), 0.4) !important;
}
</style>