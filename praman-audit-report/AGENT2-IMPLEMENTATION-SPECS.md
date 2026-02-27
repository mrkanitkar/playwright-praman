# Agent 2: Code Implementation Specifications

**Generated:** 2026-02-27
**Source:** MASTER-ACTION-LIST.md (10 code implementation actions)
**Codebase:** `playwright-praman` v1.0.1

---

## Reviewed by Agent 3 (2026-02-27)

**12 issues found and fixed in-place.** See `AGENT3-REVIEW-FINDINGS.md` for full rationale.

### Changes Applied

1. **ACT-022:** Extended scope to also cover `MAX_CONTEXT_CONTROLS` (same dead-export issue). Fixed test file reference -- tests import `MAX_CONTEXT_CONTROLS`, not `MAX_CONTEXT_CHARS`.
2. **ACT-021 sub-task 1:** Changed invalid error code `ERR_CONTROL_PROPERTY_TYPE` to existing code `ERR_CONTROL_PROPERTY`.
3. **ACT-034/035 dependency:** Downgraded from hard dependency to soft dependency. Moved ACT-035 from Batch 2 to Batch 1.
4. **ACT-040 sub-task 1:** Changed `@throws AIError` to `@throws PramanError`. Added missing `package.json` update for OTLP exporter packages. Added note to create `ERR_TELEMETRY_INIT_FAILED` error code.
5. **ACT-033 sub-task 2:** Added explicit semver/CHANGELOG breaking change note for sync-to-async `saveCheckpoint()`.
6. **ACT-001 sub-task 1:** Added prerequisite "Sub-task 0" for npm workspaces setup. Added note to pin MCP SDK version.
7. **ACT-020:** Added clarity note about `src/schemas/` vs `src/ai/schemas/` naming distinction.
8. **Parallel batching:** Moved ACT-035 to Batch 1; Batch 2 now only has ACT-001 sub-tasks.
9. **Missing items section:** Added M1-M5 covering API Extractor, ESLint exclusions, coverage thresholds, CHANGELOG, and path aliases.

---

## Dependency Graph

```
ACT-022 (15 min)  ─────────────────────────────────────────────────────── standalone
ACT-021 (4 hrs)   ─────────────────────────────────────────────────────── standalone
ACT-041 (3 days)  ─────────────────────────────────────────────────────── standalone
ACT-040 (1 week)  ─────────────────────────────────────────────────────── standalone

ACT-034 (2 days)  ─────────────────────────────────────────────────────── standalone
ACT-035 (3 days)  ─────────────────────────────────────────────────────── standalone (soft dep on ACT-034 isTransientLlmError)
ACT-033 (1 week)  ─────────────────────────────────────────────────────── standalone

ACT-039 (1 week)  ─────────────────────────────────────────────────────── standalone (uses LlmService)

ACT-020 (1 week)  ─────────────────────────────────────────────────────── standalone

ACT-001 (4-6 wks) ─────────────────────────────────────────────────────── standalone (separate package)
    Sub-task 1: scaffold + session manager      (no deps)
    Sub-task 2: core tool implementations       (depends on sub-task 1)
    Sub-task 3: auth + resources + prompts      (depends on sub-task 2)
    Sub-task 4: tests + docs                    (depends on sub-task 3)
```

## Parallel Execution Plan

### Batch 1 (no dependencies -- all run in parallel)

| Task               | Effort | Agent Slots |
| ------------------ | ------ | ----------- |
| ACT-022            | 15 min | 1           |
| ACT-021            | 4 hrs  | 1           |
| ACT-041            | 3 days | 1           |
| ACT-040            | 1 week | 1           |
| ACT-034            | 2 days | 1           |
| ACT-033            | 1 week | 1           |
| ACT-039            | 1 week | 1           |
| ACT-020            | 1 week | 1           |
| ACT-035            | 3 days | 1           |
| ACT-001 sub-task 0 | 30 min | 1           |
| ACT-001 sub-task 1 | 1 day  | 1           |

**Total: 11 parallel agents**

**Note (Agent 3 fix):** ACT-035 moved from Batch 2 to Batch 1. The dependency on ACT-034 is soft -- ACT-035 can use the existing `retry()` from `#core/utils/retry.js` directly, and inline the transient error check. If ACT-034 completes first, ACT-035 should import `isTransientLlmError()` instead. Added ACT-001 sub-task 0 (workspace setup prerequisite).

### Batch 2 (depends on Batch 1)

| Task               | Depends On         | Effort |
| ------------------ | ------------------ | ------ |
| ACT-001 sub-task 2 | ACT-001 sub-task 1 | 2 days |

### Batch 3 (depends on Batch 2)

| Task               | Depends On         | Effort |
| ------------------ | ------------------ | ------ |
| ACT-001 sub-task 3 | ACT-001 sub-task 2 | 1 day  |

### Batch 4 (depends on Batch 3)

| Task               | Depends On         | Effort |
| ------------------ | ------------------ | ------ |
| ACT-001 sub-task 4 | ACT-001 sub-task 3 | 1 day  |

---

## Detailed Specs

---

### ACT-022: Remove dead exports `MAX_CONTEXT_CHARS` and `MAX_CONTEXT_CONTROLS`

**Priority:** P3 | **Effort:** 15 min | **Sub-tasks:** 1

**Current State:**

- `MAX_CONTEXT_CHARS` is exported from `src/ai/agentic-prompts.ts` (line 28)
- `MAX_CONTEXT_CONTROLS` is exported from `src/ai/agentic-prompts.ts` (line 31)
- Both are used internally in `buildUserPrompt()` (lines 126, 130-131 of same file)
- Neither is imported by any source file in `src/` (verified: no `import.*MAX_CONTEXT` in `src/`)
- `MAX_CONTEXT_CONTROLS` IS imported by `tests/unit/ai/agentic-prompts.test.ts` (line 31)
- `MAX_CONTEXT_CHARS` is NOT imported by the test file (the test checks truncation behavior indirectly via `'... (truncated)'` string matching)
- The `export` keyword makes both part of the public API surface

**Target State:**

- Remove the `export` keyword from both constants so they become module-private
- OR: If they have legitimate external use (e.g., MCP server needs them), document and keep the exports

**Files to Modify:**

- `/Users/maheshwar/Documents/projects/mk1/src/ai/agentic-prompts.ts` (lines 28, 31)

**Files to Verify:**

- `/Users/maheshwar/Documents/projects/mk1/tests/unit/ai/agentic-prompts.test.ts` (update: test imports `MAX_CONTEXT_CONTROLS` on line 31, NOT `MAX_CONTEXT_CHARS`)

#### Sub-task 1 of 1: Remove export keyword from MAX_CONTEXT_CHARS and MAX_CONTEXT_CONTROLS

- **Scope:** `src/ai/agentic-prompts.ts`, `tests/unit/ai/agentic-prompts.test.ts`
- **Input:** Both constants are exported but only consumed internally within `agentic-prompts.ts`
- **Action:**
  1. Change line 28 from `export const MAX_CONTEXT_CHARS = 50_000;` to `const MAX_CONTEXT_CHARS = 50_000;`
  2. Change line 31 from `export const MAX_CONTEXT_CONTROLS = 200;` to `const MAX_CONTEXT_CONTROLS = 200;`
  3. Update `tests/unit/ai/agentic-prompts.test.ts` line 31: the test imports `MAX_CONTEXT_CONTROLS` (not `MAX_CONTEXT_CHARS`). Inline the value `200` in the test assertions, or create a test-local constant `const MAX_CONTEXT_CONTROLS = 200;`.
  4. Run `npm run lint && npm run typecheck && npm run test:unit` to verify
- **Tests:** Update `tests/unit/ai/agentic-prompts.test.ts` to remove `MAX_CONTEXT_CONTROLS` import and inline the value
- **Acceptance:**
  - Neither `MAX_CONTEXT_CHARS` nor `MAX_CONTEXT_CONTROLS` appears in `npm run check:exports` output
  - `npm run lint && npm run typecheck && npm run test:unit` all pass
  - No runtime behavior change

**Inter-dependencies:** None

---

### ACT-021: Replace ~10 type assertions with runtime guards

**Priority:** P3 | **Effort:** 4 hours | **Sub-tasks:** 3

**Current State:**
From the codebase scan, there are ~103 `as` assertions across `src/`. Most are legitimate:

- `as const` (safe, no runtime issue)
- `as never` in fixture factories (intentional type erasure for Playwright's generic Page)
- Browser script type assertions (necessary -- browser context has no TypeScript types)

The ~10 candidates for replacement (runtime-unsafe `as` casts in Node-side code):

| #   | File                                    | Line    | Assertion                                    | Risk                       |
| --- | --------------------------------------- | ------- | -------------------------------------------- | -------------------------- |
| 1   | `src/fixtures/ui5-handler.ts`           | 558     | `result as string`                           | Unknown result type        |
| 2   | `src/fixtures/ui5-handler.ts`           | 580     | `result as string`                           | Unknown result type        |
| 3   | `src/fixtures/ui5-handler.ts`           | 789-801 | `selector as Record<string, unknown>` x4     | Selector type narrowing    |
| 4   | `src/modules/odata-http.ts`             | 217     | `response.json() as TData`                   | Unvalidated HTTP response  |
| 5   | `src/modules/odata-http.ts`             | 489-500 | `response.json() as Record<string, unknown>` | Unvalidated HTTP response  |
| 6   | `src/modules/table.ts`                  | 209,216 | `result.variant as TableVariant`             | Unvalidated variant string |
| 7   | `src/vocabulary/vocabulary-loader.ts`   | 261     | `JSON.parse(content) as RawDomainFile`       | Unvalidated JSON parse     |
| 8   | `src/fixtures/test-data-handler.ts`     | 117     | `template as T`                              | Generic type assumption    |
| 9   | `src/fixtures/test-data-handler.ts`     | 164     | `JSON.parse(content) as T`                   | Unvalidated JSON parse     |
| 10  | `src/reporters/odata-trace-reporter.ts` | 371     | `JSON.parse(body.toString()) as unknown`     | Already `unknown` -- safe  |

**Target State:**
Replace unsafe `as` casts with runtime type guards or Zod validation where performance cost is negligible.

**Files to Modify:**

- `/Users/maheshwar/Documents/projects/mk1/src/fixtures/ui5-handler.ts`
- `/Users/maheshwar/Documents/projects/mk1/src/modules/odata-http.ts`
- `/Users/maheshwar/Documents/projects/mk1/src/modules/table.ts`
- `/Users/maheshwar/Documents/projects/mk1/src/vocabulary/vocabulary-loader.ts`
- `/Users/maheshwar/Documents/projects/mk1/src/fixtures/test-data-handler.ts`

#### Sub-task 1 of 3: Replace ui5-handler.ts and table.ts assertions

- **Scope:** `src/fixtures/ui5-handler.ts`, `src/modules/table.ts`
- **Input:** Lines 558, 580, 789-801 in ui5-handler.ts; lines 209, 216 in table.ts
- **Action:**
  1. In `ui5-handler.ts` lines 558, 580: Replace `result as string` with a runtime guard:
     ```typescript
     if (typeof result !== 'string') {
       throw new ControlError({
         code: 'ERR_CONTROL_PROPERTY',
         message: `Expected string result, got ${typeof result}`,
         attempted: 'Read control property',
         retryable: false,
         suggestions: ['Verify the control property returns a string value'],
       });
     }
     return result;
     ```
     **Note (Agent 3 fix):** Changed from `ERR_CONTROL_PROPERTY_TYPE` (does not exist in `ErrorCode`) to `ERR_CONTROL_PROPERTY` (existing valid code in `ControlErrorOptions`).
  2. In `ui5-handler.ts` lines 789-801: Replace `selector as Record<string, unknown>` with an inline guard function:
     ```typescript
     function isRecord(value: unknown): value is Record<string, unknown> {
       return typeof value === 'object' && value !== null;
     }
     ```
  3. In `table.ts` lines 209, 216: Replace `result.variant as TableVariant` with Zod validation:
     ```typescript
     const variant = TableVariantSchema.parse(result.variant);
     ```
     (Define `TableVariantSchema` as `z.enum(['responsive', 'grid', 'analytical', 'tree'])` or equivalent)
- **Tests:** `tests/unit/fixtures/ui5-handler.test.ts`, `tests/unit/modules/table.test.ts` -- add tests for invalid type scenarios
- **Acceptance:** `npm run typecheck && npm run test:unit` pass, no `as string` or `as TableVariant` in these files

#### Sub-task 2 of 3: Replace odata-http.ts response assertions

- **Scope:** `src/modules/odata-http.ts`
- **Input:** Lines 217, 489-500
- **Action:**
  1. Line 217: `response.json() as TData` -- add a runtime check. Since `TData` is a generic, use a validator pattern:
     ```typescript
     const data: unknown = await response.json();
     // Return as-is since callers provide the generic; the assertion is on the HTTP layer
     return data as TData;
     ```
     This one should stay as-is OR accept an optional Zod schema parameter. **Decision: leave as-is with a TSDoc comment explaining why the assertion is safe (response.json() already parses).**
  2. Lines 489-500: Replace with proper type narrowing:
     ```typescript
     const raw: unknown = await response.json();
     if (typeof raw !== 'object' || raw === null) {
       throw new ODataError({ ... });
     }
     const record = raw as Record<string, unknown>;
     const dProperty = typeof record['d'] === 'object' && record['d'] !== null
       ? record['d'] as Record<string, unknown>
       : undefined;
     ```
- **Tests:** `tests/unit/modules/odata-http.test.ts` -- add test for malformed JSON response
- **Acceptance:** `npm run typecheck && npm run test:unit` pass

#### Sub-task 3 of 3: Replace vocabulary-loader.ts and test-data-handler.ts assertions

- **Scope:** `src/vocabulary/vocabulary-loader.ts`, `src/fixtures/test-data-handler.ts`
- **Input:** Line 261 in vocabulary-loader.ts; lines 117, 164 in test-data-handler.ts
- **Action:**
  1. `vocabulary-loader.ts` line 261: Replace `JSON.parse(content) as RawDomainFile` with Zod validation:
     ```typescript
     const parsed: unknown = JSON.parse(content);
     const raw = RawDomainFileSchema.parse(parsed);
     ```
     Define `RawDomainFileSchema` as a Zod schema matching the `RawDomainFile` interface shape.
  2. `test-data-handler.ts` line 117: `this.substituteTemplateValues(template) as T` -- add TSDoc explaining this is a controlled generic cast in a factory method
  3. `test-data-handler.ts` line 164: `JSON.parse(content) as T` -- wrap with a comment and optional schema validation:
     ```typescript
     const parsed: unknown = JSON.parse(content);
     // Note: T is caller-provided; runtime validation is caller's responsibility
     return parsed as T;
     ```
- **Tests:** `tests/unit/vocabulary/vocabulary-loader.test.ts` -- add test for malformed domain file JSON
- **Acceptance:** `npm run typecheck && npm run test:unit` pass

**Inter-dependencies:** None

---

### ACT-034: Add LLM retry logic with exponential backoff

**Priority:** P3 | **Effort:** 2 days | **Sub-tasks:** 2

**Current State:**

- `src/ai/llm-providers.ts` has three provider call functions: `callAzureOpenAI()`, `callOpenAI()`, `callAnthropic()`
- None have retry logic -- a single API failure causes immediate error propagation
- `src/ai/llm-service.ts` `LlmServiceImpl.chat()` catches errors and returns `AiResponse` error envelopes but does not retry
- `src/core/utils/index.ts` exports a `retry()` utility (exponential backoff with jitter already exists)
- The project follows Google SRE best practice: exponential backoff + jitter

**Target State:**

- Provider call functions retry on transient errors (429, 500, 502, 503, 504)
- Use existing `retry()` utility from `#core/utils/index.js`
- Configurable max retries via `config.ai.maxRetries` (default: 3)
- Configurable base delay via `config.ai.retryBaseDelay` (default: 1000ms)

**Files to Modify:**

- `/Users/maheshwar/Documents/projects/mk1/src/core/config/schema.ts` (add AI retry config fields)
- `/Users/maheshwar/Documents/projects/mk1/src/ai/llm-providers.ts` (wrap calls with retry)
- `/Users/maheshwar/Documents/projects/mk1/src/ai/llm-service.ts` (pass retry config to providers)

**Files to Create:**

- `/Users/maheshwar/Documents/projects/mk1/src/ai/llm-retry.ts` (retry wrapper specific to LLM)
- `/Users/maheshwar/Documents/projects/mk1/tests/unit/ai/llm-retry.test.ts`

#### Sub-task 1 of 2: Create LLM retry wrapper and update config schema

- **Scope:** `src/ai/llm-retry.ts`, `src/core/config/schema.ts`
- **Input:**
  - Existing `retry()` from `#core/utils/index.js` (check signature)
  - AI config schema in `src/core/config/schema.ts` lines 49-62
  - Error pattern from `src/core/errors/base.ts`
- **Action:**
  1. Add to `aiSchema` in `src/core/config/schema.ts`:
     ```typescript
     maxRetries: z.number().int().min(0).max(10).default(3),
     retryBaseDelay: z.number().int().positive().default(1000),
     ```
  2. Create `src/ai/llm-retry.ts`:

     ```typescript
     /**
      * LLM-specific retry configuration and wrapper.
      */
     export interface LlmRetryConfig {
       readonly maxRetries: number;
       readonly retryBaseDelay: number;
     }

     /**
      * Determines if an error is transient and retryable.
      * HTTP status codes: 429 (rate limit), 500, 502, 503, 504
      */
     export function isTransientLlmError(error: unknown): boolean { ... }

     /**
      * Wraps an LLM provider call with exponential backoff + jitter.
      *
      * @param fn - The provider call function to retry
      * @param config - Retry configuration
      * @returns The result of the first successful call
      * @throws The last error if all retries are exhausted
      */
     export async function withLlmRetry<T>(
       fn: () => Promise<T>,
       config: LlmRetryConfig,
     ): Promise<T> { ... }
     ```

  3. The `isTransientLlmError` function should check:
     - Error message contains "429", "rate limit", "too many requests"
     - Error message contains "500", "502", "503", "504"
     - Error message contains "timeout", "ECONNRESET", "ETIMEDOUT"
     - Anthropic SDK overload errors
     - OpenAI SDK rate limit errors

- **Tests:** `tests/unit/ai/llm-retry.test.ts`
  - Test: retries on 429 error up to maxRetries
  - Test: does NOT retry on 400/401/403 (non-transient)
  - Test: exponential backoff delay increases
  - Test: jitter randomizes delay
  - Test: returns result on first success
  - Test: throws last error after maxRetries exhausted
  - Test: respects maxRetries=0 (no retries)
- **Acceptance:** All tests pass, `npm run typecheck` passes

#### Sub-task 2 of 2: Integrate retry into LLM providers and service

- **Scope:** `src/ai/llm-providers.ts`, `src/ai/llm-service.ts`
- **Input:** `withLlmRetry()` from sub-task 1, updated AI config schema
- **Action:**
  1. In `src/ai/llm-service.ts` `LlmServiceImpl.chat()`, wrap each provider call with retry:
     ```typescript
     case 'azure-openai': {
       completion = await withLlmRetry(
         () => callAzureOpenAI(messages, aiConfig),
         { maxRetries: aiConfig.maxRetries, retryBaseDelay: aiConfig.retryBaseDelay },
       );
       break;
     }
     ```
  2. Update `tests/unit/ai/llm-service.test.ts` to verify retry behavior is invoked
  3. Update `tests/unit/ai/llm-providers.test.ts` if needed
- **Tests:** Update existing provider/service tests
- **Acceptance:**
  - `npm run typecheck && npm run test:unit && npm run lint` all pass
  - Provider calls are retried on transient errors
  - Non-transient errors fail immediately

**Inter-dependencies:** None for sub-task 1. ACT-035 (streaming) has a soft dependency on `isTransientLlmError()` from this task, but can proceed independently using the existing `retry()` from `#core/utils/retry.js`.

---

### ACT-035: Add streaming support for LLM calls

**Priority:** P3 | **Effort:** 3 days | **Sub-tasks:** 2

**Current State:**

- `callAnthropic()`, `callOpenAI()`, `callAzureOpenAI()` all use request-response (non-streaming)
- `CompletionResult` interface: `{ content: string; model?: string; tokens?: number }`
- `LlmService.chat()` returns `Promise<AiResponse<unknown>>`
- No `AsyncIterable` or `ReadableStream` support

**Target State:**

- Add `stream: boolean` option to `LlmService.chat()` and `LlmService.complete()`
- When `stream: true`, return an `AsyncIterable<StreamChunk>` for incremental token delivery
- Non-streaming remains the default
- Streaming integrates with retry (ACT-034): retry on connection failure, but do NOT retry mid-stream

**Files to Create:**

- `/Users/maheshwar/Documents/projects/mk1/src/ai/llm-streaming.ts` (streaming types + helpers)
- `/Users/maheshwar/Documents/projects/mk1/tests/unit/ai/llm-streaming.test.ts`

**Files to Modify:**

- `/Users/maheshwar/Documents/projects/mk1/src/ai/llm-providers.ts` (add streaming variants)
- `/Users/maheshwar/Documents/projects/mk1/src/ai/llm-service.ts` (add streaming interface)
- `/Users/maheshwar/Documents/projects/mk1/src/ai/types.ts` (add streaming types)
- `/Users/maheshwar/Documents/projects/mk1/src/ai/index.ts` (export streaming types)

#### Sub-task 1 of 2: Define streaming types and implement provider streaming

- **Scope:** `src/ai/llm-streaming.ts`, `src/ai/llm-providers.ts`, `src/ai/types.ts`
- **Input:** Current `CompletionResult` interface, Anthropic/OpenAI SDK streaming APIs
- **Action:**
  1. Create `src/ai/llm-streaming.ts`:

     ```typescript
     /**
      * A single chunk from an LLM streaming response.
      */
     export interface StreamChunk {
       /** Incremental text content. */
       readonly content: string;
       /** Whether this is the final chunk. */
       readonly done: boolean;
       /** Model identifier (available on first or last chunk). */
       readonly model?: string;
       /** Accumulated token count (available on last chunk). */
       readonly tokens?: number;
     }

     /**
      * Options for streaming LLM calls.
      */
     export interface StreamOptions {
       /** Callback for each chunk received. */
       readonly onChunk?: (chunk: StreamChunk) => void;
       /** AbortSignal for cancellation. */
       readonly signal?: AbortSignal;
     }

     /**
      * Collects an async iterable of StreamChunks into a single CompletionResult.
      */
     export async function collectStream(
       stream: AsyncIterable<StreamChunk>,
     ): Promise<CompletionResult> { ... }
     ```

  2. In `src/ai/llm-providers.ts`, add streaming variants:

     ```typescript
     export async function* streamAnthropic(
       messages: ChatMessage[],
       aiConfig: NonNullable<PramanConfig['ai']>,
     ): AsyncGenerator<StreamChunk> { ... }

     export async function* streamOpenAI(
       messages: ChatMessage[],
       aiConfig: NonNullable<PramanConfig['ai']>,
     ): AsyncGenerator<StreamChunk> { ... }

     export async function* streamAzureOpenAI(
       messages: ChatMessage[],
       aiConfig: NonNullable<PramanConfig['ai']>,
     ): AsyncGenerator<StreamChunk> { ... }
     ```

  3. Add `StreamChunk` and `StreamOptions` to `src/ai/types.ts` exports

- **Tests:** `tests/unit/ai/llm-streaming.test.ts`
  - Test: `collectStream()` assembles chunks into CompletionResult
  - Test: streaming generator yields chunks with correct shape
  - Test: `done: true` on final chunk
  - Test: AbortSignal cancels stream
- **Acceptance:** `npm run typecheck && npm run test:unit` pass

#### Sub-task 2 of 2: Integrate streaming into LlmService

- **Scope:** `src/ai/llm-service.ts`, `src/ai/index.ts`
- **Input:** Streaming types and provider functions from sub-task 1
- **Action:**
  1. Extend `LlmService` interface:

     ```typescript
     export interface LlmService {
       // ... existing methods ...

       /**
        * Stream a multi-turn conversation response.
        *
        * @param messages - Conversation turns
        * @param options - Stream options (onChunk callback, abort signal)
        * @returns AsyncIterable of StreamChunks
        */
       stream(messages: ChatMessage[], options?: StreamOptions): AsyncIterable<StreamChunk>;
     }
     ```

  2. Implement `stream()` in `LlmServiceImpl`:
     - Select provider based on `config.ai.provider`
     - Delegate to `streamAnthropic()`, `streamOpenAI()`, or `streamAzureOpenAI()`
     - Wrap with retry from ACT-034 (retry on connection errors only, not mid-stream)
  3. Export new types from `src/ai/index.ts`

- **Tests:** Update `tests/unit/ai/llm-service.test.ts`
- **Acceptance:**
  - `npm run typecheck && npm run test:unit && npm run lint` pass
  - Streaming calls return AsyncIterable<StreamChunk>
  - Non-streaming behavior unchanged

**Inter-dependencies:** Soft dependency on ACT-034 (can share `isTransientLlmError()` if available, otherwise inline the transient error check). Streaming retry semantics differ from request-response retry: retry the initial connection only, never retry mid-stream. The existing `retry()` from `#core/utils/retry.js` suffices for this pattern.

---

### ACT-033: Add persistent AgenticCheckpoint storage

**Priority:** P3 | **Effort:** 1 week | **Sub-tasks:** 2

**Current State:**

- `AgenticCheckpoint` interface defined in `src/ai/types.ts` (lines 305-318):
  ```typescript
  interface AgenticCheckpoint {
    readonly sessionId: string;
    readonly currentStep: number;
    readonly completedSteps: string[];
    readonly remainingSteps: string[];
    readonly state: Record<string, unknown>;
    readonly timestamp: string;
  }
  ```
- `AgenticHandler` stores checkpoints in an in-memory `Map<string, AgenticCheckpoint>` (line 99)
- `saveCheckpoint()` and `resumeFromCheckpoint()` methods exist but are memory-only
- No file-based persistence -- checkpoints are lost on process restart

**Target State:**

- Add a `CheckpointStore` interface with pluggable backends
- Implement `FileCheckpointStore` that persists to JSON files in a configurable directory
- `AgenticHandler` accepts an optional `CheckpointStore` in constructor
- Default remains in-memory (backwards compatible)
- Checkpoints survive process restarts for long-running agentic sessions

**Files to Create:**

- `/Users/maheshwar/Documents/projects/mk1/src/ai/checkpoint-store.ts` (interface + file implementation)
- `/Users/maheshwar/Documents/projects/mk1/tests/unit/ai/checkpoint-store.test.ts`

**Files to Modify:**

- `/Users/maheshwar/Documents/projects/mk1/src/ai/agentic-handler.ts` (accept CheckpointStore)
- `/Users/maheshwar/Documents/projects/mk1/src/ai/index.ts` (export CheckpointStore)
- `/Users/maheshwar/Documents/projects/mk1/tests/unit/ai/agentic-handler.test.ts` (update tests)

#### Sub-task 1 of 2: Create CheckpointStore interface and FileCheckpointStore

- **Scope:** `src/ai/checkpoint-store.ts`, `tests/unit/ai/checkpoint-store.test.ts`
- **Input:** `AgenticCheckpoint` type from `src/ai/types.ts`
- **Action:**
  1. Create `src/ai/checkpoint-store.ts`:

     ```typescript
     import type { AgenticCheckpoint } from './types.js';

     /**
      * Pluggable storage backend for AgenticCheckpoint persistence.
      */
     export interface CheckpointStore {
       /** Save a checkpoint (upsert by sessionId). */
       save(checkpoint: AgenticCheckpoint): Promise<void>;
       /** Load a checkpoint by session ID. Returns undefined if not found. */
       load(sessionId: string): Promise<AgenticCheckpoint | undefined>;
       /** Delete a checkpoint by session ID. */
       delete(sessionId: string): Promise<void>;
       /** List all stored session IDs. */
       list(): Promise<string[]>;
     }

     /**
      * In-memory checkpoint store (default, backwards compatible).
      */
     export class MemoryCheckpointStore implements CheckpointStore {
       private readonly store = new Map<string, AgenticCheckpoint>();
       async save(checkpoint: AgenticCheckpoint): Promise<void> { ... }
       async load(sessionId: string): Promise<AgenticCheckpoint | undefined> { ... }
       async delete(sessionId: string): Promise<void> { ... }
       async list(): Promise<string[]> { ... }
     }

     /**
      * File-based checkpoint store using JSON files.
      *
      * Directory structure: `<baseDir>/<sessionId>.checkpoint.json`
      */
     export class FileCheckpointStore implements CheckpointStore {
       constructor(private readonly baseDir: string) {}
       async save(checkpoint: AgenticCheckpoint): Promise<void> { ... }
       async load(sessionId: string): Promise<AgenticCheckpoint | undefined> { ... }
       async delete(sessionId: string): Promise<void> { ... }
       async list(): Promise<string[]> { ... }
     }
     ```

  2. File operations use `node:fs/promises` and `node:path`
  3. Validate checkpoint data with a Zod schema on load (protect against corrupted files)
  4. File names: `<sessionId>.checkpoint.json` -- sanitize sessionId to prevent path traversal

- **Tests:** `tests/unit/ai/checkpoint-store.test.ts`
  - Test: MemoryCheckpointStore save/load/delete/list
  - Test: FileCheckpointStore save creates JSON file
  - Test: FileCheckpointStore load reads and parses JSON
  - Test: FileCheckpointStore load returns undefined for missing file
  - Test: FileCheckpointStore delete removes file
  - Test: FileCheckpointStore list returns all session IDs
  - Test: FileCheckpointStore rejects path traversal in sessionId
  - Test: FileCheckpointStore handles corrupted JSON gracefully
  - Use `node:os` tmpdir for test isolation
- **Acceptance:** All tests pass, `npm run typecheck` passes

#### Sub-task 2 of 2: Integrate CheckpointStore into AgenticHandler

- **Scope:** `src/ai/agentic-handler.ts`, `src/ai/index.ts`, `tests/unit/ai/agentic-handler.test.ts`
- **Input:** `CheckpointStore` and `MemoryCheckpointStore` from sub-task 1
- **Action:**
  1. Update `AgenticHandler` constructor to accept optional `CheckpointStore`:
     ```typescript
     constructor(
       private readonly llm: LlmService,
       private readonly contextBuilder: typeof buildPageContext,
       private readonly capabilityRegistry: CapabilityRegistry,
       private readonly recipeRegistry: RecipeRegistry = new RecipeRegistry(),
       private readonly checkpointStore: CheckpointStore = new MemoryCheckpointStore(),
     ) {}
     ```
  2. Update `saveCheckpoint()` to be async and delegate to store:
     ```typescript
     async saveCheckpoint(checkpoint: AgenticCheckpoint): Promise<void> {
       await this.checkpointStore.save(checkpoint);
     }
     ```
  3. Update `resumeFromCheckpoint()` to be async:
     ```typescript
     async resumeFromCheckpoint(checkpointId: string): Promise<AgenticCheckpoint | undefined> {
       return this.checkpointStore.load(checkpointId);
     }
     ```
  4. Remove the private `checkpoints` Map field
  5. Export `CheckpointStore`, `MemoryCheckpointStore`, `FileCheckpointStore` from `src/ai/index.ts`
  6. **Breaking change note (Agent 3 clarification):** `saveCheckpoint()` changes from sync (`void`) to async (`Promise<void>`). `resumeFromCheckpoint()` also changes from sync to async. There are no external consumers currently (only tests call these methods), but this IS a public API change. It must be documented as a BREAKING CHANGE in CHANGELOG.md if the package follows semver. All test call sites must add `await`.
- **Tests:** Update `tests/unit/ai/agentic-handler.test.ts` to use both MemoryCheckpointStore and mock CheckpointStore
- **Acceptance:**
  - `npm run typecheck && npm run test:unit && npm run lint` pass
  - Existing tests still pass (MemoryCheckpointStore as default)

**Inter-dependencies:** None

---

### ACT-039: Add dynamic token budget management

**Priority:** P4 | **Effort:** 1 week | **Sub-tasks:** 2

**Current State:**

- `LlmService.chat()` sends messages directly to providers with no token counting
- `config.ai.maxTokens` is a static number (optional, passed directly to provider)
- No model-specific context window awareness
- `MAX_CONTEXT_CHARS` (50,000) is a character-level limit in `agentic-prompts.ts`, not token-level
- Anthropic/OpenAI models have different context windows (Claude: 200K, GPT-4o: 128K, etc.)

**Target State:**

- Add a `TokenBudget` utility that calculates available tokens per model
- Dynamic allocation: system prompt gets X%, user context gets Y%, reserve Z% for output
- Configurable per model with sensible defaults
- Token estimation (not exact counting -- that requires tiktoken/similar which is heavy)

**Files to Create:**

- `/Users/maheshwar/Documents/projects/mk1/src/ai/token-budget.ts`
- `/Users/maheshwar/Documents/projects/mk1/tests/unit/ai/token-budget.test.ts`

**Files to Modify:**

- `/Users/maheshwar/Documents/projects/mk1/src/ai/llm-service.ts` (integrate budget checks)
- `/Users/maheshwar/Documents/projects/mk1/src/ai/agentic-prompts.ts` (use token budget for context truncation)
- `/Users/maheshwar/Documents/projects/mk1/src/core/config/schema.ts` (add budget config)

#### Sub-task 1 of 2: Create TokenBudget utility

- **Scope:** `src/ai/token-budget.ts`, `tests/unit/ai/token-budget.test.ts`
- **Input:** Model context windows, token estimation heuristics
- **Action:**
  1. Create `src/ai/token-budget.ts`:

     ```typescript
     /**
      * Known model context window sizes (in tokens).
      */
     export const MODEL_CONTEXT_WINDOWS: Readonly<Record<string, number>> = {
       'gpt-4o': 128_000,
       'gpt-4o-mini': 128_000,
       'gpt-4-turbo': 128_000,
       'gpt-4': 8_192,
       'gpt-3.5-turbo': 16_385,
       'claude-opus-4-6': 200_000,
       'claude-sonnet-4-5-20250514': 200_000,
       'claude-3-5-sonnet-20241022': 200_000,
       'claude-3-5-haiku-20241022': 200_000,
     };

     /** Default budget allocation ratios. */
     export const DEFAULT_BUDGET_RATIOS = {
       systemPrompt: 0.20,   // 20% for system prompt
       userContext: 0.50,     // 50% for user context
       outputReserve: 0.30,  // 30% reserved for model output
     } as const;

     /**
      * Estimates token count from character count.
      * Heuristic: ~4 characters per token for English text.
      */
     export function estimateTokens(text: string): number { ... }

     /**
      * Calculates the token budget for a given model.
      */
     export interface TokenBudget {
       readonly modelContextWindow: number;
       readonly systemPromptBudget: number;
       readonly userContextBudget: number;
       readonly outputReserveBudget: number;
     }

     /**
      * Creates a TokenBudget for the specified model.
      */
     export function createTokenBudget(
       model: string,
       ratios?: Partial<typeof DEFAULT_BUDGET_RATIOS>,
     ): TokenBudget { ... }

     /**
      * Truncates text to fit within a token budget.
      */
     export function truncateToTokenBudget(
       text: string,
       maxTokens: number,
     ): string { ... }
     ```

- **Tests:** `tests/unit/ai/token-budget.test.ts`
  - Test: estimateTokens returns reasonable estimates
  - Test: createTokenBudget for known models
  - Test: createTokenBudget with unknown model uses conservative default (8,192)
  - Test: truncateToTokenBudget truncates long text
  - Test: truncateToTokenBudget returns short text unchanged
  - Test: custom ratios override defaults
- **Acceptance:** All tests pass, `npm run typecheck` passes

#### Sub-task 2 of 2: Integrate token budget into LLM service and prompts

- **Scope:** `src/ai/llm-service.ts`, `src/ai/agentic-prompts.ts`, `src/core/config/schema.ts`
- **Input:** `TokenBudget` utility from sub-task 1
- **Action:**
  1. Add optional `tokenBudgetRatios` to AI config schema:
     ```typescript
     tokenBudgetRatios: z.object({
       systemPrompt: z.number().min(0.05).max(0.5).default(0.20),
       userContext: z.number().min(0.1).max(0.8).default(0.50),
       outputReserve: z.number().min(0.1).max(0.5).default(0.30),
     }).optional(),
     ```
  2. In `LlmServiceImpl.chat()`, before calling provider:
     - Create token budget from model name
     - Warn if total estimated tokens exceed context window
     - Log budget allocation at debug level
  3. In `buildUserPrompt()`, replace `MAX_CONTEXT_CHARS` with token-aware truncation:
     ```typescript
     const budget = createTokenBudget(model);
     const maxChars = budget.userContextBudget * 4; // ~4 chars per token
     ```
  4. Export token budget types from `src/ai/index.ts`
- **Tests:** Update existing prompt tests
- **Acceptance:**
  - `npm run typecheck && npm run test:unit && npm run lint` pass
  - Token budget warnings appear in debug logs

**Inter-dependencies:** None (standalone, but uses `LlmService` internals)

---

### ACT-040: OpenTelemetry real SDK initialization

**Priority:** P4 | **Effort:** 1 week | **Sub-tasks:** 2

**Current State:**

- `src/core/telemetry/otel.ts` defines `TracerWrapper` and `SpanWrapper` interfaces
- `initTelemetry()` always returns `NO_OP_TRACER` regardless of config (Phase 1 design)
- Config schema has telemetry section: `{ openTelemetry: boolean, exporter: 'otlp' | 'azure-monitor' | 'jaeger', endpoint: url, serviceName: string }`
- `@opentelemetry/api` and `@opentelemetry/sdk-node` are listed as optional dependencies
- The `initTelemetry()` function is async (ready for dynamic import of OTel SDK)

**Target State:**

- When `config.telemetry?.openTelemetry === true`, initialize real OTel SDK
- Create `RealTracerWrapper` that delegates to `@opentelemetry/api.Tracer`
- Support OTLP exporter (default), with Azure Monitor and Jaeger as options
- Graceful degradation: if SDK packages are missing, fall back to NoOpTracer with warning
- `shutdown()` properly flushes spans

**Files to Create:**

- `/Users/maheshwar/Documents/projects/mk1/src/core/telemetry/real-tracer.ts` (RealTracerWrapper)
- `/Users/maheshwar/Documents/projects/mk1/tests/unit/core/telemetry/real-tracer.test.ts`

**Files to Modify:**

- `/Users/maheshwar/Documents/projects/mk1/src/core/telemetry/otel.ts` (update initTelemetry)

#### Sub-task 1 of 2: Create RealTracerWrapper

- **Scope:** `src/core/telemetry/real-tracer.ts`, `tests/unit/core/telemetry/real-tracer.test.ts`
- **Input:** `TracerWrapper` and `SpanWrapper` interfaces from `src/core/telemetry/otel.ts`, `@opentelemetry/api` types
- **Action:**
  1. Create `src/core/telemetry/real-tracer.ts`:

     ```typescript
     import type { Tracer, Span } from '@opentelemetry/api';
     import type { SpanWrapper, TracerWrapper } from './otel.js';

     /**
      * Real OTel span wrapper that delegates to @opentelemetry/api.Span.
      */
     class RealSpanWrapper implements SpanWrapper {
       constructor(private readonly span: Span) {}
       end(): void { this.span.end(); }
       setAttribute(key: string, value: string | number | boolean): void {
         this.span.setAttribute(key, value);
       }
       setStatus(code: 'ok' | 'error', message?: string): void { ... }
       addEvent(name: string, attributes?: Record<string, string>): void { ... }
     }

     /**
      * Real OTel tracer wrapper that delegates to @opentelemetry/api.Tracer.
      */
     export class RealTracerWrapper implements TracerWrapper {
       constructor(
         private readonly tracer: Tracer,
         private readonly shutdownFn: () => Promise<void>,
       ) {}
       startSpan(name: string, attributes?: Record<string, string>): SpanWrapper { ... }
       async withSpan<T>(name: string, fn: () => Promise<T>): Promise<T> { ... }
       recordException(span: SpanWrapper, error: Error): void { ... }
       async shutdown(): Promise<void> { await this.shutdownFn(); }
     }

     /**
      * Initializes the OTel NodeSDK with the configured exporter.
      *
      * @param config - Telemetry configuration block
      * @returns RealTracerWrapper instance
      * @throws PramanError with code ERR_TELEMETRY_INIT_FAILED if SDK packages are missing
      */
     export async function createRealTracer(
       config: { exporter: string; endpoint?: string; serviceName: string },
     ): Promise<RealTracerWrapper> { ... }
     ```

     **Note (Agent 3 fix):** Changed `@throws AIError` to `@throws PramanError`. Telemetry is core infrastructure, not AI. A new error code `ERR_TELEMETRY_INIT_FAILED` must be added to `src/core/errors/codes.ts`.

  2. The `createRealTracer` function:
     - Dynamically imports `@opentelemetry/sdk-node` and `@opentelemetry/api`
     - Configures exporter based on `config.exporter`:
       - `'otlp'`: uses `@opentelemetry/exporter-trace-otlp-http` (add to optionalDependencies)
       - `'jaeger'`: uses OTLP with Jaeger endpoint format
       - `'azure-monitor'`: uses `@azure/monitor-opentelemetry-exporter` (add to optionalDependencies)
     - Creates `NodeSDK` instance with resource attributes
     - Returns `RealTracerWrapper` with shutdown bound to `sdk.shutdown()`
  3. **Update `package.json` optionalDependencies (Agent 3 addition):** Add the exporter packages that are dynamically imported:
     ```json
     "@opentelemetry/exporter-trace-otlp-http": ">=0.212.0",
     "@azure/monitor-opentelemetry-exporter": ">=1.0.0-beta.27"
     ```
     Without these entries, `tsup`'s `external` array (derived from optionalDependencies) will not externalize them, causing build issues.

- **Tests:** `tests/unit/core/telemetry/real-tracer.test.ts`
  - Test: RealSpanWrapper.end() delegates to OTel span
  - Test: RealSpanWrapper.setAttribute() delegates correctly
  - Test: RealTracerWrapper.startSpan() creates real spans
  - Test: RealTracerWrapper.withSpan() handles errors and ends span
  - Test: RealTracerWrapper.shutdown() calls SDK shutdown
  - Test: createRealTracer throws when SDK not installed (mock dynamic import failure)
  - Mock `@opentelemetry/api` and `@opentelemetry/sdk-node` in tests
- **Acceptance:** All tests pass, `npm run typecheck` passes

#### Sub-task 2 of 2: Update initTelemetry to use RealTracerWrapper

- **Scope:** `src/core/telemetry/otel.ts`
- **Input:** `createRealTracer()` from sub-task 1
- **Action:**
  1. Update `initTelemetry()` in `src/core/telemetry/otel.ts`:

     ```typescript
     export async function initTelemetry(config: Readonly<PramanConfig>): Promise<TracerWrapper> {
       // If telemetry is not enabled, return NoOpTracer
       if (config.telemetry?.openTelemetry !== true) {
         return NO_OP_TRACER;
       }

       // Try to initialize real OTel SDK
       try {
         const { createRealTracer } = await import('./real-tracer.js');
         return await createRealTracer({
           exporter: config.telemetry.exporter,
           endpoint: config.telemetry.endpoint,
           serviceName: config.telemetry.serviceName,
         });
       } catch (error) {
         log.warn(
           { error: error instanceof Error ? error.message : String(error) },
           'Failed to initialize OpenTelemetry SDK — falling back to NoOpTracer',
         );
         return NO_OP_TRACER;
       }
     }
     ```

  2. Remove the eslint-disable comment on the unused config parameter
  3. Add `createLogger` import if not already present

- **Tests:** Update `tests/unit/core/telemetry/otel.test.ts`
  - Test: returns NoOpTracer when telemetry disabled
  - Test: returns RealTracerWrapper when telemetry enabled (mock SDK)
  - Test: falls back to NoOpTracer when SDK import fails
- **Acceptance:**
  - `npm run typecheck && npm run test:unit && npm run lint` pass
  - NoOp behavior preserved when telemetry is disabled
  - Real tracing works when telemetry is enabled and SDK is installed

**Inter-dependencies:** None

---

### ACT-041: Config file loading via `import()`

**Priority:** P4 | **Effort:** 3 days | **Sub-tasks:** 2

**Current State:**

- `src/core/config/loader.ts` has `loadConfig()` (async) and `defineConfig()` (sync)
- `loadConfig()` is marked `// eslint-disable-next-line @typescript-eslint/require-await -- async for future file loading via import()`
- Current flow: env vars + inline overrides only
- No file-based config loading (`praman.config.ts` is a planned pattern but not implemented)
- `defineConfig()` returns `PramanConfigInput` unchanged (type helper only)

**Target State:**

- `loadConfig()` discovers and loads `praman.config.ts` / `praman.config.js` / `praman.config.mjs` via dynamic `import()`
- Resolution order: file config ← inline overrides ← env vars (env vars win)
- Config file must `export default defineConfig({ ... })`
- File discovery: search cwd, then parent directories up to project root
- Graceful fallback: if no config file found, use overrides + env vars (current behavior)

**Files to Modify:**

- `/Users/maheshwar/Documents/projects/mk1/src/core/config/loader.ts`

**Files to Create:**

- `/Users/maheshwar/Documents/projects/mk1/src/core/config/file-resolver.ts` (file discovery)
- `/Users/maheshwar/Documents/projects/mk1/tests/unit/core/config/file-resolver.test.ts`

#### Sub-task 1 of 2: Create config file resolver

- **Scope:** `src/core/config/file-resolver.ts`, `tests/unit/core/config/file-resolver.test.ts`
- **Input:** Playwright's config file discovery pattern (similar: `playwright.config.ts` resolution)
- **Action:**
  1. Create `src/core/config/file-resolver.ts`:

     ```typescript
     import path from 'node:path';
     import { stat } from 'node:fs/promises';

     /** Config file names to search for, in priority order. */
     const CONFIG_FILE_NAMES = [
       'praman.config.ts',
       'praman.config.mts',
       'praman.config.js',
       'praman.config.mjs',
     ] as const;

     /**
      * Resolves the path to the nearest Praman config file.
      *
      * @param startDir - Directory to start searching from (defaults to cwd)
      * @returns Absolute path to config file, or undefined if not found
      */
     export async function resolveConfigFile(
       startDir?: string,
     ): Promise<string | undefined> { ... }
     ```

  2. Search algorithm:
     - Start from `startDir` (or `process.cwd()`)
     - Check each `CONFIG_FILE_NAMES` in order
     - If found, return absolute path
     - If not found, move to parent directory
     - Stop at filesystem root or after 10 levels
  3. Use `node:fs/promises` `stat()` to check existence (not `access()` for cross-platform)
  4. Use `node:path.join()` and `node:path.dirname()` for path manipulation

- **Tests:** `tests/unit/core/config/file-resolver.test.ts`
  - Test: finds `praman.config.ts` in current directory
  - Test: finds `praman.config.js` in parent directory
  - Test: returns undefined when no config file exists
  - Test: respects priority order (`.ts` before `.js`)
  - Test: stops at filesystem root
  - Use `node:os.tmpdir()` + real file creation for tests
- **Acceptance:** All tests pass, `npm run typecheck` passes

#### Sub-task 2 of 2: Integrate file loading into loadConfig()

- **Scope:** `src/core/config/loader.ts`
- **Input:** `resolveConfigFile()` from sub-task 1
- **Action:**
  1. Add `configFile` option to `LoadConfigOptions`:
     ```typescript
     export interface LoadConfigOptions {
       /** Inline config overrides (lower priority than env vars). */
       readonly overrides?: PramanConfigInput;
       /** Explicit path to config file. If undefined, auto-discovery is used. */
       readonly configFile?: string;
       /** Disable config file discovery (use only overrides + env vars). */
       readonly noConfigFile?: boolean;
     }
     ```
  2. Update `loadConfig()` flow:

     ```typescript
     export async function loadConfig(
       options?: LoadConfigOptions,
     ): Promise<Readonly<PramanConfig>> {
       // Step 1: Resolve config file
       let fileConfig: PramanConfigInput = {};
       if (options?.noConfigFile !== true) {
         const configPath = options?.configFile ?? (await resolveConfigFile());
         if (configPath !== undefined) {
           fileConfig = await loadConfigFile(configPath);
         }
       }

       // Step 2: Read env overrides
       const envOverrides = readEnvOverrides();

       // Step 3: Merge: file config ← inline overrides ← env overrides
       const merged = {
         ...fileConfig,
         ...(options?.overrides ?? {}),
         ...envOverrides,
       };

       // Step 4: Validate and freeze
       // ... (same as current)
     }
     ```

  3. Add `loadConfigFile()` helper:
     ```typescript
     async function loadConfigFile(filePath: string): Promise<PramanConfigInput> {
       try {
         const module = (await import(filePath)) as { default?: PramanConfigInput };
         if (module.default === undefined) {
           throw new ConfigError({
             message: `Config file ${filePath} must export default`,
             attempted: `Load config from ${filePath}`,
             suggestions: [
               'Use: export default defineConfig({ ... })',
               'Ensure the file has a default export',
             ],
           });
         }
         return module.default;
       } catch (error) {
         if (error instanceof ConfigError) throw error;
         throw new ConfigError({
           message: `Failed to load config file: ${filePath}`,
           attempted: `Dynamic import of ${filePath}`,
           cause: error instanceof Error ? error : undefined,
           suggestions: [
             'Verify the config file exists and is valid TypeScript/JavaScript',
             'Check for syntax errors in the config file',
             'Ensure tsx is available for .ts files',
           ],
         });
       }
     }
     ```
  4. Remove the `@typescript-eslint/require-await` eslint-disable comment (now truly async)

- **Tests:** Update `tests/unit/core/config/loader.test.ts`
  - Test: loads config from file when found
  - Test: inline overrides override file config
  - Test: env vars override both file and inline
  - Test: noConfigFile skips file discovery
  - Test: explicit configFile path is used
  - Test: throws ConfigError for file without default export
  - Test: throws ConfigError for unreadable file
  - Test: graceful fallback when no config file found
- **Acceptance:**
  - `npm run typecheck && npm run test:unit && npm run lint` pass
  - `loadConfig()` is now truly async (no eslint-disable needed)
  - Backwards compatible: no config file = same behavior as before

**Inter-dependencies:** None

---

### ACT-020: Auto-generate OpenAI function-calling schemas from Zod

**Priority:** P2 | **Effort:** 1 week | **Sub-tasks:** 2

**Current State:**

- Zod schemas exist in `src/ai/schemas/`:
  - `capability.schema.ts`: `CapabilityEntrySchema`, `CapabilitiesYamlSchema`
  - `recipe.schema.ts`: `RecipeEntrySchema`, `RecipesYamlSchema`
  - `llm-request.schema.ts`: `ChatMessageSchema`, `ChatRequestSchema`
  - `llm-response.schema.ts`: `LlmCompletionSchema`, `JsonStringSchema`
- `zod-to-json-schema` is already a devDependency (`^3.25.1`)
- No pre-built function-calling schemas for OpenAI Agents SDK
- No `./schemas` sub-path export in `package.json`

**Target State:**

- Script generates OpenAI function-calling JSON schemas from Zod definitions
- Schemas shipped as `./schemas` sub-path export
- JSON schema files are pre-generated and committed (not generated at runtime)
- Consumers can `import { schemas } from 'playwright-praman/schemas'`

**Note (Agent 3):** The new `src/schemas/` directory holds generated OpenAI function-calling JSON schemas. This is distinct from `src/ai/schemas/` which holds Zod source schemas. The naming could confuse implementers. Consider adding a `README` comment in the barrel export clarifying the distinction: `src/ai/schemas/*.schema.ts` = Zod validation schemas (internal), `src/schemas/` = generated JSON Schema for OpenAI Agents SDK (external).

**Files to Create:**

- `/Users/maheshwar/Documents/projects/mk1/src/schemas/index.ts` (barrel export)
- `/Users/maheshwar/Documents/projects/mk1/src/schemas/generated-schemas.ts` (generated JSON schemas)
- `/Users/maheshwar/Documents/projects/mk1/scripts/generate-function-schemas.ts` (generator script)
- `/Users/maheshwar/Documents/projects/mk1/tests/unit/schemas/generated-schemas.test.ts`

**Files to Modify:**

- `/Users/maheshwar/Documents/projects/mk1/package.json` (add `./schemas` export)
- `/Users/maheshwar/Documents/projects/mk1/tsup.config.ts` (add schemas entry point)

#### Sub-task 1 of 2: Create schema generator script

- **Scope:** `scripts/generate-function-schemas.ts`
- **Input:** All Zod schemas from `src/ai/schemas/`, `zod-to-json-schema` library
- **Action:**
  1. Create `scripts/generate-function-schemas.ts`:

     ```typescript
     import { zodToJsonSchema } from 'zod-to-json-schema';
     import { writeFile } from 'node:fs/promises';
     import path from 'node:path';
     import { CapabilityEntrySchema } from '../src/ai/schemas/capability.schema.js';
     import { RecipeEntrySchema } from '../src/ai/schemas/recipe.schema.js';
     import { ChatRequestSchema } from '../src/ai/schemas/llm-request.schema.js';
     // ... etc

     interface FunctionSchema {
       name: string;
       description: string;
       parameters: Record<string, unknown>;
     }

     const schemas: FunctionSchema[] = [
       {
         name: 'discover_capabilities',
         description:
           'Query the Praman capability registry for SAP UI5 test automation capabilities',
         parameters: zodToJsonSchema(CapabilityEntrySchema),
       },
       {
         name: 'create_test_recipe',
         description: 'Create a reusable SAP UI5 test recipe',
         parameters: zodToJsonSchema(RecipeEntrySchema),
       },
       {
         name: 'send_chat',
         description: 'Send a chat message to the Praman AI service',
         parameters: zodToJsonSchema(ChatRequestSchema),
       },
       // ... more schemas
     ];
     ```

  2. Generate to `src/schemas/generated-schemas.ts`:
     ```typescript
     // AUTO-GENERATED by scripts/generate-function-schemas.ts -- DO NOT EDIT
     export const functionSchemas = [ ... ] as const;
     ```
  3. Add npm script: `"generate:schemas": "tsx scripts/generate-function-schemas.ts"`

- **Tests:** N/A (script test covered by sub-task 2 validation tests)
- **Acceptance:** `npm run generate:schemas` produces valid output

#### Sub-task 2 of 2: Create schemas sub-path export and tests

- **Scope:** `src/schemas/index.ts`, `package.json`, `tsup.config.ts`
- **Input:** Generated schemas from sub-task 1
- **Action:**
  1. Create `src/schemas/index.ts`:
     ```typescript
     export { functionSchemas } from './generated-schemas.js';
     export type { FunctionSchema } from './generated-schemas.js';
     ```
  2. Add to `package.json` exports:
     ```json
     "./schemas": {
       "types": {
         "import": "./dist/schemas/index.d.ts",
         "require": "./dist/schemas/index.d.cts"
       },
       "import": "./dist/schemas/index.js",
       "require": "./dist/schemas/index.cjs",
       "default": "./dist/schemas/index.js"
     }
     ```
  3. Add `schemas` entry to tsup config
  4. Run `npm run check:exports` to verify export resolution
- **Tests:** `tests/unit/schemas/generated-schemas.test.ts`
  - Test: each schema has `name`, `description`, `parameters`
  - Test: parameters conform to JSON Schema draft-07
  - Test: all Zod source schemas have corresponding function schemas
  - Test: schema count matches expected number
- **Acceptance:**
  - `npm run check:exports` passes with new `./schemas` export
  - `npm run typecheck && npm run test:unit && npm run lint` pass
  - `import { functionSchemas } from 'playwright-praman/schemas'` works

**Inter-dependencies:** None

---

### ACT-001: Build `praman-mcp-server` package

**Priority:** P1 | **Effort:** 4-6 weeks | **Sub-tasks:** 4

**Current State:**

- No MCP server exists
- `playwright-praman` is a library (imported into test files)
- Architecture documented in `praman-audit-report/MCP-WRAPPER-ROADMAP.md`
- MCP SDK: `@modelcontextprotocol/sdk` (not yet in dependencies)
- Planned: ~12 high-level SAP tools, session manager, auth flow

**Target State:**

- Separate npm package `praman-mcp-server` in a new directory
- Exposes ~12 MCP tools for SAP test automation
- Session-per-connection browser lifecycle management
- Auth integration via SAP login flows
- MCP resources and prompts
- stdio transport (Streamable HTTP in future)

**Package Location:** `/Users/maheshwar/Documents/projects/mk1/packages/praman-mcp-server/` (monorepo structure)

**Note:** This is a large task. Each sub-task is scoped to fit within a single agent context window.

#### Sub-task 0 of 5: Set up npm workspaces (Agent 3 addition)

- **Scope:** Root `package.json`, root directory structure
- **Input:** The project is currently a single-package repo with no `workspaces` field and no `packages/` directory.
- **Action:**
  1. Add `"workspaces": ["packages/*"]` to root `package.json`
  2. Create `packages/` directory
  3. Verify `npm install` still works after adding workspaces field
  4. Verify existing `npm run ci` still passes
- **Tests:** N/A (infrastructure only)
- **Acceptance:** `npm install` succeeds, `npm run ci` passes, `packages/` directory exists
- **Rationale:** Without workspaces, `"playwright-praman": "workspace:*"` in sub-task 1 will fail to resolve.

#### Sub-task 1 of 5: Package scaffold + session manager

- **Scope:** Package setup, session manager, MCP server skeleton
- **Files to Create:**
  ```
  packages/praman-mcp-server/
    package.json
    tsconfig.json
    tsup.config.ts
    src/
      index.ts              (MCP server entry point)
      session-manager.ts    (~150 LOC)
      types.ts              (Session, ToolResult types)
    tests/
      unit/
        session-manager.test.ts
  ```
- **Input:**
  - MCP roadmap: session-per-connection architecture
  - Session interface: `{ browser, context, page, bridgeInjected, storageState, lastActivity }`
  - Session timeout: 5 minutes inactivity
- **Action:**
  1. Create `package.json`:
     ```json
     {
       "name": "praman-mcp-server",
       "version": "0.1.0",
       "type": "module",
       "dependencies": {
         "@modelcontextprotocol/sdk": "latest",
         "playwright-praman": "workspace:*",
         "@playwright/test": ">=1.57.0"
       }
     }
     ```
  2. Implement `SessionManager`:
     ```typescript
     export class SessionManager {
       private readonly sessions = new Map<string, Session>();
       async createSession(connectionId: string): Promise<Session> { ... }
       async getSession(connectionId: string): Promise<Session> { ... }
       async closeSession(connectionId: string): Promise<void> { ... }
       async closeAllSessions(): Promise<void> { ... }
       private startInactivityTimer(): void { ... }
     }
     ```
  3. Implement MCP server skeleton using `@modelcontextprotocol/sdk`:

     ```typescript
     import { Server } from '@modelcontextprotocol/sdk/server/index.js';
     import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';

     const server = new Server({ name: 'praman-mcp-server', version: '0.1.0' });
     // Register tool handlers (empty stubs)
     ```

     **Note (Agent 3 fix):** Pin `@modelcontextprotocol/sdk` to a specific version (not `"latest"`). Verify import paths against the pinned version -- the SDK's export structure may change between versions.

- **Tests:** `tests/unit/session-manager.test.ts`
  - Test: createSession creates browser context
  - Test: getSession returns existing session
  - Test: closeSession cleans up browser
  - Test: inactivity timeout closes session
  - Mock Playwright `chromium.launch()` for unit tests
- **Acceptance:** Package compiles, session manager tests pass

#### Sub-task 2 of 5: Core tool implementations (12 tools)

- **Scope:** All 12 MCP tool handlers
- **Files to Create:**
  ```
  packages/praman-mcp-server/src/
    tools/
      authenticate.ts
      navigate-to-app.ts
      navigate-home.ts
      discover-controls.ts
      click-button.ts
      fill-input.ts
      read-table.ts
      wait-for-ui5.ts
      odata-query.ts
      take-screenshot.ts
      get-page-info.ts
      close-session.ts
      index.ts              (tool registry)
    tests/unit/tools/
      authenticate.test.ts
      navigate-to-app.test.ts
      fill-input.test.ts
      read-table.test.ts
      (one test per tool)
  ```
- **Input:** Tool schemas from MCP roadmap (Section 3), Praman fixture APIs
- **Action:** Each tool follows the pattern:

  ```typescript
  import type { Session } from '../types.js';

  export const fillInputTool = {
    name: 'fill_input',
    description: 'Fill a SAP UI5 input field by its label and fire the change event.',
    inputSchema: {
      type: 'object',
      properties: {
        label: { type: 'string', description: 'Visible label text for the input field' },
        value: { type: 'string', description: 'Value to enter' },
      },
      required: ['label', 'value'],
    },
    async handler(session: Session, args: { label: string; value: string }): Promise<ToolResult> {
      // Use Praman fixtures: find control by label, setValue, fireChange, waitForUI5
      const ui5 = session.ui5Handler;
      const control = await ui5.control({ controlType: 'sap.m.Input', properties: { ... } });
      await control.setValue(args.value);
      await control.fireChange();
      return { success: true, message: `Filled "${args.label}" with "${args.value}"` };
    },
  };
  ```

- **Tests:** Unit tests with mocked Session/Page
- **Acceptance:** All 12 tools compile and have unit tests

#### Sub-task 3 of 5: Auth integration + MCP resources + prompts

- **Scope:** SAP authentication flow, MCP resources, MCP prompts
- **Files to Create:**
  ```
  packages/praman-mcp-server/src/
    auth/
      sap-auth.ts           (SAP login flow)
    resources/
      capabilities.ts       (praman://capabilities)
      controls.ts           (praman://controls)
      error-codes.ts        (praman://error-codes)
    prompts/
      sap-test-scenario.ts
      order-to-cash.ts
      procure-to-pay.ts
  ```
- **Input:** Auth flow from MCP roadmap (Section 5), Praman auth strategies
- **Action:**
  1. `authenticate` tool delegates to Praman's `authHandler`:
     - Navigate to SAP login page
     - Fill credentials (Playwright native -- login pages are HTML, not UI5)
     - Wait for FLP redirect
     - Save storageState to session
  2. Resources return static JSON from Praman's capability registry
  3. Prompts return pre-built test scenario templates
- **Tests:** Unit tests with mocked auth flows
- **Acceptance:** Auth flow works with mock login page, resources return valid JSON

#### Sub-task 4 of 5: Integration tests + documentation

- **Scope:** E2E tests, README, tool reference
- **Files to Create:**
  ```
  packages/praman-mcp-server/
    README.md
    tests/
      integration/
        mcp-protocol.test.ts    (verify tool schemas, request/response)
        session-lifecycle.test.ts
  ```
- **Input:** MCP protocol spec, completed tool implementations
- **Action:**
  1. Protocol tests: verify each tool's schema conforms to MCP spec
  2. Session lifecycle tests: create → use → close flow
  3. README with installation, usage, tool reference table
- **Tests:** Integration tests against mock SAP HTML pages
- **Acceptance:**
  - All integration tests pass
  - `npm run build` produces valid package
  - Tool reference in README covers all 12 tools

**Inter-dependencies:** Sub-task 1 depends on sub-task 0 (workspace setup). Sub-task 2 depends on sub-task 1 (session manager). Sub-task 3 depends on sub-task 2 (tools). Sub-task 4 depends on sub-task 3 (complete implementation).

---

## Summary Table

| ACT     | Title                                                            | Sub-tasks | Batch | Agent Time |
| ------- | ---------------------------------------------------------------- | --------- | ----- | ---------- |
| ACT-022 | Remove dead exports `MAX_CONTEXT_CHARS` + `MAX_CONTEXT_CONTROLS` | 1         | 1     | 15 min     |
| ACT-021 | Replace type assertions with runtime guards                      | 3         | 1     | 4 hrs      |
| ACT-041 | Config file loading via `import()`                               | 2         | 1     | 3 days     |
| ACT-040 | OpenTelemetry real SDK initialization                            | 2         | 1     | 1 week     |
| ACT-034 | LLM retry logic with exponential backoff                         | 2         | 1     | 2 days     |
| ACT-033 | Persistent AgenticCheckpoint storage                             | 2         | 1     | 1 week     |
| ACT-039 | Dynamic token budget management                                  | 2         | 1     | 1 week     |
| ACT-020 | Auto-generate OpenAI function-calling schemas                    | 2         | 1     | 1 week     |
| ACT-035 | Streaming support for LLM calls                                  | 2         | 1     | 3 days     |
| ACT-001 | Build `praman-mcp-server` package                                | 5         | 1-4   | 4-6 weeks  |

**Total sub-tasks:** 24 (was 22; added ACT-001 sub-task 0, expanded ACT-022 scope)
**Maximum parallel agents (Batch 1):** 11 (was 9; ACT-035 moved from Batch 2)
**Critical path:** ACT-001 (4-6 weeks, 5 sequential sub-tasks including workspace setup)
**Quick wins (Batch 1, < 1 day):** ACT-022 (15 min), ACT-001 sub-task 0 (30 min)

---

## Missing Items (Agent 3 additions)

Items not covered by Agent 2 that implementers should be aware of:

### M1: API Extractor configuration

New exports need API Extractor entry point updates:

- ACT-020: `./schemas` sub-path export
- ACT-033: `CheckpointStore`, `MemoryCheckpointStore`, `FileCheckpointStore` from `./ai`
- ACT-034: `LlmRetryConfig`, `isTransientLlmError`, `withLlmRetry` (if exported from `./ai`)
- ACT-035: `StreamChunk`, `StreamOptions` from `./ai`
- ACT-039: `TokenBudget`, `createTokenBudget`, `estimateTokens` from `./ai`

Check `api-extractor.json` and `config/api-extractor/` for entry point configuration.

### M2: ESLint coverage for generated files

ACT-020 generates `src/schemas/generated-schemas.ts`. Add to:

- `.eslintignore` or `eslint.config` ignores (sonarjs complexity rules will flag generated code)
- Or add `/* eslint-disable */` header to the generated file template

### M3: Vitest coverage thresholds for new directories

New files need coverage threshold consideration in `vitest.config.ts`:

- `src/ai/llm-retry.ts` -- falls under Tier 3 global (90%), may want Tier 2 (95%) as core AI infra
- `src/ai/checkpoint-store.ts` -- same consideration
- `src/ai/token-budget.ts` -- same consideration
- `src/schemas/generated-schemas.ts` -- should be excluded from coverage (auto-generated, no logic)
- `src/core/telemetry/real-tracer.ts` -- should fall under existing `src/core/telemetry/**` Tier 2 threshold

### M4: CHANGELOG entries

Each task should include a CHANGELOG.md entry:

- ACT-033: BREAKING CHANGE (`saveCheckpoint` and `resumeFromCheckpoint` sync to async)
- ACT-034: feat: LLM retry with exponential backoff
- ACT-035: feat: streaming support for LLM calls
- ACT-039: feat: dynamic token budget management
- ACT-040: feat: OpenTelemetry real SDK initialization
- ACT-041: feat: config file loading via dynamic import
- ACT-020: feat: OpenAI function-calling JSON schema generation
- ACT-022: fix: remove dead exports from public API surface

### M5: tsconfig.json path alias for new schemas directory

If `src/schemas/` becomes a new top-level module, consider adding `#schemas/*` path alias to `tsconfig.json` for consistency with `#core/*`, `#bridge/*`, `#proxy/*`, `#ai/*`. Alternatively, since `src/schemas/` only has generated output and a barrel, a path alias may be unnecessary.

---

_Generated by Agent 2: Implementation Spec Writer on 2026-02-27._
_Reviewed and corrected by Agent 3: Plan Reviewer & Fixer on 2026-02-27._
