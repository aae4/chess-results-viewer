import { createDbWorker } from "sql.js-httpvfs";

const workerUrl = new URL("sql.js-httpvfs/dist/sqlite.worker.js", import.meta.url);
const wasmUrl = new URL("sql.js-httpvfs/dist/sql-wasm.wasm", import.meta.url);

const isGithubPages = location.hostname.endsWith("github.io");

const DB_URL = isGithubPages
  ? "https://raw.githubusercontent.com/aae4/chess-results-viewer/multitournament_with_db/public/database.sqlite"
  : "/chess-results-viewer/database.sqlite";


async function createWorker() {
  const worker = await createDbWorker(
    [{
      from: "inline",
      config: {
        serverMode: "full",
        url: DB_URL,
        requestChunkSize: 4096,
        databaseLengthBytes: 5652480 // exact byte size of the SQLite file
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
// async function query(sql, params = []) {
//   const db = await getDb();
  
//   // 1. СНАЧАЛА дожидаемся выполнения асинхронной операции db.exec()
//   const queryResultSets = await db.exec(sql, params, { rowMode: 'object' });

//   // 2. ТОЛЬКО ПОТОМ работаем с полученным результатом
//   const results = [];
//   if (queryResultSets && queryResultSets.length > 0) {
//     // db.exec может вернуть несколько наборов результатов, если в запросе было несколько команд.
//     // Мы объединяем их все в один массив.
//     for (const resultSet of queryResultSets) {
//       if (resultSet.values) {
//         results.push(...resultSet.values);
//       }
//     }
//   }
//   return results;
// }
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
    JOIN player_performances bpf ON bpf.id = g.black_performance_id
    JOIN players bp ON bp.id = bpf.player_id
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
    SELECT
      g.id, g.round, g.board, g.result, g.pgn_moves,
      CASE WHEN wpf.player_id = ? THEN 'w' ELSE 'b' END as color,
      CASE WHEN wpf.player_id = ? THEN bp.canonical_name ELSE wp.canonical_name END as opponent_name,
      CASE WHEN wpf.player_id = ? THEN bpf.rating_at_tournament ELSE wpf.rating_at_tournament END as opponent_rating
    FROM games g
    JOIN player_performances wpf ON wpf.id = g.white_performance_id
    JOIN players wp ON wp.id = wpf.player_id
    JOIN player_performances bpf ON bpf.id = g.black_performance_id
    JOIN players bp ON bp.id = bpf.player_id
    WHERE (wpf.player_id = ? OR bpf.player_id = ?) AND g.tournament_id = ?
    ORDER BY CAST(g.round AS INTEGER)
  `, [playerId, playerId, playerId, playerId, playerId, tournamentId]),

  /** Получить детали одной конкретной партии по ее ID */
  getGameDetails: (gameId) => query(`
    SELECT 
      g.id, g.round, g.board, g.result, g.pgn_moves,
      wp.canonical_name as white_name, bp.canonical_name as black_name,
      wpf.rating_at_tournament as white_rating, bpf.rating_at_tournament as black_rating,
      wp.id as white_player_id, bp.id as black_player_id
    FROM games g
    JOIN player_performances wpf ON wpf.id = g.white_performance_id
    JOIN players wp ON wp.id = wpf.player_id
    JOIN player_performances bpf ON bpf.id = g.black_performance_id
    JOIN players bp ON bp.id = bpf.player_id
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
};