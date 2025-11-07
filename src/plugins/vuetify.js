import 'vuetify/styles'
import { createVuetify } from 'vuetify'
import * as components from 'vuetify/components'
import * as directives from 'vuetify/directives'
import { aliases, mdi } from 'vuetify/iconsets/mdi'
import '@mdi/font/css/materialdesignicons.css' 

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
  defaults: {
    global: {
      density: 'comfortable',
    },
    VCard: {
      elevation: 2,
    },
    VTable: {
      density: 'default',
    }
  },
  theme: {
    defaultTheme: 'light',
    themes: {
      light: {
        dark: false,
        colors: {
          primary: '#1976D2',
          secondary: '#424242',
          accent: '#82B1FF',
          background: '#F5F5F5',
          surface: '#FFFFFF',
        }
      },
      dark: {
        dark: true,
        colors: {
          primary: '#64B5F6',
          secondary: '#757575',
          background: '#121212',
          surface: '#1E1E1E',
        }
      }
    }
  }
})