// src/services/tournamentApi.js
import { convertRusPgnToStd, matchPlayerNames } from '@/utils/pgn'

// ... (сюда переносятся функции loadAndParsePgnData)

export async function loadTournamentData() {
    const [tournamentData, pgnData, ecoData] = await Promise.all([
        fetch('data/tournament.json').then(res => res.json()),
        loadAndParsePgnData(),
        loadAndParseEcoData() // Эта функция теперь может быть в ecoApi.js
    ]);

    // ... (вся логика обогащения players, которая была в onMounted в useTournament.js) ...
    const enrichedPlayers = ...;

    return { title: tournamentData.title, enrichedPlayers, ecoData };
}