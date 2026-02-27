# Agent 3: Plan Review Findings

**Reviewed:** 2026-02-27
**Source:** AGENT2-IMPLEMENTATION-SPECS.md (10 code implementation actions, 22 sub-tasks)
**Method:** Source file verification against each spec

---

## Overall Assessment

Agent 2's implementation specs are **generally solid** — the current state analysis, file references, and sub-task scoping are largely correct. However, I found **12 issues** ranging from minor inaccuracies to missing dependencies that could cause implementation failures if not addressed.

**Severity breakdown:**

- Critical (would block implementation): 3
- Moderate (would cause rework): 5
- Minor (cosmetic or optimization): 4

---

## Finding 1: ACT-022 — `MAX_CONTEXT_CONTROLS` has same export issue (MINOR)

**Agent 2's claim:** Only `MAX_CONTEXT_CHARS` is a dead export.

**Reality:** Both `MAX_CONTEXT_CHARS` (line 28) AND `MAX_CONTEXT_CONTROLS` (line 31) are exported from `agentic-prompts.ts` but never imported by any source file in `src/`. Both are only used internally within `agentic-prompts.ts` itself. The test file imports `MAX_CONTEXT_CONTROLS` (not `MAX_CONTEXT_CHARS`).

**Impact:** Minor scope miss. The fix should also address `MAX_CONTEXT_CONTROLS` for consistency. However, since `MAX_CONTEXT_CONTROLS` IS imported by the test file, removing its export requires updating the test to inline the value `200`.

**Fix applied:** Updated ACT-022 to cover both constants. Updated test file reference to note that tests import `MAX_CONTEXT_CONTROLS`, not `MAX_CONTEXT_CHARS`.

---

## Finding 2: ACT-022 — Test file import mismatch (MODERATE)

**Agent 2's claim:** "Check if the test file imports `MAX_CONTEXT_CHARS` directly."

**Reality:** The test file (`tests/unit/ai/agentic-prompts.test.ts`) imports `MAX_CONTEXT_CONTROLS`, NOT `MAX_CONTEXT_CHARS`. Line 31:

```typescript
import { buildSystemPrompt, buildUserPrompt, MAX_CONTEXT_CONTROLS } from '#ai/agentic-prompts.js';
```

The test for `MAX_CONTEXT_CHARS` behavior (line 219) tests the truncation behavior indirectly without importing the constant — it checks for `'... (truncated)'` in the output.

**Impact:** An implementer following Agent 2's instructions would look for a `MAX_CONTEXT_CHARS` import that doesn't exist, then miss the actual `MAX_CONTEXT_CONTROLS` import that DOES exist.

**Fix applied:** Corrected the test file reference.

---

## Finding 3: ACT-021 — Invalid error code `ERR_CONTROL_PROPERTY_TYPE` (CRITICAL)

**Agent 2's claim:** Use `code: 'ERR_CONTROL_PROPERTY_TYPE'` for type guard failures in `ui5-handler.ts`.

**Reality:** This error code does NOT exist in `src/core/errors/codes.ts`. The `ControlErrorOptions` type restricts `code` to:

- `ERR_CONTROL_NOT_FOUND`, `ERR_CONTROL_NOT_VISIBLE`, `ERR_CONTROL_NOT_ENABLED`
- `ERR_CONTROL_NOT_INTERACTABLE`, `ERR_CONTROL_NOT_UI5`
- `ERR_CONTROL_PROPERTY`, `ERR_CONTROL_AGGREGATION`, `ERR_CONTROL_METHOD`
- `ERR_CONTROL_INTERACTION_FAILED`

TypeScript strict mode would reject `'ERR_CONTROL_PROPERTY_TYPE'` as it's not in the union.

**Impact:** Implementation would fail at typecheck. The correct code is `ERR_CONTROL_PROPERTY` (which exists) or a new code must be added to both `codes.ts` AND `ControlErrorOptions`.

**Fix applied:** Changed to `ERR_CONTROL_PROPERTY`.

---

## Finding 4: ACT-034 — Retry dependency claim is weaker than stated (MODERATE)

**Agent 2's claim:** ACT-035 (streaming) depends on ACT-034 (retry) because streaming needs "retry on connection failure, but do NOT retry mid-stream."

**Reality:** The existing `retry()` utility in `src/core/utils/retry.ts` is already fully implemented with exponential backoff + jitter, `shouldRetry` filter, and `AbortSignal` support. ACT-034 creates an LLM-specific wrapper (`withLlmRetry`) on top of this.

ACT-035's streaming retry needs are fundamentally different from ACT-034's request-response retry:

- Streaming retry = retry the initial connection, not retry after partial stream
- This can use the existing `retry()` utility directly with a `shouldRetry` filter
- The `withLlmRetry` wrapper from ACT-034 is designed for request-response calls

**Impact:** ACT-035 does NOT strictly depend on ACT-034. It can use the existing `retry()` utility directly. However, for consistency, using the same `isTransientLlmError()` function from ACT-034 is beneficial.

**Fix applied:** Changed dependency from "hard dependency on ACT-034" to "soft dependency — can share `isTransientLlmError()` but does not require `withLlmRetry()`". Moved ACT-035 to Batch 1 with a note that it should import `isTransientLlmError` if ACT-034 is complete, or inline the check if not.

---

## Finding 5: ACT-040 — Wrong error class (AIError for telemetry) (MODERATE)

**Agent 2's claim:** Sub-task 1 doc comment says `@throws AIError if SDK packages are missing`.

**Reality:** `AIError` is for AI provider failures. Telemetry initialization is a core infrastructure concern. There is no `TelemetryError` class in the codebase.

However, the actual implementation in sub-task 2 uses try/catch with `log.warn` and falls back to NoOpTracer — which means the error is never thrown to callers. Sub-task 1's `createRealTracer()` does throw internally, but it's caught in sub-task 2's `initTelemetry()`.

**Impact:** The TSDoc `@throws` is misleading. The thrown error should be either `PramanError` directly (with a new `ERR_TELEMETRY_INIT_FAILED` code) or a catch-all approach.

**Fix applied:** Changed `@throws AIError` to `@throws PramanError` and noted that a new error code `ERR_TELEMETRY_INIT_FAILED` should be added to `codes.ts`.

---

## Finding 6: ACT-040 — Missing `createLogger` import noted correctly (MINOR)

**Agent 2's claim:** "Add `createLogger` import if not already present" in sub-task 2.

**Reality verified:** Correct. `src/core/telemetry/otel.ts` does NOT import `createLogger`. The import will need to be added.

**No fix needed.**

---

## Finding 7: ACT-040 — Missing optional dependency packages (MODERATE)

**Agent 2's claim:** Sub-task 1 references `@opentelemetry/exporter-trace-otlp-http` and `@azure/monitor-opentelemetry-exporter`.

**Reality:** Neither package is in `package.json` `optionalDependencies`. Only `@opentelemetry/api` and `@opentelemetry/sdk-node` are listed. The spec mentions adding them but doesn't explicitly call out that `package.json` needs updating.

**Impact:** Without adding these to `optionalDependencies`, the `tsup` build's `external` array won't include them, and they'll fail dynamic import resolution at runtime without clear guidance.

**Fix applied:** Added explicit package.json modification step to ACT-040 sub-task 1.

---

## Finding 8: ACT-001 — No workspaces configuration (CRITICAL)

**Agent 2's claim:** MCP server at `packages/praman-mcp-server/` with `"playwright-praman": "workspace:*"`.

**Reality:**

- The `packages/` directory does not exist.
- `package.json` has no `workspaces` field.
- The project is NOT a monorepo — it's a single package.

Using `workspace:*` requires npm workspaces, yarn workspaces, or pnpm workspaces configuration. Without this, `npm install` in the MCP server package will fail to resolve `playwright-praman`.

**Impact:** ACT-001 sub-task 1 would fail immediately. The spec needs either:

1. A prerequisite step to set up npm workspaces (add `"workspaces": ["packages/*"]` to root `package.json`)
2. OR use a different approach (published package reference, local path `file:../..`)

**Fix applied:** Added prerequisite "Sub-task 0" to set up workspace configuration before package scaffold.

---

## Finding 9: ACT-001 — MCP SDK version and import paths (MODERATE)

**Agent 2's claim:** Uses `@modelcontextprotocol/sdk` with import paths like `@modelcontextprotocol/sdk/server/index.js`.

**Reality:** The MCP SDK import paths may vary by version. The spec uses `"latest"` for the SDK version, which is risky for a production package. It should be pinned to a specific version.

**Fix applied:** Added note to pin MCP SDK version and verify import paths against installed version.

---

## Finding 10: ACT-033 — `saveCheckpoint()` sync-to-async breaking change (MODERATE)

**Agent 2's claim:** "Breaking change note: `saveCheckpoint()` changes from sync to async. This is acceptable since the current consumers await the result pattern."

**Reality:** `saveCheckpoint()` is currently synchronous (`void` return type, line 428 of `agentic-handler.ts`). Changing it to async means:

- All callers must now `await` it
- The return type changes from `void` to `Promise<void>`

The claim "current consumers await the result pattern" is misleading — there are no external consumers (the method is only used in tests). But it IS a public API change that would break downstream code if anyone is calling it without `await`.

**Fix applied:** Added explicit note about the semver implications and that this should be documented as a breaking change in CHANGELOG.

---

## Finding 11: ACT-020 — Schema placement conflict (MINOR)

**Agent 2's claim:** Create `src/schemas/index.ts` and `src/schemas/generated-schemas.ts`.

**Reality:** Zod schemas already live in `src/ai/schemas/`. Creating a new top-level `src/schemas/` directory creates a confusing parallel structure. The generated JSON schemas are derived FROM the Zod schemas in `src/ai/schemas/`.

Consider placing generated schemas in `src/ai/schemas/generated/` or keeping `src/schemas/` clearly labeled as "OpenAI function-calling JSON schemas" vs the Zod schemas in `src/ai/schemas/`.

**Fix applied:** Added clarity note about the distinction between Zod source schemas and generated JSON schemas.

---

## Finding 12: Parallel batching — ACT-035 can move to Batch 1 (MINOR optimization)

**Agent 2's claim:** ACT-035 is in Batch 2 because it depends on ACT-034.

**Reality:** Per Finding 4, the dependency is soft. ACT-035 streaming can use the existing `retry()` utility from `src/core/utils/retry.ts`. The `isTransientLlmError()` helper is nice-to-have but can be inlined.

**Fix applied:** Moved ACT-035 to Batch 1 with soft dependency note. This reduces the critical path.

---

## Missing Items Not Covered by Agent 2

### M1: API Extractor configuration

New exports (ACT-020 `./schemas`, ACT-033 `CheckpointStore` from `./ai`) need to be included in API Extractor's entry points. The `api-extractor.json` configuration may need updates.

### M2: ESLint coverage exclusions for generated files

ACT-020 generates `src/schemas/generated-schemas.ts`. This file should be excluded from ESLint rules about code complexity (sonarjs) since it's auto-generated. An `.eslintignore` entry or inline comment is needed.

### M3: Vitest coverage threshold for new directories

New directories (`src/schemas/`, `src/ai/checkpoint-store.ts`, `src/ai/llm-retry.ts`, `src/ai/llm-streaming.ts`, `src/ai/token-budget.ts`) need coverage threshold entries in `vitest.config.ts` or they'll fall under the Tier 3 global threshold (90%), which may be insufficient for core AI infrastructure.

### M4: CHANGELOG entries

None of the specs mention CHANGELOG updates. For semver compliance, at minimum:

- ACT-033 (breaking: `saveCheckpoint` async) needs a BREAKING CHANGE entry
- ACT-034, ACT-035, ACT-039, ACT-040, ACT-041 need FEATURE entries
- ACT-020 needs a FEATURE entry

### M5: `tsconfig.json` path aliases for new directories

If `src/schemas/` becomes a new top-level directory, path aliases (`#schemas/*`) may need to be added to `tsconfig.json` for consistency with `#core/*`, `#bridge/*`, `#proxy/*`, `#ai/*` patterns (currently `#ai/schemas/*` already covers the Zod schemas, but the new `src/schemas/` would be different).

---

## Verification Summary

| ACT     | Current State Accurate?              | Dependencies Correct?       | Sub-tasks Scoped? | Types Correct?              | Tests Realistic?       |
| ------- | ------------------------------------ | --------------------------- | ----------------- | --------------------------- | ---------------------- |
| ACT-022 | Mostly (missed MAX_CONTEXT_CONTROLS) | Yes                         | Yes               | Yes                         | Yes (minor fix needed) |
| ACT-021 | Yes                                  | Yes                         | Yes               | **No** (invalid error code) | Yes                    |
| ACT-034 | Yes                                  | Yes                         | Yes               | Yes                         | Yes                    |
| ACT-035 | Yes                                  | **Soft, not hard**          | Yes               | Yes                         | Yes                    |
| ACT-033 | Yes                                  | Yes                         | Yes               | Yes                         | Yes                    |
| ACT-039 | Yes                                  | Yes                         | Yes               | Yes                         | Yes                    |
| ACT-040 | Yes                                  | Yes                         | Yes               | **No** (wrong error class)  | Yes                    |
| ACT-041 | Yes                                  | Yes                         | Yes               | Yes                         | Yes                    |
| ACT-020 | Yes                                  | Yes                         | Yes               | Yes                         | Yes                    |
| ACT-001 | Mostly                               | **Missing workspace setup** | Tight but OK      | Yes                         | Yes                    |

---

_Reviewed by Agent 3: Plan Reviewer & Fixer on 2026-02-27._
