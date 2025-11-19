<template>
  <div>
    <!-- ПАНЕЛЬ УПРАВЛЕНИЯ (SEARCH & SORT) -->
    <v-card class="mb-4" flat border>
      <v-card-text>
        <v-row dense align="center">
          <!-- Поиск -->
          <v-col cols="12" sm>
            <v-text-field
              v-model="searchQuery"
              label="Поиск участника"
              prepend-inner-icon="mdi-magnify"
              variant="outlined"
              density="compact"
              hide-details
              clearable
            ></v-text-field>
          </v-col>
          
          <!-- Сортировка -->
          <v-col cols="auto" class="mx-auto">
            <v-btn-toggle
              v-model="sortMode"
              color="primary"
              variant="outlined"
              density="compact"
              mandatory
              divided
            >
              <v-btn value="rank" prepend-icon="mdi-podium">Место</v-btn>
              <v-btn value="name" prepend-icon="mdi-sort-alphabetical-variant">Имя</v-btn>
              <v-btn value="rating" prepend-icon="mdi-star">Рейтинг</v-btn>
            </v-btn-toggle>
          </v-col>
        </v-row>
      </v-card-text>
    </v-card>

    <!-- СОСТОЯНИЕ ЗАГРУЗКИ -->
    <div v-if="store.isLoadingDetails" class="text-center pa-10">
      <v-progress-circular indeterminate color="primary" size="64"></v-progress-circular>
    </div>

    <!-- НЕТ РЕЗУЛЬТАТОВ ПОИСКА -->
    <div v-else-if="processedStandings.length === 0" class="text-center text-medium-emphasis pa-10">
      <v-icon size="64" class="mb-2">mdi-account-search-outline</v-icon>
      <div>Участники не найдены</div>
    </div>

    <!-- ТАБЛИЦА (ДЕСКТОП) -->
    <v-card v-else-if="display.mdAndUp.value">
      <v-table class="leaderboard-table" hover>
        <thead>
          <tr>
            <!-- Динамический заголовок первой колонки -->
            <th class="text-center rank-col">{{ sortMode === 'rank' ? 'Место' : 'Ст. №' }}</th>
            <th class="text-left">Игрок</th>
            <th class="text-center" v-if="sortMode === 'rank'">+/-</th>
            <th class="text-center" v-if="sortMode === 'rank'">Перф.</th>
            <th class="text-center points-col">Очки</th>
          </tr>
        </thead>
        <tbody>
          <tr 
            v-for="item in processedStandings" 
            :key="item.player_id" 
            class="table-row" 
            @click="goToPlayer(item.player_id)"
          >
            <!-- Колонка 1: Место или Стартовый номер -->
            <td class="text-center rank-col">
              <div v-if="sortMode === 'rank'" class="rank-indicator" :class="getRankClass(item.final_rank)">
                <v-icon v-if="item.final_rank <= 3" :color="getRankColor(item.final_rank)" size="28">mdi-trophy-variant</v-icon>
                <span v-else class="text-h6 font-weight-medium text-medium-emphasis">{{ item.final_rank }}</span>
              </div>
              <div v-else class="text-h6 font-weight-regular text-medium-emphasis">
                {{ item.starting_rank }}
              </div>
            </td>

            <!-- Колонка 2: Игрок -->
            <td>
              <div class="d-flex align-center py-2">
                <v-avatar :color="getAvatarColor(item.name)" size="40" class="mr-4">
                  <span class="text-white font-weight-bold">{{ getInitials(item.name) }}</span>
                </v-avatar>
                <div>
                  <div class="font-weight-bold text-subtitle-1">{{ item.name }}</div>
                  <div class="text-caption text-medium-emphasis">
                     <span v-if="getParticipantInfo(item.player_id)?.federation" class="mr-2">
                       {{ getParticipantInfo(item.player_id).federation }}
                     </span>
                     Рейтинг: {{ item.rating_at_tournament }}
                  </div>
                </div>
              </div>
            </td>

            <!-- Доп колонки (только для режима ранга) -->
            <td class="text-center" v-if="sortMode === 'rank'">
              <v-chip v-if="item.rating_change" :color="getRatingChangeColor(item.rating_change)" variant="tonal" label size="small">
                {{ formatRatingChange(item.rating_change) }}
              </v-chip>
            </td>
            <td class="text-center text-body-1 text-medium-emphasis" v-if="sortMode === 'rank'">{{ item.performance_rating }}</td>
            
            <!-- Очки -->
            <td class="text-center points-col font-weight-bold text-h6">{{ item.score }}</td>
          </tr>
        </tbody>
      </v-table>
    </v-card>

    <!-- СПИСОК (МОБИЛЬНЫЙ) -->
    <div v-else class="mobile-standings">
      <v-list lines="two" class="bg-transparent">
        <template v-for="item in processedStandings" :key="item.player_id">
          <v-card class="mb-2 border" flat @click="goToPlayer(item.player_id)">
             <div class="d-flex align-center pa-3">
                <!-- Левая часть: Ранг/Номер -->
                <div class="d-flex align-center justify-center mr-4" style="width: 40px;">
                   <div v-if="sortMode === 'rank' && item.final_rank <= 3">
                      <v-icon :color="getRankColor(item.final_rank)" size="32">mdi-trophy</v-icon>
                   </div>
                   <div v-else class="text-h5 font-weight-bold text-medium-emphasis">
                      {{ sortMode === 'rank' ? item.final_rank : item.starting_rank }}
                   </div>
                </div>

                <!-- Центр: Инфо -->
                <div class="flex-grow-1">
                   <div class="text-subtitle-1 font-weight-bold line-clamp-1">{{ item.name }}</div>
                   <div class="text-caption text-medium-emphasis">
                      {{ getParticipantInfo(item.player_id)?.federation }} · Rtg: {{ item.rating_at_tournament }}
                   </div>
                </div>

                <!-- Право: Очки -->
                <div class="text-h5 font-weight-bold text-primary ml-2">
                   {{ item.score }}
                </div>
             </div>
          </v-card>
        </template>
      </v-list>
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

// --- COMPUTED ---

// Основная логика сортировки и фильтрации
const processedStandings = computed(() => {
  if (!store.standings) return [];

  let data = [...store.standings];

  // Фильтрация
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase();
    data = data.filter(p => p.name.toLowerCase().includes(query));
  }

  // Сортировка
  if (sortMode.value === 'name') {
    data.sort((a, b) => a.name.localeCompare(b.name));
  } else if (sortMode.value === 'rating') {
    data.sort((a, b) => (b.rating_at_tournament || 0) - (a.rating_at_tournament || 0));
  } 
  // Если 'rank' - массив уже отсортирован SQL запросом по месту, ничего не делаем.

  return data;
});

// Хелпер для получения данных, которых может не быть в таблице standings (например, федерация)
const getParticipantInfo = (playerId) => {
  return store.participants.find(p => p.id === playerId);
};

// --- NAVIGATION ---
const goToPlayer = (playerId) => {
  router.push({ 
    name: 'Player', 
    params: { tournamentId: route.params.tournamentId, playerId } 
  });
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
  if (change === null || change === undefined) return 'default';
  return parseFloat(change) > 0 ? 'success' : 'error';
};
</script>

<style scoped>
.leaderboard-table th {
  text-transform: uppercase;
  font-size: 0.75rem !important;
  color: rgba(var(--v-theme-on-surface), 0.6) !important;
}
.table-row {
  cursor: pointer;
  transition: background-color 0.15s ease-in-out;
}
.table-row:hover {
  background-color: rgba(var(--v-theme-primary), 0.04);
}

.rank-indicator {
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: auto;
  position: relative;
}
.rank-indicator::before {
  content: '';
  position: absolute;
  left: -8px;
  top: 15%;
  bottom: 15%;
  width: 4px;
  border-radius: 4px;
  opacity: 0;
}
.rank-gold::before { background-color: #FFC400; opacity: 1; }
.rank-silver::before { background-color: #C0C0C0; opacity: 1; }
.rank-bronze::before { background-color: #CD7F32; opacity: 1; }

.line-clamp-1 {
  display: -webkit-box;
  -webkit-line-clamp: 1;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
</style>