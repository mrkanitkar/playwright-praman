# Plan 3 — Remaining Gap Analysis & Fix Proposals

> **Date**: 2026-02-18
> **Scope**: All remaining gaps after Phase 3 architecture simplification
> **Reference**: plan3.md Section 15.8 (post-simplification gap analysis)

---

## 1. Gap Inventory

### 1.1 Functional Gaps

| #   | Gap                                                      | Severity   | Current State                                                                                                                                                                                                           | Target Phase |
| --- | -------------------------------------------------------- | ---------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------ |
| G1  | Shell/footer handlers bypass UI5Handler                  | GAP-MEDIUM | `shell-handler.ts` and `footer-handler.ts` use raw `page.evaluate()` with DOM selectors. Works but bypasses bridge discovery and interaction strategy.                                                                  | Phase 4      |
| G2  | `fireEvent` not on InteractionStrategy                   | GAP-MEDIUM | `InteractionStrategy` interface defines `press`/`enterText`/`select` but not `fireEvent()`. Strategy implementations internally call `ctrl.fireChange()` but there is no public entry point for arbitrary event firing. | Phase 4      |
| G3  | `selectComboBoxByText(selector, text)`                   | GAP-MEDIUM | Not implemented. ComboBox selection by display text (not key) is required for common Fiori flows.                                                                                                                       | Phase 4      |
| G4  | `openValueHelpAndPick(selector, value)`                  | GAP-MEDIUM | Not implemented. ValueHelp dialog interaction needed for Fiori master-detail patterns.                                                                                                                                  | Phase 4      |
| G5  | `type(selector, text, options?)` char-by-char            | GAP-LOW    | Not implemented. Some input controls require character-by-character keyboard simulation.                                                                                                                                | Phase 4      |
| G6  | `hover(selector)` / `focus(selector)` / `blur(selector)` | GAP-LOW    | Not implemented. DOM-level focus management for controls.                                                                                                                                                               | Phase 4      |
| G7  | `pressKey(key)`                                          | GAP-LOW    | Not implemented. Single-key press for keyboard shortcuts.                                                                                                                                                               | Phase 4      |
| G8  | `getNavigationHistory(page)`                             | GAP-LOW    | Not implemented in navigation module.                                                                                                                                                                                   | Phase 4      |
| G9  | `openNotifications()`                                    | GAP-LOW    | Shell notification panel opener not in shell-handler.ts.                                                                                                                                                                | Phase 4      |

### 1.2 Code Quality Gaps

| #   | Gap                             | Severity | Location                                 | Detail                                                                                             |
| --- | ------------------------------- | -------- | ---------------------------------------- | -------------------------------------------------------------------------------------------------- |
| Q1  | Orphan: `discovery.ts`          | INFO     | `src/proxy/discovery.ts`                 | Exported from barrel but not imported by any source file. UI5Handler has its own inline discovery. |
| Q2  | Orphan: `discovery-factory.ts`  | INFO     | `src/proxy/discovery-factory.ts`         | Only imported by `discovery.ts` (which is itself orphaned).                                        |
| Q3  | Stale TSDoc reference           | INFO     | `src/matchers/ui5-matchers.ts:71`        | Comment references `ClassicUI5Adapter.getControlProperty()` — adapter no longer exists.            |
| Q4  | `as string` casts in UI5Handler | LOW      | `src/fixtures/ui5-handler.ts:440,457`    | `getText()` and `getValue()` cast `unknown` to `string` without runtime validation.                |
| Q5  | `as unknown as` double cast     | MEDIUM   | `src/fixtures/stability-fixtures.ts:132` | `page as unknown as Parameters<typeof waitForUI5Stable>[0]` — type incompatibility workaround.     |
| Q6  | `as MethodExecutionResult` cast | LOW      | `src/proxy/control-proxy.ts:268`         | Bridge result typed as `unknown` by Playwright, cast needed. Has eslint-disable comment.           |
| Q7  | `as string` cast in navigation  | LOW      | `src/modules/navigation.ts:310`          | `getCurrentHash()` casts `page.evaluate()` return.                                                 |

---

## 2. Best Practice Violations Check

### 2.1 Playwright Best Practices

| Check                         | Result | Detail                                                                                                                |
| ----------------------------- | ------ | --------------------------------------------------------------------------------------------------------------------- |
| No `page.waitForTimeout()`    | PASS   | Zero occurrences in source. Only referenced in `wait-helpers.ts` TSDoc as "banned per Principle 8".                   |
| Proper fixture scoping        | PASS   | `core-fixtures.ts` uses `{ scope: 'worker' }` tuple syntax for worker fixtures, test-scoped for `ui5`/`pramanLogger`. |
| Proper teardown               | PASS   | `core-fixtures.ts:208` removes `framenavigated` listener in teardown. `tracer` fixture calls `shutdown()`.            |
| Frame filtering on navigation | PASS   | `core-fixtures.ts:188` checks `frame === page.mainFrame()` before resetting injection.                                |
| No hardcoded waits            | PASS   | All waits use `waitForUI5Stable()` (bridge-based), `page.waitForFunction()`, or polling loops with deadlines.         |

**Verdict**: No Playwright best practice violations found.

### 2.2 TypeScript Strict Mode Compliance

| Check                          | Result             | Detail                                                                                                                               |
| ------------------------------ | ------------------ | ------------------------------------------------------------------------------------------------------------------------------------ |
| No `any` types                 | PASS               | No `any` in handler/proxy/fixture source files. `ui5-types.d.ts` has `any` for SAP global declarations (acceptable — external type). |
| No `as unknown as T` shortcuts | FAIL (1 instance)  | `stability-fixtures.ts:132` — `page as unknown as Parameters<typeof waitForUI5Stable>[0]`. See Q5.                                   |
| No `as string` shortcuts       | FAIL (3 instances) | `ui5-handler.ts:440,457`, `navigation.ts:310`. See Q4, Q7.                                                                           |
| `import type` for type-only    | PASS               | All type imports use `import type` per `verbatimModuleSyntax: true`.                                                                 |
| `exactOptionalPropertyTypes`   | PASS               | Optional properties explicitly include `undefined` where needed.                                                                     |

**Verdict**: 4 type assertion issues. 3 are LOW severity (`as string` on known-string returns), 1 is MEDIUM (`as unknown as`).

### 2.3 Node.js Best Practices

| Check                             | Result | Detail                                                                                                                              |
| --------------------------------- | ------ | ----------------------------------------------------------------------------------------------------------------------------------- |
| `node:` prefix on builtins        | PASS   | All 12 Node.js builtin imports use `node:` prefix (`node:path`, `node:fs`, `node:process`, `node:module`, `node:url`).              |
| ESM-only (`import`, no `require`) | PASS   | No `require()` calls in source. `createRequire` in `playwright-compat.ts` is the approved pattern for reading package.json.         |
| No hardcoded path separators      | PASS   | All path construction uses `node:path` methods (`join`, `resolve`, `dirname`).                                                      |
| `node:fs/promises` for async      | PASS   | Only sync `rmSync` in `auth-teardown.ts` (cleanup context — acceptable). `existsSync` in certificate-strategy.ts (also acceptable). |

**Verdict**: No Node.js best practice violations.

### 2.4 Microsoft TSDoc Compliance

| Check                          | Result            | Detail                                                                                |
| ------------------------------ | ----------------- | ------------------------------------------------------------------------------------- |
| TSDoc on all public functions  | PASS              | All 14 UI5Handler public methods have TSDoc with `@example` tags.                     |
| TSDoc on all public interfaces | PASS              | `UI5HandlerOptions`, `ControlProxyState`, `UI5ObjectCreateParams` all documented.     |
| Custom tags used correctly     | PASS              | `@remarks`, `@module`, `@example`, `@param`, `@returns`, `@throws` used consistently. |
| Stale TSDoc references         | FAIL (1 instance) | `ui5-matchers.ts:71` references deleted `ClassicUI5Adapter`. See Q3.                  |

**Verdict**: 1 stale reference. Otherwise fully compliant.

### 2.5 Project Rules (CLAUDE.md) Compliance

| Rule                                   | Result   | Detail                                                                                         |
| -------------------------------------- | -------- | ---------------------------------------------------------------------------------------------- |
| Rule 1: No `any`, no `as unknown as T` | FAIL (1) | `stability-fixtures.ts:132` double cast.                                                       |
| Rule 4: Errors extend PramanError      | PASS     | All thrown errors are ControlError, SelectorError, TimeoutError, NavigationError, BridgeError. |
| Rule 5: No console.log                 | PASS     | All logging uses pino via `createLogger()`.                                                    |
| Rule 6: No waitForTimeout              | PASS     | Zero occurrences.                                                                              |
| Rule 9: Path aliases                   | PASS     | All imports use `#core/*`, `#bridge/*`, `#proxy/*`, `#fixtures/*`.                             |
| Rule 10: Naming conventions            | PASS     | Files kebab-case, types PascalCase, functions camelCase, constants UPPER_CASE.                 |
| Rule 11: .js extensions                | PASS     | All relative imports include `.js` extension.                                                  |
| Rule 12: node: prefix                  | PASS     | All Node.js builtins use `node:` prefix.                                                       |
| Rule 13: ESM only                      | PASS     | No `require()` calls.                                                                          |
| Rule 14: No `I` prefix                 | PASS     | `InteractionStrategy`, `BridgeControlRef` — no `I` prefix.                                     |

---

## 3. Dead/Orphan Code Analysis

### 3.1 `src/proxy/discovery.ts` — Orphan Module

**Status**: Exported from barrel, NOT imported by any production source file.

**Evidence**:

- `src/proxy/index.ts:10` — `export { discoverControl } from './discovery.js'`
- Grep for `from.*discovery` outside `src/proxy/` — **zero results**
- `UI5Handler` (the actual consumer of discovery logic) has its own inline implementation:
  - `ui5-handler.ts:550-589` — `discoverSingleControl()` with identical cache + strategy chain logic

**Root cause**: When `UI5Handler` was implemented (B3c), it inlined the discovery logic rather than importing from `discovery.ts`. Both implementations are functionally identical (cache tier 0 → strategy chain → proxy creation).

**Recommendation**: **Reconcile**. Two options:

1. **Option A (preferred)**: Refactor `UI5Handler.discoverSingleControl()` to call `discoverControl()` from `discovery.ts`. This preserves the single-responsibility principle and makes `discovery.ts` the canonical discovery implementation.
2. **Option B**: Remove `discovery.ts` and `discovery-factory.ts` from barrel exports, mark as `@deprecated`, and remove in Phase 5 cleanup.

### 3.2 `src/proxy/discovery-factory.ts` — Transitively Orphaned

**Status**: Only imported by `discovery.ts` (which is itself orphaned).

**Evidence**:

- `src/proxy/discovery.ts:37` — `import { getDiscoveryPriorities } from './discovery-factory.js'`
- `src/proxy/index.ts:11-12` — exported from barrel
- No other source file imports `discovery-factory.ts` or `getDiscoveryPriorities`
- `UI5Handler` has its own inline strategy iteration (`ui5-handler.ts:559-568`) that duplicates `getDiscoveryPriorities()` logic

**Recommendation**: Follows `discovery.ts` — reconcile or remove together.

### 3.3 Stale `ClassicUI5Adapter` Reference

**Status**: TSDoc comment references deleted class.

**Evidence**:

- `src/matchers/ui5-matchers.ts:71` — `* ClassicUI5Adapter.getControlProperty().`
- No `ClassicUI5Adapter` class exists in the codebase (removed during simplification)
- The function `getControlProperty()` at line 78 is standalone and uses `page.evaluate()` directly

**Recommendation**: Update TSDoc to remove the stale reference. Replace with:

```
* Retrieves a control property via `page.evaluate()` using the bridge.
* Uses the same pattern as `UI5Handler.internalExecuteControlMethod()`.
```

### 3.4 No Other Dead Code Found

Additional checks performed:

- All `src/bridge/` files are imported by handler, proxy, or fixture files
- All `src/core/` files are imported by their consumers
- All `src/fixtures/` files are imported by `core-fixtures.ts` or barrel
- All `src/matchers/` files are imported by barrel or fixtures
- All `src/modules/` files are imported by fixtures or barrel
- All `src/auth/` files are imported by auth fixtures or barrel

---

## 4. Fix Approach for Each Gap

### 4.1 G1: Shell/Footer Handlers Bypass UI5Handler

**Problem**: `ShellHandler.clickHome()` uses `document.querySelector('#shell-header-logo')` via raw `page.evaluate()`. This bypasses the bridge injection check, the interaction strategy, and the discovery cache.

**Fix approach**:

```typescript
// Option A: Wire through UI5Handler discovery
async clickHome(): Promise<void> {
  // Shell logo is a UI5 sap.ushell.ui.ShellHeader control
  await this.ui5Handler.click({ id: 'shell-header-logo' });
}

// Option B: Keep DOM-direct (pragmatic — shell DOM IDs are stable)
// Current implementation is acceptable. Shell elements are NOT standard UI5 controls
// in all Fiori versions. DOM-direct is more robust for shell operations.
```

**Recommendation**: **Option B** (keep current). Shell header elements are platform-level DOM, not always standard UI5 controls. The current approach is correct for cross-version FLP compatibility. Add a TSDoc `@remarks` explaining the design decision.

### 4.2 G2: `fireEvent` Not on InteractionStrategy

**Problem**: `InteractionStrategy` interface has `press`/`enterText`/`select` but not `fireEvent(eventName, params)`. Controls like ComboBox need `.fireChange()` which currently goes through the dynamic method forwarder on the proxy, not the strategy.

**Fix approach**:

```typescript
// Add to InteractionStrategy interface:
fireEvent(page: Page, controlId: string, eventName: string, params?: Record<string, unknown>): Promise<void>;

// Implementation in UI5NativeStrategy:
async fireEvent(page: Page, controlId: string, eventName: string, params?: Record<string, unknown>): Promise<void> {
  const ns = BRIDGE_GLOBALS.NAMESPACE;
  const paramsJson = JSON.stringify(params ?? {});
  await page.evaluate(`(function() {
    var bridge = window.${ns};
    var ctrl = bridge.getById('${controlId}');
    if (ctrl && typeof ctrl['fire${capitalize(eventName)}'] === 'function') {
      ctrl['fire${capitalize(eventName)}'](${paramsJson});
    }
  })()`);
}
```

**Recommendation**: Add `fireEvent` to `InteractionStrategy` in Phase 4. This unblocks custom event firing from both the proxy and the handler.

### 4.3 G3: `selectComboBoxByText`

**Problem**: Selecting a ComboBox item by its display text (not key) requires opening the dropdown, finding the item by text, and clicking it. This is a multi-step interaction.

**Fix approach**:

```typescript
// Add to UI5Handler:
async selectComboBoxByText(selector: UI5Selector, text: string): Promise<void> {
  const proxy = await this.control(selector);
  // Step 1: Open the dropdown
  await this.strategy.press(this.page, proxy.id);
  // Step 2: Wait for list items to appear
  await this.internalWaitForUI5Stable();
  // Step 3: Find the item by text in the suggestion list
  await this.page.evaluate(`(function() {
    var ns = window.${BRIDGE_GLOBALS.NAMESPACE};
    var ctrl = ns.getById('${proxy.id}');
    var items = ctrl.getItems();
    for (var i = 0; i < items.length; i++) {
      if (items[i].getText() === '${text}') {
        ctrl.setSelectedItem(items[i]);
        ctrl.fireChange({ selectedItem: items[i] });
        break;
      }
    }
  })()`);
}
```

**Recommendation**: Phase 4. Needs integration testing with real ComboBox controls.

### 4.4 G4: `openValueHelpAndPick`

**Problem**: ValueHelp dialogs are complex multi-step interactions: click the ValueHelp icon, wait for dialog, search/filter, select row, confirm.

**Fix approach**:

```typescript
// Add to UI5Handler:
async openValueHelpAndPick(selector: UI5Selector, value: string): Promise<void> {
  const proxy = await this.control(selector);
  // Step 1: Click the value help icon (fireValueHelpRequest)
  await this.internalExecuteControlMethod(proxy.id, 'fireValueHelpRequest', []);
  // Step 2: Wait for dialog
  await this.internalWaitForUI5Stable();
  // Step 3: Find and select the value in the dialog table
  // ... (complex — depends on ValueHelp configuration)
}
```

**Recommendation**: Phase 4. This is the most complex remaining gap. Requires support for multiple ValueHelp dialog patterns (basic, with search, with tabs).

### 4.5 G5-G7: Keyboard & Focus Methods

**Problem**: `type()`, `hover()`, `focus()`, `blur()`, `pressKey()` are deferred convenience methods.

**Fix approach**:

```typescript
// type — delegates to Playwright keyboard
async type(selector: UI5Selector, text: string, options?: { delay?: number }): Promise<void> {
  const proxy = await this.control(selector);
  const domRef = await this.page.evaluate(`...getDomRef for ${proxy.id}...`);
  await this.page.locator(`#${domRef}`).pressSequentially(text, { delay: options?.delay });
}

// hover — Playwright locator
async hover(selector: UI5Selector): Promise<void> {
  const proxy = await this.control(selector);
  const domRef = await this.getDomRefId(proxy.id);
  await this.page.locator(`#${domRef}`).hover();
}

// focus/blur — page.evaluate with DOM API
async focus(selector: UI5Selector): Promise<void> {
  const proxy = await this.control(selector);
  await this.page.evaluate(`document.getElementById(sap.ui.getCore().byId('${proxy.id}').getDomRef().id).focus()`);
}
```

**Recommendation**: Phase 4. Low priority — most Fiori test scenarios do not require these.

### 4.6 Q1-Q2: Orphan Discovery Modules

**Fix approach** (Option A — reconcile):

```typescript
// In UI5Handler, replace inline discoverSingleControl with import:
import { discoverControl } from '#proxy/discovery.js';

private async discoverSingleControl(selector: UI5Selector): Promise<UI5ControlBase | null> {
  return discoverControl(
    selector,
    this.page,
    this.strategy,
    this.cache,
    this.discoveryStrategies,
  );
}
```

This makes `discovery.ts` the canonical discovery implementation and eliminates the code duplication.

**Recommendation**: Phase 4 cleanup batch. Low risk, high code quality benefit.

### 4.7 Q3: Stale TSDoc Reference

**Fix approach**:

```typescript
// In src/matchers/ui5-matchers.ts, change line 71 from:
// * `ClassicUI5Adapter.getControlProperty()`.
// to:
// * Uses direct `page.evaluate()` through the bridge, matching
// * the pattern in `UI5Handler.internalExecuteControlMethod()`.
```

**Recommendation**: Immediate — trivial fix, no code change, TSDoc-only.

### 4.8 Q4-Q7: Type Assertion Cleanup

**Fix approach for `as string` casts** (Q4, Q7):

```typescript
// Replace unsafe cast with runtime validation:
async getText(selector: UI5Selector): Promise<string> {
  const proxy = await this.control(selector);
  const result = await this.internalExecuteControlMethod(proxy.id, 'getText', []);
  if (typeof result !== 'string') {
    throw new ControlError({
      message: `getText() returned ${typeof result}, expected string`,
      attempted: `Get text from control ${JSON.stringify(selector)}`,
      suggestions: ['Verify the control has a getText() method that returns a string'],
    });
  }
  return result;
}
```

**Fix approach for `as unknown as` cast** (Q5):

```typescript
// In stability-fixtures.ts, fix the type mismatch at the source:
// Either update waitForUI5Stable's parameter type to accept Playwright Page,
// or create a thin adapter function that extracts what waitForUI5Stable needs.
```

**Recommendation**: Phase 4 cleanup. The `as string` casts are low-risk (runtime type is always correct), but runtime validation is the gold standard.

---

## 5. Priority Order

### Phase 4 — Wave 1 (Critical Path for Fiori E2E)

| Priority | Gap                                    | Effort | Rationale                                           |
| -------- | -------------------------------------- | ------ | --------------------------------------------------- |
| P1       | Q3: Stale TSDoc reference              | 5 min  | Trivial, no risk, improves accuracy                 |
| P2       | Q1-Q2: Reconcile discovery orphans     | 1 hr   | Eliminates code duplication, clarifies architecture |
| P3       | G2: `fireEvent` on InteractionStrategy | 2 hr   | Unblocks custom event patterns, needed by G3/G4     |
| P4       | G3: `selectComboBoxByText`             | 3 hr   | High-frequency Fiori pattern, blocks real E2E tests |
| P5       | G4: `openValueHelpAndPick`             | 4 hr   | Complex but essential for Fiori data entry flows    |

### Phase 4 — Wave 2 (Quality & Completeness)

| Priority | Gap                                      | Effort | Rationale                                               |
| -------- | ---------------------------------------- | ------ | ------------------------------------------------------- |
| P6       | Q4-Q7: Type assertion cleanup            | 2 hr   | Improves type safety, low risk                          |
| P7       | Q5: Fix `as unknown as` double cast      | 1 hr   | Eliminates CLAUDE.md Rule 1 violation                   |
| P8       | G1: Shell/footer handler design decision | 1 hr   | Document the rationale in TSDoc (keep current approach) |
| P9       | G5: `type(selector, text)`               | 2 hr   | Needed for complex input controls                       |
| P10      | G7: `pressKey(key)`                      | 1 hr   | Keyboard shortcut testing                               |

### Phase 4 — Wave 3 (Nice-to-Have)

| Priority | Gap                        | Effort | Rationale                                       |
| -------- | -------------------------- | ------ | ----------------------------------------------- |
| P11      | G6: `hover`/`focus`/`blur` | 2 hr   | Rare in Fiori testing                           |
| P12      | G8: `getNavigationHistory` | 1 hr   | Debugging/diagnostic feature                    |
| P13      | G9: `openNotifications`    | 1 hr   | Rare — most Fiori apps don't test notifications |

### Total Estimated Effort

| Wave      | Gaps         | Effort     |
| --------- | ------------ | ---------- |
| Wave 1    | P1-P5        | ~10 hr     |
| Wave 2    | P6-P10       | ~7 hr      |
| Wave 3    | P11-P13      | ~4 hr      |
| **Total** | **13 items** | **~21 hr** |

---

## 6. Dependency Graph

```
P1 (TSDoc fix) ─────────────────────── standalone
P2 (discovery reconcile) ──────────── standalone
P3 (fireEvent) ────────────────┬───── P4 (ComboBox) depends on P3
                               └───── P5 (ValueHelp) depends on P3
P6-P7 (type cleanup) ─────────────── standalone
P8 (shell/footer docs) ───────────── standalone
P9 (type method) ──────────────────── standalone
P10 (pressKey) ────────────────────── standalone
P11 (hover/focus/blur) ───────────── standalone
P12 (nav history) ─────────────────── standalone
P13 (notifications) ───────────────── standalone
```

**Critical dependency**: P3 (`fireEvent`) must be completed before P4 (`selectComboBoxByText`) and P5 (`openValueHelpAndPick`). All other items are independent.
