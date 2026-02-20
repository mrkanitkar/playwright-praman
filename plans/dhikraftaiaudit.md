# Dhikraft AI Readiness Audit

**Classification:** Internal Technical Review
**Status:** Draft
**Version Audited:** dhikraft v2.5.0
**Repository:** `/Users/maheshwar/Documents/projects/package`
**Audit Date:** 2026-02-20
**Auditor:** Independent Technical Review (AI Agent Self-Audit)
**Standard:** Microsoft Technical Documentation Standard, Playwright Best Practices, Node.js LTS Guidance

---

## Executive Summary

Dhikraft is a Playwright plugin that extends Playwright's native DOM capabilities with SAP UI5 awareness. It is positioned as the default SAP testing layer on top of Playwright — not a replacement, but an additive layer that handles UI5 control lookup, bridge injection, OData CRUD, and SAP authentication. The plugin ships 141 TypeScript source files, 32 fixtures, 5 domain-specific Intent APIs, and an AI-first capability discovery system.

**Overall AI-Readiness Score: 6.5 / 10**

The codebase demonstrates high ambition and solid architectural thinking. The fixture-first API, capability discovery, recipe registry, and business vocabulary are genuine differentiators. However, the plugin is undermined by widespread use of `page.waitForTimeout()` (30+ instances), a documented fixture (`selectorDiscovery`) that does not exist in the fixture registry, backup files committed to source, a license inconsistency, and an Intent API that is Beta-quality behind a production version number. These are not cosmetic issues — they directly block AI agent reliability and developer trust.

---

## Features Understood from Source Code

The following features were identified by reading source code directly (docs were considered secondary):

| Feature                               | Source File(s)                                       | Status            | AI Use Case                   |
| ------------------------------------- | ---------------------------------------------------- | ----------------- | ----------------------------- |
| UI5 control click/fill/select         | `src/handlers/ui5-handler.ts`                        | Stable            | Primary SAP UI interaction    |
| UI5 control proxy (full API)          | `src/lib/ui5-control-proxy.ts`                       | Stable            | Advanced control access       |
| UI5 bridge injection                  | `src/lib/ui5-bridge/injection.ts`                    | Stable            | Prerequisite for all UI5 ops  |
| SAP authentication (on-prem + cloud)  | `src/handlers/sap-auth-handler.ts`                   | Stable            | Session setup                 |
| Global setup storageState             | `src/global-setup.ts`                                | Stable            | Session reuse across tests    |
| OData V2/V4 CRUD                      | `src/handlers/odata-handler.ts`                      | Stable            | Backend data verification     |
| FLP tile navigation                   | `src/ui5-modules/navigation.ts`                      | Stable            | App entry point               |
| UI5 assertions                        | `src/ui5-modules/assertion.ts`                       | Stable            | Verification                  |
| UI5 table operations                  | `src/ui5-modules/table.ts`                           | Stable            | Data grid testing             |
| Control discovery (WDI5-style)        | `src/capabilities/control-discovery.ts`              | Stable            | AI: selector discovery        |
| Bulk page discovery                   | `src/lib/bulk-discovery.ts`                          | Stable            | AI: page-wide enumeration     |
| Capability registry                   | `src/capabilities/capability-registry.generated.ts`  | Stable (auto-gen) | AI: know what to call         |
| Recipe registry                       | `src/recipes/recipe-registry.generated.ts`           | Stable (auto-gen) | AI: example retrieval         |
| Business vocabulary                   | `src/vocabulary/services/vocabulary-service.ts`      | Stable            | AI: term-to-selector          |
| Intent API — Procurement (MM)         | `src/intent-api/domains/procurement-intent-api.ts`   | Beta              | Business workflow automation  |
| Intent API — Sales (SD)               | `src/intent-api/domains/sales-intent-api.ts`         | Beta              | Business workflow automation  |
| Intent API — Finance (FI)             | `src/intent-api/domains/finance-intent-api.ts`       | Beta              | Business workflow automation  |
| Intent API — Manufacturing (PP)       | `src/intent-api/domains/manufacturing-intent-api.ts` | Beta              | Business workflow automation  |
| Intent API — Master Data              | `src/intent-api/domains/master-data-intent-api.ts`   | Beta              | Business workflow automation  |
| FLP user lock management (SM12)       | `src/handlers/flp-user-locks-handler.ts`             | Stable            | Pre-condition test management |
| FLP user settings                     | `src/handlers/flp-user-settings-handler.ts`          | Stable            | User profile setup            |
| UI5 date picker handler               | `src/handlers/ui5-date-handler.ts`                   | Stable            | Date field interaction        |
| Interaction strategies (3 modes)      | `src/lib/interaction-strategies/`                    | Stable            | Strategy selection            |
| BTP Workzone support                  | `src/lib/btp-workzone-manager.ts`                    | Stable            | BTP-hosted apps               |
| Fiori Elements support                | `src/lib/fiori-elements-test-library.ts`             | Stable            | FE Fiori testing              |
| Multi-browser coordination            | `src/lib/multi-browser-manager.ts`                   | Experimental      | Multi-session tests           |
| Iframe management                     | `src/lib/iframe-manager.ts`                          | Stable            | Embedded apps                 |
| Custom Playwright matchers            | `src/lib/custom-matchers.ts`                         | Stable            | Assertion extension           |
| AI service integration (Azure/OpenAI) | `src/ai/ai-service-integration.ts`                   | Beta              | AI-assisted test generation   |
| Test data lifecycle management        | `src/handlers/testdata-handler.ts`                   | Stable            | Test isolation                |
| CLI tooling (init, doctor, scaffold)  | `src/cli/`                                           | Stable            | Developer experience          |
| Performance monitoring                | `src/lib/performance.ts`                             | Experimental      | Performance regression        |

---

## Step 1 — Entry Point Discovery

### Public API Surface Map

The primary export is `dhikraft` (the root package). All test functionality is delivered via Playwright fixtures destructured from the `test` function:

```typescript
// Correct usage pattern
import { test, expect } from 'dhikraft';

test('name', async ({ ui5, sapAuth, odata, ui5Navigation }) => { ... });
```

**Sub-path exports defined in `package.json`:**

| Export Path                | Purpose                                   | ESM                  | CJS                    |
| -------------------------- | ----------------------------------------- | -------------------- | ---------------------- |
| `dhikraft`                 | Fixtures, types, capabilities, recipes    | `dist/index.js`      | `dist-cjs/index.js`    |
| `dhikraft/config`          | `getDhikraftConfig()`, auto-setup helpers | `dist/config.js`     | `dist-cjs/config.js`   |
| `dhikraft/handlers`        | Handler classes for direct instantiation  | `dist/handlers.js`   | `dist-cjs/handlers.js` |
| `dhikraft/global-setup`    | Playwright `globalSetup` function         | `global-setup.js`    | N/A                    |
| `dhikraft/global-teardown` | Playwright `globalTeardown` function      | `global-teardown.js` | N/A                    |
| `dhikraft/package.json`    | Package metadata access                   | `package.json`       | N/A                    |

**All publicly exported symbols from `src/index.ts`:**

- `test`, `expect` — Extended Playwright test with all dhikraft fixtures
- `capabilities` — Capability discovery API (`list()`, `listFixtures()`, `has()`, `find()`, `forAI()`, `toJSON()`)
- `recipes` — Recipe registry (`select()`, `search()`, `listGoldCompliant()`, `forAI()`)
- `RECIPE_REGISTRY`, `RECIPE_CATEGORIES`, `RECIPE_ROLES`, `RECIPE_PRIORITIES` — Recipe constants
- Types: `DhikraftFixtures`, `DhikraftConfig`, `UI5Control`, `UI5Selector`, `UI5ControlMetadata`, `UI5ShellFixture`, `UI5InteractFixture`, and 20+ composite fixture types
- `MethodInfo`, `CapabilityStats`, `ParameterInfo`, `Recipe`, `RecipeCategory`, etc.

### Missing or Accidentally Hidden Features

**FINDING F-01 [CRITICAL]: `selectorDiscovery` fixture documented but not registered**

`docs/AI_API.md` line 70–88 shows the following as a registered fixture:

```typescript
test('discover selectors', async ({ ui5, selectorDiscovery }) => {
  const result = await selectorDiscovery.discover(page, { domElementSelector: '#__button0' });
  const isUI5 = await selectorDiscovery.isUI5Control(page, '#someElement');
});
```

Source code evidence: The file `src/lib/selector-discovery.ts` exists and exports a `getSelectorForElement` function. However, searching the fixture registration file `src/fixtures/dhikraft-fixtures.ts` reveals **no `selectorDiscovery` fixture is registered**. The 32 fixture list in `src/index.ts` and README do not include `selectorDiscovery`.

An AI agent reading `docs/AI_API.md` will attempt to use `selectorDiscovery` and receive a TypeScript error at compile time and a runtime `undefined` access at test time.

**Impact for AI agent:** Fatal. The core AI disambiguation pattern (UI5 vs non-UI5) documented as the primary decision tool does not exist as a fixture.

**FINDING F-02 [MAJOR]: Backup and version files committed to source**

The following non-TypeScript files exist in `src/`:

- `src/index.ts.v1.1.0` — Previous version backup
- `src/index.ts.v1.1.0.backup` — Duplicate backup
- `src/intent-api/domains/finance-intent-api.ts.bak` — Pre-refactor backup

These files are included in the `files` array of `package.json` under `src/` and will be published to npm. An AI agent consuming the npm package will encounter these files and attempt to understand them as valid source artifacts.

**FINDING F-03 [MINOR]: `ui5Navigation` vs `navigation` alias creates dual-entry confusion**

`src/index.ts` documents both `ui5Navigation` and `navigation` (alias). The AI_API.md shows `ui5Navigation.navigateToApplication()` while the `navigation` module's function signature in source is `navigateToTile(page, title)` — the fixture wraps these differently. Without reading the fixture file, an AI agent cannot reliably determine the canonical fixture name.

---

## Step 2 — Capability Discovery (AI-Focused)

### Capability Inventory

The plugin provides explicit machine-readable capability discovery:

```typescript
import { capabilities, recipes } from 'dhikraft';

// For AI agents: get all capabilities in AI-friendly format
const caps = capabilities.forAI({ provider: 'claude' });

// Get examples
const authExamples = recipes.select({ category: 'authentication', role: 'ai-agent' });
```

**Genuinely AI-first design decisions:**

1. **Auto-generated capability registry** — `src/capabilities/capability-registry.generated.ts` is regenerated by `npm run generate:capabilities`. Provides flat `MethodInfo[]` with name, source, category, params, returns, description, and priority (`fixture` > `namespace` > `implementation`).

2. **Recipe registry** — `src/recipes/recipe-registry.generated.ts` provides queryable code examples with semantic search.

3. **Business vocabulary service** — Maps SAP business terms (e.g., "purchase order", "vendor") to UI5 selectors.

4. **`llms.txt`** — Referenced in README as a hosted AI quick-reference document.

5. **`@aiHint` TSDoc tags** — Present on major handler classes to guide AI code generation.

### Gaps in Discoverability for AI Agents

**FINDING D-01 [MAJOR]: No machine-readable "when to use" decision tree**

The README contains 7 mandatory rules in prose form. There is no structured JSON or TypeScript export that lets an AI agent programmatically query: "Given this DOM element, should I use dhikraft or native Playwright?"

The `selectorDiscovery` fixture was the intended solution (Finding F-01), but it does not exist as a fixture.

**FINDING D-02 [MAJOR]: `capabilities.has()` signature mismatch**

`docs/AI_API.md` shows:

```typescript
const hasTable = capabilities.has('table', 'getTableRows'); // two arguments
```

`src/capabilities/index.ts` line 175 defines:

```typescript
export function has(methodName: string): boolean { // one argument only
```

An AI agent following the documented API will get silent wrong behavior — `capabilities.has('table', 'getTableRows')` returns `false` because it searches for a method named `'table'`, not methods in category `'table'`.

**FINDING D-03 [MODERATE]: Capability registry may be stale**

The `capability-registry.generated.ts` is auto-generated by `npm run generate:capabilities`. It is not re-run automatically before `npm run build`. If a developer adds a new fixture but forgets to run `generate:capabilities`, the AI agent's capability discovery will be incomplete. The `prebuild` script does include `generate:capabilities`, but `build:dev` has it; `build` alone (without `prebuild`) does not appear to invoke it in all paths.

**FINDING D-04 [MINOR]: No explicit "SAP-native vs UI5" element taxonomy**

A capability manifest should explicitly categorize:

- Controls that are UI5-only (require dhikraft)
- Controls that are hybrid (SAP HTML with optional UI5)
- Controls that are plain DOM (use Playwright native)

This taxonomy exists in documentation prose but not as a structured, AI-queryable artifact.

---

## Step 3 — Intent-Level API Check

### APIs That Are AI-Friendly (Intent-Level)

| API                                                                | Fixture          | Example                        | Assessment      |
| ------------------------------------------------------------------ | ---------------- | ------------------------------ | --------------- |
| `sapAuth.loginFromEnv()`                                           | `sapAuth`        | Reads env vars, performs login | ✅ Intent-level |
| `odata.read('/MaterialSet')`                                       | `odata`          | Reads entity set by path       | ✅ Intent-level |
| `procurementAPI.createPurchaseOrder({vendor, material, quantity})` | `procurementAPI` | Business operation             | ✅ High intent  |
| `ui5Navigation.navigateToApplication('PurchaseOrder-manage')`      | `ui5Navigation`  | Semantic navigation            | ✅ Intent-level |
| `bulkDiscovery.discoverAll({ interactiveOnly: true })`             | `bulkDiscovery`  | Page inventory                 | ✅ Intent-level |
| `vocabulary.findSelector('purchase order number')`                 | `vocabulary`     | Term-to-selector               | ✅ Intent-level |

### APIs That Are Implementation-Level (Should Be Wrapped)

**FINDING I-01 [MAJOR]: `ui5.control()` exposes implementation detail as primary API**

The "Gold Standard Pattern" in README and AI_API.md is:

```typescript
const button = await ui5.control({ controlType: 'sap.m.Button', properties: { text: 'Save' } });
await button.press();
```

`ui5.control()` returns a `UI5Control` proxy that exposes 220+ raw UI5 API methods (`firePress()`, `setProperty()`, `getAggregation()`, etc.). For an AI agent, "press a button" should not require knowing that `press()` internally calls `firePress()`. The proxy approach is technically elegant, but the _primary_ documented pattern is implementation-level.

**Recommendation:** Promote `ui5.click()`, `ui5.fill()`, `ui5.select()` as the primary API. `ui5.control()` should be documented as the _escape hatch_ for advanced operations, not the gold standard.

**FINDING I-02 [MAJOR]: `ui5-modules/control.ts` requires CSS selectors instead of `UI5Selector`**

`src/ui5-modules/control.ts` functions signature:

```typescript
async function getControlProperty(
  page: Page,
  cssSelector: string,
  propertyName: string,
): Promise<unknown>;
```

This function takes a raw CSS selector (`'#submitBtn'`) to look up a UI5 control. This is an implementation-level API that forces the caller to know the DOM ID of a UI5 control, which defeats the purpose of the `UI5Selector` abstraction. An AI agent cannot reliably construct CSS IDs for UI5-rendered controls (IDs are dynamically generated).

**FINDING I-03 [MODERATE]: `odata` fixture requires `initialize()` before use**

```typescript
// From src/handlers/odata-handler.ts
private ensureInitialized(): void {
  if (!this.config) {
    throw new ODataError({
      code: DhikraftErrorCode.CONFIG_INVALID,
      message: 'ODataHandler not initialized. Call initialize() first.',
      ...
    });
  }
}
```

The `odata` fixture requires an explicit `await odata.initialize(config)` before any CRUD operation. An AI agent generating test code without reading handler internals will call `odata.read('/MaterialSet')` and receive an error about initialization. This is a two-step API that should auto-initialize from the dhikraft config.

**FINDING I-04 [MODERATE]: Navigation module function signatures expose `page` parameter**

`src/ui5-modules/navigation.ts` functions:

```typescript
export async function navigateToTile(page: Page, title: string, options?: ...): Promise<void>
export async function navigateToIntent(page: Page, intent: string, params?: ...): Promise<void>
```

These are module-level functions that require `page` as the first parameter. The `ui5Navigation` fixture must wrap these to inject `page` automatically. The fixture API hides `page` correctly, but the underlying module-level functions are also exported and callable directly. An AI agent that accidentally imports from the module level (rather than via fixtures) must manually pass `page`.

---

## Step 4 — JSDoc and AI Metadata Audit

### Documented JSDoc Standard vs Reality

The `CLAUDE.md` instructions state: "This project uses **Microsoft TSDoc exclusively**" with `@intent`, `@guarantee`, `@capability` as custom tags. The reality in source code differs.

**FINDING J-01 [MAJOR]: Non-standard custom TSDoc tags throughout codebase**

The following non-standard tags appear in source files that would not pass `eslint-plugin-tsdoc` validation:

| Non-Standard Tag           | Location                                             | Standard Alternative                        |
| -------------------------- | ---------------------------------------------------- | ------------------------------------------- |
| `@aiHint`                  | `src/handlers/ui5-handler.ts:17`                     | `@remarks` or custom registered tag         |
| `@ai-context` (kebab-case) | `src/lib/ui5-object.ts:9`                            | `@aiContext` (camelCase)                    |
| `@ai-description`          | `src/lib/ui5-object.ts:77`                           | Not standard                                |
| `@alternative`             | `src/handlers/odata-handler.ts:57`                   | Not standard TSDoc                          |
| `@created`                 | `src/intent-api/domains/procurement-intent-api.ts:7` | Not standard TSDoc                          |
| `@author`                  | `src/lib/ui5-object.ts:6`, multiple                  | Not standard TSDoc (use `@remarks` or none) |
| `@license`                 | `src/lib/ui5-object.ts:7`                            | Not standard TSDoc                          |

**FINDING J-02 [MAJOR]: `createAIServiceConfig` uses `any` type — violates TypeScript strict mode**

`src/fixtures/dhikraft-fixtures.ts` line 73:

```typescript
function createAIServiceConfig(config: any): import('../ai/ai-service-integration.js').AIServiceConfig {
```

The parameter `config: any` violates the project's own rule "TypeScript strict mode — no `any`" from `CLAUDE.md`. For an AI agent generating tests that call this function, there is no type safety or IDE autocomplete for the `config` parameter.

**FINDING J-03 [MODERATE]: `@remarks Originally @module X` pattern is not valid TSDoc**

Every source file starts with:

```typescript
/**
 * @remarks Originally @module dhikraft/fixtures
 */
```

The `@module` tag inside `@remarks` is a textual workaround for documentation — it is not machine-readable. If API Extractor is run, this pattern will produce incorrectly formatted remarks. The pattern suggests files were moved or renamed and the original module declarations were patched with `@remarks` instead of proper refactoring.

**FINDING J-04 [MODERATE]: JSDoc `@example` blocks in control.ts use non-fixture API**

`src/ui5-modules/control.ts` line 22:

````typescript
 * @example AI Agent Quick Reference
 * ```typescript
 * import { control } from 'dhikraft'; // ← This import does not exist
 *
 * const text = await control.getControlProperty(page, '#submitBtn', 'text');
 * ```
````

`dhikraft` does not export a `control` namespace — `control` is a module-level function set, not exported from `src/index.ts`. An AI agent following this example will get a compile error.

**FINDING J-05 [MINOR]: JSDoc quality is high for handler classes, inconsistent for modules**

Handler classes (`SAPAuthHandlerImpl`, `ODataHandlerImpl`, `UI5Handler`) have excellent JSDoc with full `@param`, `@returns`, `@throws`, and `@example` coverage. Module-level functions in `ui5-modules/` have patchy coverage — some functions lack `@param` and `@throws` entirely.

---

## Step 5 — Playwright Best Practices

### CRITICAL: `page.waitForTimeout()` Used 30+ Times

`page.waitForTimeout()` is an anti-pattern explicitly documented by Playwright as "flaky by design" (https://playwright.dev/docs/best-practices#avoid-testing-implementation-details). It pauses execution for a fixed duration without waiting for any application state.

**Evidence from source scan:**

```
src/global-setup.ts:77          await page.waitForTimeout(3000);
src/lib/iframe-manager.ts:194   await this.page.waitForTimeout(IFRAME_RETRY_INTERVAL_MS);
src/intent-api/ui5-intent-wrappers.ts:1534  await page.waitForTimeout(1500);
src/lib/fe-helpers.ts:107       await page.waitForTimeout(ANIMATION_WAIT_TIMEOUT);
src/lib/fe-helpers.ts:267       await page.waitForTimeout(ANIMATION_WAIT_TIMEOUT);
src/lib/fe-helpers.ts:286       await page.waitForTimeout(ANIMATION_WAIT_TIMEOUT);
src/lib/ui5-control-proxy.ts:647  await this.page.waitForTimeout(500);
src/handlers/sap-auth-handler.ts:422  await this.page.waitForTimeout(USER_MENU_OPEN_WAIT_MS);
src/handlers/auth-strategies.ts:657   await page.waitForTimeout(CLOUD_PAGE_STABILIZATION_TIMEOUT_MS);
src/handlers/auth-strategies.ts:1569  await page.waitForTimeout(CLOUD_PAGE_STABILIZATION_TIMEOUT_MS);
src/handlers/ui5-navigation-bar.ts:260  await this.page.waitForTimeout(pollInterval);  ← polling loop
src/handlers/ui5-navigation-bar.ts:372  await this.page.waitForTimeout(pollInterval);  ← polling loop
src/handlers/ui5-handler.ts:1644  await this.page.waitForTimeout(options.delay);
src/handlers/agentic-handler.ts:386  await this.page.waitForTimeout(AgenticHandlerImpl.DEFAULT_STEP_DELAY_MS);
src/ui5-modules/assertion.ts:259  await ctx.page.waitForTimeout(POLL_INTERVAL_MS);   ← polling loop
src/ui5-modules/assertion.ts:307  await ctx.page.waitForTimeout(POLL_INTERVAL_MS);   ← polling loop
... (11 more in assertion.ts alone)
src/ui5-modules/navigation.ts:442  await page.waitForTimeout(DEFAULT_APP_LOADING_WAIT_MS);
src/ui5-modules/navigation.ts:500  await page.waitForTimeout(DEFAULT_APP_LOADING_WAIT_MS);
src/ui5-modules/navigation.ts:555  await page.waitForTimeout(BASIC_OPERATION_WAIT_MS);
src/ui5-modules/navigation.ts:585  await page.waitForTimeout(DEFAULT_APP_LOADING_WAIT_MS);
src/ui5-modules/navigation.ts:693  await page.waitForTimeout(DEFAULT_APP_LOADING_WAIT_MS);
src/ui5-modules/navigation.ts:724  await page.waitForTimeout(BASIC_OPERATION_WAIT_MS);
```

**Impact:** Every `waitForTimeout()` call makes tests:

- Slower on fast systems (always waits full duration)
- Flaky on slow systems (does not wait long enough)
- Untestable in isolation (cannot fast-forward without real delays)

**Correct Playwright patterns to replace these:**

- `await page.waitForLoadState('networkidle')` — for network stabilization
- `await page.waitForFunction(() => condition)` — for polling with condition
- `await expect(locator).toBeVisible()` — for element visibility
- `await page.waitForURL(/pattern/)` — for navigation completion
- `waitForUI5Stable()` (already in the codebase) — for UI5 framework readiness

**FINDING P-01 [CRITICAL]: Widespread use of `page.waitForTimeout()` throughout production source**

**FINDING P-02 [CRITICAL]: `headless: false` hardcoded in `src/global-setup.ts:56`**

```typescript
const browser = await chromium.launch({
  channel: 'chrome',
  headless: false, // Keep headed for debugging  ← HARDCODED
});
```

This means every CI pipeline run that uses the dhikraft global setup will launch a visible browser window. On headless CI environments (GitHub Actions, Azure DevOps), this will either fail or fall back to software rendering. The `headless` setting must read from Playwright config or environment variable.

**FINDING P-03 [MODERATE]: `ui5-modules/assertion.ts` implements polling manually instead of using Playwright expect**

`assertion.ts` implements its own polling loop using `waitForTimeout` + retry counters:

```typescript
// Pattern repeated 11+ times in src/ui5-modules/assertion.ts
while (attempts < maxAttempts) {
  try {
    // ... check condition
    return;
  } catch {
    await ctx.page.waitForTimeout(POLL_INTERVAL_MS);
    attempts++;
  }
}
throw new Error('Assertion failed after max attempts');
```

Playwright's built-in `expect(locator).toBeVisible({ timeout: 30000 })` implements this exact pattern internally with proper retry logic, `TimeoutError` wrapping, and CI-friendly tracing. The custom implementation loses all these benefits.

**FINDING P-04 [MODERATE]: No Playwright `test.step()` wrapping for AI-level operations**

`src/utils/step-decorator.ts` implements a `@ui5Step` decorator and `ui5Step()` wrapper. However, the Intent API operations (`procurementAPI.createPurchaseOrder()`, etc.) do not use `test.step()`. Playwright traces will show a flat list of low-level actions instead of business-level step groupings, making it impossible for an AI agent reading a trace to understand what high-level operation failed.

**FINDING P-05 [MINOR]: `test.use()` configuration not provided for interaction strategy selection**

The interaction strategy is configured via `UI5_INTERACTION_STRATEGY` environment variable. Playwright convention is to use `test.use()` fixture overrides for test-level configuration:

```typescript
// Playwright convention (missing in dhikraft)
test.use({ ui5InteractionStrategy: 'dom-first' });
```

This environment variable approach prevents per-test strategy selection without process restarts.

### Compliant Playwright Patterns (Positives)

- `test.extend()` used correctly for fixture registration
- `storageState` pattern for session reuse is correct
- `page.request` API used correctly in OData handler for auth sharing
- Fixture dependency declarations appear correct
- `AuthStrategyFactory` abstraction is clean and extensible

---

## Step 6 — Node.js and Library Design

### Architecture Issues

**FINDING N-01 [CRITICAL]: License inconsistency**

`package.json` line 203: `"license": "Apache-2.0"`
`README.md` line 10: `[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)`

These are incompatible open-source licenses. The badge is wrong, the license file content must be checked, and all contributors need to know which license applies. For an enterprise plugin targeting SAP environments, a licensing error is a legal blocker for adoption.

**FINDING N-02 [MAJOR]: Backup files in published npm package**

`package.json` `files` array includes `"src/"`. This means the following files are published to npm:

- `src/index.ts.v1.1.0`
- `src/index.ts.v1.1.0.backup`
- `src/intent-api/domains/finance-intent-api.ts.bak`

An AI agent scanning the installed package directory for context files will consume these and generate incorrect code based on the v1.1.0 API surface.

**FINDING N-03 [MAJOR]: `console.log` in production source code (658 occurrences across 74 files)**

The codebase provides a `Logger` class (`src/lib/logger.ts`) for structured logging. However, grep results show **658 `console.log` occurrences across 74 source files**. The vast majority appear to be in:

- `src/global-setup.ts` — print statements like `console.log('🔐 Starting SAP Global Authentication Setup...\n')`
- `src/global-teardown.ts` — teardown logging
- CLI files (`src/cli/`) — acceptable for CLI output
- Multiple handler files — should use `logger.info()` instead

This matters for AI agents because structured logging (with namespaces) allows log filtering, but raw `console.log` pollutes test runner output and cannot be suppressed without modifying process stdout.

**FINDING N-04 [MODERATE]: `@ts-ignore` in `src/global-setup.ts:8`**

```typescript
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore - Import path valid at runtime (after build), from root directory
import * as fs from 'node:fs';
```

This `@ts-ignore` suppresses TypeScript checking on a standard Node.js built-in import. It is not necessary — `node:fs` imports are fully typed without suppression. This suggests the file was written before tsconfig was properly configured and the suppression was never removed.

**FINDING N-05 [MODERATE]: Missing explicit `exports` type field in some export conditions**

`package.json` exports for `./global-setup` and `./global-teardown` only have:

```json
"./global-setup": {
  "types": "./global-setup.d.ts",
  "default": "./global-setup.js"
}
```

These lack explicit `"import"` and `"require"` conditions. While `"default"` covers both, tools like TypeScript's `--module nodeNext` expect explicit `"import"` for ESM detection. This can cause resolution issues in strict module mode.

**FINDING N-06 [MODERATE]: `src` directory included in published `files` array**

```json
"files": [
  "dist",
  "dist-cjs",
  "docs",
  "examples",
  "src",         // ← publishes TypeScript source + backup files
  "skills",
  ...
]
```

Publishing TypeScript source alongside compiled output is intentional (for source map support) but doubles the package size and includes the backup files noted in F-02/N-02. The `skills/` directory (agent skill guides) is also published — this may be intentional for AI agent discovery but should be explicit in documentation.

**FINDING N-07 [MINOR]: Coverage target of 100% lines set but only 2 unit test files exist**

`package.json` script `coverage:check` sets:

```
--lines 100 --functions 100 --branches 95 --statements 100
```

Source scan found exactly 2 unit test files:

- `src/utils/__tests__/step-decorator.test.ts`
- `src/vocabulary/tests/vocabulary-system.test.ts`

The remaining test specs are in `examples/` and require a live SAP system connection. Without hermetic unit tests, the 100% coverage gate is unachievable and misleading.

---

## Step 7 — AI Agent Usability Simulation

### Simulation: Write a Full SAP UI5 + OData Test Using Only This Repository

**Persona:** AI agent with access only to the dhikraft repository, no human guidance.

#### Step 7.1: Entry Point Discovery

An AI agent would correctly identify:

1. `docs/AI_API.md` as the mandatory entry point (prominently documented in README, package.json, and help command)
2. `import { test, expect } from 'dhikraft'` as the correct import

**Grade: PASS**

#### Step 7.2: Authentication Setup

The AI agent reads `docs/AI_API.md` and finds:

```typescript
await sapAuth.loginFromEnv();
```

and the `playwright.config.ts` pattern with `globalSetup: './node_modules/dhikraft/global-setup.js'`.

**Gap: Which to use?** `docs/testers/AUTO_AUTHENTICATION.md` and `docs/AI_API.md` both show `loginFromEnv()` in fixture-based tests, AND global setup configuration. An AI agent has no clear guidance on: "Should I call `loginFromEnv()` in every test, or is the global setup the correct approach?" The correct answer (use global setup + storageState, `loginFromEnv()` is for non-global-setup scenarios) is buried in documentation, not surfaced programmatically.

**Grade: PARTIAL PASS — Decision path is ambiguous**

#### Step 7.3: Navigating to an SAP Application

The AI agent sees multiple navigation APIs:

- `ui5Navigation.navigateToApplication()` — shown in AI_API.md
- `navigation.openTileByTitle()` — shown in README Quick Start
- `navigation.navigateToTile()` — in navigation module source
- `navigation.navigateToIntent()` — in navigation module source
- `ui5Nav.navigateToApplication()` — SRP fixture, separate from `ui5Navigation`

**Which is canonical?** An AI agent cannot determine this from reading the docs. The AI_API.md shows `ui5Navigation`, the README shows `navigation`, and SRP pattern shows `ui5Nav`. All three are valid but the decision tree is undocumented.

**Grade: PARTIAL FAIL — Three navigation fixture paths with no disambiguation**

#### Step 7.4: Interacting With a UI5 Button

**Option A** (Gold Standard per README/AI_API.md):

```typescript
const button = await ui5.control({ controlType: 'sap.m.Button', properties: { text: 'Create' } });
await button.press();
```

**Option B** (direct method, simpler):

```typescript
await ui5.click({ controlType: 'sap.m.Button', properties: { text: 'Create' } });
```

**Option C** (SRP fixture):

```typescript
await ui5Interact.click({ controlType: 'sap.m.Button', properties: { text: 'Create' } });
```

AI_API.md marks Option A as Gold Standard. This is confusing because:

- `ui5.control()` returns a proxy with 220+ methods — choosing `press()` requires knowing UI5 API
- `ui5.click()` is more discoverable and intent-level
- An AI agent will choose based on documentation, not intuition

**Grade: PARTIAL FAIL — Gold Standard is actually the most complex pattern**

#### Step 7.5: Filling a Form Field

AI_API.md shows:

```typescript
const vendorInput = await ui5.control({ id: 'vendorInput' });
await vendorInput.setValue('V001');
```

This works for `sap.m.Input`. For `sap.m.ComboBox`, the method is `setSelectedKey()` or `setSelectedItem()`. For `sap.m.DatePicker`, it's `setDateValue()`. An AI agent using `setValue()` on a ComboBox will get a runtime error with no guidance.

**Gap:** No selector-to-method mapping guide exists. The agent must know SAP UI5 API internals to use the control proxy correctly.

**Grade: PARTIAL FAIL — Requires SAP UI5 API knowledge to use safely**

#### Step 7.6: Reading Data via OData

```typescript
const materials = await odata.read('/MaterialSet');
```

This fails with `'ODataHandler not initialized. Call initialize() first.'` (Finding I-03). An AI agent following the documented example in `src/index.ts` comments will hit this error immediately.

**Grade: FAIL — Core API example is broken**

#### Step 7.7: Determining UI5 vs Native Playwright for an Unknown Element

`docs/AI_API.md` documents `selectorDiscovery.isUI5Control(page, '#someElement')` as the decision mechanism (Finding F-01). This fixture does not exist.

**Grade: FAIL — The primary AI disambiguation mechanism is documented but absent**

#### Summary of AI Agent Blockers

| #    | Blocker                                                                            | Severity |
| ---- | ---------------------------------------------------------------------------------- | -------- |
| B-01 | `selectorDiscovery` fixture does not exist                                         | Fatal    |
| B-02 | `odata` requires `initialize()` not shown in documented examples                   | Fatal    |
| B-03 | Gold Standard pattern (`ui5.control()`) requires SAP UI5 API knowledge             | High     |
| B-04 | Three navigation fixture paths — no canonical guide                                | High     |
| B-05 | AI fixtures fail without Azure OpenAI credentials                                  | High     |
| B-06 | `control.ts` module-level functions export incorrect import path in JSDoc examples | Medium   |
| B-07 | Auth setup ambiguity (global setup vs `loginFromEnv()` in test)                    | Medium   |
| B-08 | Intent API marked Beta with no clear indication of which operations actually work  | Medium   |

#### AI Agent Enablers (What Works Well)

| #    | Enabler                                            | Assessment                               |
| ---- | -------------------------------------------------- | ---------------------------------------- |
| E-01 | `capabilities.forAI()` and recipe registry         | Excellent — genuine AI-first design      |
| E-02 | `UI5Selector` type with rich examples              | Excellent — covers all selector patterns |
| E-03 | `bulkDiscovery.discoverAll()` fixture              | Excellent — page-wide control inventory  |
| E-04 | Business vocabulary service                        | Good — SAP term-to-selector mapping      |
| E-05 | `docs/AI_API.md` as mandatory entry point          | Good — correct approach                  |
| E-06 | `@aiHint` tags on handlers                         | Good — guides code generation            |
| E-07 | Auth strategy auto-detection (onprem vs cloud)     | Good — reduces config burden             |
| E-08 | `ui5Step()` decorator for tracing                  | Good — improves trace readability        |
| E-09 | Error codes with suggestions (`DhikraftErrorCode`) | Good — programmatic error handling       |
| E-10 | Dual ESM+CJS build                                 | Good — maximum runtime compatibility     |

---

## Step 8 — Final Verdict

### Overall AI-Readiness Score: 6.5 / 10

| Dimension              | Score | Reason                                                                 |
| ---------------------- | ----- | ---------------------------------------------------------------------- |
| Entry Point Clarity    | 7/10  | Main entry is clear, but `selectorDiscovery` is a fatal documented gap |
| Capability Discovery   | 8/10  | Excellent — `capabilities.forAI()` and recipes are genuinely good      |
| Intent-Level API       | 6/10  | Fixture naming confusion, Gold Standard is implementation-level        |
| JSDoc/AI Metadata      | 6/10  | Handler docs are good; module docs inconsistent; non-standard tags     |
| Playwright Compliance  | 4/10  | 30+ `waitForTimeout()` calls; `headless: false` hardcoded              |
| Node.js Library Design | 6/10  | License error; backup files in npm; `console.log` proliferation        |
| AI Agent Usability     | 6/10  | 3/7 simulation scenarios fail or are ambiguous                         |

---

### Top 5 Critical Fixes (Must-Do Before Release)

**CF-01: Add `selectorDiscovery` as a registered fixture or remove all references from docs**

The documented primary AI disambiguation mechanism does not exist as a fixture. Either:

- Register `selectorDiscovery` in `src/fixtures/dhikraft-fixtures.ts` wrapping `src/lib/selector-discovery.ts`
- Or remove all references from `docs/AI_API.md` and document an alternative

This is a promise the plugin makes to AI agents that it currently cannot keep.

**CF-02: Eliminate all `page.waitForTimeout()` calls — replace with Playwright web-first assertions**

30+ instances across production source. Replace with:

- Polling loops → `page.waitForFunction(() => condition, { timeout })`
- Navigation buffers → `page.waitForLoadState('networkidle')` or `expect(locator).toBeVisible()`
- Auth wait → `await expect(page.locator('[data-element="user-menu"]')).toBeVisible({ timeout: 30000 })`
- Animation waits → `await expect(locator).toBeVisible()` (Playwright waits for CSS transitions)

**CF-03: Fix `headless: false` hardcoded in `src/global-setup.ts`**

Change to:

```typescript
const browser = await chromium.launch({
  channel: 'chrome',
  headless: process.env.CI === 'true' ? true : process.env.HEADLESS !== 'false',
});
```

Or better: read from Playwright's config object (`config.projects[0].use.headless`).

**CF-04: Fix license inconsistency — align README badge with `package.json`**

One must be correct. If Apache-2.0 (package.json), update the README badge and verify the `LICENSE` file contains Apache-2.0 text. If MIT, update package.json. This is a legal requirement before npm publish.

**CF-05: Remove backup files from source and from the `files` publish list**

Delete: `src/index.ts.v1.1.0`, `src/index.ts.v1.1.0.backup`, `src/intent-api/domains/finance-intent-api.ts.bak`

If historical reference is needed, use git history. These files are published to npm and confuse AI consumers.

---

### Top 5 Strategic Improvements (High-Value)

**SI-01: Demote `ui5.control()` from Gold Standard to Advanced API**

Update README and `docs/AI_API.md` to present `ui5.click()`, `ui5.fill()`, `ui5.select()` as the primary patterns. `ui5.control()` should be documented as the escape hatch for operations not covered by the high-level API. This is the difference between an intent-level API and an implementation-level API.

**SI-02: Auto-initialize `odata` fixture from dhikraft config**

The `odata` fixture should auto-initialize using the `SAP_*_BASE_URL` and credential env vars from the dhikraft config, eliminating the `await odata.initialize(config)` call. An AI agent should be able to call `await odata.read('/MaterialSet')` immediately after fixture injection.

**SI-03: Add graceful degradation for AI fixtures when LLM not configured**

Currently: AI fixtures (`aiService`, `aiDiscovery`, `agentic`) throw errors when Azure OpenAI is not configured. This blocks all tests on systems without LLM access.

Solution: Implement a `mock` mode that returns reasonable defaults, allowing tests to run without LLM connectivity. Document: "Without LLM config, AI fixtures operate in mock mode. Set `AZURE_AI_API_KEY` for full capability."

**SI-04: Consolidate navigation API surface**

Three navigation fixture paths (`navigation`, `ui5Navigation`, `ui5Nav`) do overlapping work. Define a canonical hierarchy:

- `ui5Navigation` → Primary fixture, all navigation operations
- `navigation` → Deprecated alias for `ui5Navigation` (backward compat)
- `ui5Nav` → SRP fixture wrapping `ui5Navigation` (document as SRP pattern, not alternative)

Publish a migration guide so AI agents can unambiguously select one.

**SI-05: Replace custom polling in `assertion.ts` with `page.waitForFunction`**

The 11+ `waitForTimeout` polling loops in `assertion.ts` should be replaced with:

```typescript
// Instead of:
while (attempts < maxAttempts) {
  await ctx.page.waitForTimeout(POLL_INTERVAL_MS);
}

// Use:
await ctx.page.waitForFunction(
  (selector) => {
    /* check condition */
  },
  selector,
  { timeout: maxTimeout },
);
```

This eliminates fixed-duration waits, improves test speed, and leverages Playwright's built-in timeout infrastructure.

---

### AI-First Readiness Checklist

To make dhikraft AI-first, the following checklist must be completed:

- [ ] `selectorDiscovery` fixture registered and functional
- [ ] Zero `page.waitForTimeout()` calls in source
- [ ] `headless` is not hardcoded in global-setup
- [ ] License badge and `package.json` agree
- [ ] No backup files in `src/`
- [ ] `odata` auto-initializes from environment config
- [ ] AI fixtures degrade gracefully without LLM config
- [ ] One canonical navigation fixture documented
- [ ] `ui5.click()` / `ui5.fill()` promoted over `ui5.control()` as primary API
- [ ] `capabilities.has()` signature corrected (remove category overload from docs or implement it)
- [ ] `control.ts` module JSDoc examples corrected to use fixture pattern
- [ ] Intent API Beta marker clarified with a "what works / what doesn't" matrix
- [ ] `createAIServiceConfig(config: any)` typed properly
- [ ] Custom TSDoc tags registered in `tsdoc.json` or replaced with standard tags
- [ ] Hermetic unit tests for at least `ui5-handler`, `odata-handler`, and `sap-auth-handler`

---

## Comprehensive Issue List

| ID   | Severity | Area         | Issue                                                                         | Source Evidence                                               | Recommended Fix                                  |
| ---- | -------- | ------------ | ----------------------------------------------------------------------------- | ------------------------------------------------------------- | ------------------------------------------------ |
| F-01 | Critical | API Contract | `selectorDiscovery` fixture documented but not registered                     | `docs/AI_API.md:70-88` vs `src/fixtures/dhikraft-fixtures.ts` | Add fixture or remove docs reference             |
| F-02 | Major    | npm Publish  | Backup files published to npm                                                 | `package.json files: ["src/"]` + `src/index.ts.v1.1.0`        | Delete files, gitignore pattern                  |
| F-03 | Minor    | API Naming   | `ui5Navigation` vs `navigation` alias confusion                               | `src/index.ts` comments                                       | Document canonical, deprecate alias              |
| D-01 | Major    | AI Usability | No machine-readable UI5/non-UI5 decision tree                                 | `docs/AI_API.md` prose only                                   | Add structured JSON decision guide               |
| D-02 | Major    | API Contract | `capabilities.has()` documented with 2 args, accepts 1                        | `docs/AI_API.md` vs `src/capabilities/index.ts:175`           | Fix implementation or documentation              |
| D-03 | Moderate | Reliability  | Capability registry may be stale                                              | `npm run generate:capabilities` not in all build paths        | Add to `prebuild` unconditionally                |
| D-04 | Minor    | AI Metadata  | No structured SAP element taxonomy (UI5/DOM/hybrid)                           | Docs only                                                     | Add JSON taxonomy export                         |
| I-01 | Major    | API Design   | `ui5.control()` presented as Gold Standard over `ui5.click()`                 | `README.md:104-116`                                           | Promote intent-level API in docs                 |
| I-02 | Major    | API Design   | `ui5-modules/control.ts` requires CSS selectors, not `UI5Selector`            | `src/ui5-modules/control.ts:52`                               | Accept `UI5Selector` or document limitation      |
| I-03 | Moderate | API Design   | `odata` fixture requires manual `initialize()` call                           | `src/handlers/odata-handler.ts:79-90`                         | Auto-initialize from config                      |
| I-04 | Moderate | API Design   | Navigation module functions expose `page` parameter                           | `src/ui5-modules/navigation.ts` exported functions            | Internal only; fixture should be sole public API |
| J-01 | Major    | Code Quality | Non-standard TSDoc tags throughout (`@aiHint`, `@ai-context`, `@alternative`) | `src/handlers/ui5-handler.ts:17`, `src/lib/ui5-object.ts:9`   | Register in `tsdoc.json` or replace              |
| J-02 | Major    | TypeScript   | `createAIServiceConfig(config: any)` violates strict mode                     | `src/fixtures/dhikraft-fixtures.ts:73`                        | Add proper parameter type                        |
| J-03 | Moderate | Code Quality | `@remarks Originally @module X` pattern is not valid TSDoc                    | Every source file header                                      | Remove or use `@packageDocumentation`            |
| J-04 | Moderate | Docs         | `control.ts` JSDoc example shows non-existent import                          | `src/ui5-modules/control.ts:22`                               | Correct to fixture pattern                       |
| J-05 | Minor    | Docs         | JSDoc coverage inconsistent across modules                                    | Module-level functions                                        | Add `@param`, `@returns`, `@throws`              |
| P-01 | Critical | Playwright   | 30+ `page.waitForTimeout()` calls in production source                        | Grep: `page.waitForTimeout` in `src/`                         | Replace with web-first assertions                |
| P-02 | Critical | Playwright   | `headless: false` hardcoded in global-setup                                   | `src/global-setup.ts:56`                                      | Read from config/env                             |
| P-03 | Moderate | Playwright   | Custom polling in `assertion.ts` instead of `waitForFunction`                 | `src/ui5-modules/assertion.ts:259-1450`                       | Replace with `page.waitForFunction`              |
| P-04 | Moderate | Playwright   | Intent API lacks `test.step()` wrapping                                       | `src/intent-api/domains/`                                     | Add `test.step()` around business operations     |
| P-05 | Minor    | Playwright   | Interaction strategy not configurable via `test.use()`                        | Environment variable only                                     | Add fixture override support                     |
| N-01 | Critical | Legal        | License inconsistency: README=MIT, package.json=Apache-2.0                    | `README.md:10` vs `package.json:203`                          | Align to correct license                         |
| N-02 | Major    | npm Publish  | Backup `.bak` and version files published to npm                              | `package.json files` + `src/`                                 | Remove files, fix `files` glob                   |
| N-03 | Major    | Code Quality | 658 `console.log` occurrences in production source                            | Grep result: 74 files                                         | Replace with `Logger` class calls                |
| N-04 | Moderate | TypeScript   | `@ts-ignore` on standard Node.js import                                       | `src/global-setup.ts:8`                                       | Remove — not needed                              |
| N-05 | Moderate | npm Publish  | `./global-setup` export missing explicit `import`/`require` conditions        | `package.json:19-22`                                          | Add `"import"` condition                         |
| N-06 | Moderate | npm Publish  | `src/` in `files` publishes TS source and backup files                        | `package.json:46`                                             | Exclude `src/` or add `.npmignore` pattern       |
| N-07 | Minor    | Testing      | 100% coverage gate with only 2 unit test files                                | `package.json coverage:check`                                 | Add hermetic unit tests or lower threshold       |

---

## Appendix: Architecture Assessment

### What dhikraft Gets Right

The core architectural decisions are sound and differentiated:

1. **Fixture-first design** — Correct alignment with Playwright's recommended extension model. The `test.extend()` pattern with 32 fixtures is architecturally clean.

2. **UI5 bridge injection** — Lazy injection on first UI5 operation is the correct approach. The priority chain (Registry → Direct ID → RecordReplay) shows genuine understanding of UI5 internals.

3. **Strategy pattern for interaction** — Three strategies (`playwright-native`, `dom-first`, `opa5-recordreplay`) allow enterprise customization without API changes.

4. **AI capability registry** — The combination of `capabilities.forAI()` + recipe registry + business vocabulary is a genuine innovation. No comparable SAP testing tool provides this.

5. **Error hierarchy with codes** — `DhikraftErrorCode` enum + structured error classes is correct for programmatic error handling by AI agents.

6. **Auth strategy auto-detection** — Detecting on-prem vs cloud from URL reduces configuration burden.

### What Undermines the Architecture

1. **UI5 bridge knows too much about DOM** — `ui5-modules/control.ts` uses `document.querySelector(cssSelector)` to find UI5 controls by DOM ID. This bypasses the UI5 registry and is fragile. All control lookup should go through the UI5 registry.

2. **Module-level functions vs fixture-encapsulated operations** — Functions in `ui5-modules/navigation.ts` accept `page` as first argument and can be called directly. This creates two call paths for the same operation. Only the fixture path should be public.

3. **Intent API is aspirational** — Domain APIs (`ProcurementIntentAPI`, etc.) use business vocabulary and field name constants, but the implementation calls low-level `intentWrappers` which call `ui5.fill()` for each field. There is no semantic understanding of SAP business logic — just vocabulary-assisted field filling. This is valuable but should be communicated as "vocabulary-guided form filling" rather than "business intent API."

4. **Global-setup.ts has architectural issues** — It directly imports `SAPAuthHandlerImpl` (an internal class) rather than using the fixture system. The `@ts-ignore` and `headless: false` suggest this file was not written to the same standard as the rest of the codebase.

---

_End of Dhikraft AI Readiness Audit — v2.5.0_
