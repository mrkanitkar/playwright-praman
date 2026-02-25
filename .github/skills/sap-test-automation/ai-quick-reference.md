# Praman SAP Test Automation — AI Quick Reference

**Package**: `playwright-praman` v1.0.1
**Last Updated**: 2026-02-24

---

## Rule #1: Always Fixture-Only

```typescript
import { test, expect } from 'playwright-praman';
// That's the ONLY import you need.
```

---

## 14 Copy-Paste Patterns

### 1. Button Click

```typescript
// By type + text
const btn = await ui5.control({ controlType: 'sap.m.Button', properties: { text: 'Save' } });
await btn.press();

// Shorthand
await ui5.click({ controlType: 'sap.m.Button', properties: { text: 'Save' } });
```

### 2. Input Fill (setValue + fireChange + waitForUI5 — ALWAYS all three)

```typescript
const input = await ui5.control({ id: 'materialInput' });
await input.setValue('MAT-001');
await input.fireChange({ value: 'MAT-001' });
await ui5.waitForUI5();

// Shorthand
await ui5.fill({ id: 'materialInput' }, 'MAT-001');
```

### 3. Dropdown Select (ComboBox)

```typescript
const combo = await ui5.control({ id: 'variantUsage-comboBoxEdit' });
const items = await combo.getItems();
// Inspect items: const key = await item.getKey(); const text = await item.getText();
await combo.open();
await combo.setSelectedKey('1');
await combo.fireChange({ value: '1' });
await combo.close();
await ui5.waitForUI5();
```

### 4. Table Get Rows

```typescript
const rows = await ui5.table.getRows('myTableId');
const count = await ui5.table.getRowCount('myTableId');
const data = await ui5.table.getData('myTableId');
```

### 5. Table Click Row

```typescript
await ui5.table.clickRow('myTableId', 0); // click row at index 0
```

### 6. Table Find Row

```typescript
const rowIndex = await ui5.table.findRowByValues('myTableId', {
  Material: 'MAT-001',
  Plant: '1000',
});
```

### 7. Dialog Handling

```typescript
await ui5.dialog.waitFor(); // wait for any dialog to open
const isOpen = await ui5.dialog.isOpen('myDialogId');
await ui5.dialog.confirm(); // click OK/Confirm
await ui5.dialog.dismiss(); // click Cancel/Close
const buttons = await ui5.dialog.getButtons('myDialogId');
await ui5.dialog.waitForClosed('myDialogId');

// Controls inside dialogs REQUIRE searchOpenDialogs
const dialogInput = await ui5.control({
  id: 'inputInsideDialog',
  searchOpenDialogs: true,
});
```

### 8. FLP Navigation

```typescript
await ui5Navigation.navigateToTile('My App Title');
await ui5.waitForUI5();
```

### 9. App Navigation (Direct)

```typescript
await ui5Navigation.navigateToApp('PurchaseOrder-manage');
await ui5Navigation.navigateToIntent({ semanticObject: 'PurchaseOrder', action: 'manage' });
await ui5Navigation.searchAndOpenApp('Purchase Order');
```

### 10. Date Picker

```typescript
await ui5.date.setDatePicker('deliveryDateField', '2026-01-15');
const dateValue = await ui5.date.getDatePicker('deliveryDateField');
await ui5.date.setDateRange('dateRangeField', '2026-01-01', '2026-12-31');
```

### 11. OData Query

```typescript
const serviceUrl = '/sap/opu/odata/sap/API_MATERIAL_SRV/';
const data = await ui5.odata.queryEntities(serviceUrl, 'A_Material', {
  $filter: "Material eq 'MAT-001'",
  $top: 10,
});
await ui5.odata.waitForLoad();
const hasPending = await ui5.odata.hasPendingChanges();
```

### 12. Custom Matchers

```typescript
await expect(locator).toHaveUI5Text('Expected text');
await expect(locator).toBeUI5Visible();
await expect(locator).toBeUI5Enabled();
await expect(locator).toHaveUI5Property('enabled', true);
await expect(locator).toHaveUI5ValueState('Success');
await expect(locator).toHaveUI5RowCount(5);
await expect(locator).toHaveUI5CellText(0, 2, 'MAT-001');
```

### 13. Intent Operation

```typescript
await intent.procurement.createPurchaseOrder({
  vendor: 'V001',
  material: 'MAT-001',
  quantity: 10,
  plant: '1000',
});

await intent.core.fillField('Material', 'MAT-001');
await intent.core.clickButton('Save');
await intent.core.assertField('Status', 'Created');
```

### 14. Page Discovery

```typescript
const context = await pramanAI.discoverPage({ interactiveOnly: true });
const caps = await pramanAI.capabilities.forAI();
const tableCaps = await pramanAI.capabilities.byCategory('table');
```

---

## Complete Fixture List

### Primary (always available)

| Fixture         | Sub-namespaces                                                                 |
| --------------- | ------------------------------------------------------------------------------ |
| `ui5`           | `.table`, `.dialog`, `.date`, `.odata`                                         |
| `ui5Navigation` | —                                                                              |
| `sapAuth`       | —                                                                              |
| `fe`            | `.listReport`, `.objectPage`, `.table`, `.list`                                |
| `intent`        | `.core`, `.procurement`, `.sales`, `.finance`, `.manufacturing`, `.masterData` |
| `pramanAI`      | `.capabilities`, `.recipes`, `.agentic`, `.llm`, `.vocabulary`                 |

### Support

`ui5Shell`, `ui5Footer`, `flpLocks`, `flpSettings`, `testData`, `btpWorkZone`

### Auto (never request)

`selectorRegistration`, `matcherRegistration`, `requestInterceptor`, `ui5Stability`, `playwrightCompat`

---

## Auth Pattern

```typescript
// ✅ CORRECT — in seed file only (tests/seeds/sap-seed.spec.ts)
import { test, expect } from 'playwright-praman';
test('sap-seed', async ({ page, ui5, sapAuth }) => {
  await page.goto(process.env['SAP_CLOUD_BASE_URL'] ?? '', {
    waitUntil: 'networkidle',
    timeout: 60_000,
  });
  await sapAuth.login(page, {
    url: process.env['SAP_CLOUD_BASE_URL'],
    username: process.env['SAP_CLOUD_USERNAME'],
    password: process.env['SAP_CLOUD_PASSWORD'],
    strategy: process.env['SAP_AUTH_STRATEGY'],
  });
  await ui5.waitForUI5();
  expect(await sapAuth.isAuthenticated(page)).toBe(true);
});

// ❌ WRONG — auth in test body
test('my test', async ({ sapAuth, page }) => {
  await sapAuth.loginFromEnv(page); // NEVER here
});
```

---

## Forbidden Patterns (Scan Before Writing)

```text
page.click('#__...')               → ui5.control().press()
page.fill('#__...')                → ui5.control().setValue()
page.locator('[data-sap-ui]')     → ui5.control()
page.locator('.sapM...')           → ui5.control({ controlType })
page.$$('tr')                      → ui5.table.getRows()
page.click('text=...')             → ui5.control({ properties: { text } })
from '@playwright/test'            → 'playwright-praman'
from 'dhikraft'                    → 'playwright-praman'
new UI5Handler(...)                → fixture-only pattern
.initialize()                      → auto-init via fixtures
.injectBridgeLate()                → auto-inject via fixtures
.waitForUI5Stable()                → ui5.waitForUI5()
ui5Table.getTableRows(...)         → ui5.table.getRows()
navigation.openTileByTitle(...)    → ui5Navigation.navigateToTile()
intentWrappers.*                   → intent.core.*
dialog.waitForDialog(...)          → ui5.dialog.waitFor()
sapAuth.loginFromEnv() in test     → Only in seed
page.waitForTimeout(...)           → BANNED
```

---

## Dhikraft → Praman Migration

| dhikraft API                                  | Praman API                                |
| --------------------------------------------- | ----------------------------------------- |
| `ui5Table.getTableRows(page, id)`             | `ui5.table.getRows(id)`                   |
| `ui5Table.clickTableRowWhere(page, id, vals)` | `ui5.table.clickRow(id, rowIndex)`        |
| `navigation.openTileByTitle(title)`           | `ui5Navigation.navigateToTile(title)`     |
| `navigation.back()`                           | `ui5Navigation.navigateBack()`            |
| `navigation.goToFLPHome()`                    | `ui5Navigation.navigateToHome()`          |
| `intentWrappers.fillField(label, val)`        | `intent.core.fillField(label, val)`       |
| `intentWrappers.clickButton(text)`            | `intent.core.clickButton(text)`           |
| `intentWrappers.selectFromDropdown(l, v)`     | `intent.core.selectOption(l, v)`          |
| `intentWrappers.verifyMessageDisplayed(msg)`  | `intent.core.assertField(label, val)`     |
| `bulkDiscovery.discoverPage()`                | `pramanAI.discoverPage()`                 |
| `capabilities.list()`                         | `pramanAI.capabilities.list()`            |
| `odata.query(entitySet)`                      | `ui5.odata.queryEntities(url, entitySet)` |
| `dialog.waitForDialog(...)`                   | `ui5.dialog.waitFor()`                    |

---

## V2 vs V4 Quick Lookup

### V2 SmartField Controls

```typescript
// SmartField wraps inner controls — get inner control by suffix
const materialInput = await ui5.control({ id: 'fragment--material-input' }); // or -comboBoxEdit, -datePicker
await materialInput.setValue('MAT-001');
await materialInput.fireChange({ value: 'MAT-001' });

// ComboBox (V2)
const combo = await ui5.control({ id: 'fragment--usage-comboBoxEdit' });
await combo.open();
await combo.setSelectedKey('1');
await combo.fireChange({ value: '1' });
await combo.close();
```

### V4 MDC Controls

```typescript
// V4 uses long IDs — ALWAYS use const map
const SRVD = 'com.sap.gateway.srvd.servicename.v0001';
const IDS = {
  dialog: `fe::APD_::${SRVD}.CreateAction`,
  dialogOk: `fe::APD_::${SRVD}.CreateAction::Action::Ok`,
  materialField: 'APD_::Material',
  materialInner: 'APD_::Material-inner',
  materialVHIcon: 'APD_::Material-inner-vhi',
  materialVH: `${SRVD}.CreateAction::Material::FieldValueHelp`,
} as const;

// MDC Field (V4 — outer)
const materialField = await ui5.control({ id: IDS.materialField });
await materialField.setValue('MAT-001');

// MDC FieldInput (V4 — inner, triggers binding)
const materialInner = await ui5.control({ id: IDS.materialInner });
await materialInner.fireChange({ value: 'MAT-001' });
await ui5.waitForUI5();

// MDC ValueHelp (V4)
const materialVH = await ui5.control({ id: IDS.materialVH });
await materialVH.open();
for (let i = 0; i < 10; i++) {
  if (await materialVH.isOpen()) break;
  await new Promise((r) => setTimeout(r, 500));
}
const vhTable = await ui5.control({ id: IDS.materialVHInnerTable });
const ctx = await vhTable.getContextByIndex(0);
if (ctx) {
  const data = await ctx.getObject();
}
await materialVH.close();
```

---

## Compliance Report Template

Place this TSDoc header at the top of every generated test:

```typescript
/**
 * {APP NAME} — {Scenario Name}
 *
 * COMPLIANCE: 100% Praman fixture-only
 * Generated by: praman-sap-planner v1.0.0
 * Date: YYYY-MM-DD
 * System URL: https://...
 * UI5 Version: 1.xxx.x
 * Seed: tests/seeds/sap-seed.spec.ts
 *
 * Controls Discovered: N
 * UI5 Elements Interacted: N
 * Using Praman Fixtures: N (100%)
 * Using Playwright Native: 0 (0%)
 * Auth Method: seed-inline
 * Forbidden Pattern Scan: PASSED
 * Fixtures Used: ui5.control (X), ui5.table.getRows (Y), ui5Navigation.navigateToTile (Z)
 */
```
