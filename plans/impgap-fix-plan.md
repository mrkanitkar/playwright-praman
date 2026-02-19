# Implementation Plan: impgap Fixes — Parallel Agent Execution

## Inter-Dependency Matrix

### File → Gap Mapping (Conflict Detection)

| Source File                                    | Gaps That Modify It                                            |
| ---------------------------------------------- | -------------------------------------------------------------- |
| `src/proxy/control-proxy.ts`                   | GAP-01, GAP-04, GAP-08, GAP-10, GAP-12, GAP-13, GAP-15, GAP-16 |
| `src/proxy/ui5-object.ts`                      | GAP-01, GAP-03, GAP-04, GAP-11                                 |
| `src/bridge/browser-scripts/execute-method.ts` | GAP-01, GAP-07                                                 |
| `src/bridge/browser-scripts/find-control.ts`   | GAP-02, GAP-21                                                 |
| `src/proxy/discovery.ts`                       | GAP-01, GAP-02, GAP-21                                         |
| `src/bridge/method-blacklist.ts`               | GAP-06 (isolated)                                              |
| `src/bridge/injection.ts`                      | GAP-09 (isolated)                                              |
| `src/bridge/inject-ui5.ts`                     | GAP-09 (isolated)                                              |
| `src/fixtures/ui5-handler.ts`                  | GAP-01 (Path B - deferred)                                     |
| NEW files                                      | GAP-14, GAP-18, GAP-19, GAP-20                                 |

### Dependency Graph (Upstream → Downstream)

```
GAP-01 (P0) ← SOLE BLOCKER, no upstream deps
  ├── GAP-03 depends (needs stable evaluate for getBindingContext)
  ├── GAP-04 depends (shares ui5-object.ts, async create builds on function-form)
  ├── GAP-07 depends (return detection alignment, same execute-method.ts)
  ├── GAP-08 depends (sub-proxy methods fail without function-form)
  ├── GAP-10 depends (fluent proxy needs stable method forwarding)
  ├── GAP-11 depends (array return detection)
  └── GAP-12..16 depend (all extend control-proxy.ts post-rewrite)

GAP-04 (P1)
  ├── GAP-08 partially depends (async UI5Object for 'object' returns)
  └── GAP-11 depends (loaded methods for executeArrayMethod)

GAP-02 (P1) ← INDEPENDENT of GAP-01 at file level
  └── GAP-21 tightly coupled (same files: find-control.ts, discovery.ts)

GAP-06 (P1) ← FULLY INDEPENDENT
GAP-09 (P1) ← FULLY INDEPENDENT
GAP-14 (P2) ← FULLY INDEPENDENT (new file)
GAP-18..20 (P3) ← FULLY INDEPENDENT (new files)
```

---

## Wave Execution Plan

### Wave 1: P0 Blocker + Independent P1s (3 agents, zero file overlap)

| Agent | Gap(s)                              | Source Files                                                     | Test Files                                                                           |
| ----- | ----------------------------------- | ---------------------------------------------------------------- | ------------------------------------------------------------------------------------ |
| **A** | **GAP-01** (function-form evaluate) | control-proxy.ts, ui5-object.ts, execute-method.ts, discovery.ts | control-proxy.test.ts, ui5-object.test.ts, execute-method.test.ts, discovery.test.ts |
| **B** | **GAP-06** (blacklist delta)        | method-blacklist.ts                                              | method-blacklist.test.ts                                                             |
| **C** | **GAP-09** (eager injection)        | injection.ts, inject-ui5.ts                                      | injection.test.ts                                                                    |

**File conflict check**: A touches proxy+bridge-scripts, B touches method-blacklist only, C touches injection only. **ZERO OVERLAP ✓**

#### Agent A — GAP-01: Function-Form Conversion

Core change: Replace string-form `page.evaluate(script)` with function-form `page.evaluate(fn, args)`.

1. **execute-method.ts**: Add function-form exports alongside existing string helpers
   - `browserExecuteControlMethod(params)` — self-contained function for control methods
   - `browserExecuteObjectMethod(params)` — self-contained function for UI5Object methods
   - Keep string-form exports for backward compat with ui5-handler.ts (Path B)

2. **control-proxy.ts**: Replace `buildExecuteScript()` + string evaluate
   - Import new function-form from execute-method.ts
   - Call `page.evaluate(browserExecuteControlMethod, { controlId, methodName, args, bridgeNs })`
   - Remove `buildExecuteScript()` helper
   - Keep retry logic around function-form call

3. **ui5-object.ts**: Replace string-form `executeMethod()`
   - Import new function-form from execute-method.ts
   - Call `page.evaluate(browserExecuteObjectMethod, { uuid, methodName, args, bridgeNs })`

4. **discovery.ts**: Replace string-form discovery
   - Add `browserFindControl(params)` function-form in find-control.ts
   - Call `page.evaluate(browserFindControl, { selector, bridgeNs })` in tryStrategy

5. **Update all tests**: Mock `page.evaluate` to receive function+args instead of script string

#### Agent B — GAP-06: Blacklist Delta

1. Add 29 missing items from dhikraft (aggregation, association, property validation, etc.)
2. Remove 3 clear errors: `destroy`, `getMetadata`, `getInterface`
3. Unblock commonly-needed: `getBusy/setBusy`, `getTooltip/setTooltip`, `getCustomData/addCustomData/removeCustomData`
4. Update tests

#### Agent C — GAP-09: Eager Injection

1. Add `injectBridgeEager(context: BrowserContext)` using `addInitScript()`
2. Add `injectBridgeEager(page: Page)` overload
3. Keep existing lazy injection as default
4. Add missing SAP module refs to bridge shape
5. Update tests

### Quality Gate 1

```bash
npm run typecheck && npm run lint && npm run test:unit
```

---

### Wave 2: Post-GAP-01 P1s (2 agents, zero file overlap)

| Agent | Gap(s)                       | Source Files                    | Test Files                                                          |
| ----- | ---------------------------- | ------------------------------- | ------------------------------------------------------------------- |
| **D** | **GAP-03 + GAP-04 + GAP-08** | ui5-object.ts, control-proxy.ts | ui5-object.test.ts, control-proxy.test.ts, ui5-object-cache.test.ts |
| **E** | **GAP-02 + GAP-21**          | find-control.ts, discovery.ts   | find-control.test.ts, discovery.test.ts                             |

**File conflict check**: D touches proxy files, E touches discovery/find-control files. **ZERO OVERLAP ✓**

#### Agent D — GAP-03 + GAP-04 + GAP-08

1. **GAP-04**: Make `UI5Object.create()` async + add `loadMethods()` (22+ call site migration)
2. **GAP-03**: Add explicit `getBindingContext`, `getProperty`, `setProperty` on UI5Object
3. **GAP-08**: Improve sub-proxy creation in control-proxy handleReturn (add await for UI5Object)
4. Update all test call sites

#### Agent E — GAP-02 + GAP-21

1. **GAP-02**: Enhance Tier 2 registry scan with property/controlType/viewName matching
2. **GAP-21**: Pass `preferVisibleControls` config through discovery chain to browser script
3. **GAP-02**: Wire 'registry' strategy in `tryStrategy()` (currently returns null)
4. Update tests

### Quality Gate 2

```bash
npm run typecheck && npm run lint && npm run test:unit
```

---

### Wave 3: P2 Enhancements (3 agents, zero file overlap)

| Agent | Gap(s)                               | Source Files                    | Test Files                                |
| ----- | ------------------------------------ | ------------------------------- | ----------------------------------------- |
| **F** | **GAP-07** (return detection)        | execute-method.ts               | execute-method.test.ts                    |
| **G** | **GAP-10 + GAP-11** (fluent + array) | control-proxy.ts, ui5-object.ts | control-proxy.test.ts, ui5-object.test.ts |
| **H** | **GAP-14** (selector parser)         | NEW: selector-parser.ts         | NEW: selector-parser.test.ts              |

**File conflict check**: F=execute-method, G=proxy files, H=new file. **ZERO OVERLAP ✓**

### Quality Gate 3

```bash
npm run typecheck && npm run lint && npm run test:unit
```

---

### Wave 4: Remaining P2 + P3 (2 agents)

| Agent | Gap(s)                             | Source Files     |
| ----- | ---------------------------------- | ---------------- |
| **I** | **GAP-12, GAP-13, GAP-15, GAP-16** | control-proxy.ts |
| **J** | **GAP-18, GAP-19, GAP-20**         | new files        |

**Note**: I and J can run in parallel (no overlap). Agents within I are sequential (all modify control-proxy.ts).

### Quality Gate 4 (Final)

```bash
npm run ci  # lint + typecheck + test:unit + build
```

---

## Duplicate/Conflict Verification

| Check                                         | Status                                            |
| --------------------------------------------- | ------------------------------------------------- |
| No two parallel agents modify the same file   | ✓ Verified per wave                               |
| No gap assigned to multiple agents            | ✓ Each gap appears exactly once                   |
| Test files match source file agent assignment | ✓ Tests co-located with source agent              |
| Dependency ordering respected across waves    | ✓ GAP-01 first, dependents in Wave 2+             |
| ui5-handler.ts Path B deferred                | ✓ Not modified in any wave (uses old string-form) |

## Risk Mitigations

| Risk                                              | Mitigation                                              |
| ------------------------------------------------- | ------------------------------------------------------- |
| GAP-01 function-form breaks browser serialization | Test with `page.evaluate(fn.toString())` fallback check |
| GAP-04 async migration misses call sites          | Grep for `UI5Object.create(` post-change                |
| GAP-06 blacklist removal breaks existing tests    | Run full test suite before/after                        |
| Wave 2 builds on Wave 1 changes                   | QG1 must pass before Wave 2 starts                      |
| ui5-handler.ts still uses string-form             | Documented as separate follow-up task                   |
