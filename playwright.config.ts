import { defineConfig, devices } from '@playwright/test'

// E2E гоняется против собранного приложения: Fastify отдаёт dist/ и /api на одном origin.
// БД — in-memory, поэтому каждый прогон начинается с чистого состояния.
export default defineConfig({
  testDir: './e2e',
  fullyParallel: false,
  workers: 1,
  timeout: 30_000,
  expect: { timeout: 10_000 },
  reporter: [['list']],
  use: {
    baseURL: 'http://127.0.0.1:3100',
    trace: 'on-first-retry',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: {
    command: 'npm run build && npm start',
    url: 'http://127.0.0.1:3100/health',
    env: {
      PORT: '3100',
      DATABASE_PATH: ':memory:',
      NODE_ENV: 'test',
    },
    reuseExistingServer: false,
    timeout: 180_000,
  },
})
