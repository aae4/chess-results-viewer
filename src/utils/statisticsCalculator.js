// src/utils/statisticsCalculator.js
import { formatResult, getPointsFromResult, formatPlayerResult } from '@/utils/formatters';
import { historyToPgnString } from '@/utils/pgn';
import { Chess } from 'chess.js';

// Хелпер для проверки, завершена ли партия
const isGameFinished = (rawResult) => {
  const res = formatResult(rawResult);
  return ['1-0', '0-1', '½-½', '1/2-1/2'].includes(res);
};

/**
 * Вычисляет персональную статистику игрока в рамках одного турнира.
 * @param {object} data - Объект с данными.
 * @param {Array} data.playerGames - Список игр конкретного игрока.
 * @param {object} data.ecoDatabase - База дебютов.
 * @returns {object} - Готовый объект со статистикой игрока.
 */
export function calculatePlayerStatisticsInTournament({ playerGames, ecoDatabase }) {
  const stats = {
    colorStats: {
      white: { games: 0, points: 0, percent: 0 },
      black: { games: 0, points: 0, percent: 0 },
    },
    openingStats: [],
  };

  if (!playerGames || playerGames.length === 0 || !ecoDatabase) {
    return stats;
  }

  const openingAggregator = {};

  playerGames.forEach(game => {
    // ВАЖНО: Игнорируем партии без результата (будущие туры)
    if (!isGameFinished(game.result)) return;

    const points = getPointsFromResult(formatPlayerResult(game.result, game.color));
    if (points === null) return; // Пропускаем bye и технические, если форматтер их так возвращает

    // 1. Считаем статистику по цвету
    if (game.color === 'w') {
      stats.colorStats.white.games++;
      stats.colorStats.white.points += points;
    } else if (game.color === 'b') {
      stats.colorStats.black.games++;
      stats.colorStats.black.points += points;
    }

    // 2. Считаем статистику по дебютам
    if (game.pgn_moves) {
      try {
        const chess = new Chess();
        chess.loadPgn(game.pgn_moves);
        const history = chess.history();
        let foundOpening = null;

        for (let i = Math.min(history.length, 20); i > 0; i--) {
          const pgnStr = historyToPgnString(history.slice(0, i));
          if (ecoDatabase[pgnStr]) {
            foundOpening = ecoDatabase[pgnStr];
            break;
          }
        }

        if (foundOpening) {
          const key = foundOpening.e;
          if (!openingAggregator[key]) {
            openingAggregator[key] = { eco: key, name: foundOpening.n, count: 0, points: 0 };
          }
          openingAggregator[key].count++;
          openingAggregator[key].points += points;
        }
      } catch (e) { /* Игнорируем ошибки парсинга PGN */ }
    }
  });

  // 3. Форматируем результат
  if (stats.colorStats.white.games > 0) {
    stats.colorStats.white.percent = Math.round((stats.colorStats.white.points / stats.colorStats.white.games) * 100);
  }
  if (stats.colorStats.black.games > 0) {
    stats.colorStats.black.percent = Math.round((stats.colorStats.black.points / stats.colorStats.black.games) * 100);
  }

  stats.openingStats = Object.values(openingAggregator).sort((a, b) => b.count - a.count || b.points - a.points);

  return stats;
}

/**
 * Вычисляет полную статистику по турниру на основе данных из хранилища.
 * @param {object} data - Объект с данными.
 * @param {Array} data.participants - Список участников.
 * @param {Array} data.gamesForStats - Список всех игр для статистики.
 * @param {Array} data.standings - Итоговая таблица.
 * @param {object} data.tournamentDetails - Детали турнира.
 * @param {object} data.ecoDatabase - База дебютов.
 * @returns {object|null} - Готовый объект со статистикой или null.
 */
export function calculateTournamentStatistics({ participants, gamesForStats, standings, tournamentDetails, ecoDatabase }) {
  if (!participants?.length || !gamesForStats?.length || !standings?.length || !ecoDatabase) {
    return null;
  }

  const totalPlayers = participants.length;
  const totalRounds = tournamentDetails?.rounds_count || 0;
  const averageRating = Math.round(participants.reduce((sum, p) => sum + (p.rating || 0), 0) / participants.length);

  let whiteWins = 0, blackWins = 0, draws = 0;
  let shortestGame = null; // Инициализируем null, чтобы легко проверять в шаблоне
  let longestGame = null;
  let minMoves = Infinity;
  let maxMoves = 0;
  let totalMoves = 0;
  let gamesWithPgnCount = 0;
  let totalCastles = 0;
  let totalPromotions = 0;
  const openingStats = {};
  const playerDrawCounts = {};

  // Предварительно фильтруем игры, оставляя только завершенные
  const finishedGames = gamesForStats.filter(g => isGameFinished(g.result));

  finishedGames.forEach(game => {
    const result = formatResult(game.result);
    if (result === '1-0') whiteWins++;
    else if (result === '0-1') blackWins++;
    else if (result === '½-½' || result === '1/2-1/2') {
      draws++;
      playerDrawCounts[game.white_player_id] = (playerDrawCounts[game.white_player_id] || 0) + 1;
      playerDrawCounts[game.black_player_id] = (playerDrawCounts[game.black_player_id] || 0) + 1;
    }

    if (game.pgn_moves) {
      try {
        const chess = new Chess();
        chess.loadPgn(game.pgn_moves);
        const history = chess.history();
        const moveCount = Math.ceil(history.length / 2);

        if (moveCount > 0) {
          gamesWithPgnCount++;
          totalMoves += moveCount;
          
          if (moveCount < minMoves) {
             minMoves = moveCount;
             shortestGame = { moves: moveCount, game };
          }
          if (moveCount > maxMoves) {
             maxMoves = moveCount;
             longestGame = { moves: moveCount, game };
          }
        }

        history.forEach(move => {
          if (move === 'O-O' || move === 'O-O-O') totalCastles++;
          if (move.includes('=')) totalPromotions++;
        });

        let foundOpening = null;
        for (let i = Math.min(history.length, 4); i > 0; i--) {
          const pgnStr = historyToPgnString(history.slice(0, i));
          if (ecoDatabase[pgnStr]) {
            foundOpening = ecoDatabase[pgnStr];
            break;
          }
        }

        if (foundOpening) {
          const key = foundOpening.e;
          if (!openingStats[key]) {
            openingStats[key] = { eco: key, name: foundOpening.n, count: 0, white: 0, draw: 0, black: 0 };
          }
          openingStats[key].count++;
          if (result === '1-0') openingStats[key].white++;
          else if (result === '0-1') openingStats[key].black++;
          else if (result === '½-½' || result === '1/2-1/2') openingStats[key].draw++;
        }
      } catch (e) { /* Игнорируем ошибки PGN */ }
    }
  });

  const totalGames = whiteWins + blackWins + draws;
  const resultDistribution = {
    whiteWins, blackWins, draws, totalGames,
    whiteWinPercent: totalGames > 0 ? Math.round((whiteWins / totalGames) * 100) : 0,
    blackWinPercent: totalGames > 0 ? Math.round((blackWins / totalGames) * 100) : 0,
    drawPercent: totalGames > 0 ? Math.round((draws / totalGames) * 100) : 0,
  };

  const biggestOverperformer = standings
    .filter(p => p.performance_rating && p.rating_at_tournament)
    .map(p => ({ player: p, diff: p.performance_rating - p.rating_at_tournament }))
    .sort((a, b) => b.diff - a.diff)[0];

  const mostDecisivePlayer = standings
    .map(standing => {
        // Считаем только завершенные партии для конкретного игрока
        const playedGames = finishedGames.filter(g => 
          g.white_player_id === standing.player_id || g.black_player_id === standing.player_id
        ).length;
        
        const drawsCount = playerDrawCounts[standing.player_id] || 0;

        return { 
          player: { player_id: standing.player_id, name: standing.name }, // Важно: player_id для роутинга
          drawRate: playedGames > 0 ? (drawsCount / playedGames) * 100 : 100, // Если 0 игр, считаем 100% (скучно), чтобы не попал в топ
          playedGames: playedGames,
          score: standing.score,
          final_rank: standing.final_rank,
        };
    })
    .filter(p => p.playedGames > 0) // Исключаем тех, кто еще не играл результативно
    .sort((a, b) => {
      // 1. Меньше процент ничьих (бескомпромиссность)
      if (a.drawRate !== b.drawRate) return a.drawRate - b.drawRate;
      // 2. Больше сыгранных партий (при прочих равных важнее тот, кто больше играл)
      if (a.playedGames !== b.playedGames) return b.playedGames - a.playedGames;
      // 3. Выше очки
      if (a.score !== b.score) return b.score - a.score;
      return a.final_rank - b.final_rank;
    })[0];

  const undefeatedPlayers = standings.filter(p => {
    // Ищем хотя бы одно поражение в ЗАВЕРШЕННЫХ партиях
    const playerLost = finishedGames.some(g => {
       const result = formatResult(g.result);
       if (g.white_player_id === p.player_id && result === '0-1') return true;
       if (g.black_player_id === p.player_id && result === '1-0') return true;
       return false;
    });
    // Если проиграл - false. Если нет - проверяем, играл ли вообще.
    if (playerLost) return false;
    
    // Тех, кто не сыграл ни одной партии, тоже не считаем "непобежденными героями"
    const hasPlayed = finishedGames.some(g => g.white_player_id === p.player_id || g.black_player_id === p.player_id);
    return hasPlayed;
  });

  const topOpenings = Object.values(openingStats)
    .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name))
    .slice(0, 10);

  return {
    totalPlayers, totalRounds, averageRating, resultDistribution, shortestGame, longestGame,
    averageMoveCount: gamesWithPgnCount > 0 ? Math.round(totalMoves / gamesWithPgnCount) : 0,
    biggestOverperformer, undefeatedPlayers, mostDecisivePlayer, topOpenings, totalCastles, totalPromotions,
  };
}