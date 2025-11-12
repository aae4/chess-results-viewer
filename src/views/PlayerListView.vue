<template>
  <div>
    <!-- 1. ПАНЕЛЬ ФИЛЬТРОВ И УПРАВЛЕНИЯ -->
    <v-card class="mb-6">
      <v-card-text>
        <v-row align="center" dense>
          <v-col cols="12" md="4">
            <v-text-field
              v-model="searchQuery"
              label="Поиск по имени..."
              prepend-inner-icon="mdi-magnify"
              hide-details
              clearable
            ></v-text-field>
          </v-col>
          <v-col cols="12" sm="6" md="3">
            <v-select
              v-model="selectedFederation"
              :items="availableFederations"
              label="Федерация"
              hide-details
              clearable
            ></v-select>
          </v-col>
          <v-col cols="12" sm="6" md="5">
             <v-range-slider
              v-model="ratingRange"
              :min="minRating"
              :max="maxRating"
              label="Рейтинг"
              :step="50"
              thumb-label="always"
              hide-details
              class="pt-5"
            ></v-range-slider>
          </v-col>
        </v-row>
        <v-row dense class="mt-2">
          <v-col class="d-flex align-center">
            <span class="text-caption text-medium-emphasis mr-4">Сортировать по:</span>
            <v-btn-toggle v-model="sortBy" color="primary" variant="outlined" mandatory density="compact">
              <v-btn value="name">Имени</v-btn>
              <v-btn value="rating">Рейтингу</v-btn>
              <v-btn value="tournaments">Опыту</v-btn>
            </v-btn-toggle>
          </v-col>
        </v-row>
      </v-card-text>
    </v-card>

    <!-- 2. СОСТОЯНИЯ ЗАГРУЗКИ, ОШИБКИ, НЕТ ДАННЫХ -->
    <div v-if="store.isLoadingList" class="text-center pa-10">
      <v-progress-circular indeterminate color="primary" size="64"></v-progress-circular>
    </div>
    <v-alert v-else-if="store.errorList" type="error" prominent>
      Не удалось загрузить список игроков: {{ store.errorList }}
    </v-alert>
    <div v-else-if="filteredAndSortedPlayers.length === 0" class="text-center text-grey pa-10">
      <v-icon size="x-large">mdi-account-search-outline</v-icon>
      <div class="mt-4 text-h6">Игроки не найдены</div>
      <div class="mt-1">По вашему запросу ничего не найдено. Попробуйте изменить фильтры.</div>
    </div>
    
    <!-- 3. ОСНОВНОЙ СПИСОК С КАРТОЧКАМИ ИГРОКОВ -->
    <div v-else>
      <v-row>
        <v-col
          v-for="player in paginatedPlayers"
          :key="player.id"
          cols="12" sm="6" md="4"
        >
          <v-card 
            class="player-card h-100"
            :to="{ name: 'GlobalPlayer', params: { playerId: player.id } }"
          >
            <v-card-text class="d-flex align-center">
              <v-avatar color="primary" size="48" class="mr-4">
                <span class="text-white font-weight-bold">{{ getInitials(player.canonical_name) }}</span>
              </v-avatar>
              <div class="flex-grow-1">
                <div class="font-weight-bold text-subtitle-1">{{ player.canonical_name }}</div>
                <div class="text-caption text-medium-emphasis">{{ player.federation }}</div>
              </div>
            </v-card-text>
            <v-divider></v-divider>
            <div class="d-flex justify-space-around text-center pa-3 text-caption">
              <div>
                <div class="font-weight-bold text-body-1">{{ player.latest_rating || '–' }}</div>
                <div>Рейтинг</div>
              </div>
              <div>
                <div class="font-weight-bold text-body-1">{{ player.tournament_count }}</div>
                <div>Турниров</div>
              </div>
            </div>
          </v-card>
        </v-col>
      </v-row>
      
      <!-- 4. ПАГИНАЦИЯ -->
      <v-pagination
        v-if="totalPages > 1"
        v-model="currentPage"
        :length="totalPages"
        rounded="circle"
        class="mt-8"
      ></v-pagination>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue';
import { usePlayerStore } from '@/stores/playerStore';
import { getInitials } from '@/utils/formatters';

const store = usePlayerStore();

// --- Состояние фильтров ---
const searchQuery = ref('');
const selectedFederation = ref(null);
const sortBy = ref('name'); // 'name', 'rating', 'tournaments'
const currentPage = ref(1);
const itemsPerPage = 12;

// --- Состояние для слайдера рейтинга ---
const ratingRange = ref([0, 3000]);
const minRating = computed(() => Math.min(...store.playerList.map(p => p.latest_rating || 0).filter(r => r > 0)));
const maxRating = computed(() => Math.max(...store.playerList.map(p => p.latest_rating || 3000)));
watch(() => store.playerList, (newList) => {
  if(newList.length > 0) {
    ratingRange.value = [minRating.value, maxRating.value];
  }
});

onMounted(() => {
  store.fetchAllPlayers();
});

// --- Computed свойства для фильтрации и пагинации ---
const availableFederations = computed(() => {
  if (!store.playerList) return [];
  const federations = new Set(store.playerList.map(p => p.federation).filter(Boolean));
  return Array.from(federations).sort();
});

const filteredAndSortedPlayers = computed(() => {
  if (!store.playerList) return [];
  
  // 1. Фильтрация
  const filtered = store.playerList.filter(player => {
    const nameMatch = player.canonical_name.toLowerCase().includes(searchQuery.value?.toLowerCase() || '');
    const federationMatch = !selectedFederation.value || player.federation === selectedFederation.value;
    const ratingMatch = (player.latest_rating || 0) >= ratingRange.value[0] && (player.latest_rating || 0) <= ratingRange.value[1];
    return nameMatch && federationMatch && ratingMatch;
  });
  
  // 2. Сортировка
  return filtered.sort((a, b) => {
    if (sortBy.value === 'rating') {
      return (b.latest_rating || 0) - (a.latest_rating || 0);
    }
    if (sortBy.value === 'tournaments') {
      return (b.tournament_count || 0) - (a.tournament_count || 0);
    }
    // по умолчанию - по имени
    return a.canonical_name.localeCompare(b.canonical_name);
  });
});

watch([searchQuery, selectedFederation, sortBy, ratingRange], () => {
  currentPage.value = 1;
});

const totalPages = computed(() => Math.ceil(filteredAndSortedPlayers.value.length / itemsPerPage));
const paginatedPlayers = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage;
  const end = start + itemsPerPage;
  return filteredAndSortedPlayers.value.slice(start, end);
});
</script>

<style scoped>
.player-card {
  transition: all 0.2s ease-in-out;
}
.player-card:hover {
  border-color: rgba(var(--v-theme-primary-rgb), 0.6) !important;
  transform: translateY(-4px);
  box-shadow: 0 8px 20px rgba(0,0,0,0.08);
}
</style>