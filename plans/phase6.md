# Phase 6 — Step Instrumentation + Reporters + CLI + Hardening

> **Version**: 1.0.0
> **Status**: PLANNED
> **Parent**: plans/plan.md v4.0.0 (Phase 5 COMPLETE)
> **Duration**: 3 weeks (5 sub-phases)
> **Approach**: TDD (tests first)
> **Predecessor**: Phase 5 (AI + Intents + Vocabulary — 1,991 tests)

---

## Table of Contents

1. [Decision Log](#1-decision-log)
2. [Sub-Phase Breakdown](#2-sub-phase-breakdown)
3. [Dependency Graph](#3-dependency-graph)
4. [Design Flows](#4-design-flows)
5. [Sub-Phase 6.1 — CI/CD Fix (Foundation)](#5-sub-phase-61--cicd-fix)
6. [Sub-Phase 6.2 — Step Decorator (Centerpiece)](#6-sub-phase-62--step-decorator)
7. [Sub-Phase 6.3 — Telemetry Wiring + SBOM](#7-sub-phase-63--telemetry-wiring--sbom)
8. [Sub-Phase 6.4 — Reporters](#8-sub-phase-64--reporters)
9. [Sub-Phase 6.5 — CLI + Scripts](#9-sub-phase-65--cli--scripts)
10. [Complete File Inventory](#10-complete-file-inventory)
11. [Test Plan](#11-test-plan)
12. [Quality Gates Per Sub-Phase](#12-quality-gates-per-sub-phase)
13. [Risk Register](#13-risk-register)
14. [Implementation Batching](#14-implementation-batching)

---

## 1. Decision Log

Decisions made during Phase 6 scoping. **Binding** for implementation.

| #   | Question                       | Decision                                      | Rationale                                                                                                                                                                                                                                                                                                                                                                                         |
| --- | ------------------------------ | --------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| W1  | Step decorator approach        | TC39 Stage 3 decorators (NOT experimental)    | ES2022 target + TS 5.0+ supports native decorators via `ClassMethodDecoratorContext`. No tsconfig change.                                                                                                                                                                                                                                                                                         |
| W2  | Step decorator scope           | `@ui5Step` class decorator + `withStep()`     | Class decorator for handler methods; `withStep()` inline wrapper for non-class contexts (intents, lambdas).                                                                                                                                                                                                                                                                                       |
| W3  | Handler wiring strategy        | Apply `@ui5Step` to public async methods      | 5 handler classes, ~30 methods total. Decorator auto-generates step names for trace viewer.                                                                                                                                                                                                                                                                                                       |
| W4  | Telemetry wiring               | DI via constructor option                     | `TracerWrapper` passed as optional constructor param. Default: `getNoOpTracer()`. Zero overhead when off.                                                                                                                                                                                                                                                                                         |
| W5  | CI/CD fix scope                | knip + cspell only                            | lint, typecheck, build, tests all pass. Only knip (unused exports) and cspell (spelling) failures remain.                                                                                                                                                                                                                                                                                         |
| W6  | `blacklist` term in cspell     | Keep file name, add cspell override           | `method-blacklist.ts` stays as-is. Add cspell file-level override to allow "blacklist" in `src/bridge/`.                                                                                                                                                                                                                                                                                          |
| W7  | CLI framework                  | No framework (custom argv parser)             | Follows dhikraft pattern. Lightweight, zero dependencies. `process.argv` parsing + dynamic import routing.                                                                                                                                                                                                                                                                                        |
| W8  | JSON Schema generation         | `zod-to-json-schema` from PramanConfigSchema  | Single source of truth: Zod schema → JSON Schema. IDEs use schema for autocomplete in `praman.config.json`.                                                                                                                                                                                                                                                                                       |
| W9  | SBOM generation                | `@cyclonedx/cyclonedx-npm` CLI                | CycloneDX SBOM per release. Script wraps CLI invocation, outputs `dist/sbom.json`.                                                                                                                                                                                                                                                                                                                |
| W10 | Reporter interface             | Playwright `Reporter` class                   | Both reporters implement `@playwright/test`'s `Reporter` interface for native integration.                                                                                                                                                                                                                                                                                                        |
| W11 | Step decorator `{ box: true }` | Always use boxed steps (with version guard)   | Creates nested step hierarchies in trace viewer. Methods appear as collapsible groups. **Version note**: `{ box: true }` was introduced in Playwright 1.44.0. Since our minimum is 1.50.0, it should be available, but add a `playwrightCompat` feature check or try/catch guard at decorator init time to verify. If `box` is not supported, omit the option (step still works, just not boxed). |
| W12 | Telemetry span placement       | Bridge + proxy + handler operations           | Spans wrap: bridge injection, control discovery, method execution, fixture lifecycle.                                                                                                                                                                                                                                                                                                             |
| W13 | CLI scope                      | Full dhikraft parity (all 9 modules)          | 9 CLI modules: logger, version, ide-detector, validator, scaffolder, init, doctor, uninstall, index. Matches dhikraft architecture for clean separation of concerns.                                                                                                                                                                                                                              |
| W14 | Step decorator test strategy   | Hybrid: Vitest unit + Playwright integration  | Unit tests in Vitest with `vi.mock('@playwright/test')` for fast TDD. Integration tests in Playwright for real `test.step()` behavior. Best coverage of both paths.                                                                                                                                                                                                                               |
| W15 | Batch sizing                   | Safe: 1 source file + 1 test file per batch   | ~30 batches total. Max ~300 LOC per batch. Each agent gets full context without hitting 200K token window. Maximizes parallelism.                                                                                                                                                                                                                                                                 |
| W16 | Coverage tiers for Phase 6     | Reporters Tier 2 (95%), CLI Tier 3 (90%)      | Reporters = public API sub-path export → Tier 2. CLI = internal `bin` entry only → Tier 3. Step decorator = core infrastructure → Tier 2.                                                                                                                                                                                                                                                         |
| W17 | Node.js minimum for CLI        | >= 20.0.0                                     | Match Praman's package.json engines field. Node 18 is EOL (April 2025).                                                                                                                                                                                                                                                                                                                           |
| W18 | CLI logging                    | Dedicated CLI logger (NOT pino)               | `cli/logger.ts` uses direct `console.log`/`console.error` with ANSI codes. Separate from pino-based `#core/logging`. CLI is user-facing tool — pino structured JSON doesn't make sense. eslint-disable `no-console` in this file only.                                                                                                                                                            |
| W19 | Telemetry                      | Praman-original feature (NOT dhikraft parity) | dhikraft has NO telemetry/OTel. Praman's TracerWrapper + OTel spans are a differentiator. Keep and implement in Phase 6.3.                                                                                                                                                                                                                                                                        |

---

## 2. Sub-Phase Breakdown

```text
Phase 6.1 — CI/CD Fix (Day 1)
├── .cspell.json        → Add SAP domain terms, add override for bridge/ files
├── knip.config.ts      → Clean up unused config entries
├── Fix unused files    → Delete or wire auth-setup.ts, auth-teardown.ts
├── Fix cspell typos    → vendro → vendor, etc.
└── Gate: CI pipeline passes (npm run ci + knip + cspell)

Phase 6.2 — Step Decorator (Week 1)
├── step-decorator.ts   → Enhance: @ui5Step, isInsideTestContext, generateStepName, formatSelectorForStep
├── ui5-handler.ts      → Wire @ui5Step to 14 public async methods
├── shell-handler.ts    → Wire @ui5Step to 3 public methods
├── footer-handler.ts   → Wire @ui5Step to 6 public methods
├── agentic-handler.ts  → Wire @ui5Step to 3 public methods
├── auth-handler.ts     → Wire @ui5Step to 4 public methods
└── Gate: npm run ci passes, all existing tests green

Phase 6.3 — Telemetry Wiring + SBOM (Week 2a)
├── ui5-handler.ts      → Accept TracerWrapper, wrap operations in spans
├── core-fixtures.ts    → Pass tracer to UI5Handler
├── generate-sbom.ts    → Implement CycloneDX SBOM generation
└── Gate: npm run ci passes

Phase 6.4 — Reporters (Week 2b)
├── compliance-reporter.ts  → Praman compliance reporter
├── odata-trace-reporter.ts → OData call trace reporter
├── reporters/index.ts      → Update barrel
└── Gate: npm run ci passes, reporters/index.ts exports both

Phase 6.5 — CLI + Scripts (Week 3)
├── cli/logger.ts       → CLI-specific colored output (W18)
├── cli/version.ts      → Package version + template root resolver
├── cli/ide-detector.ts → IDE detection by marker files
├── cli/validator.ts    → Pre-flight validation checks
├── cli/scaffolder.ts   → Template file copy engine
├── cli/init.ts         → Project scaffolding command
├── cli/doctor.ts       → Health check command
├── cli/uninstall.ts    → Clean removal of scaffolded files (W13)
├── cli/index.ts        → CLI entry point + argv routing
├── generate-json-schema.ts → Zod → JSON Schema generation
└── Gate: npm run ci + npm run check:exports passes
```

---

## 3. Dependency Graph

```text
Phase 6.1 — CI/CD Fix (MUST be first — unblocks CI for all subsequent work)
     │
     ├──────────────────────────────────────────────┐
     │                                              │
Phase 6.2 — Step Decorator                    Phase 6.3 — Telemetry + SBOM
     │   (step-decorator.ts enhanced first,         │   (can run in parallel
     │    then handlers wired)                      │    with Phase 6.2)
     │                                              │
     └──────────────┬───────────────────────────────┘
                    │
          ┌─────────┴─────────┐
          │                   │
    Phase 6.4             Phase 6.5
    Reporters             CLI + Scripts
    (parallel)            (parallel)
```

**Dependency Rules**:

- 6.1 MUST complete first — only knip + cspell block commits; once CI is green, 6.2 can start in parallel with remaining 6.1 cleanup
- 6.2 and 6.3 have NO dependency on each other — can run in parallel
- 6.2 step-decorator.ts enhancement must complete before handler wiring batches
- 6.3 telemetry wiring into ui5-handler.ts should be done AFTER 6.2 handler wiring (same file)
- 6.4 and 6.5 are independent of each other — can run in parallel
- 6.4 and 6.5 should start after 6.2 completes (to avoid merge conflicts in handlers)

---

## 4. Design Flows

### 4.1 Step Decorator Flow

```text
Handler method called (e.g., ui5.click({ id: 'saveBtn' }))
         │
         ▼
┌──────────────────────────────────────┐
│  @ui5Step decorator intercepts       │
│                                      │
│  ┌─ isInsideTestContext() ─────────┐ │
│  │  try { test.info(); return true }│ │
│  │  catch { return false }          │ │
│  └──────────────────────────────────┘ │
│         │                            │
│    ┌────┴────┐                       │
│  false      true                     │
│    │          │                       │
│    │    ┌─────▼──────────────────┐   │
│    │    │ generateStepName(      │   │
│    │    │   className,           │   │
│    │    │   methodName,          │   │
│    │    │   args                 │   │
│    │    │ )                      │   │
│    │    │                        │   │
│    │    │ → "Click { id: "save" │   │
│    │    │    type: "Button" }"   │   │
│    │    └────────┬───────────────┘   │
│    │             │                   │
│    │    ┌────────▼───────────────┐   │
│    │    │ test.step(stepName,    │   │
│    │    │   async () => {       │   │
│    │    │     return target      │   │
│    │    │       .call(this,      │   │
│    │    │         ...args);      │   │
│    │    │   },                   │   │
│    │    │   { box: true }        │   │
│    │    │ )                      │   │
│    │    └────────────────────────┘   │
│    │                                 │
│    └─── target.call(this, ...args)   │
│         (direct, no wrapping)        │
└──────────────────────────────────────┘
         │
         ▼
   Result returned / Error propagated
```

### 4.2 Telemetry Span Flow

```text
Handler method called with tracer injected
         │
         ▼
┌──────────────────────────────────────┐
│  tracer.withSpan(                    │
│    createSpanName('ui5', 'click'),   │
│    async () => {                     │
│      span.setAttribute(             │
│        'ui5.controlType',            │
│        selector.controlType          │
│      );                              │
│      // ... actual operation         │
│    }                                 │
│  )                                   │
└──────────────────────────────────────┘
         │
         ▼
   TracerWrapper decides:
   ├── NoOpTracer → fn() directly (zero overhead)
   └── RealTracer → creates OTel span, records duration + attributes
```

### 4.3 CLI Init Flow (Reference: dhikraft cli/init.ts)

```text
npx playwright-praman init
         │
         ▼
┌──────────────────────────────────────┐
│  1. Validate environment             │
│     ├─ Node.js ≥ 20.0.0             │
│     ├─ npm/npx available            │
│     └─ Write permissions             │
│                                      │
│  2. Detect IDE                       │
│     ├─ VS Code (.vscode/)           │
│     ├─ Cursor (.cursor/)            │
│     ├─ Claude Code (CLAUDE.md)      │
│     └─ JetBrains (.idea/)           │
│                                      │
│  3. Scaffold project                 │
│     ├─ playwright.config.ts          │
│     ├─ praman.config.ts             │
│     ├─ .env.example                  │
│     ├─ tests/example.spec.ts         │
│     └─ .gitignore updates            │
│                                      │
│  4. Install dependencies             │
│     └─ npm install --save-dev        │
│         playwright-praman            │
│         @playwright/test             │
│                                      │
│  5. Summary output                   │
│     └─ Next steps + docs link        │
└──────────────────────────────────────┘
```

### 4.4 CLI Doctor Flow (Reference: dhikraft cli/doctor.ts)

```text
npx playwright-praman doctor
         │
         ▼
┌──────────────────────────────────────┐
│  Category Checks:                    │
│                                      │
│  Runtime                             │
│  ├─ ✅ Node.js v22.14.0 (≥20)       │
│  ├─ ✅ npm 10.9.0                    │
│  └─ ✅ npx available                 │
│                                      │
│  Playwright                          │
│  ├─ ✅ @playwright/test 1.50.0       │
│  ├─ ✅ Chromium installed            │
│  └─ ⚠️ Firefox not installed         │
│                                      │
│  SAP Environment                     │
│  ├─ ✅ SAP_CLOUD_BASE_URL set        │
│  ├─ ✅ SAP_CLOUD_USERNAME set        │
│  └─ ❌ SAP_CLIENT not set            │
│                                      │
│  Configuration                       │
│  ├─ ✅ playwright.config.ts exists   │
│  ├─ ✅ praman.config.ts valid        │
│  └─ ⚠️ .env not found               │
│                                      │
│  Result: 8/11 checks passed          │
│  Action items: set SAP_CLIENT,       │
│    create .env file                   │
└──────────────────────────────────────┘
```

### 4.5 Compliance Reporter Flow

```text
Test execution starts
         │
         ▼
┌──────────────────────────────────────┐
│  ComplianceReporter implements       │
│  Playwright Reporter interface       │
│                                      │
│  onTestBegin(test, result)            │
│  ├─ Initialize test tracking         │
│  └─ Record test metadata             │
│                                      │
│  onTestEnd(test, result)             │
│  ├─ Iterate result.steps[]:          │
│  │  ├─ "UI5 control" → compliant     │
│  │  ├─ "Raw Playwright" → flagged    │
│  │  └─ "Navigation" → compliant      │
│  └─ Track compliance per test        │
│                                      │
│  onEnd(result)                             │
│  ├─ Calculate compliance %           │
│  ├─ Generate report:                 │
│  │  ├─ Per-test compliance status    │
│  │  ├─ Overall compliance score      │
│  │  ├─ Non-compliant actions list    │
│  │  └─ Recommendations              │
│  └─ Write: compliance-report.json    │
└──────────────────────────────────────┘
```

### 4.6 OData Trace Reporter Flow

**Important**: The ODataTraceReporter is an **AGGREGATOR** that reads from test artifacts and `result.steps[]` — it does NOT attach page request listeners or intercept network traffic. Playwright reporters do not have access to the `page` object. OData request data must be captured during test execution (e.g., via the `stability` fixture or test attachments) and then read by the reporter in `onTestEnd()`.

```text
Test execution (data capture phase)
         │
         ▼
┌──────────────────────────────────────┐
│  During test: stability fixture or   │
│  test code captures OData requests   │
│  as test attachments/artifacts       │
│  ├─ URL pattern: /$metadata,         │
│  │   /sap/opu/odata/, $batch         │
│  ├─ Record: method, URL, status,     │
│  │   duration, entity set, payload   │
│  └─ Detect: $filter, $expand,        │
│       $orderby, $top, $skip          │
└──────────────────────────────────────┘
         │
         ▼
Reporter aggregation phase
         │
         ▼
┌──────────────────────────────────────┐
│  ODataTraceReporter implements       │
│  Playwright Reporter interface       │
│                                      │
│  onTestEnd(test, result)             │
│  ├─ Iterate result.steps[]           │
│  ├─ Read test attachments for OData  │
│  │   request/response data           │
│  └─ Aggregate per-test OData stats   │
│                                      │
│  onEnd(result)                       │
│  ├─ Aggregate OData call statistics  │
│  │  ├─ Total calls per entity set    │
│  │  ├─ Avg response time             │
│  │  ├─ Error rate                    │
│  │  └─ Payload sizes                 │
│  └─ Write: odata-trace.json          │
└──────────────────────────────────────┘
```

---

## 5. Sub-Phase 6.1 — CI/CD Fix

**Scope**: Fix knip + cspell failures to unblock CI pipeline.
**Gate**: `npm run ci` + `npx knip` + `npx cspell "src/**/*.ts"` all pass.

### 5.1 CSpell Dictionary Updates

**File**: `.cspell.json`

Add missing SAP domain terms to `words` array:

```text
New words to add:
  recordreplay, smartfield, ushell, hana, lifnr, abap,
  sess, sonarjs, resumability, initialised, optimised,
  normalised, initialisation, endo
```

Fix typos in source code:

| File                                       | Typo     | Fix                                                               |
| ------------------------------------------ | -------- | ----------------------------------------------------------------- |
| `src/vocabulary/vocabulary-matcher.ts:66`  | `vendro` | `vendor`                                                          |
| `src/vocabulary/vocabulary-matcher.ts:134` | `endo`   | Add to cspell words (legitimate substring in vocabulary matching) |

### 5.2 CSpell Override for `method-blacklist.ts`

**Reason**: `blacklist` is in `.cspell.json` `flagWords` but we keep the file name as-is.

**Fix**: Add a cspell override in `.cspell.json` to allow "blacklist" in bridge files:

```json
{
  "overrides": [
    {
      "filename": "src/bridge/method-blacklist.ts",
      "words": ["blacklist", "blacklisted"]
    },
    {
      "filename": "tests/unit/bridge/method-blacklist.test.ts",
      "words": ["blacklist", "blacklisted"]
    }
  ]
}
```

No file renames, no export renames, no import updates. Existing code stays unchanged.

**Verification command**:

```bash
npx cspell "src/bridge/method-blacklist.ts" --no-progress
npx cspell "tests/unit/bridge/method-blacklist.test.ts" --no-progress
```

### 5.3 Knip Configuration Cleanup

**File**: `knip.config.ts`

Changes per knip suggestions:

| Change                                                                 | Action                                                                                 |
| ---------------------------------------------------------------------- | -------------------------------------------------------------------------------------- |
| Remove `dotenv`, `pino`, `zod`, `@eslint/js` from `ignoreDependencies` | Packages ARE used — knip now auto-detects them, so manual ignore entries are redundant |
| Remove `run` from `ignoreBinaries`                                     | No longer needed                                                                       |
| Remove 6 redundant entry patterns                                      | Already covered by `project` glob                                                      |
| Add `src/auth/auth-setup.ts`, `src/auth/auth-teardown.ts` to ignore    | These are Playwright `globalSetup`/`globalTeardown` files, not directly imported       |
| Unused devDependency `@ui5/mcp-server`                                 | Evaluate — if only used for MCP, add to `ignoreDependencies`                           |

**Before** (current `ignoreDependencies` + `ignoreBinaries`):

```typescript
ignoreDependencies: [
  'pino-pretty',
  'dotenv',          // ← REMOVE (auto-detected)
  'pino',            // ← REMOVE (auto-detected)
  'zod',             // ← REMOVE (auto-detected)
  'zod-to-json-schema',
  'release-please',
  '@eslint/js',      // ← REMOVE (auto-detected)
],
ignoreBinaries: [
  'run',             // ← REMOVE (no longer needed)
  'docusaurus',
],
```

**After**:

```typescript
ignoreDependencies: [
  'pino-pretty',
  'zod-to-json-schema',
  'release-please',
],
ignoreBinaries: [
  'docusaurus',
],
ignore: [
  // ... existing entries ...
  'src/auth/auth-setup.ts',
  'src/auth/auth-teardown.ts',
  'src/bridge/browser-scripts/*.ts',
],
```

### 5.4 Unused Exports Triage

**Strategy**: Most "unused exports" are public API types that consumers import. Add targeted knip ignores rather than deleting public API.

| Export Category                 | Count | Action                                                       |
| ------------------------------- | ----- | ------------------------------------------------------------ |
| `*ErrorOptions` interfaces (12) | 12    | Ignore — public API for error construction                   |
| Fixture type interfaces (15+)   | 15+   | Ignore — public API for type-safe fixtures                   |
| Browser script matchers (3)     | 3     | These are browser-evaluated functions — add to knip `ignore` |
| Module fixture factories (4)    | 4     | Evaluate — may need export or deletion                       |
| `DiscoveryStrategyName`         | 1     | Already used via config schema — knip false positive         |

**Decision**: Add `src/bridge/browser-scripts/*.ts` to knip `ignore` (browser scripts are not consumed via normal imports). Add a `// @public` comment or knip ignore for public API types.

---

## 6. Sub-Phase 6.2 — Step Decorator

**Scope**: Enhance `step-decorator.ts` from 79 LOC stub to full TC39 Stage 3 decorator system. Wire into all 5 handler classes.
**Gate**: `npm run ci` passes, all 2,640+ existing tests green, new decorator tests pass.

### 6.2.1 Module: `src/core/utils/step-decorator.ts` (Enhance)

**Current state**: 79 LOC — `withStep()` + `createStepName()` only.
**Target state**: ~220 LOC — full decorator system.

#### 6.2.1.1 New Export: `isInsideTestContext()`

````typescript
/**
 * Detects whether code is running inside a Playwright test context.
 *
 * @remarks
 * Uses `test.info()` to probe for active test context. Returns `false`
 * during globalSetup, globalTeardown, Vitest unit tests, or standalone scripts.
 * Safe to call in any context — never throws.
 *
 * @returns `true` if inside a Playwright test, `false` otherwise.
 *
 * @example
 * ```typescript
 * if (isInsideTestContext()) {
 *   // Safe to use test.step()
 * }
 * ```
 */
export function isInsideTestContext(): boolean;
````

**Implementation notes**:

- Import `test` from `@playwright/test` at module level (it's a peer dependency)
- Use `try { test.info(); return true; } catch { return false; }`
- `test.info()` returns `TestInfo | undefined` — add null check: `const info = test.info(); return info !== undefined;`
- This replaces the current `withStep()` dynamic import pattern with a cheaper synchronous check
- **Hook context detection**: `test.info()` returns truthy inside `beforeAll`/`afterAll` hooks, but `test.step()` throws in hooks (it only works inside test bodies and `beforeEach`/`afterEach`). To handle this:
  - Check `test.info()._timeoutManager` or catch the `test.step()` error and degrade gracefully
  - Alternatively, wrap the `test.step()` call in the decorator with a try/catch that falls back to direct invocation
  - **Recommended approach**: `isInsideTestContext()` returns `true` broadly, but the `@ui5Step` decorator wraps `test.step()` in its own try/catch to handle hook context gracefully. If `test.step()` throws due to being in a hook, fall back to direct method invocation.

**Detailed implementation**:

```typescript
export function isInsideTestContext(): boolean {
  try {
    const info = test.info();
    // test.info() returns TestInfo in test context, throws outside
    return info !== undefined;
  } catch {
    return false;
  }
}
```

#### 6.2.1.2 New Export: `formatSelectorForStep()`

````typescript
/**
 * Formats a UI5 selector into a human-readable string for step display.
 *
 * @remarks
 * Prioritizes: `id`, `controlType` (shortened), `properties.text`, `properties.name`.
 * Falls back to first 3 keys for non-standard objects.
 *
 * @param selector - Any value (typically UI5Selector or string)
 * @returns Human-readable string, e.g. `'{ id: "save", type: "Button" }'`
 *
 * @example
 * ```typescript
 * formatSelectorForStep({ controlType: 'sap.m.Button', id: 'save' });
 * // '{ id: "save", type: "Button" }'
 *
 * formatSelectorForStep(null);
 * // ''
 * ```
 */
export function formatSelectorForStep(selector: unknown): string;
````

**Implementation** (reference: dhikraft `formatSelectorForStep`):

- `null`/`undefined` → `''`
- `string` → `'"<value>"'`
- Non-object primitives → `String(value)`
- Object: extract `id`, `controlType` (`.split('.').pop()` for short name), `properties.text`, `properties.name`
- Fallback: first 3 keys
- Return `'{ <parts> }'` or `'{}'`
- **Circular reference guard**: Use a `try/catch` around JSON-like serialization or track visited objects with a `WeakSet` to prevent infinite recursion on self-referencing selector objects. RegExp values should be formatted as `/<source>/<flags>`.

#### 6.2.1.3 New Export: `generateStepName()`

````typescript
/**
 * Generates a human-readable step name from class name, method name, and arguments.
 *
 * @remarks
 * Uses an action map to translate method names to human-readable actions:
 * - `click` → "Click"
 * - `fill` → "Fill"
 * - `waitForUI5` → "Wait for UI5"
 * - etc.
 *
 * Formats the first argument (typically a selector) via `formatSelectorForStep()`.
 *
 * @param className - Handler class name (e.g., 'UI5Handler')
 * @param methodName - Method name (e.g., 'click')
 * @param args - Method arguments (first arg formatted as selector)
 * @returns Human-readable step name, e.g. `'Click { id: "save", type: "Button" }'`
 *
 * @example
 * ```typescript
 * generateStepName('UI5Handler', 'click', [{ id: 'saveBtn' }]);
 * // 'Click { id: "saveBtn" }'
 *
 * generateStepName('SAPAuthHandler', 'login', [config]);
 * // 'Login'
 * ```
 */
export function generateStepName(
  className: string,
  methodName: string,
  args: readonly unknown[],
): string;
````

**Action map** (comprehensive list for all handler methods).

**Fallback behavior**: For method names NOT in `ACTION_MAP`, convert `camelCase` to PascalCase with spaces: `customMethodName` → `"Custom method name"`. This ensures any future handler methods get readable step names without requiring `ACTION_MAP` updates.

```typescript
const ACTION_MAP: Readonly<Record<string, string>> = {
  // UI5Handler
  click: 'Click',
  fill: 'Fill',
  press: 'Press',
  select: 'Select',
  check: 'Check',
  uncheck: 'Uncheck',
  clear: 'Clear',
  getText: 'Get text',
  getValue: 'Get value',
  control: 'Find control',
  controls: 'Find controls',
  waitForUI5: 'Wait for UI5',
  waitFor: 'Wait for control',
  destroy: 'Destroy handler',

  // ShellHandler
  expectShellHeader: 'Verify shell header',
  clickHome: 'Click home',
  openUserMenu: 'Open user menu',

  // FooterHandler
  clickSave: 'Click Save',
  clickApply: 'Click Apply',
  clickCancel: 'Click Cancel',
  clickEdit: 'Click Edit',
  clickDelete: 'Click Delete',
  clickCreate: 'Click Create',

  // AgenticHandler
  generateTest: 'Generate test',
  interpretStep: 'Interpret step',
  suggestActions: 'Suggest actions',

  // SAPAuthHandler
  login: 'Login',
  loginFromEnv: 'Login from env',
  logout: 'Logout',
  isAuthenticated: 'Check authentication',
};
```

#### 6.2.1.4 New Export: `ui5Step` (TC39 Stage 3 Decorator)

````typescript
/**
 * TC39 Stage 3 method decorator that wraps class methods with `test.step()`.
 *
 * @remarks
 * Each call to the decorated method appears as a semantic step in:
 * - Playwright trace viewer
 * - HTML reports
 * - Browser snapshots
 *
 * Uses `{ box: true }` for nested step hierarchies. Safely degrades
 * outside test context (globalSetup, Vitest, standalone scripts).
 *
 * TypeScript 5.0+ supports TC39 Stage 3 decorators natively when
 * `experimentalDecorators` is NOT set in tsconfig (which is our case).
 *
 * @example
 * ```typescript
 * class UI5Handler {
 *   @ui5Step
 *   async click(selector: UI5Selector): Promise<void> {
 *     // method body
 *   }
 * }
 * ```
 */
export function ui5Step<
  This extends object,
  Args extends unknown[],
  Return extends Promise<unknown>,
>(
  target: (this: This, ...args: Args) => Return,
  context: ClassMethodDecoratorContext<This, (this: This, ...args: Args) => Return>,
): (this: This, ...args: Args) => Return;
````

**Implementation notes**:

- Extract `methodName` from `context.name`
- Return replacement method that:
  1. Gets `className` from `this.constructor.name`
  2. Calls `isInsideTestContext()` — if false, call `target.call(this, ...args)` directly
  3. Calls `generateStepName(className, methodName, args)`
  4. Wraps in `test.step(stepName, async () => target.call(this, ...args), { box: true })`
  5. If `test.step()` throws (e.g., called in hook context), catch and fall back to `target.call(this, ...args)`
- The return type is constrained to `Return extends Promise<unknown>` — no `as Return` cast needed since `test.step()` returns `Promise<T>` which satisfies the constraint. The TypeScript generic constraint ensures type safety at compile time.
- **Error propagation**: Errors from `target.call()` MUST propagate through `test.step()` unchanged. The step is marked as failed, but the error bubbles up to the test framework. Never swallow or wrap errors from the decorated method.

#### 6.2.1.5 Refactor Existing `withStep()`

Current implementation uses `try { await import('@playwright/test') }` on every call. Refactor to:

```typescript
export async function withStep<T>(stepName: string, fn: () => Promise<T>): Promise<T> {
  if (!isInsideTestContext()) {
    return fn();
  }
  const { test } = await import('@playwright/test');
  return test.step(stepName, fn, { box: true });
}
```

Changes:

- Add `{ box: true }` for consistency with `@ui5Step`
- Use `isInsideTestContext()` for consistent detection
- **MUST keep the dynamic import** — unlike `@ui5Step` which imports `test` at module level, `withStep()` uses `await import('@playwright/test')` because it may be called from modules that don't have `@playwright/test` as a direct dependency. The dynamic import ensures no hard dependency on Playwright at module load time.

#### 6.2.1.6 Keep Existing `createStepName()` — Dual-Format Strategy

No changes needed. The step-decorator module provides **two** step name formats:

| Function             | Format                          | Used By                                                            |
| -------------------- | ------------------------------- | ------------------------------------------------------------------ |
| `createStepName()`   | `"module > action: target"`     | Non-handler code (selectors, config loading, `withStep()` callers) |
| `generateStepName()` | `"Action { selector details }"` | Handler methods via `@ui5Step` decorator                           |

`createStepName()` stays as-is for backward compatibility. `generateStepName()` is **new** for handler methods. This is a significant enhancement to step-decorator.ts (79 → ~220 LOC), not a minor tweak — the file effectively becomes the step instrumentation core.

### 6.2.2 Handler Wiring Specifications

Each handler class gets the `@ui5Step` decorator applied to its public async methods.

#### 6.2.2.1 `src/fixtures/ui5-handler.ts` — Wire 14 Async Methods

```typescript
import { ui5Step } from '#core/utils/step-decorator.js';

export class UI5Handler {
  @ui5Step async control(selector: UI5Selector): Promise<UI5ControlBase> { ... }
  @ui5Step async controls(selector: UI5Selector): Promise<readonly UI5ControlBase[]> { ... }
  @ui5Step async click(selector: UI5Selector): Promise<void> { ... }
  @ui5Step async fill(selector: UI5Selector, value: string): Promise<void> { ... }
  @ui5Step async press(selector: UI5Selector): Promise<void> { ... }
  @ui5Step async select(selector: UI5Selector, key: string): Promise<void> { ... }
  @ui5Step async check(selector: UI5Selector): Promise<void> { ... }
  @ui5Step async uncheck(selector: UI5Selector): Promise<void> { ... }
  @ui5Step async clear(selector: UI5Selector): Promise<void> { ... }
  @ui5Step async getText(selector: UI5Selector): Promise<string> { ... }
  @ui5Step async getValue(selector: UI5Selector): Promise<string> { ... }
  @ui5Step async waitForUI5(timeout?: number): Promise<void> { ... }
  @ui5Step async waitFor(selector: UI5Selector, ...): Promise<void> { ... }
  @ui5Step async destroy(): Promise<void> { ... }
  // NOT decorated: clearCache() is synchronous (void, not Promise)
  // NOT decorated: Private methods (ensureReady, internalFindControl, etc.)
}
```

**Methods excluded from `@ui5Step`**:

- **Sync public**: `clearCache()` — synchronous, returns `void` not `Promise`, cannot use `test.step()`.
- **Private**: `ensureReady()`, `internalWaitForUI5Stable()`, `internalFindControl()`, `internalFindControls()`, `internalExecuteControlMethod()`, `internalGetAvailableMethods()`, `discoverSingleControl()`.

#### 6.2.2.2 `src/fixtures/shell-handler.ts` — Wire 3 Methods

```typescript
import { ui5Step } from '#core/utils/step-decorator.js';

export class ShellHandler {
  @ui5Step async expectShellHeader(): Promise<void> { ... }
  @ui5Step async clickHome(): Promise<void> { ... }
  @ui5Step async openUserMenu(): Promise<void> { ... }
  // Private: waitForUI5Stable() — NOT decorated
}
```

#### 6.2.2.3 `src/fixtures/footer-handler.ts` — Wire 6 Public Methods

```typescript
import { ui5Step } from '#core/utils/step-decorator.js';

export class FooterHandler {
  @ui5Step async clickSave(): Promise<void> { ... }
  @ui5Step async clickApply(): Promise<void> { ... }
  @ui5Step async clickCancel(): Promise<void> { ... }
  @ui5Step async clickEdit(): Promise<void> { ... }
  @ui5Step async clickDelete(): Promise<void> { ... }
  @ui5Step async clickCreate(): Promise<void> { ... }
  // Private: clickFooterButton() — NOT decorated (called by public methods)
}
```

#### 6.2.2.4 `src/ai/agentic-handler.ts` — Wire 3 Methods

```typescript
import { ui5Step } from '#core/utils/step-decorator.js';

export class AgenticHandler {
  @ui5Step async generateTest(...): Promise<AiResponse<string[]>> { ... }
  @ui5Step async interpretStep(...): Promise<AiResponse<InterpretedStep>> { ... }
  @ui5Step async suggestActions(pageContext: PageContext): Promise<AiResponse<string[]>> { ... }
}
```

#### 6.2.2.5 `src/auth/auth-handler.ts` — Wire 4 Methods

```typescript
import { ui5Step } from '#core/utils/step-decorator.js';

export class SAPAuthHandler {
  @ui5Step async login(page: AuthPage, config: Readonly<SAPAuthConfig>): Promise<void> { ... }
  @ui5Step async loginFromEnv(page: AuthPage): Promise<void> { ... }
  @ui5Step async logout(page: AuthPage): Promise<void> { ... }
  @ui5Step async isAuthenticated(page: AuthPage): Promise<boolean> { ... }
}
```

---

## 7. Sub-Phase 6.3 — Telemetry Wiring + SBOM

**Scope**: Wire existing `TracerWrapper` into handler operations + implement SBOM generation script.
**Gate**: `npm run ci` passes, spans fire for all handler operations (verified via unit tests with mock tracer).

**Important context**: The telemetry infrastructure (`TracerWrapper`, `SpanWrapper`, `getNoOpTracer()`, `initTelemetry()`) is **already fully implemented** in `src/core/telemetry/otel.ts` from Phase 1. The `tracer` worker-scoped fixture already exists in `core-fixtures.ts` (line 147-154). Phase 6.3 only needs to:

1. Add a `tracer?: TracerWrapper` option to `UI5HandlerOptions`
2. Thread the existing `tracer` fixture into the `UI5Handler` constructor call in `core-fixtures.ts`
3. Add `tracer.withSpan()` calls inside handler method bodies

No new telemetry infrastructure is needed.

### 7.1 Telemetry Wiring Strategy

**Approach**: Inject `TracerWrapper` into handler constructors via optional parameter. This is pure DI — no globals, no singleton lookup.

#### 7.1.1 `src/fixtures/ui5-handler.ts` — Add Tracer Support

Add `tracer` to `UI5HandlerOptions`:

```typescript
export interface UI5HandlerOptions {
  readonly page: Page;
  readonly interactionStrategy: InteractionStrategy;
  readonly discoveryStrategies: readonly DiscoveryStrategyName[];
  readonly config?: {
    readonly ui5WaitTimeout?: number;
    readonly controlDiscoveryTimeout?: number;
  };
  readonly tracer?: TracerWrapper; // NEW — optional, defaults to NoOpTracer
}
```

Constructor stores tracer:

```typescript
constructor(options: UI5HandlerOptions) {
  // ... existing assignments
  this.tracer = options.tracer ?? getNoOpTracer();
}
```

Span placement in key operations:

| Method         | Span Name                 | Attributes                       |
| -------------- | ------------------------- | -------------------------------- |
| `control()`    | `praman.ui5.findControl`  | `ui5.controlType`, `ui5.id`      |
| `controls()`   | `praman.ui5.findControls` | `ui5.controlType`                |
| `click()`      | `praman.ui5.click`        | `ui5.id`, `ui5.controlType`      |
| `fill()`       | `praman.ui5.fill`         | `ui5.id`, `ui5.value` (redacted) |
| `waitForUI5()` | `praman.ui5.waitForUI5`   | `ui5.timeout`                    |
| `waitFor()`    | `praman.ui5.waitFor`      | `ui5.controlType`, `ui5.timeout` |

**Pattern** (applied inside each method body):

```typescript
@ui5Step
async click(selector: UI5Selector): Promise<void> {
  return this.tracer.withSpan(
    createSpanName('ui5', 'click'),
    async () => {
      // existing implementation unchanged
    },
  );
}
```

**Note**: The `@ui5Step` decorator (test reporting) and `tracer.withSpan()` (observability) are complementary and stack correctly. Step decorator wraps the outer call; tracer wraps the inner operation. When telemetry is disabled, `withSpan` is zero-overhead.

#### 7.1.2 `src/fixtures/core-fixtures.ts` — Pass Tracer to UI5Handler

Update the `ui5` fixture to pass the worker-scoped `tracer` to `UI5Handler`:

```typescript
ui5: async ({ page, pramanConfig, rootLogger, tracer }, use) => {
  const handler = new UI5Handler({
    page,
    interactionStrategy: createInteractionStrategy(pramanConfig),
    discoveryStrategies: pramanConfig.discoveryStrategies,
    config: {
      ui5WaitTimeout: pramanConfig.ui5WaitTimeout,
      controlDiscoveryTimeout: pramanConfig.controlDiscoveryTimeout,
    },
    tracer, // NEW — passes worker-scoped tracer
  });
  await use(handler);
  await handler.destroy();
},
```

### 7.2 SBOM Generation Script

**File**: `scripts/generate-sbom.ts` (replace 4 LOC stub)
**Target**: ~60 LOC

```typescript
/**
 * Generates a CycloneDX Software Bill of Materials (SBOM) for the package.
 *
 * @remarks
 * Uses `@cyclonedx/cyclonedx-npm` to produce a CycloneDX 1.5 JSON SBOM.
 * Output: `dist/sbom.json` — included in release artifacts.
 *
 * Run: `npx tsx scripts/generate-sbom.ts`
 */
```

**Implementation**:

1. Check `@cyclonedx/cyclonedx-npm` is available via `npx`
2. Run `npx @cyclonedx/cyclonedx-npm --output-file dist/sbom.json --spec-version 1.5 --output-reproducible`
3. Verify output file exists
4. Log summary: component count, format version

**Dependencies**: `@cyclonedx/cyclonedx-npm` as devDependency (already present in `package.json`).

---

## 8. Sub-Phase 6.4 — Reporters

**Scope**: Two custom Playwright reporters.
**Gate**: `npm run ci` passes, `reporters/index.ts` exports both reporters.

**Playwright Reporter interface contract** (from `@playwright/test`):

```typescript
interface Reporter {
  onBegin?(config: FullConfig, suite: Suite): void;
  onTestBegin?(test: TestCase, result: TestResult): void;
  onTestEnd?(test: TestCase, result: TestResult): void;
  onEnd?(result: FullResult): void | Promise<void>;
  onStdOut?(chunk: string | Buffer, test?: TestCase, result?: TestResult): void;
  onStdErr?(chunk: string | Buffer, test?: TestCase, result?: TestResult): void;
  onError?(error: TestError): void;
  onExit?(): void | Promise<void>;
  printsToStdio?(): boolean;
}
```

**Note**: There is NO `onStepBegin` or `onStepEnd`. Steps are accessed via `result.steps[]` in `onTestEnd`. Each step has `{ title, category, startTime, duration, error?, steps[] }` (steps can be nested).

### 8.1 Module: `src/reporters/compliance-reporter.ts`

**Purpose**: Tracks whether test steps use Praman's UI5 abstractions vs. raw Playwright calls.
**Estimated LOC**: ~180

````typescript
/**
 * Praman Compliance Reporter — tracks UI5 test pattern adherence.
 *
 * @remarks
 * Implements Playwright's `Reporter` interface. Categorizes test steps as:
 * - **compliant**: Uses Praman fixtures (ui5.click, ui5.fill, etc.)
 * - **raw-playwright**: Uses raw page.click, page.fill, etc.
 * - **mixed**: Both Praman and raw Playwright in same test
 *
 * Output: `compliance-report.json` in the configured output directory.
 *
 * @example
 * ```typescript
 * // playwright.config.ts
 * import { defineConfig } from '@playwright/test';
 *
 * export default defineConfig({
 *   reporter: [
 *     ['html'],
 *     ['./node_modules/playwright-praman/dist/reporters/compliance-reporter.js'],
 *   ],
 * });
 * ```
 */
````

**Interfaces**:

```typescript
/** Compliance status for a single test */
export type TestComplianceStatus = 'compliant' | 'raw-playwright' | 'mixed';

/** Per-test compliance data */
export interface TestComplianceEntry {
  readonly testTitle: string;
  readonly testFile: string;
  readonly status: TestComplianceStatus;
  readonly pramanSteps: number;
  readonly rawPlaywrightSteps: number;
  readonly totalSteps: number;
}

/** Full compliance report */
export interface ComplianceReport {
  readonly timestamp: string;
  readonly totalTests: number;
  readonly compliantTests: number;
  readonly rawPlaywrightTests: number;
  readonly mixedTests: number;
  readonly compliancePercentage: number;
  readonly tests: readonly TestComplianceEntry[];
}
```

**Playwright Reporter lifecycle methods** (from `@playwright/test`'s `Reporter` interface):

| Method                      | What it does                                                                                                                                |
| --------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------- |
| `onBegin(config, suite)`    | Initialize report, record suite metadata, walk suite tree for test count                                                                    |
| `onTestBegin(test, result)` | Start tracking for this test                                                                                                                |
| `onTestEnd(test, result)`   | **Primary analysis point**: iterate `result.steps[]` to categorize each step as Praman vs. raw Playwright. Finalize test compliance status. |
| `onEnd(result)`             | Calculate compliance %, write `compliance-report.json` to output directory                                                                  |

**Note**: There is NO `onStepBegin()` or `onStepEnd()` in the Playwright `Reporter` interface. Reporters access steps via `result.steps[]` in `onTestEnd(test, result)`. Each `TestStep` in the array has `title`, `category`, `startTime`, `duration`, `error`, and nested `steps[]`.

**Step categorization logic** (applied in `onTestEnd` by iterating `result.steps[]`):

- Step title starts with action map verb (Click, Fill, Press, Select, etc.) → **Praman** (decorated handler method)
- Step title matches "module > action" pattern → **Praman** (`withStep()` wrapper)
- All other steps → **raw Playwright**

**Output directory strategy**: Write to `<playwright-output-dir>/praman-reports/` (default: `test-results/praman-reports/`). Configurable via reporter options.

**Config example** (corrected from earlier examples):

```typescript
// playwright.config.ts
import { defineConfig } from '@playwright/test';

export default defineConfig({
  reporter: [
    ['html'],
    [
      './node_modules/playwright-praman/dist/reporters/compliance-reporter.js',
      { outputDir: 'test-results/praman-reports' },
    ],
  ],
});
```

### 8.2 Module: `src/reporters/odata-trace-reporter.ts`

**Purpose**: Captures OData HTTP requests/responses during test execution for debugging and performance analysis.
**Estimated LOC**: ~200

````typescript
/**
 * OData Trace Reporter — logs OData V2/V4 request/response pairs.
 *
 * @remarks
 * Implements Playwright's `Reporter` interface. Intercepts network traffic
 * matching OData URL patterns and records request/response metadata.
 *
 * Detects OData patterns:
 * - `/$metadata` — metadata document requests
 * - `/sap/opu/odata/` — SAP OData V2 gateway
 * - `/$batch` — batch requests
 * - `$filter`, `$expand`, `$orderby`, `$top`, `$skip` — query parameters
 *
 * Output: `odata-trace.json` in the configured output directory.
 *
 * @example
 * ```typescript
 * // playwright.config.ts
 * import { defineConfig } from '@playwright/test';
 *
 * export default defineConfig({
 *   reporter: [
 *     ['html'],
 *     ['./node_modules/playwright-praman/dist/reporters/odata-trace-reporter.js'],
 *   ],
 * });
 * ```
 */
````

**Interfaces**:

```typescript
/** Single OData request trace */
export interface ODataTraceEntry {
  readonly testTitle: string;
  readonly timestamp: string;
  readonly method: string; // GET, POST, PATCH, DELETE
  readonly url: string;
  readonly entitySet: string | null; // Extracted entity set name
  readonly queryParams: {
    readonly filter?: string;
    readonly expand?: string;
    readonly orderby?: string;
    readonly top?: number;
    readonly skip?: number;
    readonly select?: string;
  };
  readonly statusCode: number;
  readonly duration: number; // ms
  readonly responseSize: number; // bytes
  readonly isBatch: boolean;
  readonly isMetadata: boolean;
}

/** Aggregated OData statistics per entity set */
export interface ODataEntityStats {
  readonly entitySet: string;
  readonly totalCalls: number;
  readonly avgDuration: number;
  readonly maxDuration: number;
  readonly errorCount: number;
  readonly byMethod: Readonly<Record<string, number>>;
}

/** Full OData trace report */
export interface ODataTraceReport {
  readonly timestamp: string;
  readonly totalRequests: number;
  readonly totalDuration: number;
  readonly entityStats: readonly ODataEntityStats[];
  readonly traces: readonly ODataTraceEntry[];
}
```

**Implementation notes**:

- **Critical**: The reporter is an **AGGREGATOR**, NOT an interceptor. Playwright reporters do NOT have access to `page` or browser context. The reporter cannot attach `page.on('request')` listeners.
- The reporter processes test attachments and `result.steps[]` data from the test results in `onTestEnd(test, result)`
- Tests that want OData tracing should use the `stability` fixture (or a dedicated OData trace fixture) which captures requests during test execution and stores them as test attachments
- The reporter aggregates OData-related data from test artifacts in `onEnd(result)`
- Reporter lifecycle: `onBegin` → `onTestBegin` → `onTestEnd` (read `result.steps[]` + attachments) → `onEnd` (aggregate + write JSON)

### 8.3 Barrel Update: `src/reporters/index.ts`

The barrel MUST export both **classes** (for Playwright reporter registration) and **types** (for consumer type imports):

```typescript
// Classes — needed for Playwright reporter registration
export { ComplianceReporter } from './compliance-reporter.js';
export { ODataTraceReporter } from './odata-trace-reporter.js';

// Types — needed for consumer type imports
export type {
  ComplianceReport,
  TestComplianceEntry,
  TestComplianceStatus,
} from './compliance-reporter.js';
export type {
  ODataEntityStats,
  ODataTraceEntry,
  ODataTraceReport,
} from './odata-trace-reporter.js';
```

---

## 9. Sub-Phase 6.5 — CLI + Scripts

**Scope**: CLI init + doctor commands, JSON schema generation.
**Gate**: `npm run ci` + `npm run check:exports` passes.
**Reference**: dhikraft `src/cli/` — architecture patterns only, no copy-paste.

### 9.1 Module: `src/cli/logger.ts`

**Purpose**: CLI-specific colored terminal output. NOT pino — lightweight ANSI formatting.
**Estimated LOC**: ~80

```typescript
/**
 * CLI logger with ANSI-colored output for terminal display.
 *
 * @remarks
 * Distinct from the pino-based application logger. This is for CLI commands
 * (init, doctor) that produce human-readable terminal output.
 *
 * Supports:
 * - `logStep(n, total, message)` — numbered progress (e.g., "[1/5] Installing...")
 * - `logSuccess(message)` — green checkmark
 * - `logWarn(message)` — yellow warning
 * - `logError(message)` — red error
 * - `logSection(title)` — bold section header
 * - `logTable(rows)` — key-value table
 */
```

**Exports**:

```typescript
export function logStep(step: number, total: number, message: string): void;
export function logSuccess(message: string): void;
export function logWarn(message: string): void;
export function logError(message: string): void;
export function logSection(title: string): void;
export function logTable(rows: ReadonlyArray<readonly [string, string]>): void;
export function logBanner(title: string, version: string): void;
```

**ANSI codes**: Use `\x1b[32m` (green), `\x1b[33m` (yellow), `\x1b[31m` (red), `\x1b[1m` (bold), `\x1b[0m` (reset). No external dependency.

### 9.2 Module: `src/cli/validator.ts`

**Purpose**: Pre-flight validation for CLI commands. Returns structured results.
**Estimated LOC**: ~120
**Reference**: dhikraft `src/cli/validator.ts`

```typescript
/**
 * Pre-flight validation checks for the Praman CLI.
 *
 * @remarks
 * Runs environment checks before init/doctor commands execute.
 * Returns a structured report with pass/fail/warn status per check.
 */
```

**Interfaces**:

```typescript
export type CheckStatus = 'pass' | 'fail' | 'warn';

export interface CheckResult {
  readonly name: string;
  readonly status: CheckStatus;
  readonly message: string;
  readonly suggestion?: string;
}

export interface ValidationReport {
  readonly checks: readonly CheckResult[];
  readonly passed: number;
  readonly failed: number;
  readonly warnings: number;
}
```

**Checks implemented**:

| Check                         | Condition                                   | Status          |
| ----------------------------- | ------------------------------------------- | --------------- |
| Node.js version               | `>=20.0.0`                                  | fail if below   |
| npm available                 | `npm --version` succeeds                    | fail if missing |
| `@playwright/test` installed  | Resolvable from cwd                         | fail if missing |
| Chromium installed            | `npx playwright install --dry-run chromium` | warn if missing |
| `SAP_CLOUD_BASE_URL` set      | env var exists                              | warn if missing |
| `SAP_CLOUD_USERNAME` set      | env var exists                              | warn if missing |
| `playwright.config.ts` exists | file exists in cwd                          | warn if missing |
| `praman.config.ts` exists     | file exists in cwd                          | warn if missing |

### 9.3 Module: `src/cli/version.ts`

**Purpose**: Package version and template root resolution. Cross-platform path handling.
**Estimated LOC**: ~60
**Reference**: dhikraft `src/cli/version.ts`

```typescript
/**
 * Package version and template path resolver.
 *
 * @remarks
 * Resolves the package root from `import.meta.url` using `fileURLToPath`
 * for Windows `file:///C:/...` compatibility. Caches results for performance.
 */
```

**Exports**:

```typescript
export function getPackageRoot(): string; // import.meta.url → ../../ package root, cached
export function getVersion(): string; // reads package.json .version, cached; fallback '0.0.0'
export function getTemplateRoot(): string; // getPackageRoot() + '/templates'
```

**Implementation Notes**:

- Uses `import.meta.url` + `fileURLToPath` from `node:url` (cross-platform)
- Caches results in module-level `let` variables (single computation per process)
- Fallback version `'0.0.0'` if package.json read fails

### 9.4 Module: `src/cli/ide-detector.ts`

**Purpose**: Detects installed IDEs by checking for marker files in the project directory.
**Estimated LOC**: ~100
**Reference**: dhikraft `src/cli/ide-detector.ts`

```typescript
/**
 * IDE detection by marker files.
 *
 * @remarks
 * Checks for IDE-specific configuration files/directories to determine
 * which IDEs are active in the project. Used by init.ts to scaffold
 * IDE-specific configuration files.
 */
```

**Interfaces**:

```typescript
export interface IDEDetection {
  readonly vscode: boolean;
  readonly claude: boolean;
  readonly cursor: boolean;
  readonly opencode: boolean;
  readonly jules: boolean;
}

interface IDERule {
  readonly name: keyof IDEDetection;
  readonly label: string;
  readonly markers: readonly string[];
}
```

**Exports**:

```typescript
export function detectIDEs(targetDir: string): IDEDetection;
export function getIDELabels(detection: IDEDetection): readonly string[];
```

**IDE Rules** (5 rules):

| IDE      | Markers                        |
| -------- | ------------------------------ |
| VS Code  | `.vscode/`, `*.code-workspace` |
| Claude   | `CLAUDE.md`                    |
| Cursor   | `.cursor/`, `.cursorrc`        |
| OpenCode | `.opencode/`                   |
| Jules    | `.jules/`                      |

**Fallback**: If no markers found, check `process.env.TERM_PROGRAM === 'vscode'`.

### 9.5 Module: `src/cli/scaffolder.ts`

**Purpose**: Template file copy engine. Copies files from package templates to target directory.
**Estimated LOC**: ~170
**Reference**: dhikraft `src/cli/scaffolder.ts`

```typescript
/**
 * Template file scaffolder for CLI init command.
 *
 * @remarks
 * Copies template files from the package's `templates/` directory to the
 * target project. Handles IDE-conditional files and skip-if-exists logic.
 */
```

**Interfaces**:

```typescript
export interface ScaffoldOptions {
  readonly targetDir: string;
  readonly templateRoot: string;
  readonly ides: IDEDetection;
  readonly skipAgents: boolean;
  readonly force: boolean;
}

export interface ScaffoldResult {
  readonly created: readonly string[];
  readonly skipped: readonly string[];
}
```

**Exports**:

```typescript
export async function scaffold(options: ScaffoldOptions): Promise<ScaffoldResult>;
```

**Template Categories**:

| Category   | Files                                             | Condition              |
| ---------- | ------------------------------------------------- | ---------------------- |
| Core       | `playwright.config.ts`, `.env.example`            | Always                 |
| Workspace  | `copilot-instructions.md`                         | Always                 |
| Skills     | `.github/skills/sap-test-automation/` (recursive) | Always                 |
| Seeds      | Example test files (2)                            | Always                 |
| Vocabulary | Starter vocabulary JSON (1)                       | Always                 |
| Agents     | `.agent.md` files (3)                             | `!skipAgents`          |
| VS Code    | 2 config files                                    | `ides.vscode === true` |
| Claude     | 1 config file                                     | `ides.claude === true` |
| Cursor     | 1 config file                                     | `ides.cursor === true` |
| Jules      | 1 config file                                     | `ides.jules === true`  |

**Skip Logic**: If destination file exists and `!force`, skip (don't overwrite). Return in `skipped[]`.
**Path Rewrite**: Template `dotgithub/` -> target `.github/` (dot prefix handling).

### 9.6 Module: `src/cli/uninstall.ts`

**Purpose**: Clean removal of scaffolded files. Dry-run by default with interactive confirmation.
**Estimated LOC**: ~200
**Reference**: dhikraft `src/cli/uninstall.ts` (467 LOC -- Praman is leaner, ~200 LOC)

```typescript
/**
 * Uninstall command — removes scaffolded files from the project.
 *
 * @remarks
 * Dry-run by default. Requires `--confirm` flag or interactive `y` to execute.
 * Protected files (`.env`, `tests/`, `node_modules/`, `package.json`) are NEVER removed.
 * Optionally removes Playwright browsers with `--remove-browsers`.
 */
```

**Interfaces**:

```typescript
export interface UninstallOptions {
  readonly targetDir: string;
  readonly confirm: boolean;
  readonly keepConfig: boolean;
  readonly keepAgents: boolean;
  readonly removeBrowsers: boolean;
}

export interface FileEntry {
  readonly relativePath: string;
  readonly category: 'agent' | 'ide' | 'skill' | 'seed' | 'config' | 'vocabulary';
  readonly label: string;
}
```

**Exports**:

```typescript
export function parseUninstallArgs(argv: readonly string[]): UninstallOptions;
export function getScaffoldedFiles(
  targetDir: string,
  options: UninstallOptions,
): readonly FileEntry[];
export async function runUninstall(options: UninstallOptions): Promise<void>;
```

**Protected files** (NEVER removed):

- `.env`, `tests/`, `node_modules/`, `package.json`, `.auth/`, `.gitignore`

**Flow**:

1. Scan for scaffolded files using `getScaffoldedFiles()`
2. Display manifest (grouped by category)
3. If `!confirm`: prompt via `readline` (y/N)
4. If confirmed: remove files, then clean empty directories bottom-up
5. If `removeBrowsers`: run `npx playwright uninstall --all`

**ESLint Note**: `readline` prompt uses `process.stdin`/`process.stdout` -- use eslint-disable for `no-console` in this function.

### 9.7 Module: `src/cli/init.ts`

**Purpose**: Project scaffolding — generates config files, example tests, IDE configs.
**Dependencies**: Uses `cli/ide-detector.ts`, `cli/scaffolder.ts`, `cli/version.ts`, `cli/logger.ts`, `cli/validator.ts`.
**Estimated LOC**: ~150
**Reference**: dhikraft `src/cli/init.ts` + `src/cli/scaffolder.ts`

````typescript
/**
 * Praman project initializer — scaffolds a new Praman project.
 *
 * @remarks
 * Creates configuration files, example test, and IDE-specific configs.
 * Detects the user's IDE and generates appropriate config files.
 *
 * Steps:
 * 1. Validate environment (Node.js, npm)
 * 2. Detect IDE (VS Code, Cursor, Claude Code, JetBrains)
 * 3. Generate configuration files
 * 4. Create example test
 * 5. Print next steps
 *
 * @example
 * ```bash
 * npx playwright-praman init
 * npx playwright-praman init --skip-install
 * ```
 */
export async function runInit(args: readonly string[]): Promise<void>;
````

**Generated files**:

| File                      | Purpose                                              |
| ------------------------- | ---------------------------------------------------- |
| `playwright.config.ts`    | Playwright config with Praman import                 |
| `praman.config.ts`        | Praman-specific config (log level, strategies)       |
| `.env.example`            | SAP environment variable template                    |
| `tests/example.spec.ts`   | Example UI5 test using Praman fixtures               |
| `.vscode/extensions.json` | Recommended VS Code extensions (if VS Code detected) |

**IDE Detection** (reference: dhikraft `src/cli/ide-detector.ts`):

- Check for marker files: `.vscode/`, `.cursor/`, `CLAUDE.md`, `.idea/`
- Check `TERM_PROGRAM` env var for VS Code

### 9.8 Module: `src/cli/doctor.ts`

**Purpose**: Health check — validates environment, dependencies, configuration.
**Estimated LOC**: ~100
**Reference**: dhikraft `src/cli/doctor.ts`

````typescript
/**
 * Praman doctor command — health check for the test environment.
 *
 * @remarks
 * Runs all validation checks and displays results in a categorized table.
 * Categories: Runtime, Playwright, SAP Environment, Configuration.
 *
 * @example
 * ```bash
 * npx playwright-praman doctor
 * ```
 */
export async function runDoctor(): Promise<void>;
````

**Implementation**:

1. Run all validator checks
2. Group results by category (Runtime, Playwright, SAP, Config)
3. Display with `logTable()` using status icons
4. Print summary: `"X/Y checks passed"`
5. Print action items for failed/warned checks
6. Exit code: 0 if no failures, 1 if any failures

### 9.9 Module: `src/cli/index.ts` (Update Barrel → Entry Point)

**Current**: Empty barrel.
**Target**: CLI entry point with argv routing.
**Estimated LOC**: ~50

````typescript
/**
 * Praman CLI entry point — routes subcommands to handlers.
 *
 * @remarks
 * Supports: `init`, `doctor`
 * No external CLI framework — uses process.argv parsing.
 *
 * The module serves dual purposes:
 * 1. **Exported `main()`** — for programmatic invocation and testing
 * 2. **Self-executing** — when run as a script via `bin` entry, calls `main(process.argv)`
 *
 * @example
 * ```bash
 * npx playwright-praman init
 * npx playwright-praman doctor
 * npx playwright-praman --help
 * npx playwright-praman --version
 * ```
 */
export async function main(argv: readonly string[]): Promise<void>;

// Self-executing when run as script (bin entry point):
// main(process.argv).catch((error) => { console.error(error); process.exit(1); });
````

**Routing**:

```typescript
const command = argv[2]; // npx playwright-praman <command>
switch (command) {
  case 'init':
    return runInit(argv.slice(3));
  case 'doctor':
    return runDoctor();
  case 'uninstall':
    return runUninstall(parseUninstallArgs(argv.slice(3)));
  case '--help':
    return printHelp();
  case '--version':
    return printVersion();
  default:
    return printHelp();
}
```

**package.json changes** (explicit modification step):

1. Add `bin` field:

```json
{
  "bin": {
    "playwright-praman": "./dist/cli/index.js"
  }
}
```

2. The `bin` entry point MUST have a shebang (`#!/usr/bin/env node`) as the first line of the compiled output. Since tsup handles this via the `banner` option or the source file can include a shebang comment that tsup preserves, add to `tsup.config.ts`:

```typescript
// For CLI entry point only:
banner: {
  js: '#!/usr/bin/env node';
}
```

**Note**: The CLI is NOT a sub-path export — it is only used via the `bin` entry. Users invoke it as `npx playwright-praman init`, not `import { main } from 'playwright-praman/cli'`.

### 9.10 Script: `scripts/generate-json-schema.ts` (Replace Stub)

**Current**: 4 LOC placeholder.
**Target**: ~50 LOC
**Reference**: dhikraft uses `zod-to-json-schema`

```typescript
/**
 * Generates JSON Schema from the Praman Zod config schema.
 *
 * @remarks
 * Uses `zod-to-json-schema` to convert `PramanConfigSchema` into a
 * JSON Schema Draft 7 document. Output: `dist/praman-config.schema.json`.
 *
 * IDEs (VS Code, JetBrains) can use this schema for autocomplete
 * and validation in `praman.config.json` files.
 *
 * Run: `npx tsx scripts/generate-json-schema.ts`
 */
```

**Implementation**:

1. Import `PramanConfigSchema` from `src/core/config/schema.ts`
2. Import `zodToJsonSchema` from `zod-to-json-schema`
3. Convert: `const jsonSchema = zodToJsonSchema(PramanConfigSchema, 'PramanConfig')`
4. Write: `dist/praman-config.schema.json`
5. Log: schema size, field count

**Dependency**: `zod-to-json-schema` (already in devDependencies).

---

## 10. Complete File Inventory

### 10.1 Modified Files

| File                                   | Sub-Phase | Change                                                                           | Est. LOC Delta   |
| -------------------------------------- | --------- | -------------------------------------------------------------------------------- | ---------------- |
| `.cspell.json`                         | 6.1       | Add SAP terms, add override for method-blacklist files                           | +15              |
| `knip.config.ts`                       | 6.1       | Clean up config per knip suggestions                                             | ~0 (restructure) |
| `src/fixtures/ui5-handler.ts`          | 6.2, 6.3  | Add `@ui5Step`, add tracer                                                       | +20              |
| `src/core/utils/step-decorator.ts`     | 6.2       | Enhance: 79 → ~220 LOC                                                           | +140             |
| `src/fixtures/shell-handler.ts`        | 6.2       | Add `@ui5Step` to 3 methods                                                      | +5               |
| `src/fixtures/footer-handler.ts`       | 6.2       | Add `@ui5Step` to 6 public async methods                                         | +8               |
| `src/ai/agentic-handler.ts`            | 6.2       | Add `@ui5Step` to 3 methods                                                      | +5               |
| `src/auth/auth-handler.ts`             | 6.2       | Add `@ui5Step` to 4 methods                                                      | +6               |
| `src/fixtures/core-fixtures.ts`        | 6.3       | Pass tracer to UI5Handler                                                        | +2               |
| `src/reporters/index.ts`               | 6.4       | Update barrel with reporter exports                                              | +8               |
| `src/cli/index.ts`                     | 6.5       | Transform from empty barrel to CLI entry point (bin only, NOT a sub-path export) | +45              |
| `src/vocabulary/vocabulary-matcher.ts` | 6.1       | Fix `vendro` typo                                                                | +0               |
| `package.json`                         | 6.5       | Add `bin` field for CLI entry point                                              | +3               |
| `tsup.config.ts`                       | 6.5       | Add CLI entry point with shebang banner                                          | +5               |

### 10.2 New Files

| File                                    | Sub-Phase | Purpose                           | Est. LOC |
| --------------------------------------- | --------- | --------------------------------- | -------- |
| `src/reporters/compliance-reporter.ts`  | 6.4       | Compliance reporter               | ~180     |
| `src/reporters/odata-trace-reporter.ts` | 6.4       | OData trace reporter              | ~200     |
| `src/cli/logger.ts`                     | 6.5       | CLI colored output                | ~80      |
| `src/cli/validator.ts`                  | 6.5       | Pre-flight validation             | ~120     |
| `src/cli/init.ts`                       | 6.5       | Project scaffolding               | ~150     |
| `src/cli/doctor.ts`                     | 6.5       | Health check                      | ~100     |
| `src/cli/version.ts`                    | 6.5       | Package version + template root   | ~60      |
| `src/cli/ide-detector.ts`               | 6.5       | IDE detection by marker files     | ~100     |
| `src/cli/scaffolder.ts`                 | 6.5       | Template file copy engine         | ~170     |
| `src/cli/uninstall.ts`                  | 6.5       | Clean removal of scaffolded files | ~200     |

### 10.3 New Test Files

| File                                                              | Sub-Phase | Coverage Target                           | Est. LOC |
| ----------------------------------------------------------------- | --------- | ----------------------------------------- | -------- |
| `tests/unit/core/utils/step-decorator.test.ts`                    | 6.2       | ENHANCE existing (63 → ~250 LOC)          | +190     |
| `tests/unit/reporters/compliance-reporter.test.ts`                | 6.4       | 95% (Tier 2 — public API sub-path export) | ~150     |
| `tests/unit/reporters/odata-trace-reporter.test.ts`               | 6.4       | 95% (Tier 2 — public API sub-path export) | ~150     |
| `tests/unit/cli/logger.test.ts`                                   | 6.5       | 90% (Tier 3)                              | ~80      |
| `tests/unit/cli/validator.test.ts`                                | 6.5       | 90% (Tier 3)                              | ~100     |
| `tests/unit/cli/init.test.ts`                                     | 6.5       | 90% (Tier 3)                              | ~120     |
| `tests/unit/cli/doctor.test.ts`                                   | 6.5       | 90% (Tier 3)                              | ~80      |
| `tests/unit/cli/version.test.ts`                                  | 6.5       | 90% (Tier 3)                              | ~50      |
| `tests/unit/cli/ide-detector.test.ts`                             | 6.5       | 90% (Tier 3)                              | ~80      |
| `tests/unit/cli/scaffolder.test.ts`                               | 6.5       | 90% (Tier 3)                              | ~120     |
| `tests/unit/cli/uninstall.test.ts`                                | 6.5       | 90% (Tier 3)                              | ~100     |
| `tests/integration/core/utils/step-decorator.integration.spec.ts` | 6.2       | Integration                               | ~100     |

### 10.3a New Test Helper Files (Pre-Batch Work)

| File                                        | Purpose                                               | Est. LOC |
| ------------------------------------------- | ----------------------------------------------------- | -------- |
| `tests/helpers/mock-tracer-wrapper.ts`      | Mock TracerWrapper for telemetry tests                | ~40      |
| `tests/helpers/mock-playwright-reporter.ts` | Mock TestResult/TestCase factories for reporter tests | ~60      |
| `tests/helpers/mock-filesystem.ts`          | Mock node:fs/promises for CLI tests                   | ~40      |
| `tests/helpers/mock-test-step.ts`           | Mock test.step()/test.info() for decorator tests      | ~30      |

### 10.4 Deleted Files

None — no files deleted in Phase 6.

### 10.5 Script Files (Modified)

| File                              | Sub-Phase | Change                                         |
| --------------------------------- | --------- | ---------------------------------------------- |
| `scripts/generate-json-schema.ts` | 6.5       | Replace 4 LOC stub with ~50 LOC implementation |
| `scripts/generate-sbom.ts`        | 6.3       | Replace 4 LOC stub with ~60 LOC implementation |

---

## 11. Test Plan

### 11.1 Step Decorator Tests (Enhanced)

**File**: `tests/unit/core/utils/step-decorator.test.ts`
**Coverage**: Tier 2 (95%) — core utility

| Test                                                                               | What it verifies                                                                      |
| ---------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------- |
| `isInsideTestContext` returns false in Vitest                                      | Graceful degradation outside Playwright                                               |
| `formatSelectorForStep` handles null/undefined                                     | Returns empty string                                                                  |
| `formatSelectorForStep` handles string input                                       | Returns quoted string                                                                 |
| `formatSelectorForStep` handles primitive input                                    | Returns String(value)                                                                 |
| `formatSelectorForStep` extracts id                                                | `{ id: "save" }`                                                                      |
| `formatSelectorForStep` shortens controlType                                       | `sap.m.Button` → `type: "Button"`                                                     |
| `formatSelectorForStep` extracts properties.text                                   | `text: "Save"`                                                                        |
| `formatSelectorForStep` falls back to first 3 keys                                 | Non-standard objects                                                                  |
| `formatSelectorForStep` handles empty object                                       | Returns `'{}'`                                                                        |
| `generateStepName` maps known actions                                              | `click` → `'Click { id: "save" }'`                                                    |
| `generateStepName` PascalCases unknown actions                                     | `customAction` → `'CustomAction'`                                                     |
| `generateStepName` formats selector argument                                       | First arg is selector                                                                 |
| `generateStepName` handles no-arg methods                                          | `destroy` → `'Destroy handler'`                                                       |
| `generateStepName` handles string arguments                                        | `fill(selector, 'value')`                                                             |
| `isInsideTestContext` returns false when test.info() throws                        | Non-Playwright runtime                                                                |
| `isInsideTestContext` handles undefined test.info() return                         | Null safety (P5)                                                                      |
| `formatSelectorForStep` handles nested selector `{ properties: { text: "Save" } }` | Nested object extraction (T2)                                                         |
| `formatSelectorForStep` handles RegExp values                                      | RegExp formatted as `/<source>/<flags>` (T2)                                          |
| `formatSelectorForStep` handles selector with only `properties` key                | Properties-only selector (T2)                                                         |
| `formatSelectorForStep` handles array values in selector                           | Array-valued properties (T2)                                                          |
| `formatSelectorForStep` handles circular references                                | WeakSet guard prevents infinite loop (T2, P12)                                        |
| `generateStepName` maps ALL ACTION_MAP entries correctly                           | Exhaustive map validation (T9)                                                        |
| `generateStepName` PascalCases unknown camelCase actions                           | `customMethodName` → `"Custom method name"` (T3)                                      |
| `generateStepName` handles empty string method name                                | Edge case: empty method (T3)                                                          |
| `generateStepName` handles single-word method name                                 | `destroy` → `"Destroy handler"` (T3)                                                  |
| `generateStepName` handles method name with numbers                                | `waitFor2ndControl` edge case (T3)                                                    |
| `generateStepName` preserves acronyms in method name                               | `getODataEntity` handling (T3)                                                        |
| `generateStepName` handles methods from all 5 handlers                             | Cross-handler coverage (T3)                                                           |
| `ACTION_MAP` covers all public async handler methods                               | Completeness: 14 UI5 + 3 Shell + 6 Footer + 3 Agentic + 4 Auth = 30 methods (T9, P13) |
| `ui5Step` decorator calls target method                                            | Return value preserved                                                                |
| `ui5Step` decorator propagates sync errors from async method                       | Error bubbles through test.step() (T1, T13)                                           |
| `ui5Step` decorator propagates rejection from async method                         | Promise rejection not swallowed (T1, T13)                                             |
| `ui5Step` decorator propagates errors when test.step() throws                      | Fallback to direct call on hook context (T1, P3)                                      |
| `ui5Step` decorator preserves error type (not wrapped)                             | Original error class preserved (T1, T13)                                              |
| `ui5Step` decorator preserves `this` context                                       | Class instance accessible                                                             |
| `ui5Step` decorator degrades outside test context                                  | Calls target directly                                                                 |
| `ui5Step` decorator degrades in beforeAll/afterAll hooks                           | Falls back to direct invocation (P3)                                                  |
| `ui5Step` rejects sync methods at type level                                       | `Return extends Promise<unknown>` constraint (P2)                                     |
| `withStep` adds `{ box: true }`                                                    | Boxed step in trace                                                                   |
| `withStep` uses isInsideTestContext                                                | Consistent detection                                                                  |
| `withStep` propagates errors from fn                                               | Error not swallowed (T1)                                                              |
| `createStepName` unchanged behavior                                                | Backward compatibility                                                                |

### 11.1a Mock Strategies and Test Helpers (Pre-Batch Work)

**Decision (T21)**: Use `vi.mock('@playwright/test')` for unit tests, real Playwright for integration tests. This hybrid approach is required because:

- Unit tests run in Vitest (no Playwright test runner)
- `test.info()`, `test.step()` are only available inside Playwright's test runner
- Unit tests must mock these to verify decorator behavior

**Mock strategy for `@playwright/test` in Vitest**:

```typescript
// In unit test files that test step-decorator.ts:
vi.mock('@playwright/test', () => ({
  test: {
    info: vi.fn(), // Returns mock TestInfo or throws
    step: vi.fn(), // Records step name + calls fn
  },
}));
```

**Required test helper files** (T12):

| Helper File                                 | Purpose                                                                                                                                              |
| ------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| `tests/helpers/mock-tracer-wrapper.ts`      | Mock `TracerWrapper` that records span names, attributes, and status. Implements the `TracerWrapper` interface with `vi.fn()` stubs. (T14)           |
| `tests/helpers/mock-playwright-reporter.ts` | Mock Playwright `TestResult` and `TestCase` objects for reporter unit tests. Includes factory for `result.steps[]` with nested step structures. (T5) |
| `tests/helpers/mock-filesystem.ts`          | Mock `node:fs/promises` for CLI init/doctor tests. Tracks written files and their contents. (T6)                                                     |
| `tests/helpers/mock-test-step.ts`           | Mock `test.step()` and `test.info()` for decorator unit tests. Supports configuring throw behavior for hook context simulation.                      |

**TracerWrapper mock factory** (T14):

```typescript
export function createMockTracer(): TracerWrapper & {
  spans: Array<{ name: string; attributes: Record<string, unknown>; status: string }>;
} {
  const spans: Array<{ name: string; attributes: Record<string, unknown>; status: string }> = [];
  return {
    spans,
    startSpan(name) {
      /* record and return mock span */
    },
    async withSpan(name, fn) {
      spans.push({ name, attributes: {}, status: 'ok' });
      return fn();
    },
    recordException() {
      /* ... */
    },
    async shutdown() {
      /* ... */
    },
  };
}
```

**Handler test execution model** (T7): Handler tests (verifying `@ui5Step` integration) use **unit tests with `vi.mock`** for the decorator-specific behavior, NOT integration tests. The decorator is a transparent wrapper — existing handler unit tests (which mock `page.evaluate()`) continue to work unchanged because `isInsideTestContext()` returns `false` in Vitest and the decorator becomes a no-op.

**Reporter mock strategy** (T5): Reporter tests create mock `TestResult` objects with pre-populated `steps[]` arrays. The reporter methods are called directly (no Playwright test runner needed):

```typescript
const reporter = new ComplianceReporter(options);
reporter.onBegin(mockConfig, mockSuite);
reporter.onTestEnd(mockTest, mockResultWithSteps);
await reporter.onEnd(mockFullResult);
// Assert: output file written with correct compliance data
```

**File system mock strategy for CLI** (T6): Use `vi.mock('node:fs/promises')` to intercept `writeFile`, `mkdir`, `access` calls. Verify correct paths and content without touching the real filesystem.

### 11.1b Step Decorator Integration Tests (Playwright Runner)

**File**: `tests/integration/core/utils/step-decorator.integration.spec.ts`
**Coverage**: Integration coverage (supplements unit tests for real Playwright behavior)
**Runner**: `@playwright/test` (NOT Vitest)

| Test                                                        | What it verifies                               |
| ----------------------------------------------------------- | ---------------------------------------------- |
| `ui5Step` decorator creates named step in Playwright trace  | Real `test.step()` called with correct name    |
| `ui5Step` decorator creates boxed step with `{ box: true }` | Step appears collapsed in trace viewer         |
| `withStep` creates named step in Playwright test            | Real `test.step()` wrapping                    |
| Step names appear correctly in test results                 | `result.steps[].title` matches generated name  |
| Nested steps from handler calls stack correctly             | Outer handler step contains inner bridge steps |
| Decorator degrades gracefully in globalSetup                | No error when called outside test body         |

**Note**: These tests run via `npx playwright test` (not `npm run test:unit`). Added to CI as separate integration test step.

### 11.2 Handler Wiring Tests

**Strategy**: Existing handler tests must pass unchanged. New tests verify step names appear.

For each handler, add 1-2 tests verifying decorator doesn't break existing behavior:

| Handler        | Test                          | What it verifies             |
| -------------- | ----------------------------- | ---------------------------- |
| UI5Handler     | Existing 40+ tests still pass | No regression from decorator |
| ShellHandler   | Existing tests still pass     | No regression                |
| FooterHandler  | Existing tests still pass     | No regression                |
| AgenticHandler | Existing tests still pass     | No regression                |
| SAPAuthHandler | Existing tests still pass     | No regression                |

### 11.3 Telemetry Wiring Tests

| Test                                              | What it verifies                   |
| ------------------------------------------------- | ---------------------------------- |
| UI5Handler accepts TracerWrapper option           | Constructor DI works               |
| UI5Handler defaults to NoOpTracer                 | No tracer = no-op                  |
| Span created for control discovery                | `praman.ui5.findControl` span name |
| Span attributes include selector fields           | `ui5.controlType`, `ui5.id`        |
| Span records exception on error                   | Error propagated + recorded        |
| Span `ui5.controlType` attribute is set on click  | Selector controlType in span (T4)  |
| Span `ui5.id` attribute is set on control()       | Control ID in span (T4)            |
| Span `ui5.timeout` attribute is set on waitForUI5 | Timeout value recorded (T4)        |
| Span `ui5.value` attribute is redacted on fill    | No plaintext values in spans (T4)  |
| Span status is 'error' when method throws         | Error status propagation (T4)      |

### 11.4 Reporter Tests

| Test                                        | What it verifies       |
| ------------------------------------------- | ---------------------- |
| ComplianceReporter implements Reporter      | Interface contract     |
| ComplianceReporter categorizes Praman steps | Step title matching    |
| ComplianceReporter categorizes raw steps    | Non-Praman steps       |
| ComplianceReporter calculates percentage    | Math correctness       |
| ComplianceReporter writes JSON output       | File I/O               |
| ODataTraceReporter detects OData URLs       | URL pattern matching   |
| ODataTraceReporter extracts entity set      | URL parsing            |
| ODataTraceReporter extracts query params    | $filter, $expand, etc. |
| ODataTraceReporter aggregates stats         | Per-entity-set rollup  |
| ODataTraceReporter writes JSON output       | File I/O               |

### 11.5 CLI Tests

| Test                                            | What it verifies                 |
| ----------------------------------------------- | -------------------------------- |
| `logStep` formats numbered progress             | `[1/5] message`                  |
| `logSuccess` uses green                         | ANSI code check                  |
| `logError` uses red                             | ANSI code check                  |
| Validator checks Node.js version                | Semver comparison                |
| Validator checks npm availability               | execSync mock                    |
| Validator returns structured report             | ValidationReport shape           |
| Init creates playwright.config.ts               | File written                     |
| Init creates praman.config.ts                   | File written                     |
| Init detects VS Code                            | Marker file check                |
| Doctor displays all check results               | Table output                     |
| Doctor exits 0 on all pass                      | Exit code                        |
| Doctor exits 1 on failure                       | Exit code                        |
| CLI routes `init` command                       | argv parsing                     |
| CLI routes `doctor` command                     | argv parsing                     |
| CLI shows help for unknown                      | Fallback                         |
| `getPackageRoot` resolves from import.meta.url  | Cross-platform path              |
| `getVersion` reads package.json version         | Cached read                      |
| `getVersion` returns fallback on error          | Graceful degradation             |
| `detectIDEs` finds VS Code markers              | `.vscode/` directory check       |
| `detectIDEs` finds Claude markers               | `CLAUDE.md` file check           |
| `detectIDEs` returns all false when no markers  | Clean project                    |
| `detectIDEs` env var fallback                   | `TERM_PROGRAM` check             |
| `scaffold` copies core template files           | File creation                    |
| `scaffold` skips existing files without force   | Skip logic                       |
| `scaffold` overwrites with force flag           | Force mode                       |
| `scaffold` handles IDE-conditional files        | Only copies matching IDE configs |
| `getScaffoldedFiles` lists all scaffolded files | Manifest generation              |
| `runUninstall` dry-run shows manifest           | No files deleted                 |
| `runUninstall` with confirm removes files       | Files deleted                    |
| `runUninstall` protects .env and tests/         | Protected files untouched        |
| `runUninstall` cleans empty directories         | Bottom-up cleanup                |
| CLI routes `uninstall` command                  | argv parsing                     |

---

## 12. Quality Gates Per Sub-Phase

### Gate 6.1 — CI/CD Fix

```bash
npm run lint           # 0 errors, 0 warnings
npm run typecheck      # 0 errors
npm run test:unit      # All 2,640+ tests pass
npm run build          # ESM + CJS build succeeds
npx knip               # 0 issues (or only documented exceptions)
npx cspell "src/**/*.ts" --no-progress  # 0 issues
```

### Gate 6.2 — Step Decorator

```bash
npm run ci             # lint + typecheck + test + build
# All existing 2,640+ tests still pass (NO regressions)
# New step-decorator tests pass
# Coverage on step-decorator.ts ≥ 95% (Tier 2)
```

### Gate 6.3 — Telemetry + SBOM

```bash
npm run ci             # lint + typecheck + test + build
npx tsx scripts/generate-sbom.ts  # Produces dist/sbom.json
# Telemetry tests pass with mock tracer
```

### Gate 6.4 — Reporters

```bash
npm run ci             # lint + typecheck + test + build
npm run check:exports  # reporters/ sub-path resolves correctly
# Reporter tests pass (≥ 95% coverage — Tier 2, public API sub-path export)
```

### Gate 6.5 — CLI + Scripts

```bash
npm run ci             # lint + typecheck + test + build
npm run check:exports  # All 6 sub-path exports resolve
npx tsx scripts/generate-json-schema.ts  # Produces dist/praman-config.schema.json
# CLI tests pass (≥ 90% coverage)
```

---

## 13. Risk Register

| #   | Risk                                              | Impact                                   | Mitigation                                                                                      |
| --- | ------------------------------------------------- | ---------------------------------------- | ----------------------------------------------------------------------------------------------- |
| R1  | TC39 decorators require TS 5.0+                   | Build failure if TS < 5.0                | Verify: `npx tsc --version` ≥ 5.0. Project already uses TS 5.x.                                 |
| R2  | `@ui5Step` breaks existing unit tests             | All 2,640 tests fail                     | Decorator calls `isInsideTestContext()` → returns false in Vitest → no wrapping → transparent   |
| R3  | `test.step()` import fails at module level        | Runtime error in non-Playwright contexts | Use `isInsideTestContext()` guard before calling `test.step()`. Import `test` only when needed. |
| R4  | Knip false positives on public API types          | Types deleted that consumers need        | Mark public API types with knip ignore. Do NOT delete fixture type exports.                     |
| R5  | CLI `process.argv` parsing edge cases             | Wrong subcommand routed                  | Unit test argv parsing with various inputs including `--flags`.                                 |
| R6  | `zod-to-json-schema` version incompatibility      | JSON Schema generation fails             | Pin version. Test in CI. Already in devDependencies.                                            |
| R7  | CycloneDX npm not available in CI                 | SBOM generation fails                    | Add `@cyclonedx/cyclonedx-npm` as devDependency. Check availability before running.             |
| R8  | Telemetry wiring adds overhead even when disabled | Performance regression                   | NoOpTracer.withSpan() is zero-overhead (calls fn directly). Benchmark confirms.                 |
| R9  | Reporter file I/O fails in CI (permissions)       | Report not written                       | Use `node:fs/promises` with error handling. Write to configurable output dir.                   |

---

## 14. Implementation Batching

### 14.0 Pre-Batch — Test Helpers

| Batch  | Scope                                                                                                                          | Est. Agent Tokens | Depends On |
| ------ | ------------------------------------------------------------------------------------------------------------------------------ | ----------------- | ---------- |
| **B0** | Create 4 test helper files: `mock-test-step.ts`, `mock-tracer-wrapper.ts`, `mock-playwright-reporter.ts`, `mock-filesystem.ts` | ~12K              | None       |

### 14.1 Sub-Phase 6.1 — CI/CD Fix Batches

| Batch   | Scope (1 file + 1 test)                                         | Est. Agent Tokens | Depends On |
| ------- | --------------------------------------------------------------- | ----------------- | ---------- |
| **B1a** | `.cspell.json` + `vocabulary-matcher.ts` typo fix               | ~8K               | None       |
| **B1b** | `knip.config.ts` cleanup + unused export triage                 | ~10K              | None       |
| **B1c** | CI gate: `npm run ci` + `npx knip` + `npx cspell "src/**/*.ts"` | ~5K               | B1a, B1b   |

### 14.2 Sub-Phase 6.2 — Step Decorator Batches

| Batch   | Scope (1 file + 1 test)                                                                          | Est. Agent Tokens | Depends On |
| ------- | ------------------------------------------------------------------------------------------------ | ----------------- | ---------- |
| **B2a** | `step-decorator.ts` — `isInsideTestContext()` ONLY + unit tests                                  | ~15K              | B0, B1c    |
| **B2b** | `step-decorator.ts` — `formatSelectorForStep()` + `generateStepName()` + ACTION_MAP + unit tests | ~20K              | B2a        |
| **B2c** | `step-decorator.ts` — `ui5Step` TC39 decorator + `withStep()` refactor + unit tests              | ~20K              | B2a, B2b   |
| **B2d** | `ui5-handler.ts` — wire `@ui5Step` to 14 async methods                                           | ~12K              | B2c        |
| **B2e** | `shell-handler.ts` — wire `@ui5Step` to 3 methods                                                | ~10K              | B2c        |
| **B2f** | `footer-handler.ts` — wire `@ui5Step` to 6 public methods                                        | ~10K              | B2c        |
| **B2g** | `agentic-handler.ts` — wire `@ui5Step` to 3 methods                                              | ~10K              | B2c        |
| **B2h** | `auth-handler.ts` — wire `@ui5Step` to 4 methods                                                 | ~10K              | B2c        |
| **B2i** | `step-decorator.integration.spec.ts` — Playwright integration tests                              | ~15K              | B2d-h      |
| **B2j** | CI gate: verify all tests pass + new tests + coverage >= 95% on step-decorator.ts                | ~5K               | B2i        |

### 14.3 Sub-Phase 6.3 — Telemetry + SBOM Batches

| Batch   | Scope (1 file + 1 test)                                         | Est. Agent Tokens | Depends On |
| ------- | --------------------------------------------------------------- | ----------------- | ---------- |
| **B3a** | `ui5-handler.ts` — add `TracerWrapper` option + telemetry tests | ~18K              | B2j        |
| **B3b** | `core-fixtures.ts` — pass tracer to UI5Handler                  | ~10K              | B3a        |
| **B3c** | `scripts/generate-sbom.ts` — implement SBOM generation          | ~12K              | B1c        |
| **B3d** | CI gate: `npm run ci` + SBOM generation test                    | ~5K               | B3a-c      |

### 14.4 Sub-Phase 6.4 — Reporter Batches

| Batch   | Scope (1 file + 1 test)                          | Est. Agent Tokens | Depends On |
| ------- | ------------------------------------------------ | ----------------- | ---------- |
| **B4a** | `reporters/compliance-reporter.ts` + unit tests  | ~20K              | B0, B1c    |
| **B4b** | `reporters/odata-trace-reporter.ts` + unit tests | ~20K              | B0, B1c    |
| **B4c** | `reporters/index.ts` barrel update + CI gate     | ~8K               | B4a, B4b   |

### 14.5 Sub-Phase 6.5 — CLI + Scripts Batches

| Batch   | Scope (1 file + 1 test)                                         | Est. Agent Tokens | Depends On              |
| ------- | --------------------------------------------------------------- | ----------------- | ----------------------- |
| **B5a** | `cli/logger.ts` + unit tests                                    | ~12K              | B1c                     |
| **B5b** | `cli/version.ts` + unit tests                                   | ~10K              | B1c                     |
| **B5c** | `cli/ide-detector.ts` + unit tests                              | ~12K              | B1c                     |
| **B5d** | `cli/validator.ts` + unit tests                                 | ~15K              | B1c                     |
| **B5e** | `cli/scaffolder.ts` + unit tests                                | ~18K              | B5b, B5c                |
| **B5f** | `cli/init.ts` + unit tests                                      | ~18K              | B5a, B5b, B5c, B5d, B5e |
| **B5g** | `cli/doctor.ts` + unit tests                                    | ~15K              | B5a, B5d                |
| **B5h** | `cli/uninstall.ts` + unit tests                                 | ~18K              | B5a, B5b, B5c, B5e      |
| **B5i** | `cli/index.ts` entry point + routing + unit tests               | ~12K              | B5f, B5g, B5h           |
| **B5j** | `scripts/generate-json-schema.ts` — replace stub                | ~10K              | B1c                     |
| **B5k** | `package.json` bin field + `tsup.config.ts` CLI entry + shebang | ~8K               | B5i                     |
| **B5l** | CI gate: `npm run ci` + `npm run check:exports`                 | ~5K               | B5k, B5j                |

### 14.6 Token Budget Summary

| Sub-Phase            | Batches | Total Est. Agent Tokens | Max Parallel Agents |
| -------------------- | ------- | ----------------------- | ------------------- |
| Pre-batch            | 1       | 12K                     | 1                   |
| 6.1 CI/CD            | 3       | 23K                     | 2                   |
| 6.2 Step Decorator   | 10      | 127K                    | 5 (Wave 6)          |
| 6.3 Telemetry + SBOM | 4       | 45K                     | 1                   |
| 6.4 Reporters        | 3       | 48K                     | 2                   |
| 6.5 CLI + Scripts    | 12      | 153K                    | 4 (Wave 3)          |
| **TOTAL**            | **33**  | **~408K**               | **9 (Wave 3 peak)** |

**Context Window Safety**: Each agent batch stays well under 200K token limit. Largest batch (B2b, B2c, B4a, B4b) estimated at ~20K agent tokens. With CLAUDE.md (~3K) + skill files (~5K) + source context (~5K), total per-agent is ~33K — safe margin of 6x under the 200K limit.

### 14.7 Parallel Agent Delivery Schedule

```text
Wave 1 (start):           B0, B1a, B1b                          [3 agents — test helpers + CI fix]
Wave 2 (after B1c):       B1c                                    [1 agent — CI gate verification]
Wave 3 (after B1c):       B2a, B3c, B4a, B4b, B5a, B5b, B5c,   [9 agents — maximum parallelism!
                           B5d, B5j                                reporters + CLI utils + SBOM + decorator start]
Wave 4 (after B2a):       B2b, B4c, B5e, B5g                    [4 agents]
Wave 5 (after B2b):       B2c, B5f, B5h                         [3 agents]
Wave 6 (after B2c):       B2d, B2e, B2f, B2g, B2h, B5i          [6 agents — handler wiring + CLI entry]
Wave 7 (after B2d-h):     B2i, B3a, B5k                         [3 agents — integration tests + telemetry + pkg]
Wave 8 (after all):       B2j, B3b, B3d, B5l                    [4 agents — all CI gates]
```

**8 waves total. Max 9 parallel agents in Wave 3.**

**Critical Path** (longest sequential chain, 10 steps):

```text
B0 → B1c → B2a → B2b → B2c → B2d → B2i → B2j → B3a → B3d  (10 steps)
```

### 14.8 Batching Rules

1. **1 source file + 1 test file per batch** — never more than ~300 LOC total per batch
2. **Each batch MUST produce compilable code** — `npm run typecheck` passes after each batch
3. **Test files ship WITH source files** in the same batch (TDD: RED -> GREEN -> REFACTOR)
4. **CI gate** runs at end of each sub-phase (B1c, B2j, B3d, B4c, B5l)
5. **Handler wiring batches** (B2d-h) only add `@ui5Step` decorators + import — minimal diff
6. **Regression check**: After every handler wiring batch, run ALL existing tests — zero regressions
7. **Agent token budget**: No single batch should require > 25K agent tokens
8. **Context safety**: Each agent reads at most 3 source files + 1 test file + CLAUDE.md + 1 skill file

---

## Appendix A — Phase 7 Remaining (After Phase 6)

Items that remain in Phase 7 after Phase 6 pull-forward:

| Task                                      | Notes                                                     |
| ----------------------------------------- | --------------------------------------------------------- |
| DELETE step-decorator dead code (~87 LOC) | No longer dead after Phase 6 wiring! Remove from Phase 7. |
| INT1: Bridge integration smoke            | Needs real SAP demo apps                                  |
| INT2: Proxy integration smoke             | Needs real SAP cloud                                      |
| Behavioral equivalence tests              | Golden master tests vs. wdi5                              |
| Performance benchmarks                    | Bridge injection, discovery, method call latency          |
| Security audit                            | Final Snyk + npm audit review                             |
| Migration guide                           | Docusaurus page: v2.5.0 → v3.0                            |
| CLI `uninstall` command                   | ~~Deferred~~ -> **Moved to Phase 6** (W13)                |
| CSP assessment                            | Document CSP dependency; `respectCSP` config placeholder  |
| Docusaurus site                           | Full documentation site                                   |
| TypeDoc generation                        | API reference                                             |
| npm provenance                            | `--provenance` publish                                    |

---

<!-- End of Phase 6 Plan v1.0.0 -->
