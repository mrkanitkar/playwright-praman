---
title: 'Introducing Praman Plugins for Claude Code and Claude Cowork'
description: 'Install once, test everything — Praman plugins for Claude Code and Claude Cowork bring 5 AI agents, 4 slash commands, and 8 skills to your SAP testing workflow.'
authors: [maheshwar]
tags: [praman, claude-code, plugin, ai, sap-ui5]
date: 2026-04-10
keywords:
  - praman claude code plugin
  - praman claude cowork plugin
  - claude code sap testing
  - claude cowork sap testing
  - AI SAP test automation
  - claude plugin sap
  - praman plugin install
  - SAP UI5 test generation
  - agentic SAP testing plugin
  - claude code slash commands
  - praman agents
  - SAP Fiori test automation plugin
  - playwright praman
  - SAP test healing
---

# Introducing Praman Plugins for Claude Code and Claude Cowork

SAP test automation has always been hard. The controls are deep, the IDs are long, the events are complex, and every app behaves differently depending on whether it's V2 Smart or V4 MDC.
The [Praman CLI agents](/blog/2026/04/05/how-to-use-praman-cli-agents) showed that AI agents could handle this complexity — but they required copying agent markdown files into every project and manually enforcing compliance rules.

Today we're releasing **two plugins** that change that — one for **Claude Code** and one for **Claude Cowork**. Same 5-agent pipeline, same compliance rules, two interfaces.

```bash
# Claude Code — CLI
claude plugin marketplace add mrkanitkar/praman-sap-testing
claude plugin install praman-sap-testing@praman-sap-testing

# Claude Cowork — Customize → Browse plugins → Install
```

<!-- truncate -->

---

## Two Plugins, One Pipeline

Both plugins share the same core: 5 AI agents, 7 mandatory rules, 19 forbidden patterns, and confidence-scored healing. The difference is the interface.

### Claude Code Plugin

For developers and test automation engineers who work in the terminal. Install via CLI, invoke with slash commands, review generated code in your editor.

- **Slash commands** (`/praman-plan`, `/praman-generate`, `/praman-heal`) — orchestrated pipelines
- **Shared rules** — a `CLAUDE.md` that every agent reads, ensuring consistent compliance
- **Session hooks** — reminders that load on every conversation start
- **Skill routing** — 8 specialized knowledge packs that activate based on context
- **Quality gates** — automated verification after every file generation

### Claude Cowork Plugin

For teams that prefer a chat-first, collaborative interface. Install from **Customize → Browse plugins** in Claude Cowork. Same agents, same rules — but with collaborative review, shared sessions, and team-visible test results.

Both plugins are the orchestration layer that CLI agents lacked.

---

## What You Get

| Component              | Count | Highlights                                                                                  |
| ---------------------- | ----- | ------------------------------------------------------------------------------------------- |
| **Commands**           | 4     | `/praman-plan`, `/praman-generate`, `/praman-heal`, `/praman-coverage`                      |
| **Agents**             | 5     | Explorer (Sonnet), Architect (Sonnet), Generator (Sonnet), Healer (Opus), Reviewer (Sonnet) |
| **Skills**             | 8     | CLI syntax, auth, controls, Fiori Elements, OData, navigation, bridge, verification         |
| **Mandatory Rules**    | 7     | Import source, fixtures, non-UI5, auth isolation, input sequence, dialogs, TSDoc            |
| **Rule 0**             | 1     | Control method verification before every interaction                                        |
| **Forbidden Patterns** | 19    | Zero-tolerance patterns scanned by the quality gate                                         |

---

## The Pipeline in Action

Here's what happens when you run the full pipeline on a V4 "Manage Purchase Orders" app:

```text
/praman-coverage "Manage Purchase Orders" "create PO with supplier value help"
```

### Phase 1: Plan

The `sap-explorer` agents open your SAP system, enumerate 127 UI5 controls, detect V4 MDC patterns, and map the navigation flow. The `sap-architect` agent designs 5 test scenarios with priorities:

```text
P0 — Create PO with supplier value help (critical happy path)
P0 — Create PO with 2 line items (critical data entry)
P1 — Edit existing PO header fields
P1 — Delete line item from PO
P2 — Filter and search in list report
```

You review and approve before generation begins.

### Phase 2: Generate

The `test-generator` agent produces one `.spec.ts` file per scenario. Every file follows the gold standard:

```typescript
// tests/e2e/purchase-order/create-with-vh.spec.ts
import { test, expect } from 'playwright-praman';

const SRVD = 'com.sap.gateway.srvd.zui_purchaseorder_m.v0001';
const IDS = {
  createButton: `fe::StandardAction::${SRVD}::Create`,
  supplierInner: 'APD_::Supplier-inner',
  supplierVHIcon: 'APD_::Supplier-inner-vhi',
  saveButton: `fe::StandardAction::${SRVD}::Save`,
} as const;

test('Create PO with supplier value help', async ({ page, ui5 }) => {
  await test.step('Navigate to app', async () => {
    await page.goto(process.env.SAP_CLOUD_BASE_URL + '#PurchaseOrder-manage');
    await ui5.waitForUI5();
  });

  await test.step('Open create dialog and select supplier', async () => {
    await ui5.press({ id: IDS.createButton });
    await ui5.press({ id: IDS.supplierVHIcon, searchOpenDialogs: true });

    // Poll for value help dialog — never waitForTimeout
    let vhOpen = false;
    for (let i = 0; i < 10; i++) {
      try {
        const dialog = await ui5.control({
          controlType: 'sap.m.Dialog',
          searchOpenDialogs: true,
          properties: { title: /Supplier/i },
        });
        if (dialog) {
          vhOpen = true;
          break;
        }
      } catch {
        await ui5.waitForUI5();
      }
    }
    expect(vhOpen).toBe(true);

    // Search and select
    await ui5.fill({ controlType: 'sap.m.SearchField', searchOpenDialogs: true }, 'ACME');
    await ui5.waitForUI5();
    // ... select row, fill remaining fields, save
  });
});
```

Notice: `import from 'playwright-praman'`, V4 MDC IDS constants, `searchOpenDialogs: true`, polling loop instead of `waitForTimeout`, and `waitForUI5()` after every mutation.

After writing each file, the **quality gate** greps for all 19 forbidden patterns, verifies all 7 rules, and auto-fixes any violations. Only files that pass with zero violations are presented.

### Phase 3: Heal

First-run failures are expected — selector patterns vary between SAP systems. The `test-healer` agent (powered by Opus for complex reasoning) diagnoses each failure with confidence scoring:

```text
Failure: Control not found: APD_::Supplier-inner-vhi
Diagnosis: V4 VHI suffix uses double-dash on this system
Confidence: 92
Fix: APD_::Supplier-inner-vhi → APD_::Supplier-inner--vhi
Action: Auto-applied (confidence >= 80)
```

After 1 healing iteration: 5/5 tests passing.

---

## Rules That Make Tests Actually Work

The biggest lesson from months of AI-generated SAP tests: **agents need hard rules, not guidelines**. Two rules had the highest impact:

### Rule 0: Check Before You Call

Before interacting with any UI5 control, the agent MUST check what methods the control actually supports. Without this rule, agents call `press()` on controls like `IconTabFilter` that have no `press()` method — causing failures that take 10 minutes to debug.

The fix is a 2-second check:

```bash
playwright-cli -s=sap run-code "async page => {
  return await page.evaluate((id) => {
    const ctrl = sap.ui.core.ElementRegistry.get(id);
    const methods = ['press', 'firePress', 'setValue', 'fireChange', 'fireSelect'];
    return methods.filter(m => typeof ctrl[m] === 'function');
  }, 'application--iconTabBar-filter1');
}"
# Result: ['fireSelect'] — no press()!
```

### Rule 2: Fixtures, Not page.click()

This is the most common agent mistake. `page.click('#sapButton')` works at the DOM level but bypasses the UI5 event system. The OData model never updates, the next action sends stale data, and the test fails on save.

```typescript
// WRONG — bypasses UI5 event chain
await page.click('#application--supplierInput');
await page.fill('#application--supplierInput', 'ACME');

// CORRECT — triggers OData binding update
await ui5.fill({ id: 'application--supplierInput' }, 'ACME');
await ui5.control({ id: 'application--supplierInput' }).fireChange();
await ui5.waitForUI5();
```

The quality gate greps for `page.click(` in every generated file. A single match is a blocking violation.

---

## Plugins vs CLI Agents

If you've read the [CLI agents walkthrough](/blog/2026/04/05/how-to-use-praman-cli-agents), you might wonder: what's different?

| Aspect            | CLI Agents                            | Claude Code Plugin              | Claude Cowork Plugin            |
| ----------------- | ------------------------------------- | ------------------------------- | ------------------------------- |
| **Installation**  | Copy `.md` files to `.claude/agents/` | `claude plugin install` via CLI | GUI: Customize → Browse plugins |
| **Shared rules**  | None — standalone                     | `CLAUDE.md` + 7 rules           | `CLAUDE.md` + 7 rules           |
| **Commands**      | None — invoke by name                 | 4 slash commands                | Chat-based invocation           |
| **Quality gate**  | Manual                                | Automatic                       | Automatic                       |
| **Session hook**  | None                                  | Rules reminder on every session | Rules reminder on every session |
| **Skill routing** | Agent reads its own file              | 8 skills auto-activate          | 8 skills auto-activate          |
| **Pipeline**      | Manual — one by one                   | `/praman-coverage` runs all     | Chat-driven pipeline            |
| **Collaboration** | Single user                           | Single user                     | Team-visible reviews            |

**When to use CLI agents**: Custom agent setups, per-project files, environments where plugins aren't supported.

**When to use Claude Code Plugin**: Full pipeline automation, shared compliance rules, terminal-first workflow.

**When to use Claude Cowork Plugin**: Team collaboration, chat-first interface, shared test review sessions.

---

## Getting Started

### Claude Code

```bash
# 1. Install the plugin
claude plugin marketplace add mrkanitkar/praman-sap-testing
claude plugin install praman-sap-testing@praman-sap-testing

# 2. Set up environment variables
export SAP_CLOUD_BASE_URL="https://your-system.s4hana.cloud.sap/"
export SAP_CLOUD_USERNAME="your.email@company.com"
export SAP_CLOUD_PASSWORD="your-password"

# 3. Ensure prerequisites
npm install -g @playwright/cli@latest
npm install -D playwright-praman @playwright/test

# 4. Run the pipeline
/praman-coverage "Your App Name"
```

### Claude Cowork

1. Open Claude Desktop → **Cowork** tab → **Customize** → **Browse plugins**
2. Search for **praman-sap-testing** and click **Install**
3. Set SAP environment variables in your project
4. Ask: "Plan and generate tests for Manage Purchase Orders"

For detailed setup including auth state, bridge config, and playwright.config.ts, see the [installation guide](/docs/guides/claude-code-plugin-installation).

---

## What's Next

Both plugins are actively developed. Coming soon:

- **Multi-system support** — test across DEV, QAS, and PRD with system-specific selectors
- **Test data management** — automatic test data creation and cleanup
- **Visual regression** — screenshot comparison for UI5 control rendering
- **CI/CD integration** — GitHub Actions workflow templates for SAP test pipelines
- **Cowork team features** — shared test libraries, team dashboards, and review workflows

Full documentation is available at [praman.dev/docs/guides/claude-code-plugin-overview](/docs/guides/claude-code-plugin-overview).
