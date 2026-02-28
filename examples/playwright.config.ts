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
  retries: process.env['CI'] ? 2 : 0,
  workers: process.env['CI'] ? 1 : undefined,
  reporter: 'html',

  // Global timeout — SAP operations are slow (login, UI5 rendering)
  timeout: 5 * 60 * 1000, // 5 minutes

  use: {
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },

  projects: [
    // Runs FIRST: logs into SAP and saves session to .auth/sap-state.json
    {
      name: 'auth-setup',
      testMatch: '**/auth.setup.ts',
    },

    // Runs AFTER auth-setup: loads saved session — no re-login needed
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        storageState: '.auth/sap-state.json',
      },
      dependencies: ['auth-setup'],
      testIgnore: '**/auth.setup.ts',
    },
  ],
});
