import { defineConfig, devices } from "@playwright/test";
import { loadEnvConfig } from "@next/env";
import { getTursoConfig } from "./db/config";

loadEnvConfig(process.cwd());
const testDatabase = getTursoConfig({
  TURSO_DATABASE_URL: process.env.TEST_TURSO_DATABASE_URL,
  TURSO_AUTH_TOKEN: process.env.TEST_TURSO_AUTH_TOKEN,
});
if (testDatabase.url === process.env.TURSO_DATABASE_URL) {
  throw new Error("Browser tests require a separate Turso database.");
}

export default defineConfig({
  testDir: "./tests/e2e",
  globalSetup: "./scripts/test-db-setup.ts",
  timeout: 30 * 1000,
  expect: {
    timeout: 5000,
  },
  fullyParallel: false,
  workers: 1,
  reporter: "list",
  use: {
    baseURL: "http://localhost:3001",
    trace: "on-first-retry",
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
  webServer: {
    command:
      "PORT=3001 BETTER_AUTH_URL=http://localhost:3001 npm run start",
    url: "http://localhost:3001",
    env: { TURSO_DATABASE_URL: testDatabase.url, TURSO_AUTH_TOKEN: testDatabase.authToken },
    reuseExistingServer: false,
    timeout: 120 * 1000,
  },
});
