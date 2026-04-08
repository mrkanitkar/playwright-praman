---
title: Fixture Reference
description: 'Reference for all 21 Praman Playwright fixtures: ui5, sapAuth, ui5Navigation, ui5Table, fe, odata, pramanAI, and more. Destructure and test.'
keywords:
  - playwright fixtures sap testing
  - praman fixtures
  - playwright sap plugin
  - sap ui5 test automation
---

Praman provides 13 fixture modules merged into a single `test` object via Playwright's `mergeTests()`.

## Import

```typescript
import { test, expect } from 'playwright-praman';
```

## Fixture Summary

| Fixture         | Scope  | Type            | Description                                                                                |
| --------------- | ------ | --------------- | ------------------------------------------------------------------------------------------ |
| `ui5`           | test   | Core            | Control discovery, interaction, `.table`, `.dialog`, `.date`, `.odata` sub-namespaces      |
| `ui5Navigation` | test   | Navigation      | 11 FLP navigation methods                                                                  |
| `btpWorkZone`   | test   | Navigation      | Dual-frame BTP WorkZone manager                                                            |
| `sapAuth`       | test   | Authentication  | SAP authentication (6 strategies)                                                          |
| `fe`            | test   | Fiori Elements  | `.listReport`, `.objectPage`, `.table`, `.list` helpers                                    |
| `pramanAI`      | test   | AI              | Page discovery, agentic handler, LLM, vocabulary                                           |
| `intent`        | test   | Business        | `.procurement`, `.sales`, `.finance`, `.manufacturing`, `.masterData`                      |
| `ui5Shell`      | test   | FLP             | Shell header (home, user menu)                                                             |
| `ui5Footer`     | test   | FLP             | Page footer bar (Save, Edit, Delete, etc.)                                                 |
| `flpLocks`      | test   | FLP             | SM12 lock management with auto-cleanup                                                     |
| `flpSettings`   | test   | FLP             | User settings reader (language, date format)                                               |
| `testData`      | test   | Data            | Template-based data generation with auto-cleanup                                           |
| `pramanConfig`  | worker | Infrastructure  | Frozen config (loaded once per worker)                                                     |
| `pramanLogger`  | test   | Infrastructure  | Test-scoped pino logger                                                                    |
| `rootLogger`    | worker | Infrastructure  | Worker-scoped root logger                                                                  |
| `tracer`        | worker | Infrastructure  | OpenTelemetry tracer (NoOp when disabled)                                                  |
| `browserBind`   | test   | CLI Integration | `PRAMAN_BIND=1` exposes browser to CLI agents via `browser.bind()` (Playwright 1.59+)      |
| `screencast`    | test   | CLI Integration | Chapter markers, action overlays, frame streaming via `page.screencast` (Playwright 1.59+) |

## Auto-Fixtures

These fixtures fire automatically without being requested in the test signature:

| Auto-Fixture           | Scope  | Purpose                                       |
| ---------------------- | ------ | --------------------------------------------- |
| `playwrightCompat`     | worker | Playwright version compatibility checks       |
| `selectorRegistration` | worker | Registers `ui5=` custom selector engine       |
| `matcherRegistration`  | worker | Registers 10 custom UI5 matchers              |
| `requestInterceptor`   | test   | Blocks WalkMe, analytics, overlay scripts     |
| `ui5Stability`         | test   | Auto-waits for UI5 stability after navigation |

## Core Fixture: `ui5`

The main fixture for control discovery and interaction.

### Control Discovery

```typescript
test('discover controls', async ({ ui5 }) => {
  // Single control
  const btn = await ui5.control({ id: 'saveBtn' });

  // Multiple controls
  const buttons = await ui5.controls({ controlType: 'sap.m.Button' });

  // Interaction shortcuts
  await ui5.click({ id: 'submitBtn' });
  await ui5.fill({ id: 'nameInput' }, 'John Doe');
  await ui5.select({ id: 'countrySelect' }, 'US');
  await ui5.check({ id: 'agreeCheckbox' });
  await ui5.clear({ id: 'searchField' });
});
```

### Sub-Namespaces

```typescript
test('sub-namespaces', async ({ ui5 }) => {
  // Table operations
  const rows = await ui5.table.getRows('poTable');
  const count = await ui5.table.getRowCount('poTable');

  // Dialog management
  await ui5.dialog.waitFor();
  await ui5.dialog.confirm();

  // Date/time operations
  await ui5.date.setDatePicker('startDate', new Date('2026-01-15'));

  // OData model access
  const data = await ui5.odata.getModelData('/PurchaseOrders');
});
```

## Navigation Fixture: `ui5Navigation`

```typescript
test('navigation', async ({ ui5Navigation }) => {
  await ui5Navigation.navigateToApp('PurchaseOrder-manage');
  await ui5Navigation.navigateToTile('Create Purchase Order');
  await ui5Navigation.navigateToIntent(
    { semanticObject: 'PurchaseOrder', action: 'create' },
    { plant: '1000' },
  );
  await ui5Navigation.navigateToHome();
  await ui5Navigation.navigateBack();

  const hash = await ui5Navigation.getCurrentHash();
});
```

## Auth Fixture: `sapAuth`

```typescript
test('auth control', async ({ sapAuth, page }) => {
  await sapAuth.login(page, { url, username, password, strategy: 'basic' });
  expect(await sapAuth.isAuthenticated(page)).toBe(true);
  // Auto-logout on teardown
});
```

## Fiori Elements Fixture: `fe`

```typescript
test('FE patterns', async ({ fe }) => {
  await fe.listReport.setFilter('Status', 'Active');
  await fe.listReport.search();
  await fe.listReport.navigateToItem(0);

  const title = await fe.objectPage.getHeaderTitle();
  await fe.objectPage.clickEdit();
  await fe.objectPage.clickSave();
});
```

## AI Fixture: `pramanAI`

```typescript
test('AI discovery', async ({ pramanAI }) => {
  const context = await pramanAI.discoverPage({ interactiveOnly: true });
  const result = await pramanAI.agentic.generateTest(
    'Create a purchase order for vendor 100001',
    page,
  );
});
```

## Intent Fixture: `intent`

```typescript
test('business intents', async ({ intent }) => {
  await intent.procurement.createPurchaseOrder({
    vendor: '100001',
    material: 'MAT-001',
    quantity: 10,
    plant: '1000',
  });

  await intent.finance.postVendorInvoice({
    vendor: '100001',
    amount: 5000,
    currency: 'EUR',
  });
});
```

## Shell & Footer Fixtures

```typescript
test('shell and footer', async ({ ui5Shell, ui5Footer }) => {
  await ui5Shell.expectShellHeader();
  await ui5Footer.clickEdit();
  // ... edit form fields ...
  await ui5Footer.clickSave();
  await ui5Shell.clickHome();
});
```

## CLI Integration Fixtures

### Browser Bind: `browserBind`

Opt-in via `PRAMAN_BIND=1`. Exposes the test browser to Playwright CLI agents.

```typescript
// PRAMAN_BIND=1 npx playwright test
test('agent-assisted test', async ({ browserBind }) => {
  if (browserBind.bound) {
    console.info('Agent can connect at:', browserBind.endpointUrl);
    // CLI agent inspects live UI while test pauses...
  }
});
```

See [Browser Bind & Screencast](./browser-bind.md) for full details.

### Screencast: `screencast`

Chapter annotations and frame streaming for Playwright 1.59+ screencasts.

```typescript
test('recorded test', async ({ screencast, ui5 }) => {
  await screencast.showChapter('Setup');
  await ui5.click({ id: 'editBtn' });

  await screencast.showChapter('Fill Form');
  await ui5.fill({ id: 'nameInput' }, 'ACME Corp');

  await screencast.showActions({ enabled: true });
});
```

See [Browser Bind & Screencast](./browser-bind.md) for full details.

## Lock Management: `flpLocks`

```typescript
test('lock management', async ({ flpLocks }) => {
  const count = await flpLocks.getNumberOfLockEntries('TESTUSER');
  // Auto-cleanup on teardown
  await flpLocks.deleteAllLockEntries('TESTUSER');
});
```

## Test Data: `testData`

```typescript
test('test data', async ({ testData }) => {
  const po = testData.generate({
    documentNumber: '{{uuid}}',
    createdAt: '{{timestamp}}',
    vendor: '100001',
  });
  await testData.save('po-input.json', po);
  // Auto-cleanup on teardown
});
```

## Standalone Usage

Individual fixture modules can be imported for lighter setups:

```typescript
import { coreTest } from 'playwright-praman';
import { authTest } from 'playwright-praman';
import { mergeTests } from '@playwright/test';

// Compose only what you need
const test = mergeTests(coreTest, authTest);
```
