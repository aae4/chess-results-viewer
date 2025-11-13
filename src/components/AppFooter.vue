<template>
  <v-footer class="d-flex flex-column" app>
    <div class="d-flex w-100 align-center px-4">
      <strong>Шахматы на Проспекте Мира, 43</strong>
      <v-spacer></v-spacer>
      <v-btn
        href="https://vk.com/public159635559"
        target="_blank"
        class="mx-2"
        icon="mdi-vk"
        variant="plain"
        size="small"
      ></v-btn>
    </div>
    <div class="px-4 py-2 text-center w-100 text-caption">
      © {{ new Date().getFullYear() }} — <router-link :to="{ name: 'About' }">О клубе</router-link>
    </div>
  </v-footer>
</template>

<style scoped>
a {
  text-decoration: none;
  color: inherit;
  font-weight: bold;
}
a:hover {
  text-decoration: underline;
}
</style>