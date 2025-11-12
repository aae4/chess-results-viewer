<template>
  <div>
    <!-- СОСТОЯНИЕ ЗАГРУЗКИ -->
    <div v-if="store.isLoadingDetails && !store.standings.length" class="text-center pa-10">
      <v-progress-circular indeterminate color="primary" size="64"></v-progress-circular>
    </div>

    <!-- ВЕРСИЯ ДЛЯ ДЕСКТОПА -->
    <v-card v-else-if="display.mdAndUp.value">
      <v-data-table-server
        :headers="standingsHeaders"
        :items="store.standings"
        :items-length="store.standings.length"
        item-value="player_id"
        class="leaderboard-table"
        :loading="store.isLoadingDetails"
        loading-text="Загрузка итоговой таблицы..."
      >
        <template v-slot:item="{ item }">
          <tr class="table-row" @click="goToPlayer(item.player_id)">
            <td class="text-center rank-col">
              <div class="rank-indicator" :class="getRankClass(item.final_rank)">
                <v-icon v-if="item.final_rank <= 3" :color="getRankColor(item.final_rank)" size="28">mdi-trophy-variant</v-icon>
                <span v-else class="text-h6 font-weight-medium text-medium-emphasis">{{ item.final_rank }}</span>
              </div>
            </td>
            <td>
              <div class="d-flex align-center py-2">
                <v-avatar :color="getAvatarColor(item.name)" size="40" class="mr-4">
                  <span class="text-white font-weight-bold">{{ getInitials(item.name) }}</span>
                </v-avatar>
                <div>
                  <div class="font-weight-bold text-subtitle-1">{{ item.name }}</div>
                  <div class="text-caption text-medium-emphasis">Рейтинг: {{ item.rating_at_tournament }}</div>
                </div>
              </div>
            </td>
            <td class="text-center">
              <v-chip :color="getRatingChangeColor(item.rating_change)" variant="tonal" label size="small">
                <v-icon start :icon="getRatingChangeIcon(item.rating_change)"></v-icon>
                {{ formatRatingChange(item.rating_change) }}
              </v-chip>
            </td>
            <td class="text-center text-body-1 text-medium-emphasis">{{ item.performance_rating }}</td>
            <td class="text-center points-col font-weight-bold text-h6">{{ item.score }}</td>
          </tr>
        </template>
        <template v-slot:bottom></template>
      </v-data-table-server>
    </v-card>

    <!-- ВЕРСИЯ ДЛЯ МОБИЛЬНЫХ -->
    <div v-else class="mobile-standings">
      <!-- 1. ПЬЕДЕСТАЛ -->
      <v-card
        v-for="item in store.standings.slice(0, 3)"
        :key="item.player_id"
        :class="['podium-card', getPodiumRankClass(item.final_rank)]"
        @click="goToPlayer(item.player_id)"
      >
        <!-- бейдж с местом -->
        <div :class="['rank-badge', getPodiumRankClass(item.final_rank)]">
          {{ item.final_rank }}
        </div>

        <v-card-text class="d-flex align-center">
          <!-- Левая колонка: Аватар -->
          <v-avatar :color="getPodiumColor(item.final_rank)" size="56" class="mr-4 elevation-2">
            <span class="text-white font-weight-bold text-h6">{{ getInitials(item.name) }}</span>
          </v-avatar>

          <!-- Правая колонка: Информация -->
          <div class="flex-grow-1 d-flex align-center">
            <div>
              <div class="player-name font-weight-bold">{{ item.name }}</div>
              <div class="player-rating text-caption text-medium-emphasis">Рейтинг: {{ item.rating_at_tournament }}</div>
            </div>
            <v-spacer></v-spacer>
            <div class="player-score text-h4 font-weight-bold">{{ item.score }}</div>
          </div>
        </v-card-text>
      </v-card>
      
      <!-- 2. ОСНОВНОЙ СПИСОК -->
      <h3 v-if="store.standings.length > 3" class="text-h6 font-weight-bold mt-8 mb-4">Все участники</h3>
      <v-card v-if="store.standings.length > 3">
        <v-list lines="two" class="py-0">
          <template v-for="item in store.standings.slice(3)" :key="item.player_id">
            <v-list-item @click="goToPlayer(item.player_id)">
              <template v-slot:prepend>
                <div class="rank-indicator text-h6 text-medium-emphasis">
                  {{ item.final_rank }}
                </div>
              </template>
              <v-list-item-title class="font-weight-bold">{{ item.name }}</v-list-item-title>
              <v-list-item-subtitle>Рейтинг: {{ item.rating_at_tournament }}</v-list-item-subtitle>
              <template v-slot:append>
                <div class="points-indicator text-h6 font-weight-bold">
                  {{ item.score }}
                </div>
              </template>
            </v-list-item>
            <v-divider></v-divider>
          </template>
        </v-list>
      </v-card>
    </div>
  </div>
</template>

<script setup>
import { useRoute, useRouter } from 'vue-router';
import { useTournamentStore } from '@/stores/tournamentStore';
import { getInitials } from '@/utils/formatters';
import { useDisplay } from 'vuetify';

const store = useTournamentStore();
const router = useRouter();
const route = useRoute();
const display = useDisplay();

const goToPlayer = (playerId) => {
  router.push({ 
    name: 'Player', 
    params: { tournamentId: route.params.tournamentId, playerId } 
  });
};

// --- ХЕЛПЕРЫ ДЛЯ ДЕСКТОПНОЙ ВЕРСИИ ---
const standingsHeaders = [
  { title: 'Место', key: 'final_rank', align: 'center', sortable: false, width: '100px' },
  { title: 'Игрок', key: 'name', sortable: false, align: 'start' },
  { title: '+/- Рейтинга', key: 'rating_change', align: 'center', sortable: false, width: '150px' },
  { title: 'Перфоманс', key: 'performance_rating', align: 'center', sortable: false, width: '150px' },
  { title: 'Очки', key: 'score', align: 'center', sortable: false, width: '120px' },
];

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
  if (change === null || change === undefined) return '–';
  const val = parseFloat(change);
  return val > 0 ? `+${val.toFixed(1)}` : val.toFixed(1);
};

const getRatingChangeColor = (change) => {
  if (change === null || change === undefined) return 'default';
  return parseFloat(change) > 0 ? 'success' : 'error';
};

const getRatingChangeIcon = (change) => {
  if (change === null || change === undefined) return 'mdi-minus';
  return parseFloat(change) > 0 ? 'mdi-arrow-top-right' : 'mdi-arrow-bottom-right';
};

const getPodiumRankClass = (rank) => {
  if (rank == 1) return 'rank-1';
  if (rank == 2) return 'rank-2';
  if (rank == 3) return 'rank-3';
  return '';
};
const getPodiumColor = (rank) => {
  if (rank == 1) return '#FFD700'; // Gold
  if (rank == 2) return '#C0C0C0'; // Silver
  if (rank == 3) return '#CD7F32'; // Bronze
  return 'grey';
};
</script>

<style scoped>
/* --- СТИЛИ ДЛЯ ДЕСКТОПНОЙ ВЕРСИИ --- */
.leaderboard-table .v-data-table__th {
  text-transform: uppercase;
  font-size: 0.75rem !important;
  color: rgba(var(--v-theme-on-surface), 0.6) !important;
}
.leaderboard-table .table-row {
  cursor: pointer;
  transition: background-color 0.15s ease-in-out;
}
.leaderboard-table .table-row:hover {
  background-color: rgba(var(--v-theme-primary-rgb), 0.04);
}

.leaderboard-table .rank-indicator {
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: auto;
  position: relative;
}
.leaderboard-table .rank-indicator::before {
  content: '';
  position: absolute;
  left: -8px;
  top: 15%;
  bottom: 15%;
  width: 4px;
  border-radius: 4px;
  opacity: 0;
  transition: opacity 0.2s;
}
.leaderboard-table .rank-gold::before { background-color: #FFC400; opacity: 1; }
.leaderboard-table .rank-silver::before { background-color: #C0C0C0; opacity: 1; }
.leaderboard-table .rank-bronze::before { background-color: #CD7F32; opacity: 1; }

/* --- СТИЛИ ДЛЯ МОБИЛЬНОЙ ВЕРСИИ --- */
.mobile-standings .podium-card {
  position: relative;
  margin-bottom: 12px;
  border-width: 2px;
  border-style: solid;
  transition: all 0.2s ease-out;
  cursor: pointer;
}
.mobile-standings .podium-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 24px rgba(var(--v-theme-on-surface), 0.1);
}
.mobile-standings .podium-card.rank-1 { border-color: #FFD700; }
.mobile-standings .podium-card.rank-2 { border-color: #C0C0C0; }
.mobile-standings .podium-card.rank-3 { border-color: #CD7F32; }

.mobile-standings .rank-badge {
  position: absolute;
  top: -1px;
  left: -1px;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
  font-size: 1.1rem;
  color: white;
  border-radius: 8px 0 12px 0;
}
.mobile-standings .rank-badge.rank-1 { background-color: #FFD700; }
.mobile-standings .rank-badge.rank-2 { background-color: #C0C0C0; }
.mobile-standings .rank-badge.rank-3 { background-color: #CD7F32; }

.mobile-standings .player-name {
  line-height: 1.4;
  white-space: normal; /* Позволяет переноситься, если нужно */
}
.mobile-standings .player-score {
  color: rgba(var(--v-theme-on-surface), 0.87);
}

/* Список 4+ */
.mobile-standings .rank-indicator {
  width: 50px;
  display: flex;
  align-items: center;
  justify-content: center;
  align-self: center;
}
.mobile-standings .points-indicator {
  padding-left: 16px;
  align-self: center;
}
.mobile-standings .v-list .v-list-item:last-child + .v-divider {
  display: none;
}
</style>