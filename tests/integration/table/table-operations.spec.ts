/**
 * @license
 * Copyright (c) ZesTest 2025-2030. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0
 *
 * This file may contain AI-assisted code.
 * See LICENSE and NOTICE files for details.
 */

/**
 * Table operations integration tests.
 *
 * Validates table detection, row retrieval, cell access, and row selection
 * against the Browse Orders demo app (sap.m.Table with mock data).
 */

import { test, expect } from '@playwright/test';
import type { Page } from '@playwright/test';

import { injectBridge } from '../../../src/bridge/injection.js';
import { getRowCount } from '../../../src/modules/table-operations.js';
import {
  detectTableType,
  getTableRows,
  getTableData,
  getTableCellValue,
} from '../../../src/modules/table.js';
import { APPS } from '../helpers/demo-apps.js';
import { navigateAndWaitForUI5 } from '../helpers/ui5-wait.js';

test.describe.serial('Table Operations — Worklist', () => {
  let page: Page;
  let tableId: string;

  test.beforeAll(async ({ browser }) => {
    page = await browser.newPage();
    await navigateAndWaitForUI5(page, APPS.WORKLIST);
    await injectBridge(page);

    // Wait for a sap.m.Table to appear in the registry (mock data may load async)
    await page.waitForFunction(
      `(function() {
      var registry = sap.ui.core.Element.registry;
      if (!registry || !registry.all) return false;
      var all = registry.all();
      for (var id in all) {
        var ctrl = all[id];
        if (ctrl.getMetadata && ctrl.getMetadata().getName() === 'sap.m.Table') {
          return true;
        }
      }
      return false;
    })()`,
      { timeout: 15_000 },
    );

    // Discover the first sap.m.Table on the page
    const found = await page.evaluate(`(function() {
      var all = sap.ui.core.Element.registry.all();
      for (var id in all) {
        var ctrl = all[id];
        if (ctrl.getMetadata && ctrl.getMetadata().getName() === 'sap.m.Table') {
          return id;
        }
      }
      return null;
    })()`);
    expect(found).toBeTruthy();
    tableId = found as string;
  });

  test.afterAll(async () => {
    await page.close();
  });

  test('detectTableType identifies sap.m.Table', async () => {
    const info = await detectTableType(page, tableId);
    expect(info.kind).toBe('standard');
    expect(info.variant).toBe('sap.m.Table');
    expect(info.effectiveId).toBe(tableId);
  });

  test('getTableRows returns row IDs', async () => {
    const rows = await getTableRows(page, tableId);
    expect(rows).toBeInstanceOf(Array);
    expect(rows.length).toBeGreaterThan(0);
    for (const rowId of rows) {
      expect(typeof rowId).toBe('string');
      expect(rowId).toBeTruthy();
    }
  });

  test('getRowCount returns positive number', async () => {
    const count = await getRowCount(page, tableId);
    expect(typeof count).toBe('number');
    expect(count).toBeGreaterThan(0);
  });

  test('getTableData returns structured row data', async () => {
    const data = await getTableData(page, tableId);
    expect(data).toBeInstanceOf(Array);
    expect(data.length).toBeGreaterThan(0);
    // Each row is a Record with OData entity properties
    const firstRow = data[0];
    expect(firstRow).toBeDefined();
    expect(typeof firstRow).toBe('object');
  });

  test('getTableCellValue reads a cell', async () => {
    const value = await getTableCellValue(page, tableId, 0, 0);
    expect(value).toBeDefined();
    // Cell value can be string or number — just verify it's not undefined
    expect(typeof value === 'string' || typeof value === 'number').toBe(true);
  });

  test('getTableRows returns consistent count', async () => {
    const rows = await getTableRows(page, tableId);
    const count = await getRowCount(page, tableId);
    expect(rows).toHaveLength(count);
  });
});
