---
title: 'How to Use Praman CLI Agents: A Real-World SAP Testing Walkthrough'
description: 'Step-by-step guide to using Praman CLI agents for SAP UI5 test automation with Playwright CLI. Based on a real 8-iteration session testing a V4 Fiori Elements BOM app on S/4HANA Cloud.'
authors: [maheshwar]
tags: [cli, praman, playwright, sap-ui5, ai]
date: 2026-04-05
keywords:
  - praman CLI agents
  - SAP test automation CLI
  - playwright CLI SAP
  - SAP Fiori test generation
  - agentic SAP testing
  - playwright-praman CLI
  - SAP UI5 CLI testing
  - SAP S/4HANA test automation
  - AI test generation SAP
  - playwright-praman agents
  - SAP BOM testing
  - Fiori Elements V4 testing
  - SAP FLP navigation testing
  - SAP dialog testing
  - CLI vs MCP agents
---

# How to Use Praman CLI Agents: A Real-World SAP Testing Walkthrough

Praman ships two variants of its SAP test agents: **MCP agents** that communicate through a WebSocket-based MCP server, and **CLI agents** that use `playwright-cli` over stdin/stdout. This post walks through the CLI variant end-to-end, based on a real session testing a "Maintain Bill of Material (Version 2)" app on SAP S/4HANA Cloud. The session required 8 iterations to get a passing test, and the debugging process revealed important patterns around FLP navigation, dialog handling, and V4 Fiori Elements ID structures that apply to any SAP testing project.

{/_ truncate _/}

---

## Why CLI Agents Exist

The MCP-based agents (`praman-sap-planner.agent.md`) require a running Playwright MCP server and communicate via WebSocket and JSON-RPC. This works well in rich IDE integrations, but adds setup complexity and token overhead from the protocol framing.

CLI agents (`praman-sap-planner-cli.agent.md`) take a simpler approach: they invoke `playwright-cli` as bash commands, passing data through stdin/stdout and saving snapshots to files. No MCP server needed, fewer dependencies, and higher token efficiency because page snapshots are written to disk rather than streamed through a protocol layer.

Both variants produce the same output: a test plan and a gold-standard Praman test script.

---

## MCP vs CLI: Naming Convention

Every Praman agent ships in two variants. The naming convention makes it clear which is which:

| Agent Purpose      | MCP Variant (requires `@playwright/mcp`) | CLI Variant (no MCP needed)         |
| ------------------ | ---------------------------------------- | ----------------------------------- |
| SAP Test Planner   | `praman-sap-planner.agent.md`            | `praman-sap-planner-cli.agent.md`   |
| SAP Test Generator | `praman-sap-generator.agent.md`          | `praman-sap-generator-cli.agent.md` |
| SAP Test Healer    | `praman-sap-healer.agent.md`             | `praman-sap-healer-cli.agent.md`    |

The CLI variants live in `.github/agents/` in your project, alongside a skill file at `.github/skills/praman-sap-cli/SKILL.md` that defines the CLI command patterns.

---

## Prerequisites

### Packages

Install the core packages and the Playwright CLI tool:

```bash
npm install playwright-praman @playwright/test
npm install -g @playwright/cli@latest
```

Verify your versions:

```bash
npx playwright --version         # 1.59+
npx playwright-cli --version     # 0.1.3+
```

### Browser Installation

This is a common pitfall: `playwright-cli` and `@playwright/test` use **separate** browser installations. You need to install for both.

```bash
# For test execution (npx playwright test)
npx playwright install chromium

# For interactive discovery (playwright-cli)
npx playwright-cli install-browser chromium
```

If you skip the second step, `playwright-cli open` will fail with `"Browser chromium is not installed"` even though `npx playwright test` works fine.

### Project Initialization

For a new project:

```bash
npx playwright-praman init
```

For an existing project after updating `playwright-praman`:

```bash
npx playwright-praman init --force
```

The `--force` flag overwrites config files with the latest templates. Without it, `init` skips files that already exist and you may be running with outdated bridge scripts or agent instructions.

This creates:

- `playwright.config.ts` with an `auth-setup` project
- `.playwright/praman-cli.config.json` for bridge injection
- `tests/auth.setup.ts` for SAP authentication
- `.env.example` for environment variables
- `.github/agents/` and `.github/skills/` for agent files

### SAP Credentials

```bash
cp .env.example .env
```

Edit `.env` with your SAP system details:

```env
SAP_CLOUD_BASE_URL=https://your-system.s4hana.cloud.sap/
SAP_CLOUD_USERNAME=your.email@company.com
SAP_CLOUD_PASSWORD=your-password
SAP_AUTH_STRATEGY=btp-saml
SAP_CLIENT=100
SAP_LANGUAGE=EN
```

**Important:** The `.env` file must use `KEY=value` format only. Do NOT use `//` for comments -- they cause shell sourcing errors. Use `#` instead.

### Bridge Config

Verify that `.playwright/praman-cli.config.json` exists and includes the `initScript`:

```json
{
  "browser": {
    "browserName": "chromium",
    "launchOptions": {
      "headless": false,
      "channel": "chromium"
    },
    "initScript": ["./node_modules/playwright-praman/dist/browser/praman-bridge-init.js"]
  }
}
```

Without this config, `playwright-cli` opens the browser but the Praman bridge (`window.__praman_bridge`) is never injected, and all UI5 discovery scripts fail silently.

---

## Step-by-Step Walkthrough

This section follows the exact sequence from a real session testing the **Maintain Bill of Material (Version 2)** app on SAP S/4HANA Cloud.

### Step 1: Launch the Agent

Open your project in Claude Code and tell it to launch the CLI agent:

```
launch .github/agents/praman-sap-planner-cli.agent.md and login to sap
```

Claude Code reads the agent `.md` file, loads the SKILL.md (mandatory preflight), and begins executing `playwright-cli` commands.

Behind the scenes, the agent runs:

```bash
# Open browser with bridge injection
npx playwright-cli -s=sap open "https://your-system.s4hana.cloud.sap/" \
  --persistent --config=.playwright/praman-cli.config.json

# Snapshot the login page to find form field refs
npx playwright-cli -s=sap snapshot --filename=login.yml

# Fill credentials using element refs from the snapshot
npx playwright-cli -s=sap fill e22 "user@company.com"
npx playwright-cli -s=sap fill e26 "password"
npx playwright-cli -s=sap click e45

# Save auth state for session reuse
npx playwright-cli -s=sap state-save sap-auth.json
```

The `click` command on the login button will likely time out (30-second default) during SAP IDP redirects. This is expected behavior -- the login still succeeds. The agent verifies by checking the current URL after the timeout.

### Step 2: Navigate the FLP

With authentication complete, guide the agent to your target app:

```
please click on BOM - bill of materials tab
click on Maintain Bill Of Material (Version 2)
```

This is where the first major learning emerged. The test plan initially used `navigateToTile('BOM Management')`, but the FLP home page used **Space Tabs** (`sap.m.IconTabFilter`), not GenericTiles. The agent had to discover the correct navigation pattern through `run-code` queries.

### Step 3: Discover UI5 Controls

Once inside the app, ask the agent to explore:

```
make a query for ui5 methods for Create BOM button
click Create BOM button
click on Material and open value help and show me what is available
```

The agent uses `run-code` to execute `page.evaluate()` calls that query `sap.ui.getCore()`:

```bash
npx playwright-cli -s=sap run-code "async page => {
  return await page.evaluate(() => {
    const core = sap.ui.getCore();
    const results = [];
    document.querySelectorAll('[data-sap-ui]').forEach(el => {
      const id = el.getAttribute('data-sap-ui');
      const ctrl = core.byId(id);
      if (!ctrl) return;
      const type = ctrl.getMetadata().getName();
      const info = { id, type };
      try {
        if (ctrl.getText) info.text = ctrl.getText();
        if (ctrl.getValue) info.value = ctrl.getValue();
      } catch(e) {}
      results.push(info);
    });
    return { count: results.length, controls: results.slice(0, 50) };
  });
}"
```

Key `run-code` rules to remember:

| Rule   | Correct                     | Wrong                                    |
| ------ | --------------------------- | ---------------------------------------- |
| Output | `return` values only        | `console.log()` is invisible             |
| Scope  | `page` is the only variable | No `process.env`, `require`, `browser`   |
| Return | Serializable values only    | No DOM nodes, functions, Symbols         |
| Format | `"async page => { ... }"`   | Bare statements without function wrapper |

### Step 4: Handle Dialog Fields

After clicking "Create BOM", a dialog opens with fields for Material, Plant, BOM Usage, and more. The agent discovers each field's ID pattern and the Value Help structure:

```
click on Material and open value help
select CG PVT LTD from the list
```

Through this discovery, the agent learns the V4 Action Parameter Dialog (APD) ID patterns:

```
APD_::Material              -- outer MDC Field
APD_::Material-inner        -- inner FieldInput (for setValue/getValue)
APD_::Material-inner-vhi    -- Value Help icon button
```

### Step 5: Generate the Test

When discovery is complete:

```
stop exploration. create test plan and test script using praman gold standard
```

The agent generates two files:

- **Test plan** (`specs/maintain-bom-v2.plan.md`) -- all discovered controls, IDs, Value Help data
- **Test script** (`tests/e2e/maintain-bom-v2/create-bom-v2-gold.spec.ts`) -- gold-standard Praman test

### Step 6: The 8-Iteration Debug Cycle

Running the generated test revealed issues that took 8 iterations to resolve:

| Run   | Steps Passed | Failure Point | Root Cause                                                  | Fix                                                    |
| ----- | ------------ | ------------- | ----------------------------------------------------------- | ------------------------------------------------------ |
| 1     | 0/8          | Step 1        | `navigateToTile()` -- FLP uses space tabs, not tiles        | Switch to `page.getByText()`                           |
| 2     | 0/8          | Step 1        | Still looking for tiles on BOM page                         | Use `page.getByRole('link')` for section links         |
| 3     | 5/8          | Step 6        | Dialog submit clicked wrong "Create BOM" button             | Needed exact button ID, not text match                 |
| 4     | 5/8          | Step 6        | `ui5.dialog.confirm()` -- `ui5.dialog` is undefined         | Sub-fixture not available in v1.1.x                    |
| 5     | 5/8          | Step 6        | Guessed V4 FE button ID was wrong                           | Used `getBeginButton()` error to discover real ID      |
| 6     | 5/8          | Step 6        | `dialog.getBeginButton()` -- proxy blacklists `constructor` | Use exact ID from error message                        |
| 7     | 7/8          | Step 8        | `discardDialog.isOpen()` returned false                     | Skip dialog check, find button directly with `check()` |
| **8** | **8/8**      | **PASSED**    | --                                                          | All fixes applied                                      |

The key learnings from this cycle:

1. **`searchOpenDialogs: true` is essential** for every control lookup inside a dialog. Without it, the bridge searches only the main page.

2. **V4 FE button IDs follow a predictable pattern**: `fe::APD_::${SRVD}.${ActionName}::Action::Ok` for dialog confirmation buttons.

3. **`sap.m.IconTabFilter` has no `press()` or `firePress()` methods.** The proxy call silently does nothing. Use DOM click via `page.getByText()` instead.

4. **`ui5.dialog.*` sub-fixtures are not available in all versions.** Fall back to `ui5.control()` with exact button IDs.

5. **Error messages reveal control IDs.** When `getBeginButton()` threw a "constructor blacklisted" error, the error text contained the actual button ID (`sap.m.Button#fe::APD_::...::Action::Ok`).

---

## FLP Navigation Patterns

Modern SAP FLP does not always use GenericTiles. Through this session, four distinct navigation patterns were identified:

### Pattern 1: GenericTiles (Classic FLP)

Apps appear as tiles on the home page. This is the classic pattern.

```typescript
await ui5Navigation.navigateToTile('Purchase Orders');
```

### Pattern 2: Space Tabs (Modern FLP)

The FLP shows tabs like "My Home", "Bills Of Material", etc. These are `sap.m.IconTabFilter` controls. The critical detail: `IconTabFilter` does not have `press()` or `firePress()` methods, so Playwright native click is the only approach.

```typescript
// IconTabFilter has no press()/firePress() -- DOM click is the only reliable method
await page.getByText('Bills Of Material', { exact: true }).click();
```

### Pattern 3: Section Links (FLP Pages)

Within a space page, apps may appear as links in sections rather than tiles.

```typescript
// Non-UI5 anchor elements -- Playwright native is correct
await page.getByRole('link', { name: 'Maintain Bill Of Material (Version 2)' }).click();
```

### Pattern 4: Hash Navigation (Direct)

Skip the FLP entirely and navigate by semantic object hash.

```typescript
await ui5Navigation.navigateToApp('MaterialBOM-maintainMaterialBOM');
```

**Recommendation:** Always check the FLP layout before assuming GenericTiles exist. Run a `sap.m.GenericTile` discovery query first. If the tile count is zero, the FLP uses space tabs or section links.

---

## V4 Fiori Elements ID Patterns

V4 FE apps generate predictable IDs based on the SRVD (Service Definition) namespace. Learning these patterns saves significant debugging time.

### Action Parameter Dialog (APD) Fields

```
APD_::PropertyName                  -- Outer MDC Field
APD_::PropertyName-inner            -- Inner FieldInput (for setValue/getValue)
APD_::PropertyName-inner-vhi        -- Value Help icon button
```

### Dialog Footer Buttons

```
fe::APD_::${SRVD}.${ActionName}::Action::Ok      -- Primary action (Create/Save)
fe::APD_::${SRVD}.${ActionName}::Action::Cancel   -- Cancel
```

### List Page Action Buttons

```
appComponent::ListReport--fe::table::EntitySet::LineItem::DataFieldForAction::
  ${SRVD}.ActionName::Collection::${SRVD}.EntityType
```

These IDs are generated by the V4 Fiori Elements framework and may vary between UI5 versions. Always verify through discovery rather than hardcoding from documentation.

**Tip:** If you cannot determine the exact button ID, try `dialog.getBeginButton()`. Even if the proxy throws an error, the error message reveals the actual button ID (e.g., `sap.m.Button#fe::APD_::...::Action::Ok`).

---

## Gold-Standard Test Structure

Every generated test follows this structure:

```typescript
import { test, expect } from 'playwright-praman';

// V4: SRVD namespace constant
const SRVD = 'com.sap.gateway.srvd.ui_billofmaterial_maintain.v0001'; // cspell:disable-line

// Control IDs from discovery
const IDS = {
  createBtn: `app::List--fe::table::BOMHeader::LineItem::DataFieldForAction::${SRVD}.CreateBOM::Collection::${SRVD}.BOMHeaderType`,
  materialField: 'APD_::Material-inner',
  plantField: 'APD_::Plant-inner',
  dialogOkBtn: `fe::APD_::${SRVD}.CreateBOM::Action::Ok`,
} as const;

const TEST_DATA = {
  material: '41',
  plant: '1110',
  bomUsage: '3',
} as const;

test.describe('Maintain BOM V2 -- Create BOM', () => {
  test('Create BOM with Material and Plant -- Single Session', async ({ page, ui5 }) => {
    await test.step('Step 1: Navigate to BOM space', async () => {
      await page.getByText('Bills Of Material', { exact: true }).click();
      await ui5.waitForUI5();
    });

    await test.step('Step 2: Open BOM app', async () => {
      await page.getByRole('link', { name: /Maintain Bill Of Material.*Version 2/ }).click();
      await ui5.waitForUI5();
    });

    await test.step('Step 3: Click Create BOM', async () => {
      const createBtn = await ui5.control({ id: IDS.createBtn });
      await createBtn.firePress();
      await ui5.waitForUI5();
    });

    await test.step('Step 4: Fill Material', async () => {
      await ui5.fill({
        id: IDS.materialField,
        searchOpenDialogs: true,
        value: TEST_DATA.material,
      });
    });

    await test.step('Step 5: Fill Plant', async () => {
      await ui5.fill({
        id: IDS.plantField,
        searchOpenDialogs: true,
        value: TEST_DATA.plant,
      });
    });

    await test.step('Step 6: Submit dialog', async () => {
      const okBtn = await ui5.control({
        id: IDS.dialogOkBtn,
        searchOpenDialogs: true,
      });
      await okBtn.firePress();
      await ui5.waitForUI5();
    });

    // ... additional steps
  });
});
```

### Mandatory Rules

| Rule              | Correct                                                            | Wrong                            |
| ----------------- | ------------------------------------------------------------------ | -------------------------------- |
| Import            | `from 'playwright-praman'`                                         | `from '@playwright/test'`        |
| Single test       | `test.step()` inside one `test()`                                  | Multiple `test()` blocks         |
| UI5 controls      | `ui5.control()` + proxy methods                                    | `page.click('#__button0')`       |
| Input fill        | `ui5.fill()` (atomic: setValue + fireChange + waitForUI5)          | `page.fill()` on a UI5 input     |
| Wait              | `ui5.waitForUI5()`                                                 | `page.waitForTimeout()` (banned) |
| Dialogs           | `searchOpenDialogs: true`                                          | Missing -- control not found     |
| ID maps           | `as const`                                                         | Mutable objects                  |
| Playwright native | Only for non-UI5: `page.goto()`, `page.getByText()` for space tabs | For UI5 controls                 |

---

## Tips and Troubleshooting

### Login Timeouts During IDP Redirects

The `click` command on the login button will time out during SAP IDP redirect chains (which can exceed the 30-second default). This is expected behavior. After the timeout, verify the login succeeded with:

```bash
npx playwright-cli -s=sap eval "() => ({ url: document.location.href })"
```

### `searchOpenDialogs: true` for Dialog Controls

Every `ui5.control()`, `ui5.fill()`, or `ui5.press()` call that targets a control inside a dialog **must** include `searchOpenDialogs: true`. Without it, the bridge only searches the main page and returns "control not found."

### Two Buttons with the Same Text

When a dialog button and a toolbar button share the same text (e.g., both say "Create BOM"), text-based matching will hit the wrong one. Use the exact V4 FE button ID instead:

```typescript
// Wrong -- may match the toolbar button instead of the dialog button
await ui5.press({
  controlType: 'sap.m.Button',
  properties: { text: 'Create BOM' },
  searchOpenDialogs: true,
});

// Right -- exact V4 FE button ID
await ui5.press({
  id: `fe::APD_::${SRVD}.CreateBOM::Action::Ok`,
  searchOpenDialogs: true,
});
```

### `ui5.dialog` is Undefined

The `ui5.dialog` sub-fixture (`.confirm()`, `.dismiss()`, `.waitFor()`) is not available in `playwright-praman` v1.1.x. Use `ui5.control()` with exact button IDs as the workaround:

```typescript
// Instead of ui5.dialog.confirm()
const okBtn = await ui5.control({
  id: 'fe::APD_::...::Action::Ok',
  searchOpenDialogs: true,
});
await okBtn.firePress();

// Instead of ui5.dialog.dismiss()
const cancelBtn = await ui5.control({
  controlType: 'sap.m.Button',
  properties: { text: 'Cancel' },
  searchOpenDialogs: true,
});
await cancelBtn.firePress();
```

### Bridge Not Ready

If `window.__praman_bridge` is undefined after opening the browser:

| Symptom                           | Cause                                | Fix                                                                               |
| --------------------------------- | ------------------------------------ | --------------------------------------------------------------------------------- |
| Bridge is `undefined`             | Missing `--config` on `open` command | Add `--config=.playwright/praman-cli.config.json`                                 |
| `bridgeReady: false` after 30s    | `initScript` path is wrong           | Verify `node_modules/playwright-praman/dist/browser/praman-bridge-init.js` exists |
| Bridge ready but 0 controls found | Page not fully loaded                | Wait for UI5 to stabilize, then re-query                                          |

### `navigateToTile()` Finds Nothing

Modern SAP FLP systems may use Space Tabs and Section Links instead of GenericTiles. Check the page layout first:

```bash
npx playwright-cli -s=sap run-code "async page => {
  return await page.evaluate(() => {
    const tiles = [];
    document.querySelectorAll('[data-sap-ui]').forEach(el => {
      const ctrl = sap.ui.getCore().byId(el.getAttribute('data-sap-ui'));
      if (ctrl?.getMetadata().getName() === 'sap.m.GenericTile') {
        tiles.push(ctrl.getHeader());
      }
    });
    return { tileCount: tiles.length, tiles };
  });
}"
```

If `tileCount` is 0, use the Space Tab or Section Link patterns described above.

---

## When to Use CLI vs MCP

| Factor              | CLI Agent                                    | MCP Agent                                   |
| ------------------- | -------------------------------------------- | ------------------------------------------- |
| Setup complexity    | Lower -- no MCP server needed                | Higher -- requires `@playwright/mcp`        |
| Token efficiency    | Higher -- snapshots saved to files           | Lower -- data streamed via JSON-RPC         |
| Browser transport   | stdin/stdout via `playwright-cli`            | WebSocket via MCP server                    |
| Requires MCP server | No                                           | Yes                                         |
| Session persistence | Named sessions (`-s=sap`)                    | MCP server manages lifecycle                |
| Best for            | Claude Code CLI, CI/CD, token-sensitive work | Rich IDE integration, GitHub Copilot agents |

Both variants produce identical output: a test plan and a gold-standard Praman test script. The choice comes down to your environment and token budget.

---

## How Config Flows Through the Workflow

Understanding which config file drives each phase prevents the most common setup issues:

```
DISCOVERY PHASE (playwright-cli)              TEST EXECUTION PHASE (npx playwright test)
-------------------------------------         ------------------------------------------

.env                                          .env
  -> SAP_CLOUD_BASE_URL                         -> SAP_CLOUD_BASE_URL
       -> playwright-cli -s=sap open                 -> page.goto() in test

.playwright/praman-cli.config.json            playwright.config.ts
  -> initScript: praman-bridge-init.js          -> auth-setup project
       -> Injected via CDP into browser              -> tests/auth.setup.ts
            -> window.__praman_bridge ready                -> Saves .auth/sap-state.json
                 -> run-code discovers UI5          -> chromium project
                                                         -> storageState: .auth/sap-state.json
state-save sap-auth.json                                  -> Tests run pre-authenticated
  -> Cookies/storage for session reuse
                                              playwright-praman plugin
                                                -> Auto-injects bridge (no --config needed)
                                                     -> ui5.control(), ui5.fill() work
```

During discovery, the bridge is injected via the `--config` flag on `playwright-cli open`. During test execution, the `playwright-praman` plugin handles bridge injection automatically through the Playwright Test Runner.

---

## Summary

The CLI agent workflow follows a predictable cycle: **launch, authenticate, discover, generate, execute, iterate.** The 8-iteration debugging session on the BOM app was not a failure of the tooling -- it was the normal process of discovering how a specific SAP system is configured. Each iteration taught something concrete about FLP navigation patterns, V4 FE ID structures, and dialog handling that will apply to every future test.

The key takeaways:

- **Check FLP layout before assuming tiles.** Space Tabs and Section Links are increasingly common.
- **Always pass `searchOpenDialogs: true`** when working inside dialogs.
- **Use exact V4 FE button IDs** to avoid ambiguity when buttons share text labels.
- **`sap.m.IconTabFilter` requires DOM click** -- its `firePress()` method does not trigger navigation.
- **Error messages are your friend.** A proxy error from `getBeginButton()` revealed the exact button ID needed.

For the full session details including every command executed, see the [Praman CLI Agents Guide](https://praman.dev/docs/guides/playwright-cli-agents).
