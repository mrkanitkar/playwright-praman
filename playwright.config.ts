import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright configuration for Praman v1.0 integration tests.
 *
 * Uses project dependencies pattern (BP-PLAYWRIGHT D28):
 * - 'setup' project handles auth, produces storageState
 * - 'sap-tests' project depends on setup, consumes storageState
 */
export default defineConfig({
  testDir: './tests/integration',
  fullyParallel: false,
  forbidOnly: !!process.env['CI'],
  retries: process.env['CI'] ? 2 : 0,
  workers: 1,
  reporter: [
    ['html', { open: 'never' }],
    ['list'],
  ],
  use: {
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  projects: [
    {
      name: 'setup',
      testMatch: /.*\.setup\.ts/,
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'sap-tests',
      dependencies: ['setup'],
      use: {
        ...devices['Desktop Chrome'],
        storageState: '.auth/sap-session.json',
      },
    },
  ],
});
