/**
 * @license
 * Copyright (c) ZesTest 2025-2030. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0
 *
 * This file may contain AI-assisted code.
 * See LICENSE and NOTICE files for details.
 */

/**
 * Example Playwright config with Praman OTel reporter.
 *
 * @remarks
 * The OTel reporter emits spans for the test lifecycle (test.run, test.step,
 * hooks, fixtures) into your OTLP collector. It runs in the reporter process,
 * separate from test workers.
 *
 * Usage:
 * ```bash
 * cp examples/playwright.config.otel-reporter.ts playwright.config.ts
 * ```
 *
 * See: https://praman.dev/docs/guides/telemetry#otel-reporter
 */

// @ts-check
import 'dotenv/config';
import { mkdirSync } from 'node:fs';
import { defineConfig, devices } from '@playwright/test';

mkdirSync('.auth', { recursive: true });

export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: !!process.env['CI'],
  retries: process.env['CI'] ? 2 : 0,
  workers: process.env['CI'] ? 1 : undefined,

  // 5 minutes per test — SAP apps can be slow
  timeout: 5 * 60 * 1000,

  reporter: [
    // HTML report (always)
    ['html'],

    // Praman OTel reporter — set otel: true to send spans to your collector
    [
      'playwright-praman/reporters',
      {
        otel: false,
        endpoint: 'http://localhost:4318',
      },
    ],
  ],

  use: {
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },

  projects: [
    {
      name: 'auth-setup',
      testMatch: '**/auth.setup.ts',
    },
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
