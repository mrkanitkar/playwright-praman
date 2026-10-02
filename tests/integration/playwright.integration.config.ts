/**
 * @license
 * Copyright (c) ZesTest 2025-2030. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0
 *
 * This file may contain AI-assisted code.
 * See LICENSE and NOTICE files for details.
 */

import process from 'node:process';

import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright config for the credential-free UI5 browser testbed.
 *
 * @remarks
 * Targets public UI5 demo apps on the SAP CDN, which bundle their own mock
 * OData server, so these specs need no SAP system and no secrets. That is the
 * whole point: every other browser-driving job in CI is gated on a secret this
 * repository does not have (`SAP_CLOUD_BASE_URL`, `PLAYWRIGHT_SERVICE_URL`), so
 * each one skips and reports green. This config is the only path that actually
 * launches a browser in CI.
 *
 * Kept separate from the root `playwright.config.ts` because its `sap-tests`
 * project requires `storageState: '.auth/sap-session.json'`. These specs are
 * scoped into that project and therefore never run there — a credential-free
 * test trapped behind an auth gate is a test that does not exist.
 *
 * `table/table-operations.spec.ts` is deliberately **not** matched. It fails
 * deterministically because `stabilityWait()` in `src/modules/table.ts` polls
 * `sap.ui.getCore().getUIPending()`, which is `undefined` on current UI5
 * (verified absent on 1.136.0 and 1.146.0), so the wait is a silent no-op and
 * the spec races the mock OData binding. Add it back once that is fixed; do not
 * weaken its assertions, which are correct.
 */
export default defineConfig({
  testDir: '.',
  testMatch:
    /(bridge-smoke|proxy-chaining|proxy-discovery|dialog-operations|interaction-strategies)\.spec\.ts/,
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
