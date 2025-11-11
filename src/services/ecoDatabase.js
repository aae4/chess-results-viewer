// src/services/ecoDatabase.js

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

// "Ленивая" загрузка с кэшированием
let ecoPromise = null;

export async function getEcoDatabase() {
  if (ecoPromise) {
    return ecoPromise;
  }
  
  ecoPromise = new Promise(async (resolve, reject) => {
    try {
      const files = ['a.tsv', 'b.tsv', 'c.tsv', 'd.tsv', 'e.tsv'];
      const promises = files.map(file => fetch(`/chess-results-viewer/data/${file}`).then(res => res.text()));
      const tsvTexts = await Promise.all(promises);
      const databases = tsvTexts.map(text => parseEcoTsv(text));
      const finalDb = Object.assign({}, ...databases);
      resolve(finalDb);
    } catch (error) {
      console.error("Ошибка при загрузке базы дебютов ECO:", error);
      reject(error);
    }
  });
  
  return ecoPromise;
}