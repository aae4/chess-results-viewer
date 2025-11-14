<template>
  <div class="player-info-panel d-flex align-center pa-2">
    <v-avatar size="32" class="mr-3">
      <!-- Можно добавить аватар пользователя или иконку по умолчанию -->
      <v-icon color="grey-darken-1">mdi-account-circle</v-icon>
    </v-avatar>
    <div class="d-flex flex-column" style="line-height: 1.2;">
      <span class="font-weight-bold text-subtitle-1">{{ player.name }}</span>
      <span class="text-medium-emphasis">{{ player.rating }}</span>
    </div>
    <v-spacer></v-spacer>
    <!-- Место для съеденных фигур или часов -->
  </div>
</template>

<script setup>
defineProps({
  player: {
    type: Object,
    required: true,
    default: () => ({ name: '...', rating: '...' })
  }
});
</script>

<style scoped>
.player-info-panel {
  min-height: 60px; /* Фиксированная высота для предсказуемости макета */
}
</style>