---
sidebar_position: 52
title: 'From Tosca to Playwright-Praman'
---

A comprehensive guide for teams migrating from Tricentis Tosca to Playwright + Praman for
SAP Fiori and UI5 web application testing. Covers concept mapping, workflow changes, and
practical code examples.

## Why Migrate?

| Factor             | Tosca                          | Playwright + Praman                          |
| ------------------ | ------------------------------ | -------------------------------------------- |
| License cost       | Per-user commercial license    | Open source (Apache 2.0)                     |
| SAP Fiori support  | Via SAP UI5 scan / engine      | Native UI5 control registry                  |
| CI/CD integration  | Tosca CI adapter               | First-class CLI (`npx playwright test`)      |
| Version control    | Tosca workspace                | Git (standard branching, PRs, diffs)         |
| Parallel execution | Tosca Distributed Execution    | Native Playwright workers                    |
| AI/ML              | Tosca Vision AI (image-based)  | LLM-powered test generation + recipe library |
| Browser support    | Chrome, Firefox, Edge          | Chrome, Firefox, Safari, Edge                |
| Scripting language | Tosca TestStepValues / Modules | TypeScript (full programming language)       |
| Community          | Tricentis community            | Playwright 80k+ GitHub stars, npm ecosystem  |

:::note SAP GUI Testing
Tosca excels at SAP GUI testing via its SAP engine. If your test scope includes SAP GUI
transactions (not browser-based Fiori apps), keep Tosca for those tests and use Praman for
Fiori/UI5 web apps. Both can coexist in a CI pipeline.
:::

## Concept Mapping Table

The following table maps 25 core Tosca concepts to their Playwright/Praman equivalents.

| #   | Tosca Concept             | Playwright/Praman Equivalent                | Notes                                                           |
| --- | ------------------------- | ------------------------------------------- | --------------------------------------------------------------- |
| 1   | **Workspace**             | Git repository                              | Tests are TypeScript files in a Git repo                        |
| 2   | **TestCase**              | `test('name', async () => {...})`           | A single test function in a `.test.ts` file                     |
| 3   | **TestStep**              | `test.step('name', async () => {...})`      | Collapsible step in HTML report                                 |
| 4   | **TestStepValue**         | Variable / parameter                        | `const vendor = '100001';`                                      |
| 5   | **Module**                | Playwright fixture                          | `async ({ ui5, fe }) => {...}`                                  |
| 6   | **ModuleAttribute**       | Fixture property / method                   | `ui5.control()`, `fe.listReport.search()`                       |
| 7   | **TestCaseDesign (TCD)**  | Test data fixture                           | `testData.generate({ vendor: '{{uuid}}' })`                     |
| 8   | **TestConfiguration**     | `playwright.config.ts` + `praman.config.ts` | Two config files: runner + SAP-specific                         |
| 9   | **ExecutionList**         | Playwright project                          | `projects: [{ name: 'chromium', ... }]`                         |
| 10  | **TestDataContainer**     | `.env` file + `testData` fixture            | Environment vars + template generation                          |
| 11  | **ActionMode Verify**     | `expect()` assertion                        | `await expect(btn).toBeUI5Enabled()`                            |
| 12  | **ActionMode Input**      | `ui5.fill()` / `ui5.select()`               | `await ui5.fill({ id: 'vendorInput' }, '100001')`               |
| 13  | **ActionMode Buffer**     | Variable assignment                         | `const value = await control.getValue()`                        |
| 14  | **ActionMode WaitOn**     | `ui5.control()` auto-wait                   | Built-in `waitForUI5Stable()`                                   |
| 15  | **Steering Parameter**    | Config option / env var                     | `PRAMAN_LOG_LEVEL=debug npx playwright test`                    |
| 16  | **Recovery Scenario**     | `test.afterEach()` / fixture teardown       | Auto-cleanup in fixtures (locks, test data)                     |
| 17  | **Scan (UI5 Engine)**     | `UI5Selector` object                        | `{ controlType: 'sap.m.Button', properties: { text: 'Save' } }` |
| 18  | **XScan / TBox**          | `page.locator()` (CSS/XPath)                | For non-UI5 elements; `ui5.control()` for UI5                   |
| 19  | **Library**               | npm package / utility module                | Shared helpers via `import`                                     |
| 20  | **Requirements**          | Test annotations / tags                     | `test('PO @smoke', ...)` + `--grep @smoke`                      |
| 21  | **Execution log**         | Playwright HTML report                      | `npx playwright show-report`                                    |
| 22  | **Screenshots**           | Automatic screenshots                       | `screenshot: 'only-on-failure'` in config                       |
| 23  | **Distributed Execution** | `workers` config                            | `workers: 4` in `playwright.config.ts`                          |
| 24  | **Tosca Commander**       | VS Code / terminal                          | IDE + `npx playwright test`                                     |
| 25  | **DEX Agent**             | CI runner (GitHub Actions, Jenkins)         | `npx playwright test` in pipeline YAML                          |

## Tosca TestCase to Playwright Test

### Tosca TestCase (Conceptual)

```text
TestCase: Create Purchase Order
  TestStep: Login
    Module: SAP_Login
      Username = {TC_User}
      Password = {TC_Password}
  TestStep: Navigate to Create PO
    Module: FLP_Navigation
      Tile = "Create Purchase Order"
  TestStep: Fill Header Data
    Module: PO_Header
      Vendor = {TC_Vendor}
      PurchaseOrg = {TC_PurchOrg}
      CompanyCode = {TC_CompCode}
  TestStep: Add Item
    Module: PO_Item
      Material = {TC_Material}
      Quantity = {TC_Quantity}
      Plant = {TC_Plant}
  TestStep: Save
    Module: PO_Footer
      Action = Save
  TestStep: Verify Success
    Module: PO_Message
      MessageType = Success [Verify]
```

### Praman Equivalent

```typescript
import { test, expect } from 'playwright-praman';

// Test data replaces Tosca TestCaseDesign / TestDataContainer
const testInput = {
  vendor: '100001',
  purchaseOrg: '1000',
  companyCode: '1000',
  material: 'MAT-001',
  quantity: '10',
  plant: '1000',
};

test('create purchase order', async ({ ui5, ui5Navigation, fe, ui5Footer }) => {
  // TestStep: Navigate (login handled by setup project -- no code needed)
  await test.step('Navigate to Create PO', async () => {
    await ui5Navigation.navigateToTile('Create Purchase Order');
  });

  // TestStep: Fill Header Data
  await test.step('Fill header data', async () => {
    await ui5.fill({ id: 'vendorInput' }, testInput.vendor);
    await ui5.fill({ id: 'purchOrgInput' }, testInput.purchaseOrg);
    await ui5.fill({ id: 'compCodeInput' }, testInput.companyCode);
  });

  // TestStep: Add Item
  await test.step('Add line item', async () => {
    await ui5.fill({ id: 'materialInput' }, testInput.material);
    await ui5.fill({ id: 'quantityInput' }, testInput.quantity);
    await ui5.fill({ id: 'plantInput' }, testInput.plant);
  });

  // TestStep: Save (replaces Tosca PO_Footer module)
  await test.step('Save', async () => {
    await ui5Footer.clickSave();
  });

  // TestStep: Verify (replaces Tosca ActionMode Verify)
  await test.step('Verify success message', async () => {
    const message = await ui5.control({
      controlType: 'sap.m.MessageStrip',
      properties: { type: 'Success' },
      searchOpenDialogs: true,
    });
    await expect(message).toBeUI5Visible();
  });
});
```

## Intent API and SAP Transaction Codes

Praman's Intent API provides high-level business operations that map to SAP transaction codes
and Fiori apps.

| SAP TCode | Fiori App               | Praman Intent API                              |
| --------- | ----------------------- | ---------------------------------------------- |
| ME21N     | Create Purchase Order   | `intent.procurement.createPurchaseOrder()`     |
| ME23N     | Display Purchase Order  | `intent.procurement.displayPurchaseOrder()`    |
| VA01      | Create Sales Order      | `intent.sales.createSalesOrder()`              |
| VA03      | Display Sales Order     | `intent.sales.displaySalesOrder()`             |
| FB60      | Enter Vendor Invoice    | `intent.finance.postVendorInvoice()`           |
| FBL1N     | Vendor Line Items       | `intent.finance.displayVendorLineItems()`      |
| CO01      | Create Production Order | `intent.manufacturing.createProductionOrder()` |
| MM01      | Create Material Master  | `intent.masterData.createMaterial()`           |

### Using the Intent API

```typescript
import { test, expect } from 'playwright-praman';

test('create PO via intent API', async ({ intent }) => {
  await test.step('Create purchase order', async () => {
    await intent.procurement.createPurchaseOrder({
      vendor: '100001',
      material: 'MAT-001',
      quantity: 10,
      plant: '1000',
    });
  });

  await test.step('Post vendor invoice', async () => {
    await intent.finance.postVendorInvoice({
      vendor: '100001',
      amount: 5000,
      currency: 'EUR',
    });
  });
});
```

## Team Workflow Transition

### From Tosca Commander to Git + IDE

| Workflow          | Tosca                        | Praman                                              |
| ----------------- | ---------------------------- | --------------------------------------------------- |
| Create test       | Tosca Commander GUI          | Create `.test.ts` file in VS Code                   |
| Edit test         | Tosca Module editor          | Edit TypeScript in any IDE                          |
| Version control   | Tosca workspace versioning   | Git branches + pull requests                        |
| Code review       | Not built-in                 | GitHub/GitLab PR reviews                            |
| Merge conflicts   | Workspace conflicts (binary) | Text-based Git merge (readable diffs)               |
| Share test assets | Export/import workspace      | `npm install` shared packages                       |
| Collaborate       | Workspace locks              | Git branching (multiple people edit simultaneously) |

### Suggested Team Transition Plan

**Week 1-2: Foundation**

- Install Node.js, VS Code, and Playwright on developer machines
- Complete the [Playwright Primer](./playwright-primer) (2-3 hours per person)
- Set up a Git repository for the test project

**Week 3-4: First Tests**

- Convert 3-5 Tosca TestCases from a single Fiori app to Praman tests
- Set up authentication via setup projects
- Run tests locally and review the HTML report

**Week 5-6: CI Integration**

- Add `npx playwright test` to your CI/CD pipeline
- Configure `screenshot: 'only-on-failure'` and `trace: 'on-first-retry'`
- Set up environment variables for SAP credentials in CI secrets

**Week 7-8: Scale**

- Convert remaining Tosca TestCases in priority order
- Adopt Fiori Elements helpers (`fe.listReport`, `fe.objectPage`) for standard Fiori apps
- Enable parallel execution with 2-4 workers

### Role Mapping

| Tosca Role          | Praman Equivalent                                       |
| ------------------- | ------------------------------------------------------- |
| Test Designer       | Test Engineer (writes `.test.ts` files)                 |
| Test Data Manager   | Uses `testData` fixture + `.env` files                  |
| Automation Engineer | Same role, now using TypeScript + Playwright            |
| Test Manager        | Reviews PRs, reads Playwright HTML reports, monitors CI |
| Tosca Administrator | Not needed (config is in Git, CI handles execution)     |

## Handling Tosca-Specific Patterns

### Recovery Scenarios

Tosca Recovery Scenarios handle unexpected dialogs or errors. In Praman, use fixture teardown
and `test.afterEach()`.

```typescript
import { test } from 'playwright-praman';

// Automatic recovery: fixtures clean up on teardown
// - flpLocks: deletes stale SM12 locks
// - testData: removes generated test data
// - sapAuth: logs out

// Manual recovery for edge cases
test.afterEach(async ({ ui5 }) => {
  // Dismiss any open dialogs
  try {
    const okButton = await ui5.control({
      controlType: 'sap.m.Button',
      properties: { text: 'OK' },
      searchOpenDialogs: true,
    });
    await okButton.press();
  } catch {
    // No dialog open -- nothing to dismiss
  }
});
```

### Test Data Parameterization

Tosca TestCaseDesign provides data-driven testing. In Playwright, use arrays or CSV files.

```typescript
import { test } from 'playwright-praman';

// Data-driven test (replaces Tosca TCD)
const vendors = [
  { id: '100001', name: 'Vendor A', country: 'US' },
  { id: '100002', name: 'Vendor B', country: 'DE' },
  { id: '100003', name: 'Vendor C', country: 'JP' },
];

for (const vendor of vendors) {
  test(`create PO for ${vendor.name}`, async ({ ui5, ui5Navigation }) => {
    await ui5Navigation.navigateToApp('PurchaseOrder-create');
    await ui5.fill({ id: 'vendorInput' }, vendor.id);
    // ... rest of test
  });
}
```

### Reusable Modules

Tosca Modules are reusable test components. In Praman, extract shared logic into helper
functions or custom fixtures.

```typescript
// helpers/po-helpers.ts
import type { ExtendedUI5Handler } from 'playwright-praman';

export async function fillPOHeader(
  ui5: ExtendedUI5Handler,
  data: { vendor: string; purchaseOrg: string; companyCode: string },
): Promise<void> {
  await ui5.fill({ id: 'vendorInput' }, data.vendor);
  await ui5.fill({ id: 'purchOrgInput' }, data.purchaseOrg);
  await ui5.fill({ id: 'compCodeInput' }, data.companyCode);
}
```

```typescript
// tests/purchase-order.test.ts
import { test } from 'playwright-praman';
import { fillPOHeader } from '../helpers/po-helpers';

test('create PO', async ({ ui5, ui5Navigation }) => {
  await ui5Navigation.navigateToApp('PurchaseOrder-create');
  await fillPOHeader(ui5, { vendor: '100001', purchaseOrg: '1000', companyCode: '1000' });
  // ...
});
```

## Quick Reference Card

| I want to...        | Tosca                             | Praman                                                   |
| ------------------- | --------------------------------- | -------------------------------------------------------- |
| Find a UI5 control  | Scan / Module with UI5 engine     | `ui5.control({ controlType: '...', properties: {...} })` |
| Click a button      | ActionMode Input on Button module | `await ui5.click({ id: 'myBtn' })`                       |
| Fill a text field   | ActionMode Input on Input module  | `await ui5.fill({ id: 'myInput' }, 'value')`             |
| Verify a value      | ActionMode Verify                 | `await expect(control).toHaveUI5Text('value')`           |
| Buffer/read a value | ActionMode Buffer                 | `const val = await control.getValue()`                   |
| Wait for page ready | WaitOn / Recovery                 | Automatic `waitForUI5Stable()`                           |
| Navigate to app     | Browser module + URL              | `await ui5Navigation.navigateToApp('App-action')`        |
| Take screenshot     | Screenshot step                   | `await page.screenshot({ path: 'file.png' })`            |
| Run in CI           | Tosca CI adapter + DEX            | `npx playwright test` in any CI                          |
| Parameterize data   | TestCaseDesign (TCD)              | `for (const row of data) { test(...) }`                  |
| Handle errors       | Recovery Scenario                 | Fixture teardown + `test.afterEach()`                    |
