# Praman for Claude Code Users — Complete Setup Guide

A standalone guide for using Claude Code to generate SAP UI5 tests with `playwright-praman`.

---

## What is Praman?

An Agent-First SAP UI5 Test Automation Plugin for Playwright.
Single import: `import { test, expect } from 'playwright-praman'`
All UI5 interactions via fixtures — no class imports, no raw selectors.

## Installation

```bash
npm install -D playwright-praman @playwright/test
npx playwright install chromium
```

## Project Setup

### 1. playwright.config.ts

```typescript
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  timeout: 120_000, // SAP apps need longer timeouts
  expect: { timeout: 30_000 },
  projects: [
    // Auth setup — runs first, saves session
    {
      name: 'auth',
      testMatch: '**/auth-setup.ts',
    },
    // Main tests — reuse saved session
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        storageState: '.auth/sap-session.json',
        baseURL: process.env['SAP_BASE_URL'],
      },
      dependencies: ['auth'],
    },
  ],
});
```

### 2. Environment Variables

```bash
SAP_BASE_URL=https://your-sap-system.example.com
SAP_USERNAME=TEST_USER
SAP_PASSWORD=<your-password>
SAP_AUTH_STRATEGY=basic    # 'basic' | 'btp-saml' | 'office365'
SAP_CLIENT=100             # OnPrem only
```

### 3. Authentication Setup

```bash
# Copy example auth setup
mkdir -p tests
cp node_modules/playwright-praman/examples/auth-setup.ts tests/auth-setup.ts

# Add session storage to .gitignore
echo '.auth/' >> .gitignore
```

### 4. TypeScript Configuration

For full type resolution of sub-path exports, set `moduleResolution` in `tsconfig.json`:

```json
{
  "compilerOptions": {
    "module": "Node16",
    "moduleResolution": "Node16"
  }
}
```

## Claude Code Agent Setup

```bash
# 1. Initialize Praman (detects Claude Code and installs agents)
npx playwright-praman init

# 2. Copy Praman SAP agents
cp node_modules/playwright-praman/agents/claude/*.md .claude/agents/
cp node_modules/playwright-praman/agents/claude/prompts/*.md .claude/prompts/

# 3. Copy seed file for agent-driven auth
cp node_modules/playwright-praman/seeds/sap-seed.spec.ts tests/seeds/

# 4. Append Claude Code instructions to your CLAUDE.md
cat node_modules/playwright-praman/docs/user-integration/claude-md-appendable.md >> CLAUDE.md
```

### Available Agents

| Agent                  | Purpose                                               |
| ---------------------- | ----------------------------------------------------- |
| `praman-sap-planner`   | Explore SAP app, discover controls, produce test plan |
| `praman-sap-generator` | Generate compliant tests from plan (100% Praman)      |
| `praman-sap-healer`    | Fix failing tests, enforce compliance                 |

### Using Agents

```text
# Plan tests for your SAP app
Select agent: praman-sap-planner
"Plan tests for the Purchase Order Fiori application"

# Generate tests from plan
Select agent: praman-sap-generator
"Generate tests from specs/purchase-order.plan.md"

# Fix failing tests
Select agent: praman-sap-healer
"Fix failing test tests/e2e/purchase-order/create.spec.ts"

# Full pipeline: plan → generate → heal
Use /praman-sap-coverage prompt
```

## The 7 Mandatory Rules

1. EVERY UI5 element → `ui5.control()` + proxy methods ONLY
2. NEVER use Playwright native selectors for UI5 elements (`page.click('#__...')`, `page.locator('.sapM...')`)
3. Non-UI5 elements → Playwright native permitted (verify element is NOT UI5 first)
4. `import { test, expect } from 'playwright-praman'` — the ONLY valid import
5. Auth via seed — raw Playwright auth in seed file, NEVER `sapAuth.login()` in test body
6. Post-generation: scan against 16+ forbidden patterns before writing test
7. TSDoc compliance header in every generated test

## SAP Pages Are Always Hybrid

Every SAP page is a mix of UI5 controls, Web Components, and plain DOM elements.
A single test will typically use **all three** interaction styles. The rule is per-element, not per-page:

| Element Type                                                          | How to Identify                                 | API                                                       |
| --------------------------------------------------------------------- | ----------------------------------------------- | --------------------------------------------------------- |
| **UI5 Classic controls** (`sap.m.*`, `sap.ui.comp.*`, `sap.ui.mdc.*`) | `sap.ui.getCore().byId()` returns a control     | `ui5.control()` + proxy methods                           |
| **UI5 controls inside dialogs**                                       | Same as above, but in a dialog overlay          | `ui5.control()` + `searchOpenDialogs: true`               |
| **UI5 Web Components** (`ui5-button`, `ui5-input`, etc.)              | Custom element tag starts with `ui5-`           | Playwright native: `page.locator('ui5-button')`           |
| **SAP login / IDP pages** (IAS, Azure AD, OnPrem)                     | Plain HTML forms, no UI5 bootstrap              | Playwright native: `page.locator()`, `page.fill()`        |
| **FLP shell chrome** (space tabs, user menu)                          | Shell header rendered as plain DOM              | Playwright native: `page.getByText()`, `page.getByRole()` |
| **Custom HTML fragments** on a UI5 page                               | Standard HTML inside UI5 views                  | Playwright native: `page.locator()`                       |
| **Fiori Elements pages** (List Report, Object Page)                   | Standard UI5 controls generated by FE framework | `fe.listReport.*`, `fe.objectPage.*`                      |

**Typical test flow** — uses all three in a single test:

```typescript
import { test, expect } from 'playwright-praman';

test('hybrid SAP page', async ({ page, ui5, ui5Navigation, fe }) => {
  // Auth page (plain DOM) — handled by seed, not here

  // FLP shell (DOM) — navigate via Praman fixture
  await ui5Navigation.navigateToTile('Manage Purchase Orders');

  // UI5 controls — always Praman
  const btn = await ui5.control({ controlType: 'sap.m.Button', properties: { text: 'Create' } });
  await btn.press();

  // Dialog with UI5 controls inside
  await ui5.dialog.waitFor();
  const field = await ui5.control({ id: 'vendorInput', searchOpenDialogs: true });
  await field.setValue('SUP-001');
  await field.fireChange({ value: 'SUP-001' });
  await ui5.waitForUI5();

  // Web Component on the same page (if present)
  await page.locator('ui5-button[text="Upload"]').click();

  // Custom HTML fragment
  await page.locator('#custom-chart-container canvas').click();
});
```

## Test Template

```typescript
/**
 * {App Name} E2E Test
 *
 * COMPLIANCE: 100% Praman fixture-only
 * Forbidden Pattern Scan: PASSED
 */
import { test, expect } from 'playwright-praman';

test.describe('{App Name} Tests', () => {
  test('Complete scenario - single session', async ({
    page,
    ui5,
    ui5Navigation,
    ui5Footer,
    intent,
    fe,
  }) => {
    await test.step('Step 1: Navigate', async () => {
      await ui5Navigation.navigateToTile('App Name');
      await ui5.waitForUI5();
    });

    await test.step('Step 2: Fill form (gold pattern)', async () => {
      const input = await ui5.control({ id: 'materialInput' });
      await input.setValue('MAT-001');
      await input.fireChange({ value: 'MAT-001' });
      await ui5.waitForUI5();
    });

    await test.step('Step 3: Save and verify', async () => {
      await ui5Footer.clickSave();
      await ui5.dialog.confirm();
      await intent.core.assertField('Status', 'Created');
    });
  });
});
```

## Fixture Quick Reference

| Fixture              | Key Methods                                                                                                |
| -------------------- | ---------------------------------------------------------------------------------------------------------- |
| `ui5`                | `control()`, `controls()`, `click()`, `fill()`, `waitForUI5()`, `waitFor()`                                |
| `ui5.table`          | `getRows(id)`, `clickRow(id, row)`, `getCellValue(id, row, col)`, `findRowByValues(id, values)`            |
| `ui5.dialog`         | `waitFor()`, `confirm()`, `dismiss()`, `getOpen()`                                                         |
| `ui5.date`           | `setDatePicker(id, date)`, `getDatePicker(id)`, `setDateRange(id, start, end)`                             |
| `ui5.odata`          | `getModelData(path)`, `createEntity(url, set, data)`, `queryEntities(url, set)`                            |
| `ui5Navigation`      | `navigateToTile(title)`, `navigateToIntent(intent)`, `navigateBack()`, `navigateToHome()`                  |
| `ui5Footer`          | `clickSave()`, `clickEdit()`, `clickCancel()`, `clickCreate()`, `clickDelete()`                            |
| `ui5Shell`           | `expectShellHeader()`, `clickHome()`, `openNotifications()`, `openUserMenu()`                              |
| `fe.listReport`      | `setFilter(field, value)`, `search()`, `clearFilters()`, `navigateToItem(row)`                             |
| `fe.objectPage`      | `clickEdit()`, `clickSave()`, `navigateToSection(id)`, `getSections()`                                     |
| `intent.core`        | `fillField(label, value)`, `clickButton(text)`, `selectOption(label, opt)`, `assertField(label, expected)` |
| `intent.procurement` | `createPurchaseOrder(data)`, `approvePurchaseOrder(data)`, `searchPurchaseOrders(criteria)`                |
| `sapAuth`            | `login(page, config)`, `loginFromEnv(page)` — **seed file only, NEVER in tests**                           |
| `pramanAI`           | `discoverPage()`, `buildContext()`, `capabilities`, `recipes`                                              |

## Control Type to Method Lookup

| Control                             | Method                                                            |
| ----------------------------------- | ----------------------------------------------------------------- |
| `sap.m.Button`                      | `.press()`                                                        |
| `sap.m.Input`                       | `.setValue(v)` + `.fireChange({ value: v })` + `ui5.waitForUI5()` |
| `sap.m.Select`                      | `.setSelectedKey(key)`                                            |
| `sap.m.ComboBox`                    | `.open()` → `.setSelectedKey(key)` → `.close()`                   |
| `sap.m.CheckBox`                    | `.press()`                                                        |
| `sap.m.Link`                        | `.press()`                                                        |
| `sap.m.DatePicker`                  | `ui5.date.setDatePicker(id, '2026-01-15')`                        |
| `sap.m.TextArea`                    | `.setValue(text)` + `.fireChange({ value: text })`                |
| `sap.m.Table`                       | `ui5.table.getRows(id)` / `ui5.table.clickRow(id, row)`           |
| `sap.m.Dialog`                      | `ui5.dialog.waitFor()` / `ui5.dialog.confirm()`                   |
| `sap.m.GenericTile`                 | `.press()` (FLP tile: `ui5Navigation.navigateToTile()`)           |
| `sap.ui.comp.smartfield.SmartField` | Discover inner control via `-input`, `-comboBoxEdit` suffix       |
| `sap.ui.comp.smarttable.SmartTable` | `(await smartTable.getTable())` → inner table proxy               |

## Forbidden Patterns

| Forbidden                               | Replacement                    |
| --------------------------------------- | ------------------------------ |
| `page.click('#__...')`                  | `ui5.control().press()`        |
| `page.fill('#__...')`                   | `ui5.control().setValue()`     |
| `page.locator('[data-sap-ui]')`         | `ui5.control()`                |
| `page.locator('.sapM...')`              | `ui5.control({ controlType })` |
| `from '@playwright/test'`               | `from 'playwright-praman'`     |
| `from 'dhikraft'`                       | `from 'playwright-praman'`     |
| `page.waitForTimeout(...)`              | `ui5.waitForUI5()` or polling  |
| `new UI5Handler(...)`                   | Use fixture `ui5` directly     |
| `.initialize()` / `.injectBridgeLate()` | Removed — fixtures auto-init   |
| `sapAuth.login()` in test body          | Auth belongs in seed file only |

## Error Self-Correction

Praman throws typed `PramanError` subclasses. When you encounter errors:

**`ERR_CONTROL_NOT_FOUND`** — No UI5 control matches the selector.

- Read `error.suggestions[]` for specific fix advice
- Read `error.availableControls` for what controls are on screen
- Read `error.suggestedSelector` for Praman's best guess
- Try `searchOpenDialogs: true` if the control is inside a dialog
- Adjust your selector — do NOT fall back to `page.locator()`

**`ERR_BRIDGE_TIMEOUT`** — Page is not a UI5 app, or UI5 has not loaded.

- Verify the URL points to a UI5/Fiori application
- Add `await page.waitForLoadState('domcontentloaded')` before the first `ui5.*` call

**`ERR_TIMEOUT_UI5_STABLE`** — UI5 did not reach stable state.

- SAP apps with continuous polling may never reach idle
- Use `expect().toPass()` with custom intervals instead
- Increase the timeout for slow systems

## Sub-path Exports

| Export                         | Description                      |
| ------------------------------ | -------------------------------- |
| `playwright-praman`            | Core fixtures, proxy, bridge     |
| `playwright-praman/ai`         | AI/LLM service, agentic handler  |
| `playwright-praman/intents`    | Intent wrappers, registries      |
| `playwright-praman/vocabulary` | SAP vocabulary, control mappings |
| `playwright-praman/fe`         | SAP Fiori Elements helpers       |
| `playwright-praman/reporters`  | Custom Playwright reporters      |

## LLM Documentation (llmstxt.org)

For deeper context, point Claude to these documentation files:

| File                                                            | Content                        |
| --------------------------------------------------------------- | ------------------------------ |
| `node_modules/playwright-praman/llms.txt`                       | Link index with descriptions   |
| `node_modules/playwright-praman/llms-full.txt`                  | Complete docs in a single file |
| [llms-full.txt (web)](https://praman.dev/llms-full.txt)         | Same content, hosted           |
| [llms-sap-testing.txt](https://praman.dev/llms-sap-testing.txt) | SAP auth, FLP, OData, Fiori    |

## Skill & Reference Files

For the complete capability map, V2/V4 patterns, and selector shapes:

- `node_modules/playwright-praman/skills/playwright-praman-sap-testing/SKILL.md` — full 596-line skill reference
- `node_modules/playwright-praman/skills/playwright-praman-sap-testing/ai-quick-reference.md` — copy-paste patterns
- `node_modules/playwright-praman/skills/playwright-praman-sap-testing/test-template.ts` — working example
