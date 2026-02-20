# Table, Dialog, and Date Picker Reference

## Table of Contents

1. [Table Operations](#table-operations)
2. [Table Variants](#table-variants)
3. [Dialog Operations](#dialog-operations)
4. [Date Picker Operations](#date-picker-operations)
5. [moduleTest Fixture](#moduletest-fixture)

---

## Table Operations

All table operations are accessible via `ui5.table.*` from the `moduleTest` fixture.

### Reading Table Data

```typescript
import { moduleTest as test } from 'playwright-praman';

test('read table data', async ({ ui5 }) => {
  // Get row count
  const count = await ui5.table.getRowCount('myTableId');

  // Get cell value at row 0, column 2
  const cell = await ui5.table.getCellValue('myTableId', 0, 2);

  // Get all rows (returns array of row objects)
  const rows = await ui5.table.getRows('myTableId');

  // Get full table data as 2D array [row][col]
  const data = await ui5.table.getTableData('myTableId');
  console.log(data[0]?.[1]); // row 0, col 1
});
```

### Row Selection

```typescript
// Select a single row by index
await ui5.table.selectRow('myTableId', 0);

// Select multiple rows
await ui5.table.selectRow('myTableId', 0);
await ui5.table.selectRow('myTableId', 2);

// Select all rows
await ui5.table.selectAllRows('myTableId');

// Deselect all rows
await ui5.table.deselectAllRows('myTableId');

// Get currently selected row indices
const selected = await ui5.table.getSelectedRows('myTableId');
// e.g. [0, 2]
```

### Filtering and Sorting (Grid Table)

```typescript
// Filter by column (sap.ui.table.Table only)
await ui5.table.filterByColumn('myTableId', 1, 'Active');

// Sort by column
await ui5.table.sortByColumn('myTableId', 0, 'ascending');

// Wait for table data to load (after navigation or filter change)
await ui5.table.waitForTableData('myTableId', { timeout: 15_000 });
```

### Custom Matchers for Tables

```typescript
import { expect } from 'playwright-praman';

// Assert row count
await expect(tableControl).toHaveUI5RowCount(5);

// Assert selected rows
await expect(tableControl).toHaveUI5SelectedRows([0, 2]);

// Assert specific cell text
await expect(tableControl).toHaveUI5CellText(0, 1, 'Active');
```

---

## Table Variants

Praman auto-detects which table variant is in use:

| Variant        | Control Type                        | Description                                                 | Detection                        |
| -------------- | ----------------------------------- | ----------------------------------------------------------- | -------------------------------- |
| **Responsive** | `sap.m.Table`                       | Mobile-friendly; rows collapse to cards on small screens    | Default for most Fiori apps      |
| **Grid**       | `sap.ui.table.Table`                | Classic desktop table; fixed columns; frozen rows           | `sap-ui-table` prefix            |
| **Analytical** | `sap.ui.table.AnalyticalTable`      | Grid table with aggregations                                | Inherits Grid detection          |
| **SmartTable** | `sap.ui.comp.smarttable.SmartTable` | Wraps Responsive or Grid; auto-generates columns from OData | Detected via SmartTable metadata |
| **Tree**       | `sap.ui.table.TreeTable`            | Hierarchical data                                           | Inherits Grid detection          |
| **List**       | `sap.m.List`                        | Simple item list; not a table per se                        | Fallback for list items          |

**Finding your table ID**:

```typescript
// Inspect the app, or use:
const tables = await ui5.controls({ controlType: 'sap.m.Table' });
const gridTables = await ui5.controls({ controlType: 'sap.ui.table.Table' });
const smartTables = await ui5.controls({ controlType: 'sap.ui.comp.smarttable.SmartTable' });
```

---

## Dialog Operations

All dialog operations are accessible via `ui5.dialog.*` from the `moduleTest` fixture.

### Basic Dialog Interaction

```typescript
import { moduleTest as test } from 'playwright-praman';

test('confirm a dialog', async ({ ui5 }) => {
  // Trigger dialog (e.g. click Delete)
  await ui5.click({ controlType: 'sap.m.Button', properties: { text: 'Delete' } });

  // Wait for dialog to appear
  await ui5.dialog.waitForDialog();

  // Confirm (click OK, Yes, Save, etc.)
  await ui5.dialog.confirm();

  // Or dismiss (click Cancel, No, Close)
  await ui5.dialog.dismiss();
});
```

### Dialog Inspection

```typescript
// Get list of open dialogs
const dialogs = await ui5.dialog.getOpenDialogs();
// Returns: { id, title, type, isOpen }[]

// Check if specific dialog is open
const isOpen = await ui5.dialog.isDialogOpen('deleteConfirmDialog');

// Wait for dialog to close
await ui5.dialog.waitForDialogClosed({ timeout: 10_000 });

// Get dialog buttons
const buttons = await ui5.dialog.getDialogButtons();
// Returns: { text, type, enabled }[]
```

### Specific Dialog Types

```typescript
// Confirm a delete dialog
await ui5.dialog.confirmDialog({ buttonText: 'Delete' });

// Dismiss a validation warning
await ui5.dialog.dismissDialog({ buttonText: 'Cancel' });

// Find dialog by title
await ui5.dialog.waitForDialog({ title: 'Error' });
await ui5.dialog.dismissDialog({ dialogId: 'errorMessageDialog' });
```

### MessageBox / MessageDialog

```typescript
// SAP's MessageBox (sap.m.MessageBox) pattern
await ui5.click({ controlType: 'sap.m.Button', properties: { text: 'Save' } });

// After save triggers a message dialog:
await ui5.dialog.waitForDialog();
const buttons = await ui5.dialog.getDialogButtons();
// buttons: [{ text: 'OK', type: 'Emphasized', enabled: true }]
await ui5.dialog.confirm();
```

---

## Date Picker Operations

All date operations are accessible via `ui5.date.*` from the `moduleTest` fixture.

### Setting Dates

```typescript
import { moduleTest as test } from 'playwright-praman';

test('set delivery date', async ({ ui5 }) => {
  // Set date by ISO string (YYYY-MM-DD)
  await ui5.date.setDate('deliveryDatePicker', '2024-03-15');

  // Set date by display format (matches date picker's displayFormat)
  await ui5.date.setDateByDisplayValue('deliveryDatePicker', '03/15/2024');

  // Open the calendar popup and select a date
  await ui5.date.openCalendar('deliveryDatePicker');
  await ui5.date.selectCalendarDate('2024-03-15');
  await ui5.date.confirmCalendar();
});
```

### Reading Dates

```typescript
// Get current date value (as ISO string)
const isoDate = await ui5.date.getDate('deliveryDatePicker');
// e.g. '2024-03-15'

// Get display value (as shown in the input)
const displayDate = await ui5.date.getDisplayValue('deliveryDatePicker');
// e.g. '03/15/2024' or '15.03.2024' depending on locale

// Check if a date picker is enabled
const isEnabled = await ui5.date.isEnabled('deliveryDatePicker');
```

### Date Format Reference

| Format   | Example          | Use Case                       |
| -------- | ---------------- | ------------------------------ |
| ISO 8601 | `2024-03-15`     | Recommended for `setDate()`    |
| US       | `03/15/2024`     | English locale display         |
| EU       | `15.03.2024`     | German/European locale display |
| Long US  | `March 15, 2024` | US long-form                   |
| Long EU  | `15. März 2024`  | German long-form               |

**Locale handling**: Always use ISO format for programmatic date setting. Praman
converts ISO to the picker's configured format internally.

### Date Range Picker

```typescript
// sap.m.DateRangePicker
await ui5.date.setDateRange('dateRangePicker', '2024-01-01', '2024-03-31');

const [start, end] = await ui5.date.getDateRange('dateRangePicker');
```

---

## moduleTest Fixture

The `moduleTest` fixture extends `coreTest` with `ui5.table`, `ui5.dialog`, and `ui5.date`.

```typescript
import { moduleTest as test, expect } from 'playwright-praman';

test('complete workflow', async ({ ui5, ui5Navigation }) => {
  // Navigation (via navTest merged into moduleTest)
  await ui5Navigation.navigateToApp('PurchaseOrder-manage');

  // Filter: date range
  await ui5.date.setDate('validFromPicker', '2024-01-01');

  // Apply filter
  await ui5.click({ controlType: 'sap.m.Button', properties: { text: 'Go' } });
  await ui5.waitForUI5();

  // Table: verify results
  const count = await ui5.table.getRowCount('ordersTable');
  expect(count).toBeGreaterThan(0);

  // Select row
  await ui5.table.selectRow('ordersTable', 0);

  // Delete: confirm dialog
  await ui5.click({ controlType: 'sap.m.Button', properties: { text: 'Delete' } });
  await ui5.dialog.waitForDialog();
  await ui5.dialog.confirm();
  await ui5.waitForUI5();
});
```

**Import hierarchy**:

```text
coreTest    → ui5 (control discovery + interaction)
navTest     → coreTest + ui5Navigation
moduleTest  → navTest + ui5.table + ui5.dialog + ui5.date + ui5.odata
aiTest      → moduleTest + pramanAI (Phase 5)
intentTest  → aiTest + intent (Phase 5)
```
