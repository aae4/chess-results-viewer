// src/utils/formatters.js

/**
 * Показывает результат партии с точки зрения конкретного игрока.
 * @param {string} resultStr - Канонический результат ('1-0', '0-1', '½-½').
 * @param {string} playerColor - Цвет игрока ('w' или 'b').
 * @returns {string} - '1' для победы, '0' для поражения, '½' для ничьи.
 */
export function formatPlayerResult(resultStr, playerColor) {
  const result = formatResult(resultStr); // Приводим к каноническому виду
  if (result === "*") return '*';
  if (result === '½-½') return '½';
  if (playerColor === 'w') {
    return result === '1-0' ? '1' : '0';
  }
  if (playerColor === 'b') {
    return result === '0-1' ? '1' : '0';
  }
  return '*'; // В случае ошибки
}

/**
 * Приводит любой формат результата к каноническому виду (1-0, 0-1, ½-½).
 * @param {string} resultStr - Строка с результатом.
 * @returns {string} - Каноническая строка результата.
 */
export function formatResult(resultStr) {
  if (!resultStr) return '*';
  const str = resultStr.trim();
  if (str.includes('1-0') || str === '1') return '1-0';
  if (str.includes('0-1') || str === '0') return '0-1';
  if (str.includes('½') || str.includes('1/2')) return '½-½';
  return str; // Возвращаем как есть, если формат неизвестен
}

/**
 * Преобразует SAN-нотацию хода, заменяя букву фигуры на Unicode-символ.
 * @param {object} move - Объект хода из chess.js history({ verbose: true }).
 * @returns {string} - Отформатированная строка хода с фигуркой.
 */
export function formatSanWithFigurine(move) {
  if (!move || !move.san) return '';
  
  // Карта фигур
  const figurines = {
    p: '♙', n: '♘', b: '♗', r: '♖', q: '♕', k: '♔'
  };

  // Получаем букву фигуры из verbose-объекта
  const piece = move.piece;
  
  // Если это не пешечный ход (т.е. SAN начинается с заглавной буквы)
  if (move.san.charAt(0) >= 'A' && move.san.charAt(0) <= 'Z') {
    // Заменяем первую букву на соответствующую фигурку
    return (figurines[piece] || '') + move.san.slice(1);
  }
  
  // Иначе это ход пешкой или рокировка, возвращаем как есть
  return move.san;
}

export function getPointsFromResult(resultStr) {
    if (!resultStr || resultStr.trim() === '') {
        return null;
    }
    if (resultStr.includes('1') && !resultStr.includes('½') && !resultStr.includes('1/2')) return 1;
    if (resultStr.includes('½') || resultStr.includes('1/2')) return 0.5;
    if (resultStr.includes('+')) return 1;
    if (resultStr.includes('0')) return 0;
    if (resultStr.includes('-')) return 0;
    return null;
}

export const getInitials = (name) => {
  if (!name) return '';
  const parts = name.replace(',', '').split(' ');
  if (parts.length > 1) {
    return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  }
  return parts[0][0].toUpperCase();
};

export const getColorIcon = (color) => {
  return color === 'w' ? 'mdi-circle-outline' : 'mdi-circle';
};

export const getResultColor = (points) => {
  if (points === 1) return 'success';
  if (points === 0.5) return 'grey';
  if (points === 0) return 'error';
  return 'grey-lighten-2';
}

export const getResultSymbol = (points) => {
  if (points === 1) return '+';
  if (points === 0.5) return '=';
  if (points === 0) return '-';
  return '';
}