# Phase 3 — Fixtures + Auth + Navigation: Detailed Implementation Plan

> **Version**: 1.0.0
> **Status**: 📋 PLANNED
> **Parent**: plan.md v2.2.0 (Phase 2 COMPLETE)
> **Duration**: 3 weeks (3 sub-phases)
> **Approach**: TDD (tests first)
> **Predecessor**: Phase 2 — 929 tests, 73 test files, 35 source files, 99.18% stmt coverage
> **GitHub Issues**: #22 (G2 proxy stubs)

---

## Table of Contents

1. [Decision Log (Wizard Answers)](#1-decision-log-wizard-answers)
2. [Sub-Phase Breakdown](#2-sub-phase-breakdown)
3. [Dependency Graph](#3-dependency-graph)
4. [Design Flows](#4-design-flows)
5. [Sub-Phase 3.1 — Foundation](#5-sub-phase-31--foundation-week-1)
6. [Sub-Phase 3.2 — Wiring + Auth Setup](#6-sub-phase-32--wiring--auth-setup-week-2)
7. [Sub-Phase 3.3 — WorkZone + Assembly](#7-sub-phase-33--workzone--assembly-week-3)
8. [Complete File Inventory](#8-complete-file-inventory)
9. [Test Plan](#9-test-plan)
10. [Impact Analysis](#10-impact-analysis)
11. [Quality Gates Per Sub-Phase](#11-quality-gates-per-sub-phase)
12. [Risk Register](#12-risk-register)
13. [Barrel File Updates](#13-barrel-file-updates)
14. [Implementation Batching](#14-implementation-batching)
15. [Summary](#15-summary)

---

## 1. Decision Log (Wizard Answers)

Binding decisions for Phase 3 implementation, validated against plan.md D1–D29.

| #   | Question                           | Decision                                                                                                     | Rationale                                                                                                                                           |
| --- | ---------------------------------- | ------------------------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------- |
| W1  | Sub-phase structure?               | 3 sub-phases: 3.1 Foundation → 3.2 Wiring+Auth → 3.3 Assembly                                                | Maximizes parallelism in 3.1 (4 tracks), sequential wiring in 3.2, final assembly in 3.3                                                            |
| W2  | Fixture decomposition?             | 4 domain files + 1 assembly. Single `import { test, expect } from 'playwright-praman'` for users             | BP-PLAYWRIGHT: fixture composition via `extend()` chain. SRP for developers, single import for consumers. Matches D2.                               |
| W3  | Auth strategies scope?             | 6 strategies: OnPrem, CloudSAML, Office365, API-based, Certificate, MultiTenant                              | Full dhikraft parity. All 6 proven in production. D28: setup project pattern (not globalSetup).                                                     |
| W4  | Auth pattern?                      | Playwright setup project (D28) with `storageState` + per-worker support                                      | BP-PLAYWRIGHT: setup projects have trace support, HTML report visibility, retry semantics. `globalSetup` lacks all three.                           |
| W5  | Fixture scoping?                   | Worker-scoped: config, logger, tracer, compat, selectors, matchers. Test-scoped: adapter, proxy, nav, auth   | Worker fixtures run once per process (expensive init). Test fixtures get fresh per-test isolation (Playwright best practice).                       |
| W6  | Phase 1 wiring approach?           | Wire into fixture lifecycle: logger as worker auto-fixture, OTel spans wrapping adapter calls, retry in auth | Logging/telemetry are cross-cutting (auto fixtures). Retry is infrastructure (auth token refresh). Step-decorator wraps fixture actions.            |
| W7  | Orphan wiring?                     | `object-map.ts` → ClassicAdapter.init(). `get-selector.ts` → new adapter method `getSelectorForControl()`    | Object map needed before any `getModel()`/`getBindingContext()` calls. Selector extraction is a first-class adapter capability (G5, CF8).           |
| W8  | G2 fix approach?                   | Remove 4 hardcoded stubs from `resolveBuiltinMethod()`, fall through to `adapter.executeMethod()` path       | Issue #22. Stubs return incorrect values (`getVisible→true`, `isBound→false`). Bridge round-trips return real UI5 data.                             |
| W9  | Navigation module scope?           | Full FLP navigation: tile, intent, hash, search, back/forward + deep link                                    | Carry-forward from dhikraft. Navigation is core Fiori test workflow. All methods use `waitForUI5Stable()` after navigation.                         |
| W10 | WorkZone scope?                    | Dual-frame bridge injection: shell frame + app iframe. Context switching via fixture methods                 | BTP WorkZone wraps Fiori apps in an iframe. Bridge must be injected in both frames. dhikraft's BTPWorkZoneManager pattern proven in production.     |
| W11 | Batch size limit?                  | ~150 LOC source + ~100 LOC tests per batch. Max 20 batches.                                                  | Keeps AI agent response within token limits. TDD: test file ships with source file in same batch.                                                   |
| W12 | Logger wiring depth?               | Child loggers in every fixture + adapter + strategy. Module names: `fixture`, `auth`, `nav`, `workzone`      | D5 L2: pino structured JSON logging with child loggers per module. All log output has module context for filtering.                                 |
| W13 | Stability fixture design?          | Auto test-scoped fixture: intercepts WalkMe/analytics requests + injects `waitForUI5Stable()` after actions  | D23: `skipStabilityWait` config. Constants: `DEFAULT_IGNORE_PATTERNS` (10 URLs). `waitForUI5Stable()` is the primary stability mechanism.           |
| W14 | Fixture options (config per test)? | `sapAuthConfig` as fixture option, configurable per Playwright project in `playwright.config.ts`             | BP-PLAYWRIGHT: fixture options allow per-project SAP system configuration (cloud project, onprem project, etc.). Type-safe via TypeScript generics. |

---

## 2. Sub-Phase Breakdown

```
Phase 3.1 — Foundation (Week 1)
├── proxy/           → G2: Remove 4 hardcoded proxy stubs (Issue #22)
├── bridge/          → Wire orphaned browser scripts (object-map.ts, get-selector.ts)
├── fixtures/        → Core fixtures: test.extend() base with worker + test scoping
├── auth/strategies/ → 6 auth strategy implementations + factory + checks
└── Milestone: npm run ci passes, core fixtures provide bridge/proxy/config/logger

Phase 3.2 — Wiring + Auth Setup (Week 2)
├── fixtures/        → Wire Phase 1 infra: logging, telemetry, retry, step-decorator
├── fixtures/        → Wire selectors (worker auto) + matchers (worker auto)
├── fixtures/        → Stability fixture: request interception + waitForUI5Stable
├── fixtures/        → PlaywrightCompat fixture (worker auto)
├── auth/            → Auth handler + auth setup project (D28 pattern)
├── modules/         → Navigation module + navigation fixtures
└── Milestone: npm run ci passes, all Phase 1 modules consumed, auth pipeline works

Phase 3.3 — WorkZone + Assembly (Week 3)
├── fixtures/        → WorkZone fixtures (BTP iframe context switching)
├── fixtures/        → Fixture assembly: extend() chain → single `test` + `expect` export
├── barrels          → Update fixtures/index.ts, auth/index.ts, modules/index.ts, src/index.ts
└── Milestone: npm run ci passes, full Phase 3 COMPLETE, all exports validated by attw
```

---

## 3. Dependency Graph

```
                    ┌─────────────────────────┐
                    │  Phase 1 Infrastructure  │
                    │  (logging, telemetry,    │
                    │   retry, compat, utils,  │
                    │   selectors, matchers)   │
                    └────────────┬────────────┘
                                 │
              ┌──────────────────┼──────────────────┐
              │                  │                   │
    ┌─────────▼─────────┐  ┌────▼──────────┐  ┌────▼──────────────┐
    │ Phase 2 Bridge     │  │ Phase 2 Proxy │  │ core/config       │
    │ (adapters,         │  │ (dynamic-     │  │ (PramanConfig,    │
    │  strategies,       │  │  proxy, cache, │  │  loadConfig)      │
    │  browser-scripts)  │  │  discovery)   │  │                   │
    └─────────┬──────────┘  └────┬──────────┘  └────┬──────────────┘
              │                  │                   │
              └──────────────────┼───────────────────┘
                                 │
                    ┌────────────▼────────────┐
                    │  fixtures/core-fixtures  │  ← PHASE 3 ROOT
                    │  Worker: config, logger, │
                    │    tracer, compat,       │
                    │    selectors, matchers   │
                    │  Test: adapter, proxy    │
                    └────────────┬────────────┘
                                 │
              ┌──────────────────┼──────────────────┐
              │                  │                   │
    ┌─────────▼──────────┐ ┌────▼──────────┐ ┌─────▼──────────────┐
    │ auth/strategies/*   │ │ fixtures/     │ │ fixtures/          │
    │ auth/auth-handler   │ │ stability-    │ │ nav-fixtures       │
    │ auth/auth-factory   │ │ fixtures      │ │ (FLP navigation)   │
    │ auth/auth-checks    │ │ (auto, test)  │ │                    │
    └─────────┬──────────┘ └───────────────┘ └─────┬──────────────┘
              │                                     │
    ┌─────────▼──────────┐               ┌─────────▼──────────────┐
    │ fixtures/           │               │ fixtures/              │
    │ auth-fixtures       │               │ nav-fixtures           │
    │ (sapAuth: status    │               │ (btpWorkZone)          │
    │  checks only, NO    │               │                        │
    │  auto-login/logout) │               │                        │
    └─────────┬──────────┘               └─────────┬──────────────┘
              │                                     │
              └──────────────┬──────────────────────┘
                             │
                    ┌────────▼────────────────┐
                    │  fixtures/index.ts       │  ← ASSEMBLY
                    │  export { test, expect } │
                    └─────────────────────────┘
```

**Dependency Rules (Enforced)**:

- `fixtures/*` imports from `#core/*`, `#bridge/*`, `#proxy/*` — NEVER reverse
- `auth/*` imports from `#core/*` only — NEVER from `#bridge/*` or `#proxy/*`
- `modules/navigation.ts` imports from `#core/*`, `#bridge/*` — NEVER from `#proxy/*`
- `fixtures/index.ts` imports ONLY from sibling fixture files — no direct `#core/*` imports
- All fixture files import `test` from `@playwright/test` (not from each other, except assembly)
- Auth strategies are pure: no Playwright fixture dependencies, only `Page` + config

---

## 4. Design Flows

### 4.1 Fixture Initialization Flow (per worker)

```
Worker starts
    │
    ▼
┌──────────────────────────────────────────┐
│ Worker-scoped auto fixtures (run once):  │
│ 1. pramanConfig: loadConfig() → frozen   │
│ 2. rootLogger: createRootLogger(config)  │
│ 3. tracer: initTelemetry(config)         │
│ 4. playwrightCompat: assertMinVersion()  │
│ 5. selectorRegistration:                 │
│    playwright.selectors.register('ui5',  │
│    createUI5SelectorEngineScript())      │
│ 6. matcherRegistration:                  │
│    expect.extend(ui5Matchers)            │
└──────────────────┬───────────────────────┘
                   │
                   ▼
    Tests in worker share these resources
```

### 4.2 Fixture Initialization Flow (per test)

> **Auth model (aligned with dhikraft)**: Authentication is handled ONCE by the
> setup project (Section 4.3). Tests receive pre-authenticated `storageState`
> via `playwright.config.ts`. The `sapAuth` fixture does NOT auto-login —
> it only initializes the auth strategy for status checks (`isAuthenticated()`)
> and explicit operations (manual login/logout). Session persists across all
> tests in the suite. No per-test auth, no per-test cleanup.

```
Test starts (with pre-authenticated storageState from setup project)
    │
    ▼
┌──────────────────────────────────────────────┐
│ Test-scoped fixtures (fresh per test):       │
│ 1. pramanLogger: createLogger('test',        │
│    rootLogger) + testInfo binding             │
│ 2. bridgeAdapter: createBridgeAdapter()      │
│    from adapter-factory (lazy inject)         │
│ 3. ui5: createControlProxy(adapter)          │
│ 4. stability: route.abort() for WalkMe,      │
│    page.on('framenavigated', stable)          │
│ 5. sapAuth: init strategy for status checks  │
│    only — NO auto-login (session from         │
│    storageState via setup project D28)        │
│ 6. ui5Navigation: (lazy) nav methods         │
│ 7. btpWorkZone: (lazy) iframe switch         │
└──────────────────┬───────────────────────────┘
                   │
                   ▼
    Test executes with fixtures
                   │
                   ▼
┌──────────────────────────────────────────────┐
│ Teardown (reverse order):                    │
│ 7. btpWorkZone cleanup (if activated)        │
│ 6. ui5Navigation cleanup (noop)              │
│ 5. sapAuth: NO logout — session managed      │
│    globally by setup project. Auth session    │
│    persists for next tests in suite.          │
│ 4. stability cleanup: remove listeners       │
│ 3. ui5 proxy detach                          │
│ 2. bridgeAdapter.destroy()                   │
│ 1. pramanLogger flush                        │
└──────────────────────────────────────────────┘
```

### 4.3 Auth Setup Project Flow (D28)

```
playwright.config.ts
    │
    projects: [
    │  { name: 'sap-auth-setup',
    │    testMatch: /auth\.setup\.ts/,
    │    teardown: 'sap-auth-teardown' },
    │  { name: 'sap-auth-teardown',
    │    testMatch: /auth\.teardown\.ts/ },
    │  { name: 'chromium',
    │    dependencies: ['sap-auth-setup'],
    │    use: { storageState: '.auth/sap-session.json' } },
    │]
    │
    ▼
┌─────────────────────────────────────────┐
│ auth/auth.setup.ts                      │
│ 1. Load config from env (SAP_CLOUD_*,   │
│    SAP_ONPREM_*)                         │
│ 2. Create auth handler                  │
│ 3. Start trace recording (debug)        │
│ 4. handler.login(config) with retry     │
│ 5. Verify: isAuthenticated(page)        │
│ 6. Save: context.storageState(path)     │
│ 7. Stop trace recording                 │
└─────────────────────────────────────────┘
    │
    ▼
Tests run with pre-authenticated storageState
    │
    ▼
┌─────────────────────────────────────────┐
│ auth/auth.teardown.ts                   │
│ 1. Clean up .auth/ session files        │
│ 2. Log session summary                  │
└─────────────────────────────────────────┘
```

### 4.4 Auth Strategy Selection Flow

```
SAPAuthConfig input
    │
    ▼
┌──────────────────────────────────────────┐
│ AuthStrategyFactory.create(config)       │
│                                          │
│ if config.strategy === 'api'             │
│   → APIStrategy (headless, no browser)   │
│ else if config.certificate               │
│   → CertificateStrategy (PKI/SSL)       │
│ else if config.strategy === 'office365'  │
│   → Office365Strategy (Azure AD)        │
│ else if URL matches cloud patterns       │
│   (.cloud.sap, .s4hana.cloud.sap)       │
│   → CloudSAMLStrategy (SAP IAS)         │
│ else if config.tenant                    │
│   → MultiTenantStrategy (BTP subdomain) │
│ else                                     │
│   → OnPremStrategy (form login)         │
└──────────────────────────────────────────┘
```

### 4.5 Navigation Flow

```
ui5Navigation.navigateToApp('PurchaseOrder-manage')
    │
    ▼
┌──────────────────────────────────────┐
│ 1. Resolve hash: '#PurchaseOrder-    │
│    manage'                           │
│ 2. Navigate: page.goto(baseURL +    │
│    hash) or window.hasher.setHash()  │
│ 3. waitForUI5Bootstrap(page)         │
│ 4. waitForUI5Stable(page)            │
│ 5. Return                            │
└──────────────────────────────────────┘
```

### 4.6 WorkZone Dual-Frame Flow

```
BTP WorkZone page loads
    │
    ▼
┌────────────────────────────────────────┐
│ Main frame: Shell (FLP header/tiles)   │
│ ┌────────────────────────────────────┐ │
│ │ <iframe> App frame (Fiori app)     │ │
│ │ ┌──────────────────────────────┐   │ │
│ │ │ UI5 Controls live here       │   │ │
│ │ └──────────────────────────────┘   │ │
│ └────────────────────────────────────┘ │
└────────────────────────────────────────┘
    │
    ▼
btpWorkZone.enableDualBridge()
    │
    ├─ Inject bridge into main frame (shell)
    └─ Inject bridge into app iframe
    │
    ▼
btpWorkZone.switchToApp()
    → Returns FrameLocator for app iframe
    → All UI5 operations target app frame

btpWorkZone.switchToShell()
    → Returns Page for main frame
    → Shell bar, tile, navigation operations
```

### 4.7 Module Wiring Map (Phase 1 + Phase 2)

#### Phase 1 Modules → Phase 3 Consumption Points

```
Phase 1 Module              → Phase 3 Consumption Point
─────────────────────────────────────────────────────────
core/logging                → core-fixtures.ts (worker auto: rootLogger)
                            → All fixture files (child loggers)
                            → auth strategies (child loggers)
                            → navigation module (child logger)

core/telemetry              → core-fixtures.ts (worker auto: tracer)
                            → bridgeAdapter fixture (withSpan wrapping)
                            → auth handler (withSpan for login flow)

core/utils/retry            → auth-handler.ts (login retry with backoff)
                            → bridge adapter init (injection retry)

core/utils/step-decorator   → nav-fixtures.ts (withStep for navigation)
                            → auth-fixtures.ts (withStep for login)
                            → core-fixtures.ts (withStep for adapter init)

core/utils/wait-helpers     → stability-fixtures.ts (waitForUI5Stable auto)
                            → nav-fixtures.ts (after navigation)
                            → core-fixtures.ts (waitForUI5Bootstrap on init)

core/compat/playwright-compat → core-fixtures.ts (worker auto: version check)
                              → feature-gated fixture behavior

selectors/selector-engine   → core-fixtures.ts (worker auto: register engine)

matchers/*                  → core-fixtures.ts (worker auto: expect.extend)
```

#### Phase 2 Modules → Phase 3 Consumption Points

```
Phase 2 Module                       → Phase 3 Consumption Point
──────────────────────────────────────────────────────────────────
bridge/adapter-factory               → core-fixtures.ts (test-scoped: createBridgeAdapter())
  createBridgeAdapter()              → adapter mode from config (classic/hybrid/webcomponent)

bridge/classic-adapter               → Primary adapter (95%+ SAP FLP use cases)
  init(page)                         → core-fixtures.ts bridgeAdapter fixture setup
  destroy()                          → core-fixtures.ts bridgeAdapter fixture teardown

bridge/hybrid-adapter                → Mixed FLP pages (shell WCs + classic app)
  init(page)/destroy()               → same pattern as classic-adapter

bridge/webcomponent-adapter          → Pure WC apps (Phase 3+ stub, no-crash fallback)
  init(page)/destroy()               → same pattern as classic-adapter

bridge/injection                     → Called internally by every adapter method
  ensureBridgeInjected(page)         → Lazy: first UI5 operation triggers injection
  isBridgeReady(page)                → Fixture debug/diagnostics
  injectBridge(page)                 → WorkZone dual-frame injection

bridge/bridge-constants              → stability-fixtures.ts (XHR_IGNORE_PATTERNS)
  BRIDGE_GLOBALS, BRIDGE_TIMEOUTS    → injection, adapter operations
  XHR_IGNORE_PATTERNS                → merge with user config ignoreAutoWaitUrls

bridge/interaction-strategies/       → core-fixtures.ts (strategy selection from config)
  createInteractionStrategy()        → Default: 'ui5-native' (direct UI5 fire* calls)
  UI5NativeStrategy (DEFAULT)        → press(), enterText(), select() via UI5 events
  DomFirstStrategy                   → DOM events first, UI5 fallback
  Opa5Strategy                       → RecordReplay API (when explicitly configured)

bridge/method-blacklist              → proxy layer (block internal UI5 methods)
  isBlacklisted(), METHOD_BLACKLIST  → checked before forwarding method calls

bridge/browser-scripts/*             → Called internally by adapters via page.evaluate()
  inject-ui5.ts                      → bridge injection script generator
  find-control.ts                    → control discovery script
  execute-method.ts                  → method execution script
  get-version.ts                     → UI5 version detection
  object-map.ts (R3)                 → UUID storage for non-control objects (Models, etc.)
  get-selector.ts (R3)              → reverse selector generation from control

proxy/dynamic-proxy                  → core-fixtures.ts (ui5 fixture wraps adapter)
  createControlProxy()               → wraps bridge adapter for method forwarding

proxy/discovery + discovery-factory  → core-fixtures.ts (control lookup chain)
  discoverControl()                  → cache → direct-id → recordreplay → registry
  getDiscoveryPriorities()           → strategy chain from selector shape + config

proxy/cache                          → core-fixtures.ts (test-scoped: ControlProxyCache)
  ControlProxyCache                  → LRU cache, init per test, clear() on teardown

proxy/ui5-object + ui5-object-proxy  → return-handler routes non-control results
  UI5Object, createUI5ObjectProxy()  → wraps UUID refs for Models, BindingContexts

proxy/ui5-object-cache               → core-fixtures.ts (test-scoped: UI5ObjectCache)
  UI5ObjectCache                     → TTL-based (5 min) + LRU, clear() on teardown

proxy/return-handler                 → proxy layer (routes method results)
  handleBridgeReturn()               → 7 result types: result, empty, element,
                                       newElement, aggregation, object, none

proxy/proxy-converter                → proxy layer (control vs non-control routing)
  isControlResult()                  → discriminates result type
  convertToControlProxy()            → creates control proxy from result
  convertToObjectProxy()             → creates object proxy from result

proxy/method-filter                  → proxy layer (delegates to bridge blacklist)
proxy/playwright-api                 → proxy GET trap (interaction method routing)
  isPlaywrightMethod()               → checks if method should route to InteractionStrategy
  PLAYWRIGHT_API_METHODS             → 50+ Playwright Locator method names
```

#### Playwright API Wiring (aligned with dhikraft interaction routing)

> **dhikraft pattern**: Interaction methods (`click`, `fill`, `press`, `check`, etc.)
> are explicit class methods on `UI5ControlProxy` that delegate to the configured
> `InteractionStrategy`. The strategy then decides: try UI5 `fire*` methods first
> → fallback to Playwright Locator (`getDomRef()` → `page.locator('#domId').click()`).
> Non-interaction methods (`getText`, `getProperty`, etc.) forward to the bridge via
> `callMethod()` → `page.evaluate()`.
>
> **Praman adaptation (D16 single proxy)**: Since Praman uses a single `Proxy` get trap
> (no class with explicit methods), `playwright-api.ts` serves as the routing decision
> mechanism. The allowlist replaces dhikraft's "is method on the class?" check.

**Current state (Phase 2)**: `playwright-api.ts` exists with allowlist + `isPlaywrightMethod()`,
but is NOT wired into `dynamic-proxy.ts`. All methods currently fall through to bridge.

**Phase 3 wiring required**:

1. **Expand `ControlProxyState`** — add `page` + `interactionStrategy` references:

```typescript
export interface ControlProxyState {
  readonly id: string;
  readonly controlType: string;
  readonly methods: ReadonlySet<string>;
  readonly adapter: BridgeAdapter;
  readonly page: Page; // NEW: needed for Locator creation
  readonly interactionStrategy: InteractionStrategy; // NEW: routes interactions
}
```

2. **Update proxy get trap** — insert Playwright check before blacklist:

```typescript
// In createControlProxy() get trap, AFTER built-in methods, BEFORE blacklist:

// ★ Playwright interaction methods → route to InteractionStrategy
if (isPlaywrightMethod(prop)) {
  return (...args: unknown[]) =>
    routeToInteractionStrategy(state, prop, args);
}

// Blacklist check → throw ControlError
if (isBlacklisted(prop)) { ... }
```

3. **`routeToInteractionStrategy`** — bridges proxy call to strategy:

```typescript
// Gets DOM ref from UI5 control → creates Playwright Locator → calls method
async function routeToInteractionStrategy(
  state: ControlProxyState,
  methodName: string,
  args: unknown[],
): Promise<unknown> {
  // For known interaction verbs (click, fill, press, check, etc.)
  // → delegate to strategy which handles UI5 fire* → Locator fallback
  if (isInteractionVerb(methodName)) {
    return state.interactionStrategy[methodName](state.page, state.id, ...args);
  }

  // For query methods (textContent, innerHTML, getAttribute, etc.)
  // and state methods (isVisible, isEnabled, etc.)
  // → get DOM ref → create Locator → call Playwright method directly
  const domId = await getDomRefId(state.page, state.adapter, state.id);
  const locator = state.page.locator(`#${CSS.escape(domId)}`);
  return (locator[methodName] as Function)(...args);
}
```

4. **Locator creation flow** (aligned with dhikraft):

```
proxy.click()
  ↓
isPlaywrightMethod('click') → YES
  ↓
routeToInteractionStrategy(state, 'click', [])
  ↓
strategy.press(page, controlId)
  ↓
┌──────────────────────────────────────────┐
│ InteractionStrategy (ui5-native default) │
│                                          │
│ 1. page.evaluate: try control.firePress()│
│    → if UI5 fire* exists → done          │
│                                          │
│ 2. fallback: getDomRef() → domId         │
│    → page.locator('#domId').click()       │
│    → Playwright handles the DOM click     │
└──────────────────────────────────────────┘
```

**Test cases for Playwright API wiring**:

| #   | Test Case                                | Input                       | Expected                                             |
| --- | ---------------------------------------- | --------------------------- | ---------------------------------------------------- |
| 1   | `proxy.click()` routes to strategy       | Button proxy + click        | `interactionStrategy.press()` called                 |
| 2   | `proxy.fill()` routes to strategy        | Input proxy + fill          | `interactionStrategy.enterText()` called             |
| 3   | `proxy.isVisible()` routes to Locator    | Any proxy + isVisible       | DOM ref obtained → `locator.isVisible()` called      |
| 4   | `proxy.getAttribute()` routes to Locator | Any proxy + getAttribute    | DOM ref obtained → `locator.getAttribute()` called   |
| 5   | `proxy.getText()` routes to bridge       | Any proxy + getText         | NOT a Playwright method → bridge `callMethod()` used |
| 6   | `proxy.getProperty()` routes to built-in | Any proxy + getProperty     | Built-in resolves first (before Playwright check)    |
| 7   | Strategy fallback when no fire\* method  | Control without `firePress` | getDomRef → Locator click                            |
| 8   | Locator chain methods return Locator     | `proxy.locator('.child')`   | Returns new Playwright Locator (not proxy)           |

#### Bridge Injection Lifecycle (aligned with dhikraft)

> **CRITICAL**: Bridge injection is NOT one-time. After page navigation
> (e.g., FLP tile click, hash change, app-to-app navigation), the bridge
> may be invalidated. dhikraft handles this via:
>
> 1. `page.on('framenavigated', listener)` — clears control cache on
>    main frame navigation
> 2. Next `control()` / `ui5` method call → `ensureBridgeInjected()` →
>    re-checks `isBridgeReady()` → re-injects if bridge is gone
> 3. `ensureBridgeInjected()` must be idempotent (safe to call repeatedly)
>
> **Praman current state**: `injection.ts` uses a `WeakSet<BridgePage>` to
> track injected pages. This prevents re-injection after navigation because
> the page reference is the same object. **Phase 3 must add**:
>
> - `framenavigated` listener in `bridgeAdapter` fixture (or adapter init)
> - On main-frame navigation: remove page from `injectedPages` WeakSet
>   (or check `isBridgeReady()` instead of WeakSet membership)
> - Next adapter method call triggers re-injection automatically
>
> This ensures bridge survives page navigations within the same test.

```
Page loads → about:blank (no bridge)
    │
    ▼
test navigates → page.goto('https://sap-app.example.com')
    │
    ▼
First ui5 method call (e.g., ui5.findControl())
    │
    ▼
adapter.findControl() → ensureBridgeInjected(page)
    │
    ├─ WeakSet has page? NO → injectBridge(page)
    │   ├─ waitForFunction('sap.ui.require')  ← wait for UI5
    │   ├─ page.evaluate(bridgeScript)         ← inject bridge
    │   ├─ waitForFunction('__praman_ready')   ← wait for ready
    │   └─ WeakSet.add(page)
    │
    ▼
Bridge ready → method executes → result returned
    │
    ▼
User clicks FLP tile → framenavigated event fires
    │
    ▼
Navigation listener → WeakSet.delete(page) + proxyCache.clear()
    │
    ▼
Next ui5 method call → ensureBridgeInjected(page)
    │
    ├─ WeakSet has page? NO → re-inject bridge
    │   (same flow as above)
    │
    ▼
Bridge re-injected → test continues with fresh bridge
```

#### Default Interaction Strategy (aligned with dhikraft)

> **Default**: `ui5-native` (direct UI5 fire\* calls — press, enterText, select).
> This matches dhikraft's `playwright-native` strategy (renamed in Praman).
> **RecordReplay is NOT the default** — it is loaded into the bridge but only
> used when explicitly configured via `interactionStrategy: 'opa5'`.
>
> Praman's `strategy-factory.ts` already has this correct:
> `default → UI5NativeStrategy`.
>
> | Strategy     | Default? | Usage                              | Speed             |
> | ------------ | -------- | ---------------------------------- | ----------------- |
> | `ui5-native` | **YES**  | Direct UI5 fire\* calls via bridge | ~50ms/action      |
> | `dom-first`  | No       | DOM events first, UI5 fallback     | ~100-200ms/action |
> | `opa5`       | No       | SAP's OPA5 RecordReplay API        | Enterprise-grade  |

---

## 5. Sub-Phase 3.1 — Foundation (Week 1)

> **Scope**: G2 proxy fix, orphan wiring, core fixtures, auth strategies
> **Gate**: `npm run ci` passes, core fixtures provide adapter/proxy/config/logger

### 5.1 G2: Remove Hardcoded Proxy Stubs (Issue #22)

**File**: `src/proxy/dynamic-proxy.ts` (MODIFY)

**Current code** (lines 108–115 of `resolveBuiltinMethod`):

```typescript
case 'getBindingInfo':
  return async () => undefined;
case 'getDomRef':
  return async () => null;
case 'getVisible':
  return async () => true;
case 'isBound':
  return async () => false;
```

**Fix**: Remove these 4 cases entirely. They will fall through to the existing `adapter.executeMethod()` path in the proxy handler's default behavior. The bridge adapter already handles arbitrary method execution via `executeControlMethod()`.

**Test updates** (`tests/unit/proxy/dynamic-proxy.test.ts`):

| #   | Test Case                              | Input                           | Expected                                                                                         |
| --- | -------------------------------------- | ------------------------------- | ------------------------------------------------------------------------------------------------ |
| 1   | `getBindingInfo` routes through bridge | `proxy.getBindingInfo('value')` | `adapter.executeControlMethod` called with `('id', 'getBindingInfo', ['value'])`                 |
| 2   | `getDomRef` routes through bridge      | `proxy.getDomRef()`             | `adapter.executeControlMethod` called with `('id', 'getDomRef', [])`                             |
| 3   | `getVisible` routes through bridge     | `proxy.getVisible()`            | `adapter.executeControlMethod` called with `('id', 'getVisible', [])`                            |
| 4   | `isBound` routes through bridge        | `proxy.isBound('value')`        | `adapter.executeControlMethod` called with `('id', 'isBound', ['value'])`                        |
| 5   | Return types match UI5 API             | Various calls                   | `getVisible→boolean`, `isBound→boolean`, `getBindingInfo→object\|null`, `getDomRef→object\|null` |

**Estimated LOC change**: -8 (remove stubs), +30 (new tests)

---

### 5.2 Wire Orphaned Browser Scripts (R3)

#### 5.2.1 Wire `object-map.ts` into ClassicAdapter

**File**: `src/bridge/classic-adapter.ts` (MODIFY)

**Change**: Import `createObjectMapScript` and `createObjectCleanupScript`. Call object map initialization during `init()` method, after bridge injection succeeds. Add periodic cleanup call during `destroy()`.

```typescript
// New import
import { createObjectMapScript, createObjectCleanupScript } from './browser-scripts/object-map.js';

// In init() method, after bridge is confirmed ready:
await this.page.evaluate(createObjectMapScript());

// In destroy() method, before final cleanup:
await this.page.evaluate(createObjectCleanupScript());
```

**Why**: Object map stores non-control UI5 objects (Models, BindingContexts) by UUID for cross-boundary access. Without it, `getModel()` and `getBindingContext()` adapter methods cannot return object references.

#### 5.2.2 Wire `get-selector.ts` into BridgeAdapter interface

**File**: `src/bridge/adapter.ts` (MODIFY — add method to interface)

````typescript
/**
 * Reverse-engineer a selector from a discovered control.
 *
 * @param controlId - The UI5 control ID to extract a selector for
 * @returns Selector info with strategy used, or null if control not found
 *
 * @example
 * ```typescript
 * const info = await adapter.getSelectorForControl('__button0');
 * // { selector: { controlType: 'sap.m.Button', properties: { text: 'Save' } }, strategy: 'properties' }
 * ```
 */
getSelectorForControl(
  controlId: string,
): Promise<{ selector: UI5Selector; strategy: string } | null>;
````

**File**: `src/bridge/classic-adapter.ts` (MODIFY — implement method)

```typescript
import { createGetSelectorScript } from './browser-scripts/get-selector.js';

async getSelectorForControl(
  controlId: string,
): Promise<{ selector: UI5Selector; strategy: string } | null> {
  const result = await this.page.evaluate(
    createGetSelectorScript(),
    controlId,
  );
  return result;
}
```

**File**: `src/bridge/webcomponent-adapter.ts` (MODIFY — add stub)
**File**: `src/bridge/hybrid-adapter.ts` (MODIFY — delegate to active adapter)

**Tests**: Add test cases to existing adapter test files.

| #   | Test Case                          | Input                       | Expected                                                            |
| --- | ---------------------------------- | --------------------------- | ------------------------------------------------------------------- |
| 1   | Stable ID → id strategy            | Control with ID `saveBtn`   | `{ selector: { id: 'saveBtn' }, strategy: 'id' }`                   |
| 2   | Auto-gen ID → properties strategy  | Control with ID `__button0` | `{ selector: { controlType, properties }, strategy: 'properties' }` |
| 3   | No distinguishing props → fallback | Control with generic props  | `{ selector: { controlType, id }, strategy: 'fallback' }`           |
| 4   | Unknown control → null             | Non-existent control ID     | `null`                                                              |

**Estimated LOC change**: +5 (adapter.ts interface), +15 (classic-adapter), +5 (webcomponent stub), +5 (hybrid delegate), +40 (tests)

#### 5.2.3 Add `resetInjectionState()` to BridgeAdapter interface

**File**: `src/bridge/adapter.ts` (MODIFY — add method to interface)

```typescript
/**
 * Resets bridge injection tracking for this adapter's page.
 * Called after page navigation events (framenavigated on main frame)
 * to allow re-injection on next UI5 operation.
 *
 * @remarks
 * dhikraft pattern: After FLP tile click, hash change, or app-to-app
 * navigation, the bridge may be invalidated. Calling this method removes
 * the page from the injection tracking WeakSet so ensureBridgeInjected()
 * will re-inject on the next adapter method call.
 */
resetInjectionState(): void;
```

**File**: `src/bridge/classic-adapter.ts` (MODIFY — implement)

```typescript
resetInjectionState(): void {
  // Remove page from injectedPages WeakSet in injection.ts
  resetPageInjection(this.page);
}
```

**File**: `src/bridge/injection.ts` (MODIFY — add reset function)

```typescript
/**
 * Resets injection tracking for a page, allowing re-injection.
 * Called after page navigation invalidates the bridge.
 */
export function resetPageInjection(page: BridgePage): void {
  injectedPages.delete(page);
}
```

**Tests**: Add test cases for reset + re-injection.

| #   | Test Case                              | Input                            | Expected                            |
| --- | -------------------------------------- | -------------------------------- | ----------------------------------- |
| 1   | resetInjectionState clears WeakSet     | Injected page → reset            | `ensureBridgeInjected` re-injects   |
| 2   | Re-injection after navigation succeeds | Navigate → reset → next UI5 call | Bridge re-injected, method succeeds |
| 3   | Reset on non-injected page is no-op    | Page never injected → reset      | No error thrown                     |

**Estimated LOC change**: +3 (adapter.ts interface), +5 (classic-adapter), +5 (injection.ts), +3 (webcomponent stub), +3 (hybrid delegate), +30 (tests)

#### 5.2.4 Update bridge barrel

**File**: `src/bridge/index.ts` (MODIFY — add exports for get-selector types if needed)

**Bridge barrel update needed**: `src/bridge/index.ts` — add `resetPageInjection` export from `injection.ts`. The `getSelectorForControl` and `resetInjectionState` methods are on the `BridgeAdapter` interface (already exported as type).

---

### 5.3 Core Fixtures

**File**: `src/fixtures/core-fixtures.ts` (NEW — ~250 LOC)

This is the foundation fixture file. It provides:

#### Worker-Scoped Fixtures

| Fixture                | Type                     | Auto | Purpose                                                            |
| ---------------------- | ------------------------ | ---- | ------------------------------------------------------------------ |
| `pramanConfig`         | `Readonly<PramanConfig>` | No   | Loads config once per worker via `loadConfig()`. Frozen.           |
| `rootLogger`           | `Logger`                 | No   | Creates pino root logger with redaction. One per worker.           |
| `tracer`               | `TracerWrapper`          | No   | Initializes OTel (NoOp in Phase 1/3). One per worker.              |
| `playwrightCompat`     | `PlaywrightFeatures`     | Yes  | Asserts min version, returns feature flags. Auto for all tests.    |
| `selectorRegistration` | `void`                   | Yes  | Registers `ui5=` selector engine via `playwright.selectors`. Auto. |
| `matcherRegistration`  | `void`                   | Yes  | Calls `expect.extend()` with UI5 + table matchers. Auto.           |

#### Test-Scoped Fixtures

| Fixture         | Type              | Auto | Purpose                                                                  |
| --------------- | ----------------- | ---- | ------------------------------------------------------------------------ |
| `pramanLogger`  | `Logger`          | No   | Child logger bound to test name. Fresh per test.                         |
| `bridgeAdapter` | `BridgeAdapter`   | No   | Creates adapter via factory. Lazy bridge injection. Cleanup on teardown. |
| `ui5`           | `UI5ControlProxy` | No   | Dynamic proxy wrapping bridge adapter. Main test interaction API.        |

**Design Decisions**:

1. **Lazy bridge injection with re-injection on navigation** (W6 from plan2.md, aligned with dhikraft): Bridge is NOT injected during fixture setup. Page starts at `about:blank`. Bridge injects on first `ui5` method call (after navigation). After page navigation events (`framenavigated` on main frame), injection state is reset so the next `ui5` call triggers re-injection. This prevents 30s timeout on fixture init AND ensures bridge survives FLP tile clicks, hash changes, and app-to-app navigation. Default interaction strategy: `ui5-native` (direct UI5 fire\* calls, NOT RecordReplay).

2. **Config loading** (D7): `loadConfig()` reads `praman.config.ts` → env overrides → Zod validation → freeze. Worker-scoped means loaded once, shared across all tests in worker.

3. **Selector registration** (BP-PLAYWRIGHT): `playwright.selectors.register()` is global and must be called before any `page.locator('ui5=...')` usage. Worker-scoped auto ensures it runs once, before any test.

4. **Matcher registration**: `expect.extend()` must be called before any `expect(locator).toHaveUI5Text()`. Worker auto fixture ensures registration.

````typescript
/**
 * Core Praman fixtures — provides bridge adapter, proxy, config, logging, and telemetry.
 *
 * @example
 * ```typescript
 * import { test, expect } from 'playwright-praman';
 *
 * test('check button text', async ({ ui5, page }) => {
 *   await page.goto('https://sap-app.example.com');
 *   const btn = await ui5.findControl({ controlType: 'sap.m.Button', properties: { text: 'Save' } });
 *   await expect(btn).toHaveUI5Text('Save');
 * });
 * ```
 *
 * @module fixtures/core-fixtures
 */

import { test as base, expect } from '@playwright/test';
import type { Logger } from 'pino';
import { loadConfig } from '#core/config/index.js';
import type { PramanConfig } from '#core/config/index.js';
import { createRootLogger, createLogger } from '#core/logging/index.js';
import { initTelemetry } from '#core/telemetry/index.js';
import type { TracerWrapper } from '#core/telemetry/index.js';
import { assertMinVersion, getPlaywrightFeatures } from '#core/compat/index.js';
import type { PlaywrightFeatures } from '#core/compat/index.js';
import { createUI5SelectorEngineScript } from '#selectors/index.js';
import {
  checkUI5Text,
  checkUI5Visible,
  checkUI5Enabled,
  checkUI5Property,
  checkUI5ValueState,
  checkUI5RowCount,
  checkUI5CellText,
  checkUI5SelectedRows,
} from '#matchers/index.js';
import { createBridgeAdapter } from '#bridge/index.js';
import type { BridgeAdapter } from '#bridge/index.js';
````

**Unit Tests** (`tests/unit/fixtures/core-fixtures.test.ts`):

| #   | Test Case                               | Input                           | Expected                                         |
| --- | --------------------------------------- | ------------------------------- | ------------------------------------------------ |
| 1   | Config loaded once per worker           | Two tests in same worker        | `loadConfig()` called once                       |
| 2   | Root logger created with config         | Config with `logLevel: 'debug'` | pino logger at debug level                       |
| 3   | Child logger has test context           | Test named 'my test'            | Logger has `{ module: 'test', test: 'my test' }` |
| 4   | Tracer initialized (NoOp)               | Default config                  | `TracerWrapper` with no-op spans                 |
| 5   | Selector engine registered once         | Worker with 3 tests             | `selectors.register()` called once               |
| 6   | Matchers registered via expect.extend   | Worker init                     | `expect.extend()` called with 8 matchers         |
| 7   | Playwright version checked              | Version >= 1.50.0               | No error thrown                                  |
| 8   | Playwright version too old              | Version < 1.50.0                | `PramanError` with `ERR_CONFIG_INVALID`          |
| 9   | Bridge adapter lazy-initialized         | Access `ui5` without navigation | Adapter not injected until first call            |
| 10  | Bridge re-injects after navigation      | `framenavigated` fires on main  | Injection state reset, next call re-injects      |
| 11  | Bridge ignores iframe navigation        | `framenavigated` on non-main    | Injection state NOT reset                        |
| 12  | Navigation listener removed on teardown | Test completes                  | `page.off('framenavigated')` called              |
| 13  | Bridge adapter destroyed on teardown    | Test completes                  | `adapter.destroy()` called                       |
| 14  | Proxy wraps adapter                     | Access `ui5.getVisible()`       | Delegates to `adapter.executeControlMethod()`    |

**Estimated LOC**: ~250 source, ~200 tests

---

### 5.4 Auth Strategies

**Directory**: `src/auth/strategies/` (6 NEW files)

All strategies implement a common interface:

````typescript
/**
 * Authentication strategy interface.
 * Each strategy handles a specific SAP authentication mechanism.
 *
 * @example
 * ```typescript
 * const strategy = AuthStrategyFactory.create(config);
 * await strategy.authenticate(page, config);
 * const isAuth = await strategy.isAuthenticated(page);
 * ```
 */
export interface AuthStrategy {
  readonly name: string;
  authenticate(page: Page, config: SAPAuthConfig): Promise<void>;
  isAuthenticated(page: Page): Promise<boolean>;
}
````

#### 5.4.1 `auth/strategies/onprem-strategy.ts` (NEW — ~120 LOC)

**Purpose**: Form-based login for on-premise SAP systems (NetWeaver, S/4HANA on-prem).

**Flow**:

1. Navigate to SAP URL
2. Wait for login form (multiple selector fallbacks)
3. Fill username: `#USERNAME_FIELD-inner` → `input[name="sap-user"]`
4. Fill password: `#PASSWORD_FIELD-inner` → `input[name="sap-password"]`
5. Fill client (optional): `#CLIENT_FIELD-inner`
6. Fill language (optional): `input[name="sap-language"]`
7. Submit: `#LOGIN_LINK` → `button[type="submit"]`
8. Wait for shell header: `#shell-header`

**Tests** (`tests/unit/auth/strategies/onprem-strategy.test.ts`):

| #   | Test Case                        | Input                                    | Expected                             |
| --- | -------------------------------- | ---------------------------------------- | ------------------------------------ |
| 1   | Successful login with all fields | URL, user, pass, client, language        | Shell header visible                 |
| 2   | Login without client field       | URL, user, pass (no client)              | Client field skipped, login succeeds |
| 3   | Login form not found (timeout)   | URL pointing to non-SAP page             | `AuthError` with `ERR_AUTH_FAILED`   |
| 4   | Wrong credentials                | Valid URL, wrong password                | `AuthError` with suggestions         |
| 5   | Selector fallback chain works    | Primary selector missing, fallback works | Login succeeds via fallback selector |
| 6   | `isAuthenticated` returns true   | After successful login                   | `true`                               |
| 7   | `isAuthenticated` returns false  | Before login                             | `false`                              |

**Estimated LOC**: ~120 source, ~100 tests

#### 5.4.2 `auth/strategies/cloud-saml-strategy.ts` (NEW — ~130 LOC)

**Purpose**: SAML-based login via SAP Identity Authentication Service (IAS) for SAP Cloud.

**Flow**:

1. Navigate to SAP Cloud URL
2. Redirect to `accounts.cloud.sap` (SAP IAS)
3. Wait for IAS login form
4. Fill email: `input[name="j_username"]` → `#j_username`
5. Fill password: `input[name="j_password"]` → `#j_password`
6. Submit: `#logOnFormSubmit` → `button[type="submit"]`
7. Wait for SAML redirect back to SAP Cloud domain
8. Wait for shell header

**Cloud URL detection patterns**:

- `*.cloud.sap`
- `*.s4hana.cloud.sap`
- `*.hana.ondemand.com`
- `*.cfapps.*.hana.ondemand.com`

**Tests**: 7 test cases (similar pattern to onprem + SAML redirect verification)

**Estimated LOC**: ~130 source, ~100 tests

#### 5.4.3 `auth/strategies/office365-strategy.ts` (NEW — ~130 LOC)

**Purpose**: Microsoft Office 365 / Azure AD authentication (for hybrid BTP environments using Azure AD as IdP).

**Flow**:

1. Navigate to SAP URL
2. Redirect to `login.microsoftonline.com`
3. Fill email: `input[name="loginfmt"]`
4. Click Next
5. Fill password: `input[name="passwd"]`
6. Submit: `input[data-report-event="Signin_Submit"]`
7. Handle "Stay signed in?" prompt (click Yes or No based on config)
8. Wait for SAML redirect back to SAP
9. Wait for shell header

**Tests**: 8 test cases (includes "Stay signed in?" handling, multi-step form)

**Estimated LOC**: ~130 source, ~110 tests

#### 5.4.4 `auth/strategies/api-strategy.ts` (NEW — ~100 LOC)

**Purpose**: Headless API-based authentication using Playwright's `request` context. No browser UI interaction. Ideal for CI/CD pipelines where browser login is unnecessary.

**Flow**:

1. Create `APIRequestContext` via `request.newContext()`
2. POST to login endpoint with form data
3. Extract cookies from response
4. Save to `storageState`
5. Dispose request context

**Tests**: 6 test cases

**Estimated LOC**: ~100 source, ~80 tests

#### 5.4.5 `auth/strategies/certificate-strategy.ts` (NEW — ~90 LOC)

**Purpose**: Client certificate (PKI/SSL) authentication for enterprise environments with mutual TLS.

**Flow**:

1. Create browser context with `clientCertificates` option
2. Navigate to SAP URL (certificate presented automatically)
3. Wait for shell header (no form interaction needed)

**Tests**: 5 test cases

**Estimated LOC**: ~90 source, ~70 tests

#### 5.4.6 `auth/strategies/multi-tenant-strategy.ts` (NEW — ~100 LOC)

**Purpose**: Multi-tenant SAP BTP authentication where tenant ID determines the authentication endpoint.

**Flow**:

1. Resolve tenant URL: subdomain strategy (`tenant.sap-cloud.com`) or parameter strategy (`?sap-client=100`)
2. Delegate to appropriate base strategy (CloudSAML or OnPrem)
3. Handle tenant-specific IDP redirects

**Tests**: 6 test cases

**Estimated LOC**: ~100 source, ~80 tests

#### 5.4.7 `auth/auth-factory.ts` (NEW — ~80 LOC)

**Purpose**: Strategy selection factory with URL-based auto-detection and explicit override.

```typescript
export class AuthStrategyFactory {
  private static readonly customStrategies = new Map<string, AuthStrategy>();

  static create(config: SAPAuthConfig, logger?: Logger): AuthStrategy;
  static register(name: string, strategy: AuthStrategy): void;
  static detectSystemType(url: string): 'cloud' | 'onprem';
}
```

**Selection priority** (from W10 design flow):

1. Explicit `config.strategy` override
2. `config.certificate` present → CertificateStrategy
3. `config.tenant` present → MultiTenantStrategy
4. URL matches cloud patterns → CloudSAMLStrategy
5. Default → OnPremStrategy

**Tests**: 8 test cases (each strategy selection path + custom registration)

**Estimated LOC**: ~80 source, ~80 tests

#### 5.4.8 `auth/auth-checks.ts` (NEW — ~60 LOC)

**Purpose**: Composable helper functions for verifying authentication state. Used by all strategies.

```typescript
export async function isShellVisible(page: Page): Promise<boolean>;
export async function isUserMenuVisible(page: Page): Promise<boolean>;
export async function isUI5Loaded(page: Page): Promise<boolean>;
export async function isLoginPageVisible(page: Page): Promise<boolean>;
export async function isAuthenticated(page: Page): Promise<boolean>;
```

**Tests**: 5 test cases

**Estimated LOC**: ~60 source, ~50 tests

---

## 6. Sub-Phase 3.2 — Wiring + Auth Setup (Week 2)

> **Scope**: Wire all Phase 1 modules, auth handler + setup project, navigation module
> **Gate**: `npm run ci` passes, all Phase 1 modules consumed, auth pipeline functional

### 6.1 Wire Phase 1 Infrastructure into Fixtures

This is the R2 resolution — wiring 8 unconsumed Phase 1 modules into the fixture lifecycle.

#### 6.1.1 Logging Wiring

**Files modified**: `fixtures/core-fixtures.ts`, all auth strategies, `modules/navigation.ts`

**Pattern**: Every module gets a child logger via `createLogger(moduleName, rootLogger)`:

| Module             | Logger Name | Key Log Points                                                      |
| ------------------ | ----------- | ------------------------------------------------------------------- |
| core-fixtures      | `fixture`   | Worker init, selector registration, matcher registration            |
| auth strategies    | `auth`      | Login attempt, redirect detection, credential fill, success/failure |
| auth-handler       | `auth`      | Retry attempts, session state, strategy selection                   |
| navigation         | `nav`       | Navigate to app/tile/hash, waitForStable after nav, back/forward    |
| workzone           | `workzone`  | Iframe detection, dual bridge injection, frame switching            |
| stability-fixtures | `stability` | WalkMe/analytics blocked, stability wait triggers                   |

**Log level usage** (D5 L2):

- `logger.error()` — Auth failure, bridge injection failure, control not found
- `logger.warn()` — Retry attempt, fallback selector used, session near expiry
- `logger.info()` — Navigation complete, auth success, fixture init/destroy
- `logger.debug()` — Config values, selector parsing, strategy selection, bridge messages

#### 6.1.2 Telemetry Wiring

**Files modified**: `fixtures/core-fixtures.ts`

**Pattern**: Wrap bridge adapter calls in OTel spans:

```typescript
bridgeAdapter: async ({ pramanConfig, rootLogger, tracer, page }, use) => {
  const logger = createLogger('bridge', rootLogger);
  const adapter = createBridgeAdapter({
    mode: pramanConfig.adapterMode ?? 'auto',
  });

  // Initialize adapter with page (bridge injection is lazy — triggers on first UI5 op)
  await adapter.init(page);

  // CRITICAL (dhikraft pattern): Listen for page navigation events.
  // After navigation (FLP tile click, hash change, app-to-app),
  // bridge may be invalidated. Clear injection tracking so next
  // adapter method call triggers re-injection via ensureBridgeInjected().
  const navigationListener = (frame: import('@playwright/test').Frame) => {
    if (frame === page.mainFrame()) {
      logger.debug('Main frame navigated — clearing bridge injection state');
      adapter.resetInjectionState();  // removes page from WeakSet
      // proxyCache.clear() handled separately in proxy fixture
    }
  };
  page.on('framenavigated', navigationListener);

  // Wrap adapter methods with telemetry spans
  const tracedAdapter = wrapAdapterWithTelemetry(adapter, tracer);

  await use(tracedAdapter);

  // Teardown: remove listener + destroy adapter
  page.off('framenavigated', navigationListener);
  await adapter.destroy();
},
```

**`wrapAdapterWithTelemetry`** creates a proxy that wraps each method call in `tracer.withSpan()`:

- Span name: `praman.bridge.{methodName}` (e.g., `praman.bridge.findControl`)
- Attributes: `ui5.controlType`, `ui5.id` from selector (via `spanAttributes()`)
- Error recording: `tracer.recordException()` on failures

**Estimated LOC**: ~40 (helper function in core-fixtures or separate utility)

#### 6.1.3 Retry Wiring

**Files modified**: `auth/auth-handler.ts`

**Pattern**: Auth login uses `retry()` from `#core/utils/retry`:

```typescript
import { retry } from '#core/utils/retry.js';

async login(config: SAPAuthConfig): Promise<void> {
  await retry(
    async () => {
      await this.strategy.authenticate(this.page, config);
      const isAuth = await this.strategy.isAuthenticated(this.page);
      if (!isAuth) {
        throw new AuthError({
          code: 'ERR_AUTH_FAILED',
          message: 'Authentication verification failed after login',
          attempted: `Authenticate as ${config.username}`,
          retryable: true,
          suggestions: ['Check credentials', 'Verify SAP system is accessible'],
        });
      }
    },
    {
      maxRetries: config.retryCount ?? 1,
      baseDelay: config.retryDelay ?? 2000,
      shouldRetry: (error) => error instanceof AuthError && error.retryable,
    },
  );
}
```

#### 6.1.4 Step-Decorator Wiring

**Files modified**: `fixtures/nav-fixtures.ts`, `fixtures/auth-fixtures.ts`, `fixtures/core-fixtures.ts`

**Pattern**: Wrap user-facing fixture actions in `withStep()` for Playwright trace/report:

```typescript
import { withStep, createStepName } from '#core/utils/step-decorator.js';

// In navigation fixture:
async navigateToApp(appId: string): Promise<void> {
  await withStep(
    createStepName('nav', 'navigateToApp', appId),
    async () => {
      await this.page.goto(`${this.baseURL}#${appId}`);
      await waitForUI5Stable(this.page);
    },
  );
}
```

Step names appear in Playwright HTML reports: `nav > navigateToApp: PurchaseOrder-manage`

#### 6.1.5 Wait-Helpers Wiring

**Files modified**: `fixtures/stability-fixtures.ts`, `fixtures/nav-fixtures.ts`

**Pattern**: `waitForUI5Stable()` called after every navigation. `waitForUI5Bootstrap()` called on first page load. `briefDOMSettle()` after property changes.

#### 6.1.6 PlaywrightCompat Wiring

**Files modified**: `fixtures/core-fixtures.ts` (worker auto fixture)

**Pattern**: Worker-scoped auto fixture checks version and exposes features:

```typescript
playwrightCompat: [async ({}, use) => {
  assertMinVersion('1.50.0');
  const features = getPlaywrightFeatures();
  await use(features);
}, { scope: 'worker', auto: true }],
```

Features used by other fixtures:

- `hasBoxedStep` → use `{ box: true }` for infrastructure fixtures
- `hasCustomExpect` → enable custom matchers
- `hasAriaSnapshot` → future accessibility testing

---

### 6.2 Stability Fixtures

**File**: `src/fixtures/stability-fixtures.ts` (NEW — ~100 LOC)

**Purpose**: Auto test-scoped fixture that provides UI5 stability and request interception.

| Fixture              | Type   | Auto | Purpose                                             |
| -------------------- | ------ | ---- | --------------------------------------------------- |
| `requestInterceptor` | `void` | Yes  | Blocks WalkMe/analytics requests via `page.route()` |
| `ui5Stability`       | `void` | Yes  | Calls `waitForUI5Stable()` after frame navigations  |

**Request Interception** (D23, D25):

```typescript
requestInterceptor: [async ({ page, pramanConfig }, use) => {
  const patterns = pramanConfig.ignorePatterns ?? DEFAULT_IGNORE_PATTERNS;
  for (const pattern of patterns) {
    await page.route(new RegExp(pattern), (route) => route.abort());
  }
  await use();
  // Teardown: routes auto-cleared when context closes
}, { auto: true }],
```

**UI5 Stability Auto-Wait**:

```typescript
ui5Stability: [async ({ page, pramanConfig }, use) => {
  const skip = pramanConfig.skipStabilityWait ?? false;
  if (!skip) {
    page.on('framenavigated', async () => {
      try {
        await waitForUI5Stable(page, {
          timeout: pramanConfig.ui5WaitTimeout ?? DEFAULT_TIMEOUTS.UI5_WAIT,
        });
      } catch {
        // Non-fatal: page may not have UI5 yet
      }
    });
  }
  await use();
}, { auto: true }],
```

**Tests** (`tests/unit/fixtures/stability-fixtures.test.ts`):

| #   | Test Case                            | Input                            | Expected                    |
| --- | ------------------------------------ | -------------------------------- | --------------------------- |
| 1   | WalkMe requests blocked              | Request to `walkme.com`          | Route aborted               |
| 2   | Analytics requests blocked           | Request to `analytics.google`    | Route aborted               |
| 3   | Normal requests pass through         | Request to `sap-cloud.com/odata` | Route fulfilled             |
| 4   | Custom ignore patterns from config   | Config with custom pattern       | Custom pattern blocked      |
| 5   | skipStabilityWait disables auto-wait | Config `skipStabilityWait: true` | No `waitForUI5Stable` calls |
| 6   | Stability wait fires on navigation   | Page navigates to new hash       | `waitForUI5Stable()` called |

**Estimated LOC**: ~100 source, ~80 tests

---

### 6.3 Auth Handler + Setup Project

#### 6.3.1 `auth/auth-handler.ts` (NEW — ~150 LOC)

**Purpose**: Session management, retry, state tracking. Orchestrates strategy execution.

```typescript
export class SAPAuthHandler {
  private readonly strategy: AuthStrategy;
  private readonly logger: Logger;
  private authenticated = false;
  private sessionInfo: SessionInfo | null = null;
  private loginTimestamp: number | null = null;

  constructor(options: { strategy: AuthStrategy; logger: Logger });

  async login(config: SAPAuthConfig): Promise<void>;
  async loginFromEnv(): Promise<void>;
  async logout(page: Page): Promise<void>;
  async isAuthenticated(page: Page): Promise<boolean>;
  isSessionExpired(): boolean;
  getSessionInfo(): Readonly<SessionInfo> | null;
}
```

**Environment variable mapping** (for `loginFromEnv()`):

| Env Variable           | Config Field     | Default   |
| ---------------------- | ---------------- | --------- |
| `SAP_ACTIVE_SYSTEM`    | N/A (routing)    | `'cloud'` |
| `SAP_CLOUD_BASE_URL`   | `url`            | —         |
| `SAP_CLOUD_USERNAME`   | `username`       | —         |
| `SAP_CLOUD_PASSWORD`   | `password`       | —         |
| `SAP_ONPREM_BASE_URL`  | `url`            | —         |
| `SAP_ONPREM_USERNAME`  | `username`       | —         |
| `SAP_ONPREM_PASSWORD`  | `password`       | —         |
| `SAP_CLIENT`           | `client`         | —         |
| `SAP_LANGUAGE`         | `language`       | `'EN'`    |
| `SAP_AUTH_STRATEGY`    | `strategy`       | auto      |
| `SAP_AUTH_RETRY_COUNT` | `retryCount`     | `1`       |
| `SAP_SESSION_TIMEOUT`  | `sessionTimeout` | `3600`    |

**Tests**: 12 test cases

**Estimated LOC**: ~150 source, ~120 tests

#### 6.3.2 `auth/auth.setup.ts` (NEW — ~80 LOC)

**Purpose**: Playwright setup project file (D28 pattern). Runs as a regular test before all other tests. Produces `storageState` for dependent projects.

```typescript
import { test as setup, expect } from '@playwright/test';
import { SAPAuthHandler } from './auth-handler.js';
import { AuthStrategyFactory } from './auth-factory.js';
import { createLogger } from '#core/logging/index.js';

const authFile = '.auth/sap-session.json';

setup('SAP authentication', async ({ page, context }) => {
  const logger = createLogger('auth-setup');

  await setup.step('Load auth config from environment', async () => {
    // Load SAP_CLOUD_*, SAP_ONPREM_* from env
  });

  await setup.step('Select auth strategy', async () => {
    // Factory auto-detection or explicit strategy
  });

  await setup.step('Authenticate', async () => {
    // handler.login(config) with retry
  });

  await setup.step('Verify authentication', async () => {
    // isAuthenticated(page) check
  });

  await setup.step('Save session state', async () => {
    await context.storageState({ path: authFile });
  });
});
```

#### 6.3.3 `auth/auth.teardown.ts` (NEW — ~30 LOC)

```typescript
import { test as teardown } from '@playwright/test';
import { rmSync } from 'node:fs';

teardown('SAP auth cleanup', async () => {
  rmSync('.auth', { recursive: true, force: true });
});
```

**Tests**: Setup/teardown are integration tests (deferred to Phase 7 with INT1/INT2).

---

### 6.4 Auth Fixtures

**File**: `src/fixtures/auth-fixtures.ts` (NEW — ~120 LOC)

```typescript
import { test as base } from '@playwright/test';
import type { SAPAuthConfig } from './types.js';

export interface AuthFixtureOptions {
  sapAuthConfig: SAPAuthConfig;
}

export interface AuthFixtures {
  sapAuth: SAPAuthHandler;
}

export const authTest = base.extend<AuthFixtures & AuthFixtureOptions>({
  // Fixture option: configurable per project in playwright.config.ts
  sapAuthConfig: [
    {
      url: '',
      username: '',
      password: '',
    },
    { option: true },
  ],

  // AUTH MODEL (aligned with dhikraft):
  // - Auth is handled ONCE by setup project (auth.setup.ts, Section 4.3)
  // - Tests receive pre-authenticated storageState via playwright.config.ts
  // - This fixture does NOT auto-login
  // - It only initializes the strategy for status checks (isAuthenticated())
  //   and explicit operations (manual login/logout if needed)
  // - No auto-logout on cleanup — session managed globally by setup project
  //   and persists across all tests in the suite
  sapAuth: async ({ page, sapAuthConfig, pramanConfig }, use) => {
    const logger = createLogger('auth');
    const handler = new SAPAuthHandler(page, pramanConfig.logLevel);

    // Initialize strategy for auth status checks only (no auto-login)
    // This allows isAuthenticated() to work with setup project's storageState
    const strategy = AuthStrategyFactory.create(sapAuthConfig, logger);
    handler.initializeStrategy(strategy);

    // NOTE: No auto-authentication — relies on setup project (D28)
    // Tests should use setup project to authenticate once before all tests
    // This fixture is available for explicit auth operations only

    await use(handler);

    // No auto-logout on cleanup — session managed by setup project
    // Auth session persists for next tests in the suite
  },
});
```

**Tests** (`tests/unit/fixtures/auth-fixtures.test.ts`):

| #   | Test Case                               | Input                          | Expected                                    |
| --- | --------------------------------------- | ------------------------------ | ------------------------------------------- |
| 1   | sapAuth fixture creates handler         | Valid config                   | `SAPAuthHandler` instance                   |
| 2   | sapAuth does NOT auto-login             | Handler after fixture init     | `authenticated === false` (no auto-login)   |
| 3   | sapAuth does NOT auto-logout on cleanup | Handler after fixture teardown | No `logout()` called                        |
| 4   | sapAuth initializes strategy for checks | Valid config                   | `isAuthenticated()` works with storageState |
| 5   | sapAuthConfig is fixture option         | Custom config per project      | Config passed to handler                    |
| 6   | Strategy auto-detected from URL         | Cloud URL in config            | `CloudSAMLStrategy` selected                |
| 7   | Strategy explicit override              | `strategy: 'onprem'` in config | `OnPremStrategy` selected                   |

**Estimated LOC**: ~140 source, ~80 tests

---

### 6.5 Navigation Module

**File**: `src/modules/navigation.ts` (NEW — ~200 LOC)

**Purpose**: FLP navigation functions. All functions accept `Page` + optional config. All call `waitForUI5Stable()` after navigation.

```typescript
export async function navigateToApp(
  page: Page,
  appId: string,
  options?: NavigationOptions,
): Promise<void>;

export async function navigateToTile(
  page: Page,
  tileTitle: string,
  options?: NavigationOptions,
): Promise<void>;

export async function navigateToIntent(
  page: Page,
  intent: string,
  params?: Record<string, string>,
  options?: NavigationOptions,
): Promise<void>;

export async function navigateToHash(
  page: Page,
  hash: string,
  options?: NavigationOptions,
): Promise<void>;

export async function navigateToHome(page: Page, options?: NavigationOptions): Promise<void>;

export async function navigateBack(page: Page, options?: NavigationOptions): Promise<void>;

export async function searchAndOpenApp(
  page: Page,
  appTitle: string,
  options?: NavigationOptions,
): Promise<void>;

export async function getCurrentHash(page: Page): Promise<string>;
```

**NavigationOptions interface**:

```typescript
export interface NavigationOptions {
  readonly timeout?: number;
  readonly waitForStable?: boolean;
  readonly baseURL?: string;
}
```

**Tests** (`tests/unit/modules/navigation.test.ts`):

| #   | Test Case                       | Input                                  | Expected                                |
| --- | ------------------------------- | -------------------------------------- | --------------------------------------- |
| 1   | Navigate to app by ID           | `'PurchaseOrder-manage'`               | `page.goto()` with hash, stability wait |
| 2   | Navigate to tile by title       | `'Manage Purchase Orders'`             | Tile locator clicked, stability wait    |
| 3   | Navigate to intent with params  | `'PurchaseOrder-display', { PO: '1' }` | Hash with parameters, stability wait    |
| 4   | Navigate to home                | N/A                                    | `#Shell-home` hash, stability wait      |
| 5   | Navigate back                   | N/A                                    | Shell back button or `page.goBack()`    |
| 6   | Search and open app             | `'Purchase Orders'`                    | Search bar filled, app clicked          |
| 7   | Get current hash                | Page at `#PurchaseOrder-manage`        | `'PurchaseOrder-manage'`                |
| 8   | Stability wait after navigation | Navigate to app                        | `waitForUI5Stable()` called             |
| 9   | Custom timeout                  | `{ timeout: 5000 }`                    | Timeout passed to stability wait        |
| 10  | `NavigationError` on failure    | Tile not found                         | `NavigationError` with suggestions      |

**Estimated LOC**: ~200 source, ~150 tests

---

### 6.6 Navigation Fixtures

**File**: `src/fixtures/nav-fixtures.ts` (NEW — ~200 LOC)

```typescript
export interface NavFixtures {
  ui5Navigation: UI5NavigationAPI;
  btpWorkZone: BTPWorkZoneAPI;
}

export const navTest = base.extend<NavFixtures>({
  ui5Navigation: async ({ page, pramanConfig, pramanLogger }, use) => {
    const logger = createLogger('nav', pramanLogger);
    const nav: UI5NavigationAPI = {
      navigateToApp: (appId, options?) =>
        withStep(createStepName('nav', 'navigateToApp', appId), () =>
          navigateToApp(page, appId, { baseURL: pramanConfig.baseURL, ...options }),
        ),
      navigateToTile: (title, options?) =>
        withStep(createStepName('nav', 'navigateToTile', title), () =>
          navigateToTile(page, title, options),
        ),
      navigateToIntent: (intent, params?, options?) =>
        withStep(createStepName('nav', 'navigateToIntent', intent), () =>
          navigateToIntent(page, intent, params, options),
        ),
      navigateToHash: (hash, options?) =>
        withStep(createStepName('nav', 'navigateToHash', hash), () =>
          navigateToHash(page, hash, options),
        ),
      navigateToHome: (options?) =>
        withStep(createStepName('nav', 'navigateToHome'), () => navigateToHome(page, options)),
      navigateBack: (options?) =>
        withStep(createStepName('nav', 'navigateBack'), () => navigateBack(page, options)),
      searchAndOpenApp: (title, options?) =>
        withStep(createStepName('nav', 'searchAndOpenApp', title), () =>
          searchAndOpenApp(page, title, options),
        ),
      getCurrentHash: () => getCurrentHash(page),
    };
    await use(nav);
  },

  btpWorkZone: async ({ page, bridgeAdapter, pramanLogger }, use) => {
    // Deferred to Sub-Phase 3.3
    await use(null as unknown as BTPWorkZoneAPI);
  },
});
```

**Tests**: 6 test cases (fixture wiring, step decoration, logger binding)

**Estimated LOC**: ~200 source, ~80 tests

---

## 7. Sub-Phase 3.3 — WorkZone + Assembly (Week 3)

> **Scope**: BTP WorkZone dual-frame support, final fixture assembly, barrel updates
> **Gate**: Full `npm run ci`, all exports validated by attw

### 7.1 WorkZone Module

**File**: `src/modules/workzone.ts` (NEW — ~200 LOC)

**Purpose**: BTP WorkZone dual-frame bridge injection and context switching.

```typescript
export interface BTPWorkZoneManager {
  detect(): Promise<boolean>;
  enableDualBridge(page: Page, adapter: BridgeAdapter): Promise<void>;
  switchToShell(): Page;
  switchToApp(): FrameLocator;
  getAppFrame(): FrameLocator;
  navigateToApp(appId: string): Promise<void>;
  getCurrentApp(): Promise<string | null>;
  isAppReady(timeout?: number): Promise<boolean>;
}

export function createWorkZoneManager(
  page: Page,
  adapter: BridgeAdapter,
  logger: Logger,
): BTPWorkZoneManager;
```

**Dual-bridge injection**:

1. Main frame: `page.evaluate(injectBridge)` — injects into shell page
2. App iframe: `frameLocator.evaluate(injectBridge)` — injects into app frame
3. All UI5 operations target the app iframe by default
4. Shell operations (tile click, navigation bar) target the main frame

**Tests** (`tests/unit/modules/workzone.test.ts`):

| #   | Test Case                    | Input                  | Expected                               |
| --- | ---------------------------- | ---------------------- | -------------------------------------- |
| 1   | Detect WorkZone environment  | Page with shell iframe | `true`                                 |
| 2   | Non-WorkZone environment     | Standard FLP page      | `false`                                |
| 3   | Enable dual bridge injection | WorkZone page          | Bridge in both frames                  |
| 4   | Switch to app frame          | After enableDualBridge | `FrameLocator` for app iframe          |
| 5   | Switch to shell frame        | After enableDualBridge | `Page` reference for shell             |
| 6   | Navigate to app in WorkZone  | App ID                 | App iframe updated, bridge re-injected |
| 7   | Get current app name         | Active app in iframe   | App semantic object returned           |
| 8   | App readiness check          | App loading            | Waits for UI5 stable in iframe         |

**Estimated LOC**: ~200 source, ~120 tests

### 7.2 WorkZone Fixtures (update nav-fixtures.ts)

**File**: `src/fixtures/nav-fixtures.ts` (MODIFY — replace btpWorkZone stub)

```typescript
btpWorkZone: async ({ page, bridgeAdapter, pramanLogger }, use) => {
  const logger = createLogger('workzone', pramanLogger);
  const manager = createWorkZoneManager(page, bridgeAdapter, logger);
  await use(manager);
},
```

### 7.3 Fixture Assembly

**File**: `src/fixtures/index.ts` (REPLACE — ~60 LOC)

````typescript
/**
 * Praman fixture assembly — single entry point for all test fixtures.
 *
 * @example
 * ```typescript
 * import { test, expect } from 'playwright-praman';
 *
 * test('my SAP test', async ({ ui5, sapAuth, ui5Navigation, btpWorkZone }) => {
 *   // All fixtures available through single import
 * });
 * ```
 *
 * @module fixtures
 */

import { mergeTests } from '@playwright/test';
import { coreTest } from './core-fixtures.js';
import { authTest } from './auth-fixtures.js';
import { navTest } from './nav-fixtures.js';
import { stabilityTest } from './stability-fixtures.js';

export const test = mergeTests(coreTest, authTest, navTest, stabilityTest);
export { expect } from '@playwright/test';

// Re-export types for consumer convenience
export type { PramanConfig } from '#core/config/index.js';
export type { BridgeAdapter } from '#bridge/index.js';
export type { SAPAuthConfig, AuthStrategy } from '../auth/index.js';
export type { UI5NavigationAPI, BTPWorkZoneAPI } from './nav-fixtures.js';
````

**Tests** (`tests/unit/fixtures/index.test.ts`):

| #   | Test Case                            | Input                            | Expected                         |
| --- | ------------------------------------ | -------------------------------- | -------------------------------- |
| 1   | `test` includes all core fixtures    | Destructure `{ ui5 }`            | Available                        |
| 2   | `test` includes auth fixtures        | Destructure `{ sapAuth }`        | Available                        |
| 3   | `test` includes nav fixtures         | Destructure `{ ui5Navigation }`  | Available                        |
| 4   | `test` includes stability fixtures   | Auto fixtures run                | Request interception active      |
| 5   | `expect` re-exported from Playwright | `expect(locator).toBeVisible()`  | Standard Playwright expect works |
| 6   | Worker fixtures shared across tests  | Two tests, check config identity | Same `pramanConfig` instance     |

**Estimated LOC**: ~60 source, ~60 tests

---

## 8. Complete File Inventory

### 8.1 Source Files (New)

| #   | File Path                                      | Module   | LOC  | Sub-Phase |
| --- | ---------------------------------------------- | -------- | ---- | --------- |
| 1   | `src/fixtures/core-fixtures.ts`                | Fixtures | ~250 | 3.1       |
| 2   | `src/auth/strategies/onprem-strategy.ts`       | Auth     | ~120 | 3.1       |
| 3   | `src/auth/strategies/cloud-saml-strategy.ts`   | Auth     | ~130 | 3.1       |
| 4   | `src/auth/strategies/office365-strategy.ts`    | Auth     | ~130 | 3.1       |
| 5   | `src/auth/strategies/api-strategy.ts`          | Auth     | ~100 | 3.1       |
| 6   | `src/auth/strategies/certificate-strategy.ts`  | Auth     | ~90  | 3.1       |
| 7   | `src/auth/strategies/multi-tenant-strategy.ts` | Auth     | ~100 | 3.1       |
| 8   | `src/auth/auth-factory.ts`                     | Auth     | ~80  | 3.1       |
| 9   | `src/auth/auth-checks.ts`                      | Auth     | ~60  | 3.1       |
| 10  | `src/auth/auth-types.ts`                       | Auth     | ~80  | 3.1       |
| 11  | `src/fixtures/stability-fixtures.ts`           | Fixtures | ~100 | 3.2       |
| 12  | `src/auth/auth-handler.ts`                     | Auth     | ~150 | 3.2       |
| 13  | `src/auth/auth.setup.ts`                       | Auth     | ~80  | 3.2       |
| 14  | `src/auth/auth.teardown.ts`                    | Auth     | ~30  | 3.2       |
| 15  | `src/fixtures/auth-fixtures.ts`                | Fixtures | ~120 | 3.2       |
| 16  | `src/modules/navigation.ts`                    | Modules  | ~200 | 3.2       |
| 17  | `src/fixtures/nav-fixtures.ts`                 | Fixtures | ~200 | 3.2       |
| 18  | `src/modules/workzone.ts`                      | Modules  | ~200 | 3.3       |
| 19  | `src/fixtures/index.ts`                        | Fixtures | ~60  | 3.3       |

### 8.2 Source Files (Modified)

| #   | File Path                            | Change                                                                  | Sub-Phase |
| --- | ------------------------------------ | ----------------------------------------------------------------------- | --------- |
| 20  | `src/proxy/dynamic-proxy.ts`         | Remove 4 G2 stubs (3.1) + wire Playwright API interaction routing (3.2) | 3.1, 3.2  |
| 21  | `src/bridge/adapter.ts`              | Add `getSelectorForControl()` + `resetInjectionState()` to interface    | 3.1       |
| 22  | `src/bridge/classic-adapter.ts`      | Import object-map + get-selector, implement both new methods            | 3.1       |
| 23  | `src/bridge/webcomponent-adapter.ts` | Add `getSelectorForControl()` + `resetInjectionState()` stubs           | 3.1       |
| 24  | `src/bridge/hybrid-adapter.ts`       | Delegate both new methods to active adapter                             | 3.1       |
| 24b | `src/bridge/injection.ts`            | Add `resetPageInjection()` export for navigation re-injection           | 3.1       |
| 25  | `src/auth/index.ts`                  | Update barrel with auth exports                                         | 3.3       |
| 26  | `src/modules/index.ts`               | Update barrel with navigation + workzone exports                        | 3.3       |
| 27  | `src/index.ts`                       | Add `test`, `expect` re-exports from fixtures                           | 3.3       |

### 8.3 Test Files (New)

| #   | Test File Path                                             | Tests Est. | Sub-Phase |
| --- | ---------------------------------------------------------- | ---------- | --------- |
| 1   | `tests/unit/fixtures/core-fixtures.test.ts`                | 14         | 3.1       |
| 2   | `tests/unit/auth/strategies/onprem-strategy.test.ts`       | 7          | 3.1       |
| 3   | `tests/unit/auth/strategies/cloud-saml-strategy.test.ts`   | 7          | 3.1       |
| 4   | `tests/unit/auth/strategies/office365-strategy.test.ts`    | 8          | 3.1       |
| 5   | `tests/unit/auth/strategies/api-strategy.test.ts`          | 6          | 3.1       |
| 6   | `tests/unit/auth/strategies/certificate-strategy.test.ts`  | 5          | 3.1       |
| 7   | `tests/unit/auth/strategies/multi-tenant-strategy.test.ts` | 6          | 3.1       |
| 8   | `tests/unit/auth/auth-factory.test.ts`                     | 8          | 3.1       |
| 9   | `tests/unit/auth/auth-checks.test.ts`                      | 5          | 3.1       |
| 10  | `tests/unit/fixtures/stability-fixtures.test.ts`           | 6          | 3.2       |
| 11  | `tests/unit/auth/auth-handler.test.ts`                     | 12         | 3.2       |
| 12  | `tests/unit/fixtures/auth-fixtures.test.ts`                | 7          | 3.2       |
| 13  | `tests/unit/modules/navigation.test.ts`                    | 10         | 3.2       |
| 14  | `tests/unit/fixtures/nav-fixtures.test.ts`                 | 6          | 3.2       |
| 15  | `tests/unit/modules/workzone.test.ts`                      | 8          | 3.3       |
| 16  | `tests/unit/fixtures/index.test.ts`                        | 6          | 3.3       |

### 8.4 Test Helpers (New)

| #   | File Path                               | Purpose                                                                           |
| --- | --------------------------------------- | --------------------------------------------------------------------------------- |
| 1   | `tests/helpers/mock-playwright-test.ts` | Mock `test.extend()`, `mergeTests()`, `expect.extend()` for unit testing fixtures |
| 2   | `tests/helpers/mock-auth-page.ts`       | Mock Page with SAP login form selectors for auth strategy testing                 |

### 8.5 Summary

| Metric           | Count  |
| ---------------- | ------ |
| New source files | 19     |
| Modified files   | 8      |
| New test files   | 16     |
| New test helpers | 2      |
| Total new LOC    | ~2,530 |
| Total new tests  | ~115   |

---

## 9. Test Plan

### 9.1 Testing Strategy: TDD

For each module:

1. Write test file (RED)
2. Run tests — all fail
3. Implement source file
4. Run tests — all pass (GREEN)
5. Refactor (tests still pass)
6. Run `npm run ci` validation

### 9.2 Coverage Targets

| Tier       | Scope                               | Statements | Branches | Functions | Lines |
| ---------- | ----------------------------------- | ---------- | -------- | --------- | ----- |
| **Tier 2** | `src/auth/**`                       | 95%        | 90%      | 95%       | 95%   |
| **Tier 3** | `src/fixtures/**`, `src/modules/**` | 90%        | 85%      | 90%       | 90%   |

**Per-file enforcement**: `perFile: true` — no file can hide behind project averages.

### 9.3 Mock Strategy

- **Page**: Mock `page.goto()`, `page.evaluate()`, `page.waitForFunction()`, `page.route()`, `page.locator()` — use `tests/helpers/mock-page.ts` (existing) + `tests/helpers/mock-auth-page.ts` (new)
- **BridgeAdapter**: Use existing `tests/helpers/mock-bridge-adapter.ts` — all adapter method calls are mocked
- **Playwright test**: Mock `test.extend()`, `mergeTests()`, `expect.extend()` — use `tests/helpers/mock-playwright-test.ts` (new)
- **Config**: Use existing `tests/helpers/mock-config.ts` — factory with overrides
- **pino logger**: Mock via `vi.mock('pino')` — verify log calls without real I/O
- **File system**: `vi.mock('node:fs')` for auth state file operations
- **process.env**: `vi.stubEnv()` for environment variable tests

### 9.4 Type-Level Tests

| #   | Test Case                          | Assertion                                                                     |
| --- | ---------------------------------- | ----------------------------------------------------------------------------- |
| 1   | All fixtures available via `test`  | `expectTypeOf<Parameters<typeof test>[1]>` includes all fixture types         |
| 2   | `SAPAuthConfig` fields are correct | `expectTypeOf<SAPAuthConfig>().toExtend<{ url: string; username: string }>()` |
| 3   | `AuthStrategy` interface complete  | `expectTypeOf<AuthStrategy>().toHaveProperty('authenticate')`                 |
| 4   | `UI5NavigationAPI` methods exist   | `expectTypeOf<UI5NavigationAPI>().toHaveProperty('navigateToApp')`            |

---

## 10. Impact Analysis

### 10.1 Files Modified (Existing)

| File                                 | Change                                     | Risk   |
| ------------------------------------ | ------------------------------------------ | ------ |
| `src/proxy/dynamic-proxy.ts`         | Remove 4 stub cases (G2)                   | Low    |
| `src/bridge/adapter.ts`              | Add `getSelectorForControl()` method       | Medium |
| `src/bridge/classic-adapter.ts`      | Import 2 browser scripts, implement method | Low    |
| `src/bridge/webcomponent-adapter.ts` | Add stub method                            | Low    |
| `src/bridge/hybrid-adapter.ts`       | Delegate new method                        | Low    |
| `src/auth/index.ts`                  | Replace empty barrel with exports          | Low    |
| `src/modules/index.ts`               | Replace empty barrel with exports          | Low    |
| `src/index.ts`                       | Add `test`, `expect` exports               | Medium |

### 10.2 Build Impact

| Metric       | Before Phase 3 | After Phase 3 | Delta  |
| ------------ | -------------- | ------------- | ------ |
| Source files | 90             | 117           | +27    |
| Test files   | 73             | 91            | +18    |
| Total LOC    | ~19,000        | ~21,530       | +2,530 |
| Test cases   | 929            | ~1,044        | +115   |
| Barrel files | 9 empty + 12   | 0 empty + 21  | +9     |

### 10.3 Breaking Changes

**None** for external consumers. All new exports are additive. The main `src/index.ts` gains `test` and `expect` exports but existing exports remain unchanged.

**Internal breaking change**: `BridgeAdapter` interface gains `getSelectorForControl()` and `resetInjectionState()` methods. All 3 adapter implementations must be updated (done in batch B1b). `injection.ts` gains `resetPageInjection()` export.

### 10.4 Dependency Impact

No new npm dependencies needed. All required packages already installed:

- `pino` — logging (Phase 1)
- `@playwright/test` — fixtures, `test.extend()`, `mergeTests()` (Phase 0)
- `zod` — config validation (Phase 1)
- `dotenv` — `.env` file loading (already in devDependencies)

---

## 11. Quality Gates Per Sub-Phase

### 11.1 Sub-Phase 3.1 Gate (Foundation)

```bash
npm run typecheck        # Zero errors
npm run lint             # Zero errors, zero warnings
npm run test:unit        # All tests pass (929 existing + ~63 new = ~992)
npm run build            # tsup succeeds
```

**Coverage check**:

- `src/auth/strategies/**` → Tier 2 (95/90/95/95)
- `src/fixtures/core-fixtures.ts` → Tier 3 (90/85/90/90)

### 11.2 Sub-Phase 3.2 Gate (Wiring + Auth Setup)

All 3.1 checks, plus:

```bash
npm run ci               # Full pipeline green
```

**Coverage check**:

- `src/auth/**` → Tier 2 (95/90/95/95)
- `src/fixtures/**` → Tier 3 (90/85/90/90)
- `src/modules/navigation.ts` → Tier 3 (90/85/90/90)

### 11.3 Sub-Phase 3.3 Gate (Assembly)

All 3.2 checks, plus:

```bash
npm run check:exports    # attw validates all 6 sub-path exports
```

**Coverage check**:

- All `src/auth/**` → Tier 2 (95/90/95/95)
- All `src/fixtures/**`, `src/modules/**` → Tier 3 (90/85/90/90)
- Global project coverage ≥ 95% statements (maintained from Phase 2)

---

## 12. Risk Register

| #   | Risk                                          | Probability | Impact | Mitigation                                                                   |
| --- | --------------------------------------------- | ----------- | ------ | ---------------------------------------------------------------------------- |
| R1  | `mergeTests()` fixture name collision         | Low         | High   | All Praman fixtures use `praman`/`ui5`/`sap` prefixed names                  |
| R2  | Auth strategy selector changes (SAP IAS/O365) | Medium      | Medium | Selector fallback chains (3+ selectors per field). Test with mock page.      |
| R3  | Worker-scoped fixture race conditions         | Low         | High   | Playwright guarantees sequential worker fixture init. No shared state.       |
| R4  | Bridge adapter interface change breaks tests  | Medium      | Medium | Add `getSelectorForControl` to all 3 adapters in single batch (B1b)          |
| R5  | `dotenv` not loading in Playwright setup      | Medium      | High   | Explicit `dotenv.config()` in `auth.setup.ts`. Test with `vi.stubEnv()`.     |
| R6  | WorkZone iframe detection fails               | Medium      | Medium | Multiple detection strategies: iframe selector, URL pattern, shell API       |
| R7  | OTel span wrapping adds latency               | Low         | Low    | NoOp tracer in Phase 3. Real OTel deferred to Phase 5+.                      |
| R8  | `page.route()` interception order conflicts   | Low         | Medium | WalkMe/analytics routes registered first (auto fixture), user routes last    |
| R9  | Auth strategies exceed 300 LOC per file       | Low         | Low    | Each strategy is ~90-130 LOC. Factory is ~80 LOC. Well within limit.         |
| R10 | G2 stub removal causes integration regression | Low         | Medium | Unit tests verify bridge round-trips. INT1/INT2 (Phase 7) catch regressions. |

---

## 13. Barrel File Updates

### 13.1 `src/auth/index.ts`

```typescript
/**
 * Auth module barrel — re-exports auth strategies, handler, and utilities.
 *
 * @module auth
 */

export type { AuthStrategy } from './strategies/onprem-strategy.js';
export { OnPremAuthStrategy } from './strategies/onprem-strategy.js';
export { CloudSAMLAuthStrategy } from './strategies/cloud-saml-strategy.js';
export { Office365AuthStrategy } from './strategies/office365-strategy.js';
export { APIAuthStrategy } from './strategies/api-strategy.js';
export { CertificateAuthStrategy } from './strategies/certificate-strategy.js';
export { MultiTenantAuthStrategy } from './strategies/multi-tenant-strategy.js';
export { AuthStrategyFactory } from './auth-factory.js';
export { SAPAuthHandler } from './auth-handler.js';
export {
  isShellVisible,
  isUserMenuVisible,
  isUI5Loaded,
  isLoginPageVisible,
  isAuthenticated,
} from './auth-checks.js';
export type { SAPAuthConfig, SessionInfo } from './auth-types.js';
```

### 13.2 `src/modules/index.ts`

```typescript
/**
 * Modules barrel — re-exports navigation and WorkZone modules.
 *
 * @module modules
 */

export {
  navigateToApp,
  navigateToTile,
  navigateToIntent,
  navigateToHash,
  navigateToHome,
  navigateBack,
  searchAndOpenApp,
  getCurrentHash,
} from './navigation.js';
export type { NavigationOptions } from './navigation.js';
export { createWorkZoneManager } from './workzone.js';
export type { BTPWorkZoneManager } from './workzone.js';
```

### 13.3 `src/fixtures/index.ts`

```typescript
/**
 * Fixture assembly — single entry point for all Praman test fixtures.
 *
 * @module fixtures
 */

export { test, expect } from './assembly.js';
// Type re-exports for consumer convenience
```

### 13.4 `src/index.ts` (additions)

```typescript
// Add to existing exports:
export { test, expect } from './fixtures/index.js';
export type { SAPAuthConfig, AuthStrategy } from './auth/index.js';
export { AuthStrategyFactory, SAPAuthHandler } from './auth/index.js';
export {
  navigateToApp,
  navigateToTile,
  navigateToIntent,
  navigateToHash,
  navigateToHome,
  navigateBack,
} from './modules/index.js';
```

---

## 14. Implementation Batching

### 14.1 Sub-Phase 3.1 Batches (Foundation)

| Batch   | Files                                                                                                                     | Est. LOC | Depends On |
| ------- | ------------------------------------------------------------------------------------------------------------------------- | -------- | ---------- |
| **B1a** | G2 fix: `proxy/dynamic-proxy.ts` (modify) + test updates                                                                  | ~40      | None       |
| **B1b** | Orphan wiring: `bridge/adapter.ts`, `classic-adapter.ts`, `webcomponent-adapter.ts`, `hybrid-adapter.ts` (modify) + tests | ~80      | None       |
| **TH1** | `tests/helpers/mock-auth-page.ts`, `tests/helpers/mock-playwright-test.ts`                                                | ~120     | None       |
| **B2a** | `auth/auth-types.ts` + `auth/auth-checks.ts` + tests                                                                      | ~200     | None       |
| **B2b** | `auth/strategies/onprem-strategy.ts` + test                                                                               | ~220     | B2a        |
| **B2c** | `auth/strategies/cloud-saml-strategy.ts` + test                                                                           | ~230     | B2a        |
| **B2d** | `auth/strategies/office365-strategy.ts` + test                                                                            | ~240     | B2a        |
| **B2e** | `auth/strategies/api-strategy.ts` + `certificate-strategy.ts` + tests                                                     | ~260     | B2a        |
| **B2f** | `auth/strategies/multi-tenant-strategy.ts` + `auth/auth-factory.ts` + tests                                               | ~260     | B2b-e      |
| **B3a** | `fixtures/core-fixtures.ts` (worker fixtures only) + tests                                                                | ~200     | TH1        |
| **B3b** | `fixtures/core-fixtures.ts` (test fixtures: adapter + proxy) + tests                                                      | ~250     | B3a        |

### 14.2 Sub-Phase 3.2 Batches (Wiring + Auth Setup)

| Batch   | Files                                                                                                                                                                                  | Est. LOC | Depends On |
| ------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------- | ---------- |
| **B4a** | `fixtures/stability-fixtures.ts` + tests                                                                                                                                               | ~180     | B3b        |
| **B4b** | `auth/auth-handler.ts` + test                                                                                                                                                          | ~270     | B2f        |
| **B4c** | `auth/auth.setup.ts` + `auth/auth.teardown.ts`                                                                                                                                         | ~110     | B4b        |
| **B5a** | `fixtures/auth-fixtures.ts` + test                                                                                                                                                     | ~180     | B4b, B3b   |
| **B5b** | `modules/navigation.ts` + test                                                                                                                                                         | ~350     | B3b        |
| **B5c** | `fixtures/nav-fixtures.ts` + test (without btpWorkZone)                                                                                                                                | ~280     | B5b, B3b   |
| **B5d** | Wire `playwright-api.ts` into `dynamic-proxy.ts`: expand `ControlProxyState` (page + strategy), add interaction routing in get trap, add `routeToInteractionStrategy()` helper + tests | ~200     | B3b        |

### 14.3 Sub-Phase 3.3 Batches (Assembly)

| Batch   | Files                                                                                                                                        | Est. LOC | Depends On |
| ------- | -------------------------------------------------------------------------------------------------------------------------------------------- | -------- | ---------- |
| **B6a** | `modules/workzone.ts` + test                                                                                                                 | ~320     | B3b        |
| **B6b** | `fixtures/nav-fixtures.ts` update (wire btpWorkZone) + test update                                                                           | ~40      | B6a, B5c   |
| **B7**  | `fixtures/index.ts` assembly + barrel updates (`auth/index.ts`, `modules/index.ts`, `src/index.ts`) + `npm run ci` + `npm run check:exports` | ~200     | All above  |

**Total: 21 batches** (12 code + 1 test helper + 8 code continued)

### 14.4 Parallel Agent Delivery Schedule

```
Wave 1 (start):      B1a, B1b, TH1, B2a              [4 agents — max parallel]
Wave 2 (after B2a):  B2b, B2c, B2d, B2e              [4 agents — auth strategies]
Wave 3 (after TH1):  B3a, B2f                         [2 agents]
Wave 4 (after B3a):  B3b                               [1 agent — critical path]
── Sub-Phase 3.1 Gate ──
Wave 5 (after B3b):  B4a, B4b, B5b, B5d               [4 agents — parallel]
Wave 6 (after B4b):  B4c, B5a                          [2 agents]
Wave 7 (after B5b):  B5c                               [1 agent]
── Sub-Phase 3.2 Gate ──
Wave 8 (after B3b):  B6a                               [1 agent — can start early]
Wave 9 (after B6a):  B6b                               [1 agent]
Wave 10 (final):     B7                                 [1 agent — assembly + CI]
── Sub-Phase 3.3 Gate ──
```

### 14.5 Critical Path

```
B2a → B2b → B2f → B4b → B4c → B5a → B7  (auth chain: 7 steps)
TH1 → B3a → B3b → B5b → B5c → B6b → B7  (fixture chain: 7 steps)
```

Both chains converge at B7 (assembly). **Critical path: 7 steps.**

### 14.6 Batching Rules

1. **Each batch MUST produce compilable code** — `npm run typecheck` passing
2. **Test files ship WITH source files** in same batch (TDD)
3. **Barrel files** updated only in final batch (B7) to avoid intermediate breakage
4. **Max batch size**: ~350 LOC total (source + tests)
5. **CI gate** at sub-phase boundaries (B3b, B5c, B7) — not every batch
6. **TDD protocol**: Write tests RED → implement GREEN → refactor
7. **Import paths**: All use `#core/*`, `#bridge/*`, `#proxy/*` aliases with `.js` extensions
8. **TypeScript strict**: No `any`, no `as unknown as T` — use `import type` for type-only imports

---

## 15. Summary

| Metric                     | Value                                         |
| -------------------------- | --------------------------------------------- |
| **New source files**       | 19                                            |
| **Modified source files**  | 9 (added dynamic-proxy.ts 3.2 modification)   |
| **New test files**         | 16 + 2 helpers = 18                           |
| **Total new source LOC**   | ~2,730                                        |
| **Total new test cases**   | ~123                                          |
| **New npm dependencies**   | 0                                             |
| **Breaking changes**       | 0 (external), 1 (internal: adapter interface) |
| **Sub-phases**             | 3 — Foundation → Wiring → Assembly            |
| **Implementation batches** | 21                                            |
| **Critical path**          | 7 steps                                       |
| **Risk items**             | 10                                            |
| **Phase 1 modules wired**  | 8/8 (all unconsumed modules consumed)         |
| **Orphans resolved**       | 2/2 (object-map.ts, get-selector.ts)          |
| **GitHub issues closed**   | 1 (#22 — G2 proxy stubs)                      |

**Next Step**: Phase 4 — Modules + Table + Fiori Elements (WebComponentAdapter full, registry strategy, table ops, assertions, date/dialog/OData, FE).
