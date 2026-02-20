we# Praman AI-Readiness Audit

| Property         | Value                                                               |
| ---------------- | ------------------------------------------------------------------- |
| **Document ID**  | PRAMAN-AUDIT-AI-001                                                 |
| **Version**      | 1.0.0                                                               |
| **Status**       | Final — Self-Audit by Principal Architect (Third-Party Perspective) |
| **Package**      | `playwright-praman` v1.0.1                                          |
| **Audit Scope**  | Phase 4 codebase (129 source files, 28,935 LOC, 1,991 tests)        |
| **Audit Date**   | 2026-02-20                                                          |
| **Auditor Role** | Principal Architect + Independent Reviewer                          |
| **Source Read**  | All source files read directly — no trust in plan docs alone        |

---

## Framing: Playwright + Praman, Not Praman vs. Playwright

**Praman is a Playwright plugin for SAP UI5 testing.** Playwright handles DOM, network, browser, auth storage, reporters, and CI. Praman adds the UI5 bridge layer that lets test authors interact with SAP UI5 controls by their business identity (control type, properties, bindings) rather than by CSS selectors.

The correct mental model:

```
Playwright    → DOM, navigation, network mocking, screenshots, tracing
Praman        → UI5 control discovery + interaction, SAP FLP navigation,
                OData model access, Fiori Elements test helpers, SAP auth
```

An AI agent must know EXACTLY which layer to use for which operation. This audit evaluates whether the current codebase makes that boundary clear and whether the plugin is consumable by an autonomous AI agent.

---

## STEP 1 — Entry Point Discovery

### 1.1 Sub-Path Export Map

**Source verified**: `package.json` exports field + `tsup.config.ts` entry points.

| Sub-path                       | Status         | Evidence                                |
| ------------------------------ | -------------- | --------------------------------------- |
| `playwright-praman` (main `.`) | ✅ Implemented | `src/index.ts` — 221 LOC barrel         |
| `playwright-praman/fe`         | ✅ Implemented | `src/fe/index.ts` — 86 LOC barrel       |
| `playwright-praman/ai`         | ❌ Empty stub  | `src/ai/index.ts` — 5 LOC (`export {}`) |
| `playwright-praman/intents`    | ❌ Empty stub  | `src/intents/index.ts` — stub           |
| `playwright-praman/vocabulary` | ❌ Empty stub  | `src/vocabulary/index.ts` — stub        |
| `playwright-praman/reporters`  | ❌ Empty stub  | `src/reporters/index.ts` — stub         |

**Critical finding**: 4 of 6 configured sub-path exports are empty stubs. Any AI agent that reads the package.json and attempts `import { ... } from 'playwright-praman/ai'` gets nothing. The package claims "AI-First" in its description but the AI sub-path is a 5-line empty file.

### 1.2 Public API Surface (Main Entry Point)

**Source verified**: `src/index.ts` read directly.

#### Category A — Correctly Public (User-Facing)

| Export                                                                                                                                                                                                                      | File                           | Assessment                       |
| --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------ | -------------------------------- |
| `test`, `expect`                                                                                                                                                                                                            | `fixtures/index.ts`            | ✅ Correct. Primary entry point. |
| `defineConfig`, `loadConfig`                                                                                                                                                                                                | `core/config/index.ts`         | ✅ Correct. Config surface.      |
| `PramanConfig`, `PramanConfigInput`                                                                                                                                                                                         | types                          | ✅ Correct. Config types.        |
| `navigateToApp`, `navigateToTile`, `navigateToIntent`, `navigateToHash`, `navigateToHome`, `navigateBack`, `navigateForward`, `searchAndOpenApp`, `getCurrentHash`                                                          | `modules/navigation.ts`        | ✅ Correct. FLP navigation.      |
| Table: `getTableRows`, `getTableRowCount`, `getTableCellValue`, `getTableData`, `selectTableRow`, `selectAllTableRows`, `deselectAllTableRows`, `waitForTableData`, `getSelectedRows`, `detectTableType`, `getSelectedRows` | `modules/table.ts`             | ✅ Correct.                      |
| Table ops: `getColumnNames`, `getCellByColumnName`, `selectRowByValues`, `ensureRowVisible`, `setTableCellValue`, `getRowCount`, `clickRow`, `findRowByValues`                                                              | `modules/table-operations.ts`  | ✅ Correct.                      |
| Table filter/sort: `filterByColumn`, `sortByColumn`, `getSortOrder`, `getFilterValue`, `exportTableData`, `clickTableSettingsButton`                                                                                        | `modules/table-filter-sort.ts` | ✅ Correct.                      |
| `confirmDialog`, `dismissDialog`, `getDialogButtons`, `getOpenDialogs`, `isDialogOpen`, `waitForDialog`, `waitForDialogClosed`                                                                                              | `modules/dialog.ts`            | ✅ Correct.                      |
| `setDatePickerValue`, `getDatePickerValue`, `setTimePickerValue`, `getTimePickerValue`, `setDateRangeSelection`, `getDateRangeSelection`, `setAndValidateDate`, `formatDateForUI5`                                          | `modules/date.ts`              | ✅ Correct.                      |
| `getModelProperty`, `waitForODataLoad`, `fetchCSRFToken`, `getEntityCount`, `getModelData`, `hasPendingChanges`                                                                                                             | `modules/odata.ts`             | ✅ Correct.                      |
| `createEntity`, `updateEntity`, `deleteEntity`, `queryEntities`, `callFunctionImport`                                                                                                                                       | `modules/odata-http.ts`        | ✅ Correct.                      |
| Error classes (10 total)                                                                                                                                                                                                    | `core/errors/`                 | ✅ Correct.                      |
| `VERSION`, `PACKAGE_NAME`                                                                                                                                                                                                   | `version.ts`                   | ✅ Correct.                      |

#### Category B — Incorrectly Public (Implementation Details Leaked)

**These should NOT be in the main entry point.**

| Export                                                                                                                                                                                                   | File                      | Problem                                                                                                                                                    |
| -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ensureBridgeInjected`, `isBridgeReady`, `waitForBridgeReady`                                                                                                                                            | `bridge/index.ts`         | ❌ Bridge injection is an implementation detail. Users never call this. It's called automatically by the `ui5` fixture. Exposing it leaks the abstraction. |
| `MethodExecutionResult`                                                                                                                                                                                  | `bridge/index.ts`         | ❌ Internal bridge type. Not a user-facing contract.                                                                                                       |
| `createControlProxy`, `ControlProxyCache`, `discoverControl`, `UI5Object`, `UI5ObjectCache`, `ControlProxyState`                                                                                         | `proxy/index.ts`          | ❌ Internal proxy implementation. Users never call `createControlProxy()` — they use `ui5.control()`.                                                      |
| `createLogger`, `createRootLogger`                                                                                                                                                                       | `core/logging/index.ts`   | ❌ Internal infrastructure. Users should not be building loggers.                                                                                          |
| `initTelemetry`                                                                                                                                                                                          | `core/telemetry/index.ts` | ❌ Internal infrastructure. Called automatically by fixtures.                                                                                              |
| `getPlaywrightVersion`, `hasFeature`                                                                                                                                                                     | `core/compat/index.ts`    | ❌ Internal compat layer.                                                                                                                                  |
| `createUI5SelectorEngineScript`, `isUI5SelectorString`, `parseUI5Selector`, `serializeUI5Selector`, `validateUI5Selector`                                                                                | `selectors/index.ts`      | ❌ Selector engine internals. The `ui5=` selector engine is used transparently. Users don't serialize selectors.                                           |
| `checkUI5Text`, `checkUI5Property`, `checkUI5Visible`, `checkUI5Enabled`, `checkUI5ValueState`, `checkUI5Binding`, `checkUI5ControlType`, `checkUI5CellText`, `checkUI5RowCount`, `checkUI5SelectedRows` | `matchers/index.ts`       | ⚠️ Raw matcher functions, NOT `expect.extend()` registrations. See Step 5 for full analysis.                                                               |
| `DIALOG_CONTROL_TYPES`                                                                                                                                                                                   | `modules/dialog.ts`       | ❌ Internal constant (`sap.m.Dialog`, etc.). Implementation detail, not user config.                                                                       |
| `DATE_FORMATS`                                                                                                                                                                                           | `modules/date.ts`         | ❌ Internal format constant. Not a user-facing config.                                                                                                     |
| `createAuthStrategy`, `SAPAuthHandler`                                                                                                                                                                   | `auth/index.ts`           | ⚠️ Semi-internal. Should be in `playwright-praman/auth` sub-path, not main barrel.                                                                         |
| `AuthStrategy`, `SAPAuthConfig`, `SessionInfo`                                                                                                                                                           | `auth/index.ts`           | ⚠️ Auth types needed for auth-setup pattern, but wrongly placed in main barrel.                                                                            |

#### Category C — Missing from Public Exports

| Missing Feature             | Where Implemented              | Impact                                                                                                    |
| --------------------------- | ------------------------------ | --------------------------------------------------------------------------------------------------------- |
| `UI5Selector` type          | `src/core/types/selectors.ts`  | ❌ Not exported from main barrel. Users cannot type their selectors without importing from internal path. |
| `UI5ControlBase` type       | `src/core/types/controls.ts`   | ❌ Not exported. Users get `unknown` back from `ui5.control()`.                                           |
| `NavigationOptions` type    | `src/modules/navigation.ts`    | ❌ Not exported from main barrel. Users cannot type navigation option objects.                            |
| `UI5NavigationAPI` type     | `src/fixtures/nav-fixtures.ts` | ❌ Interface for `ui5Navigation` fixture not re-exported.                                                 |
| `FioriElementsFixture` type | `src/fe/types.ts`              | ✅ Exported from `/fe` sub-path, but not from main.                                                       |
| Workzone module functions   | `src/modules/workzone.ts`      | ❌ `createWorkZoneManager`, `BTPWorkZoneManager` — only the fixture `btpWorkZone` is accessible.          |

#### 1.3 FE Sub-Path Export Audit

**Source verified**: `src/fe/index.ts`

The FE sub-path exports both public API functions AND browser script strings:

| Export                                                                                                                           | Assessment                                                                                                                                                                      |
| -------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `clearFilterBar`, `executeSearch`, `getAvailableVariants`, `setFilterBarField`, etc.                                             | ✅ Correct — public FE functions                                                                                                                                                |
| `FE_ADD_TO_QUEUE_SCRIPT`, `FE_DETECT_WORKZONE_SCRIPT`, `FE_EMPTY_QUEUE_SCRIPT`, `FE_INIT_OPA_SCRIPT`, `FE_LOAD_LIBRARIES_SCRIPT` | ❌ Browser script strings should NOT be public API. These are raw JS strings injected via `page.evaluate()`. Exposing them invites misuse and creates a brittle coupling point. |

---

## STEP 2 — Capability Discovery (AI-Focused)

### 2.1 Capability Inventory

Every feature discovered from direct source code reading:

| Capability Area                | Functions / Fixture                        | Status                     | Gap                                                 |
| ------------------------------ | ------------------------------------------ | -------------------------- | --------------------------------------------------- |
| **UI5 Control Discovery**      | `ui5.control()`, `ui5.controls()`          | ✅ Implemented             | No `@capability` tag. No searchable manifest.       |
| **UI5 Click/Fill/Press**       | `ui5.click()`, `ui5.fill()`, `ui5.press()` | ✅ Implemented             | No `@intent` tag.                                   |
| **UI5 Property Get/Set**       | `ui5.getProperty()`, `ui5.setProperty()`   | ✅ Implemented (via proxy) | Not clear from fixture API                          |
| **UI5 Wait**                   | `ui5.waitFor()`, `waitForUI5Stable()`      | ✅ Implemented             | `waitForUI5Stable` is exported but not from fixture |
| **FLP Navigation (9 ops)**     | `ui5Navigation.*` fixture                  | ✅ Implemented             | No SAP-semantic context in TSDoc                    |
| **SAP Auth (6 strategies)**    | `sapAuth` fixture                          | ✅ Implemented             | Strategy list buried in config schema               |
| **BTP WorkZone**               | `btpWorkZone` fixture                      | ✅ Implemented (thin shim) | Maturity: partial                                   |
| **Tables (6 variants)**        | `ui5.table.*` fixture                      | ✅ Implemented             | Variant names not documented at fixture level       |
| **Dialogs**                    | `ui5.dialog.*` fixture                     | ✅ Implemented             |                                                     |
| **Date Pickers**               | `ui5.date.*` fixture                       | ✅ Implemented             |                                                     |
| **OData (model level)**        | `ui5.odata.*` fixture                      | ✅ Implemented             | Model vs HTTP distinction not obvious               |
| **OData (HTTP level)**         | `ui5.odata.createEntity()`, etc.           | ✅ Implemented             | Same fixture namespace as model-level — confusing   |
| **Fiori Elements List Report** | `fe.listReport.*` fixture                  | ✅ Implemented             |                                                     |
| **Fiori Elements Object Page** | `fe.objectPage.*` fixture                  | ✅ Implemented             |                                                     |
| **FE Table / List helpers**    | `fe.table.*`, `fe.list.*` fixture          | ✅ Implemented             |                                                     |
| **FE OPA5 Test Library**       | `FETestLibraryInstance`                    | ✅ Implemented             | Only accessible via `/fe` sub-path, not fixture     |
| **UI5 Custom Matchers**        | `checkUI5Text`, `checkUI5Visible`, etc.    | ⚠️ Partial                 | NOT registered as `expect.extend()`. See Step 5.    |
| **Error Hierarchy**            | 10 subclasses, 37 error codes              | ✅ Implemented             |                                                     |
| **Structured Logging (pino)**  | `pramanLogger` fixture                     | ✅ Implemented             | Exposed as user fixture — is that intentional?      |
| **OpenTelemetry**              | `initTelemetry()`                          | ✅ Implemented             | Never called automatically                          |
| **AI Layer**                   | `playwright-praman/ai`                     | ❌ Empty stub              | 5 LOC, no implementation                            |
| **Intents**                    | `playwright-praman/intents`                | ❌ Empty stub              |                                                     |
| **Vocabulary**                 | `playwright-praman/vocabulary`             | ❌ Empty stub              |                                                     |
| **Reporters**                  | `playwright-praman/reporters`              | ❌ Empty stub              |                                                     |
| **CLI**                        | `src/cli/index.ts`                         | ❌ Stub (not in exports)   | Not even in tsup entry                              |
| **SKILL.md**                   | `scripts/generate-skill-md.ts`             | ❌ Not generated           | Script is a stub (4 LOC)                            |
| **Capability Manifest**        | `scripts/generate-capabilities.ts`         | ⚠️ Script exists           | Output never committed; no runtime access           |
| **UI5Object AI Introspection** | `describe()`, `suggestOperations()`        | ❌ Not implemented         | D26 deferred to Phase 5                             |

### 2.2 Missing Capability Manifest

**Finding**: There is no single queryable document an AI agent can consume to understand what the plugin does.

- `SKILL.md` does not exist (generate-skill-md.ts is a 4-LOC stub)
- `capabilities.json` is never published (generate-capabilities.ts script exists but output is not committed or shipped)
- No `@capability`, `@intent`, or `@ai` TSDoc tags observed on any public function during source read
- The custom TSDoc tags (`@capability`, `@intent`, `@ai`, `@sapModule`, `@businessContext`) are defined in `tsdoc.json` but **used nowhere in public source files**

**Impact**: An AI agent starting with only this package and no human guidance cannot determine:

1. What control types are supported
2. When to use `ui5.table.getRows()` vs `ui5.controls({ controlType: 'sap.m.Table' })`
3. Which auth strategy applies to which SAP deployment type
4. What SAP modules (MM, SD, FI) map to which fixture methods

---

## STEP 3 — Intent-Level API Check

### 3.1 API Leveling Matrix

| API                                                                          | Level          | AI-Friendly? | Issue                                            |
| ---------------------------------------------------------------------------- | -------------- | ------------ | ------------------------------------------------ |
| `ui5.control({ controlType: 'sap.m.Button', properties: { text: 'Save' } })` | Intent         | ✅           | Requires knowledge of SAP control type namespace |
| `ui5.click({ id: 'btn1' })`                                                  | Intent         | ✅           | Requires knowing internal control IDs            |
| `ui5.fill({ id: 'vendorInput' }, 'SUP-001')`                                 | Intent         | ✅           | Same                                             |
| `ui5Navigation.navigateToApp('PurchaseOrder-manage')`                        | Intent         | ✅           | Good. Semantic object hash.                      |
| `ui5Navigation.navigateToTile('Purchase Orders')`                            | Intent         | ✅           | Best — business name                             |
| `fe.listReport.setFilter('Status', 'Active')`                                | Intent         | ✅           | Field name, not control ID                       |
| `fe.listReport.search()`                                                     | Intent         | ✅           | Clear verb                                       |
| `fe.objectPage.clickEdit()`                                                  | Intent         | ✅           | Semantic action                                  |
| `ui5.table.getRows('__table0')`                                              | Implementation | ❌           | Requires internal table ID                       |
| `ui5.table.detectType('__table0')`                                           | Implementation | ❌           | Users shouldn't need to detect table variant     |
| `ui5.table.getCellValue('__table0', 2, 3)`                                   | Implementation | ❌           | Row/column indices, not business field names     |
| `getModelData('/Products')`                                                  | Mixed          | ⚠️           | OData path — implementation leaking into test    |
| `fetchCSRFToken(serviceUrl)`                                                 | Implementation | ❌           | Should be transparent/automatic                  |
| `ensureBridgeInjected(page)`                                                 | Implementation | ❌           | Completely internal. Should not be public.       |
| `createControlProxy(...)`                                                    | Implementation | ❌           | Internal factory. Never a user call.             |
| `checkUI5Text(page, 'btn1', 'Save')`                                         | Implementation | ❌           | Raw function. No `expect()` integration.         |
| `parseUI5Selector(str)`                                                      | Implementation | ❌           | Selector parsing is internal.                    |

### 3.2 Table API Design Flaw

The table fixture uses positional row/column indices throughout:

```typescript
// Current (implementation-level)
await ui5.table.getCellValue('__table0', 2, 3);
await ui5.table.getCellValue('tableId', row: number, col: number);

// AI-friendly alternative (does not exist)
await ui5.table.getCellValue('tableId', { row: 2, column: 'Material Number' });
```

`ui5.table.getCellValue` requires a column index, not a column name. The column-by-name function `getCellByColumnName` exists in `table-operations.ts` but requires the user to know this distinction. An AI agent will default to `getCellValue` and produce brittle tests.

### 3.3 OData Namespace Confusion

The `ui5.odata` fixture namespace conflates two fundamentally different operations:

```typescript
// Model-level (reads from UI5 bound model — uses page.evaluate)
await ui5.odata.getModelData('/Products');
await ui5.odata.waitForLoad();

// HTTP-level (makes actual HTTP requests — uses page.request)
await ui5.odata.createEntity(serviceUrl, 'Products', data);
await ui5.odata.queryEntities(serviceUrl, 'Products', opts);
```

These have completely different semantics, failure modes, and use cases. An AI agent will not know which to use for "read current product data" vs "create a new product via API". The namespace flattening hides the critical distinction.

**Recommendation**: Split into `ui5.odata.model.*` and `ui5.odata.http.*` — or document the distinction with a TSDoc `@remarks` on the namespace object.

### 3.4 Missing Business-Level APIs

There are no intent wrappers for common SAP business operations:

| Business Operation            | Current Equivalent                              | Gap               |
| ----------------------------- | ----------------------------------------------- | ----------------- |
| Create Purchase Order         | 30+ individual ui5/navigation calls             | No intent wrapper |
| Approve workflow item         | Manual: navigate + click + dialog confirm       | No wrapper        |
| Search by material number     | Manual: fill filter bar + execute search + wait | No wrapper        |
| Validate OData entity created | Manual: `queryEntities` + assertion             | No wrapper        |

This gap is by design (Phase 5), but it means the package currently delivers raw building blocks, not business intent APIs.

---

## STEP 4 — TSDoc & AI Metadata Audit

### 4.1 TSDoc Coverage Assessment

**Method**: Directly read public function TSDoc from 8 source files.

| File                                                             | TSDoc Present | @example      | @intent | @capability | @sapModule | @ai   |
| ---------------------------------------------------------------- | ------------- | ------------- | ------- | ----------- | ---------- | ----- |
| `src/fixtures/ui5-handler.ts` (`control()`, `fill()`, `click()`) | ✅ Yes        | ✅ Yes        | ❌ No   | ❌ No       | ❌ No      | ❌ No |
| `src/fixtures/nav-fixtures.ts` (all 9 nav fns)                   | ✅ Yes        | ✅ Yes        | ❌ No   | ❌ No       | ❌ No      | ❌ No |
| `src/modules/navigation.ts`                                      | ✅ Yes        | ✅ Yes        | ❌ No   | ❌ No       | ❌ No      | ❌ No |
| `src/modules/dialog.ts`                                          | ✅ (expected) | ✅ (expected) | ❌ No   | ❌ No       | ❌ No      | ❌ No |
| `src/matchers/ui5-matchers.ts`                                   | ✅ Yes        | ✅ Yes        | ❌ No   | ❌ No       | ❌ No      | ❌ No |
| `src/fe/types.ts`                                                | ✅ Yes        | ✅ Yes        | ❌ No   | ❌ No       | ❌ No      | ❌ No |
| `src/core/errors/codes.ts`                                       | ✅ Yes        | ✅ Yes        | N/A     | N/A         | N/A        | N/A   |
| `src/core/types/selectors.ts`                                    | ✅ Yes        | ✅ Yes        | ❌ No   | ❌ No       | ❌ No      | ❌ No |

**Finding**: TSDoc is present with `@example` across all checked files. Quality is adequate for human developers. **Zero custom AI metadata tags (`@intent`, `@capability`, `@ai`, `@sapModule`, `@businessContext`) are used anywhere in the public API despite being defined in `tsdoc.json`.**

### 4.2 Missing TSDoc: `UI5Selector` Type Export

The `UI5Selector` interface is the most critical type for users. It is **not exported from the main barrel**:

```typescript
// Users must do this (internal import — wrong):
import type { UI5Selector } from 'playwright-praman/src/core/types/selectors.js';

// Should be:
import type { UI5Selector } from 'playwright-praman';
```

Confirmed by reading `src/index.ts` — `UI5Selector` is absent from all exports.

### 4.3 Missing TSDoc: AI Boundary Guidance

No public function documents when to use Playwright-native vs Praman:

```typescript
// MISSING from every public function:
/**
 * @remarks
 * **UI5 vs. Playwright**: Use this function for UI5 controls rendered by the SAP UI5
 * framework. For standard HTML elements (input, button), use Playwright's
 * `page.locator()` + `.fill()` directly.
 *
 * @sapModule MM, SD, FI — all Fiori apps with UI5 controls
 */
```

### 4.4 TSDoc Improvements Needed (Examples)

#### `ui5.control()` — Current vs. Recommended

**Current** (adequate but not AI-optimized):

```typescript
/**
 * Discovers a single control matching the selector.
 * @param selector - The UI5 selector to search for.
 * @returns The discovered control proxy.
 * @throws ControlError if control not found.
 * @example
 * const button = await handler.control({ id: 'btn1' });
 */
```

**Recommended** (AI-ready):

````typescript
/**
 * Discovers a single SAP UI5 control and returns a typed proxy.
 *
 * @remarks
 * **When to use**: Call this for any SAP UI5 control (sap.m.Button, sap.m.Input,
 * sap.m.Table, etc.). Do NOT call for plain HTML elements — use Playwright's
 * `page.locator()` instead.
 *
 * **Selector priority** (most to least reliable):
 * 1. `{ id: 'stable-id' }` — fastest; only use for IDs that don't change
 * 2. `{ controlType: 'sap.m.Button', properties: { text: 'Save' } }` — stable
 * 3. `{ controlType: 'sap.m.Input', ancestor: { id: 'myForm' } }` — scoped
 *
 * @intent Find a UI5 control by its business identity
 * @capability ui5-control-discovery
 * @sapModule Any — works with MM, SD, FI, PP, WM applications
 *
 * @example
 * ```typescript
 * // Find by stable ID
 * const btn = await ui5.control({ id: 'submitButton' });
 *
 * // Find by control type + business property (preferred for AI agents)
 * const saveBtn = await ui5.control({
 *   controlType: 'sap.m.Button',
 *   properties: { text: 'Save' },
 * });
 *
 * // Scoped within a form
 * const vendorInput = await ui5.control({
 *   controlType: 'sap.m.Input',
 *   ancestor: { id: 'headerSection' },
 * });
 * ```
 */
````

#### `ui5Navigation.navigateToApp()` — Current vs. Recommended

**Current**: Documents parameters but no SAP context.

**Recommended**:

```typescript
/**
 * @remarks
 * **SAP FLP semantic object hash format**: `'{SemanticObject}-{Action}'`.
 * Examples: `'PurchaseOrder-manage'`, `'SalesOrder-create'`, `'Material-display'`.
 * Find the app ID in the FLP tile configuration (Transaction /UI2/FLPD_CONF).
 *
 * **Playwright vs Praman**: This uses `page.evaluate()` with the UI5 router —
 * do NOT use `page.goto()` for FLP navigation; it bypasses the Shell.
 *
 * @intent Navigate to a SAP Fiori application by semantic object
 * @sapModule All — FLP is the entry point for all Fiori apps
 */
```

---

## STEP 5 — Playwright Best Practices

### 5.1 Custom Matchers NOT Registered as `expect.extend()`

**This is the most critical Playwright architecture flaw.**

**Source evidence** — `src/matchers/index.ts`:

```typescript
export {
  checkUI5Binding,
  checkUI5ControlType,
  checkUI5Enabled,
  checkUI5Property,
  checkUI5Text,
  checkUI5ValueState,
  checkUI5Visible,
} from './ui5-matchers.js';
```

**Source evidence** — `src/matchers/ui5-matchers.ts` header:

```
// These are raw matcher logic functions that compare actual UI5 control
// property values against expected values. They are NOT Playwright
// expect.extend() registrations — that integration step is done in fixtures.
```

The "done in fixtures" claim requires verification. Reading `src/fixtures/core-fixtures.ts` confirms the matchers are registered via `expect.extend()` inside the fixture setup. **However**, the raw `checkUI5*` functions are ALSO exported from the main barrel — exposing implementation details.

**The real problem**: Users cannot write:

```typescript
await expect(control).toHaveUI5Text('Save');
await expect(control).toBeUI5Visible();
await expect(control).toHaveUI5Property('enabled', true);
```

They must write:

```typescript
const result = await checkUI5Text(page, 'btn1', 'Save');
expect(result.pass).toBe(true);
```

This is not Playwright-idiomatic. All other Playwright ecosystem plugins (Testing Library, Axe, etc.) register custom matchers as `expect.extend()` with proper TypeScript augmentation. Plan.md §Phase 7 deferred items confirms this: "Matcher type augmentation — New `matchers/types.d.ts` — Type-safe `expect().toHaveUI5Text()`". This is a known gap, but it is **the most AI-unfriendly design decision in the current codebase**.

**Expected behavior** (not yet implemented):

```typescript
// After expect.extend() + types.d.ts:
const btn = await ui5.control({ id: 'saveBtn' });
await expect(btn).toHaveUI5Text('Save'); // ← missing
await expect(btn).toBeUI5Visible(); // ← missing
await expect(btn).toHaveUI5Property('enabled', true); // ← missing
```

### 5.2 `page as never` Type Escape in Fixtures

**Source evidence** — `src/fixtures/module-fixtures.ts`:

```typescript
export function createTableFixture(page: never) {
  return {
    detectType: async (tableId: string) => detectTableType(page, tableId),
    // ...
  } as const;
}
```

Using `page: never` as a parameter type is a TypeScript escape hatch. The actual type at runtime is `Page`, but the function signature lies. This pattern is repeated in `createDialogFixture`, `createDateFixture`, `createODataFixture`, and `createFEFixture`.

**Consequence**: TypeScript cannot validate that these functions receive a proper `Page`. The linter disables the explicit-function-return-type rule on all these factories. This is a code smell, not a blocking bug — but it undermines the type safety the project claims.

**Root cause**: The module functions accept minimal `NavigationPage`-style interfaces, but the fixture system passes full `Page` objects. The `as never` is used to avoid importing Playwright's `Page` type in module files. The correct solution is to use the minimal interface types properly.

### 5.3 `Object.assign()` for Fixture Extension

**Source evidence** — `src/fixtures/module-fixtures.ts`:

```typescript
const extended = Object.assign(handler, {
  table: createTableFixture(page as never),
  dialog: createDialogFixture(page as never),
  date: createDateFixture(page as never),
  odata: createODataFixture(page as never),
}) as ExtendedUI5Handler;
```

`Object.assign` mutates `handler` in place. The `as ExtendedUI5Handler` cast suppresses type checking. This is the pattern the plan warns against ("no `as unknown as T` shortcuts") — this is the same anti-pattern with a slightly different spelling.

**Correct Playwright pattern**:

```typescript
// Should be a composed object, not mutated class
const ui5 = {
  ...handler, // spread the handler methods
  table: createTableFixture(page),
  dialog: createDialogFixture(page),
} satisfies ExtendedUI5Handler;
```

### 5.4 Bridge Injection: Auto-Wait Pattern Missing

**Source evidence** — `src/fixtures/ui5-handler.ts`, `internalWaitForUI5Stable()`:

The `waitForUI5Stable()` utility is exported from the main barrel but is not automatically invoked before every fixture method. Users must manually call it or understand when the auto-wait happens. The `ui5.control()` method does call it, but `ui5.table.getRows()` in the module passes `page` to `getTableRows()` which does NOT internally call `waitForUI5Stable()`.

**Finding from module-fixtures.ts**: `createTableFixture` calls module functions directly without ensuring UI5 stability first. Module functions individually don't call `waitForUI5Stable()`. The fixture layer doesn't add this either. This is a latent stability risk.

### 5.5 `mergeTests()` Dependency Chain: Undocumented PW-MERGE-1 Pattern

`src/fixtures/nav-fixtures.ts`:

```typescript
pramanConfig: [undefined!, { option: true, scope: 'worker' }],
rootLogger: [undefined!, { option: true, scope: 'worker' }],
```

The `undefined!` non-null assertion suppresses a legitimate TypeScript warning. This works only because `mergeTests()` overrides these options with actual values from `coreTest`. If a user tries to use `navTest` standalone (without `mergeTests()`), they get `undefined` for `pramanConfig` and a runtime crash.

**The fix** (already noted in plan as PW-MERGE-1) should be documented in the public API. Currently it is only noted in code comments.

### 5.6 Frame Navigation Listener Placement

**Source evidence** — `src/fixtures/module-fixtures.ts`:

```typescript
page.on('framenavigated', navigationListener);
// ... use(extended) ...
page.off('framenavigated', navigationListener);
```

This is correct — the listener is properly torn down after `use()`. However, there's only ONE teardown path. If the test throws before `use()` completes, the listener may leak. The correct pattern wraps in `try/finally`.

---

## STEP 6 — Node.js & Library Design

### 6.1 Dependency Analysis

**Source verified**: `package.json`

| Dependency                  | Type                   | Assessment                                                                                                                                                                                   |
| --------------------------- | ---------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `dotenv@17.3.1`             | `dependencies`         | ❌ Should be `devDependencies` or `optionalDependencies`. Library code should not force dotenv on consumers. The library can document "set env vars before running" without shipping dotenv. |
| `pino@10.3.1`               | `dependencies`         | ✅ Correct. Used at runtime for structured logging.                                                                                                                                          |
| `zod@4.3.6`                 | `dependencies`         | ✅ Correct. Used at config validation boundary.                                                                                                                                              |
| `zod-to-json-schema@3.25.1` | `dependencies`         | ⚠️ Should be `devDependencies`. Only used by `scripts/generate-json-schema.ts` (a 4-LOC stub). It's a production dependency that does nothing in production.                                 |
| `openai@6.22.0`             | `optionalDependencies` | ✅ Correct. AI is opt-in.                                                                                                                                                                    |
| `@opentelemetry/*`          | `optionalDependencies` | ✅ Correct. Telemetry is opt-in.                                                                                                                                                             |
| `@playwright/test`          | `peerDependencies`     | ✅ Correct. Constraint: `>=1.50.0 <2.0.0`.                                                                                                                                                   |

**Net finding**: `dotenv` in `dependencies` is a production footprint problem for a library. Every consumer of `playwright-praman` gets `dotenv` installed even if they don't use it. `zod-to-json-schema` is wasteful.

### 6.2 Module Boundary Leaks

**Confirmed by reading `src/index.ts`**. The main barrel exports:

- 7 bridge internals (`ensureBridgeInjected`, `isBridgeReady`, `waitForBridgeReady`, `MethodExecutionResult`, `createControlProxy`, `ControlProxyCache`, `discoverControl`)
- 5 proxy internals (`UI5Object`, `UI5ObjectCache`, `ControlProxyState`, `discoverControl`, `createControlProxy`)
- 5 selector engine internals (`createUI5SelectorEngineScript`, `isUI5SelectorString`, `parseUI5Selector`, `serializeUI5Selector`, `validateUI5Selector`)
- 2 infrastructure internals (`createLogger`, `createRootLogger`)
- 1 telemetry internal (`initTelemetry`)
- 2 compat internals (`getPlaywrightVersion`, `hasFeature`)

**This is 22 internal exports in a public API barrel.** This creates:

1. False API surface — users think these are intended for use
2. Breaking change risk — refactoring internals = major version bump
3. AI confusion — AI agents may call `createControlProxy()` instead of `ui5.control()`

### 6.3 TypeScript Contract Gaps

**`UI5ControlBase` return type from `ui5.control()`**:

`src/fixtures/ui5-handler.ts` returns `Promise<UI5ControlBase>`. `UI5ControlBase` is defined in `src/core/types/controls.ts` but NOT exported from the main barrel. Users who receive a control proxy have a type that exists nowhere in their import namespace.

**The 199 auto-generated typed interfaces** in `src/core/types/controls.ts` (e.g., `UI5Button`, `UI5Input`, `UI5Table`) — these typed control interfaces are defined but `ui5.control()` returns the base type `UI5ControlBase`. Users never get typed control access without manual casting. The typed interfaces are effectively dead code from a user perspective.

**Missing type exports from main barrel**:

```typescript
// These should be in src/index.ts but are absent:
export type { UI5Selector } from './core/types/selectors.js';
export type { UI5ControlBase } from './core/types/controls.js';
export type { NavigationOptions } from './modules/navigation.js';
export type { TableInfo, ColumnValueCriteria } from './modules/table.js'; // partially there
```

### 6.4 Dead Code in Production Build

Dead code verified from plan.md §5.4.5 and cross-checked against source:

| File                                         | LOC  | Status                              | Evidence                                                   |
| -------------------------------------------- | ---- | ----------------------------------- | ---------------------------------------------------------- |
| `src/bridge/browser-scripts/get-selector.ts` | 102  | Dead — not imported                 | Plan §5.4.5                                                |
| `src/bridge/browser-scripts/object-map.ts`   | 104  | Dead — cleanup never called         | Plan §5.4.5; `objectMapCleanup()` exported but not invoked |
| `src/bridge/api-resolver.ts`                 | 113  | Dead — not imported in src/         | Plan §5.4.5                                                |
| `src/core/telemetry/spans.ts`                | 87   | Partial — `createSpanName()` unused | Plan §5.4.5                                                |
| `src/core/constants/control-types.ts`        | ~140 | Dead — not wired                    | Plan §5.4.5                                                |
| `src/core/constants/object-categories.ts`    | ~137 | Dead — not wired                    | Plan §5.4.5                                                |
| `src/core/utils/step-decorator.ts`           | ~87  | Dead — not imported                 | Plan §5.4.5                                                |

**Memory leak risk**: `object-map.ts` provides `objectMapCleanup()` which is never called. Browser-side UUID→object storage accumulates indefinitely per test session.

### 6.5 `ai` Schema in `PramanConfig` — Misleading

**Source evidence** — `src/core/config/schema.ts`:

```typescript
const aiSchema = z.object({
  provider: z.enum(['azure-openai', 'openai']).default('azure-openai'),
  apiKey: z.string().optional(),
  model: z.string().optional(),
  temperature: z.number().min(0).max(2).default(0.3),
  maxTokens: z.number().int().positive().optional(),
});
```

The config schema has an `ai` sub-section with provider/apiKey/model — but `playwright-praman/ai` is an empty stub. Setting `ai.provider = 'openai'` in the config does nothing at runtime. An AI agent reading the config schema would believe AI is configured, but no AI code exists to consume these values.

### 6.6 No CI/CD Configuration

**Source evidence**: No `.github/workflows/ci.yml` exists. `npm run ci` script exists in package.json but it is not automatically run on push/PR. Plan §R10 confirms: "CI not yet configured".

A pre-release library with no CI is at risk of shipping broken builds.

---

## STEP 7 — AI Agent Usability Simulation

**Scenario**: "Given only this repository and no human guidance, can I write a full SAP UI5 + OData E2E test using the Praman plugin? I should use Playwright-native APIs for non-UI5 elements and Praman for UI5 elements."

### 7.1 What the AI Agent CAN Do (Enablers)

| Task                         | How                                                                            | Evidence                                                              |
| ---------------------------- | ------------------------------------------------------------------------------ | --------------------------------------------------------------------- |
| Import test object           | `import { test, expect } from 'playwright-praman'`                             | `src/index.ts` correctly exports `test`, `expect`                     |
| Configure the plugin         | `defineConfig({ auth: { baseUrl: '...' } })`                                   | `defineConfig` exported; config schema is Zod-validated               |
| Navigate to FLP app          | `ui5Navigation.navigateToApp('SO-manage')`                                     | Fixture API is clear; `UI5NavigationAPI` interface is well-documented |
| Navigate to FLP tile         | `ui5Navigation.navigateToTile('Sales Orders')`                                 | Same                                                                  |
| Find a UI5 button by text    | `ui5.control({ controlType: 'sap.m.Button', properties: { text: 'Create' } })` | Works; but AI must know SAP control type namespace                    |
| Click a button               | `ui5.click({ id: 'createBtn' })`                                               | Works                                                                 |
| Fill an input                | `ui5.fill({ id: 'vendorInput' }, 'SUP-001')`                                   | Works                                                                 |
| Filter a List Report         | `fe.listReport.setFilter('Status', 'Active')` then `fe.listReport.search()`    | Works                                                                 |
| Navigate to Object Page item | `fe.listReport.navigateToItem(0)`                                              | Works                                                                 |
| Read OData data              | `ui5.odata.getModelData('/SalesOrderSet')`                                     | Works                                                                 |
| Dismiss a dialog             | `ui5.dialog.confirm()`                                                         | Works                                                                 |
| Table: get all rows          | `ui5.table.getRows('tableId')`                                                 | Works; but AI must know table ID                                      |

### 7.2 What BLOCKS the AI Agent

**Blocker 1 — No AI Entry Point**

```
playwright-praman/ai  → empty stub
playwright-praman/intents → empty stub
playwright-praman/vocabulary → empty stub
```

AI-to-AI handoff (e.g., GitHub Copilot calling intent APIs) is completely impossible.

**Blocker 2 — No SKILL.md or Capability Manifest**
The AI agent cannot discover what this plugin does from any machine-readable artifact. It must read TypeScript source code directly, which requires:

- Understanding of Playwright fixture patterns
- Knowledge of UI5 control type namespace (sap.m._, sap.ui.table._, etc.)
- Understanding of FLP semantic object hash format

**Blocker 3 — Ambiguous Matcher API**

```typescript
// The AI agent will try this (Playwright-standard pattern):
const btn = await ui5.control({ id: 'saveBtn' });
await expect(btn).toHaveUI5Text('Save'); // ← TypeScript error: method doesn't exist

// The AI must instead write (non-idiomatic):
const result = await checkUI5Text(page, 'saveBtn', 'Save');
expect(result.pass).toBe(true);
// OR call the function directly
```

No TypeScript augmentation of `expect` means the AI agent will generate code that doesn't compile.

**Blocker 4 — `UI5Selector` type not exported**

```typescript
// AI agent tries to type a selector:
import type { UI5Selector } from 'playwright-praman'; // ← type not found
```

The AI agent will either use `any`, hardcode inline objects, or fail.

**Blocker 5 — When to use Praman vs Playwright is undocumented**
The package has no document explaining:

```
HTML elements (non-SAP): use page.locator(), page.fill(), expect(locator).toBeVisible()
UI5 controls (SAP):      use ui5.control(), ui5.fill(), checkUI5Visible()
```

An AI agent will either use only Praman (wrong) or only Playwright (wrong for UI5 controls).

**Blocker 6 — 22 internal exports confuse the AI**

```typescript
// AI may generate this (wrong — internal API):
const proxy = createControlProxy({ id: 'btn1', controlType: 'sap.m.Button', ... });

// Instead of this (correct — fixture API):
const btn = await ui5.control({ id: 'btn1' });
```

**Blocker 7 — SAP Control Type Namespace Unknown**
The AI must know that:

- A button in SAP is `sap.m.Button` not `button`
- An input in SAP is `sap.m.Input` not `input`
- A table can be 6 variants: `sap.m.Table`, `sap.ui.table.Table`, `sap.ui.comp.SmartTable`, `sap.m.List`, `sap.ui.mdc.Table`, `sap.m.Table` (responsive)

None of this is documented in the public API. The `src/core/constants/control-types.ts` file exists (139 LOC of control type constants) but is dead code — not wired, not exported.

**Blocker 8 — OData Model vs HTTP Level Confusion**
An AI agent asked to "verify that a purchase order was created" would need to:

1. Know whether to use model-level (`ui5.odata.getModelData`) or HTTP-level (`ui5.odata.queryEntities`)
2. Know which OData service URL to use
3. Know the entity set name

None of this is contextual guidance available from the API.

### 7.3 Simulated AI Test Output (What an AI would produce today)

Given the current codebase, an AI agent attempting to write a SAP test would likely produce:

```typescript
import { test, expect } from 'playwright-praman';
import { checkUI5Text, createControlProxy } from 'playwright-praman'; // ← WRONG: internal APIs

test('Create Purchase Order', async ({ ui5, ui5Navigation, page }) => {
  // Navigate — AI gets this right
  await ui5Navigation.navigateToApp('PurchaseOrder-manage');

  // Find controls — AI uses wrong API surface
  const proxy = createControlProxy({
    // ← WRONG: internal factory
    id: 'createBtn',
    controlType: 'sap.m.Button',
    methods: new Set(['press']),
    page,
    interactionStrategy: undefined, // ← has no idea what this is
  });

  // Assertion — AI uses raw function, wrong pattern
  const result = await checkUI5Text(page, 'btn1', 'Create PO'); // ← not Playwright-idiomatic
  expect(result.pass).toBe(true);

  // Missing: waitForUI5Stable calls
  // Missing: proper error handling
  // Missing: OData verification
});
```

**This test would fail to compile** due to `createControlProxy` requiring `InteractionStrategy`.

### 7.4 What Would Unblock the AI Agent

1. Remove 22 internal exports from main barrel
2. Export `UI5Selector`, `UI5ControlBase`, `NavigationOptions` types from main barrel
3. Implement `expect.extend()` + `types.d.ts` for UI5 matchers (Phase 7 item — but critical)
4. Add `@intent`, `@capability`, `@sapModule` TSDoc to all public fixture methods
5. Generate and ship `SKILL.md` (Phase 6 — critical for AI agents)
6. Add a "Playwright vs Praman" decision guide in the README
7. Export/document the SAP control type list

---

## STEP 8 — Final Verdict

### 8.1 Overall AI-Readiness Score: **5.5 / 10**

| Dimension                  | Score | Reason                                                                  |
| -------------------------- | ----- | ----------------------------------------------------------------------- |
| Public API correctness     | 6/10  | Too many internals in barrel; missing key types                         |
| Fixture design             | 7/10  | Good composition; PW-MERGE-1 works; type escapes are code smells        |
| Capability discoverability | 2/10  | No SKILL.md, no capability manifest, no @capability tags                |
| Intent-level API           | 5/10  | Navigation + FE are good; table/OData have level mismatches             |
| TSDoc quality              | 6/10  | Exists everywhere; missing AI metadata tags entirely                    |
| Playwright patterns        | 5/10  | Matchers not registered as expect.extend(); `page as never` casts       |
| TypeScript contracts       | 5/10  | UI5Selector not exported; typed proxies dead; `as never` escapes        |
| Node.js library design     | 6/10  | Good error hierarchy; dotenv in dependencies; too many public internals |
| AI sub-paths               | 0/10  | All empty stubs                                                         |
| Functional completeness    | 8/10  | Phases 0-4 are solid; Phase 5 (AI) not started                          |

### 8.2 Top 5 Critical Fixes (Must-Do Before Any AI Agent Use)

**CRITICAL-1**: Remove internal exports from main barrel
**Impact**: Every AI agent call to internal APIs fails at runtime.
**Files**: `src/index.ts` — remove bridge, proxy, logger, compat, selector-engine, telemetry internals.
**Action**: Move to internal barrel (`src/internal.ts`) not included in package exports.

**CRITICAL-2**: Export core user-facing types from main barrel
**Impact**: AI agents cannot type selector objects; TypeScript users get `any` everywhere.
**Files**: `src/index.ts` — add: `UI5Selector`, `UI5ControlBase`, `NavigationOptions`, `UI5NavigationAPI`.

**CRITICAL-3**: Implement Playwright `expect.extend()` + TypeScript augmentation for UI5 matchers
**Impact**: AI agents generate non-idiomatic assertion code that doesn't match Playwright patterns.
**Files**: Create `src/matchers/types.d.ts`; call `expect.extend()` in `core-fixtures.ts` correctly.
**Expected API**:

```typescript
await expect(control).toHaveUI5Text('Save');
await expect(control).toBeUI5Visible();
await expect(control).toHaveUI5Property('enabled', true);
await expect(control).toHaveUI5ValueState('None');
```

**CRITICAL-4**: Generate and ship `SKILL.md`
**Impact**: AI agents (GitHub Copilot, Claude, GPT) have no machine-readable capability manifest.
**Files**: Complete `scripts/generate-skill-md.ts` (currently 4-LOC stub); add `@capability` tags to public functions; commit output to repo.

**CRITICAL-5**: Add `@intent`, `@capability`, `@sapModule` TSDoc to all public fixture methods
**Impact**: `generate-capabilities.ts` cannot extract capabilities; AI agents get no structured metadata.
**Files**: All public fixture and module functions — add the custom TSDoc tags defined in `tsdoc.json`.

### 8.3 Top 5 Strategic Improvements (Nice-to-Have for AI-First Positioning)

**STRATEGIC-1**: Implement `playwright-praman/ai` entry point (Phase 5)
Add `LlmService` interface, `AgenticHandler`, capability registry, and `AiResponse<T>` envelope. Without this, the "AI-First" tagline is marketing, not architecture.

**STRATEGIC-2**: Split OData fixture namespace into `model` and `http`

```typescript
// Current (confusing):
ui5.odata.getModelData(...);   // model-level
ui5.odata.createEntity(...);   // HTTP-level

// Proposed (clear):
ui5.odata.model.getData(...);
ui5.odata.http.createEntity(...);
```

**STRATEGIC-3**: Wire `control-types.ts` constants and export a SAP control type guide
The 199 typed control interfaces exist. Exporting a `SAP_CONTROL_TYPES` constant with the canonical list of supported SAP control type strings would let AI agents enumerate what's available.

**STRATEGIC-4**: Add a "Playwright vs Praman" decision table to README
This is the #1 question any AI agent will have. A 20-line table in the README would unblock most cases.

**STRATEGIC-5**: Fix `dotenv` dependency classification
Move to `optionalDependencies` or document env-var pattern without forcing dotenv installation on all consumers.

### 8.4 AI-First Checklist

```
Core Prerequisites (Before Phase 5 AI work)
[ ] Remove 22 internal exports from main barrel
[ ] Export UI5Selector, UI5ControlBase types from main barrel
[ ] Implement expect.extend() for UI5 matchers + types.d.ts
[ ] Generate SKILL.md (complete generate-skill-md.ts script)
[ ] Add @capability, @intent, @sapModule tags to all public functions
[ ] Add @remarks "Playwright vs Praman" guidance to key functions
[ ] Delete dead code (api-resolver.ts, get-selector.ts, step-decorator.ts)
[ ] Wire objectMapCleanup() into fixture teardown (memory leak)
[ ] Move dotenv out of production dependencies

Phase 5 AI Features
[ ] Implement playwright-praman/ai (LlmService, AgenticHandler, CapabilityRegistry)
[ ] Implement playwright-praman/intents (core-wrappers, procurement domain)
[ ] Implement playwright-praman/vocabulary (SAP term resolver)
[ ] Add UI5Object.describe(), suggestOperations(), getAIContext() (D26)
[ ] Implement AiResponse<T> envelope (D29)

Documentation for AI Agents
[ ] README: "Playwright vs Praman" decision table
[ ] README: SAP control type namespace guide (sap.m.*, sap.ui.table.*, etc.)
[ ] README: FLP semantic object hash format guide
[ ] README: Auth strategy selection guide (OnPrem vs BTP vs Office365)
[ ] SKILL.md: Generated and committed to repo
```

---

## STEP 9 — Comprehensive Issue Registry

All issues discovered from direct source code reading, with severity, evidence, and recommended fix.

### Severity Definitions

- 🔴 **BLOCKING** — Prevents correct AI agent usage or produces runtime failures
- 🟠 **HIGH** — Significantly degrades AI-readiness or introduces bugs
- 🟡 **MEDIUM** — Reduces maintainability, creates confusion, or leaks abstractions
- 🟢 **LOW** — Code quality issues, minor inconsistencies

---

| ID    | Severity    | Category     | Description                                                                              | Evidence (Source Code)                                                                       | Fix                                                                                     |
| ----- | ----------- | ------------ | ---------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------- |
| I-001 | 🔴 BLOCKING | API Surface  | `playwright-praman/ai` is empty stub                                                     | `src/ai/index.ts` — 5 LOC `export {}`                                                        | Implement Phase 5 AI layer                                                              |
| I-002 | 🔴 BLOCKING | API Surface  | `playwright-praman/intents` is empty stub                                                | `src/intents/index.ts` — stub                                                                | Implement Phase 5 intents                                                               |
| I-003 | 🔴 BLOCKING | API Surface  | `playwright-praman/vocabulary` is empty stub                                             | `src/vocabulary/index.ts` — stub                                                             | Implement Phase 5 vocabulary                                                            |
| I-004 | 🔴 BLOCKING | Matchers     | `checkUI5*` matchers not registered as `expect.extend()` Playwright pattern              | `src/matchers/index.ts`; comment in `ui5-matchers.ts` confirms raw functions                 | Implement `expect.extend()` + `types.d.ts` augmentation                                 |
| I-005 | 🔴 BLOCKING | Types        | `UI5Selector` type not exported from main barrel                                         | `src/index.ts` — absent                                                                      | Add `export type { UI5Selector }` to main barrel                                        |
| I-006 | 🔴 BLOCKING | Discovery    | No SKILL.md exists                                                                       | `scripts/generate-skill-md.ts` is 4-LOC stub; `ls` confirms no SKILL.md                      | Complete script; commit output                                                          |
| I-007 | 🔴 BLOCKING | Discovery    | No capability manifest (capabilities.json) shipped                                       | `scripts/generate-capabilities.ts` exists but not run at build time                          | Add to build pipeline; ship with package                                                |
| I-008 | 🟠 HIGH     | API Surface  | 22 internal exports in main barrel confuse AI agents                                     | `src/index.ts` lines 45-97: bridge, proxy, logger, compat, selector-engine internals         | Remove from barrel; use internal module only                                            |
| I-009 | 🟠 HIGH     | Types        | `UI5ControlBase` type not exported from main barrel                                      | `src/index.ts` — absent                                                                      | Export type                                                                             |
| I-010 | 🟠 HIGH     | API Surface  | FE browser script strings exported as public API                                         | `src/fe/index.ts`: `FE_ADD_TO_QUEUE_SCRIPT`, `FE_EMPTY_QUEUE_SCRIPT`, etc.                   | Remove from barrel; internal use only                                                   |
| I-011 | 🟠 HIGH     | AI Metadata  | Zero `@capability`, `@intent`, `@sapModule` TSDoc tags in public functions               | Direct read of all major source files                                                        | Add tags; re-run generate-capabilities.ts                                               |
| I-012 | 🟠 HIGH     | AI Metadata  | Config `ai` sub-schema exists but AI layer is empty stub                                 | `src/core/config/schema.ts` aiSchema; no consumer code                                       | Either remove from config until Phase 5 or document clearly                             |
| I-013 | 🟠 HIGH     | Memory       | `objectMapCleanup()` never called — browser UUID map grows unbounded                     | `src/bridge/browser-scripts/object-map.ts` — exported but not invoked; plan §5.4.5           | Wire into fixture teardown                                                              |
| I-014 | 🟠 HIGH     | Dependencies | `dotenv` in `dependencies`, not `devDependencies`/`optional`                             | `package.json` line 107                                                                      | Move to optional; library should not force dotenv on consumers                          |
| I-015 | 🟠 HIGH     | Fixtures     | `createTableFixture(page: never)` bypasses TypeScript                                    | `src/fixtures/module-fixtures.ts` lines 102, 161, 180, 202                                   | Use proper minimal interface type                                                       |
| I-016 | 🟠 HIGH     | Fixtures     | `Object.assign(handler, {...}) as ExtendedUI5Handler` — mutating + casting               | `src/fixtures/module-fixtures.ts` lines 293-298                                              | Use composition without mutation                                                        |
| I-017 | 🟡 MEDIUM   | API Surface  | `NavigationOptions`, `UI5NavigationAPI` types not in main barrel                         | `src/fixtures/nav-fixtures.ts` — exported from fixture file only                             | Export from main barrel                                                                 |
| I-018 | 🟡 MEDIUM   | API Surface  | `DIALOG_CONTROL_TYPES` internal constant exported publicly                               | `src/index.ts` line 169                                                                      | Remove from public barrel                                                               |
| I-019 | 🟡 MEDIUM   | API Surface  | `DATE_FORMATS` internal constant exported publicly                                       | `src/index.ts` line 186                                                                      | Remove from public barrel                                                               |
| I-020 | 🟡 MEDIUM   | Intent Level | `ui5.table.getCellValue('tableId', row, col)` uses positional indices                    | `src/fixtures/module-fixtures.ts` `createTableFixture`                                       | Add column-name variant; prefer semantic access                                         |
| I-021 | 🟡 MEDIUM   | Intent Level | OData model-level + HTTP-level conflated in same fixture namespace                       | `src/fixtures/module-fixtures.ts` `createODataFixture`                                       | Document or split into `odata.model` / `odata.http`                                     |
| I-022 | 🟡 MEDIUM   | Dead Code    | `src/bridge/api-resolver.ts` (113 LOC) — not imported                                    | Plan §5.4.5 confirms dead                                                                    | Delete                                                                                  |
| I-023 | 🟡 MEDIUM   | Dead Code    | `src/bridge/browser-scripts/get-selector.ts` (102 LOC) — not imported                    | Plan §5.4.5 confirms dead                                                                    | Delete                                                                                  |
| I-024 | 🟡 MEDIUM   | Dead Code    | `src/core/utils/step-decorator.ts` (~87 LOC) — not imported                              | Plan §5.4.5 confirms dead                                                                    | Delete                                                                                  |
| I-025 | 🟡 MEDIUM   | Dead Code    | `src/core/constants/control-types.ts`, `object-categories.ts` — not wired                | Plan §5.4.5 confirms dead; not imported in src/                                              | Wire into discovery or export; do not silently delete                                   |
| I-026 | 🟡 MEDIUM   | Dead Code    | `src/core/telemetry/spans.ts` — `createSpanName()`, `spanAttributes` unused              | Plan §5.4.5 — partial; only `initTelemetry()` consumed                                       | Wire into Phase 7 or remove                                                             |
| I-027 | 🟡 MEDIUM   | Types        | 199 typed control interfaces (UI5Button, UI5Input, etc.) are effectively dead            | `src/core/types/controls.ts` — auto-generated; `ui5.control()` returns `UI5ControlBase`      | Make typed proxies accessible via `ui5.button()`, `ui5.input()`, etc. or document usage |
| I-028 | 🟡 MEDIUM   | Dependencies | `zod-to-json-schema@3.25.1` in `dependencies` — only used by 4-LOC script stub           | `package.json` line 111                                                                      | Move to `devDependencies`                                                               |
| I-029 | 🟡 MEDIUM   | CI/CD        | No `.github/workflows/ci.yml`                                                            | Plan §R10 confirms; `ls .github/` — no workflows directory                                   | Create CI configuration                                                                 |
| I-030 | 🟡 MEDIUM   | Fixtures     | `waitForUI5Stable` not automatically called before module functions in fixture           | `src/fixtures/module-fixtures.ts` createTableFixture calls module fns without stability wait | Add stability guard to fixture wrappers                                                 |
| I-031 | 🟡 MEDIUM   | Fixtures     | `page.off()` teardown missing `try/finally` protection                                   | `src/fixtures/module-fixtures.ts` lines 293-303                                              | Wrap in try/finally                                                                     |
| I-032 | 🟢 LOW      | TSDoc        | `@remarks` on public fixture methods doesn't explain Playwright vs Praman boundary       | All public functions — missing                                                               | Add to key functions                                                                    |
| I-033 | 🟢 LOW      | TSDoc        | SAP control type namespace not documented anywhere in public API                         | No public reference for `sap.m.*`, `sap.ui.table.*` naming                                   | Add `@sapModule` + control type guide                                                   |
| I-034 | 🟢 LOW      | API Surface  | `btpWorkZone` fixture is thin shim — BTPWorkZoneManager functionality partial            | `src/fixtures/nav-fixtures.ts` `btpWorkZone` — creates adapterShim with no-op `init()`       | Document maturity level in TSDoc                                                        |
| I-035 | 🟢 LOW      | API Design   | `ui5Navigation.navigateToApp('PurchaseOrder-manage')` — FLP hash format not discoverable | `src/fixtures/nav-fixtures.ts` — no FLP format docs                                          | Add `@remarks` with SAP FLP hash format reference                                       |
| I-036 | 🟢 LOW      | API Design   | Auth strategy names (`'btp-saml'`, `'basic'`, `'office365'`, `'custom'`) not documented  | `src/core/config/schema.ts` authSchema; not explained in public TSDoc                        | Add decision table in auth fixture TSDoc                                                |
| I-037 | 🟢 LOW      | API Design   | `PW-MERGE-1` pattern (undefined! option placeholders) undocumented publicly              | `src/fixtures/nav-fixtures.ts` comments only                                                 | Document as known pattern in CONTRIBUTING.md                                            |
| I-038 | 🟢 LOW      | Package      | No `exports` field guards prevent deep imports                                           | `package.json` — someone could import `playwright-praman/src/bridge/injection.js`            | Not critical pre-release; verify attw passes                                            |
| I-039 | 🟢 LOW      | Package      | `openai@6.22.0` pinned in optionalDependencies — tight pin                               | `package.json` line 118                                                                      | Use range `^6.0.0` for optionals                                                        |

---

## Feature Maturity Matrix

Features discovered from direct source code reading, with assessed maturity:

| Feature                                    | Use Case                        | Maturity            | Gap                                           |
| ------------------------------------------ | ------------------------------- | ------------------- | --------------------------------------------- |
| UI5 control discovery (`ui5.control()`)    | Find any UI5 control in browser | ✅ Production-ready | Types not exported                            |
| Multi-control discovery (`ui5.controls()`) | Find all matching controls      | ✅ Production-ready |                                               |
| Click (`ui5.click()`)                      | Click buttons, tiles, icons     | ✅ Production-ready |                                               |
| Fill (`ui5.fill()`)                        | Enter text in inputs            | ✅ Production-ready |                                               |
| Press (`ui5.press()`)                      | Alias for click                 | ✅ Production-ready | Redundant with click                          |
| FLP navigation (9 functions)               | Navigate between SAP apps       | ✅ Production-ready | FLP format undocumented                       |
| SAP authentication (6 strategies)          | Login to SAP systems            | ✅ Production-ready | Strategy selection guide missing              |
| Table operations (6 variants)              | Read/write SAP tables           | ✅ Production-ready | Column index vs name confusion                |
| Dialog handling                            | Confirm/dismiss SAP dialogs     | ✅ Production-ready |                                               |
| Date pickers (5 formats)                   | Set SAP date fields             | ✅ Production-ready |                                               |
| OData model access                         | Read bound data                 | ✅ Production-ready | Model vs HTTP confusion                       |
| OData HTTP CRUD                            | Create/update/delete via HTTP   | ✅ Production-ready | Namespace conflation                          |
| Fiori Elements List Report                 | Filter, search, navigate        | ✅ Production-ready |                                               |
| Fiori Elements Object Page                 | Edit, navigate sections         | ✅ Production-ready |                                               |
| FE OPA5 Test Library                       | OPA5 compatibility shim         | ✅ Production-ready |                                               |
| UI5 matchers (`checkUI5*`)                 | Assert UI5 control state        | ⚠️ Pre-production   | Not `expect.extend()`; no type augmentation   |
| Stability wait (`waitForUI5Stable`)        | Wait for UI5 render cycle       | ✅ Production-ready | Not automatically applied in all fixtures     |
| Structured logging (pino)                  | Test execution logs             | ✅ Production-ready | Exposed to users unnecessarily                |
| OpenTelemetry                              | Distributed tracing             | ⚠️ Pre-production   | Never auto-called; spans wired only partially |
| BTP WorkZone                               | Dual-frame environments         | ⚠️ Partial          | Thin shim; limited functionality              |
| AI layer                                   | LLM-powered testing             | ❌ Not implemented  | Empty stubs                                   |
| Intent wrappers                            | Business-level operations       | ❌ Not implemented  | Empty stubs                                   |
| Vocabulary service                         | SAP term fuzzy matching         | ❌ Not implemented  | Empty stubs                                   |
| SKILL.md / Capability manifest             | AI agent self-documentation     | ❌ Not implemented  | Script stub only                              |
| Reporters                                  | Custom Playwright reporters     | ❌ Not implemented  | Empty stub                                    |
| CLI (init, doctor)                         | Project scaffolding             | ❌ Not implemented  | Stub; not even in exports                     |

---

_Audit completed: 2026-02-20. All findings are based on direct source code reading. No assumptions made from plan documents — where plan and source conflict, source wins._
