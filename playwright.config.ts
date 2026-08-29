import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  timeout: 30_000,
  expect: { timeout: 7_000 },
  fullyParallel: false,
  workers: 1,
  reporter: [['list'], ['html', { outputFolder: 'playwright-report', open: 'never' }]],
  use: {
    baseURL: 'http://127.0.0.1:4174',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    ...devices['Desktop Chrome'],
  },
  webServer: [
    {
      command: 'node tests/billing-fixture.mjs',
      url: 'http://127.0.0.1:4180/health',
      reuseExistingServer: false,
      timeout: 30_000,
    },
    {
      command: 'PORT=4174 STATIC_DIR=dist DATABASE_URL=sqlite://data/test-e2e.db BILLING_BASE_URL=http://127.0.0.1:4180 cargo run',
      url: 'http://127.0.0.1:4174/health',
      reuseExistingServer: false,
      timeout: 120_000,
    },
  ],
});
