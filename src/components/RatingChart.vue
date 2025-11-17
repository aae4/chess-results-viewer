<template>
  <Line :data="chartData" :options="chartOptions" />
</template>

<script setup>
import { computed } from 'vue';
import { Line } from 'vue-chartjs';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
  TimeScale,
} from 'chart.js';
import 'chartjs-adapter-date-fns';
import { ru } from 'date-fns/locale';
import { useTheme } from 'vuetify';

ChartJS.register(
  CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler,
  TimeScale
);

const props = defineProps({
  chartData: { type: Object, required: true },
  aspectRatio: { type: Number, default: 2.5 }
});

const theme = useTheme();

const chartOptions = computed(() => ({
  responsive: true,
  maintainAspectRatio: false,
  aspectRatio: props.aspectRatio,
  plugins: {
    legend: {
      display: false,
    },
    tooltip: {
      callbacks: {
        title: function(context) {
          // Заголовок - название турнира
          return context[0].raw.tournamentName;
        },
        label: function(context) {
          // Первая строка - Рейтинг
          let label = `Рейтинг: ${context.parsed.y}`;
          return label;
        },
        afterLabel: function(context) {
          // Вторая строка - Изменение рейтинга
          const change = context.raw.ratingChange;
          if (change !== null && change !== undefined) {
            const sign = change > 0 ? '+' : '';
            return `Изм.: ${sign}${parseFloat(change).toFixed(1)}`;
          }
          return '';
        }
      }
    }
  },
  scales: {
    y: {
      grid: {
        color: theme.current.value.dark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
      },
      ticks: {
        color: theme.current.value.dark ? '#E1E3E6' : '#6D7684',
      },
    },
    x: {
      type: 'time',
      time: {
        unit: 'month',
        tooltipFormat: 'dd.MM.yyyy',
        displayFormats: {
          month: 'MMM yyyy'
        }
      },
      adapters: {
        date: {
          locale: ru
        }
      },
      grid: { display: false },
      ticks: {
        color: theme.current.value.dark ? '#E1E3E6' : '#6D7684',
        maxRotation: 0,
        autoSkip: true,
        maxTicksLimit: 6,
      },
    },
  },
}));
</script>