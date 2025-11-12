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

  // --- Состояние для отдельных страниц (игрок, партия) ---
  const activePlayer = ref(null);
  const activePlayerGames = ref([]);
  const activeGame = ref(null);
  const crosstableData = ref([]);
  const statisticsData = ref([]);
  const ecoDatabase = ref(null)
  
  const isLoading = computed(() => isLoadingList.value || isLoadingDetails.value);

  // === ОСНОВНЫЕ ДЕЙСТВИЯ ===

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
    clearActiveData, currentTournament, isLoadingCurrent, fetchCurrentTournament,
  };
});