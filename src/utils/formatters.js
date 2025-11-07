// src/utils/formatters.js

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

export const formatResult = (resultStr) => {
  if (!resultStr) return '*';
  if (resultStr.includes('1-0') || resultStr === '1' || resultStr.includes('+')) return '1-0';
  if (resultStr.includes('0-1') || resultStr === '0' || resultStr.includes('-')) return '0-1';
  if (resultStr.includes('½') || resultStr.includes('1/2')) return '½-½';
  return resultStr;
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