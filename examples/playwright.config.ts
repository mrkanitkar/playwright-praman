/**
 * @license
 * Copyright (c) ZesTest 2025-2030. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0
 *
 * This file may contain AI-assisted code.
 * See LICENSE and NOTICE files for details.
 */

/**
 * Playwright Configuration for Praman SAP E2E Testing.
 *
 * @remarks
 * Copied into user projects by `npx playwright-praman init`.
 * Includes auth-setup project that logs into SAP once and saves
 * the session for reuse by all test projects.
 *
 * Prerequisites:
 * - Copy `.env.example` to `.env` and fill in SAP credentials
 * - Run `npx playwright install chromium`
 * - Run `npx playwright test --project=chromium --headed`
 */

// @ts-check
import 'dotenv/config';
import { mkdirSync } from 'node:fs';
import { defineConfig, devices } from '@playwright/test';

// Ensure .auth/ directory exists before Playwright reads storageState
mkdirSync('.auth', { recursive: true });

export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: !!process.env['CI'],
  retries: process.env['CI'] ? 2 : 0, // Retry failed tests twice in CI
  workers: process.env['CI'] ? 1 : undefined,
  reporter: 'html',

  // 5 minutes per test — increase for slow SAP systems (login, UI5 rendering)
  timeout: 5 * 60 * 1000,

  use: {
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },

  projects: [
    // Auth project runs FIRST — logs into SAP and saves the session.
    // Other projects depend on this, so they reuse the saved session
    // instead of logging in again for every test.
    {
      name: 'auth-setup',
      testMatch: '**/auth.setup.ts',
    },

    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        // Reuse the auth session saved by the 'auth-setup' project above.
        // This file is created automatically — add '.auth/' to .gitignore.
        storageState: '.auth/sap-state.json',
      },
      // This line means 'chromium' waits for 'auth-setup' to finish first.
      dependencies: ['auth-setup'],
      testIgnore: '**/auth.setup.ts',
    },
  ],
});
