# Plan: E2E Functional Parity — Praman ↔ Dhikraft

> **Date**: 2026-02-18
> **Architect**: Principal Architect (Claude)
> **Reference**: `plans/newflow.md`, `tests/example/bom-e2e-gold-standard.spec.ts`
> **Goal**: Make `bom-e2e-gold-standard.spec.ts` run on Praman with **import change only**

---

## Executive Summary

The gold standard E2E test exercises a deep proxy chain: `ui5.control()` → proxy →
`.getTable()` → sub-proxy → `.getContextByIndex(0)` → UI5Object proxy → `.getObject()`
→ plain data. **Praman has 5 bugs in this chain** that prevent end-to-end execution.
All bugs are in the proxy/return-handling layer — the bridge injection, discovery, and
fixture system are correctly wired.

### Bug Inventory

| ID    | Severity        | Location                    | Bug                                                                                | Impact                                                |
| ----- | --------------- | --------------------------- | ---------------------------------------------------------------------------------- | ----------------------------------------------------- |
| BUG-1 | **P0 CRITICAL** | `control-proxy.ts:124`      | `'empty'` return → `undefined` instead of `[]`                                     | `getRows()`/`getItems()` on empty tables crash test   |
| BUG-2 | **P0 CRITICAL** | `ui5-object.ts:93-109`      | `executeMethod()` returns envelope `{ success, value, duration }` not just `value` | Every UI5Object proxy call returns wrong data shape   |
| BUG-3 | **P0 CRITICAL** | `ui5-object.ts:96-108`      | Inline script has no 7-type return detection — non-serializable results fail       | `getModel()`, `getBinding()` on contexts break        |
| BUG-4 | **P1 HIGH**     | `execute-method.ts:150-155` | `'newElement'` return missing `controlType`                                        | Sub-proxies show `controlType: 'unknown'`             |
| BUG-5 | **P1 HIGH**     | `control-proxy.ts:140-149`  | `'newElement'` handler uses `controlType: 'unknown'`                               | `getControlType()` returns wrong value on sub-proxies |

### Test Script Changes

Only **1 line** changes in the gold standard test:

```diff
- import { test, expect } from 'dhikraft';
+ import { test, expect } from 'playwright-praman';
```

Everything else — `{ page, ui5 }` fixtures, `ui5.control()` selectors, proxy methods,
`.catch()` patterns, `test.step()` structure — is API-compatible.

---

## Bug Analysis with Execution Traces

### BUG-1: `handleReturn` returns `undefined` for empty arrays

**File**: `src/proxy/control-proxy.ts` lines 124-127

**Current code**:

```typescript
case 'empty':
case 'none':
case 'unknown': {
  return undefined;  // ← BUG: 'empty' should return []
}
```

**Trace**: `await innerTable.getRows()` when table has 0 rows:

1. Browser: `ctrl.getRows()` → `[]`
2. Execute script: `Array.isArray(result) && result.length === 0` → `{ returnType: 'empty', value: [] }`
3. `handleReturn` → `case 'empty'` → returns `undefined` ← **WRONG**
4. Test: `const rows = await innerTable.getRows() as unknown[]` → `undefined`
5. Test: `for (const row of rows)` → **TypeError: rows is not iterable**

**Dhikraft behavior**: Returns `[]` for empty aggregations.

**Fix**: Separate `'empty'` from `'none'`/`'unknown'`:

```typescript
case 'empty': {
  return [];
}
case 'none':
case 'unknown': {
  return undefined;
}
```

**Effort**: 5 minutes. **Risk**: None.

---

### BUG-2: UI5Object proxy returns envelope instead of value

**File**: `src/proxy/ui5-object.ts` lines 93-109, 128-156

**Current code** — `executeMethod()`:

```typescript
async executeMethod(methodName: string, args: readonly unknown[]): Promise<unknown> {
  const script = `(function() {
    // ... retrieve object from bridge ...
    var result = obj['${methodName}'].apply(obj, ${argsJson});
    return { success: true, value: result, duration: Date.now() - start };
    //       ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^ envelope
  })()`;
  return this.page.evaluate(script);
  //     ^^^^ returns the FULL envelope
}
```

**Current code** — `toProxy()`:

```typescript
return async (...args: unknown[]): Promise<unknown> => this.executeMethod(prop, args);
//                                                      ^^^^ returns envelope
```

**Trace**: `await ctx.getObject()` where ctx is a `sap.ui.model.Context`:

1. Proxy intercepts `getObject` → calls `executeMethod('getObject', [])`
2. Browser: `context.getObject()` → `{ Material: 'ABC', Plant: 'DEF' }`
3. Script returns `{ success: true, value: { Material: 'ABC', Plant: 'DEF' }, duration: 5 }`
4. `page.evaluate` returns `{ success: true, value: { Material: 'ABC' }, duration: 5 }`
5. `executeMethod` returns the **FULL envelope**
6. `toProxy` returns the envelope to the test
7. Test: `dataObjMat.Material` → **undefined** (it's at `dataObjMat.value.Material`)

**Dhikraft behavior**: Returns just the value. The `createMethodCaller` function in
`ui5-object-proxy.ts` does `return result.value` (unwraps the envelope).

**Fix**: Unwrap the result in `executeMethod` and throw on failure:

```typescript
async executeMethod(methodName: string, args: readonly unknown[]): Promise<unknown> {
  // ... (script unchanged) ...
  const envelope = await this.page.evaluate(script) as {
    readonly success: boolean;
    readonly value?: unknown;
    readonly error?: string;
  };
  if (!envelope.success) {
    throw new BridgeError({
      code: 'ERR_BRIDGE_EXECUTION',
      message: envelope.error ?? `Method '${methodName}' failed on ${this.type}`,
      attempted: `Execute ${methodName} on UI5Object ${this.uuid}`,
      retryable: false,
      suggestions: [
        'Verify the object still exists in the bridge objectMap',
        'Check that the method name is correct for this object type',
      ],
    });
  }
  return envelope.value;
}
```

**Effort**: 30 minutes. **Risk**: Low — only changes the unwrapping.

---

### BUG-3: UI5Object has no 7-type return detection

**File**: `src/proxy/ui5-object.ts` lines 96-108

**Current inline script**:

```javascript
var result = obj[methodName].apply(obj, args);
return { success: true, value: result, duration: ... };
// ← Tries to serialize `result` as-is via page.evaluate
```

**Problem**: If `result` is a non-serializable UI5 object (e.g., `getModel()` returns
a `JSONModel` instance), `page.evaluate()` will either:

- Silently serialize it as `{}` (losing all data)
- Throw a serialization error

**What should happen**: Same 7-type detection as control methods — primitives returned
directly, controls wrapped in proxies, non-control objects stored with UUID.

**Dhikraft behavior**: `executeObjectMethodInBrowser()` in `ui5-object-proxy.ts` has
full 7-type detection and creates sub-proxies for returned controls/objects.

**Fix**: Replace inline script with `createExecuteObjectMethodScript()` from
`execute-method.ts`, and add a `handleObjectReturn()` function that routes results:

```typescript
async executeMethod(methodName: string, args: readonly unknown[]): Promise<unknown> {
  const script = createExecuteObjectMethodScript();
  const withArgs = script.replace(
    /\)\(\)$/,
    `)(${JSON.stringify(this.uuid)}, ${JSON.stringify(methodName)}, ${JSON.stringify(args)})`,
  );
  const result = await this.page.evaluate(withArgs) as MethodExecutionResult;
  return handleObjectReturn(result, this.page);
}
```

Where `handleObjectReturn` is a new function that handles:

- `'result'` → return value directly
- `'none'` → return undefined
- `'object'` → create new UI5Object, return proxy
- Aggregation/element handling (edge cases for object methods)

**Effort**: 2 hours. **Risk**: Medium — requires careful testing of the type chain.

---

### BUG-4 + BUG-5: `newElement` return loses controlType

**File**: `src/bridge/browser-scripts/execute-method.ts` lines 146-156

**Current**:

```javascript
if (typeof result.getId === 'function' && typeof result.getParent === 'function') {
  var resultId = result.getId();
  var existingControl = bridge.getById(resultId);
  if (existingControl) {
    return {
      success: true,
      returnType: 'newElement',
      value: { id: resultId }, // ← No controlType!
      duration: duration,
    };
  }
}
```

**File**: `src/proxy/control-proxy.ts` lines 140-149

**Current**:

```typescript
case 'newElement': {
  const ref = result.value as { readonly id: string } | undefined;
  if (ref === undefined) return undefined;
  return createControlProxy({
    id: ref.id,
    controlType: 'unknown',          // ← Always 'unknown'
    methods: new Set<string>(),       // ← Always empty
    page: state.page,
    interactionStrategy: state.interactionStrategy,
  });
}
```

**Trace**: `await smartTable.getTable()` → returns inner `sap.ui.table.Table`:

1. Browser: `ctrl.getTable()` → inner Table control with ID `tableId`
2. `bridge.getById(tableId)` → found → `{ returnType: 'newElement', value: { id: 'tableId' } }`
3. `handleReturn` → creates proxy with `controlType: 'unknown'`
4. `await innerTable.getControlType()` → returns `'unknown'` ← **WRONG** (should be `'sap.ui.table.Table'`)

**Fix in execute-method.ts** — include controlType metadata:

```javascript
return {
  success: true,
  returnType: 'newElement',
  value: {
    id: resultId,
    controlType: result.getMetadata ? result.getMetadata().getName() : 'unknown',
  },
  duration: duration,
};
```

**Fix in control-proxy.ts** — use the controlType from result:

```typescript
case 'newElement': {
  const ref = result.value as { readonly id: string; readonly controlType?: string } | undefined;
  if (ref === undefined) return undefined;
  return createControlProxy({
    id: ref.id,
    controlType: ref.controlType ?? 'unknown',
    methods: new Set<string>(),
    page: state.page,
    interactionStrategy: state.interactionStrategy,
  });
}
```

**Effort**: 30 minutes. **Risk**: Low.

---

## Complete Execution Trace (Post-Fix)

Tracing the gold standard test through the fixed Praman stack:

### Step 1: `const bomTab = await ui5.control({ controlType: 'sap.m.IconTabFilter', properties: { text: 'Bills Of Material' } })`

```
UI5Handler.control(selector)
  → validateSelector ✓ (has controlType + properties)
  → options.timeout undefined → skip waitFor
  → internalWaitForUI5Stable() → polls sap.ui.getCore().getUIDirty()
  → discoverSingleControl(selector)
    → cache.get(selector) → miss
    → strategy 'recordreplay' → internalFindControl(selector)
      → page.evaluate(findControlScript) with RecordReplay selector
      → RecordReplay.findDOMElementByControlSelector({ selector })
      → Element.closestTo(domElement) → UI5 control
      → buildResult(ctrl) → { id, controlType, methods, domId, visible }
    → internalGetAvailableMethods(id) → filtered method list
    → createControlProxy({ id, controlType, methods, page, strategy })
    → cache.set(selector, proxy)
  → return proxy
```

### Step 2: `await bomTab.press()`

```
Proxy.get('press')
  → resolveKnownProperty('press')
  → async () => state.interactionStrategy.press(state.page, state.id)
  → UI5NativeStrategy.press()
    → page.evaluate: ctrl.firePress() || ctrl.fireTap() || DOM click
  → return (void)
```

### Step 3: `const smartTable = await ui5.control({ id: '...-table' })`

```
UI5Handler.control({ id: '...-table' })
  → discoverSingleControl({ id: '...-table' })
    → strategy 'direct-id' → internalFindControl({ id: '...-table' })
      → bridge.getById(id) → SmartTable control
    → createControlProxy(...)
  → return SmartTable proxy
```

### Step 4: `const innerTable = await smartTable.getTable()`

```
SmartTable proxy.get('getTable')
  → not in resolveKnownProperty → not blacklisted → dynamic forwarder
  → forwarder: page.evaluate(executeMethodScript('getTable', []))
    → ctrl.getTable() → inner sap.ui.table.Table
    → result.getId && result.getParent → true
    → bridge.getById(resultId) → found
    → { returnType: 'newElement', value: { id: '...', controlType: 'sap.ui.table.Table' } }
  → handleReturn('newElement')
    → createControlProxy({ id, controlType: 'sap.ui.table.Table', methods: new Set() })
  → return inner Table proxy  ✅ (with BUG-4/5 fix)
```

### Step 5: `const ctxMat = await innerTable.getContextByIndex(0)`

```
Table proxy.get('getContextByIndex')
  → dynamic forwarder
  → forwarder: page.evaluate(executeMethodScript('getContextByIndex', [0]))
    → ctrl.getContextByIndex(0) → sap.ui.model.Context
    → NOT primitive, NOT array, NOT same ctrl
    → typeof result.getId ≠ 'function' (Context has no getId)
    → bridge.saveObject(result, 'object') → uuid
    → { returnType: 'object', uuid, objectType: 'object', value: collapsed }
  → handleReturn('object')
    → UI5Object.create({ uuid, type: 'object', page })
    → obj.toProxy() → Proxy forwarding to executeMethod
  → return UI5Object proxy
```

### Step 6: `const dataObjMat = await ctxMat.getObject()`

```
UI5Object proxy.get('getObject')
  → returns async function
  → async function calls executeMethod('getObject', [])
    → page.evaluate(executeObjectMethodScript(uuid, 'getObject', []))
      → bridge.getObject(uuid) → Context instance
      → context.getObject() → { Material: 'ABC', Plant: 'DEF' }
      → isPrimitive? NO → saveObject? → Actually this IS serializable
      → { returnType: 'result', value: { Material: 'ABC', Plant: 'DEF' } }  (with BUG-3 fix)
    → handleObjectReturn: 'result' → return value directly
  → return { Material: 'ABC', Plant: 'DEF' }  ✅ (with BUG-2/3 fix)
```

### Step 7: `const rows = await innerTable.getRows()`

```
Table proxy.get('getRows')
  → dynamic forwarder
  → page.evaluate(executeMethodScript('getRows', []))
    → ctrl.getRows() → [Row0, Row1, Row2, ...]
    → Array + firstItem.getParent → 'aggregation'
    → { returnType: 'aggregation', uuids: [id0, id1, ...], objectTypes: ['sap.ui.table.Row', ...] }
  → handleReturn('aggregation')
    → controlIds.map((id, idx) => createControlProxy({ id, controlType: types[idx] }))
  → return [Row0 proxy, Row1 proxy, ...]  ✅
```

---

## Implementation Plan

### Phase A: P0 Critical Bug Fixes (blocks E2E)

| Task                                      | File(s)                                 | Change                                                                              | Effort |
| ----------------------------------------- | --------------------------------------- | ----------------------------------------------------------------------------------- | ------ |
| **A1**: Fix 'empty' return                | `control-proxy.ts`                      | Separate 'empty' case → return `[]`                                                 | 5 min  |
| **A2**: Unwrap UI5Object result           | `ui5-object.ts`                         | `executeMethod` returns `envelope.value`, throws on failure                         | 30 min |
| **A3**: Add 7-type detection to UI5Object | `ui5-object.ts`                         | Replace inline script with `createExecuteObjectMethodScript()` + handleObjectReturn | 2 hr   |
| **A4**: Add controlType to newElement     | `execute-method.ts`, `control-proxy.ts` | Include metadata in browser result, use in handler                                  | 30 min |

**Total Phase A**: ~3.5 hours

### Phase B: Test Script Adaptation

| Task                             | File(s)                     | Change                                    | Effort |
| -------------------------------- | --------------------------- | ----------------------------------------- | ------ |
| **B1**: Copy gold standard test  | `tests/e2e/bom-e2e.spec.ts` | Copy from `tests/example/`                | 5 min  |
| **B2**: Change import            | `tests/e2e/bom-e2e.spec.ts` | `dhikraft` → `playwright-praman`          | 1 min  |
| **B3**: Verify Playwright config | `playwright.config.ts`      | Ensure e2e project exists with auth setup | 30 min |
| **B4**: Add env config           | `.env` / `praman.config.ts` | SAP_CLOUD_BASE_URL and auth credentials   | 15 min |

**Total Phase B**: ~1 hour

### Phase C: Unit Tests for Bug Fixes

| Task                                  | File(s)                 | Tests                                             | Effort |
| ------------------------------------- | ----------------------- | ------------------------------------------------- | ------ |
| **C1**: Test 'empty' return           | `control-proxy.test.ts` | Verify handleReturn('empty') → `[]`               | 15 min |
| **C2**: Test UI5Object unwrapping     | `ui5-object.test.ts`    | Verify executeMethod returns value, not envelope  | 30 min |
| **C3**: Test UI5Object 7-type routing | `ui5-object.test.ts`    | Verify object→proxy, result→value, none→undefined | 1 hr   |
| **C4**: Test newElement controlType   | `control-proxy.test.ts` | Verify sub-proxy gets correct controlType         | 15 min |

**Total Phase C**: ~2 hours

### Phase D: Integration Smoke Test

| Task                          | File(s)      | Test                                            | Effort |
| ----------------------------- | ------------ | ----------------------------------------------- | ------ |
| **D1**: Run unit tests        | all          | `npm run test:unit` — verify no regressions     | 15 min |
| **D2**: Run lint + typecheck  | all          | `npm run lint && npm run typecheck`             | 15 min |
| **D3**: Run E2E gold standard | `tests/e2e/` | `npx playwright test tests/e2e/bom-e2e.spec.ts` | 30 min |

**Total Phase D**: ~1 hour

---

## Dependency Graph

```
A1 (empty return)      ─── independent ─── C1 (unit test)
A2 (unwrap envelope)   ─── depends on ──── A3 (7-type detection)
A3 (7-type detection)  ─── independent ─── C2, C3 (unit tests)
A4 (newElement type)   ─── independent ─── C4 (unit test)

B1-B4 (test setup)     ─── depends on ──── A1-A4 all complete
D1-D3 (integration)    ─── depends on ──── B1-B4 + C1-C4
```

**Critical path**: A3 → A2 → C2/C3 → D1 → D3

---

## Detailed Code Changes

### A1: Fix 'empty' return in handleReturn

**File**: `src/proxy/control-proxy.ts`

```diff
 switch (result.returnType) {
   case 'result': {
     return result.value;
   }
-  case 'empty':
+  case 'empty': {
+    return [];
+  }
   case 'none':
   case 'unknown': {
     return undefined;
   }
```

### A2 + A3: Rewrite UI5Object.executeMethod with 7-type handling

**File**: `src/proxy/ui5-object.ts`

Replace the inline script approach with the proper execute-object-method script and
add return type routing:

```typescript
import type { MethodExecutionResult } from '#bridge/bridge-types.js';
import { createExecuteObjectMethodScript } from '#bridge/browser-scripts/execute-method.js';
import { BridgeError } from '#core/errors/bridge-error.js';

async executeMethod(methodName: string, args: readonly unknown[]): Promise<unknown> {
  const script = createExecuteObjectMethodScript();
  const withArgs = script.replace(
    /\)\(\)$/,
    `)(${JSON.stringify(this.uuid)}, ${JSON.stringify(methodName)}, ${JSON.stringify(args)})`,
  );
  const result = await this.page.evaluate(withArgs) as MethodExecutionResult;
  return this.handleObjectReturn(result);
}

private handleObjectReturn(result: MethodExecutionResult): unknown {
  if (!result.success) {
    throw new BridgeError({
      code: 'ERR_BRIDGE_EXECUTION',
      message: result.error ?? `UI5Object method failed`,
      attempted: `Execute method on UI5Object ${this.uuid}`,
      retryable: false,
      suggestions: [
        'Verify the object still exists in the bridge objectMap',
        'Check that the method name is correct for this object type',
      ],
    });
  }
  switch (result.returnType) {
    case 'result':
      return result.value;
    case 'none':
      return undefined;
    case 'object': {
      const uuid = result.uuid ?? '';
      const objectType = result.objectType ?? 'unknown';
      const sub = UI5Object.create({ uuid, type: objectType, page: this.page });
      return sub.toProxy();
    }
    default:
      return result.value;
  }
}
```

### A4: Include controlType in newElement return

**File**: `src/bridge/browser-scripts/execute-method.ts`

```diff
 if (existingControl) {
+  var meta = result.getMetadata ? result.getMetadata() : null;
+  var typeName = meta && meta.getName ? meta.getName() : 'unknown';
   return {
     success: true,
     returnType: 'newElement',
-    value: { id: resultId },
+    value: { id: resultId, controlType: typeName },
     duration: duration
   };
 }
```

**File**: `src/proxy/control-proxy.ts`

```diff
 case 'newElement': {
-  const ref = result.value as { readonly id: string } | undefined;
+  const ref = result.value as { readonly id: string; readonly controlType?: string } | undefined;
   if (ref === undefined) return undefined;
   return createControlProxy({
     id: ref.id,
-    controlType: 'unknown',
+    controlType: ref.controlType ?? 'unknown',
     methods: new Set<string>(),
     page: state.page,
     interactionStrategy: state.interactionStrategy,
   });
 }
```

---

## API Surface Compatibility Matrix

| Gold Standard API                          | Praman Support                         | Status                     |
| ------------------------------------------ | -------------------------------------- | -------------------------- |
| `import { test, expect }`                  | `src/fixtures/index.ts` exports both   | ✅ Works                   |
| `{ page, ui5 }` fixtures                   | `core-fixtures.ts` provides both       | ✅ Works                   |
| `ui5.control({ id })`                      | `UI5Handler.control()`                 | ✅ Works                   |
| `ui5.control({ controlType, properties })` | RecordReplay discovery                 | ✅ Works                   |
| `ui5.control(sel, { timeout })`            | `waitFor()` polling                    | ✅ Works                   |
| `ui5.control({ searchOpenDialogs })`       | UI5Selector type has field             | ✅ Works                   |
| `ui5.control().catch()`                    | Returns Promise                        | ✅ Works                   |
| `.press()`                                 | `resolveKnownProperty` → strategy      | ✅ Works                   |
| `.getProperty(name)`                       | Dynamic forwarder                      | ✅ Works                   |
| `.getControlType()`                        | `resolveKnownProperty`                 | ✅ Works                   |
| `.getValue()` / `.getText()`               | Dynamic forwarder                      | ✅ Works                   |
| `.getEnabled()` / `.getVisible()`          | Dynamic forwarder                      | ✅ Works                   |
| `.isOpen()` / `.close()` / `.open()`       | Dynamic forwarder                      | ✅ Works                   |
| `.setValue(v)` / `.setSelectedKey(k)`      | Dynamic forwarder                      | ✅ Works                   |
| `.getSelectedKey()` / `.getKey()`          | Dynamic forwarder → 'result' return    | ✅ Works                   |
| `.fireChange({ value })`                   | Dynamic forwarder                      | ✅ Works                   |
| `.getTable()`                              | forwarder → 'newElement' return        | ⚠️ **BUG-4/5** → fix A4    |
| `.getRows()` / `.getItems()`               | forwarder → 'aggregation' return       | ✅ Works                   |
| `.getRows()` (empty)                       | forwarder → 'empty' return             | ❌ **BUG-1** → fix A1      |
| `.getBindingContext()`                     | forwarder → 'object' → UI5Object proxy | ⚠️ **BUG-2/3** → fix A2/A3 |
| `.getContextByIndex(n)`                    | forwarder → 'object' → UI5Object proxy | ⚠️ **BUG-2/3** → fix A2/A3 |
| `.getObject()` (on context)                | UI5Object proxy → executeMethod        | ❌ **BUG-2** → fix A2      |
| `.getTitle()` (on item)                    | Aggregation proxy → forwarder          | ✅ Works                   |

---

## Risk Assessment

| Risk                                                             | Likelihood | Impact | Mitigation                                                   |
| ---------------------------------------------------------------- | ---------- | ------ | ------------------------------------------------------------ |
| A1 breaks existing tests                                         | Very Low   | Low    | Only changes 'empty' case, unit tests verify                 |
| A2/A3 changes UI5Object API contract                             | Low        | Medium | All callers go through `toProxy()` — internal change         |
| A3 createExecuteObjectMethodScript may not handle all edge cases | Medium     | Medium | Compare with control execute script, test with real contexts |
| A4 metadata access may fail on some controls                     | Low        | Low    | Fallback to 'unknown' preserved                              |
| E2E test requires live SAP system                                | High       | High   | Test can only run in CI with SAP credentials                 |

---

## Success Criteria

1. `npm run test:unit` — all pass, zero regressions
2. `npm run lint && npm run typecheck` — zero errors
3. `tests/e2e/bom-e2e.spec.ts` runs with `playwright-praman` import
4. All 8 test steps in gold standard pass end-to-end
5. Sub-proxy chains work: `smartTable.getTable()` → `.getRows()` → `.getBindingContext()` → `.getObject()`
