---
title: 19 Forbidden Patterns
description: 'Zero-tolerance patterns in Praman SAP tests with correct alternatives and auto-fix behavior.'
keywords:
  - praman
  - forbidden-patterns
  - anti-patterns
  - quality-gate
  - sap
  - test-quality
---

# 19 Forbidden Patterns

:::info[In this guide]

- Identify all 19 zero-tolerance patterns that fail the Praman quality gate
- Replace each forbidden pattern with the correct Praman alternative
- Understand how the automated quality gate scans for violations
- Know which patterns are auto-fixed and which require manual intervention
- Configure the 3-iteration auto-fix loop for your CI pipeline

:::

The Praman quality gate (`npx playwright-praman verify-spec`) scans every generated `.spec.ts`
file for 19 forbidden patterns. A single match fails the entire file. There are no exceptions,
no overrides, and no severity levels -- every pattern listed here is a hard failure.

---

## Complete Pattern Reference

| #   | Pattern                                    | Category         | Why Forbidden                                    | Correct Alternative                                  |
| --- | ------------------------------------------ | ---------------- | ------------------------------------------------ | ---------------------------------------------------- |
| 1   | `page.click()`                             | Selector         | Bypasses UI5 event model                         | `ui5.press()` or `ui5.click()`                       |
| 2   | `page.fill()`                              | Selector         | Ignores UI5 setValue + fireChange                | `ui5.fill()`                                         |
| 3   | `page.type()`                              | Selector         | Character-by-character input breaks UI5 bindings | `ui5.fill()`                                         |
| 4   | `page.locator('...__')`                    | Selector         | Auto-generated IDs are unstable                  | `ui5.control()` with regex ID or properties          |
| 5   | `page.$()`                                 | Selector         | Direct DOM query bypasses control tree           | `ui5.control()`                                      |
| 6   | `page.waitForTimeout()`                    | Timing           | Arbitrary delay, flaky and slow                  | `ui5.waitForUI5()` or `expect().toPass()`            |
| 7   | `page.waitForSelector()`                   | Timing           | CSS-based wait, misses UI5 rendering             | `ui5.control()` (auto-waits for UI5 stability)       |
| 8   | `setTimeout()`                             | Timing           | Breaks async flow, untracked delay               | `ui5.waitForUI5()` or Playwright `expect` retries    |
| 9   | `page.keyboard.*`                          | Input            | Low-level keyboard bypasses UI5 input handling   | `ui5.fill()` with `setValue` + `fireChange`          |
| 10  | `page.mouse.*`                             | Input            | Low-level mouse bypasses UI5 event system        | `ui5.press()` or `ui5.click()`                       |
| 11  | `import { test } from '@playwright/test'`  | Import/Structure | Strips all Praman fixtures                       | `import { test, expect } from 'playwright-praman'`   |
| 12  | `require()`                                | Import/Structure | CJS import breaks ESM-only module                | `import` statement                                   |
| 13  | `test.describe.serial`                     | Import/Structure | Forces serial execution, hides state coupling    | Independent tests with proper setup/teardown         |
| 14  | `sapAuth.login()` in test body             | Auth             | Duplicates auth, wastes 15-30s, breaks session   | Auth in seed/setup project with `storageState`       |
| 15  | `getControl()` without `searchOpenDialogs` | Dialog           | Misses controls inside dialog DOM subtree        | Add `searchOpenDialogs: true` to dialog selectors    |
| 16  | `console.log()`                            | Output/Typing    | Invisible in CI, pollutes test output            | `test.info().attach()` or pino logger                |
| 17  | `: any` type annotation                    | Output/Typing    | Disables type safety, hides interface mismatches | Proper type annotation or type inference             |
| 18  | `ui5.fill()` without `waitForUI5()`        | Input Sequence   | Dependent fields may not update                  | `ui5.fill()` auto-calls waitForUI5; verify in bridge |
| 19  | `as unknown as`                            | Output/Typing    | Unsafe type assertion, masks real type errors    | Proper type narrowing or generic constraints         |

---

## Patterns by Category

### Selector Patterns (1-5)

These patterns bypass the UI5 control tree entirely, interacting with raw DOM elements instead
of typed UI5 controls.

```diff
- // tests/bad-example.spec.ts — Selector violations
- await page.click('#__button0');
- await page.fill('[id*="__field1"]', '1000');
- await page.type('#__input0', 'MAT-001');
- await page.locator('[id*="__xmlview0--supplierInput"]').fill('100001');
- const el = await page.$('.sapMBtn');
+ // tests/correct-example.spec.ts — Praman fixtures
+ await ui5.press({ controlType: 'sap.m.Button', properties: { text: 'Save' } });
+ await ui5.fill({ controlType: 'sap.m.Input', id: /CompanyCode/ }, '1000');
+ await ui5.fill({ controlType: 'sap.m.Input', id: /Material/ }, 'MAT-001');
+ await ui5.fill({ controlType: 'sap.m.Input', id: /supplierInput/ }, '100001');
+ const el = await ui5.control({ controlType: 'sap.m.Button', properties: { text: 'Save' } });
```

:::danger[A single `page.click()` on a UI5 element fails the file]

Even if 99% of the test uses Praman fixtures, one `page.click('#__button0')` fails the entire
file. The quality gate does not distinguish between "mostly compliant" and "non-compliant".

:::

### Timing Patterns (6-8)

These patterns introduce arbitrary delays or CSS-based waits that do not align with UI5's
rendering lifecycle.

```diff
- // tests/bad-example.spec.ts — Timing violations
- await page.waitForTimeout(3000);
- await page.waitForSelector('.sapMTable');
- await new Promise(resolve => setTimeout(resolve, 2000));
+ // tests/correct-example.spec.ts — UI5-aware waiting
+ await ui5.waitForUI5();
+ const table = await ui5.control({ controlType: 'sap.m.Table', id: /itemsTable/ });
+ await ui5.waitForUI5();
```

:::warning[Common mistake]
Agents add `page.waitForTimeout(5000)` when a navigation takes longer than expected. The
correct fix is `ui5.waitForUI5()`, which waits for all pending UI5 requests, microtasks,
and rendering to complete -- regardless of how long that takes.
:::

### Input Patterns (9-10)

Low-level keyboard and mouse interactions bypass the UI5 event model entirely.

```diff
- // tests/bad-example.spec.ts — Input violations
- await page.keyboard.press('Enter');
- await page.keyboard.type('100001');
- await page.mouse.click(500, 300);
+ // tests/correct-example.spec.ts — Praman input methods
+ await ui5.press({ controlType: 'sap.m.Button', properties: { text: 'Go' } });
+ await ui5.fill({ controlType: 'sap.m.Input', id: /Supplier/ }, '100001');
+ await ui5.press({ controlType: 'sap.m.Button', id: /searchButton/ });
```

:::warning[Common mistake]
Agents use `page.keyboard.press('Enter')` to submit forms. UI5 forms do not always respond
to keyboard Enter -- use `ui5.press()` on the explicit Submit or Go button instead.
:::

### Import/Structure Patterns (11-13)

These patterns break the module system or hide test dependencies.

```diff
- // tests/bad-example.spec.ts — Import/structure violations
- import { test, expect } from '@playwright/test';
- const utils = require('./test-utils');
- test.describe.serial('PO Flow', () => { ... });
+ // tests/correct-example.spec.ts — Correct imports and structure
+ import { test, expect } from 'playwright-praman';
+ import { utils } from './test-utils.js';
+ test.describe('PO Flow', () => { ... });
```

### Auth Pattern (14)

Login code in the test body wastes time and breaks session state.

```diff
- // tests/bad-example.spec.ts — Auth violation
- test('create PO', async ({ sapAuth, ui5 }) => {
-   await sapAuth.login('user', 'password');
-   // ... test code
- });
+ // tests/correct-example.spec.ts — Auth via setup project
+ // playwright.config.ts: { dependencies: ['setup'], use: { storageState: '.auth/sap-session.json' } }
+ test('create PO', async ({ ui5, ui5Navigation, fe }) => {
+   // ... test code (auth already handled)
+ });
```

### Dialog Pattern (15)

Missing `searchOpenDialogs` causes controls inside dialogs to be invisible.

```diff
- // tests/bad-example.spec.ts — Dialog violation
- const btn = await ui5.control({
-   controlType: 'sap.m.Button',
-   properties: { text: 'Confirm' },
- });
+ // tests/correct-example.spec.ts — Dialog-aware selector
+ const btn = await ui5.control({
+   controlType: 'sap.m.Button',
+   properties: { text: 'Confirm' },
+   searchOpenDialogs: true,
+ });
```

:::danger[Dialog controls without `searchOpenDialogs` always time out]

The control finder searches the main page DOM by default. Dialog controls live in a
separate `sap-ui-static` subtree. Without `searchOpenDialogs: true`, the finder will wait
until timeout and then fail -- even though the control is clearly visible on screen.

:::

### Output/Typing Patterns (16-17, 19)

These patterns disable observability or type safety.

```diff
- // tests/bad-example.spec.ts — Output/typing violations
- console.log('PO created:', poNumber);
- const control: any = await ui5.control({ ... });
- const data = result as unknown as PurchaseOrder;
+ // tests/correct-example.spec.ts — Proper observability and types
+ await test.info().attach('po-number', { body: poNumber, contentType: 'text/plain' });
+ const control = await ui5.control({ controlType: 'sap.m.Input', id: /poNumber/ });
+ const data: PurchaseOrder = result;
```

### Input Sequence Pattern (18)

Filling a field without ensuring UI5 processes the change leaves dependent fields stale.

```diff
- // tests/bad-example.spec.ts — Input sequence violation
- await ui5.bridge.setValue(control, '100001');
- // Missing fireChange and waitForUI5 -- dependent fields will not update
+ // tests/correct-example.spec.ts — Complete input sequence
+ await ui5.fill({ id: /Supplier/ }, '100001');
+ // ui5.fill() automatically handles setValue + fireChange + waitForUI5
```

:::warning[Common mistake]
When the healer rewrites interactions using bridge-level calls for precision, it sometimes
drops the `waitForUI5()` after `fireChange()`. The value appears correct but downstream
validations and dependent field lookups have not completed.
:::

---

## How the Quality Gate Scans

The `verify-spec` command runs pattern-matching scans against the source file. Internally,
these are the grep patterns used for each category:

```bash
# Selector patterns
grep -nE 'page\.(click|fill|type)\(' "$SPEC_FILE"
grep -nE 'page\.locator\(.+__' "$SPEC_FILE"
grep -nE 'page\.\$\(' "$SPEC_FILE"

# Timing patterns
grep -nE 'page\.waitForTimeout\(' "$SPEC_FILE"
grep -nE 'page\.waitForSelector\(' "$SPEC_FILE"
grep -nE 'setTimeout\(' "$SPEC_FILE"

# Input patterns
grep -nE 'page\.keyboard\.' "$SPEC_FILE"
grep -nE 'page\.mouse\.' "$SPEC_FILE"

# Import/structure patterns
grep -nE "from ['\"]@playwright/test['\"]" "$SPEC_FILE"
grep -nE 'require\(' "$SPEC_FILE"
grep -nE 'describe\.serial' "$SPEC_FILE"

# Auth pattern
grep -nE 'sapAuth\.login\(' "$SPEC_FILE"

# Dialog pattern (context-aware: checks if searchOpenDialogs is missing)
# Handled by AST analysis, not simple grep

# Output/typing patterns
grep -nE 'console\.(log|warn|error)\(' "$SPEC_FILE"
grep -nE ':\s*any\b' "$SPEC_FILE"
grep -nE 'as unknown as' "$SPEC_FILE"
```

:::danger[A single match fails the file]

The quality gate exits with code 1 on the first match. It does not accumulate warnings or
produce a score. One forbidden pattern in a 500-line file means the entire file is
non-compliant.

:::

---

## Auto-Fix vs Manual Fix

The healer agent attempts to auto-fix violations when possible. Not all patterns can be
fixed automatically.

| Pattern                       | Auto-Fixable | Fix Strategy                                                           |
| ----------------------------- | ------------ | ---------------------------------------------------------------------- |
| `page.click()` on UI5 element | Yes          | Replace with `ui5.press()` using discovered control                    |
| `page.fill()` on UI5 element  | Yes          | Replace with `ui5.fill()` using discovered control                     |
| `page.type()`                 | Yes          | Replace with `ui5.fill()`                                              |
| `page.locator('...__')`       | Yes          | Replace with `ui5.control()` + regex ID                                |
| `page.$()`                    | Yes          | Replace with `ui5.control()`                                           |
| `page.waitForTimeout()`       | Yes          | Replace with `ui5.waitForUI5()`                                        |
| `page.waitForSelector()`      | Yes          | Replace with `ui5.control()` (auto-waits)                              |
| `setTimeout()`                | Yes          | Replace with `ui5.waitForUI5()`                                        |
| `page.keyboard.*`             | Partial      | Simple Enter/Tab can be replaced; complex sequences need manual review |
| `page.mouse.*`                | No           | Requires understanding interaction intent                              |
| `@playwright/test` import     | Yes          | Replace with `playwright-praman`                                       |
| `require()`                   | Yes          | Replace with `import` statement                                        |
| `test.describe.serial`        | No           | Requires restructuring test dependencies                               |
| `sapAuth.login()`             | No           | Requires moving auth to seed/setup project                             |
| Missing `searchOpenDialogs`   | Partial      | Added when context clearly indicates a dialog                          |
| `console.log()`               | Yes          | Replace with `test.info().attach()`                                    |
| `: any`                       | Partial      | Replaced when return type is inferrable                                |
| Missing `waitForUI5()`        | Yes          | Added after `ui5.fill()` or bridge calls                               |
| `as unknown as`               | No           | Requires understanding the actual type relationship                    |

---

## The 3-Iteration Auto-Fix Loop

When the quality gate detects violations, the healer agent runs an iterative fix loop:

```text
Iteration 1: Run verify-spec
  --> Violations found
  --> Auto-fix all auto-fixable patterns
  --> Re-run verify-spec

Iteration 2: Run verify-spec
  --> Remaining violations (manual-fix patterns or missed auto-fixes)
  --> Attempt context-aware fixes using page discovery
  --> Re-run verify-spec

Iteration 3: Run verify-spec
  --> If violations remain: STOP and report
  --> If clean: Output compliant .spec.ts file
```

Key behaviors of the loop:

- **Iteration 1** handles the easy mechanical replacements (import fixes, `waitForTimeout`
  removal, `console.log` replacement)
- **Iteration 2** handles context-dependent fixes that require re-discovering controls to
  build correct selectors
- **Iteration 3** is the final check -- if violations persist, the healer outputs a report
  listing each remaining violation with line number and suggested manual fix
- The loop **never exceeds 3 iterations** to prevent infinite fix cycles
- Each iteration runs the full test after fixing to verify no regressions

:::warning[Common mistake]
Running the auto-fix loop without a live browser session. The healer needs access to the
running SAP app to discover control types and IDs when replacing `page.click()` with
`ui5.press()`. Without discovery, the replacement uses placeholder selectors that fail the
next verification.
:::

---

## FAQ

<details>
<summary>What if I need page.keyboard for a non-UI5 element?</summary>

The quality gate flags all `page.keyboard.*` usage regardless of context. For verified non-UI5
scenarios (e.g., an IDP login page that requires keyboard navigation), wrap the interaction in
a clearly marked block and add it to your project's `verify-spec` allowlist:

```typescript
// Non-UI5: IDP login requires Tab key navigation between fields
// verify-spec:allow page.keyboard
await page.keyboard.press('Tab');
```

The `verify-spec:allow` comment suppresses the specific pattern on that line only. It must
include the exact pattern name. Use this sparingly -- every allowance weakens the quality gate.

</details>

<details>
<summary>Why is console.log() forbidden in tests?</summary>

Three reasons:

1. **Invisible in CI**: `console.log()` output is not captured by Playwright's test reporter.
   It goes to stdout and is lost in CI pipeline logs.
2. **Not attached to test**: Unlike `test.info().attach()`, console output is not linked to a
   specific test in the HTML report, making debugging harder.
3. **Pollutes output**: In parallel execution, console output from multiple tests interleaves,
   producing unreadable logs.

Use `test.info().attach()` for values you need in the report, or the pino logger
(`import { logger } from '#core/logging'`) for structured debug output.

</details>

<details>
<summary>Can I override the quality gate for a specific file?</summary>

No. The quality gate has no file-level override mechanism. Individual lines can be suppressed
with `verify-spec:allow <pattern>` comments, but the file as a whole must pass all 19 checks.
If you believe a pattern should be allowed project-wide, open a discussion to update the
forbidden patterns list -- do not work around the gate.

</details>

<details>
<summary>How do I find which line triggered the failure?</summary>

Run `verify-spec` with the `--verbose` flag to see line numbers and matched patterns:

```bash
npx playwright-praman verify-spec tests/e2e/my-app.spec.ts --verbose
```

Output includes the line number, matched pattern, and the category:

```text
FAIL  tests/e2e/my-app.spec.ts
  Line 42: page.click('#__button0')  [Selector: page.click]
  Line 87: page.waitForTimeout(3000) [Timing: waitForTimeout]
  Line 91: console.log('saved')      [Output: console.log]

3 violations found. 2 auto-fixable, 1 requires manual fix.
```

</details>

:::tip[Next steps]

- **[7 Mandatory Rules and Rule 0](./claude-code-plugin-mandatory-rules.md)** -- the rule definitions these patterns enforce
- **[Gold Standard Test Pattern](./gold-standard-test.md)** -- a complete test that passes all 19 checks
- **[Debugging Agent Failures](./debugging-agent-failures.md)** -- when tests fail despite passing the quality gate
- **[Troubleshooting](./troubleshooting.md)** -- common issues and their solutions

:::
