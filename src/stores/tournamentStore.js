import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { dbService } from '@/services/database';
import { getEcoDatabase } from '@/services/ecoDatabase';

export const useTournamentStore = defineStore('tournaments', () => {
  // --- Глобальное состояние ---
  const tournamentsList = ref([]);
  const isLoadingList = ref(false);
  const error = ref(null);

  // --- Состояние активного турнира ---
  const activeTournament = ref(null);
  const standings = ref([]);
  const games = ref([]);
  const participants = ref([]);
  const isLoadingDetails = ref(false);
  const currentTournament = ref(null);
  const isLoadingCurrent = ref(false);

  // --- Состояние главной страницы ---
  const currentTournamentStandings = ref([]);
  const recentGames = ref([]);
  const nextRoundInfo = ref(null);
  const isLoadingHomepage = ref(false);

  // --- Состояние для отдельных страниц (игрок, партия) ---
  const activePlayer = ref(null);
  const activePlayerGames = ref([]);
  const activeGame = ref(null);
  const crosstableData = ref([]);
  const statisticsData = ref([]);
  const ecoDatabase = ref(null)
  
  const isLoading = computed(() => isLoadingList.value || isLoadingDetails.value);

  const latestFinishedTournament = ref(null);
  const tournamentPodium = ref([]);

  // === ОСНОВНЫЕ ДЕЙСТВИЯ ===

  /**
   * Загружает все необходимые данные для дашборда на главной странице.
   */
  async function fetchHomepageDashboardData() {
    if (recentGames.value.length > 0) return; // Не перезагружаем, если данные уже есть

    isLoadingHomepage.value = true;
    error.value = null;
    try {
      const today = new Date().toISOString().slice(0, 10);
      const tournament = await dbService.getCurrentTournament(today);

      if (!tournament) {
        // Если нет активного турнира, просто выходим
        currentTournament.value = null;
        return;
      }
      currentTournament.value = tournament;

      const [standingsData, gamesData, roundData] = await Promise.all([
        dbService.getTournamentStandings(tournament.id),
        dbService.getRecentGames(tournament.id, 5), // Запрашиваем 5 последних партий
        dbService.getNextRoundInfo(tournament.id)   // Запрашиваем инфо о след. раунде
      ]);

      currentTournamentStandings.value = standingsData;
      recentGames.value = gamesData;
      nextRoundInfo.value = roundData;

    } catch (e) {
      error.value = e.message;
      console.error("Ошибка при загрузке данных для дашборда:", e);
    } finally {
      isLoadingHomepage.value = false;
    }
  }

  async function fetchAllTournaments() {
    isLoadingList.value = true;
    error.value = null;
    try {
      if (tournamentsList.value.length === 0) {
        tournamentsList.value = await dbService.getAllTournaments();
      }
    } catch (e) { error.value = e.message; } 
    finally { isLoadingList.value = false; }
  }

  async function fetchTournamentData(id) {
    if (activeTournament.value?.id === parseInt(id)) return;
    
    isLoadingDetails.value = true;
    error.value = null;
    try {
      // getEcoDatabase() теперь вызывается как сервис
      const [details, standingsData, gamesData, participantsData, crosstableRawData, statisticsRawData, ecoData] = await Promise.all([
        dbService.getTournamentDetails(id),
        dbService.getTournamentStandings(id),
        dbService.getTournamentGames(id),
        dbService.getTournamentParticipants(id),
        dbService.getDataForCrosstable(id),
        dbService.getGamesForStatistics(id),
        getEcoDatabase(),
      ]);
      
      activeTournament.value = details;
      standings.value = standingsData;
      games.value = gamesData;
      participants.value = participantsData;
      crosstableData.value = crosstableRawData;
      statisticsData.value = statisticsRawData;
      ecoDatabase.value = ecoData;

    } catch (e) { error.value = e.message; } 
    finally { isLoadingDetails.value = false; }
  }

  async function fetchPlayerData(playerId, tournamentId) {
    isLoadingDetails.value = true;
    error.value = null;
    try {
        const [playerData, playerGames] = await Promise.all([
            dbService.getPlayerProfileInTournament(playerId, tournamentId),
            dbService.getPlayerGamesInTournament(playerId, tournamentId)
        ]);
        activePlayer.value = playerData;
        activePlayerGames.value = playerGames;
    } catch (e) { error.value = e.message; }
    finally { isLoadingDetails.value = false; }
  }

  async function fetchGameData(gameId) {
    isLoadingDetails.value = true;
    error.value = null;
    try {
        activeGame.value = await dbService.getGameDetails(gameId);
    } catch (e) { error.value = e.message; }
    finally { isLoadingDetails.value = false; }
  }

  async function fetchCurrentTournament() {
    if (currentTournament.value) return; // Не загружаем повторно
    isLoadingCurrent.value = true;
    try {
      const today = new Date().toISOString().slice(0, 10); // 'YYYY-MM-DD'
      currentTournament.value = await dbService.getCurrentTournament(today);
    } catch (e) {
      console.error("Ошибка при загрузке текущего турнира:", e);
    } finally {
      isLoadingCurrent.value = false;
    }
  }


  /** Загружает информацию о последнем завершенном турнире и его призерах */
  async function fetchHomepageData() {
    if (latestFinishedTournament.value) return; // Загружаем один раз
    try {
      const today = new Date().toISOString().slice(0, 10);
      const latest = await dbService.getLatestFinishedTournament(today);
      if (latest) {
        latestFinishedTournament.value = latest;
        tournamentPodium.value = await dbService.getTournamentPodium(latest.id);
      }
    } catch (e) {
      console.error("Ошибка при загрузке данных для главной страницы:", e);
    }
  }

  /** Загружает информацию о последнем завершенном турнире и его призерах (для страницы "О клубе" или архива) */
  async function fetchHallOfFameData() {
    if (latestFinishedTournament.value) return; 
    try {
      const today = new Date().toISOString().slice(0, 10);
      const latest = await dbService.getLatestFinishedTournament(today);
      if (latest) {
        latestFinishedTournament.value = latest;
        tournamentPodium.value = await dbService.getTournamentPodium(latest.id);
      }
    } catch (e) {
      console.error("Ошибка при загрузке данных для Зала Славы:", e);
    }
  }

  function clearActiveData() {
    activeTournament.value = null;
    standings.value = [];
    games.value = [];
    participants.value = [];
    activePlayer.value = null;
    activePlayerGames.value = [];
    activeGame.value = null;
    crosstableData.value = [];
    statisticsData.value = [];
  }

  return {
    tournamentsList, activeTournament, standings, games, participants,
    activePlayer, activePlayerGames, activeGame,
    error, isLoading, isLoadingList, isLoadingDetails,
    fetchAllTournaments, fetchTournamentData, fetchPlayerData, fetchGameData, crosstableData, statisticsData, ecoDatabase,
    clearActiveData, currentTournament, isLoadingCurrent, fetchCurrentTournament, latestFinishedTournament,
    tournamentPodium, fetchHomepageData, fetchHomepageDashboardData, fetchHallOfFameData, currentTournamentStandings, recentGames, nextRoundInfo, isLoadingHomepage
  };
});