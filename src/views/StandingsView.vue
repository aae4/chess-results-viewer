<template>
  <v-data-table
    :headers="standingsHeaders"
    :items="store.standings"
    item-value="player_id"
    class="leaderboard-table"
    :items-per-page="-1"
    :loading="store.isLoadingDetails"
    loading-text="Загрузка итоговой таблицы..."
  >
    <template v-slot:no-data></template>
    
    <template v-slot:item="{ item }">
      <!-- Используем новые, "плоские" поля из store.standings -->
      <tr :class="getRankClass(item.final_rank)" @click="goToPlayer(item.player_id)">
        <td class="text-center rank-col">
          <div class="rank-circle">
            <v-icon v-if="item.final_rank <= 3" :color="getRankColor(item.final_rank)">mdi-trophy</v-icon>
            <span v-else class="text-h6 font-weight-light text-grey">{{ item.final_rank }}</span>
          </div>
        </td>
        <td>
          <div class="d-flex align-center py-2">
            <v-avatar :color="getAvatarColor(item.final_rank)" size="40" class="mr-4">
              <span class="text-white text-caption font-weight-bold">{{ getInitials(item.name) }}</span>
            </v-avatar>
            <div>
              <div class="font-weight-bold text-subtitle-1">{{ item.name }}</div>
              <div class="text-caption text-grey">Рейтинг: {{ item.rating_at_tournament }}</div>
            </div>
          </div>
        </td>
        <td class="text-center points-col font-weight-bold text-h6">{{ item.score }}</td>
        <td class="text-center perf-col text-body-1 text-grey-darken-1">{{ item.performance_rating }}</td>
      </tr>
    </template>
    <template v-slot:bottom></template>
  </v-data-table>
</template>

<script setup>
import { useRoute, useRouter } from 'vue-router';
import { useTournamentStore } from '@/stores/tournamentStore';
import { getInitials } from '@/utils/formatters';

const store = useTournamentStore();
const router = useRouter();
const route = useRoute();

// === ИЗМЕНЕНИЕ: Правильная навигация ===
const goToPlayer = (playerId) => {
  router.push({ 
    name: 'Player', 
    params: { 
      tournamentId: route.params.tournamentId,
      playerId: playerId 
    } 
  });
};

const standingsHeaders = [
  { title: 'Место', key: 'final_rank', align: 'center', sortable: true, width: '100px' },
  { title: 'Игрок', key: 'name', sortable: true, align: 'start' },
  { title: 'Очки', key: 'score', align: 'center', sortable: true, width: '120px' },
  { title: 'Перфоманс', key: 'performance_rating', align: 'center', sortable: true, width: '150px' },
];

const getAvatarColor = (rank) => {
  if (rank == 1) return 'amber-darken-2';
  if (rank == 2) return 'blue-grey-lighten-2';
  if (rank == 3) return 'brown-lighten-1';
  return 'blue-grey-darken-2';
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
  if (rankNum === 2) return 'blue-grey-lighten-3';
  if (rankNum === 3) return 'brown-lighten-2';
  return 'grey';
};
</script>

<style scoped>
/* Стили остаются без изменений */
.leaderboard-table .v-data-table__th {
  text-transform: uppercase;
  font-size: 0.75rem !important;
  color: rgba(var(--v-theme-on-surface), 0.6) !important;
}
.leaderboard-table tr { cursor: pointer; transition: background-color 0.15s ease-in-out; }
.leaderboard-table tr:hover { background-color: rgba(var(--v-theme-primary), 0.04); }
.leaderboard-table .rank-gold { background-color: rgba(255, 215, 0, 0.07); }
.leaderboard-table .rank-silver { background-color: rgba(192, 192, 192, 0.07); }
.leaderboard-table .rank-bronze { background-color: rgba(205, 127, 50, 0.07); }
.rank-circle { width: 40px; height: 40px; display: flex; align-items: center; justify-content: center; margin: auto; }
.rank-circle .v-icon { font-size: 24px; }
</style>