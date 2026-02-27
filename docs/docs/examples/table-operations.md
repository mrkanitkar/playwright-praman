---
sidebar_position: 4
title: Table Operations
---

# Table Operations

Demonstrates how to interact with SAP UI5 tables: discovering SmartTables, reading rows, and accessing OData binding data.

## Supported Table Types

This pattern works for:

- **`sap.ui.table.Table`** (grid table) -- use directly
- **`sap.m.Table`** (responsive table) -- use directly
- **`sap.ui.comp.smarttable.SmartTable`** -- use `getTable()` to get the inner table first

## Source

```typescript
import { test, expect } from 'playwright-praman';

test.describe('Table Operations', () => {
  test('read table rows and OData binding data', async ({ page, ui5 }) => {
    await test.step('Navigate to app with table', async () => {
      await page.goto(process.env['SAP_BASE_URL']!);
      await page.waitForLoadState('domcontentloaded');
      await expect(page).toHaveTitle(/Home/, { timeout: 60_000 });

      await expect(async () => {
        await ui5.press({
          controlType: 'sap.m.GenericTile',
          properties: { header: 'My List Report' },
        });
      }).toPass({ timeout: 60_000, intervals: [5000, 10_000] });

      await ui5.waitForUI5();
    });

    await test.step('Discover table and read rows', async () => {
      // SmartTable wraps an inner table
      const smartTable = await ui5.control({
        controlType: 'sap.ui.comp.smarttable.SmartTable',
      });

      // getTable() returns the inner table control as a proxy
      const innerTable = await smartTable.getTable();

      // getRows() returns array of row proxies
      const rows = await innerTable.getRows();
      expect(rows.length).toBeGreaterThan(0);
    });

    await test.step('Read OData binding from rows', async () => {
      const smartTable = await ui5.control({
        controlType: 'sap.ui.comp.smarttable.SmartTable',
      });
      const innerTable = await smartTable.getTable();

      // Wait for OData data to load using Playwright auto-retry
      await expect(async () => {
        const rows = await innerTable.getRows();
        let dataRowCount = 0;
        for (const row of rows) {
          const ctx = await row.getBindingContext();
          if (ctx) dataRowCount++;
        }
        expect(dataRowCount).toBeGreaterThan(0);
      }).toPass({ timeout: 60_000, intervals: [1000, 2000, 5000] });
    });

    await test.step('Read entity data via getContextByIndex', async () => {
      const smartTable = await ui5.control({
        controlType: 'sap.ui.comp.smarttable.SmartTable',
      });
      const innerTable = await smartTable.getTable();

      // getContextByIndex returns OData binding context for a specific row
      const ctx = await innerTable.getContextByIndex(0);
      expect(ctx).toBeTruthy();

      // getObject() returns the full OData entity as a plain object
      const entity = await ctx.getObject();
      expect(entity).toBeTruthy();
    });
  });
});
```

## Key Concepts

- **SmartTable pattern**: `ui5.control({ controlType: 'sap.ui.comp.smarttable.SmartTable' })` then `getTable()` for the inner table
- **`getRows()`** -- returns proxy instances for each visible row
- **`getBindingContext()`** -- accesses the OData model binding for a row
- **`getContextByIndex(n)`** -- shortcut for getting the nth row's binding context
- **`getObject()`** -- returns the full OData entity as a plain JavaScript object
- **`expect().toPass()`** -- Playwright auto-retry for waiting on async OData data loading
