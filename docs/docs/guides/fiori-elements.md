---
title: 'Fiori Elements Testing'
description: 'Test SAP Fiori Elements apps with Praman. Page-object helpers for List Report, Object Page, Overview Page, and FE Table operations.'
keywords:
  - sap fiori elements testing
  - sap fiori test automation
  - sap fiori elements list report testing
  - playwright sap fiori
---

# Fiori Elements Testing

The `playwright-praman/fe` sub-path provides specialized helpers for testing SAP Fiori Elements applications, including List Report, Object Page, table operations, and the FE Test Library integration.

## Getting Started

```typescript
import {
  getListReportTable,
  getFilterBar,
  setFilterBarField,
  executeSearch,
  navigateToItem,
  getObjectPageLayout,
  getHeaderTitle,
  navigateToSection,
} from 'playwright-praman/fe';
```

## List Report Operations

### Finding the Table and Filter Bar

```typescript
// Discover the main List Report table
const tableId = await getListReportTable(page);

// Discover the filter bar
const filterBarId = await getFilterBar(page);
```

Both functions wait for UI5 stability before querying and throw a `ControlError` if the control is not found.

### Filter Bar Operations

```typescript
// Set a filter field value
await setFilterBarField(page, filterBarId, 'CompanyCode', '1000');

// Read a filter field value
const value = await getFilterBarFieldValue(page, filterBarId, 'CompanyCode');

// Clear all filter bar fields
await clearFilterBar(page, filterBarId);

// Execute search (triggers the Go button)
await executeSearch(page, filterBarId);
```

### Variant Management

```typescript
// List available variants
const variants = await getAvailableVariants(page);
// ['Standard', 'My Open Orders', 'Last 30 Days']

// Select a variant by name
await selectVariant(page, 'My Open Orders');
```

### Row Navigation

```typescript
// Navigate to a specific row (opens Object Page)
await navigateToItem(page, tableId, 0); // Click first row
```

### Options

All List Report functions accept an optional `ListReportOptions` parameter:

```typescript
interface ListReportOptions {
  readonly timeout?: number; // Default: CONTROL_DISCOVERY timeout
  readonly skipStabilityWait?: boolean; // Default: false
}

// Example with options
await executeSearch(page, filterBarId, { timeout: 15_000 });
```

## Object Page Operations

### Layout and Header

```typescript
// Discover the Object Page layout
const layoutId = await getObjectPageLayout(page);

// Read the header title
const title = await getHeaderTitle(page);
// 'Purchase Order 4500012345'
```

### Sections

```typescript
// Get all sections with their sub-sections
const sections = await getObjectPageSections(page);
// [
//   { id: 'sec1', title: 'General Information', visible: true, index: 0, subSections: [...] },
//   { id: 'sec2', title: 'Items', visible: true, index: 1, subSections: [...] },
// ]

// Navigate to a specific section
await navigateToSection(page, 'Items');

// Read form data from a section
const data = await getSectionData(page, 'General Information');
// { 'Vendor': 'Acme GmbH', 'Company Code': '1000', ... }
```

### Edit Mode

```typescript
// Check if Object Page is in edit mode
const editing = await isInEditMode(page);

// Toggle edit mode
await clickEditButton(page);

// Click custom buttons
await clickObjectPageButton(page, 'Delete');

// Save changes
await clickSaveButton(page);
```

## FE Table Helpers

For direct table manipulation (works with both List Report and Object Page tables):

```typescript
import {
  feGetTableRowCount,
  feGetColumnNames,
  feGetCellValue,
  feClickRow,
  feFindRowByValues,
} from 'playwright-praman/fe';

// Get row count
const count = await feGetTableRowCount(page, tableId);

// Get column headers
const columns = await feGetColumnNames(page, tableId);
// ['Material', 'Description', 'Quantity', 'Unit Price']

// Read a cell value by row index and column name
const material = await feGetCellValue(page, tableId, 0, 'Material');

// Click a row
await feClickRow(page, tableId, 2);

// Find a row by column values
const rowIndex = await feFindRowByValues(page, tableId, {
  Material: 'RAW-0001',
  Quantity: '100',
});
```

## FE List Helpers

For list-based Fiori Elements views (e.g., Master-Detail):

```typescript
import {
  feGetListItemCount,
  feGetListItemTitle,
  feGetListItemDescription,
  feClickListItem,
  feSelectListItem,
  feFindListItemByTitle,
} from 'playwright-praman/fe';

// Get number of list items
const count = await feGetListItemCount(page, listId);

// Read item titles and descriptions
const title = await feGetListItemTitle(page, listId, 0);
const desc = await feGetListItemDescription(page, listId, 0);

// Interact with list items
await feClickListItem(page, listId, 0);
await feSelectListItem(page, listId, 2);

// Find item by title text
const index = await feFindListItemByTitle(page, listId, 'Purchase Order 4500012345');
```

## FE Test Library Integration

Praman integrates with SAP's own Fiori Elements Test Library (`sap.fe.test`):

```typescript
import { initializeFETestLibrary, FETestLibraryInstance } from 'playwright-praman/fe';

// Initialize the FE Test Library on the page
await initializeFETestLibrary(page, {
  timeout: 30_000,
});

// The test library provides SAP's official FE testing API
// through the bridge, enabling assertions that match SAP's own test patterns
```

## Complete Example

A typical Fiori Elements List Report to Object Page test flow:

```typescript
import { test, expect } from 'playwright-praman';
import {
  getListReportTable,
  getFilterBar,
  setFilterBarField,
  executeSearch,
  navigateToItem,
  getHeaderTitle,
  getObjectPageSections,
  getSectionData,
} from 'playwright-praman/fe';

test('browse purchase orders and view details', async ({ page, ui5 }) => {
  await test.step('Navigate to List Report', async () => {
    await page.goto(
      '/sap/bc/ui5_ui5/ui2/ushell/shells/abap/FioriLaunchpad.html#PurchaseOrder-manage',
    );
    await ui5.waitForUI5();
  });

  await test.step('Filter by company code', async () => {
    const filterBar = await getFilterBar(page);
    await setFilterBarField(page, filterBar, 'CompanyCode', '1000');
    await executeSearch(page, filterBar);
  });

  await test.step('Navigate to first purchase order', async () => {
    const table = await getListReportTable(page);
    await navigateToItem(page, table, 0);
    await ui5.waitForUI5();
  });

  await test.step('Verify Object Page header', async () => {
    const title = await getHeaderTitle(page);
    expect(title).toContain('Purchase Order');
  });

  await test.step('Read General Information section', async () => {
    const data = await getSectionData(page, 'General Information');
    expect(data).toHaveProperty('Vendor');
    expect(data).toHaveProperty('Company Code');
  });
});
```

## Error Handling

All FE helpers throw structured `ControlError` or `NavigationError` instances with suggestions:

```typescript
try {
  await getListReportTable(page);
} catch (error) {
  // ControlError {
  //   code: 'ERR_CONTROL_NOT_FOUND',
  //   message: 'List Report table not found on current page',
  //   suggestions: [
  //     'Verify the current page is a Fiori Elements List Report',
  //     'Wait for the page to fully load before accessing the table',
  //   ]
  // }
}
```
