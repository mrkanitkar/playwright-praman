# Phase 5 — AI + Intents + Vocabulary: Detailed Implementation Plan

> **Version**: 1.0.0
> **Status**: COMPLETE — 2026-02-20
> **Completion Date**: 2026-02-20
> **Final Test Count**: 2,397 tests (406 new tests added in Phase 5)
> **Parent**: plan.md v4.0.0 (Phase 4 COMPLETE — 1,991 tests, 129 source files, 98.91%)
> **Duration**: 3 weeks (4 batches — A+B parallel in Week 1, C in Week 2, D in Week 3)
> **Approach**: TDD (tests first — RED → GREEN → REFACTOR)
> **Predecessor**: Phase 4 complete (Table, Dialog, Date, OData, FE modules + fixtures)
> **Audits informing this plan**: `plans/praman_aiaudit.md`, `plans/dhikraftaiaudit.md`

---

## Table of Contents

1. [Decision Log (Wizard Answers)](#1-decision-log-wizard-answers)
2. [Batch Breakdown](#2-batch-breakdown)
3. [Dependency Graph](#3-dependency-graph)
4. [Scope Changes to Phase 6 and Phase 7](#4-scope-changes-to-phase-6-and-phase-7)
5. [Batch A — Prerequisites + API Hygiene](#5-batch-a--prerequisites--api-hygiene)
6. [Batch B — SKILL.md + Capability Manifest](#6-batch-b--skillmd--capability-manifest)
7. [Batch C — AI Core + Vocabulary](#7-batch-c--ai-core--vocabulary)
8. [Batch D — Intents (Procurement + Sales)](#8-batch-d--intents-procurement--sales)
9. [Complete File Inventory](#9-complete-file-inventory)
10. [Test Plan](#10-test-plan)
11. [Quality Gates Per Batch](#11-quality-gates-per-batch)
12. [Risk Register](#12-risk-register)
13. [Barrel Updates](#13-barrel-updates)
14. [API References](#14-api-references)
15. [Implementation Batching & Parallelization](#15-implementation-batching--parallelization)

---

## 1. Decision Log (Wizard Answers)

All decisions made during the planning wizard — binding for Phase 5 implementation.

| #   | Question                      | Decision                                                                                                                                                                                                  | Rationale                                                                                                                                                                                                              |
| --- | ----------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| W1  | Pre-requisite fixes scope     | **Absorb into Phase 5 Batch A**                                                                                                                                                                           | 8 BLOCKING issues from praman_aiaudit.md must be fixed before AI layer works. AI agents calling internal APIs fail at runtime.                                                                                         |
| W2  | LLM provider scope            | **Azure OpenAI + OpenAI only**                                                                                                                                                                            | Match existing Zod config schema exactly. No schema migration needed. Claude/Gemini in Phase 7+.                                                                                                                       |
| W3  | Intent API domains            | **Procurement (MM) + Sales (SD)**                                                                                                                                                                         | Procurement is reference domain; Sales adds common enterprise coverage. 3 remaining (FI, PP, MD) in Phase 7+.                                                                                                          |
| W4  | Reporters timing              | **Phase 6** (unchanged)                                                                                                                                                                                   | Reporters belong with CLI + Docusaurus. Phase 5 focuses on AI + Intents + Vocabulary.                                                                                                                                  |
| W5  | Typed proxy accessors         | **Phase 7** (unchanged)                                                                                                                                                                                   | ui5.button(), ui5.input() etc. are a Phase 7 decision. ui5.control() returns UI5ControlBase for now.                                                                                                                   |
| W6  | Bulk discovery fixture        | **Phase 5 Batch C** (new — dhikraft parity)                                                                                                                                                               | AI agents need page-wide control inventory without knowing selectors. Activates control-types.ts + object-categories.ts dead code.                                                                                     |
| W7  | OData namespace split         | **Phase 7** (unchanged)                                                                                                                                                                                   | API change risk. Leave ui5.odata.\* flat; add TSDoc @remarks to distinguish model vs HTTP in Phase 7.                                                                                                                  |
| W8  | test.step() wiring            | **Phase 7** (unchanged)                                                                                                                                                                                   | step-decorator.ts remains dead code. Phase 7 wires it into AI handler or deletes it.                                                                                                                                   |
| W9  | Vocabulary depth              | **Full dhikraft parity** — 6 domain JSON files + fuzzy matching                                                                                                                                           | Vocabulary is a core differentiator. Half-implementation would be worse than none.                                                                                                                                     |
| W10 | AI fixture API                | **Two fixtures: `pramanAI` + `intent`**                                                                                                                                                                   | BP-PLAYWRIGHT D2: lazy loaded. pramanAI = LLM + registries + agentic + discovery. intent = domain APIs + vocabulary. Composable.                                                                                       |
| W11 | CLI timing                    | **Phase 6** (unchanged)                                                                                                                                                                                   | CLI is a coherent unit with Docusaurus and reporters. Phase 5 has no CLI scope.                                                                                                                                        |
| W12 | SKILL.md format               | **Claude Agent Skills best practices**                                                                                                                                                                    | YAML frontmatter (name + description). Body ≤500 lines. Progressive disclosure via skills/ domain files. One level deep only.                                                                                          |
| W13 | dotenv dependency             | **Move to devDependencies in Batch A** (corrected: H1 review finding)                                                                                                                                     | Library should not force dotenv on consumers. dotenv has zero runtime role in the library — belongs in devDependencies, NOT optionalDependencies. Document env-var pattern without shipping dotenv as hard dependency. |
| W14 | Claude provider in LlmService | **Add Anthropic Claude as third provider** — `provider: 'anthropic'`, `model: 'claude-opus-4-6'` default (configurable), `anthropicApiKey` in config schema. `@anthropic-ai/sdk` in optionalDependencies. |
| W15 | CI integration tests          | **Separate npm script, skip by default** — `npm run test:integration` requires `.env.test`. Not in default CI pipeline. Gracefully skip if env vars missing.                                              |
| W16 | Intent domains scope          | **All 5 domains** — MM (procurement), SD (sales), FI (finance), PP (manufacturing), Master Data. 3 new domains (FI, PP, Master Data) added as D5, D6, D7.                                                 |
| W17 | SKILL.md authoring            | **Auto-generated** from `@capability`, `@intent`, `@recipe` TSDoc tags. Aligned with Claude Agent Skills best practices (≤500 lines, gerund name, third-person description).                              |
| W18 | AI output format              | **Both steps + TypeScript code** — `generateTest()` returns `AiGeneratedTest { steps: string[], code: string, metadata }`. Zod-validated JSON response from LLM.                                          |
| W19 | Capability registry           | **Auto-discovered** from `@capability` TSDoc tags at build time via `scripts/generate-capabilities.ts`. Output: `capability-registry.generated.ts`.                                                       |
| W20 | Recipe registry               | **Auto-discovered** from `@recipe` TSDoc tags at build time via `scripts/generate-recipes.ts`. Output: `recipe-registry.generated.ts`.                                                                    |
| W21 | Integration test config       | **Separate Vitest project** in same `vitest.config.ts` — `name: 'integration'`, 30s timeout, loads `.env.test`. `npm run test:integration` script added.                                                  |
| W22 | Vocabulary porting            | **Port from dhikraft** (Option C hybrid) — copy 6 JSON files + matcher/loader/service, adapt imports to `#vocabulary/*`, replace dhikraft errors with VocabularyError.                                    |
| W23 | Error classes                 | **Batch A0** (before everything) — `AiError`, `VocabularyError`, `IntentError` in `src/core/errors/` with 100% Tier 1 coverage. Prerequisite for all C/D tasks.                                           |

---

## 2. Batch Breakdown

```text
Week 1 (Batches A + B in parallel — independent tracks)
├── Batch A: Prerequisites + API Hygiene
│   ├── A0: Error classes (AiError, VocabularyError, IntentError) — FIRST
│   ├── A1: Extend aiSchema for Azure OpenAI fields
│   ├── A2: Barrel surgery (src/index.ts + src/fe/index.ts)
│   ├── A3: Matcher type augmentation (matchers/types.d.ts)
│   ├── A4: Memory leak fix (objectMapCleanup wiring)
│   ├── A5: Module fixture stability guards
│   ├── A6: Dead code deletion (3 files)
│   ├── A7: Dependency cleanup (dotenv, zod-to-json-schema)
│   └── A8: TSDoc pass (public functions — @capability, @intent, @sapModule)
│
└── Batch B: SKILL.md + Capability Manifest
    ├── B1: Complete scripts/generate-skill-md.ts
    ├── B2: SKILL.md authored + committed
    ├── B3: skills/ domain files (7 domain files)
    └── B4: Capabilities manifest generated + committed

Week 2 (Batch C)
└── Batch C: AI Core + Vocabulary
    ├── C1: src/ai/types.ts — AiResponse<T> envelope (D29)
    ├── C2: src/ai/llm-service.ts — LLM provider abstraction
    ├── C3: src/ai/context-builder.ts — Page state → AI context
    ├── C4: src/ai/capability-registry.ts — AI-queryable capabilities
    ├── C5: src/ai/recipe-registry.ts — Code example registry
    ├── C6: src/ai/bulk-discovery.ts — Page-wide control inventory
    ├── C7: src/ai/agentic-handler.ts — Autonomous operations
    ├── C8: src/ai/index.ts — Public barrel
    ├── C9: src/fixtures/ai-fixtures.ts — pramanAI fixture
    ├── C10: src/vocabulary/types.ts
    ├── C11: src/vocabulary/vocabulary-service.ts
    ├── C12: src/vocabulary/vocabulary-matcher.ts
    ├── C13: src/vocabulary/vocabulary-loader.ts
    ├── C14: src/vocabulary/domains/*.json (6 domain files)
    └── C15: src/vocabulary/index.ts — Public barrel

Week 3 (Batch D)
└── Batch D: Intents (Procurement + Sales + Finance + Manufacturing + Master Data)
    ├── D1: src/intents/types.ts
    ├── D2: src/intents/core-wrappers.ts
    ├── D3: src/intents/domains/procurement.ts
    ├── D4: src/intents/domains/sales.ts
    ├── D5: src/intents/domains/finance.ts (NEW)
    ├── D6: src/intents/domains/manufacturing.ts (NEW)
    ├── D7: src/intents/domains/master-data.ts (NEW)
    ├── D8: src/intents/index.ts — Public barrel
    └── D9: src/fixtures/intent-fixtures.ts — intent fixture
```

### Metrics Projection

| Metric         | Phase 4 End   | Phase 5 Delta              | Phase 5 Target |
| -------------- | ------------- | -------------------------- | -------------- |
| Source files   | 129           | +28 new, -3 dead           | ~154           |
| Source LOC     | 28,935        | +8,000 net                 | ~37,000        |
| Test files     | 109           | +25                        | ~134           |
| Unit tests     | 1,991         | +400                       | ~2,400         |
| Coverage stmts | 98.91%        | maintain ≥98%              | ≥98%           |
| Sub-paths live | 2/6 (main+fe) | +3 (ai+intents+vocabulary) | 5/6            |

---

## 3. Dependency Graph

```text
Phase 5 Dependency Order (must implement in this sequence)

Batch A (Week 1) — No new code dependencies; fixes existing code
  ├── A0 must complete first (error classes prerequisite)
  ├── A1–A8 are all independent after A0, run in parallel

Batch B (Week 1, parallel to A) — No code dependencies on A
  ├── B1–B4 are independent from A

Batch C (Week 2) — Depends on Batch A completion
  ├── C1 (ai/types.ts)               ← no internal deps
  ├── C2 (llm-service.ts)            ← depends on C1, core/config/schema.ts
  ├── C3 (context-builder.ts)        ← depends on C1, bulk-discovery (C6)
  ├── C4 (capability-registry.ts)    ← depends on C1
  ├── C5 (recipe-registry.ts)        ← depends on C1
  ├── C6 (bulk-discovery.ts)         ← depends on C1, control-types.ts, object-categories.ts
  ├── C7 (agentic-handler.ts)        ← depends on C1, C2, C3, C4, C5
  ├── C8 (ai/index.ts)               ← depends on all C1-C7
  ├── C9 (ai-fixtures.ts)            ← depends on C8, module-fixtures.ts (extends moduleTest, NOT coreTest — B3 fix)
  ├── C10 (vocabulary/types.ts)      ← no internal deps
  ├── C11 (vocabulary-service.ts)    ← depends on C10, C12, C13
  ├── C12 (vocabulary-matcher.ts)    ← depends on C10
  ├── C13 (vocabulary-loader.ts)     ← depends on C10
  ├── C14 (domains/*.json)           ← no code deps
  └── C15 (vocabulary/index.ts)      ← depends on C10-C13

Batch D (Week 3) — Depends on Batch C (vocabulary) + Batch A (barrel hygiene)
  ├── D1 (intents/types.ts)          ← depends on ai/types.ts (C1)
  ├── D2 (core-wrappers.ts)          ← depends on D1, vocabulary-service (C11), fixtures/ui5-handler
  ├── D3 (procurement.ts)            ← depends on D1, D2, fixtures/ui5-handler, nav-fixtures
  ├── D4 (sales.ts)                  ← depends on D1, D2
  ├── D5 (finance.ts)                ← depends on D1, D2
  ├── D6 (manufacturing.ts)          ← depends on D1, D2
  ├── D7 (master-data.ts)            ← depends on D1, D2
  ├── D8 (intents/index.ts)          ← depends on D1-D7
  └── D9 (intent-fixtures.ts)        ← depends on D8, C9 (pramanAI/aiTest), module-fixtures.ts (extends aiTest which extends moduleTest)

Layer enforcement (unchanged):
  Core → Bridge → Proxy → Fixtures → AI
  AI layer can import from: Core, Bridge, Proxy, Fixtures
  Intents can import from: Core, Fixtures, AI, Vocabulary
  Vocabulary can import from: Core only (no fixture deps)
```

---

## 4. Scope Changes to Phase 6 and Phase 7

> **ACTION REQUIRED**: Update plan.md after Phase 5 completes.
> These items are moved or resolved by Phase 5.

### Items Moving FROM Phase 6 to Phase 5

| Item                                      | Original Phase | Now In              | Notes                                                     |
| ----------------------------------------- | -------------- | ------------------- | --------------------------------------------------------- |
| `scripts/generate-skill-md.ts` completion | Phase 6        | **Phase 5 Batch B** | Critical for AI agents. SKILL.md must ship with AI layer. |

### Items Moving FROM Phase 7 to Phase 5

| Item                                                          | Original Phase | Now In              | Notes                                                                         |
| ------------------------------------------------------------- | -------------- | ------------------- | ----------------------------------------------------------------------------- |
| Matcher type augmentation (`matchers/types.d.ts`)             | Phase 7        | **Phase 5 Batch A** | BLOCKING for AI agents. `expect(control).toHaveUI5Text()` must type-check.    |
| Wire `objectMapCleanup()` into fixture teardown               | Phase 7        | **Phase 5 Batch A** | Memory leak. Active in every test run. Fix before AI layer adds more objects. |
| Delete `api-resolver.ts`, `get-selector.ts`, `get-version.ts` | Phase 7        | **Phase 5 Batch A** | 262 LOC dead code. Confuses AI agents browsing source.                        |

### Items RESOLVED by Phase 5 (remove from Phase 7 task list)

| Item                                                 | Phase 7 Note          | Resolution                                                                                                   |
| ---------------------------------------------------- | --------------------- | ------------------------------------------------------------------------------------------------------------ |
| `control-types.ts` — "evaluate + wire or DELETE"     | Phase 7 §cleanup      | **WIRED in Phase 5 Batch C** — bulk-discovery.ts imports `isInteractiveControl()` and `isContainerControl()` |
| `object-categories.ts` — "evaluate + wire or DELETE" | Phase 7 §cleanup      | **WIRED in Phase 5 Batch C** — bulk-discovery.ts imports `detectObjectCategory()`                            |
| `object-map.ts` cleanup                              | Phase 7 — memory leak | **FIXED in Phase 5 Batch A** — wired into fixture teardown                                                   |

### Phase 7 Remaining After Phase 5

Phase 7's dead code section reduces from 7 files to 1:

| File                               | LOC | Status    | Action                                  |
| ---------------------------------- | --- | --------- | --------------------------------------- |
| `src/core/utils/step-decorator.ts` | ~87 | Dead code | Phase 7: wire into AI handler OR delete |

Other Phase 7 items unchanged: INT1/INT2 integration tests, CI/CD, SBOM, provenance, behavioral equivalence tests, performance benchmarks, security audit, migration guide, OData namespace split, typed proxy accessors, test.step() wiring, WebComponent support, matcher type augmentation → **DONE in Phase 5**.

---

## 5. Batch A — Prerequisites + API Hygiene

> **Duration**: 3 days (Week 1, concurrent with Batch B)
> **Purpose**: Fix 8 BLOCKING issues from praman_aiaudit.md before AI layer is built on top.
> **TDD**: Tests written first to capture the expected public API surface.

### A0 — Error Classes (NEW — prerequisite for ALL batches)

**Why first**: `AiError`, `VocabularyError`, `IntentError` are referenced in Batch C and D
implementations. They must exist before any C/D task begins. These are Tier 1 coverage targets
(100% statements/branches/functions/lines).

**Parallel with**: Nothing — must complete before any other batch starts.

**A0a — AiError**

**File**: `src/core/errors/ai-error.ts` (NEW)

````typescript
/**
 * Thrown when an AI operation fails.
 *
 * @remarks
 * Covers LLM service failures, context building errors, and agentic handler failures.
 * Always includes `retryable` + `suggestions` per Praman error contract.
 *
 * @example
 * ```typescript
 * throw new AiError({
 *   code: 'ERR_AI_NOT_CONFIGURED',
 *   message: 'AI provider not configured',
 *   attempted: 'Initialize LlmService',
 *   retryable: false,
 *   suggestions: ['Set config.ai.provider and config.ai.apiKey'],
 * });
 * ```
 */
export class AiError extends PramanError {
  constructor(
    params: PramanErrorParams & {
      code:
        | 'ERR_AI_NOT_CONFIGURED'
        | 'ERR_AI_LLM_CALL_FAILED'
        | 'ERR_AI_RESPONSE_PARSE_FAILED'
        | 'ERR_AI_RATE_LIMITED'
        | 'ERR_AI_CONTEXT_BUILD_FAILED'
        | 'ERR_AI_STEP_INTERPRET_FAILED';
    },
  ) {
    super(params);
    this.name = 'AiError';
  }
}
````

**Test**: `tests/unit/core/errors/ai-error.test.ts`

Test cases (Tier 1 — 100% coverage required):

- Construct with each valid error code → verify `code`, `name`, `retryable`, `suggestions` are set
- Verify `instanceof PramanError` is true
- Verify `instanceof AiError` is true
- Verify `toJSON()` serializes correctly (inherited from PramanError)

---

**A0b — VocabularyError**

**File**: `src/core/errors/vocabulary-error.ts` (NEW)

````typescript
/**
 * Thrown when vocabulary resolution fails.
 *
 * @example
 * ```typescript
 * throw new VocabularyError({
 *   code: 'ERR_VOCAB_TERM_NOT_FOUND',
 *   message: `Term not found: ${term}`,
 *   attempted: `Resolve vocabulary term: ${term}`,
 *   retryable: false,
 *   suggestions: ['Check spelling', 'Use getBusinessTermSuggestions() for alternatives'],
 * });
 * ```
 */
export class VocabularyError extends PramanError {
  constructor(
    params: PramanErrorParams & {
      code:
        | 'ERR_VOCAB_TERM_NOT_FOUND'
        | 'ERR_VOCAB_DOMAIN_LOAD_FAILED'
        | 'ERR_VOCAB_JSON_INVALID'
        | 'ERR_VOCAB_AMBIGUOUS_MATCH';
    },
  ) {
    super(params);
    this.name = 'VocabularyError';
  }
}
````

**Test**: `tests/unit/core/errors/vocabulary-error.test.ts`

Test cases (Tier 1 — 100% coverage):

- Construct with each valid code → verify `code`, `name` set
- Verify `instanceof PramanError`
- Verify `instanceof VocabularyError`

---

**A0c — IntentError**

**File**: `src/core/errors/intent-error.ts` (NEW)

````typescript
/**
 * Thrown when an intent domain operation fails.
 *
 * @example
 * ```typescript
 * throw new IntentError({
 *   code: 'ERR_INTENT_FIELD_NOT_FOUND',
 *   message: `Field selector not found for: ${fieldName}`,
 *   attempted: `Fill field via vocabulary: ${fieldName}`,
 *   retryable: false,
 *   suggestions: ['Verify field name exists in vocabulary', 'Provide custom selector override'],
 * });
 * ```
 */
export class IntentError extends PramanError {
  constructor(
    params: PramanErrorParams & {
      code:
        | 'ERR_INTENT_FIELD_NOT_FOUND'
        | 'ERR_INTENT_ACTION_FAILED'
        | 'ERR_INTENT_NAVIGATION_FAILED'
        | 'ERR_INTENT_VALIDATION_FAILED';
    },
  ) {
    super(params);
    this.name = 'IntentError';
  }
}
````

**Test**: `tests/unit/core/errors/intent-error.test.ts`

Test cases (Tier 1 — 100% coverage):

- Construct with each valid code → verify `code`, `name` set
- Verify `instanceof PramanError`
- Verify `instanceof IntentError`

---

**TDD Sequence for A0**:

1. RED: Write all three error test files (they fail — classes don't exist)
2. GREEN: Implement `AiError`, `VocabularyError`, `IntentError`
3. REFACTOR: Verify `npm run lint && npm run typecheck && npm run test:unit -- --coverage` passes
4. Update core errors barrel: add exports to `src/core/errors/index.ts`

---

### A1 — Extend aiSchema for Azure OpenAI Fields

> **Finding B1 (BLOCKER)**: `AiProviderConfig` in C1 types uses `endpoint`, `apiVersion`, `deployment` for Azure OpenAI, but `src/core/config/schema.ts` `aiSchema` currently has ONLY: `provider`, `apiKey`, `model`, `temperature`, `maxTokens`. These Azure-specific fields are missing from the Zod schema, meaning they cannot flow from `praman.config.ts` into `LlmService`.

**File**: `src/core/config/schema.ts` (MODIFY)

Extend `aiSchema` with three optional Azure-specific fields:

```typescript
// ── AI sub-schema ────────────────────────────────────────────────────
const aiSchema = z.object({
  provider: z.enum(['azure-openai', 'openai', 'anthropic']).default('azure-openai'),
  apiKey: z.string().optional(),
  model: z.string().optional(),
  temperature: z.number().min(0).max(2).default(0.3),
  maxTokens: z.number().int().positive().optional(),
  // Azure OpenAI-specific fields (W2: azure-openai + openai supported; W14: anthropic added)
  endpoint: z.string().url().optional(), // Azure: resource endpoint URL
  deployment: z.string().optional(), // Azure: deployment name
  apiVersion: z.string().optional(), // Azure: API version e.g. '2024-02-01'
  // Anthropic-specific fields (W14: separate key for security clarity)
  anthropicApiKey: z.string().optional(), // Anthropic: API key (distinct from openai apiKey)
});
```

**Rationale**: These fields are optional, so no breaking change. When `provider === 'azure-openai'`, `LlmService` reads `config.ai.endpoint`, `config.ai.deployment`, `config.ai.apiVersion`. When `provider === 'openai'`, those Azure fields are ignored. When `provider === 'anthropic'`, `LlmService` reads `config.ai.anthropicApiKey` and defaults `config.ai.model` to `'claude-opus-4-6'`. Per decision W14, Anthropic Claude is the third provider added in Phase 5.

**C2 linkage**: `src/ai/llm-service.ts` (C2) must read these config fields:

```typescript
// Azure provider construction in createLlmService():
const client = new AzureOpenAI({
  endpoint: config.ai.endpoint, // from aiSchema.endpoint
  apiKey: config.ai.apiKey,
  apiVersion: config.ai.apiVersion, // from aiSchema.apiVersion
  deployment: config.ai.deployment, // from aiSchema.deployment
});
```

**Test**: Update `tests/unit/config/schema.test.ts`

- Verify `endpoint`, `deployment`, `apiVersion` are accepted by `aiSchema`
- Verify all three remain undefined when not provided (optional fields)
- Verify Zod rejects non-URL values for `endpoint`

### A2 — Barrel Surgery

**File**: `src/index.ts`

**REMOVE from main barrel** (32 internal symbols — these should never be in the public API):

> **Finding B4 (BLOCKER)**: The original list of 22 symbols was missing 10 internal matcher implementation functions. These are registered via `expect.extend()` — users call `expect(ctrl).toHaveUI5Text()`, NOT `checkUI5Text()` directly. All 10 `check*` functions are implementation details and must be removed from the public barrel.

```typescript
// Bridge internals — users call ui5.control(), not these
(ensureBridgeInjected, isBridgeReady, waitForBridgeReady, MethodExecutionResult);

// Proxy internals — users call ui5.control(), not these
(createControlProxy,
  ControlProxyCache,
  discoverControl,
  UI5Object,
  UI5ObjectCache,
  ControlProxyState);

// Infrastructure internals — auto-initialized by fixtures
(createLogger, createRootLogger, initTelemetry);

// Compat internals — version detection is automatic
(getPlaywrightVersion, hasFeature);

// Selector engine internals — ui5= selector is transparent
(createUI5SelectorEngineScript,
  isUI5SelectorString,
  parseUI5Selector,
  serializeUI5Selector,
  validateUI5Selector);

// Implementation constants — not user configuration
(DIALOG_CONTROL_TYPES, DATE_FORMATS);

// ⚠️ BLOCKER FIX B4: Matcher implementation functions (10 additional symbols)
// Users call expect(ctrl).toHaveUI5Text() — NOT checkUI5Text() directly.
// These are registered via expect.extend() in core-fixtures.ts matcherRegistration.
// They must NOT be in the public API — they are internal implementations.
(checkUI5Binding,
  checkUI5CellText,
  checkUI5ControlType,
  checkUI5Enabled,
  checkUI5Property,
  checkUI5RowCount,
  checkUI5SelectedRows,
  checkUI5Text,
  checkUI5ValueState,
  checkUI5Visible);
```

**Note on MatcherResult**: If `MatcherResult` type is currently exported, verify whether any consumer needs it. If it is only used internally by the `check*` functions, remove it from the barrel too. If it's needed for custom matcher authoring (unlikely in Phase 5), keep it with a TSDoc note.

**ADD to main barrel** (4 missing user-facing types):

```typescript
export type { UI5Selector } from './core/types/selectors.js';
export type { UI5ControlBase } from './core/types/controls.js';
export type { NavigationOptions } from './modules/navigation.js';
export type { UI5NavigationAPI } from './fixtures/nav-fixtures.js';
```

**Note on auth exports**: Keep `AuthStrategy`, `SAPAuthConfig`, `SessionInfo` types (needed for auth-setup.ts). Remove `createAuthStrategy` and `SAPAuthHandler` (implementation-level). `SAPAuthHandler` class constructor is never called directly by users.

**File**: `src/fe/index.ts`

**REMOVE browser script strings** (implementation detail, not public API):

```typescript
// REMOVE — raw JS strings injected via page.evaluate():
(FE_ADD_TO_QUEUE_SCRIPT,
  FE_DETECT_WORKZONE_SCRIPT,
  FE_EMPTY_QUEUE_SCRIPT,
  FE_INIT_OPA_SCRIPT,
  FE_LOAD_LIBRARIES_SCRIPT);
```

**Test**: `tests/unit/barrel/index-exports.test.ts` (NEW)

- Verify 32 removed symbols are NOT exported from `playwright-praman` (22 original + 10 check\* matcher functions added by B4 fix)
- Verify 4 new types ARE exported
- Verify `@arethetypeswrong/cli` still passes 6/6 exports

### A3 — Matcher Type Augmentation

**File**: `src/matchers/types.d.ts` (NEW — ~80 LOC)

TypeScript declaration file that augments `@playwright/test` to make custom matchers type-safe:

````typescript
// src/matchers/types.d.ts
import type { ExpectMatcherState } from '@playwright/test';

/**
 * TypeScript declaration augmentation for Praman custom matchers.
 *
 * @remarks
 * These matchers are registered via `expect.extend()` in `core-fixtures.ts`.
 * This file provides the type signatures so `expect(control).toHaveUI5Text('Save')`
 * compiles without TypeScript errors.
 *
 * @example
 * ```typescript
 * import { test, expect } from 'playwright-praman';
 *
 * test('verify button text', async ({ ui5 }) => {
 *   const btn = await ui5.control({ id: 'saveBtn' });
 *   await expect(btn).toHaveUI5Text('Save');
 *   await expect(btn).toBeUI5Enabled();
 *   await expect(btn).toHaveUI5Property('type', 'Emphasized');
 * });
 * ```
 */
declare module '@playwright/test' {
  interface Matchers<R> {
    toHaveUI5Text(expected: string, options?: { timeout?: number }): Promise<R>;
    toBeUI5Visible(options?: { timeout?: number }): Promise<R>;
    toBeUI5Enabled(options?: { timeout?: number }): Promise<R>;
    toHaveUI5Property(
      property: string,
      expected: unknown,
      options?: { timeout?: number },
    ): Promise<R>;
    toHaveUI5ValueState(state: string, options?: { timeout?: number }): Promise<R>;
    toHaveUI5Binding(bindingPath: string, options?: { timeout?: number }): Promise<R>;
    toBeUI5ControlType(controlType: string, options?: { timeout?: number }): Promise<R>;
    toHaveUI5CellText(
      row: number,
      col: number,
      expected: string,
      options?: { timeout?: number },
    ): Promise<R>;
    toHaveUI5RowCount(expected: number, options?: { timeout?: number }): Promise<R>;
    toHaveUI5SelectedRows(expected: number[], options?: { timeout?: number }): Promise<R>;
  }
}
````

**Test**: `tests/unit/matchers/types-augmentation.test.ts` (NEW)

- Type-level test: verify TypeScript accepts `await expect(control).toHaveUI5Text('Save')`
- Use `expectTypeOf` assertions (no runtime checks needed)

> **Finding H6 (HIGH)**: VERIFY FIRST before implementing A2.
>
> Read `src/fixtures/core-fixtures.ts` lines 177–194 to confirm `expect.extend({ toHaveUI5Text: checkUI5Text, ... })` is called inside the `matcherRegistration` worker fixture. This has been verified — the `matcherRegistration` fixture calls `expect.extend()` with all 10 matchers. `types.d.ts` alone is NOT sufficient for runtime matcher availability — the `expect.extend()` call in the fixture is what registers them at runtime. The `types.d.ts` only provides TypeScript type safety.
>
> **Confirmed**: `expect.extend()` IS present in `src/fixtures/core-fixtures.ts` (lines 179–191). Batch A2 only needs to add the type declaration file — the runtime registration is already done.

### A4 — Memory Leak Fix: objectMapCleanup()

> **Finding B5 (BLOCKER)**: The original spec only listed `core-fixtures.ts`. But `src/fixtures/module-fixtures.ts` ALSO has a `ui5` fixture override with the same missing try/finally and missing cleanup call. Both files MUST be fixed.

**Files**: `src/fixtures/core-fixtures.ts` AND `src/fixtures/module-fixtures.ts` (MODIFY BOTH)

Wire `objectMapCleanup()` browser-side cleanup into the `ui5` fixture teardown in **both** files:

```typescript
// In the ui5 fixture, AFTER await use(handler):
try {
  const cleanupScript = createObjectCleanupScript();
  await page.evaluate(cleanupScript).catch(() => {
    // Cleanup failure is non-fatal — page may have navigated
  });
} finally {
  handler.destroy();
}
```

**Import to add**:

```typescript
import { createObjectCleanupScript } from '#bridge/browser-scripts/object-map.js';
```

**Test**: `tests/unit/fixtures/core-fixtures-teardown.test.ts` (NEW)

- Mock page.evaluate — verify cleanupScript is called in teardown
- Verify cleanup failure is swallowed (page navigation case)
- Verify handler.destroy() is always called (try/finally)

**Test**: `tests/unit/fixtures/module-fixtures-teardown.test.ts` (NEW — B5 fix verification)

- Same pattern as above but for `module-fixtures.ts` `ui5` override
- Verify objectMapCleanup is called in the module fixture teardown
- Verify page.off() is in try/finally (also fixes A4 for module-fixtures.ts)

### A5 — Module Fixture Stability Guards

**File**: `src/fixtures/module-fixtures.ts` (MODIFY)

**Problem**: `createTableFixture`, `createDialogFixture`, `createDateFixture`, `createODataFixture` call module functions without first ensuring UI5 stability. The `ui5.control()` does call `waitForUI5Stable()` but the module functions bypass it.

**Fix 1**: Add stability wait at the `moduleTest` fixture level in `module-fixtures.ts`:

> **Finding H2 (HIGH)**: The original spec used `internalWaitForUI5Stable(page, config)` which does not exist. The public export is `waitForUI5Stable` from `#core/utils/wait-helpers.js`. Additionally, the stability wrap must be applied at the `moduleTest` fixture level (inside the `ui5: async (...)` override in `module-fixtures.ts`) — NOT inside the factory functions (`createTableFixture`, etc.) which don't have access to `config`.

```typescript
// Import at top of module-fixtures.ts:
import { waitForUI5Stable } from '#core/utils/wait-helpers.js';

// Inside moduleTest ui5 fixture — wrap extended handler methods:
// Apply stability guard at the moduleTest fixture level, not in factory functions.
// The stableWrap curries page + config from fixture scope.
const stableWrap =
  <TArgs extends unknown[], TReturn>(fn: (...args: TArgs) => Promise<TReturn>) =>
  async (...args: TArgs): Promise<TReturn> => {
    await waitForUI5Stable(page, pramanConfig);
    return fn(...args);
  };

// Apply to each table/dialog/date/odata method group in the extended handler.
```

**Fix 2**: Wrap `page.off()` teardown in try/finally:

```typescript
// Current (leaks listener on test throw):
page.on('framenavigated', navigationListener);
await use(extended);
page.off('framenavigated', navigationListener); // NEVER reached if use() throws

// Fixed:
page.on('framenavigated', navigationListener);
try {
  await use(extended);
} finally {
  page.off('framenavigated', navigationListener);
}
```

**Test**: `tests/unit/fixtures/module-fixtures-stability.test.ts` (NEW)

- Verify waitForUI5Stable is called before table/dialog/date/odata methods
- Verify page.off() is called even if use() throws

### A6 — Dead Code Deletion

Delete the following files (confirmed dead per plan.md §5.4.5 and audit I-022, I-023):

| File                                         | LOC | Evidence                                                                | Action |
| -------------------------------------------- | --- | ----------------------------------------------------------------------- | ------ |
| `src/bridge/api-resolver.ts`                 | 113 | Not imported in any `src/` file; functionality inlined in inject-ui5.ts | DELETE |
| `src/bridge/browser-scripts/get-selector.ts` | 102 | Not imported in any `src/` file                                         | DELETE |
| `src/bridge/browser-scripts/get-version.ts`  | 47  | Not imported; functionality inlined in inject-ui5.ts                    | DELETE |

**Also delete** any orphaned test files that exclusively test these deleted files.

**Net LOC reduction**: ~262 LOC removed from production build.

**Verify**: Run `npm run build && npm run check:exports` — must still produce valid dist/.

### A7 — Dependency Cleanup

> **Finding H1 (HIGH)**: Two corrections from the original spec:
>
> 1. `openai` is ALREADY in `optionalDependencies` at exact version `6.22.0` (verified in `package.json`). The fix is to change the pin from exact to range — NOT to "move to optionalDependencies".
> 2. `dotenv` must move to `devDependencies` (NOT `optionalDependencies`). `optionalDeps` signals "optional runtime behavior"; dotenv is only used in examples/docs — no runtime usage in the library.

**File**: `package.json` (MODIFY)

```json
// CURRENT state (verified in package.json):
// dependencies: { "dotenv": "17.3.1", "zod-to-json-schema": "3.25.1" }
// optionalDependencies: { "openai": "6.22.0" }  ← exact pin

// TARGET state after A6:
// REMOVE from "dependencies": dotenv, zod-to-json-schema
// ADD to "devDependencies": "dotenv": "^17.0.0", "zod-to-json-schema": "^3.25.1"
// CHANGE in "optionalDependencies": "openai": "^6.22.0"  (was exact "6.22.0")
```

**Rationale**:

- `dotenv`: Library consumers should control their own env loading. `praman.config.ts` can document `dotenv/config` import without shipping dotenv as a hard dependency. Belongs in `devDependencies` (not `optionalDependencies`) because it has zero runtime role in the library.
- `zod-to-json-schema`: Only used by `scripts/generate-json-schema.ts` (Phase 6 scope). Not needed in production build.
- `openai`: Was already optional. Loosen from exact pin `6.22.0` to range `^6.22.0` to allow patch/minor updates without manual re-pinning.

**Test**: `tests/unit/package/dependency-classification.test.ts` (NEW — type-level check)

- Verify package.json `dependencies` does not contain `dotenv` or `zod-to-json-schema`
- Verify `devDependencies` contains `dotenv` and `zod-to-json-schema`
- Verify `optionalDependencies` contains `openai` (as range, not exact), `@opentelemetry/*`

### A8 — TSDoc Pass: AI Metadata Tags + Path Alias Registration

> **Finding B2 (BLOCKER)**: Dynamic imports in C9 (`await import('playwright-praman/ai')`) and D6 (`await import('playwright-praman/intents')`, `await import('playwright-praman/vocabulary')`) use published npm sub-paths. These only resolve AFTER `npm run build`. In development (vitest, playwright test on source), they fail because sub-path aliases `#ai/*`, `#vocabulary/*`, `#intents/*` are not defined in `tsconfig.json`.

**Fix B2a — Add path aliases to tsconfig.json** (MODIFY):

```json
// tsconfig.json paths section — add alongside existing aliases:
"#ai/*":         ["./src/ai/*"],
"#vocabulary/*": ["./src/vocabulary/*"],
"#intents/*":    ["./src/intents/*"]
```

**Fix B2b — vitest.config.ts** (MODIFY):
The `vite-tsconfig-paths` plugin (already installed — see devDependencies) picks up path aliases automatically from `tsconfig.json`. No manual `resolve.alias` entries needed — the plugin reads `tsconfig.json` paths directly. Verify this works by running a test that imports `#ai/index.js`.

**Fix B2c — Update all dynamic imports in C9 and D6** (see those sections below):
Replace published sub-paths with source aliases in ALL dynamic import calls.

---

Add `@capability`, `@intent`, `@sapModule`, `@businessContext` TSDoc tags to all public fixture and module functions. This activates the existing `scripts/generate-capabilities.ts` script.

**Files affected** (public API surface — ~80 functions across 8 files):

- `src/fixtures/ui5-handler.ts` — `control()`, `controls()`, `click()`, `fill()`, `press()`, `select()`, `getText()`, `getValue()`, `waitForUI5()`, `waitFor()`, `clearCache()`, `destroy()`
- `src/fixtures/nav-fixtures.ts` — all 9 navigation functions
- `src/fixtures/module-fixtures.ts` — table, dialog, date, odata method groups
- `src/modules/navigation.ts` — module-level functions
- `src/modules/table.ts`, `table-operations.ts`, `table-filter-sort.ts`
- `src/modules/dialog.ts`, `date.ts`, `odata.ts`, `odata-http.ts`
- `src/fe/index.ts` — FE public functions

**Tag format** (per docs/documentation-standards.md and CLAUDE.md):

````typescript
/**
 * Discovers a single SAP UI5 control by business identity.
 *
 * @remarks
 * **When to use Praman vs Playwright**: Use this for any SAP UI5 control
 * (sap.m.Button, sap.m.Input, etc.). For plain HTML elements, use
 * Playwright's `page.locator()` instead.
 *
 * **Selector priority** (most reliable first):
 * 1. `{ id: 'stable-id' }` — fastest
 * 2. `{ controlType: 'sap.m.Button', properties: { text: 'Save' } }` — stable
 * 3. `{ controlType: '...', ancestor: { id: '...' } }` — scoped
 *
 * @intent Find a UI5 control by its business identity
 * @capability ui5-control-discovery
 * @sapModule All — works with MM, SD, FI, PP applications
 *
 * @example
 * ```typescript
 * // By stable ID
 * const btn = await ui5.control({ id: 'submitButton' });
 *
 * // By business property (preferred for AI agents)
 * const saveBtn = await ui5.control({
 *   controlType: 'sap.m.Button',
 *   properties: { text: 'Save' },
 * });
 * ```
 */
````

**After tagging**: Run `npx tsx scripts/generate-capabilities.ts` — verify extraction produces all tagged functions.

---

## 6. Batch B — SKILL.md + Capability Manifest

> **Duration**: 3 days (Week 1, concurrent with Batch A)
> **Purpose**: Make Praman discoverable by AI code-generation agents (Claude Code, GitHub Copilot).
> **Format**: Claude Agent Skills best practices (YAML frontmatter + progressive disclosure).

### B1 — Complete generate-skill-md.ts

**File**: `scripts/generate-skill-md.ts` (MODIFY — from 4-LOC stub to ~300 LOC)

**Strategy**: Generate the AI-reference domain files (capabilities-reference.md, api-reference.md) from TSDoc. Hand-author SKILL.md itself (the entry point) — it's strategic content that shouldn't drift.

**Generator output**:

1. `skills/capabilities-reference.md` — extracted from @capability tags
2. `skills/api-reference.md` — generated from TypeDoc API surface
3. `skills/recipes-reference.md` — generated from @example blocks

**Generator must**:

- Read public functions via TypeScript AST (same approach as generate-capabilities.ts)
- Extract @capability, @intent, @sapModule tags
- Group by category (ui5-control, navigation, authentication, fiori-elements, odata, table, dialog, date, ai, intent, vocabulary)
- Generate markdown tables per category
- Preserve manual sections via merge markers (`<!-- MANUAL: section-name -->`)

**Build integration**:

> **Finding H7 (HIGH)**: The original plan proposed a `"prebuild"` npm hook that would block `npm run build` if SKILL.md generation fails. This is wrong — it slows developer iteration and breaks offline builds. Use a separate `build:full` target instead.

```json
// package.json scripts — DO NOT use "prebuild":
"generate:skill-md": "tsx scripts/generate-skill-md.ts",
"build:full": "npm run generate:capabilities && npm run generate:skill-md && npm run build"
// CI uses: npm run build:full
// Local dev uses: npm run build  (fast, no generation)
```

Keep `npm run build` fast for development. Update CI configuration to call `npm run build:full` instead of `npm run build`.

#### generate-skill-md.ts — Detailed Spec

**Output**: `SKILL.md` at repo root (auto-generated, committed to repo)

**YAML Frontmatter** (strict requirements from Claude Agent Skills docs):

- `name`: `testing-sap-applications` (gerund form, ≤64 chars, lowercase+hyphens only, no "anthropic"/"claude")
- `description`: ≤1024 chars, third person, includes "what" + "when to use it"

**Body structure** (≤500 lines total — Claude Agent Skills limit):

```markdown
---
name: testing-sap-applications
description: Tests SAP UI5 applications using Playwright with Praman fixtures. Use when writing automated tests for SAP Fiori apps, S/4HANA, or any SAP UI5 application. Provides controls for navigation, form filling, table interaction, OData calls, and AI-generated test steps.
---

# SAP UI5 Testing with Praman

## Quick start

[brief getting started code example from @recipe tags]

## Available capabilities

[auto-generated table from @capability tags — name, description, when to use]

## Intent domains

[auto-generated from @intent tags — domain, functions, SAP module]

## Example recipes

[top 5 recipes from @recipe tags with code snippets]

## Advanced features

**AI test generation**: See [AI.md](AI.md)
**Vocabulary mapping**: See [VOCABULARY.md](VOCABULARY.md)
**OData integration**: See [ODATA.md](ODATA.md)
```

**Progressive disclosure** (separate files bundled with SKILL.md):

- `AI.md` — AI test generation workflow (loaded only when user asks about AI)
- `VOCABULARY.md` — Business vocabulary reference per domain
- `ODATA.md` — OData fixture reference

**Generator algorithm** (step-by-step):

1. Parse all `src/**/*.ts` with TypeScript compiler API (not regex)
2. Extract all functions with `@capability`, `@intent`, `@recipe`, `@sapModule` tags
3. Group by domain (`@sapModule` or `@intent` prefix)
4. Generate capability table (sorted by domain, then name)
5. Generate intent function table (grouped by domain: MM, SD, FI, PP, Master Data)
6. Pick top 5 recipes by `@recipe priority` tag (or first 5 if no priority)
7. Render SKILL.md using template (no external template engine — string interpolation)
8. Verify output: frontmatter valid, body ≤500 lines, name ≤64 chars
9. Generate domain reference files: `AI.md`, `VOCABULARY.md`, `ODATA.md`
10. Write all files to repo root `skills/playwright-praman-sap-testing/` directory
11. If body > 500 lines: truncate least-important section (recipes) and add "See RECIPES.md" link

**Error handling**: If TypeScript AST parsing fails on any file → log warning + skip (do not fail build).
After parsing: if 0 capabilities found → throw Error("No @capability tags found — run on src/ directory").

#### build:full Script (add to package.json)

```json
{
  "scripts": {
    "generate:capabilities": "tsx scripts/generate-capabilities.ts",
    "generate:recipes": "tsx scripts/generate-recipes.ts",
    "generate:skill-md": "tsx scripts/generate-skill-md.ts",
    "build:full": "npm run generate:capabilities && npm run generate:recipes && npm run generate:skill-md && npm run build",
    "build": "tsup"
  }
}
```

**When to use**:

- `npm run build` — fast local development build (no code generation)
- `npm run build:full` — CI/release build (generates all artifacts then builds)
- `npm run ci` — `lint + typecheck + test:unit + build` (does NOT need build:full — generated files are committed)

**Note**: Generated files (`capability-registry.generated.ts`, `recipe-registry.generated.ts`) are
committed to the repo. They are regenerated only when `npm run generate:capabilities` / `npm run generate:recipes`
is explicitly run. This means the `build` command can always run without generation.

### B2 — SKILL.md (Main Entry Point) + Validation

**File**: `SKILL.md` (NEW at repo root — ~300 lines)

> **Finding M5 (MEDIUM)**: No CI gate was defined to validate SKILL.md format compliance.

**Add `scripts/validate-skill-md.ts`** (~50 LOC): Validates YAML frontmatter exists, `name` is ≤64 chars, `description` is ≤1024 chars, body is ≤500 lines. Add `"validate:skill-md": "tsx scripts/validate-skill-md.ts"` to `package.json` scripts. Add to `npm run ci` (or `npm run lint` gate). This provides a CI check without blocking `npm run build` (see H7 fix).

Follows Claude Agent Skills best practices:

- YAML frontmatter: name (≤64 chars, lowercase/hyphens) + description (≤1024 chars, third person, triggers)
- Body ≤500 lines
- References domain files (one level deep — `skills/*.md`)
- Third-person descriptions throughout

```yaml
---
name: playwright-praman-sap-testing
description: >
  Playwright plugin for SAP UI5 test automation. Provides fixtures for UI5 control
  discovery, SAP authentication (BTP SAML, Basic, Office365), FLP navigation,
  OData V2/V4 data access, Fiori Elements testing (ListReport, ObjectPage), AI-powered
  test generation, and business intent APIs (Procurement MM, Sales SD). Use when
  testing SAP Fiori applications, Fiori Elements apps, or any SAP UI5 application
  with Playwright. Import from 'playwright-praman'.
---
```

**Body sections**:

1. **Quick Start** — import pattern, config setup, first test
2. **When to use Praman vs native Playwright** — decision table (the #1 AI blocker)
3. **Fixture Map** — what each fixture does + when to use it
4. **SAP Control Type Namespace** — sap.m.\*, sap.ui.table.\*, sap.ui.comp.\* guide
5. **Auth Strategy Selection** — OnPrem vs BTP vs Office365 decision tree
6. **FLP Semantic Object Hash Format** — how to construct navigation hashes
7. **Domain Reference Files** → links to skills/ domain files

**Playwright vs Praman Decision Table** (the key missing content):

```markdown
## When to Use Praman vs Native Playwright

| Element Type              | Use                         | Example                                                                          |
| ------------------------- | --------------------------- | -------------------------------------------------------------------------------- |
| UI5 Button (sap.m.Button) | Praman `ui5.click()`        | `await ui5.click({ controlType: 'sap.m.Button', properties: { text: 'Save' } })` |
| UI5 Input (sap.m.Input)   | Praman `ui5.fill()`         | `await ui5.fill({ id: 'vendorInput' }, 'SUP-001')`                               |
| UI5 Table (sap.m.Table)   | Praman `ui5.table.*`        | `await ui5.table.getRows('tableId')`                                             |
| Plain HTML button         | Playwright native           | `await page.locator('button#submit').click()`                                    |
| Plain HTML input          | Playwright native           | `await page.locator('input[name=search]').fill('query')`                         |
| Non-UI5 elements          | Playwright native           | `await page.locator('.custom-element').isVisible()`                              |
| Browser navigation (URL)  | Playwright native           | `await page.goto(url)`                                                           |
| FLP app navigation        | Praman `ui5Navigation.*`    | `await ui5Navigation.navigateToApp('PurchaseOrder-manage')`                      |
| Wait for UI5 rendering    | Praman `waitForUI5Stable()` | `await ui5.waitForUI5()`                                                         |
| Wait for network          | Playwright native           | `await page.waitForLoadState('networkidle')`                                     |
```

### B3 — Domain Reference Files

**Directory**: `skills/` (NEW — 7 files)

| File                          | Content                                                                                   |
| ----------------------------- | ----------------------------------------------------------------------------------------- |
| `skills/ui5-controls.md`      | Control types (199 supported), selector syntax, interaction patterns, common control APIs |
| `skills/authentication.md`    | 6 auth strategies, SAP deployment types (OnPrem/BTP/WorkZone), auth-setup.ts pattern      |
| `skills/navigation.md`        | FLP hash format (`SemanticObject-Action`), 9 navigation functions, WorkZone navigation    |
| `skills/fiori-elements.md`    | ListReport, ObjectPage APIs, FE test library, filter bar, table/list helpers              |
| `skills/table-dialog-date.md` | 6 table variants, dialog confirm/dismiss, date picker formats (ISO, display, EU, US)      |
| `skills/odata.md`             | Model-level vs HTTP-level distinction, OData V2/V4, model path syntax                     |
| `skills/ai-capabilities.md`   | pramanAI fixture, intent fixture, vocabulary fuzzy matching, bulk page discovery          |

**Format**: Each file ≤200 lines, table of contents at top (per Claude best practices for files >100 lines).

### B4 — Capabilities Manifest

**File**: `skills/capabilities-reference.md` (GENERATED by generate-skill-md.ts)

Generated from @capability tags added in Batch A. Categories with ID prefixes:

- `UI5-001...` — UI5 control operations
- `NAV-001...` — Navigation
- `AUTH-001...` — Authentication
- `FE-001...` — Fiori Elements
- `TBL-001...` — Table operations
- `DLG-001...` — Dialog operations
- `DATE-001...` — Date picker operations
- `ODATA-001...` — OData operations
- `AI-001...` — AI capabilities (Phase 5)
- `INTENT-001...` — Intent API (Phase 5)
- `VOCAB-001...` — Vocabulary (Phase 5)

> **Finding M4 (MEDIUM)**: `CapabilityRegistry` is in-memory only. AI agents scanning package metadata (e.g., via `node_modules/playwright-praman/`) cannot discover capabilities without running code.

**Also generate `dist/capabilities.json`** as a build artifact:

- `generate-capabilities.ts` (or `generate-skill-md.ts`) additionally writes `dist/capabilities.json` — a machine-readable version of the capability manifest
- Add `"capabilities.json"` to the `files` array in `package.json` (alongside `"dist"`)
- Document in `skills/ai-capabilities.md`: "The capability manifest is available at `node_modules/playwright-praman/capabilities.json` for AI agent scanning"
- This allows AI code generation tools to read capabilities without importing the package

---

## 7. Batch C — AI Core + Vocabulary

> **Duration**: 5 days (Week 2)
> **TDD**: Write failing tests first for every module.

### C1 — AI Types (ai/types.ts)

**File**: `src/ai/types.ts` (NEW — ~120 LOC)

```typescript
/**
 * AI response envelope — consistent shape for all agentic API responses.
 *
 * @remarks
 * BP-CLAUDE: All agentic API responses use this envelope for predictable
 * AI agent consumption. `status` enables conditional handling. `metadata`
 * provides observability without breaking the data contract.
 *
 * @intent Wrap AI service responses in a consistent, AI-consumable shape
 * @capability ai-response-envelope
 * @sapModule All
 */
// ⚠️ LOW FIX L4: Full discriminated union type with partial status + complete metadata type.
// This replaces the simpler interface to enable proper TypeScript narrowing.
export type AiResponseMetadata = {
  readonly duration: number; // ms
  readonly retryable: boolean;
  readonly suggestions: string[]; // Self-healing hints for error recovery
  readonly model?: string; // LLM model used
  readonly tokens?: number; // Token consumption
};

/** Error detail embedded in AiResponse. */
export type AiResponseError = {
  readonly code: string;
  readonly message: string;
};

/**
 * AI response envelope — consistent shape for all agentic API responses.
 *
 * @remarks
 * Discriminated union on `status` for proper TypeScript narrowing.
 * `status: 'partial'` enables checkpoint/resume — if step 3 of 5 fails,
 * `data` contains results of steps 1-2 and `error` describes step 3 failure.
 *
 * BP-CLAUDE: All agentic API responses use this envelope for predictable
 * AI agent consumption.
 *
 * @intent Wrap AI service responses in a consistent, AI-consumable shape
 * @capability ai-response-envelope
 * @sapModule All
 */
export type AiResponse<T> =
  | { readonly status: 'success'; readonly data: T; readonly metadata: AiResponseMetadata }
  | {
      readonly status: 'error';
      readonly data: undefined;
      readonly error: AiResponseError;
      readonly metadata: AiResponseMetadata;
    }
  | {
      readonly status: 'partial';
      readonly data: Partial<T>;
      readonly error?: AiResponseError;
      readonly metadata: AiResponseMetadata;
    };

/** AI provider configuration resolved from PramanConfig.ai. */
export interface AiProviderConfig {
  readonly provider: 'azure-openai' | 'openai' | 'anthropic';
  readonly apiKey?: string; // OpenAI / Azure OpenAI
  readonly anthropicApiKey?: string; // Anthropic only
  readonly model: string;
  readonly endpoint?: string; // Azure only
  readonly temperature: number;
  readonly maxTokens?: number;
}

/** Single capability entry in the capability registry. */
export interface CapabilityEntry {
  readonly id: string; // 'UI5-001', 'FE-042', etc.
  readonly name: string;
  readonly description: string;
  readonly category: string;
  readonly intent?: string; // @intent tag value
  readonly sapModule?: string; // @sapModule tag value
  readonly usage_example: string; // BP-CLAUDE: shows agent exactly how to call it
  readonly registryVersion: number; // For agent cache invalidation
}

/** Single recipe entry. */
export interface RecipeEntry {
  readonly id: string;
  readonly title: string;
  readonly description: string;
  readonly category: string;
  readonly role: 'ai-agent' | 'human-tester' | 'both';
  readonly code: string; // TypeScript code example
  readonly tags: string[];
}

/** Agentic checkpoint for resumable autonomous operations (D9). */
export interface AgenticCheckpoint {
  readonly sessionId: string;
  readonly currentStep: number;
  readonly completedSteps: string[];
  readonly remainingSteps: string[];
  readonly state: Record<string, unknown>;
  readonly timestamp: string;
}

/** Discovered control info for AI context building. */
export interface DiscoveredControl {
  readonly id: string;
  readonly controlType: string;
  readonly category: 'interactive' | 'container' | 'navigation' | 'unknown';
  readonly objectCategory?: string; // For non-control UI5 objects
  readonly visible: boolean;
  readonly text?: string; // Display text if available
  readonly properties?: Record<string, unknown>;
}

/** Page-level AI context built by contextBuilder. */
export interface PageContext {
  readonly url: string;
  readonly ui5Version?: string;
  readonly controls: DiscoveredControl[];
  readonly formFields: DiscoveredControl[];
  readonly buttons: DiscoveredControl[];
  readonly tables: DiscoveredControl[];
  readonly navigationElements: DiscoveredControl[];
  readonly timestamp: string;
}
```

**Test**: `tests/unit/ai/types.test.ts` — type-level tests using expectTypeOf.

### C2 — LLM Service (ai/llm-service.ts)

**File**: `src/ai/llm-service.ts` (NEW — ~220 LOC)

```typescript
/**
 * LLM provider abstraction for AI-powered test operations.
 *
 * @remarks
 * Supports Azure OpenAI and OpenAI providers. Provider selection from `config.ai.provider`.
 * All requests use Zod-validated response schemas (D6).
 *
 * @intent Provide LLM text generation with structured output validation
 * @capability ai-llm-service
 */
export interface LlmService {
  complete(prompt: string, schema: z.ZodSchema): Promise<AiResponse<unknown>>;
  chat(messages: ChatMessage[], schema: z.ZodSchema): Promise<AiResponse<unknown>>;
  isConfigured(): boolean;
  /** Close the LLM connection and release resources. Called in pramanAI fixture teardown. */
  close(): Promise<void>;
}

/** Factory — reads from PramanConfig.ai. Throws AIError if not configured. */
export function createLlmService(config: Readonly<PramanConfig>): LlmService;
```

**Implementation details**:

- Uses `openai` npm package (already in optionalDependencies) for both Azure OpenAI and OpenAI
- Azure: `new AzureOpenAI({ endpoint, apiKey, apiVersion, deployment })`
- OpenAI: `new OpenAI({ apiKey })`
- All LLM responses validated through Zod schema (D6 boundary validation)
- Returns `AiResponse<T>` envelope (D29)
- Uses `retry()` from `#core/utils/retry.js` with exponential backoff (BP-GOOGLE/SRE)
- `AIError` thrown with `code: 'ERR_AI_NOT_CONFIGURED'` when `config.ai` is undefined
- `isConfigured()` — returns false gracefully, no throw — allows fixture to degrade

#### Anthropic Claude Provider (NEW — W14)

**Package**: `@anthropic-ai/sdk` — add to `optionalDependencies` in package.json
(same pattern as `openai` — optional because users may only need one provider)

**Config fields** for `provider: 'anthropic'`:

- `config.ai.anthropicApiKey` — Anthropic API key (required)
- `config.ai.model` — defaults to `'claude-opus-4-6'` (configurable)
- `config.ai.maxTokens` — defaults to 4096
- `config.ai.temperature` — defaults to 0.3

**Implementation**: Add a third branch in `LlmService.createClient()`:

```typescript
case 'anthropic': {
  const { Anthropic } = await import('@anthropic-ai/sdk');
  return new Anthropic({ apiKey: config.ai.anthropicApiKey });
}
```

**Interface alignment**: Anthropic SDK's `messages.create()` differs from OpenAI's `chat.completions.create()`.
LlmService must normalize responses from all three providers into the same `AiResponse<T>` envelope.
Internal adapter functions (private) for each provider:

- `completeWithOpenAI(client, prompt, schema)` — OpenAI + Azure
- `completeWithAnthropic(client, prompt, schema)` — Anthropic

The public `complete<T>(prompt, schema)` method selects the adapter based on `config.ai.provider`.

**Request/Response Zod schemas** in `src/ai/schemas/`:

- `llm-request.schema.ts` — chat message types
- `llm-response.schema.ts` — structured output validation

**Test**: `tests/integration/ai/llm-service.int.ts`

> **Decision (revised)**: The project has a live OpenAI/Azure OpenAI API available. `LlmService`
> is tested against the real API — no `vi.mock('openai', ...)`. This makes `llm-service` tests
> **integration tests** (not unit tests). Higher-layer components (`AgenticHandler`, fixtures)
> still mock the `LlmService` _interface_ (not the openai npm package) for fast, hermetic unit tests.

**Environment**: tests read `OPENAI_API_KEY` / `AZURE_OPENAI_ENDPOINT` + `AZURE_OPENAI_API_KEY`
from `.env.test` (loaded by `import 'dotenv/config'` at top of test file).

Integration test cases (`tests/integration/ai/llm-service.int.ts`):

- Azure provider path: construct `LlmService` with `provider: 'azure-openai'` config + real credentials; call `complete()` and verify `AiResponse` envelope shape (status, data, metadata present)
- OpenAI provider path: construct `LlmService` with `provider: 'openai'` + real API key; verify response round-trips through Zod schema successfully
- Anthropic provider path: construct `LlmService` with `provider: 'anthropic'` + real API key from `.env.test`; call `complete()` and verify AiResponse envelope shape (status, data, metadata present)
- Zod rejection: prompt real API to return a deliberately malformed response; verify `status: 'error'` with Zod parse failure code
- Retry on 429: simulate exhaustion by using an invalid key → expect `AIError` with `retryable: true` and exponential backoff metadata
- `isConfigured()` returns false when `config.ai` is undefined — unit test (no API call)
- `AIError` thrown with `code: 'ERR_AI_NOT_CONFIGURED'` when not configured — unit test (no API call)
- `close()` closes connection without error after a real API call

> **Note for `AgenticHandler` / fixture unit tests**: mock the `LlmService` **interface** via
> a typed vi.fn() stub — do NOT mock the `openai` npm package at module level. This keeps
> unit tests hermetic while still exercising real API behavior at the integration layer.

### C3 — Context Builder (ai/context-builder.ts)

**File**: `src/ai/context-builder.ts` (NEW — ~200 LOC)

```typescript
/**
 * Builds an AI-consumable description of the current page state.
 *
 * @remarks
 * Discovers all UI5 controls, categorizes them using `isInteractiveControl()`
 * and `detectObjectCategory()`, and returns a structured PageContext that
 * AI agents can use to understand what's on screen without knowing selectors.
 *
 * @intent Build AI context from current page UI5 state
 * @capability ai-context-building
 * @sapModule All
 */
export async function buildPageContext(
  page: Page,
  config: Readonly<PramanConfig>,
): Promise<AiResponse<PageContext>>;
```

**Implementation details**:

- Calls `discoverPage()` from `bulk-discovery.ts` (C6)
- Categorizes controls using `isInteractiveControl()`, `isContainerControl()` (now wired!)
- Extracts text/property hints for form fields, buttons, navigation elements
- Returns paginated result if control count > 50 (prevents token overload)

**Test**: `tests/unit/ai/context-builder.test.ts`

- Mock `page.evaluate()` to return fixture control list
- Verify categorization: buttons, form fields, tables separated correctly
- Verify PageContext shape matches AiResponse<PageContext> envelope

### C4 — Capability Registry (ai/capability-registry.ts)

**File**: `src/ai/capability-registry.ts` (NEW — ~200 LOC)

**Auto-discovery**: `CapabilityRegistry` is populated from `capability-registry.generated.ts`,
which is auto-generated by `scripts/generate-capabilities.ts` at build time.

The generator:

1. Scans all `src/**/*.ts` files for functions with `@capability` TSDoc tag
2. Extracts: capability name, description, parameters from tag + function signature
3. Outputs `src/ai/capability-registry.generated.ts` — a static map of name → CapabilityEntry
4. `CapabilityRegistry` class imports and registers entries from the generated file on construction

**Generation command**: `npm run generate:capabilities`
**Output file**: `src/ai/capability-registry.generated.ts` (gitignored, regenerated on build)

**CapabilityEntry type** (used in generated file):

```typescript
interface CapabilityEntry {
  /** Capability name from @capability tag */
  name: string;
  /** Description from @capability tag body */
  description: string;
  /** Source file + function name for debugging */
  source: string;
  /** Parameter names extracted from TSDoc @param tags */
  parameters: string[];
}
```

**CapabilityRegistry class**: Provides `register()`, `get()`, `list()`, `has()` methods.
On construction, auto-imports from generated file via:

```typescript
import { GENERATED_CAPABILITIES } from './capability-registry.generated.js';
```

```typescript
/**
 * Queryable registry of all Praman capabilities.
 *
 * @remarks
 * Populated from generated `capability-registry.generated.ts` (auto-generated at build time
 * from @capability TSDoc tags via `scripts/generate-capabilities.ts`).
 * Provides `registryVersion` for AI agent cache invalidation.
 *
 * @intent Enable AI agents to query what Praman can do
 * @capability ai-capability-discovery
 */
export class CapabilityRegistry {
  static readonly registryVersion = 1; // Increment when capabilities change

  /** Get all capabilities. */
  list(): CapabilityEntry[];

  /** Find capabilities by category. */
  byCategory(category: string): CapabilityEntry[];

  /** Search capabilities by name/description. */
  find(query: string): CapabilityEntry[];

  /** Get AI-optimized capability list for a specific LLM provider. */
  forAI(options?: {
    provider?: 'claude' | 'openai' | 'azure-openai' | 'anthropic';
  }): CapabilityEntry[];

  /** Get a single capability by ID. */
  get(id: string): CapabilityEntry | undefined;

  /** Check if a capability exists by name. */
  has(name: string): boolean;

  /** Register additional capabilities (for testing / extension). */
  register(entry: CapabilityEntry): void;
}
```

**Test**: `tests/unit/ai/capability-registry.test.ts`

- Verify registryVersion is a number
- Verify list() returns non-empty array (auto-discovered from generated file)
- Verify forAI() returns usage_example for each entry
- Verify find() finds by partial name
- Verify has() returns true for known capability names
- Verify register() adds a custom capability to the registry

### C5 — Recipe Registry (ai/recipe-registry.ts)

**File**: `src/ai/recipe-registry.ts` (NEW — ~180 LOC)

**Auto-discovery**: `RecipeRegistry` is populated from `recipe-registry.generated.ts`,
which is auto-generated by `scripts/generate-recipes.ts` at build time.

The generator:

1. Scans all `src/**/*.ts` and `tests/**/*.ts` files for `@recipe` TSDoc tags
2. Extracts: recipe title, description, code snippet (from @example in same function)
3. Outputs `src/ai/recipe-registry.generated.ts`

**Generation command**: `npm run generate:recipes`
**Output file**: `src/ai/recipe-registry.generated.ts` (gitignored, regenerated on build)

**RecipeEntry type** (also in C1 types.ts — update to match):

```typescript
interface RecipeEntry {
  title: string;
  description: string;
  code: string; // TypeScript code snippet from @example
  domain?: string; // e.g. 'procurement', 'sales' — from @recipe domain tag
  tags: string[]; // from @recipe tags annotation
}
```

```typescript
/**
 * Queryable registry of Praman code recipes.
 *
 * @remarks
 * Populated from generated `recipe-registry.generated.ts` (auto-generated at build time
 * from @recipe TSDoc tags via `scripts/generate-recipes.ts`).
 * Recipes are annotated TypeScript code examples extracted from @recipe + @example blocks.
 * AI agents can search for "how to create a purchase order" and get working code.
 *
 * @intent Provide AI agents with working code examples
 * @capability ai-recipe-discovery
 */
export class RecipeRegistry {
  /** Get recipes by category. */
  select(filter: { category?: string; role?: 'ai-agent' | 'human-tester' | 'both' }): RecipeEntry[];

  /** Semantic search — finds recipes by intent/description. */
  search(query: string): RecipeEntry[];

  /** Get all recipes as AI-friendly JSON. */
  forAI(): RecipeEntry[];

  /** Get top N recipes (by @recipe priority tag, or first N if no priority). */
  getTopRecipes(n: number): RecipeEntry[];
}
```

**Initial recipes** (seeded from @example blocks in source):

- `AUTH-001`: BTP SAML auth setup
- `AUTH-002`: Basic auth with env vars
- `NAV-001`: Navigate to FLP tile by name
- `NAV-002`: Navigate by semantic object hash
- `UI5-001`: Find button by text, click
- `UI5-002`: Fill input by ID
- `UI5-003`: Discover all controls on page
- `FE-001`: Filter List Report + execute search + navigate to item
- `TBL-001`: Get table rows with column names
- `ODATA-001`: Read model data from OData binding
- `INTENT-001`: Create Purchase Order
- `INTENT-002`: Create Sales Order

**Test**: `tests/unit/ai/recipe-registry.test.ts`

### C6 — Bulk Discovery (ai/bulk-discovery.ts)

**File**: `src/ai/bulk-discovery.ts` (NEW — ~220 LOC)

````typescript
/**
 * Discovers all UI5 controls on the current page with business-friendly categorization.
 *
 * @remarks
 * **Primary use case**: AI agents need to "see" the current page without knowing
 * specific selectors. Call this at the start of an autonomous test session to build
 * a control inventory.
 *
 * **Dhikraft parity**: Equivalent to `bulkDiscovery.discoverAll()`.
 * Extends it with Praman's type system and error hierarchy.
 *
 * @intent Enumerate all interactive UI5 controls on the current page
 * @capability ui5-bulk-discovery
 * @sapModule All
 *
 * @example
 * ```typescript
 * // Find all interactive controls (form fields, buttons, etc.)
 * const inventory = await pramanAI.discoverPage({ interactiveOnly: true });
 * console.log('Form fields:', inventory.formFields.map(f => f.id));
 * console.log('Buttons:', inventory.buttons.map(b => b.text));
 * ```
 */
export async function discoverPage(
  page: Page,
  options?: {
    interactiveOnly?: boolean; // Default: false (include containers)
    includeHidden?: boolean; // Default: false (prefer visible, D25)
    timeout?: number; // Default: config.controlDiscoveryTimeout
  },
): Promise<AiResponse<PageContext>>;
````

**Implementation**:

- Uses `page.evaluate()` browser script to discover all registered UI5 controls
- Browser-side: `sap.ui.core.ElementRegistry.all()` (UI5 1.108+) or `sap.ui.core.Core.byId()` enumeration
- Classifies each control using `isInteractiveControl()` and `isContainerControl()` from `#core/constants/control-types.js`
- Category assignment using `detectObjectCategory()` from `#core/constants/object-categories.js`
- Activates `control-types.ts` and `object-categories.ts` (both currently dead code!)
- Extracts visible text via `getText()` or `getValue()` for AI context

> **Finding B7 (BLOCKER): page.evaluate() SERIALIZATION CONSTRAINT** (see MEMORY.md)
>
> ALL helper functions used inside `page.evaluate()` MUST be declared as **inner function declarations** inside the evaluated function body. Module-level functions, imports, and closures are NOT included in the serialized function body — they are stripped by V8.
>
> Concretely: `isInteractiveControl()`, `isContainerControl()`, and `detectObjectCategory()` CANNOT be imported at the module level and then referenced inside the evaluated callback. They MUST be copied inline as inner function declarations inside the `page.evaluate()` callback.
>
> Use `// eslint-disable-next-line sonarjs/no-identical-functions` to suppress the duplication warning on these intentionally duplicated inner functions.
>
> **Unit tests give FALSE POSITIVES for this bug** — they run in Node.js where module-level functions ARE accessible. This constraint MUST be verified with a real browser integration test (not just unit tests).

**Test**: `tests/unit/ai/bulk-discovery.test.ts`

- Mock page.evaluate to return fixture control list
- Verify interactive-only filter works
- Verify categorization: buttons vs form fields vs tables vs containers
- Verify `isInteractiveControl()` and `detectObjectCategory()` are called

### C7 — Agentic Handler (ai/agentic-handler.ts)

**File**: `src/ai/agentic-handler.ts` (NEW — ~260 LOC)

````typescript
/**
 * Autonomous test operation handler with checkpoint-based resumability.
 *
 * @remarks
 * BP-CLAUDE: Handler serializes progress `{ currentStep, completedSteps, remainingSteps, state }`
 * so AI agents can resume from last checkpoint on failure (chain-of-thought incremental execution).
 *
 * All LLM interactions return `AiResponse<T>` for consistent agent consumption (D29).
 *
 * @intent Execute autonomous SAP UI5 test operations
 * @capability ai-agentic-handler
 * @sapModule All
 */
export class AgenticHandler {
  constructor(
    private readonly llm: LlmService,
    private readonly contextBuilder: typeof buildPageContext,
    private readonly capabilityRegistry: CapabilityRegistry,
  );

  /**
   * Generate a test for a natural language scenario.
   *
   * @remarks
   * Returns `AiResponse<AiGeneratedTest>` — both natural language steps AND runnable TypeScript code.
   * Each step is executed separately via `interpretStep(step: string): Promise<AiResponse<void>>`
   * which maps step text to Praman fixture calls using the CapabilityRegistry.
   *
   * This two-phase design (generate → execute) enables checkpoint/resume (AgenticCheckpoint):
   * if step 3 fails, re-execute from step 3 without re-generating the full step list.
   *
   * @intent Translate business scenario to executable Praman test steps and code
   *
   * @example
   * ```typescript
   * const result = await pramanAI.agentic.generateTest(
   *   'Create a purchase order for vendor V001, material M1000, quantity 10'
   * );
   * if (result.status === 'success') {
   *   console.log('Steps:', result.data.steps);
   *   console.log('Code:', result.data.code);
   *   for (const step of result.data.steps) {
   *     await pramanAI.agentic.interpretStep(step);
   *   }
   * }
   * ```
   */
  generateTest(scenario: string, page: Page): Promise<AiResponse<AiGeneratedTest>>;

  /**
   * Execute a single natural language step by mapping it to Praman fixture calls.
   *
   * @remarks
   * Maps step text to registered capabilities in CapabilityRegistry.
   * Used with `generateTest()` for two-phase generate → execute workflow.
   * On failure, the AgenticCheckpoint captures progress for resume.
   *
   * @intent Execute a single natural language step
   */
  interpretStep(step: string, page: Page): Promise<AiResponse<void>>;

  /**
   * Suggest next actions given the current page state.
   * Returns AI-recommended operations based on discovered controls.
   */
  suggestActions(pageContext: PageContext): Promise<AiResponse<string[]>>;

  /**
   * Serialize current execution checkpoint for resumability (D9).
   */
  saveCheckpoint(checkpoint: AgenticCheckpoint): void;

  /**
   * Resume from a previously saved checkpoint.
   */
  resumeFromCheckpoint(checkpointId: string): AgenticCheckpoint | undefined;
}
````

#### Dual Output: Steps + Generated TypeScript Code

`generateTest()` returns `AiGeneratedTest` (add to C1 types.ts):

```typescript
interface AiGeneratedTest {
  /** Natural language steps for review/documentation */
  steps: string[];
  /** Runnable TypeScript Playwright test code */
  code: string;
  /** Metadata about the generation */
  metadata: {
    model: string;
    tokens: { input: number; output: number };
    duration: number;
    capabilities: string[]; // Which capabilities were used
  };
}
```

**Prompt design** (system + user):

System prompt (injected once per session):

```
You are a Playwright test generator for SAP UI5 applications using the Praman library.
Generate both:
1. A numbered list of test steps (natural language)
2. Complete TypeScript test code using Praman fixtures

Available capabilities:
{capabilityRegistry.list().map(c => `- ${c.name}: ${c.description}`).join('\n')}

Example recipes:
{recipeRegistry.getTopRecipes(5).map(r => r.code).join('\n\n')}

Rules:
- Use only capabilities listed above
- Use TypeScript strict mode
- Import from 'playwright-praman'
- Use async/await
- Wrap test in test() block from Praman
```

User prompt template:

```
Page context:
{JSON.stringify(pageContext, null, 2)}

Test scenario:
{scenario}

Respond with JSON:
{
  "steps": ["step 1...", "step 2..."],
  "code": "import { test } from 'playwright-praman';\n..."
}
```

**Zod response schema** for `generateTest()`:

```typescript
const AiGeneratedTestSchema = z.object({
  steps: z.array(z.string()).min(1).max(20),
  code: z.string().min(50), // Must have non-trivial code
});
```

**`interpretStep()` algorithm**:

1. Receive natural language step: `"Fill Supplier field with vendor 100001"`
2. Use VocabularyService to resolve business terms: `"Supplier"` → UI5Selector
3. Search CapabilityRegistry for matching capability: `fillField` (fuzzy match on step text)
4. Construct Praman fixture call: `await intent.fillField('Supplier', '100001')`
5. Return `{ capability: 'fillField', call: '...' }` or throw `AiError` if no match

**Test**: `tests/unit/ai/agentic-handler.test.ts`

- Mock LlmService — verify prompts are constructed correctly (includes capability list + recipe examples)
- Mock page context — verify suggestActions returns non-empty array
- Verify checkpoint save/resume roundtrip
- Verify AiResponse<AiGeneratedTest> envelope shape (steps + code + metadata)
- Verify generateTest returns both steps array and TypeScript code string
- Verify interpretStep resolves capability from CapabilityRegistry

### C8 — AI Barrel (ai/index.ts)

**File**: `src/ai/index.ts` (IMPLEMENT — from 4-LOC stub, ~80 LOC)

Public exports for `playwright-praman/ai`:

> **Finding M3 (MEDIUM)**: The original barrel was missing several type exports.

```typescript
// All type exports from C1:
export type {
  AiResponse,
  AiProviderConfig,
  CapabilityEntry,
  RecipeEntry,
  AgenticCheckpoint,
  DiscoveredControl,
  PageContext,
} from './types.js';
// Service interface type:
export type { LlmService } from './llm-service.js';
// Implementations:
export { createLlmService } from './llm-service.js';
export { CapabilityRegistry } from './capability-registry.js';
export { RecipeRegistry } from './recipe-registry.js';
export { AgenticHandler } from './agentic-handler.js';
export { discoverPage } from './bulk-discovery.js';
export { buildPageContext } from './context-builder.js';
```

### C9 — pramanAI Fixture (fixtures/ai-fixtures.ts)

**File**: `src/fixtures/ai-fixtures.ts` (NEW — ~220 LOC)

````typescript
/**
 * AI test fixtures — pramanAI fixture.
 *
 * @remarks
 * Lazy-loaded via dynamic import (D2 BP-CLAUDE: minimal footprint).
 * Only loaded when a test requests `pramanAI` in its fixture destructuring.
 *
 * @example
 * ```typescript
 * test('AI-assisted discovery', async ({ pramanAI, ui5 }) => {
 *   // Discover all interactive controls on the page
 *   const inventory = await pramanAI.discoverPage({ interactiveOnly: true });
 *   console.log('Form fields:', inventory.data?.formFields.map(f => f.id));
 *
 *   // Get AI-powered action suggestions
 *   const suggestions = await pramanAI.agentic.suggestActions(inventory.data!);
 * });
 * ```
 */
type PramanAIFixture = {
  /** Bulk page discovery — enumerate all UI5 controls. */
  discoverPage: (options?: DiscoverPageOptions) => Promise<AiResponse<PageContext>>;

  /** Capability registry — what can Praman do? */
  capabilities: CapabilityRegistry;

  /** Recipe registry — code examples. */
  recipes: RecipeRegistry;

  /** Agentic handler — autonomous operations. */
  agentic: AgenticHandler;

  /** Raw LLM service — for custom prompts. */
  llm: LlmService;

  /** Build AI context from current page. */
  buildContext: () => Promise<AiResponse<PageContext>>;

  /** Vocabulary service for SAP term resolution. */
  vocabulary: VocabularyService;
};

// ⚠️ BLOCKER FIX B3: aiTest must extend moduleTest (not coreTest) so that
// pramanAI fixture has access to ui5.table, ui5.dialog, ui5.date, ui5.odata.
// coreTest is already inside moduleTest — do NOT duplicate it in mergeTests().
import { moduleTest } from './module-fixtures.js';

// ⚠️ BLOCKER FIX B2: Dynamic imports MUST use source path aliases (#ai/index.js),
// NOT published sub-paths ('playwright-praman/ai'). Published sub-paths only resolve
// after npm run build. In dev/vitest they will throw MODULE_NOT_FOUND.
export const aiTest = moduleTest.extend<{ pramanAI: PramanAIFixture }>({
  // ⚠️ MEDIUM FIX M2: Scope is 'test' (default) — each test gets isolated AI context.
  // Worker scope would share LLM state across tests — not suitable for reliable AI testing.
  pramanAI: async ({ pramanConfig, page, ui5Navigation }, use) => {
    // Lazy load — only executed when pramanAI is in test signature
    // Uses source path aliases (#ai/index.js) for dev/test resolution.
    // These aliases are defined in tsconfig.json and resolved by vite-tsconfig-paths.
    const {
      createLlmService,
      CapabilityRegistry,
      RecipeRegistry,
      AgenticHandler,
      discoverPage,
      buildPageContext,
    } = await import('#ai/index.js');
    const { createVocabularyService } = await import('#vocabulary/index.js');

    const llm = createLlmService(pramanConfig);
    const capabilities = new CapabilityRegistry();
    const recipes = new RecipeRegistry();
    const vocabulary = createVocabularyService();
    const agentic = new AgenticHandler(llm, buildPageContext, capabilities);

    // ⚠️ BLOCKER FIX B9: ui5Navigation is declared as a dependency so agentic operations
    // that need to navigate between screens can do so. pramanAI passes ui5Navigation through
    // to AgenticHandler context so it can navigate as part of autonomous sequences.
    await use({
      discoverPage: (opts) => discoverPage(page, opts),
      capabilities,
      recipes,
      agentic,
      llm,
      buildContext: () => buildPageContext(page, pramanConfig),
      vocabulary,
    });

    // ⚠️ BLOCKER FIX B8: Teardown — close any open LLM connections.
    // Must run AFTER await use() completes (Playwright fixture teardown convention).
    try {
      if (typeof (llm as { close?: () => Promise<void> }).close === 'function') {
        await (llm as { close: () => Promise<void> }).close();
      }
    } catch {
      // Shutdown failure is non-fatal — log but do not rethrow.
      // LLM connections may already be closed if provider timed out.
    }
  },
});
````

### C10–C15 — Vocabulary Module

> **Decision**: Vocabulary data and service logic are ported from dhikraft v2.5.0
> (`/Users/maheshwar/Documents/projects/package/src/vocabulary/`).
> Dhikraft has 6 production-ready JSON domain files (~500 terms) with:
>
> - Complete Levenshtein + fuzzy + synonym matching (already implemented, no npm dep)
> - Full service architecture (singleton, lazy loading, caching, hot-reload)
> - All 6 SAP domains: procurement, sales, finance, manufacturing, warehouse, quality
>
> **Porting strategy**: Option C (hybrid)
>
> - On-disk: Keep dhikraft's flat JSON format (task-optimized, ~500 terms preserved)
> - In-memory: Transform to Praman's Domain > Process > BusinessObject hierarchy in loader
> - Matcher: Port directly (pure Levenshtein algorithm, no changes needed)
> - Service: Port + adapt to extend `VocabularyError` instead of dhikraft errors
> - Error classes: All throws must use `VocabularyError` (created in A0b)
>
> **Source reference**: `/Users/maheshwar/Documents/projects/package/src/vocabulary/`
>
> **Porting tasks for each file**:
>
> 1. Copy source file to Praman target path
> 2. Update ALL imports to use `#vocabulary/*`, `#core/*` path aliases
> 3. Replace dhikraft error throws with `VocabularyError` equivalents
> 4. Update function signatures to use Praman's `Readonly<PramanConfig>` where config is needed
> 5. Remove dhikraft-specific features not in Phase 5 scope (SAP Planner fragment merge → Phase 7)
> 6. Add/update TSDoc comments to Praman standards (TSDoc not JSDoc, include @example)
> 7. Run `npm run lint && npm run typecheck`

**File structure**:

```
src/vocabulary/
├── types.ts                 (~100 LOC) — VocabularyTerm, VocabularyDomain, VocabularySearchResult
├── vocabulary-service.ts    (~250 LOC) — Main service (singleton, lazy-loading, caching)
├── vocabulary-matcher.ts    (~150 LOC) — Levenshtein distance, fuzzy match, synonym resolution
├── vocabulary-loader.ts     (~130 LOC) — Async JSON loading, hot-reload support
├── index.ts                 (~60 LOC)  — Public barrel
└── domains/
    ├── procurement.json     (~520 LOC) — MM: vendor, material, purchase order, GR/GI, plant (40+ terms)
    ├── sales.json           (~300 LOC) — SD: customer, sales order, quotation, delivery, billing (25+ terms)
    ├── finance.json         (~368 LOC) — FI: GL account, cost center, invoice, payment, asset (30+ terms)
    ├── manufacturing.json   (~338 LOC) — PP: production order, BOM, routing, work center, capacity (25+ terms)
    ├── warehouse.json       (~282 LOC) — WM: storage location, transfer order, HU, stock, LHR (20+ terms)
    └── quality.json         (~336 LOC) — QM: inspection lot, defect, characteristic, certificate (25+ terms)
```

**C14 — Domain JSON Files** (6 files, ported from dhikraft)

Files:

- `src/vocabulary/domains/procurement.json` (~520 lines, 40+ terms, MM module)
- `src/vocabulary/domains/sales.json` (~300 lines, 25+ terms, SD module)
- `src/vocabulary/domains/finance.json` (~368 lines, 30+ terms, FI module)
- `src/vocabulary/domains/manufacturing.json` (~338 lines, 25+ terms, PP module)
- `src/vocabulary/domains/warehouse.json` (~282 lines, 20+ terms, WM module)
- `src/vocabulary/domains/quality.json` (~336 lines, 25+ terms, QM module)

**JSON schema** validated against `src/vocabulary/schemas/vocabulary-schema.json` (also ported from dhikraft).

**Porting steps**:

1. Copy JSON files from `/Users/maheshwar/Documents/projects/package/src/vocabulary/domains/`
2. Update `$schema` reference path to Praman's schema location
3. Verify all `intentApiMethod` values match Praman fixture methods (may differ from dhikraft)
4. Run vocabulary loader against all 6 files to verify no parse errors

**VocabularyService interface**:

```typescript
export interface VocabularyService {
  /** Search for SAP business terms. Returns matches with confidence scores. */
  search(query: string, domain?: SAPDomain): Promise<VocabularySearchResult[]>;

  /** Resolve a business term to a UI5Selector. */
  getFieldSelector(term: string, domain?: SAPDomain): Promise<UI5Selector | undefined>;

  /** Autocomplete suggestions for partial terms. */
  getSuggestions(partial: string, maxResults?: number): Promise<string[]>;

  /** Preload vocabulary for a domain. */
  loadDomain(domain: SAPDomain): Promise<void>;

  /** Service statistics for observability. */
  getStats(): VocabularyServiceStats;
}

export type SAPDomain =
  | 'procurement'
  | 'sales'
  | 'finance'
  | 'manufacturing'
  | 'warehouse'
  | 'quality';
```

**Domain JSON structure** (per domain file):

```json
{
  "domain": "procurement",
  "version": "1.0.0",
  "businessObjects": [
    {
      "term": "vendor",
      "synonyms": ["supplier", "creditor", "Lieferant", "vendor number"],
      "sapField": "Vendor",
      "controlType": "sap.m.Input",
      "selector": { "controlType": "sap.m.Input", "properties": { "placeholder": "Vendor" } },
      "description": "SAP vendor master identifier (LFA1-LIFNR)"
    }
  ],
  "businessActions": [
    {
      "term": "create purchase order",
      "synonyms": ["new PO", "raise PO", "create PO", "ME21N"],
      "navigation": { "semanticObject": "PurchaseOrder", "action": "create" },
      "intent": "procurement.createPurchaseOrder"
    }
  ],
  "businessFields": [
    {
      "term": "purchase order number",
      "synonyms": ["PO number", "Bestellnummer", "EBELN"],
      "selector": { "controlType": "sap.m.Input", "properties": { "id": "PONumber" } }
    }
  ]
}
```

**Fuzzy Matching** (vocabulary-matcher.ts):

> **Finding H3 (HIGH)**: The original plan mentioned "Levenshtein distance" but did not specify the implementation. Do NOT add an npm dependency for this.

> **Finding H8 (HIGH)**: The original threshold of 0.7 was too low and may resolve wrong fields when multiple matches exist above threshold.

- **Levenshtein distance**: Implement as a pure inline function (~20 LOC) inside `vocabulary-matcher.ts`. No additional npm dependency. Document the algorithm in a `@remarks` TSDoc block. This is a standard DP algorithm — no external library needed.
- Synonym resolution (exact match on synonyms = 1.0 confidence)
- Prefix match (starts with query = 0.9 confidence)
- Partial match (contains query = 0.7 confidence)
- Fuzzy match (Levenshtein ≤ threshold = 0.5 confidence)
- Returns sorted by confidence descending
- **Single-field match threshold**: 0.85 minimum for returning a result as a single resolved selector
- **Disambiguation behavior**: If multiple matches score above 0.7 but below the single-field threshold, return an empty array and require explicit disambiguation (caller must refine the query)
- Document this behavior in `getFieldSelector()` TSDoc: "Returns `undefined` when no match exceeds confidence 0.85 or when multiple matches exist above 0.7"

**Test**: `tests/unit/vocabulary/vocabulary-matcher.test.ts`

- Hermetic — pure algorithm, no network
- Test Levenshtein: "vendro" → "vendor" (distance 2)
- Test synonym: "supplier" → "vendor" (confidence 1.0)
- Test domain-specific isolation
- Test empty query returns empty results
- Test no match returns empty results
- Test accented chars: "Lieferant" → "vendor" synonym match, "Münchner" handling
- Test case insensitivity
- Test disambiguation: multiple matches above 0.7 returns empty for getFieldSelector()
- Test single strong match above 0.85 is returned by getFieldSelector()
- Test results are sorted by confidence descending

---

## 8. Batch D — Intents (Procurement + Sales + Finance + Manufacturing + Master Data)

> **Duration**: 5 days (Week 3)
> **TDD**: Write failing test for each intent method first.

### D1 — Intent Types (intents/types.ts)

**File**: `src/intents/types.ts` (NEW — ~100 LOC)

```typescript
/** Result type for intent operations. Wraps AiResponse with intent-specific metadata. */
export type IntentResult<T> = AiResponse<T> & {
  readonly metadata: AiResponse<T>['metadata'] & {
    readonly intentName: string; // e.g., 'procurement.createPurchaseOrder'
    readonly sapModule: string; // e.g., 'MM', 'SD'
    readonly stepsExecuted: string[];
  };
};

/** Base parameters all domain intents accept. */
export interface IntentOptions {
  /** Skip navigation if already on the correct app. Default: false. */
  skipNavigation?: boolean;
  /** Timeout for the entire intent operation. Default: 60_000ms. */
  timeout?: number;
  /** Whether to validate result via OData after UI interaction. Default: false. */
  validateViaOData?: boolean;
}
```

### D2 — Core Wrappers (intents/core-wrappers.ts)

**File**: `src/intents/core-wrappers.ts` (NEW — ~260 LOC)

High-level intent-level wrappers over the ui5 fixture. These are the building blocks domain intents use internally — they can also be used directly by test authors.

```typescript
/**
 * Core intent wrappers — semantic UI5 interactions using business terminology.
 *
 * @remarks
 * Unlike `ui5.fill()` which requires a UI5Selector, these wrappers accept
 * human-readable labels and use the vocabulary service to resolve selectors.
 *
 * @intent Interact with UI5 controls using business labels, not technical selectors
 * @capability intent-core-wrappers
 * @sapModule All
 */

/** Fill a form field identified by its label. Resolves label → selector via vocabulary. */
export async function fillField(
  ui5: UI5Handler,
  vocabulary: VocabularyService,
  label: string,
  value: string,
  options?: IntentOptions,
): Promise<IntentResult<void>>;

/** Click a button by its display text. */
export async function clickButton(
  ui5: UI5Handler,
  text: string,
  options?: IntentOptions,
): Promise<IntentResult<void>>;

/** Select an option from a ComboBox or Select by display text. */
export async function selectOption(
  ui5: UI5Handler,
  vocabulary: VocabularyService,
  label: string,
  option: string,
  options?: IntentOptions,
): Promise<IntentResult<void>>;

/** Assert a field value using business label. */
export async function assertField(
  ui5: UI5Handler,
  vocabulary: VocabularyService,
  label: string,
  expected: string,
  options?: IntentOptions,
): Promise<IntentResult<boolean>>;

/** Navigate to an app and execute a search in the filter bar. */
export async function navigateAndSearch(
  ui5Nav: UI5NavigationAPI,
  ui5: UI5Handler,
  appHash: string,
  searchTerm?: string,
  options?: IntentOptions,
): Promise<IntentResult<void>>;

/** Confirm a dialog and wait for UI5 stability. */
export async function confirmAndWait(
  ui5: UI5Handler,
  options?: IntentOptions,
): Promise<IntentResult<void>>;

/** Wait for a save operation to complete (looks for success toast or stability). */
export async function waitForSave(
  ui5: UI5Handler,
  options?: IntentOptions,
): Promise<IntentResult<void>>;
```

**Test**: `tests/unit/intents/core-wrappers.test.ts`

- Mock UI5Handler — verify correct control type + property selectors used
- Mock VocabularyService — verify term resolution called before ui5.fill()
- Verify IntentResult envelope has correct intentName + sapModule

> **Finding H5 (HIGH)**: The original spec did not define what happens when vocabulary resolution fails.

**Vocabulary resolution failure behavior** (must be explicitly implemented in `fillField()` and related wrappers):

- If `vocabularyService.getFieldSelector(label)` returns `undefined` (term not found or confidence below threshold):
  - Return `{ status: 'error', error: VocabularyError({ code: 'ERR_VOCAB_TERM_NOT_FOUND', retryable: false, suggestions: ['Check if term exists in vocabulary domain', 'Use ui5.control() with explicit selector instead'] }), metadata: { ... } }`
  - Do NOT throw — return error status in the `IntentResult` envelope
- Additional test case: `fillField()` with unknown label returns `IntentResult` with `status: 'error'` and `code: 'ERR_VOCAB_TERM_NOT_FOUND'`

> **Finding L2 (LOW)**: Use `Pick<UI5Handler, 'control' | 'click' | 'fill' | 'select' | 'getText' | 'waitForUI5Stable'>` instead of the full `UI5Handler` class for the `ui5` parameter in core-wrappers functions. This improves testability — mocks need only implement the used subset.

### D3 — Procurement Domain (intents/domains/procurement.ts)

**File**: `src/intents/domains/procurement.ts` (NEW — ~300 LOC)

````typescript
/**
 * Procurement (MM) intent API — business-level purchase order operations.
 *
 * @remarks
 * All functions navigate to the correct Fiori app, interact with UI5 controls
 * using business-level field names, and return structured results.
 *
 * Each function wraps multiple Praman fixture calls into a single business operation.
 *
 * @intent Execute SAP procurement business operations
 * @capability intent-procurement
 * @sapModule MM — Materials Management
 * @businessContext Purchase-to-Pay process automation
 *
 * @example
 * ```typescript
 * test('create purchase order', async ({ intent }) => {
 *   const result = await intent.procurement.createPurchaseOrder({
 *     vendor: 'V001',
 *     material: 'M1000',
 *     quantity: 10,
 *     plant: '1000',
 *   });
 *   expect(result.status).toBe('success');
 *   expect(result.data?.poNumber).toMatch(/^\d{10}$/);
 * });
 * ```
 */

export interface CreatePOInput {
  vendor: string; // Vendor number or name (vocabulary-resolved)
  material: string; // Material number
  quantity: number;
  plant: string;
  deliveryDate?: string; // ISO 8601 or display format (D28 auto-converts)
  purchasingGroup?: string;
  documentType?: string; // Default: 'NB'
}

export interface CreatePOResult {
  poNumber: string;
  vendor: string;
  totalAmount?: number;
}

/** Create a standard purchase order (ME21N equivalent). */
export async function createPurchaseOrder(
  ui5: UI5Handler,
  ui5Nav: UI5NavigationAPI,
  vocabulary: VocabularyService,
  input: CreatePOInput,
  options?: IntentOptions,
): Promise<IntentResult<CreatePOResult>>;

/** Approve a purchase order that is pending approval. */
export async function approvePurchaseOrder(
  ui5: UI5Handler,
  ui5Nav: UI5NavigationAPI,
  input: { poNumber: string },
  options?: IntentOptions,
): Promise<IntentResult<void>>;

/** Search purchase orders by criteria (ME2M/ME2L equivalent). */
export async function searchPurchaseOrders(
  ui5: UI5Handler,
  ui5Nav: UI5NavigationAPI,
  vocabulary: VocabularyService,
  criteria: { vendor?: string; material?: string; dateRange?: [string, string] },
  options?: IntentOptions,
): Promise<IntentResult<{ rows: Record<string, string>[] }>>;

/** Create a purchase requisition (ME51N equivalent). */
export async function createPurchaseRequisition(
  ui5: UI5Handler,
  ui5Nav: UI5NavigationAPI,
  vocabulary: VocabularyService,
  input: { description: string; quantity: number; plant: string; deliveryDate?: string },
  options?: IntentOptions,
): Promise<IntentResult<{ prNumber: string }>>;

/** Confirm goods receipt for a PO (MIGO GR equivalent). */
export async function confirmGoodsReceipt(
  ui5: UI5Handler,
  ui5Nav: UI5NavigationAPI,
  input: { poNumber: string; quantity?: number; movementType?: '101' | '102' },
  options?: IntentOptions,
): Promise<IntentResult<{ materialDocNumber: string }>>;

/** Search vendors by name or country. */
export async function searchVendors(
  ui5: UI5Handler,
  ui5Nav: UI5NavigationAPI,
  criteria: { name?: string; country?: string },
  options?: IntentOptions,
): Promise<IntentResult<{ vendors: Array<{ id: string; name: string; country: string }> }>>;
````

**Test**: `tests/unit/intents/procurement.test.ts`

- Mock UI5Handler and UI5NavigationAPI
- Verify `createPurchaseOrder` calls `navigateToApp('PurchaseOrder-create')` with correct hash
- Verify vendor field filled via `fillField()` with vocabulary resolution
- Verify `IntentResult.metadata.sapModule === 'MM'`
- Verify `IntentResult.metadata.stepsExecuted` contains operation steps

> **Finding M6 (MEDIUM)**: Intent functions are "reference implementations" that may fail on customized SAP systems where field labels differ.

**Selector override pattern** — add `selectors?` option to `IntentOptions` for each domain function:

```typescript
// Extended IntentOptions for domain functions:
interface ProcurementIntentOptions extends IntentOptions {
  selectors?: {
    vendorField?: string; // Override vocabulary-resolved vendor field selector
    materialField?: string; // Override vocabulary-resolved material field selector
    quantityField?: string; // Override vocabulary-resolved quantity field selector
    plantField?: string; // Override vocabulary-resolved plant field selector
  };
}
```

Document in TSDoc for all D3 and D4 functions:
`@remarks SAP Standard Reference Implementation — for customized Fiori systems where field labels differ from SAP standard, pass explicit selectors via the options.selectors override.`

### D4 — Sales Domain (intents/domains/sales.ts)

**File**: `src/intents/domains/sales.ts` (NEW — ~250 LOC)

````typescript
/**
 * Sales (SD) intent API — business-level sales order operations.
 *
 * @intent Execute SAP sales business operations
 * @capability intent-sales
 * @sapModule SD — Sales & Distribution
 * @businessContext Order-to-Cash process automation
 *
 * @example
 * ```typescript
 * test('create sales order', async ({ intent }) => {
 *   const result = await intent.sales.createSalesOrder({
 *     customer: 'CUST-001',
 *     material: 'PROD-500',
 *     quantity: 5,
 *     deliveryDate: '2026-03-01',
 *   });
 *   expect(result.status).toBe('success');
 * });
 * ```
 */

export interface CreateSOInput {
  customer: string; // Customer number or name (vocabulary-resolved)
  material: string;
  quantity: number;
  deliveryDate?: string;
  salesOrganization?: string;
  distributionChannel?: string;
  division?: string;
}

/** Create a standard sales order (VA01 equivalent). */
export async function createSalesOrder(
  ui5: UI5Handler,
  ui5Nav: UI5NavigationAPI,
  vocabulary: VocabularyService,
  input: CreateSOInput,
  options?: IntentOptions,
): Promise<IntentResult<{ soNumber: string; netAmount?: number }>>;

/** Create a quotation (VA21 equivalent). */
export async function createQuotation(
  ui5: UI5Handler,
  ui5Nav: UI5NavigationAPI,
  vocabulary: VocabularyService,
  input: Omit<CreateSOInput, 'deliveryDate'>,
  options?: IntentOptions,
): Promise<IntentResult<{ quotationNumber: string }>>;

/** Approve a pending quotation. */
export async function approveQuotation(
  ui5: UI5Handler,
  ui5Nav: UI5NavigationAPI,
  input: { quotationNumber: string },
  options?: IntentOptions,
): Promise<IntentResult<void>>;

/** Search sales orders (VA05 equivalent). */
export async function searchSalesOrders(
  ui5: UI5Handler,
  ui5Nav: UI5NavigationAPI,
  criteria: { customer?: string; dateRange?: [string, string] },
  options?: IntentOptions,
): Promise<IntentResult<{ rows: Record<string, string>[] }>>;

/** Search customers by name or country. */
export async function searchCustomers(
  ui5: UI5Handler,
  ui5Nav: UI5NavigationAPI,
  criteria: { name?: string; country?: string },
  options?: IntentOptions,
): Promise<IntentResult<{ customers: Array<{ id: string; name: string }> }>>;

/** Check delivery status for a sales order. */
export async function checkDeliveryStatus(
  ui5: UI5Handler,
  ui5Nav: UI5NavigationAPI,
  input: { salesOrderNumber: string },
  options?: IntentOptions,
): Promise<IntentResult<{ status: string; deliveryNumber?: string }>>;
````

> **Finding M6 (MEDIUM) — Sales domain**: Same selector override pattern applies to D4. Each sales function also accepts `selectors?` override in IntentOptions:
>
> ```typescript
> interface SalesIntentOptions extends IntentOptions {
>   selectors?: {
>     customerField?: string; // Override vocabulary-resolved customer field selector
>     materialField?: string; // Override vocabulary-resolved material field selector
>     salesOrgField?: string; // Override vocabulary-resolved sales organization field
>   };
> }
> ```

### D5 — Finance Intent Domain (FI)

**File**: `src/intents/domains/finance.ts` (NEW — ~250 LOC)

**Reference**: Dhikraft `src/intent-api/domains/finance-intent-api.ts`

**TDD**: Write test first in `tests/unit/intents/finance.test.ts`

**Exports**:

```typescript
/** @intent Create journal entry in SAP FI */
export async function createJournalEntry(
  page: Page,
  data: JournalEntryData,
  fixtures: IntentDependencies,
  options?: IntentOptions,
): Promise<IntentResult>;

/** @intent Post vendor invoice in SAP FI */
export async function postVendorInvoice(
  page: Page,
  data: VendorInvoiceData,
  fixtures: IntentDependencies,
  options?: IntentOptions,
): Promise<IntentResult>;

/** @intent Process customer payment in SAP FI */
export async function processPayment(
  page: Page,
  data: PaymentData,
  fixtures: IntentDependencies,
  options?: IntentOptions,
): Promise<IntentResult>;
```

**FI navigation** (via `ui5Navigation.navigateToApp`):

- Journal Entry: Fiori app `F0718` (Create Journal Entry)
- Vendor Invoice: Fiori app `F1639` (Create Supplier Invoice)
- Payment: Fiori app `F2695` (Post Outgoing Payment)

**Input types**: `JournalEntryData`, `VendorInvoiceData`, `PaymentData` — defined in `src/intents/types.ts` (add to D1)

---

### D6 — Manufacturing Intent Domain (PP)

**File**: `src/intents/domains/manufacturing.ts` (NEW — ~250 LOC)

**Reference**: Dhikraft `src/intent-api/domains/manufacturing-intent-api.ts`

**TDD**: Write test first in `tests/unit/intents/manufacturing.test.ts`

**Exports**:

```typescript
/** @intent Create production order in SAP PP */
export async function createProductionOrder(
  page: Page,
  data: ProductionOrderData,
  fixtures: IntentDependencies,
  options?: IntentOptions,
): Promise<IntentResult>;

/** @intent Confirm production order operation in SAP PP */
export async function confirmProductionOrder(
  page: Page,
  data: ProductionConfirmationData,
  fixtures: IntentDependencies,
  options?: IntentOptions,
): Promise<IntentResult>;
```

**PP navigation**:

- Production Order Create: Fiori app `F0074`
- Confirmation: Fiori app `F0180`

---

### D7 — Master Data Intent Domain

**File**: `src/intents/domains/master-data.ts` (NEW — ~200 LOC)

**Reference**: Dhikraft `src/intent-api/domains/master-data-intent-api.ts`

**TDD**: Write test first in `tests/unit/intents/master-data.test.ts`

**Exports**:

```typescript
/** @intent Create/update vendor master data */
export async function createVendorMaster(
  page: Page,
  data: VendorMasterData,
  fixtures: IntentDependencies,
  options?: IntentOptions,
): Promise<IntentResult>;

/** @intent Create/update customer master data */
export async function createCustomerMaster(
  page: Page,
  data: CustomerMasterData,
  fixtures: IntentDependencies,
  options?: IntentOptions,
): Promise<IntentResult>;

/** @intent Create/update material master data */
export async function createMaterialMaster(
  page: Page,
  data: MaterialMasterData,
  fixtures: IntentDependencies,
  options?: IntentOptions,
): Promise<IntentResult>;
```

---

### D8 — Intents Barrel (intents/index.ts)

**File**: `src/intents/index.ts` (IMPLEMENT — from 4-LOC stub, ~80 LOC)

> **Finding M3 (MEDIUM)**: The original barrel was missing input/result type exports.

```typescript
// Types (complete list — M3 fix):
export type { IntentResult, IntentOptions } from './types.js';
// Domain-specific input/result types (needed by intent fixture consumers):
export type { CreatePOInput, CreatePOResult } from './domains/procurement.js';
export type { CreateSOInput, ApprovePOInput } from './domains/sales.js';
export type { JournalEntryData, VendorInvoiceData, PaymentData } from './domains/finance.js';
export type { ProductionOrderData, ProductionConfirmationData } from './domains/manufacturing.js';
export type {
  VendorMasterData,
  CustomerMasterData,
  MaterialMasterData,
} from './domains/master-data.js';
// Core wrapper functions:
export {
  fillField,
  clickButton,
  selectOption,
  assertField,
  navigateAndSearch,
  confirmAndWait,
  waitForSave,
} from './core-wrappers.js';
// Domain namespaces:
export * as procurement from './domains/procurement.js';
export * as sales from './domains/sales.js';
export * as finance from './domains/finance.js';
export * as manufacturing from './domains/manufacturing.js';
export * as masterData from './domains/master-data.js';
```

### D9 — Intent Fixture (fixtures/intent-fixtures.ts)

**File**: `src/fixtures/intent-fixtures.ts` (NEW — ~200 LOC)

````typescript
/**
 * Intent test fixtures — `intent` fixture.
 *
 * @remarks
 * Lazy-loaded via dynamic import. Only loaded when test requests `intent` fixture.
 * Vocabulary is loaded lazily on first access per domain.
 *
 * @example
 * ```typescript
 * test('create PO workflow', async ({ intent }) => {
 *   // High-level business operations — no selector knowledge required
 *   const po = await intent.procurement.createPurchaseOrder({
 *     vendor: 'Acme Corp',   // vocabulary resolves 'Acme Corp' → vendor number
 *     material: 'M1000',
 *     quantity: 100,
 *     plant: '1000',
 *   });
 *   expect(po.status).toBe('success');
 *   expect(po.data?.poNumber).toBeDefined();
 * });
 * ```
 */
type IntentFixture = {
  /** Core wrappers — label-based interactions. */
  core: {
    fillField: (label: string, value: string, options?: IntentOptions) => Promise<IntentResult<void>>;
    clickButton: (text: string, options?: IntentOptions) => Promise<IntentResult<void>>;
    selectOption: (label: string, option: string, options?: IntentOptions) => Promise<IntentResult<void>>;
    assertField: (label: string, expected: string, options?: IntentOptions) => Promise<IntentResult<boolean>>;
    confirmAndWait: (options?: IntentOptions) => Promise<IntentResult<void>>;
    waitForSave: (options?: IntentOptions) => Promise<IntentResult<void>>;
  };
  /** Procurement (MM) domain — purchase orders, requisitions, goods receipts. */
  procurement: {
    createPurchaseOrder: (input: CreatePOInput, options?: IntentOptions) => Promise<IntentResult<CreatePOResult>>;
    approvePurchaseOrder: (input: { poNumber: string }, options?: IntentOptions) => Promise<IntentResult<void>>;
    searchPurchaseOrders: (criteria: ..., options?: IntentOptions) => Promise<IntentResult<...>>;
    createPurchaseRequisition: (input: ..., options?: IntentOptions) => Promise<IntentResult<...>>;
    confirmGoodsReceipt: (input: ..., options?: IntentOptions) => Promise<IntentResult<...>>;
    searchVendors: (criteria: ..., options?: IntentOptions) => Promise<IntentResult<...>>;
  };
  /** Sales (SD) domain — sales orders, quotations, deliveries. */
  sales: {
    createSalesOrder: (input: CreateSOInput, options?: IntentOptions) => Promise<IntentResult<...>>;
    createQuotation: (input: ..., options?: IntentOptions) => Promise<IntentResult<...>>;
    approveQuotation: (input: ..., options?: IntentOptions) => Promise<IntentResult<void>>;
    searchSalesOrders: (criteria: ..., options?: IntentOptions) => Promise<IntentResult<...>>;
    searchCustomers: (criteria: ..., options?: IntentOptions) => Promise<IntentResult<...>>;
    checkDeliveryStatus: (input: ..., options?: IntentOptions) => Promise<IntentResult<...>>;
  };
};

// ⚠️ BLOCKER FIX B2: Dynamic imports MUST use source path aliases, not published sub-paths.
// ⚠️ BLOCKER FIX B10: Domain preloading MUST be fully awaited BEFORE calling use().
export const intentTest = aiTest.extend<{ intent: IntentFixture }>({
  intent: async ({ pramanConfig, ui5, ui5Navigation }, use) => {
    // Lazy load using source path aliases (resolved by vite-tsconfig-paths in dev/test)
    const [intentModule, vocabModule] = await Promise.all([
      import('#intents/index.js'),
      import('#vocabulary/index.js'),
    ]);

    const vocabulary = vocabModule.createVocabularyService();

    // ⚠️ BLOCKER FIX B10: Preload MUST be fully awaited BEFORE calling use().
    // If this await is missing or non-blocking, vocabulary.getFieldSelector() will
    // return undefined for the first test that runs against a cold cache.
    await Promise.all([
      vocabulary.loadDomain('procurement'),
      vocabulary.loadDomain('sales'),
      vocabulary.loadDomain('finance'),
      vocabulary.loadDomain('manufacturing'),
      // Note: warehouse and quality vocabulary loaded on demand (not preloaded)
      // Master Data uses procurement/sales vocabulary entries — no separate domain
    ]);

    // Only call use() AFTER all domain vocabulary is loaded and ready.
    // ⚠️ MEDIUM FIX M1: Concrete binding pattern (not pseudocode):
    await use({
      core: {
        fillField:    (label, value, opts) => intentModule.fillField(ui5, vocabulary, label, value, opts),
        clickButton:  (text, opts)         => intentModule.clickButton(ui5, text, opts),
        selectOption: (label, value, opts) => intentModule.selectOption(ui5, vocabulary, label, value, opts),
        assertField:  (label, expected, opts) => intentModule.assertField(ui5, vocabulary, label, expected, opts),
        confirmAndWait: (opts)             => intentModule.confirmAndWait(ui5, opts),
        waitForSave:  (opts)               => intentModule.waitForSave(ui5, opts),
      },
      procurement: {
        createPurchaseOrder: (input, opts) =>
          intentModule.procurement.createPurchaseOrder(ui5, ui5Navigation, vocabulary, input, opts),
        approvePurchaseOrder: (input, opts) =>
          intentModule.procurement.approvePurchaseOrder(ui5, ui5Navigation, input, opts),
        searchPurchaseOrders: (criteria, opts) =>
          intentModule.procurement.searchPurchaseOrders(ui5, ui5Navigation, vocabulary, criteria, opts),
        createPurchaseRequisition: (input, opts) =>
          intentModule.procurement.createPurchaseRequisition(ui5, ui5Navigation, vocabulary, input, opts),
        confirmGoodsReceipt: (input, opts) =>
          intentModule.procurement.confirmGoodsReceipt(ui5, ui5Navigation, input, opts),
        searchVendors: (criteria, opts) =>
          intentModule.procurement.searchVendors(ui5, ui5Navigation, criteria, opts),
      },
      sales: {
        createSalesOrder: (input, opts) =>
          intentModule.sales.createSalesOrder(ui5, ui5Navigation, vocabulary, input, opts),
        createQuotation: (input, opts) =>
          intentModule.sales.createQuotation(ui5, ui5Navigation, vocabulary, input, opts),
        approveQuotation: (input, opts) =>
          intentModule.sales.approveQuotation(ui5, ui5Navigation, input, opts),
        searchSalesOrders: (criteria, opts) =>
          intentModule.sales.searchSalesOrders(ui5, ui5Navigation, criteria, opts),
        searchCustomers: (criteria, opts) =>
          intentModule.sales.searchCustomers(ui5, ui5Navigation, criteria, opts),
        checkDeliveryStatus: (input, opts) =>
          intentModule.sales.checkDeliveryStatus(ui5, ui5Navigation, input, opts),
      },
    });
    // No teardown needed for intent fixture — vocabulary is in-memory, not stateful connections
  },
});
````

---

## 9. Complete File Inventory

### New Files (Phase 5)

| File                                        | LOC (est.) | Batch | Type               |
| ------------------------------------------- | ---------- | ----- | ------------------ |
| `src/core/errors/ai-error.ts`               | 50         | A0    | Source (Tier 1)    |
| `src/core/errors/vocabulary-error.ts`       | 40         | A0    | Source (Tier 1)    |
| `src/core/errors/intent-error.ts`           | 40         | A0    | Source (Tier 1)    |
| `src/matchers/types.d.ts`                   | 80         | A3    | Declaration        |
| `scripts/generate-skill-md.ts`              | 300        | B1    | Script (from stub) |
| `SKILL.md`                                  | 300        | B2    | Markdown           |
| `skills/ui5-controls.md`                    | 150        | B3    | Markdown           |
| `skills/authentication.md`                  | 150        | B3    | Markdown           |
| `skills/navigation.md`                      | 120        | B3    | Markdown           |
| `skills/fiori-elements.md`                  | 150        | B3    | Markdown           |
| `skills/table-dialog-date.md`               | 150        | B3    | Markdown           |
| `skills/odata.md`                           | 100        | B3    | Markdown           |
| `skills/ai-capabilities.md`                 | 150        | B3    | Markdown           |
| `skills/capabilities-reference.md`          | auto       | B4    | Generated          |
| `src/ai/types.ts`                           | 120        | C1    | Source             |
| `src/ai/llm-service.ts`                     | 220        | C2    | Source             |
| `src/ai/schemas/llm-request.schema.ts`      | 60         | C2    | Source             |
| `src/ai/schemas/llm-response.schema.ts`     | 60         | C2    | Source             |
| `src/ai/context-builder.ts`                 | 200        | C3    | Source             |
| `src/ai/capability-registry.ts`             | 200        | C4    | Source             |
| `src/ai/capability-registry.generated.ts`   | auto       | C4    | Generated          |
| `src/ai/recipe-registry.ts`                 | 180        | C5    | Source             |
| `src/ai/recipe-registry.generated.ts`       | auto       | C5    | Generated          |
| `src/ai/bulk-discovery.ts`                  | 220        | C6    | Source             |
| `src/ai/agentic-handler.ts`                 | 260        | C7    | Source             |
| `src/ai/index.ts`                           | 80         | C8    | Barrel (from stub) |
| `src/fixtures/ai-fixtures.ts`               | 220        | C9    | Source             |
| `src/vocabulary/types.ts`                   | 100        | C10   | Source             |
| `src/vocabulary/vocabulary-service.ts`      | 250        | C11   | Source             |
| `src/vocabulary/vocabulary-matcher.ts`      | 150        | C12   | Source             |
| `src/vocabulary/vocabulary-loader.ts`       | 130        | C13   | Source             |
| `src/vocabulary/domains/procurement.json`   | 520        | C14   | Data (ported)      |
| `src/vocabulary/domains/sales.json`         | 300        | C14   | Data (ported)      |
| `src/vocabulary/domains/finance.json`       | 368        | C14   | Data (ported)      |
| `src/vocabulary/domains/manufacturing.json` | 338        | C14   | Data (ported)      |
| `src/vocabulary/domains/warehouse.json`     | 282        | C14   | Data (ported)      |
| `src/vocabulary/domains/quality.json`       | 336        | C14   | Data (ported)      |
| `src/vocabulary/index.ts`                   | 60         | C15   | Barrel (from stub) |
| `src/intents/types.ts`                      | 100        | D1    | Source             |
| `src/intents/core-wrappers.ts`              | 260        | D2    | Source             |
| `src/intents/domains/procurement.ts`        | 300        | D3    | Source             |
| `src/intents/domains/sales.ts`              | 250        | D4    | Source             |
| `src/intents/domains/finance.ts`            | 250        | D5    | Source (NEW)       |
| `src/intents/domains/manufacturing.ts`      | 250        | D6    | Source (NEW)       |
| `src/intents/domains/master-data.ts`        | 200        | D7    | Source (NEW)       |
| `src/intents/index.ts`                      | 80         | D8    | Barrel (from stub) |
| `src/fixtures/intent-fixtures.ts`           | 200        | D9    | Source             |
| `tests/integration/setup.ts`                | 20         | C2    | Test Setup         |

### Modified Files (Phase 5)

| File                              | Change                                                                                                                                                            | Batch    |
| --------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------- |
| `src/index.ts`                    | Remove 22 internal exports + add 4 types + remove createAuthStrategy/SAPAuthHandler                                                                               | A2       |
| `src/fe/index.ts`                 | Remove 5 FE browser script exports                                                                                                                                | A2       |
| `src/fixtures/core-fixtures.ts`   | Wire objectMapCleanup() in ui5 teardown + try/finally                                                                                                             | A4+B5    |
| `src/fixtures/module-fixtures.ts` | Wire objectMapCleanup() in ui5 teardown (B5) + stability guards + try/finally                                                                                     | A4+A5+B5 |
| `src/fixtures/index.ts`           | Add aiTest + intentTest to mergeTests() chain                                                                                                                     | C9+D9    |
| `package.json`                    | Move dotenv→devDeps (not optionalDeps — H1 fix), zod-to-json-schema→devDeps, loosen openai pin from exact to range; add @anthropic-ai/sdk to optionalDependencies | A7       |
| `scripts/generate-skill-md.ts`    | Complete from stub (4→300 LOC)                                                                                                                                    | B1       |
| `src/ai/index.ts`                 | Implement from stub (4→80 LOC)                                                                                                                                    | C8       |
| `src/intents/index.ts`            | Implement from stub (4→80 LOC)                                                                                                                                    | D8       |
| `src/vocabulary/index.ts`         | Implement from stub (4→60 LOC)                                                                                                                                    | C15      |
| `src/core/errors/index.ts`        | Add exports for AiError, VocabularyError, IntentError                                                                                                             | A0       |

### Deleted Files (Phase 5 Batch A)

| File                                         | LOC | Reason                                        |
| -------------------------------------------- | --- | --------------------------------------------- |
| `src/bridge/api-resolver.ts`                 | 113 | Dead — functionality inlined in inject-ui5.ts |
| `src/bridge/browser-scripts/get-selector.ts` | 102 | Dead — not imported in src/                   |
| `src/bridge/browser-scripts/get-version.ts`  | 47  | Dead — functionality inlined in inject-ui5.ts |

### Files Becoming LIVE (no longer dead code)

| File                                      | LOC | Wired By                   | Phase |
| ----------------------------------------- | --- | -------------------------- | ----- |
| `src/core/constants/control-types.ts`     | 164 | `src/ai/bulk-discovery.ts` | C6    |
| `src/core/constants/object-categories.ts` | 115 | `src/ai/bulk-discovery.ts` | C6    |

---

## 10. Test Plan

### Test Coverage Targets

All Phase 5 modules target **Tier 2** coverage (95% stmt, 90% branch, 95% func):

- AI types, errors: **Tier 1** (100% all) — any new error subclasses
- Core vocabulary algorithms (matcher, loader): **Tier 2** (95%+)
- LLM service, context builder, agentic handler: **Tier 2** — mock LLM
- Intent wrappers, domain functions: **Tier 2** — mock UI5Handler

> **Finding H9 (HIGH)**: Per-file coverage thresholds must be added to `vitest.config.ts` for the new Phase 5 directories.

**Update `vitest.config.ts`** — add per-file threshold entries:

```typescript
// Inside coverage.thresholds (alongside existing entries):

// Tier 1 — Error classes (100%)
'src/core/errors/ai-error.ts':         { statements: 100, branches: 100, functions: 100, lines: 100 },
'src/core/errors/vocabulary-error.ts': { statements: 100, branches: 100, functions: 100, lines: 100 },
'src/core/errors/intent-error.ts':     { statements: 100, branches: 100, functions: 100, lines: 100 },

// Tier 2 — New AI/Vocabulary/Intents modules (95/90/95/95)
'src/ai/**':         { statements: 95, branches: 90, functions: 95, lines: 95 },
'src/vocabulary/**': { statements: 95, branches: 90, functions: 95, lines: 95 },
'src/intents/**':    { statements: 95, branches: 90, functions: 95, lines: 95 },
```

**Error subclass placement** (Tier 1 — 100% coverage required):

- `AiError` → `src/core/errors/ai-error.ts` (NOT `src/ai/`)
- `VocabularyError` → `src/core/errors/vocabulary-error.ts` (NOT `src/vocabulary/`)
- `IntentError` → `src/core/errors/intent-error.ts` (NOT `src/intents/`)
- All error subclasses must be in `src/core/errors/` per architecture rules
- The existing `src/core/errors/` Tier 1 100% threshold already covers these

### Test Files (Phase 5)

| Test File                                               | Source                                | Approach                        |
| ------------------------------------------------------- | ------------------------------------- | ------------------------------- |
| `tests/unit/barrel/index-exports.test.ts`               | `src/index.ts`                        | Type-level: verify export set   |
| `tests/unit/matchers/types-augmentation.test.ts`        | `matchers/types.d.ts`                 | expectTypeOf assertions         |
| `tests/unit/fixtures/core-fixtures-teardown.test.ts`    | `core-fixtures.ts`                    | Mock page.evaluate              |
| `tests/unit/fixtures/module-fixtures-stability.test.ts` | `module-fixtures.ts`                  | Mock UI5Handler                 |
| `tests/unit/ai/types.test.ts`                           | `ai/types.ts`                         | Type guards + construction      |
| `tests/integration/ai/llm-service.int.ts`               | `ai/llm-service.ts`                   | Real API calls (OpenAI / Azure) |
| `tests/unit/ai/context-builder.test.ts`                 | `ai/context-builder.ts`               | Mock page.evaluate              |
| `tests/unit/ai/capability-registry.test.ts`             | `ai/capability-registry.ts`           | Data validation                 |
| `tests/unit/ai/recipe-registry.test.ts`                 | `ai/recipe-registry.ts`               | Search + filter                 |
| `tests/unit/ai/bulk-discovery.test.ts`                  | `ai/bulk-discovery.ts`                | Mock page.evaluate              |
| `tests/unit/ai/agentic-handler.test.ts`                 | `ai/agentic-handler.ts`               | Mock LlmService                 |
| `tests/unit/fixtures/ai-fixtures.test.ts`               | `ai-fixtures.ts`                      | Mock all AI modules             |
| `tests/unit/vocabulary/types.test.ts`                   | `vocabulary/types.ts`                 | Type validation                 |
| `tests/unit/vocabulary/vocabulary-matcher.test.ts`      | `vocabulary-matcher.ts`               | Hermetic algorithm              |
| `tests/unit/vocabulary/vocabulary-loader.test.ts`       | `vocabulary-loader.ts`                | Mock fs.readFile                |
| `tests/unit/vocabulary/vocabulary-service.test.ts`      | `vocabulary-service.ts`               | Mock loader + matcher           |
| `tests/unit/intents/types.test.ts`                      | `intents/types.ts`                    | Type construction               |
| `tests/unit/intents/core-wrappers.test.ts`              | `intents/core-wrappers.ts`            | Mock UI5Handler                 |
| `tests/unit/intents/procurement.test.ts`                | `intents/domains/procurement.ts`      | Mock all fixtures               |
| `tests/unit/intents/sales.test.ts`                      | `intents/domains/sales.ts`            | Mock all fixtures               |
| `tests/unit/fixtures/intent-fixtures.test.ts`           | `intent-fixtures.ts`                  | Mock intent module              |
| `tests/unit/core/errors/ai-error.test.ts`               | `src/core/errors/ai-error.ts`         | Error code coverage (Tier 1)    |
| `tests/unit/core/errors/vocabulary-error.test.ts`       | `src/core/errors/vocabulary-error.ts` | Error code coverage (Tier 1)    |
| `tests/unit/core/errors/intent-error.test.ts`           | `src/core/errors/intent-error.ts`     | Error code coverage (Tier 1)    |
| `tests/unit/intents/finance.test.ts`                    | `intents/domains/finance.ts`          | Mock all fixtures               |
| `tests/unit/intents/manufacturing.test.ts`              | `intents/domains/manufacturing.ts`    | Mock all fixtures               |
| `tests/unit/intents/master-data.test.ts`                | `intents/domains/master-data.ts`      | Mock all fixtures               |
| `tests/integration/setup.ts`                            | —                                     | Integration test env setup      |

### Integration Test Project (Vitest)

**Added to `vitest.config.ts`** as a second project entry:

```typescript
// vitest.config.ts addition
{
  test: {
    projects: [
      {
        // Existing unit test project
        name: 'unit',
        include: ['tests/unit/**/*.test.ts'],
        exclude: ['tests/integration/**'],
        // ... existing config
      },
      {
        // NEW: Integration test project (real API calls)
        name: 'integration',
        include: ['tests/integration/**/*.int.ts'],
        environment: 'node',
        testTimeout: 30_000,  // 30s for real API calls
        setupFiles: ['tests/integration/setup.ts'],  // Loads dotenv
        // No coverage — integration tests measure behavior, not coverage
      },
    ],
  },
}
```

**`tests/integration/setup.ts`** (NEW):

```typescript
import 'dotenv/config';

// Validate required env vars before any test runs
const required = ['OPENAI_API_KEY']; // or AZURE_OPENAI_ENDPOINT + AZURE_OPENAI_API_KEY or ANTHROPIC_API_KEY
const missing = required.filter((k) => !process.env[k]);
if (missing.length > 0 && process.env['CI'] !== 'true') {
  console.warn(`Integration tests skipped: missing env vars: ${missing.join(', ')}`);
  process.exit(0); // Graceful skip, not failure
}
```

**npm scripts** (add to package.json):

```json
"test:integration": "vitest run --project integration",
"test:all": "npm run test:unit && npm run test:integration"
```

**Run locally**: `npm run test:integration` (requires `.env.test` with API keys)
**Run in CI**: Not in default CI pipeline. Add to release workflow only.

### TDD Sequence (per Batch)

```text
For each source file:
  1. Write failing test (RED)
  2. Implement minimal code to pass (GREEN)
  3. Refactor to clean code (REFACTOR)
  4. Run npm run lint — 0 errors
  5. Run npm run typecheck — 0 errors
  6. Run npm run test:unit -- --coverage — verify tier coverage
```

---

## 11. Quality Gates Per Batch

| Gate                                                                                           | Batch A | Batch B | Batch C | Batch D |
| ---------------------------------------------------------------------------------------------- | ------- | ------- | ------- | ------- |
| Lint (0 errors, 0 warnings)                                                                    | ✓       | ✓       | ✓       | ✓       |
| TypeCheck (0 errors)                                                                           | ✓       | ✓       | ✓       | ✓       |
| Tests passing                                                                                  | ✓       | ✓       | ✓       | ✓       |
| Coverage ≥ tier targets                                                                        | ✓       | ✓       | ✓       | ✓       |
| Build (ESM + CJS + DTS)                                                                        | ✓       | ✓       | ✓       | ✓       |
| `attw` 6/6 exports valid                                                                       | ✓       | —       | ✓       | ✓       |
| SKILL.md ≤500 body lines                                                                       | —       | ✓       | —       | —       |
| Domain files ≤200 lines                                                                        | —       | ✓       | —       | —       |
| `generate-skill-md.ts` produces valid SKILL.md                                                 | —       | ✓       | —       | —       |
| No internal exports in main barrel                                                             | ✓       | —       | —       | —       |
| UI5Selector exported from main barrel                                                          | ✓       | —       | —       | —       |
| `expect(ctrl).toHaveUI5Text()` compiles                                                        | ✓       | —       | —       | —       |
| objectMapCleanup called in teardown                                                            | ✓       | —       | —       | —       |
| ai sub-path exports AiResponse<T>                                                              | —       | —       | ✓       | —       |
| vocabulary sub-path exports VocabularyService                                                  | —       | —       | ✓       | —       |
| intents sub-path exports procurement._ + sales._ + finance._ + manufacturing._ + masterData.\* | —       | —       | —       | ✓       |
| pramanAI fixture lazy-loaded                                                                   | —       | —       | ✓       | —       |
| intent fixture lazy-loaded                                                                     | —       | —       | —       | ✓       |

---

## 12. Risk Register

| #   | Risk                                                                          | Probability | Impact | Mitigation                                                                                                                                                                     |
| --- | ----------------------------------------------------------------------------- | ----------- | ------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| R1  | `openai` package API changed (optionalDep)                                    | Low         | Medium | Pin to `^6.22.0` range; real API integration tests will surface breaks immediately                                                                                             |
| R2  | LLM response format unpredictable → Zod parse fails                           | Medium      | Medium | All LLM responses use Zod safeParse; return AiResponse with error status                                                                                                       |
| R3  | Barrel removal breaks existing consumer code                                  | Low         | High   | Run `attw` before + after; add deprecation note in CHANGELOG                                                                                                                   |
| R4  | Vocabulary JSON domain files too large → cold start delay                     | Low         | Low    | Lazy load per domain via `loadDomain()`; measure startup impact                                                                                                                |
| R5  | bulk-discovery returns too many controls (>100) → AI token overload           | Medium      | Medium | Implement pagination + `interactiveOnly: true` default                                                                                                                         |
| R6  | Intent domain functions too brittle (SAP app layouts vary)                    | High        | Medium | Document as "reference implementation" + allow selector overrides via options                                                                                                  |
| R7  | generate-skill-md.ts produces SKILL.md that fails Claude best practice format | Low         | Medium | CI gate: validate YAML frontmatter exists; check line count                                                                                                                    |
| R8  | Fuzzy matching too aggressive → wrong selector returned                       | Medium      | Medium | Require confidence ≥ 0.85 for single-field resolution. If multiple matches above 0.7 exist, return empty and require disambiguation (H8 fix — original 0.7 threshold too low). |
| R9  | Anthropic Claude SDK API changes                                              | Low         | Medium | Pin `@anthropic-ai/sdk` version; integration tests surface breaks immediately                                                                                                  |
| R10 | Vocabulary JSON ported from dhikraft has stale selectors                      | Medium      | High   | Run intent tests against live SAP system after porting; verify each selector works                                                                                             |
| R11 | Generated capability registry misses functions due to AST parsing gaps        | Low         | Medium | Add CI check: count of capabilities must be ≥ N (baseline from manual count)                                                                                                   |

---

## 13. Barrel Updates

### `src/index.ts` changes (Batch A1)

**After Batch A1**, the main barrel exports exactly:

- test, expect (fixtures)
- defineConfig, loadConfig, PramanConfig, PramanConfigInput, LoadConfigOptions
- Error classes (10 + base + ErrorCode)
- waitForUI5Bootstrap, waitForUI5Stable, retry, DEFAULT_TIMEOUTS
- Navigation functions (9) + NavigationOptions (NEW type export)
- Table functions (22) + table types
- Dialog functions (7) + dialog types — minus DIALOG_CONTROL_TYPES
- Date functions (8) + date types — minus DATE_FORMATS
- OData functions (11) + odata types
- Auth types: AuthStrategy, SAPAuthConfig, SessionInfo (kept — needed for auth-setup)
- VERSION, PACKAGE_NAME
- **NEW**: UI5Selector, UI5ControlBase, UI5NavigationAPI types

**Does NOT export** (moved to internal):

- Bridge internals (4 symbols)
- Proxy internals (5 symbols)
- Logger infrastructure (2 symbols)
- Telemetry infrastructure (1 symbol)
- Compat layer (2 symbols)
- Selector engine (5 symbols)
- Implementation constants (2 symbols)
- Matcher implementations: `checkUI5Binding`, `checkUI5CellText`, `checkUI5ControlType`, `checkUI5Enabled`, `checkUI5Property`, `checkUI5RowCount`, `checkUI5SelectedRows`, `checkUI5Text`, `checkUI5ValueState`, `checkUI5Visible` (10 symbols — B4 fix)
- createAuthStrategy, SAPAuthHandler (implementation-level)

### `src/fixtures/index.ts` changes (Batch C9 + D6)

> **Finding B3 (BLOCKER)**: The "Current" baseline was wrong. Actual code (verified in `src/fixtures/index.ts` line 54) is `mergeTests(moduleTest, authTest, navTest, stabilityTest, feTest)` — NOT `mergeTests(coreTest, ...)`. `coreTest` is NOT in the mergeTests call; it is already inside `moduleTest`. Do NOT add `coreTest` to mergeTests.

> **Finding B6 (BLOCKER)**: The original section omitted the import and re-export statements for the new fixture modules.

Add `aiTest` and `intentTest` to the `mergeTests()` fixture chain:

```typescript
// ── Verified current baseline (src/fixtures/index.ts line 54) ────────
// Before Phase 5 (ACTUAL — verified):
export const test = mergeTests(moduleTest, authTest, navTest, stabilityTest, feTest);

// After Phase 5 (target):
export const test = mergeTests(
  moduleTest,
  authTest,
  navTest,
  stabilityTest,
  feTest,
  aiTest,
  intentTest,
);
// NOTE: coreTest is NOT included — it is already inside moduleTest.
// NOTE: feTest is already present — the original baseline had it wrong.
```

**Add imports** at the top of `src/fixtures/index.ts` (alongside existing imports):

```typescript
import { aiTest } from './ai-fixtures.js';
import { intentTest } from './intent-fixtures.js';
```

**Add re-exports** alongside the existing fixture re-exports:

```typescript
export { aiTest } from './ai-fixtures.js';
export type { PramanAIFixture } from './ai-fixtures.js';
export { intentTest } from './intent-fixtures.js';
export type { IntentFixture } from './intent-fixtures.js';
```

### Sub-path barrels implemented

| Barrel                    | Status Before | Status After Batch      |
| ------------------------- | ------------- | ----------------------- |
| `src/ai/index.ts`         | 4-LOC stub    | **Implemented** (C8)    |
| `src/vocabulary/index.ts` | 4-LOC stub    | **Implemented** (C15)   |
| `src/intents/index.ts`    | 4-LOC stub    | **Implemented** (D5)    |
| `src/reporters/index.ts`  | 4-LOC stub    | **Unchanged** (Phase 6) |

---

## 14. API References

### Phase 5 Public API Summary

**`playwright-praman/ai`**:

```typescript
import {
  type AiResponse,
  type PageContext,
  type CapabilityEntry,
  type RecipeEntry,
  type AgenticCheckpoint,
  type DiscoveredControl,
  type LlmService,
  createLlmService,
  CapabilityRegistry,
  RecipeRegistry,
  AgenticHandler,
  discoverPage,
  buildPageContext,
} from 'playwright-praman/ai';
```

**`playwright-praman/vocabulary`**:

```typescript
import {
  type VocabularyService,
  type VocabularySearchResult,
  type SAPDomain,
  createVocabularyService,
} from 'playwright-praman/vocabulary';
```

**`playwright-praman/intents`**:

```typescript
import {
  type IntentResult,
  type IntentOptions,
  fillField,
  clickButton,
  selectOption,
  assertField,
  navigateAndSearch,
  confirmAndWait,
  waitForSave,
  procurement,
  sales,
} from 'playwright-praman/intents';

// Domain shorthand:
import { createPurchaseOrder } from 'playwright-praman/intents/procurement'; // NOT supported (no deep imports)
```

**Fixture API** (via `playwright-praman`):

```typescript
import { test, expect } from 'playwright-praman';

test('full AI test', async ({ ui5, ui5Navigation, pramanAI, intent }) => {
  // pramanAI — AI reasoning + discovery
  const inventory = await pramanAI.discoverPage({ interactiveOnly: true });
  const suggestions = await pramanAI.agentic.suggestActions(inventory.data!);
  const caps = pramanAI.capabilities.forAI({ provider: 'claude' });

  // intent — business-level SAP operations
  const po = await intent.procurement.createPurchaseOrder({
    vendor: 'V001',
    material: 'M1000',
    quantity: 10,
    plant: '1000',
  });

  // Verify
  expect(po.status).toBe('success');
  expect(po.data?.poNumber).toBeDefined();

  // Vocabulary-resolved field assertion
  await intent.core.assertField('Vendor', 'V001');
});
```

### AI Response Envelope Contract

Every AI and Intent API returns `AiResponse<T>` or `IntentResult<T>`:

```typescript
// Success:
{ status: 'success', data: T, metadata: { duration, retryable: false, suggestions: [] } }

// Error (LLM not configured):
{ status: 'error', data: undefined, error: { code: 'ERR_AI_NOT_CONFIGURED', message: '...' },
  metadata: { duration, retryable: false, suggestions: ['Add ai.provider to praman.config.ts'] } }

// Error (retryable — LLM rate limit):
{ status: 'error', data: undefined, error: { code: 'ERR_AI_RATE_LIMIT', message: '...' },
  metadata: { duration, retryable: true, suggestions: ['Wait 60s and retry'] } }
```

---

## 15. Implementation Batching & Parallelization

Each batch is sized for a single AI agent session (~5,000–8,000 LOC per batch):

| Batch | Files                                        | Est. LOC | Sub-batches | Commit Convention                                       |
| ----- | -------------------------------------------- | -------- | ----------- | ------------------------------------------------------- |
| A     | 9 modified + 3 deleted + 3 new error classes | ~750 net | A0–A8       | `fix(api): remove internal exports from barrel (B5a)`   |
| B     | 7 new markdown + 1 script                    | ~1,600   | B1–B4       | `feat(skill): add SKILL.md + capability manifest (B5b)` |
| C     | 17 new source files + 6 JSON                 | ~3,500   | C1–C15      | `feat(ai): implement AI core + vocabulary (B5c)`        |
| D     | 8 new source files                           | ~1,800   | D1–D9       | `feat(intents): implement all 5 intent domains (B5d)`   |

**Commit convention**: `feat(scope): description (B5a)` — include batch ID in all Phase 5 commits.

### Batch Dependency Graph

```
A0 (Error classes)
  │
  ├── A1–A8 (all other Batch A tasks — can parallelize after A0)
  │
  ├── B1–B4 (Batch B — can run parallel with A1–A8)
  │
  └── C1–C15 (Batch C — starts after ALL of A is done)
        │
        └── D1–D9 (Batch D — starts after C completes)
```

### Parallel Execution Map

| Agent                              | Batch                                              | Prerequisites                 | Estimated LOC                |
| ---------------------------------- | -------------------------------------------------- | ----------------------------- | ---------------------------- |
| Agent 1                            | A0 (error classes)                                 | None — first task             | ~150 LOC + 3 test files      |
| Agent 2                            | A1–A4 (config, barrel, matchers, objectMapCleanup) | A0 complete                   | ~200 LOC                     |
| Agent 3                            | A5–A8 (dead code, deps, TSDoc, aliases)            | A0 complete                   | ~100 LOC + TSDoc passes      |
| Agent 4                            | B1–B4 (generators, build scripts)                  | A0 complete                   | ~600 LOC (generator scripts) |
| ← Wait for all A + B to complete → |
| Agent 5                            | C1–C3 (types, LlmService, context builder)         | All A, B                      | ~500 LOC                     |
| Agent 6                            | C4–C5 (capability registry, recipe registry)       | C1 types                      | ~300 LOC + generated files   |
| Agent 7                            | C6–C9 (bulk discovery, agentic, barrel, fixture)   | C1-C5                         | ~600 LOC                     |
| Agent 8                            | C10–C15 (vocabulary port from dhikraft)            | C1 types, A0b VocabularyError | ~800 LOC (port)              |
| ← Wait for all C to complete →     |
| Agent 9                            | D1–D4 (types, core-wrappers, procurement, sales)   | All C                         | ~600 LOC                     |
| Agent 10                           | D5–D7 (finance, manufacturing, master data)        | D1–D2                         | ~700 LOC                     |
| Agent 11                           | D8–D9 (barrel, fixtures)                           | D1–D7                         | ~200 LOC                     |

### Token Budget (Claude Max plan — 200K context window)

| Batch                | Source LOC | Test LOC | Total Context Need              | Fits?   |
| -------------------- | ---------- | -------- | ------------------------------- | ------- |
| A0 (error classes)   | ~150       | ~200     | ~350 + existing errors (~500)   | ✓       |
| A1–A4                | ~200       | ~100     | ~300 + schema/fixture files     | ✓       |
| B1–B4 (generators)   | ~600       | ~200     | ~800 + dhikraft reference       | ✓       |
| C1–C3                | ~500       | ~400     | ~900 + plan + type definitions  | ✓       |
| C4–C5 (registries)   | ~300       | ~200     | ~500 + generated files          | ✓       |
| C6–C9                | ~600       | ~500     | ~1100 + fixture chain           | ✓       |
| C10–C15 (vocab port) | ~800       | ~600     | ~1400 + dhikraft source (2000+) | ⚠ LARGE |
| D1–D4                | ~600       | ~500     | ~1100 + vocabulary types        | ✓       |
| D5–D7                | ~700       | ~600     | ~1300 + D1/D2 deps              | ✓       |
| D8–D9                | ~200       | ~200     | ~400 + fixture chain            | ✓       |

> **Note for C10–C15 (vocabulary port)**: This is the largest batch (~1400 LOC + dhikraft source).
> Split into two agent runs if context is tight:
>
> - Agent 8a: Port types.ts + matcher (C10, C12) from dhikraft
> - Agent 8b: Port service + loader + JSON files (C11, C13, C14, C15)

**Sub-batch IDs for AI agent limits**:

```
B5a-0: A0 error classes (AiError, VocabularyError, IntentError) — FIRST
B5a-1: A1 config schema + A2 barrel surgery (largest file change)
B5a-2: A3 types.d.ts + A4 cleanup wiring
B5a-3: A5 stability guards + A6 dead code deletion + A7 deps + A8 TSDoc
B5b-1: B1 generate-skill-md.ts script
B5b-2: B2 SKILL.md + B3 domain files (skills/)
B5b-3: B4 run generator, commit capabilities-reference.md
B5c-1: C1 ai/types.ts + C2 llm-service.ts + schemas
B5c-2: C3 context-builder.ts + C4 capability-registry.ts + C5 recipe-registry.ts
B5c-3: C6 bulk-discovery.ts + C7 agentic-handler.ts + C8 ai/index.ts + C9 ai-fixtures.ts
B5c-4: C10-C13 vocabulary source files
B5c-5: C14 domain JSON files + C15 vocabulary/index.ts
B5d-1: D1 intents/types.ts + D2 core-wrappers.ts
B5d-2: D3 procurement.ts + D4 sales.ts
B5d-3: D5 finance.ts + D6 manufacturing.ts + D7 master-data.ts
B5d-4: D8 intents/index.ts + D9 intent-fixtures.ts + update fixtures/index.ts
```

---

## Appendix A — Dhikraft Parity Matrix

Features from dhikraft v2.5.0 evaluated for Phase 5 inclusion:

| Dhikraft Feature                      | Parity Decision     | Phase           | Notes                                                          |
| ------------------------------------- | ------------------- | --------------- | -------------------------------------------------------------- |
| `capabilities.forAI()`                | ✅ **Included**     | Phase 5 C4      | CapabilityRegistry.forAI()                                     |
| Recipe registry (401 recipes)         | ✅ **Included**     | Phase 5 C5      | RecipeRegistry — seeded from @example blocks                   |
| Vocabulary fuzzy matching             | ✅ **Included**     | Phase 5 C11-C12 | Levenshtein + synonyms                                         |
| 6 SAP domain vocabularies             | ✅ **Included**     | Phase 5 C14     | procurement, sales, finance, manufacturing, warehouse, quality |
| `bulkDiscovery.discoverAll()`         | ✅ **Included**     | Phase 5 C6      | discoverPage() with categorization                             |
| Agentic handler                       | ✅ **Included**     | Phase 5 C7      | AgenticHandler — generateTest, suggestActions, checkpoint      |
| Intent API — Procurement (MM)         | ✅ **Included**     | Phase 5 D3      | 6 functions                                                    |
| Intent API — Sales (SD)               | ✅ **Included**     | Phase 5 D4      | 6 functions                                                    |
| Intent API — Finance (FI)             | ⏳ **Phase 7+**     | —               | 3 remaining domains deferred                                   |
| Intent API — Manufacturing (PP)       | ⏳ **Phase 7+**     | —               |                                                                |
| Intent API — Master Data              | ⏳ **Phase 7+**     | —               |                                                                |
| Multi-provider LLM (Claude, Gemini)   | ⏳ **Phase 7+**     | —               | W2: AzureOpenAI + OpenAI only in Phase 5                       |
| CLI doctor + init                     | ⏳ **Phase 6**      | —               | W11: CLI all in Phase 6                                        |
| AI service integration (azure)        | ✅ **Included**     | Phase 5 C2      | Via openai npm package                                         |
| Selector discovery (reverse engineer) | ❌ **Not included** | —               | Not a validated requirement for Phase 5                        |
| Multi-browser manager                 | ❌ **Not included** | —               | Out of scope for v1.0                                          |

---

## Appendix B — praman_aiaudit.md Issue Resolution

Resolution status for all 39 issues from `plans/praman_aiaudit.md`:

| ID    | Severity    | Issue                                                                    | Resolution                                                                                                                                                                         | Phase  |
| ----- | ----------- | ------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------ |
| I-001 | 🔴 BLOCKING | `/ai` is empty stub                                                      | **FIXED** — Batch C implements full AI layer                                                                                                                                       | P5-C   |
| I-002 | 🔴 BLOCKING | `/intents` is empty stub                                                 | **FIXED** — Batch D implements intents                                                                                                                                             | P5-D   |
| I-003 | 🔴 BLOCKING | `/vocabulary` is empty stub                                              | **FIXED** — Batch C implements vocabulary                                                                                                                                          | P5-C   |
| I-004 | 🔴 BLOCKING | Matchers not registered as `expect.extend()` Playwright pattern          | **FIXED** — matchers ARE registered in matcherRegistration fixture (verified: core-fixtures.ts lines 179–191). types.d.ts type safety FIXED in Batch A2. Both runtime + type-safe. | P5-A   |
| I-005 | 🔴 BLOCKING | `UI5Selector` not exported                                               | **FIXED** — Batch A1 adds export                                                                                                                                                   | P5-A   |
| I-006 | 🔴 BLOCKING | No SKILL.md                                                              | **FIXED** — Batch B2 creates SKILL.md                                                                                                                                              | P5-B   |
| I-007 | 🔴 BLOCKING | No capability manifest                                                   | **FIXED** — Batch B4 generates manifest                                                                                                                                            | P5-B   |
| I-008 | 🟠 HIGH     | 22 internal exports in main barrel (+ 10 check\* matcher impls — B4 fix) | **FIXED** — Batch A1 removes 32 symbols total                                                                                                                                      | P5-A   |
| I-009 | 🟠 HIGH     | `UI5ControlBase` not exported                                            | **FIXED** — Batch A1 adds export                                                                                                                                                   | P5-A   |
| I-010 | 🟠 HIGH     | FE browser script strings in public API                                  | **FIXED** — Batch A1 removes from /fe                                                                                                                                              | P5-A   |
| I-011 | 🟠 HIGH     | Zero @capability tags                                                    | **FIXED** — Batch A7 TSDoc pass                                                                                                                                                    | P5-A   |
| I-012 | 🟠 HIGH     | AI config exists but layer empty                                         | **FIXED** — Batch C implements the layer                                                                                                                                           | P5-C   |
| I-013 | 🟠 HIGH     | objectMapCleanup never called (memory leak)                              | **FIXED** — Batch A3                                                                                                                                                               | P5-A   |
| I-014 | 🟠 HIGH     | dotenv in dependencies                                                   | **FIXED** — Batch A6                                                                                                                                                               | P5-A   |
| I-015 | 🟠 HIGH     | `page: never` type escape                                                | **DEFERRED** — Phase 7 (not blocking AI work)                                                                                                                                      | P7     |
| I-016 | 🟠 HIGH     | Object.assign mutation + cast                                            | **DEFERRED** — Phase 7 (not blocking AI work)                                                                                                                                      | P7     |
| I-017 | 🟡 MEDIUM   | NavigationOptions type not exported                                      | **FIXED** — Batch A1                                                                                                                                                               | P5-A   |
| I-018 | 🟡 MEDIUM   | DIALOG_CONTROL_TYPES exported publicly                                   | **FIXED** — Batch A1                                                                                                                                                               | P5-A   |
| I-019 | 🟡 MEDIUM   | DATE_FORMATS exported publicly                                           | **FIXED** — Batch A1                                                                                                                                                               | P5-A   |
| I-020 | 🟡 MEDIUM   | Table API uses positional indices                                        | **DEFERRED** — Phase 7 OData/Table review                                                                                                                                          | P7     |
| I-021 | 🟡 MEDIUM   | OData model vs HTTP conflated                                            | **DEFERRED** — Phase 7 (W7)                                                                                                                                                        | P7     |
| I-022 | 🟡 MEDIUM   | api-resolver.ts dead code                                                | **FIXED** — Batch A5 deleted                                                                                                                                                       | P5-A   |
| I-023 | 🟡 MEDIUM   | get-selector.ts dead code                                                | **FIXED** — Batch A5 deleted                                                                                                                                                       | P5-A   |
| I-024 | 🟡 MEDIUM   | step-decorator.ts dead code                                              | **DEFERRED** — Phase 7 (W8)                                                                                                                                                        | P7     |
| I-025 | 🟡 MEDIUM   | control-types.ts + object-categories.ts not wired                        | **FIXED** — Batch C6 wires them in bulk-discovery.ts                                                                                                                               | P5-C   |
| I-026 | 🟡 MEDIUM   | telemetry/spans.ts partially unused                                      | **DEFERRED** — Phase 7                                                                                                                                                             | P7     |
| I-027 | 🟡 MEDIUM   | 199 typed control interfaces are dead                                    | **DEFERRED** — Phase 7 (W5)                                                                                                                                                        | P7     |
| I-028 | 🟡 MEDIUM   | zod-to-json-schema in dependencies                                       | **FIXED** — Batch A6                                                                                                                                                               | P5-A   |
| I-029 | 🟡 MEDIUM   | No CI/CD                                                                 | **DEFERRED** — Phase 7                                                                                                                                                             | P7     |
| I-030 | 🟡 MEDIUM   | waitForUI5Stable not called in module fixtures                           | **FIXED** — Batch A4                                                                                                                                                               | P5-A   |
| I-031 | 🟡 MEDIUM   | page.off() missing try/finally                                           | **FIXED** — Batch A4                                                                                                                                                               | P5-A   |
| I-032 | 🟢 LOW      | @remarks missing Playwright vs Praman boundary                           | **FIXED** — Batch A7 + B2 SKILL.md                                                                                                                                                 | P5-A+B |
| I-033 | 🟢 LOW      | SAP control type namespace undocumented                                  | **FIXED** — Batch B3 skills/ui5-controls.md                                                                                                                                        | P5-B   |
| I-034 | 🟢 LOW      | btpWorkZone is thin shim                                                 | **DEFERRED** — document maturity in Phase 7                                                                                                                                        | P7     |
| I-035 | 🟢 LOW      | FLP hash format undocumented                                             | **FIXED** — Batch B3 skills/navigation.md                                                                                                                                          | P5-B   |
| I-036 | 🟢 LOW      | Auth strategy names undocumented                                         | **FIXED** — Batch B3 skills/authentication.md                                                                                                                                      | P5-B   |
| I-037 | 🟢 LOW      | PW-MERGE-1 pattern undocumented                                          | **DEFERRED** — CONTRIBUTING.md Phase 7                                                                                                                                             | P7     |
| I-038 | 🟢 LOW      | No export guards prevent deep imports                                    | **DEFERRED** — attw passes; low priority                                                                                                                                           | P7     |
| I-039 | 🟢 LOW      | openai version pinned tightly                                            | **FIXED** — Batch A6 loosens to range                                                                                                                                              | P5-A   |

**Phase 5 resolves: 25 of 39 issues (64%)**
**Deferred to Phase 7: 14 of 39 issues (36%)**

---

_Plan authored: 2026-02-20. Source code verified directly — no assumptions from plan documents._
_All architectural decisions verified against: plan.md v4.0.0, praman_aiaudit.md, dhikraftaiaudit.md, Praman Phase 4 source._

---

## Appendix C — Review Corrections (Agent 5 Synthesis — 2026-02-20)

This appendix documents all changes made to phase5plan.md by Agent 5 (synthesizer) based on findings from four specialist review agents (Agent 1: Architecture, Agent 2: Implementation, Agent 3: Playwright/Fixtures, Agent 4: Quality/SAP). Changes are surgical edits — no sections were rewritten from scratch.

### BLOCKER Fixes Applied

| ID  | Finding                                                               | Section Changed                             | Change Made                                                                                                                                                                                                                                                                                                                                                        |
| --- | --------------------------------------------------------------------- | ------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| B1  | Azure OpenAI config schema mismatch                                   | Added §A0 before A1                         | Added `A0 — Extend aiSchema` sub-batch specifying that `src/core/config/schema.ts` `aiSchema` must add `endpoint`, `deployment`, `apiVersion` optional fields. Linked to C2 LlmService constructor. (Agents 1+3)                                                                                                                                                   |
| B2  | Lazy imports use package sub-paths instead of source aliases          | §A7 header (added note) + C9 code + D6 code | Added explicit B2a/B2b/B2c fix guidance in A7. Changed ALL `await import('playwright-praman/ai')`, `await import('playwright-praman/vocabulary')`, `await import('playwright-praman/intents')` to `await import('#ai/index.js')`, `await import('#vocabulary/index.js')`, `await import('#intents/index.js')`. Added tsconfig.json path aliases spec. (Agents 1+3) |
| B3  | mergeTests() baseline wrong — coreTest vs moduleTest + feTest missing | §13 Barrel Updates + C9 code                | Fixed "Current" baseline from `mergeTests(coreTest, ...)` to verified actual `mergeTests(moduleTest, authTest, navTest, stabilityTest, feTest)`. Fixed "After" target to include `feTest`. Changed `aiTest` to extend `moduleTest` (not `coreTest`). Added import for `moduleTest` in C9 fixture code. (Agents 1+3)                                                |
| B4  | Barrel surgery missing 10 check\* matcher functions                   | §A1 REMOVE list                             | Added 10 `checkUI5*` functions to the REMOVE list with explanation. Updated test count from 22 to 32 symbols. Added note on MatcherResult type. (Agent 1)                                                                                                                                                                                                          |
| B5  | objectMapCleanup fix must target BOTH fixture files                   | §A3                                         | Changed "File: src/fixtures/core-fixtures.ts" to "Files: ... AND src/fixtures/module-fixtures.ts". Added separate test spec for module-fixtures teardown. (Agent 1)                                                                                                                                                                                                |
| B6  | Section 13 missing import statements for aiTest/intentTest            | §13 fixtures/index.ts subsection            | Added import statements and re-export statements for aiTest, intentTest, PramanAIFixture, IntentFixture to the Section 13 barrel update spec. (Agents 1+3)                                                                                                                                                                                                         |
| B7  | page.evaluate() serialization constraint not addressed in C6          | §C6 bulk-discovery.ts                       | Added prominent warning box explaining the serialization constraint, inner function requirement, sonarjs suppression, and false positive risk in unit tests. (Agents 2+3, see MEMORY.md)                                                                                                                                                                           |
| B8  | pramanAI fixture missing teardown                                     | §C9 ai-fixtures.ts                          | Added teardown block after `await use()` that calls `llm.close()` with try/catch. Added `close(): Promise<void>` method to LlmService interface in C2. (Agent 3)                                                                                                                                                                                                   |
| B9  | pramanAI missing ui5Navigation dependency                             | §C9 ai-fixtures.ts                          | Added `ui5Navigation` to the fixture parameter: `async ({ pramanConfig, page, ui5Navigation }, use)`. Added TSDoc note explaining navigation dependency. (Agent 3)                                                                                                                                                                                                 |
| B10 | Domain vocabulary preload not awaited before use()                    | §D6 intent-fixtures.ts                      | Rewrote fixture body to confirm `await Promise.all([...loadDomain...])` is explicitly before `await use()`. Added comment marking critical ordering constraint. (Agent 3)                                                                                                                                                                                          |

### HIGH Fixes Applied

| ID  | Finding                                                                     | Section Changed        | Change Made                                                                                                                                                                                                                                                                                                                                                                                                  |
| --- | --------------------------------------------------------------------------- | ---------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| H1  | A6 dependency corrections — openai already optional, dotenv must be devDeps | §A6 + Decision Log W13 | Rewrote A6 spec to show CURRENT state (verified in package.json) vs TARGET state. Changed dotenv destination to devDependencies (not optionalDependencies). Changed openai fix from "move to optional" to "change pin from exact to range". Updated W13 in decision log. (Agents 1+3)                                                                                                                        |
| H2  | A4 references non-existent internalWaitForUI5Stable                         | §A4 Fix 1              | Replaced `internalWaitForUI5Stable` with `waitForUI5Stable` from `#core/utils/wait-helpers.js`. Clarified that stability wrap must be at moduleTest fixture level, not inside factory functions (which lack config access). (Agent 1)                                                                                                                                                                        |
| H3  | Levenshtein library not specified                                           | §C12 Fuzzy Matching    | Added explicit instruction: "implement as pure inline function (~20 LOC), NO npm dependency". Added @remarks TSDoc documentation requirement. (Agent 1)                                                                                                                                                                                                                                                      |
| H4  | LLM mocking strategy not defined                                            | §C2 test plan          | Revised: project has real OpenAI/Azure API available. `LlmService` is now an **integration test** (`tests/integration/ai/llm-service.int.ts`) using real API calls — no `vi.mock('openai', ...)`, no `createMockOpenAIClient()` factory. Higher-layer unit tests (`AgenticHandler`, fixtures) mock the `LlmService` interface directly via typed vi.fn() stubs, NOT the openai package. (Revised 2026-02-20) |
| H5  | Vocabulary resolution failure path not defined                              | §D2 test plan          | Added explicit behavior: unresolved term returns IntentResult with `status: 'error'` and `code: 'ERR_VOCAB_TERM_NOT_FOUND'`. Added required test case. (Agent 2)                                                                                                                                                                                                                                             |
| H6  | Confirm matcher runtime registration                                        | §A2 test plan          | Added verification note confirming `expect.extend()` IS present in core-fixtures.ts (lines 179–191). Clarified that A2 only needs type declaration file — runtime registration already done. (Agent 4)                                                                                                                                                                                                       |
| H7  | Build script should not block dev with prebuild                             | §B1                    | Removed `"prebuild"` approach. Added `"build:full"` target for CI. Documented that `npm run build` stays fast for local dev. (Agent 1)                                                                                                                                                                                                                                                                       |
| H8  | Vocabulary fuzzy threshold too low (0.7)                                    | §C12 Fuzzy Matching    | Changed single-field match threshold from 0.7 to 0.85. Added disambiguation behavior: multiple matches above 0.7 returns empty array. (Agent 4)                                                                                                                                                                                                                                                              |
| H9  | vitest.config.ts needs per-file coverage thresholds for new modules         | §10 Test Plan          | Added `vitest.config.ts` threshold entries for `src/ai/**`, `src/vocabulary/**`, `src/intents/**`. Added error subclass placement rules (all must be in `src/core/errors/`). (Agent 2)                                                                                                                                                                                                                       |

### MEDIUM Fixes Applied

| ID  | Finding                                         | Section Changed   | Change Made                                                                                                                                                                                   |
| --- | ----------------------------------------------- | ----------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| M1  | Intent fixture binding skeleton incomplete      | §D6 fixture body  | Replaced `/* bind core-wrappers with ui5 + vocabulary */` pseudocode with concrete binding pattern for all `core`, `procurement`, and `sales` namespace entries. (Agent 3)                    |
| M2  | pramanAI fixture scope not declared             | §C9 fixture code  | Added `// Scope: 'test' (default)` comment with rationale explaining why worker scope is unsuitable. (Agent 3)                                                                                |
| M3  | Barrel type exports incomplete in C8 and D5     | §C8 and §D5       | Added complete type export lists to C8 (ai/index.ts) and D5 (intents/index.ts) including domain-specific input/result types. (Agent 3)                                                        |
| M4  | Capability manifest not file-discoverable       | §B4               | Added `dist/capabilities.json` build artifact spec. Added `capabilities.json` to `package.json` files array. Added documentation requirement in skills/ai-capabilities.md. (Agent 4)          |
| M5  | SKILL.md validation not in CI                   | §B2               | Added `scripts/validate-skill-md.ts` (~50 LOC) spec for YAML frontmatter validation. Added `validate:skill-md` npm script. Added to CI gate. (Agent 4)                                        |
| M6  | Intent selector override pattern not documented | §D3 and §D4       | Added `selectors?` override option pattern with TSDoc `@remarks` on all domain functions: "SAP Standard Reference Implementation — pass explicit selectors for customized systems." (Agent 4) |
| M7  | tsconfig.json path aliases for new layers       | §A7 (B2a sub-fix) | Explicitly added `#ai/*`, `#vocabulary/*`, `#intents/*` to the tsconfig.json paths spec. Noted vite-tsconfig-paths already handles resolution. (Agents 1+3)                                   |

### LOW Fixes Applied

| ID  | Finding                                                   | Section Changed    | Change Made                                                                                                                                                                 |
| --- | --------------------------------------------------------- | ------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------- | ------ | -------- | --------- | ------------------------------------------------------ |
| L2  | core-wrappers should take Pick<UI5Handler> not full class | §D2 test plan note | Added note to use `Pick<UI5Handler, 'control'                                                                                                                               | 'click' | 'fill' | 'select' | 'getText' | 'waitForUI5Stable'>` for better testability. (Agent 1) |
| L3  | Vocabulary edge cases in test plan                        | §C12 test spec     | Added vocabulary-matcher edge cases: empty query, no match, accented chars, case sensitivity, confidence threshold filtering, sort by confidence. (Agent 2)                 |
| L4  | AiResponse<T> full type definition                        | §C1                | Replaced partial interface with full discriminated union type including `'partial'` status, `AiResponseMetadata` named type, and `AiResponseError` named type. (Agents 3+4) |
| L5  | generateTest() step execution model unclear               | §C7 AgenticHandler | Added `interpretStep()` method to AgenticHandler interface. Added @remarks clarifying two-phase generate → execute design and checkpoint/resume semantics. (Agent 4)        |

### Source Verifications Performed

The following source files were read to verify fixes before applying:

- `/Users/maheshwar/Documents/projects/mk1/src/fixtures/index.ts` — confirmed actual mergeTests() baseline (line 54): `mergeTests(moduleTest, authTest, navTest, stabilityTest, feTest)`
- `/Users/maheshwar/Documents/projects/mk1/src/core/config/schema.ts` — confirmed aiSchema fields (only provider, apiKey, model, temperature, maxTokens — no Azure fields)
- `/Users/maheshwar/Documents/projects/mk1/src/fixtures/core-fixtures.ts` — confirmed expect.extend() IS present (lines 179–191), confirmed ui5 fixture teardown structure
- `/Users/maheshwar/Documents/projects/mk1/src/fixtures/module-fixtures.ts` — confirmed module ui5 override structure and teardown pattern (page.off without try/finally)
- `/Users/maheshwar/Documents/projects/mk1/package.json` — confirmed openai is already in optionalDependencies at exact "6.22.0", dotenv is in dependencies at "17.3.1"

---

### Finalization Round (2026-02-20) — Wizard + Consistency Review

| ID  | Finding                                          | Change Made                                                                                                                                                                            |
| --- | ------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| F1  | Error classes missing (D1 from review)           | Added A0 sub-batch with AiError, VocabularyError, IntentError in src/core/errors/. Tier 1 tests added.                                                                                 |
| F2  | Anthropic Claude provider not planned            | Added 'anthropic' to LlmService provider enum. Updated aiSchema with anthropicApiKey + anthropic in provider enum. claude-opus-4-6 default. @anthropic-ai/sdk in optionalDependencies. |
| F3  | Capability registry manual (not auto-discovered) | Updated C4 to auto-discover from @capability TSDoc tags via generate-capabilities.ts build script.                                                                                     |
| F4  | Recipe registry manual (not auto-discovered)     | Updated C5 to auto-discover from @recipe TSDoc tags via generate-recipes.ts build script.                                                                                              |
| F5  | AI output format was steps-only                  | Updated C7 AgenticHandler to return AiGeneratedTest { steps, code, metadata }. Added Zod response schema. Added prompt templates.                                                      |
| F6  | Vocabulary scope undefined (2 vs 6 domains)      | Confirmed: 6 vocabulary JSON domains (all from dhikraft). 5 intent domains (MM, SD, FI, PP, Master Data). Warehouse/Quality vocabulary loaded lazily.                                  |
| F7  | Vocabulary was rewrite-from-scratch              | Changed to port-from-dhikraft (Option C hybrid). Added porting steps to C10-C15.                                                                                                       |
| F8  | Only 2 intent domains (MM, SD)                   | Expanded to all 5: added D5 (FI), D6 (PP), D7 (Master Data) with full specs. Existing D5/D6 renumbered to D8/D9.                                                                       |
| F9  | Integration test infrastructure underspecified   | Added Vitest integration project spec, tests/integration/setup.ts, npm scripts, .env.test guidance.                                                                                    |
| F10 | build:full script not in package.json            | Added build:full + generate:capabilities + generate:recipes + generate:skill-md scripts.                                                                                               |
| F11 | vitest.config.ts missing new module thresholds   | Added Tier 1 (100%) thresholds for 3 error classes. Tier 2 (95/90/95/95) for src/ai/**, src/vocabulary/**, src/intents/\*\*.                                                           |
| F12 | SKILL.md generator underspecified                | Added detailed 11-step generator algorithm, progressive disclosure file structure, Claude best practices alignment.                                                                    |
| F13 | Parallelization plan missing                     | Added §15 parallel execution map with 11 agents, dependencies, LOC estimates, token budget table.                                                                                      |
