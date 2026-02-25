# Table, Dialog, and Date Picker Reference

## Table of Contents

1. [Table Operations](#table-operations)
2. [Table Variants](#table-variants)
3. [Dialog Operations](#dialog-operations)
4. [Date Picker Operations](#date-picker-operations)
5. [Fixture Import](#fixture-import)

---

## Table Operations

All table operations are accessible via `ui5.table.*` from the test fixture.

### Reading Table Data

```typescript
import { test, expect } from 'playwright-praman';

test('read table data', async ({ ui5 }) => {
  // Get row count
  const count = await ui5.table.getRowCount('myTableId');

  // Get cell value at row 0, column 2
  const cell = await ui5.table.getCellValue('myTableId', 0, 2);

  // Get all rows (returns array of row objects)
  const rows = await ui5.table.getRows('myTableId');

  // Get full table data as 2D array [row][col]
  const data = await ui5.table.getData('myTableId');
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
await ui5.table.selectAll('myTableId');

// Deselect all rows
await ui5.table.deselectAll('myTableId');

// Get currently selected row indices
const selected = await ui5.table.getSelectedRows('myTableId');
// e.g. [0, 2]
```

### Filtering and Sorting (Grid Table)

```typescript
// Filter by column (sap.ui.table.Table only)
await ui5.table.filterByColumn('myTableId', 1, 'Active');

// Sort by column (column index, not name)
await ui5.table.sortByColumn('myTableId', 0);

// Wait for table data to load (after navigation or filter change)
await ui5.table.waitForData('myTableId', { timeout: 15_000 });
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

All dialog operations are accessible via `ui5.dialog.*` from the test fixture.

### Basic Dialog Interaction

```typescript
import { test, expect } from 'playwright-praman';

test('confirm a dialog', async ({ ui5 }) => {
  // Trigger dialog (e.g. click Delete)
  await ui5.click({ controlType: 'sap.m.Button', properties: { text: 'Delete' } });

  // Wait for dialog to appear
  await ui5.dialog.waitFor();

  // Confirm (click OK, Yes, Save, etc.)
  await ui5.dialog.confirm();

  // Or dismiss (click Cancel, No, Close)
  await ui5.dialog.dismiss();
});
```

### Dialog Inspection

```typescript
// Get list of open dialogs
const dialogs = await ui5.dialog.getOpen();
// Returns: { id, title, type, isOpen }[]

// Check if specific dialog is open
const isOpen = await ui5.dialog.isOpen('deleteConfirmDialog');

// Wait for dialog to close
await ui5.dialog.waitForClosed('deleteConfirmDialog');

// Get dialog buttons
const buttons = await ui5.dialog.getButtons('deleteConfirmDialog');
// Returns: { text, type, enabled }[]
```

### Specific Dialog Types

```typescript
// Confirm a delete dialog
await ui5.dialog.confirm({ buttonText: 'Delete' });

// Dismiss a validation warning
await ui5.dialog.dismiss({ buttonText: 'Cancel' });

// Find dialog by title
await ui5.dialog.waitFor({ title: 'Error' });
await ui5.dialog.dismiss({ dialogId: 'errorMessageDialog' });
```

### MessageBox / MessageDialog

```typescript
// SAP's MessageBox (sap.m.MessageBox) pattern
await ui5.click({ controlType: 'sap.m.Button', properties: { text: 'Save' } });

// After save triggers a message dialog:
await ui5.dialog.waitFor();
const buttons = await ui5.dialog.getButtons('messageDialog');
// buttons: [{ text: 'OK', type: 'Emphasized', enabled: true }]
await ui5.dialog.confirm();
```

---

## Date Picker Operations

All date operations are accessible via `ui5.date.*` from the test fixture.

### Setting Dates

```typescript
import { test, expect } from 'playwright-praman';

test('set delivery date', async ({ ui5 }) => {
  // Set date by ISO string (YYYY-MM-DD)
  await ui5.date.setDatePicker('deliveryDatePicker', '2024-03-15');

  // Set and validate date (sets value then verifies it was accepted)
  await ui5.date.setAndValidate('deliveryDatePicker', '2024-03-15');

  // Set time picker
  await ui5.date.setTimePicker('startTimePicker', '09:00');
});
```

### Reading Dates

```typescript
// Get current date value (as ISO string)
const isoDate = await ui5.date.getDatePicker('deliveryDatePicker');
// e.g. '2024-03-15'

// Get time picker value
const time = await ui5.date.getTimePicker('startTimePicker');
// e.g. '09:00'
```

### Date Format Reference

| Format   | Example          | Use Case                          |
| -------- | ---------------- | --------------------------------- |
| ISO 8601 | `2024-03-15`     | Recommended for `setDatePicker()` |
| US       | `03/15/2024`     | English locale display            |
| EU       | `15.03.2024`     | German/European locale display    |
| Long US  | `March 15, 2024` | US long-form                      |
| Long EU  | `15. März 2024`  | German long-form                  |

**Locale handling**: Always use ISO format for programmatic date setting. Praman
converts ISO to the picker's configured format internally.

### Date Range Picker

```typescript
// sap.m.DateRangePicker
await ui5.date.setDateRange('dateRangePicker', '2024-01-01', '2024-03-31');

const [start, end] = await ui5.date.getDateRange('dateRangePicker');
```

---

## Fixture Import

The test fixture provides `ui5.table`, `ui5.dialog`, and `ui5.date` sub-namespaces.

```typescript
import { test, expect } from 'playwright-praman';

test('complete workflow', async ({ ui5, ui5Navigation }) => {
  // Navigation
  await ui5Navigation.navigateToApp('PurchaseOrder-manage');

  // Filter: date range
  await ui5.date.setDatePicker('validFromPicker', '2024-01-01');

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
  await ui5.dialog.waitFor();
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
