<template>
  <div class="captured-pieces d-flex align-center ga-1">
    <v-icon
      v-for="(piece, index) in pieces"
      :key="index"
      :icon="getPieceIcon(piece)"
      :color="getPieceDisplayColor(piece.color)"
      size="x-small"
    ></v-icon>
  </div>
</template>

<script setup>
defineProps({
  pieces: {
    type: Array,
    required: true,
  },
});

const getPieceIcon = (piece) => {
  const icons = {
    p: 'mdi-chess-pawn',
    n: 'mdi-chess-knight',
    b: 'mdi-chess-bishop',
    r: 'mdi-chess-rook',
    q: 'mdi-chess-queen',
  };
  return icons[piece.type] || '';
};

// === НОВАЯ ФУНКЦИЯ ДЛЯ ЦВЕТА ИКОНОК ===
const getPieceDisplayColor = (pieceColor) => {
  // В светлой теме белые фигуры почти не видны, поэтому делаем их серыми
  // В темной теме они будут хорошо видны
  return pieceColor === 'w' ? 'grey' : undefined;
};
</script>

<style scoped>
.captured-pieces {
  min-height: 20px;
}
</style>