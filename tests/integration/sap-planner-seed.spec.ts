/**
 * @license
 * Copyright (c) ZesTest 2025-2030. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0
 *
 * This file may contain AI-assisted code.
 * See LICENSE and NOTICE files for details.
 */

/* eslint-disable n/prefer-global/process */
import { test } from '@playwright/test';

test.describe('SAP Planner Seed', () => {
  // eslint-disable-next-line playwright/expect-expect -- seed for planner agent
  test('seed', async ({ page }) => {
    await page.goto(process.env['SAP_CLOUD_BASE_URL'] ?? 'https://<your-system>.s4hana.cloud.sap/', {
      waitUntil: 'domcontentloaded',
      timeout: 60000,
    });
    // eslint-disable-next-line playwright/no-page-pause -- MCP agent handoff
    await page.pause();
  });
});
