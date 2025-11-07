// src/utils/analysis.js
import { Chess } from 'chess.js';
import { getPointsFromResult } from './formatters';

function historyToPgnString(history) {
    let pgn = '';
    for (let i = 0; i < history.length; i++) {
        if (i % 2 === 0) {
            pgn += `${Math.floor(i / 2) + 1}. `;
        }
        pgn += `${history[i]} `;
    }
    return pgn.trim();
}

export function generateStatistics(players, roundsList, ecoData) {
    if (!players || players.length === 0 || !ecoData) return null;
    
    const totalPlayers = players.length;
    const totalRounds = roundsList.length;
    const averageRating = Math.round(players.reduce((sum, p) => sum + parseInt(p.rating, 10), 0) / totalPlayers);
    
    let whiteWins = 0, blackWins = 0, draws = 0;
    let biggestUpset = null;
    const processedPairs = new Set();
    
    let shortestGame = { moves: Infinity, game: null };
    let longestGame = { moves: 0, game: null };
    let totalMoves = 0;
    let gamesWithPgnCount = 0;
    let totalCastles = 0;
    let totalPromotions = 0;
    const drawTypes = { stalemate: 0, threefold: 0, insufficient: 0, other: 0 };
    const openingStats = {};

    players.forEach(player => {
        player.games.forEach(game => {
            const opponent = players.find(p => p.start_no === game.opponent_start_no);
            if (!opponent) return;

            const pairKey = [player.start_no, opponent.start_no, game.round].sort().join('-');
            if (processedPairs.has(pairKey)) return;
            processedPairs.add(pairKey);

            const playerPoints = getPointsFromResult(game.result);

            if (playerPoints === null) return; // Пропускаем несыгранные партии

            if (playerPoints === 0.5) { draws++; } 
            else if ((game.color === 'w' && playerPoints === 1) || (game.color === 'b' && playerPoints === 0)) { whiteWins++; } 
            else if ((game.color === 'b' && playerPoints === 1) || (game.color === 'w' && playerPoints === 0)) { blackWins++; }

            const ratingDiff = Math.abs(parseInt(player.rating, 10) - parseInt(opponent.rating, 10));
            if (playerPoints === 1 && parseInt(player.rating, 10) < parseInt(opponent.rating, 10)) { if (!biggestUpset || ratingDiff > biggestUpset.ratingDiff) { biggestUpset = { winner: player, loser: opponent, ratingDiff }; } } 
            else if (playerPoints === 0 && parseInt(opponent.rating, 10) < parseInt(player.rating, 10)) { if (!biggestUpset || ratingDiff > biggestUpset.ratingDiff) { biggestUpset = { winner: opponent, loser: player, ratingDiff }; } }
        
            if (game.pgn) {
                try {
                    const chess = new Chess();
                    chess.loadPgn(game.pgn);
                    const history = chess.history();
                    const moveCount = Math.ceil(history.length / 2);

                    if (moveCount > 0) {
                        gamesWithPgnCount++;
                        totalMoves += moveCount;
                        
                        const gameForStats = {
                            ...game,
                            whitePlayer: game.color === 'w' ? player : opponent,
                            blackPlayer: game.color === 'b' ? player : opponent,
                        };

                        if (moveCount < shortestGame.moves) shortestGame = { moves: moveCount, game: gameForStats };
                        if (moveCount > longestGame.moves) longestGame = { moves: moveCount, game: gameForStats };

                        if (playerPoints === 0.5) {
                            if (chess.isStalemate()) drawTypes.stalemate++;
                            else if (chess.isThreefoldRepetition()) drawTypes.threefold++;
                            else if (chess.isInsufficientMaterial()) drawTypes.insufficient++;
                            else drawTypes.other++;
                        }

                        history.forEach(move => {
                            if (move === 'O-O' || move === 'O-O-O') totalCastles++;
                            if (move.includes('=')) totalPromotions++;
                        });

                        let foundOpening = null;
                        for (let i = history.length; i > 0; i--) {
                            const partialHistory = history.slice(0, i);
                            const pgnStr = historyToPgnString(partialHistory);
                            if (ecoData[pgnStr]) {
                                foundOpening = ecoData[pgnStr];
                                break;
                            }
                        }

                        if (foundOpening) {
                            const eco = foundOpening.e;
                            if (!openingStats[eco]) {
                                openingStats[eco] = { name: foundOpening.n, eco: eco, count: 0, white: 0, draw: 0, black: 0 };
                            }
                            openingStats[eco].count++;
                            
                            const whiteWon = (game.color === 'w' && playerPoints === 1) || (game.color === 'b' && playerPoints === 0);
                            
                            if (playerPoints === 0.5) {
                                openingStats[eco].draw++;
                            } else if (whiteWon) {
                                openingStats[eco].white++;
                            } else {
                                openingStats[eco].black++;
                            }
                        }
                    }
                } catch (e) { /* Игнорируем */ }
            } else {
                if(playerPoints === 0.5) drawTypes.other++;
            }
        });
    });

    let longestStreak = { player: null, streak: 0 };
    players.forEach(player => {
        const sortedGames = [...player.games].sort((a, b) => parseInt(a.round) - parseInt(b.round));
        let currentStreak = 0;
        for (const game of sortedGames) {
            if (getPointsFromResult(game.result) === 1) {
                currentStreak++;
            } else {
                if (currentStreak > longestStreak.streak) { longestStreak = { player, streak: currentStreak }; }
                currentStreak = 0;
            }
        }
        if (currentStreak > longestStreak.streak) { longestStreak = { player, streak: currentStreak }; }
    });

    const totalGames = whiteWins + blackWins + draws;
    const resultDistribution = {
        whiteWins, blackWins, draws,
        whiteWinPercent: totalGames > 0 ? Math.round((whiteWins / totalGames) * 100) : 0,
        blackWinPercent: totalGames > 0 ? Math.round((blackWins / totalGames) * 100) : 0,
        drawPercent: totalGames > 0 ? Math.round((draws / totalGames) * 100) : 0,
    };
    
    const bestPerformance = players.reduce((best, p) => { const perf = parseInt(p.details?.рейтинговый_перфоманс || 0, 10); if (perf > best.value) return { value: perf, player: p }; return best; }, { value: 0, player: null });
    const undefeatedPlayers = players.filter(p => !p.games.some(g => getPointsFromResult(g.result) === 0 && g.opponent_name !== 'bye')).map(p => ({ name: p.name, points: parseFloat(p.details?.очки?.replace(',', '.') || 0) })).sort((a,b) => b.points - a.points);
    
    // ИСПРАВЛЕНИЕ: Используем правильный объект openingStats
    const topOpenings = Object.values(openingStats)
      .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name))
      .slice(0, 10);

    const biggestOverperformer = players
      .filter(p => p.details?.рейтинговый_перфоманс && parseInt(p.details.рейтинговый_перфоманс) > 0)
      .map(p => ({ player: p, diff: parseInt(p.details.рейтинговый_перфоманс) - parseInt(p.rating) }))
      .sort((a, b) => b.diff - a.diff)[0];

    const mostDecisivePlayer = players
      .filter(p => p.games.filter(g => g.opponent_name !== 'bye' && g.result.trim() !== '').length > totalRounds / 2)
      .map(p => {
        const playedGames = p.games.filter(g => g.opponent_name !== 'bye' && g.result.trim() !== '').length;
        const draws = p.games.filter(g => getPointsFromResult(g.result) === 0.5).length;
        return { player: p, drawRate: playedGames > 0 ? (draws / playedGames) * 100 : 100 };
      })
      .sort((a, b) => a.drawRate - b.drawRate)[0];
    
    return { 
        totalPlayers, totalRounds, averageRating, biggestUpset, bestPerformance, undefeatedPlayers,
        resultDistribution,
        shortestGame: shortestGame.moves !== Infinity ? shortestGame : null,
        longestGame: longestGame.moves > 0 ? longestGame : null,
        averageMoveCount: gamesWithPgnCount > 0 ? Math.round(totalMoves / gamesWithPgnCount) : 0,
        longestStreak: longestStreak.streak > 1 ? longestStreak : null,
        topOpenings,
        totalCastles,
        totalPromotions,
        drawTypes,
        biggestOverperformer,
        mostDecisivePlayer,
    };
}