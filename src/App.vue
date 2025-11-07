<template>
  <v-app :theme="isDark ? 'dark' : 'light'">
    <v-app-bar app elevation="1">
      <v-toolbar-title>{{ store.tournamentTitle }}</v-toolbar-title>
      <v-spacer></v-spacer>
      <v-switch
        v-model="isDark"
        hide-details
        inset
        color="primary"
        :label="isDark ? 'Ночь' : 'День'"
        @update:model-value="toggleTheme"
      ></v-switch>
    </v-app-bar>

    <v-main>
      <v-container>
        <div v-if="store.loading" class="text-center pa-10">
          <v-progress-circular indeterminate color="primary" size="64"></v-progress-circular>
          <p class="mt-4 text-h6">Загрузка данных турнира...</p>
        </div>
        <div v-else-if="store.error" class="text-center pa-10">
          <v-alert type="error" prominent icon="mdi-alert-circle-outline">
            Не удалось загрузить данные: {{ store.error }}
          </v-alert>
        </div>
        
        <div v-else>
          <v-tabs :model-value="$route.path" color="primary" class="mb-4">
            <v-tab value="/standings" to="/standings">Итоги</v-tab>
            <v-tab value="/rounds" to="/rounds">Туры</v-tab>
            <v-tab value="/participants" to="/participants">Участники</v-tab>
            <v-tab value="/crosstable" to="/crosstable">Кросс-таблица</v-tab>
            <v-tab value="/statistics" to="/statistics">Статистика</v-tab>
          </v-tabs>

          <router-view v-slot="{ Component }">
            <v-slide-x-transition mode="out-in">
              <component :is="Component" />
            </v-slide-x-transition>
          </router-view>
        </div>
      </v-container>
    </v-main>
  </v-app>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useTheme } from 'vuetify';
import { useTournamentStore } from '@/stores/tournament';
import { useRoute } from 'vue-router';

const store = useTournamentStore();
const route = useRoute();

onMounted(() => {
  // Запускаем загрузку данных, только если они еще не загружены
  if (store.players.length === 0) {
    store.fetchData();
  }
});

const theme = useTheme();
const isDark = ref(theme.global.current.value.dark);

const toggleTheme = (value) => {
  theme.global.name.value = value ? 'dark' : 'light';
  isDark.value = value;
};
</script>