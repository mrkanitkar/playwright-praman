# Architectural Review: playwright-cli-plan2.md

**Reviewer Role:** Independent Architect
**Review Date:** April 2, 2026
**Plan Version:** 2.0 (single-CLI model)
**Status:** CRITICAL ISSUES FOUND

---

## Executive Summary

The plan proposes a sound architecture for integrating Praman with Playwright CLI, but **6 issues** block feasibility. The most critical are:

1. **Shell escaping with `$(cat ...)` is unsafe** — breaks with quotes, backticks, special chars
2. **`dist/scripts/` directory doesn't exist** — requires new build infrastructure
3. **`playwright-cli eval` syntax is unvalidated** — plan assumes bare expressions work
4. **Build output format for scripts is undefined** — unclear if IIFE or ESM
5. **Parameterized scripts have no mechanism** — env vars don't work in `run-code` scope
6. **Snapshot command may become redundant** — unclear relationship between pre-built scripts and existing snapshot

---

## ISSUES

### ISSUE #1: Shell Escaping with `$(cat ...)` — CRITICAL

**Severity:** CRITICAL
**Affected Sections:** Plan 3.1, 3.2, 5.1 (all examples using `$(cat ...)`)

**Problem:**
The plan shows scripts being used via:
```bash
playwright-cli -s=sap run-code "$(cat node_modules/playwright-praman/dist/scripts/discover-all.js)"
```

But if the script content contains:
- Double quotes: `const x = "foo";`
- Backticks: `` const x = `template`; ``
- Dollar signs: `const x = $amount;`
- Unescaped newlines in strings

The shell substitution **breaks the argument parsing**. The script is injected raw into a shell double-quoted string, which means:
- `"` needs escaping
- Backticks trigger command substitution
- `$var` triggers variable substitution
- `\` characters are interpreted

**Evidence:**
Example from plan section 3.1 — a 25-line `run-code` script with function definition would contain unescaped quotes and nested strings. When passed via `$(cat ...)` inside double quotes, the shell will mangle it.

**Current Working Pattern (snapshot-command.ts):**
Line 122 in `snapshot-command.ts` does: `const escapedScript = script.replaceAll('"', '\\"');`

This works because the script is **already a string in Node.js** — it was built at compile time, not read from disk at runtime. But `$(cat file.js)` reads at runtime and passes through shell parsing **before** reaching `run-code`.

**Recommendation:**
1. **Option A (Recommended):** Use stdin instead of shell substitution:
   ```bash
   cat node_modules/playwright-praman/dist/scripts/discover-all.js | \
     playwright-cli -s=sap run-code --stdin
   ```
   (Requires `playwright-cli run-code` to support `--stdin` — check if available)

2. **Option B:** Use Node.js to read and escape properly:
   ```bash
   node -e "const fs = require('fs'); const s = fs.readFileSync(...); const e = s.replaceAll('\"', '\\\\\"'); console.log('playwright-cli run-code \"' + e + '\"');" | bash
   ```
   (Ugly, defeats the purpose)

3. **Option C:** Abandon pre-built scripts for parameterized operations; keep only parameter-free ones (discover-all, bridge-status, wait-for-ui5). Use inline composition for parameterized (inspect-control, discover-by-type).

4. **Option D:** Ship pre-built scripts as Node.js modules, not raw `.js` text:
   ```typescript
   // dist/scripts/discover-all.ts (exported as module)
   export const discoverAll = async (page) => { ... };
   ```
   Then agents import and use programmatically (defeats single-CLI goal).

---

### ISSUE #2: `dist/scripts/` Directory Doesn't Exist — HIGH

**Severity:** HIGH
**Affected Sections:** Plan 4 (Implementation), build integration

**Problem:**
The plan proposes adding entry points for pre-built scripts in `tsup.config.ts`:
```
'scripts/discover-all': 'src/scripts/discover-all.ts'
'scripts/discover-by-type': 'src/scripts/discover-by-type.ts'
...
```

But:
1. **No `src/scripts/` directory exists** — confirmed by filesystem search
2. **No script files are defined** — only architecture in the plan
3. **tsup.config.ts has no scripts entry** — only `index`, `ai/index`, `intents/index`, etc.
4. **`dist/scripts/` is not built** — confirmed by `ls dist/` showing only `browser/`, `cli/`, `ai/`, etc.
5. **`package.json` `files` field doesn't include `dist/scripts`** — line 16-38 lists `dist`, `skills/`, `agents/`, but no explicit `dist/scripts`

**Evidence:**
- `tsup.config.ts` lines 7-14: entry points shown, no `scripts/*` keys
- `package.json` lines 16-38: `files` array includes `"dist"` (which should include all subdirs), but no explicit `dist/scripts` entry
- Filesystem: `ls dist/` shows no `scripts/` subdirectory

**Current Related Pattern:**
Browser scripts are built differently. `scripts/build-browser-bundles.ts` (a custom esbuild script) creates `dist/browser/praman-bridge-init.js` and `dist/browser/ui5-engine.js`. These are:
- Built by a separate script (NOT tsup)
- Output to `dist/browser/` (NOT `dist/scripts/`)
- Minified IIFEs (self-executing, not modules)

**Recommendation:**
1. Create `src/scripts/` directory with `.ts` source files
2. **Option A:** Extend `scripts/build-browser-bundles.ts` to also build scripts:
   ```typescript
   // New section in build-browser-bundles.ts
   await esbuild.build({
     entryPoints: {
       'discover-all': resolve(rootDir, 'src/scripts/discover-all.ts'),
       'discover-by-type': resolve(rootDir, 'src/scripts/discover-by-type.ts'),
       // ... etc
     },
     outdir: resolve(outDir, '../scripts'),
     format: 'esm', // or 'iife'
     ...
   });
   ```

3. **Option B:** Add new tsup entry points:
   ```typescript
   // tsup.config.ts
   entry: {
     index: 'src/index.ts',
     'scripts/discover-all': 'src/scripts/discover-all.ts',
     'scripts/discover-by-type': 'src/scripts/discover-by-type.ts',
     // ...
   }
   ```
   Then update `package.json` to include `"dist/scripts/"` in `files` array.

4. **Document output format decision** — the scripts should be:
   - Plain text (no `export` / `module.exports`)
   - Readable as-is with `cat`
   - Compatible with `run-code` which expects `async page => { ... }`

---

### ISSUE #3: `playwright-cli eval` Syntax Unvalidated — MEDIUM

**Severity:** MEDIUM
**Affected Sections:** Plan 1.1, 5.1 (examples showing `eval "window.__praman_bridge?.ready"`)

**Problem:**
The plan shows:
```bash
playwright-cli -s=sap eval "window.__praman_bridge?.ready"
```

But `playwright-cli eval` syntax is:
```
eval <func> [ref]
```

Where `<func>` is expected to be a function, not a bare expression. The examples in the plan use **bare JavaScript expressions**, not function definitions.

**Evidence:**
Plan section 1.1, line 49:
```bash
playwright-cli -s=sap eval "window.__praman_bridge?.ready"
```

And section 5, line 579:
```bash
playwright-cli -s=sap eval "window.__praman_bridge?.ready"
# → true
```

These are expressions, not async functions. Unclear if Playwright CLI's `eval` command wraps them in a function or expects them as-is.

**Current Usage in SKILL.md:**
Lines 23-34 show the pattern being taught, but don't clarify whether it should be:
```bash
# Option 1: Bare expression
eval "window.__praman_bridge?.ready"

# Option 2: Function wrapper
eval "async () => window.__praman_bridge?.ready"

# Option 3: With page parameter
eval "async (page) => window.__praman_bridge?.ready"
```

**Recommendation:**
1. **Validate with actual Playwright CLI** — test both patterns:
   ```bash
   npx playwright-cli eval "window.__praman_bridge?.ready"
   npx playwright-cli eval "async () => window.__praman_bridge?.ready"
   ```
2. **Update plan examples** to show the ACTUAL working syntax
3. **Update SKILL.md** to match verified syntax
4. **If expressions don't work** — change plan to use `run-code` instead (which accepts functions)

---

### ISSUE #4: Build Output Format for Scripts Undefined — MEDIUM

**Severity:** MEDIUM
**Affected Sections:** Plan 3.1 (script format), plan 4 (build config)

**Problem:**
The plan says scripts should be:
> "plain text (not modules — no `export`, no `import`)" (plan 3.1, line 293)

But doesn't specify HOW tsup/esbuild should output them. Should they be:

**Option A: IIFE (Immediately Invoked Function Expression)**
```javascript
(async function(page) { return ... })()
```
Self-executing, runs immediately when loaded. Problem: `playwright-cli run-code` expects a function, not a call.

**Option B: Named Function**
```javascript
async function script(page) { return ... }
```
Not a valid module, not IIFE. Problem: How does `run-code` access the function?

**Option C: Raw Function Body (no wrapper)**
```javascript
return await page.evaluate(() => { ... })
```
Incomplete code. Problem: Not valid JavaScript by itself.

**Option D: ESM Export (contradicts "no export")**
```javascript
export const discover = async (page) => { ... }
```
Valid module. Problem: Plan says "no exports".

**Evidence:**
Plan section 3.1, line 293 says "plain text", but `src/scripts/discover-all.ts` doesn't exist yet, so no concrete output format is defined.

Current `praman-bridge-init.ts` is built as **IIFE** (`format: 'iife'` in `build-browser-bundles.ts`, line 57). When used, it's injected via:
```typescript
// src/cli/program.ts, line 299
const script = createBridgeInjectionScript();
```

This returns the IIFE **as a string**, which is then passed to `page.evaluate(script)`.

But for `run-code` pattern, we need something that evaluates to a function:
```bash
playwright-cli run-code "async page => { ... }"
```

So the script file content should be the **function body**, not an IIFE.

**Recommendation:**
1. **Define output format explicitly:**
   - Output: Plain text file containing `async page => { ... }`
   - NO `export`, NO IIFE, NO module syntax
   - When used via `$(cat ...)`, the content IS the `run-code` argument

2. **Example tsup config:**
   ```typescript
   // tsup.config.ts
   entry: {
     'scripts/discover-all': 'src/scripts/discover-all.ts',
   },
   format: 'esm', // or 'cjs'
   splitting: false,
   outExtension: () => ({ js: '.js', dts: '.d.ts' }),
   // Custom post-processing to strip module wrapper?
   ```

3. **Alternative: Custom esbuild step** (like browser bundles):
   ```typescript
   // scripts/build-scripts.ts (new)
   await esbuild.build({
     entryPoints: { 'discover-all': '...' },
     outdir: 'dist/scripts',
     format: 'esm',
     platform: 'neutral',
     banner: { js: '' }, // Remove any banner
     // Post-process: remove 'export const' wrapper
   });
   ```

4. **Document in SKILL.md** exactly what format scripts have

---

### ISSUE #5: Parameterized Scripts Lack Mechanism — HIGH

**Severity:** HIGH
**Affected Sections:** Plan 3.2 (parameterization strategies)

**Problem:**
The plan proposes two approaches for parameterized scripts (line 305-327):

**Approach A: Inline composition (agent writes code)**
```bash
playwright-cli -s=sap run-code "async page => {
  return await page.evaluate((id) => { ... }, 'CONTROL_ID');
}"
```
✅ Works. Agent must compose the template and substitute `CONTROL_ID`.

**Approach B: Pre-built scripts + env vars**
```bash
PRAMAN_CONTROL_ID=id123 \
  playwright-cli -s=sap run-code "$(cat dist/scripts/inspect-control.js)"
```
❌ **Doesn't work.** The plan admits this (line 327): "run-code only exposes `page`, not `process.env`".

The plan then says:
> "Approach A is the primary mechanism. Pre-built scripts are best for parameter-free operations." (line 327-328)

But then section 3.2 still lists pre-built scripts that need parameters:
- `discover-by-type.js` — needs `type` parameter
- `inspect-control.js` — needs `control ID` parameter
- Dialog handling might need selectors

**Evidence:**
- Plan 3.1, line 174: `discover-by-type.js` implies filtering by type
- Plan 3.1, line 175: `inspect-control.js` implies single control
- Plan 3.2, line 321-327: Explicitly states env vars don't work in `run-code` scope

**Contradiction:**
The plan lists 6 pre-built scripts (3.1, line 172-178), but then says only parameter-free ones should be pre-built. If we remove parameterized ones:
- ✅ `discover-all.js` — no params
- ❌ `discover-by-type.js` — needs `type` param → remove
- ❌ `inspect-control.js` — needs `id` param → remove
- ✅ `wait-for-ui5.js` — no params
- ✅ `bridge-status.js` — no params
- ⚠️ `dialog-controls.js` — unclear if it needs params

That leaves **3-4 useful pre-built scripts**, which is less impressive.

**Recommendation:**
1. **Scope pre-built scripts to parameter-free operations only:**
   - `discover-all.js`
   - `bridge-status.js`
   - `wait-for-ui5.js`
   - Remove `discover-by-type.js`, `inspect-control.js` from pre-built list

2. **Document inline patterns for parameterized operations** in SKILL.md:
   - Inspect control by ID (inline template with placeholder)
   - Discover by type (inline template with placeholder)
   - These are 1-2 LOC diffs from the pre-built examples

3. **Update implementation plan (Section 4):**
   - S1-T1: Only create 3 pre-built scripts (discover-all, wait-for-ui5, bridge-status)
   - S1-T3: Add "Parameterized Patterns" section showing inline templates

4. **Alternatively:** Support **pre-built scripts with client-side substitution** (not env vars):
   ```bash
   # Agent reads the script file, substitutes placeholders, then runs it
   CONTROL_ID="myId" node -e "
     const script = require('fs').readFileSync('dist/scripts/inspect-control.js', 'utf8');
     const filled = script.replace('CONTROL_ID', process.env.CONTROL_ID);
     console.log('playwright-cli run-code \"' + filled + '\"');
   " | bash
   ```
   (Ugly, defeats single-CLI goal)

---

### ISSUE #6: Snapshot Command May Become Redundant — MEDIUM

**Severity:** MEDIUM
**Affected Sections:** Plan 0-3 (architecture), comparison to snapshot-command.ts

**Problem:**
The existing `praman snapshot` command (in `snapshot-command.ts`) already does control discovery:

```bash
npx playwright-praman snapshot
```

This:
1. Uses `npx playwright cli run-code --session pwtest --code "...enricher..."`
2. Parses the JSON output
3. Filters by type, depth, format
4. Outputs to file or stdout

The new plan proposes agents using pre-built scripts:

```bash
playwright-cli -s=sap run-code "$(cat dist/scripts/discover-all.js)"
```

This:
1. Returns raw JSON
2. Agents parse it themselves
3. No filtering, no formatting

**Questions the plan doesn't answer:**
1. Should agents use `praman snapshot` or the new `run-code` scripts?
2. If both exist, when does each apply?
3. Does the pre-built script replace snapshot's function?
4. Is snapshot-command.ts then unused / deprecated?

**Evidence:**
- `snapshot-command.ts` lines 120-123: Uses `npx playwright cli run-code --session ${session} --code "${escapedScript}"`
- Plan 1.1, line 58: Agents use `playwright-cli -s=sap run-code "$(cat dist/scripts/discover-all.js)"`

Both invoke `run-code` with a discovery script. The difference is:
- Snapshot: Managed by praman CLI, includes post-processing
- Pre-built: Managed by playwright CLI, raw output

**Recommendation:**
1. **Clarify the relationship:**
   - Is `snapshot` for *users* (formatted output, file export)?
   - Is `discover-all.js` for *agents* (raw JSON, programmatic use)?

2. **Update the plan's architecture section** to explain:
   - When agents should use `praman snapshot` vs. raw `run-code`
   - Whether `snapshot` is deprecated in Phase 2

3. **Update SKILL.md** to teach both patterns and when to use each

4. **Consider:** If snapshot becomes unused by agents, can it be simplified or removed?

---

### ISSUE #7: `verify-spec` Command Not Feasible Without Test Context — MEDIUM

**Severity:** MEDIUM
**Affected Sections:** Plan 4 (S2-T1: verify-spec implementation)

**Problem:**
The plan proposes `npx playwright-praman verify-spec <file>` that checks:

> "TypeScript compiles (`tsc --noEmit` on single file)" (Plan 4, S2-T1, line 456)

But TypeScript's `tsc --noEmit` on a **single file without project context** is problematic:

1. **`tsc` requires `tsconfig.json`** in the current directory or ancestor
2. **Single-file checks lose type information** — imports won't resolve correctly
3. **Path aliases (`#core/*`, `#bridge/*`) won't work** in isolation — need `tsconfig.compilerOptions.paths`
4. **Relative imports (`.js` extension) are checked** — can't verify those without project graph

**Current Status:**
The repo has `tsconfig.build.json` and `tsconfig.json`. Using `tsc --noEmit` works for the **entire project**, not individual files.

**Evidence:**
Plan 4, S2-T1, line 456: "TypeScript compiles (`tsc --noEmit` on single file)"
But the command to do this would be:
```bash
tsc --noEmit --allowJs path/to/spec.ts
```

This will **fail** if:
- The file imports from `'playwright-praman'` (would need `node_modules` in scope)
- The file uses path aliases like `import { test } from 'playwright-praman'`
- The file expects global type definitions from `tsconfig.build.json`

**Recommendation:**
1. **Change the verification strategy:**
   - Instead of `tsc --noEmit` on single file, use `tsc --noEmit` on the **entire project** (spec file is included)
   - Or: Use `eslint` single-file check + manual type assertions

2. **Simplify verify-spec checks** to avoid TypeScript:
   - ✅ ESLint on single file (works in isolation)
   - ✅ Regex pattern checks (imports, forbidden patterns)
   - ✅ TSDoc header presence
   - ✅ `test.step()` structure (AST or regex)
   - ❌ Remove TypeScript compilation check

3. **Alternative:** Accept a `--project` flag:
   ```bash
   npx playwright-praman verify-spec <file> --project ./tsconfig.json
   npx playwright-praman verify-spec <file> --project .
   ```

4. **Update plan S2-T1** to remove or modify TypeScript compilation check

---

## SUMMARY TABLE

| # | Issue | Severity | Category | Fixable? |
|---|-------|----------|----------|----------|
| 1 | Shell escaping with `$(cat ...)` | CRITICAL | Build/CLI | Yes (design choice) |
| 2 | `dist/scripts/` doesn't exist | HIGH | Build | Yes (straightforward) |
| 3 | `eval` syntax unvalidated | MEDIUM | CLI | Yes (test + doc) |
| 4 | Script output format undefined | MEDIUM | Build | Yes (decision needed) |
| 5 | Parameterized scripts lack mechanism | HIGH | Design | Yes (scope reduction) |
| 6 | Snapshot may be redundant | MEDIUM | Architecture | Yes (clarify role) |
| 7 | `verify-spec` TypeScript check unfeasible | MEDIUM | CLI | Yes (remove or rethink) |

---

## BLOCKERS FOR IMPLEMENTATION

**Before starting Sprint 1 (pre-built scripts), resolve:**
1. Shell escaping strategy (Issue #1)
2. Build output format (Issue #4)
3. Script scope (Issue #5) — decide if 3 or 6 scripts

**Before starting Sprint 2 (verify-spec), resolve:**
1. TypeScript verification approach (Issue #7)

**Before sprints, verify:**
1. `playwright-cli eval` actual syntax (Issue #3)
2. `snapshot` command future role (Issue #6)

---

## RECOMMENDATIONS FOR PLAN REVISION

### High Priority
1. **Add shell escaping analysis** — propose Option A (stdin), Option C (inline only), or Option D (modules)
2. **Define script output format** — IIFE vs. plain function vs. ESM export
3. **Reduce pre-built scripts to parameter-free only** — 3 instead of 6
4. **Document snapshot vs. run-code distinction** — when agents use each

### Medium Priority
5. Validate `playwright-cli eval` syntax with actual Playwright CLI
6. Simplify `verify-spec` — remove TypeScript compilation check
7. Create `src/scripts/` structure and build pipeline

### Documentation
8. Add section 3.3 explaining shell safety + chosen escaping strategy
9. Add section 4.0 explaining build output format with examples
10. Update SKILL.md before agents are trained on new patterns

---

## NOTES FOR REVIEWER

- This review assumed `playwright-cli` v0.1.3+ and `@playwright/test` 1.59+
- No actual tests of `eval` syntax or shell escaping were performed — these are identified as **validation gaps**
- The plan is **sound in architecture** but **incomplete in implementation details**
- All 7 issues are **fixable** — they're design/scope clarifications, not fundamental blockers
