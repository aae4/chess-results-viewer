import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { dbService } from '@/services/database';
import { formatPlayerResult } from '@/utils/formatters';
import { useTournamentStore } from './tournamentStore';

export const usePlayerStore = defineStore('player', () => {
  // --- СОСТОЯНИЕ ---
  const playerProfile = ref(null);
  const playerCareer = ref([]);
  const nextGame = ref(null);
  const isLoading = ref(false); // Глобальная загрузка профиля
  const isLoadingNextGame = ref(false); // Локальная загрузка следующей игры
  const error = ref(null);

  // === СОСТОЯНИЕ ДЛЯ СПИСКА ВСЕХ ИГРОКОВ ===
  const playerList = ref([]);
  const isLoadingList = ref(false);
  const errorList = ref(null);

  // состояния для "тяжелой" аналитики
  const opponentStats = ref(null);
  const openingStats = ref(null);
  const h2hStats = ref(null);
  const playerGamesAnalytics = ref([]);
  const isLoadingAnalytics = ref(false); 

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
    
    const dataPoints = playerCareer.value
      .filter(perf => perf.start_date && perf.rating_at_tournament)
      .map(perf => ({
        x: perf.start_date,
        y: perf.rating_at_tournament,
        tournamentName: perf.tournament_name,
        ratingChange: perf.rating_change,
      }));

    return {
      datasets: [
        {
          label: 'Рейтинг FIDE',
          backgroundColor: 'rgba(0, 82, 204, 0.2)',
          borderColor: '#0052CC',
          pointBackgroundColor: '#0052CC',
          pointHoverRadius: 6,
          pointHoverBorderWidth: 2,
          pointHoverBackgroundColor: 'white',
          data: dataPoints,
          fill: true,
          tension: 0.1,
        },
      ],
    };
  });

  /** Проверяет участие игрока в "текущем" турнире */
  const participationInCurrentTournament = computed(() => {
    const tournamentStore = useTournamentStore();
    const current = tournamentStore.currentTournament;

    if (!current || !playerCareer.value || playerCareer.value.length === 0) {
      return null;
    }

    return playerCareer.value.find(p => p.tournament_id === current.id) || null;
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

  // === COMPUTED ДЛЯ АНАЛИТИКИ ===
  const processedOpponentStats = computed(() => {
    const defaultStat = { wins: 0, draws: 0, losses: 0, total: 0, score: 0, percent: 0 };
    const stats = {
      vs_stronger: { ...defaultStat },
      vs_equal: { ...defaultStat },
      vs_weaker: { ...defaultStat },
    };
    if (!opponentStats.value) return stats;
    opponentStats.value.forEach(row => {
      const { opponent_category, wins, draws, losses } = row;
      stats[opponent_category] = { wins, draws, losses, total: wins + draws + losses, score: wins + draws * 0.5 };
      stats[opponent_category].percent = Math.round((stats[opponent_category].score / stats[opponent_category].total) * 100);
    });
    return stats;
  });


  const processedH2HStats = computed(() => {
    if (!h2hStats.value) return [];
    return h2hStats.value;
  });

  /** Статистика результативности (общая и по цвету) */
  const careerPerformanceStats = computed(() => {
    const stats = {
      white: { w: 0, d: 0, l: 0, total: 0, score: 0, winPercent: 0 },
      black: { w: 0, d: 0, l: 0, total: 0, score: 0, winPercent: 0 },
      total: { w: 0, d: 0, l: 0, total: 0, score: 0, winPercent: 0 }
    };

    if (!playerGamesAnalytics.value || playerGamesAnalytics.value.length === 0) {
      return stats;
    }

    playerGamesAnalytics.value.forEach(game => {
      const result = formatPlayerResult(game.result, game.player_color);
      const color = game.player_color === 'w' ? 'white' : 'black';

      if (result === '1') {
        stats[color].w++;
        stats.total.w++;
      } else if (result === '½') {
        stats[color].d++;
        stats.total.d++;
      } else if (result === '0') {
        stats[color].l++;
        stats.total.l++;
      }
    });

    ['white', 'black', 'total'].forEach(key => {
      const s = stats[key];
      s.total = s.w + s.d + s.l;
      s.score = s.w + s.d * 0.5;
      if (s.total > 0) {
        s.winPercent = Math.round((s.w / s.total) * 100);
      }
    });

    return stats;
  });

  /** Статистика по ходу турнира */
  const performanceByRounds = computed(() => {
    const stages = {
      opening: { score: 0, total: 0 },
      middlegame: { score: 0, total: 0 },
      endgame: { score: 0, total: 0 },
    };
    playerGamesAnalytics.value.forEach(game => {
      const result = formatPlayerResult(game.result, game.player_color);
      const points = result === '1' ? 1 : (result === '½' ? 0.5 : 0);
      const roundProgress = game.round / game.rounds_count;
      
      if (roundProgress <= 0.34) {
        stages.opening.score += points;
        stages.opening.total++;
      } else if (roundProgress <= 0.67) {
        stages.middlegame.score += points;
        stages.middlegame.total++;
      } else {
        stages.endgame.score += points;
        stages.endgame.total++;
      }
    });
    Object.values(stages).forEach(stage => {
      stage.percent = stage.total > 0 ? Math.round((stage.score / stage.total) * 100) : 0;
    });
    return stages;
  });

  /** Самые знаковые партии */
  const notableResults = computed(() => {
    let bestWin = { opponent_rating: 0, opponent_name: null, game_id: null };
    let worstLoss = { opponent_rating: Infinity, opponent_name: null, game_id: null };

    playerGamesAnalytics.value.forEach(game => {
      const result = formatPlayerResult(game.result, game.player_color);
      if (result === '1' && game.opponent_rating > bestWin.opponent_rating) {
        bestWin = game;
      }
      if (result === '0' && game.opponent_rating < worstLoss.opponent_rating) {
        worstLoss = game;
      }
    });
    return {
      bestWin: bestWin.game_id ? bestWin : null,
      worstLoss: worstLoss.game_id ? worstLoss : null,
    };
  });

  // --- ДЕЙСТВИЯ ---
  async function fetchPlayerData(playerId) {
    isLoading.value = true;
    error.value = null;
    nextGame.value = null; // Сбрасываем старое значение сразу
    
    // Запускаем поиск следующей игры параллельно, не блокируя основной интерфейс
    fetchNextGame(playerId);

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

  async function fetchNextGame(playerId) {
    isLoadingNextGame.value = true; // Включаем локальный спиннер
    try {
      const game = await dbService.getPlayerNextGame(playerId);
      nextGame.value = game || null;
    } catch (e) {
      console.error("Ошибка при загрузке следующей игры:", e);
      nextGame.value = null;
    } finally {
      isLoadingNextGame.value = false; // Выключаем локальный спиннер
    }
  }
  
  // === ДЕЙСТВИЯ ДЛЯ ЛЕНИВОЙ ЗАГРУЗКИ ===
  async function fetchPlayerAnalytics(playerId) {
    if (opponentStats.value) return;
    isLoadingAnalytics.value = true;
    try {
      const [oppStats, openStats, games] = await Promise.all([
        dbService.getPlayerOpponentStats(playerId),
        dbService.getPlayerOpeningStats(playerId),
        dbService.getPlayerGamesForAnalytics(playerId), 
      ]);
      opponentStats.value = oppStats;
      openingStats.value = openStats;
      playerGamesAnalytics.value = games; 
    } catch (e) { console.error("Ошибка при загрузке аналитики:", e); }
    finally { isLoadingAnalytics.value = false; }
  }

  async function fetchPlayerH2H(playerId) {
    if (h2hStats.value) return; 
    isLoadingAnalytics.value = true;
    try {
      h2hStats.value = await dbService.getPlayerHeadToHead(playerId);
    } catch (e) { console.error("Ошибка при загрузке H2H:", e); }
    finally { isLoadingAnalytics.value = false; }
  }
  
  function clearPlayerData() {
    playerProfile.value = null;
    playerCareer.value = [];
    nextGame.value = null;
    isLoadingNextGame.value = false;
    opponentStats.value = null;
    openingStats.value = null;
    h2hStats.value = null;
    playerGamesAnalytics.value = [];
  }

  async function fetchAllPlayers() {
    if (playerList.value.length > 0) return;
    isLoadingList.value = true;
    errorList.value = null;
    try {
      playerList.value = await dbService.getAllPlayersWithStatsOptimized();
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
    nextGame,
    isLoading,
    isLoadingNextGame, // Экспортируем новый флаг
    error,
    careerStats,
    ratingHistory,
    keyMetrics,
    fetchPlayerData,
    fetchNextGame,
    clearPlayerData,
    playerList, isLoadingList, errorList,
    fetchAllPlayers, opponentStats, openingStats, h2hStats, isLoadingAnalytics,
    processedOpponentStats, processedH2HStats,
    fetchPlayerAnalytics, fetchPlayerH2H, careerPerformanceStats,
    performanceByRounds,
    notableResults, participationInCurrentTournament
  };
});