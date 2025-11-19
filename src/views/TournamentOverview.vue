<template>
  <div>
    <!-- СОСТОЯНИЕ ЗАГРУЗКИ -->
    <div v-if="store.isLoadingDetails" class="text-center pa-10">
      <v-progress-circular indeterminate color="primary" size="64"></v-progress-circular>
    </div>

    <div v-else-if="store.activeTournament">
      <!-- 1. ВЕРХНЯЯ СЕКЦИЯ: СТАТУС ТУРНИРА -->
      <v-card class="mb-6 bg-primary-lighten-5" elevation="2" border>
        <v-card-text class="d-flex flex-column flex-md-row align-center justify-space-between pa-6">
          <div class="text-center text-md-left mb-4 mb-md-0">
             <v-chip 
                :color="isTournamentFinished ? 'grey' : 'green'" 
                variant="flat" 
                class="font-weight-bold mb-2"
                prepend-icon="mdi-information"
             >
               {{ isTournamentFinished ? 'Турнир завершен' : 'Турнир идет' }}
             </v-chip>
             <h2 v-if="!isTournamentFinished && store.nextRoundInfo" class="text-h4 font-weight-bold mt-2">
               {{ store.nextRoundInfo.name }}
             </h2>
             <h2 v-else class="text-h4 font-weight-bold mt-2">
                Победитель определен
             </h2>
             <div class="text-subtitle-1 opacity-70 mt-1" v-if="store.nextRoundInfo && store.nextRoundInfo.date">
               {{ store.nextRoundInfo.date }} {{ store.nextRoundInfo.time }}
             </div>
          </div>

          <div class="d-flex ga-4">
             <!-- Быстрые действия -->
             <v-btn 
               variant="outlined" 
               prepend-icon="mdi-format-list-numbered"
               :to="{ name: 'Standings', params: { tournamentId: store.activeTournament.id } }"
             >
               Таблица
             </v-btn>
             <v-btn 
               variant="flat" 
               color="primary"
               prepend-icon="mdi-chess-pawn"
               :to="{ name: 'Rounds', params: { tournamentId: store.activeTournament.id } }"
             >
               Смотреть пары
             </v-btn>
          </div>
        </v-card-text>
      </v-card>

      <v-row>
        <!-- 2. ЛЕВАЯ КОЛОНКА: ПОДИУМ И ИНФО -->
        <v-col cols="12" md="5" lg="4">
          
          <!-- ПОДИУМ (ТОП 3) -->
          <h3 class="text-h6 font-weight-bold mb-3">Лидеры турнира</h3>
          <v-card class="mb-6" border flat>
            <v-list lines="two" class="py-0">
               <template v-for="(player, index) in topThreePlayers" :key="player.player_id">
                 <v-list-item @click="goToPlayer(player.player_id)" class="py-3">
                   <template v-slot:prepend>
                     <div :class="['rank-badge', getRankClass(index + 1)]">
                       {{ index + 1 }}
                     </div>
                   </template>
                   <v-list-item-title class="font-weight-bold text-h6 ml-4">
                     {{ player.name }}
                   </v-list-item-title>
                   <v-list-item-subtitle class="ml-4 text-body-2">
                     Рейтинг: {{ player.rating_at_tournament }}
                   </v-list-item-subtitle>
                   <template v-slot:append>
                     <div class="text-h5 font-weight-bold text-primary">
                       {{ player.score }}
                     </div>
                   </template>
                 </v-list-item>
                 <v-divider v-if="index < topThreePlayers.length - 1"></v-divider>
               </template>
            </v-list>
            <v-card-actions>
              <v-btn block variant="text" color="primary" :to="{ name: 'Standings', params: { tournamentId: store.activeTournament.id } }">
                Показать всех участников
              </v-btn>
            </v-card-actions>
          </v-card>

          <!-- КЛЮЧЕВЫЕ ФАКТЫ -->
          <h3 class="text-h6 font-weight-bold mb-3">Информация</h3>
          <v-row dense>
            <v-col cols="6">
              <v-sheet class="pa-3 border rounded text-center fill-height d-flex flex-column justify-center align-center">
                <v-icon color="primary" class="mb-1">mdi-account-group</v-icon>
                <div class="text-caption text-medium-emphasis">Участников</div>
                <div class="font-weight-bold">{{ store.participants.length }}</div>
              </v-sheet>
            </v-col>
            <v-col cols="6">
              <v-sheet class="pa-3 border rounded text-center fill-height d-flex flex-column justify-center align-center">
                <v-icon color="primary" class="mb-1">mdi-timer-outline</v-icon>
                <div class="text-caption text-medium-emphasis">Контроль</div>
                <div class="font-weight-bold text-caption">{{ store.activeTournament.time_control || 'Стандарт' }}</div>
              </v-sheet>
            </v-col>
            <v-col cols="6">
              <v-sheet class="pa-3 border rounded text-center fill-height d-flex flex-column justify-center align-center">
                <v-icon color="primary" class="mb-1">mdi-map-marker</v-icon>
                <div class="text-caption text-medium-emphasis">Город</div>
                <div class="font-weight-bold">{{ store.activeTournament.city }}</div>
              </v-sheet>
            </v-col>
            <v-col cols="6">
              <v-sheet class="pa-3 border rounded text-center fill-height d-flex flex-column justify-center align-center">
                <v-icon color="primary" class="mb-1">mdi-calendar-range</v-icon>
                <div class="text-caption text-medium-emphasis">Туров</div>
                <div class="font-weight-bold">{{ store.activeTournament.rounds_count }}</div>
              </v-sheet>
            </v-col>
          </v-row>

        </v-col>

        <!-- 3. ПРАВАЯ КОЛОНКА: ПОСЛЕДНИЕ ПАРТИИ -->
        <v-col cols="12" md="7" lg="8">
           <h3 class="text-h6 font-weight-bold mb-3">
             Последние партии
             <span class="text-caption font-weight-regular text-medium-emphasis ml-2" v-if="store.recentGames.length">
               (Тур {{ store.recentGames[0].round }})
             </span>
           </h3>
           
           <v-card v-if="store.recentGames.length" border flat>
             <v-list lines="two">
               <template v-for="(game, index) in store.recentGames" :key="game.id">
                 <v-list-item :to="{ name: 'Game', params: { gameId: game.id } }">
                   <!-- Результат -->
                   <template v-slot:prepend>
                     <div class="d-flex align-center justify-center rounded bg-grey-lighten-4 font-weight-bold mr-4" style="width: 48px; height: 48px;">
                       {{ game.result }}
                     </div>
                   </template>
                   
                   <!-- Игроки -->
                   <v-list-item-title class="mb-1">
                     <span :class="{'font-weight-bold': isWinner(game.result, 'white')}">{{ game.white_player.name }}</span>
                     <span class="text-medium-emphasis text-caption mx-1">vs</span>
                     <span :class="{'font-weight-bold': isWinner(game.result, 'black')}">{{ game.black_player.name }}</span>
                   </v-list-item-title>
                   
                   <!-- Детали -->
                   <v-list-item-subtitle class="d-flex align-center">
                      <v-icon size="small" class="mr-1">mdi-table-furniture</v-icon> Доска {{ game.board }}
                      <span class="mx-2">·</span>
                      <span class="text-caption">Рейтинги: {{ game.white_player.rating }} vs {{ game.black_player.rating }}</span>
                   </v-list-item-subtitle>
                   
                   <template v-slot:append>
                     <v-icon>mdi-chevron-right</v-icon>
                   </template>
                 </v-list-item>
                 <v-divider v-if="index < store.recentGames.length - 1"></v-divider>
               </template>
             </v-list>
             <v-card-actions>
               <v-btn block variant="tonal" :to="{ name: 'Rounds', params: { tournamentId: store.activeTournament.id } }">
                 Смотреть все партии
               </v-btn>
             </v-card-actions>
           </v-card>

           <v-alert v-else type="info" variant="tonal" class="mt-2">
             Партии пока не загружены или турнир еще не начался.
           </v-alert>
        </v-col>
      </v-row>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue';
import { useRouter } from 'vue-router';
import { useTournamentStore } from '@/stores/tournamentStore';

const store = useTournamentStore();
const router = useRouter();

// Получаем Топ-3 из уже загруженного standings
const topThreePlayers = computed(() => {
  return store.standings.slice(0, 3);
});

const isTournamentFinished = computed(() => {
  if (!store.activeTournament) return false;
  // Простая логика: если дата окончания прошла. Можно усложнить.
  const today = new Date().toISOString().split('T')[0];
  return store.activeTournament.end_date < today;
});

const goToPlayer = (playerId) => {
  router.push({ name: 'Player', params: { tournamentId: store.activeTournament.id, playerId } });
};

const getRankClass = (rank) => {
  if (rank === 1) return 'rank-gold';
  if (rank === 2) return 'rank-silver';
  if (rank === 3) return 'rank-bronze';
  return '';
};

const isWinner = (result, color) => {
  if (result === '1-0' && color === 'white') return true;
  if (result === '0-1' && color === 'black') return true;
  return false;
};
</script>

<style scoped>
.rank-badge {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
  color: white;
  background-color: grey;
}
.rank-gold { background-color: #FFD700; box-shadow: 0 2px 4px rgba(0,0,0,0.2); }
.rank-silver { background-color: #C0C0C0; }
.rank-bronze { background-color: #CD7F32; }
</style>