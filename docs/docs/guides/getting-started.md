---
title: Getting Started
description: 'Two commands to get started with Praman. Install, init, and let AI agents generate production-ready SAP UI5 Playwright tests.'
keywords:
  - playwright sap testing
  - sap ui5 test automation
  - playwright sap ui5 getting started tutorial
  - sap ui5 e2e testing
  - playwright-praman
---

Two commands to get started. Then let AI agents generate your tests.

## Prerequisites

- **Node.js** >= 20
- Access to an SAP UI5 / Fiori application
- SAP credentials (username, password, base URL)

## Step 1: Install and Initialize

```bash
npm install playwright-praman
npx playwright-praman init
```

`init` handles everything:

- Validates Node.js and npm
- Installs Chromium browser
- Prompts for SAP credentials and creates `.env`
- Detects your IDE and installs AI agent definitions (planner, generator, healer)
- Scaffolds `playwright.config.ts`, `praman.config.ts`, auth setup, and a gold-standard test

<details>
<summary>What init installs (full breakdown)</summary>

Praman has 3 direct dependencies and 5 peer dependencies:

| Package                   | Type            | Purpose                                            |
| ------------------------- | --------------- | -------------------------------------------------- |
| `@playwright/test`        | Peer (required) | Playwright test runner (>=1.57.0)                  |
| `commander`               | Dependency      | CLI framework for `npx playwright-praman` commands |
| `pino`                    | Dependency      | Structured JSON logging                            |
| `zod`                     | Dependency      | Configuration validation and type-safe schemas     |
| `@anthropic-ai/sdk`       | Peer (optional) | AI test generation via Claude                      |
| `openai`                  | Peer (optional) | AI test generation via OpenAI / Azure OpenAI       |
| `@opentelemetry/api`      | Peer (optional) | Observability and distributed tracing              |
| `@opentelemetry/sdk-node` | Peer (optional) | OpenTelemetry Node.js SDK                          |

#### IDE detection and agent installation

| IDE / Agent        | Detection Signal                                       | What gets installed                                     |
| ------------------ | ------------------------------------------------------ | ------------------------------------------------------- |
| **VS Code**        | `.vscode/` or `TERM_PROGRAM=vscode`                    | Settings, extensions, code snippets                     |
| **Claude Code**    | `CLAUDE.md`                                            | Agents (planner, generator, healer), prompts, seed file |
| **Cursor**         | `.cursor/` or `.cursorrc`                              | `.cursor/rules/praman.mdc`                              |
| **Jules**          | `.jules/`                                              | `.jules/praman-setup.md`                                |
| **GitHub Copilot** | `.github/copilot-instructions.md` or `.github/agents/` | Copilot agent definitions                               |
| **OpenCode**       | `.opencode/`                                           | OpenCode configuration                                  |

#### Scaffolded project files

| File                                         | Purpose                                                        |
| -------------------------------------------- | -------------------------------------------------------------- |
| `playwright.config.ts`                       | Playwright config with `auth-setup` + `chromium` projects      |
| `praman.config.ts`                           | Praman settings (timeouts, log level, interaction strategy)    |
| `tsconfig.json`                              | TypeScript config with `module: "Node16"`                      |
| `.gitignore`                                 | Excludes `.env`, `.auth/`, `test-results/`, `node_modules/`    |
| `tests/auth.setup.ts`                        | SAP login — runs once before tests, saves session to `.auth/`  |
| `tests/bom-e2e-praman-gold-standard.spec.ts` | Gold-standard verification test                                |
| `specs/bom-create-complete.plan.md`          | AI-generated test plan (reference)                             |
| `.env.example`                               | Environment variable template                                  |
| IDE-specific files                           | Agent definitions, prompts, rules, snippets (per IDE detected) |
| `skills/`                                    | Praman SAP testing skill files for AI agents                   |

#### IDE-specific post-init commands

```bash
# Claude Code
cat node_modules/playwright-praman/docs/user-integration/claude-md-appendable.md >> CLAUDE.md

# GitHub Copilot
cat node_modules/playwright-praman/docs/user-integration/copilot-instructions-appendable.md >> .github/copilot-instructions.md

# Cursor
cat node_modules/playwright-praman/docs/user-integration/cursor-rules-appendable.mdc >> .cursorrules
```

`init` is safe to re-run — it skips files that already exist. Use `--force` to overwrite everything. For more details, see the [Agent & IDE Setup](./agent-setup) guide.

</details>

<details>
<summary>Environment variables reference</summary>

| Variable                    | Required | Description                                     |
| --------------------------- | -------- | ----------------------------------------------- |
| `SAP_CLOUD_BASE_URL`        | Yes      | SAP BTP or on-premise base URL                  |
| `SAP_CLOUD_USERNAME`        | Yes      | SAP login username                              |
| `SAP_CLOUD_PASSWORD`        | Yes      | SAP login password                              |
| `SAP_AUTH_STRATEGY`         | Yes      | Auth strategy: `btp-saml`, `basic`, `office365` |
| `SAP_CLIENT`                | No       | SAP client number (default: from system)        |
| `SAP_LANGUAGE`              | No       | Display language (default: EN)                  |
| `PRAMAN_LOG_LEVEL`          | No       | Log level: `debug`, `info`, `warn`, `error`     |
| `PRAMAN_SKIP_VERSION_CHECK` | No       | Set `true` to skip Playwright version check     |

For auth strategy details, see the [Authentication](./authentication) guide.

</details>

## Step 2: Generate Tests with AI Agents

Describe your business process in plain language — Praman's AI agents do the rest:

**Claude Code:**

```bash
/praman-sap-coverage
# Then enter: "Test creating a purchase order with vendor 1000, material MAT-001, quantity 10"
```

**GitHub Copilot / Cursor / Jules:** Use the agent definitions installed by `init` (see [Agent & IDE Setup](./agent-setup)).

### The plan → generate → heal pipeline

Praman runs 3 agents autonomously:

| Agent         | What it does                                                                                                                 |
| ------------- | ---------------------------------------------------------------------------------------------------------------------------- |
| **Planner**   | Explores your live SAP system, discovers UI5 controls, and produces a structured test plan with steps and expected results   |
| **Generator** | Converts the test plan into executable Playwright + Praman test code using typed control proxies — not brittle DOM selectors |
| **Healer**    | Runs the generated test against the live system, fixes any failures, and ensures compliance — repeats until green            |

The result is a **production-ready `.spec.ts` file** in your `tests/` directory — no manual test scripting required.

### Example: from description to test

**You enter:**

> "Verify the BOM creation dialog: open Create BOM, select a material and plant via value help, choose Production usage, and submit."

**Praman generates:**

```typescript
import { test, expect } from 'playwright-praman';

test.describe('BOM Creation', () => {
  test('Create BOM with material and plant selection', async ({ ui5 }) => {
    await test.step('Open Create BOM dialog', async () => {
      await ui5.press({ controlType: 'sap.m.Button', properties: { text: 'Create BOM' } });
      await ui5.waitForUI5();
    });

    await test.step('Select material via value help', async () => {
      await ui5.press({ id: 'createBOMFragment--material-input-vhi', searchOpenDialogs: true });
      // ... discovers and interacts with live controls
    });

    await test.step('Submit and verify', async () => {
      await ui5.press({ id: 'createBOMFragment--OkBtn', searchOpenDialogs: true });
      await ui5.waitForUI5();
    });
  });
});
```

:::tip From business process to Playwright test — autonomously
This is the core value of Praman: you describe **what** to test in business language, and the AI agents handle the **how** — discovering controls, generating code, and healing failures. No manual selector hunting, no brittle DOM queries, no test scripting.
:::

For detailed agent prompt templates, example output, and the full heal cycle, see [Running Your Agent for the First Time](./running-your-agent).

---

## Optional: Verify Setup Manually

<details>
<summary>Run the gold-standard verification test</summary>

:::note SAP System Requirement
The gold-standard BOM test requires access to an **SAP S/4HANA Public Cloud** system or an **SAP Fiori Launchpad** where the **Bill of Material (BOM) Maintenance** tile is available. If your system does not have this app, you can still verify your setup by writing a test against any SAP Fiori app available on your launchpad — the authentication and fixture wiring will work the same way.
:::

```bash
npx playwright test tests/bom-e2e-praman-gold-standard.spec.ts --reporter=line --headed --project=chromium
```

| Flag                 | Purpose                                                                                    |
| -------------------- | ------------------------------------------------------------------------------------------ |
| `--project=chromium` | Runs the `chromium` project, which depends on `auth-setup` (auth runs first automatically) |
| `--headed`           | Opens a visible browser so you can watch the test interact with SAP                        |
| `--reporter=line`    | Compact one-line-per-step output                                                           |

A passing test confirms: Playwright + Chromium installed, SAP credentials valid, auth session saved, and Praman fixtures interacting with live UI5 controls.

</details>

<details>
<summary>Troubleshooting</summary>

| Symptom                                        | Likely Cause                               | Fix                                                       |
| ---------------------------------------------- | ------------------------------------------ | --------------------------------------------------------- |
| `ERR_BRIDGE_TIMEOUT`                           | URL is not a UI5 app, or UI5 hasn't loaded | Verify `SAP_CLOUD_BASE_URL` points to the Fiori Launchpad |
| Auth setup fails                               | Wrong credentials or auth strategy         | Check `.env` — try `SAP_AUTH_STRATEGY=basic` for OnPrem   |
| `browserType.launch: Executable doesn't exist` | Chromium not installed                     | Run `npx playwright install chromium`                     |
| Test times out at tile click                   | FLP space/tile name differs on your system | Edit `TEST_DATA` constants in the test file               |
| `ERR_CONTROL_NOT_FOUND`                        | Control ID differs on your system          | Use `controlType` + `properties` instead of `id`          |

:::info Adapt the gold-standard test to your app
The gold-standard test targets the "Maintain Bill Of Material" app. If your SAP system does not have this app, use it as a template: copy the file, change the tile name, control IDs, and test data to match your app. The patterns (auth, navigation, dialog handling, value help) are universal across SAP Fiori apps.
:::

</details>

---

## Your First Custom Test

Create `tests/purchase-order.spec.ts`:

```typescript
import { test, expect } from 'playwright-praman';

test('navigate to Purchase Order app and verify table', async ({ ui5, ui5Navigation }) => {
  // Step 1: Navigate to the Fiori app
  await test.step('Open Purchase Order app', async () => {
    await ui5Navigation.navigateToApp('PurchaseOrder-manage');
  });

  // Step 2: Wait for UI5 to stabilize
  await test.step('Wait for page load', async () => {
    await ui5.waitForUI5();
  });

  // Step 3: Discover a control by type
  await test.step('Find the Create button', async () => {
    const createBtn = await ui5.control({
      controlType: 'sap.m.Button',
      properties: { text: 'Create' },
    });
    // The control proxy exposes all UI5 methods
    const text = await createBtn.getText();
    expect(text).toBe('Create');
  });

  // Step 4: Read table data
  await test.step('Verify table has rows', async () => {
    const rowCount = await ui5.table.getRowCount('myTable');
    expect(rowCount).toBeGreaterThan(0);
  });
});
```

## Real-World Example: BOM End-to-End Test

Praman's AI agents follow a **plan → generate → heal** pipeline. The planner explores a live SAP system, discovers controls, and produces a structured test plan. The generator converts the plan into executable Playwright + Praman test code. Below is a real example from an SAP S/4HANA Cloud BOM application.

### AI-Generated Test Plan

The AI planner agent explored the Maintain Bill of Material app and produced this test plan:

<details>
<summary>bom-create.plan.md (click to expand)</summary>

#### Application Overview

SAP S/4HANA Cloud — Maintain Bill of Material (Version 2). Fiori Elements V4 List Report with Create BOM dialog. UI5 Version 1.142.4. System: Partner Demo Customizing LXG/100.

#### 1. BOM Navigation and App Loading

##### 1.1. Navigate to Maintain BOM app from FLP

| #   | Step                                                  | Expected Result                                                              |
| --- | ----------------------------------------------------- | ---------------------------------------------------------------------------- |
| 1   | Verify FLP Home page loaded after login               | Page title contains "Home"; Shell Bar visible with "S/4HANA Cloud"           |
| 2   | Click "Bills Of Material" tab in FLP space navigation | Tab becomes active; BOM tiles visible                                        |
| 3   | Click "Maintain Bill Of Material (Version 2)" tile    | URL changes to `#MaterialBOM-maintainMaterialBOM`                            |
| 4   | Wait for List Report to load                          | Filter bar visible (Material, Plant, BOM Usage); "Create BOM" button enabled |

#### 2. Create BOM Dialog Interactions

##### 2.1. Open Create BOM dialog and verify fields

| #   | Step                      | Expected Result                                                                                           |
| --- | ------------------------- | --------------------------------------------------------------------------------------------------------- |
| 1   | Click "Create BOM" button | Dialog opens with heading "Create BOM"                                                                    |
| 2   | Verify all dialog fields  | Material (required), Plant, BOM Usage (required), Alternative BOM, Change Number, Valid From (pre-filled) |
| 3   | Verify footer buttons     | "Create BOM" submit and "Cancel" buttons visible and enabled                                              |
| 4   | Click "Cancel"            | Dialog closes; List Report visible                                                                        |

##### 2.2. Test Material Value Help

| #   | Step                                   | Expected Result                                                       |
| --- | -------------------------------------- | --------------------------------------------------------------------- |
| 1   | Click "Create BOM" to open dialog      | Dialog opens                                                          |
| 2   | Click Value Help icon next to Material | "Select: Material" dialog opens with Material and Description columns |
| 3   | Verify material data loaded            | At least one row with Material number and description                 |
| 4   | Click a material row                   | Value help closes; Material field populated                           |
| 5   | Click "Cancel" to close dialog         | Dialog closes cleanly                                                 |

##### 2.3. Test Plant Value Help

| #   | Step                                | Expected Result                                             |
| --- | ----------------------------------- | ----------------------------------------------------------- |
| 1   | Click "Create BOM" to open dialog   | Dialog opens                                                |
| 2   | Click Value Help icon next to Plant | "Select: Plant" dialog opens with Plant, Plant Name columns |
| 3   | Verify plant data loaded            | Plants listed (e.g. 1010 DE Plant, 1110 GB Plant)           |
| 4   | Click a plant row                   | Value help closes; Plant field populated                    |
| 5   | Click "Cancel" to close dialog      | Dialog closes cleanly                                       |

##### 2.4. Test BOM Usage dropdown

| #   | Step                              | Expected Result                                                                         |
| --- | --------------------------------- | --------------------------------------------------------------------------------------- |
| 1   | Click "Create BOM" to open dialog | Dialog opens                                                                            |
| 2   | Click Value Help on BOM Usage     | Dropdown opens with usage types                                                         |
| 3   | Verify options                    | Production (1), Engineering/Design (2), Universal (3), Plant Maintenance (4), Sales (5) |
| 4   | Select "Production (1)"           | BOM Usage field shows "Production (1)"                                                  |
| 5   | Click "Cancel" to close dialog    | Dialog closes cleanly                                                                   |

#### 3. Complete BOM Creation Flow

##### 3.1. Fill all fields and submit

| #   | Step                                    | Expected Result                                                              |
| --- | --------------------------------------- | ---------------------------------------------------------------------------- |
| 1   | Navigate to app, click "Create BOM"     | Dialog opens                                                                 |
| 2   | Select Material via Value Help          | Material field populated                                                     |
| 3   | Select Plant via Value Help             | Plant field populated                                                        |
| 4   | Select BOM Usage "Production (1)"       | BOM Usage set                                                                |
| 5   | Verify all required fields filled       | Material, BOM Usage, Valid From all have values; Create BOM enabled          |
| 6   | Click "Create BOM" submit               | Success: dialog closes, returns to list. Error: error message dialog appears |
| 7   | If error, close error dialog and cancel | User returns to list report                                                  |

##### 3.2. Verify validation errors

| #   | Step                                        | Expected Result                                                      |
| --- | ------------------------------------------- | -------------------------------------------------------------------- |
| 1   | Open Create BOM dialog                      | Dialog opens                                                         |
| 2   | Select invalid Material + Plant combination | Both fields populated                                                |
| 3   | Select BOM Usage "Production (1)"           | BOM Usage set                                                        |
| 4   | Click "Create BOM" submit                   | Error dialog: "Material not maintained in plant" with message M3351  |
| 5   | Click "Close" on error dialog               | Error dialog closes; Create BOM dialog remains with values preserved |
| 6   | Click "Cancel"                              | Dialog closes; returns to list report                                |

</details>

### Generated Gold Standard Test

The AI generator converted scenario **3.1** (Complete BOM Creation Flow) from the plan above into the following production-grade test. Copy it into your project:

```bash
cp node_modules/playwright-praman/examples/bom-e2e-praman-gold-standard.spec.ts tests/
```

Here is the full test — 8 steps covering navigation, dialog handling, value help tables, OData-driven data selection, form fill, and graceful error recovery:

<details>
<summary>bom-e2e-praman-gold-standard.spec.ts (click to expand)</summary>

```typescript
import { test, expect } from 'playwright-praman';

// ── V2 SmartField Control ID Constants ──────────────────────────────
const IDS = {
  // ── Dialog fields (sap.ui.comp.smartfield.SmartField) ──
  materialField: 'createBOMFragment--material',
  materialInput: 'createBOMFragment--material-input',
  materialVHIcon: 'createBOMFragment--material-input-vhi',
  materialVHDialog: 'createBOMFragment--material-input-valueHelpDialog',
  materialVHTable: 'createBOMFragment--material-input-valueHelpDialog-table',

  plantField: 'createBOMFragment--plant',
  plantInput: 'createBOMFragment--plant-input',
  plantVHIcon: 'createBOMFragment--plant-input-vhi',
  plantVHDialog: 'createBOMFragment--plant-input-valueHelpDialog',
  plantVHTable: 'createBOMFragment--plant-input-valueHelpDialog-table',

  bomUsageField: 'createBOMFragment--variantUsage',
  bomUsageCombo: 'createBOMFragment--variantUsage-comboBoxEdit',

  // ── Dialog buttons ──
  okBtn: 'createBOMFragment--OkBtn',
  cancelBtn: 'createBOMFragment--CancelBtn',
} as const;

// ── Test Data ───────────────────────────────────────────────────────
const TEST_DATA = {
  flpSpaceTab: 'Bills Of Material',
  tileHeader: 'Maintain Bill Of Material',
  bomUsageKey: '1', // Production
} as const;

test.describe('BOM End-to-End Flow', () => {
  test('Complete BOM Flow - V2 SmartField Single Session', async ({ page, ui5 }) => {
    // Step 1: Navigate to BOM Maintenance App
    await test.step('Step 1: Navigate to BOM Maintenance App', async () => {
      await page.goto(process.env.SAP_CLOUD_BASE_URL!);
      await page.waitForLoadState('domcontentloaded');
      await expect(page).toHaveTitle(/Home/, { timeout: 60000 });

      // FLP space tabs — DOM click is the only reliable method
      await page.getByText(TEST_DATA.flpSpaceTab, { exact: true }).click();

      // Click tile with toPass() retry for slow SAP systems
      await expect(async () => {
        await ui5.press({
          controlType: 'sap.m.GenericTile',
          properties: { header: TEST_DATA.tileHeader },
        });
      }).toPass({ timeout: 60000, intervals: [5000, 10000] });

      // Wait for Create BOM button — proves V1 app loaded
      let createBtn: Awaited<ReturnType<typeof ui5.control>>;
      await expect(async () => {
        createBtn = await ui5.control({
          controlType: 'sap.m.Button',
          properties: { text: 'Create BOM' },
        });
        const text = await createBtn.getProperty('text');
        expect(text).toBe('Create BOM');
      }).toPass({ timeout: 120000, intervals: [5000, 10000] });
    });

    // Step 2: Open Create BOM Dialog and Verify Structure
    await test.step('Step 2: Open Create BOM Dialog', async () => {
      await ui5.press({
        controlType: 'sap.m.Button',
        properties: { text: 'Create BOM' },
      });
      await ui5.waitForUI5();

      // Verify dialog opened — Material SmartField exists inside dialog
      const materialField = await ui5.control({
        id: IDS.materialField,
        searchOpenDialogs: true,
      });
      const materialType = await materialField.getControlType();
      expect(materialType).toBe('sap.ui.comp.smartfield.SmartField');
      expect(await materialField.getRequired()).toBe(true);

      // Verify BOM Usage SmartField
      const bomUsageField = await ui5.control({
        id: IDS.bomUsageField,
        searchOpenDialogs: true,
      });
      expect(await bomUsageField.getControlType()).toBe('sap.ui.comp.smartfield.SmartField');
      expect(await bomUsageField.getRequired()).toBe(true);

      // Verify dialog footer buttons
      const createDialogBtn = await ui5.control({
        id: IDS.okBtn,
        searchOpenDialogs: true,
      });
      expect(await createDialogBtn.getProperty('text')).toBe('Create');
      const cancelDialogBtn = await ui5.control({
        id: IDS.cancelBtn,
        searchOpenDialogs: true,
      });
      expect(await cancelDialogBtn.getProperty('text')).toBe('Cancel');
    });

    // Step 3: Test Material Value Help
    await test.step('Step 3: Test Material Value Help', async () => {
      await ui5.press({ id: IDS.materialVHIcon, searchOpenDialogs: true });

      const materialDialog = await ui5.control({
        id: IDS.materialVHDialog,
        searchOpenDialogs: true,
      });
      expect(await materialDialog.isOpen()).toBe(true);
      await ui5.waitForUI5();

      // Get inner table via SmartTable.getTable()
      const smartTable = await ui5.control({
        id: IDS.materialVHTable,
        searchOpenDialogs: true,
      });
      const innerTable = await smartTable.getTable();
      const rows = (await innerTable.getRows()) as unknown[];
      expect(rows.length).toBeGreaterThan(0);

      // Wait for OData data to load
      await expect(async () => {
        let count = 0;
        for (const row of rows) {
          const ctx = await (
            row as { getBindingContext: () => Promise<unknown> }
          ).getBindingContext();
          if (ctx) count++;
        }
        expect(count).toBeGreaterThan(0);
      }).toPass({ timeout: 60000, intervals: [1000, 2000, 5000] });

      await materialDialog.close();
      await ui5.waitForUI5();
    });

    // Step 4: Test Plant Value Help
    await test.step('Step 4: Test Plant Value Help', async () => {
      await ui5.press({ id: IDS.plantVHIcon, searchOpenDialogs: true });

      const plantDialog = await ui5.control({
        id: IDS.plantVHDialog,
        searchOpenDialogs: true,
      });
      expect(await plantDialog.isOpen()).toBe(true);
      await ui5.waitForUI5();

      const smartTable = await ui5.control({
        id: IDS.plantVHTable,
        searchOpenDialogs: true,
      });
      const innerTable = await smartTable.getTable();
      const rows = (await innerTable.getRows()) as unknown[];

      await expect(async () => {
        let count = 0;
        for (const row of rows) {
          const ctx = await (
            row as { getBindingContext: () => Promise<unknown> }
          ).getBindingContext();
          if (ctx) count++;
        }
        expect(count).toBeGreaterThan(0);
      }).toPass({ timeout: 60000, intervals: [1000, 2000, 5000] });

      await plantDialog.close();
      await ui5.waitForUI5();
    });

    // Step 5: Test BOM Usage Dropdown (Inner ComboBox)
    await test.step('Step 5: Test BOM Usage Dropdown', async () => {
      const bomUsageCombo = await ui5.control({
        id: IDS.bomUsageCombo,
        searchOpenDialogs: true,
      });

      // Get items via proxy
      const rawItems = await bomUsageCombo.getItems();
      const items: Array<{ key: string; text: string }> = [];
      if (Array.isArray(rawItems)) {
        for (const itemProxy of rawItems) {
          const key = await itemProxy.getKey();
          const text = await itemProxy.getText();
          items.push({ key: String(key), text: String(text) });
        }
      }
      expect(items.length).toBeGreaterThan(0);

      // Verify open/close cycle
      await bomUsageCombo.open();
      await ui5.waitForUI5();
      expect(await bomUsageCombo.isOpen()).toBe(true);
      await bomUsageCombo.close();
      await ui5.waitForUI5();
      expect(await bomUsageCombo.isOpen()).toBe(false);
    });

    // Step 6: Fill Form with Valid Data
    await test.step('Step 6: Fill Form with Valid Data', async () => {
      // === FILL MATERIAL ===
      await ui5.press({ id: IDS.materialVHIcon, searchOpenDialogs: true });
      const materialDialogControl = await ui5.control({
        id: IDS.materialVHDialog,
        searchOpenDialogs: true,
      });
      await expect(async () => {
        expect(await materialDialogControl.isOpen()).toBe(true);
      }).toPass({ timeout: 30000, intervals: [1000, 2000] });

      const smartTableMat = await ui5.control({
        id: IDS.materialVHTable,
        searchOpenDialogs: true,
      });
      const innerTableMat = await smartTableMat.getTable();

      let materialValue = '';
      await expect(async () => {
        const ctx = await innerTableMat.getContextByIndex(0);
        expect(ctx).toBeTruthy();
        const data = (await ctx.getObject()) as { Material?: string };
        expect(data?.Material).toBeTruthy();
        materialValue = data!.Material!;
      }).toPass({ timeout: 60000, intervals: [1000, 2000, 5000] });

      await materialDialogControl.close();
      await ui5.waitForUI5();
      await ui5.fill({ id: IDS.materialInput, searchOpenDialogs: true }, materialValue);
      await ui5.waitForUI5();

      // === FILL PLANT ===
      await ui5.press({ id: IDS.plantVHIcon, searchOpenDialogs: true });
      const plantDialogControl = await ui5.control({
        id: IDS.plantVHDialog,
        searchOpenDialogs: true,
      });
      await expect(async () => {
        expect(await plantDialogControl.isOpen()).toBe(true);
      }).toPass({ timeout: 30000, intervals: [1000, 2000] });

      const smartTablePlant = await ui5.control({
        id: IDS.plantVHTable,
        searchOpenDialogs: true,
      });
      const innerTablePlant = await smartTablePlant.getTable();

      let plantValue = '';
      await expect(async () => {
        const ctx = await innerTablePlant.getContextByIndex(0);
        expect(ctx).toBeTruthy();
        const data = (await ctx.getObject()) as { Plant?: string };
        expect(data?.Plant).toBeTruthy();
        plantValue = data!.Plant!;
      }).toPass({ timeout: 60000, intervals: [1000, 2000, 5000] });

      await plantDialogControl.close();
      await ui5.waitForUI5();
      await ui5.fill({ id: IDS.plantInput, searchOpenDialogs: true }, plantValue);
      await ui5.waitForUI5();

      // === FILL BOM USAGE ===
      const bomUsageControl = await ui5.control({
        id: IDS.bomUsageCombo,
        searchOpenDialogs: true,
      });
      await bomUsageControl.open();
      await ui5.waitForUI5();
      await bomUsageControl.setSelectedKey(TEST_DATA.bomUsageKey);
      await bomUsageControl.fireChange({ value: TEST_DATA.bomUsageKey });
      await bomUsageControl.close();
      await ui5.waitForUI5();

      // === VERIFY ALL VALUES ===
      const finalMaterial =
        (await ui5.getValue({
          id: IDS.materialInput,
          searchOpenDialogs: true,
        })) ?? '';
      const finalPlant =
        (await ui5.getValue({
          id: IDS.plantInput,
          searchOpenDialogs: true,
        })) ?? '';
      const finalBomUsageCtrl = await ui5.control({
        id: IDS.bomUsageCombo,
        searchOpenDialogs: true,
      });
      const finalBomUsageKey = (await finalBomUsageCtrl.getSelectedKey()) ?? '';

      expect(finalMaterial).toBe(materialValue);
      expect(finalPlant).toBe(plantValue);
      expect(finalBomUsageKey).toBe(TEST_DATA.bomUsageKey);
    });

    // Step 7: Click Create Button and Handle Result
    await test.step('Step 7: Click Create and handle result', async () => {
      const createBtn = await ui5.control({
        id: IDS.okBtn,
        searchOpenDialogs: true,
      });
      expect(await createBtn.getProperty('text')).toBe('Create');
      expect(await createBtn.getEnabled()).toBe(true);

      await ui5.press({ id: IDS.okBtn, searchOpenDialogs: true });
      await ui5.waitForUI5();

      // Graceful error recovery — close error dialogs, cancel if needed
      let dialogStillOpen = false;
      try {
        const okBtnCheck = await ui5.control({
          id: IDS.okBtn,
          searchOpenDialogs: true,
        });
        dialogStillOpen = (await okBtnCheck.getEnabled()) !== undefined;
      } catch {
        dialogStillOpen = false;
      }

      if (dialogStillOpen) {
        try {
          await ui5.press({ id: IDS.cancelBtn, searchOpenDialogs: true });
          await ui5.waitForUI5();
        } catch {
          // Dialog already closed
        }
      }
    });

    // Step 8: Verify Return to BOM List
    await test.step('Step 8: Verify return to BOM List Report', async () => {
      const createBtn = await ui5.control(
        {
          controlType: 'sap.m.Button',
          properties: { text: 'Create BOM' },
        },
        { timeout: 30000 },
      );
      expect(await createBtn.getProperty('text')).toBe('Create BOM');
      expect(await createBtn.getProperty('enabled')).toBe(true);
    });
  });
});
```

</details>

**Key patterns demonstrated:**

| Pattern                             | Example                                             |
| ----------------------------------- | --------------------------------------------------- |
| `searchOpenDialogs: true`           | All controls inside the Create BOM dialog           |
| `ui5.fill()`                        | Atomic `setValue` + `fireChange` + `waitForUI5`     |
| `SmartTable.getTable()`             | Access inner `sap.ui.table.Table` from SmartTable   |
| `getContextByIndex().getObject()`   | Read OData entity data from table rows              |
| `setSelectedKey()` + `fireChange()` | ComboBox selection (localization-safe)              |
| `toPass()` retry                    | Handle slow OData loads and SAP system latency      |
| Graceful error recovery             | Close error dialogs and cancel without hard failure |

:::info From plan to code
Both the test plan and the gold standard test above were produced by Praman's AI agents against a live SAP S/4HANA Cloud system. Run the full **plan → generate → heal** pipeline on your own SAP app with the `/praman-sap-coverage` prompt.
:::

## Running Tests

```bash
# Run all tests
npx playwright test

# Run a specific test file
npx playwright test tests/purchase-order.spec.ts

# Run with visible browser
npx playwright test --headed

# Run with Playwright UI mode
npx playwright test --ui
```

:::tip Why `ui5.control()` instead of `page.locator()`?
SAP UI5 renders controls dynamically -- DOM IDs change between versions, themes restructure
elements, and controls nest inside generated wrappers. `ui5.control()` discovers controls through
the **UI5 runtime's own control registry**, which is the stable contract. Your tests survive DOM
restructuring, theme changes, and UI5 version upgrades.
:::

## Import Pattern

Praman uses Playwright's `mergeTests()` to combine all fixtures into a single `test` object:

```typescript
import { test, expect } from 'playwright-praman';

// All fixtures available via destructuring:
test('full access', async ({
  ui5, // Control discovery + interaction
  ui5Navigation, // FLP navigation
  sapAuth, // Authentication
  fe, // Fiori Elements helpers
  pramanAI, // AI page discovery
  intent, // Business domain intents
  ui5Shell, // FLP shell header
  ui5Footer, // Page footer bar
  flpLocks, // SM12 lock management
  flpSettings, // User settings
  testData, // Test data generation
}) => {
  // ...
});
```

## Common Patterns

### Control Discovery

```typescript
// By ID
const btn = await ui5.control({ id: 'submitBtn' });

// By control type + properties
const input = await ui5.control({
  controlType: 'sap.m.Input',
  properties: { placeholder: 'Enter vendor' },
});

// Multiple controls
const buttons = await ui5.controls({ controlType: 'sap.m.Button' });
```

### Input Fields (Gold Pattern)

Always use `setValue()` + `fireChange()` + `waitForUI5()` together:

```typescript
const input = await ui5.control({ id: 'vendorInput' });
await input.setValue('SUP-001');
await input.fireChange({ value: 'SUP-001' });
await ui5.waitForUI5();
```

Or use the shorthand:

```typescript
await ui5.fill({ id: 'vendorInput' }, 'SUP-001');
```

:::warning
Never use `page.fill()` or `page.type()` for UI5 Input controls. These bypass the UI5 event model, which means OData bindings, value state updates, and field validation will not trigger.
:::

### Table Operations

```typescript
// Read table data
const rows = await ui5.table.getRows('purchaseOrderTable');
const columns = await ui5.table.getColumnNames('purchaseOrderTable');

// Find a row by column values
const rowIndex = await ui5.table.findRowByValues('purchaseOrderTable', {
  'Purchase Order': '4500001234',
});

// Click a row
await ui5.table.clickRow('purchaseOrderTable', rowIndex);

// Get a specific cell value
const vendor = await ui5.table.getCellByColumnName('purchaseOrderTable', 0, 'Vendor');
```

### Dialog Handling

```typescript
// Wait for a dialog to appear
const dialog = await ui5.dialog.waitFor();

// Confirm a dialog
await ui5.dialog.confirm();

// Dismiss a dialog
await ui5.dialog.dismiss();

// Find controls inside a dialog
const dialogBtn = await ui5.control({
  controlType: 'sap.m.Button',
  properties: { text: 'OK' },
  searchOpenDialogs: true,
});
```

:::warning
Always use `searchOpenDialogs: true` when finding controls inside an `sap.m.Dialog`. Without it, `ui5.control()` only searches the main view.
:::

### Navigation

```typescript
// Navigate to a Fiori app by semantic object
await ui5Navigation.navigateToApp('PurchaseOrder-manage');

// Navigate to a tile by title
await ui5Navigation.navigateToTile('Manage Purchase Orders');

// Navigate to a specific URL hash
await ui5Navigation.navigateToHash('#PurchaseOrder-manage&/PurchaseOrders');

// Go back
await ui5Navigation.navigateBack();

// Go to FLP home
await ui5Navigation.navigateToHome();
```

### Fiori Elements Shortcuts

```typescript
// List Report
await fe.listReport.setFilter('Vendor', 'SUP-001');
await fe.listReport.search();
await fe.listReport.navigateToItem(0);

// Object Page
const title = await fe.objectPage.getHeaderTitle();
await fe.objectPage.clickEdit();
await fe.objectPage.navigateToSection('Items');
await fe.objectPage.clickSave();
```

### Business Intent APIs

```typescript
// Create a purchase order using business terms (vocabulary-resolved)
await intent.procurement.createPurchaseOrder({
  vendor: 'SUP-001',
  material: 'MAT001',
  quantity: 10,
  plant: '1000',
  companyCode: '1000',
  purchasingOrg: '1000',
});

// Fill a field using business vocabulary
await intent.core.fillField('Vendor', 'SUP-001');
```

## Fixture Quick Reference

| Fixture         | Purpose                                            |
| --------------- | -------------------------------------------------- |
| `ui5`           | Core control discovery and interaction             |
| `ui5.table`     | Table read, filter, sort, select                   |
| `ui5.dialog`    | Dialog lifecycle (wait, confirm, dismiss)          |
| `ui5.date`      | DatePicker and TimePicker operations               |
| `ui5.odata`     | OData model reads and HTTP operations              |
| `ui5Navigation` | FLP and in-app navigation                          |
| `ui5Footer`     | Footer toolbar buttons (Save, Edit, Cancel)        |
| `ui5Shell`      | Shell header (Home, Notifications, User menu)      |
| `fe`            | Fiori Elements List Report, Object Page, Table     |
| `intent`        | Business intent APIs (procurement, sales, finance) |

Always wrap multi-step flows in `test.step()` for clear reporting:

```typescript
await test.step('Create purchase order', async () => {
  // ... multiple interactions
});
```

## Persona Quick-Start Guides

### Test Automation Engineer

Focus on **fixtures, assertions, and `test.step()`** for structured test flows.

All fixtures are available via destructuring from the `test` callback. Use `test.step()` to organize multi-step flows for clear HTML reports.

### AI Agent (Copilot / Claude Code)

Focus on **imports, capabilities, and error codes** for automated test generation.

- **Single import**: `import { test, expect } from 'playwright-praman'`
- **Capability query**: Use `pramanAI.capabilities.forAI()` to discover available operations at runtime
- **Error codes**: All errors extend `PramanError` with `code`, `retryable`, and `suggestions[]`
- **Forbidden patterns**: Never use `page.click('#__...')`, `page.fill('#__...')`, or `page.locator('.sapM...')` for UI5 elements

### SAP Business Analyst

Focus on **intents and vocabulary** for writing tests in business terms.

```typescript
// Instead of finding controls by ID:
await intent.core.fillField('Vendor', 'SUP-001');
await intent.core.fillField('Material', 'MAT001');
await intent.core.fillField('Quantity', '10');

// Or use domain-specific intents:
await intent.procurement.createPurchaseOrder({
  vendor: 'SUP-001',
  material: 'MAT001',
  quantity: 10,
  plant: '1000',
});
```

Supported vocabulary domains: procurement (MM), sales (SD), finance (FI), manufacturing (PP), warehouse (WM/EWM), quality (QM).

## Project Structure

```text
my-sap-tests/
  tests/
    auth-setup.ts          # Authentication (runs once)
    purchase-order.spec.ts # Your test files
    sales-order.spec.ts
  .auth/
    sap-session.json       # Saved session (gitignored)
  praman.config.ts
  playwright.config.ts
  package.json
```

## Next Steps

| Topic                     | Documentation                           |
| ------------------------- | --------------------------------------- |
| Configuration reference   | [Configuration](./configuration)        |
| Authentication strategies | [Authentication](./authentication)      |
| Selector reference        | [Selectors](./selectors)                |
| Fixture reference         | [Fixtures](./fixtures)                  |
| Error reference           | [Errors](./errors)                      |
| Agent & IDE setup         | [Agent Setup](./agent-setup)            |
| Vocabulary system         | [Vocabulary](./vocabulary-system)       |
| Intent API                | [Intent API](./intent-api)              |
| Examples                  | [Examples](../examples/)                |
| Architecture overview     | [Architecture](./architecture-overview) |
