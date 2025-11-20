import { defineConfig, devices } from "@playwright/test";
import { config as loadEnv } from "dotenv";

// Load test environment variables from .env.test for the entire Playwright process
loadEnv({ path: ".env.test" });

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [["html"], ["junit", { outputFile: "test-results/junit.xml" }]],
  globalSetup: "./e2e/global-setup.ts",
  globalTeardown: "./e2e/global-teardown.ts",
  use: {
    baseURL: "http://localhost:3010",
    trace: "on-first-retry",
    screenshot: "only-on-failure",
  },

  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],

  webServer: {
    // Build with test mode so Vite/Astro load .env.test (and .env.test.local) instead of default/local envs
    // Use test config with Node adapter since Cloudflare adapter doesn't support preview
    command:
      "npm run build -- --config=astro.config.test.mjs && npm run preview -- --config=astro.config.test.mjs --port=3010",
    url: "http://localhost:3010",
    reuseExistingServer: !process.env.CI,
    // Ensure the preview server inherits the same env (for any runtime reads)
    env: process.env as Record<string, string>,
  },
});
