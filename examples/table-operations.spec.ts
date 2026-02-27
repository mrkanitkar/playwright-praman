/**
 * @license
 * Copyright (c) ZesTest 2025-2030. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0
 *
 * This file may contain AI-assisted code.
 * See LICENSE and NOTICE files for details.
 */

/**
 * Table Operations Example -- getRows, getContextByIndex, OData binding.
 *
 * @remarks
 * This example demonstrates how to interact with SAP UI5 tables using Praman:
 *
 * 1. **Discover a SmartTable** by control ID
 * 2. **Get the inner table** via `getTable()` (SmartTable wraps `sap.ui.table.Table`)
 * 3. **Read rows** via `getRows()` -- returns array of UI5ControlProxy instances
 * 4. **Access OData binding** via `getBindingContext()` and `getObject()`
 * 5. **Use Playwright auto-retry** with `expect().toPass()` for OData data loading
 *
 * This pattern works for:
 * - `sap.ui.table.Table` (grid table)
 * - `sap.m.Table` (responsive table)
 * - `sap.ui.comp.smarttable.SmartTable` (use `getTable()` first)
 *
 * Prerequisites:
 * - Authentication handled via setup project (see {@link auth-setup.ts})
 * - App with a table must be accessible
 *
 * @example
 * ```bash
 * npx playwright test examples/table-operations.spec.ts
 * ```
 */

import { test, expect } from 'playwright-praman';

test.describe('Table Operations', () => {
  test('read table rows and OData binding data', async ({ page, ui5 }) => {
    await test.step('Navigate to app with table', async () => {
      await page.goto(process.env['SAP_BASE_URL']!);
      await page.waitForLoadState('domcontentloaded');
      await expect(page).toHaveTitle(/Home/, { timeout: 60_000 });

      // Navigate to a tile that opens a List Report with a table
      await expect(async () => {
        await ui5.press({
          controlType: 'sap.m.GenericTile',
          properties: { header: 'My List Report' },
        });
      }).toPass({ timeout: 60_000, intervals: [5000, 10_000] });

      await ui5.waitForUI5();
    });

    await test.step('Discover table and read rows', async () => {
      // SmartTable wraps an inner sap.ui.table.Table or sap.m.Table
      const smartTable = await ui5.control({
        controlType: 'sap.ui.comp.smarttable.SmartTable',
      });

      // getTable() returns the inner table control as a proxy
      const innerTable = await smartTable.getTable();

      // getRows() returns an array of row proxies
      const rows = (await innerTable.getRows()) as unknown[];
      expect(rows.length).toBeGreaterThan(0);

      test.info().annotations.push({
        type: 'info',
        description: `Table has ${rows.length} visible rows`,
      });
    });

    await test.step('Read OData binding from rows', async () => {
      const smartTable = await ui5.control({
        controlType: 'sap.ui.comp.smarttable.SmartTable',
      });
      const innerTable = await smartTable.getTable();

      // Wait for OData data to load using Playwright auto-retry
      let dataRowCount = 0;
      await expect(async () => {
        const rows = (await innerTable.getRows()) as Array<{
          getBindingContext: () => Promise<unknown>;
        }>;
        dataRowCount = 0;
        for (const row of rows) {
          const ctx = await row.getBindingContext();
          if (ctx) dataRowCount++;
        }
        expect(dataRowCount).toBeGreaterThan(0);
      }).toPass({ timeout: 60_000, intervals: [1000, 2000, 5000] });

      test.info().annotations.push({
        type: 'info',
        description: `Found ${dataRowCount} rows with OData binding`,
      });
    });

    await test.step('Read entity data via getContextByIndex', async () => {
      const smartTable = await ui5.control({
        controlType: 'sap.ui.comp.smarttable.SmartTable',
      });
      const innerTable = await smartTable.getTable();

      // getContextByIndex returns the OData binding context for a specific row
      const ctx = await innerTable.getContextByIndex(0);
      expect(ctx).toBeTruthy();

      // getObject() returns the full OData entity as a plain object
      const entity = (await ctx.getObject()) as Record<string, unknown>;
      expect(entity).toBeTruthy();

      test.info().annotations.push({
        type: 'info',
        description: `First row entity keys: ${Object.keys(entity).join(', ')}`,
      });
    });
  });
});
