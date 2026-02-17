import process from 'node:process';

import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright config for bridge integration smoke tests.
 *
 * Targets public UI5 demo apps (no auth required).
 * Separate from main playwright.config.ts to avoid
 * interfering with SAP Cloud auth projects.
 */
export default defineConfig({
  testDir: '.',
  testMatch: /bridge-smoke\.spec\.ts/,
  fullyParallel: false,
  forbidOnly: process.env['CI'] === 'true',
  retries: process.env['CI'] === 'true' ? 2 : 0,
  workers: 1,
  timeout: 60_000,
  reporter: [['html', { open: 'never' }], ['list']],
  use: {
    ...devices['Desktop Chrome'],
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    navigationTimeout: 30_000,
    actionTimeout: 15_000,
  },
});
