// src/services/dataLoader.js
import { convertRusPgnToStd, matchPlayerNames } from '@/utils/pgn';

async function loadAndParsePgnData() {
    try {
        const response = await fetch('data/games.txt');
        if (!response.ok) throw new Error('Network response was not ok for data/games.txt');
        const text = await response.text();
        const games = [];
        const gameBlocks = text.split(/\n\s*\n/); // Более надежный сплиттер
        for (const block of gameBlocks) {
            if (!block.trim()) continue;
            const lines = block.split('\n').filter(l => l.trim() !== '');
            if (lines.length < 2) continue;
            const playersLine = lines.find(l => l.includes(' - '));
            if (!playersLine) continue;
            
            const [white, black] = playersLine.split(' - ').map(name => name.trim());
            const pgnStartIndex = lines.findIndex(l => l.match(/^\d{1,3}\.\s/));
            if (pgnStartIndex === -1) continue;
            
            const pgnText = lines.slice(pgnStartIndex).join(' ').trim();
            games.push({ white, black, pgn: convertRusPgnToStd(pgnText) });
        }
        return games;
    } catch (error) {
        console.error("Error loading PGN data:", error);
        return [];
    }
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

export async function loadTournamentData() {
    const [tournamentData, pgnData, ecoData] = await Promise.all([
        fetch('data/tournament.json').then(res => res.json()),
        loadAndParsePgnData(),
        loadAndParseEcoData()
    ]);

    const enrichedPlayers = (tournamentData.players || []).map(player => {
        const games = player.games.map(game => {
            const opponent = tournamentData.players.find(p => p.start_no === game.opponent_start_no);
            if (!opponent) {
                // Если нет оппонента (например, bye), просто конвертируем PGN если он есть
                return game.pgn ? { ...game, pgn: convertRusPgnToStd(game.pgn) } : game;
            }

            const pgnRecord = pgnData.find(p =>
                (matchPlayerNames(player.name, p.white) && matchPlayerNames(opponent.name, p.black)) ||
                (matchPlayerNames(player.name, p.black) && matchPlayerNames(opponent.name, p.white))
            );

            let finalPgn = null;
            if (pgnRecord && pgnRecord.pgn) {
                finalPgn = pgnRecord.pgn;
            } else if (game.pgn) {
                finalPgn = convertRusPgnToStd(game.pgn);
            }
            return { ...game, pgn: finalPgn };
        });
        return { ...player, games };
    });

    return { title: tournamentData.title, enrichedPlayers, ecoData };
}