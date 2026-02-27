---
sidebar_position: 1
title: Getting Started
---

Get up and running with Praman in under 5 minutes.

## Prerequisites

- **Node.js** >= 20
- **Playwright** >= 1.57
- Access to an SAP UI5 / Fiori application

## Installation

```bash
npm install -D playwright-praman @playwright/test
npx playwright install chromium
```

## Project Setup

### 1. Create Praman Configuration

Create `praman.config.ts` in your project root:

```typescript
import { defineConfig } from 'playwright-praman';

export default defineConfig({
  logLevel: 'info',
  ui5WaitTimeout: 30_000,
  controlDiscoveryTimeout: 10_000,
  interactionStrategy: 'ui5-native',
});
```

### 2. Create Playwright Configuration

Create or update `playwright.config.ts`:

```typescript
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  timeout: 60_000,
  retries: 1,
  use: {
    baseURL: process.env.SAP_BASE_URL,
    trace: 'on-first-retry',
  },
  projects: [
    // Auth setup project -- runs first, saves session
    {
      name: 'auth',
      testMatch: '**/auth-setup.ts',
    },
    // Main test project -- reuses saved session
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        storageState: '.auth/sap-session.json',
        baseURL: process.env['SAP_BASE_URL'],
      },
      dependencies: ['auth'],
    },
  ],
});
```

### 3. Set Up Authentication

Copy the example auth setup into your project:

```bash
mkdir -p tests
cp node_modules/playwright-praman/examples/auth-setup.ts tests/auth-setup.ts
```

Or create your own `tests/auth-setup.ts`. See the [Auth Setup example](../examples/auth-setup) for a complete reference covering OnPrem, BTP Cloud SAML, and Office 365 strategies.

### 4. Environment Variables

Create a `.env` file (never commit this):

```bash
SAP_BASE_URL=https://your-sap-system.example.com
SAP_USERNAME=TEST_USER
SAP_PASSWORD=SecurePassword123
SAP_AUTH_STRATEGY=basic    # 'basic' | 'btp-saml' | 'office365'
SAP_CLIENT=100             # OnPrem only
SAP_LANGUAGE=EN            # Optional, default EN
```

### 5. Add .auth to .gitignore

```bash
echo '.auth/' >> .gitignore
```

## Your First Test

Create `tests/purchase-order.spec.ts`:

```typescript
import { test, expect } from 'playwright-praman';

test('navigate to Purchase Order app and verify table', async ({
  ui5,
  ui5Navigation,
}) => {
  // Step 1: Navigate to the Fiori app
  await test.step('Open Purchase Order app', async () => {
    await ui5Navigation.navigateToApp('PurchaseOrder-manage');
  });

  // Step 2: Wait for UI5 to stabilize
  await test.step('Wait for page load', async () => {
    await ui5.waitForUI5();
  });

  // Step 3: Discover a control by type
  await test.step('Find the Create button', async () => {
    const createBtn = await ui5.control({
      controlType: 'sap.m.Button',
      properties: { text: 'Create' },
    });
    // The control proxy exposes all UI5 methods
    const text = await createBtn.getText();
    expect(text).toBe('Create');
  });

  // Step 4: Read table data
  await test.step('Verify table has rows', async () => {
    const rowCount = await ui5.table.getRowCount('myTable');
    expect(rowCount).toBeGreaterThan(0);
  });
});
```

## Running Tests

```bash
# Run all tests
npx playwright test

# Run a specific test file
npx playwright test tests/purchase-order.spec.ts

# Run with visible browser
npx playwright test --headed

# Run with Playwright UI mode
npx playwright test --ui
```

Expected output:

```text
Running 1 test using 1 worker

  ✓  tests/purchase-order.spec.ts:3:1 › navigate to Purchase Order app (12s)

  1 passed (14s)
```

:::tip Why `ui5.control()` instead of `page.locator()`?
SAP UI5 renders controls dynamically -- DOM IDs change between versions, themes restructure
elements, and controls nest inside generated wrappers. `ui5.control()` discovers controls through
the **UI5 runtime's own control registry**, which is the stable contract. Your tests survive DOM
restructuring, theme changes, and UI5 version upgrades.
:::

## Import Pattern

Praman uses Playwright's `mergeTests()` to combine all fixtures into a single `test` object:

```typescript
import { test, expect } from 'playwright-praman';

// All fixtures available via destructuring:
test('full access', async ({
  ui5, // Control discovery + interaction
  ui5Navigation, // FLP navigation
  sapAuth, // Authentication
  fe, // Fiori Elements helpers
  pramanAI, // AI page discovery
  intent, // Business domain intents
  ui5Shell, // FLP shell header
  ui5Footer, // Page footer bar
  flpLocks, // SM12 lock management
  flpSettings, // User settings
  testData, // Test data generation
}) => {
  // ...
});
```

## Common Patterns

### Control Discovery

```typescript
// By ID
const btn = await ui5.control({ id: 'submitBtn' });

// By control type + properties
const input = await ui5.control({
  controlType: 'sap.m.Input',
  properties: { placeholder: 'Enter vendor' },
});

// Multiple controls
const buttons = await ui5.controls({ controlType: 'sap.m.Button' });
```

### Input Fields (Gold Pattern)

Always use `setValue()` + `fireChange()` + `waitForUI5()` together:

```typescript
const input = await ui5.control({ id: 'vendorInput' });
await input.setValue('SUP-001');
await input.fireChange({ value: 'SUP-001' });
await ui5.waitForUI5();
```

Or use the shorthand:

```typescript
await ui5.fill({ id: 'vendorInput' }, 'SUP-001');
```

:::warning
Never use `page.fill()` or `page.type()` for UI5 Input controls. These bypass the UI5 event model, which means OData bindings, value state updates, and field validation will not trigger.
:::

### Table Operations

```typescript
// Read table data
const rows = await ui5.table.getRows('purchaseOrderTable');
const columns = await ui5.table.getColumnNames('purchaseOrderTable');

// Find a row by column values
const rowIndex = await ui5.table.findRowByValues('purchaseOrderTable', {
  'Purchase Order': '4500001234',
});

// Click a row
await ui5.table.clickRow('purchaseOrderTable', rowIndex);

// Get a specific cell value
const vendor = await ui5.table.getCellByColumnName(
  'purchaseOrderTable',
  0,
  'Vendor',
);
```

### Dialog Handling

```typescript
// Wait for a dialog to appear
const dialog = await ui5.dialog.waitFor();

// Confirm a dialog
await ui5.dialog.confirm();

// Dismiss a dialog
await ui5.dialog.dismiss();

// Find controls inside a dialog
const dialogBtn = await ui5.control({
  controlType: 'sap.m.Button',
  properties: { text: 'OK' },
  searchOpenDialogs: true,
});
```

:::warning
Always use `searchOpenDialogs: true` when finding controls inside an `sap.m.Dialog`. Without it, `ui5.control()` only searches the main view.
:::

### Navigation

```typescript
// Navigate to a Fiori app by semantic object
await ui5Navigation.navigateToApp('PurchaseOrder-manage');

// Navigate to a tile by title
await ui5Navigation.navigateToTile('Manage Purchase Orders');

// Navigate to a specific URL hash
await ui5Navigation.navigateToHash('#PurchaseOrder-manage&/PurchaseOrders');

// Go back
await ui5Navigation.navigateBack();

// Go to FLP home
await ui5Navigation.navigateToHome();
```

### Fiori Elements Shortcuts

```typescript
// List Report
await fe.listReport.setFilter('Vendor', 'SUP-001');
await fe.listReport.search();
await fe.listReport.navigateToItem(0);

// Object Page
const title = await fe.objectPage.getHeaderTitle();
await fe.objectPage.clickEdit();
await fe.objectPage.navigateToSection('Items');
await fe.objectPage.clickSave();
```

### Business Intent APIs

```typescript
// Create a purchase order using business terms (vocabulary-resolved)
await intent.procurement.createPurchaseOrder({
  vendor: 'SUP-001',
  material: 'MAT001',
  quantity: 10,
  plant: '1000',
  companyCode: '1000',
  purchasingOrg: '1000',
});

// Fill a field using business vocabulary
await intent.core.fillField('Vendor', 'SUP-001');
```

## Fixture Quick Reference

| Fixture | Purpose |
| --- | --- |
| `ui5` | Core control discovery and interaction |
| `ui5.table` | Table read, filter, sort, select |
| `ui5.dialog` | Dialog lifecycle (wait, confirm, dismiss) |
| `ui5.date` | DatePicker and TimePicker operations |
| `ui5.odata` | OData model reads and HTTP operations |
| `ui5Navigation` | FLP and in-app navigation |
| `ui5Footer` | Footer toolbar buttons (Save, Edit, Cancel) |
| `ui5Shell` | Shell header (Home, Notifications, User menu) |
| `fe` | Fiori Elements List Report, Object Page, Table |
| `intent` | Business intent APIs (procurement, sales, finance) |

Always wrap multi-step flows in `test.step()` for clear reporting:

```typescript
await test.step('Create purchase order', async () => {
  // ... multiple interactions
});
```

## Persona Quick-Start Guides

### Test Automation Engineer

Focus on **fixtures, assertions, and `test.step()`** for structured test flows.

All fixtures are available via destructuring from the `test` callback. Use `test.step()` to organize multi-step flows for clear HTML reports.

### AI Agent (Copilot / Claude Code)

Focus on **imports, capabilities, and error codes** for automated test generation.

- **Single import**: `import { test, expect } from 'playwright-praman'`
- **Capability query**: Use `pramanAI.capabilities.forAI()` to discover available operations at runtime
- **Error codes**: All errors extend `PramanError` with `code`, `retryable`, and `suggestions[]`
- **Forbidden patterns**: Never use `page.click('#__...')`, `page.fill('#__...')`, or `page.locator('.sapM...')` for UI5 elements

### SAP Business Analyst

Focus on **intents and vocabulary** for writing tests in business terms.

```typescript
// Instead of finding controls by ID:
await intent.core.fillField('Vendor', 'SUP-001');
await intent.core.fillField('Material', 'MAT001');
await intent.core.fillField('Quantity', '10');

// Or use domain-specific intents:
await intent.procurement.createPurchaseOrder({
  vendor: 'SUP-001',
  material: 'MAT001',
  quantity: 10,
  plant: '1000',
});
```

Supported vocabulary domains: procurement (MM), sales (SD), finance (FI), manufacturing (PP), warehouse (WM/EWM), quality (QM).

## Project Structure

```text
my-sap-tests/
  tests/
    auth-setup.ts          # Authentication (runs once)
    purchase-order.spec.ts # Your test files
    sales-order.spec.ts
  .auth/
    sap-session.json       # Saved session (gitignored)
  praman.config.ts
  playwright.config.ts
  package.json
```

## Next Steps

| Topic | Documentation |
| --- | --- |
| Configuration reference | [Configuration](./configuration) |
| Authentication strategies | [Authentication](./authentication) |
| Selector reference | [Selectors](./selectors) |
| Fixture reference | [Fixtures](./fixtures) |
| Error reference | [Errors](./errors) |
| Agent & IDE setup | [Agent Setup](./agent-setup) |
| Vocabulary system | [Vocabulary](./vocabulary-system) |
| Intent API | [Intent API](./intent-api) |
| Examples | [Examples](../examples/) |
| Architecture overview | [Architecture](./architecture-overview) |
