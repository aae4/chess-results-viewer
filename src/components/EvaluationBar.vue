<template>
  <div class="eval-bar">
    <!-- Черная часть (для черных) -->
    <div class="eval-segment black-segment" :style="{ flexGrow: blackFlexGrow }">
      <span v-if="score < -0.1 && showText" class="eval-text black-text">
        {{ formattedScore }}
      </span>
    </div>

    <!-- Разделительная линия (0.00) -->
    <div class="eval-divider"></div>

    <!-- Белая часть (для белых) -->
    <div class="eval-segment white-segment" :style="{ flexGrow: whiteFlexGrow }">
      <span v-if="score > 0.1 && showText" class="eval-text white-text">
        {{ formattedScore }}
      </span>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue';

const props = defineProps({
  score: {
    type: Number,
    required: true,
  },
  // orientation: { // Удален, так как шкала всегда идет в одном направлении
  //   type: String,
  //   default: 'white',
  // },
  showText: {
    type: Boolean,
    default: true, 
  }
});

// "Сжимающая" функция (как на Lichess, чтобы оценки до +10 выглядели линейно)
const getVisualScore = (score) => {
  const cap = 10; // Максимальная оценка для визуального "капирования"
  if (score > cap) return cap;
  if (score < -cap) return -cap;
  return score;
};

// Вычисляем flex-grow для каждой части
// Мы используем flex-grow для динамического распределения пространства
// Общий "вес" будет 20 (например, от -10 до +10)
const maxVisualScore = 10;
const visualScore = computed(() => getVisualScore(props.score));

const whiteFlexGrow = computed(() => {
  // Если у белых преимущество, они занимают больше места
  // Формула: 10 (нейтральная половина) + score / 2
  // Если score = 0, whiteFlexGrow = 10, blackFlexGrow = 10
  // Если score = +10, whiteFlexGrow = 20, blackFlexGrow = 0
  // Если score = -10, whiteFlexGrow = 0, blackFlexGrow = 20
  return maxVisualScore + visualScore.value; 
});

const blackFlexGrow = computed(() => {
  return maxVisualScore - visualScore.value;
});

const formattedScore = computed(() => {
  if (props.score === null) return '';
  return props.score.toFixed(1);
});
</script>

<style scoped>
.eval-bar {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column; /* Элементы располагаются вертикально */
  background-color: #303030; /* Цвет по умолчанию для шкалы Lichess */
  border-radius: 4px;
  overflow: hidden;
  position: relative; /* Для центрального делителя */
  transition: background-color 0.3s ease;
}

.eval-segment {
  width: 100%;
  display: flex;
  align-items: center; /* Центрируем текст по вертикали */
  justify-content: center; /* Центрируем текст по горизонтали */
  transition: flex-grow 0.3s ease-out; /* Плавное изменение размера */
  position: relative;
  overflow: hidden; /* Чтобы текст не вылезал при очень маленьких сегментах */
}

.white-segment {
  background-image: linear-gradient(to bottom, #f0f0f0, #ffffff); /* Градиент Lichess для белых */
  border-top-left-radius: 4px; /* Закругляем, если это верхний сегмент */
  border-top-right-radius: 4px;
}

.black-segment {
  background-image: linear-gradient(to top, #000000, #3a3a3a); /* Градиент Lichess для черных */
  border-bottom-left-radius: 4px; /* Закругляем, если это нижний сегмент */
  border-bottom-right-radius: 4px;
}

.eval-divider {
  width: 100%;
  height: 3px; /* Толщина центральной линии */
  background-color: rgba(255, 146, 84, 0.8); /* Светлая линия на темном фоне */
  position: absolute;
  top: 50%;
  left: 0;
  transform: translateY(-50%);
  z-index: 1; /* Чтобы была видна поверх сегментов */
}

.eval-text {
  font-family: 'Roboto Mono', monospace; /* Lichess часто использует моноширинные шрифты */
  /*font-size: 0.75rem;*/
  font-size: 1.15rem;
  /*font-weight: bold;*/
  writing-mode: vertical-rl; /* Вертикальный текст */
  text-orientation: mixed;
  transform: rotate(180deg); /* Переворачиваем для читаемости */
  white-space: nowrap;
  padding: 4px 0;
  z-index: 2; /* Текст поверх всего */
}

.white-text {
  color: #000;
  text-shadow: 0 0 2px rgba(255, 255, 255, 0.5); /* Легкая тень для контраста */
}

.black-text {
  color: #fff;
  text-shadow: 0 0 2px rgba(0, 0, 0, 0.5); /* Легкая тень для контраста */
}
</style>