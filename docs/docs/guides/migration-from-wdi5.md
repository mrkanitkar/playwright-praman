---
title: 'Migration from wdi5'
description: 'Step-by-step guide to migrate from wdi5 to Praman. Complete API mapping from browser.asControl() to ui5.control() with Playwright.'
keywords:
  - wdi5 alternative
  - wdi5 vs playwright
  - migrate wdi5 tests to playwright
  - sap test framework comparison
---

Migrate your wdi5 test suite to Playwright-Praman with minimal friction. This guide maps every
wdi5 API to its Praman equivalent and highlights features that are new in Praman.

## Quick Comparison

| Aspect             | wdi5                                  | Praman                                          |
| ------------------ | ------------------------------------- | ----------------------------------------------- |
| Test runner        | WebdriverIO                           | Playwright                                      |
| UI5 bridge         | `browser.asControl()`                 | `ui5.control()`                                 |
| Selector engine    | wdi5 selector object                  | `UI5Selector` object                            |
| Async model        | WDIO auto-sync (deprecated) / `async` | Always `async/await`                            |
| Parallel execution | Limited (WDIO workers)                | Native Playwright workers                       |
| Auth management    | Manual login scripts                  | 6 built-in strategies + setup projects          |
| AI integration     | None                                  | Built-in capabilities, recipes, agentic handler |
| OData helpers      | None                                  | Model-level + HTTP-level CRUD                   |
| FLP navigation     | Manual hash navigation                | 9 typed navigation methods                      |

## Core API Mapping

### Control Discovery

```typescript
// wdi5
const button = await browser.asControl({
  selector: {
    controlType: 'sap.m.Button',
    properties: { text: 'Save' },
  },
});

// Praman
import { test, expect } from 'playwright-praman';

test('find a button', async ({ ui5 }) => {
  const button = await ui5.control({
    controlType: 'sap.m.Button',
    properties: { text: 'Save' },
  });
});
```

### Multiple Controls

```typescript
// wdi5
const buttons = await browser.allControls({
  selector: { controlType: 'sap.m.Button' },
});

// Praman
const buttons = await ui5.controls({ controlType: 'sap.m.Button' });
```

### Control Interaction

```typescript
// wdi5
const input = await browser.asControl({
  selector: { id: 'nameInput' },
});
await input.enterText('John Doe');
const value = await input.getValue();

// Praman
const input = await ui5.control({ id: 'nameInput' });
await input.enterText('John Doe');
const value = await input.getValue();

// Or use the shorthand:
await ui5.fill({ id: 'nameInput' }, 'John Doe');
```

## Selector Field Mapping

The selector object structure is similar, with a few naming adjustments and additions.

| wdi5 Selector Field | Praman `UI5Selector` Field | Type                      | Notes                                        |
| ------------------- | -------------------------- | ------------------------- | -------------------------------------------- |
| `controlType`       | `controlType`              | `string`                  | Identical. Fully qualified UI5 type.         |
| `id`                | `id`                       | `string \| RegExp`        | Identical. Supports RegExp in Praman.        |
| `viewName`          | `viewName`                 | `string`                  | Identical.                                   |
| `viewId`            | `viewId`                   | `string`                  | Identical.                                   |
| `properties`        | `properties`               | `Record<string, unknown>` | Identical. Key-value property matchers.      |
| `bindingPath`       | `bindingPath`              | `Record<string, string>`  | Identical. OData binding path matchers.      |
| `i18NText`          | `i18NText`                 | `Record<string, string>`  | Identical. i18n translated value matchers.   |
| `ancestor`          | `ancestor`                 | `UI5Selector`             | Identical. Recursive parent matching.        |
| `descendant`        | `descendant`               | `UI5Selector`             | Identical. Recursive child matching.         |
| `interaction`       | `interaction`              | `UI5Interaction`          | Identical. `idSuffix` and `domChildWith`.    |
| `searchOpenDialogs` | `searchOpenDialogs`        | `boolean`                 | Identical. Search inside open dialogs.       |
| `labelFor`          | --                         | --                        | **Not available in Praman.** See note below. |

:::caution labelFor Selector

wdi5 supports a `labelFor` selector field that matches controls by their associated `sap.m.Label`.
Praman does not currently support `labelFor`. Use one of these alternatives:

```typescript
// Option 1: Match by properties directly
const input = await ui5.control({
  controlType: 'sap.m.Input',
  properties: { placeholder: 'Enter vendor name' },
});

// Option 2: Match by binding path
const input = await ui5.control({
  controlType: 'sap.m.Input',
  bindingPath: { value: '/Vendor/Name' },
});

// Option 3: Use ancestor to scope to a form group
const input = await ui5.control({
  controlType: 'sap.m.Input',
  ancestor: {
    controlType: 'sap.ui.layout.form.FormElement',
    descendant: {
      controlType: 'sap.m.Label',
      properties: { text: 'Vendor Name' },
    },
  },
});
```

:::

## Config Mapping

### wdi5 Config (wdio.conf.ts)

```typescript
// wdio.conf.ts
export const config = {
  wdi5: {
    waitForUI5Timeout: 30000,
    logLevel: 'verbose',
    url: 'https://sap-system.example.com',
    skipInjectUI5OnStart: false,
  },
  specs: ['./test/specs/**/*.ts'],
  baseUrl: 'https://sap-system.example.com',
};
```

### Praman Config (praman.config.ts + playwright.config.ts)

```typescript
// praman.config.ts
import { defineConfig } from 'playwright-praman';

export default defineConfig({
  logLevel: 'info', // wdi5 logLevel -> praman logLevel
  ui5WaitTimeout: 30_000, // wdi5 waitForUI5Timeout -> praman ui5WaitTimeout
  controlDiscoveryTimeout: 10_000,
  interactionStrategy: 'ui5-native',
  auth: {
    strategy: 'basic',
    baseUrl: process.env.SAP_BASE_URL!,
    username: process.env.SAP_USER!,
    password: process.env.SAP_PASS!,
  },
});
```

```typescript
// playwright.config.ts
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  timeout: 120_000,
  use: {
    baseURL: process.env.SAP_BASE_URL,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  projects: [
    { name: 'setup', testMatch: /auth-setup\.ts/, teardown: 'teardown' },
    { name: 'teardown', testMatch: /auth-teardown\.ts/ },
    {
      name: 'chromium',
      dependencies: ['setup'],
      use: { ...devices['Desktop Chrome'], storageState: '.auth/sap-session.json' },
    },
  ],
});
```

## OPA5 Journey to test.step()

wdi5 test files often follow the OPA5 journey pattern. In Praman, use `test.step()` for
structured multi-step tests.

### wdi5 + OPA5 Journey

```typescript
// wdi5 test
describe('Purchase Order', () => {
  it('should navigate to the app', async () => {
    await browser.url('#/PurchaseOrder-manage');
    await browser.asControl({ selector: { id: 'poTable' } });
  });

  it('should create a new PO', async () => {
    const createBtn = await browser.asControl({
      selector: { controlType: 'sap.m.Button', properties: { text: 'Create' } },
    });
    await createBtn.press();
  });

  it('should fill vendor field', async () => {
    const vendorInput = await browser.asControl({
      selector: { id: 'vendorInput' },
    });
    await vendorInput.enterText('100001');
  });
});
```

### Praman + test.step()

```typescript
import { test, expect } from 'playwright-praman';

test('create a purchase order', async ({ ui5, ui5Navigation }) => {
  await test.step('Navigate to PO app', async () => {
    await ui5Navigation.navigateToApp('PurchaseOrder-manage');
  });

  await test.step('Click Create', async () => {
    await ui5.click({
      controlType: 'sap.m.Button',
      properties: { text: 'Create' },
    });
  });

  await test.step('Fill vendor field', async () => {
    await ui5.fill({ id: 'vendorInput' }, '100001');
  });
});
```

## New in Praman vs wdi5

Praman includes features that wdi5 does not offer. If you are migrating, these are worth
adopting early.

### 6 Built-In Auth Strategies

No more custom login scripts. Praman supports Basic, BTP SAML, Office 365, Custom, API, and
Certificate authentication out of the box.

```typescript
// Auth is handled by setup projects — no login code in tests
test('after auth', async ({ ui5Navigation }) => {
  await ui5Navigation.navigateToApp('PurchaseOrder-manage');
});
```

### 9 FLP Navigation Methods

```typescript
test('navigation', async ({ ui5Navigation }) => {
  await ui5Navigation.navigateToApp('PurchaseOrder-manage');
  await ui5Navigation.navigateToTile('Create Purchase Order');
  await ui5Navigation.navigateToIntent('PurchaseOrder', 'create', { plant: '1000' });
  await ui5Navigation.navigateToHome();
  await ui5Navigation.navigateBack();
});
```

### Fiori Elements Helpers

Dedicated APIs for List Report and Object Page patterns.

```typescript
test('FE list report', async ({ fe }) => {
  await fe.listReport.setFilter('Status', 'Active');
  await fe.listReport.search();
  await fe.listReport.navigateToItem(0);
  await fe.objectPage.clickEdit();
  await fe.objectPage.clickSave();
});
```

### AI-Powered Test Generation

```typescript
test('AI discovery', async ({ pramanAI }) => {
  const context = await pramanAI.discoverPage({ interactiveOnly: true });
  const result = await pramanAI.agentic.generateTest(
    'Create a purchase order for vendor 100001',
    page,
  );
});
```

### Custom UI5 Matchers

10 UI5-specific Playwright matchers for expressive assertions.

```typescript
const button = await ui5.control({ id: 'saveBtn' });
await expect(button).toBeUI5Enabled();
await expect(button).toHaveUI5Text('Save');
await expect(button).toBeUI5Visible();
```

### OData Model + HTTP Operations

```typescript
test('OData', async ({ ui5 }) => {
  // Model-level (reads from the in-browser UI5 OData model)
  const data = await ui5.odata.getModelData('/PurchaseOrders');

  // HTTP-level CRUD is also available with automatic CSRF handling
});
```

### SM12 Lock Management

```typescript
test('locks', async ({ flpLocks }) => {
  const count = await flpLocks.getNumberOfLockEntries('TESTUSER');
  await flpLocks.deleteAllLockEntries('TESTUSER');
  // Auto-cleanup on teardown
});
```

### Structured Error Codes

Every Praman error includes a machine-readable `code`, `retryable` flag, and `suggestions[]`
array for self-healing tests. wdi5 errors are unstructured strings.

## Step-by-Step Migration Checklist

1. **Install dependencies**: `npm install playwright-praman @playwright/test`
2. **Install browsers**: `npx playwright install`
3. **Create config files**: `praman.config.ts` and `playwright.config.ts`
4. **Set up auth**: Create `tests/auth-setup.ts` using one of the 6 strategies
5. **Convert selectors**: Replace `browser.asControl({ selector: {...} })` with `ui5.control({...})`
6. **Convert assertions**: Replace WDIO `expect` with Playwright `expect` + UI5 matchers
7. **Structure tests**: Convert OPA5 journey `describe/it` blocks to `test` + `test.step()`
8. **Adopt navigation**: Replace `browser.url('#/hash')` with `ui5Navigation` methods
9. **Run and verify**: `npx playwright test`
