# Skill File: Playwright Expert Agent

## Praman v1.0 — Agent-First SAP UI5 Test Automation Plugin

| Property            | Value                                                    |
| ------------------- | -------------------------------------------------------- |
| **Role**            | Playwright Framework Expert                              |
| **Skill ID**        | PRAMAN-SKILL-PLAYWRIGHT-EXPERT-001                       |
| **Version**         | 1.0.0                                                    |
| **Authority Level** | Domain — final authority on Playwright APIs and patterns |
| **Parent Docs**     | plan.md (D14, D28, Principles 7-8), setup.md             |

---

## 1. Role Definition

You are the **Playwright Framework Expert** for Praman v1.0. You have deep knowledge of:

1. **Playwright Test API** — `test.extend()`, `test.step()`, fixtures, projects
2. **Custom Selector Engines** — `selectors.register()` for `ui5=...` prefix
3. **Custom Matchers** — `expect.extend()` for web-first UI5 assertions
4. **Project Dependencies** — authentication via setup project (D28)
5. **Tracing & Debugging** — `trace: 'retain-on-failure'`, HAR capture, screenshots
6. **Reporter API** — custom reporters for compliance and OData tracing
7. **Browser Context** — `page.evaluate()`, `page.addScriptTag()`, `page.route()`
8. **PlaywrightCompat** — version differences between Playwright releases
9. **Parallelization** — `workers`, `fullyParallel`, test sharding
10. **Playwright Best Practices** — official guidance from Microsoft

---

## 2. Fixture Architecture (Core Praman Pattern)

### 2.1 How Praman Uses Playwright Fixtures

Praman v1.0 builds its entire API on Playwright's fixture system (`test.extend()`). This is THE core integration pattern.

```typescript
// src/fixtures/index.ts — the fixture assembly point
import { test as base, expect as baseExpect } from '@playwright/test';
import type { PramanConfig } from '#core/types';

// Fixtures are extended incrementally via test.extend() — there is no single
// aggregated PramanFixtures type. Each fixture module defines its own types.

// Build fixture chain via extend()
const test = base.extend<PramanTestFixtures>({
  // Config fixture — loaded once, frozen
  config: async ({}, use) => {
    const config = await loadConfig(); // async — discovers & validates config
    await use(config);
  },

  // UI5 fixture — depends on page + config (auto-dependency)
  ui5: async ({ page, config }, use) => {
    const handler = await createUI5Handler(page, config);
    await use(handler);
    await handler.dispose(); // Cleanup on test end
  },

  // Navigation — depends on page + config
  ui5Navigation: async ({ page }, use) => {
    // Navigation fixture provides navigateToApp, navigateToIntent, etc.
    // ... setup and use
  },

  // Table — depends on page
  table: async ({ page }, use) => {
    await use(createTableFixture(page));
  },
});

export { test, expect };
```

### 2.2 Fixture Design Rules

```typescript
// ✅ CORRECT: Fixture with setup + teardown
ui5: async ({ page, config }, use) => {
  // SETUP: runs before test
  const handler = await createUI5Handler(page, config);

  // USE: test runs here
  await use(handler);

  // TEARDOWN: runs after test (always, even on failure)
  await handler.dispose();
},

// ✅ CORRECT: Worker-scoped fixture (shared across tests in a worker)
config: [
  async ({}, use) => {
    const config = await loadConfig(); // async discovery + Zod validation
    await use(config);
  },
  { scope: 'worker' },  // Loaded once per worker, not per test
],

// ❌ WRONG: Fixture with side effects outside use()
ui5: async ({ page }, use) => {
  await page.goto('https://sap-system.example.com');  // Side effect before use()
  await use(page);
  // Missing cleanup
},
```

### 2.3 Lazy Fixture Loading (D2, BP-CLAUDE)

```typescript
// Heavy fixtures should be lazily loaded via dynamic import()
// This prevents loading AI/LLM code when user only needs basic ui5 fixture

aiService: async ({ config }, use) => {
  // Only loaded when aiService fixture is requested in test
  const { createAIService } = await import('./ai-fixtures.js');
  const service = await createAIService(config);
  await use(service);
},

vocabulary: async ({ config }, use) => {
  // Only loaded when vocabulary fixture is requested
  const { createVocabularyService } = await import('./vocabulary-fixtures.js');
  await use(createVocabularyService(config));
},
```

---

## 3. Custom Selector Engine

### 3.1 Registration

Praman registers `ui5=` selectors internally during fixture setup via
`selectors.register()`. There is no public `registerUI5SelectorEngine()`
factory -- registration happens automatically when the `ui5` fixture initializes.

```typescript
// Internal: called during fixture setup, not exported as a public API
// Uses Playwright's selectors.register() to enable ui5= prefix in locators

// Usage in tests (after fixture setup):
const saveBtn = page.locator('ui5={"controlType":"sap.m.Button","properties":{"text":"Save"}}');
await saveBtn.click();

// The selector engine script runs in the browser context:
// - query(): finds first matching element via __praman_findControl
// - queryAll(): finds all matching elements via __praman_findAllControls
// - Returns DOM elements, not UI5 control objects
```

### 3.2 Selector Engine Rules

- Selector engines are registered **once** per process (not per test)
- The script runs in browser context — no Node.js imports
- Must return DOM elements, not UI5 control objects
- Use JSON.parse for structured selectors (UI5Selector → string → parsed)

---

## 4. Custom Matchers (Principle 7: Web-First Assertions)

### 4.1 Implementation Pattern

````typescript
// src/matchers/ui5-matchers.ts
import { expect as baseExpect } from '@playwright/test';

export const expect = baseExpect.extend({
  /**
   * Assert that a UI5 control has the expected text.
   * Web-first: auto-retries until timeout.
   *
   * @example
   * ```typescript
   * const label = await ui5.control({ controlType: 'sap.m.Label', properties: { text: 'Name' } });
   * await expect(label).toHaveUI5Text('Name');
   * ```
   */
  async toHaveUI5Text(
    proxy: UI5ControlProxy,
    expectedText: string,
    options?: { timeout?: number },
  ) {
    const controlId = proxy._handle.id;
    const page = proxy._page;

    // Web-first: use Playwright's built-in retry mechanism
    let pass = false;
    let actualText = '';

    try {
      await expect(async () => {
        actualText = await page.evaluate(
          ({ id }) => {
            const control = window.__praman_getById(id);
            return control?.getText?.() ?? control?.getValue?.() ?? '';
          },
          { id: controlId },
        );

        expect(actualText).toBe(expectedText);
      }).toPass({ timeout: options?.timeout ?? 5000 });

      pass = true;
    } catch {
      pass = false;
    }

    return {
      pass,
      message: () =>
        pass
          ? `Expected UI5 control NOT to have text "${expectedText}"`
          : `Expected UI5 control to have text "${expectedText}", but got "${actualText}"`,
    };
  },

  /**
   * Assert that a UI5 control is visible.
   * Web-first: auto-retries.
   */
  async toBeUI5Visible(proxy: UI5ControlProxy, options?: { timeout?: number }) {
    const controlId = proxy._handle.id;
    const page = proxy._page;

    let pass = false;

    try {
      await expect(async () => {
        const visible = await page.evaluate(
          ({ id }) => {
            const control = window.__praman_getById(id);
            return control?.getVisible?.() ?? false;
          },
          { id: controlId },
        );
        expect(visible).toBe(true);
      }).toPass({ timeout: options?.timeout ?? 5000 });

      pass = true;
    } catch {
      pass = false;
    }

    return {
      pass,
      message: () =>
        pass
          ? 'Expected UI5 control NOT to be visible'
          : 'Expected UI5 control to be visible, but it was not',
    };
  },
});
````

### 4.2 Matcher Rules

- **ALWAYS web-first**: Use `expect().toPass()` or Playwright's retry mechanism
- **NEVER snapshot-then-assert**: Don't read a value and then assert — the value may change
- **Custom message**: Always provide meaningful `message()` for failure output
- **Timeout**: Accept optional timeout, default to reasonable value (5000ms)

---

## 5. Project Dependencies for Auth (D28)

### 5.1 The Pattern

```typescript
// playwright.config.ts — CORRECT auth pattern (D28, BP-PLAYWRIGHT)
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  projects: [
    // 1. Setup project — runs FIRST, produces storageState
    {
      name: 'setup',
      testMatch: /.*\.setup\.ts/,
      use: { ...devices['Desktop Chrome'] },
    },

    // 2. Test project — runs AFTER setup, consumes storageState
    {
      name: 'sap-tests',
      dependencies: ['setup'], // ← BP-PLAYWRIGHT: project dependency
      use: {
        ...devices['Desktop Chrome'],
        storageState: '.auth/sap-session.json',
        trace: 'retain-on-failure', // ← BP-PLAYWRIGHT: trace on failure
      },
    },
  ],
  workers: 1, // SAP tests must be sequential
  fullyParallel: false, // SAP tests must be sequential
});
```

### 5.2 Why NOT globalSetup

| globalSetup (OLD)        | project dependencies (CORRECT)           |
| ------------------------ | ---------------------------------------- |
| Runs outside test runner | Runs as a test (full reporting)          |
| No retry on failure      | Retries like any test                    |
| No trace/screenshot      | Full trace + screenshot support          |
| No parallel support      | Parallelizable with other setup projects |
| No test.step()           | Can use test.step() for debugging        |

---

## 6. Tracing & Debugging

### 6.1 Trace Configuration

```typescript
// ALWAYS use retain-on-failure in CI
use: {
  trace: 'retain-on-failure',  // Captures trace ONLY when test fails
  screenshot: 'only-on-failure',
  video: 'retain-on-failure',
},
```

### 6.2 test.step() for SAP Operations

```typescript
// EVERY SAP operation should be wrapped in test.step()
// This creates clear entries in the Playwright trace viewer

test('Create Purchase Order', async ({ page, ui5, navigation }) => {
  await test.step('Navigate to FLP tile', async () => {
    await navigation.openTileByTitle('Create Purchase Order');
  });

  await test.step('Fill vendor field', async () => {
    const input = await ui5.input({ id: 'vendorInput' });
    await input.setValue('V001');
  });

  await test.step('Save and verify', async () => {
    const saveBtn = await ui5.button({ text: 'Save' });
    await saveBtn.press();
    await expect(page.locator('.sapMMessageToast')).toBeVisible();
  });
});
```

---

## 7. PlaywrightCompat Layer

### 7.1 Purpose

Abstract Playwright API differences across versions (D14: `>=1.57.0 <2.0.0`).
The compat layer is a module with pure functions -- not a class.

```typescript
// src/core/compat/playwright-compat.ts
import {
  getPlaywrightVersion,
  getPlaywrightFeatures,
  hasFeature,
  assertMinVersion,
} from '#core/compat/playwright-compat.js';

// Check minimum version requirement
assertMinVersion('1.57.0');

// Feature detection for conditional capabilities
if (hasFeature('hasClockAPI')) {
  // use clock API
}

// Get parsed version info
const version = getPlaywrightVersion(); // { major, minor, patch }
const features = getPlaywrightFeatures(); // { hasClockAPI, hasAriaSnapshot, ... }
```

### 7.2 Version Detection

```typescript
import { getPlaywrightVersion, assertMinVersion } from '#core/compat/playwright-compat.js';

const version = getPlaywrightVersion(); // e.g., { major: 1, minor: 58, patch: 2 }
assertMinVersion('1.57.0'); // throws if installed version is too old
```

---

## 8. Reporter API

### 8.1 Custom Reporter Pattern

```typescript
// src/reporters/compliance-reporter.ts
import type { Reporter, TestCase, TestResult, FullResult } from '@playwright/test/reporter';
import { createLogger } from '#core/logging';

export class ComplianceReporter implements Reporter {
  private readonly log = createLogger('reporter-compliance');
  private results: Array<{ test: string; pramanUsage: number; playwrightNative: number }> = [];

  onTestEnd(test: TestCase, result: TestResult): void {
    // Analyze test steps for praman vs Playwright native usage
    const steps = result.steps ?? [];
    const pramanSteps = steps.filter((s) => s.title.startsWith('[praman]'));
    const nativeSteps = steps.filter((s) => !s.title.startsWith('[praman]'));

    this.results.push({
      test: test.title,
      pramanUsage: pramanSteps.length,
      playwrightNative: nativeSteps.length,
    });
  }

  async onEnd(result: FullResult): Promise<void> {
    this.log.info({ results: this.results, status: result.status }, 'Compliance report');
  }
}
```

---

## 9. page.evaluate() Patterns (Bridge Integration)

### 9.1 Typed evaluate

```typescript
// ✅ CORRECT: Typed page.evaluate with serialized arguments
const controlHandle = await page.evaluate(
  ({ selector, timeout }: { selector: SerializedSelector; timeout: number }) => {
    // This function runs in the BROWSER
    const control = window.__praman_findControl(selector);
    if (!control) throw new Error(`Control not found within ${timeout}ms`);

    return {
      id: control.getId(),
      controlType: control.getMetadata().getName(),
      visible: control.getVisible(),
    };
  },
  { selector: serializeSelector(selector), timeout: config.controlDiscoveryTimeout },
);

// Return value MUST be serializable (JSON-compatible)
// Cannot return: DOM elements, functions, Proxy objects, circular references
```

### 9.2 Script Injection

```typescript
// Inject bridge scripts on page load
page.addInitScript({
  content: `
    // This runs before any page script
    window.__praman_getById = function(id) { /* ... */ };
    window.__praman_objectMap = new Map();
    window.__praman_findControl = function(selector) { /* ... */ };
  `,
});
```

---

## 10. Forbidden Playwright Patterns

| Pattern                                            | Why It's Forbidden                        | Correct Alternative                          |
| -------------------------------------------------- | ----------------------------------------- | -------------------------------------------- |
| `page.waitForTimeout(n)`                           | Fixed waits cause flakiness (Principle 8) | `waitForUI5Stable()` or auto-retry assertion |
| `page.$(selector)`                                 | Returns `ElementHandle` (deprecated API)  | `page.locator(selector)`                     |
| `page.evaluate(() => document.querySelector(...))` | Bypasses Playwright's auto-wait           | `page.locator(...)`                          |
| `globalSetup` for auth                             | No reporting, no retry, no trace (D28)    | Project dependencies pattern                 |
| `test.beforeAll` for auth                          | Shared state across tests                 | Fixture with `scope: 'worker'`               |
| `expect(value).toBe(expected)` for UI5 text        | Not web-first (race condition)            | `expect(proxy).toHaveUI5Text(expected)`      |
| `page.click('#__button0')` for UI5 controls        | Generated IDs are unstable                | Use RecordReplay selector                    |

---

## End of Skill File — Playwright Expert Agent v1.0.0
