import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  testDir: './e2e/tests',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: process.env.CI ? 'github' : 'html',
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: false,
    timeout: 120 * 1000,
    env: {
      NODE_ENV: 'test',
      USE_MOCK_DATA: 'true',
      DATABASE_URL: 'postgresql://test:test@localhost:5432/test?schema=public',
      DIRECT_URL: 'postgresql://test:test@localhost:5432/test?schema=public',
      OPENAI_API_KEY: 'sk-test-placeholder',
      GITHUB_TOKEN: 'ghp_test_placeholder',
      ADMIN_SECRET: 'test-admin-secret',
      CRON_SECRET: 'test-cron-secret',
    },
  },
})
