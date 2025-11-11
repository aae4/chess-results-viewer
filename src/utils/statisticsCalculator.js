// src/utils/statisticsCalculator.js
import { formatResult } from '@/utils/formatters';
import { historyToPgnString } from '@/utils/pgn';
import { Chess } from 'chess.js';

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
  let shortestGame = { moves: Infinity, game: null };
  let longestGame = { moves: 0, game: null };
  let totalMoves = 0;
  let gamesWithPgnCount = 0;
  let totalCastles = 0;
  let totalPromotions = 0;
  const openingStats = {};
  const playerDrawCounts = {};

  gamesForStats.forEach(game => {
    const result = formatResult(game.result);
    if (result === '1-0') whiteWins++;
    else if (result === '0-1') blackWins++;
    else if (result === '½-½') {
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
          if (moveCount < shortestGame.moves) shortestGame = { moves: moveCount, game };
          if (moveCount > longestGame.moves) longestGame = { moves: moveCount, game };
        }

        history.forEach(move => {
          if (move === 'O-O' || move === 'O-O-O') totalCastles++;
          if (move.includes('=')) totalPromotions++;
        });

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
          if (!openingStats[key]) {
            openingStats[key] = { eco: key, name: foundOpening.n, count: 0, white: 0, draw: 0, black: 0 };
          }
          openingStats[key].count++;
          if (result === '1-0') openingStats[key].white++;
          else if (result === '0-1') openingStats[key].black++;
          else if (result === '½-½') openingStats[key].draw++;
        }
      } catch (e) { /* Игнорируем ошибки PGN */ }
    }
  });

  const totalGames = whiteWins + blackWins + draws;
  const resultDistribution = {
    whiteWins, blackWins, draws,
    whiteWinPercent: totalGames > 0 ? Math.round((whiteWins / totalGames) * 100) : 0,
    blackWinPercent: totalGames > 0 ? Math.round((blackWins / totalGames) * 100) : 0,
    drawPercent: totalGames > 0 ? Math.round((draws / totalGames) * 100) : 0,
  };

  const biggestOverperformer = standings
    .filter(p => p.performance_rating && p.rating_at_tournament)
    .map(p => ({ player: p, diff: p.performance_rating - p.rating_at_tournament }))
    .sort((a, b) => b.diff - a.diff)[0];

  const mostDecisivePlayer = participants
    .map(p => {
        const playedGames = gamesForStats.filter(g => g.white_player_id === p.id || g.black_player_id === p.id).length;
        const drawsCount = playerDrawCounts[p.id] || 0;
        return { player: p, drawRate: playedGames > 0 ? (drawsCount / playedGames) * 100 : 100 };
    })
    .sort((a, b) => a.drawRate - b.drawRate)[0];

  const undefeatedPlayers = standings.filter(p => {
    const playerGames = gamesForStats.filter(g => g.white_player_id === p.player_id || g.black_player_id === p.player_id);
    return !playerGames.some(g => {
      const result = formatResult(g.result);
      return (g.white_player_id === p.player_id && result === '0-1') || (g.black_player_id === p.player_id && result === '1-0');
    });
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