import { getPointsFromResult } from './formatters';

/**
 * Строит структуру данных для кросс-таблицы на основе списка игроков и туров.
 * Эта функция является "чистой" - она не зависит от реактивности и не изменяет внешние данные.
 * @param {Array} players - Массив объектов игроков.
 * @param {Array} roundsList - Массив номеров туров ( [1, 2, 3...] ).
 * @returns {Array} - Отсортированный массив данных для кросс-таблицы.
 */
export function buildCrosstableData(players, roundsList) {
  if (!players || players.length === 0) return [];

  const crosstable = players.map(player => {
    const playerResults = {
      name: player.name,
      start_no: player.start_no,
      results: [],
      totalPoints: 0,
    };
    let totalPoints = 0;

    // Итерируемся по номерам туров, чтобы гарантировать правильную длину массива results
    for (let i = 0; i < roundsList.length; i++) {
      const roundNum = roundsList[i];
      const game = player.games.find(g => parseInt(g.round) === roundNum);

      if (game && game.result !== undefined && game.result.trim() !== '' && game.opponent_start_no) {
        const points = getPointsFromResult(game.result);
        if (points !== null) {
          totalPoints += points;
        }
        
        const opponent = players.find(p => p.start_no === game.opponent_start_no);

        // Помещаем результат в массив по индексу (roundNum - 1)
        playerResults.results[roundNum - 1] = {
          points: points,
          color: game.color,
          opponent_start_no: game.opponent_start_no,
          opponent_name: opponent?.name || game.opponent_name,
          board: game.board,
        };
      } else {
        // Если игры нет, вставляем null, чтобы сохранить порядок
        playerResults.results[roundNum - 1] = null;
      }
    }
    playerResults.totalPoints = totalPoints;
    return playerResults;
  });

  // Сортируем итоговый массив
  return crosstable.sort((a, b) => 
    b.totalPoints - a.totalPoints || parseInt(a.start_no, 10) - parseInt(b.start_no, 10)
  );
}