import { defineConfig } from "@playwright/test";

const baseURL = process.env.E2E_BASE_URL || "http://127.0.0.1:4173";
const target = new URL(baseURL);
const localTarget = ["127.0.0.1", "localhost"].includes(target.hostname);

if (!localTarget && process.env.E2E_ALLOW_REMOTE !== "true") {
  throw new Error("Remote E2E targets are blocked. Set E2E_ALLOW_REMOTE=true only for an approved staging environment.");
}

export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [["list"], ["html", { open: "never" }]],
  use: {
    baseURL,
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
    video: "retain-on-failure",
  },
  projects: [{ name: "chromium", use: { browserName: "chromium" } }],
  webServer: localTarget ? {
    command: "npm.cmd run dev --prefix client -- --host 127.0.0.1 --port 4173",
    url: baseURL,
    reuseExistingServer: !process.env.CI,
    timeout: 120000,
    env: { ...process.env, VITE_API_URL: `${baseURL}/mock-api` },
  } : undefined,
});
