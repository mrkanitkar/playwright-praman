---
title: Quick Reference
description: One-page cheat sheet for Praman — selectors, fixtures, patterns, errors, and configuration.
---

# Quick Reference

Everything you need on one page. Copy-paste ready.

---

## Imports

```typescript
// Standard test — includes all fixtures
import { test, expect } from 'playwright-praman';

// Selective composition — only what you need
import { coreTest, authTest, moduleTest } from 'playwright-praman';
import { mergeTests } from '@playwright/test';
const test = mergeTests(coreTest, authTest);
```

---

## Selectors

### By ID

```typescript
await ui5.control({ id: 'myButton' });
await ui5.control({ id: /partial.*match/ });
```

### By Control Type + Properties

```typescript
await ui5.control({
  controlType: 'sap.m.Button',
  properties: { text: 'Save', enabled: true },
});
```

### By Binding Path (OData)

```typescript
await ui5.control({
  controlType: 'sap.m.Input',
  bindingPath: { value: '/PurchaseOrder/Vendor' },
});
```

### By i18n Text

```typescript
await ui5.control({
  controlType: 'sap.m.Button',
  i18NText: { text: 'SAVE_BUTTON' },
});
```

### Scoped by View

```typescript
await ui5.control({
  id: 'myInput',
  viewName: 'sap.app.view.Detail',
});
```

### Ancestor / Descendant

```typescript
await ui5.control({
  controlType: 'sap.m.Input',
  ancestor: { controlType: 'sap.m.Dialog' },
});
```

### Sub-Control Interaction

```typescript
// ComboBox dropdown arrow
await ui5.control({
  controlType: 'sap.m.ComboBox',
  id: 'myCombo',
  interaction: { idSuffix: 'arrow' },
});
```

### Dialog Controls (Critical)

```typescript
// ❌ Won't find controls inside dialogs
await ui5.control({ id: 'dialogBtn' });

// ✅ Must set searchOpenDialogs: true
await ui5.control({ id: 'dialogBtn', searchOpenDialogs: true });
```

### Locator String Syntax

```typescript
// JSON format
page.locator('ui5={"controlType":"sap.m.Button","properties":{"text":"Save"}}');

// CSS-like format
page.locator("ui5=sap.m.Button[text='Save']");
page.locator('ui5=sap.m.Input:labeled("Vendor")');
```

---

## Common Control Types

| Control          | Type String                         |
| ---------------- | ----------------------------------- |
| Button           | `sap.m.Button`                      |
| Input            | `sap.m.Input`                       |
| Select           | `sap.m.Select`                      |
| ComboBox         | `sap.m.ComboBox`                    |
| DatePicker       | `sap.m.DatePicker`                  |
| CheckBox         | `sap.m.CheckBox`                    |
| TextArea         | `sap.m.TextArea`                    |
| Responsive Table | `sap.m.Table`                       |
| Grid Table       | `sap.ui.table.Table`                |
| SmartTable       | `sap.ui.comp.smarttable.SmartTable` |
| SmartField       | `sap.ui.comp.smartfield.SmartField` |
| Dialog           | `sap.m.Dialog`                      |
| GenericTile      | `sap.m.GenericTile`                 |
| IconTabBar       | `sap.m.IconTabBar`                  |
| List             | `sap.m.List`                        |

---

## Interaction Shortcuts

```typescript
// Click
await ui5.click({ id: 'submitBtn' });

// Type into input (setValue + fireChange + waitForUI5)
await ui5.fill({ id: 'nameInput' }, 'John Doe');

// Select dropdown value
await ui5.select({ id: 'countrySelect' }, 'US');

// Toggle checkbox
await ui5.check({ id: 'agreeCheckbox' });

// Clear field
await ui5.clear({ id: 'searchField' });

// Press (firePress on control)
await ui5.press({ id: 'goButton' });
```

:::warning Input Pattern
`ui5.fill()` performs **setValue + fireChange + waitForUI5** atomically.
Never call `setValue()` alone — UI5 change events won't fire.
:::

---

## Fixtures

### Core (test-scoped)

| Fixture         | Purpose                                                                                  |
| --------------- | ---------------------------------------------------------------------------------------- |
| `ui5`           | Control discovery, `.table`, `.dialog`, `.date`, `.odata` sub-namespaces                 |
| `ui5Navigation` | FLP navigation (9 methods)                                                               |
| `btpWorkZone`   | Dual-frame WorkZone manager                                                              |
| `sapAuth`       | Authentication (6 strategies)                                                            |
| `fe`            | Fiori Elements (`.listReport`, `.objectPage`, `.table`, `.list`)                         |
| `pramanAI`      | AI discovery, agentic handler, vocabulary                                                |
| `intent`        | Business intents (`.procurement`, `.sales`, `.finance`, `.manufacturing`, `.masterData`) |
| `ui5Shell`      | Shell header (home, user menu)                                                           |
| `ui5Footer`     | Footer bar (Save, Edit, Delete)                                                          |
| `flpLocks`      | SM12 lock management + auto-cleanup                                                      |
| `flpSettings`   | User settings (language, date format)                                                    |
| `testData`      | Template-based data generation + auto-cleanup                                            |
| `pramanLogger`  | Test-scoped pino logger                                                                  |

### Infrastructure (worker-scoped)

| Fixture        | Purpose                                                                 |
| -------------- | ----------------------------------------------------------------------- |
| `pramanConfig` | Frozen config (loaded once per worker)                                  |
| `rootLogger`   | Worker-scoped root logger                                               |
| `tracer`       | OpenTelemetry tracer (real when enabled, NoOp when disabled)            |
| `meter`        | OpenTelemetry meter for metrics (real when enabled, NoOp when disabled) |

### CLI Integration (test-scoped)

| Fixture       | Purpose                                        |
| ------------- | ---------------------------------------------- |
| `browserBind` | Expose browser to CLI agents (`PRAMAN_BIND=1`) |
| `screencast`  | Chapter markers, action overlays               |

### Auto-Fixtures (fire automatically)

`playwrightCompat` · `selectorRegistration` · `matcherRegistration` · `requestInterceptor` · `ui5Stability`

---

## Navigation

```typescript
test('navigate', async ({ ui5Navigation, btpWorkZone }) => {
  // By tile name
  await ui5Navigation.navigateToTile('Create Purchase Order');

  // By app ID
  await ui5Navigation.navigateToApp('PurchaseOrder-manage');

  // By intent with parameters
  await ui5Navigation.navigateToIntent(
    { semanticObject: 'PurchaseOrder', action: 'create' },
    { plant: '1000' },
  );

  // Basic navigation
  await ui5Navigation.navigateToHome();
  await ui5Navigation.navigateBack();
  await ui5Navigation.navigateForward();
  const hash = await ui5Navigation.getCurrentHash();

  // WorkZone spaces
  await btpWorkZone.navigateToSpace('HR');
  await btpWorkZone.navigateToSectionLink('Payroll');
});
```

---

## Tables

```typescript
test('tables', async ({ ui5 }) => {
  // Row count
  const count = await ui5.table.getRowCount('myTable');

  // Read data
  const data = await ui5.table.getTableData('myTable');
  const cell = await ui5.table.getTableCellValue('myTable', 0, 'Vendor');
  const cols = await ui5.table.getColumnNames('myTable');

  // Select rows
  await ui5.table.selectTableRow('myTable', 0);
  await ui5.table.selectAllTableRows('myTable');
  const selected = await ui5.table.getSelectedRows('myTable');

  // Find row by value
  await ui5.table.findRowByValues('myTable', { Vendor: '100001' });
  await ui5.table.selectRowByValues('myTable', { Status: 'Active' });

  // Write
  await ui5.table.setTableCellValue('myTable', 0, 'Quantity', '10');

  // Filter and sort
  await ui5.table.filterByColumn('myTable', 'Status', 'Active');
  await ui5.table.sortByColumn('myTable', 'CreatedAt', false);

  // Wait for data to load
  await ui5.table.waitForTableData('myTable');

  // Detect table type
  const type = await ui5.table.detectTableType('myTable');
  // Returns: 'smart' | 'responsive' | 'grid'
});
```

---

## Dialogs

```typescript
test('dialogs', async ({ ui5 }) => {
  // Trigger dialog
  await ui5.press({ id: 'createBtn' });

  // Wait for it
  await ui5.dialog.waitForDialog();

  // Interact (always use searchOpenDialogs!)
  await ui5.fill({ id: 'dialog--nameInput', searchOpenDialogs: true }, 'Test Value');

  // Confirm or dismiss
  await ui5.dialog.confirm(); // Clicks primary action
  await ui5.dialog.dismiss(); // Clicks cancel/close
  await ui5.dialog.confirmDialog('OK'); // Specific button text

  // Query state
  const isOpen = await ui5.dialog.isDialogOpen();
  const buttons = await ui5.dialog.getDialogButtons();
  const dialogs = await ui5.dialog.getOpenDialogs();

  // Wait for close
  await ui5.dialog.waitForDialogClosed();
});
```

---

## Date / Time

```typescript
test('dates', async ({ ui5 }) => {
  // DatePicker
  await ui5.date.setDatePickerValue('startDate', new Date('2026-01-15'));
  const value = await ui5.date.getDatePickerValue('startDate');

  // TimePicker
  await ui5.date.setTimePickerValue('startTime', '14:30');
  const time = await ui5.date.getTimePickerValue('startTime');

  // DateRangeSelection
  await ui5.date.setDateRangeSelection('range', {
    from: new Date('2026-01-01'),
    to: new Date('2026-12-31'),
  });
  const range = await ui5.date.getDateRangeSelection('range');

  // Set + validate in one call
  await ui5.date.setAndValidateDate('deliveryDate', new Date('2026-06-01'), '06/01/2026');
});
```

---

## OData

```typescript
test('odata', async ({ ui5 }) => {
  // Model-level reads
  const data = await ui5.odata.getModelData('/PurchaseOrders');
  const count = await ui5.odata.getEntityCount('PurchaseOrder');
  const prop = await ui5.odata.getModelProperty('PoList', 0);

  // HTTP-level CRUD
  const token = await ui5.odata.fetchCSRFToken();
  const entities = await ui5.odata.queryEntities('PurchaseOrder', {
    filter: "Vendor eq '100001'",
  });
  await ui5.odata.createEntity('PurchaseOrder', { vendor: '100001' });
  await ui5.odata.updateEntity('PurchaseOrder', 'PO-001', { status: 'Complete' });
  await ui5.odata.deleteEntity('PurchaseOrder', 'PO-001');
});
```

---

## Fiori Elements

```typescript
test('fiori elements', async ({ fe }) => {
  // List Report
  await fe.listReport.setFilter('Status', 'Active');
  await fe.listReport.search();
  await fe.listReport.navigateToItem(0);

  // Object Page
  const title = await fe.objectPage.getHeaderTitle();
  await fe.objectPage.clickEdit();
  await fe.objectPage.clickSave();
});
```

---

## Custom Matchers

```typescript
// Control state
await expect(control).toBeUI5Visible();
await expect(control).toBeUI5Enabled();
await expect(control).toBeUI5Editable();

// Control content
await expect(control).toHaveUI5Text('Expected Text');
await expect(control).toHaveUI5Property('value', 'expected');
await expect(control).toHaveUI5ItemCount(5);

// Table state
await expect(table).toHaveUI5Rows(10);

// Negative
await expect(control).not.toBeUI5Visible();
```

---

## Error Codes (Top Categories)

Every error includes `code`, `message`, `attempted`, `retryable`, `suggestions[]`, and `docsUrl`.

| Category       | Codes                                                   | Common Causes                                      |
| -------------- | ------------------------------------------------------- | -------------------------------------------------- |
| **Config**     | `ERR_CONFIG_INVALID`, `_NOT_FOUND`, `_PARSE`            | Bad config file, missing file, syntax error        |
| **Bridge**     | `ERR_BRIDGE_TIMEOUT`, `_INJECTION`, `_NOT_READY`        | UI5 not loaded, injection failed, version mismatch |
| **Control**    | `ERR_CONTROL_NOT_FOUND`, `_NOT_VISIBLE`, `_NOT_ENABLED` | Wrong selector, element hidden/disabled            |
| **Auth**       | `ERR_AUTH_FAILED`, `_TIMEOUT`, `_SESSION_EXPIRED`       | Bad credentials, slow login, session expired       |
| **Navigation** | `ERR_NAV_TILE_NOT_FOUND`, `_ROUTE_FAILED`, `_TIMEOUT`   | Wrong tile name, FLP not loaded                    |
| **OData**      | `ERR_ODATA_REQUEST_FAILED`, `_PARSE`, `_CSRF`           | Service error, bad response, token expired         |
| **Selector**   | `ERR_SELECTOR_INVALID`, `_AMBIGUOUS`, `_PARSE`          | Bad syntax, multiple matches                       |
| **Timeout**    | `ERR_TIMEOUT_UI5_STABLE`, `_CONTROL_DISCOVERY`          | Slow app, long-running OData calls                 |

```typescript
import { ControlError, TimeoutError } from 'playwright-praman';

try {
  await ui5.control({ id: 'missing' });
} catch (error) {
  if (error instanceof ControlError && error.retryable) {
    // retry logic
  }
  console.error(error.toUserMessage()); // Human-readable
  const ctx = error.toAIContext(); // AI-consumable
}
```

---

## Configuration

### Minimal `praman.config.ts`

```typescript
import { defineConfig } from 'playwright-praman';

export default defineConfig({
  logLevel: 'info',
  ui5WaitTimeout: 30_000,
  controlDiscoveryTimeout: 10_000,
  interactionStrategy: 'ui5-native',
  auth: {
    strategy: 'basic',
    baseUrl: 'https://your-sap.example.com',
    username: process.env.SAP_USER!,
    password: process.env.SAP_PASS!,
    client: '100',
    language: 'EN',
  },
});
```

### Environment Variable Overrides

| Variable                           | Default      |
| ---------------------------------- | ------------ |
| `PRAMAN_LOG_LEVEL`                 | `info`       |
| `PRAMAN_UI5_WAIT_TIMEOUT`          | `30000`      |
| `PRAMAN_CONTROL_DISCOVERY_TIMEOUT` | `10000`      |
| `PRAMAN_INTERACTION_STRATEGY`      | `ui5-native` |
| `PRAMAN_SKIP_STABILITY_WAIT`       | `false`      |

### Precedence (highest wins)

1. Per-call options: `ui5.control({ ... }, { timeout: 5000 })`
2. Environment variables
3. `praman.config.ts`
4. Schema defaults

---

## Auth Strategies

| Strategy      | Use Case                                              |
| ------------- | ----------------------------------------------------- |
| `basic`       | SAP GUI / Fiori on-premise (user + password + client) |
| `btp-saml`    | BTP with SAML/IDP                                     |
| `office365`   | Azure AD / Entra ID                                   |
| `certificate` | X.509 client certificate                              |
| `api-key`     | API-only authentication                               |
| `custom`      | Custom login flow                                     |

---

## Test Structure (Playwright Best Practices)

```typescript
import { test, expect } from 'playwright-praman';

test.describe('Purchase Order', () => {
  test('create PO end-to-end', async ({ ui5, ui5Navigation, fe }) => {
    await test.step('Navigate to Create PO', async () => {
      await ui5Navigation.navigateToApp('PurchaseOrder-create');
    });

    await test.step('Fill header data', async () => {
      await ui5.fill({ id: 'vendorInput' }, '100001');
      await ui5.fill({ id: 'companyCodeInput' }, '1000');
    });

    await test.step('Save and verify', async () => {
      await ui5.press({ id: 'saveBtn' });
      const msg = await ui5.control({
        controlType: 'sap.m.MessageStrip',
        properties: { type: 'Success' },
      });
      await expect(msg).toHaveUI5Text(/Purchase Order \d+ created/);
    });
  });
});
```

---

## CLI Commands

```bash
# Run tests
npx playwright test

# Run specific test file
npx playwright test tests/po-create.spec.ts

# Debug mode (headed + inspector)
npx playwright test --debug

# Generate report
npx playwright show-report

# Praman CLI inspector
npx praman inspect

# Praman capabilities
npx praman capabilities --agent
```

---

## Links

- [Getting Started](./getting-started.md)
- [Selectors Guide](./selectors.md)
- [Fixtures Reference](./fixtures.md)
- [Configuration](./configuration.md)
- [Error Reference](./errors.md)
- [Examples](../examples/basic-test.md)
- [GitHub](https://github.com/nicestallsap/playwright-praman)
