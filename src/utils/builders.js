// src/utils/builders.js
import { getPointsFromResult, formatPlayerResult } from './formatters';

/**
 * Строит структуру данных для кросс-таблицы на основе "сырых" данных из БД.
 * @param {Array} rawData - Результат запроса dbService.getDataForCrosstable.
 * @param {number} roundsCount - Общее количество туров в турнире.
 * @returns {Array} - Отсортированный массив данных для отображения.
 */
export function buildCrosstable(rawData, roundsCount) {
  if (!rawData || rawData.length === 0) return [];

  const playersMap = new Map();

  // 1. Группируем все данные по игрокам
  rawData.forEach(row => {
    if (!playersMap.has(row.player_id)) {
      playersMap.set(row.player_id, {
        player_id: row.player_id,
        player_name: row.player_name,
        starting_rank: row.starting_rank,
        results: new Array(roundsCount).fill(null),
        games: [],
        totalPoints: 0,
      });
    }
    playersMap.get(row.player_id).games.push(row);
  });
  
  // 2. Обрабатываем игры для каждого игрока
  playersMap.forEach(player => {
    let totalPoints = 0;
    player.games.forEach(game => {
      if (!game.round) return;
      
      const roundIndex = parseInt(game.round) - 1;
      const points = getPointsFromResult(formatPlayerResult(game.result, game.color));
      
      if (points !== null) {
        totalPoints += points;
      }
      
      // Находим стартовый номер оппонента (он уже есть в playersMap)
      const opponent = playersMap.get(game.opponent_player_id);
      
      player.results[roundIndex] = {
        points: points,
        color: game.color,
        opponent_name: game.opponent_name,
        opponent_starting_rank: opponent?.starting_rank || '?',
        game_id: game.game_id,
        is_technical: game.is_technical,
        is_bye: game.is_bye,
      };
    });
    player.totalPoints = totalPoints;
  });

  // 3. Конвертируем карту в массив и сортируем
  const result = Array.from(playersMap.values());
  return result.sort((a, b) => {
    if (b.totalPoints !== a.totalPoints) {
      return b.totalPoints - a.totalPoints;
    }
    return a.starting_rank - b.starting_rank;
  });
}