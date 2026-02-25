# Fiori Elements Testing Reference

## Table of Contents

1. [Overview](#overview)
2. [ListReport Pattern](#listreport-pattern)
3. [ObjectPage Pattern](#objectpage-pattern)
4. [SmartTable](#smarttable)
5. [SmartFilterBar](#smartfilterbar)
6. [FE Test Library](#fe-test-library)

---

## Overview

SAP Fiori Elements (FE) apps are generated from OData service metadata + annotations.
They follow predictable patterns — Praman's FE fixture captures these patterns.

```typescript
import { test, expect } from 'playwright-praman';

// FE apps use SmartTable, SmartFilterBar, ObjectPage
test('list report test', async ({ ui5, ui5Navigation }) => {
  await ui5Navigation.navigateToApp('PurchaseOrder-manage');
  await ui5.waitForUI5();

  // FE apps have predictable structure — use fe module (Phase 5+)
  // For now: target SmartTable, SmartFilterBar by controlType
});
```

---

## ListReport Pattern

A Fiori Elements ListReport page has:

- **SmartFilterBar** — filter criteria at the top
- **SmartTable** (or responsive table) — search results
- **Toolbar** — actions above the table (Create, Delete, etc.)

```typescript
import { test, expect } from 'playwright-praman';

test('filter and select purchase orders', async ({ ui5, ui5Navigation }) => {
  await ui5Navigation.navigateToApp('PurchaseOrder-manage');

  // 1. Fill filter bar
  await ui5.fill(
    {
      controlType: 'sap.ui.comp.smartfield.SmartField',
      bindingPath: { path: '', propertyPath: 'Supplier' },
    },
    'SUP-001',
  );

  // 2. Click Go/Search
  await ui5.click({
    controlType: 'sap.m.Button',
    properties: { text: 'Go' },
  });

  await ui5.waitForUI5();

  // 3. Verify results in table
  await expect(ui5.table.getRowCount('smartTable')).resolves.toBeGreaterThan(0);

  // 4. Select first row
  await ui5.table.selectRow('smartTable', 0);
});
```

### Filter Bar Fields

```typescript
// SmartFilterBar fields are SmartFields — target by binding path
await ui5.fill(
  {
    controlType: 'sap.ui.comp.smartfield.SmartField',
    bindingPath: { propertyPath: 'PurchaseOrder' },
  },
  '4500001234',
);

// Or target the inner sap.m.Input directly (after SmartField renders)
await ui5.fill(
  {
    controlType: 'sap.m.Input',
    ancestor: { controlType: 'sap.ui.comp.smartfilterbar.SmartFilterBar' },
    properties: { name: 'PurchaseOrder' },
  },
  '4500001234',
);
```

---

## ObjectPage Pattern

A Fiori Elements ObjectPage has:

- **DynamicPage / ObjectPageLayout** — overall layout
- **ObjectPageHeader** — object title, breadcrumb, status indicators
- **ObjectPageSection** — content sections
- **SmartForm** — form fields using SmartField controls

```typescript
test('view and edit a purchase order', async ({ ui5, ui5Navigation }) => {
  await ui5Navigation.navigateToApp('PurchaseOrder-manage');
  await ui5Navigation.navigateToHash("#PurchaseOrder-manage&/PurchaseOrder('4500001234')");
  await ui5.waitForUI5();

  // Read header title
  const title = await ui5.getText({
    controlType: 'sap.m.Title',
    ancestor: { controlType: 'sap.f.DynamicPageTitle' },
  });

  // Click Edit button
  await ui5.click({
    controlType: 'sap.m.Button',
    properties: { text: 'Edit' },
  });

  // Edit a SmartForm field
  await ui5.fill(
    {
      controlType: 'sap.ui.comp.smartfield.SmartField',
      bindingPath: { propertyPath: 'PurchasingOrganization' },
    },
    '1000',
  );

  // Save
  await ui5.click({ controlType: 'sap.m.Button', properties: { text: 'Save' } });
  await ui5.waitForUI5();
});
```

---

## SmartTable

Praman's `ui5.table.*` works with both `sap.ui.comp.smarttable.SmartTable` and
standard `sap.m.Table` / `sap.ui.table.Table`.

```typescript
// Get all rows from a SmartTable
const rows = await ui5.table.getRows('mySmartTableId');

// Get row count
const count = await ui5.table.getRowCount('mySmartTableId');

// Get cell value at row 0, column 1
const cellText = await ui5.table.getCellValue('mySmartTableId', 0, 1);

// Get all table data as 2D array
const data = await ui5.table.getTableData('mySmartTableId');

// Select row by index
await ui5.table.selectRow('mySmartTableId', 0);

// Select all rows
await ui5.table.selectAllRows('mySmartTableId');
```

### Detecting Table Type

Praman auto-detects the table variant:

| Control Type                        | Variant         | Notes                                                 |
| ----------------------------------- | --------------- | ----------------------------------------------------- |
| `sap.m.Table`                       | Responsive      | Mobile-friendly, shows rows as cards on small screens |
| `sap.ui.table.Table`                | Grid/Analytical | Classic desktop table, fixed columns                  |
| `sap.ui.comp.smarttable.SmartTable` | Smart           | Wraps m.Table or ui.table.Table                       |
| `sap.m.List`                        | List            | Item list with `sap.m.StandardListItem`               |
| `sap.m.GrowingList`                 | Growing         | Lazy-loading list                                     |
| `sap.ui.table.AnalyticalTable`      | Analytical      | With aggregations                                     |

---

## SmartFilterBar

```typescript
// Get current filter values
const filterValue = await ui5.getValue({
  controlType: 'sap.ui.comp.smartfield.SmartField',
  bindingPath: { propertyPath: 'Supplier' },
});

// Clear all filters (click the "Clear" button in filter bar)
await ui5.click({
  controlType: 'sap.m.Button',
  properties: { text: 'Clear' },
  ancestor: { controlType: 'sap.ui.comp.smartfilterbar.SmartFilterBar' },
});

// Adapt filters (open the Adapt Filters dialog)
await ui5.click({
  controlType: 'sap.m.Button',
  properties: { text: 'Adapt Filters' },
});
```

---

## FE Test Library

Praman includes a FE-specific library for common Fiori Elements patterns:

```typescript
import { initializeFETestLibrary, type FETestLibraryInstance } from 'playwright-praman/fe';

test('FE list report', async ({ page }) => {
  const fe = await initializeFETestLibrary(page);

  // List Report operations
  // NOTE: The fluent API methods below (fe.filterBar.setField, fe.table.getCount, etc.)
  // are illustrative. Verify the actual API surface against src/fe/fe-test-library.ts
  // as method names and signatures may differ from this documented pattern.
  await fe.filterBar.setField('Supplier', 'SUP-001');
  await fe.filterBar.search();
  const rowCount = await fe.table.getCount();

  // Object Page operations
  await fe.table.selectRow(0);
  await fe.objectPage.clickEdit();
  await fe.objectPage.setField('PurchasingOrg', '1000');
  await fe.objectPage.save();
});
```

**Available FE modules** (from `playwright-praman/fe`):

- `ListReportPage` — filter bar + table operations
- `ObjectPage` — header, sections, form fields
- `FETableHelpers` — table read/select operations
- `FEListHelpers` — list item operations
- `getFilterBarFieldValue` — read filter bar field values
