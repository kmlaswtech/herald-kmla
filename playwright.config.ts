import { fileURLToPath } from "node:url";
import { defineConfig, devices } from "@playwright/test";

const baseURL = process.env.E2E_BASE_URL ?? "http://127.0.0.1:4174";
// Fixture content stands in for Pages CMS; votes go to a throwaway file.
const content = fileURLToPath(
  new URL("test/fixtures/content", import.meta.url),
);
const votes = fileURLToPath(
  new URL("test-results/e2e-votes.json", import.meta.url),
);

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  use: { baseURL, trace: "retain-on-failure" },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: process.env.E2E_BASE_URL
    ? undefined
    : {
        command: "npm run build && npm run preview",
        url: baseURL,
        reuseExistingServer: !process.env.CI,
        timeout: 180_000,
        env: { HERALD_CONTENT_DIR: content, HERALD_VOTES_FILE: votes },
      },
});
