<template>
  <div v-if="isLoading">
    <!-- Skeleton для Hero-секции -->
    <v-skeleton-loader type="image" height="400px" class="mb-8"></v-skeleton-loader>
    <!-- Skeleton для дашборда -->
    <v-row>
      <v-col cols="12" lg="8">
        <v-skeleton-loader type="heading, list-item-avatar-two-line@3"></v-skeleton-loader>
      </v-col>
      <v-col cols="12" lg="4">
        <v-skeleton-loader type="heading, list-item-two-line@2"></v-skeleton-loader>
      </v-col>
    </v-row>
  </div>
  <div v-else>
    <!-- Блок 1: HERO -->
    <v-sheet
      class="hero-section d-flex flex-column justify-center align-center text-center pa-4 mb-8"
      rounded="lg" min-height="400px">
      <div class="content-wrapper">
        <h1 class="text-h4 text-md-h3 font-weight-bold mb-4">Шахматный клуб на Проспекте Мира</h1>
        <p class="text-h6 text-md-h5 font-weight-regular text-medium-emphasis mb-8">
          Центр шахматной жизни Москвы
        </p>
        <v-card v-if="currentTournament"
          :to="{ name: 'Standings', params: { tournamentId: currentTournament.id } }"
          class="d-inline-block text-left mx-auto sub-hero-card elevation-8">
          <v-card-item>
            <template #prepend>
              <v-chip :color="currentTournamentInfo.chipColor" label class="font-weight-bold mr-2">
                <v-icon start :icon="currentTournamentInfo.icon"></v-icon>
                {{ currentTournamentInfo.text }}
              </v-chip>
            </template>
            <v-card-title class="font-weight-bold">{{ currentTournament.name }}</v-card-title>
            <v-card-subtitle>Нажмите, чтобы посмотреть таблицу</v-card-subtitle>
          </v-card-item>
        </v-card>
        <div v-else class="text-center text-h6 font-weight-regular mt-4">
          Сейчас нет активных турниров. <br> Загляните позже!
        </div>
      </div>
    </v-sheet>

    <!-- Блок 2: ИНФО-ДАШБОРД -->
    <template v-if="currentTournament">
      <v-row>
        <v-col cols="12" lg="8">
          <v-card variant="flat" color="grey-lighten-5" class="fill-height">
            <v-card-item>
              <v-card-title>Текущий турнир: Лидеры</v-card-title>
              <v-card-subtitle>{{ currentTournament?.name }}</v-card-subtitle>
            </v-card-item>
            <v-list lines="two" bg-color="transparent" class="py-0">
              <v-list-item v-for="player in standings" :key="player.player_id"
                :to="{ name: 'GlobalPlayer', params: { playerId: player.player_id } }" class="list-item-spaced">
                <template #prepend>
                  <v-avatar :color="getPodiumColor(player.final_rank)" class="font-weight-bold mr-4" size="32">
                    {{ player.final_rank }}
                  </v-avatar>
                </template>
                <v-list-item-title class="font-weight-bold">{{ player.name }}</v-list-item-title>
                <v-list-item-subtitle class="text-medium-emphasis">
                  Очки: {{ player.score }} | Рейтинг: {{ player.rating_at_tournament }}
                </v-list-item-subtitle>
              </v-list-item>
            </v-list>
            
            <v-spacer></v-spacer> <!-- Распорка, чтобы прижать следующий блок к низу -->
            
            <v-divider></v-divider>
            <v-card-text v-if="nextRoundInfo" class="d-flex align-center">
              <v-icon icon="mdi-calendar-clock" class="mr-3" color="grey-darken-1"></v-icon>
              <div>
                <div class="text-body-2 font-weight-bold">Следующий раунд: {{ nextRoundInfo.name }}</div>
                <div class="text-caption text-medium-emphasis">{{ nextRoundInfo.date }} {{ nextRoundInfo.time }}</div>
              </div>
            </v-card-text>
          </v-card>
        </v-col>

        <v-col cols="12" lg="4">
          <v-card class="fill-height" variant="flat" color="grey-lighten-5">
            <v-card-item>
              <v-card-title>Недавние партии</v-card-title>
            </v-card-item>
            <v-list v-if="recentGames.length" bg-color="transparent" class="py-0">
              <template v-for="(game, i) in recentGames" :key="game.id">
                <v-list-item :to="{ name: 'Game', params: { tournamentId: currentTournament.id, gameId: game.id } }" class="game-list-item">
                  <div class="game-row">
                    <span class="player-name text-right">{{ game.white_player.name }}</span>
                    <v-chip size="x-small" :color="getGameResultChip(game.result).color"
                      :text="getGameResultChip(game.result).text" label variant="tonal" class="result-chip"></v-chip>
                    <span class="player-name text-left">{{ game.black_player.name }}</span>
                  </div>
                </v-list-item>
                <!-- Разделитель между партиями для лучшей читаемости -->
                <v-divider v-if="i < recentGames.length - 1"></v-divider>
              </template>
            </v-list>
            <v-card-text v-else class="text-center py-8 text-medium-emphasis">
              Здесь появятся результаты сыгранных партий.
            </v-card-text>
          </v-card>
        </v-col>
      </v-row>
    </template>
    
    <v-alert v-else type="info" variant="tonal" icon="mdi-information-outline" title="Нет активных соревнований" class="mb-6">
      Как только начнется новый турнир, здесь появится вся актуальная информация.
    </v-alert>

    <!-- Блок 3: НАВИГАЦИЯ -->
    <div class="mt-8">
      <v-row>
        <v-col cols="12" md="6">
          <v-card
             :to="{ name: 'TournamentsList' }"
             rounded="lg"
             class="nav-card fill-height"
             hover
           >
            <div class="d-flex align-center pa-6">
              <v-icon icon="mdi-trophy-outline" size="large" class="nav-card-icon"></v-icon>
              <div>
                <div class="text-h6 font-weight-bold">Архив турниров</div>
                <p class="text-body-2 text-medium-emphasis mt-1">Результаты всех прошедших соревнований</p>
              </div>
            </div>
          </v-card>
        </v-col>
        <v-col cols="12" md="6">
          <v-card
           :to="{ name: 'PlayerList' }"
           rounded="lg"
           class="nav-card fill-height"
           hover
          >
            <div class="d-flex align-center pa-6">
              <v-icon icon="mdi-account-group-outline" size="large" class="nav-card-icon"></v-icon>
              <div>
                <div class="text-h6 font-weight-bold">Все игроки</div>
                <p class="text-body-2 text-medium-emphasis mt-1">Рейтинги и статистика всех участников клуба</p>
              </div>
            </div>
          </v-card>
        </v-col>
      </v-row>
    </div>
    
    <v-footer class="mt-12 d-flex flex-column pa-0">
      <v-divider></v-divider>
      <div class="px-4 py-2 text-center w-100">
        <span class="text-caption text-medium-emphasis">Шахматы на Проспекте Мира, 43</span>
      </div>
       <div class="bg-grey-lighten-4 px-4 py-2 text-center w-100">
        <strong class="text-caption">© {{ new Date().getFullYear() }} — Шахматный клуб</strong>
      </div>
    </v-footer>
  </div>
</template>

<script setup>
import { computed, onMounted } from 'vue';
import { useTournamentStore } from '@/stores/tournamentStore';

const tournamentStore = useTournamentStore();
onMounted(() => tournamentStore.fetchHomepageDashboardData());

const isLoading = computed(() => tournamentStore.isLoadingHomepage);

const currentTournament = computed(() => tournamentStore.currentTournament);
const standings = computed(() => (tournamentStore.currentTournamentStandings || []).slice(0, 5));
const recentGames = computed(() => tournamentStore.recentGames || []);
const nextRoundInfo = computed(() => tournamentStore.nextRoundInfo);

const getPodiumColor = (rank) => {
  if (rank === 1) return 'amber';
  if (rank === 2) return 'blue-grey-lighten-3';
  if (rank === 3) return 'brown-lighten-3';
  return 'grey-lighten-2';
};

const getGameResultChip = (result) => {
  switch (result) {
    case '1-0': return { text: '1-0', color: 'success' };
    case '0-1': return { text: '0-1', color: 'error' };
    case '1/2-1/2': return { text: '½-½', color: 'warning' };
    default: return { text: result, color: 'grey' };
  }
};

const currentTournamentInfo = computed(() => {
  const status = tournamentStore.currentTournament?.status;
  if (status === 'live') {
    return { text: 'LIVE', icon: 'mdi-broadcast', color: 'primary', variant: 'tonal', chipColor: 'red' };
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
</script>

<style scoped>
.hero-section { position: relative; overflow: hidden; background-image: url('https://raw.githubusercontent.com/aae4/chess-results-viewer/master/public/hero-bg.jpg'); background-size: cover; background-position: center; }
.hero-section::before { content: ''; position: absolute; top: 0; left: 0; right: 0; bottom: 0; background: rgba(var(--v-theme-surface), 0.75); backdrop-filter: blur(5px); }
.content-wrapper { position: relative; z-index: 1; }
.sub-hero-card { max-width: 450px; backdrop-filter: blur(10px); background: rgba(var(--v-theme-surface), 0.85); transition: all 0.2s ease-in-out; }
.sub-hero-card:hover { transform: translateY(-4px); box-shadow: 0 8px 30px rgba(0,0,0,0.12) !important; }

.list-item-spaced {
  padding-top: 10px;
  padding-bottom: 10px;
}
.game-list-item {
  min-height: 56px;
  padding: 8px 16px;
  transition: background-color 0.2s ease-in-out;
}
.game-list-item:hover {
  background-color: rgba(var(--v-theme-on-surface), 0.04);
}
.game-row {
  display: grid;
  grid-template-columns: 1fr auto 1fr;
  gap: 12px;
  align-items: center;
  width: 100%;
}
.player-name {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  font-size: 0.875rem; /* Сделаем шрифт чуть меньше для компактности */
}
.result-chip {
  font-weight: bold;
}

/* Стили для навигационных карточек */
.nav-card {
  transition: all 0.2s ease-in-out !important; /* !important нужен, чтобы перебить стандартные transition карточки */
  border: 1px solid rgba(0,0,0,0.12);
  background-color: transparent;
}
/* Эффект hover теперь управляется через пропс 'hover' у v-card, но мы можем его кастомизировать */
.nav-card:hover {
   transform: translateY(-5px);
   box-shadow: 0 8px 25px rgba(0,0,0,0.08) !important;
   border-color: rgba(var(--v-theme-primary), 0.6);
}
.nav-card-icon {
  margin-right: 20px;
  color: var(--v-theme-primary);
}
</style>