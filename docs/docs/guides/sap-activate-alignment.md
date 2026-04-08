---
title: SAP Activate Alignment
---

Maps Praman test patterns to SAP Activate methodology phases. This guide helps project teams
align their automated testing strategy with SAP's implementation framework.

## SAP Activate Overview

SAP Activate is SAP's methodology for implementing SAP S/4HANA and cloud solutions. It defines
six phases, each with testing activities where Praman provides automation support.

| Phase | Name     | Testing Focus                             |
| ----- | -------- | ----------------------------------------- |
| 1     | Discover | Proof of concept, feasibility tests       |
| 2     | Prepare  | Test strategy, environment setup          |
| 3     | Explore  | Fit-to-standard, configuration validation |
| 4     | Realize  | Unit, integration, string tests           |
| 5     | Deploy   | UAT, performance, regression              |
| 6     | Run      | Production monitoring, regression packs   |

## Phase 1: Discover

**Goal**: Validate that Praman works with your SAP landscape.

### Praman Activities

```typescript
// Proof of concept: verify basic connectivity and control discovery
import { test, expect } from 'playwright-praman';

test('SAP system connectivity check', async ({ ui5, ui5Navigation, page }) => {
  await test.step('access Fiori Launchpad', async () => {
    await ui5Navigation.navigateToIntent({ semanticObject: 'Shell', action: 'home' });
    await expect(page).toHaveURL(/fiorilaunchpad/);
  });

  await test.step('verify UI5 runtime is available', async () => {
    const isUI5 = await page.evaluate(
      () => typeof sap !== 'undefined' && typeof sap.ui !== 'undefined',
    );
    expect(isUI5).toBe(true);
  });

  await test.step('discover controls on launchpad', async () => {
    const tiles = await ui5.controls({
      controlType: 'sap.m.GenericTile',
    });
    expect(tiles.length).toBeGreaterThan(0);
  });
});
```

### Deliverables

- Connectivity test script (above)
- Browser compatibility matrix (see [Cross-Browser Testing](./cross-browser.md))
- Tool evaluation report comparing Praman to Tosca, wdi5, UIVeri5

## Phase 2: Prepare

**Goal**: Establish test infrastructure and strategy.

### Praman Activities

| Activity               | Praman Artifact                                                   |
| ---------------------- | ----------------------------------------------------------------- |
| Test strategy document | `docs/test-strategy.md`                                           |
| Environment setup      | `playwright.config.ts`, `praman.config.ts`                        |
| Auth configuration     | `tests/auth-setup.ts` (see [Authentication](./authentication.md)) |
| CI/CD pipeline         | `.github/workflows/e2e-tests.yml`                                 |
| Test data strategy     | OData mock setup (see [OData Mocking](./odata-mocking.md))        |

### Project Structure

```text
tests/
  auth-setup.ts              # Authentication setup project
  smoke/                     # Phase 3: Fit-to-standard
    fit-to-standard.spec.ts
  integration/               # Phase 4: String tests
    p2p-flow.spec.ts
    o2c-flow.spec.ts
  regression/                # Phase 5+: Regression pack
    purchase-order.spec.ts
    sales-order.spec.ts
  performance/               # Phase 5: Performance baselines
    page-load.spec.ts
playwright.config.ts
praman.config.ts
```

## Phase 3: Explore (Fit-to-Standard)

**Goal**: Validate SAP standard configuration against business requirements.

### Fit-to-Standard Tests

These tests verify that standard SAP processes work with your specific configuration
(company codes, org units, master data).

```typescript
import { test, expect } from 'playwright-praman';

test.describe('Fit-to-Standard: Procurement', () => {
  test('standard PO creation workflow matches requirements', async ({ ui5, ui5Navigation, fe }) => {
    await test.step('verify PO creation app is accessible', async () => {
      await ui5Navigation.navigateToIntent({ semanticObject: 'PurchaseOrder', action: 'create' });
    });

    await test.step('verify required fields match spec', async () => {
      // Check that configured mandatory fields are enforced
      const supplierField = await ui5.control({
        controlType: 'sap.ui.comp.smartfield.SmartField',
        bindingPath: { path: '/Supplier' },
      });
      const isRequired = await supplierField.getProperty('mandatory');
      expect(isRequired).toBe(true);
    });

    await test.step('verify org structure defaults', async () => {
      // Company code should default from user parameters
      const companyCode = await ui5.control({
        controlType: 'sap.ui.comp.smartfield.SmartField',
        bindingPath: { path: '/CompanyCode' },
      });
      const value = await companyCode.getProperty('value');
      expect(value).toBe('1000'); // Expected default from user profile
    });

    await test.step('verify approval workflow triggers', async () => {
      // Create PO above threshold to trigger approval
      await ui5.fill({ id: /Supplier/ }, '100001');
      await ui5.fill({ id: /NetPrice/ }, '50000');
      await fe.objectPage.clickSave();
      const messageStrip = await ui5.control({
        controlType: 'sap.m.MessageStrip',
        properties: { type: 'Success' },
      });
      await expect(messageStrip).toHaveUI5Text(/created/);
      // Verify status indicates approval required
    });
  });
});
```

### Configuration Validation Matrix

```typescript
const orgUnits = [
  { companyCode: '1000', purchOrg: '1000', plant: '1000', name: 'US Operations' },
  { companyCode: '2000', purchOrg: '2000', plant: '2000', name: 'EU Operations' },
  { companyCode: '3000', purchOrg: '3000', plant: '3000', name: 'APAC Operations' },
];

for (const org of orgUnits) {
  test(`fit-to-standard: PO creation for ${org.name}`, async ({ ui5, ui5Navigation, fe }) => {
    await ui5Navigation.navigateToIntent({ semanticObject: 'PurchaseOrder', action: 'create' });
    await ui5.fill({ id: /CompanyCode/ }, org.companyCode);
    await ui5.fill({ id: /PurchasingOrganization/ }, org.purchOrg);
    await ui5.fill({ id: /Plant/ }, org.plant);
    await ui5.fill({ id: /Supplier/ }, '100001');
    await fe.objectPage.clickSave();
    const messageStrip = await ui5.control({
      controlType: 'sap.m.MessageStrip',
      properties: { type: 'Success' },
    });
    await expect(messageStrip).toHaveUI5Text(/created/);
  });
}
```

## Phase 4: Realize (Integration and String Tests)

**Goal**: Validate end-to-end business processes and integrations.

### String Tests

String tests connect multiple processes in sequence, validating the data flow between them.

```typescript
test.describe('String Test: Procure-to-Pay', () => {
  test('P2P: Purchase Requisition to Payment', async ({ ui5Navigation, fe }) => {
    await test.step('1. Create Purchase Requisition', async () => {
      await ui5Navigation.navigateToIntent({
        semanticObject: 'PurchaseRequisition',
        action: 'create',
      });
      // Fill and save PR
    });

    await test.step('2. Convert PR to Purchase Order', async () => {
      await ui5Navigation.navigateToIntent({ semanticObject: 'PurchaseOrder', action: 'create' });
      // Reference the PR
    });

    await test.step('3. Post Goods Receipt', async () => {
      await ui5Navigation.navigateToIntent({ semanticObject: 'GoodsReceipt', action: 'create' });
      // Post GR against PO
    });

    await test.step('4. Enter Invoice', async () => {
      await ui5Navigation.navigateToIntent({ semanticObject: 'SupplierInvoice', action: 'create' });
      // Enter and post invoice
    });

    await test.step('5. Verify Document Flow', async () => {
      // Navigate back to PO and check all documents are linked
    });
  });
});
```

See [Business Process Examples](./business-process-examples.md) for complete runnable examples.

### Test Execution Mapping

| SAP Activate Activity | Praman Test Type                 | Config                   |
| --------------------- | -------------------------------- | ------------------------ |
| Unit Test (UT)        | Component test with mocked OData | `workers: 4`             |
| Integration Test (IT) | Cross-app flow with real backend | `workers: 1`             |
| String Test (ST)      | Multi-step P2P, O2C flows        | `workers: 1, retries: 1` |
| Security Test         | Auth strategy validation         | Setup project            |

## Phase 5: Deploy (UAT and Regression)

**Goal**: User acceptance, performance baselines, regression packs.

### Regression Pack Structure

```typescript
// playwright.config.ts — regression project
{
  name: 'regression',
  testDir: './tests/regression',
  dependencies: ['setup'],
  use: {
    storageState: '.auth/sap-session.json',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  retries: 2,
}
```

### Performance Baselines

```typescript
test('page load performance baseline', async ({ ui5Navigation, page }) => {
  const startTime = Date.now();

  await ui5Navigation.navigateToIntent({ semanticObject: 'PurchaseOrder', action: 'manage' });

  const loadTime = Date.now() - startTime;

  // Attach timing to report
  await test.info().attach('performance', {
    body: JSON.stringify({ loadTime, threshold: 5000 }),
    contentType: 'application/json',
  });

  expect(loadTime).toBeLessThan(5000); // 5-second threshold
});
```

## Phase 6: Run (Production Monitoring)

**Goal**: Continuous regression testing against production-like environments.

### Smoke Test Suite

Run a minimal set of critical path tests on a schedule:

```yaml
# .github/workflows/smoke-tests.yml
name: SAP Smoke Tests
on:
  schedule:
    - cron: '0 6 * * *' # Daily at 6 AM
  workflow_dispatch:

jobs:
  smoke:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 22
      - run: npm ci
      - run: npx playwright install chromium
      - run: npx playwright test tests/smoke/ --project=regression
        env:
          SAP_BASE_URL: ${{ secrets.SAP_QA_URL }}
          SAP_USERNAME: ${{ secrets.SAP_QA_USER }}
          SAP_PASSWORD: ${{ secrets.SAP_QA_PASS }}
```

## Phase-to-Praman Mapping Summary

| Phase    | Praman Feature                           | Key Config                      |
| -------- | ---------------------------------------- | ------------------------------- |
| Discover | UI5 runtime detection, control discovery | Basic `playwright.config.ts`    |
| Prepare  | Auth setup, config, project structure    | `praman.config.ts`, CI pipeline |
| Explore  | Fit-to-standard tests, org validation    | Data-driven test loops          |
| Realize  | String tests, integration flows          | `workers: 1`, `test.step()`     |
| Deploy   | Regression packs, performance baselines  | `retries: 2`, trace on retry    |
| Run      | Scheduled smoke tests, monitoring        | Cron-triggered CI, alerts       |
