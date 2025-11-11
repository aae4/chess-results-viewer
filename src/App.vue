<template>
  <v-app :theme="isDark ? 'dark' : 'light'">
    <!-- Шапка приложения. Она может быть умнее в будущем. -->
    <v-app-bar app elevation="1">
      <!-- Используем computed для динамического заголовка -->
      <v-toolbar-title class="app-title" @click="goHome">
        Chess Results Viewer
      </v-toolbar-title>
      
      <v-spacer></v-spacer>

      <v-switch
        v-model="isDark"
        hide-details
        inset
        color="primary"
        :prepend-icon="isDark ? 'mdi-weather-night' : 'mdi-weather-sunny'"
        @update:model-value="toggleTheme"
      ></v-switch>
    </v-app-bar>

    <!-- Основная область контента -->
    <v-main>
      <v-container>
        <!-- Вся логика отображения страниц теперь полностью отдана Vue Router -->
        <router-view v-slot="{ Component }">
          <!-- Добавляем анимацию перехода между страницами -->
          <v-fade-transition mode="out-in">
            <component :is="Component" />
          </v-fade-transition>
        </router-view>
      </v-container>
    </v-main>
  </v-app>
</template>

<script setup>
import { ref } from 'vue';
import { useTheme } from 'vuetify';
import { useRouter } from 'vue-router';

const theme = useTheme();
const router = useRouter();

// Управление темой оформления
const isDark = ref(theme.global.current.value.dark);

const toggleTheme = (value) => {
  theme.global.name.value = value ? 'dark' : 'light';
  isDark.value = value;
};

// Функция для перехода на главную страницу по клику на заголовок
const goHome = () => {
  router.push({ name: 'TournamentsList' });
};
</script>

<style scoped>
.app-title {
  cursor: pointer;
  font-weight: 300;
}
</style>