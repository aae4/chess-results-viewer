import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { loadTournamentData } from '@/services/dataLoader'
import { getPointsFromResult } from '@/utils/formatters'
import { generateStatistics } from '@/utils/analysis'
import { buildCrosstableData } from '@/utils/builders';

export const useTournamentStore = defineStore('tournament', () => {
  // --- STATE ---
  const loading = ref(true)
  const error = ref(null)
  const tournamentTitle = ref('')
  const players = ref([])
  const ecoDatabase = ref(null)

  // --- ACTION ---
  async function fetchData() {
    try {
      loading.value = true
      const { title, enrichedPlayers, ecoData } = await loadTournamentData()
      tournamentTitle.value = title
      players.value = enrichedPlayers
      ecoDatabase.value = ecoData
    } catch (err) {
      error.value = err.message
      console.error(err)
    } finally {
      loading.value = false
    }
  }

  // --- GETTERS (Computed) ---
  const standings = computed(() => {
    if (!players.value) return []
    return [...players.value].sort((a, b) => parseInt(a.details?.место || 999) - parseInt(b.details?.место || 999))
  })

  const roundsCount = computed(() => {
    if (!players.value || players.value.length === 0) return 0;
    return Math.max(...players.value.map(p => p.games.length));
  });

  const roundsList = computed(() => Array.from({ length: roundsCount.value }, (_, i) => i + 1));

  const roundsData = computed(() => {
    // Вся логика из useTournament.js переносится сюда
    const rounds = {};
    if (!players.value || players.value.length === 0) return rounds;
        
    roundsList.value.forEach(roundNum => {
        const pairings = [];
        const processedPairs = new Set();
        
        players.value.forEach(player => {
            const game = player.games.find(g => parseInt(g.round, 10) === roundNum);
            if (!game) return;

            if (game.opponent_start_no) {
                const opponent = players.value.find(p => p.start_no === game.opponent_start_no);
                if (!opponent) return;

                const pairKey = [player.start_no, game.opponent_start_no].sort().join('-');
                if (processedPairs.has(pairKey)) return;
                processedPairs.add(pairKey);

                const whitePlayer = game.color === 'w' ? player : opponent;
                const blackPlayer = game.color === 'b' ? player : opponent;
                
                pairings.push({
                    round: game.round,
                    board: game.board,
                    white: whitePlayer?.name || '?',
                    black: blackPlayer?.name || game.opponent_name,
                    result: game.result,
                    pgn: game.pgn,
                    whitePlayer,
                    blackPlayer,
                });
            }
        });

        const byePlayer = players.value.find(p => {
            const game = p.games.find(g => parseInt(g.round, 10) === roundNum);
            return game && game.opponent_name === 'bye';
        });

        rounds[roundNum] = {
            pairings: pairings.sort((a, b) => parseInt(a.board) - parseInt(b.board)),
            byePlayer: byePlayer || null,
        };
    });
    return rounds;
  });

  const crosstable = computed(() => {
    // Теперь здесь простой и безопасный вызов чистой функции.
    return buildCrosstableData(players.value, roundsList.value);
  });

  const statistics = computed(() => {
    if (players.value.length > 0 && ecoDatabase.value) {
      return generateStatistics(players.value, roundsList.value, ecoDatabase.value);
    }
    return null;
  });
  
  // --- HELPERS ---
  const getPlayerByStartNo = (startNo) => {
      const num = parseInt(startNo, 10);
      return players.value.find(p => parseInt(p.start_no, 10) === num);
  }

  const getGameById = (id) => {
      const [round, board] = id.split('-');
      const roundNum = parseInt(round, 10);
      const boardNum = parseInt(board, 10);

      if (isNaN(roundNum) || isNaN(boardNum) || !roundsData.value[roundNum]) {
          return null;
      }
      
      const pairing = roundsData.value[roundNum].pairings.find(p => parseInt(p.board) === boardNum);
      if (!pairing) return null;
      
      return { ...pairing, playerFor: pairing.whitePlayer };
  }

  return {
    loading, error, tournamentTitle, players,
    fetchData,
    standings, roundsList, roundsData, crosstable, statistics,
    getPlayerByStartNo, getGameById,
  }
})