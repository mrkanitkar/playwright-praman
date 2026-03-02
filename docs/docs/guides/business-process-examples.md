---
title: Business Process Examples
---

Complete end-to-end test examples for core SAP business processes. Each example is runnable
with Praman fixtures and demonstrates real-world patterns for Purchase Orders, Sales Orders,
Journal Entries, and cross-process P2P flows.

## Purchase Order — ME21N / Fiori

### Classic GUI (ME21N via Fiori Launchpad)

```typescript
import { test, expect } from 'playwright-praman';

test.describe('Purchase Order Creation (ME21N)', () => {
  test('create standard purchase order', async ({ ui5, ui5Navigation, ui5Matchers }) => {
    await test.step('navigate to Create Purchase Order app', async () => {
      await ui5Navigation.navigateToApp('MM-PUR-PO', {
        semanticObject: 'PurchaseOrder',
        action: 'create',
      });
    });

    await test.step('fill header data', async () => {
      await ui5.fill({ controlType: 'sap.m.Input', id: /supplierInput/ }, '100001');
      await ui5.fill({ controlType: 'sap.m.Input', id: /purchOrgInput/ }, '1000');
      await ui5.fill({ controlType: 'sap.m.Input', id: /companyCodeInput/ }, '1000');
    });

    await test.step('add line item', async () => {
      await ui5.click({ controlType: 'sap.m.Button', properties: { text: 'Add Item' } });
      await ui5.fill({ controlType: 'sap.m.Input', id: /materialInput/ }, 'MAT-001');
      await ui5.fill({ controlType: 'sap.m.Input', id: /quantityInput/ }, '100');
      await ui5.fill({ controlType: 'sap.m.Input', id: /plantInput/ }, '1000');
    });

    await test.step('save and verify', async () => {
      await ui5.click({ controlType: 'sap.m.Button', properties: { text: 'Save' } });
      const messageStrip = await ui5.control({
        controlType: 'sap.m.MessageStrip',
        properties: { type: 'Success' },
      });
      await ui5Matchers.toHaveText(messageStrip, /Purchase Order \d+ created/);
    });
  });
});
```

### Fiori Elements — Manage Purchase Orders

```typescript
import { test, expect } from 'playwright-praman';

test.describe('Manage Purchase Orders (Fiori Elements)', () => {
  test('create PO via Fiori Elements object page', async ({
    ui5,
    ui5Navigation,
    ui5Matchers,
    feListReport,
    feObjectPage,
  }) => {
    await test.step('navigate to list report', async () => {
      await ui5Navigation.navigateToApp('MM-PUR-PO', {
        semanticObject: 'PurchaseOrder',
        action: 'manage',
      });
    });

    await test.step('create new entry', async () => {
      await feListReport.clickCreate();
    });

    await test.step('fill header fields', async () => {
      await feObjectPage.fillField('Supplier', '100001');
      await feObjectPage.fillField('PurchasingOrganization', '1000');
      await feObjectPage.fillField('CompanyCode', '1000');
      await feObjectPage.fillField('PurchasingGroup', '001');
    });

    await test.step('add line item via table', async () => {
      await feObjectPage.clickSectionCreate('Items');
      await feObjectPage.fillField('Material', 'MAT-001');
      await feObjectPage.fillField('OrderQuantity', '100');
      await feObjectPage.fillField('Plant', '1000');
    });

    await test.step('save and verify', async () => {
      await feObjectPage.clickSave();
      await ui5Matchers.toHaveMessageStrip('Success', /Purchase Order \d+ created/);
    });
  });
});
```

## Sales Order — VA01 / Fiori

### Classic GUI (VA01 via Fiori Launchpad)

```typescript
import { test, expect } from 'playwright-praman';

test.describe('Sales Order Creation (VA01)', () => {
  test('create standard sales order', async ({ ui5, ui5Navigation, ui5Matchers }) => {
    await test.step('navigate to Create Sales Order app', async () => {
      await ui5Navigation.navigateToApp('SD-SLS-SO', {
        semanticObject: 'SalesOrder',
        action: 'create',
      });
    });

    await test.step('fill order type and org data', async () => {
      await ui5.fill(
        { controlType: 'sap.m.Input', id: /orderTypeInput/ },
        'OR', // Standard Order
      );
      await ui5.fill({ controlType: 'sap.m.Input', id: /salesOrgInput/ }, '1000');
      await ui5.fill({ controlType: 'sap.m.Input', id: /distChannelInput/ }, '10');
      await ui5.fill({ controlType: 'sap.m.Input', id: /divisionInput/ }, '00');
    });

    await test.step('fill customer and item data', async () => {
      await ui5.fill({ controlType: 'sap.m.Input', id: /soldToPartyInput/ }, 'CUST-001');
      await ui5.fill({ controlType: 'sap.m.Input', id: /materialInput/ }, 'MAT-100');
      await ui5.fill({ controlType: 'sap.m.Input', id: /quantityInput/ }, '50');
    });

    await test.step('save and verify', async () => {
      await ui5.click({ controlType: 'sap.m.Button', properties: { text: 'Save' } });
      const message = await ui5.control({
        controlType: 'sap.m.MessageStrip',
        properties: { type: 'Success' },
      });
      await ui5Matchers.toHaveText(message, /Sales Order \d+ created/);
    });
  });
});
```

### Fiori Elements — Manage Sales Orders

```typescript
import { test, expect } from 'playwright-praman';

test.describe('Manage Sales Orders (Fiori Elements)', () => {
  test('create sales order via object page', async ({
    ui5Navigation,
    ui5Matchers,
    feListReport,
    feObjectPage,
  }) => {
    await test.step('open app and create', async () => {
      await ui5Navigation.navigateToApp('SD-SLS-SO', {
        semanticObject: 'SalesOrder',
        action: 'manage',
      });
      await feListReport.clickCreate();
    });

    await test.step('fill header', async () => {
      await feObjectPage.fillField('SalesOrderType', 'OR');
      await feObjectPage.fillField('SoldToParty', 'CUST-001');
      await feObjectPage.fillField('SalesOrganization', '1000');
      await feObjectPage.fillField('DistributionChannel', '10');
    });

    await test.step('add line items', async () => {
      await feObjectPage.clickSectionCreate('Items');
      await feObjectPage.fillField('Material', 'MAT-100');
      await feObjectPage.fillField('RequestedQuantity', '50');
    });

    await test.step('save and capture order number', async () => {
      await feObjectPage.clickSave();
      await ui5Matchers.toHaveMessageStrip('Success', /Sales Order \d+ created/);
    });
  });
});
```

## Journal Entry — FB50 / Fiori

### Classic GUI (FB50 via Fiori Launchpad)

```typescript
import { test, expect } from 'playwright-praman';

test.describe('Journal Entry (FB50)', () => {
  test('post G/L account journal entry', async ({ ui5, ui5Navigation, ui5Matchers }) => {
    await test.step('navigate to Post Journal Entry', async () => {
      await ui5Navigation.navigateToApp('FI-GL', {
        semanticObject: 'JournalEntry',
        action: 'create',
      });
    });

    await test.step('fill document header', async () => {
      await ui5.fill({ controlType: 'sap.m.DatePicker', id: /documentDatePicker/ }, '2025-01-15');
      await ui5.fill({ controlType: 'sap.m.Input', id: /companyCodeInput/ }, '1000');
      await ui5.fill({ controlType: 'sap.m.Input', id: /currencyInput/ }, 'USD');
    });

    await test.step('add debit line', async () => {
      await ui5.click({ controlType: 'sap.m.Button', properties: { text: 'Add Row' } });
      await ui5.fill(
        { controlType: 'sap.m.Input', id: /glAccountInput--0/ },
        '400000', // Revenue account
      );
      await ui5.fill({ controlType: 'sap.m.Input', id: /debitAmountInput--0/ }, '1000.00');
    });

    await test.step('add credit line', async () => {
      await ui5.click({ controlType: 'sap.m.Button', properties: { text: 'Add Row' } });
      await ui5.fill(
        { controlType: 'sap.m.Input', id: /glAccountInput--1/ },
        '113100', // Bank account
      );
      await ui5.fill({ controlType: 'sap.m.Input', id: /creditAmountInput--1/ }, '1000.00');
    });

    await test.step('post and verify', async () => {
      await ui5.click({ controlType: 'sap.m.Button', properties: { text: 'Post' } });
      const message = await ui5.control({
        controlType: 'sap.m.MessageStrip',
        properties: { type: 'Success' },
      });
      await ui5Matchers.toHaveText(message, /Document \d+ posted/);
    });
  });
});
```

### Fiori — Post Journal Entries (F0718)

```typescript
import { test, expect } from 'playwright-praman';

test.describe('Post Journal Entries Fiori (F0718)', () => {
  test('create and post journal entry', async ({ ui5, ui5Navigation, ui5Matchers }) => {
    await test.step('navigate to Post Journal Entries', async () => {
      await ui5Navigation.navigateToIntent('#JournalEntry-create');
    });

    await test.step('fill header and line items', async () => {
      await ui5.fill(
        { controlType: 'sap.ui.comp.smartfield.SmartField', id: /CompanyCode/ },
        '1000',
      );
      await ui5.fill(
        { controlType: 'sap.ui.comp.smartfield.SmartField', id: /DocumentDate/ },
        '2025-01-15',
      );

      // Debit line
      await ui5.fill(
        { controlType: 'sap.ui.comp.smartfield.SmartField', id: /GLAccount.*0/ },
        '400000',
      );
      await ui5.fill(
        { controlType: 'sap.ui.comp.smartfield.SmartField', id: /AmountInTransCrcy.*0/ },
        '1000.00',
      );

      // Credit line
      await ui5.fill(
        { controlType: 'sap.ui.comp.smartfield.SmartField', id: /GLAccount.*1/ },
        '113100',
      );
      await ui5.fill(
        { controlType: 'sap.ui.comp.smartfield.SmartField', id: /AmountInTransCrcy.*1/ },
        '-1000.00',
      );
    });

    await test.step('post document', async () => {
      await ui5.click({ controlType: 'sap.m.Button', properties: { text: 'Post' } });
      await ui5Matchers.toHaveMessageStrip('Success', /Document \d+ posted/);
    });
  });
});
```

## Purchase-to-Pay (P2P) Cross-Process E2E

The P2P flow spans multiple SAP modules: procurement, goods receipt, invoice verification,
and payment. This tutorial demonstrates a complete end-to-end test that exercises the full chain.

```typescript
import { test, expect } from 'playwright-praman';

test.describe('Purchase-to-Pay E2E Flow', () => {
  let poNumber: string;
  let grDocNumber: string;
  let invoiceNumber: string;

  test('complete P2P cycle', async ({
    ui5,
    ui5Navigation,
    ui5Matchers,
    feListReport,
    feObjectPage,
  }) => {
    await test.step('Step 1: Create Purchase Order', async () => {
      await ui5Navigation.navigateToIntent('#PurchaseOrder-create');
      await feObjectPage.fillField('Supplier', '100001');
      await feObjectPage.fillField('PurchasingOrganization', '1000');
      await feObjectPage.fillField('CompanyCode', '1000');

      await feObjectPage.clickSectionCreate('Items');
      await feObjectPage.fillField('Material', 'MAT-001');
      await feObjectPage.fillField('OrderQuantity', '10');
      await feObjectPage.fillField('Plant', '1000');

      await feObjectPage.clickSave();
      const successMsg = await ui5.control({
        controlType: 'sap.m.MessageStrip',
        properties: { type: 'Success' },
      });
      const text = await successMsg.getText();
      const match = text.match(/Purchase Order (\d+)/);
      poNumber = match?.[1] ?? '';
      expect(poNumber).toBeTruthy();
    });

    await test.step('Step 2: Post Goods Receipt (MIGO)', async () => {
      await ui5Navigation.navigateToIntent('#GoodsReceipt-create');
      await ui5.fill({ controlType: 'sap.m.Input', id: /poNumberInput/ }, poNumber);
      await ui5.click({ controlType: 'sap.m.Button', properties: { text: 'Load' } });

      // Verify items auto-populated
      const table = await ui5.control({ controlType: 'sap.m.Table', id: /itemsTable/ });
      await ui5Matchers.toHaveRowCount(table, 1);

      await ui5.click({ controlType: 'sap.m.Button', properties: { text: 'Post' } });
      const grMsg = await ui5.control({
        controlType: 'sap.m.MessageStrip',
        properties: { type: 'Success' },
      });
      const grText = await grMsg.getText();
      const grMatch = grText.match(/Document (\d+)/);
      grDocNumber = grMatch?.[1] ?? '';
      expect(grDocNumber).toBeTruthy();
    });

    await test.step('Step 3: Create Invoice (MIRO)', async () => {
      await ui5Navigation.navigateToIntent('#SupplierInvoice-create');
      await ui5.fill({ controlType: 'sap.m.Input', id: /poReferenceInput/ }, poNumber);
      await ui5.fill({ controlType: 'sap.m.Input', id: /invoiceAmountInput/ }, '5000.00');
      await ui5.fill({ controlType: 'sap.m.DatePicker', id: /invoiceDatePicker/ }, '2025-02-01');

      await ui5.click({ controlType: 'sap.m.Button', properties: { text: 'Post' } });
      const invMsg = await ui5.control({
        controlType: 'sap.m.MessageStrip',
        properties: { type: 'Success' },
      });
      const invText = await invMsg.getText();
      const invMatch = invText.match(/Invoice (\d+)/);
      invoiceNumber = invMatch?.[1] ?? '';
      expect(invoiceNumber).toBeTruthy();
    });

    await test.step('Step 4: Verify Payment Run (F110)', async () => {
      await ui5Navigation.navigateToApp('FI-AP', {
        semanticObject: 'PaymentRun',
        action: 'display',
      });
      await feListReport.setFilterValues({ Supplier: '100001', Status: 'Paid' });
      await feListReport.clickGo();
      await feListReport.expectRowCount({ min: 1 });
    });

    await test.step('Step 5: Verify complete document flow', async () => {
      await ui5Navigation.navigateToIntent(`#PurchaseOrder-display?PurchaseOrder=${poNumber}`);
      await ui5.click({
        controlType: 'sap.m.IconTabFilter',
        properties: { key: 'documentFlow' },
      });

      const flowTable = await ui5.control({ controlType: 'sap.m.Table', id: /docFlowTable/ });
      await ui5Matchers.toHaveRowCount(flowTable, { min: 3 }); // PO + GR + Invoice
    });
  });
});
```

### Key Patterns in the P2P Example

| Pattern                                       | Why                                           |
| --------------------------------------------- | --------------------------------------------- |
| `test.step()` for each business step          | Clear trace output, easy to pinpoint failures |
| Capture document numbers between steps        | Enables cross-referencing across documents    |
| `expect(poNumber).toBeTruthy()` after capture | Fail fast if a prior step silently failed     |
| Navigate by semantic object + action          | Resilient to FLP configuration changes        |
| Verify document flow at the end               | Confirms SAP linked all documents correctly   |

## Data Cleanup Strategies

For repeatable tests, clean up created data after the test run:

```typescript
test.afterAll(async ({ ui5 }) => {
  // Option 1: Use OData to delete test data
  await ui5.odata.deleteEntity('/PurchaseOrders', poNumber);

  // Option 2: Use an SAP cleanup BAPI via RFC
  // (Requires backend RFC connection setup)

  // Option 3: Flag for batch cleanup
  // Store document numbers for nightly cleanup jobs
});
```

See the [Gold Standard Test Pattern](./gold-standard-test.md) for a complete template that
includes data cleanup, error handling, and all best practices.
