/**
 * @license
 * Copyright (c) ZesTest 2025-2030. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0
 *
 * This file may contain AI-assisted code.
 * See LICENSE and NOTICE files for details.
 */

/**
 * Template string constants for project scaffolding.
 *
 * @remarks
 * Extracted from `scaffolder.ts` to keep that module under the 300 LOC
 * limit. Each constant is a ready-to-write file body used by
 * {@link scaffoldProject}.
 *
 * @module cli/scaffold-templates
 */

/**
 * Global teardown script that cleans up auth state files after a test run.
 *
 * @example
 * ```typescript
 * import { GLOBAL_TEARDOWN_TEMPLATE } from './scaffold-templates.js';
 * await writeFile('global.teardown.ts', GLOBAL_TEARDOWN_TEMPLATE);
 * ```
 *
 * @capability cli.scaffold.globalTeardownTemplate
 */
export const GLOBAL_TEARDOWN_TEMPLATE = `import { rm } from 'node:fs/promises';
import { join } from 'node:path';

/**
 * Global teardown: removes persisted auth state so the next run
 * starts with a clean session.
 */
async function globalTeardown(): Promise<void> {
  const authDir = join(process.cwd(), '.auth');
  await rm(authDir, { recursive: true, force: true });
}

export default globalTeardown;
`;

/**
 * Master data helper utilities for SAP test projects.
 *
 * @example
 * ```typescript
 * import { MASTER_DATA_HELPER_TEMPLATE } from './scaffold-templates.js';
 * await writeFile('tests/helpers/master-data.ts', MASTER_DATA_HELPER_TEMPLATE);
 * ```
 *
 * @capability cli.scaffold.masterDataHelperTemplate
 */
export const MASTER_DATA_HELPER_TEMPLATE = `/**
 * SAP master-data helpers shared across test suites.
 *
 * Add project-specific material, customer, or vendor look-ups here so
 * every test file can reference the same data set.
 */

/** A material number known to exist in the test system. */
export const MATERIAL_NUMBER = '000000000000000100';

/** A customer number known to exist in the test system. */
export const CUSTOMER_NUMBER = '0000001000';

/** A plant code used for goods-movement tests. */
export const PLANT = '1000';

/** A storage location used for inventory tests. */
export const STORAGE_LOCATION = '0001';

/** A purchasing organisation used for procurement tests. */
export const PURCHASING_ORG = '1000';

/** A company code used for finance tests. */
export const COMPANY_CODE = '1000';
`;

/**
 * GitHub Actions workflow for running Praman Playwright tests in CI.
 *
 * @example
 * ```typescript
 * import { PLAYWRIGHT_WORKFLOW_TEMPLATE } from './scaffold-templates.js';
 * await writeFile('.github/workflows/playwright.yml', PLAYWRIGHT_WORKFLOW_TEMPLATE);
 * ```
 *
 * @capability cli.scaffold.playwrightWorkflowTemplate
 */
export const PLAYWRIGHT_WORKFLOW_TEMPLATE = `name: Playwright Praman Tests

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    timeout-minutes: 30
    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: npm

      - name: Install dependencies
        run: npm ci

      - name: Install Playwright browsers
        run: npx playwright install --with-deps chromium

      - name: Run Praman tests
        run: npx playwright test
        env:
          CI: 'true'

      - name: Upload test report
        if: always()
        uses: actions/upload-artifact@v4
        with:
          name: playwright-report
          path: playwright-report/
          retention-days: 14
`;
