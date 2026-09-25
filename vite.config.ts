import { fileURLToPath } from 'node:url'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  server: {
    host: '127.0.0.1',
    proxy: {
      '/api': 'http://127.0.0.1:3000',
    },
  },
  test: {
    environment: 'jsdom',
    globals: true,
    // RTL-тесты под параллельной нагрузкой могут превышать дефолтные 5 c
    testTimeout: 15000,
    setupFiles: './src/test/setup.ts',
    // Exclude agent-skills repo content from project test discovery
    exclude: [
      'node_modules',
      'dist',
      '.git',
      '.agents/skills/**',
      'e2e/**',
    ],
    env: {
      // Пусто → server/db использует PGlite (WASM-Postgres) вместо Neon
      DATABASE_URL: '',
      // Ускоряет старт: PGlite инициализируется в одном потоке
      NODE_ENV: 'test',
    },
  },
})
