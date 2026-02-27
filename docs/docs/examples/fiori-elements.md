---
sidebar_position: 9
title: Fiori Elements
---

# Fiori Elements

Demonstrates testing SAP Fiori Elements applications using Praman's `playwright-praman/fe` sub-path helpers: List Report filter bar operations, variant management, Object Page section navigation, and the edit/save cycle.

## Supported Floorplans

- **List Report** -- filter bar, table, variant management, row navigation
- **Object Page** -- sections, header, edit mode, form fields
- **Both V2 and V4** -- works with Smart Templates (V2) and Fiori Elements for OData V4

## Source

```typescript
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

    await test.step('Apply filters and execute search', async () => {
      const filterBarId = await getFilterBar(page);
      await setFilterBarField(page, filterBarId, 'MaterialType', 'ROH');
      await setFilterBarField(page, filterBarId, 'Plant', '1000');
      await executeSearch(page, filterBarId);
      await ui5.waitForUI5();

      const tableId = await getListReportTable(page);
      const rowCount = await feGetTableRowCount(page, tableId);
      expect(rowCount).toBeGreaterThan(0);
    });

    await test.step('Read table column headers', async () => {
      const tableId = await getListReportTable(page);
      const columns = await feGetColumnNames(page, tableId);
      expect(columns).toContain('Material');
      expect(columns).toContain('Description');
    });

    await test.step('Find row by column values', async () => {
      const tableId = await getListReportTable(page);
      const firstMaterial = await feGetCellValue(page, tableId, 0, 'Material');
      expect(firstMaterial).toBeTruthy();

      const rowIndex = await feFindRowByValues(page, tableId, {
        Material: 'RAW-0001',
      });
    });

    await test.step('Clear filters', async () => {
      const filterBarId = await getFilterBar(page);
      await clearFilterBar(page, filterBarId);
      await executeSearch(page, filterBarId);
      await ui5.waitForUI5();
    });
  });

  test('Variant Management', async ({ page, ui5 }) => {
    await test.step('Navigate to List Report', async () => {
      await page.goto('/sap/bc/ui5_ui5/ui2/ushell/shells/abap/FioriLaunchpad.html#Material-manage');
      await ui5.waitForUI5();
    });

    await test.step('List and select variants', async () => {
      const variants = await getAvailableVariants(page);
      expect(variants.length).toBeGreaterThan(0);
      expect(variants).toContain('Standard');

      const customVariant = variants.find((v) => v !== 'Standard');
      if (customVariant) {
        await selectVariant(page, customVariant);
        await ui5.waitForUI5();
      }
    });
  });

  test('Object Page: view sections, edit, and save', async ({ page, ui5 }) => {
    await test.step('Navigate to first item', async () => {
      await page.goto('/sap/bc/ui5_ui5/ui2/ushell/shells/abap/FioriLaunchpad.html#Material-manage');
      await ui5.waitForUI5();

      const filterBarId = await getFilterBar(page);
      await executeSearch(page, filterBarId);
      await ui5.waitForUI5();

      const tableId = await getListReportTable(page);
      await navigateToItem(page, tableId, 0);
      await ui5.waitForUI5();
    });

    await test.step('Verify Object Page header and sections', async () => {
      const title = await getHeaderTitle(page);
      expect(title).toBeTruthy();

      const sections = await getObjectPageSections(page);
      expect(sections.length).toBeGreaterThan(0);
    });

    await test.step('Navigate to section and read data', async () => {
      await navigateToSection(page, 'General Information');
      const data = await getSectionData(page, 'General Information');
      expect(data).toHaveProperty('Material Type');
    });

    await test.step('Edit and save', async () => {
      expect(await isInEditMode(page)).toBe(false);
      await clickEditButton(page);
      await ui5.waitForUI5();
      expect(await isInEditMode(page)).toBe(true);

      await ui5.fill(
        { controlType: 'sap.m.Input', properties: { name: 'Description' } },
        'Updated by Praman test',
      );
      await ui5.waitForUI5();

      await clickSaveButton(page);
      await ui5.waitForUI5();
      expect(await isInEditMode(page)).toBe(false);
    });
  });
});
```

## Key Concepts

### List Report

- **`getFilterBar(page)`** -- discovers the filter bar control ID
- **`setFilterBarField(page, id, field, value)`** -- sets a filter field value
- **`executeSearch(page, id)`** -- clicks the "Go" button to trigger search
- **`clearFilterBar(page, id)`** -- clears all filter fields
- **`getListReportTable(page)`** -- discovers the main table control ID
- **`navigateToItem(page, tableId, rowIndex)`** -- clicks a row to open Object Page

### Variant Management

- **`getAvailableVariants(page)`** -- lists all saved variants
- **`selectVariant(page, name)`** -- switches to a variant by name

### Object Page

- **`getHeaderTitle(page)`** -- reads the Object Page header title
- **`getObjectPageSections(page)`** -- returns all sections with sub-sections
- **`navigateToSection(page, name)`** -- scrolls/navigates to a named section
- **`getSectionData(page, name)`** -- reads form field key-value pairs from a section
- **`isInEditMode(page)`** -- checks if Object Page is in edit mode
- **`clickEditButton(page)`** -- toggles edit mode on
- **`clickSaveButton(page)`** -- saves changes

### FE Table Helpers

- **`feGetTableRowCount(page, tableId)`** -- counts visible rows
- **`feGetColumnNames(page, tableId)`** -- reads column headers
- **`feGetCellValue(page, tableId, row, column)`** -- reads a specific cell
- **`feFindRowByValues(page, tableId, { col: val })`** -- finds a row by column values
