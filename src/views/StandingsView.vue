<template>
  <div>
    <!-- 1. ВЕРХНЯЯ ПАНЕЛЬ: ЛИПКИЙ ПОИСК И ФИЛЬТРЫ -->
    <div class="d-flex align-center ga-2 mb-4 sticky-search">
      <v-text-field
        v-model="searchQuery"
        label="Найти участника..."
        placeholder="Имя участника"
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
        v-if="sortMode !== 'rank'"
        closable
        color="secondary"
        label
        size="small"
        @click:close="sortMode = 'rank'"
      >
        Сорт: {{ getSortLabel(sortMode) }}
      </v-chip>
      
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
        v-if="selectedCity"
        closable
        color="primary"
        label
        size="small"
        @click:close="selectedCity = null"
      >
        Город: {{ selectedCity }}
      </v-chip>

      <v-btn 
        v-if="activeFiltersCount > 1" 
        variant="text" 
        size="small" 
        color="medium-emphasis" 
        class="px-1"
        @click="resetFilters"
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
          <span class="text-h6">Настройки таблицы</span>
          <v-btn icon="mdi-close" variant="text" @click="showFilters = false"></v-btn>
        </v-card-title>
        
        <v-divider></v-divider>

        <v-card-text class="pa-4">
          <!-- Сортировка -->
          <div class="text-subtitle-2 mb-2">Сортировать по</div>
          <v-chip-group v-model="sortMode" selected-class="text-primary" mandatory class="mb-4">
            <v-chip value="rank" filter variant="outlined">Месту</v-chip>
            <v-chip value="name" filter variant="outlined">Имени</v-chip>
            <v-chip value="rating" filter variant="outlined">Рейтингу</v-chip>
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
          
          <!-- Город -->
           <v-select
            v-model="selectedCity"
            :items="availableCities"
            label="Город / Клуб"
            variant="outlined"
            density="comfortable"
            clearable
            hide-details="auto"
          ></v-select>
        </v-card-text>

        <v-card-actions class="pa-4 pt-0">
          <v-btn block color="primary" variant="flat" size="large" @click="showFilters = false">
            Применить ({{ processedStandings.length }})
          </v-btn>
        </v-card-actions>
      </v-card>
    </component>

    <!-- 4. ОСНОВНОЙ КОНТЕНТ -->
    
    <!-- Загрузка -->
    <div v-if="store.isLoadingDetails" class="text-center pa-10">
      <v-progress-circular indeterminate color="primary" size="64"></v-progress-circular>
    </div>

    <!-- Нет результатов -->
    <div v-else-if="processedStandings.length === 0" class="text-center text-medium-emphasis pa-10">
      <v-icon size="64" color="grey-lighten-1">mdi-account-search-outline</v-icon>
      <div class="mt-4 text-h6">Участники не найдены</div>
      <v-btn class="mt-4" variant="outlined" color="primary" @click="resetFilters">Сбросить фильтры</v-btn>
    </div>

    <!-- ТАБЛИЦА (ДЕСКТОП) -->
    <v-card v-else-if="display.mdAndUp.value" elevation="1" class="rounded-lg border">
      <v-table class="leaderboard-table" hover>
        <thead>
          <tr>
            <th class="text-center rank-col font-weight-bold">{{ sortMode === 'rank' ? 'Место' : '№' }}</th>
            <th class="text-left font-weight-bold">Участник</th>
            <th class="text-center" v-if="sortMode === 'rank'">Рейтинг</th>
            <th class="text-center" v-if="sortMode === 'rank'">Перф.</th>
            <th class="text-center points-col font-weight-bold">Очки</th>
          </tr>
        </thead>
        <tbody>
          <tr 
            v-for="item in processedStandings" 
            :key="item.player_id" 
            class="table-row" 
            @click="goToPlayer(item.player_id)"
          >
            <!-- Колонка 1: Место -->
            <td class="text-center rank-col">
              <div v-if="sortMode === 'rank'" class="rank-indicator" :class="getRankClass(item.final_rank)">
                <v-icon v-if="item.final_rank <= 3" :color="getRankColor(item.final_rank)" size="24">mdi-trophy</v-icon>
                <span v-else class="text-body-1 font-weight-medium text-medium-emphasis">{{ item.final_rank }}</span>
              </div>
              <div v-else class="text-body-1 text-medium-emphasis">{{ item.starting_rank }}</div>
            </td>

            <!-- Колонка 2: Игрок -->
            <td>
              <div class="d-flex align-center py-2">
                <v-avatar :color="getAvatarColor(item.name)" size="36" class="mr-3 elevation-1">
                  <span class="text-white text-caption font-weight-bold">{{ getInitials(item.name) }}</span>
                </v-avatar>
                <div>
                  <div class="font-weight-bold text-body-1">{{ item.name }}</div>
                  <div class="text-caption text-medium-emphasis d-flex align-center ga-2">
                     <span v-if="item.federation || getParticipantInfo(item.player_id)?.federation" class="d-flex align-center">
                       <v-icon size="x-small" start>mdi-flag-outline</v-icon>
                       {{ item.federation || getParticipantInfo(item.player_id)?.federation }}
                     </span>
                     <span v-if="item.club_city || getParticipantInfo(item.player_id)?.club_city" class="d-flex align-center">
                       <v-icon size="x-small" start>mdi-map-marker-outline</v-icon>
                       {{ item.club_city || getParticipantInfo(item.player_id)?.club_city }}
                     </span>
                  </div>
                </div>
              </div>
            </td>

            <!-- Рейтинг -->
            <td class="text-center" v-if="sortMode === 'rank'">
              <div class="text-body-2">{{ item.rating_at_tournament }}</div>
              <div v-if="item.rating_change" :class="getRatingChangeColor(item.rating_change)" class="text-caption font-weight-bold">
                {{ formatRatingChange(item.rating_change) }}
              </div>
            </td>
            
            <!-- Перформанс -->
            <td class="text-center text-body-2 text-medium-emphasis" v-if="sortMode === 'rank'">
              {{ item.performance_rating || '–' }}
            </td>
            
            <!-- Очки -->
            <td class="text-center points-col">
              <v-chip color="primary" variant="flat" size="small" class="font-weight-bold">{{ item.score }}</v-chip>
            </td>
          </tr>
        </tbody>
      </v-table>
    </v-card>

    <!-- СПИСОК (МОБИЛЬНЫЙ) -->
    <div v-else class="mobile-standings">
      <v-row dense>
        <v-col v-for="item in processedStandings" :key="item.player_id" cols="12">
          <v-card class="mb-1 border-thin rounded-lg" flat @click="goToPlayer(item.player_id)" ripple>
             <div class="d-flex align-center pa-3">
                <!-- Левая часть: Ранг -->
                <div class="d-flex align-center justify-center mr-3" style="width: 32px;">
                   <div v-if="sortMode === 'rank' && item.final_rank <= 3">
                      <v-icon :color="getRankColor(item.final_rank)" size="28">mdi-trophy</v-icon>
                   </div>
                   <div v-else class="text-h6 font-weight-bold text-medium-emphasis">
                      {{ sortMode === 'rank' ? item.final_rank : item.starting_rank }}
                   </div>
                </div>

                <!-- Центр: Инфо -->
                <div class="flex-grow-1 overflow-hidden">
                   <div class="text-subtitle-1 font-weight-bold text-truncate">{{ item.name }}</div>
                   <div class="text-caption text-medium-emphasis d-flex align-center ga-2">
                      <span>{{ item.rating_at_tournament }}</span>
                      <span v-if="item.rating_change" :class="getRatingChangeColor(item.rating_change)">
                        {{ formatRatingChange(item.rating_change) }}
                      </span>
                      <span v-if="item.federation || getParticipantInfo(item.player_id)?.federation" class="text-uppercase">
                         · {{ item.federation || getParticipantInfo(item.player_id)?.federation }}
                      </span>
                   </div>
                </div>

                <!-- Право: Очки -->
                <div class="ml-2">
                   <v-chip color="primary" variant="tonal" size="default" class="font-weight-bold">{{ item.score }}</v-chip>
                </div>
             </div>
          </v-card>
        </v-col>
      </v-row>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useTournamentStore } from '@/stores/tournamentStore';
import { getInitials } from '@/utils/formatters';
import { useDisplay } from 'vuetify';

const store = useTournamentStore();
const router = useRouter();
const route = useRoute();
const display = useDisplay();

// --- STATE ---
const searchQuery = ref('');
const sortMode = ref('rank'); // 'rank', 'name', 'rating'
const showFilters = ref(false);
const selectedFederation = ref(null);
const selectedCity = ref(null);

// --- COMPUTED ---
// Динамическое переключение между Dialog (ПК) и BottomSheet (Мобилка)
const dialogComponent = computed(() => {
  return display.mdAndUp.value ? 'v-dialog' : 'v-bottom-sheet';
});

const dialogProps = computed(() => {
  return display.mdAndUp.value 
    ? { maxWidth: '500' } // На ПК компактное окно по центру
    : { inset: true };    // На мобильном шторка с отступами
});

// Получаем уникальные списки для фильтров
const availableFederations = computed(() => {
  const players = store.participants || [];
  const feds = new Set(players.map(p => p.federation).filter(Boolean));
  return Array.from(feds).sort();
});

const availableCities = computed(() => {
  const players = store.standings || []; // Город часто лежит в таблице standings как club_city
  const cities = new Set(players.map(p => p.club_city).filter(Boolean));
  // Также проверим participants, если в standings пусто
  if (cities.size === 0 && store.participants) {
    store.participants.forEach(p => { if(p.club_city) cities.add(p.club_city) });
  }
  return Array.from(cities).sort();
});

// Хелпер для получения данных, которых может не быть в таблице standings
const getParticipantInfo = (playerId) => {
  return store.participants?.find(p => p.id === playerId);
};

// Основная логика сортировки и фильтрации
const processedStandings = computed(() => {
  if (!store.standings) return [];

  let data = [...store.standings];

  // 1. Фильтрация
  if (searchQuery.value || selectedFederation.value || selectedCity.value) {
    const query = searchQuery.value ? searchQuery.value.toLowerCase() : '';
    
    data = data.filter(item => {
      // Поиск по имени
      const nameMatch = !query || item.name.toLowerCase().includes(query);
      
      // Поиск по Федерации (данные могут быть в item или в participants)
      const playerFed = item.federation || getParticipantInfo(item.player_id)?.federation;
      const fedMatch = !selectedFederation.value || playerFed === selectedFederation.value;
      
      // Поиск по Городу
      const playerCity = item.club_city || getParticipantInfo(item.player_id)?.club_city;
      const cityMatch = !selectedCity.value || playerCity === selectedCity.value;

      return nameMatch && fedMatch && cityMatch;
    });
  }

  // 2. Сортировка
  if (sortMode.value === 'name') {
    data.sort((a, b) => a.name.localeCompare(b.name));
  } else if (sortMode.value === 'rating') {
    data.sort((a, b) => (b.rating_at_tournament || 0) - (a.rating_at_tournament || 0));
  } 
  // Если 'rank' - массив уже отсортирован SQL запросом по месту

  return data;
});

const activeFiltersCount = computed(() => {
  let count = 0;
  if (sortMode.value !== 'rank') count++;
  if (selectedFederation.value) count++;
  if (selectedCity.value) count++;
  return count;
});

// --- METHODS ---
const goToPlayer = (playerId) => {
  router.push({ 
    name: 'Player', 
    params: { tournamentId: route.params.tournamentId, playerId } 
  });
};

const resetFilters = () => {
  searchQuery.value = '';
  selectedFederation.value = null;
  selectedCity.value = null;
  sortMode.value = 'rank';
};

const getSortLabel = (val) => {
  const labels = { 'rank': 'Место', 'name': 'Имя', 'rating': 'Рейтинг' };
  return labels[val] || val;
};

// --- VISUAL HELPERS ---
const getAvatarColor = (name) => {
  const colors = ['#0052CC', '#DE350B', '#36B37E', '#FFAB00', '#6554C0', '#00B8D9'];
  const index = name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) % colors.length;
  return colors[index];
};

const getRankClass = (rank) => {
  const rankNum = parseInt(rank);
  if (rankNum === 1) return 'rank-gold';
  if (rankNum === 2) return 'rank-silver';
  if (rankNum === 3) return 'rank-bronze';
  return '';
};

const getRankColor = (rank) => {
  const rankNum = parseInt(rank);
  if (rankNum === 1) return 'amber';
  if (rankNum === 2) return 'blue-grey-lighten-2';
  if (rankNum === 3) return 'brown-lighten-2';
  return 'grey';
};

const formatRatingChange = (change) => {
  if (change === null || change === undefined) return '';
  const val = parseFloat(change);
  return val > 0 ? `+${val.toFixed(1)}` : val.toFixed(1);
};

const getRatingChangeColor = (change) => {
  if (change === null || change === undefined) return 'text-medium-emphasis';
  return parseFloat(change) > 0 ? 'text-success' : 'text-error';
};
</script>

<style scoped>
.leaderboard-table th {
  text-transform: uppercase;
  font-size: 0.75rem !important;
  color: rgba(var(--v-theme-on-surface), 0.6) !important;
  border-bottom: 2px solid rgba(var(--v-theme-border-color), var(--v-border-opacity));
}

.table-row {
  cursor: pointer;
  transition: background-color 0.15s ease-in-out;
}
.table-row:hover {
  background-color: rgba(var(--v-theme-primary), 0.04);
}

/* Индикатор медали/ранга */
.rank-indicator {
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: auto;
  position: relative;
}
.rank-indicator::before {
  content: '';
  position: absolute;
  left: -6px;
  top: 15%;
  bottom: 15%;
  width: 3px;
  border-radius: 4px;
  opacity: 0;
}
/* Цветные полоски слева от первых трех мест (только на десктопе) */
.rank-gold::before { background-color: #FFC400; opacity: 1; }
.rank-silver::before { background-color: #C0C0C0; opacity: 1; }
.rank-bronze::before { background-color: #CD7F32; opacity: 1; }

/* Липкий поиск */
.sticky-search {
  position: sticky;
  top: 64px; /* Прижат к началу контента */
  z-index: 5;
  background-color: rgb(var(--v-theme-background));
  padding-top: 8px;
  padding-bottom: 8px;
  margin-bottom: 0 !important;
}
</style>