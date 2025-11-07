// src/utils/pgn.js

export function convertRusPgnToStd(rusPgn) {
    if (!rusPgn) return '';
    let stdPgn = rusPgn
        .replace(/Кр/g, 'K').replace(/Ф/g, 'Q').replace(/Л/g, 'R')
        .replace(/С/g, 'B').replace(/К/g, 'N');
    const moveTextIndex = stdPgn.search(/\s*1\.\s/);
    if (moveTextIndex !== -1) {
        stdPgn = stdPgn.substring(moveTextIndex).trim();
    } else {
        stdPgn = stdPgn.replace(/\[.*?\]/g, '').trim();
    }
    return stdPgn
        .replace(/\[1:0\]/g, '1-0').replace(/\[0:1\]/g, '0-1')
        .replace(/Ѕ:Ѕ/g, '1/2-1/2').replace(/\[(1\/2|½)-(1\/2|½)\]/g, '1/2-1/2')
        .replace(/- 0K/g, '0-1').trim();
}

export function matchPlayerNames(jsonName, pgnName) {
    if (!jsonName || !pgnName) return false;
    const jsonParts = jsonName.replace(',', '').split(' ').filter(Boolean);
    const pgnParts = pgnName.split(' ').filter(Boolean);
    if (pgnParts.length < 1 || jsonParts.length < 1) return false;
    if (jsonParts.length > 1 && pgnParts.length > 1) {
        // Сравниваем "Фамилия И" с "Фамилия Имя"
        return jsonParts[0] === pgnParts[0] && jsonParts[1].startsWith(pgnParts[1][0]);
    }
    // Если где-то только фамилия
    return jsonParts[0] === pgnParts[0];
}