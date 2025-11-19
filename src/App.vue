<template>
  <v-app :theme="isDark ? 'dark' : 'light'" class="app-container">
    <v-navigation-drawer
      v-model="drawer"
      :permanent="display.mdAndUp.value"
      width="280"
      app
    >
      <v-sheet class="pa-4 d-flex align-center" height="64" @click="goHome" style="cursor: pointer;">
        <v-avatar class="mr-3" size="32" rounded="0">
          <v-img src="/chess-results-viewer/android-chrome-192x192.png" alt="Логотип"></v-img>
        </v-avatar>
        <div class="app-title text-h6 font-weight-bold">Шахматы на Мира</div>
      </v-sheet>
      <v-divider></v-divider>
      <v-list nav>
        <v-list-item
          prepend-icon="mdi-home-outline"
          title="Главная"
          value="home"
          :to="{ name: 'Home' }"
          rounded="lg"
        ></v-list-item>
        <v-list-item
          prepend-icon="mdi-trophy-variant-outline"
          title="Архив турниров"
          value="tournaments"
          :to="{ name: 'TournamentsList' }"
          rounded="lg"
        ></v-list-item>
        <v-list-item
          prepend-icon="mdi-account-group-outline"
          title="Все игроки"
          value="players"
          :to="{ name: 'PlayerList' }"
          rounded="lg"
        ></v-list-item>
        
        <v-divider class="my-2"></v-divider>
        
        <v-list-item
          prepend-icon="mdi-information-outline"
          title="О клубе"
          value="about"
          :to="{ name: 'About' }"
          rounded="lg"
        ></v-list-item>

        <v-list-item
          prepend-icon="mdi-message-alert-outline"
          title="Нашли ошибку?"
          @click="feedbackDialog = true"
          rounded="lg"
        ></v-list-item>
      </v-list>
    </v-navigation-drawer>

    <v-app-bar app flat border>
      <v-btn v-if="showBackButton" icon @click="goBack">
        <v-icon>mdi-arrow-left</v-icon>
      </v-btn>
      <v-app-bar-nav-icon v-if="display.smAndDown.value" @click="drawer = !drawer"></v-app-bar-nav-icon>
      
      <v-toolbar-title class="font-weight-medium text-subtitle-1 d-flex align-center">
        <span class="text-truncate">{{ currentTitle }}</span>
        <v-chip 
          color="amber" 
          size="x-small" 
          variant="flat" 
          class="ml-2 font-weight-bold cursor-pointer hover-scale"
          @click="feedbackDialog = true"
          title="Сообщить о проблеме"
        >
          BETA
        </v-chip>
      </v-toolbar-title>
      
      <v-spacer></v-spacer>

      <v-btn icon @click="toggleTheme">
        <v-icon :icon="isDark ? 'mdi-weather-night' : 'mdi-weather-sunny'"></v-icon>
      </v-btn>
    </v-app-bar>

    <v-main>
      <v-container fluid class="pa-md-8 pa-4">
        <router-view v-slot="{ Component }">
          <v-fade-transition mode="out-in">
            <component :is="Component" />
          </v-fade-transition>
        </router-view>
      </v-container>
    </v-main>

    <FeedbackDialog v-model="feedbackDialog" />
    
  </v-app>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useTheme, useDisplay } from 'vuetify';
import { useRoute, useRouter } from 'vue-router';
import { useTournamentStore } from '@/stores/tournamentStore';
import FeedbackDialog from '@/components/FeedbackDialog.vue';

const theme = useTheme();
const display = useDisplay();
const route = useRoute();
const router = useRouter();
const store = useTournamentStore();

const drawer = ref(display.mdAndUp.value);
const isDark = ref(theme.global.current.value.dark);
const feedbackDialog = ref(false); // Состояние диалога

onMounted(() => {
  store.fetchCurrentTournament();
});

const toggleTheme = () => {
  const newTheme = isDark.value ? 'light' : 'dark';
  theme.global.name.value = newTheme;
  isDark.value = !isDark.value;
};

const goBack = () => router.back();
const goHome = () => router.push({ name: 'Home' });

const showBackButton = computed(() => {
  const deepPages = [
    'Standings', 'Rounds', 'Participants', 'Crosstable', 'Statistics',
    'Player', 'Game', 'GlobalPlayer'
  ];
  return deepPages.includes(route.name);
});


const currentTitle = computed(() => {
  switch (route.name) {
    case 'TournamentsList': return 'Все турниры';
    case 'Standings':
    case 'Rounds':
    case 'Participants':
    case 'Crosstable':
    case 'Statistics': return store.activeTournament?.name || 'Турнир';
    case 'Player': return store.activePlayer?.canonical_name || 'Профиль игрока';
    case 'Game': return `Партия: ${store.activeGame?.white_name || ''} - ${store.activeGame?.black_name || ''}`;
    case 'GlobalPlayer': return 'Профиль игрока';
    default: return 'Шахматы на Проспекте Мира, 43';
  }
});
</script>

<style>
.app-container { font-family: 'Inter', sans-serif; }
.v-table__wrapper > table { border-spacing: 0 4px; }
.v-data-table .v-table__wrapper > table > tbody > tr:not(:last-child) > td { border-bottom: none !important; }

/* ДОБАВЛЕНО: Стили курсора для чипа */
.cursor-pointer { cursor: pointer; }
.hover-scale { transition: transform 0.1s; }
.hover-scale:hover { transform: scale(1.1); }
</style>