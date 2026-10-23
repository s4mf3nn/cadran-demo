import { defineConfig, devices } from '@playwright/test';

const chromium = {
  ...devices['Desktop Chrome'],
  viewport: { width: 1600, height: 1000 },
  // Permet d'utiliser un Chromium déjà installé (ex. PW_CHROMIUM_PATH=/opt/pw-browsers/chromium).
  launchOptions: process.env.PW_CHROMIUM_PATH ? { executablePath: process.env.PW_CHROMIUM_PATH } : {},
};

export default defineConfig({
  testDir: './e2e',
  timeout: 30_000,
  use: { baseURL: 'http://localhost:5173', trace: 'on-first-retry' },
  projects: [
    { name: 'chromium', use: chromium, testIgnore: /performance\.spec\.ts/ },
    // Mesure des tâches longues : lancée seule, une fois les autres tests terminés, pour qu'aucun
    // autre navigateur ne lui dispute le CPU. En local : `npm run e2e -- --project=perf --no-deps`.
    { name: 'perf', use: chromium, testMatch: /performance\.spec\.ts/, dependencies: ['chromium'] },
  ],
  // Le dev server sert aussi le faux endpoint LLM en streaming.
  webServer: { command: 'npm run dev -- --port 5173 --strictPort', url: 'http://localhost:5173', reuseExistingServer: !process.env.CI },
});
