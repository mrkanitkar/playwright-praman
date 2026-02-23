---
sidebar_position: 12
title: Custom Matchers
---

Praman extends Playwright's `expect()` with 10 UI5-specific matchers that query control state
directly from the UI5 runtime. These matchers check the **UI5 model/control state**, not the
DOM — which is the source of truth in SAP applications.

## Key Difference From Playwright Matchers

Standard Playwright matchers inspect DOM attributes:

```typescript
// Playwright: checks DOM attribute
await expect(page.locator('#saveBtn')).toBeEnabled();
```

Praman matchers query the UI5 control API:

```typescript
// Praman: checks UI5 control state via sap.ui.getCore().byId()
await expect(page).toBeUI5Enabled('saveBtn');
```

Why does this matter? A control can appear enabled in the DOM but be disabled in the UI5 model
(e.g., during a pending OData operation). The UI5 state is the source of truth.

## Important: Matchers Receive controlId, Not Locator

Unlike Playwright's built-in matchers that operate on `Locator` objects, Praman matchers receive
a **control ID string** as their first argument and are called on `page`:

```typescript
// Correct — pass string controlId to page expectation
await expect(page).toHaveUI5Text('headerTitle', 'Purchase Order');

// Wrong — these are NOT locator-based matchers
// await expect(locator).toHaveUI5Text('Purchase Order'); // Does not work
```

## All 10 Matchers

### toHaveUI5Text

Asserts the `text` property of a control matches the expected value. Supports both exact string
and RegExp matching.

```typescript
await expect(page).toHaveUI5Text('headerTitle', 'Purchase Order Details');
await expect(page).toHaveUI5Text('headerTitle', /Purchase Order/);
```

**Error message preview:**

```
Expected: "Purchase Order Details"
Received: "Sales Order Details"
Control: headerTitle (sap.m.Title)
```

### toBeUI5Visible

Asserts the control's `visible` property is `true`.

```typescript
await expect(page).toBeUI5Visible('saveBtn');
```

**Negation:**

```typescript
await expect(page).not.toBeUI5Visible('hiddenPanel');
```

### toBeUI5Enabled

Asserts the control's `enabled` property is `true`.

```typescript
await expect(page).toBeUI5Enabled('submitBtn');
```

**Negation:**

```typescript
await expect(page).not.toBeUI5Enabled('disabledInput');
```

### toHaveUI5Property

Asserts any named property of a control matches the expected value.

```typescript
await expect(page).toHaveUI5Property('vendorInput', 'value', '100001');
await expect(page).toHaveUI5Property('saveBtn', 'type', 'Emphasized');
await expect(page).toHaveUI5Property('statusIcon', 'src', /accept/);
```

### toHaveUI5ValueState

Asserts the control's `valueState` property matches one of the UI5 value states.

```typescript
await expect(page).toHaveUI5ValueState('vendorInput', 'Error');
await expect(page).toHaveUI5ValueState('amountField', 'Success');
await expect(page).toHaveUI5ValueState('noteInput', 'None');
```

Valid value states: `'None'`, `'Success'`, `'Warning'`, `'Error'`, `'Information'`.

### toHaveUI5Binding

Asserts the control has an OData binding at the specified path.

```typescript
await expect(page).toHaveUI5Binding('vendorField', '/PurchaseOrder/Vendor');
await expect(page).toHaveUI5Binding('priceField', '/PO/NetAmount');
```

### toBeUI5ControlType

Asserts the control's fully qualified type name.

```typescript
await expect(page).toBeUI5ControlType('saveBtn', 'sap.m.Button');
await expect(page).toBeUI5ControlType('mainTable', 'sap.ui.table.Table');
```

### toHaveUI5RowCount

Asserts the number of rows in a table control.

```typescript
await expect(page).toHaveUI5RowCount('poTable', 5);
await expect(page).toHaveUI5RowCount('emptyTable', 0);
```

### toHaveUI5CellText

Asserts the text content of a specific table cell by row and column index (both zero-based).

```typescript
await expect(page).toHaveUI5CellText('poTable', 0, 0, '4500000001');
await expect(page).toHaveUI5CellText('poTable', 0, 2, 'Active');
await expect(page).toHaveUI5CellText('poTable', 1, 3, /pending/i);
```

### toHaveUI5SelectedRows

Asserts which row indices are currently selected in a table.

```typescript
await expect(page).toHaveUI5SelectedRows('poTable', [0, 2]);
await expect(page).toHaveUI5SelectedRows('poTable', []); // No selection
```

## Auto-Retry Mechanism

All Praman matchers are registered as async custom matchers. They query the UI5 runtime via
`page.evaluate()` on each poll iteration. Playwright's `expect()` auto-retries failed assertions
until the configured timeout (default 5 seconds).

This means you do not need manual retry loops:

```typescript
// This auto-retries for up to 5 seconds:
await expect(page).toHaveUI5Text('statusField', 'Approved');
```

For longer waits, increase the timeout:

```typescript
await expect(page).toHaveUI5Text('statusField', 'Approved', { timeout: 15_000 });
```

## Using expect.poll() With UI5 Methods

For custom assertions beyond the 10 built-in matchers, use `expect.poll()` with `ui5.*` methods:

```typescript
// Poll until the control value matches
await expect
  .poll(async () => ui5.getProperty({ id: 'vendorInput' }, 'value'), { timeout: 10_000 })
  .toBe('100001');

// Poll for table row count
await expect
  .poll(async () => ui5.table.getRowCount('poTable'), { timeout: 15_000 })
  .toBeGreaterThan(0);
```

## Comparison With Playwright Built-In Matchers

| Matcher Type               | Source of Truth          | Auto-Retry | Needs Locator           |
| -------------------------- | ------------------------ | ---------- | ----------------------- |
| Playwright `toBeEnabled()` | DOM `disabled` attribute | Yes        | Yes (`Locator`)         |
| Praman `toBeUI5Enabled()`  | UI5 `getEnabled()` API   | Yes        | No (string `controlId`) |
| Playwright `toHaveText()`  | DOM `textContent`        | Yes        | Yes (`Locator`)         |
| Praman `toHaveUI5Text()`   | UI5 `getText()` API      | Yes        | No (string `controlId`) |
| Playwright `toBeVisible()` | DOM intersection/display | Yes        | Yes (`Locator`)         |
| Praman `toBeUI5Visible()`  | UI5 `getVisible()` API   | Yes        | No (string `controlId`) |

Use Praman matchers when you need to check the UI5 model state. Use Playwright matchers when you
need to verify DOM-level rendering (e.g., CSS visibility, element position).

## Complete Example

```typescript
import { test, expect } from 'playwright-praman';

test('validate purchase order form', async ({ ui5, page }) => {
  // Check form state
  await expect(page).toBeUI5Visible('vendorInput');
  await expect(page).toBeUI5Enabled('vendorInput');

  // Fill and validate
  await ui5.fill({ id: 'vendorInput' }, 'INVALID');
  await expect(page).toHaveUI5ValueState('vendorInput', 'Error');

  await ui5.fill({ id: 'vendorInput' }, '100001');
  await expect(page).toHaveUI5ValueState('vendorInput', 'None');
  await expect(page).toHaveUI5Text('vendorName', 'Acme Corp');

  // Check binding
  await expect(page).toHaveUI5Binding('vendorInput', '/PurchaseOrder/Vendor');

  // Verify table
  await expect(page).toHaveUI5RowCount('itemTable', 3);
  await expect(page).toHaveUI5CellText('itemTable', 0, 0, 'MAT-001');
  await expect(page).toHaveUI5CellText('itemTable', 0, 1, '10');

  // Check button states
  await expect(page).toBeUI5Enabled('saveBtn');
  await expect(page).not.toBeUI5Enabled('deleteBtn');
  await expect(page).toBeUI5ControlType('saveBtn', 'sap.m.Button');
});
```

## Registration

Matchers are auto-registered via the `matcherRegistration` worker-scoped auto-fixture. No setup
code is needed — just import `{ expect }` from `playwright-praman` and the matchers are available.

```typescript
import { test, expect } from 'playwright-praman';
// All 10 matchers are ready to use
```
