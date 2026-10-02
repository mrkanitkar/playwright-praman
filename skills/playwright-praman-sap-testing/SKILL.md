# Praman SAP Test Automation — Agent Skill Reference

**Package**: `playwright-praman` v1.0.1
**Import**: `import { test, expect } from 'playwright-praman'`
**Purpose**: Primary instruction set for Praman AI agents (planner, generator, healer)

---

## Step 0: MANDATORY PREFLIGHT (Static Capability Reference)

**Do NOT call runtime APIs** — `pramanAI.capabilities.forAI()` is only available inside running tests, not during agent planning.
Instead, use this static capability table verified against `playwright-praman` v1.0.1 source code.

### PRAMAN_CAPABILITIES

```text
ui5
  control(selector), controls(selector), click(selector), fill(selector, text),
  select(selector, key), clear(selector), waitFor(selector, options?),
  waitForUI5(), check(selector), uncheck(selector), inspect(selector),
  clearCache(), destroy()

ui5.table
  getRows(id), getRowCount(id), getCellValue(id, row, col), getData(id),
  selectRow(id, row), clickRow(id, row), findRowByValues(id, values),
  filterByColumn(id, col, value), sortByColumn(id, col), getColumnNames(id),
  ensureRowVisible(id, row), selectRowByValues(id, values), exportData(id), detectType(id)

ui5.dialog
  waitFor(opts?), getOpen(), isOpen(dialogId), dismiss(opts?),
  confirm(opts?), waitForClosed(dialogId), getButtons(dialogId)

ui5.date
  setDatePicker(id, date), getDatePicker(id), setDateRange(id, start, end),
  getDateRange(id), setTimePicker(id, time), getTimePicker(id), setAndValidate(id, date)

ui5.odata
  getModelData(path), getModelProperty(path), fetchCSRFToken(url),
  createEntity(url, entitySet, data), queryEntities(url, entitySet, opts?),
  updateEntity(...), deleteEntity(...), waitForLoad(), hasPendingChanges(),
  getEntityCount(path), callFunctionImport(url, fn, params?)

ui5Navigation
  navigateToTile(title), navigateToApp(appId), navigateToHash(hash),
  navigateToHome(), navigateToIntent(intent, params?, options?), searchAndOpenApp(title),
  navigateBack(), navigateForward(), getCurrentHash()

sapAuth (SEED ONLY)
  login(page, config), loginFromEnv(page), logout(page),
  isAuthenticated(page), isSessionExpired(timeoutMs?), getSessionInfo()

fe.listReport
  getTable(), getFilterBar(), setFilter(field, value), search(),
  clearFilters(), navigateToItem(rowIndex), getVariants(), selectVariant(name)

fe.objectPage
  navigateToSection(id), getSectionData(id), clickButton(name),
  clickEdit(), clickSave(), getSections(), getHeaderTitle(), isInEditMode()

fe.table
  getRowCount(id), getCellValue(id, row, col), findRow(id, values),
  clickRow(id, row), getColumnNames(id)

fe.list
  getItemCount(id), getItemTitle(id, index), findItemByTitle(id, title),
  clickItem(id, index), selectItem(id, index, selected)

intent.core
  fillField(label, value), clickButton(text), selectOption(label, option),
  assertField(label, expected), confirmAndWait(), waitForSave()

intent.procurement
  createPurchaseOrder(data), approvePurchaseOrder(data),
  searchPurchaseOrders(criteria), createPurchaseRequisition(data),
  confirmGoodsReceipt(data), searchVendors()

intent.sales
  createSalesOrder(data), createQuotation(data), approveQuotation(data),
  searchSalesOrders(criteria), searchCustomers(), checkDeliveryStatus(data)

intent.finance
  createJournalEntry(data), postVendorInvoice(data), processPayment(data)

intent.manufacturing
  createProductionOrder(data), confirmProductionOrder(data)

intent.masterData
  createVendorMaster(data), createCustomerMaster(data), createMaterialMaster(data)

pramanAI
  discoverPage(opts?), buildContext(), capabilities (registry),
  recipes (registry), agentic (handler), llm (service), vocabulary

customMatchers
  toHaveUI5Text(text), toBeUI5Visible(), toBeUI5Enabled(),
  toHaveUI5Property(prop, val), toHaveUI5ValueState(state),
  toHaveUI5RowCount(n), toHaveUI5CellText(row, col, text),
  toHaveUI5SelectedRows(indices), toHaveUI5Binding(path), toBeUI5ControlType(type)

support: ui5Shell, ui5Footer, flpLocks, flpSettings, testData, btpWorkZone
```

---

## Agent Phase vs Test Phase (D37 Boundary)

### During Discovery (Agent Phase — MCP Tools)

- Use `browser_evaluate` / `browser_run_code` with raw `sap.ui.getCore().byId()`
- Use `browser_snapshot` for visual layout verification
- Praman fixtures (`ui5`, `sapAuth`, `intent`) are **NOT available** — they only exist inside the Playwright test runner
- Output via `console.log()` in `browser_run_code`

### During Test Code (Test Phase — Fixtures)

- Use Praman fixtures: `ui5.control()`, `ui5.table.*`, `ui5Navigation.*`, `intent.core.*`
- NEVER use raw `page.click()` / `page.fill()` for UI5 controls
- Fixtures auto-initialize — no `.initialize()` or `.injectBridgeLate()` calls
- Use `ui5.waitForUI5()` instead of `page.waitForTimeout()`

---

## The 7 Mandatory Rules (Non-Negotiable)

| #     | Rule                                                                                                                                                        |
| ----- | ----------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **1** | EVERY UI5 element interaction → `ui5.control()` + proxy methods ONLY                                                                                        |
| **2** | NEVER use Playwright native selectors for UI5 elements (`page.click('#__...')`, `page.fill()`, `page.locator('[data-sap-ui]')`, `page.locator('.sapM...')`) |
| **3** | Non-UI5 elements → Playwright native permitted (must verify element is NOT UI5 first)                                                                       |
| **4** | Fixture-only architecture — `import { test, expect } from 'playwright-praman'`, no internal/src imports                                                     |
| **5** | Auth via seed — raw Playwright auth in seed for agents (`@playwright/test`, no Praman fixtures); setup project for E2E tests                                |
| **6** | Post-generation scan: verify against 16+ forbidden patterns before writing test                                                                             |
| **7** | Include compliance report as TSDoc header comment in every generated test                                                                                   |

---

## Fixture-Only Architecture

```typescript
// ✅ ONLY valid import
import { test, expect } from 'playwright-praman';

// ✅ Fixture destructuring
test('scenario', async ({ page, ui5, ui5Navigation, sapAuth, intent, fe, pramanAI }) => {
  // ...
});

// ❌ FORBIDDEN class imports
import { UI5Handler } from 'playwright-praman'; // NOT ALLOWED
const handler = new UI5Handler(page); // NOT ALLOWED
await handler.initialize(); // NOT ALLOWED
await handler.injectBridgeLate(); // NOT ALLOWED
```

**Auto-fixtures** (activate automatically — NEVER request these explicitly):

- `selectorRegistration`, `matcherRegistration`, `requestInterceptor`, `ui5Stability`, `playwrightCompat`

---

## Fixture Namespace Map

### Primary Fixtures

#### `ui5` — Core UI5 Interaction

| Method         | Signature                                                       | Use Case                         |
| -------------- | --------------------------------------------------------------- | -------------------------------- |
| `control()`    | `(selector: UI5Selector) → proxy`                               | Discover a single control        |
| `controls()`   | `(selector: UI5Selector) → proxy[]`                             | Discover multiple controls       |
| `click()`      | `(selector, opts?)`                                             | Shorthand click                  |
| `fill()`       | `(selector, text)`                                              | Shorthand fill                   |
| `select()`     | `(selector, key)`                                               | Shorthand dropdown select        |
| `clear()`      | `(selector)`                                                    | Clear an input                   |
| `waitFor()`    | `(selector, options?: { timeout?: number; interval?: number })` | Wait for control with options    |
| `waitForUI5()` | `()`                                                            | Wait for UI5 framework stability |
| `check()`      | `(selector)`                                                    | Check a checkbox                 |
| `uncheck()`    | `(selector)`                                                    | Uncheck a checkbox               |
| `inspect()`    | `(selector)`                                                    | Inspect a control                |
| `clearCache()` | `()`                                                            | Clear internal cache             |
| `destroy()`    | `()`                                                            | Cleanup handler                  |

#### `ui5.table` — Table Operations

| Method                                | Description                                   |
| ------------------------------------- | --------------------------------------------- |
| `getRows(tableId, opts?)`             | Get all rows as proxy array                   |
| `getRowCount(tableId)`                | Get number of rows                            |
| `getCellValue(tableId, row, col)`     | Read a cell value                             |
| `getData(tableId)`                    | Get full table data as array                  |
| `selectRow(tableId, row)`             | Select a row by index                         |
| `clickRow(tableId, row)`              | Click a row to navigate                       |
| `findRowByValues(tableId, values)`    | Find row matching key-value pairs             |
| `filterByColumn(tableId, col, value)` | Apply column filter                           |
| `sortByColumn(tableId, col)`          | Sort by column                                |
| `getColumnNames(tableId)`             | Get all column header names                   |
| `ensureRowVisible(tableId, row)`      | Scroll virtual table to row                   |
| `selectRowByValues(tableId, values)`  | Select row matching values                    |
| `exportData(tableId)`                 | Export table data                             |
| `detectType(tableId)`                 | Detect table variant (SmartTable, Grid, etc.) |

#### `ui5.dialog` — Dialog Handling

| Method                    | Description               |
| ------------------------- | ------------------------- |
| `waitFor(opts?)`          | Wait for dialog to open   |
| `getOpen()`               | Get currently open dialog |
| `isOpen(dialogId)`        | Check if dialog is open   |
| `dismiss(opts?)`          | Click Cancel/Close        |
| `confirm(opts?)`          | Click OK/Confirm          |
| `waitForClosed(dialogId)` | Wait for dialog to close  |
| `getButtons(dialogId)`    | Get all dialog buttons    |

#### `ui5.date` — Date/Time Pickers

| Method                                | Description            |
| ------------------------------------- | ---------------------- |
| `setDatePicker(controlId, date)`      | Set date picker value  |
| `getDatePicker(controlId)`            | Read date picker value |
| `setDateRange(controlId, start, end)` | Set date range         |
| `getDateRange(controlId)`             | Read date range        |
| `setTimePicker(controlId, time)`      | Set time picker        |
| `getTimePicker(controlId)`            | Read time picker       |
| `setAndValidate(controlId, date)`     | Set and verify date    |

#### `ui5.odata` — OData Operations

| Method                                        | Description                  |
| --------------------------------------------- | ---------------------------- |
| `getModelData(path)`                          | Read model data at path      |
| `getModelProperty(path)`                      | Read a single property       |
| `fetchCSRFToken(serviceUrl)`                  | Fetch CSRF token             |
| `createEntity(serviceUrl, entitySet, data)`   | Create OData entity          |
| `queryEntities(serviceUrl, entitySet, opts?)` | Query entity set             |
| `updateEntity(...)`                           | Update entity                |
| `deleteEntity(...)`                           | Delete entity                |
| `waitForLoad()`                               | Wait for OData load complete |
| `hasPendingChanges()`                         | Check pending model changes  |
| `getEntityCount(path)`                        | Count entities at path       |
| `callFunctionImport(serviceUrl, fn, params?)` | Call function import         |

### Navigation & Shell Fixtures

#### `ui5Navigation`

| Method                                        | Description                                                                       |
| --------------------------------------------- | --------------------------------------------------------------------------------- |
| `navigateToTile(title)`                       | Click FLP tile by title                                                           |
| `navigateToApp(appId)`                        | Navigate by app ID                                                                |
| `navigateToHash(hash)`                        | Navigate to hash                                                                  |
| `navigateToHome()`                            | Go to FLP home                                                                    |
| `navigateToIntent(intent, params?, options?)` | Semantic object navigation (`intent: { semanticObject: string; action: string }`) |
| `searchAndOpenApp(title)`                     | Search FLP and open app                                                           |
| `navigateBack()`                              | Browser back                                                                      |
| `navigateForward()`                           | Browser forward                                                                   |
| `getCurrentHash()`                            | Read current URL hash                                                             |

#### `sapAuth`

| Method                         | Description                    |
| ------------------------------ | ------------------------------ |
| `login(page, config)`          | Authenticate (seed only)       |
| `loginFromEnv(page)`           | Auth from env vars (seed only) |
| `logout(page)`                 | Logout                         |
| `isAuthenticated(page)`        | Check auth status              |
| `isSessionExpired(timeoutMs?)` | Check session expiry           |
| `getSessionInfo()`             | Read session metadata          |

#### `ui5Shell`

`expectShellHeader()`, `clickHome()`, `openNotifications()`, `openUserMenu()`

#### `ui5Footer`

`clickSave()`, `clickEdit()`, `clickCancel()`, `clickApply()`, `clickCreate()`, `clickDelete()`

### Fiori Elements Fixtures

#### `fe.listReport`

`getTable()`, `getFilterBar()`, `setFilter(field, value)`, `search()`, `clearFilters()`, `navigateToItem(rowIndex)`, `getVariants()`, `selectVariant(name)`, `getFilterValue(field)`

#### `fe.objectPage`

`navigateToSection(id)`, `getSectionData(id)`, `clickButton(name)`, `clickEdit()`, `clickSave()`, `getSections()`, `getHeaderTitle()`, `isInEditMode()`

#### `fe.table`

`getRowCount(tableId)`, `getCellValue(tableId, row, col)`, `findRow(tableId, values)`, `clickRow(tableId, row)`, `getColumnNames(tableId)`

#### `fe.list`

`getItemCount(listId)`, `getItemTitle(listId, index)`, `findItemByTitle(listId, title)`, `clickItem(listId, index)`, `selectItem(listId, index, selected)`

### Intent Fixtures

#### `intent.core`

`fillField(label, value)`, `clickButton(text)`, `selectOption(label, option)`, `assertField(label, expected)`, `confirmAndWait()`, `waitForSave()`

#### `intent.procurement`

`createPurchaseOrder(data)`, `approvePurchaseOrder(data)`, `searchPurchaseOrders(criteria)`, `createPurchaseRequisition(data)`, `confirmGoodsReceipt(data)`, `searchVendors()`

#### `intent.sales`

`createSalesOrder(data)`, `createQuotation(data)`, `approveQuotation(data)`, `searchSalesOrders(criteria)`, `searchCustomers()`, `checkDeliveryStatus(data)`

#### `intent.finance`

`createJournalEntry(data)`, `postVendorInvoice(data)`, `processPayment(data)`

#### `intent.manufacturing`

`createProductionOrder(data)`, `confirmProductionOrder(data)`

#### `intent.masterData`

`createVendorMaster(data)`, `createCustomerMaster(data)`, `createMaterialMaster(data)`

### AI & Utility Fixtures

#### `pramanAI`

`discoverPage(opts?)`, `buildContext()`, `capabilities` (registry), `recipes` (registry), `agentic` (handler), `llm` (service), `vocabulary`

#### Other

- `flpLocks` — `getLockEntries(username?)`, `deleteAllLockEntries(username?)`, `cleanup()`, `getNumberOfLockEntries()`
- `flpSettings` — `getLanguage()`, `getDateFormat()`, `getAllSettings()`, `getTimeFormat()`, `getTimezone()`
- `testData` — `generate(template)`, `save(filename, data)`, `load(filename)`, `cleanup()`
- `btpWorkZone` — BTP WorkZone dual-frame manager

---

## Custom Matchers (Auto-Registered)

```typescript
await expect(locator).toHaveUI5Text('expected text');
await expect(locator).toBeUI5Visible();
await expect(locator).toBeUI5Enabled();
await expect(locator).toHaveUI5Property('enabled', true);
await expect(locator).toHaveUI5ValueState('Success');
await expect(locator).toHaveUI5RowCount(5);
await expect(locator).toHaveUI5CellText(0, 1, 'MAT-001');
await expect(locator).toHaveUI5SelectedRows([0, 2]);
await expect(locator).toHaveUI5Binding('/Material');
await expect(locator).toBeUI5ControlType('sap.m.Button');
```

---

## Decision Tree: Is It UI5?

```
Is the element a SAP UI5 control?
├── YES → MANDATORY: Praman fixture only
│   └── Use ui5.control() + proxy methods
├── NO  → Playwright native permitted
│   └── Verify first: document.querySelector() + check for data-sap-ui attr
└── UNKNOWN → Run pramanAI.discoverPage() to inspect
              └── If found in registry → UI5 (use Praman)
              └── If not found → Playwright native OK
```

---

## PramanConfig Properties

```typescript
import { defineConfig } from 'playwright-praman';
export default defineConfig({
  logLevel: 'info', // 'info' | 'debug' | 'warn' | 'error'
  ui5WaitTimeout: 30_000, // ms
  controlDiscoveryTimeout: 10_000, // ms
  interactionStrategy: 'ui5-native', // 'ui5-native' | 'dom-first' | 'opa5'
  discoveryStrategies: ['direct-id', 'recordreplay'],
  skipStabilityWait: false,
  auth: { strategy: 'btp-saml', baseUrl: '', username: '', password: '' },
  ai: { provider: 'anthropic', apiKey: '', model: 'claude-opus-4-6', temperature: 0.3 },
});
```

---

## Control Type → Praman Method Lookup

| Control Type                         | Praman Method                                                                            |
| ------------------------------------ | ---------------------------------------------------------------------------------------- |
| `sap.m.Button`                       | `ui5.control({ controlType: 'sap.m.Button', properties: { text: 'Save' } }).press()`     |
| `sap.m.Input`                        | `ui5.control({ id }).setValue(val)` + `.fireChange({ value: val })` + `ui5.waitForUI5()` |
| `sap.m.Select`                       | `ui5.control({ id }).setSelectedKey(key)`                                                |
| `sap.m.ComboBox`                     | `.open()` → `.setSelectedKey(key)` → `.fireChange({ value: key })` → `.close()`          |
| `sap.m.CheckBox`                     | `ui5.control({ id }).press()`                                                            |
| `sap.m.Link`                         | `ui5.control({ controlType: 'sap.m.Link', properties: { text } }).press()`               |
| `sap.m.DatePicker`                   | `ui5.date.setDatePicker(controlId, '2026-01-15')`                                        |
| `sap.m.TextArea`                     | `ui5.control({ id }).setValue(text)` + `.fireChange({ value: text })`                    |
| `sap.m.SearchField`                  | `ui5.control({ id }).setValue(text)` + `.fireChange({ value: text })`                    |
| `sap.m.GenericTile`                  | `ui5.control({ controlType: 'sap.m.GenericTile', properties: { header } }).press()`      |
| `sap.m.IconTabFilter`                | `ui5.control({ id }).press()`                                                            |
| `sap.m.Table`                        | `ui5.table.getRows(tableId)` / `ui5.table.clickRow(tableId, row)`                        |
| `sap.m.List`                         | `ui5.table.getRows(listId)` / `ui5.table.clickRow(listId, row)`                          |
| `sap.m.Dialog`                       | `ui5.dialog.waitFor()` / `ui5.dialog.confirm()` / `ui5.dialog.dismiss()`                 |
| `sap.ui.comp.smartfield.SmartField`  | Discover inner control: `-input`, `-comboBoxEdit`, `-datePicker` suffix                  |
| `sap.ui.comp.smarttable.SmartTable`  | `(await smartTable.getTable())` → inner table proxy                                      |
| `sap.ui.mdc.Field` _(V4)_            | `ui5.control({ id: IDS.field }).setValue(val)`                                           |
| `sap.ui.mdc.field.FieldInput` _(V4)_ | `ui5.control({ id: IDS.fieldInner }).fireChange({ value: val })`                         |
| `sap.ui.mdc.ValueHelp` _(V4)_        | `.open()` / `.isOpen()` / `.close()`                                                     |
| `sap.ui.mdc.Table` _(V4)_            | `.getTable()` → inner table                                                              |
| `sap.ui.mdc.FilterBar` _(V4)_        | `.triggerSearch()` replaces `fe.listReport.search()`                                     |
| FLP Tile                             | `ui5Navigation.navigateToTile('App Name')`                                               |
| Shell Back                           | `ui5Navigation.navigateBack()`                                                           |
| Value Help (V2)                      | Click VHI icon → `ui5.dialog.waitFor()` → table discovery                                |
| Value Help (V4)                      | Click VHI icon (`-inner-vhi`) → `sap.ui.mdc.ValueHelp.open()` → inner table              |
| Authentication                       | `sapAuth.login(page, config)` ← **seed only**                                            |

---

## UI5Selector Shapes

```typescript
// By control type + properties
{ controlType: 'sap.m.Button', properties: { text: 'Save' } }

// By ID
{ id: 'createBOMFragment--material' }

// By ID with dialog search
{ controlType: 'sap.m.Dialog', searchOpenDialogs: true }

// With ancestor scope
{ controlType: 'sap.m.Button', ancestor: { controlType: 'sap.m.Dialog' } }

// With binding path
{ controlType: 'sap.m.Input', bindingPath: { value: '/Material' } }
```

---

## Gold Standard Pattern

```typescript
/**
 * {APP NAME} End-to-End Gold Standard Test
 *
 * COMPLIANCE: 100% Praman fixture-only
 * Generated by: praman-sap-planner v1.0.0
 * Controls discovered: N
 * System URL: https://...
 * UI5 Version: 1.120.x
 * Auth Method: seed-inline
 * Forbidden Pattern Scan: PASSED
 * Fixtures Used: ui5.control (X), ui5.table.getRows (Y), ...
 */
import { test, expect } from 'playwright-praman';

test.describe('{App Name} E2E Tests', () => {
  test('Complete {Scenario} Flow - Single Session', async ({
    page,
    ui5,
    ui5Navigation,
    ui5Footer,
    intent,
    fe,
  }) => {
    // auth handled by seed — NOT here

    await test.step('Step 1: Navigate to App', async () => {
      await ui5Navigation.navigateToTile('App Name');
      await ui5.waitForUI5();
    });

    await test.step('Step 2: Fill Form', async () => {
      const input = await ui5.control({ id: 'materialInput' });
      await input.setValue('MAT-001');
      await input.fireChange({ value: 'MAT-001' });
      await ui5.waitForUI5();
    });

    await test.step('Step 3: Save and Verify', async () => {
      await ui5Footer.clickSave();
      await ui5.dialog.confirm();
      await intent.core.assertField('Status', 'Created');
    });

    // Log progress to test report
    test.info().annotations.push({
      type: 'info',
      description: 'Scenario completed successfully',
    });
  });
});
```

**Critical gold-standard rules:**

1. SINGLE test + `test.step()` — ensures same page context throughout
2. Import ONLY from `'playwright-praman'`
3. Auth in seed, NOT in test body
4. `setValue()` + `fireChange()` + `waitForUI5()` — always all three for inputs
5. `searchOpenDialogs: true` for dialog controls
6. `test.info().annotations` for CI/CD debugging
7. V4: `IDS` const map for long MDC IDs
8. V4: `sap.ui.mdc.ValueHelp.open()/isOpen()/close()` not dialog control
9. TSDoc compliance header in every generated test

---

## Anti-Patterns — 16+ Forbidden

```
page.click('#__...')               ← UI5 generated ID → ui5.control().press()
page.fill('#__...')                ← UI5 generated ID → ui5.control().setValue()
page.locator('[data-sap-ui]')     ← SAP attribute → ui5.control()
page.locator('.sapM...')           ← SAP CSS class → ui5.control({ controlType })
page.$$('tr')                      ← Table row → ui5.table.getRows()
page.click('text=...')             ← Text selector for UI5 → ui5.control({ properties: { text } })
from '@playwright/test'            ← Wrong import → 'playwright-praman'
from 'dhikraft'                    ← Wrong import → 'playwright-praman'
new UI5Handler(...)                ← Removed class → fixture-only
.initialize()                      ← Removed method → auto-init via fixtures
.injectBridgeLate()                ← Removed method → auto-inject via fixtures
.waitForUI5Stable()                ← Non-existent → ui5.waitForUI5()
ui5Table.getTableRows(...)         ← dhikraft API → ui5.table.getRows()
navigation.openTileByTitle(...)    ← dhikraft API → ui5Navigation.navigateToTile()
intentWrappers.*                   ← dhikraft API → intent.core.*
dialog.waitForDialog(...)          ← dhikraft API → ui5.dialog.waitFor()
sapAuth.loginFromEnv()             ← Only in seed, NEVER in test body
page.waitForTimeout(...)           ← BANNED → ui5.waitForUI5() or polling loop
```

---

## V2 vs V4 Quick Reference

| Aspect         | V2 (SmartField)                                       | V4 (MDC)                                            |
| -------------- | ----------------------------------------------------- | --------------------------------------------------- |
| Field wrapper  | `sap.ui.comp.smartfield.SmartField`                   | `sap.ui.mdc.Field`                                  |
| Inner input    | `-input`, `-comboBoxEdit` suffixes                    | `-inner` suffix (`sap.ui.mdc.field.FieldInput`)     |
| Value Help     | Separate dialog control                               | `sap.ui.mdc.ValueHelp` `.open()/.isOpen()/.close()` |
| Dropdown       | `sap.m.ComboBox` `.open()/.setSelectedKey()/.close()` | MDC FieldInput + suggest popover                    |
| Dialog IDs     | `createBOMFragment--*`                                | `fe::APD_::${SRVD}.CreateBOM`                       |
| Field IDs      | `createBOMFragment--material`                         | `APD_::Material` (short)                            |
| VH icon suffix | `-valueHelpIcon`                                      | `-inner-vhi`                                        |
| Detection      | Check for `sap.ui.comp.*` controls                    | Check for `sap.ui.mdc.*` controls                   |

**V4 IDS const map (always use for long IDs):**

```typescript
const SRVD = 'com.sap.gateway.srvd.ui_billofmaterial_maintain.v0001';
const IDS = {
  dialog: `fe::APD_::${SRVD}.CreateBOM`,
  dialogOkBtn: `fe::APD_::${SRVD}.CreateBOM::Action::Ok`,
  materialField: 'APD_::Material',
  materialInner: 'APD_::Material-inner',
  materialVHIcon: 'APD_::Material-inner-vhi',
} as const;
```

---

## Wizard Mode (Interactive Discovery)

When the user provides a scenario description, ask these 8 questions:

1. **System URL** — What is the SAP system base URL?
2. **App Name** — What is the Fiori application name?
3. **Scenario** — Describe the business scenario in 1-2 sentences
4. **Auth credentials** — Are env vars set? (SAP_CLOUD_BASE_URL, SAP_CLOUD_USERNAME, etc.)
5. **UI5 Version** — Do you know the UI5 version? (auto-detect if not)
6. **V2 or V4** — SmartField (V2) or Fiori Elements V4/MDC? (auto-detect if not)
7. **Value Help** — Which fields use Value Help dialogs?
8. **Output location** — Where should tests be saved?

---

## Post-Generation Verification Checklist

After generating any test:

- [ ] Import is `from 'playwright-praman'`
- [ ] Zero occurrences of `from '@playwright/test'`
- [ ] Zero occurrences of `from 'dhikraft'`
- [ ] Zero `new UI5Handler`, `.initialize()`, `.injectBridgeLate()`
- [ ] Zero `sapAuth.login()` or `sapAuth.loginFromEnv()` in test body (seed only)
- [ ] ZERO Playwright native selectors for UI5 controls
- [ ] `searchOpenDialogs: true` for dialog controls
- [ ] `setValue()` + `fireChange()` + `waitForUI5()` for all input fills
- [ ] Uses correct Praman fixture names (not dhikraft names)
- [ ] Compliance report header present
- [ ] TSDoc format (not JSDoc)
- [ ] `test.step()` for multi-step flows

---

## When Capability Not Found

If you cannot find a Praman method for a SAP control:

1. Check the **PRAMAN_CAPABILITIES** static table in Step 0 above
2. Check `skills/playwright-praman-sap-testing/ai-quick-reference.md` for copy-paste patterns
3. Check `skills/playwright-praman-sap-testing/test-template.ts` for working examples
4. Check the **Control Type → Praman Method Lookup** table above
5. **NEVER** use Playwright native selectors as a workaround for UI5 controls
6. Ask for help rather than using native fallback

---

## Dhikraft → Praman Migration

| dhikraft (WRONG)                             | Praman (CORRECT)                                 |
| -------------------------------------------- | ------------------------------------------------ |
| `ui5Table.getTableRows(page, selector)`      | `ui5.table.getRows(tableId)`                     |
| `ui5Table.clickTableRowWhere(page, ...)`     | `ui5.table.clickRow(tableId, rowIndex)`          |
| `navigation.openTileByTitle(title)`          | `ui5Navigation.navigateToTile(title)`            |
| `navigation.back()`                          | `ui5Navigation.navigateBack()`                   |
| `navigation.goToFLPHome()`                   | `ui5Navigation.navigateToHome()`                 |
| `intentWrappers.fillField(label, value)`     | `intent.core.fillField(label, value)`            |
| `intentWrappers.clickButton(text)`           | `intent.core.clickButton(text)`                  |
| `intentWrappers.selectFromDropdown(l, v)`    | `intent.core.selectOption(label, option)`        |
| `intentWrappers.verifyMessageDisplayed(msg)` | `intent.core.assertField(label, expected)`       |
| `bulkDiscovery.*`                            | `pramanAI.discoverPage()`                        |
| `capabilities.list()`                        | `pramanAI.capabilities.list()`                   |
| `odata.query(entitySet, params)`             | `ui5.odata.queryEntities(entitySet, params)`     |
| `sapAuth.loginFromEnv()` standalone          | `sapAuth.login(page, config)` with explicit args |
| `dialog.waitForDialog(...)`                  | `ui5.dialog.waitFor()`                           |
