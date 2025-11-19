import { createDbWorker } from "sql.js-httpvfs";

const workerUrl = new URL("sql.js-httpvfs/dist/sqlite.worker.js", import.meta.url);
const wasmUrl = new URL("sql.js-httpvfs/dist/sql-wasm.wasm", import.meta.url);

const isGithubPages = location.hostname.endsWith("github.io");

const DB_URL = isGithubPages
  ? "https://raw.githubusercontent.com/aae4/chess-results-viewer/master/public/database.sqlite"
  : "/chess-results-viewer/database.sqlite";


async function createWorker() {
  const worker = await createDbWorker(
    [{
      from: "inline",
      config: {
        serverMode: "full",
        url: DB_URL,
        requestChunkSize: 4096,
        databaseLengthBytes: 5656576 // exact byte size of the SQLite file
      },
    }],
    workerUrl.toString(),
    wasmUrl.toString()
  );
  worker.db.query(`PRAGMA cache_size=-2048; PRAGMA temp_store=MEMORY;`);
  return worker.db;
}

let dbPromise = null;
const getDb = () => {
  if (!dbPromise) dbPromise = createWorker();
  return dbPromise;
};

/**
 * Выполняет SQL-запрос и возвращает результат в виде массива объектов.
 * @param {string} sql - SQL-запрос для выполнения.
 * @param {Array} params - Массив параметров для подстановки в запрос.
 * @returns {Promise<Array<Object>>} Массив объектов, представляющих строки результата.
 */
async function query(sql, params = []) {
  const db = await getDb();
  
  // Используем db.query(), который по умолчанию возвращает итератор объектов.
  const results = [];
  for (const row of await db.query(sql, params)) {
    results.push(row);
  }
  return results;
}

export const dbService = {
  /** Получить список всех турниров */
  getAllTournaments: () => query(`
    SELECT id, name, start_date FROM tournaments ORDER BY start_date DESC
  `),
  
  /** Получить полную информацию о турнире */
  getTournamentDetails: (id) => query(`
    SELECT * FROM tournaments WHERE id = ?
  `, [id]).then(res => res[0]),

  /** Получить итоговую таблицу (стендинги) для турнира */
  getTournamentStandings: (id) => query(`
    SELECT p.canonical_name as name, p.id as player_id, perf.* 
    FROM player_performances perf
    JOIN players p ON p.id = perf.player_id
    WHERE perf.tournament_id = ?
    ORDER BY perf.final_rank ASC, perf.score DESC
  `, [id]),
  
  /** Получить все партии для турнира */
  getTournamentGames: (tournamentId) => query(`
    SELECT 
      g.id, g.round, g.board, g.result, g.pgn_moves,
      wp.canonical_name as white_name, bp.canonical_name as black_name,
      wpf.rating_at_tournament as white_rating, bpf.rating_at_tournament as black_rating,
      wpf.player_id as white_player_id, bpf.player_id as black_player_id
    FROM games g
    JOIN player_performances wpf ON wpf.id = g.white_performance_id
    JOIN players wp ON wp.id = wpf.player_id
    LEFT JOIN player_performances bpf ON bpf.id = g.black_performance_id
    LEFT JOIN players bp ON bp.id = bpf.player_id
    WHERE g.tournament_id = ?
    ORDER BY CAST(g.round AS INTEGER), CAST(g.board AS INTEGER)
  `, [tournamentId]),

  /** Получить всех участников турнира */
  getTournamentParticipants: (tournamentId) => query(`
    SELECT p.id, p.canonical_name as name, p.fide_id, p.federation, perf.rating_at_tournament as rating, perf.starting_rank
    FROM player_performances perf
    JOIN players p ON p.id = perf.player_id
    WHERE perf.tournament_id = ?
    ORDER BY perf.starting_rank ASC
  `, [tournamentId]),

  /** Получить профиль одного игрока и его выступление в конкретном турнире */
  getPlayerProfileInTournament: (playerId, tournamentId) => query(`
    SELECT p.*, perf.*
    FROM players p
    JOIN player_performances perf ON p.id = perf.player_id
    WHERE p.id = ? AND perf.tournament_id = ?
  `, [playerId, tournamentId]).then(res => res[0]),

  /** Получить все партии игрока в рамках одного турнира */
  getPlayerGamesInTournament: (playerId, tournamentId) => query(`
    SELECT * FROM (
      -- Вариант 1: Игрок за БЕЛЫХ
      SELECT
        g.id, g.round, g.board, g.result, g.pgn_moves,
        'w' as color,
        -- Если черного нет (NULL), значит "Пропуск тура"
        COALESCE(bp.canonical_name, 'Пропуск тура') as opponent_name,
        bpf.rating_at_tournament as opponent_rating
      FROM games g
      JOIN player_performances wpf ON wpf.id = g.white_performance_id
      LEFT JOIN player_performances bpf ON bpf.id = g.black_performance_id
      LEFT JOIN players bp ON bp.id = bpf.player_id
      WHERE wpf.player_id = ? AND g.tournament_id = ?

      UNION ALL

      -- Вариант 2: Игрок за ЧЕРНЫХ
      SELECT
        g.id, g.round, g.board, g.result, g.pgn_moves,
        'b' as color,
        wp.canonical_name as opponent_name,
        wpf.rating_at_tournament as opponent_rating
      FROM games g
      JOIN player_performances bpf ON bpf.id = g.black_performance_id
      JOIN player_performances wpf ON wpf.id = g.white_performance_id
      JOIN players wp ON wp.id = wpf.player_id
      WHERE bpf.player_id = ? AND g.tournament_id = ?
    )
    ORDER BY CAST(round AS INTEGER) ASC
  `, [playerId, tournamentId, playerId, tournamentId]),

  /** Получить детали одной конкретной партии по ее ID */
  getGameDetails: (gameId) => query(`
    SELECT 
      g.id, g.round, g.board, g.result, g.pgn_moves, g.eco_code, g.is_technical,
      wp.canonical_name as white_name, bp.canonical_name as black_name,
      wpf.rating_at_tournament as white_rating, bpf.rating_at_tournament as black_rating,
      wp.id as white_player_id, bp.id as black_player_id,
      t.name as tournament_name
    FROM games g
    JOIN player_performances wpf ON wpf.id = g.white_performance_id
    JOIN players wp ON wp.id = wpf.player_id
    JOIN player_performances bpf ON bpf.id = g.black_performance_id
    JOIN players bp ON bp.id = bpf.player_id
    JOIN tournaments t ON t.id = g.tournament_id
    WHERE g.id = ?
  `, [gameId]).then(res => res[0]),

  /** Получить все данные, необходимые для построения кросс-таблицы. */
  getDataForCrosstable: (tournamentId) => query(`
    SELECT
      p.id as player_id,
      p.canonical_name as player_name,
      perf.starting_rank,
      g.round,
      g.result,
      g.board,
      g.id as game_id,
      g.is_technical,
      CASE WHEN g.black_performance_id IS NULL THEN 1 ELSE 0 END as is_bye,
      CASE WHEN wpf.player_id = p.id THEN 'w' ELSE 'b' END as color,
      CASE WHEN wpf.player_id = p.id THEN bp.canonical_name ELSE wp.canonical_name END as opponent_name,
      CASE WHEN wpf.player_id = p.id THEN bpf.player_id ELSE wpf.player_id END as opponent_player_id
    FROM players p
    JOIN player_performances perf ON p.id = perf.player_id
    LEFT JOIN games g ON (
      (g.white_performance_id = perf.id OR g.black_performance_id = perf.id) AND g.tournament_id = perf.tournament_id
    )
    LEFT JOIN player_performances wpf ON wpf.id = g.white_performance_id
    LEFT JOIN players wp ON wp.id = wpf.player_id
    LEFT JOIN player_performances bpf ON bpf.id = g.black_performance_id
    LEFT JOIN players bp ON bp.id = bpf.player_id
    WHERE perf.tournament_id = ?
  `, [tournamentId]),

  /** Получить все партии с ECO-кодами для статистики дебютов. */
  getGamesForStatistics: (tournamentId) => query(`
    SELECT 
      g.id,
      g.result,
      g.pgn_moves,
      g.eco_code,
      g.is_technical,
      wpf.rating_at_tournament as white_rating,
      bpf.rating_at_tournament as black_rating,
      wp.canonical_name as white_name,
      bp.canonical_name as black_name,
      wp.id as white_player_id,
      bp.id as black_player_id
    FROM games g
    JOIN player_performances wpf ON wpf.id = g.white_performance_id
    JOIN players wp ON wp.id = wpf.player_id
    JOIN player_performances bpf ON bpf.id = g.black_performance_id
    JOIN players bp ON bp.id = bpf.player_id
    WHERE g.tournament_id = ?
  `, [tournamentId]),

  /** Получить основную информацию об игроке по его ID */
  getPlayerGlobalProfile: (playerId) => query(`
    SELECT id, canonical_name, fide_id, federation, national_id FROM players WHERE id = ?
  `, [playerId]).then(res => res[0]),

  /** Получить всю турнирную историю игрока */
  getPlayerCareer: (playerId) => query(`
    SELECT
      t.id as tournament_id,
      t.name as tournament_name,
      t.start_date,
      perf.final_rank,
      perf.score,
      perf.performance_rating,
      perf.rating_at_tournament,
      perf.rating_change
    FROM player_performances perf
    JOIN tournaments t ON t.id = perf.tournament_id
    WHERE perf.player_id = ?
    ORDER BY t.start_date ASC
  `, [playerId]),

  /** Получить всех игроков с агрегированной статистикой (последний рейтинг, кол-во турниров) 
   * TODO: проверить что не используется и удалить*/
  getAllPlayersWithStats: () => query(`
    SELECT
      p.id,
      p.canonical_name,
      p.federation,
      (
        SELECT COUNT(perf.tournament_id)
        FROM player_performances perf
        WHERE perf.player_id = p.id
      ) as tournament_count,
      (
        SELECT perf.rating_at_tournament
        FROM player_performances perf
        JOIN tournaments t ON t.id = perf.tournament_id
        WHERE perf.player_id = p.id AND perf.rating_at_tournament IS NOT NULL
        ORDER BY t.start_date DESC
        LIMIT 1
      ) as latest_rating
    FROM players p
  `),

  /** Получить всех игроков с агрегированной статистикой */
  getAllPlayersWithStatsOptimized: () => query(`
    WITH LatestRating AS (
      -- Сначала находим последний рейтинг для каждого игрока с помощью оконной функции
      SELECT
        perf.player_id,
        perf.rating_at_tournament,
        -- Нумеруем турниры каждого игрока в порядке убывания даты
        ROW_NUMBER() OVER(PARTITION BY perf.player_id ORDER BY t.start_date DESC) as rn
      FROM player_performances perf
      JOIN tournaments t ON t.id = perf.tournament_id
      WHERE perf.rating_at_tournament IS NOT NULL
    )
    SELECT
      p.id,
      p.canonical_name,
      p.federation,
      -- Считаем турниры через LEFT JOIN и GROUP BY
      COUNT(DISTINCT pp.tournament_id) as tournament_count,
      -- Подключаем последний рейтинг, который мы уже нашли
      lr.rating_at_tournament as latest_rating
    FROM players p
    -- Присоединяем все выступления, чтобы посчитать их
    LEFT JOIN player_performances pp ON pp.player_id = p.id
    -- Присоединяем только последнее выступление (с rn = 1) для получения рейтинга
    LEFT JOIN LatestRating lr ON lr.player_id = p.id AND lr.rn = 1
    -- Группируем по игроку, чтобы агрегирующие функции (COUNT) работали корректно
    GROUP BY p.id, p.canonical_name, p.federation, lr.rating_at_tournament
  `),

  /** Получить статистику результативности против оппонентов разной силы */
  getPlayerOpponentStats: (playerId) => query(`
    WITH GameRatings AS (
      -- Часть 1: Игрок играет белыми
      SELECT
        g.result,
        'w' as player_color,
        wpf.rating_at_tournament as white_rating,
        bpf.rating_at_tournament as black_rating
      FROM games g
      JOIN player_performances wpf ON wpf.id = g.white_performance_id
      JOIN player_performances bpf ON bpf.id = g.black_performance_id
      WHERE wpf.player_id = ? AND g.result IN ('1-0', '0-1', '½-½')
      
      UNION ALL
      
      -- Часть 2: Игрок играет черными
      SELECT
        g.result,
        'b' as player_color,
        wpf.rating_at_tournament as white_rating,
        bpf.rating_at_tournament as black_rating
      FROM games g
      JOIN player_performances bpf ON bpf.id = g.black_performance_id
      JOIN player_performances wpf ON wpf.id = g.white_performance_id
      WHERE bpf.player_id = ? AND g.result IN ('1-0', '0-1', '½-½')
    )
    SELECT
      CASE
        WHEN (player_color = 'w' AND white_rating > black_rating + 25) OR (player_color = 'b' AND black_rating > white_rating + 25) THEN 'vs_weaker'
        WHEN (player_color = 'w' AND white_rating < black_rating - 25) OR (player_color = 'b' AND black_rating < white_rating - 25) THEN 'vs_stronger'
        ELSE 'vs_equal'
      END as opponent_category,
      SUM(CASE WHEN (player_color = 'w' AND result = '1-0') OR (player_color = 'b' AND result = '0-1') THEN 1 ELSE 0 END) as wins,
      SUM(CASE WHEN result = '½-½' THEN 1 ELSE 0 END) as draws,
      SUM(CASE WHEN (player_color = 'w' AND result = '0-1') OR (player_color = 'b' AND result = '1-0') THEN 1 ELSE 0 END) as losses
    FROM GameRatings
    GROUP BY opponent_category
  `, [playerId, playerId]),
  
  /** Получить статистику по дебютам за всю карьеру */
  getPlayerOpeningStats: (playerId) => query(`
    SELECT
      eco_code,
      player_color,
      COUNT(*) as games_count,
      SUM(CASE WHEN result = '½-½' THEN 1 ELSE 0 END) as draws,
      SUM(CASE 
        WHEN (player_color = 'w' AND result = '1-0') OR (player_color = 'b' AND result = '0-1') THEN 1 
        ELSE 0 
      END) as wins
    FROM (
      -- Часть 1: Белые
      SELECT g.eco_code, 'w' as player_color, g.result
      FROM games g
      JOIN player_performances wpf ON wpf.id = g.white_performance_id
      WHERE wpf.player_id = ? AND g.eco_code IS NOT NULL
      
      UNION ALL
      
      -- Часть 2: Черные
      SELECT g.eco_code, 'b' as player_color, g.result
      FROM games g
      JOIN player_performances bpf ON bpf.id = g.black_performance_id
      WHERE bpf.player_id = ? AND g.eco_code IS NOT NULL
    ) as all_games
    GROUP BY eco_code, player_color
  `, [playerId, playerId]),

  /** Получить статистику H2H против всех соперников */
  getPlayerHeadToHead: (playerId) => query(`
    SELECT
      opponent_id,
      opponent_name,
      COUNT(*) as total_games,
      SUM(CASE WHEN (player_color = 'w' AND result = '1-0') OR (player_color = 'b' AND result = '0-1') THEN 1 ELSE 0 END) as wins,
      SUM(CASE WHEN result = '½-½' or result='1/2-1/2' THEN 1 ELSE 0 END) as draws,
      SUM(CASE WHEN (player_color = 'w' AND result = '0-1') OR (player_color = 'b' AND result = '1-0') THEN 1 ELSE 0 END) as losses
    FROM (
      -- Часть 1: Белые (Соперник - черный)
      SELECT 
        bp.id as opponent_id, bp.canonical_name as opponent_name, 'w' as player_color, g.result
      FROM games g
      JOIN player_performances wpf ON wpf.id = g.white_performance_id
      JOIN player_performances bpf ON bpf.id = g.black_performance_id
      JOIN players bp ON bp.id = bpf.player_id
      WHERE wpf.player_id = ? AND g.result IN ('1-0', '0-1', '½-½', '1/2-1/2')
      
      UNION ALL
      
      -- Часть 2: Черные (Соперник - белый)
      SELECT 
        wp.id as opponent_id, wp.canonical_name as opponent_name, 'b' as player_color, g.result
      FROM games g
      JOIN player_performances bpf ON bpf.id = g.black_performance_id
      JOIN player_performances wpf ON wpf.id = g.white_performance_id
      JOIN players wp ON wp.id = wpf.player_id
      WHERE bpf.player_id = ? AND g.result IN ('1-0', '0-1', '½-½', '1/2-1/2')
    ) as combined
    GROUP BY opponent_id, opponent_name
    ORDER BY total_games DESC, opponent_name ASC
  `, [playerId, playerId]),

  /**
   * Получить все игры игрока с детальной информацией для глубокой аналитики.
   */
  getPlayerGamesForAnalytics: (playerId) => query(`
    -- Часть 1: Игрок играл БЕЛЫМИ
    SELECT
      g.id as game_id,
      t.id as tournament_id,
      g.result,
      CAST(g.round AS INTEGER) as round,
      t.rounds_count,
      'w' as player_color,
      bpf.rating_at_tournament as opponent_rating, -- Соперник - черный
      bp.canonical_name as opponent_name         -- Имя соперника
    FROM games g
    JOIN player_performances wpf ON wpf.id = g.white_performance_id
    JOIN tournaments t ON t.id = g.tournament_id
    -- Нам нужны данные только черного (соперника), данные белого (наши) фильтруем по ID
    JOIN player_performances bpf ON bpf.id = g.black_performance_id
    JOIN players bp ON bp.id = bpf.player_id
    WHERE wpf.player_id = ? 
      AND g.result IN ('1-0', '0-1', '½-½', '1/2-1/2')

    UNION ALL

    -- Часть 2: Игрок играл ЧЕРНЫМИ
    SELECT
      g.id as game_id,
      t.id as tournament_id,
      g.result,
      CAST(g.round AS INTEGER) as round,
      t.rounds_count,
      'b' as player_color,
      wpf.rating_at_tournament as opponent_rating, -- Соперник - белый
      wp.canonical_name as opponent_name         -- Имя соперника
    FROM games g
    JOIN player_performances bpf ON bpf.id = g.black_performance_id
    JOIN tournaments t ON t.id = g.tournament_id
    -- Нам нужны данные только белого (соперника)
    JOIN player_performances wpf ON wpf.id = g.white_performance_id
    JOIN players wp ON wp.id = wpf.player_id
    WHERE bpf.player_id = ?
      AND g.result IN ('1-0', '0-1', '½-½', '1/2-1/2')
  `, [playerId, playerId]),

  /** 
   * Находит следующую игру для конкретного игрока.
   * Ищет записи в таблице games, где результат пуст (NULL или ''),
   * но пары уже сформированы.
   */
  getPlayerNextGame: (playerId) => query(`
    SELECT * FROM (
      -- Вариант 1: Я за белых
      SELECT
        g.id as game_id,
        t.id as tournament_id,
        t.name as tournament_name,
        t.time_control,
        g.round,
        g.board,
        g.game_date,
        'w' as color,
        COALESCE(bp.canonical_name, 'Пропуск тура') as opponent_name,
        bpf.player_id as opponent_id,
        bpf.rating_at_tournament as opponent_rating,
        t.start_date,
        CAST(g.round AS INTEGER) as round_num
      FROM games g
      JOIN tournaments t ON t.id = g.tournament_id
      JOIN player_performances wpf ON wpf.id = g.white_performance_id
      -- Соперник (черные) может отсутствовать (LEFT JOIN)
      LEFT JOIN player_performances bpf ON bpf.id = g.black_performance_id
      LEFT JOIN players bp ON bp.id = bpf.player_id
      WHERE wpf.player_id = ? AND (g.result IS NULL OR g.result = '')

      UNION ALL

      -- Вариант 2: Я за черных
      SELECT
        g.id as game_id,
        t.id as tournament_id,
        t.name as tournament_name,
        t.time_control,
        g.round,
        g.board,
        g.game_date,
        'b' as color,
        wp.canonical_name as opponent_name,
        wpf.player_id as opponent_id,
        wpf.rating_at_tournament as opponent_rating,
        t.start_date,
        CAST(g.round AS INTEGER) as round_num
      FROM games g
      JOIN tournaments t ON t.id = g.tournament_id
      JOIN player_performances bpf ON bpf.id = g.black_performance_id
      -- Соперник (белые) всегда есть, если я черный
      JOIN player_performances wpf ON wpf.id = g.white_performance_id
      JOIN players wp ON wp.id = wpf.player_id
      WHERE bpf.player_id = ? AND (g.result IS NULL OR g.result = '')
    )
    ORDER BY start_date DESC, round_num ASC
    LIMIT 1
  `, [playerId, playerId]).then(res => res[0]),

  /** 
   * Находит самый релевантный "текущий" турнир по трехуровневой логике.
   * Приоритет: 1. Идет сейчас -> 2. Скоро начнется -> 3. Недавно завершился.
   */
  getCurrentTournament: (todayDate) => query(`
    SELECT * FROM (
      -- Приоритет 1: Турнир идет прямо сейчас
      SELECT *, 1 as priority, 'live' as status
      FROM tournaments
      WHERE ? BETWEEN start_date AND end_date
      LIMIT 1
    )
    UNION ALL
    SELECT * FROM (
      -- Приоритет 2: Ближайший предстоящий турнир
      SELECT *, 2 as priority, 'upcoming' as status
      FROM tournaments
      WHERE start_date > ?
      ORDER BY start_date ASC
      LIMIT 1
    )
    UNION ALL
    SELECT * FROM (
      -- Приоритет 3: Самый последний завершившийся турнир
      SELECT *, 3 as priority, 'recent' as status
      FROM tournaments
      WHERE end_date < ?
      ORDER BY end_date DESC
      LIMIT 1
    )
    ORDER BY priority ASC
    LIMIT 1
  `, [todayDate, todayDate, todayDate]).then(res => res[0]),

  /** Находит самый последний ЗАВЕРШЕННЫЙ турнир */
  getLatestFinishedTournament: (todayDate) => query(`
    SELECT id, name
    FROM tournaments
    WHERE end_date < ?
    ORDER BY end_date DESC
    LIMIT 1
  `, [todayDate]).then(res => res[0]),

  /** Находит топ-3 игроков для указанного турнира */
  getTournamentPodium: (tournamentId) => query(`
    SELECT p.id as player_id, p.canonical_name, perf.final_rank
    FROM player_performances perf
    JOIN players p ON p.id = perf.player_id
    WHERE perf.tournament_id = ? AND perf.final_rank IN (1, 2, 3)
    ORDER BY perf.final_rank ASC
  `, [tournamentId]),

  /**
   * Получает последние сыгранные партии из турнира.
   * @param {number} tournamentId - ID турнира.
   * @param {number} limit - Количество партий для возврата.
   * @returns {Promise<Array>} - Массив объектов партий.
   */
  getRecentGames: (tournamentId, limit = 5) => {
    return query(`
      SELECT
        g.id,
        g.result,
        g.board,
        g.round,
        white_player.canonical_name AS white_player_name,
        black_player.canonical_name AS black_player_name,
        pp_white.rating_at_tournament as white_rating,
        pp_black.rating_at_tournament as black_rating
      FROM games AS g
      JOIN player_performances AS pp_white ON g.white_performance_id = pp_white.id
      JOIN players AS white_player ON pp_white.player_id = white_player.id
      JOIN player_performances AS pp_black ON g.black_performance_id = pp_black.id
      JOIN players AS black_player ON pp_black.player_id = black_player.id
      WHERE g.tournament_id = ? 
      AND g.result is not null
      AND g.pgn_moves is not null
      ORDER BY 
        CAST(g.round AS INTEGER) DESC, -- Сортируем по номеру тура (сначала последние)
        g.id DESC                      -- В рамках одного тура, последние добавленные партии будут первыми
      LIMIT ?
    `, [tournamentId, limit])
    .then(games => games.map(game => ({
      // Трансформируем плоский результат SQL в удобную вложенную структуру для фронтенда
      id: game.id,
      result: game.result,
      round: game.round,
      board: game.board,
      white_player: { name: game.white_player_name, rating: game.white_rating },
      black_player: { name: game.black_player_name, rating: game.black_rating }
    })));
  },

  /**
   * Находит самый последний запланированный тур и, если он еще не прошел, показывает его.
   * @param {number} tournamentId - ID турнира.
   * @returns {Promise<Object>} - Объект с информацией о следующем туре.
   */
  getNextRoundInfo: async (tournamentId) => {
    // Шаг 1: Находим одну единственную игру с самым большим номером тура.
    const lastRoundGame = await query(`
      SELECT round, game_date
      FROM games
      WHERE tournament_id = ?
      ORDER BY CAST(round AS INTEGER) DESC
      LIMIT 1
    `, [tournamentId]).then(res => res[0]);

    // Если игр в турнире еще нет, возвращаем заглушку.
    if (!lastRoundGame) {
      return {
        name: 'Следующий тур',
        date: 'Информация скоро появится',
        time: ''
      };
    }

    // Шаг 2: Сравниваем дату найденной игры с сегодняшним днем.
    const gameDate = new Date(lastRoundGame.game_date);
    const today = new Date();
    
    // Убираем время из 'сегодня', чтобы корректно сравнивать только даты.
    today.setHours(0, 0, 0, 0);

    // Если дата игры - сегодня или в будущем, значит, это и есть анонс.
    if (gameDate >= today) {
      return {
        name: `${lastRoundGame.round}-й тур`,
        date: gameDate.toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit', year: 'numeric' }),
        time: '(согласно расписанию)'
      };
    }
    
    // Шаг 3: Если дата последней игры уже в прошлом, значит, анонса пока нет.
    return {
      name: 'Турнир завершен',
      date: '',
      time: ''
    };
  },

};