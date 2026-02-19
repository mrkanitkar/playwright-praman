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
15. [Feature Parity Gap Analysis (dhikraft vs Praman)](#15-feature-parity-gap-analysis-dhikraft-vs-praman)
    - [15.6 Proxy Dispatch Comparison](#156-proxy-dispatch-comparison-praman-6-stage-vs-dhikraft-7-type)
    - [15.7 Recommended Batch Additions](#157-recommended-batch-additions)
16. [Summary](#16-summary)
17. [Playwright Best Practice Review Notes](#17-playwright-best-practice-review-notes)
18. [Agent Token Budget](#18-agent-token-budget)

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
                    └──────────┬──────────────┘
                               │
         ┌─────────────────────┼─────────────────────┐
         │                     │                      │
┌────────▼─────────┐  ┌───────▼───────┐  ┌───────────▼──────────┐
│ Phase 2 Bridge    │  │ Phase 2 Proxy │  │ core/config          │
│ (adapters,        │  │ (dynamic-     │  │ (PramanConfig,       │
│  strategies,      │  │  proxy, cache, │  │  loadConfig)         │
│  browser-scripts) │  │  discovery)   │  │                      │
└────────┬─────────┘  └───────┬───────┘  └───────────┬──────────┘
         │                    │                       │
         └────────────────────┼───────────────────────┘
                              │
  ┌───────────────────────────┼───────────────────────────────┐
  │                           │                                │
  │              ┌────────────▼────────────┐                   │
  │              │  fixtures/core-fixtures  │  ← PHASE 3 ROOT  │
  │              │  Worker: config, logger, │                   │
  │              │    tracer, compat,       │                   │
  │              │    selectors, matchers   │                   │
  │              │  Test: adapter, ui5      │                   │
  │              └────────────┬────────────┘                   │
  │                           │                                │
  │         ┌─────────────────┼──────────────────┐             │
  │         │                 │                   │             │
  │   ┌─────▼──────────┐ ┌───▼─────────┐ ┌──────▼───────────┐ │
  │   │ fixtures/       │ │ fixtures/   │ │ modules/         │ │
  │   │ stability-      │ │ ui5-handler │ │ navigation.ts    │ │
  │   │ fixtures        │ │ (UI5Handler)│ │ workzone.ts      │ │
  │   │ (auto, test)    │ └──────┬──────┘ └──────┬───────────┘ │
  │   └────────┬────────┘        │               │             │
  │            │           ┌─────▼─────────┐ ┌───▼───────────┐ │
  │            │           │ fixtures/      │ │ fixtures/     │ │
  │            │           │ auth-fixtures  │ │ nav-fixtures  │ │
  │            │           └─────┬─────────┘ └───┬───────────┘ │
  │            │                 │               │             │
  │            └─────────────────┼───────────────┘             │
  │                              │                             │
  │                 ┌────────────▼────────────┐                │
  │                 │  fixtures/index.ts       │  ← ASSEMBLY   │
  │                 │  export { test, expect } │                │
  │                 └─────────────────────────┘                │
  │                                                            │
  │   ┌──────────────────┐                                     │
  │   │ auth/*            │ ← imports from Phase 1 #core/*     │
  │   │ (strategies,      │   only, NOT from fixtures          │
  │   │  auth-handler,    │                                    │
  │   │  auth-factory,    │                                    │
  │   │  auth-checks)     │                                    │
  │   └──────────────────┘                                     │
  │                                                            │
  └────────────────────────────────────────────────────────────┘
  ↑ auth/* depends on Phase 1/config directly (not core-fixtures)
  ↑ fixtures/auth-fixtures imports FROM auth/* (not reverse)
```

**Dependency Rules (Enforced)**:

- `fixtures/*` imports from `#core/*`, `#bridge/*`, `#proxy/*`, `auth/*`, `modules/*` — NEVER reverse
- `auth/*` imports from `#core/*` only — NEVER from `#bridge/*`, `#proxy/*`, or `fixtures/*`
- `modules/navigation.ts` imports from `#core/*`, `#bridge/*` — NEVER from `#proxy/*` or `fixtures/*`
- `fixtures/index.ts` imports from sibling fixture files + type-only re-exports from `#core/*`, `#bridge/*`, `auth/*`
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
│    (main frame ONLY — see PW-STAB-1)         │
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

> **PLAYWRIGHT REVIEW NOTE (PW-NAV-1)**: The choice between `page.goto()` and
> `page.evaluate(() => hasher.setHash(...))` is significant for SPA hash-based routing:
>
> - **`page.goto(baseURL + '#' + hash)`**: Full page navigation. Use for initial
>   navigation when the FLP shell is not yet loaded, or for deep link entry. This
>   triggers a full page load and the `load` event. Playwright waits for `load` by
>   default.
> - **`page.evaluate(() => window.hasher.setHash(hash))`**: In-app SPA navigation.
>   Use when the FLP shell is already loaded and you want to navigate within the
>   app without a full page reload. This is faster and more closely matches how
>   users actually navigate within Fiori Launchpad. No `load` event fires.
>
> The implementation should detect whether FLP is already loaded (e.g., check if
> `window.sap.ushell` exists) and choose the appropriate navigation method.
> `waitForUI5Bootstrap` is only needed after `page.goto()` (full navigation), not
> after `hasher.setHash()` (FLP already bootstrapped).

```
ui5Navigation.navigateToApp('PurchaseOrder-manage')
    │
    ▼
┌──────────────────────────────────────┐
│ 1. Resolve hash: '#PurchaseOrder-    │
│    manage'                           │
│ 2. Check: is FLP already loaded?     │
│    YES → page.evaluate(             │
│      hasher.setHash(hash))           │
│    NO  → page.goto(baseURL + hash)   │
│          + waitForUI5Bootstrap(page)  │
│ 3. waitForUI5Stable(page)            │
│ 4. Return                            │
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

#### Phase 1 Modules → Phase 2 Consumption Points (already wired)

> **8 Phase 1 entities** consumed by Phase 2. This section documents what is
> already wired (completed in Phase 2) so the full dependency chain is visible.

```
Phase 1 Module                → Phase 2 Consumer                → Import Type
─────────────────────────────────────────────────────────────────────────────────
core/types/selectors           → bridge/adapter.ts               → type (UI5Selector)
  UI5Selector                  → bridge/classic-adapter.ts       → type (UI5Selector)
                               → bridge/hybrid-adapter.ts        → type (UI5Selector)
                               → bridge/webcomponent-adapter.ts  → type (UI5Selector)
                               → proxy/cache.ts                  → type (UI5Selector)
                               → proxy/discovery.ts              → type (UI5Selector)
                               → proxy/discovery-factory.ts      → type (UI5Selector)
                                                                   [7 consumers]

core/types/controls            → proxy/dynamic-proxy.ts          → type (UI5ControlBase)
  UI5ControlBase               → proxy/proxy-converter.ts        → type (UI5ControlBase)
                               → proxy/discovery.ts              → type (UI5ControlBase)
                               → proxy/cache.ts                  → type (UI5ControlBase)
                                                                   [4 consumers]

core/types/bridge              → bridge/bridge-types.ts          → type (BridgeReturnType)
  BridgeReturnType               discriminant in MethodExecutionResult
                                                                   [1 consumer]

core/config/schema             → proxy/discovery.ts              → type (DiscoveryStrategyName)
  DiscoveryStrategyName          strategy chain configuration
                                                                   [1 consumer]

core/errors/control-error      → proxy/dynamic-proxy.ts          → class (ControlError)
  ControlError                   thrown on blacklisted method access
                                                                   [1 consumer]

core/errors/bridge-error       → proxy/return-handler.ts         → class (BridgeError)
  BridgeError                    thrown on bridge execution failures
                                                                   [1 consumer]

core/utils/version-compare     → bridge/api-resolver.ts          → function (isAtLeast)
  isAtLeast()                    UI5 version ≥ 1.119.0 / 1.108.0 checks
                                                                   [1 consumer]

selectors/selector-parser      → proxy/cache.ts                  → function (serializeUI5Selector)
  serializeUI5Selector()         stable cache key generation
                                                                   [1 consumer]
```

#### Phase 1 Types/Interfaces → Phase 3 Consumption Points (NEW wiring)

> **Phase 1 defined many types/interfaces that Phase 2 does NOT use.**
> These must be consumed in Phase 3 (fixtures, auth, navigation, WorkZone).
> This is the complete "types gap" — every type below needs a consumer.

```
Phase 1 Type/Interface         → Phase 3 Consumer                     → Usage
──────────────────────────────────────────────────────────────────────────────────
CONFIG TYPES (core/config/schema):
  PramanConfig                 → fixtures/core-fixtures.ts            → worker fixture type
                               → auth/auth-handler.ts                 → config parameter
                               → modules/navigation.ts                → config parameter
  InteractionStrategyName      → fixtures/core-fixtures.ts            → strategy selection
  LogLevel                     → fixtures/core-fixtures.ts            → logger config

ERROR CLASSES (core/errors/):
  AuthError                    → auth/strategies/*.ts                 → thrown on auth failure
                               → auth/auth-handler.ts                 → thrown on login/retry failure
  NavigationError              → modules/navigation.ts                → thrown on nav failure
                               → modules/workzone.ts                  → thrown on iframe switch failure
  TimeoutError                 → auth/strategies/*.ts                 → thrown on auth timeout
                               → modules/navigation.ts                → thrown on nav timeout
  SelectorError                → fixtures/core-fixtures.ts            → thrown on selector reg failure
  ConfigError                  → fixtures/core-fixtures.ts            → thrown on config validation
  PramanError (base)           → auth/auth-checks.ts                  → base class for custom errors
  AIError                      → (Phase 4+ — AI layer)
  ODataError                   → (Phase 4+ — OData module)
  PluginError                  → (Phase 4+ — plugin system)

SELECTOR TYPES (core/types/selectors):
  SerializedUI5Selector        → fixtures/core-fixtures.ts            → selector engine registration
  UI5SelectorString            → modules/navigation.ts                → intent-based navigation
  UI5Interaction               → (Phase 4+ — interaction recording)

BRIDGE TYPES (core/types/bridge):
  BridgeResult<T>              → fixtures/core-fixtures.ts            → adapter result handling
  BridgeMethodDescriptor       → (Phase 4+ — AI method discovery)

VALIDATION TYPES (core/types/validation):
  ValidationIssue              → fixtures/core-fixtures.ts            → config validation reporting

UTIL FUNCTIONS (core/utils/):
  retry()                      → auth/auth-handler.ts                 → login retry with backoff
  calculateBackoff()           → auth/auth-handler.ts                 → exponential backoff
  waitForUI5Stable()           → stability-fixtures.ts                → auto stability fixture
                               → modules/navigation.ts                → after every navigation
  waitForUI5Bootstrap()        → fixtures/core-fixtures.ts            → bridge init wait
  DEFAULT_TIMEOUTS             → fixtures/core-fixtures.ts            → timeout constants
                               → auth/auth-handler.ts                 → auth timeout defaults
  withStep()                   → fixtures/nav-fixtures.ts             → step-decorated nav
                               → fixtures/auth-fixtures.ts            → step-decorated auth
                               → fixtures/core-fixtures.ts            → step-decorated init

COMPAT FUNCTIONS (core/compat/):
  assertMinVersion()           → fixtures/core-fixtures.ts            → worker auto: version check
  getPlaywrightFeatures()      → fixtures/core-fixtures.ts            → feature-gated behavior
  PlaywrightFeatures           → fixtures/core-fixtures.ts            → type for feature flags
  PlaywrightVersion            → fixtures/core-fixtures.ts            → type for version info

LOGGING (core/logging/):
  createRootLogger()           → fixtures/core-fixtures.ts            → worker auto: root logger
  createLogger()               → all fixture, auth, nav, workzone     → child logger per module
  REDACTION_PATHS              → fixtures/core-fixtures.ts            → pino redaction config

TELEMETRY (core/telemetry/):
  initTelemetry()              → fixtures/core-fixtures.ts            → worker auto: tracer init
  TracerWrapper                → fixtures/core-fixtures.ts            → type for tracer fixture
  createSpanName()             → fixtures/core-fixtures.ts            → span naming convention
  spanAttributes()             → fixtures/core-fixtures.ts            → OTel span attributes

SELECTORS (selectors/):
  createUI5SelectorEngineScript()  → fixtures/core-fixtures.ts        → worker auto: register engine

MATCHERS (matchers/):
  checkUI5Text, checkUI5Visible,   → fixtures/core-fixtures.ts        → worker auto: expect.extend
  checkUI5Enabled, etc. (8)

CONSTANTS (core/utils/constants):
  DEFAULT_IGNORE_PATTERNS      → stability-fixtures.ts                → WalkMe/analytics URLs
  BRIDGE_READY_CHECK_INTERVAL  → fixtures/core-fixtures.ts            → bridge polling interval
```

**Summary: Phase 1 Consumption Across Phases**

| Phase 1 Category                    | Phase 2 Consumers   | Phase 3 Consumers     | Phase 4+ (Future) |
| ----------------------------------- | ------------------- | --------------------- | ----------------- |
| Types (selectors, controls, bridge) | 3 types / 12 files  | 4 types / 5 files     | 2 types           |
| Config types                        | 1 type / 1 file     | 3 types / 4 files     | —                 |
| Error classes                       | 2 classes / 2 files | 5 classes / 8 files   | 3 classes         |
| Util functions                      | 1 fn / 1 file       | 6 fns / 10 files      | —                 |
| Compat                              | 0                   | 4 exports / 1 file    | —                 |
| Logging                             | 0                   | 3 exports / 10+ files | —                 |
| Telemetry                           | 0                   | 4 exports / 1 file    | —                 |
| Selectors                           | 1 fn / 1 file       | 1 fn / 1 file         | —                 |
| Matchers                            | 0                   | 8 fns / 1 file        | —                 |
| **Total**                           | **8 entities**      | **~34 entities**      | **~5 entities**   |

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
  // PLAYWRIGHT REVIEW NOTE (PW-CSS-1): CSS.escape() is a browser-only API
  // (defined on the global CSS object in browsers). It is NOT available in
  // Node.js context where this code runs. Use a Node.js CSS escaping utility:
  // either the `css.escape` npm package, or implement a minimal escapeCSS()
  // helper that handles special characters in DOM IDs (e.g., colons, dots,
  // brackets common in UI5-generated IDs like "app--view--control").
  // Alternatively, move the escaping + locator creation into page.evaluate()
  // and use the browser's native CSS.escape() there.
  const locator = state.page.locator(`#${cssEscapeId(domId)}`);
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

> **PLAYWRIGHT REVIEW NOTE (PW-SCOPE-1)**: Worker-scoped fixtures `pramanConfig`,
> `rootLogger`, and `tracer` are listed as "No" for Auto (correct -- they are lazy,
> only initialized when a test requests them). However, the implementation code MUST
> use the tuple syntax `[fn, { scope: 'worker' }]` for each, not just the auto ones.
> Without it, these fixtures default to test-scoped and will be re-created per test,
> defeating the purpose of worker-level sharing. Also note: `test.extend()` requires
> separate type parameters for worker vs test fixtures:
> `test.extend<TestFixtures, WorkerFixtures>()`. The worker fixtures type parameter
> is the SECOND generic argument. All fixture files must use this two-parameter form.
>
> **Correct syntax for non-auto worker fixtures**:
>
> ```typescript
> pramanConfig: [async ({}, use) => {
>   const config = await loadConfig();
>   await use(Object.freeze(config));
> }, { scope: 'worker' }],
> ```

#### Test-Scoped Fixtures

| Fixture         | Type            | Auto | Purpose                                                                   |
| --------------- | --------------- | ---- | ------------------------------------------------------------------------- |
| `pramanLogger`  | `Logger`        | No   | Child logger bound to test name. Fresh per test.                          |
| `bridgeAdapter` | `BridgeAdapter` | No   | Creates adapter via factory. Lazy bridge injection. Cleanup on teardown.  |
| `ui5`           | `UI5Handler`    | No   | Handler wrapping discovery + proxy + strategy. Main test interaction API. |

> **Architecture Decision**: UI5Handler is an INTERNAL class (`src/fixtures/ui5-handler.ts`).
> It is **NOT exported** in any barrel (`fixtures/index.ts`, `src/index.ts`).
> Test authors receive it via Playwright's `ui5` fixture DI — never via direct import.
> This matches dhikraft's pattern where `UI5Handler` is instantiated inside the fixture
> and injected into tests. It can be unit-tested with mock adapter (no Playwright runner needed).
> File is ~500 LOC, which exceeds the 300 LOC `max-lines` guideline — document exception
> with `// eslint-disable-next-line max-lines` or split into handler + helper if possible.

**Design Decisions**:

1. **Lazy bridge injection with re-injection on navigation** (W6 from plan2.md, aligned with dhikraft): Bridge is NOT injected during fixture setup. Page starts at `about:blank`. Bridge injects on first `ui5` method call (after navigation). After page navigation events (`framenavigated` on main frame), injection state is reset so the next `ui5` call triggers re-injection. This prevents 30s timeout on fixture init AND ensures bridge survives FLP tile clicks, hash changes, and app-to-app navigation. Default interaction strategy: `ui5-native` (direct UI5 fire\* calls, NOT RecordReplay).

2. **Config loading** (D7): `loadConfig()` reads `praman.config.ts` → env overrides → Zod validation → freeze. Worker-scoped means loaded once, shared across all tests in worker.

3. **Selector registration** (BP-PLAYWRIGHT): `playwright.selectors.register()` is global and must be called before any `page.locator('ui5=...')` usage. Worker-scoped auto ensures it runs once, before any test.

4. **Matcher registration**: `expect.extend()` must be called before any `expect(locator).toHaveUI5Text()`. Worker auto fixture ensures registration.

````typescript
/**
 * Core Praman fixtures — provides UI5 handler, bridge adapter, config, logging, and telemetry.
 *
 * @example
 * ```typescript
 * import { test, expect } from 'playwright-praman';
 *
 * test('check button text', async ({ ui5, page }) => {
 *   await page.goto('https://sap-app.example.com');
 *   const btn = await ui5.control({ controlType: 'sap.m.Button', properties: { text: 'Save' } });
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
| 15  | Config with invalid schema throws       | Config missing required fields  | `ConfigError` with `ERR_CONFIG_INVALID`          |
| 16  | Worker fixtures not re-created per test | Two tests in same worker        | Same `rootLogger` and `tracer` instance          |
| 17  | Selector registration idempotent        | Register called twice           | No error on second call (already registered)     |

**Mock requirements**: Use `tests/helpers/mock-playwright-test.ts` to mock `test.extend()`, `mergeTests()`, `expect.extend()`. Mock `loadConfig()` from `#core/config/index.js`. Mock `createRootLogger()` and `createLogger()` from `#core/logging/index.js`. Mock `initTelemetry()` from `#core/telemetry/index.js`. Mock `assertMinVersion()` and `getPlaywrightFeatures()` from `#core/compat/index.js`. Mock `createUI5SelectorEngineScript()` from `#selectors/index.js`. Mock `createBridgeAdapter()` from `#bridge/index.js`. Mock `page.on()` / `page.off()` for navigation listener tests.

**Type-level tests**:

- `expectTypeOf<typeof coreTest>()` — verify all fixture names exist in the type
- `expectTypeOf<PramanConfig>().toHaveProperty('logLevel')`
- `expectTypeOf<PlaywrightFeatures>().toHaveProperty('hasBoxedStep')`

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
| 8   | Login with empty username        | URL, `username: ''`, password            | `AuthError` with validation message  |
| 9   | Login with empty password        | URL, username, `password: ''`            | `AuthError` with validation message  |

**Mock requirements**: `createMockAuthPage()` from `tests/helpers/mock-auth-page.ts` with SAP login form selectors (`#USERNAME_FIELD-inner`, `#PASSWORD_FIELD-inner`, `#LOGIN_LINK`). Mock `page.locator().fill()`, `page.locator().click()`, `page.locator().isVisible()`. Mock `page.waitForSelector()` for form detection. Mock `page.goto()` for navigation.

**Type-level tests**: `expectTypeOf<OnPremAuthStrategy>().toExtend<AuthStrategy>()`; `expectTypeOf<OnPremAuthStrategy>().toHaveProperty('authenticate')`; `expectTypeOf<OnPremAuthStrategy>().toHaveProperty('isAuthenticated')`

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

**Tests** (`tests/unit/auth/strategies/cloud-saml-strategy.test.ts`):

| #   | Test Case                                | Input                                                                      | Expected                                                        |
| --- | ---------------------------------------- | -------------------------------------------------------------------------- | --------------------------------------------------------------- |
| 1   | Successful SAML login via IAS            | Cloud URL, email, password                                                 | SAML redirect → IAS form → redirect back → shell header visible |
| 2   | IAS form detected after redirect         | URL → redirect to `accounts.cloud.sap`                                     | Waits for IAS form, fills email + password                      |
| 3   | Login form not found (timeout)           | URL that doesn't redirect to IAS                                           | `AuthError` with `ERR_AUTH_FAILED`, retryable: true             |
| 4   | Wrong credentials on IAS form            | Valid URL, wrong password                                                  | `AuthError` with suggestions: 'Check credentials'               |
| 5   | Selector fallback chain works            | Primary `#j_username` missing, fallback `input[name="j_username"]` present | Login succeeds via fallback selector                            |
| 6   | `isAuthenticated` returns true post-auth | After successful SAML login                                                | `true` (shell header detected)                                  |
| 7   | `isAuthenticated` returns false pre-auth | Before login (login page visible)                                          | `false`                                                         |
| 8   | Cloud URL detection matches patterns     | `*.cloud.sap`, `*.s4hana.cloud.sap`, `*.hana.ondemand.com`                 | All recognized as cloud URLs                                    |
| 9   | Non-cloud URL not matched                | `sap.onprem.example.com`                                                   | Not detected as cloud URL                                       |

**Mock requirements**: `createMockAuthPage()` with IAS login form selectors (`#j_username`, `#j_password`, `#logOnFormSubmit`). Mock `page.waitForURL()` for SAML redirect detection. Mock `page.locator().isVisible()` for shell header check.

**Type-level tests**: `expectTypeOf<CloudSAMLAuthStrategy>().toExtend<AuthStrategy>()`

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

**Tests** (`tests/unit/auth/strategies/office365-strategy.test.ts`):

| #   | Test Case                            | Input                                               | Expected                                                       |
| --- | ------------------------------------ | --------------------------------------------------- | -------------------------------------------------------------- |
| 1   | Successful Office365 login           | SAP URL, email, password                            | Redirect to `login.microsoftonline.com` → fill → redirect back |
| 2   | Multi-step form: email then password | Valid credentials                                   | Fills email → clicks Next → waits for password field → fills   |
| 3   | "Stay signed in?" prompt — click Yes | Config `staySignedIn: true`                         | Clicks "Yes" on KMSI prompt                                    |
| 4   | "Stay signed in?" prompt — click No  | Config `staySignedIn: false` (default)              | Clicks "No" on KMSI prompt                                     |
| 5   | "Stay signed in?" prompt not shown   | Azure AD configured to skip KMSI                    | Proceeds without KMSI handling, no error                       |
| 6   | Wrong credentials                    | Valid URL, wrong password                           | `AuthError` with `ERR_AUTH_FAILED`, suggestions include creds  |
| 7   | Login form not found (timeout)       | URL that doesn't redirect to Azure AD               | `AuthError` with `ERR_AUTH_FAILED`, retryable: true            |
| 8   | Selector fallback for email field    | `input[name="loginfmt"]` missing, alternate present | Login succeeds via fallback selector                           |
| 9   | `isAuthenticated` returns true       | After successful Office365 login                    | `true` (shell header detected)                                 |
| 10  | `isAuthenticated` returns false      | Before login                                        | `false`                                                        |

**Mock requirements**: `createMockAuthPage()` with Azure AD selectors (`input[name="loginfmt"]`, `input[name="passwd"]`, `input[data-report-event="Signin_Submit"]`). Mock `page.waitForURL()` for Microsoft redirect detection. Mock "Stay signed in?" dialog visibility.

**Type-level tests**: `expectTypeOf<Office365AuthStrategy>().toExtend<AuthStrategy>()`

**Estimated LOC**: ~130 source, ~110 tests

#### 5.4.4 `auth/strategies/api-strategy.ts` (NEW — ~100 LOC)

**Purpose**: Headless API-based authentication using Playwright's `request` context. No browser UI interaction. Ideal for CI/CD pipelines where browser login is unnecessary.

**Flow**:

1. Create `APIRequestContext` via `request.newContext()`
2. POST to login endpoint with form data
3. Extract cookies from response
4. Save to `storageState`
5. Dispose request context

**Tests** (`tests/unit/auth/strategies/api-strategy.test.ts`):

| #   | Test Case                             | Input                                    | Expected                                                          |
| --- | ------------------------------------- | ---------------------------------------- | ----------------------------------------------------------------- |
| 1   | Successful API login with form data   | URL, username, password                  | POST to login endpoint, cookies extracted, storageState saved     |
| 2   | API login with custom endpoint path   | Config with `loginEndpoint: '/api/auth'` | POST sent to custom endpoint path                                 |
| 3   | Login response missing cookies        | Server returns 200 but no Set-Cookie     | `AuthError` with `ERR_AUTH_FAILED`, suggestions: 'Check endpoint' |
| 4   | Login endpoint returns 401            | Wrong credentials                        | `AuthError` with `ERR_AUTH_FAILED`, retryable: true               |
| 5   | Login endpoint returns 500            | Server error                             | `AuthError` with `ERR_AUTH_FAILED`, retryable: true               |
| 6   | Login endpoint unreachable (timeout)  | Invalid URL or network timeout           | `AuthError` with `ERR_AUTH_TIMEOUT`, retryable: true              |
| 7   | Request context disposed after login  | Successful login                         | `apiRequestContext.dispose()` called                              |
| 8   | `isAuthenticated` delegates to cookie | After API login                          | `true` (session cookie present in storageState)                   |
| 9   | `isAuthenticated` returns false       | Before login (no cookies)                | `false`                                                           |

**Mock requirements**: Mock `request.newContext()` → returns mock `APIRequestContext` with `post()` and `dispose()`. Mock response with `headersArray()` for cookie extraction. Mock `storageState()` write.

**Type-level tests**: `expectTypeOf<APIAuthStrategy>().toExtend<AuthStrategy>()`

**Estimated LOC**: ~100 source, ~80 tests

#### 5.4.5 `auth/strategies/certificate-strategy.ts` (NEW — ~90 LOC)

**Purpose**: Client certificate (PKI/SSL) authentication for enterprise environments with mutual TLS.

**Flow**:

1. Create browser context with `clientCertificates` option
2. Navigate to SAP URL (certificate presented automatically)
3. Wait for shell header (no form interaction needed)

**Tests** (`tests/unit/auth/strategies/certificate-strategy.test.ts`):

| #   | Test Case                              | Input                                                        | Expected                                                           |
| --- | -------------------------------------- | ------------------------------------------------------------ | ------------------------------------------------------------------ |
| 1   | Successful certificate login           | Config with `certificate: { certPath, keyPath }`             | Browser context created with `clientCertificates`, shell visible   |
| 2   | Certificate file not found             | `certPath` pointing to non-existent file                     | `AuthError` with `ERR_AUTH_FAILED`, suggestions: 'Check cert path' |
| 3   | Certificate rejected by server         | Valid cert, server rejects (403)                             | `AuthError` with `ERR_AUTH_FAILED`, retryable: false               |
| 4   | `isAuthenticated` returns true         | After successful certificate auth                            | `true` (shell header detected, no login form)                      |
| 5   | `isAuthenticated` returns false        | Before auth or cert expired                                  | `false`                                                            |
| 6   | Certificate with passphrase            | Config with `certificate: { certPath, keyPath, passphrase }` | Passphrase passed to browser context                               |
| 7   | No form interaction needed (auto-auth) | Valid certificate                                            | No fill/click calls on page, only navigation + wait                |

**Mock requirements**: Mock `browser.newContext()` with `clientCertificates` option. Mock `page.goto()` for certificate-authenticated navigation. Mock `fs.existsSync()` for cert file validation.

**Type-level tests**: `expectTypeOf<CertificateAuthStrategy>().toExtend<AuthStrategy>()`

**Estimated LOC**: ~90 source, ~70 tests

#### 5.4.6 `auth/strategies/multi-tenant-strategy.ts` (NEW — ~100 LOC)

**Purpose**: Multi-tenant SAP BTP authentication where tenant ID determines the authentication endpoint.

**Flow**:

1. Resolve tenant URL: subdomain strategy (`tenant.sap-cloud.com`) or parameter strategy (`?sap-client=100`)
2. Delegate to appropriate base strategy (CloudSAML or OnPrem)
3. Handle tenant-specific IDP redirects

**Tests** (`tests/unit/auth/strategies/multi-tenant-strategy.test.ts`):

| #   | Test Case                             | Input                                                      | Expected                                                          |
| --- | ------------------------------------- | ---------------------------------------------------------- | ----------------------------------------------------------------- |
| 1   | Subdomain tenant resolution           | Config with `tenant: 'acme'`, URL `*.cloud.sap`            | URL resolved to `acme.cloud.sap`, delegates to CloudSAML          |
| 2   | Parameter tenant resolution           | Config with `tenant: '100'`, `tenantStrategy: 'parameter'` | URL includes `?sap-client=100`                                    |
| 3   | Delegates to CloudSAML for cloud URL  | Tenant + cloud URL                                         | `CloudSAMLAuthStrategy.authenticate()` called                     |
| 4   | Delegates to OnPrem for non-cloud URL | Tenant + onprem URL                                        | `OnPremAuthStrategy.authenticate()` called                        |
| 5   | Tenant-specific IDP redirect handled  | Tenant redirects to custom IDP                             | Follows redirect, completes auth                                  |
| 6   | Missing tenant in config              | Config without `tenant` field                              | `AuthError` with `ERR_AUTH_FAILED`, suggestions: 'Provide tenant' |
| 7   | `isAuthenticated` delegates to base   | After multi-tenant auth                                    | `true` (delegates to base strategy's `isAuthenticated()`)         |
| 8   | Empty tenant string                   | Config with `tenant: ''`                                   | `AuthError` with `ERR_AUTH_FAILED`, 'Tenant ID cannot be empty'   |

**Mock requirements**: Mock base strategies (`CloudSAMLAuthStrategy`, `OnPremAuthStrategy`) to verify delegation. Mock URL construction for subdomain/parameter strategies. Verify `page.goto()` called with resolved tenant URL.

**Type-level tests**: `expectTypeOf<MultiTenantAuthStrategy>().toExtend<AuthStrategy>()`

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

**Tests** (`tests/unit/auth/auth-factory.test.ts`):

| #   | Test Case                                   | Input                                            | Expected                                                         |
| --- | ------------------------------------------- | ------------------------------------------------ | ---------------------------------------------------------------- |
| 1   | Explicit `strategy: 'onprem'` override      | Config with `strategy: 'onprem'`                 | Returns `OnPremAuthStrategy` instance                            |
| 2   | Explicit `strategy: 'cloud-saml'` override  | Config with `strategy: 'cloud-saml'`             | Returns `CloudSAMLAuthStrategy` instance                         |
| 3   | Explicit `strategy: 'office365'` override   | Config with `strategy: 'office365'`              | Returns `Office365AuthStrategy` instance                         |
| 4   | Explicit `strategy: 'api'` override         | Config with `strategy: 'api'`                    | Returns `APIAuthStrategy` instance                               |
| 5   | Certificate present → CertificateStrategy   | Config with `certificate: { certPath, keyPath }` | Returns `CertificateAuthStrategy` instance                       |
| 6   | Tenant present → MultiTenantStrategy        | Config with `tenant: 'acme'`                     | Returns `MultiTenantAuthStrategy` instance                       |
| 7   | Cloud URL auto-detected → CloudSAMLStrategy | Config with URL `app.cloud.sap`                  | Returns `CloudSAMLAuthStrategy` instance                         |
| 8   | Non-cloud URL defaults to OnPremStrategy    | Config with URL `sap.example.com`                | Returns `OnPremAuthStrategy` instance                            |
| 9   | Custom strategy registration                | `AuthStrategyFactory.register('custom', impl)`   | `create({ strategy: 'custom' })` returns registered strategy     |
| 10  | Custom strategy overrides built-in          | Register 'onprem' → custom                       | `create({ strategy: 'onprem' })` returns custom, not built-in    |
| 11  | `detectSystemType()` for cloud URLs         | `*.cloud.sap`, `*.hana.ondemand.com`             | Returns `'cloud'`                                                |
| 12  | `detectSystemType()` for onprem URLs        | `sap.internal.corp.com`                          | Returns `'onprem'`                                               |
| 13  | Unknown strategy name                       | Config with `strategy: 'nonexistent'`            | `AuthError` with `ERR_AUTH_FAILED`, suggestions list valid names |
| 14  | Priority: certificate > tenant > URL        | Config with cert + tenant + cloud URL            | `CertificateAuthStrategy` (highest priority)                     |

**Mock requirements**: No heavy mocking needed. Factory is pure logic. Mock logger to verify strategy selection logging. Each strategy constructor should be spied on to verify instantiation.

**Type-level tests**: `expectTypeOf(AuthStrategyFactory.create).returns.toExtend<AuthStrategy>()`; `expectTypeOf(AuthStrategyFactory.detectSystemType).returns.toEqualTypeOf<'cloud' | 'onprem'>()`

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

**Tests** (`tests/unit/auth/auth-checks.test.ts`):

| #   | Test Case                                | Input                                      | Expected                                     |
| --- | ---------------------------------------- | ------------------------------------------ | -------------------------------------------- |
| 1   | `isShellVisible` returns true            | Page with `#shell-header` visible          | `true`                                       |
| 2   | `isShellVisible` returns false           | Page without `#shell-header`               | `false`                                      |
| 3   | `isUserMenuVisible` returns true         | Page with user menu avatar visible         | `true`                                       |
| 4   | `isUserMenuVisible` returns false        | Page without user menu                     | `false`                                      |
| 5   | `isUI5Loaded` returns true               | Page where `sap.ui.getCore()` exists       | `true`                                       |
| 6   | `isUI5Loaded` returns false              | Page without UI5 (plain HTML)              | `false`                                      |
| 7   | `isLoginPageVisible` returns true        | Page showing login form                    | `true`                                       |
| 8   | `isLoginPageVisible` returns false       | Page without login form (app loaded)       | `false`                                      |
| 9   | `isAuthenticated` composite check        | Shell visible + UI5 loaded + no login page | `true`                                       |
| 10  | `isAuthenticated` false when login shown | Login page visible, shell not visible      | `false`                                      |
| 11  | `isAuthenticated` false when no UI5      | No UI5 loaded (non-SAP page)               | `false`                                      |
| 12  | Page evaluation throws (page closed)     | `page.evaluate()` rejects                  | Returns `false` (graceful failure, no throw) |

**Mock requirements**: `createMockPage()` with `page.locator().isVisible()` returning configurable booleans per selector. Mock `page.evaluate()` for `sap.ui.getCore()` check. For error path: mock `page.evaluate()` to throw (simulating closed page).

**Type-level tests**: `expectTypeOf(isAuthenticated).parameters.toEqualTypeOf<[Page]>()`; `expectTypeOf(isAuthenticated).returns.toEqualTypeOf<Promise<boolean>>()`

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

**Estimated LOC**: ~40 (inline in `core-fixtures.ts` — included in B3b batch LOC estimate)

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

> **PLAYWRIGHT REVIEW NOTE (PW-STEP-1)**: For Playwright >= 1.51, `test.step()`
> supports a `{ box: true }` option. When `box: true`, if an error occurs inside
> the step, the trace/report attributes the error to the step call site rather than
> deep inside the step body. This is ideal for **infrastructure steps** (fixture
> setup, bridge injection, stability waits) where the user cares about WHAT failed,
> not WHERE inside the plumbing. User-facing steps (navigation, auth, assertions)
> should NOT use `box: true` since the user needs to see the exact failure line.
>
> The `withStep()` helper should accept an optional `{ box: true }` flag, and the
> `playwrightCompat.hasBoxedStep` feature flag (Section 6.1.6) should gate its usage.
> Example:
>
> ```typescript
> // Infrastructure step — boxed
> await withStep('bridge > inject', bridgeInjectFn, { box: true });
> // User-facing step — not boxed
> await withStep('nav > navigateToApp: PO-manage', navFn);
> ```

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

> **PLAYWRIGHT REVIEW NOTE (PW-STAB-1)**: The `framenavigated` event fires for ALL
> frames (main frame + iframes). The listener MUST check `frame === page.mainFrame()`
> to avoid spurious `waitForUI5Stable` calls on iframe navigations (WorkZone app iframe,
> analytics iframes, embedded content). Additionally, the listener MUST be stored by
> reference and removed on teardown via `page.off()` to prevent memory leaks and stale
> event handlers across test boundaries.

```typescript
ui5Stability: [async ({ page, pramanConfig }, use) => {
  const skip = pramanConfig.skipStabilityWait ?? false;
  // Store listener reference for cleanup (PW-STAB-1)
  const navigationListener = async (frame: import('@playwright/test').Frame) => {
    if (frame !== page.mainFrame()) return; // Ignore iframe navigations
    try {
      await waitForUI5Stable(page, {
        timeout: pramanConfig.ui5WaitTimeout ?? DEFAULT_TIMEOUTS.UI5_WAIT,
      });
    } catch {
      // Non-fatal: page may not have UI5 yet
    }
  };
  if (!skip) {
    page.on('framenavigated', navigationListener);
  }
  await use();
  // Teardown: remove listener to prevent leaks (PW-STAB-1)
  if (!skip) {
    page.off('framenavigated', navigationListener);
  }
}, { auto: true }],
```

**Tests** (`tests/unit/fixtures/stability-fixtures.test.ts`):

| #   | Test Case                            | Input                            | Expected                                        |
| --- | ------------------------------------ | -------------------------------- | ----------------------------------------------- |
| 1   | WalkMe requests blocked              | Request to `walkme.com`          | Route aborted                                   |
| 2   | Analytics requests blocked           | Request to `analytics.google`    | Route aborted                                   |
| 3   | Normal requests pass through         | Request to `sap-cloud.com/odata` | Route fulfilled                                 |
| 4   | Custom ignore patterns from config   | Config with custom pattern       | Custom pattern blocked                          |
| 5   | skipStabilityWait disables auto-wait | Config `skipStabilityWait: true` | No `waitForUI5Stable` calls                     |
| 6   | Stability wait fires on main nav     | Main frame navigates to new hash | `waitForUI5Stable()` called                     |
| 7   | Stability wait ignores iframe nav    | iframe navigates (not mainFrame) | `waitForUI5Stable()` NOT called                 |
| 8   | Listener removed on teardown         | Test completes                   | `page.off('framenavigated')` called             |
| 9   | `waitForUI5Stable` failure non-fatal | Stability check throws           | Error caught silently, test continues           |
| 10  | Empty ignore patterns array          | Config with `ignorePatterns: []` | No routes registered, all requests pass through |

**Mock requirements**: Mock `page.route()` to capture registered patterns and abort callbacks. Mock `page.on('framenavigated')` to simulate navigation events. Mock `waitForUI5Stable()` from `#core/utils/wait-helpers.js`. Mock `pramanConfig` with `ignorePatterns`, `skipStabilityWait`, and `ui5WaitTimeout` fields. Mock `DEFAULT_IGNORE_PATTERNS` from `#bridge/bridge-constants.js`.

**Type-level tests**: Stability fixtures are auto fixtures (void return), so type-level testing focuses on the config interface: `expectTypeOf<PramanConfig>().toHaveProperty('skipStabilityWait')`; `expectTypeOf<PramanConfig>().toHaveProperty('ignorePatterns')`

**Estimated LOC**: ~110 source, ~90 tests

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

**Tests** (`tests/unit/auth/auth-handler.test.ts`):

| #   | Test Case                                         | Input                                               | Expected                                                               |
| --- | ------------------------------------------------- | --------------------------------------------------- | ---------------------------------------------------------------------- |
| 1   | Successful login delegates to strategy            | Valid config + strategy                             | `strategy.authenticate()` called, `authenticated === true`             |
| 2   | Login retries on failure (retryCount=2)           | Strategy fails once, succeeds on retry              | `strategy.authenticate()` called twice, eventual success               |
| 3   | Login exhausts retries and throws                 | Strategy always fails, `retryCount: 2`              | `AuthError` thrown after 2 attempts                                    |
| 4   | Login with exponential backoff delay              | `retryCount: 3`, `retryDelay: 1000`                 | `retry()` called with correct `baseDelay` and `maxRetries`             |
| 5   | Post-login verification fails triggers retry      | Strategy claims success but `isAuthenticated→false` | `AuthError` with `ERR_AUTH_FAILED`, retryable: true                    |
| 6   | `loginFromEnv()` reads SAP*CLOUD*\* vars          | `SAP_CLOUD_BASE_URL`, `SAP_CLOUD_USERNAME` set      | Config built from env, strategy selected, `login()` called             |
| 7   | `loginFromEnv()` reads SAP*ONPREM*\* vars         | `SAP_ONPREM_BASE_URL`, `SAP_ONPREM_USERNAME` set    | Config built from env, OnPrem strategy selected                        |
| 8   | `loginFromEnv()` missing required vars            | No `SAP_*` env vars set                             | `AuthError` with `ERR_AUTH_FAILED`, suggestions: 'Set SAP*CLOUD*\*'    |
| 9   | `logout()` calls appropriate cleanup              | Authenticated session                               | Navigates to logout URL, clears session info                           |
| 10  | `isAuthenticated()` delegates to strategy         | After login                                         | `strategy.isAuthenticated(page)` called, returns boolean               |
| 11  | `isSessionExpired()` returns false within timeout | Login 10s ago, `sessionTimeout: 3600`               | `false`                                                                |
| 12  | `isSessionExpired()` returns true after timeout   | Login 3601s ago, `sessionTimeout: 3600`             | `true`                                                                 |
| 13  | `getSessionInfo()` returns session details        | After login                                         | `Readonly<SessionInfo>` with strategy name, timestamp, URL             |
| 14  | `getSessionInfo()` returns null before login      | Before login                                        | `null`                                                                 |
| 15  | Non-retryable error stops retry immediately       | Strategy throws error with `retryable: false`       | Only 1 attempt, error propagated immediately                           |
| 16  | Logger receives auth lifecycle events             | Login attempt                                       | `logger.info()` called with 'Auth login started', 'Auth login success' |

**Mock requirements**: Mock `AuthStrategy` with configurable `authenticate()` (resolve/reject) and `isAuthenticated()` (return bool). Use `vi.stubEnv()` for `loginFromEnv()` env vars. Mock `retry()` from `#core/utils/retry.js` to verify backoff params. Use `vi.useFakeTimers()` for session expiry tests.

**Type-level tests**: `expectTypeOf<SAPAuthHandler>().toHaveProperty('login')`; `expectTypeOf<SAPAuthHandler>().toHaveProperty('isSessionExpired')`; `expectTypeOf(handler.getSessionInfo()).toEqualTypeOf<Readonly<SessionInfo> | null>()`

**Estimated LOC**: ~150 source, ~120 tests

#### 6.3.2 `auth/auth.setup.ts` (NEW — ~80 LOC)

**Purpose**: Playwright setup project file (D28 pattern). Runs as a regular test before all other tests. Produces `storageState` for dependent projects.

> **PLAYWRIGHT REVIEW NOTE (PW-AUTH-1)**: The design flow in Section 4.3 mentions
> trace recording (step 3: "Start trace recording", step 7: "Stop trace recording")
> for debugging auth failures. This is missing from the code below. While Playwright
> can handle tracing via `playwright.config.ts` (`use: { trace: 'on' }` for the
> setup project), explicit tracing in the setup file is useful for always-capture
> during auth (since auth is the most common failure point). Add
> `context.tracing.start()` / `context.tracing.stop()` calls, or configure the
> setup project with `use: { trace: 'on' }` in `playwright.config.ts`.
>
> Also note: The `authFile` path should use `node:path` to construct an absolute
> path for cross-platform safety (CLAUDE.md rule: always use `node:path` methods).
> Using a relative path like `.auth/sap-session.json` depends on the cwd being
> the project root, which may not be the case in all CI environments.

```typescript
import { test as setup, expect } from '@playwright/test';
import { SAPAuthHandler } from './auth-handler.js';
import { AuthStrategyFactory } from './auth-factory.js';
import { createLogger } from '#core/logging/index.js';
import { join } from 'node:path';

// Use absolute path for cross-platform safety (PW-AUTH-1)
const authFile = join(process.cwd(), '.auth', 'sap-session.json');

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

> **PLAYWRIGHT REVIEW NOTE (PW-MERGE-1)**: Each fixture file extends `base` from
> `@playwright/test` independently, but some fixtures (e.g., `sapAuth`) reference
> fixtures from OTHER extend calls (e.g., `pramanConfig` from `coreTest`). When
> `mergeTests(coreTest, authTest, ...)` runs, Playwright resolves cross-fixture
> dependencies correctly at runtime. However, for **TypeScript type safety**, each
> extend call must declare all cross-dependencies in its type parameter and provide
> `undefined!` placeholders. Without this, TypeScript will error when destructuring
> `{ pramanConfig }` since `base` does not know about `pramanConfig`.
>
> The same pattern applies to `navTest` referencing `pramanConfig`, `pramanLogger`,
> and `bridgeAdapter` from `coreTest`. Each must declare these as placeholder
> fixtures in their type signatures.
>
> **Correct pattern**:
>
> ```typescript
> type AuthDeps = { pramanConfig: Readonly<PramanConfig> };
> export const authTest = base.extend<AuthFixtures & AuthFixtureOptions & AuthDeps>({
>   pramanConfig: undefined!, // Placeholder — provided by coreTest via mergeTests
>   sapAuthConfig: [{ url: '', username: '', password: '' }, { option: true }],
>   sapAuth: async ({ page, sapAuthConfig, pramanConfig }, use) => { ... },
> });
> ```

```typescript
import { test as base } from '@playwright/test';
import type { SAPAuthConfig } from '../auth/auth-types.js';

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
| 8   | Empty sapAuthConfig uses defaults       | No config override (default)   | Handler created with empty config defaults  |
| 9   | Fixture teardown does not call logout   | Test ends with active session  | No `handler.logout()` invoked               |

**Mock requirements**: Mock `SAPAuthHandler` constructor and `initializeStrategy()`. Mock `AuthStrategyFactory.create()` to verify strategy selection. Mock `createLogger()` to verify child logger creation. Mock `page` as minimal Page stub. Use `tests/helpers/mock-config.ts` for `pramanConfig`.

**Type-level tests**: `expectTypeOf<AuthFixtureOptions>().toHaveProperty('sapAuthConfig')`; `expectTypeOf<AuthFixtures>().toHaveProperty('sapAuth')`; `expectTypeOf<SAPAuthConfig>().toExtend<{ url: string; username: string; password: string }>()`

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

export async function navigateForward(page: Page, options?: NavigationOptions): Promise<void>;

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

| #   | Test Case                            | Input                                  | Expected                                |
| --- | ------------------------------------ | -------------------------------------- | --------------------------------------- |
| 1   | Navigate to app by ID                | `'PurchaseOrder-manage'`               | `page.goto()` with hash, stability wait |
| 2   | Navigate to tile by title            | `'Manage Purchase Orders'`             | Tile locator clicked, stability wait    |
| 3   | Navigate to intent with params       | `'PurchaseOrder-display', { PO: '1' }` | Hash with parameters, stability wait    |
| 4   | Navigate to home                     | N/A                                    | `#Shell-home` hash, stability wait      |
| 5   | Navigate back                        | N/A                                    | Shell back button or `page.goBack()`    |
| 5b  | Navigate forward                     | N/A                                    | `page.goForward()`, stability wait      |
| 6   | Search and open app                  | `'Purchase Orders'`                    | Search bar filled, app clicked          |
| 7   | Get current hash                     | Page at `#PurchaseOrder-manage`        | `'PurchaseOrder-manage'`                |
| 8   | Stability wait after navigation      | Navigate to app                        | `waitForUI5Stable()` called             |
| 9   | Custom timeout                       | `{ timeout: 5000 }`                    | Timeout passed to stability wait        |
| 10  | `NavigationError` on failure         | Tile not found                         | `NavigationError` with suggestions      |
| 11  | Navigate with `waitForStable: false` | `{ waitForStable: false }`             | `waitForUI5Stable()` NOT called         |
| 12  | Empty app ID string                  | `navigateToApp('')`                    | `NavigationError` with validation error |
| 13  | Hash with special characters         | `navigateToHash('#PO-manage&/123')`    | Hash correctly encoded and navigated    |
| 14  | `navigateToIntent` with empty params | `('PO-display', {})`                   | Hash without parameters, stability wait |

**Mock requirements**: Mock `Page` with `page.goto()`, `page.goBack()`, `page.goForward()`, `page.locator()` (for tile click and search bar). Mock `waitForUI5Stable()` from `#core/utils/wait-helpers.js`. Mock `page.evaluate()` for `window.hasher.setHash()` hash navigation. Mock `createLogger()` for child logger verification.

**Type-level tests**: `expectTypeOf(navigateToApp).parameters.toExtend<[Page, string, NavigationOptions?]>()`; `expectTypeOf<NavigationOptions>().toHaveProperty('timeout')`; `expectTypeOf<NavigationOptions>().toHaveProperty('waitForStable')`; `expectTypeOf(getCurrentHash).returns.toEqualTypeOf<Promise<string>>()`

**Estimated LOC**: ~210 source, ~150 tests

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
      navigateForward: (options?) =>
        withStep(createStepName('nav', 'navigateForward'), () => navigateForward(page, options)),
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

**Tests** (`tests/unit/fixtures/nav-fixtures.test.ts`):

| #   | Test Case                                       | Input                                            | Expected                                                     |
| --- | ----------------------------------------------- | ------------------------------------------------ | ------------------------------------------------------------ |
| 1   | `ui5Navigation` fixture provides all methods    | Destructure fixture                              | All 9 navigation methods available on returned object        |
| 2   | `navigateToApp` wraps with `withStep()`         | Call `ui5Navigation.navigateToApp('PO-manage')`  | `withStep()` called with step name containing 'PO-manage'    |
| 3   | `navigateToTile` delegates to module function   | Call `ui5Navigation.navigateToTile('Orders')`    | `navigateToTile(page, 'Orders')` called                      |
| 4   | `navigateToIntent` passes params through        | Call with `('PO-display', { PO: '1' })`          | Module function receives intent + params                     |
| 5   | `getCurrentHash` returns hash without step wrap | Call `ui5Navigation.getCurrentHash()`            | Direct delegation to `getCurrentHash(page)`, no step wrapper |
| 6   | Child logger created with 'nav' module name     | Fixture initialization                           | `createLogger('nav', pramanLogger)` called                   |
| 7   | Config `baseURL` passed to navigation functions | Config with `baseURL: 'https://sap.example.com'` | `navigateToApp` receives `baseURL` in options                |
| 8   | `btpWorkZone` stub returns null (before B6b)    | Access `btpWorkZone` before B6b wiring           | Returns stub (null-ish), no crash                            |
| 9   | Navigation error propagated to caller           | Module function throws `NavigationError`         | Error propagated through fixture, not swallowed              |

**Mock requirements**: Mock `navigateToApp`, `navigateToTile`, etc. from `modules/navigation.js` as `vi.fn()`. Mock `withStep()` from `#core/utils/step-decorator.js` to verify step name construction. Mock `createLogger()` to verify child logger creation. Mock `pramanConfig` with `baseURL`.

**Type-level tests**: `expectTypeOf<UI5NavigationAPI>().toHaveProperty('navigateToApp')`; `expectTypeOf<UI5NavigationAPI>().toHaveProperty('navigateToTile')`; `expectTypeOf<UI5NavigationAPI>().toHaveProperty('getCurrentHash')`

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
  // PLAYWRIGHT REVIEW NOTE (PW-WZ-2): Add getAppFrameForEval() method
  // that returns a Frame object (not FrameLocator). FrameLocator is for
  // element location only — it has no evaluate() method. Bridge injection
  // and bridge status checks require Frame.evaluate(). The internal
  // implementation should resolve the Frame via page.frame({ url }) or
  // page.frames().find() and cache it.
  getAppFrameForEval(): Frame;
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

> **PLAYWRIGHT REVIEW NOTE (PW-WZ-1)**: `FrameLocator` does NOT have an `evaluate()`
> method. `FrameLocator` is only for locating elements within iframes. To execute
> JavaScript inside an iframe (e.g., bridge injection), you must use a `Frame` object
> obtained via `page.frame({ url: /pattern/ })` or `page.frames().find(...)`, then
> call `frame.evaluate()`. The `switchToApp()` method can still return `FrameLocator`
> for element interactions, but `enableDualBridge()` must internally resolve the `Frame`
> object for script injection. Consider adding `getAppFrameObject(): Frame` as an
> internal method for bridge injection, distinct from `getAppFrame(): FrameLocator`
> for locator-based element interaction.

1. Main frame: `page.evaluate(injectBridge)` — injects into shell page
2. App iframe: `frame.evaluate(injectBridge)` — resolve `Frame` via `page.frame({ url })` or `page.frames()`, then inject (**NOT** `frameLocator.evaluate()` which does not exist)
3. All UI5 operations target the app iframe by default
4. Shell operations (tile click, navigation bar) target the main frame

**Tests** (`tests/unit/modules/workzone.test.ts`):

| #   | Test Case                        | Input                           | Expected                                       |
| --- | -------------------------------- | ------------------------------- | ---------------------------------------------- |
| 1   | Detect WorkZone environment      | Page with shell iframe          | `true`                                         |
| 2   | Non-WorkZone environment         | Standard FLP page               | `false`                                        |
| 3   | Enable dual bridge injection     | WorkZone page                   | Bridge in both frames                          |
| 4   | Switch to app frame              | After enableDualBridge          | `FrameLocator` for app iframe                  |
| 5   | Switch to shell frame            | After enableDualBridge          | `Page` reference for shell                     |
| 6   | Navigate to app in WorkZone      | App ID                          | App iframe updated, bridge re-injected         |
| 7   | Get current app name             | Active app in iframe            | App semantic object returned                   |
| 8   | App readiness check              | App loading                     | Waits for UI5 stable in iframe                 |
| 9   | Dual bridge after app navigation | Navigate between WorkZone apps  | Both bridges re-injected in new app context    |
| 10  | `getCurrentApp()` returns null   | No app loaded in iframe         | Returns `null` (no error)                      |
| 11  | `isAppReady()` times out         | App never loads, `timeout: 100` | Returns `false` (no throw)                     |
| 12  | Multiple iframe detection        | Page with 2+ iframes            | Selects correct app iframe (not ads/analytics) |

**Mock requirements**: Mock `Page` with `page.frameLocator()` for iframe selection. Mock `FrameLocator` with `evaluate()` for bridge injection into iframes. Mock `page.evaluate()` for shell-frame bridge injection. Mock `BridgeAdapter` with `init()` and `resetInjectionState()`. Mock `injectBridge()` from `#bridge/injection.js`. Mock `waitForUI5Stable()` for iframe readiness.

**Type-level tests**: `expectTypeOf<BTPWorkZoneManager>().toHaveProperty('detect')`; `expectTypeOf<BTPWorkZoneManager>().toHaveProperty('enableDualBridge')`; `expectTypeOf<BTPWorkZoneManager>().toHaveProperty('switchToShell')`; `expectTypeOf<BTPWorkZoneManager>().toHaveProperty('switchToApp')`; `expectTypeOf(manager.switchToApp()).toEqualTypeOf<FrameLocator>()`; `expectTypeOf(manager.switchToShell()).toEqualTypeOf<Page>()`

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

// PLAYWRIGHT REVIEW NOTE (PW-EXPECT-1): Re-exporting `expect` directly from
// '@playwright/test' exports the BASE expect object. The custom UI5 matchers
// registered via `expect.extend()` in the worker auto fixture mutate the GLOBAL
// expect object at runtime, so they WILL be available to consumers. However,
// for TypeScript type-safety, consumers won't see the custom matcher types
// (e.g., `toHaveUI5Text`, `toBeUI5Visible`) unless we create and export a
// properly-typed expect. Two approaches:
//
// Option A (recommended): Create a typed expect wrapper:
//   import { expect as baseExpect } from '@playwright/test';
//   export const expect = baseExpect.extend(ui5Matchers);
//   // This returns a new expect with correct types for UI5 matchers.
//
// Option B: Augment the Playwright module types via declaration merging:
//   declare module '@playwright/test' {
//     interface Matchers<R, T> {
//       toHaveUI5Text(expected: string, options?: { timeout?: number }): R;
//       toBeUI5Visible(options?: { timeout?: number }): R;
//       // ...
//     }
//   }
//   export { expect } from '@playwright/test';
//
// If using Option A, the `expect.extend()` call in the worker auto fixture
// becomes redundant (the assembly already extends). Remove the auto fixture
// registration and do it once here instead. This is cleaner and avoids
// double-registration.
export { expect } from '@playwright/test';

// Re-export types for consumer convenience
export type { PramanConfig } from '#core/config/index.js';
export type { BridgeAdapter } from '#bridge/index.js';
export type { SAPAuthConfig, AuthStrategy } from '../auth/index.js';
export type { UI5NavigationAPI, BTPWorkZoneAPI } from './nav-fixtures.js';
````

**Tests** (`tests/unit/fixtures/index.test.ts`):

| #   | Test Case                            | Input                            | Expected                              |
| --- | ------------------------------------ | -------------------------------- | ------------------------------------- |
| 1   | `test` includes all core fixtures    | Destructure `{ ui5 }`            | Available                             |
| 2   | `test` includes auth fixtures        | Destructure `{ sapAuth }`        | Available                             |
| 3   | `test` includes nav fixtures         | Destructure `{ ui5Navigation }`  | Available                             |
| 4   | `test` includes stability fixtures   | Auto fixtures run                | Request interception active           |
| 5   | `expect` re-exported from Playwright | `expect(locator).toBeVisible()`  | Standard Playwright expect works      |
| 6   | Worker fixtures shared across tests  | Two tests, check config identity | Same `pramanConfig` instance          |
| 7   | No fixture name collisions           | All fixture names across modules | No duplicate names in merged test     |
| 8   | Type re-exports available            | `import type { PramanConfig }`   | Type re-exported from fixtures barrel |

**Mock requirements**: Mock `mergeTests()` from `@playwright/test` to verify all 4 fixture modules are merged. Verify `test` and `expect` exports are functions. Use `expectTypeOf` for type-level validation of fixture composition.

**Type-level tests**: `expectTypeOf(test).toBeFunction()`; `expectTypeOf(expect).toBeFunction()`; verify all fixture names (`ui5`, `sapAuth`, `ui5Navigation`, `btpWorkZone`, `pramanConfig`, `bridgeAdapter`) are in the merged fixture type

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
| 20a | `src/fixtures/ui5-handler.ts`                  | Fixtures | ~300 | 3.2       |
| 20b | `src/fixtures/shell-handler.ts` _(optional)_   | Fixtures | ~100 | 3.3       |
| 20c | `src/fixtures/footer-handler.ts` _(optional)_  | Fixtures | ~80  | 3.3       |

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
| 28  | `src/proxy/playwright-api.ts`        | Wire into `dynamic-proxy.ts` get trap for interaction routing           | 3.2       |
| 29  | `src/proxy/return-handler.ts`        | Wire sub-proxy creation via `proxy-converter.ts` (B3d)                  | 3.2       |

### 8.3 Test Files (New)

| #   | Test File Path                                              | Tests Est. | Sub-Phase |
| --- | ----------------------------------------------------------- | ---------- | --------- |
| 1   | `tests/unit/fixtures/core-fixtures.test.ts`                 | 17         | 3.1       |
| 2   | `tests/unit/auth/strategies/onprem-strategy.test.ts`        | 9          | 3.1       |
| 3   | `tests/unit/auth/strategies/cloud-saml-strategy.test.ts`    | 9          | 3.1       |
| 4   | `tests/unit/auth/strategies/office365-strategy.test.ts`     | 10         | 3.1       |
| 5   | `tests/unit/auth/strategies/api-strategy.test.ts`           | 9          | 3.1       |
| 6   | `tests/unit/auth/strategies/certificate-strategy.test.ts`   | 7          | 3.1       |
| 7   | `tests/unit/auth/strategies/multi-tenant-strategy.test.ts`  | 8          | 3.1       |
| 8   | `tests/unit/auth/auth-factory.test.ts`                      | 14         | 3.1       |
| 9   | `tests/unit/auth/auth-checks.test.ts`                       | 12         | 3.1       |
| 10  | `tests/unit/fixtures/stability-fixtures.test.ts`            | 10         | 3.2       |
| 11  | `tests/unit/auth/auth-handler.test.ts`                      | 16         | 3.2       |
| 12  | `tests/unit/fixtures/auth-fixtures.test.ts`                 | 9          | 3.2       |
| 13  | `tests/unit/modules/navigation.test.ts`                     | 14         | 3.2       |
| 14  | `tests/unit/fixtures/nav-fixtures.test.ts`                  | 9          | 3.2       |
| 15  | `tests/unit/modules/workzone.test.ts`                       | 12         | 3.3       |
| 16  | `tests/unit/fixtures/index.test.ts`                         | 8          | 3.3       |
| 17  | `tests/unit/fixtures/ui5-handler.test.ts`                   | 28         | 3.2       |
| 18  | `tests/unit/fixtures/shell-handler.test.ts` _(optional)_    | 7          | 3.3       |
| 19  | `tests/unit/fixtures/footer-handler.test.ts` _(optional)_   | 8          | 3.3       |
| 20  | `tests/unit/proxy/return-handler.test.ts` _(B3d additions)_ | 11         | 3.2       |

### 8.4 Test Helpers (New)

| #   | File Path                               | Purpose                                                                           |
| --- | --------------------------------------- | --------------------------------------------------------------------------------- |
| 1   | `tests/helpers/mock-playwright-test.ts` | Mock `test.extend()`, `mergeTests()`, `expect.extend()` for unit testing fixtures |
| 2   | `tests/helpers/mock-auth-page.ts`       | Mock Page with SAP login form selectors for auth strategy testing                 |

### 8.5 Summary

| Metric           | Count                                                                                                                                |
| ---------------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| New source files | 22 (19 base + 3 gap remediation: UI5Handler, shell, footer)                                                                          |
| Modified files   | 11 (9 base + 2 gap: playwright-api.ts, return-handler.ts)                                                                            |
| New test files   | 19 (16 base + 3 gap: ui5-handler, shell-handler, footer)                                                                             |
| New test helpers | 2                                                                                                                                    |
| Total new LOC    | ~3,290 (2,530 base + 760 gap: UI5Handler ~500, B3d ~50, B6c ~210)                                                                    |
| Total new tests  | ~215 (expanded from ~137 after TDD review: all test tables fully specified with edge cases, mock requirements, and type-level tests) |

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

> **API**: Use `expectTypeOf().toExtend()` (NOT deprecated `toMatchTypeOf()`).
> These tests go in the same `*.test.ts` files as their corresponding modules.

| #   | Test Case                              | Assertion                                                                               | Test File                        |
| --- | -------------------------------------- | --------------------------------------------------------------------------------------- | -------------------------------- |
| 1   | All fixtures available via `test`      | `expectTypeOf<Parameters<typeof test>[1]>` includes all fixture types                   | `fixtures/index.test.ts`         |
| 2   | `SAPAuthConfig` fields are correct     | `expectTypeOf<SAPAuthConfig>().toExtend<{ url: string; username: string }>()`           | `auth/auth-factory.test.ts`      |
| 3   | `AuthStrategy` interface complete      | `expectTypeOf<AuthStrategy>().toHaveProperty('authenticate')`                           | `auth/auth-factory.test.ts`      |
| 4   | `UI5NavigationAPI` methods exist       | `expectTypeOf<UI5NavigationAPI>().toHaveProperty('navigateToApp')`                      | `fixtures/nav-fixtures.test.ts`  |
| 5   | `UI5Handler` has all public methods    | `expectTypeOf<UI5Handler>().toHaveProperty('control')`                                  | `fixtures/ui5-handler.test.ts`   |
| 6   | `BTPWorkZoneManager` interface         | `expectTypeOf<BTPWorkZoneManager>().toHaveProperty('detect')`                           | `modules/workzone.test.ts`       |
| 7   | `NavigationOptions` fields             | `expectTypeOf<NavigationOptions>().toHaveProperty('timeout')`                           | `modules/navigation.test.ts`     |
| 8   | `SessionInfo` is readonly              | `expectTypeOf(handler.getSessionInfo()).toEqualTypeOf<Readonly<SessionInfo> \| null>()` | `auth/auth-handler.test.ts`      |
| 9   | All strategies extend `AuthStrategy`   | `expectTypeOf<OnPremAuthStrategy>().toExtend<AuthStrategy>()`                           | each strategy test file          |
| 10  | `PramanConfig` is readonly             | `expectTypeOf<PramanConfig>().toExtend<Readonly<Record<string, unknown>>>()`            | `fixtures/core-fixtures.test.ts` |
| 11  | Auth fixture options are typed         | `expectTypeOf<AuthFixtureOptions>().toHaveProperty('sapAuthConfig')`                    | `fixtures/auth-fixtures.test.ts` |
| 12  | `PlaywrightFeatures` has feature flags | `expectTypeOf<PlaywrightFeatures>().toHaveProperty('hasBoxedStep')`                     | `fixtures/core-fixtures.test.ts` |

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
| `src/bridge/injection.ts`            | Add `resetPageInjection()` export          | Low    |
| `src/proxy/playwright-api.ts`        | Wire into dynamic-proxy get trap           | Medium |
| `src/proxy/return-handler.ts`        | Wire sub-proxy creation (B3d)              | Medium |

### 10.2 Build Impact

| Metric       | Before Phase 3 | After Phase 3 | Delta  |
| ------------ | -------------- | ------------- | ------ |
| Source files | 90             | 123           | +33    |
| Test files   | 73             | 94            | +21    |
| Total LOC    | ~19,000        | ~22,290       | +3,290 |
| Test cases   | 929            | ~1,066        | +137   |
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

| #   | Risk                                                        | Probability | Impact | Mitigation                                                                                                                               |
| --- | ----------------------------------------------------------- | ----------- | ------ | ---------------------------------------------------------------------------------------------------------------------------------------- |
| R1  | `mergeTests()` fixture name collision                       | Low         | High   | All Praman fixtures use `praman`/`ui5`/`sap` prefixed names                                                                              |
| R2  | Auth strategy selector changes (SAP IAS/O365)               | Medium      | Medium | Selector fallback chains (3+ selectors per field). Test with mock page.                                                                  |
| R3  | Worker-scoped fixture race conditions                       | Low         | High   | Playwright guarantees sequential worker fixture init. No shared state.                                                                   |
| R4  | Bridge adapter interface change breaks tests                | Medium      | Medium | Add `getSelectorForControl` to all 3 adapters in single batch (B1b)                                                                      |
| R5  | `dotenv` not loading in Playwright setup                    | Medium      | High   | Explicit `dotenv.config()` in `auth.setup.ts`. Test with `vi.stubEnv()`.                                                                 |
| R6  | WorkZone iframe detection fails                             | Medium      | Medium | Multiple detection strategies: iframe selector, URL pattern, shell API                                                                   |
| R7  | OTel span wrapping adds latency                             | Low         | Low    | NoOp tracer in Phase 3. Real OTel deferred to Phase 5+.                                                                                  |
| R8  | `page.route()` interception order conflicts                 | Low         | Medium | WalkMe/analytics routes registered first (auto fixture), user routes last                                                                |
| R9  | Auth strategies exceed 300 LOC per file                     | Low         | Low    | Each strategy is ~90-130 LOC. Factory is ~80 LOC. Well within limit.                                                                     |
| R10 | G2 stub removal causes integration regression               | Low         | Medium | Unit tests verify bridge round-trips. INT1/INT2 (Phase 7) catch regressions.                                                             |
| R11 | `CSS.escape()` used in Node.js context (PW-CSS-1)           | High        | Medium | `CSS.escape()` is browser-only API. Use `css.escape` npm pkg or custom helper in Node.js.                                                |
| R12 | `FrameLocator.evaluate()` called (PW-WZ-1)                  | High        | High   | `FrameLocator` has no `evaluate()`. Must use `Frame` object via `page.frame()` for script injection.                                     |
| R13 | `mergeTests()` cross-fixture type safety (PW-MERGE-1)       | Medium      | Medium | Each `base.extend()` must declare placeholder fixtures for cross-dependencies. TypeScript compile error otherwise.                       |
| R14 | `framenavigated` listener missing main-frame check          | High        | Medium | All `page.on('framenavigated')` listeners MUST check `frame === page.mainFrame()` to filter iframe events.                               |
| R15 | Worker fixtures missing `{ scope: 'worker' }` syntax        | High        | High   | Without tuple syntax `[fn, { scope: 'worker' }]`, fixtures default to test-scoped. Must verify all 6 worker fixtures use correct syntax. |
| R16 | `expect` re-export lacks custom matcher types (PW-EXPECT-1) | Medium      | Medium | Need typed `expect.extend()` return or module augmentation for TypeScript consumers to see UI5 matcher methods.                          |

---

## 13. Barrel File Updates

### 13.1 `src/auth/index.ts`

```typescript
/**
 * Auth module barrel — re-exports auth strategies, handler, and utilities.
 *
 * @module auth
 */

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
export type { AuthStrategy, SAPAuthConfig, SessionInfo } from './auth-types.js';
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
  navigateForward,
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
  navigateForward,
} from './modules/index.js';
```

---

## 14. Implementation Batching

### 14.1 Sub-Phase 3.1 Batches (Foundation)

| Batch   | Files                                                                                                                                     | Est. LOC | Depends On |
| ------- | ----------------------------------------------------------------------------------------------------------------------------------------- | -------- | ---------- |
| **B1a** | G2 fix: `proxy/dynamic-proxy.ts` (modify) + test updates                                                                                  | ~40      | None       |
| **B1b** | Orphan wiring: `bridge/adapter.ts`, `classic-adapter.ts`, `webcomponent-adapter.ts`, `hybrid-adapter.ts`, `injection.ts` (modify) + tests | ~80      | None       |
| **TH1** | `tests/helpers/mock-auth-page.ts`, `tests/helpers/mock-playwright-test.ts`                                                                | ~120     | None       |
| **B2a** | `auth/auth-types.ts` + `auth/auth-checks.ts` + tests                                                                                      | ~200     | None       |
| **B2b** | `auth/strategies/onprem-strategy.ts` + test                                                                                               | ~220     | B2a        |
| **B2c** | `auth/strategies/cloud-saml-strategy.ts` + test                                                                                           | ~230     | B2a        |
| **B2d** | `auth/strategies/office365-strategy.ts` + test                                                                                            | ~240     | B2a        |
| **B2e** | `auth/strategies/api-strategy.ts` + `certificate-strategy.ts` + tests                                                                     | ~260     | B2a        |
| **B2f** | `auth/strategies/multi-tenant-strategy.ts` + `auth/auth-factory.ts` + tests                                                               | ~260     | B2b-e      |
| **B3a** | `fixtures/core-fixtures.ts` (worker fixtures only) + tests                                                                                | ~200     | TH1        |
| **B3b** | `fixtures/core-fixtures.ts` (test fixtures: adapter + proxy) + tests                                                                      | ~250     | B3a        |

### 14.2 Sub-Phase 3.2 Batches (Wiring + Auth Setup)

| Batch   | Files                                                                                                                                                                                                                   | Est. LOC | Depends On |
| ------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------- | ---------- |
| **B4a** | `fixtures/stability-fixtures.ts` + tests                                                                                                                                                                                | ~180     | B3b        |
| **B4b** | `auth/auth-handler.ts` + test                                                                                                                                                                                           | ~270     | B2f        |
| **B4c** | `auth/auth.setup.ts` + `auth/auth.teardown.ts`                                                                                                                                                                          | ~110     | B4b        |
| **B5a** | `fixtures/auth-fixtures.ts` + test                                                                                                                                                                                      | ~180     | B4b, B3b   |
| **B5b** | `modules/navigation.ts` + test                                                                                                                                                                                          | ~350     | B3b        |
| **B5c** | `fixtures/nav-fixtures.ts` + test (without btpWorkZone)                                                                                                                                                                 | ~280     | B5b, B3b   |
| **B5d** | Wire `playwright-api.ts` into `dynamic-proxy.ts`: expand `ControlProxyState` (page + strategy), add interaction routing in get trap, add `routeToInteractionStrategy()` helper + tests                                  | ~200     | B3b        |
| **B3c** | `fixtures/ui5-handler.ts` + test: UI5Handler class with control(), controls(), click(), fill(), press(), select(), check(), uncheck(), clear(), getText(), getValue(), waitForUI5(), waitFor(), clearCache(), destroy() | ~500     | B3a, B3b   |
| **B3d** | Wire `proxy/return-handler.ts` sub-proxy creation: import `proxy-converter.ts`, wrap aggregation→proxy[], element→controlProxy, object→UI5ObjectProxy                                                                   | ~50      | B3c        |

### 14.3 Sub-Phase 3.3 Batches (Assembly)

| Batch   | Files                                                                                                                                        | Est. LOC | Depends On |
| ------- | -------------------------------------------------------------------------------------------------------------------------------------------- | -------- | ---------- |
| **B6a** | `modules/workzone.ts` + test                                                                                                                 | ~320     | B3b        |
| **B6b** | `fixtures/nav-fixtures.ts` update (wire btpWorkZone) + test update                                                                           | ~40      | B6a, B5c   |
| **B6c** | _(optional)_ `fixtures/shell-handler.ts` + `fixtures/footer-handler.ts` + tests                                                              | ~250     | B3c        |
| **B7**  | `fixtures/index.ts` assembly + barrel updates (`auth/index.ts`, `modules/index.ts`, `src/index.ts`) + `npm run ci` + `npm run check:exports` | ~200     | All above  |

**Total: 24 batches** (21 base + 3 gap remediation: B3c handler, B3d return-proxy, B6c shell/footer)

### 14.4 Consolidated Agent Delivery Schedule (19 Agents, 6 Waves)

#### Agent Merges Applied (24 batches → 19 agents)

| Merge | Batches Merged | Agent   | Rationale                                                      | Combined LOC |
| ----- | -------------- | ------- | -------------------------------------------------------------- | ------------ |
| 1     | B1a + B1b      | **A1**  | Both Level 0, both modify proxy/bridge                         | ~120         |
| 2     | B2b + B2c      | **A6**  | Both depend on B2a, same auth strategy pattern                 | ~450         |
| 3     | B2d + B2e      | **A7**  | Both depend on B2a, same auth strategy pattern                 | ~500         |
| 4     | B4b + B4c      | **A12** | Sequential chain (B4c depends on B4b), same auth domain        | ~380         |
| 5     | B7 + B6b       | **A19** | B6b is tiny (40 LOC), A19 already touches all fixtures/barrels | ~240         |

#### Agent Assignment Table

| Agent   | Batches   | Description                                        | Source LOC | Test LOC   | Wave |
| ------- | --------- | -------------------------------------------------- | ---------- | ---------- | ---- |
| **A1**  | B1a + B1b | G2 proxy fix + orphan wiring                       | ~120       | ~80        | 1    |
| **A2**  | TH1       | Test helpers: mock-auth-page, mock-playwright-test | ~120       | —          | 1    |
| **A3**  | B2a       | Auth types + auth-checks                           | ~200       | ~200       | 1    |
| **A4**  | B3a       | Core fixtures (worker-scoped)                      | ~200       | ~170       | 2    |
| **A5**  | B3b       | Core fixtures (test-scoped: adapter + proxy)       | ~250       | ~170       | 3    |
| **A6**  | B2b + B2c | OnPrem + CloudSAML strategies                      | ~450       | ~190       | 2    |
| **A7**  | B2d + B2e | O365 + API + Certificate strategies                | ~500       | ~160       | 2    |
| **A8**  | B2f       | Multi-tenant + auth factory                        | ~260       | ~220       | 3    |
| **A9**  | B3c       | UI5Handler class (14 methods)                      | ~500       | ~280       | 4    |
| **A10** | B4a       | Stability fixtures (WalkMe, auto-wait)             | ~180       | ~100       | 4    |
| **A11** | B5b       | Navigation module (8 functions)                    | ~350       | ~210       | 4    |
| **A12** | B4b + B4c | Auth handler + setup/teardown                      | ~380       | ~180       | 4    |
| **A13** | B5a       | Auth fixtures (sapAuth option fixture)             | ~180       | ~90        | 5    |
| **A14** | B5c       | Nav fixtures (step-decorated)                      | ~280       | ~90        | 5    |
| **A15** | B5d       | Playwright-API wiring into proxy                   | ~200       | ~120       | 4    |
| **A16** | B6a       | WorkZone module (dual-frame)                       | ~320       | ~120       | 4    |
| **A17** | B3d       | Return handler sub-proxy wiring                    | ~50        | ~110       | 5    |
| **A18** | B6c       | Shell header + footer bar handlers                 | ~250       | ~150       | 5    |
| **A19** | B7 + B6b  | Assembly + barrels + nav WZ update + CI            | ~240       | ~80        | 6    |
|         |           | **TOTALS**                                         | **~4,630** | **~2,720** |      |

#### Wave Execution Plan

```
Wave 1 [3 agents — no deps]
  A1 (B1a+B1b)    A2 (TH1)    A3 (B2a)
  ──────────────────────────────────────

Wave 2 [3 agents — deps: Wave 1]
  A4 (B3a)←A2     A6 (B2b+B2c)←A3     A7 (B2d+B2e)←A3
  ──────────────────────────────────────

Wave 3 [2 agents — deps: Wave 2]
  A5 (B3b)←A4     A8 (B2f)←A6,A7
  ──────────────────────────────────────
  ── Sub-Phase 3.1 Gate: npm run ci ──

Wave 4 [6 agents — max parallel, deps: Wave 3]
  A9  (B3c)←A4,A5        A10 (B4a)←A5
  A11 (B5b)←A5           A12 (B4b+B4c)←A8
  A15 (B5d)←A5           A16 (B6a)←A5
  ──────────────────────────────────────

Wave 5 [4 agents — deps: Wave 4]
  A13 (B5a)←A12,A5       A14 (B5c)←A11,A5
  A17 (B3d)←A9           A18 (B6c)←A9
  ──────────────────────────────────────
  ── Sub-Phase 3.2 Gate: npm run ci ──

Wave 6 [1 agent — assembly]
  A19 (B7+B6b)←ALL
  ──────────────────────────────────────
  ── Sub-Phase 3.3 Gate: npm run ci + npm run check:exports ──
```

#### Per-Agent ESLint Concerns

| Agent                   | Key ESLint Risk                                             | Mitigation                                                                 |
| ----------------------- | ----------------------------------------------------------- | -------------------------------------------------------------------------- |
| A1 (G2 fix)             | Removing stubs may break `switch-exhaustiveness-check`      | Ensure fallthrough to method forwarder                                     |
| A6/A7 (auth strategies) | `sonarjs/cognitive-complexity` for login flows              | Extract `fillLoginForm()`, `waitForRedirect()` helpers                     |
| A9 (UI5Handler)         | `max-lines: 300` exceeded (~500 LOC)                        | Add `// eslint-disable-next-line max-lines` or split into handler + helper |
| A11 (navigation)        | `security/detect-non-literal-regexp` for hash patterns      | Inline disable with comment                                                |
| A12 (auth handler)      | `strict-boolean-expressions` for session checks             | Use explicit null checks                                                   |
| A15 (proxy wiring)      | `@typescript-eslint/no-unsafe-assignment` for dynamic proxy | Use type-safe proxy state expansion                                        |
| A16 (WorkZone)          | `@microsoft/sdl/no-inner-html` for bridge injection         | Use `evaluate()` not innerHTML                                             |

#### Per-Agent Gate (every agent, every commit)

```bash
npm run lint -- --max-warnings 0    # Zero errors, zero warnings
npm run typecheck                    # tsc --noEmit passes
npm run test:unit -- --run <changed-files>   # Only affected tests
```

### 14.5 Critical Path

```
A2(TH1) → A4(B3a) → A5(B3b) → A11(B5b) → A14(B5c) → A19(B7+B6b)
Wave 1     Wave 2     Wave 3     Wave 4      Wave 5      Wave 6
```

**Critical path: 6 steps** across all 6 waves.

Secondary chains (not critical):

- Auth: A3→A6→A8→A12→A13→A19 (6 steps)
- Handler: A2→A4→A5→A9→A17→A19 (6 steps)

All chains converge at A19 (assembly). The fixture chain is the longest.

> Note: A9 (UI5Handler) depends on A4 + A5, NOT on auth agents.
> A13 depends on A12 + A5, NOT on A10. A10 is not on the critical path.

### 14.6 Phase 1 API Cross-Reference Table

> Every Phase 1 API consumed by Phase 3. Zero duplicates — no new interfaces
> or types overlap with Phase 1 APIs.

| Phase 1 API                       | Location                         | Phase 3 Consumer(s)                   |
| --------------------------------- | -------------------------------- | ------------------------------------- |
| `createBridgeAdapter()`           | `bridge/adapter-factory.ts`      | A4 (B3a — core-fixtures worker)       |
| `discoverControl()`               | `proxy/discovery.ts`             | A9 (B3c — UI5Handler)                 |
| `createControlProxy()`            | `proxy/dynamic-proxy.ts`         | A17 (B3d — return-handler wiring)     |
| `ControlProxyCache`               | `proxy/cache.ts`                 | A9 (B3c — UI5Handler)                 |
| `handleBridgeReturn()`            | `proxy/return-handler.ts`        | A17 (B3d — modifies signature)        |
| `convertToControlProxy()`         | `proxy/proxy-converter.ts`       | A17 (B3d — wires into return-handler) |
| `convertToObjectProxy()`          | `proxy/proxy-converter.ts`       | A17 (B3d — wires into return-handler) |
| `waitForUI5Stable()`              | `core/utils/wait-helpers.ts`     | A9, A10, A11, A16                     |
| `waitForUI5Bootstrap()`           | `core/utils/wait-helpers.ts`     | A4, A11                               |
| `createInteractionStrategy()`     | `bridge/interaction-strategies/` | A15 (B5d — proxy wiring)              |
| `ensureBridgeInjected()`          | `bridge/injection.ts`            | A4, A16                               |
| `createLogger()`                  | `core/logging/`                  | All agents (child loggers)            |
| `defineConfig()` / `loadConfig()` | `core/config/`                   | A4 (B3a — worker fixture)             |
| `PramanError` subclasses          | `core/errors/`                   | All agents                            |
| `DEFAULT_TIMEOUTS`                | `core/utils/constants.ts`        | A9, A10, A11                          |
| `retry()`                         | `core/utils/retry.ts`            | A12 (B4b — auth handler)              |
| `getPlaywrightFeatures()`         | `core/compat/`                   | A4 (B3a — worker fixture)             |

### 14.7 Batching Rules

1. **Each batch MUST produce compilable code** — `npm run typecheck` passing
2. **Test files ship WITH source files** in same batch (TDD)
3. **Barrel files** updated only in final batch (B7) to avoid intermediate breakage
4. **Max batch size**: ~350 LOC total (source + tests)
5. **CI gate** at sub-phase boundaries (B3b, B5c, B7) — not every batch
6. **TDD protocol**: Write tests RED → implement GREEN → refactor
7. **Import paths**: All use `#core/*`, `#bridge/*`, `#proxy/*` aliases with `.js` extensions
8. **TypeScript strict**: No `any`, no `as unknown as T` — use `import type` for type-only imports

---

## 15. Feature Parity Gap Analysis (dhikraft vs Praman)

> **Date**: 2026-02-17
> **Method**: Independent architectural review with code-level evidence
> **Sources**: dhikraft source (`/Users/maheshwar/Documents/projects/package/src`), Praman source + plan3.md
> **Scope**: Phase 3 (fixtures + auth + navigation) and proxy flow

### 15.1 Critical Finding: Missing UI5Handler Convenience API Layer

The most significant architectural gap between dhikraft and Praman is the **absence of a handler layer** between fixtures and the proxy.

**dhikraft architecture** (`handlers/ui5-handler.ts:210-2317`, 2317 LOC):

```
test author → UI5Handler.click(selector) → [auto-wait] → [discovery] → [cache] → [strategy] → bridge
```

The `ui5` fixture exposes a `UI5Handler` class with 20+ high-level methods. Each method internally manages bridge initialization, auto-wait (`waitForUI5Stable` BEFORE every operation), control discovery, caching, interaction strategy routing, and error handling.

**Praman plan3 architecture** (Section 5.3, line 967):

```
test author → ui5 fixture (UI5ControlProxy) → proxy get trap → bridge
```

Plan3 defines `ui5` as type `UI5ControlProxy` initialized via `createControlProxy(adapter)`. But `createControlProxy()` (in `proxy/dynamic-proxy.ts:142`) creates a proxy for a **single already-discovered control** — it requires `{ id, controlType, methods, adapter }`. It does NOT discover controls.

**Contradiction**: The usage example at line 989 shows `ui5.findControl({...})`, but `findControl` is NOT a method on the dynamic proxy (the proxy only has `getId`, `getControlType`, `getProperty`, etc.). The plan confuses the proxy (single-control wrapper) with a handler (control discovery + management).

**Evidence**:

| Aspect         | dhikraft `UI5Handler`                               | Praman plan3 `ui5` fixture                 |
| -------------- | --------------------------------------------------- | ------------------------------------------ |
| Type           | `UI5Handler` class (2317 LOC)                       | `UI5ControlProxy` (189 LOC proxy)          |
| Discovery      | `handler.control(selector)` → finds + returns proxy | No discovery method specified              |
| Multi-control  | `handler.controls(selector)` → all matching         | Not specified                              |
| Auto-wait      | Built into every method (line 639-648)              | Not in proxy or discovery.ts               |
| Interactions   | `handler.click(selector)` → discovers + clicks      | Not specified (proxy wraps single control) |
| Initialization | Lazy bridge inject on first call (line 296)         | Plan says lazy but proxy has no init flow  |

### 15.2 Complete Feature Parity Table

> Legend: `PARITY` = at functional parity, `PLANNED` = gap identified + fix in plan3, `GAP` = missing from plan3

#### A. Core Fixture & Handler API

| #   | Feature                                                      | dhikraft Evidence                                                                                         | Praman Status                                                                | Gap Level        | Remediation                                                               |
| --- | ------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------- | ---------------- | ------------------------------------------------------------------------- |
| A1  | **UI5Handler convenience layer**                             | `ui5-handler.ts:210-2317` — 20+ methods wrapping discovery, wait, cache, strategy                         | `ui5` fixture typed as `UI5ControlProxy` (bare proxy, no handler)            | **GAP-CRITICAL** | Add `UI5Handler` class between fixtures and proxy (see 15.3.1)            |
| A2  | **`control(selector)` discovery**                            | `ui5-handler.ts:359-396` — discovers single control with cache                                            | `discoverControl()` in proxy/discovery.ts:85 exists but NOT wired to fixture | **GAP-CRITICAL** | Wire via handler `.control()` method                                      |
| A3  | **`controls(selector)` plural**                              | `ui5-handler.ts:411-571` — find-all with visibility filter, registry + RecordReplay paths                 | `adapter.findControls()` interface exists, no handler method                 | **GAP-CRITICAL** | Add handler `.controls()` calling `adapter.findControls()`                |
| A4  | **`waitForUI5(timeout?)` explicit**                          | `ui5-handler.ts:579-597` — delegates to bridge stability check                                            | `waitForUI5Stable()` in utils but NOT exposed on fixture                     | **GAP-MEDIUM**   | Expose as handler method                                                  |
| A5  | **Auto-wait BEFORE discovery**                               | `ui5-control-proxy.ts:639-648` — `waitForUI5Stable()` called before every `createControlFinderFunction()` | `discovery.ts` has NO stability wait step                                    | **GAP-CRITICAL** | Add `waitForUI5Stable()` call at top of `discoverControl()` or in handler |
| A6  | **`click(selector)`**                                        | `ui5-handler.ts:1275-1292` — discovers + clicks via strategy                                              | Not on fixture API (proxy wraps single control)                              | **GAP-CRITICAL** | Handler method: discover → click                                          |
| A7  | **`fill(selector, value)`**                                  | `ui5-handler.ts:1319-1336` — discovers + fills via strategy                                               | Not on fixture API                                                           | **GAP-CRITICAL** | Handler method: discover → fill                                           |
| A8  | **`press(selector)`**                                        | `ui5-handler.ts:1403-1406` — alias for click                                                              | Not on fixture API                                                           | **GAP-MEDIUM**   | Handler method alias                                                      |
| A9  | **`select(selector, key)`**                                  | `ui5-handler.ts:1462-1477` — dropdown selection                                                           | Not on fixture API                                                           | **GAP-MEDIUM**   | Handler method                                                            |
| A10 | **`check(selector)` / `uncheck(selector)`**                  | `ui5-handler.ts:1499-1546` — checkbox operations                                                          | Not on fixture API                                                           | **GAP-MEDIUM**   | Handler methods                                                           |
| A11 | **`getValue(selector)` / `getText(selector)`**               | `ui5-handler.ts:1361-1376, 1559-1576` — text/value extraction                                             | Not on fixture API                                                           | **GAP-MEDIUM**   | Handler methods                                                           |
| A12 | **`clear(selector)`**                                        | `ui5-handler.ts:1589-1593` — delegates to fill('')                                                        | Not on fixture API                                                           | **GAP-LOW**      | Handler method                                                            |
| A13 | **`clearAndFill(selector, value)`**                          | `ui5-handler.ts:1938-1960` — clear then fill                                                              | Not on fixture API                                                           | **GAP-LOW**      | Handler method                                                            |
| A14 | **`type(selector, text, options?)`**                         | `ui5-handler.ts:1610-1656` — character-by-character with delay                                            | Not on fixture API                                                           | **GAP-LOW**      | Handler method                                                            |
| A15 | **`waitFor(selector, options?)`**                            | `ui5-handler.ts:1677-1719` — polling wait for visibility + enabled                                        | Not on fixture API                                                           | **GAP-MEDIUM**   | Handler method                                                            |
| A16 | **`hover(selector)` / `focus(selector)` / `blur(selector)`** | `ui5-handler.ts:1731-1882`                                                                                | Not on fixture API                                                           | **GAP-LOW**      | Handler methods                                                           |
| A17 | **`pressKey(selector, key)`**                                | `ui5-handler.ts:1896-1924` — keyboard interaction                                                         | Not on fixture API                                                           | **GAP-LOW**      | Handler method                                                            |
| A18 | **`selectComboBoxByText(selector, text)`**                   | `ui5-handler.ts:1975-2046` — ComboBox UI5 API interaction                                                 | Not on fixture API                                                           | **GAP-MEDIUM**   | Handler method (Fiori-critical)                                           |
| A19 | **`openValueHelpAndPick(selector, text)`**                   | `ui5-handler.ts:2061-2244` — F4 value help dialog                                                         | Not on fixture API                                                           | **GAP-MEDIUM**   | Handler method (Fiori-critical)                                           |
| A20 | **`isUI5Control(selector)`**                                 | `ui5-handler.ts:767-842` — 3-tier API detection                                                           | Not on fixture API                                                           | **GAP-MEDIUM**   | Handler method                                                            |
| A21 | **`inspect(controlOrId)`**                                   | `ui5-handler.ts:1106-1129` — full control details                                                         | `adapter.describeControl()` exists, not on fixture                           | **GAP-LOW**      | Handler method wrapping adapter                                           |
| A22 | **`getControlTree(rootId?, maxDepth?)`**                     | `ui5-handler.ts:1195-1210` — hierarchy tree                                                               | Not on fixture API                                                           | **GAP-LOW**      | Handler method (AI/debug use)                                             |
| A23 | **`getAllControlTypes()`**                                   | `ui5-handler.ts:1227-1245` — unique types on page                                                         | Not on fixture API                                                           | **GAP-LOW**      | Handler method (debug use)                                                |
| A24 | **`getControlProperties(controlOrId)`**                      | `ui5-handler.ts:1148-1167` — all properties as key-value                                                  | Not on fixture API                                                           | **GAP-LOW**      | Handler method                                                            |
| A25 | **`getSelectorForElement(options)`**                         | `ui5-handler.ts:876-887` — reverse selector discovery                                                     | `adapter.getSelectorForControl()` planned in 5.2.2                           | PLANNED          | No change needed                                                          |
| A26 | **`element(selector, options?)`**                            | `ui5-handler.ts:919-975` — unified UI5/HTML element proxy                                                 | Not on fixture API                                                           | **GAP-LOW**      | Phase 4 (hybrid element)                                                  |

#### B. Bridge & Proxy Wiring

| #   | Feature                                      | dhikraft Evidence                                                          | Praman Status                                               | Gap Level               | Remediation               |
| --- | -------------------------------------------- | -------------------------------------------------------------------------- | ----------------------------------------------------------- | ----------------------- | ------------------------- |
| B1  | **Playwright API wiring in proxy**           | `UI5ControlProxy` has explicit interaction methods → `InteractionStrategy` | `playwright-api.ts` exists but NOT wired into get trap      | PLANNED (Section 5.4)   | Batch B5d already planned |
| B2  | **`resetPageInjection()` for nav re-inject** | `page.on('framenavigated')` clears injection state                         | Not implemented; `injection.ts` has WeakSet but no `delete` | PLANNED (Section 5.2.3) | Batch already planned     |
| B3  | **ControlProxyState expansion**              | N/A (dhikraft uses class with fields)                                      | `ControlProxyState` lacks `page` + `interactionStrategy`    | PLANNED (Section 5.4)   | Batch B5d already planned |
| B4  | **Proxy cache clear on navigation**          | Handler has `framenavigated` → `cache.clear()`                             | Mentioned in diagram (line 745) but not in formal batch     | **GAP-LOW**             | Add to batch B3a/B5b      |
| B5  | **Bridge re-injection after navigation**     | `ensureBridgeInjected()` → `isBridgeReady()` check                         | WeakSet prevents re-check even if bridge is gone            | PLANNED (Section 5.2.3) | Batch already planned     |
| B6  | **G2: Remove 4 hardcoded proxy stubs**       | N/A (dhikraft routes all through bridge)                                   | Issue #22, plan3 Section 5.1 details the fix                | PLANNED (Section 5.1)   | Batch B1 already planned  |
| B7  | **Object map wiring**                        | Object map for Models/BindingContexts                                      | `object-map.ts` exists but not wired to adapter             | PLANNED (Section 5.2.1) | Batch already planned     |
| B8  | **Get-selector wiring**                      | `getSelectorForElement()` on handler                                       | `get-selector.ts` exists but not wired                      | PLANNED (Section 5.2.2) | Batch already planned     |

#### C. Auth System

| #   | Feature                                     | dhikraft Evidence                                                           | Praman Status                                             | Gap Level   | Remediation             |
| --- | ------------------------------------------- | --------------------------------------------------------------------------- | --------------------------------------------------------- | ----------- | ----------------------- |
| C1  | **Setup project pattern (not globalSetup)** | `dhikraft-fixtures.ts:1465-1536` — storageState + fixture                   | Plan3 Section 4.3 details setup project (D28)             | PARITY      | —                       |
| C2  | **OnPrem strategy (form login)**            | `auth-strategies.ts` — SAPOnPremAuthStrategy                                | Plan3 Section 5.4.1 details spec                          | PARITY      | —                       |
| C3  | **Cloud SAML strategy (SAP IAS)**           | `auth-strategies.ts` — SAPCloudAuthStrategy                                 | Plan3 Section 5.4.2 details spec                          | PARITY      | —                       |
| C4  | **Office365 strategy (Azure AD)**           | `auth-strategies.ts` — not explicitly separated (cloud handles MS redirect) | Plan3 Section 5.4.3 details spec                          | PARITY      | —                       |
| C5  | **API-based strategy (headless)**           | Not in dhikraft (dhikraft uses browser login only)                          | Plan3 Section 5.4.4 — NEW capability                      | IMPROVEMENT | Praman exceeds dhikraft |
| C6  | **Certificate strategy (PKI/SSL)**          | Not in dhikraft                                                             | Plan3 Section 5.4.5 — NEW capability                      | IMPROVEMENT | Praman exceeds dhikraft |
| C7  | **Multi-tenant strategy (BTP subdomain)**   | Not in dhikraft (handled via URL config)                                    | Plan3 Section 5.4.6 — NEW capability                      | IMPROVEMENT | Praman exceeds dhikraft |
| C8  | **Auth retry with exponential backoff**     | `sap-auth-handler.ts:86-225` — retry loop with `waitBeforeRetry()`          | Plan3 Section 6.3 uses `retry()` from core utils          | PARITY      | —                       |
| C9  | **`isAuthenticated()` session check**       | `sap-auth-handler.ts` — timestamp + timeout check                           | Plan3 Section 4.2 specifies status-check-only fixture     | PARITY      | —                       |
| C10 | **`loginFromEnv()` env-based config**       | `sap-auth-handler.ts` — SAP*CLOUD*_/SAP*ONPREM*_ env vars                   | Plan3 Section 4.3 — auth.setup.ts loads from env          | PARITY      | —                       |
| C11 | **No auto-login/logout in fixture**         | `dhikraft-fixtures.ts:1520-1536` — fixture only validates                   | Plan3 Section 4.2 line 196-198 — explicit "NO auto-login" | PARITY      | —                       |

#### D. Navigation

| #   | Feature                        | dhikraft Evidence                                             | Praman Status                                                                      | Gap Level   | Remediation              |
| --- | ------------------------------ | ------------------------------------------------------------- | ---------------------------------------------------------------------------------- | ----------- | ------------------------ |
| D1  | **Navigate to FLP tile**       | `navigation.ts` — `navigateToTile(page, title)`               | Plan3 Section 4.5 specifies full FLP navigation                                    | PARITY      | —                        |
| D2  | **Navigate by intent**         | `navigation.ts` — `navigateToIntent(page, intent, params?)`   | Plan3 specifies intent navigation                                                  | PARITY      | —                        |
| D3  | **Navigate by hash**           | `navigation.ts` — `navigateToHash(page, hash)`                | Plan3 specifies hash navigation                                                    | PARITY      | —                        |
| D4  | **Navigate back/forward**      | `navigation.ts` — `navigateBack()`, `navigateForward()`       | Plan3 Section 6.5: `navigateBack()` + `navigateForward()`                          | PARITY      | —                        |
| D5  | **Deep link navigation**       | `navigation.ts` — `navigateToDeepLink(page, intent, params?)` | Plan3 specifies deep link                                                          | PARITY      | —                        |
| D6  | **Navigate to home**           | `navigation.ts` — `navigateToHome(page)`                      | Plan3 specifies home navigation                                                    | PARITY      | —                        |
| D7  | **Navigation history**         | `navigation.ts` — `getNavigationHistory(page)`                | Not mentioned in plan3                                                             | **GAP-LOW** | Add to navigation module |
| D8  | **Search and open app**        | `navigation.ts` — `searchAndOpenApp(page, appTitle)`          | Plan3 Section 6.5 line 1663: `searchAndOpenApp()` + fixture wiring + barrel export | PARITY      | —                        |
| D9  | **Stability after navigation** | `waitForUI5Stable()` after every navigation call              | Plan3 Section 4.5 line 298 specifies `waitForUI5Stable`                            | PARITY      | —                        |

#### E. Shell & Footer Bar Handlers

| #   | Feature                                          | dhikraft Evidence                                   | Praman Status          | Gap Level      | Remediation                        |
| --- | ------------------------------------------------ | --------------------------------------------------- | ---------------------- | -------------- | ---------------------------------- |
| E1  | **Shell header assertion**                       | `ui5-navigation-bar.ts:65` — `expectShellHeader()`  | Not mentioned in plan3 | **GAP-MEDIUM** | Add to Phase 3.3 or Phase 4        |
| E2  | **Click home (shell)**                           | `ui5-navigation-bar.ts:100` — `clickHome()`         | Not mentioned          | **GAP-MEDIUM** | Add to nav handler                 |
| E3  | **Open user menu**                               | `ui5-navigation-bar.ts:163` — `openUserMenu()`      | Not mentioned          | **GAP-MEDIUM** | Add to nav handler                 |
| E4  | **Open notifications**                           | `ui5-navigation-bar.ts:282` — `openNotifications()` | Not mentioned          | **GAP-LOW**    | Phase 4                            |
| E5  | **Footer: Save/Apply/Create/Cancel/Edit/Delete** | `ui5-footer-bar.ts:45-120` — 6 button methods       | Not mentioned          | **GAP-MEDIUM** | Add footer handler to Phase 3 or 4 |

#### F. Assertion & Debug

| #   | Feature                          | dhikraft Evidence                                                      | Praman Status                                            | Gap Level   | Remediation                             |
| --- | -------------------------------- | ---------------------------------------------------------------------- | -------------------------------------------------------- | ----------- | --------------------------------------- |
| F1  | **UI5 Matchers (expect.extend)** | Not in dhikraft (uses custom assertion module)                         | Plan3 specifies `expect.extend()` with 8 matchers        | IMPROVEMENT | Praman exceeds dhikraft                 |
| F2  | **Assertion handler with retry** | `ui5-modules/assertion.ts` — function-based assertions with auto-retry | Not specified as fixture (matchers use Playwright retry) | PARITY      | Playwright matchers have built-in retry |
| F3  | **`@ui5Step` decorator**         | `utils/step-decorator.ts:45+` — wraps async methods with `test.step()` | Plan3 W6 specifies `withStep()` wrapper function         | PARITY      | Functional equivalent                   |

#### G. Configuration

| #   | Feature                          | dhikraft Evidence                                        | Praman Status                                                                        | Gap Level   | Remediation                     |
| --- | -------------------------------- | -------------------------------------------------------- | ------------------------------------------------------------------------------------ | ----------- | ------------------------------- |
| G1  | **`skipStabilityWait` config**   | `DhikraftConfig.skipWaitForUI5`                          | `PramanConfigSchema` line 135: `skipStabilityWait: z.boolean().default(false)`       | PARITY      | —                               |
| G2  | **`ui5WaitTimeout` config**      | `DhikraftConfig.ui5WaitTimeout`                          | `PramanConfigSchema` line 128: `ui5WaitTimeout: z.number().default(30_000)`          | PARITY      | —                               |
| G3  | **`ignoreAutoWaitUrls` config**  | `DhikraftConfig.ignoreAutoWaitUrls` with env var parsing | `PramanConfigSchema` line 137: `ignoreAutoWaitUrls: z.array(z.string()).default([])` | PARITY      | —                               |
| G4  | **`interactionStrategy` config** | `DhikraftConfig.interactionStrategy` — 3 strategies      | `PramanConfigSchema` line 130: `interactionStrategy` — 3 strategies                  | PARITY      | —                               |
| G5  | **`ui5WaitInterval` (polling)**  | `DhikraftConfig.ui5WaitInterval` (default 400ms)         | Not in PramanConfigSchema (hardcoded in `DEFAULT_TIMEOUTS.POLLING_INTERVAL`)         | **GAP-LOW** | Add to config or accept default |
| G6  | **`discoveryStrategies` config** | Not in dhikraft (hardcoded 3-tier)                       | `PramanConfigSchema` line 131-134: configurable strategy chain                       | IMPROVEMENT | Praman exceeds dhikraft         |
| G7  | **`testDataSource` config**      | `DhikraftConfig.testDataSource` — test data directory    | Not in PramanConfigSchema                                                            | **GAP-LOW** | Phase 4 (test data module)      |

#### H. Logging & Telemetry

| #   | Feature                   | dhikraft Evidence                                      | Praman Status                                   | Gap Level   | Remediation                          |
| --- | ------------------------- | ------------------------------------------------------ | ----------------------------------------------- | ----------- | ------------------------------------ |
| H1  | **Structured logging**    | `lib/logger.ts` — custom console-based with namespaces | `core/logging/logger.ts` — pino structured JSON | IMPROVEMENT | Praman exceeds dhikraft              |
| H2  | **OpenTelemetry spans**   | Not in dhikraft                                        | NoOp in Phase 1/3, real in Phase 4              | IMPROVEMENT | Praman exceeds dhikraft              |
| H3  | **DEBUG env var support** | `DEBUG=dhikraft:*` pattern matching                    | pino log levels via `LOG_LEVEL` env var         | PARITY      | Different mechanism, same capability |

#### I. WorkZone / BTP

| #   | Feature                         | dhikraft Evidence                             | Praman Status                             | Gap Level | Remediation |
| --- | ------------------------------- | --------------------------------------------- | ----------------------------------------- | --------- | ----------- |
| I1  | **Dual-frame bridge injection** | BTPWorkZoneManager — shell + app iframe       | Plan3 Section 4.6 specifies dual-frame    | PARITY    | —           |
| I2  | **Context switching**           | `switchToAppFrame()` / `switchToShellFrame()` | Plan3 specifies context switching methods | PARITY    | —           |

### 15.3 Gap Remediation Plan

#### 15.3.1 GAP-CRITICAL: Add UI5Handler Convenience Layer

**Root cause**: Plan3 defines `ui5` fixture as `UI5ControlProxy` which is a single-control proxy, not a handler. The handler layer is the missing architectural piece that connects fixtures → discovery → proxy → bridge.

**Fix**: Add `src/fixtures/ui5-handler.ts` (~300 LOC) implementing a `UI5Handler` class.

```
ui5 fixture → UI5Handler → [auto-wait] → discoverControl() → createControlProxy() → bridge
                          ↘ cache management
                          ↘ interaction strategy routing
                          ↘ bridge lifecycle (init, re-inject, destroy)
```

**Minimum API surface for Phase 3 (aligned with dhikraft)**:

```typescript
interface UI5Handler {
  // ── Discovery ────────────────────────────────────────────────
  control(selector: UI5Selector): Promise<UI5ControlBase>;
  controls(selector: UI5Selector): Promise<UI5ControlBase[]>;

  // ── Interaction (discover + act) ─────────────────────────────
  click(selector: UI5Selector): Promise<void>;
  fill(selector: UI5Selector, value: string): Promise<void>;
  press(selector: UI5Selector): Promise<void>;
  select(selector: UI5Selector, key: string): Promise<void>;
  check(selector: UI5Selector): Promise<void>;
  uncheck(selector: UI5Selector): Promise<void>;
  clear(selector: UI5Selector): Promise<void>;

  // ── Read ─────────────────────────────────────────────────────
  getText(selector: UI5Selector): Promise<string>;
  getValue(selector: UI5Selector): Promise<string>;

  // ── Wait ─────────────────────────────────────────────────────
  waitForUI5(timeout?: number): Promise<void>;
  waitFor(selector: UI5Selector, options?: WaitForOptions): Promise<void>;

  // ── Lifecycle ────────────────────────────────────────────────
  clearCache(): void;
  destroy(): void;
}
```

**Deferred to Phase 4**: `selectComboBoxByText()`, `openValueHelpAndPick()`, `isUI5Control()`, `inspect()`, `getControlTree()`, `getAllControlTypes()`, `getControlProperties()`, `element()`, `hover()`, `focus()`, `blur()`, `type()`, `pressKey()`.

**Impact on plan3 batches**:

- New batch `B3c` (~300 LOC source, ~200 LOC tests): `UI5Handler` class
- Modify batch `B3a` (core-fixtures.ts): Change `ui5` fixture type from `UI5ControlProxy` to `UI5Handler`
- Modify batch `B4a` (stability-fixtures.ts): Auto-wait integration with handler

**Tests** (`tests/unit/fixtures/ui5-handler.test.ts`):

| #   | Test Case                                                | Input                                                           | Expected                                                               |
| --- | -------------------------------------------------------- | --------------------------------------------------------------- | ---------------------------------------------------------------------- |
| 1   | `control()` discovers single control via adapter         | `{ controlType: 'sap.m.Button', properties: { text: 'Save' } }` | `discoverControl()` called, returns `UI5ControlBase` proxy             |
| 2   | `control()` calls `waitForUI5Stable()` before discovery  | Any selector                                                    | `waitForUI5Stable(page)` called BEFORE `discoverControl()`             |
| 3   | `control()` uses cache on second call with same selector | Same selector called twice                                      | `discoverControl()` called once (second returns cached)                |
| 4   | `control()` throws `ControlError` when not found         | Selector with no match, discovery returns null                  | `ControlError` with `ERR_CONTROL_NOT_FOUND`, retryable: true           |
| 5   | `controls()` discovers multiple controls                 | `{ controlType: 'sap.m.Button' }`                               | `adapter.findControls()` called, returns `UI5ControlBase[]`            |
| 6   | `controls()` returns empty array when none found         | Selector with no matches                                        | Returns `[]` (no error thrown)                                         |
| 7   | `controls()` filters by visibility when configured       | `preferVisibleControls: true` in config                         | Only visible controls returned from results                            |
| 8   | `click()` discovers then clicks via interaction strategy | `{ id: 'saveBtn' }`                                             | `discoverControl()` then `strategy.press(page, controlId)` called      |
| 9   | `fill()` discovers then fills via interaction strategy   | `{ id: 'nameInput' }`, `'John'`                                 | `discoverControl()` then `strategy.enterText(page, controlId, 'John')` |
| 10  | `press()` aliases to click via strategy                  | `{ id: 'submitBtn' }`                                           | Same as click: `strategy.press()` called                               |
| 11  | `select()` discovers then selects key                    | `{ id: 'dropdown' }`, `'option1'`                               | `discoverControl()` then `strategy.select(page, controlId, 'option1')` |
| 12  | `check()` discovers then checks checkbox                 | `{ id: 'checkbox1' }`                                           | Discovery then check operation via strategy or adapter method          |
| 13  | `uncheck()` discovers then unchecks checkbox             | `{ id: 'checkbox1' }` (currently checked)                       | Discovery then uncheck operation via strategy or adapter method        |
| 14  | `clear()` delegates to `fill('', selector)`              | `{ id: 'input1' }`                                              | `fill(selector, '')` called internally                                 |
| 15  | `getText()` discovers and reads text property            | `{ id: 'label1' }`                                              | Discovery then `adapter.executeControlMethod(id, 'getText', [])`       |
| 16  | `getValue()` discovers and reads value property          | `{ id: 'input1' }`                                              | Discovery then `adapter.executeControlMethod(id, 'getValue', [])`      |
| 17  | `waitForUI5()` delegates to `waitForUI5Stable(page)`     | `timeout: 5000`                                                 | `waitForUI5Stable(page, { timeout: 5000 })` called                     |
| 18  | `waitForUI5()` uses default timeout when not specified   | No options                                                      | `waitForUI5Stable(page, { timeout: config.ui5WaitTimeout })` called    |
| 19  | `waitFor()` polls for control visibility                 | `{ id: 'dialog' }`, `{ timeout: 10000 }`                        | Repeatedly calls `discoverControl()` until found or timeout            |
| 20  | `waitFor()` throws `TimeoutError` on timeout             | Selector never matches, `timeout: 100`                          | `TimeoutError` with `ERR_TIMEOUT`, retryable: false                    |
| 21  | `clearCache()` empties the control proxy cache           | Cache with 5 entries then `clearCache()`                        | Next `control()` call triggers fresh discovery                         |
| 22  | `destroy()` cleans up adapter and cache                  | Active handler                                                  | `adapter.destroy()` called, cache cleared                              |
| 23  | Lazy bridge injection on first method call               | Handler created, no navigation yet                              | Bridge NOT injected until first `control()` / `click()` call           |
| 24  | Bridge re-injection after `clearCache()`                 | Navigate to new app then `clearCache()`                         | Next operation triggers fresh bridge check                             |
| 25  | Error includes `suggestions[]` on control not found      | Non-existent selector                                           | Error suggestions include 'Verify control ID', 'waitForUI5Stable'      |
| 26  | `control()` with empty selector object                   | `{}` (empty selector)                                           | `ControlError` with `ERR_CONTROL_NOT_FOUND` or validation error        |
| 27  | `click()` on non-existent control throws                 | Selector with no match                                          | `ControlError` propagated from `control()` discovery                   |
| 28  | Multiple parallel `control()` calls do not race          | 3 concurrent `control()` calls                                  | Each resolves correctly, cache consistent                              |

**Mock requirements**:

- Mock `BridgeAdapter` via `createMockAdapter()` with configurable `findControl()`, `findControls()`, `executeControlMethod()`.
- Mock `InteractionStrategy` with `press()`, `enterText()`, `select()` as `vi.fn()`.
- Mock `discoverControl()` from `#proxy/discovery.js` to return mock control handles.
- Mock `waitForUI5Stable()` from `#core/utils/wait-helpers.js` as `vi.fn().mockResolvedValue(undefined)`.
- Mock `ControlProxyCache` with `get()`, `set()`, `clear()`.
- Use `vi.useFakeTimers()` for `waitFor()` timeout tests.

**Type-level tests**:

```typescript
expectTypeOf<UI5Handler>().toHaveProperty('control');
expectTypeOf<UI5Handler>().toHaveProperty('controls');
expectTypeOf<UI5Handler>().toHaveProperty('click');
expectTypeOf<UI5Handler>().toHaveProperty('fill');
expectTypeOf<UI5Handler>().toHaveProperty('press');
expectTypeOf<UI5Handler>().toHaveProperty('select');
expectTypeOf<UI5Handler>().toHaveProperty('check');
expectTypeOf<UI5Handler>().toHaveProperty('uncheck');
expectTypeOf<UI5Handler>().toHaveProperty('clear');
expectTypeOf<UI5Handler>().toHaveProperty('getText');
expectTypeOf<UI5Handler>().toHaveProperty('getValue');
expectTypeOf<UI5Handler>().toHaveProperty('waitForUI5');
expectTypeOf<UI5Handler>().toHaveProperty('waitFor');
expectTypeOf<UI5Handler>().toHaveProperty('clearCache');
expectTypeOf<UI5Handler>().toHaveProperty('destroy');
```

**TDD RED-GREEN sequence**:

1. RED: Tests 1-4 (discovery basics) — fail because `UI5Handler` class does not exist
2. GREEN: Implement `control()` with wait + discovery + cache + error
3. RED: Tests 5-7 (plural discovery) — fail because `controls()` missing
4. GREEN: Implement `controls()` with adapter + visibility filter
5. RED: Tests 8-14 (interaction methods) — fail because convenience methods missing
6. GREEN: Implement `click()`, `fill()`, `press()`, `select()`, `check()`, `uncheck()`, `clear()`
7. RED: Tests 15-16 (read methods) — fail because `getText()`, `getValue()` missing
8. GREEN: Implement read methods via `adapter.executeControlMethod()`
9. RED: Tests 17-20 (wait methods) — fail because `waitForUI5()`, `waitFor()` missing
10. GREEN: Implement wait delegation + polling
11. RED: Tests 21-28 (lifecycle + edge cases) — fail because lifecycle missing
12. GREEN: Implement `clearCache()`, `destroy()`, edge case handling
13. REFACTOR: Extract shared discovery-then-act pattern, DRY up interaction methods

**Estimated LOC**: ~300 source, ~200 tests

#### 15.3.2 GAP-CRITICAL: Add Auto-Wait Before Discovery

**Root cause**: `proxy/discovery.ts:discoverControl()` (line 85-126) goes directly to cache lookup → strategy chain → proxy creation. No stability wait step.

**Fix options** (choose one):

1. **Handler-level** (RECOMMENDED): `UI5Handler.control()` calls `waitForUI5Stable()` before `discoverControl()`. This mirrors dhikraft's pattern exactly.
2. **Discovery-level**: Add `waitForUI5Stable()` call at top of `discoverControl()`. Risk: requires passing page/config through the discovery chain.

Option 1 is recommended because dhikraft does it at the handler level (`ui5-handler.ts:639-648`), and it keeps discovery a pure function.

> **Architecture Decision (BINDING)**: Auto-wait before discovery lives in `UI5Handler.control()`,
> **NOT** in `discovery.ts`. Phase 1 `src/proxy/discovery.ts` stays unchanged (127 LOC, fully tested).
> The `UI5Handler.control()` method calls `waitForUI5Stable()` → then `discoverControl()` —
> matching dhikraft's proven `ui5-handler.ts:639-648` pattern. Config respect (`skipStabilityWait`,
> `controlDiscoveryTimeout`) is handled at the handler level, not in the discovery function.
> This keeps `discoverControl()` as a pure discovery function with no side effects.

#### 15.3.3 GAP-MEDIUM: Shell Header & Footer Bar Handlers

**Recommendation**: Add to Phase 3.3 (WorkZone + Assembly) as optional batch `B6c`:

- `src/fixtures/shell-handler.ts` (~100 LOC) — `expectShellHeader()`, `clickHome()`, `openUserMenu()`
- `src/fixtures/footer-handler.ts` (~80 LOC) — `clickSave()`, `clickApply()`, `clickCancel()`, `clickEdit()`, `clickDelete()`, `clickCreate()`

These are thin wrappers over `ui5.control()` + `ui5.click()` for well-known Fiori controls. Can be deferred to Phase 4 if Phase 3 scope is tight.

**Tests** (`tests/unit/fixtures/shell-handler.test.ts`):

| #   | Test Case                                     | Input                                  | Expected                                                          |
| --- | --------------------------------------------- | -------------------------------------- | ----------------------------------------------------------------- |
| 1   | `expectShellHeader()` verifies shell visible  | Page with `#shell-header` visible      | Assertion passes (no error thrown)                                |
| 2   | `expectShellHeader()` throws when not visible | Page without shell header              | `NavigationError` with `ERR_NAV_FAILED`, suggestions              |
| 3   | `clickHome()` clicks shell home button        | Page with shell bar                    | `ui5.click({ id: 'shell-home' })` or similar delegated to handler |
| 4   | `clickHome()` waits for stability after click | After home button click                | `waitForUI5Stable()` called after navigation                      |
| 5   | `openUserMenu()` opens the user action menu   | Page with user avatar in shell         | User menu avatar clicked, menu becomes visible                    |
| 6   | `openUserMenu()` throws when no user avatar   | Page without authenticated user avatar | `NavigationError` with suggestions: 'Verify user is logged in'    |
| 7   | Shell handler uses child logger               | Handler initialization                 | `createLogger('shell', parentLogger)` called                      |

**Tests** (`tests/unit/fixtures/footer-handler.test.ts`):

| #   | Test Case                                     | Input                                  | Expected                                                                                        |
| --- | --------------------------------------------- | -------------------------------------- | ----------------------------------------------------------------------------------------------- |
| 1   | `clickSave()` clicks the footer Save button   | Page with footer bar containing Save   | `ui5.click({ controlType: 'sap.m.Button', properties: { text: 'Save' }, ancestor: footerBar })` |
| 2   | `clickApply()` clicks the footer Apply button | Page with footer bar containing Apply  | Footer Apply button clicked via handler                                                         |
| 3   | `clickCancel()` clicks the footer Cancel      | Page with footer bar containing Cancel | Footer Cancel button clicked via handler                                                        |
| 4   | `clickEdit()` clicks the footer Edit button   | Page with footer bar containing Edit   | Footer Edit button clicked via handler                                                          |
| 5   | `clickDelete()` clicks the footer Delete      | Page with footer bar containing Delete | Footer Delete button clicked via handler                                                        |
| 6   | `clickCreate()` clicks the footer Create      | Page with footer bar containing Create | Footer Create button clicked via handler                                                        |
| 7   | Button not found in footer throws error       | Footer without Save button             | `ControlError` with `ERR_CONTROL_NOT_FOUND`, suggestions                                        |
| 8   | Footer handler uses child logger              | Handler initialization                 | `createLogger('footer', parentLogger)` called                                                   |

**Mock requirements for both**: Mock `UI5Handler` (the `ui5` fixture) with `control()` and `click()` as `vi.fn()`. These handlers are thin wrappers so the main assertion is that the correct selector is passed to `ui5.click()` / `ui5.control()`. Mock `waitForUI5Stable()` for post-action stability.

**Type-level tests**:

- `expectTypeOf<ShellHandler>().toHaveProperty('expectShellHeader')`
- `expectTypeOf<ShellHandler>().toHaveProperty('clickHome')`
- `expectTypeOf<ShellHandler>().toHaveProperty('openUserMenu')`
- `expectTypeOf<FooterHandler>().toHaveProperty('clickSave')`
- `expectTypeOf<FooterHandler>().toHaveProperty('clickApply')`
- `expectTypeOf<FooterHandler>().toHaveProperty('clickCancel')`

#### 15.3.4 GAP-LOW: Navigation History

**Recommendation**: Add `getNavigationHistory()` to the navigation module. `searchAndOpenApp()` is already specified in Section 6.5 and wired in Section 6.6. Minimal additional LOC (~30). Include in existing batch B5b.

### 15.4 Updated Fixture Type Summary

| Fixture         | Old Type (plan3)         | New Type (post-gap-fix)  | Change                             |
| --------------- | ------------------------ | ------------------------ | ---------------------------------- |
| `ui5`           | `UI5ControlProxy`        | `UI5Handler`             | **Breaking** — handler wraps proxy |
| `bridgeAdapter` | `BridgeAdapter`          | `BridgeAdapter`          | No change                          |
| `pramanConfig`  | `Readonly<PramanConfig>` | `Readonly<PramanConfig>` | No change                          |
| `sapAuth`       | Auth handler             | Auth handler             | No change                          |
| `ui5Navigation` | Nav wrapper              | Nav wrapper              | No change                          |
| `stability`     | Auto fixture             | Auto fixture             | Wire auto-wait to handler          |

### 15.5 Gap Count Summary

| Severity        | Count | Examples                                                                                              |
| --------------- | ----- | ----------------------------------------------------------------------------------------------------- |
| **CRITICAL**    | 7     | Missing handler layer (A1), no auto-wait before discovery (A5), no convenience methods (A2-A3, A6-A7) |
| **MEDIUM**      | 12    | Shell/footer handlers (E1-E5), ComboBox/ValueHelp (A18-A19), waitFor/select/check (A8-A10, A15, A20)  |
| **LOW**         | 9     | Debug/introspection (A21-A24), nav history (D7), type/hover/focus (A14, A16-A17)                      |
| **PLANNED**     | 8     | Playwright wiring (B1-B3), injection reset (B2,B5), G2 fix (B6), orphan scripts (B7-B8)               |
| **PARITY**      | 23    | Auth system (C1-C11), navigation (D1-D6,D8-D9), config (G1-G4), WorkZone (I1-I2)                      |
| **IMPROVEMENT** | 7     | Praman exceeds dhikraft: API auth (C5-C7), matchers (F1), logging (H1-H2), discovery config (G6)      |

### 15.6 Proxy Dispatch Comparison: Praman 6-Stage vs dhikraft 7-Type

> Full analysis: `plans/dhikraft-flow-analysis.md`
> Gold standard test: `package/examples/gold-standards/bom-e2e-gold-standard.spec.ts`

#### 15.6.1 The #1 Gap: Return Handler Does NOT Create Sub-Proxies

The gold standard test relies on **chained proxy returns**:

```typescript
const innerTable = await smartTable.getTable(); // element → MUST return proxy
const rows = await innerTable.getRows(); // aggregation → MUST return proxy[]
const ctx = await rows[0].getBindingContext(); // object → MUST return UI5Object proxy
const data = await ctx.getObject(); // result → plain data
```

**dhikraft `callMethod()` (ui5-control-proxy.ts:1411-1466):**
Each return type creates the appropriate sub-proxy:

- `aggregation` → `Promise.all(refs.map(→ new UI5ControlProxy))` → proxy array
- `element` → `new UI5ControlProxy(ref)` → single proxy
- `object` → `UI5Object.create({ uuid, type, page })` → UI5Object proxy

**Praman `handleBridgeReturn()` (proxy/return-handler.ts:71-114):**
Returns RAW references — NO sub-proxy creation:

- `aggregation` → `AggregationItemRef[]` (UUID + type) — **bare data, not proxies**
- `element` → `result.value` — **plain object { id, controlType }, not a proxy**
- `object` → `ObjectRef { uuid, objectType }` — **bare ref, not UI5Object proxy**

**Impact**: The gold standard `.getTable().getRows()` chain is BROKEN in Praman.
`getTable()` returns `{ id: '...', controlType: '...' }` — calling `.getRows()` on
that throws `TypeError: not a function`.

**Fix**: `handleBridgeReturn()` or the method forwarder must accept adapter + page
context and create sub-proxies. Praman already has `proxy-converter.ts` with
`convertToControlProxy()` and `convertToObjectProxy()` — these just need to be
wired into the return flow.

> **B3d Implementation Complexity Note**: The `handleBridgeReturn()` signature must change
> to accept context: `(result: MethodExecutionResult, context: { adapter: BridgeAdapter; page: BridgePage; methods: ReadonlySet<string> })`.
> Each return type routes differently:
>
> - `element`/`newElement`: `result.value` has `{ id, controlType }` → `convertToControlProxy()` directly
> - `object`: `{ uuid, objectType }` → `convertToObjectProxy()` directly (creates UI5Object proxy)
> - `aggregation`: each item is `{ uuid, objectType }` → create UI5Object proxies (NOT control proxies).
>   Aggregation items arrive as UUID refs, not full control refs with `{ id, controlType }`.
>   When test calls `.getBindingContext()` on a row proxy, it goes through UI5Object → bridge → returns another object ref.
> - `result`/`empty`/`none`/`unknown`: unchanged (raw value or undefined)
>
> The `@typescript-eslint/switch-exhaustiveness-check` rule requires all 8 return type cases
> to be handled in the switch statement. Existing tests must NOT regress.

**Tests for B3d** (add to `tests/unit/proxy/return-handler.test.ts`):

| #   | Test Case                                  | Input                                                                       | Expected                                                               |
| --- | ------------------------------------------ | --------------------------------------------------------------------------- | ---------------------------------------------------------------------- |
| 1   | `element` result creates control proxy     | `{ returnType: 'element', value: { id: 'inner', controlType: 'Table' } }`   | `convertToControlProxy()` called, returns proxy with `.getRows()` etc. |
| 2   | `aggregation` result creates proxy array   | `{ returnType: 'aggregation', value: [{ id: 'row0' }, { id: 'row1' }] }`    | `Promise.all(refs.map(convertToControlProxy))`, returns proxy[]        |
| 3   | `object` result creates UI5Object proxy    | `{ returnType: 'object', value: { uuid: 'uuid-1', objectType: 'Model' } }`  | `convertToObjectProxy()` called, returns UI5Object proxy               |
| 4   | `result` returns plain value (no proxy)    | `{ returnType: 'result', value: 'Hello' }`                                  | Returns `'Hello'` directly (string, not proxy)                         |
| 5   | `empty` returns undefined                  | `{ returnType: 'empty' }`                                                   | Returns `undefined`                                                    |
| 6   | `none` returns undefined                   | `{ returnType: 'none' }`                                                    | Returns `undefined`                                                    |
| 7   | Chained proxy: `getTable().getRows()`      | Element proxy returned from `getTable()`                                    | Returned proxy supports `.getRows()` returning aggregation proxies     |
| 8   | Object proxy supports method calls         | UI5Object proxy from `getBindingContext()`                                  | `objectProxy.getObject()` delegates to adapter via UUID                |
| 9   | Empty aggregation returns empty array      | `{ returnType: 'aggregation', value: [] }`                                  | Returns `[]` (no error)                                                |
| 10  | `newElement` result creates control proxy  | `{ returnType: 'newElement', value: { id: 'new1', controlType: 'Input' } }` | `convertToControlProxy()` called, fresh proxy (not cached)             |
| 11  | Adapter + page context passed to converter | Any element/aggregation/object result                                       | `convertToControlProxy` receives adapter + page for sub-proxy creation |

**Mock requirements**: Mock `convertToControlProxy()` and `convertToObjectProxy()` from `proxy-converter.ts`. Mock `BridgeAdapter` and `Page` to verify they are passed to converter functions. Verify existing return-handler tests still pass (no regression).

**TDD protocol**: Tests 1-6 should RED first (current `handleBridgeReturn()` returns raw refs). After wiring converter imports and delegation logic, tests go GREEN.

#### 15.6.2 Proxy Get Trap Comparison

| Stage | dhikraft (`createFluentProxy`)                 | Praman (`createControlProxy`)                 |
| ----- | ---------------------------------------------- | --------------------------------------------- |
| 1     | Anti-thenable (then/catch/finally)             | Symbol handling (Symbol.toPrimitive)          |
| 2     | Class methods (prop in target → bind)          | Anti-thenable (then/catch/finally)            |
| 3     | Dynamic → `callMethod(prop, ...args)` → 7-type | Direct props (id, controlType)                |
| 4     | —                                              | Built-in methods (getId, getProperty, etc.)   |
| 5     | —                                              | String helpers (toString, toJSON)             |
| 6     | —                                              | Blacklist check → throw ControlError          |
| 7     | —                                              | Dynamic → `createMethodForwarder()` → adapter |

**Assessment**: Praman's 6-stage trap is more thorough (blacklist, built-ins) but
lacks the critical return-type-to-proxy conversion that dhikraft's `callMethod()`
provides.

#### 15.6.3 Browser-Side Return Type Detection

Both implementations detect the same 7 types. Key differences:

| Aspect               | dhikraft                                                                                | Praman                                                         |
| -------------------- | --------------------------------------------------------------------------------------- | -------------------------------------------------------------- |
| Method validation    | `retrieveControlMethods(control)` — full prototype walk                                 | `typeof ctrl[methodName] === 'function'` — simple check        |
| Element detection    | Registry lookup (3-API chain: Element.getElementById → ElementRegistry.get → Core.byId) | Identity check (`result === ctrl`) + `getId`/`getParent` check |
| Aggregation specials | ComboBox `data('InputWithSuggestionsListItem')` + PlanningCalendar `-CLI` suffix        | Same ✅                                                        |
| Non-serializable     | `bridge.saveObject()` → UUID                                                            | Same ✅                                                        |
| Circular refs        | `bridge.getCircularReplacer()` for JSON.stringify                                       | Same ✅                                                        |

#### 15.6.4 Interaction Strategy Comparison

| Aspect         | dhikraft                                                                                           | Praman                                                   |
| -------------- | -------------------------------------------------------------------------------------------------- | -------------------------------------------------------- |
| Interface      | `press()`, `enterText()`, `fireEvent()`                                                            | `press()`, `enterText()`, `select()`                     |
| Missing        | —                                                                                                  | `fireEvent()` — needed for `.fireChange()`               |
| Extra          | —                                                                                                  | `select()` (dhikraft has this in handler, not strategy)  |
| Options        | `PressOptions { waitForUI5, timeout }`, `EnterTextOptions { clearTextFirst, waitForUI5, timeout }` | No options on methods                                    |
| Wired to proxy | Yes — proxy holds strategy ref, delegates press/enterText                                          | **No** — strategies exist but are NOT connected to proxy |

**Fix**: Either:

1. Wire strategy to `ControlProxyState` and add strategy-aware methods to proxy built-ins
2. Or (better): Wire through `UI5Handler` convenience methods (handler holds strategy, proxy stays generic)

#### 15.6.5 Architecture Comparison Summary

| Metric             | dhikraft                            | Praman                                | Assessment              |
| ------------------ | ----------------------------------- | ------------------------------------- | ----------------------- |
| Proxy LOC          | ~1800 (class) + ~500 (fluent proxy) | 189 (single Proxy)                    | **Praman 12x smaller**  |
| Object proxy LOC   | ~650 + ~500                         | 119 + 65                              | **Praman 6x smaller**   |
| Strategy LOC       | ~1400 (3 strategies)                | ~350 (3 strategies)                   | **Praman 4x smaller**   |
| Total equivalent   | ~9,200 LOC                          | ~1,941 LOC                            | **Praman 4.7x smaller** |
| Type safety        | Runtime `UI5Control` interface      | 199 compile-time typed interfaces     | **Praman better**       |
| Error handling     | Generic `Error`                     | Typed errors with codes + suggestions | **Praman better**       |
| Discovery          | Hardcoded 3-priority chain          | Configurable strategy chain           | **Praman better**       |
| Return sub-proxies | ✅ Full support                     | ❌ Returns raw refs                   | **Gap**                 |
| Auto-wait          | ✅ Before every discovery           | ❌ Not wired                          | **Gap**                 |
| Handler layer      | ✅ 2317 LOC class                   | ❌ Not implemented                    | **Gap**                 |

### 15.7 Recommended Batch Additions

| New Batch        | Scope                                  | LOC Est. | Dependencies                                   |
| ---------------- | -------------------------------------- | -------- | ---------------------------------------------- |
| `B3c`            | `UI5Handler` class + tests             | ~500     | After B3a (core-fixtures), B3b (test fixtures) |
| `B3d`            | Wire return handler sub-proxy creation | ~50      | After B3c (handler needs adapter/page context) |
| `B6c` (optional) | Shell/footer handlers                  | ~250     | After B3c (handler), B6b (nav fixtures)        |

**Note**: B3c, B3d, B6c are now merged into Section 14 batch tables. Critical path remains **7 steps** (fixture chain: `TH1 → B3a → B3b → B5b → B5c → B6b → B7`). B3c/B3d add a parallel 6-step handler chain (`TH1 → B3a → B3b → B3c → B3d → B7`) that does NOT extend the critical path. See Section 14.5 for details.

### 15.8 Updated Feature Parity Gap Analysis (Post-Simplification)

> **Date**: 2026-02-18
> **Context**: After the Phase 3 architecture simplification (adapter layer removed, proxy consolidated), many gaps identified in Sections 15.2–15.7 have been resolved. This section documents the current state with code evidence.

#### 15.8.1 Gaps FIXED by the Simplification

| Old Gap                                | Original Severity | Status                         | Code Evidence                                                                                                                                                                                            |
| -------------------------------------- | ----------------- | ------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| A1: Missing UI5Handler                 | GAP-CRITICAL      | **FIXED**                      | `src/fixtures/ui5-handler.ts` — 590 LOC class with 14 public methods (control, controls, click, fill, press, select, check, uncheck, clear, getText, getValue, waitForUI5, waitFor, clearCache, destroy) |
| A2: control() discovery                | GAP-CRITICAL      | **FIXED**                      | `ui5-handler.ts:254-282` — `discoverSingleControl()` with cache lookup (tier 0), configurable strategy chain, auto-wait, and `ControlError` on not-found                                                 |
| A3: controls() plural                  | GAP-CRITICAL      | **FIXED**                      | `ui5-handler.ts:295-318` — `internalFindControls()` + `createControlProxy()` loop producing `readonly UI5ControlBase[]`                                                                                  |
| A4: waitForUI5() explicit              | GAP-MEDIUM        | **FIXED**                      | `ui5-handler.ts:470-472` — public `waitForUI5(timeout?)` delegates to `internalWaitForUI5Stable()`                                                                                                       |
| A5: Auto-wait before discovery         | GAP-CRITICAL      | **FIXED**                      | `ui5-handler.ts:265` — `await this.internalWaitForUI5Stable()` called before every `discoverSingleControl()`                                                                                             |
| A6: click(selector)                    | GAP-CRITICAL      | **FIXED**                      | `ui5-handler.ts:330-333` — discovers control then calls `strategy.press(page, proxy.id)`                                                                                                                 |
| A7: fill(selector, value)              | GAP-CRITICAL      | **FIXED**                      | `ui5-handler.ts:346-349` — discovers control then calls `strategy.enterText(page, proxy.id, value)`                                                                                                      |
| A8: press(selector)                    | GAP-MEDIUM        | **FIXED**                      | `ui5-handler.ts:361-363` — alias for `click()`                                                                                                                                                           |
| A9: select(selector, key)              | GAP-MEDIUM        | **FIXED**                      | `ui5-handler.ts:376-379` — discovers control then calls `strategy.select(page, proxy.id, key)`                                                                                                           |
| A10: check(selector)                   | GAP-MEDIUM        | **FIXED**                      | `ui5-handler.ts:391-394` — discovers + calls `setSelected(true)` via `internalExecuteControlMethod`                                                                                                      |
| A11: uncheck(selector)                 | GAP-MEDIUM        | **FIXED**                      | `ui5-handler.ts:406-409` — discovers + calls `setSelected(false)` via `internalExecuteControlMethod`                                                                                                     |
| A12: clear(selector)                   | GAP-MEDIUM        | **FIXED**                      | `ui5-handler.ts:421-424` — discovers + calls `strategy.enterText(page, proxy.id, '')`                                                                                                                    |
| A15: waitFor(selector)                 | GAP-MEDIUM        | **FIXED**                      | `ui5-handler.ts:486-517` — polling loop with `discoverSingleControl()`, configurable timeout/interval, throws `TimeoutError`                                                                             |
| B1: Playwright API wiring              | GAP-CRITICAL      | **FIXED** (different approach) | `control-proxy.ts:206-213` — proxy get trap routes `press`/`enterText`/`select` to `InteractionStrategy` methods via `resolveKnownProperty()`                                                            |
| B2: resetPageInjection for nav         | GAP-MEDIUM        | **FIXED**                      | `bridge/injection.ts:112-114` — `resetPageInjection(page)` deletes from `injectedPages` WeakSet                                                                                                          |
| B3: ControlProxyState expansion        | GAP-CRITICAL      | **FIXED**                      | `proxy/control-proxy.ts:70-81` — `ControlProxyState` has `page: Page` + `interactionStrategy: InteractionStrategy` (no adapter abstraction)                                                              |
| B4: Proxy cache clear on nav           | GAP-MEDIUM        | **FIXED**                      | `core-fixtures.ts:187-192` — `page.on('framenavigated', ...)` listener calls `resetPageInjection(page)` on main frame navigation                                                                         |
| B5: Bridge re-injection                | GAP-MEDIUM        | **FIXED**                      | WeakSet `delete` on nav (injection.ts:113) → next `ensureBridgeInjected()` call re-injects (injection.ts:90-95)                                                                                          |
| B3d: Return handler sub-proxy creation | GAP-CRITICAL      | **FIXED**                      | `proxy/control-proxy.ts:105-172` — inline `handleReturn()` creates sub-proxies for all 7 return types (result, empty, none, unknown, element, newElement, aggregation, object)                           |
| E1-E3: Shell header/home/user menu     | GAP-MEDIUM        | **FIXED**                      | `src/fixtures/shell-handler.ts` — 197 LOC: `expectShellHeader()`, `clickHome()`, `openUserMenu()`                                                                                                        |
| E5: Footer bar buttons                 | GAP-MEDIUM        | **FIXED**                      | `src/fixtures/footer-handler.ts` — 193 LOC: `clickSave()`, `clickApply()`, `clickCancel()`, `clickEdit()`, `clickDelete()`, `clickCreate()`                                                              |

#### 15.8.2 Gaps that REMAIN

| Gap                                              | Severity   | Detail                                                                                                                                                                                                                                                                                                                                                                                                            | Phase                            |
| ------------------------------------------------ | ---------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------- |
| E1-E5: Shell/footer use `page.evaluate` directly | GAP-MEDIUM | `shell-handler.ts` and `footer-handler.ts` use raw `page.evaluate()` with DOM selectors (`.sapMBarChild .sapMBtn`, `#shell-header-logo`), not through `UI5Handler` discovery/strategy chain. Works, but bypasses bridge for shell operations.                                                                                                                                                                     | Phase 4 — reconcile with handler |
| A14: type(selector, text, options?) char-by-char | GAP-LOW    | Not implemented. Keyboard simulation needed for some input controls.                                                                                                                                                                                                                                                                                                                                              | Phase 4                          |
| A16: hover/focus/blur                            | GAP-LOW    | Not implemented. DOM-level focus management deferred.                                                                                                                                                                                                                                                                                                                                                             | Phase 4                          |
| A17: pressKey                                    | GAP-LOW    | Not implemented. Single-key press for keyboard shortcuts.                                                                                                                                                                                                                                                                                                                                                         | Phase 4                          |
| A18: selectComboBoxByText                        | GAP-MEDIUM | Not implemented. Required for Fiori flows with ComboBox selection by display text rather than key.                                                                                                                                                                                                                                                                                                                | Phase 4                          |
| A19: openValueHelpAndPick                        | GAP-MEDIUM | Not implemented. Required for Fiori flows with ValueHelp dialogs.                                                                                                                                                                                                                                                                                                                                                 | Phase 4                          |
| D7: Navigation history                           | GAP-LOW    | `getNavigationHistory(page)` not implemented.                                                                                                                                                                                                                                                                                                                                                                     | Phase 4                          |
| E4: openNotifications                            | GAP-LOW    | Shell notification panel opener not implemented.                                                                                                                                                                                                                                                                                                                                                                  | Phase 4                          |
| `fireEvent` strategy method                      | GAP-MEDIUM | `InteractionStrategy` interface (strategy.ts:27-56) defines `press`/`enterText`/`select` but NOT `fireEvent`. Gold standard uses `.fireChange()` which goes through the dynamic method forwarder, not the strategy. Strategy implementations (ui5-native-strategy.ts, dom-first-strategy.ts) DO call `ctrl.fireChange()` internally, but there is no public `strategy.fireEvent()` entry point for custom events. | Phase 4                          |
| discovery.ts orphan                              | INFO       | `src/proxy/discovery.ts` is exported from barrel (`proxy/index.ts:10`) but NOT imported by any source file outside the proxy module. `UI5Handler` has its own inline discovery logic. Should be reconciled.                                                                                                                                                                                                       | Phase 4 — reconcile or remove    |
| discovery-factory.ts orphan                      | INFO       | `src/proxy/discovery-factory.ts` is only imported by `discovery.ts` (which is itself orphaned). Exported from barrel but unused in production code flow.                                                                                                                                                                                                                                                          | Phase 4 — reconcile or remove    |
| Stale `ClassicUI5Adapter` reference              | INFO       | `src/matchers/ui5-matchers.ts:71` contains a TSDoc comment referencing `ClassicUI5Adapter.getControlProperty()` — adapter no longer exists.                                                                                                                                                                                                                                                                       | Cleanup                          |

#### 15.8.3 Architecture Improvement Summary

| Metric                  | Before (plan3 Section 15)                                                                  | After (current)                                                                | Change                             |
| ----------------------- | ------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------ | ---------------------------------- |
| Adapter layer           | ClassicUI5Adapter (353 LOC)                                                                | REMOVED                                                                        | -353 LOC, -1 abstraction layer     |
| Page type               | BridgePage (Object.assign hack)                                                            | Playwright `Page` directly                                                     | Cleaner types, no runtime patching |
| Proxy files             | 5 files (dynamic-proxy, return-handler, proxy-converter, playwright-api, ui5-object-proxy) | 2 files (control-proxy.ts 307 LOC, ui5-object.ts 170 LOC)                      | -3 files                           |
| Handler layer           | Not implemented                                                                            | UI5Handler (590 LOC, 14 methods)                                               | Critical gap closed                |
| Shell/footer            | Not implemented                                                                            | shell-handler.ts (197 LOC) + footer-handler.ts (193 LOC)                       | 2 new handler files                |
| Total proxy+handler LOC | ~1,941 LOC (planned, spread across 5 files)                                                | ~897 LOC (control-proxy 307 + ui5-object 170 + ui5-handler 590 − ~170 overlap) | -1,044 LOC (-54%)                  |
| Sub-proxy creation      | BROKEN (returned raw refs, no context)                                                     | WORKS (inline `handleReturn()` in control-proxy.ts:105-172)                    | Critical fix                       |
| Return type handling    | Separate file, no page/strategy context                                                    | Inline in control-proxy with full `ControlProxyState`                          | No data loss on method returns     |
| Fixture wiring          | Not wired (proxy was test-only)                                                            | `core-fixtures.ts:180-209` — full `UI5Handler` lifecycle with nav listener     | Production-ready                   |
| Critical gaps (count)   | 7                                                                                          | 0                                                                              | All 7 fixed                        |
| Medium gaps (count)     | 12                                                                                         | 4                                                                              | 8 fixed                            |
| Low gaps (count)        | 9                                                                                          | 5                                                                              | 4 fixed                            |

#### 15.8.4 TypeScript Compliance Notes (Post-Simplification)

| File                    | Line | Issue                                                                                                          | Severity                                                                            |
| ----------------------- | ---- | -------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------- |
| `ui5-handler.ts`        | 440  | `return result as string` — `internalExecuteControlMethod` returns `unknown`, cast to `string` for `getText()` | LOW — runtime type is correct, but no runtime validation                            |
| `ui5-handler.ts`        | 457  | `return result as string` — same pattern for `getValue()`                                                      | LOW — same                                                                          |
| `navigation.ts`         | 310  | `return hash as string` — `page.evaluate()` return cast                                                        | LOW — same pattern                                                                  |
| `stability-fixtures.ts` | 132  | `page as unknown as Parameters<typeof waitForUI5Stable>[0]` — double cast through `unknown`                    | MEDIUM — type incompatibility between Playwright `Page` and expected parameter type |
| `control-proxy.ts`      | 268  | `as MethodExecutionResult` — eslint-disable comment explains: "tsc sees unknown, eslint sees any"              | LOW — necessary bridge between type systems                                         |

---

## 16. Summary

| Metric                     | Value                                                     |
| -------------------------- | --------------------------------------------------------- |
| **New source files**       | 22 (19 base + 3 gap: UI5Handler, shell-handler, footer)   |
| **Modified source files**  | 11 (9 base + 2 gap: playwright-api.ts, return-handler.ts) |
| **New test files**         | 19 + 2 helpers = 21                                       |
| **Total new source LOC**   | ~4,630                                                    |
| **Total new test LOC**     | ~2,720                                                    |
| **Total new test cases**   | ~215 (fully specified after TDD review expansion)         |
| **New npm dependencies**   | 0                                                         |
| **Breaking changes**       | 0 (external), 1 (internal: adapter interface)             |
| **Sub-phases**             | 3 — Foundation → Wiring → Assembly                        |
| **Implementation batches** | 24 (21 base + 3 gap: B3c handler, B3d return-proxy, B6c)  |
| **Consolidated agents**    | 19 (5 merges applied, 1 spare for retry)                  |
| **Execution waves**        | 6 waves, max 6 agents parallel (Wave 4)                   |
| **Critical path**          | 6 steps (A2→A4→A5→A11→A14→A19)                            |
| **Estimated total tokens** | ~812K (501K input + 311K output)                          |
| **Largest agent**          | A9 (UI5Handler) — ~63K tokens (67% headroom)              |
| **Risk items**             | 16 (10 base + 6 Playwright review: R11-R16)               |
| **Phase 1 modules wired**  | 8/8 (all unconsumed modules consumed)                     |
| **Phase 1 API duplicates** | 0 — all 17 Phase 1 APIs reused, none duplicated           |
| **Orphans resolved**       | 2/2 (object-map.ts, get-selector.ts)                      |
| **GitHub issues closed**   | 1 (#22 — G2 proxy stubs)                                  |
| **Feature parity gaps**    | 7 critical, 12 medium, 9 low (see Section 15)             |
| **At parity**              | 23 features verified (D8 searchAndOpenApp confirmed)      |
| **Praman improvements**    | 7 features exceed dhikraft                                |

**Next Step**: Phase 4 — Modules + Table + Fiori Elements (WebComponentAdapter full, registry strategy, table ops, assertions, date/dialog/OData, FE, deferred handler methods: selectComboBoxByText, openValueHelpAndPick, inspect, getControlTree, isUI5Control, element, hover, focus, blur, type, pressKey).

---

## 17. Playwright Best Practice Review Notes

> **Review date**: 2026-02-18
> **Reviewer**: Playwright Expert Agent
> **Scope**: All Playwright-related patterns in Phase 3 plan

### 17.1 Issues Found and Addressed (Inline Edits)

| ID          | Section              | Severity | Issue                                                                                                                                                                                                    | Status       |
| ----------- | -------------------- | -------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------ |
| PW-STAB-1   | 6.2 Stability        | HIGH     | `framenavigated` listener does not filter by `frame === page.mainFrame()`. Fires on ALL frames including iframes. Also missing listener cleanup on teardown.                                             | FIXED inline |
| PW-WZ-1     | 7.1 WorkZone         | HIGH     | `frameLocator.evaluate(injectBridge)` is invalid. `FrameLocator` has no `evaluate()` method. Must use `Frame` object from `page.frame()` or `page.frames()`.                                             | FIXED inline |
| PW-WZ-2     | 7.1 WorkZone         | MEDIUM   | `BTPWorkZoneManager` interface lacks `getAppFrameForEval(): Frame` for bridge injection. `getAppFrame(): FrameLocator` is only for element location.                                                     | FIXED inline |
| PW-CSS-1    | 4.7 Playwright API   | HIGH     | `CSS.escape(domId)` in `routeToInteractionStrategy()` runs in Node.js context. `CSS.escape()` is browser-only API.                                                                                       | FIXED inline |
| PW-MERGE-1  | 6.4 Auth Fixtures    | MEDIUM   | `authTest = base.extend()` references `pramanConfig` from `coreTest`. TypeScript needs placeholder declarations for cross-fixture deps in `mergeTests()`.                                                | FIXED inline |
| PW-SCOPE-1  | 5.3 Core Fixtures    | HIGH     | Worker-scoped fixtures `pramanConfig`, `rootLogger`, `tracer` need explicit `[fn, { scope: 'worker' }]` tuple syntax. Also requires `test.extend<TestFixtures, WorkerFixtures>()` two-parameter generic. | FIXED inline |
| PW-EXPECT-1 | 7.3 Assembly         | MEDIUM   | `export { expect } from '@playwright/test'` exports base expect without custom matcher types. TypeScript consumers cannot see `toHaveUI5Text()` etc.                                                     | FIXED inline |
| PW-AUTH-1   | 6.3.2 Auth Setup     | LOW      | Missing trace recording mentioned in Section 4.3 design flow. Also `authFile` path should use `node:path` for cross-platform.                                                                            | FIXED inline |
| PW-STEP-1   | 6.1.4 Step-Decorator | LOW      | `{ box: true }` option not leveraged for infrastructure steps (PW >= 1.51). Infrastructure steps should box errors; user-facing steps should not.                                                        | FIXED inline |
| PW-NAV-1    | 4.5 Navigation       | MEDIUM   | `page.goto()` vs `page.evaluate(hasher.setHash())` choice not specified. Different behavior for full-page vs SPA hash navigation.                                                                        | FIXED inline |

### 17.2 Patterns Confirmed as Correct

| Aspect                                       | Assessment                                                                                                |
| -------------------------------------------- | --------------------------------------------------------------------------------------------------------- |
| **`test.extend()` usage**                    | Correct -- 4 domain files + 1 assembly via `mergeTests()`. Clean SRP.                                     |
| **`mergeTests()` assembly**                  | Correct approach. Name collision risk managed via prefixed names (R1).                                    |
| **`{ option: true }` for `sapAuthConfig`**   | Correct -- allows per-project config in `playwright.config.ts`.                                           |
| **Setup project pattern (D28)**              | Correct -- `storageState` + `dependencies` array + teardown project. Superior to `globalSetup`.           |
| **`storageState` handling**                  | Correct -- saved in setup, consumed via `use: { storageState: path }` in dependent projects.              |
| **No `page.waitForTimeout()`**               | Confirmed -- zero occurrences in entire plan. All waits use `waitForUI5Stable()` or web-first assertions. |
| **`page.route()` + `route.abort()`**         | Correct pattern for blocking analytics/WalkMe. Route cleanup is automatic on context close.               |
| **Lazy fixture initialization**              | Correct -- bridge adapter does not inject until first UI5 operation. Prevents timeout.                    |
| **Fixture dependency chain**                 | Correct -- no circular dependencies. Worker fixtures run before test fixtures.                            |
| **Auth model (no auto-login/logout)**        | Correct -- matches Playwright best practice. Setup project handles auth once.                             |
| **`withStep()` for nav/auth actions**        | Correct -- meaningful step grouping in trace viewer and HTML reports.                                     |
| **Selector engine as worker fixture**        | Correct -- `selectors.register()` is global/per-process. Worker-scoped auto ensures single registration.  |
| **Custom matchers via `expect.extend()`**    | Correct -- using `toPass()` inside custom matchers for auto-retry is the right web-first pattern.         |
| **Bridge re-injection via `framenavigated`** | Pattern is correct (with the main-frame filter fix applied). Proper cleanup via `page.off()`.             |
| **Web-first assertions preferred**           | Confirmed -- custom matchers use `expect().toPass()` for auto-retry. No snapshot-then-assert.             |
| **Teardown in reverse order**                | Correct -- Section 4.2 shows reverse order. Playwright handles this automatically for fixtures.           |
| **Worker fixture thread safety**             | Correct -- R3 risk correctly notes Playwright guarantees sequential worker init. No shared mutable state. |

### 17.3 Recommendations for Implementation

1. **Add `css.escape` to devDependencies** (or implement a minimal CSS ID escaper) before batch B5d. The escaper must handle colons, dots, brackets, and hyphens common in UI5 DOM IDs.

2. **Use `test.extend<TestFixtures, WorkerFixtures>()`** (two generic parameters) in `core-fixtures.ts`. First parameter = test-scoped, second = worker-scoped. Required for correct TypeScript typing of worker fixtures.

3. **Consider moving `expect.extend()` from worker auto fixture to assembly**. Using the typed `expect.extend()` return value produces a properly-typed `expect` export (PW-EXPECT-1 Option A). This eliminates double-registration and improves TypeScript ergonomics.

4. **WorkZone module should re-resolve the `Frame` object** on each bridge operation. Frame objects become stale when iframes reload. `getAppFrameForEval()` should validate the Frame is still attached before returning it.

5. **Test the `mergeTests()` assembly** with real Playwright test runner (not just vitest mocks). Add a smoke test in Phase 7 (INT1/INT2) that exercises the full fixture chain to catch name collisions and cross-dependency issues.

6. **Verify `selectors.register()` idempotency**. If multiple workers in the same process register the same selector engine name, Playwright throws. The worker auto fixture should guard with a try-catch or a module-level `registered` flag.

---

## 18. Agent Token Budget

### Per-Agent Estimates

| Agent         | Input (context+source) | Output (code+tests+tools) | **Total** |
| ------------- | ---------------------- | ------------------------- | --------- |
| A1 (B1a+B1b)  | ~24K                   | ~8K                       | **~32K**  |
| A2 (TH1)      | ~21K                   | ~5K                       | **~26K**  |
| A3 (B2a)      | ~22K                   | ~15K                      | **~37K**  |
| A4 (B3a)      | ~26K                   | ~15K                      | **~41K**  |
| A5 (B3b)      | ~28K                   | ~18K                      | **~46K**  |
| A6 (B2b+B2c)  | ~23K                   | ~25K                      | **~48K**  |
| A7 (B2d+B2e)  | ~23K                   | ~25K                      | **~48K**  |
| A8 (B2f)      | ~26K                   | ~18K                      | **~44K**  |
| A9 (B3c)      | ~33K                   | ~30K                      | **~63K**  |
| A10 (B4a)     | ~26K                   | ~12K                      | **~38K**  |
| A11 (B5b)     | ~28K                   | ~22K                      | **~50K**  |
| A12 (B4b+B4c) | ~28K                   | ~22K                      | **~50K**  |
| A13 (B5a)     | ~26K                   | ~12K                      | **~38K**  |
| A14 (B5c)     | ~28K                   | ~15K                      | **~43K**  |
| A15 (B5d)     | ~26K                   | ~13K                      | **~39K**  |
| A16 (B6a)     | ~28K                   | ~18K                      | **~46K**  |
| A17 (B3d)     | ~26K                   | ~8K                       | **~34K**  |
| A18 (B6c)     | ~26K                   | ~15K                      | **~41K**  |
| A19 (B7+B6b)  | ~33K                   | ~15K                      | **~48K**  |

### Grand Total

| Metric              | Value                                         |
| ------------------- | --------------------------------------------- |
| Total Input Tokens  | ~501K                                         |
| Total Output Tokens | ~311K                                         |
| **Grand Total**     | **~812K**                                     |
| Largest Agent (A9)  | ~63K (well under 200K context limit)          |
| Smallest Agent (A2) | ~26K                                          |
| Average per Agent   | ~43K                                          |
| **Safety margin**   | All agents < 65K (67% headroom to 200K limit) |
| **Spare agents**    | 1 (for retry/hotfix if any agent fails)       |

### Wave Token Distribution

| Wave | Agents                      | Combined Tokens | Cumulative |
| ---- | --------------------------- | --------------- | ---------- |
| 1    | A1, A2, A3                  | ~95K            | ~95K       |
| 2    | A4, A6, A7                  | ~137K           | ~232K      |
| 3    | A5, A8                      | ~90K            | ~322K      |
| 4    | A9, A10, A11, A12, A15, A16 | ~286K           | ~608K      |
| 5    | A13, A14, A17, A18          | ~156K           | ~764K      |
| 6    | A19                         | ~48K            | **~812K**  |

### Quality Gates — Per-Wave Checkpoints

#### Wave 1-3 Gate (Sub-Phase 3.1 Complete)

```bash
npm run typecheck        # Zero errors
npm run lint             # Zero errors, zero warnings
npm run test:unit        # 929 existing + ~63 new Phase 3 = ~992
npm run build            # tsup succeeds
```

Coverage: `src/auth/strategies/**` → Tier 2 (95/90/95/95)

#### Wave 4-5 Gate (Sub-Phase 3.2 Complete)

```bash
npm run ci               # Full pipeline (lint + typecheck + test + build)
```

Coverage: `src/auth/**` → Tier 2, `src/fixtures/**` + `src/modules/**` → Tier 3 (90/85/90/90)

#### Wave 6 Gate (Sub-Phase 3.3 Complete)

```bash
npm run ci               # Full pipeline
npm run check:exports    # attw validates all 6 sub-path exports
```

Coverage: Global ≥ 95% statements (maintained from Phase 2)
