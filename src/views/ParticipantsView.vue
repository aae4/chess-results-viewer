<template>
  <div>
    <v-toolbar flat color="transparent" class="mb-4 px-0">
      <v-text-field
        v-model="searchQuery"
        label="Поиск по имени"
        prepend-inner-icon="mdi-magnify"
        variant="outlined"
        hide-details
        clearable
        class="mr-4"
      ></v-text-field>
      <v-btn-toggle v-model="sortBy" color="primary" variant="outlined" mandatory>
        <v-btn value="start_no">Номер</v-btn>
        <v-btn value="name">Имя</v-btn>
        <v-btn value="rating">Рейтинг</v-btn>
      </v-btn-toggle>
    </v-toolbar>

    <!-- Обертка с состоянием загрузки и "нет данных" -->
    <div v-if="store.isLoadingDetails" class="text-center pa-10">
        <v-progress-circular indeterminate color="primary"></v-progress-circular>
    </div>
    <div v-else-if="filteredAndSortedPlayers.length === 0" class="text-center text-grey pa-10">
        Участники не найдены.
    </div>
    <v-row v-else>
      <v-col
        v-for="player in filteredAndSortedPlayers"
        :key="player.id"
        cols="12" sm="6" md="4"
      >
        <v-card class="player-card" @click="goToPlayer(player.id)">
          <div class="d-flex align-center pa-4">
            <div class="start-no-badge mr-4">{{ player.starting_rank }}</div>
            <v-avatar :color="avatarColor(player.name)" size="48" class="mr-4">
              <span class="text-white font-weight-bold">{{ getInitials(player.name) }}</span>
            </v-avatar>
            <div class="player-info-text">
              <div class="font-weight-bold text-subtitle-1">{{ player.name }}</div>
              <div class="text-caption text-grey">
                <span class="mr-2">Рейтинг: {{ player.rating }}</span>
                <span>{{ player.federation }}</span>
              </div>
            </div>
          </div>
        </v-card>
      </v-col>
    </v-row>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useTournamentStore } from '@/stores/tournamentStore';
import { getInitials } from '@/utils/formatters';

const store = useTournamentStore();
const router = useRouter();
const route = useRoute();

const searchQuery = ref('');
const sortBy = ref('start_no');

const goToPlayer = (playerId) => {
  router.push({ 
    name: 'Player', 
    params: { 
      tournamentId: route.params.tournamentId,
      playerId: playerId 
    } 
  });
};

const filteredAndSortedPlayers = computed(() => {
  // `store.participants` уже содержит нужные нам данные
  if (!store.participants) return [];
  
  // 1. Фильтрация
  const filtered = store.participants.filter(player => 
    // Используем `name` (мы переименовали `canonical_name` в запросе)
    player.name.toLowerCase().includes(searchQuery.value?.toLowerCase() || '')
  );
  
  // 2. Сортировка
  return filtered.sort((a, b) => {
    if (sortBy.value === 'name') {
      return a.name.localeCompare(b.name);
    }
    if (sortBy.value === 'rating') {
      // Используем `rating` (мы переименовали `rating_at_tournament` в запросе)
      return (b.rating || 0) - (a.rating || 0);
    }
    // Используем `start_no` (мы переименовали `starting_rank` в запросе)
    return (a.starting_rank || 0) - (b.starting_rank || 0);
  });
});

const avatarColor = (name) => {
  const colors = ['blue-grey', 'brown', 'deep-orange', 'indigo', 'teal', 'deep-purple', 'pink'];
  if (!name) return colors[0];
  const index = name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) % colors.length;
  return colors[index];
};
</script>

<style scoped>
.player-card { transition: all 0.2s ease-in-out; cursor: pointer; }
.player-card:hover { transform: translateY(-4px); box-shadow: 0 8px 20px rgba(0,0,0,0.12) !important; }
.start-no-badge { display: flex; align-items: center; justify-content: center; width: 32px; height: 32px; border-radius: 50%; background-color: rgba(var(--v-theme-on-surface), 0.05); color: rgba(var(--v-theme-on-surface), 0.7); font-weight: bold; }
.player-info-text { overflow: hidden; white-space: nowrap; }
.player-info-text .text-subtitle-1 { text-overflow: ellipsis; overflow: hidden; }
</style>