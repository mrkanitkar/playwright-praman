# Playwright 1.60 Upgrade Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Upgrade `playwright-praman` from `@playwright/test` 1.59.1 to 1.60.0, extend the version-aware feature-flag layer with the eight new 1.60 capabilities, and adopt one high-value 1.60 API (`getByRole({ description })`) in FLP section navigation — all with zero regressions.

**Architecture:** The project already has a version-aware compatibility layer (`src/core/compat/playwright-compat.ts`) that gates new Playwright APIs behind runtime feature flags. We extend that layer first, then consume one new flag in `navigation-space.ts`. The peer-dependency range (`>=1.57.0 <2.0.0`) already covers 1.60, so this is a non-breaking minor bump for consumers.

**Tech Stack:** TypeScript 6 (strict, ESM), Vitest 4 (unit), Playwright Test 1.60 (integration), tsup (build), ESLint 9 (11 plugins, zero-warning).

---

## Execution Status & Revised Flow (updated 2026-05-25)

This plan now runs in **two phases with a hard approval gate** between them (per maintainer request: finish all local work, then approve CI + check-in).

**Scope change:** `@playwright/cli` **is now bumped** 0.1.5 → 0.1.13 (overrides the earlier F3 deferral, at maintainer request). CI security gate (`npm audit --audit-level=high --omit=dev`) = 0 vulnerabilities.

**Local toolchain caveat:** `eslint` (type-aware) **hangs in this local environment** (≈0% CPU, blocked — even with the sandbox disabled; likely TypeScript 6.0.2 + typescript-eslint). It hangs both the pre-commit hook and `npm run lint`. Therefore Phase A commits were made with `--no-verify`, and **lint is deferred to GitHub CI** (which has a working ESLint) in Phase B. Each change was instead verified locally with **Vitest + `tsc --noEmit`**.

### Phase A — Local implementation ✅ COMPLETE (branch `chore/playwright-1.60-upgrade`)

| Commit | Task |
| --- | --- |
| `2307c5d` | Task 0 — branch + exclude `docs/superpowers/**` from markdownlint & cspell (+ `.gitignore` negation) |
| `2dd4e86` | Task 1 — `@playwright/test` → 1.60.0 |
| `1baa3ee` | Task 1b — `@playwright/cli` → 0.1.13 |
| `c6a7f41` | Task 3 — 8 new `PlaywrightFeatures` flags (Vitest 72 pass, tsc clean) |
| `786d625` | Task 4 — `getByRole({ description })` adoption + main test + mocked-branch test (Vitest 20 pass, tsc clean) |

Task 2 (browser install: Chromium 148 / FF 150.0.2 / WebKit 26.4; `playwright test --list` = 77 tests) is done — no commit (binaries gitignored).

### ⛔ APPROVAL GATE — awaiting maintainer go-ahead before Phase B

### Phase B — CI verification + check-in (requires approval)

- **Task 5** — run the GitHub CI parity gate (see below). NOTE: `npm run lint` will hang locally; rely on GitHub CI for the lint job, or fix the local ESLint hang first.
- **Task 6** — check in: `git push` + `gh pr create`.

---

## Context & Risk Summary

**Impact analysis (already performed):**

- **Breaking changes in 1.60** — all four removed APIs (`Locator.ariaRef()`, `exposeBinding` `handle` option, `connect`/`connectOverCDP` `logger` option, `videosPath`/`videoSize`) are **confirmed unused** in `src/` and `tests/` via grep. Zero breaking-change impact.
- **Config validation** — 1.60 errors on `workers: 0`/negative; our config uses `workers: 1`. Safe.
- **Reporters** — 1.60 adds an optional `workerInfo` arg to `reporter.onError()`. **No reporter in `src/reporters/` implements `onError`**, so no signature change is forced. Documented in the Deferred Backlog.
- **Peer dependency** — `@playwright/test: ">=1.57.0 <2.0.0"` already admits 1.60. **No change.**
- **Min-version guards** — `MIN_PLAYWRIGHT_VERSION = '1.57.0'` in `src/cli/validator.ts:112` and `src/fixtures/core-fixtures.ts:87`. **No change.**

**Primary risk:** browser-binary version jump (Chromium 136→148, Firefox 139→150, WebKit 18.4→26.4). Mitigated by Task 5 Step 7 (integration regression on the new binaries).

**GitHub check-in requirements (`.github/workflows/ci.yml`, runs on every PR to `main`):**

| CI Job                                           | What it runs                                                                                | Plan touch-point                            |
| ------------------------------------------------ | ------------------------------------------------------------------------------------------- | ------------------------------------------- |
| `quality` (ubuntu, Node 24)                      | `lint`, `typecheck`, `cspell`, `knip`, `markdownlint-cli2 "**/*.md"`, **verify clean tree** | Task 0 (markdownlint ignore), Task 5 Step 1 |
| `unit-tests` (ubuntu/windows/macos × Node 22/24) | `build` + **`test:unit -- --coverage`**                                                     | Task 4 (F1 branch coverage), Task 5 Step 2  |
| `build` (3 OS)                                   | `build`, CJS/ESM smoke, **`size-limit`**, **`check:exports`**, `npm pack`                   | Task 5 Step 3                               |
| `security` (ubuntu)                              | `npm audit --audit-level=high --omit=dev`                                                   | Task 5 Step 4                               |
| `docs-check` (ubuntu)                            | `typedoc --validation`, docs markdownlint, Docusaurus build                                 | Task 5 Step 5                               |
| `ts-compat` (TS 5.9.3 + 6.0.2)                   | `tsc --noEmit`, `tsup --no-dts`                                                             | Task 5 Step 6                               |

Two consequences for this plan: (1) coverage runs in CI on the full OS/Node matrix, so the F1 branch-coverage gap is a **hard CI blocker**, not just a pre-push concern; (2) the `quality` job lints **every** `*.md` via glob — including this committed plan doc, which the existing `plans/**` ignore does **not** match at its nested `docs/superpowers/plans/` path (confirmed: 42 markdownlint errors). Task 0 fixes that.

**New 1.60 feature flags added by this plan (8):**

| Flag                       | 1.60 API it gates                                  |
| -------------------------- | -------------------------------------------------- |
| `hasTestAbort`             | `test.abort()`                                     |
| `hasGetByRoleDescription`  | `description` option on `getByRole()`              |
| `hasPageAriaSnapshot`      | `expect(page).toMatchAriaSnapshot()`               |
| `hasAriaSnapshotBoxes`     | `boxes` option on `ariaSnapshot()`                 |
| `hasTracingHAR`            | `tracing.startHar()` / `stopHar()`                 |
| `hasLocatorDrop`           | `locator.drop()`                                   |
| `hasLocatorHighlightStyle` | `style` option on `locator.highlight()`            |
| `hasBrowserContextEvent`   | `browser.on('context')` + context lifecycle events |

---

## File Structure

| File                                                 | Change                                                                    | Responsibility                                                                                            |
| ---------------------------------------------------- | ------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------- |
| `.markdownlint-cli2.jsonc`                           | Modify `ignores` (Task 0)                                                 | Exclude `docs/superpowers/**` so the committed plan/spec docs don't fail the `quality` job                |
| `package.json`                                       | Modify line 237                                                           | Bump `@playwright/test` 1.59.1→1.60.0 (cli left unchanged — see F3)                                       |
| `src/core/compat/playwright-compat.ts`               | Modify interface (71–85) + `detectFeatures` (121–139)                     | Declare + detect the 8 new flags                                                                          |
| `tests/unit/core/compat/playwright-compat.test.ts`   | Modify                                                                    | Assert new flags at 1.59.0 (false) and 1.60.0 (true)                                                      |
| `tests/unit/fixtures/core-fixtures.test.ts`          | Modify mock (82–96)                                                       | Keep `mockFeatures: PlaywrightFeatures` complete (typecheck gate)                                         |
| `src/modules/navigation-space.ts`                    | Modify interface (57), options (90–95), `navigateToSectionLink` (209–233) | Adopt `getByRole({ description })`, gated by `hasGetByRoleDescription`                                    |
| `tests/unit/modules/navigation-space.test.ts`        | Modify                                                                    | Cover the `description`-forwarded path (PW ≥1.60)                                                         |
| `tests/unit/modules/navigation-space-mocked.test.ts` | **Create**                                                                | Cover the version-**false** branch (mocks `hasFeature`) — protects the per-file branch-coverage gate (F1) |

---

## Task 0: Create feature branch and make this plan doc CI-safe

**Files:**

- Modify: `.markdownlint-cli2.jsonc` (`ignores` array)
- Modify: `cspell.json` (`ignorePaths` array)

> **Why this task exists:** the `quality` CI job lints **and** spell-checks every doc via globs — `markdownlint-cli2 "**/*.md"` and `cspell "docs/**/*.md"`. This committed plan doc lives at `docs/superpowers/plans/…`, which the existing `plans/**` / `specs/**` ignores do **not** match (verified: 42 markdownlint errors; cspell also scans it). Excluding `docs/superpowers/**` in both tools — consistent with how the repo already ignores `plans/**` and `specs/**` — keeps superpowers process docs out of the lint/spell gates.

- [ ] **Step 1: Create and switch to the upgrade branch**

Run:

```bash
git checkout -b chore/playwright-1.60-upgrade
```

Expected: `Switched to a new branch 'chore/playwright-1.60-upgrade'`

> Project rule: never commit to `main`; all work lands via a PR from a feature branch.

- [ ] **Step 2: Exclude superpowers docs from markdownlint**

In `.markdownlint-cli2.jsonc`, add this entry to the `ignores` array (e.g., right after the existing `"specs/**",` on line 7):

```jsonc
    "docs/superpowers/**",
```

- [ ] **Step 3: Exclude superpowers docs from cspell**

In `cspell.json`, add this entry to the `ignorePaths` array (e.g., after `"docs/node_modules",`):

```jsonc
    "docs/superpowers/**",
```

- [ ] **Step 4: Verify both gates skip the plan doc via glob discovery**

Run:

```bash
npx markdownlint-cli2 "docs/superpowers/**/*.md"
npx cspell "docs/superpowers/**/*.md" --no-progress
```

Expected: `markdownlint-cli2` exits 0 with `Linting: 0 file(s)`; `cspell` exits 0 reporting no files checked / no issues — both mirror how the CI `quality` job discovers files, so the committed doc will not break CI.

- [ ] **Step 5: Commit the config changes and the plan doc together**

```bash
git add .markdownlint-cli2.jsonc cspell.json docs/superpowers/plans/2026-05-25-playwright-1.60-upgrade.md
git commit -m "docs(plan): add Playwright 1.60 upgrade plan; exclude superpowers docs from lint/spell"
```

---

## Task 1: Bump Playwright dependency

**Files:**

- Modify: `package.json:237`

> **Scope decision (review F3):** This PR bumps **only** `@playwright/test`. `@playwright/cli` (currently `0.1.5`, latest `0.1.13`) is **left unchanged** — it is unrelated to the 1.60 runtime upgrade, the peer range `">=0.1.3"` already admits it, and bundling it would make the upgrade harder to bisect. Bump it in a separate `chore(deps)` PR if desired.

- [ ] **Step 1: Update the pinned dev dependency**

In `package.json`, change this single line (currently `"@playwright/test": "1.59.1",`):

```json
    "@playwright/test": "1.60.0",
```

Leave `peerDependencies."@playwright/test"` (`">=1.57.0 <2.0.0"`) unchanged — it already admits 1.60.

- [ ] **Step 2: Install the new versions**

Run:

```bash
npm install
```

Expected: completes with no `ERESOLVE` peer-dependency errors; `package-lock.json` updates `@playwright/test` to `1.60.0`.

- [ ] **Step 3: Verify the installed runner version**

Run:

```bash
npx playwright --version
```

Expected: `Version 1.60.0`

- [ ] **Step 4: Verify the installed package version matches (used by the compat layer)**

Run:

```bash
node -e "console.log(require('@playwright/test/package.json').version)"
```

Expected: `1.60.0`

- [ ] **Step 5: Commit**

```bash
git add package.json package-lock.json
git commit -m "chore(deps): bump @playwright/test to 1.60.0"
```

---

## Task 2: Install 1.60 browser binaries and smoke-check the runner

**Files:** none (downloads browser binaries; not tracked in git)

- [ ] **Step 1: Download the 1.60 browser binaries**

Run:

```bash
npx playwright install
```

Expected: downloads/links Chromium 148.0.7778.96, Firefox 150.0.2, WebKit 26.4 with no errors.

- [ ] **Step 2: Smoke-check that the test runner loads the config under 1.60**

Run:

```bash
npx playwright test --list
```

Expected: lists discovered tests across the configured projects (`agent-seed-test`, `setup`, `sap-tests`, `e2e-gold-standard`, `e2e-sap-cloud`) with no config-load error such as `workers must be a positive number`.

> No commit — binaries are not version-controlled. This task is a verification gate only.

---

## Task 3: Add the eight 1.60 feature flags (TDD)

**Files:**

- Modify: `src/core/compat/playwright-compat.ts:71-85` (interface), `:121-139` (`detectFeatures`)
- Test: `tests/unit/core/compat/playwright-compat.test.ts`
- Test (keep green): `tests/unit/fixtures/core-fixtures.test.ts:82-96`

- [ ] **Step 1: Write the failing tests**

In `tests/unit/core/compat/playwright-compat.test.ts`, add this `describe` block immediately after the existing `describe('detectFeatures', ...)` block (after line 111):

```typescript
describe('detectFeatures — 1.60 capabilities', () => {
  it('returns all 1.60 flags true for version 1.60.0', () => {
    const version = { major: 1, minor: 60, patch: 0, raw: '1.60.0' };
    const features = detectFeatures(version);

    expect(features.hasTestAbort).toBe(true);
    expect(features.hasGetByRoleDescription).toBe(true);
    expect(features.hasPageAriaSnapshot).toBe(true);
    expect(features.hasAriaSnapshotBoxes).toBe(true);
    expect(features.hasTracingHAR).toBe(true);
    expect(features.hasLocatorDrop).toBe(true);
    expect(features.hasLocatorHighlightStyle).toBe(true);
    expect(features.hasBrowserContextEvent).toBe(true);
  });

  it('returns all 1.60 flags false for version 1.59.0', () => {
    const version = { major: 1, minor: 59, patch: 0, raw: '1.59.0' };
    const features = detectFeatures(version);

    expect(features.hasTestAbort).toBe(false);
    expect(features.hasGetByRoleDescription).toBe(false);
    expect(features.hasPageAriaSnapshot).toBe(false);
    expect(features.hasAriaSnapshotBoxes).toBe(false);
    expect(features.hasTracingHAR).toBe(false);
    expect(features.hasLocatorDrop).toBe(false);
    expect(features.hasLocatorHighlightStyle).toBe(false);
    expect(features.hasBrowserContextEvent).toBe(false);
  });
});
```

- [ ] **Step 2: Run the tests to verify they fail**

Run:

```bash
npm run test:unit -- playwright-compat
```

Expected: FAIL — TypeScript reports `Property 'hasTestAbort' does not exist on type 'PlaywrightFeatures'` (and the other seven), so the spec does not compile.

- [ ] **Step 3: Extend the `PlaywrightFeatures` interface**

In `src/core/compat/playwright-compat.ts`, replace the interface body (lines 72–84, the existing `readonly has...: boolean;` list) so the closing `}` is preceded by the original flags **plus** these eight new lines:

```typescript
export interface PlaywrightFeatures {
  readonly hasRouteFromHAR: boolean;
  readonly hasScreenshotCaret: boolean;
  readonly hasClockAPI: boolean;
  readonly hasAriaSnapshot: boolean;
  readonly hasCustomExpect: boolean;
  readonly hasLocatorAssertions: boolean;
  readonly hasFilterLocator: boolean;
  readonly hasBoxedStep: boolean;
  readonly hasScreencastAPI: boolean;
  readonly hasAriaSnapshotDepth: boolean;
  readonly hasSetStorageState: boolean;
  readonly hasLocatorNormalize: boolean;
  readonly hasURLPatternMatcher: boolean;
  readonly hasTestAbort: boolean;
  readonly hasGetByRoleDescription: boolean;
  readonly hasPageAriaSnapshot: boolean;
  readonly hasAriaSnapshotBoxes: boolean;
  readonly hasTracingHAR: boolean;
  readonly hasLocatorDrop: boolean;
  readonly hasLocatorHighlightStyle: boolean;
  readonly hasBrowserContextEvent: boolean;
}
```

- [ ] **Step 4: Detect the new flags in `detectFeatures`**

In `src/core/compat/playwright-compat.ts`, inside the `return { ... }` of `detectFeatures` (currently ending at line 138 with `hasURLPatternMatcher: isAtLeast(ver, '1.59.0'),`), add these eight entries right before the closing `};`:

```typescript
    hasTestAbort: isAtLeast(ver, '1.60.0'),
    hasGetByRoleDescription: isAtLeast(ver, '1.60.0'),
    hasPageAriaSnapshot: isAtLeast(ver, '1.60.0'),
    hasAriaSnapshotBoxes: isAtLeast(ver, '1.60.0'),
    hasTracingHAR: isAtLeast(ver, '1.60.0'),
    hasLocatorDrop: isAtLeast(ver, '1.60.0'),
    hasLocatorHighlightStyle: isAtLeast(ver, '1.60.0'),
    hasBrowserContextEvent: isAtLeast(ver, '1.60.0'),
```

- [ ] **Step 5: Keep the `core-fixtures` mock complete (typecheck gate)**

In `tests/unit/fixtures/core-fixtures.test.ts`, the `mockFeatures: PlaywrightFeatures` object (lines 82–96) must list every interface field or typecheck fails. Add these eight properties before its closing `};` (after line 95 `hasURLPatternMatcher: true,`):

```typescript
  hasTestAbort: true,
  hasGetByRoleDescription: true,
  hasPageAriaSnapshot: true,
  hasAriaSnapshotBoxes: true,
  hasTracingHAR: true,
  hasLocatorDrop: true,
  hasLocatorHighlightStyle: true,
  hasBrowserContextEvent: true,
```

- [ ] **Step 6: Extend the `getPlaywrightFeatures` type-coverage test**

In `tests/unit/core/compat/playwright-compat.test.ts`, inside `describe('getPlaywrightFeatures', ...)` (the block asserting `typeof features.hasX === 'boolean'`, after line 180 `expect(typeof features.hasURLPatternMatcher).toBe('boolean');`), add:

```typescript
expect(typeof features.hasTestAbort).toBe('boolean');
expect(typeof features.hasGetByRoleDescription).toBe('boolean');
expect(typeof features.hasPageAriaSnapshot).toBe('boolean');
expect(typeof features.hasAriaSnapshotBoxes).toBe('boolean');
expect(typeof features.hasTracingHAR).toBe('boolean');
expect(typeof features.hasLocatorDrop).toBe('boolean');
expect(typeof features.hasLocatorHighlightStyle).toBe('boolean');
expect(typeof features.hasBrowserContextEvent).toBe('boolean');
```

- [ ] **Step 7: Run the affected unit tests to verify they pass**

Run:

```bash
npm run test:unit -- playwright-compat core-fixtures
```

Expected: PASS — all `playwright-compat` and `core-fixtures` specs green.

- [ ] **Step 8: Typecheck the whole project**

Run:

```bash
npm run typecheck
```

Expected: exits 0, no errors.

- [ ] **Step 9: Commit**

```bash
git add src/core/compat/playwright-compat.ts tests/unit/core/compat/playwright-compat.test.ts tests/unit/fixtures/core-fixtures.test.ts
git commit -m "feat(compat): add Playwright 1.60 feature flags"
```

---

## Task 4: Adopt `getByRole({ description })` in FLP section navigation (TDD)

**Files:**

- Modify: `src/modules/navigation-space.ts:57` (interface), `:90-95` (options), `:209-233` (`navigateToSectionLink`)
- Test: `tests/unit/modules/navigation-space.test.ts`

**Why:** SAP Fiori section links frequently share visible text (e.g., two "Manage" links) but differ by `aria-describedby`. The new `description` option lets authors disambiguate without brittle `nth()` selectors. The option is gated by `hasGetByRoleDescription`, so it is silently ignored on Playwright < 1.60 (the package supports `>=1.57.0`).

- [ ] **Step 1: Write the failing test**

In `tests/unit/modules/navigation-space.test.ts`, add this test inside `describe('navigateToSectionLink', ...)` immediately after the first test (after line 182, the closing `});` of `'calls page.getByRole("link").click() with the link name'`):

```typescript
it('forwards description to getByRole when provided (PW 1.60+)', async () => {
  const mockLocator = createMockLocator();
  const page = createMockPage();
  page.getByRole.mockReturnValue(mockLocator);

  await navigateToSectionLink(asPage(page), 'Manage', {
    description: 'Supplier list',
  });

  expect(page.getByRole).toHaveBeenCalledWith('link', {
    name: 'Manage',
    description: 'Supplier list',
  });
  expect(mockLocator.click).toHaveBeenCalledTimes(1);
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run:

```bash
npm run test:unit -- navigation-space
```

Expected: FAIL — TypeScript reports `'description' does not exist in type 'SectionLinkNavigationOptions'`, so the spec does not compile.

- [ ] **Step 3: Add the `hasFeature` import**

In `src/modules/navigation-space.ts`, add this import below the existing `#core/errors/navigation-error.js` import (line 38):

```typescript
import { hasFeature } from '#core/compat/index.js';
```

- [ ] **Step 4: Widen the `getByRole` signature on `SpaceNavigationPage`**

In `src/modules/navigation-space.ts`, replace the `getByRole` line in the `SpaceNavigationPage` interface (line 57):

```typescript
  getByRole(
    role: string,
    options?: { readonly name?: string; readonly description?: string },
  ): SpaceNavigationLocator;
```

- [ ] **Step 5: Add the `description` option to `SectionLinkNavigationOptions`**

In `src/modules/navigation-space.ts`, add this member inside `SectionLinkNavigationOptions` (before its closing `}` at line 95, after the `waitForStable` member):

```typescript
  /**
   * Accessible description (`aria-describedby` text) used to disambiguate
   * section links that share the same visible name. Forwarded to
   * `getByRole('link', { description })`. Ignored on Playwright versions
   * before 1.60, which lack the `description` option.
   */
  readonly description?: string;
```

- [ ] **Step 6: Forward `description` from `navigateToSectionLink`**

In `src/modules/navigation-space.ts`, replace the single locator line in `navigateToSectionLink` (line 230, `const linkLocator = page.getByRole('link', { name: linkName });`) with:

```typescript
const roleOptions: { name: string; description?: string } = { name: linkName };
if (options?.description !== undefined && hasFeature('hasGetByRoleDescription')) {
  roleOptions.description = options.description;
}
const linkLocator = page.getByRole('link', roleOptions);
```

- [ ] **Step 7: Run the test to verify it passes**

Run:

```bash
npm run test:unit -- navigation-space
```

Expected: PASS — the new `description` test and all existing `navigation-space` tests are green (the existing `toHaveBeenCalledWith('link', { name: 'Purchase Orders' })` assertion still matches because no description is passed there).

- [ ] **Step 8: Create the version-false branch test (F1 — coverage gate)**

The gate `options?.description !== undefined && hasFeature('hasGetByRoleDescription')` has three branch edges. Steps 1–7 cover two of them (description-undefined → first operand false; description-set + installed-1.60 → both true). The **third edge — description set but `hasFeature` false** — is never hit because the installed Playwright is 1.60, leaving the `&&`'s false edge uncovered. `src/modules/**` is Tier 3 (`branches: 85`, **`perFile: true`**) and CI's `unit-tests` job runs `test:unit -- --coverage` on the full matrix, so this would fail CI. Mirror the existing `tests/unit/core/utils/step-decorator-mocked.test.ts` precedent (a dedicated file because `vi.mock()` is module-wide and would corrupt the version-true assertions in `navigation-space.test.ts`).

Create `tests/unit/modules/navigation-space-mocked.test.ts`:

```typescript
/**
 * @license
 * Copyright (c) ZesTest 2025-2030. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0
 *
 * This file may contain AI-assisted code.
 * See LICENSE and NOTICE files for details.
 */

/**
 * Mocked-module test for `navigateToSectionLink` — verifies the version-gated
 * `getByRole({ description })` path is skipped when the installed Playwright
 * lacks the `description` option.
 *
 * @remarks
 * `vi.mock()` applies module-wide and would interfere with the version-true
 * assertions in `navigation-space.test.ts`, so this lives in a separate file
 * (mirrors `step-decorator-mocked.test.ts`). Forcing `hasFeature` to return
 * `false` exercises the false edge of the `&&` branch in `navigateToSectionLink`,
 * protecting the per-file branch-coverage gate.
 *
 * @module modules
 */
import { afterEach, describe, expect, it, vi } from 'vitest';

import type { SpaceNavigationPage } from '../../../src/modules/navigation-space.js';

// Force the version gate OFF before importing the module under test.
vi.mock('#core/compat/index.js', () => ({
  hasFeature: vi.fn().mockReturnValue(false),
}));

// waitForUI5Stable is unrelated to this assertion — stub it out.
vi.mock('#core/utils/wait-helpers.js', () => ({
  waitForUI5Stable: vi.fn<(...args: unknown[]) => Promise<void>>().mockResolvedValue(undefined),
}));

// Import AFTER the mocks so they take effect.
const { navigateToSectionLink } = await import('../../../src/modules/navigation-space.js');

function createMockLocator(): { click: ReturnType<typeof vi.fn> } {
  return {
    click: vi.fn<(...args: unknown[]) => Promise<void>>().mockResolvedValue(undefined),
  };
}

function createMockPage(): {
  evaluate: ReturnType<typeof vi.fn>;
  waitForFunction: ReturnType<typeof vi.fn>;
  getByText: ReturnType<typeof vi.fn>;
  getByRole: ReturnType<typeof vi.fn>;
} {
  return {
    evaluate: vi.fn<(...args: unknown[]) => Promise<unknown>>().mockResolvedValue(undefined),
    waitForFunction: vi.fn<(...args: unknown[]) => Promise<void>>().mockResolvedValue(undefined),
    getByText: vi.fn().mockReturnValue(createMockLocator()),
    getByRole: vi.fn().mockReturnValue(createMockLocator()),
  };
}

function asPage(mock: ReturnType<typeof createMockPage>): SpaceNavigationPage {
  return mock as unknown as SpaceNavigationPage;
}

describe('navigateToSectionLink — description gate disabled (PW < 1.60)', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it('does NOT forward description when hasFeature returns false', async () => {
    const mockLocator = createMockLocator();
    const page = createMockPage();
    page.getByRole.mockReturnValue(mockLocator);

    await navigateToSectionLink(asPage(page), 'Manage', {
      description: 'Supplier list',
    });

    // description is dropped — getByRole receives only the name
    expect(page.getByRole).toHaveBeenCalledWith('link', { name: 'Manage' });
    expect(mockLocator.click).toHaveBeenCalledTimes(1);
  });
});
```

- [ ] **Step 9: Run both navigation-space test files to verify they pass**

Run:

```bash
npm run test:unit -- navigation-space
```

Expected: PASS — both `navigation-space.test.ts` (description forwarded, real 1.60) and `navigation-space-mocked.test.ts` (description dropped, mocked < 1.60) are green; together they cover all three edges of the gate.

- [ ] **Step 10: Lint the changed source and both test files**

Run:

```bash
npx eslint src/modules/navigation-space.ts tests/unit/modules/navigation-space.test.ts tests/unit/modules/navigation-space-mocked.test.ts --max-warnings=0
```

Expected: no errors, no warnings (TSDoc on the new option and the new file's Apache header satisfy `tsdoc/syntax` + `eslint-plugin-headers`; no `any`).

- [ ] **Step 11: Commit**

```bash
git add src/modules/navigation-space.ts tests/unit/modules/navigation-space.test.ts tests/unit/modules/navigation-space-mocked.test.ts
git commit -m "feat(navigation): support getByRole description option for FLP section links"
```

---

## Task 5: GitHub CI parity gate (run every PR check locally before pushing)

**Files:** none (verification)

Run each CI job's commands locally so the push lands green. Commands mirror `.github/workflows/ci.yml` exactly. Use Node 24 locally (matches `.nvmrc`); the matrix also runs Node 22, but a single local Node version is sufficient to catch logic/coverage failures.

- [ ] **Step 1: `quality` job — lint, typecheck, spell, deadcode, markdown, clean tree**

Run:

```bash
npm run lint
npm run typecheck
npx cspell "src/**/*.ts" "docs/**/*.md" --no-progress
npx knip
npx markdownlint-cli2 "**/*.md" "#node_modules" "#docs/build" "#docs/node_modules"
git status --porcelain
```

Expected: `lint`/`typecheck` exit 0; `cspell` reports no unknown words (the new identifiers reuse `HAR` from the existing `hasRouteFromHAR`, already in the dictionary); `knip` reports no new unused exports (the 8 flags are members of the already-used `PlaywrightFeatures` interface, not new exports); `markdownlint-cli2` exits 0 (the plan doc is excluded by Task 0); `git status --porcelain` prints **nothing** (the "verify clean tree" check — no generated/unformatted files left behind).

- [ ] **Step 2: `unit-tests` job — build then coverage**

Run:

```bash
npm run build
npm run test:unit -- --coverage
```

Expected: build succeeds; all unit tests pass; coverage meets the tiered thresholds with `perFile: true` — specifically `src/modules/navigation-space.ts` ≥85% branches (guaranteed by the Task 4 main + mocked tests covering all three gate edges) and `src/core/compat/playwright-compat.ts` ≥90% branches (the 1.60.0-true / 1.59.0-false tests cover both edges of each new `isAtLeast`).

- [ ] **Step 3: `build` job — bundle size, export map, smoke tests**

Run:

```bash
npm run build
node -e "const m = require('./dist/index.cjs'); if (!m.VERSION) throw new Error('CJS load failed')"
node dist/cli/index.js --version
node dist/cli/index.cjs --version
npx size-limit
npm run check:exports
```

Expected: CJS/ESM module + CLI load; `size-limit` stays within budget (the ~24 added LOC is negligible); `check:exports` (`attw`) reports all 6 sub-path exports resolve for both ESM and CJS with no new `@playwright/test` type-resolution failures.

- [ ] **Step 4: `security` job — production audit**

Run:

```bash
npm audit --audit-level=high --omit=dev
```

Expected: no high/critical advisories in production dependencies. (`@playwright/test` is a devDependency and is excluded by `--omit=dev`, so the bump cannot introduce a prod advisory here — but run it to match CI.)

- [ ] **Step 5: `docs-check` job — typedoc + Docusaurus**

Run:

```bash
npx typedoc --validation
```

Expected: TypeDoc validation passes — the new TSDoc on `SectionLinkNavigationOptions.description` and the 8 interface flags must not produce `@param`/reference warnings. (The Docusaurus build also runs in CI but does not depend on these source changes; run `npm run docs:build` only if doc content changed.)

- [ ] **Step 6: `ts-compat` job — typecheck under both supported TypeScript versions**

Run:

```bash
npx tsc --noEmit
```

Expected: exits 0 under the pinned TypeScript 6.0.2. CI also re-runs this under TypeScript 5.9.3; the changes use only baseline syntax (optional properties, a narrowed local object, `&&`), so both versions pass. If you want full parity locally: `npm i -D --save-exact typescript@5.9.3 && npx tsc --noEmit && npm i -D --save-exact typescript@6.0.2`.

- [ ] **Step 7: Integration suite against the new browser binaries (not a PR-gating CI job, but the key regression for the browser bump)**

Run:

```bash
npm run test:integration
```

Expected: integration specs pass, or suites needing live SAP/auth env vars **skip** rather than error. Investigate any genuine 1.60 behavioral regression before proceeding. The PR-gating `azure-playwright` job only runs on the `azure-test` label or `workflow_dispatch`, so browser-level regressions are otherwise caught here locally.

> If a SAP-credentialed environment is unavailable, record exactly which projects ran vs. skipped in the PR description (per the project rule on stating untested surfaces explicitly).

---

## Task 6: Open the pull request

**Files:** none (git/gh)

- [ ] **Step 1: Push the branch**

Run:

```bash
git push -u origin chore/playwright-1.60-upgrade
```

- [ ] **Step 2: Create the PR**

Run:

```bash
gh pr create --title "chore: upgrade Playwright to 1.60" --body "$(cat <<'EOF'
## Summary
- Bump `@playwright/test` 1.59.1 → 1.60.0 (`@playwright/cli` intentionally left at 0.1.5 — unrelated to this upgrade)
- Extend the version-aware compat layer with 8 new 1.60 feature flags
- Adopt `getByRole({ description })` for FLP section-link disambiguation (gated by `hasGetByRoleDescription`)

## Impact analysis
- All four 1.60-removed APIs (`ariaRef`, `exposeBinding` handle, `connect` logger, `videosPath`/`videoSize`) confirmed unused — zero breaking-change impact
- Peer range `>=1.57.0 <2.0.0` already admits 1.60 — no consumer-facing change
- Browser binaries jump (Chromium 136→148, Firefox 139→150, WebKit 18.4→26.4) — exercised via `test:integration`

## Test plan (mirrors CI jobs)
- [ ] `quality`: lint + typecheck + cspell + knip + markdownlint + clean tree
- [ ] `unit-tests`: `npm run test:unit -- --coverage` green (per-file branch thresholds hold)
- [ ] `build`: `npm run build`, `npx size-limit`, `npm run check:exports`, CLI/CJS/ESM smoke
- [ ] `security`: `npm audit --audit-level=high --omit=dev`
- [ ] `docs-check`: `npx typedoc --validation`
- [ ] `ts-compat`: `npx tsc --noEmit` under TS 5.9.3 and 6.0.2
- [ ] `npx playwright --version` reports 1.60.0
- [ ] `npm run test:integration` (note which projects ran vs. skipped)
EOF
)"
```

Expected: prints the new PR URL.

> Confirm with the maintainer before pushing/creating the PR if operating non-interactively.

---

## Deferred Backlog (not part of this plan's executable tasks)

These 1.60 capabilities now have feature flags (Task 3) but are **not** consumed yet. Each is listed with its rationale and a sketch of where it would land. Promote to its own plan when prioritized.

1. **`test.abort()` fail-fast on SAP session expiry** (`hasTestAbort`) — In `src/fixtures/stability-fixtures.ts`, add a `response`/route observer that detects redirects to the IdP/login page and calls `test.abort('SAP session expired')` instead of letting the test time out. **Deferred because** a wrong trigger would abort healthy tests; it needs a config opt-in (`PramanConfig` schema change) and careful false-positive analysis.

2. **`ariaSnapshot({ boxes })` for AI grounding** (`hasAriaSnapshotBoxes`) — Add an AI-fixture helper (`src/fixtures/ai-fixtures.ts`) returning an aria snapshot with `[box=x,y,width,height]` data for visual grounding. **Deferred because** it is net-new capability surface (new public method + capabilities.yaml entry), not an in-place adoption.

3. **`tracing.startHar()` / `stopHar()` for OData capture** (`hasTracingHAR`) — Evaluate as a replacement/complement for the manual `page.route()` capture in `src/fixtures/odata-trace-fixtures.ts`. **Deferred because** it requires comparing fidelity/overhead against the current reporter pipeline before committing.

4. **`expect(page).toMatchAriaSnapshot()`** (`hasPageAriaSnapshot`) — Offer page-level aria assertions in matchers/docs. Low effort; bundle with item 2.

5. **`browser.on('context')` + context lifecycle events** (`hasBrowserContextEvent`) — Could simplify multi-context detection in `src/fixtures/browser-bind-fixture.ts` and navigation auto-wait in `stability-fixtures.ts`.

6. **`locator.drop()`** (`hasLocatorDrop`) — Expose a proxy capability for SAP attachment/upload flows (GOS/DMS).

7. **`locator.highlight({ style })` + `page.hideHighlight()`** (`hasLocatorHighlightStyle`) — Highlight controls during screencast recording in `src/fixtures/screencast-fixture.ts` for better debugging videos.

8. **`reporter.onError(error, workerInfo)`** — If any custom reporter later implements `onError`, accept the new optional `workerInfo` arg (`src/reporters/*`). No current reporter implements it, so nothing to change today.

9. **`consoleMessage.location()` `line`/`column`** — `lineNumber`/`columnNumber` are deprecated in 1.60. Grep confirms neither is used today; revisit if console-message parsing is added.

---

## Self-Review

- **Spec coverage:** Branch + CI-safe plan doc (Task 0), version bump (Task 1), browser binaries (Task 2), all 8 feature flags (Task 3), one concrete adoption with full branch coverage (Task 4), GitHub CI parity gate mirroring all 6 PR jobs (Task 5), PR (Task 6). Deferred items are explicitly out of executable scope with reasons. ✔
- **Review findings closed:** F1 (per-file branch-coverage gap) → Task 4 Step 8 adds `navigation-space-mocked.test.ts`. F3 (`@playwright/cli` scope creep) → dropped from Task 1 with rationale. GitHub check-in requirements → Task 5 enumerates each `ci.yml` job; the plan-doc markdownlint failure → Task 0 Step 2. ✔
- **Placeholder scan:** No `TBD`/`TODO`/"handle edge cases" — every code step shows exact code; every run step shows the command and expected output. ✔
- **Type consistency:** All 8 flag names are spelled identically across the interface (Task 3 Step 3), `detectFeatures` (Step 4), both test files, and the backlog table. `roleOptions` / `hasGetByRoleDescription` / `SectionLinkNavigationOptions.description` are consistent across Task 4 and the mocked test. ✔
- **Coverage proof:** The gate `description !== undefined && hasFeature(...)` has all three edges covered — undefined (existing tests), both-true (Task 4 main test), true-then-false (Task 4 mocked test) — so `perFile` branch thresholds hold. ✔
- **Ambiguity:** Each modified location is anchored to a current file path + line number from read-verified source. ✔
