<template>
  <div class="player-info-panel d-flex align-center pa-2">
    <!-- Игрок: Аватар, Имя, Рейтинг -->
    <div class="d-flex align-center flex-grow-1 text-truncate">
      <v-avatar size="32" class="mr-3">
        <v-icon color="grey-darken-1">mdi-account-circle</v-icon>
      </v-avatar>
      <div class="text-truncate">
        <span class="font-weight-bold text-subtitle-2">{{ player.name }}</span>
        <span class="text-caption text-medium-emphasis ml-2">({{ player.rating }})</span>
      </div>
    </div>

    <!-- Съеденные фигуры и Материальный перевес -->
    <CapturedPieces v-if="capturedPieces" :pieces="capturedPieces" class="mx-2" />
    <v-chip v-if="advantage > 0" size="x-small" label class="font-weight-bold">+{{ advantage }}</v-chip>
  </div>
</template>

<script setup>
import { getInitials } from '@/utils/formatters';
import CapturedPieces from './CapturedPieces.vue';

defineProps({
  player: {
    type: Object,
    required: true,
  },
  capturedPieces: {
    type: Array,
    default: () => [],
  },
  advantage: {
    type: Number,
    default: 0,
  },
});
</script>

<style scoped>
.player-info-panel {
  min-height: 52px;
}
</style>