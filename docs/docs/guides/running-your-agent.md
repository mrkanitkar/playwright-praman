---
title: Running Your Agent for the First Time
description: 'Step-by-step guide to run Praman AI agents: plan, generate, heal, and produce gold-standard SAP Playwright tests autonomously.'
keywords:
  - praman ai agent run
  - sap test generation ai
  - playwright sap gold standard test
  - praman planner generator healer
  - sap ui5 test automation agent
---

# Running Your Agent for the First Time

:::info[In this guide]

- Launch the planner agent to discover UI5 controls on a live SAP system
- Review the structured test plan output with control maps and test scenarios
- Generate a production-ready Playwright test script from the plan
- Use the healer agent to fix failing tests iteratively
- Produce a gold-standard `.spec.ts` ready for CI/CD

:::

From business process to Playwright test — autonomously. This guide walks you through the complete
flow of using Praman's AI agents to discover an SAP application, generate a test plan, produce a
gold-standard test script, and iterate until it passes.

## Prerequisites Checklist

:::warning Playwright 1.59+ MCP Server
If using MCP-based agents, install `@playwright/mcp` separately — it is no longer bundled with Playwright 1.59+.

```bash
npm install @playwright/mcp
```

CLI agents (files with `-cli` suffix) do not need this package.
:::

Before launching your agent, verify the following files exist in your project. All paths are relative to your project root.

### Agent Definitions

```text
.github/agents/praman-sap-planner.agent.md
.github/agents/praman-sap-generator.agent.md
.github/agents/praman-sap-healer.agent.md
```

:::warning Missing agents?
If these files don't exist, run `npx playwright-praman init` (see [Agent & IDE Setup](./agent-setup)).
:::

### Skill Files

```text
.github/skills/sap-test-automation/SKILL.md
.github/skills/sap-test-automation/ai-quick-reference.md
```

These are read by all three agents. They ship inside the `playwright-praman` package and are copied by `init`.

### Copilot Instructions

Verify that `.github/copilot-instructions.md` contains the Praman section. If not, append it:

```bash
cat node_modules/playwright-praman/docs/user-integration/copilot-instructions-appendable.md >> .github/copilot-instructions.md
```

### Seed File

```text
tests/seeds/sap-seed.spec.ts
```

The seed authenticates against your SAP system and keeps the browser open for the MCP server. It uses raw Playwright (no Praman fixtures).

### Environment Variables

Create a `.env` file with your SAP credentials:

```bash
SAP_CLOUD_BASE_URL=https://your-system.s4hana.cloud.sap/
SAP_CLOUD_USERNAME=your-sap-user
SAP_CLOUD_PASSWORD=your-sap-password
SAP_AUTH_STRATEGY=btp-saml
# Aliases: 'cloud-saml' → 'btp-saml', 'onprem' → 'basic',
#           'azure-ad'/'entra' → 'office365'
```

:::danger
Never commit `.env` to version control. Add it to `.gitignore`.
:::

## The Complete Flow

```text
┌─────────────────────────────────────────────────────────┐
│  1. PLAN    →  2. GENERATE  →  3. HEAL  →  4. GOLD     │
│                                                         │
│  Planner       Generator       Healer      Production   │
│  explores      converts        fixes       test ready   │
│  live SAP      plan to         failing     for CI/CD    │
│  app           test code       tests                    │
└─────────────────────────────────────────────────────────┘
```

## Step 1: Launch the Planner Agent

Open **GitHub Copilot MCP Chat** (or Claude Code) and paste the following prompt. Replace the test case steps with your own business scenario.

### Prompt Template

```text
Goal: Create SAP test case and test script

1. Use praman SAP planner agent:
   .github/agents/praman-sap-planner.agent.md

2. Login using credentials in .env file and use Chrome in headed mode.
   Do not use sub-agents.

3. Ensure you use UI5 query and capture UI5 methods at each step.
   Use UI5 methods for all control interactions.

4. Use seed file: tests/seeds/sap-seed.spec.ts

5. Here is the test case:

   Login to SAP and ensure you are on the landing page.

   Step 1: Navigate to Maintain Bill of Material app and click Create BOM
     - expect: Create BOM dialog opens with all fields visible

   Step 2: Select Material via Value Help — pick a valid material
     - expect: Material field is populated with selected material

   Step 3: Select Plant via Value Help — pick plant matching the material
     - expect: Plant field is populated with selected plant

   Step 4: Select BOM Usage "Production (1)" from dropdown
     - expect: BOM Usage field shows "Production (1)"

   Step 5: Verify all required fields are filled before submission
     - expect: Material field has a value
     - expect: BOM Usage field has value "Production (1)"
     - expect: Valid From date is set
     - expect: Create BOM button is enabled

   Step 6: Click "Create BOM" submit button in dialog footer
     - expect: If valid combination — dialog closes, BOM created,
       user returns to list report
     - expect: If invalid combination — error message dialog appears

   Step 7: If error occurs, close error dialog and cancel
     - expect: Error dialog closes
     - expect: Create BOM dialog closes
     - expect: User returns to list report

Output:
  - Test plan: specs/
  - Test script: tests/e2e/sap-cloud/
```

### What Happens Next

The agent will:

1. **Launch the MCP server** and open Chrome in headed mode
2. **Authenticate** using credentials from `.env` via the seed file
3. **Navigate** to the SAP Fiori Launchpad and open your target app
4. **Discover UI5 controls** — runs `browser_run_code` to query the UI5 control tree, capturing:
   - Control IDs, types, and properties
   - Value Help structures (inner tables, columns, sample data)
   - MDC Field vs SmartField framework detection
   - Required fields, button states, dialog structure
5. **Produce a test plan** in `specs/` with:
   - Application overview (UI5 version, OData version, control framework)
   - Full UI5 control map (every discovered ID, type, and value help)
   - Test scenarios with step-by-step UI5 method references
6. **Generate the test script** in `tests/e2e/sap-cloud/`

## Step 2: Review the Test Plan Output

The planner produces a structured test plan. Here is what a typical plan looks like:

<details>
<summary>Example: bom-create-flow.plan.md (click to expand)</summary>

```markdown
# BOM Create Complete Flow — Test Plan

## Application Overview

- **App**: SAP S/4HANA Cloud - Maintain Bill of Material (Version 2)
- **Type**: Fiori Elements V4 List Report with Create BOM Action Parameter Dialog
- **UI5 Version**: 1.142.x
- **OData Version**: V4
- **Control Framework**: MDC (sap.ui.mdc) — NOT SmartField (sap.ui.comp)

## Discovery Date

[Auto-filled] — Live discovery via Playwright MCP + browser_run_code

## UI5 Control Map (Discovered)

### List Report — Toolbar

| Control    | Type         | Text       |
| ---------- | ------------ | ---------- |
| Create BOM | sap.m.Button | Create BOM |
| Go         | sap.m.Button | Go         |

### Create BOM Dialog (sap.m.Dialog)

| Control           | Type                        | Required |
| ----------------- | --------------------------- | -------- |
| Material (outer)  | sap.ui.mdc.Field            | true     |
| Material (inner)  | sap.ui.mdc.field.FieldInput | true     |
| Plant (outer)     | sap.ui.mdc.Field            | false    |
| Plant (inner)     | sap.ui.mdc.field.FieldInput | false    |
| BOM Usage (outer) | sap.ui.mdc.Field            | true     |
| BOM Usage (inner) | sap.ui.mdc.field.FieldInput | true     |
| Valid From        | sap.m.DatePicker            | false    |
| Create BOM (btn)  | sap.m.Button                | —        |
| Cancel (btn)      | sap.m.Button                | —        |

### Value Help: Material

| Property    | Value                          |
| ----------- | ------------------------------ |
| VH Type     | sap.ui.mdc.ValueHelp           |
| Inner Table | sap.ui.table.Table             |
| Columns     | Material, Material Description |

### Value Help: Plant

| Property    | Value                             |
| ----------- | --------------------------------- |
| VH Type     | sap.ui.mdc.ValueHelp              |
| Inner Table | sap.ui.table.Table                |
| Columns     | Plant, Plant Name, Valuation Area |

### Value Help: BOM Usage

| Property | Value                                                                                   |
| -------- | --------------------------------------------------------------------------------------- |
| Type     | sap.ui.mdc.ValueHelp — Suggest popover (dropdown)                                       |
| Options  | Production (1), Engineering/Design (2), Universal (3), Plant Maintenance (4), Sales (5) |

## UI5 Methods Used (Praman Proxy)

| Method                       | Used For                                     |
| ---------------------------- | -------------------------------------------- |
| ui5.control({ id })          | Find MDC Field, Button, Dialog by stable ID  |
| ui5.press({ id })            | Click buttons (Create BOM, VH icons, Cancel) |
| ui5.fill({ id }, value)      | Set field value (setValue + fireChange)      |
| ui5.waitForUI5()             | Wait for UI5 busyIndicator / OData calls     |
| ui5.getValue({ id })         | Read MDC FieldInput display value            |
| control.setValue(key)        | Set MDC Field key programmatically           |
| control.getProperty(prop)    | Read text, enabled, title                    |
| control.getRequired()        | Check required fields                        |
| control.isOpen()             | Check ValueHelp/Dialog open state            |
| control.close()              | Close ValueHelp dialog                       |
| innerTable.getContextByIndex | Get OData binding from VH table row          |
| ctx.getObject()              | Extract entity data from binding context     |

## Test Scenarios

### Scenario 1: Complete BOM Creation Flow

**Steps:**

1. Navigate to BOM App (FLP → tab → tile)
2. Open Create BOM Dialog — verify all fields
3. Select Material via Value Help
4. Select Plant via Value Help
5. Set BOM Usage to Production (1)
6. Verify all required fields
7. Submit Create BOM (handle success or error)
8. Verify return to List Report

### Scenario 2: Validation Error Handling

**Steps:**

1. Navigate & Open Dialog
2. Select an invalid Material + Plant combination
3. Set BOM Usage
4. Submit — verify error dialog appears
5. Close error dialog — verify Create BOM dialog preserved
6. Cancel — verify return to List Report
```

</details>

:::tip What to look for
Review the **UI5 Control Map** — it should list every control the planner discovered with correct IDs and types. If a control is missing, re-run the planner with a more specific test case description.
:::

## Step 3: Review the Generated Test Script

The generator produces a test script using `playwright-praman` fixtures. The output follows the gold standard format:

<details>
<summary>Example: bom-create-flow-gold.spec.ts structure (click to expand)</summary>

```typescript
// tests/e2e/sap-cloud/bom-create-flow-gold.spec.ts
import { test, expect } from 'playwright-praman';

// ── Control ID Constants (from discovery) ───────────────────────
const SRVD = 'com.sap.gateway.srvd.your_service.v0001';
const APP = 'your.app.namespace::YourListReport';

const IDS = {
  createBOMToolbarBtn: `${APP}--fe::table::...`,
  dialog: `fe::APD_::${SRVD}.CreateBOM`,
  dialogOkBtn: `fe::APD_::${SRVD}.CreateBOM::Action::Ok`,
  dialogCancelBtn: `fe::APD_::${SRVD}.CreateBOM::Action::Cancel`,
  materialField: 'APD_::Material',
  materialInner: 'APD_::Material-inner',
  materialVHIcon: 'APD_::Material-inner-vhi',
  // ... all discovered IDs
} as const;

test.describe('BOM Create Complete Flow', () => {
  test('Complete BOM Create — single session', async ({ page, ui5 }) => {
    // Step 1: Navigate to BOM App
    await test.step('Step 1: Navigate to BOM Maintenance App', async () => {
      await page.goto(process.env.SAP_CLOUD_BASE_URL!);
      // ... FLP navigation using ui5.press() for tiles
    });

    // Step 2: Open Dialog and Verify Fields
    await test.step('Step 2: Open Create BOM Dialog', async () => {
      await ui5.press({ id: IDS.createBOMToolbarBtn });
      // controlType is required for typed proxy access (getRequired, isOpen, etc.)
      const materialField = await ui5.control({
        id: IDS.materialField,
        controlType: 'sap.ui.comp.smartfield.SmartField',
        searchOpenDialogs: true,
      });
      expect(await materialField.getRequired()).toBe(true);
      // ... verify all fields
    });

    // Step 3-5: Fill form via Value Helps and proxy methods
    // Step 6: Verify all required fields
    // Step 7: Submit and handle error recovery
    // Step 8: Verify return to List Report
  });
});
```

</details>

**Key characteristics of generated test scripts:**

| Aspect            | Pattern                                                                |
| ----------------- | ---------------------------------------------------------------------- |
| Import            | `import { test, expect } from 'playwright-praman'` only                |
| Control IDs       | Constants extracted from live discovery                                |
| UI5 interactions  | 100% Praman fixtures (`ui5.control()`, `ui5.press()`, `ui5.fill()`)    |
| Playwright native | Only for FLP tab navigation (`page.getByText()`) and `page.goto()`     |
| Value Help        | `innerTable.getContextByIndex(n).getObject()` for OData binding        |
| Error recovery    | Graceful `try/catch` — close error dialogs, cancel, verify List Report |
| Annotations       | `test.info().annotations.push()` for rich HTML report output           |

## Step 4: Convert to Gold Standard Format

The initial generated script may not be in full Praman gold standard format. To upgrade it, attach the script in your MCP chat and prompt:

```text
Convert the attached test script to Praman gold standard format.
```

The agent will:

- Add the Apache-2.0 license header
- Add the TSDoc compliance report block
- Ensure 100% Praman fixture usage for UI5 elements
- Add `test.step()` wrappers with descriptive names
- Add `test.info().annotations` for rich reporting
- Ensure `searchOpenDialogs: true` on all dialog controls
- Apply `toPass()` retry patterns for slow SAP systems

## Step 5: Debug and Heal

The generated test may not pass on the first run. SAP systems have varying response times, async OData loads, and environment-specific quirks.

### Iterative Healing Process

```text
┌──────────────────────────────────────────────┐
│  Run test → Fails → Agent fixes → Re-run     │
│       ↑                              │        │
│       └──────────────────────────────┘        │
│                                               │
│  Typically 3-6 iterations depending on:       │
│  - SAP system response time                   │
│  - OData data availability                    │
│  - Control rendering timing                   │
└──────────────────────────────────────────────┘
```

Run the test in debug mode:

```bash
npx playwright test tests/e2e/sap-cloud/your-test.spec.ts --headed --debug
```

Or use the healer agent directly:

```text
Goal: Fix this failing test

Use praman SAP healer agent:
.github/agents/praman-sap-healer.agent.md

Test file: tests/e2e/sap-cloud/your-test.spec.ts

Error: [paste the error output]
```

### Common Fixes the Healer Applies

| Issue                       | Fix                                                       |
| --------------------------- | --------------------------------------------------------- |
| Timeout waiting for control | Add `toPass()` retry with progressive intervals           |
| Value Help not open yet     | Poll `control.isOpen()` before interacting                |
| OData data not loaded       | `getContextByIndex()` with retry loop                     |
| FLP tab not switching       | Use `page.getByText()` DOM click instead of `ui5.press()` |
| Dialog control not found    | Add `searchOpenDialogs: true`                             |
| Button not enabled          | Wait for `ui5.waitForUI5()` after previous action         |

## Step 6: Production-Ready Test

After the heal cycle completes, you have a production-ready gold standard test with:

- 100% Praman fixture usage for all UI5 elements
- Graceful error recovery (no hard failures on validation errors)
- Rich `test.info().annotations` for HTML report output
- `toPass()` retry patterns tuned to your SAP system timing
- Apache-2.0 license header and TSDoc compliance block

### Full Gold Standard Example

The complete gold standard test ships with the package at
`node_modules/playwright-praman/examples/bom-e2e-praman-gold-standard.spec.ts`. Copy it, update
the control IDs to match your system's live discovery output, and set `SAP_CLOUD_BASE_URL` in
your `.env`.

:::warning[`controlType` required for typed access]
Every `ui5.control()` call **must** include a `controlType` string to get typed return values.
Without it, the proxy returns `UI5ControlBase` and TypeScript will report TS2339 errors when you
call control-specific methods like `getRequired()`, `isOpen()`, or `getTable()`.
:::

<details>
<summary>Key patterns from the gold standard (click to expand)</summary>

```typescript
/**
 * @license Apache-2.0
 *
 * Gold Standard — BOM Complete E2E Flow (V1 SmartField)
 * Full source: examples/bom-e2e-praman-gold-standard.spec.ts
 */

import { test, expect } from 'playwright-praman';

const IDS = {
  materialField: 'createBOMFragment--material',
  materialVHDialog: 'createBOMFragment--material-input-valueHelpDialog',
  materialVHTable: 'createBOMFragment--material-input-valueHelpDialog-table',
  bomUsageCombo: 'createBOMFragment--variantUsage-comboBoxEdit',
  okBtn: 'createBOMFragment--OkBtn',
  // ... all discovered IDs — see full example for complete list
} as const;

test.describe('BOM End-to-End Flow', () => {
  test('Complete BOM Flow', async ({ page, ui5 }) => {
    // ── CRITICAL: controlType enables typed return values ──
    // Without controlType, ui5.control() returns UI5ControlBase and
    // TypeScript reports TS2339 on methods like getRequired(), isOpen(), getTable()

    // SmartField with controlType → typed proxy with getRequired()
    const materialField = await ui5.control({
      id: IDS.materialField,
      controlType: 'sap.ui.comp.smartfield.SmartField',
      searchOpenDialogs: true,
    });
    expect(await materialField.getRequired()).toBe(true);

    // ValueHelpDialog with controlType → typed proxy with isOpen(), close()
    const vhDialog = await ui5.control({
      id: IDS.materialVHDialog,
      controlType: 'sap.ui.comp.valuehelpdialog.ValueHelpDialog',
      searchOpenDialogs: true,
    });
    expect(await vhDialog.isOpen()).toBe(true);

    // SmartTable with controlType → typed proxy with getTable()
    const smartTable = await ui5.control({
      id: IDS.materialVHTable,
      controlType: 'sap.ui.comp.smarttable.SmartTable',
      searchOpenDialogs: true,
    });
    const innerTable = await smartTable.getTable();

    // ── CRITICAL: toPass() retry — data fetch INSIDE the retry block ──
    let materialValue = '';
    await expect(async () => {
      const ctx = await innerTable.getContextByIndex(0);
      expect(ctx).toBeTruthy();
      const obj = (await ctx.getObject()) as { Material?: string };
      expect(obj?.Material).toBeTruthy();
      materialValue = obj!.Material!;
    }).toPass({ timeout: 60000, intervals: [1000, 2000, 5000] });

    // ComboBox with controlType → typed proxy with setSelectedKey(), fireChange()
    const bomUsageCtrl = await ui5.control({
      id: IDS.bomUsageCombo,
      controlType: 'sap.m.ComboBox',
      searchOpenDialogs: true,
    });
    await bomUsageCtrl.setSelectedKey('1');
    await bomUsageCtrl.fireChange({ value: '1' });

    // ... see full example for Steps 1-8 with FLP navigation,
    // value help interaction, form fill, submission, and error recovery
  });
});
```

</details>

### Key Patterns to Copy

| Pattern                | Code                                                                                  |
| ---------------------- | ------------------------------------------------------------------------------------- |
| Env-based URL          | `await page.goto(process.env.SAP_CLOUD_BASE_URL!)`                                    |
| FLP tab (DOM click)    | `await page.getByText('Tab Name', { exact: true }).click()`                           |
| Retry tile press       | `await expect(async () => { await ui5.press({...}) }).toPass(...)`                    |
| Typed dialog control   | `await ui5.control({ id: '...', controlType: '...', searchOpenDialogs: true })`       |
| OData binding read     | `await expect(async () => { ctx = await tbl.getContextByIndex(0); ... }).toPass(...)` |
| Atomic fill            | `await ui5.fill({ id: '...', searchOpenDialogs: true }, value)`                       |
| ComboBox select        | `await ctrl.setSelectedKey('1'); await ctrl.fireChange({ value: '1' })`               |
| Graceful error cleanup | `try { await ui5.press({...Close...}) } catch { }`                                    |

### Run in CI

```bash
npx playwright test tests/e2e/sap-cloud/ --project=chromium
```

### Expected Output

```text
Running 1 test using 1 worker

  ✓  tests/e2e/sap-cloud/bom-e2e-praman-gold-standard.spec.ts
     BOM End-to-End Flow
       Complete BOM Flow — V2 SmartField single session (45s)
         Step 1: Navigate to BOM Maintenance App
         Step 2: Open Create BOM Dialog
         Step 3: Test Material Value Help
         Step 4: Test Plant Value Help
         Step 5: Test BOM Usage Dropdown
         Step 6: Fill Form with Valid Data
         Step 7: Click Create Button and handle result
         Step 8: Verify return to BOM List Report

  1 passed (48s)
```

## Quick Reference: Agent Prompts

| Task               | Prompt                                                             |
| ------------------ | ------------------------------------------------------------------ |
| Plan a new test    | `Goal: Create SAP test case. Use praman SAP planner agent...`      |
| Generate from plan | `Goal: Generate test from plan. Use praman SAP generator agent...` |
| Fix a failing test | `Goal: Fix this failing test. Use praman SAP healer agent...`      |
| Full pipeline      | `/praman-sap-coverage` (Claude Code)                               |
| Convert to gold    | `Convert the attached test script to Praman gold standard format`  |

## Troubleshooting

### Agent can't find the SAP app

- Verify `SAP_CLOUD_BASE_URL` in `.env` points to the FLP home page
- Verify the seed file authenticates successfully: `npx playwright test tests/seeds/sap-seed.spec.ts --project=agent-seed-test --headed`
- Check that Chrome is launching in headed mode (add `--headed` if needed)

### Agent discovers wrong control types

- SAP apps use different control frameworks depending on the Fiori Elements version:
  - **V2 apps**: `sap.ui.comp.smartfield.SmartField` (SmartField)
  - **V4 apps**: `sap.ui.mdc.Field` with `sap.ui.mdc.field.FieldInput` (MDC)
- The planner auto-detects the framework. If it gets it wrong, specify in your prompt: "This is a Fiori Elements V4 app using MDC controls"

### Test passes locally but fails in CI

- Add longer timeouts for `toPass()` intervals in CI environments
- Ensure CI has network access to the SAP system
- Use `storageState` for auth to avoid login flow in every test
- Set `SAP_CLOUD_BASE_URL` as a CI secret, not hardcoded

### MCP server connection issues

- Verify `.mcp.json` exists with the `playwright-test` server configured
- Restart the MCP server: close and reopen your IDE
- Check that `@playwright/test` is installed: `npx playwright --version`

:::warning[Common mistake]
Do not include `sapAuth.login()` inside your test body when using the setup project pattern.
Authentication runs once in `auth-setup.ts` and the session is shared via `storageState`.
Adding login calls in tests causes duplicate logins and session conflicts.
:::

## FAQ

<details>
<summary>How many heal iterations does it typically take?</summary>

Typically 3-6 iterations depending on:

- **SAP system response time** — slow systems need longer `toPass()` intervals
- **OData data availability** — value help tables may load asynchronously
- **Control rendering timing** — dialogs and popovers may not be immediately available
- **Environment-specific quirks** — different SAP systems have different control IDs and behaviors

The healer agent captures the exact error, identifies the root cause, applies a fix, and re-runs
the test automatically. Each iteration gets progressively closer to a passing test.

</details>

<details>
<summary>Can I run the planner without a live SAP system?</summary>

No. The planner agent connects to a live SAP system to discover UI5 controls, OData bindings,
and value help structures. This live discovery is what makes generated tests accurate — the
planner reads actual control IDs and types from the running application.

If you do not have a live system available, you can write tests manually using the
[Playwright Primer](./playwright-primer) and [Selectors](./selectors) guides.

</details>

<details>
<summary>The agent generates tests with page.click() instead of ui5.press() — how do I fix this?</summary>

This means the agent is not using Praman fixtures correctly. Re-run the generator or healer with
this instruction in your prompt:

```text
Use 100% Praman fixtures for all UI5 elements. Never use page.click(),
page.fill(), or page.locator() for UI5 controls. Use ui5.press(),
ui5.fill(), and ui5.control() instead.
```

Or run the gold standard conversion prompt:

```text
Convert the attached test script to Praman gold standard format.
```

</details>

<details>
<summary>How do I run the full pipeline with a single command?</summary>

In Claude Code, use the slash command:

```text
/praman-sap-coverage
```

This runs the planner, generator, and healer in sequence. For other IDEs (Copilot, Cursor),
use the prompt template from Step 1 — the agent will run all three phases automatically.

</details>

:::tip[Next steps]

- **[Selectors Guide →](./selectors)** — Understand how `ui5.control()` discovers controls by ID, type, and properties
- **[Control Interactions →](./control-interactions)** — Learn `ui5.press()`, `ui5.fill()`, and proxy methods for all UI5 control types
- **[Authentication Guide →](./authentication)** — Configure auth strategies for different SAP system types

:::
