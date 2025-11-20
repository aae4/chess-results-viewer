<template>
  <div>
    <!-- ВЕРХНЯЯ ПАНЕЛЬ: ПОИСК И КНОПКА ФИЛЬТРОВ -->
    <div class="d-flex align-center ga-2 mb-4 sticky-search">
      <v-text-field
        v-model="searchQuery"
        label="Найти игрока..."
        placeholder="Имя или Фамилия"
        prepend-inner-icon="mdi-magnify"
        variant="solo"
        density="comfortable"
        hide-details
        single-line
        class="flex-grow-1"
        clearable
      ></v-text-field>

      <v-btn
        size="large"
        height="48"
        width="48"
        variant="tonal"
        color="primary"
        @click="showFilters = true"
        :aria-label="'Открыть фильтры'"
      >
        <v-badge
          :model-value="activeFiltersCount > 0"
          :content="activeFiltersCount"
          color="error"
          floating
        >
          <v-icon>mdi-tune-variant</v-icon>
        </v-badge>
      </v-btn>
    </div>

    <!-- 2. БЫСТРЫЕ ФИЛЬТРЫ (CHIPS) -->
    <div v-if="activeFiltersCount > 0" class="d-flex flex-wrap ga-2 mb-4">
      <v-chip
        v-if="selectedFederation"
        closable
        color="primary"
        label
        size="small"
        @click:close="selectedFederation = null"
      >
        Фед: {{ selectedFederation }}
      </v-chip>
      
      <v-chip
        v-if="minRating > 0 || maxRating < 3000"
        closable
        color="primary"
        label
        size="small"
        @click:close="resetRating"
      >
        Рейтинг: {{ minRating }} - {{ maxRating }}
      </v-chip>

      <v-chip
        v-if="sortBy !== 'name'"
        closable
        color="secondary"
        label
        size="small"
        @click:close="sortBy = 'name'"
      >
        Сорт: {{ getSortLabel(sortBy) }}
      </v-chip>
      
      <v-btn 
        v-if="activeFiltersCount > 1" 
        variant="text" 
        size="small" 
        color="medium-emphasis" 
        class="px-1"
        @click="resetAllFilters"
      >
        Сбросить все
      </v-btn>
    </div>

    <!-- 3. АДАПТИВНОЕ ОКНО ФИЛЬТРОВ (Dialog на ПК / Sheet на Мобильном) -->
    <component
      :is="dialogComponent"
      v-bind="dialogProps"
      v-model="showFilters"
    >
      <v-card :class="display.mdAndUp.value ? 'rounded-lg' : 'rounded-t-xl'">
        <v-card-title class="d-flex justify-space-between align-center pa-4">
          <span class="text-h6">Настройки поиска</span>
          <v-btn icon="mdi-close" variant="text" @click="showFilters = false"></v-btn>
        </v-card-title>
        
        <v-divider></v-divider>

        <v-card-text class="pa-4">
          <!-- Сортировка -->
          <div class="text-subtitle-2 mb-2">Сортировать по</div>
          <v-chip-group v-model="sortBy" selected-class="text-primary" mandatory class="mb-4">
            <v-chip value="name" filter variant="outlined">Имени</v-chip>
            <v-chip value="rating" filter variant="outlined">Рейтингу</v-chip>
            <v-chip value="tournaments" filter variant="outlined">Опыту</v-chip>
          </v-chip-group>

          <!-- Федерация -->
          <v-select
            v-model="selectedFederation"
            :items="availableFederations"
            label="Федерация"
            variant="outlined"
            density="comfortable"
            clearable
            hide-details="auto"
            class="mb-4"
          ></v-select>

          <!-- Рейтинг (Инпуты) -->
          <div class="text-subtitle-2 mb-2">Диапазон рейтинга</div>
          <div class="d-flex ga-3 align-center">
            <v-text-field
              v-model.number="minRating"
              label="От"
              type="number"
              variant="outlined"
              density="compact"
              hide-details
            ></v-text-field>
            <span class="text-medium-emphasis">–</span>
            <v-text-field
              v-model.number="maxRating"
              label="До"
              type="number"
              variant="outlined"
              density="compact"
              hide-details
            ></v-text-field>
          </div>
        </v-card-text>

        <v-card-actions class="pa-4 pt-0">
          <v-btn block color="primary" variant="flat" size="large" @click="showFilters = false">
            Показать результаты ({{ filteredPlayers.length }})
          </v-btn>
        </v-card-actions>
      </v-card>
    </component>

    <!-- 4. СПИСОК ИГРОКОВ -->
    
    <!-- Загрузка -->
    <div v-if="store.isLoadingList && !store.playerList?.length">
       <v-row>
          <v-col v-for="n in 6" :key="n" cols="12" sm="6" md="4">
            <v-skeleton-loader type="card, text"></v-skeleton-loader>
          </v-col>
        </v-row>
    </div>

    <!-- Ошибка -->
    <v-alert v-else-if="store.errorList" type="error" prominent class="mt-4">
      Не удалось загрузить список игроков: {{ store.errorList }}
    </v-alert>

    <!-- Пустой результат -->
    <div v-else-if="filteredPlayers.length === 0" class="text-center text-grey pa-10 mt-4">
      <v-icon size="64" color="grey-lighten-1">mdi-account-off-outline</v-icon>
      <div class="mt-4 text-h6 text-medium-emphasis">Игроки не найдены</div>
      <div class="text-body-2 text-medium-emphasis mt-1">Попробуйте изменить параметры поиска</div>
      <v-btn class="mt-4" variant="outlined" color="primary" @click="resetAllFilters">
        Сбросить фильтры
      </v-btn>
    </div>
    
    <!-- Результаты -->
    <div v-else>
      <v-row class="mt-1">
        <v-col v-for="player in visiblePlayers" :key="player.id" cols="12" sm="6" md="4">
          <v-card 
            class="player-card h-100"
            :to="{ name: 'GlobalPlayer', params: { playerId: player.id } }"
            elevation="1"
          >
            <v-card-text class="d-flex align-center py-3">
              <v-avatar color="primary" size="56" class="mr-4 elevation-2">
                <span class="text-white text-h6 font-weight-bold">{{ getInitials(player.canonical_name) }}</span>
              </v-avatar>
              <div class="flex-grow-1 overflow-hidden">
                <!-- Ограничиваем имя 2 строками -->
                <div class="font-weight-bold text-subtitle-1 name-clamp mb-1">
                  {{ player.canonical_name }}
                </div>
                <div class="d-flex align-center">
                  <v-icon size="x-small" class="mr-1 text-medium-emphasis">mdi-flag-outline</v-icon>
                  <span class="text-caption text-medium-emphasis font-weight-medium">{{ player.federation || 'N/A' }}</span>
                </div>
              </div>
            </v-card-text>
            
            <v-divider></v-divider>
            
            <!-- Адаптивный фон футера карточки (решает проблему с белым текстом в темной теме) -->
            <div class="d-flex py-2 card-footer-bg">
              <div class="flex-grow-1 text-center border-e">
                <div class="text-caption text-medium-emphasis">Рейтинг</div>
                <div class="font-weight-bold text-body-1">{{ player.latest_rating || '–' }}</div>
              </div>
              <div class="flex-grow-1 text-center">
                <div class="text-caption text-medium-emphasis">Турниров</div>
                <div class="font-weight-bold text-body-1">{{ player.tournament_count }}</div>
              </div>
            </div>
          </v-card>
        </v-col>
      </v-row>
      
      <!-- Кнопка ПОКАЗАТЬ ЕЩЕ -->
      <div v-if="hasMore" class="text-center mt-6 mb-8">
        <v-btn 
          variant="elevated" 
          color="white" 
          size="large" 
          class="text-primary px-8"
          elevation="2"
          :loading="isLoadingMore"
          @click="loadMore"
        >
          Показать еще ({{ remainingCount }})
        </v-btn>
      </div>
      
      <div v-else-if="filteredPlayers.length > 0" class="text-center mt-6 mb-8 text-caption text-medium-emphasis">
        Показаны все игроки ({{ filteredPlayers.length }})
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue';
import { usePlayerStore } from '@/stores/playerStore';
import { getInitials } from '@/utils/formatters';
import { useDisplay } from 'vuetify';

const store = usePlayerStore();
const display = useDisplay();

// --- STATE ---
const searchQuery = ref('');
const selectedFederation = ref(null);
const sortBy = ref('name');
const showFilters = ref(false); // Контроль шторки/диалога
const minRating = ref(0);
const maxRating = ref(3000);

// Пагинация "Load More"
const itemsPerPage = 12;
const visibleCount = ref(itemsPerPage);
const isLoadingMore = ref(false); 

onMounted(() => {
  store.fetchAllPlayers();
});

// --- COMPUTED ---
// Динамическое переключение между Dialog (ПК) и BottomSheet (Мобилка)
const dialogComponent = computed(() => {
  return display.mdAndUp.value ? 'v-dialog' : 'v-bottom-sheet';
});

const dialogProps = computed(() => {
  return display.mdAndUp.value 
    ? { maxWidth: '500' } // На ПК компактное окно по центру
    : { inset: true };    // На мобильном шторка
});

const availableFederations = computed(() => {
  if (!store.playerList) return [];
  const federations = new Set(store.playerList.map(p => p.federation).filter(Boolean));
  return Array.from(federations).sort();
});

// Основной отфильтрованный и отсортированный список
const filteredPlayers = computed(() => {
  if (!store.playerList) return [];
  
  // 1. Фильтрация
  let result = store.playerList.filter(player => {
    if (searchQuery.value && !player.canonical_name.toLowerCase().includes(searchQuery.value.toLowerCase())) {
      return false;
    }
    if (selectedFederation.value && player.federation !== selectedFederation.value) {
      return false;
    }
    const rating = player.latest_rating || 0;
    if (rating < minRating.value || rating > maxRating.value) {
      return false;
    }
    return true;
  });
  
  // 2. Сортировка
  result.sort((a, b) => {
    if (sortBy.value === 'rating') {
      return (b.latest_rating || 0) - (a.latest_rating || 0);
    }
    if (sortBy.value === 'tournaments') {
      return (b.tournament_count || 0) - (a.tournament_count || 0);
    }
    return a.canonical_name.localeCompare(b.canonical_name);
  });
  
  return result;
});

// Список, который реально видим на экране (срез)
const visiblePlayers = computed(() => {
  return filteredPlayers.value.slice(0, visibleCount.value);
});

const hasMore = computed(() => {
  return visibleCount.value < filteredPlayers.value.length;
});

const remainingCount = computed(() => {
  return filteredPlayers.value.length - visibleCount.value;
});

const activeFiltersCount = computed(() => {
  let count = 0;
  if (selectedFederation.value) count++;
  if (minRating.value > 0 || maxRating.value < 3000) count++;
  if (sortBy.value !== 'name') count++;
  return count;
});

// --- METHODS ---
const loadMore = () => {
  isLoadingMore.value = true;
  setTimeout(() => {
    visibleCount.value += itemsPerPage;
    isLoadingMore.value = false;
  }, 300);
};

const resetRating = () => {
  minRating.value = 0;
  maxRating.value = 3000;
};

const resetAllFilters = () => {
  searchQuery.value = '';
  selectedFederation.value = null;
  minRating.value = 0;
  maxRating.value = 3000;
  sortBy.value = 'name';
};

const getSortLabel = (val) => {
  const labels = { 'name': 'Имя', 'rating': 'Рейтинг', 'tournaments': 'Опыт' };
  return labels[val] || val;
};

// --- WATCHERS ---
watch([searchQuery, selectedFederation, minRating, maxRating, sortBy], () => {
  visibleCount.value = itemsPerPage;
});
</script>

<style scoped>
.player-card {
  transition: transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out;
  border-radius: 12px;
}

.player-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 20px rgba(0,0,0,0.1) !important;
}

.name-clamp {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  line-height: 1.2;
  height: 2.4em;
}

.sticky-search {
  position: sticky;
  top: 64px;
  z-index: 5;
  background-color: rgb(var(--v-theme-background));
  padding-top: 8px;
  padding-bottom: 8px;
  margin-bottom: 0 !important;
}

.card-footer-bg {
  background-color: rgba(var(--v-theme-on-surface), 0.04);
}
</style>