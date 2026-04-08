import 'dotenv/config';

import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright configuration for Praman v1.0.
 *
 * Projects:
 * - 'setup' / 'sap-tests' — integration tests (existing)
 * - 'e2e-auth-setup' / 'e2e-auth-teardown' / 'e2e-sap-cloud' — e2e tests
 *
 * Uses project dependencies pattern (BP-PLAYWRIGHT D28):
 * - Setup project handles auth, produces storageState
 * - Test projects depend on setup, consume storageState
 */
export default defineConfig({
  testDir: './tests/integration',
  fullyParallel: false,
  forbidOnly: !!process.env['CI'],
  retries: process.env['CI'] ? 2 : 0,
  workers: 1,
  reporter: [['html', { open: 'never' }], ['list']],
  use: {
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  projects: [
    // ── Agent seed project (MCP agent discovery — inline auth) ─────
    {
      name: 'agent-seed-test',
      testDir: './tests/seeds',
      testMatch: /sap-seed\.spec\.ts/,
      timeout: 120_000,
      use: {
        ...devices['Desktop Chrome'],
        headless: !!process.env['CI'],
        baseURL: process.env['SAP_CLOUD_BASE_URL'],
        actionTimeout: 30_000,
        navigationTimeout: 120_000,
      },
    },

    // ── Integration test projects ──────────────────────────────────
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

    // ── E2E test projects (SAP Cloud) ──────────────────────────────
    {
      name: 'e2e-auth-setup',
      testMatch: /auth-setup\.ts/,
      testDir: './src/auth',
      timeout: 120_000,
      use: {
        ...devices['Desktop Chrome'],
        headless: !!process.env['CI'],
        launchOptions: { slowMo: process.env['CI'] ? 0 : 500 },
      },
    },
    {
      name: 'e2e-auth-teardown',
      testMatch: /auth-teardown\.ts/,
      testDir: './src/auth',
    },
    {
      name: 'e2e-sap-cloud',
      testDir: './tests/e2e/sap-cloud',
      dependencies: ['e2e-auth-setup'],
      teardown: 'e2e-auth-teardown',
      timeout: 300_000,
      use: {
        ...devices['Desktop Chrome'],
        storageState: '.auth/sap-session.json',
        baseURL: process.env['SAP_CLOUD_BASE_URL'],
        headless: !!process.env['CI'],
        actionTimeout: 30_000,
        navigationTimeout: 120_000,
      },
    },
  ],
});
