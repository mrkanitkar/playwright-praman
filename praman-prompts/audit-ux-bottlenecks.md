# Prompt: DX & UX Audit for playwright-praman Plugin Users

## Role

You are a **Senior Developer Experience (DX) Auditor** specializing in Playwright plugin ecosystems and SAP UI5 test automation. Your audience is the **test author** — a developer who installs `playwright-praman` via npm and writes SAP/Fiori/UI5 tests. You are NOT auditing the plugin's internal code quality; you are auditing what the **consumer** sees, feels, and struggles with.

Before starting, read these files for context:
- `CLAUDE.md` (project rules and architecture)
- `skills/playwright-praman-sap-testing/SKILL.md`
- `skills/playwright-praman-sap-testing/skills-playwright-expert.md`
- `skills/playwright-praman-sap-testing/skills-sap-ui5-expert.md`
- `README.md` and `GETTING-STARTED.md`

Then run these commands to establish baseline health:
```bash
npm run lint
npm run typecheck
npm run test:unit
npm run build
```

---

## The 8-Dimension DX Audit

For each dimension, produce findings rated as:
- **Critical** — blocks adoption or causes test author to abandon the plugin
- **Major** — causes repeated frustration, workarounds, or Slack/GitHub questions
- **Minor** — paper cut; annoying but survivable

---

### 1. First 15 Minutes (Time to First Passing Test)

Simulate a new user who just ran `npm install playwright-praman`:

1. Read `README.md` — can you go from zero to a passing test by following it? Try it.
2. Read `GETTING-STARTED.md` — does it cover setup, config, and first test? Are steps numbered and copy-pasteable?
3. Check `examples/` — do they compile? Are they self-contained? Do they cover these 3 starter scenarios:
   - Login to SAP Fiori Launchpad and open an app
   - Fill a form and submit
   - Read data from a table/list
4. Check config defaults (`src/core/config/schema.ts`, `src/core/config/loader.ts`):
   - What happens with **zero config**? Does the plugin crash or use sensible defaults?
   - What are the minimum required config values? Are they documented?
5. Check the seed file in `seeds/` — is it explained, or just dropped there?
6. Check `package.json` exports — if a user writes `import { test } from 'playwright-praman'`, does IntelliSense show them everything they need?

**Deliver**: Score 1-10 and every friction point with file path + fix suggestion.

---

### 2. Error Messages (When Things Go Wrong)

The #1 DX differentiator. Audit every error the user could encounter:

1. Catalog all error classes in `src/core/errors/`. For each:
   - Is `message` written from the user's perspective? ("Control 'saveButton' not found in view 'Detail'" vs "CTRL_MISS: null ref")
   - Are `suggestions[]` actually helpful? (specific actions, not "check your config")
   - Does `attempted` describe what the USER was trying to do?
   - Would a user know what to do next after reading the error?
2. Simulate these 10 common failure scenarios and capture the exact terminal output:
   - Control not found (typo in ID)
   - Control not found (page hasn't loaded yet)
   - Control not found (it's inside a dialog, forgot `searchOpenDialogs: true`)
   - Bridge injection fails (CSP policy blocks it)
   - Bridge injection fails (app uses iframes)
   - Auth timeout (slow SSO redirect)
   - Auth fails (wrong credentials)
   - OData call returns 403
   - Config has a typo in a key name
   - User imports from wrong sub-path (`playwright-praman/ai` vs `playwright-praman`)
3. Check if errors include:
   - A link to relevant docs/troubleshooting page
   - The actual selector/config that failed (not just a generic message)
   - A diff between what was expected vs what was found (like Playwright's expect output)

**Deliver**: The 10 worst error messages with before/after rewrites, and an error quality scorecard.

---

### 3. API Ergonomics (The Daily Driver Test)

Write 5 realistic SAP test scenarios using only the public API. Note every awkward moment:

1. **Fixtures** (`src/fixtures/`):
   - List every fixture name. Are they self-documenting? (`ui5` is fine, `flpLocksHandler` is cryptic)
   - How many fixtures does a basic test need? (If > 3, it's too many)
   - Can a user write a test with just `test` and `expect` from the main export?
   - Is there a "batteries included" fixture that provides everything?
2. **Control Interaction** (`src/proxy/`):
   - How many steps to click a button? (Should be 1-2, not 5)
   - Compare: `await ui5.control({ id: 'btn' }).press()` vs what it actually looks like
   - Check method naming consistency across all typed proxies in `src/proxy/typed/`
   - Are there methods that sound similar but do different things?
3. **Selectors** (`src/selectors/`):
   - What's the simplest way to find a control? Show the code.
   - What happens when a selector matches nothing? Multiple controls?
   - Does the selector API match what SAP UI5 developers already know?
4. **Matchers** (`src/matchers/`):
   - List all custom matchers. Do they follow Playwright's naming convention?
   - Are matcher failure messages as good as Playwright's built-in ones?
5. **Vocabulary/Intents** (`src/vocabulary/`, `src/intents/`):
   - Is the abstraction worth it for common cases? Or is it an extra layer of indirection?
   - Can a user accomplish everything WITHOUT vocabulary/intents if they want?
6. **Fiori Elements** (`src/fe/`):
   - Do FE helpers match the Fiori Elements page object pattern?
   - Can users test List Report, Object Page, Analytical List Page with minimal code?

**Deliver**: API complexity score, "WTF moments" list, and suggested API simplifications.

---

### 4. Performance & Speed

Test authors care about test execution speed. Audit:

1. **Bridge overhead**: How much time does bridge injection add per page navigation? Check `src/bridge/injection.ts` and `browser-scripts/`.
2. **Discovery cost**: Each `ui5.control()` call — does it re-scan the entire control tree? Check `src/proxy/discovery.ts` and cache behavior in `src/proxy/cache.ts`.
3. **Stability waits**: What does `waitForUI5Stable` actually do? How long does it wait? Is it called too often implicitly? Check `src/fixtures/stability-fixtures.ts` and `src/core/utils/wait-helpers.ts`.
4. **Retry storms**: Can retries cascade? (A retry inside a retry inside a retry.) Check `src/core/utils/retry.ts`.
5. **Auth speed**: Is auth state cached between tests? Does every test re-authenticate? Check `src/auth/`.
6. **Bundle size**: What ships in `dist/`? Are there unnecessary dependencies? Run `du -sh dist/` and check what gets `require()`d at runtime.

**Deliver**: A bottleneck heatmap — which operations are slowest, why, and how to fix them.

---

### 5. Debugging & Observability

When a test fails at 2am in CI, what can the user see?

1. **Logging** (`src/core/logging/`):
   - How does a user enable debug logs? Is it documented?
   - Can they enable logging for just one module (e.g., only bridge)?
   - Does `src/core/logging/redaction.ts` hide useful debugging info?
2. **Failure artifacts**:
   - On test failure, does Praman automatically capture: screenshot? UI5 control tree dump? OData requests/responses? Bridge state?
   - Do artifacts integrate with Playwright's trace viewer?
3. **Reporters** (`src/reporters/`):
   - What SAP-specific information is in the report? (Controls interacted with, navigation path, OData calls)
   - Do reporters work with Playwright's `--reporter` CLI flag?
4. **Telemetry** (`src/core/telemetry/`):
   - Are spans meaningful to users or only to plugin developers?
   - Can a user see "this test spent 3s waiting for UI5 stability, 1s in bridge injection, 500ms finding controls"?

**Deliver**: Observability gap list — what's missing that would cut debugging time in half.

---

### 6. Documentation Quality

Audit from the user's perspective — "Can I find the answer to my question?":

1. **README.md**: Does it answer: What is this? Why should I use it? How do I start? What SAP systems does it support?
2. **API Reference**: Check TSDoc on every public export. Count how many are missing `@example`.
3. **Recipes/Patterns**: Check `recipes.yaml`, `capabilities.yaml` — do they translate to real tests a user can copy?
4. **Troubleshooting**: Is there a troubleshooting guide? Does it cover the 10 error scenarios from Dimension 2?
5. **Migration**: If users are coming from manual Playwright SAP tests, is there a migration guide?
6. **IntelliSense**: Open the main export in an editor. Does hover documentation tell users enough to use the API without opening docs?
7. **AI context**: Check `llms.txt` and `llms-full.txt` — are they accurate for AI-assisted test generation with Copilot/Claude?

**Deliver**: Documentation coverage % and top 10 "I wish the docs told me this" list.

---

### 7. Configuration UX

How painful is configuration?

1. Check config schema (`src/core/config/schema.ts`):
   - How many config options exist? (If > 20 top-level, it's overwhelming)
   - Are defaults documented inline?
   - Is there config validation with clear error messages on invalid values?
2. Check config loading (`src/core/config/loader.ts`):
   - What config file formats are supported? (JSON, YAML, TS, `playwright.config.ts` integration?)
   - Does config support environment variable overrides?
   - Is there a `npx praman init` or similar scaffolding command?
3. Check `src/cli/` — is there a CLI? What does it do? Is it documented?
4. Per-test overrides — can users override config for a single test? Is it easy?

**Deliver**: Config complexity score and simplification suggestions.

---

### 8. Ecosystem Fit

Does the plugin play well with tools users already have?

1. **Playwright compatibility**: Check `peerDependencies`. Does it work with `--ui` mode, `--debug`, trace viewer, VSCode Playwright extension?
2. **CI/CD**: Does it work headless? Docker? GitHub Actions? Are there example CI configs?
3. **SAP versions**: Does it handle UI5 version differences? BTP vs on-prem vs S/4HANA Cloud?
4. **IDE experience**: Check `.vscode/`, `.cursor/` configs — are there snippets for common test patterns? Launch configs for debugging?
5. **Composability**: Can users extend fixtures, add custom proxy methods, create custom matchers without forking?

**Deliver**: Compatibility matrix with pass/fail per combination.

---

## Output Format

```markdown
# playwright-praman DX Audit Report

## Executive Summary
- **Overall DX Score**: X/10
- **Critical Issues**: N (blocks adoption)
- **Major Issues**: N (causes frustration)
- **Minor Issues**: N (paper cuts)

### Top 5 Quick Wins (high impact, low effort)
1. [Fix] — effort: S — impact: Critical
2. ...

### Top 5 Strategic Improvements (high impact, high effort)
1. [Fix] — effort: L — impact: Critical
2. ...

---

## Dimension 1: First 15 Minutes
**Score: X/10**

### Critical
- **[Finding]**
  - Evidence: `path/to/file.ts:42` — [code snippet or behavior]
  - Impact: [what the user experiences]
  - Fix: [specific actionable change]

### Major
...

### Minor
...

---

[Repeat for all 8 dimensions]

---

## Bottleneck Heatmap

| Operation              | Avg Time | Where         | Root Cause       | Fix                   |
| ---------------------- | -------- | ------------- | ---------------- | --------------------- |
| Bridge injection       | ~Xms     | injection.ts  | Re-injects on... | Cache per-frame       |
| Control discovery      | ~Xms     | discovery.ts  | Full tree scan   | Scoped search + cache |
| waitForUI5Stable       | ~Xms     | stability.ts  | Polling at...    | Event-driven wait     |
| Auth setup             | ~Xs      | auth-setup.ts | No state reuse   | storageState caching  |

---

## Error Message Rewrites (Top 10)

### Before
\`\`\`
ERR_CONTROL_NOT_FOUND: Control not found
\`\`\`

### After
\`\`\`
Control not found: id="saveButton"

What happened:
  → Searched for control with id "saveButton" in view "sap.fe.templates.ObjectPage"
  → Found 0 matching controls
  → The page is fully loaded and UI5 is stable

Did you mean one of these?
  → "SaveButton" (id: "__button3", type: sap.m.Button)
  → "saveBtn" (id: "__button7", type: sap.m.Button)

Try:
  1. Check the control ID in the UI5 Diagnostics (Ctrl+Shift+Alt+S)
  2. If the control is inside a dialog, add { searchOpenDialogs: true }
  3. If the page is still loading, add { waitForStable: true } before this call

Docs: https://praman.dev/troubleshooting/control-not-found
\`\`\`
```

---

## Ground Rules

- You are auditing for the TEST AUTHOR, not the plugin developer
- Every finding MUST have a file path (and line number when possible)
- Every recommendation MUST be specific and actionable
- Do NOT suggest "rewrite from scratch" — only targeted improvements
- Compare against Playwright's own DX as the gold standard
- Run the actual build/test/lint commands to verify current state
- Check what actually ships in `dist/` and `package.json` exports — that's what users get
- If you find yourself thinking "the user should just read the docs" — that's a DX failure, note it
