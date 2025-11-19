import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { fileURLToPath, URL } from 'node:url'

const repoName = 'chess-results-viewer';

export default defineConfig({
  base: `/${repoName}/`,
  plugins: [vue()],
  // vueDevTools(),
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    }
  }
})