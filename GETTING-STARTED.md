# Getting Started with Praman

Praman is an AI-first SAP UI5 test automation platform built on Playwright.
This guide walks you from zero to a running test in minutes.

## Installation

```bash
npm install -D playwright-praman @playwright/test
npx playwright install chromium
```

## Project Setup

### 1. Create playwright.config.ts

```typescript
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  timeout: 60_000,
  retries: 1,
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

### 2. Set Up Authentication

Copy the example auth setup into your project:

```bash
mkdir -p tests
cp node_modules/playwright-praman/examples/auth-setup.ts tests/auth-setup.ts
```

Or create your own `tests/auth-setup.ts`. See `examples/auth-setup.ts` for a
complete reference covering OnPrem, BTP Cloud SAML, and Office 365 strategies.

Set environment variables (in `.env.test` or CI secrets):

```bash
SAP_BASE_URL=https://your-sap-system.example.com
SAP_USERNAME=TEST_USER
SAP_PASSWORD=SecurePassword123
SAP_AUTH_STRATEGY=basic    # 'basic' | 'btp-saml' | 'office365'
SAP_CLIENT=100             # OnPrem only
```

### 3. Add .auth to .gitignore

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

## Project Structure

```text
my-sap-tests/
  tests/
    auth-setup.ts          # Authentication (runs once)
    purchase-order.spec.ts # Your test files
    sales-order.spec.ts
  .auth/
    sap-session.json       # Saved session (gitignored)
  playwright.config.ts
  package.json
```

## Persona Quick-Start Guides

### Test Automation Engineer

Focus on **fixtures, assertions, and test.step()** for structured test flows.

Key fixtures available in every test:

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

### AI Agent (Copilot / Claude Code)

Focus on **imports, capabilities, and error codes** for automated test generation.

**Single import**: `import { test, expect } from 'playwright-praman'`

**Capability query**: Use `pramanAI.capabilities.forAI()` to discover available
operations at runtime.

**Error codes**: All errors extend `PramanError` with structured fields:

- `code` -- machine-readable (e.g., `ERR_CONTROL_NOT_FOUND`)
- `retryable` -- boolean indicating if retry is appropriate
- `suggestions[]` -- array of human-readable fix suggestions

**Skill files**: Read `node_modules/playwright-praman/skills/playwright-praman-sap-testing/SKILL.md`
for the complete 7-rule compliance framework.

**Forbidden patterns**: Never use `page.click('#__...')`, `page.fill('#__...')`,
or `page.locator('.sapM...')` for UI5 elements. Always use Praman fixtures.

### SAP Business Analyst

Focus on **intents and vocabulary** for writing tests in business terms.

The intent API lets you write tests using SAP business terminology instead
of technical control IDs:

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

Supported vocabulary domains: procurement (MM), sales (SD), finance (FI),
manufacturing (PP), warehouse (WM/EWM), quality (QM).

See `docs/docs/guides/vocabulary-system.md` for term mappings and
`docs/docs/guides/intent-api.md` for the full intent API reference.

## Further Reading

| Topic | Documentation |
| --- | --- |
| Full API reference | `skills/playwright-praman-sap-testing/api-reference.md` |
| Authentication strategies | `skills/playwright-praman-sap-testing/authentication.md` |
| AI capabilities | `skills/playwright-praman-sap-testing/ai-capabilities.md` |
| Architecture overview | `docs/docs/guides/architecture-overview.md` |
| Vocabulary system | `docs/docs/guides/vocabulary-system.md` |
| Error handling | `docs/docs/guides/errors.md` |
| Documentation map | `DOCS-MAP.md` |
