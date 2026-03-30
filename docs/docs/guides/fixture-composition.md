---
title: Fixture Composition
---

Praman uses Playwright's `mergeTests()` to compose fixture modules into a single `test` object.
This page explains the composition pattern, how to customize it, and why it exists.

## How mergeTests() Works

Playwright's `mergeTests()` combines multiple `test.extend()` definitions into one `test` object.
Each fixture module defines its own fixtures independently, and `mergeTests()` produces a unified
test function that includes all of them.

```typescript
import { mergeTests } from '@playwright/test';
import { coreTest } from './core-fixtures.js';
import { authTest } from './auth-fixtures.js';
import { navTest } from './nav-fixtures.js';

export const test = mergeTests(coreTest, authTest, navTest);
```

When you import from `playwright-praman`, this merge has already been done for you:

```typescript
import { test, expect } from 'playwright-praman';

test('all fixtures available', async ({ ui5, sapAuth, ui5Navigation }) => {
  // Everything is available in a single destructure
});
```

## The Fixture Module Chain

Praman merges 13 fixture modules in a specific order:

```
moduleTest        → ui5.table, ui5.dialog, ui5.date, ui5.odata
authTest          → sapAuth
navTest           → ui5Navigation, btpWorkZone
stabilityTest     → ui5Stability, requestInterceptor (auto)
controlTreeTest   → controlTreeCapture (auto)
feTest            → fe (listReport, objectPage, table, list)
aiTest            → pramanAI
intentTest        → intent (procurement, sales, finance, manufacturing, masterData)
shellFooterTest   → ui5Shell, ui5Footer
flpLocksTest      → flpLocks
flpSettingsTest   → flpSettings
testDataTest      → testData
odataTraceTest    → odataTraceCapture (auto)
```

:::info[Auto-fixtures inside coreTest]
`selectorRegistration`, `matcherRegistration`, and `playwrightCompat` are
**auto-fixtures inside `coreTest`**, not separate fixture modules. They are
registered automatically when `coreTest` is loaded.
:::

The order matters: later modules can depend on fixtures defined by earlier modules. For example,
`navTest` depends on `ui5` from `coreTest`, and `authTest` depends on `pramanConfig`.

## Why mergeTests() Over a Monolithic File

A single giant `test.extend()` call with all fixtures creates several problems:

1. **Circular dependencies** — fixtures that reference each other in one block cause TypeScript
   compilation errors
2. **Bloated imports** — every test file imports every dependency, even if unused
3. **Testing isolation** — unit-testing fixture logic requires loading the entire fixture tree
4. **Readability** — a 500-line fixture definition is unmaintainable

With `mergeTests()`, each module is independently testable, tree-shakeable, and can be composed
in any combination.

## Tree-Shaking: Use Only What You Need

If your tests only need core UI5 operations and authentication, skip the full import:

```typescript
import { mergeTests } from '@playwright/test';
import { coreTest, authTest } from 'playwright-praman';

const test = mergeTests(coreTest, authTest);

test('lightweight test', async ({ ui5, sapAuth }) => {
  // Only core + auth fixtures are loaded
  // AI, intents, FE helpers are not initialized
});
```

This reduces worker initialization time and avoids loading optional dependencies (e.g., LLM SDKs)
that are not installed.

## Adding Custom Fixtures

Extend the merged test object with your own fixtures using `test.extend()`:

```typescript
import { test as base, expect } from 'playwright-praman';

interface MyFixtures {
  adminUser: { username: string; password: string };
  appUrl: string;
}

const test = base.extend<MyFixtures>({
  adminUser: async ({}, use) => {
    await use({
      username: process.env.ADMIN_USER ?? 'admin',
      password: process.env.ADMIN_PASS ?? 'secret',
    });
  },

  appUrl: async ({ pramanConfig }, use) => {
    const baseUrl = pramanConfig.auth?.baseUrl ?? 'http://localhost:8080';
    await use(`${baseUrl}/sap/bc/ui5_ui5/ui2/ushell/shells/abap/FioriLaunchpad.html`);
  },
});

export { test, expect };
```

## Composing Across Test Files

For large test suites, create domain-specific test objects:

```typescript
// fixtures/procurement-test.ts
import { test as base } from 'playwright-praman';

export const test = base.extend({
  poDefaults: async ({}, use) => {
    await use({ plant: '1000', purchOrg: '1000', companyCode: '1000' });
  },
});

// fixtures/finance-test.ts
import { test as base } from 'playwright-praman';

export const test = base.extend({
  fiscalYear: async ({}, use) => {
    await use(new Date().getFullYear().toString());
  },
});
```

```typescript
// tests/procurement/create-po.spec.ts
import { test } from '../../fixtures/procurement-test.js';

test('create PO with defaults', async ({ ui5, intent, poDefaults }) => {
  await intent.procurement.createPurchaseOrder({
    vendor: '100001',
    material: 'MAT-001',
    quantity: 10,
    plant: poDefaults.plant,
  });
});
```

## Fixture Scopes

Praman fixtures use two scopes:

- **Worker-scoped** — created once per Playwright worker process. Shared across all tests in
  that worker. Used for expensive initialization: `pramanConfig`, `rootLogger`, `tracer`.
- **Test-scoped** — created fresh for each test. Used for stateful objects: `ui5`, `sapAuth`,
  `flpLocks`, `testData`.

Worker-scoped fixtures cannot depend on test-scoped fixtures. Test-scoped fixtures can depend
on both.

## Auto-Fixtures

Seven fixtures are marked with `{ auto: 'on' }` or `{ auto: true }` and fire without being
requested in the test signature:

```typescript
// These run automatically for every test:
// - playwrightCompat (worker) — version compatibility checks
// - selectorRegistration (worker) — registers ui5= selector engine
// - matcherRegistration (worker) — registers 10 custom matchers
// - requestInterceptor (test) — blocks WalkMe/analytics scripts
// - ui5Stability (test) — auto-waits for UI5 stability after navigation
// - odataTraceCapture (test) — captures OData requests for tracing
// - controlTreeCapture (test) — captures control tree snapshots
```

You never destructure these — they just work.
