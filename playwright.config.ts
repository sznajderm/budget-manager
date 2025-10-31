import { defineConfig, devices } from '@playwright/test';
import { config as loadEnv } from 'dotenv';

// Load test environment variables from .env.test for the entire Playwright process
loadEnv({ path: '.env.test' });

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [
    ['html'],
    ['junit', { outputFile: 'test-results/junit.xml' }],
  ],
  globalSetup: './e2e/global-setup.ts',
  globalTeardown: './e2e/global-teardown.ts',
  use: {
    baseURL: 'http://localhost:3010',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],

  webServer: {
    command: 'npm run build && npm run preview -- --port=3010',
    url: 'http://localhost:3010',
    reuseExistingServer: !process.env.CI,
    // Ensure the preview server inherits the same env (including DB env from .env.test)
    env: process.env as Record<string, string>,
  },
});
