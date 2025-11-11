import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { dbService } from '@/services/database';

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

function parseEcoTsv(tsvText) {
    const db = {};
    const lines = tsvText.split('\n');
    for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;
        const columns = line.split('\t');
        if (columns.length < 3) continue;
        const [eco, name, pgn] = columns;
        db[pgn] = { e: eco, n: name };
    }
    return db;
}

async function loadAndParseEcoData() {
    try {
        const files = ['a.tsv', 'b.tsv', 'c.tsv', 'd.tsv', 'e.tsv'];
        const promises = files.map(file => fetch(`data/${file}`).then(res => res.text()));
        const tsvTexts = await Promise.all(promises);
        const databases = tsvTexts.map(text => parseEcoTsv(text));
        return Object.assign({}, ...databases);
    } catch (error) {
        console.error("Error loading ECO database:", error);
        return null;
    }
}

  async function fetchTournamentData(id) {
    if (activeTournament.value?.id === parseInt(id)) return;
    
    isLoadingDetails.value = true;
    error.value = null;
    try {
      const [details, standingsData, gamesData, participantsData, crosstableRawData, statisticsRawData, ecoData] = await Promise.all([
        dbService.getTournamentDetails(id),
        dbService.getTournamentStandings(id),
        dbService.getTournamentGames(id),
        dbService.getTournamentParticipants(id),
        dbService.getDataForCrosstable(id),
        dbService.getGamesForStatistics(id),
        loadAndParseEcoData(),
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
    clearActiveData,
  };
});