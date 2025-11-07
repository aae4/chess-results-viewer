import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { fileURLToPath, URL } from 'node:url'

// Замените 'chess-results-viewer' на НАЗВАНИЕ ВАШЕГО РЕПОЗИТОРИЯ на GitHub
const repoName = 'chess-results-viewer';

export default defineConfig({
  // Указываем базовый путь для сборки
  base: `/${repoName}/`,
  plugins: [vue()],
  // vueDevTools(),
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    }
  }
})