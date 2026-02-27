/**
 * @license
 * Copyright (c) ZesTest 2025-2030. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0
 *
 * This file may contain AI-assisted code.
 * See LICENSE and NOTICE files for details.
 */

/**
 * Fiori Elements List Report + Object Page Example.
 *
 * @remarks
 * This example demonstrates testing SAP Fiori Elements applications using Praman's
 * `playwright-praman/fe` sub-path helpers:
 *
 * 1. **List Report** -- filter bar operations, variant selection, table navigation
 * 2. **Object Page** -- section navigation, header verification, edit/save flow
 * 3. **FE table helpers** -- row counting, cell reading, row-by-value search
 * 4. **Cross-page navigation** -- List Report to Object Page and back
 *
 * These helpers work with both V2 (Smart Templates) and V4 (Fiori Elements for OData V4)
 * flavors of Fiori Elements.
 *
 * Prerequisites:
 * - Authentication handled via setup project (see {@link auth-setup.ts})
 * - A Fiori Elements List Report + Object Page app accessible
 * - App semantic object: `Material-manage` (example uses Material Master)
 *
 * @example
 * ```bash
 * npx playwright test examples/fiori-elements.spec.ts
 * ```
 */

import { test, expect } from 'playwright-praman';
import {
  getListReportTable,
  getFilterBar,
  setFilterBarField,
  executeSearch,
  clearFilterBar,
  getAvailableVariants,
  selectVariant,
  navigateToItem,
  getHeaderTitle,
  getObjectPageSections,
  getSectionData,
  navigateToSection,
  clickEditButton,
  clickSaveButton,
  isInEditMode,
  feGetTableRowCount,
  feGetColumnNames,
  feGetCellValue,
  feFindRowByValues,
} from 'playwright-praman/fe';

test.describe('Fiori Elements -- Material Master', () => {
  test('List Report: filter, search, and browse materials', async ({ page, ui5 }) => {
    await test.step('Navigate to Material List Report', async () => {
      await page.goto('/sap/bc/ui5_ui5/ui2/ushell/shells/abap/FioriLaunchpad.html#Material-manage');
      await ui5.waitForUI5();
    });

    await test.step('Discover filter bar and table', async () => {
      const filterBarId = await getFilterBar(page);
      expect(filterBarId).toBeTruthy();

      const tableId = await getListReportTable(page);
      expect(tableId).toBeTruthy();

      test.info().annotations.push({
        type: 'info',
        description: `FilterBar: ${filterBarId}, Table: ${tableId}`,
      });
    });

    await test.step('Apply filters and execute search', async () => {
      const filterBarId = await getFilterBar(page);

      // Set filter values
      await setFilterBarField(page, filterBarId, 'MaterialType', 'ROH');
      await setFilterBarField(page, filterBarId, 'Plant', '1000');

      // Execute search -- triggers the "Go" button
      await executeSearch(page, filterBarId);
      await ui5.waitForUI5();

      // Verify results are filtered
      const tableId = await getListReportTable(page);
      const rowCount = await feGetTableRowCount(page, tableId);
      expect(rowCount).toBeGreaterThan(0);

      test.info().annotations.push({
        type: 'info',
        description: `Filter returned ${rowCount} materials (Type=ROH, Plant=1000)`,
      });
    });

    await test.step('Read table column headers', async () => {
      const tableId = await getListReportTable(page);
      const columns = await feGetColumnNames(page, tableId);

      expect(columns).toContain('Material');
      expect(columns).toContain('Description');

      test.info().annotations.push({
        type: 'info',
        description: `Columns: ${columns.join(', ')}`,
      });
    });

    await test.step('Read cell values and find row by material number', async () => {
      const tableId = await getListReportTable(page);

      // Read the first row's material number
      const firstMaterial = await feGetCellValue(page, tableId, 0, 'Material');
      expect(firstMaterial).toBeTruthy();

      // Search for a specific material by column values
      const rowIndex = await feFindRowByValues(page, tableId, {
        Material: 'RAW-0001',
      });

      test.info().annotations.push({
        type: 'info',
        description: `First material: ${firstMaterial}, RAW-0001 at row ${rowIndex}`,
      });
    });

    await test.step('Clear filters and verify full result set', async () => {
      const filterBarId = await getFilterBar(page);
      await clearFilterBar(page, filterBarId);
      await executeSearch(page, filterBarId);
      await ui5.waitForUI5();

      const tableId = await getListReportTable(page);
      const unfilteredCount = await feGetTableRowCount(page, tableId);
      expect(unfilteredCount).toBeGreaterThan(0);
    });
  });

  test('Variant Management: select and switch variants', async ({ page, ui5 }) => {
    await test.step('Navigate to List Report', async () => {
      await page.goto('/sap/bc/ui5_ui5/ui2/ushell/shells/abap/FioriLaunchpad.html#Material-manage');
      await ui5.waitForUI5();
    });

    await test.step('List available variants', async () => {
      const variants = await getAvailableVariants(page);
      expect(variants.length).toBeGreaterThan(0);
      expect(variants).toContain('Standard');

      test.info().annotations.push({
        type: 'info',
        description: `Available variants: ${variants.join(', ')}`,
      });
    });

    await test.step('Select a saved variant', async () => {
      const variants = await getAvailableVariants(page);

      // Select a non-standard variant if available
      const customVariant = variants.find((v) => v !== 'Standard');
      if (customVariant) {
        await selectVariant(page, customVariant);
        await ui5.waitForUI5();

        test.info().annotations.push({
          type: 'info',
          description: `Switched to variant: ${customVariant}`,
        });
      }
    });
  });

  test('Object Page: view sections, edit, and save', async ({ page, ui5 }) => {
    await test.step('Navigate to List Report and open first item', async () => {
      await page.goto('/sap/bc/ui5_ui5/ui2/ushell/shells/abap/FioriLaunchpad.html#Material-manage');
      await ui5.waitForUI5();

      const filterBarId = await getFilterBar(page);
      await executeSearch(page, filterBarId);
      await ui5.waitForUI5();

      // Navigate to the first material (opens Object Page)
      const tableId = await getListReportTable(page);
      await navigateToItem(page, tableId, 0);
      await ui5.waitForUI5();
    });

    await test.step('Verify Object Page header', async () => {
      const title = await getHeaderTitle(page);
      expect(title).toBeTruthy();

      test.info().annotations.push({
        type: 'info',
        description: `Object Page title: ${title}`,
      });
    });

    await test.step('Browse Object Page sections', async () => {
      const sections = await getObjectPageSections(page);
      expect(sections.length).toBeGreaterThan(0);

      const sectionNames = sections.map((s) => s.title);
      test.info().annotations.push({
        type: 'info',
        description: `Sections: ${sectionNames.join(', ')}`,
      });
    });

    await test.step('Navigate to a specific section and read data', async () => {
      // Navigate to the General Information section
      await navigateToSection(page, 'General Information');

      const data = await getSectionData(page, 'General Information');
      expect(data).toBeTruthy();
      expect(data).toHaveProperty('Material Type');

      test.info().annotations.push({
        type: 'info',
        description: `General Info keys: ${Object.keys(data).join(', ')}`,
      });
    });

    await test.step('Enter edit mode', async () => {
      const wasEditing = await isInEditMode(page);
      expect(wasEditing).toBe(false);

      await clickEditButton(page);
      await ui5.waitForUI5();

      const nowEditing = await isInEditMode(page);
      expect(nowEditing).toBe(true);
    });

    await test.step('Edit a field and save', async () => {
      // Edit the material description field via ui5 fixture
      await ui5.fill(
        { controlType: 'sap.m.Input', properties: { name: 'Description' } },
        'Updated by Praman test',
      );
      await ui5.waitForUI5();

      // Save using FE helper
      await clickSaveButton(page);
      await ui5.waitForUI5();

      // Verify we returned to display mode
      const stillEditing = await isInEditMode(page);
      expect(stillEditing).toBe(false);

      // Verify the message toast confirms success
      await expect(async () => {
        const messageToast = await ui5.control({
          controlType: 'sap.m.MessageToast',
        });
        expect(messageToast).toBeTruthy();
      }).toPass({ timeout: 10_000, intervals: [1000, 2000] });
    });
  });
});
