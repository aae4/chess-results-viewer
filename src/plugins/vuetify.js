import 'vuetify/styles'
import { createVuetify } from 'vuetify'
import * as components from 'vuetify/components'
import * as directives from 'vuetify/directives'
import { aliases, mdi } from 'vuetify/iconsets/mdi'
import '@mdi/font/css/materialdesignicons.css'

// НОВАЯ ЦВЕТОВАЯ ПАЛИТРА
const customLightTheme = {
  dark: false,
  colors: {
    background: '#F7F8FA', // Слегка серый фон
    surface: '#FFFFFF',     // Белые карточки
    primary: '#0052CC',     // Глубокий синий
    secondary: '#091E42',
    error: '#DE350B',
    info: '#00B8D9',
    success: '#36B37E',
    warning: '#FFAB00',
    'on-surface': '#1A1D21', // Темный текст
  },
}

const customDarkTheme = {
  dark: true,
  colors: {
    background: '#12151C', // Очень темный фон
    surface: '#1E222B',     // Темно-серые карточки
    primary: '#2E86FF',     // Яркий синий
    secondary: '#B3D4FF',
    error: '#FF5630',
    info: '#79E2F2',
    success: '#57D9A3',
    warning: '#FFC400',
    'on-surface': '#E1E3E6', // Светлый текст
  },
}

export const vuetify = createVuetify({
  components,
  directives,
  icons: {
    defaultSet: 'mdi',
    aliases,
    sets: {
      mdi,
    },
  },
  // НАСТРОЙКА ТЕМЫ
  theme: {
    defaultTheme: 'light',
    themes: {
      light: customLightTheme,
      dark: customDarkTheme,
    },
  },
  // ГЛОБАЛЬНЫЕ НАСТРОЙКИ КОМПОНЕНТОВ
  defaults: {
    VCard: {
      rounded: 'lg', // Более скругленные углы для современного вида
      flat: true,      // Убираем тени по умолчанию
      border: true,    // Добавляем тонкую рамку
    },
    VBtn: {
      rounded: 'lg',
    },
    VTextField: {
      variant: 'outlined',
      density: 'comfortable',
    },
    VSelect: {
      variant: 'outlined',
      density: 'comfortable',
    },
    VDataTable: {
      density: 'comfortable',
    },
    VChip: {
      rounded: 'md',
    },
  },
  // НАСТРОЙКА ТИПОГРАФИКИ
  typography: {
    fontFamily: '"Inter", sans-serif',
  },
})