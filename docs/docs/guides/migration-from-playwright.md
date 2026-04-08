---
title: 'Migration from Vanilla Playwright'
description: 'Layer Praman on top of your existing Playwright tests for SAP UI5 apps. Keep everything you have, add UI5 control registry access, auto-waiting, and SAP-specific fixtures.'
keywords:
  - playwright sap testing
  - playwright ui5 plugin
  - migrate playwright to praman
  - sap fiori playwright
---

Already using Playwright for web testing? This guide shows when and how to layer Praman on top
of your existing Playwright tests for SAP UI5 applications.

:::info[In this guide]

- Keep all your existing Playwright tests running unchanged with a one-line import swap
- Decide when to use `page.locator()` vs `ui5.control()` for each element
- Add UI5-aware auto-waiting and stability checks to eliminate flaky tests
- Adopt SAP navigation, authentication, and Fiori Elements fixtures incrementally
- Run hybrid tests that mix Playwright locators and Praman selectors in the same file

:::

## When to Use `page.locator()` vs `ui5.control()`

Praman does not replace Playwright -- it extends it. Use each where it makes sense.

### Use `page.locator()` When

- Targeting **non-UI5 elements** (plain HTML, third-party widgets, SAP UI5 Web Components)
- Working with **static DOM** that does not change between UI5 versions
- Testing **login pages** before the UI5 runtime has loaded
- Interacting with **iframes**, **file uploads**, or **browser dialogs**
- Asserting on **CSS properties** or **visual layout**

### Use `ui5.control()` When

- Targeting **SAP UI5 controls** (sap.m.Button, sap.m.Input, sap.ui.table.Table, etc.)
- Control **DOM IDs are generated** and change across versions or deployments
- You need **OData binding path** or **i18n text** matching
- You need **UI5-level assertions** (value state, enabled, editable, binding)
- Working with **SmartFields** that wrap inner controls dynamically
- Navigating the **Fiori Launchpad** shell

### Decision Tree

```text
Is the element a SAP UI5 control?
  YES -> Does its DOM structure change across UI5 versions/themes?
           YES -> Use ui5.control() (stable contract via UI5 registry)
           NO  -> Either works, but ui5.control() is safer long-term
  NO  -> Use page.locator() (standard Playwright)
```

## Auto-Waiting Differences

Both Playwright and Praman auto-wait, but they wait for different things.

| Behavior      | Playwright `page.locator()`               | Praman `ui5.control()`                                                         |
| ------------- | ----------------------------------------- | ------------------------------------------------------------------------------ |
| DOM presence  | Waits for element in DOM                  | Waits for control in UI5 registry                                              |
| Visibility    | Waits for element visible (actionability) | Prefers visible controls (`preferVisibleControls`)                             |
| UI5 stability | No awareness                              | Auto-waits for `waitForUI5Stable()` (pending requests, timeouts, promises)     |
| Retry         | Built-in auto-retry on locators           | Multi-strategy discovery chain (cache, direct-ID, RecordReplay, registry scan) |
| Timeout       | `expect.timeout` / `actionTimeout`        | `controlDiscoveryTimeout` (default 10s) + `ui5WaitTimeout` (default 30s)       |
| Network idle  | No built-in concept                       | Blocks WalkMe, analytics, overlay scripts automatically                        |

### What `waitForUI5Stable()` Does

Before every `ui5.control()` call, Praman ensures:

1. The UI5 bootstrap has completed (core libraries loaded)
2. All pending `XMLHttpRequest` / `fetch` calls have settled
3. All JavaScript `setTimeout` / `setInterval` callbacks have fired
4. The OData model has no pending requests
5. A 500ms DOM settle period has elapsed

This eliminates the need for `page.waitForTimeout()` (which is banned in Praman) and
`page.waitForLoadState('networkidle')` (which is unreliable for SPAs).

## Hybrid Playwright + Praman Test

The most practical migration approach is a **hybrid test** that uses both APIs in the same file.
Praman's `test` and `expect` are extended versions of Playwright's -- your existing locators
continue to work.

```typescript
import { test, expect } from 'playwright-praman';

test('hybrid PW + Praman test', async ({ page, ui5, ui5Navigation, sapAuth }) => {
  // Step 1: Playwright handles login (before UI5 loads)
  await test.step('Login via SAP login page', async () => {
    await page.goto(process.env.SAP_BASE_URL!);

    // Plain Playwright locators for the login form
    await page.locator('#USERNAME_FIELD input').fill('TESTUSER');
    await page.locator('#PASSWORD_FIELD input').fill('secret');
    await page.locator('#LOGIN_LINK').click();

    // Wait for redirect to FLP
    await page.waitForURL('**/FioriLaunchpad*');
  });

  // Step 2: Praman takes over once UI5 is loaded
  await test.step('Navigate to PO app', async () => {
    await ui5Navigation.navigateToApp('PurchaseOrder-manage');
  });

  // Step 3: Use ui5.control() for UI5 controls
  await test.step('Verify table loaded', async () => {
    const table = await ui5.control({
      controlType: 'sap.m.Table',
      id: 'poTable',
    });
    await expect(table).toHaveUI5RowCount({ min: 1 });
  });

  // Step 4: Mix both in the same step when needed
  await test.step('Check page title and create button', async () => {
    // Playwright for the browser title
    await expect(page).toHaveTitle(/Purchase Orders/);

    // Praman for the UI5 button
    const createBtn = await ui5.control({
      controlType: 'sap.m.Button',
      properties: { text: 'Create' },
    });
    await expect(createBtn).toBeUI5Enabled();
  });

  // Step 5: Playwright for screenshots and traces
  await test.step('Capture evidence', async () => {
    await page.screenshot({ path: 'evidence/po-list.png', fullPage: true });
  });
});
```

## Converting Existing Tests Incrementally

You do not need to rewrite everything at once. The recommended approach:

### Phase 1: Drop-In Replacement (5 minutes)

Change your import and keep everything else the same.

```typescript
// Before
import { test, expect } from '@playwright/test';

// After -- Praman re-exports everything from @playwright/test
import { test, expect } from 'playwright-praman';

// All your existing locator-based tests continue to work unchanged
test('existing test', async ({ page }) => {
  await page.goto('/my-app');
  await page.locator('#myButton').click();
  await expect(page.locator('#result')).toHaveText('Done');
});
```

### Phase 2: Add UI5 Fixtures Gradually

Start using `ui5` for new assertions alongside existing locators.

```typescript
import { test, expect } from 'playwright-praman';

test('gradual adoption', async ({ page, ui5 }) => {
  await page.goto('/my-app');

  // Old way -- still works
  await page.locator('#myButton').click();

  // New way -- more resilient for UI5 controls
  const result = await ui5.control({
    controlType: 'sap.m.Text',
    properties: { text: 'Done' },
  });
  await expect(result).toHaveUI5Text('Done');
});
```

### Phase 3: Replace Brittle Selectors

Find tests that break on UI5 upgrades and convert their selectors.

```typescript
// Before: Brittle CSS selector that breaks on theme/version changes
await page.locator('.sapMBtnInner.sapMBtnEmphasized').click();

// After: Stable UI5 selector via control registry
await ui5.click({
  controlType: 'sap.m.Button',
  properties: { type: 'Emphasized' },
});
```

:::warning[Common mistake]
Do not replace `page.locator()` calls for non-UI5 elements (login forms, iframes, file uploads) with `ui5.control()`.
Praman extends Playwright -- it does not replace it. Use `ui5.control()` only for SAP UI5 controls that are registered
in the UI5 control registry. For everything else, keep using standard Playwright locators.
:::

### Phase 4: Adopt Navigation and Auth Fixtures

Replace manual navigation and login scripts with built-in fixtures.

```typescript
// Before: Manual hash navigation
await page.goto(
  'https://my-system.com/sap/bc/ui5_ui5/ui2/ushell/shells/abap/FioriLaunchpad.html#PurchaseOrder-manage',
);

// After: Typed navigation
await ui5Navigation.navigateToApp('PurchaseOrder-manage');
```

## Parallel Execution Guidance

Playwright parallelism works the same with Praman. Each worker gets its own browser context
with isolated cookies, storage, and UI5 state.

### Workers and SAP Sessions

```typescript
// playwright.config.ts
import { defineConfig } from '@playwright/test';

export default defineConfig({
  // Each worker authenticates independently via storageState
  workers: process.env.CI ? 2 : 1,

  // SAP systems often struggle with high parallelism
  // Start with 1-2 workers and increase carefully
  fullyParallel: false, // Run tests within a file sequentially
  retries: 1,

  projects: [
    {
      name: 'setup',
      testMatch: /auth-setup\.ts/,
      teardown: 'teardown',
    },
    {
      name: 'teardown',
      testMatch: /auth-teardown\.ts/,
    },
    {
      name: 'chromium',
      dependencies: ['setup'],
      use: { storageState: '.auth/sap-session.json' },
    },
  ],
});
```

### Parallel Safety Tips

1. **Use unique test data**: The `testData` fixture generates UUIDs and timestamps to avoid conflicts
2. **Avoid shared state**: Do not rely on a specific PO number across parallel workers
3. **Lock management**: Use `flpLocks` to handle SM12 locks -- auto-cleanup prevents stale locks
4. **Session limits**: SAP systems may limit concurrent sessions per user -- use separate test users per worker if needed

```typescript
import { test } from 'playwright-praman';

test('parallel-safe test', async ({ ui5, testData }) => {
  // Generate unique test data per run
  const po = testData.generate({
    documentNumber: '{{uuid}}',
    createdAt: '{{timestamp}}',
    vendor: '100001',
  });

  await ui5.fill({ id: 'vendorInput' }, po.vendor);
  // Each worker gets its own unique data -- no conflicts
});
```

## What You Gain Over Vanilla Playwright

| Feature                     | Vanilla Playwright        | With Praman                        |
| --------------------------- | ------------------------- | ---------------------------------- |
| UI5 control registry access | Manual `page.evaluate()`  | Built-in `ui5.control()`           |
| UI5 stability waiting       | Manual polling loops      | Automatic `waitForUI5Stable()`     |
| OData model access          | Manual `page.evaluate()`  | `ui5.odata.getModelData()`         |
| SmartField handling         | Fragile inner-control CSS | `controlType` + `properties`       |
| FLP navigation              | Manual URL construction   | 11 typed methods                   |
| Authentication              | Custom login scripts      | 6 built-in strategies              |
| UI5 assertions              | Generic `expect` only     | 10 custom matchers                 |
| Error recovery              | Unstructured errors       | Structured codes + suggestions     |
| Analytics blocking          | Manual route interception | Automatic request interceptor      |
| Test data                   | Manual setup/teardown     | Template generation + auto-cleanup |

## FAQ

<details>
<summary>Can I keep my existing Playwright tests?</summary>

Yes. Praman's `test` and `expect` are extended versions of Playwright's. Change your import from
`@playwright/test` to `playwright-praman` and every existing test continues to work unchanged.
You do not need to modify a single locator or assertion.

</details>

<details>
<summary>Do I need to rewrite everything?</summary>

No. The recommended approach is incremental adoption. Start by swapping the import (Phase 1),
then gradually introduce `ui5.control()` for SAP UI5 controls that have brittle CSS selectors.
You can mix `page.locator()` and `ui5.control()` in the same test indefinitely.

</details>

<details>
<summary>Does Praman slow down my tests?</summary>

No. Praman adds UI5 stability checks (`waitForUI5Stable()`) that actually reduce flakiness and
eliminate the need for manual `waitForTimeout()` calls. For non-UI5 elements, `page.locator()`
runs at full Playwright speed with no overhead from Praman.

</details>

<details>
<summary>Can I use Playwright fixtures alongside Praman fixtures?</summary>

Yes. Praman fixtures (`ui5`, `ui5Navigation`, `fe`, etc.) are added alongside Playwright's built-in
fixtures (`page`, `context`, `browser`, `request`). Destructure whichever ones you need in each test.

</details>

:::tip[Next steps]

- **[Getting Started](./getting-started.md)** -- Install Praman and run your first SAP UI5 test
- **[Selectors](./selectors.md)** -- Learn the full `UI5Selector` syntax for targeting controls
- **[Control Interactions](./control-interactions.md)** -- Click, fill, select, and assert on UI5 controls

:::
