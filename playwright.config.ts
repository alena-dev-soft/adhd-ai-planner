import { defineConfig, devices } from "@playwright/test";

// Supabase keys for the test come from .env.local (gitignored), like the app.
try {
  process.loadEnvFile(".env.local");
} catch {
  // no .env.local: rely on the environment
}

const baseURL = process.env.E2E_BASE_URL ?? "http://localhost:3000";

export default defineConfig({
  testDir: "e2e",
  timeout: 60_000,
  retries: 0,
  workers: 1,
  reporter: "list",
  use: { baseURL, trace: "retain-on-failure" },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: {
    command: "npm run dev",
    url: `${baseURL}/login`,
    reuseExistingServer: true,
    timeout: 120_000,
  },
});
