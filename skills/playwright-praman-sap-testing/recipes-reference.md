# Praman Recipes Reference

> **Generated**: 2026-02-27 — do not edit manually, run `npm run generate:skill-md`
> 14 recipes extracted from recipes.yaml

## Button Click

**Domain**: ui5 | **Priority**: essential

Press a UI5 button by matching its text property. Supports both explicit control acquisition with press() and the shorthand click() helper.

```typescript
import { test, expect } from 'playwright-praman';

// Explicit: acquire the control, then press
const btn = await ui5.control({ controlType: 'sap.m.Button', properties: { text: 'Save' } });
await btn.press();

// Shorthand
await ui5.click({ controlType: 'sap.m.Button', properties: { text: 'Save' } });
```

---

## Input Fill

**Domain**: ui5 | **Priority**: essential

Fill a UI5 input field by ID. Always call setValue(), fireChange(), and waitForUI5() to ensure the model binding is updated. The shorthand fill() helper bundles all three steps.

```typescript
import { test, expect } from 'playwright-praman';

// Explicit: setValue + fireChange + waitForUI5
const input = await ui5.control({ id: 'materialInput' });
await input.setValue('MAT-001');
await input.fireChange({ value: 'MAT-001' });
await ui5.waitForUI5();

// Shorthand
await ui5.fill({ id: 'materialInput' }, 'MAT-001');
```

---

## Dropdown Select (ComboBox)

**Domain**: ui5 | **Priority**: essential

Select an item in a sap.m.ComboBox by opening the dropdown, setting the selected key, firing the change event, then closing and waiting for UI5 to stabilize.

```typescript
import { test, expect } from 'playwright-praman';

const combo = await ui5.control({ id: 'variantUsage-comboBoxEdit' });
await combo.open();
await combo.setSelectedKey('1');
await combo.fireChange({ value: '1' });
await combo.close();
await ui5.waitForUI5();
```

---

## Table Read Data

**Domain**: table | **Priority**: essential

Read rows, row count, and full data from a UI5 table by its ID. Use these helpers to inspect table contents in assertions or to drive data-dependent test logic.

```typescript
import { test, expect } from 'playwright-praman';

const rows = await ui5.table.getRows('myTableId');
const count = await ui5.table.getRowCount('myTableId');
const data = await ui5.table.getData('myTableId');
```

---

## Table Click Row

**Domain**: table | **Priority**: essential

Click a specific row in a UI5 table by its zero-based index. Triggers navigation or selection depending on the table mode.

```typescript
import { test, expect } from 'playwright-praman';

await ui5.table.clickRow('myTableId', 0);
```

---

## Table Find Row

**Domain**: table | **Priority**: essential

Locate a table row by matching column values. Returns the zero-based row index that can be passed to clickRow() or used in assertions.

```typescript
import { test, expect } from 'playwright-praman';

const rowIndex = await ui5.table.findRowByValues('myTableId', {
  Material: 'MAT-001',
  Plant: '1000',
});
```

---

## Dialog Handling

**Domain**: dialog | **Priority**: essential

Wait for, confirm, or dismiss UI5 dialogs. Controls inside dialogs REQUIRE the searchOpenDialogs option to be found by the bridge.

```typescript
import { test, expect } from 'playwright-praman';

await ui5.dialog.waitFor();
await ui5.dialog.confirm();
await ui5.dialog.dismiss();

// Controls inside dialogs REQUIRE searchOpenDialogs
const dialogInput = await ui5.control({ id: 'inputInsideDialog', searchOpenDialogs: true });
```

---

## FLP Navigation

**Domain**: navigate | **Priority**: essential

Navigate to a Fiori Launchpad tile by its visible title. Waits for UI5 to stabilize after navigation.

```typescript
import { test, expect } from 'playwright-praman';

await ui5Navigation.navigateToTile('My App Title');
await ui5.waitForUI5();
```

---

## App Navigation (Direct)

**Domain**: navigate | **Priority**: essential

Navigate directly to a Fiori app via semantic object, intent hash, or search. Bypasses the tile-click workflow when the target hash is known.

```typescript
import { test, expect } from 'playwright-praman';

await ui5Navigation.navigateToApp('PurchaseOrder-manage');
await ui5Navigation.navigateToIntent('PurchaseOrder', { action: 'manage' });
await ui5Navigation.searchAndOpenApp('Purchase Order');
```

---

## Date Picker

**Domain**: date | **Priority**: recommended

Set and read date values from sap.m.DatePicker and sap.m.DateRangeSelection controls. Dates use ISO 8601 format (YYYY-MM-DD).

```typescript
import { test, expect } from 'playwright-praman';

await ui5.date.setDatePicker('deliveryDateField', '2026-01-15');
const dateValue = await ui5.date.getDatePicker('deliveryDateField');
await ui5.date.setDateRange('dateRangeField', '2026-01-01', '2026-12-31');
```

---

## OData Query

**Domain**: odata | **Priority**: recommended

Query an OData service for entities, wait for pending requests, and check for unsaved changes. Supports standard OData system query options ($filter, $top, $select, etc.).

```typescript
import { test, expect } from 'playwright-praman';

const serviceUrl = '/sap/opu/odata/sap/API_MATERIAL_SRV/';
const data = await ui5.odata.queryEntities(serviceUrl, 'A_Material', {
  $filter: "Material eq 'MAT-001'",
  $top: 10,
});
await ui5.odata.waitForLoad();
const hasPending = await ui5.odata.hasPendingChanges();
```

---

## Custom Matchers

**Domain**: assert | **Priority**: recommended

Playwright expect() extended with UI5-aware matchers for text, visibility, enabled state, properties, value state, row count, and cell text.

```typescript
import { test, expect } from 'playwright-praman';

await expect(locator).toHaveUI5Text('Expected text');
await expect(locator).toBeUI5Visible();
await expect(locator).toBeUI5Enabled();
await expect(locator).toHaveUI5Property('enabled', true);
await expect(locator).toHaveUI5ValueState('Success');
await expect(locator).toHaveUI5RowCount(5);
await expect(locator).toHaveUI5CellText(0, 2, 'MAT-001');
```

---

## Intent Operation

**Domain**: intent | **Priority**: recommended

High-level intent API for business operations. Core intents map to individual UI actions; domain intents compose multiple steps into a single business operation.

```typescript
import { test, expect } from 'playwright-praman';

// Core intents — single UI actions
await intent.core.fillField('Material', 'MAT-001');
await intent.core.clickButton('Save');
await intent.core.assertField('Status', 'Created');

// Domain intents — composed business operations
await intent.procurement.createPurchaseOrder({
  vendor: 'V001',
  material: 'MAT-001',
  quantity: 10,
  plant: '1000',
});
```

---

## Page Discovery

**Domain**: ai | **Priority**: optional

Use the AI fixture to discover the current page structure, list all available capabilities, or filter capabilities by category. Useful for dynamic test generation and self-healing agents.

```typescript
import { test, expect } from 'playwright-praman';

const context = await pramanAI.discoverPage({ interactiveOnly: true });
const caps = pramanAI.capabilities.forAI();
const tableCaps = pramanAI.capabilities.byCategory('table');
```

---
