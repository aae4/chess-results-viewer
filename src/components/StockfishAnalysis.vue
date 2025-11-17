<template>
  <div class="analysis-panel">
    <!-- Хедер с оценкой и управлением -->
    <div class="d-flex align-center pa-2">
      <div class="eval-display mr-4">
        <v-icon size="small" class="mr-1" color="grey-darken-1">mdi-chart-bar</v-icon>
        <span class="font-weight-bold text-h6">{{ formattedScore }}</span>
      </div>
      <div class="text-caption text-medium-emphasis">
        Глубина: {{ result.depth }}
      </div>
      <v-spacer></v-spacer>
      <v-btn-toggle
        :model-value="multiPv"
        @update:model-value="onMultiPvChange"
        variant="outlined"
        density="compact"
        divided
      >
        <v-btn size="x-small" :value="1">1</v-btn>
        <v-btn size="x-small" :value="2">2</v-btn>
        <v-btn size="x-small" :value="3">3</v-btn>
      </v-btn-toggle>
    </div>
    <v-divider></v-divider>

    <!-- Список лучших линий -->
    <div v-if="result.lines.length" class="lines-container pa-2">
      <div v-for="(line, index) in result.lines" :key="index" class="line-item">
        <div class="line-score font-weight-bold">{{ formatLineScore(line) }}</div>
        <div class="line-pv text-body-2" v-html="formatLinePv(line.pv)"></div>
      </div>
    </div>
    <div v-else class="pa-4 text-center text-medium-emphasis text-caption">
      Анализ...
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue';
import { formatSanWithFigurine } from '@/utils/formatters'; // Предполагаем, что у вас есть такой хелпер

const props = defineProps({
  result: {
    type: Object,
    required: true,
  },
  multiPv: {
    type: Number,
    default: 3,
  },
  turn: {
    type: String, // 'w' или 'b'
    required: true,
  },
});

const emit = defineEmits(['update:multiPv']);

const normalizeScore = (rawScore) => {
  if (rawScore === null || typeof rawScore === 'undefined') return 0;
  // Если ход черных, инвертируем знак. Иначе оставляем как есть.
  return props.turn === 'w' ? rawScore : -rawScore;
};

const onMultiPvChange = (value) => {
  if (value) { // v-btn-toggle может вернуть null при отжатии
    emit('update:multiPv', value);
  }
};

const formattedScore = computed(() => {
  if (props.result.mate !== null) {
    return `M${Math.abs(props.result.mate)}`;
  }
  const normalizedScoreValue = normalizeScore(props.result.score);
  return (normalizedScoreValue >= 0 ? '+' : '') + normalizedScoreValue.toFixed(2);
});

// const formatLineScore = (line) => {
//   if (line.mate !== null) {
//     return `M${Math.abs(line.mate)}`;
//   }
//   return line.score.toFixed(2);
// };

const formatLineScore = (line) => {
  if (!line) return '...'; 
  if (line.mate !== null) {
    const normalizedMate = normalizeScore(line.mate);
    return `M${Math.abs(normalizedMate)}`;
  }

  const normalizedScoreValue = normalizeScore(line.score);
  // Здесь можно обойтись без знака "+" для компактности
  return normalizedScoreValue.toFixed(2);
};

// Эта функция должна конвертировать UCI ходы (e.g., e2e4) в SAN (e.g., e4)
// Это сложная задача. Для простоты пока оставим как есть, но в идеале
// нужна временная инстанция chess.js для конвертации.
// Здесь мы просто отобразим UCI ходы.
const formatLinePv = (pv) => {
  // Для настоящей SAN нотации потребуется chess.js и FEN позиции
  // Но для начала, отобразим UCI ходы
  return pv.slice(0, 6).join(' '); // Показываем первые 6 полуходов
};
</script>

<style scoped>
.analysis-panel {
  font-family: 'Roboto Mono', monospace;
  border-top: 1px solid rgba(var(--v-theme-on-surface), 0.12);
}
.eval-display {
  min-width: 90px;
}
.lines-container {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.line-item {
  display: flex;
  align-items: center;
  gap: 12px;
}
.line-score {
  flex-basis: 60px;
  text-align: right;
  color: rgb(var(--v-theme-primary));
}
.line-pv {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
</style>