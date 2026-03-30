---
title: Gold Standard Test Pattern
---

A complete reference test that demonstrates every Praman best practice in a single runnable
example. Use this as a template for your most critical business process tests.

## What Makes a "Gold Standard" Test

| Practice                             | Why It Matters                         |
| ------------------------------------ | -------------------------------------- |
| `test.step()` for every logical step | Clear trace output, pinpoints failures |
| Fixtures for all SAP interactions    | Type-safe, auto-waiting, reusable      |
| Semantic selectors (not DOM)         | Resilient to UI5 version upgrades      |
| Custom matchers for assertions       | Readable, consistent error messages    |
| Structured error handling            | Actionable failure diagnostics         |
| Auth via setup project               | One login, shared across tests         |
| Data cleanup in `afterAll`           | Repeatable, no test pollution          |
| No `page.waitForTimeout()`           | Deterministic, fast execution          |

## Complete Example

```typescript
import { test, expect } from 'playwright-praman';

/**
 * Gold Standard: Purchase Order Approval Flow
 *
 * Tests the complete PO creation and approval workflow:
 * 1. Create PO with required approvals
 * 2. Verify PO status and workflow
 * 3. Approve the PO
 * 4. Verify final status
 * 5. Clean up test data
 */
test.describe('Purchase Order Approval Flow', () => {
  // Track created entities for cleanup
  let createdPONumber: string;

  // ── Auth: handled by setup project dependency ──
  // See playwright.config.ts: { dependencies: ['setup'] }

  test.beforeEach(async ({ ui5Navigation }) => {
    await test.step('navigate to Fiori Launchpad home', async () => {
      await ui5Navigation.navigateToIntent({ semanticObject: 'Shell', action: 'home' });
    });
  });

  test('create and approve purchase order', async ({ ui5, ui5Navigation, fe, page }) => {
    // ── Step 1: Create Purchase Order ──
    await test.step('create purchase order', async () => {
      await test.step('navigate to PO creation', async () => {
        await ui5Navigation.navigateToIntent({ semanticObject: 'PurchaseOrder', action: 'create' });
      });

      await test.step('fill header data', async () => {
        await ui5.fill({ id: /Supplier/ }, '100001');
        await ui5.fill({ id: /PurchasingOrganization/ }, '1000');
        await ui5.fill({ id: /CompanyCode/ }, '1000');
        await ui5.fill({ id: /PurchasingGroup/ }, '001');
      });

      await test.step('add line item', async () => {
        await fe.objectPage.clickButton('Create');
        await ui5.fill({ id: /Material/ }, 'MAT-APPROVE-001');
        await ui5.fill({ id: /OrderQuantity/ }, '500');
        await ui5.fill({ id: /Plant/ }, '1000');
        await ui5.fill({ id: /NetPrice/ }, '10000.00');
      });

      await test.step('save and capture PO number', async () => {
        await fe.objectPage.clickSave();

        // Assert success message
        const messageStrip = await ui5.control({
          controlType: 'sap.m.MessageStrip',
          properties: { type: 'Success' },
        });
        await expect(messageStrip).toHaveUI5Text(/Purchase Order (\d+) created/);

        // Capture PO number for subsequent steps and cleanup
        const text = await messageStrip.getText();
        const match = text.match(/Purchase Order (\d+)/);
        createdPONumber = match?.[1] ?? '';
        expect(createdPONumber).toBeTruthy();
      });
    });

    // ── Step 2: Verify PO Requires Approval ──
    await test.step('verify PO status requires approval', async () => {
      await test.step('navigate to PO display', async () => {
        await ui5Navigation.navigateToIntent(
          { semanticObject: 'PurchaseOrder', action: 'display' },
          { PurchaseOrder: createdPONumber },
        );
      });

      await test.step('check status field', async () => {
        const statusField = await ui5.control({
          controlType: 'sap.m.ObjectStatus',
          id: /overallStatusText/,
        });
        await expect(statusField).toHaveUI5Text('Awaiting Approval');
      });

      await test.step('verify workflow section exists', async () => {
        await ui5.click({
          controlType: 'sap.m.IconTabFilter',
          properties: { key: 'workflow' },
        });
        const workflowTable = await ui5.control({
          controlType: 'sap.m.Table',
          id: /workflowItemsTable/,
        });
        await expect(workflowTable).toHaveUI5RowCount(1);
      });
    });

    // ── Step 3: Approve the Purchase Order ──
    await test.step('approve the purchase order', async () => {
      await test.step('navigate to approval inbox', async () => {
        await ui5Navigation.navigateToIntent({
          semanticObject: 'WorkflowTask',
          action: 'displayInbox',
        });
      });

      await test.step('find and open PO approval task', async () => {
        // Filter for our specific PO
        await fe.listReport.setFilter('TaskTitle', `Purchase Order ${createdPONumber}`);
        await fe.listReport.search();

        // Click the task row
        await ui5.click({
          controlType: 'sap.m.ColumnListItem',
          ancestor: { controlType: 'sap.m.Table', id: /taskListTable/ },
        });
      });

      await test.step('click approve button', async () => {
        await ui5.click({
          controlType: 'sap.m.Button',
          properties: { text: 'Approve' },
        });

        // Confirm approval dialog if present
        const confirmButton = await ui5.control({
          controlType: 'sap.m.Button',
          properties: { text: 'Confirm' },
          searchOpenDialogs: true,
        });
        await confirmButton.click();
      });

      await test.step('verify approval success', async () => {
        const successMsg = await ui5.control({
          controlType: 'sap.m.MessageStrip',
          properties: { type: 'Success' },
        });
        await expect(successMsg).toHaveUI5Text(/approved/i);
      });
    });

    // ── Step 4: Verify Final Status ──
    await test.step('verify PO is approved', async () => {
      await ui5Navigation.navigateToIntent(
        { semanticObject: 'PurchaseOrder', action: 'display' },
        { PurchaseOrder: createdPONumber },
      );

      const statusField = await ui5.control({
        controlType: 'sap.m.ObjectStatus',
        id: /overallStatusText/,
      });
      await expect(statusField).toHaveUI5Text('Approved');
    });
  });

  // ── Step 5: Cleanup ──
  test.afterAll(async ({ ui5 }) => {
    if (createdPONumber) {
      await test.step('delete test purchase order', async () => {
        try {
          await ui5.odata.deleteEntity('/PurchaseOrders', createdPONumber);
        } catch {
          // Log but do not fail the test suite on cleanup errors
          console.warn(`Cleanup: failed to delete PO ${createdPONumber}`);
        }
      });
    }
  });
});
```

## Anatomy of the Gold Standard

### 1. Test Organization

```
describe('Business Process Name')
  beforeEach  → navigate to known starting point
  test        → the actual business flow
    step 1    → first business action (may have sub-steps)
    step 2    → verification
    step 3    → next action
    step N    → final verification
  afterAll    → cleanup created data
```

### 2. Selector Strategy (Priority Order)

Use the most resilient selector available. In priority order:

```typescript
// 1. Binding path (most resilient — survives ID changes)
await ui5.control({
  controlType: 'sap.ui.comp.smartfield.SmartField',
  bindingPath: { path: '/CompanyCode' },
});

// 2. Properties (semantic — survives refactoring)
await ui5.control({
  controlType: 'sap.m.Button',
  properties: { text: 'Save' },
});

// 3. ID with RegExp (flexible — survives view prefix changes)
await ui5.control({
  controlType: 'sap.m.Input',
  id: /materialInput/,
});

// 4. Exact ID (brittle — use only when nothing else works)
await ui5.control({
  controlType: 'sap.m.Input',
  id: 'myApp--detailView--materialInput',
});
```

### 3. Assertion Patterns

```typescript
// Use custom matchers for SAP-specific assertions (registered via expect.extend())
await expect(control).toHaveUI5Text('Expected Text');
await expect(control).toHaveUI5Text(/partial match/);
await expect(control).toHaveUI5Property('enabled', true);
await expect(table).toHaveUI5RowCount(5);
await expect(control).toBeUI5Visible();
await expect(control).toBeUI5Enabled();

// For standard Playwright assertions on the page
await expect(page).toHaveURL(/PurchaseOrder/);
await expect(page).toHaveTitle(/SAP/);
```

### 4. Error Handling Pattern

```typescript
await test.step('handle potential error dialogs', async () => {
  // Check for and dismiss error popups before proceeding
  let errorDialog;
  try {
    errorDialog = await ui5.control({
      controlType: 'sap.m.Dialog',
      properties: { type: 'Message' },
      searchOpenDialogs: true,
    });
  } catch {
    errorDialog = null;
  }

  if (errorDialog) {
    const errorText = await errorDialog.getProperty('content');
    // Attach error details to the test report
    await test.info().attach('sap-error-dialog', {
      body: JSON.stringify(errorText, null, 2),
      contentType: 'application/json',
    });

    // Dismiss the dialog
    await ui5.click({
      controlType: 'sap.m.Button',
      properties: { text: 'Close' },
      searchOpenDialogs: true,
    });

    // Fail with actionable message
    throw new Error(`SAP error dialog appeared: ${JSON.stringify(errorText)}`);
  }
});
```

### 5. Data-Driven Variant

For running the same test with multiple data sets:

```typescript
const testData = [
  { supplier: '100001', material: 'MAT-001', quantity: '10', plant: '1000' },
  { supplier: '100002', material: 'MAT-002', quantity: '50', plant: '2000' },
  { supplier: '100003', material: 'MAT-003', quantity: '100', plant: '3000' },
];

for (const data of testData) {
  test(`create PO for supplier ${data.supplier}`, async ({ ui5, ui5Navigation, fe }) => {
    await ui5Navigation.navigateToIntent({ semanticObject: 'PurchaseOrder', action: 'create' });
    await ui5.fill({ id: /Supplier/ }, data.supplier);
    await ui5.fill({ id: /Material/ }, data.material);
    await ui5.fill({ id: /OrderQuantity/ }, data.quantity);
    await ui5.fill({ id: /Plant/ }, data.plant);
    await fe.objectPage.clickSave();
    const messageStrip = await ui5.control({
      controlType: 'sap.m.MessageStrip',
      properties: { type: 'Success' },
    });
    await expect(messageStrip).toHaveUI5Text(/created/);
  });
}
```

## Playwright Config for Gold Standard Tests

```typescript
// playwright.config.ts
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  timeout: 120_000, // 2 minutes for SAP transactions
  retries: 1,
  workers: 1, // Sequential for SAP state-dependent tests

  use: {
    baseURL: process.env.SAP_BASE_URL,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'on-first-retry',
  },

  projects: [
    {
      name: 'setup',
      testMatch: /auth-setup\.ts/,
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'gold-standard',
      dependencies: ['setup'],
      testMatch: /gold-standard\.spec\.ts/,
      use: {
        ...devices['Desktop Chrome'],
        storageState: '.auth/sap-session.json',
      },
    },
  ],

  reporter: [
    ['html', { open: 'never' }],
    ['playwright-praman/reporters', { outputDir: 'reports' }],
  ],
});
```

## Checklist

Use this checklist when writing new tests to verify they meet gold standard quality:

- [ ] Every logical step wrapped in `test.step()`
- [ ] Selectors use UI5 control types (not CSS selectors)
- [ ] Assertions use Praman custom matchers where applicable
- [ ] No `page.waitForTimeout()` calls
- [ ] No hardcoded DOM selectors
- [ ] Document numbers captured and used for cross-referencing
- [ ] Data cleanup in `afterAll` or `afterEach`
- [ ] Error dialog handling for SAP message popups
- [ ] Auth handled by setup project (not inline login)
- [ ] Test can run independently (no dependency on prior test state)
- [ ] Trace and screenshot configured for failure analysis
