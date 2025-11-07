<template>
  <v-data-table
    :headers="standingsHeaders"
    :items="store.standings"
    item-value="name"
    class="leaderboard-table"
    :items-per-page="-1"
  >
    <template v-slot:item="{ item }">
      <tr :class="getRankClass(item.details?.место)" @click="goToPlayer(item.start_no)">
        <td class="text-center rank-col">
          <div class="rank-circle">
            <v-icon v-if="item.details?.место <= 3" :color="getRankColor(item.details?.место)">mdi-trophy</v-icon>
            <span v-else class="text-h6 font-weight-light text-grey">{{ item.details?.место }}</span>
          </div>
        </td>
        <td>
          <div class="d-flex align-center py-2">
            <v-avatar :color="getAvatarColor(item.details?.место)" size="40" class="mr-4">
              <span class="text-white text-caption font-weight-bold">{{ getInitials(item.name) }}</span>
            </v-avatar>
            <div>
              <div class="font-weight-bold text-subtitle-1">{{ item.name }}</div>
              <div class="text-caption text-grey">Рейтинг: {{ item.rating }}</div>
            </div>
          </div>
        </td>
        <td class="text-center points-col font-weight-bold text-h6">{{ item.details?.очки }}</td>
        <td class="text-center perf-col text-body-1 text-grey-darken-1">{{ item.details?.рейтинговый_перфоманс }}</td>
        <td class="text-center form-col">
          <v-chip
            v-for="(result, index) in playerForm[item.start_no]"
            :key="index"
            :color="result.color"
            size="x-small"
            class="mx-1"
            variant="elevated"
          ></v-chip>
        </td>
      </tr>
    </template>
    <template v-slot:bottom></template>
  </v-data-table>
</template>

<script setup>
import { computed } from 'vue';
import { useRouter } from 'vue-router';
import { useTournamentStore } from '@/stores/tournament';
import { getPointsFromResult, getInitials } from '@/utils/formatters';

const store = useTournamentStore();
const router = useRouter();

const goToPlayer = (startNo) => {
  router.push({ name: 'player', params: { start_no: startNo } });
};

const standingsHeaders = [
  { title: 'Место', key: 'details.место', align: 'center', sortable: false, width: '100px' },
  { title: 'Игрок', key: 'name', sortable: false, align: 'start' },
  { title: 'Очки', key: 'details.очки', align: 'center', sortable: false, width: '120px' },
  { title: 'Перфоманс', key: 'details.рейтинговый_перфоманс', align: 'center', sortable: false, width: '150px' },
  { title: 'Форма', key: 'form', align: 'center', sortable: false, width: '200px' },
];

const playerForm = computed(() => {
  const formMap = {};
  store.players.forEach(player => {
    formMap[player.start_no] = [...player.games]
      .filter(g => g.opponent_name !== 'bye' && g.result.trim() !== '')
      .sort((a, b) => parseInt(b.round) - parseInt(a.round))
      .slice(0, 5)
      .map(game => {
        const points = getPointsFromResult(game.result);
        return {
          color: points === 1 ? 'success' : points === 0.5 ? 'grey' : 'error'
        };
      });
  });
  return formMap;
});

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
/* Все стили .leaderboard-table и т.д. из App.vue переносятся сюда */
.leaderboard-table .v-data-table__th {
  text-transform: uppercase;
  font-size: 0.75rem !important;
  color: rgba(var(--v-theme-on-surface), 0.6) !important;
}

.leaderboard-table tr {
  cursor: pointer;
  transition: background-color 0.15s ease-in-out;
}
.leaderboard-table tr:hover {
  background-color: rgba(var(--v-theme-primary), 0.04);
}
.leaderboard-table .rank-gold { background-color: rgba(255, 215, 0, 0.07); }
.leaderboard-table .rank-silver { background-color: rgba(192, 192, 192, 0.07); }
.leaderboard-table .rank-bronze { background-color: rgba(205, 127, 50, 0.07); }

.rank-circle {
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: auto;
}
.rank-circle .v-icon { font-size: 24px; }
</style>