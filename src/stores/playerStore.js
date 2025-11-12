import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { dbService } from '@/services/database';

export const usePlayerStore = defineStore('player', () => {
  // --- СОСТОЯНИЕ ---
  const playerProfile = ref(null);
  const playerCareer = ref([]);
  const isLoading = ref(false);
  const error = ref(null);

  // === СОСТОЯНИЕ ДЛЯ СПИСКА ВСЕХ ИГРОКОВ ===
  const playerList = ref([]);
  const isLoadingList = ref(false);
  const errorList = ref(null);

  // --- GETTERS (COMPUTED) ---

  /** Карьерные достижения (медали) */
  const careerStats = computed(() => {
    const stats = {
      gold: 0,
      silver: 0,
      bronze: 0,
      tournaments: playerCareer.value.length,
    };
    if (!playerCareer.value) return stats;

    playerCareer.value.forEach(perf => {
      if (perf.final_rank === 1) stats.gold++;
      else if (perf.final_rank === 2) stats.silver++;
      else if (perf.final_rank === 3) stats.bronze++;
    });
    return stats;
  });

  /** Данные для графика рейтинга */
  const ratingHistory = computed(() => {
    if (!playerCareer.value || playerCareer.value.length === 0) {
      return { labels: [], datasets: [] };
    }
    
    const labels = [];
    const ratingData = [];
    
    playerCareer.value.forEach(perf => {
      if (perf.start_date && perf.rating_at_tournament) {
        labels.push(perf.start_date);
        ratingData.push(perf.rating_at_tournament);
      }
    });

    return {
      labels,
      datasets: [
        {
          label: 'Рейтинг',
          backgroundColor: 'rgba(0, 82, 204, 0.2)',
          borderColor: '#0052CC',
          pointBackgroundColor: '#0052CC',
          data: ratingData,
          fill: true,
          tension: 0.1,
        },
      ],
    };
  });
  
  /** Ключевые показатели карьеры */
  const keyMetrics = computed(() => {
    const metrics = {
      peakRating: 0,
      latestRating: 0,
    };
    if (!playerCareer.value) return metrics;

    let latestDate = '';
    playerCareer.value.forEach(perf => {
      if (perf.rating_at_tournament > metrics.peakRating) {
        metrics.peakRating = perf.rating_at_tournament;
      }
      if (perf.start_date > latestDate) {
        latestDate = perf.start_date;
        metrics.latestRating = perf.rating_at_tournament;
      }
    });
    return metrics;
  });


  // --- ДЕЙСТВИЯ ---
  async function fetchPlayerData(playerId) {
    isLoading.value = true;
    error.value = null;
    try {
      const [profileData, careerData] = await Promise.all([
        dbService.getPlayerGlobalProfile(playerId),
        dbService.getPlayerCareer(playerId),
      ]);
      
      playerProfile.value = profileData;
      playerCareer.value = careerData;

    } catch (e) {
      error.value = e.message;
      console.error("Ошибка при загрузке глобального профиля игрока:", e);
    } finally {
      isLoading.value = false;
    }
  }
  
  function clearPlayerData() {
    playerProfile.value = null;
    playerCareer.value = [];
  }

  async function fetchAllPlayers() {
    // Не загружаем повторно, если данные уже есть
    if (playerList.value.length > 0) return;

    isLoadingList.value = true;
    errorList.value = null;
    try {
      playerList.value = await dbService.getAllPlayersWithStats();
    } catch (e) {
      errorList.value = e.message;
      console.error("Ошибка при загрузке списка всех игроков:", e);
    } finally {
      isLoadingList.value = false;
    }
  }

  return {
    playerProfile,
    playerCareer,
    isLoading,
    error,
    careerStats,
    ratingHistory,
    keyMetrics,
    fetchPlayerData,
    clearPlayerData,
    playerList, isLoadingList, errorList,
    fetchAllPlayers,
  };
});