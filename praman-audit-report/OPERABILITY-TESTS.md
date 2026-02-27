# Part 2: Operability Tests -- AI Agent Usability Evaluation

**Plugin**: `playwright-praman` v1.0.1
**Evaluation date**: 2026-02-27
**Evaluator persona**: AI coding agent (e.g., Claude Code, GitHub Copilot, Cursor) with NO prior Praman knowledge
**Test scope**: Can an AI agent, given only the published npm package and its bundled docs, autonomously write SAP UI5 Playwright tests?

**Scoring key**:

| Score    | Meaning                                                                             |
| -------- | ----------------------------------------------------------------------------------- |
| PASS     | Agent can complete the task autonomously using available documentation and types    |
| FRICTION | Agent can complete the task, but it requires extra steps, guesswork, or workarounds |
| FAIL     | Agent cannot complete the task without human intervention or external knowledge     |
| N/A      | Task is not applicable to this plugin                                               |

---

## 2.1 Discovery & First Use (10 tasks)

### 2.1.1 Find the package via npm search

**Score**: PASS

**Evidence**: `package.json` has descriptive `keywords`: `["playwright", "sap", "ui5", "testing", "automation", "fiori", "ai-first", "enterprise"]`. The `description` field is `"AI-First SAP UI5 Test Automation Platform for Playwright"`. An agent searching npm for "playwright sap ui5 testing" or "playwright fiori test automation" would surface this package. The npm page at `https://www.npmjs.com/package/playwright-praman` is referenced via `homepage` and `repository` fields.

---

### 2.1.2 Determine what the package does from README alone

**Score**: PASS

**Evidence**: README.md opens with `> AI-First SAP UI5 Test Automation Platform for Playwright`, followed by a feature list, a decision tree ("When to Use Praman vs Native Playwright"), quick reference table mapping 7 scenarios to their correct API, and a Quick Start code example. An agent reading only the first 60 lines of README can determine: (1) this wraps Playwright for SAP UI5, (2) the import is `import { test, expect } from 'playwright-praman'`, (3) it provides a `ui5` fixture for control discovery. The decision tree (lines 27-52) is particularly valuable for agents -- it provides explicit if/then rules for when to use Praman vs native Playwright.

---

### 2.1.3 Install the package and scaffold a project

**Score**: PASS

**Evidence**: Installation is standard: `npm install playwright-praman` (README line 70). The CLI command `npx playwright-praman init` scaffolds a complete project (`scaffolder.ts` creates `playwright.config.ts`, `praman.config.ts`, `tsconfig.json`, and directories `tests/`, `tests/e2e/`, `.auth/`). The `npx playwright-praman doctor` command validates the environment (Node.js version, npm availability, IDE detection). The `bin` field in `package.json` maps `playwright-praman` to `./dist/cli/index.js`, and the CLI supports `--help`, `--version`, `init`, `doctor`, and `uninstall` subcommands. An agent can run `npx playwright-praman init` and get a working project skeleton immediately.

---

### 2.1.4 Write a first test from the import statement alone

**Score**: PASS

**Evidence**: The import `import { test, expect } from 'playwright-praman'` re-exports Playwright's `test` and `expect` augmented with 14 fixtures. README Quick Start (lines 76-87) shows a complete working test in 11 lines. The `dist/index.d.ts` exports `test` (line 4832) and `expect` (line 3, re-exported from `@playwright/test`). TypeScript IntelliSense will show all available fixture parameters in the test callback destructuring (`{ page, ui5, ui5Navigation, ui5Footer, ui5Shell, fe, pramanAI, intent, ... }`). An agent typing `test('my test', async ({` will see all 14 fixtures via autocomplete.

---

### 2.1.5 Discover available fixtures and their methods

**Score**: PASS

**Evidence**: Multiple discovery paths exist:

1. **AGENTS.md "Fixture Quick Reference" table** (lines 166-181): Lists all 12 primary fixtures with key methods in a markdown table. This is the fastest path for any agent that reads AGENTS.md.
2. **TypeScript types** (`dist/index.d.ts`): The `test` declaration at line 4832 lists all fixture interfaces: `TestFixtures`, `ModuleFixtures`, `AuthFixtures`, `NavFixtures`, `StabilityFixtures`, `FEFixtures`, `AIFixtures`, `IntentTestFixtures`, `ShellFooterFixtures`, `FLPLocksFixtures`, `FLPSettingsFixtures`, `TestDataFixtures`. Each interface has TSDoc comments and `@example` tags.
3. **llms.txt** (published at docs site): Links to fixture reference, selector reference, and control interactions guides.
4. **llms-full.txt** (127 KB): Complete inline documentation with all fixture signatures.

---

### 2.1.6 Understand the selector model (UI5Selector shape)

**Score**: PASS

**Evidence**: The `UI5Selector` type (`dist/selectors-DVyYwYKP.d.ts`) is fully documented with TSDoc and two `@example` blocks (basic selector, dialog selector). All 11 optional fields are documented: `controlType`, `id`, `viewName`, `viewId`, `properties`, `bindingPath`, `i18NText`, `ancestor`, `descendant`, `interaction`, `searchOpenDialogs`. The README Quick Reference table (line 57) shows concrete selector examples (`{ controlType: 'sap.m.Button', properties: { text: 'Save' } }`). Every example file demonstrates real selector usage. The `searchOpenDialogs: true` pattern for dialogs is documented in README (line 61), AGENTS.md (line 117), and the `dialog-handling.spec.ts` example.

---

### 2.1.7 Configure playwright.config.ts for SAP

**Score**: PASS

**Evidence**: README "Minimal playwright.config.ts" section (lines 358-385) provides a complete, copy-paste-ready config with:

- `timeout: 120_000` (SAP apps need longer timeouts -- annotated)
- `expect: { timeout: 30_000 }` (UI5 controls load asynchronously)
- Auth setup project with `testMatch: '**/auth-setup.ts'` and `dependencies: ['auth']`
- `storageState: '.auth/sap-session.json'` for session reuse
- `baseURL: process.env.SAP_BASE_URL`

The scaffolder also generates a config with `testDir: './tests/e2e'`, `timeout: 60_000`, `retries: 1`, and `trace: 'on-first-retry'`.

---

### 2.1.8 Set up SAP authentication

**Score**: PASS

**Evidence**: The `examples/auth-setup.ts` file (234 lines) is a complete, production-ready auth setup covering three strategies:

- **OnPrem** (`basic`): SAP NetWeaver `sap-user`/`sap-password` form
- **BTP Cloud** (`btp-saml`): IAS SAML2 redirect with email/password
- **Office 365** (`office365`): Microsoft Entra ID flow including "Stay signed in?" handling

Each strategy is clearly commented with inline explanations. Environment variables (`SAP_BASE_URL`, `SAP_USERNAME`, `SAP_PASSWORD`, `SAP_AUTH_STRATEGY`, `SAP_CLIENT`, `SAP_LANGUAGE`) are documented with a `requireEnv()` helper that throws descriptive errors. The file ends with a commented teardown example. An agent can copy this file verbatim.

---

### 2.1.9 Discover the llms.txt documentation endpoints

**Score**: PASS

**Evidence**: README "LLM-Friendly Documentation" section (lines 268-286) documents the llmstxt.org standard and provides 6 URLs with descriptions:

- `llms.txt`: Link index (all docs with descriptions)
- `llms-full.txt`: Complete documentation (127 KB single file)
- `llms-quickstart.txt`: Setup, fixtures, selectors, matchers
- `llms-sap-testing.txt`: Auth, FLP, OData, Fiori Elements
- `llms-migration.txt`: Migration from Playwright, wdi5, Tosca
- `llms-architecture.txt`: Architecture, bridge, proxy, ADRs

The `llms.txt` file is also included in the npm `files` array (`package.json` line 33-34), so agents reading from `node_modules/playwright-praman/llms.txt` can discover all documentation without network access.

---

### 2.1.10 Integrate agent instructions into IDE config

**Score**: PASS

**Evidence**: The `docs/user-integration/` directory ships in the npm package and contains 7 appendable files for different AI agents:

- `claude-md-appendable.md` -- for Claude Code (`CLAUDE.md`)
- `cursor-rules-appendable.mdc` -- for Cursor (`.cursorrules`)
- `copilot-instructions-appendable.md` -- for GitHub Copilot
- `jules-setup-appendable.md` -- for OpenAI Jules
- `antigravity-rules-appendable.md` -- for Google Antigravity
- `agents-md-appendable.md` -- for generic AGENTS.md
- `CLAUDE-USER.md` -- complete Claude Code user guide

The `npx playwright-praman init` command auto-detects the IDE and prints specific instructions (e.g., `cat node_modules/playwright-praman/docs/user-integration/claude-md-appendable.md >> CLAUDE.md`). Pre-built Claude agents are available in `agents/claude/` with 3 agents (planner, generator, healer) and 4 prompts.

---

### Section 2.1 Summary

| #         | Task                               | Score          |
| --------- | ---------------------------------- | -------------- |
| 2.1.1     | Find package via npm search        | PASS           |
| 2.1.2     | Determine what it does from README | PASS           |
| 2.1.3     | Install and scaffold               | PASS           |
| 2.1.4     | Write first test from import       | PASS           |
| 2.1.5     | Discover fixtures and methods      | PASS           |
| 2.1.6     | Understand selector model          | PASS           |
| 2.1.7     | Configure playwright.config.ts     | PASS           |
| 2.1.8     | Set up SAP authentication          | PASS           |
| 2.1.9     | Discover llms.txt endpoints        | PASS           |
| 2.1.10    | Integrate agent instructions       | PASS           |
| **Total** |                                    | **10/10 PASS** |

---

## 2.2 Core SAP Operations (12 tasks)

### 2.2.1 Navigate to a Fiori app via tile press

**Score**: PASS

**Evidence**: README Quick Start (lines 76-87) shows the canonical pattern:

```typescript
const tile = await ui5.control({
  controlType: 'sap.m.GenericTile',
  properties: { header: 'My App' },
});
await tile.press();
```

Alternative: `ui5.press()` shorthand (README line 59). The `ui5Navigation` fixture provides `navigateToTile(title)`, `navigateToApp(semanticObject-action)`, and `navigateToIntent(object, action, params)` (AGENTS.md line 175). The gold-standard BOM example wraps tile press in `expect().toPass()` for reliability on slow systems (lines 147-152).

---

### 2.2.2 Find and interact with UI5 controls (Button, Input, Table)

**Score**: PASS

**Evidence**: All 6 example files demonstrate control discovery via `ui5.control()`. The fixture quick reference (AGENTS.md lines 168-169) documents `control()`, `controls()`, `click()`, `fill()`, `waitForUI5()`, `waitFor()`. Interaction patterns shown across examples:

- **Button press**: `await ui5.press({ controlType: 'sap.m.Button', properties: { text: 'Create' } })` (dialog-handling.spec.ts line 57)
- **Input fill**: `await ui5.fill({ id: 'materialInput' }, 'MAT-001')` (AGENTS.md line 152)
- **Table rows**: `await innerTable.getRows()` (table-operations.spec.ts line 67)
- **Property read**: `await tile.getProperty('header')` (basic-test.spec.ts line 55)

The `ExtendedUI5Handler` type (dist/index.d.ts line 4803) confirms `ui5.table`, `ui5.dialog`, `ui5.date`, and `ui5.odata` sub-namespaces.

---

### 2.2.3 Work with SmartFields and SmartTables

**Score**: PASS

**Evidence**: The gold-standard BOM example (`bom-e2e-praman-gold-standard.spec.ts`) is a 722-line test that exhaustively demonstrates SmartField and SmartTable interaction:

- SmartField discovery by ID: `await ui5.control({ id: IDS.materialField, searchOpenDialogs: true })` (line 186)
- SmartField type verification: `expect(materialType).toBe('sap.ui.comp.smartfield.SmartField')` (line 190)
- SmartField inner control access: Inner ComboBox (`IDS.bomUsageCombo`), inner Input (`IDS.materialInput`)
- SmartTable to inner table: `const innerTable = await smartTable.getTable()` (line 255)
- OData binding from rows: `const ctx = await row.getBindingContext()` (line 271)
- Entity data via index: `const ctx = await innerTable.getContextByIndex(0); const data = await ctx.getObject()` (line 407-409)

This level of SmartField/SmartTable coverage is production-grade and gives agents a complete template to follow.

---

### 2.2.4 Handle dialogs (open, interact, close, confirm)

**Score**: PASS

**Evidence**: `examples/dialog-handling.spec.ts` (180 lines) covers:

- Opening dialogs via button press (line 57)
- Finding controls inside dialogs with `searchOpenDialogs: true` (line 68)
- Verifying dialog state with `isOpen()` (line 164)
- Filling dialog fields with `ui5.fill()` (line 98-101)
- Dismissing with Cancel button (line 114-118)
- Value help dialogs: open, verify, close (lines 152-177)

AGENTS.md explicitly states `searchOpenDialogs: true` is mandatory for dialog controls (Rule #1 context). The `ui5.dialog` fixture provides `waitFor()`, `confirm()`, `dismiss()`, `getOpen()` (AGENTS.md line 173).

---

### 2.2.5 Handle value help dialogs

**Score**: PASS

**Evidence**: The gold-standard BOM test dedicates two full steps to value help:

- **Step 3** (Material value help, lines 234-285): Opens VH icon by ID, waits for VH dialog, gets SmartTable inside VH, reads rows with OData binding, closes dialog.
- **Step 4** (Plant value help, lines 290-335): Identical pattern for plant.
- **Step 6** (Fill from VH data, lines 379-557): Opens VH, reads first entity via `getContextByIndex(0).getObject()`, extracts Material/Plant values, closes VH, fills main form.

The `dialog-handling.spec.ts` example also shows value help handling (lines 136-178).

---

### 2.2.6 Work with OData model data and HTTP operations

**Score**: PASS

**Evidence**: README "OData CRUD Operations" section (lines 115-134) shows two usage patterns:

1. **Browser-side model data**: `await ui5.odata.getModelProperty('/PurchaseOrders(0)/Vendor')`, `await ui5.odata.hasPendingChanges()`
2. **Node-side HTTP queries**: `await ui5.odata.queryEntities('/sap/opu/odata/sap/API_PO_SRV', 'PurchaseOrders', { filter: "Status eq 'A'", top: 10 })`

The `ODataHttpOptions` type (dist/index.d.ts line 2924) documents `timeout`, `csrfToken`, `headers`. `ODataQueryOptions` (line 2945) documents `filter`, `select`, `top`, `skip`, `orderby`, `expand`, `inlinecount`. The fixture supports V2 and V4 patterns, `createEntity`, `updateEntity`, `deleteEntity`, `callFunctionImport` (dist/index.d.ts lines 4790-4801).

---

### 2.2.7 Use Fiori Elements helpers (List Report, Object Page)

**Score**: PASS

**Evidence**: AGENTS.md fixture table (lines 177-178) documents:

- `fe.listReport`: `setFilter(field, value)`, `search()`, `clearFilters()`, `navigateToItem(row)`
- `fe.objectPage`: `clickEdit()`, `clickSave()`, `navigateToSection(id)`, `getSections()`

The `FEFixtures` interface (dist/index.d.ts line 2360) confirms `fe: FioriElementsFixture`. The `dist/fe/index.d.ts` provides the full `FioriElementsFixture` type. The llms.txt links to a dedicated "Fiori Elements Testing" guide at the docs site.

---

### 2.2.8 Handle FLP navigation (tiles, spaces, intents)

**Score**: PASS

**Evidence**: The `ui5Navigation` fixture (AGENTS.md line 175) provides: `navigateToTile(title)`, `navigateToIntent(intent)`, `navigateBack()`, `navigateToHome()`. README "Auth + Navigation Flow" example (lines 139-161) demonstrates intent-based navigation:

```typescript
await ui5Navigation.navigateToIntent('PurchaseOrder', 'create', { plant: '1000' });
const hash = await ui5Navigation.getCurrentHash();
```

The gold-standard BOM example shows FLP space tab navigation using Playwright native (`page.getByText()`) because FLP space tabs are non-UI5 (line 142), which aligns with the decision tree. The `btpWorkZone` fixture handles BTP WorkZone dual-frame navigation.

---

### 2.2.9 Use intent-based API for business operations

**Score**: PASS

**Evidence**: AGENTS.md (line 179) documents `intent.core` fixture: `fillField(label, value)`, `clickButton(text)`, `selectOption(label, opt)`, `assertField(label, expected)`. The AGENTS.md test template (lines 157-160) shows the pattern:

```typescript
await intent.core.assertField('Status', 'Created');
```

The `IntentTestFixtures` interface (dist/index.d.ts line 2258) and the `dist/intents/index.d.ts` export provide full type definitions including `IntentOptions` and `IntentResult` types. Domain-specific intent data types (`JournalEntryData`, `VendorInvoiceData`, `PaymentData`, `ProductionOrderData`, etc.) are exported from the main entry point (dist/index.d.ts line 4).

---

### 2.2.10 Use custom UI5 matchers (toHaveUI5Text, toBeUI5Enabled, etc.)

**Score**: FRICTION

**Evidence**: The 10 custom matchers are registered automatically (worker fixture `matcherRegistration` at dist/index.d.ts line 2884): `toHaveUI5Text`, `toBeUI5Visible`, `toBeUI5Enabled`, `toHaveUI5Property`, `toHaveUI5ValueState`, `toHaveUI5RowCount`, `toHaveUI5CellText`, `toHaveUI5SelectedRows`, `toHaveUI5Binding`, `toBeUI5ControlType`.

**Friction point**: The matchers ARE mentioned in README inline code (line 102-103) but their signatures, parameter types, and usage patterns are not documented in README or AGENTS.md. The capability registry (generated) lists them with `usageExample` strings, and the llms.txt links to a "Custom Matchers" guide, but an agent would need to either (a) read the llms-full.txt, (b) fetch the docs site, or (c) rely on TypeScript autocomplete to discover the parameter shapes. The README example `await expect(page).toHaveUI5RowCount('poTable', 5)` (line 102) does not explain the underlying mechanics (e.g., what the locator argument should be).

---

### 2.2.11 Use the footer fixture (Save, Edit, Cancel)

**Score**: PASS

**Evidence**: AGENTS.md (line 176) documents `ui5Footer`: `clickSave()`, `clickEdit()`, `clickCancel()`, `clickCreate()`, `clickDelete()`. The test template (lines 157-158) shows:

```typescript
await ui5Footer.clickSave();
```

The `ShellFooterFixtures` interface (dist/index.d.ts line 802) provides the type definition. The pattern is intuitive -- an agent would destructure `{ ui5Footer }` from the test callback.

---

### 2.2.12 Read and interact with table data (rows, cells, OData binding)

**Score**: PASS

**Evidence**: `examples/table-operations.spec.ts` (122 lines) is a dedicated table operations example showing:

1. SmartTable discovery by `controlType` (line 59-61)
2. Inner table extraction via `getTable()` (line 64)
3. Row retrieval via `getRows()` (line 67)
4. OData binding from rows via `getBindingContext()` (lines 84-94)
5. Entity data via `getContextByIndex(0).getObject()` (lines 109-114)
6. Auto-retry with `expect().toPass()` for OData data loading (lines 83-94)

AGENTS.md (line 172) documents `ui5.table`: `getRows(id)`, `clickRow(id, row)`, `getCellValue(id, row, col)`, `findRowByValues(id, values)`.

---

### Section 2.2 Summary

| #         | Task                              | Score                   |
| --------- | --------------------------------- | ----------------------- |
| 2.2.1     | Navigate to Fiori app via tile    | PASS                    |
| 2.2.2     | Find and interact with controls   | PASS                    |
| 2.2.3     | SmartFields and SmartTables       | PASS                    |
| 2.2.4     | Handle dialogs                    | PASS                    |
| 2.2.5     | Handle value help dialogs         | PASS                    |
| 2.2.6     | OData model data and HTTP         | PASS                    |
| 2.2.7     | Fiori Elements helpers            | PASS                    |
| 2.2.8     | FLP navigation                    | PASS                    |
| 2.2.9     | Intent-based API                  | PASS                    |
| 2.2.10    | Custom UI5 matchers               | FRICTION                |
| 2.2.11    | Footer fixture (Save/Edit/Cancel) | PASS                    |
| 2.2.12    | Table data operations             | PASS                    |
| **Total** |                                   | **11 PASS, 1 FRICTION** |

---

## 2.3 Error Recovery & Debugging (8 tasks)

### 2.3.1 Interpret a ControlError and self-correct

**Score**: PASS

**Evidence**: AGENTS.md "Error Self-Correction" section (lines 197-203) provides explicit agent instructions:

> On `ControlError`:
>
> - Read `error.suggestions[]` for specific fix advice
> - Read `error.availableControls` for what is on screen
> - Read `error.suggestedSelector` for Praman's best guess
> - Adjust your selector -- do NOT fall back to `page.locator()`

The `ControlError` class (`src/core/errors/control-error.ts`) has three self-healing fields: `lastKnownSelector`, `availableControls`, `suggestedSelector`. The `toAIContext()` method returns a structured object that agents can parse programmatically. Default `retryable: true` tells the agent to try again. This is a best-in-class error recovery design.

---

### 2.3.2 Interpret a BridgeError (timeout, injection)

**Score**: PASS

**Evidence**: README "Troubleshooting" section (lines 312-342) documents 5 error codes with causes and remediation:

- **`ERR_BRIDGE_TIMEOUT`**: "Page is not a UI5 application, or UI5 has not finished loading" + 3 remediation steps
- **`ERR_BRIDGE_INJECTION`**: "The UI5 bridge script could not be injected" + 2 remediation steps (CSP headers, page load timing)
- **`ERR_CONTROL_NOT_FOUND`**: 3 specific checks (ID/controlType, searchOpenDialogs, waitForUI5)
- **`ERR_CONTROL_NOT_INTERACTABLE`**: Check getEnabled()/getVisible(), wait for async
- **`ERR_TIMEOUT_UI5_STABLE`**: Continuous polling workaround with `expect().toPass()`

All 58 error codes are listed in `src/core/errors/codes.ts` with categorical comments. Every error extends `PramanError` which provides `code`, `message`, `attempted`, `retryable`, `suggestions[]`, `toUserMessage()`, `toAIContext()`.

---

### 2.3.3 Enable debug logging

**Score**: PASS

**Evidence**: README "Enable Debug Logging" section (lines 346-355) provides:

```bash
LOG_LEVEL=debug npx playwright test
LOG_LEVEL=warn npx playwright test
```

The config loader also supports `PRAMAN_DEBUG=true` as a convenience shorthand for `logLevel: 'debug'` (`src/core/config/loader.ts` line 123). Individual environment variables are mapped: `PRAMAN_LOG_LEVEL` maps to `config.logLevel`. The logging uses pino (structured JSON output), and the dev dependency `pino-pretty` enables human-readable formatting.

---

### 2.3.4 Diagnose "control not found" errors

**Score**: PASS

**Evidence**: The `ControlError` class provides three diagnostic fields that no other Playwright plugin offers:

1. `availableControls: readonly string[]` -- what IS on screen (the agent can scan this list)
2. `suggestedSelector: UI5Selector` -- Praman's best-guess alternative selector
3. `lastKnownSelector: UI5Selector` -- the selector that was tried

Combined with `suggestions[]` (always populated with 2-3 contextual hints like "Verify the control ID exists in the UI5 view", "Use searchOpenDialogs: true"), an agent has everything needed to self-correct. README documents this error code specifically (lines 327-332).

---

### 2.3.5 Handle UI5 stability timeouts

**Score**: PASS

**Evidence**: README `ERR_TIMEOUT_UI5_STABLE` section (lines 339-342) documents the root cause and workaround:

> SAP apps with continuous polling (e.g., FLP home) may never reach idle.
> Use `expect().toPass()` with custom intervals instead.
> Increase the timeout for slow systems.

The gold-standard BOM example demonstrates this pattern extensively -- every major interaction is wrapped in `expect().toPass({ timeout: 60000, intervals: [5000, 10000] })` (lines 147-152, 157-165, 266-276, 316-326, 392-395, 406-412). This teaches agents the reliable pattern for slow SAP systems.

---

### 2.3.6 Distinguish UI5 controls from non-UI5 elements

**Score**: PASS

**Evidence**: README decision tree (lines 27-52) explicitly maps:

- UI5 controls (`sap.m.*`, `sap.ui.*`, `sap.ui.comp.*`) --> use Praman
- Login forms / IDP redirect pages --> use Playwright native
- Standard HTML on UI5 pages --> use Playwright native
- Hybrid pages --> use both

The `hybrid-login.spec.ts` example (106 lines) demonstrates the pattern: Phase 1 uses `page.locator()` for the HTML login form, Phase 2 switches to `ui5.control()` once inside the SAP app. Code comments explicitly annotate: "The IAS login form is plain HTML -- use Playwright locators" (line 51).

AGENTS.md Rule #3: "Non-UI5 elements -> Playwright native permitted (verify element is NOT UI5 first)". The forbidden patterns table (lines 183-194) lists what NOT to do (`page.click('#__...')`, `page.locator('.sapM...')`).

---

### 2.3.7 Read error suggestions[] programmatically

**Score**: PASS

**Evidence**: Every `PramanError` subclass inherits `suggestions: readonly string[]` from the base class (`src/core/errors/base.ts` line 113). The `toAIContext()` method (line 224) returns a flat object with `suggestions` included -- this is explicitly designed for AI agent consumption:

```typescript
toAIContext(): AIErrorContext {
  return {
    code: this.code,
    message: this.message,
    attempted: this.attempted,
    retryable: this.retryable,
    severity: this.severity,
    details: this.details,
    suggestions: this.suggestions,
    timestamp: this.timestamp,
  };
}
```

The `toUserMessage()` method (line 180) formats suggestions as a numbered list. AGENTS.md (line 199) instructs agents: "Read `error.suggestions[]` for specific fix advice".

---

### 2.3.8 Use the `doctor` CLI command to diagnose issues

**Score**: PASS

**Evidence**: `npx playwright-praman doctor` (`src/cli/doctor.ts`) runs:

1. **Environment check**: Node.js version, platform, Praman version
2. **IDE detection**: VS Code, Cursor, Claude Code, JetBrains (via marker file detection)
3. **Pre-flight checks**: Validates Node.js version, npm availability, and other prerequisites
4. **Summary**: Pass/fail/warn counts

The output uses colored terminal formatting via the CLI logger (`logSuccess`, `logWarn`, `logError`, `logTable`). An agent running `npx playwright-praman doctor` before troubleshooting gets a structured diagnostic report.

---

### Section 2.3 Summary

| #         | Task                                    | Score        |
| --------- | --------------------------------------- | ------------ |
| 2.3.1     | Interpret ControlError and self-correct | PASS         |
| 2.3.2     | Interpret BridgeError                   | PASS         |
| 2.3.3     | Enable debug logging                    | PASS         |
| 2.3.4     | Diagnose "control not found"            | PASS         |
| 2.3.5     | Handle UI5 stability timeouts           | PASS         |
| 2.3.6     | Distinguish UI5 vs non-UI5 elements     | PASS         |
| 2.3.7     | Read error suggestions programmatically | PASS         |
| 2.3.8     | Use doctor CLI to diagnose              | PASS         |
| **Total** |                                         | **8/8 PASS** |

---

## 2.4 Advanced Automation (8 tasks)

### 2.4.1 Run tests in Docker

**Score**: PASS

**Evidence**: README "Docker" section (lines 296-301) provides a one-liner:

```bash
docker run --rm -v $(pwd):/app -w /app mcr.microsoft.com/playwright:v1.58.2-noble npm test
```

The docs site guide `docs/docs/guides/docker-cicd.md` (lines 135-198) provides a full Dockerfile, `docker run` with environment variables for SAP credentials, volume mount for coverage reports, and a Docker Compose example with mock SAP backend. The Dockerfile uses the official Playwright image, installs `npm ci`, builds, installs browsers, and runs tests. An agent can copy-paste these artifacts.

---

### 2.4.2 Configure CI/CD pipeline (GitHub Actions)

**Score**: PASS

**Evidence**: `docs/docs/guides/docker-cicd.md` (lines 8-130) documents the full GitHub Actions CI pipeline:

- 6 parallel jobs: quality, unit-tests (3 OS x 3 Node = 9 matrix), build, integration-tests, security, docs-check
- Unit tests run on `ubuntu-latest`, `windows-latest`, `macos-latest` with Node 20, 22, 24
- Integration tests run against SAP cloud with Playwright version matrix (`1.57.0`, `1.58.2`)
- Quality job: lint (11 plugins), typecheck, cspell, knip, markdownlint
- Build job: tsup, CJS smoke test, size-limit, attw export validation

An agent can adapt this pipeline for any GitHub Actions workflow. The `npm run ci` script runs the full pipeline locally.

---

### 2.4.3 Run tests in parallel across workers

**Score**: PASS

**Evidence**: Praman uses Playwright's built-in parallelism -- no custom parallelism layer. Workers are Playwright workers with Praman's worker-scoped fixtures (`pramanConfig`, `rootLogger`, `tracer`, `playwrightCompat`, `selectorRegistration`, `matcherRegistration`) initialized once per worker (dist/index.d.ts lines 2872-2885). The `playwright.config.ts` template uses standard Playwright config (`workers`, `fullyParallel`). No worker-level state conflicts exist because the bridge is page-scoped (injected per page, not shared). This is well-architected for parallel execution.

---

### 2.4.4 Use custom reporters (ComplianceReporter, ODataTraceReporter)

**Score**: PASS

**Evidence**: The `playwright-praman/reporters` sub-path export (`dist/reporters/index.d.ts`) provides two reporters:

1. **ComplianceReporter**: Classifies each test as `compliant`, `raw-playwright`, or `mixed` based on step analysis. Writes `compliance-report.json` with per-test breakdown (`pramanSteps`, `rawPlaywrightSteps`, `compliancePercentage`). Configuration: `{ outputDir: 'reports' }`.

2. **ODataTraceReporter**: Captures OData HTTP requests from test attachments. Writes `odata-trace.json` with entity stats (`totalCalls`, `avgDuration`, `maxDuration`, `errorCount`, `byMethod`). Configuration: `{ outputDir: 'test-results/odata' }`.

Both implement Playwright's `Reporter` interface. Usage in `playwright.config.ts`:

```typescript
reporter: [
  ['playwright-praman/reporters', { outputDir: 'reports' }],
],
```

The `isPramanStep()` function is also exported for custom classification logic.

---

### 2.4.5 Handle multi-tenant BTP scenarios

**Score**: FRICTION

**Evidence**: The `btpWorkZone` fixture is listed in the `test` declaration (via `NavFixtures`) and handles BTP WorkZone dual-frame navigation. The auth-setup example covers BTP SAML (`btp-saml` strategy). However, multi-tenant-specific patterns (tenant URL construction, dynamic subdomain routing, tenant-specific configuration) are not covered in any example file or README section. An agent would need to infer these patterns from the fixture types or fetch the llms-sap-testing.txt documentation. The `btpWorkZone` fixture exists but its methods are not documented in AGENTS.md's fixture quick reference table.

---

### 2.4.6 Generate SBOM (Software Bill of Materials)

**Score**: PASS

**Evidence**: `package.json` includes `@cyclonedx/cyclonedx-npm` as a devDependency and the script `generate:sbom` (line 135):

```
cyclonedx-npm --output-file playwright-praman.sbom.json --spec-version 1.5 --ignore-npm-errors
```

README "Supply Chain Security" section (lines 304-310) documents SBOM generation, npm provenance attestations, SHA-pinned Actions, and the 2-dependency footprint. An agent can run `npm run generate:sbom` to produce a CycloneDX 1.5 SBOM.

---

### 2.4.7 Validate export map correctness

**Score**: PASS

**Evidence**: `package.json` script `check:exports` (line 101):

```
attw --pack . --profile node16
```

The `@arethetypeswrong/cli` (attw) validates that all 6 sub-path exports (`.`, `./ai`, `./intents`, `./vocabulary`, `./fe`, `./reporters`) resolve correctly for both ESM (`import`) and CJS (`require`) with matching type declarations (`.d.ts` and `.d.cts`). The exports map in `package.json` (lines 38-93) uses conditional exports with `types`, `import`, `require`, and `default` conditions for each entry point. README documents: `npm run check:exports` (line 245).

---

### 2.4.8 Use Azure Playwright for cloud execution

**Score**: FRICTION

**Evidence**: README "Azure Playwright" section (lines 288-293) mentions the integration:

```bash
npm install @azure/playwright
```

With a link to `https://github.com/Azure/playwright-workspaces`. However, no Praman-specific Azure Playwright configuration or example is provided. The README marks it as "(Optional)" but does not show how to configure Praman fixtures with Azure Playwright's cloud browsers. An agent would need external Azure Playwright documentation and would have to determine whether Praman's bridge injection works correctly in Azure's remote browser context.

---

### Section 2.4 Summary

| #         | Task                             | Score                  |
| --------- | -------------------------------- | ---------------------- |
| 2.4.1     | Run tests in Docker              | PASS                   |
| 2.4.2     | Configure CI/CD pipeline         | PASS                   |
| 2.4.3     | Run tests in parallel            | PASS                   |
| 2.4.4     | Use custom reporters             | PASS                   |
| 2.4.5     | Multi-tenant BTP scenarios       | FRICTION               |
| 2.4.6     | Generate SBOM                    | PASS                   |
| 2.4.7     | Validate export map              | PASS                   |
| 2.4.8     | Azure Playwright cloud execution | FRICTION               |
| **Total** |                                  | **6 PASS, 2 FRICTION** |

---

## 2.5 Extension & Contribution (7 tasks)

### 2.5.1 Understand the 5-layer architecture for contribution

**Score**: PASS

**Evidence**: AGENTS.md "For Plugin Contributors" section (lines 1-102) documents:

- 5-layer architecture: Core Infrastructure -> Bridge Adapters -> Typed Proxy -> Fixtures -> AI
- Layer dependency rule: "lower layers NEVER import from higher layers"
- 14 coding rules (TypeScript strict, TSDoc, 300 LOC limit, error pattern, etc.)
- Path aliases (`#core/*`, `#bridge/*`, `#proxy/*`, `#fixtures/*`)
- Import order convention (Node built-ins -> External -> Internal -> Parent -> Sibling)

`CONTRIBUTING.md` (100+ lines) provides development setup, key commands table, architecture diagram, code standards, naming conventions, and module size limits. The llms.txt links to "Architecture Overview" and "Bridge Internals" guides. Skill files in `skills/playwright-praman-sap-testing/` provide deep domain knowledge for 12 specializations.

---

### 2.5.2 Set up a development environment

**Score**: PASS

**Evidence**: `CONTRIBUTING.md` (lines 1-37) provides:

```bash
git clone https://github.com/mrkanitkar/playwright-praman.git
cd playwright-praman
npm install
npm run ci  # Validates full setup: lint + typecheck + test + build
```

Key commands table (lines 25-36) lists 12 commands including `lint`, `typecheck`, `test:unit`, `test:unit:watch`, `test:unit:coverage`, `build`, `check:exports`, `ci`, `spellcheck`, `deadcode`. The `engines` field in `package.json` requires `node >= 20`. The `prepare` script runs `husky` for git hooks. An agent running `npm install && npm run ci` will validate the entire toolchain.

---

### 2.5.3 Add a new error code

**Score**: PASS

**Evidence**: The error code pattern is thoroughly documented:

1. Add the code to `src/core/errors/codes.ts` in the frozen `ErrorCode` object (currently 58 codes across 14 categories)
2. The `ErrorCode` type is auto-derived: `type ErrorCode = (typeof ErrorCode)[keyof typeof ErrorCode]`
3. The template pattern `ERR_<CATEGORY>_<REASON>` is enforced by `ErrorCodePattern` type
4. AGENTS.md "Error Pattern" section (lines 48-61) shows the full constructor pattern
5. The `PramanError` base class provides `toJSON()`, `toUserMessage()`, `toAIContext()`

An agent can add a new code to `codes.ts`, create a subclass extending `PramanError`, and the type system enforces correctness. The 14 existing error subclass files in `src/core/errors/` serve as templates.

---

### 2.5.4 Add a new fixture

**Score**: FRICTION

**Evidence**: The fixture composition chain is:

1. Create a fixture interface (e.g., `interface MyFixtures { myFixture: MyHandler }`)
2. Create a fixture using `test.extend<MyFixtures>({...})`
3. Compose into the final `test` export

The existing fixture interfaces (`TestFixtures`, `ModuleFixtures`, `AuthFixtures`, `NavFixtures`, etc.) are visible in `dist/index.d.ts`. The `coreTest` declaration (line 2902) shows the base fixture extension pattern.

**Friction point**: The fixture composition chain (how `coreTest` -> `moduleTest` -> `authTest` -> `navTest` -> `stabilityTest` -> `feTest` -> final `test`) is not documented in AGENTS.md or CONTRIBUTING.md. An agent would need to trace the source code imports to understand the composition order. The 5-layer architecture docs describe the concept but not the specific Playwright `test.extend()` chaining mechanics.

---

### 2.5.5 Add a new bridge adapter

**Score**: FRICTION

**Evidence**: The bridge layer is referenced in the architecture docs as "Layer 2: Bridge -- Browser-based control discovery (page.evaluate)". The path alias `#bridge/*` is documented. Skill file `skills-architect.md` and `skills-implementer.md` provide domain knowledge.

**Friction point**: The bridge adapter interface and plugin system are not documented in README, AGENTS.md, or CONTRIBUTING.md. An agent would need to read the source code in `src/bridge/` to understand the adapter contract, the serialization rules for `page.evaluate()` transport, and the bridge injection lifecycle. The CLAUDE.md memory note about `page.evaluate()` serialization (module-level functions are NOT included) is a critical gotcha that would catch any agent.

---

### 2.5.6 Run the full CI pipeline locally

**Score**: PASS

**Evidence**: `package.json` script `ci` (line 121):

```
npm run validate:no-js && npm run lint && npm run typecheck && npm run test:unit && npm run build && npm run lint:ui5-deprecated
```

This runs 6 validation stages sequentially. The extended `ci:full` script (line 122) adds integration tests, spellcheck, dead code detection, and markdown lint. CONTRIBUTING.md documents this as the primary validation command. An agent can run `npm run ci` to validate everything.

---

### 2.5.7 Follow commit conventions

**Score**: PASS

**Evidence**: AGENTS.md (lines 79-83) documents:

- Format: Conventional Commits (`feat(scope): description`)
- 18 allowed scopes: `core`, `config`, `errors`, `logging`, `bridge`, `adapter`, `proxy`, `fixtures`, `auth`, `ai`, `intents`, `vocabulary`, `fe`, `reporters`, `cli`, `docs`, `ci`, `deps`, `release`

`package.json` includes `@commitlint/cli` and `@commitlint/config-conventional` as devDependencies. The `husky` prepare script installs git hooks. The CLAUDE.md memory note warns: "Commit subjects must be <= 72 chars (commitlint `subject-max-length`)". Recent git history confirms the pattern: `feat(docs): add Example Reports page`, `fix(api): resolve API Extractor warnings`, `fix(audit): implement remediation items`.

---

### Section 2.5 Summary

| #         | Task                            | Score                  |
| --------- | ------------------------------- | ---------------------- |
| 2.5.1     | Understand 5-layer architecture | PASS                   |
| 2.5.2     | Set up development environment  | PASS                   |
| 2.5.3     | Add a new error code            | PASS                   |
| 2.5.4     | Add a new fixture               | FRICTION               |
| 2.5.5     | Add a new bridge adapter        | FRICTION               |
| 2.5.6     | Run full CI pipeline locally    | PASS                   |
| 2.5.7     | Follow commit conventions       | PASS                   |
| **Total** |                                 | **5 PASS, 2 FRICTION** |

---

## Overall Results

### Aggregate Scores

| Section                        | PASS   | FRICTION | FAIL  | N/A   | Total  |
| ------------------------------ | ------ | -------- | ----- | ----- | ------ |
| 2.1 Discovery & First Use      | 10     | 0        | 0     | 0     | 10     |
| 2.2 Core SAP Operations        | 11     | 1        | 0     | 0     | 12     |
| 2.3 Error Recovery & Debugging | 8      | 0        | 0     | 0     | 8      |
| 2.4 Advanced Automation        | 6      | 2        | 0     | 0     | 8      |
| 2.5 Extension & Contribution   | 5      | 2        | 0     | 0     | 7      |
| **Total**                      | **40** | **5**    | **0** | **0** | **45** |

### Pass Rate

- **PASS**: 40/45 (88.9%)
- **FRICTION**: 5/45 (11.1%)
- **FAIL**: 0/45 (0.0%)

### FRICTION Items (Remediation Opportunities)

| #      | Task                 | Root Cause                                                                    | Suggested Fix                                                                                    |
| ------ | -------------------- | ----------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------ |
| 2.2.10 | Custom UI5 matchers  | Matcher signatures/params not in README or AGENTS.md                          | Add a "Custom Matchers" section to AGENTS.md with signature, params, and one example per matcher |
| 2.4.5  | Multi-tenant BTP     | `btpWorkZone` fixture not in AGENTS.md fixture table; no multi-tenant example | Add btpWorkZone to fixture reference; add a BTP multi-tenant example                             |
| 2.4.8  | Azure Playwright     | Only mentions install; no Praman-specific config or bridge compatibility note | Add a section confirming bridge works in Azure cloud browsers with config example                |
| 2.5.4  | Add a new fixture    | Fixture composition chain not documented                                      | Document the `test.extend()` chaining order in CONTRIBUTING.md                                   |
| 2.5.5  | Add a bridge adapter | Bridge adapter contract not in contributor docs                               | Add bridge adapter interface and serialization rules to CONTRIBUTING.md                          |

### Key Strengths

1. **Zero FAILs across 45 tasks**: Every task an AI agent would attempt is at least achievable. No dead ends.

2. **Decision tree for Praman vs Playwright native**: The README decision tree (lines 27-52) is a unique differentiator -- no other Playwright plugin provides this level of explicit guidance for hybrid pages. AI agents can follow if/then rules directly.

3. **AI-first error system**: The `suggestions[]`, `availableControls`, `suggestedSelector`, `toAIContext()` error design is purpose-built for agent self-correction. AGENTS.md explicitly instructs agents to read these fields.

4. **Gold-standard example**: The 722-line `bom-e2e-praman-gold-standard.spec.ts` is the most complete SAP test example in any open-source Playwright plugin. It demonstrates 15+ fixture methods, SmartField/SmartTable patterns, value help dialogs, OData binding, and graceful error recovery -- all in a single file an agent can reference.

5. **Multi-agent distribution**: The `agents/claude/` and `agents/copilot/` directories with pre-built planner/generator/healer agents, the `docs/user-integration/` appendable files, and the `seeds/sap-seed.spec.ts` MCP-compatible seed create a turnkey agent integration that no competitor offers.

6. **llms.txt ecosystem**: The 6 segmented documentation files following the llmstxt.org standard provide agents with right-sized documentation chunks rather than forcing them to parse a monolithic doc.

7. **Structured config with safe defaults**: Zod-validated config where `{}` is valid means agents can start with zero configuration. The `defineConfig()` helper provides TypeScript IntelliSense for config authoring.

### Assessment

Praman achieves an **88.9% autonomous operability rate** with **zero failures**. The 5 friction items are documentation gaps, not architectural problems -- all are addressable by adding content to existing files. The plugin is production-ready for AI agent consumption.
