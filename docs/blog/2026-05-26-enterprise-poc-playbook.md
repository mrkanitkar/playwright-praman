---
title: 'The Enterprise POC Playbook: 9 Scenarios to Validate Playwright-Praman for SAP Test Automation'
authors: [maheshwar]
tags: [praman, playwright, sap-ui5, ai, test-design, cli, release]
date: 2026-05-26
---

# The Enterprise POC Playbook: 9 Scenarios to Validate Playwright-Praman for SAP Test Automation

Your SAP landscape has 200+ Fiori apps, quarterly transport cycles that break tests, and a test automation backlog measured in person-years. You have heard the pitch: _AI-first test automation for SAP UI5_. But before committing budget, headcount, and political capital, you need proof.

This guide is the POC playbook. It covers the 9 hardest scenarios that separate SAP test automation tools from SAP test automation _solutions_ — and gives you exact steps, agent commands, code, and scoring criteria to evaluate Playwright-Praman in your own landscape.

<!-- truncate -->

## Who This Guide Is For

- **Test Automation Leads** evaluating tools for an SAP Center of Excellence
- **QA Architects** building the business case for Playwright adoption
- **SAP Basis / DevOps Engineers** who need to validate CI/CD integration
- **Decision Makers** who need a structured go/no-go framework with measurable outcomes

---

## The Agent-First Methodology

The single most important thing to understand about a Praman POC is this: **you do not start by writing test code**. You start by pointing an AI agent at your live SAP app and letting it discover what is on the page.

Praman ships three agents — **Planner**, **Generator**, and **Healer** — that form a closed loop:

```
┌─────────┐     test plan      ┌───────────┐     spec file      ┌────────┐
│ Planner │ ──────────────────▶ │ Generator │ ──────────────────▶ │ Healer │
│ (explore)│                    │ (generate) │                    │ (fix)  │
└─────────┘                    └───────────┘                    └────────┘
     ▲                                                               │
     │                        feedback loop                          │
     └───────────────────────────────────────────────────────────────┘
```

**Every POC scenario below follows the same 3-step agent workflow:**

1. **Plan** — the Planner agent opens a headed browser, explores the SAP app, discovers UI5 controls, captures ARIA snapshots, and produces a structured test plan.
2. **Generate** — the Generator agent reads the plan and produces a compliant Playwright-Praman spec file using fixtures, `test.step()` pattern, and proper SAP control interactions.
3. **Heal** — when tests fail (due to transport drift, environment differences, or selector changes), the Healer agent debugs the failure, inspects the live page, and fixes the spec.

This is not a theoretical workflow. It is the primary methodology for the POC.

### Agent Invocation — Two Modes

**CLI Agents** (token-efficient, works in any terminal):

```bash
# Plan: explore the app and produce a test plan
npx playwright-praman plan --url "$SAP_URL" --auth .auth/sap-session.json

# Generate: produce a spec from the plan
npx playwright-praman generate --plan tests/plans/po-list-report.plan.json

# Heal: fix a failing test
npx playwright-praman heal --spec tests/e2e/po-list-report.spec.ts
```

**MCP Agents** (richer IDE integration — VS Code Copilot, Cursor, JetBrains AI):

```bash
# Claude Code prompts
/praman-sap-plan        # Run planner on SAP app
/praman-sap-generate    # Generate tests from plan
/praman-sap-heal        # Fix failing tests
/praman-sap-coverage    # Full pipeline: plan → generate → heal
```

**The POC scorecard evaluates agents first, manual code second.** If agents can handle a scenario end-to-end, that is the strongest possible validation. If agents produce 80% and a human finishes the remaining 20%, that is still a massive productivity win.

---

## POC Timeline: 4-Week Sprint

| Week  | Phase                      | Scenarios                                                             | Deliverable                                                      |
| ----- | -------------------------- | --------------------------------------------------------------------- | ---------------------------------------------------------------- |
| **1** | Foundation                 | Environment setup, Fiori Elements (#1), Smart Tables/Forms (#2)       | Agent-generated specs for 2 apps, baseline metrics               |
| **2** | Enterprise Workflows       | Procurement workflow (#3), Role-based auth (#4), Transport drift (#5) | Multi-step workflow spec, auth matrix, cross-environment results |
| **3** | Resilience & Scale         | CI parallelization (#6), Flaky network (#7), AI healing (#8)          | CI pipeline, resilience report, healing accuracy metrics         |
| **4** | Differentiators & Decision | OData assertions (#9), scoring, final report                          | Completed scorecard, go/no-go recommendation                     |

### Team

| Role                            | Commitment                | Responsibilities                                               |
| ------------------------------- | ------------------------- | -------------------------------------------------------------- |
| Test Automation Engineer (lead) | Full-time, 4 weeks        | Drive all 9 scenarios, run agents, measure results             |
| SAP Basis / Security            | 2-3 days across Weeks 1-2 | Auth configuration, test users, role assignment, system access |
| DevOps / CI Engineer            | 3-4 days in Week 3        | Pipeline setup, sharding, artifact management                  |
| QA Manager / Decision Maker     | 2 days in Week 4          | Review scorecard, make go/no-go decision                       |

### Prerequisites

Before Week 1 begins:

```bash
# 1. Install
npm init -y
npm install playwright-praman @playwright/test
npx playwright install chromium

# 2. Initialize Praman (scaffolds config, agents, seed test)
npx playwright-praman init

# 3. Configure SAP credentials (.env file)
SAP_BASE_URL=https://your-sap-system.example.com
SAP_USERNAME=TEST_AUTOMATION_USER
SAP_PASSWORD=<from-vault>
SAP_CLIENT=100
SAP_LANGUAGE=EN

# 4. Verify connection with seed test
npx playwright test --project=agent-seed-test
```

You need: a SAP system with test users, network access from CI runners to SAP, and a Chromium-capable environment.

---

## Scenario 1: Fiori Elements App

**Why this is first**: Fiori Elements apps are the hardest UI5 test target. The DOM is generated at runtime from CDS annotations. Control IDs are unstable. Responsive layouts shift controls between desktop and tablet breakpoints. If Praman can handle a Fiori Elements List Report + Object Page, it can handle anything in your SAP landscape.

### Agent-First Approach

```bash
# Step 1: Point the planner at a real Fiori Elements List Report
npx playwright-praman plan \
  --url "$SAP_BASE_URL/sap/bc/ui5_ui5/ui2/ushell/shells/abap/FioriLaunchpad.html#PurchaseOrder-manage" \
  --auth .auth/sap-session.json \
  --output tests/plans/po-list-report.plan.json
```

The planner will:

- Navigate to the app via Fiori Launchpad
- Wait for UI5 to stabilize (`waitForUI5`)
- Discover all controls: SmartFilterBar, SmartTable, toolbar buttons, variant management
- Capture the ARIA accessibility snapshot for AI grounding
- Produce a structured plan with control types, selectors, and interaction sequence

```bash
# Step 2: Generate the spec
npx playwright-praman generate \
  --plan tests/plans/po-list-report.plan.json \
  --output tests/e2e/po-list-report.spec.ts
```

### What the Generated Spec Looks Like

```typescript
import { test, expect } from 'playwright-praman';

test.describe('Purchase Order - List Report', () => {
  test('filter, search, and navigate to Object Page', async ({ ui5, page }) => {
    await test.step('Open List Report via FLP', async () => {
      await page.goto(
        `${process.env.SAP_BASE_URL}/sap/bc/ui5_ui5/ui2/ushell/shells/abap/FioriLaunchpad.html#PurchaseOrder-manage`,
      );
      await ui5.waitForUI5();
    });

    await test.step('Set filters on SmartFilterBar', async () => {
      const filterBar = await ui5.control({
        controlType: 'sap.ui.comp.smartfilterbar.SmartFilterBar',
      });

      await ui5.fill(
        { controlType: 'sap.m.Input', ancestor: filterBar, properties: { name: 'CompanyCode' } },
        '1000',
      );
      await ui5.fill(
        { controlType: 'sap.m.Input', ancestor: filterBar, properties: { name: 'Supplier' } },
        '100001',
      );
    });

    await test.step('Execute search', async () => {
      await ui5.press({
        controlType: 'sap.m.Button',
        properties: { text: 'Go' },
      });
      await ui5.waitForUI5();
    });

    await test.step('Verify table has results', async () => {
      const table = await ui5.control({
        controlType: 'sap.ui.comp.smarttable.SmartTable',
      });
      const rowCount = await ui5.table.getRowCount(table);
      expect(rowCount).toBeGreaterThan(0);
    });

    await test.step('Navigate to first item (Object Page)', async () => {
      await ui5.table.selectRow(0);
      await ui5.waitForUI5();

      // Verify Object Page loaded
      const objectHeader = await ui5.control({
        controlType: 'sap.uxap.ObjectPageHeader',
      });
      expect(objectHeader).toBeTruthy();
    });
  });
});
```

### Scoring Criteria

| Metric                       | Target                         | How to Measure                            |
| ---------------------------- | ------------------------------ | ----------------------------------------- |
| Agent discovery completeness | >90% of visible controls found | Compare plan output vs. manual inspection |
| Generated spec pass rate     | First-run pass on 3/5 attempts | Run spec 5 times, count passes            |
| Selector stability           | <5% flaky rate over 20 runs    | Run spec 20 times, count failures         |
| Object Page navigation       | Works without manual fix       | Agent-generated navigation succeeds       |
| Execution time               | <60s per test                  | Measure wall-clock time                   |

---

## Scenario 2: Smart Tables and Forms

**Why this matters**: SmartTable, SmartFilterBar, and SmartForm are the backbone of SAP Fiori apps. They render dynamically from OData metadata, generate columns/fields at runtime, and use Value Help dialogs for validated input. Every SAP team struggles with automating these controls.

### Agent-First Approach

```bash
# Plan against an app with SmartForm (e.g., Object Page in edit mode)
npx playwright-praman plan \
  --url "$SAP_BASE_URL/...#Material-manage&/Material('MAT001')" \
  --auth .auth/sap-session.json \
  --interactions edit,fill,valuehelp \
  --output tests/plans/material-smart-form.plan.json
```

The planner specifically discovers:

- SmartField inner control types (Input, ComboBox, DatePicker — determined by OData metadata)
- Value Help button associations
- Required/optional field states
- Field groups and their layout

### Key Patterns the Agent Must Handle

```typescript
await test.step('Fill SmartField with Value Help', async () => {
  // SmartFields wrap inner controls — agent must detect the actual input type
  await ui5.fill(
    {
      controlType: 'sap.ui.comp.smartfield.SmartField',
      bindingPath: { path: 'Supplier' },
    },
    '100001',
  );

  // If the SmartField has a Value Help, the agent opens and selects from it
  await ui5.press({
    controlType: 'sap.ui.core.Icon',
    properties: { src: 'sap-icon://value-help' },
    ancestor: {
      controlType: 'sap.ui.comp.smartfield.SmartField',
      bindingPath: { path: 'Supplier' },
    },
  });

  // CRITICAL: searchOpenDialogs for any control inside a dialog
  const dialogInput = await ui5.control({
    controlType: 'sap.m.SearchField',
    searchOpenDialogs: true,
  });
  await ui5.fill(dialogInput, '100001');
  await ui5.press({
    controlType: 'sap.m.Button',
    properties: { text: 'Go' },
    searchOpenDialogs: true,
  });

  // Select from results table in dialog
  await ui5.table.selectRow(0, { searchOpenDialogs: true });
  await ui5.press({
    controlType: 'sap.m.Button',
    properties: { text: 'OK' },
    searchOpenDialogs: true,
  });
});
```

### Scoring Criteria

| Metric                    | Target                                                 | How to Measure                                      |
| ------------------------- | ------------------------------------------------------ | --------------------------------------------------- |
| SmartField type detection | Agent identifies inner control type for >90% of fields | Review plan output                                  |
| Value Help automation     | Agent handles open → search → select → confirm         | Run against 3 different Value Help dialogs          |
| `searchOpenDialogs` usage | Agent always uses it for dialog controls               | Code review of generated spec                       |
| Required field validation | Agent detects and fills all mandatory fields           | Leave a required field empty, verify error handling |

---

## Scenario 3: Long Procurement Workflow

**Why this matters**: Real enterprise tests are not single-screen interactions. A procurement workflow crosses 4-5 apps, multiple user roles, and takes 15+ minutes to execute manually: Purchase Requisition → Purchase Order → Goods Receipt → Invoice Receipt → Payment. If the tool cannot chain multi-app workflows with data handoff between steps, it is a non-starter.

### Agent-First Approach — Chained Plans

```bash
# Plan each step separately, then chain
npx playwright-praman plan --url "$SAP_URL#PurchaseRequisition-create" \
  --auth .auth/sap-session.json \
  --output tests/plans/01-create-pr.plan.json

npx playwright-praman plan --url "$SAP_URL#PurchaseOrder-create" \
  --auth .auth/sap-session.json \
  --output tests/plans/02-create-po.plan.json

npx playwright-praman plan --url "$SAP_URL#InboundDelivery-create" \
  --auth .auth/sap-session.json \
  --output tests/plans/03-goods-receipt.plan.json

# Generate a combined spec
npx playwright-praman generate \
  --plan tests/plans/01-create-pr.plan.json \
  --plan tests/plans/02-create-po.plan.json \
  --plan tests/plans/03-goods-receipt.plan.json \
  --output tests/e2e/procurement-workflow.spec.ts
```

### Generated Workflow Spec Pattern

```typescript
import { test, expect } from 'playwright-praman';

test.describe('Procurement End-to-End', () => {
  let prNumber: string;
  let poNumber: string;
  let grDocument: string;

  test('complete procurement cycle', async ({ ui5, page }) => {
    await test.step('Step 1: Create Purchase Requisition', async () => {
      await page.goto(`${process.env.SAP_BASE_URL}#PurchaseRequisition-create`);
      await ui5.waitForUI5();

      await ui5.fill(
        { controlType: 'sap.ui.comp.smartfield.SmartField', bindingPath: { path: 'Material' } },
        'MAT-POC-001',
      );
      await ui5.fill(
        {
          controlType: 'sap.ui.comp.smartfield.SmartField',
          bindingPath: { path: 'OrderQuantity' },
        },
        '100',
      );
      await ui5.fill(
        { controlType: 'sap.ui.comp.smartfield.SmartField', bindingPath: { path: 'Plant' } },
        '1000',
      );

      await ui5.press({ controlType: 'sap.m.Button', properties: { text: 'Save' } });
      await ui5.waitForUI5();

      // Capture PR number for next step
      const message = await ui5.control({
        controlType: 'sap.m.MessageStrip',
        properties: { type: 'Success' },
      });
      const text = await message.getProperty('text');
      prNumber = text.match(/(\d{10})/)?.[1] ?? '';
      expect(prNumber).toMatch(/^\d{10}$/);
    });

    await test.step('Step 2: Create Purchase Order from PR', async () => {
      await page.goto(`${process.env.SAP_BASE_URL}#PurchaseOrder-create`);
      await ui5.waitForUI5();

      await ui5.fill(
        {
          controlType: 'sap.ui.comp.smartfield.SmartField',
          bindingPath: { path: 'PurchaseRequisition' },
        },
        prNumber,
      );
      await ui5.fill(
        { controlType: 'sap.ui.comp.smartfield.SmartField', bindingPath: { path: 'Supplier' } },
        '100001',
      );

      await ui5.press({ controlType: 'sap.m.Button', properties: { text: 'Save' } });
      await ui5.waitForUI5();

      const message = await ui5.control({
        controlType: 'sap.m.MessageStrip',
        properties: { type: 'Success' },
      });
      const text = await message.getProperty('text');
      poNumber = text.match(/(\d{10})/)?.[1] ?? '';
      expect(poNumber).toMatch(/^\d{10}$/);
    });

    await test.step('Step 3: Post Goods Receipt', async () => {
      await page.goto(`${process.env.SAP_BASE_URL}#InboundDelivery-create`);
      await ui5.waitForUI5();

      await ui5.fill(
        {
          controlType: 'sap.ui.comp.smartfield.SmartField',
          bindingPath: { path: 'PurchaseOrder' },
        },
        poNumber,
      );

      await ui5.press({ controlType: 'sap.m.Button', properties: { text: 'Post' } });
      await ui5.waitForUI5();

      const message = await ui5.control({
        controlType: 'sap.m.MessageStrip',
        properties: { type: 'Success' },
      });
      const text = await message.getProperty('text');
      grDocument = text.match(/(\d{10})/)?.[1] ?? '';
      expect(grDocument).toMatch(/^\d{10}$/);
    });

    await test.step('Verify: all documents created', async () => {
      expect(prNumber).toBeTruthy();
      expect(poNumber).toBeTruthy();
      expect(grDocument).toBeTruthy();
    });
  });
});
```

### Scoring Criteria

| Metric                      | Target                                              | How to Measure                          |
| --------------------------- | --------------------------------------------------- | --------------------------------------- |
| Cross-app navigation        | Agent produces plans for all 3+ apps                | Review generated plans                  |
| Data handoff (PR → PO → GR) | Document numbers passed correctly between steps     | End-to-end run succeeds                 |
| Total execution time        | <5 minutes for 3-step workflow                      | Wall-clock measurement                  |
| Error recovery              | Clear failure message identifying which step failed | Deliberately break step 2, check output |
| `test.step()` structure     | Each business step is a named step                  | Code review                             |

---

## Scenario 4: Role-Based Authorization Changes

**Why this is SAP-specific**: The same Fiori app shows different controls to different users based on PFCG authorization roles. A procurement manager sees "Approve" and "Reject" buttons; a requisitioner sees only "Submit." A test that passes for one role may fail for another — not because of a bug, but because of intentional authorization design.

### Agent-First Approach — Multi-Role Plans

```bash
# Plan as Requisitioner
SAP_USERNAME=TEST_REQUISITIONER npx playwright-praman plan \
  --url "$SAP_URL#PurchaseRequisition-manage" \
  --auth .auth/requisitioner.json \
  --output tests/plans/pr-role-requisitioner.plan.json

# Plan as Approver
SAP_USERNAME=TEST_APPROVER npx playwright-praman plan \
  --url "$SAP_URL#PurchaseRequisition-manage" \
  --auth .auth/approver.json \
  --output tests/plans/pr-role-approver.plan.json

# Diff the plans to see authorization-driven control differences
diff tests/plans/pr-role-requisitioner.plan.json tests/plans/pr-role-approver.plan.json
```

### Playwright Config — Role-Based Projects

```typescript
// playwright.config.ts
import { defineConfig } from 'playwright-praman';

export default defineConfig({
  projects: [
    // Auth setup per role
    {
      name: 'auth-requisitioner',
      testMatch: /auth-setup\.ts/,
      use: {
        pramanConfig: {
          auth: {
            username: process.env.SAP_USER_REQUISITIONER!,
            password: process.env.SAP_PASS_REQUISITIONER!,
            storageStatePath: '.auth/requisitioner.json',
          },
        },
      },
    },
    {
      name: 'auth-approver',
      testMatch: /auth-setup\.ts/,
      use: {
        pramanConfig: {
          auth: {
            username: process.env.SAP_USER_APPROVER!,
            password: process.env.SAP_PASS_APPROVER!,
            storageStatePath: '.auth/approver.json',
          },
        },
      },
    },
    // Tests per role
    {
      name: 'requisitioner-tests',
      dependencies: ['auth-requisitioner'],
      testMatch: /requisitioner\.spec\.ts/,
      use: { storageState: '.auth/requisitioner.json' },
    },
    {
      name: 'approver-tests',
      dependencies: ['auth-approver'],
      testMatch: /approver\.spec\.ts/,
      use: { storageState: '.auth/approver.json' },
    },
  ],
});
```

### Authorization-Aware Test Pattern

```typescript
test('Requisitioner cannot see Approve button', async ({ ui5, page }) => {
  await page.goto(`${process.env.SAP_BASE_URL}#PurchaseRequisition-manage`);
  await ui5.waitForUI5();

  // Verify Submit is visible
  const submitBtn = await ui5.control({
    controlType: 'sap.m.Button',
    properties: { text: 'Submit' },
  });
  expect(submitBtn).toBeTruthy();

  // Verify Approve is NOT visible (authorization-restricted)
  const approveButtons = await ui5.controls({
    controlType: 'sap.m.Button',
    properties: { text: 'Approve' },
  });
  expect(approveButtons).toHaveLength(0);
});
```

### Scoring Criteria

| Metric                               | Target                                        | How to Measure                      |
| ------------------------------------ | --------------------------------------------- | ----------------------------------- |
| Agent detects role-specific controls | Plans for 2 roles show different control sets | Diff plan outputs                   |
| Negative assertions                  | Agent generates "button NOT visible" checks   | Code review                         |
| Auth isolation                       | Sessions don't leak between roles             | Run role-specific tests in parallel |
| Role count supported                 | 3+ roles in single config                     | Add a 3rd role, verify config works |

---

## Scenario 5: Transport-Induced UI Drift

**Why this is the #1 maintenance problem**: In SAP, transports carry code and configuration changes from DEV → QA → PROD. A transport that adds a field to a CDS view, changes an annotation, or modifies a custom extension changes the UI without any code deployment. Tests that passed yesterday fail today — not because someone pushed a code change, but because a transport arrived.

This is the scenario where AI healing proves its value.

### The Experiment

1. **Week 1**: Run the Planner against your QA system. Generate specs. Verify they pass.
2. **Week 2**: After a transport cycle imports changes, run the same specs **without modification**.
3. **Measure**: How many fail? What broke? How fast can the Healer fix them?

### Healer Agent in Action

```bash
# Tests fail after transport import
npx playwright test tests/e2e/po-list-report.spec.ts
# ✗ 3 failed, 2 passed

# Run the Healer
npx playwright-praman heal \
  --spec tests/e2e/po-list-report.spec.ts \
  --output tests/e2e/po-list-report.spec.ts  # in-place fix
```

The Healer:

- Reads the failing spec and error messages
- Opens a headed browser to the failing page
- Discovers the current control tree
- Identifies what changed (renamed field, moved control, new required field)
- Updates selectors, adds missing steps, adjusts assertions
- Writes the fixed spec

### Cross-Environment Validation

```typescript
// playwright.config.ts — same tests, different SAP systems
export default defineConfig({
  projects: [
    {
      name: 'dev',
      use: {
        baseURL: process.env.SAP_DEV_URL,
        storageState: '.auth/dev-session.json',
      },
    },
    {
      name: 'qa',
      use: {
        baseURL: process.env.SAP_QA_URL,
        storageState: '.auth/qa-session.json',
      },
    },
    {
      name: 'prod-smoke',
      use: {
        baseURL: process.env.SAP_PROD_URL,
        storageState: '.auth/prod-session.json',
      },
    },
  ],
});
```

```bash
# Run same tests across all environments
npx playwright test --project=dev --project=qa --project=prod-smoke
```

### Scoring Criteria

| Metric                        | Target                                       | How to Measure                              |
| ----------------------------- | -------------------------------------------- | ------------------------------------------- |
| Post-transport failure rate   | <30% of tests break after normal transport   | Count failures after a real transport cycle |
| Healer fix rate               | >80% of failures fixed automatically         | Run healer, count auto-fixed vs. manual-fix |
| Healing time                  | <3 min per failing test                      | Measure healer wall-clock time              |
| Cross-environment portability | Same spec runs on DEV + QA                   | Run with `--project=dev --project=qa`       |
| False positives               | 0 tests "fixed" by removing valid assertions | Code review healer output                   |

---

## Scenario 6: CI Parallelization

**Why this tests scalability**: An enterprise SAP test suite has 500-2,000 tests. If each takes 30 seconds, a serial run takes 4-16 hours. Parallelization is not a nice-to-have — it is a gate to adoption. But SAP apps are stateful: parallel tests that modify the same data produce flaky results. The POC must validate that Praman handles this correctly.

### Sharding Configuration

```yaml
# .github/workflows/sap-e2e.yml
name: SAP E2E Tests
on: [push, pull_request]

jobs:
  e2e:
    strategy:
      fail-fast: false
      matrix:
        shard: [1, 2, 3, 4, 5, 6]
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '22'
      - run: npm ci
      - run: npx playwright install chromium

      # Run tests with sharding
      - run: npx playwright test --shard=${{ matrix.shard }}/6
        env:
          SAP_BASE_URL: ${{ secrets.SAP_QA_URL }}
          SAP_USERNAME: ${{ secrets.SAP_USERNAME }}
          SAP_PASSWORD: ${{ secrets.SAP_PASSWORD }}

      # Upload results for merge
      - uses: actions/upload-artifact@v4
        if: always()
        with:
          name: results-${{ matrix.shard }}
          path: test-results/

  merge-reports:
    needs: e2e
    if: always()
    runs-on: ubuntu-latest
    steps:
      - uses: actions/download-artifact@v4
        with:
          pattern: results-*
          merge-multiple: true
      - run: npx playwright merge-reports test-results --reporter=html
```

### Data Isolation Per Worker

```typescript
test('edit PO assigned to this shard', async ({ ui5, page }, testInfo) => {
  // Each worker gets a unique PO from the pool
  const poPool = [
    '4500000001',
    '4500000002',
    '4500000003',
    '4500000004',
    '4500000005',
    '4500000006',
  ];
  const myPO = poPool[testInfo.workerIndex % poPool.length];

  await page.goto(`${process.env.SAP_BASE_URL}#PurchaseOrder-manage&/PurchaseOrder('${myPO}')`);
  await ui5.waitForUI5();

  // Safe to edit — no other worker touches this PO
  await ui5.press({ controlType: 'sap.m.Button', properties: { text: 'Edit' } });
  await ui5.fill(
    { controlType: 'sap.ui.comp.smartfield.SmartField', bindingPath: { path: 'Note' } },
    `Updated by shard ${testInfo.workerIndex}`,
  );
  await ui5.press({ controlType: 'sap.m.Button', properties: { text: 'Save' } });
});
```

### Scaling Benchmark

Run the suite at 1, 2, 4, and 6 shards and record:

| Shards | Wall-Clock Time | Pass Rate  | Cost (CI minutes) |
| ------ | --------------- | ---------- | ----------------- |
| 1      | _baseline_      | _baseline_ | _baseline_        |
| 2      |                 |            |                   |
| 4      |                 |            |                   |
| 6      |                 |            |                   |

### Scoring Criteria

| Metric               | Target                                           | How to Measure               |
| -------------------- | ------------------------------------------------ | ---------------------------- |
| Linear scaling       | 4 shards = ~4x speedup (accounting for overhead) | Benchmark table above        |
| No data collision    | 0 flaky tests caused by concurrent data access   | Run 6-shard suite 3 times    |
| Report merging       | Single HTML report from all shards               | Check merged report artifact |
| SAP session handling | No auth failures under parallel load             | Monitor SAP ICM logs         |

---

## Scenario 7: Flaky Network Conditions

**Why this tests resilience**: SAP Gateway calls fail. OData batch requests time out. Corporate proxies drop connections. SSL certificates expire mid-session. If a test framework does not handle transient network failures gracefully, every flaky network event becomes a false-negative test failure — and your team stops trusting the results.

### Simulating Network Degradation

```typescript
import { test, expect } from 'playwright-praman';

test.describe('Network resilience', () => {
  test('survives slow OData response', async ({ ui5, page, context }) => {
    // Throttle all OData calls to 3G speed
    const cdp = await context.newCDPSession(page);
    await cdp.send('Network.emulateNetworkConditions', {
      offline: false,
      downloadThroughput: (500 * 1024) / 8, // 500 Kbps
      uploadThroughput: (500 * 1024) / 8,
      latency: 400, // 400ms RTT
    });

    await page.goto(`${process.env.SAP_BASE_URL}#PurchaseOrder-manage`);
    await ui5.waitForUI5(); // Must succeed despite slow network

    await ui5.press({ controlType: 'sap.m.Button', properties: { text: 'Go' } });
    await ui5.waitForUI5();

    const table = await ui5.control({
      controlType: 'sap.ui.comp.smarttable.SmartTable',
    });
    expect(table).toBeTruthy();
  });

  test('handles OData 503 with retry', async ({ ui5, page }) => {
    let requestCount = 0;

    // Simulate gateway returning 503 on first attempt
    await page.route('**/sap/opu/odata/**', async (route) => {
      requestCount++;
      if (requestCount <= 2) {
        await route.fulfill({ status: 503, body: 'Service Unavailable' });
      } else {
        await route.continue();
      }
    });

    await page.goto(`${process.env.SAP_BASE_URL}#PurchaseOrder-manage`);

    // Praman's waitForUI5 includes retry logic for transient OData failures
    await ui5.waitForUI5({ timeout: 60_000 });
  });

  test('produces actionable error on persistent failure', async ({ ui5, page }) => {
    // Block all OData calls permanently
    await page.route('**/sap/opu/odata/**', (route) =>
      route.fulfill({ status: 500, body: 'Internal Server Error' }),
    );

    await page.goto(`${process.env.SAP_BASE_URL}#PurchaseOrder-manage`);

    // Expect a clear, structured error — not a generic timeout
    await expect(async () => {
      await ui5.waitForUI5({ timeout: 15_000 });
    }).rejects.toThrow(/ERR_/); // Praman error code, not generic Playwright timeout
  });
});
```

### Scoring Criteria

| Metric                 | Target                                        | How to Measure                             |
| ---------------------- | --------------------------------------------- | ------------------------------------------ |
| Slow network tolerance | Tests pass at 500Kbps with 400ms latency      | Run throttled suite                        |
| Transient 503 recovery | `waitForUI5` retries and succeeds             | Simulate 503 then recover                  |
| Error message quality  | Structured PramanError with code, suggestions | Inspect error output on persistent failure |
| Timeout configuration  | Configurable per-test and global              | Override timeout in single test            |

---

## Scenario 8: AI Healing Quality

**Why you must validate this**: Every test automation vendor claims "AI-powered self-healing." Most deliver regex-based selector fallback that handles trivial ID changes and breaks on anything structural. The POC must measure healing accuracy against _real_ SAP UI drift patterns — not toy examples.

### The Controlled Experiment

**Method**: Take a passing test. Introduce 5 categories of breakage. Run the Healer on each. Measure success rate.

| Breakage Type             | How to Simulate                              | Real-World Cause                          |
| ------------------------- | -------------------------------------------- | ----------------------------------------- |
| **ID change**             | Rename control ID in the app view            | App redeployment regenerates IDs          |
| **Property value change** | Change button text ("Save" → "Save Draft")   | Translation update or UX revision         |
| **Control relocation**    | Move a field from one form group to another  | Annotation change in CDS view             |
| **New required field**    | Add a mandatory field before the Save action | Business requirement change via transport |
| **Table column reorder**  | Swap column positions in SmartTable          | User personalization or annotation change |

### Running the Experiment

```bash
# 1. Verify baseline passes
npx playwright test tests/e2e/po-edit.spec.ts
# ✓ All passed

# 2. Introduce breakage (done manually in SAP customizing or by editing the spec)
# Example: change selector from text='Save' to text='SaveDraft' in the spec
sed -i "s/text: 'Save'/text: 'SaveDraft'/" tests/e2e/po-edit.spec.ts

# 3. Verify it fails
npx playwright test tests/e2e/po-edit.spec.ts
# ✗ 1 failed

# 4. Run the Healer
npx playwright-praman heal --spec tests/e2e/po-edit.spec.ts

# 5. Verify it passes again
npx playwright test tests/e2e/po-edit.spec.ts
# ✓ All passed

# 6. Review what the healer changed
git diff tests/e2e/po-edit.spec.ts
```

### Healing Accuracy Matrix

Fill this out during the POC:

| Breakage Type         | Auto-Healed? | Time to Heal | Notes |
| --------------------- | ------------ | ------------ | ----- |
| ID change             |              |              |       |
| Property value change |              |              |       |
| Control relocation    |              |              |       |
| New required field    |              |              |       |
| Table column reorder  |              |              |       |

### Scoring Criteria

| Metric               | Target                                              | How to Measure          |
| -------------------- | --------------------------------------------------- | ----------------------- |
| Overall healing rate | >80% (4 of 5 breakage types)                        | Healing accuracy matrix |
| Healing time         | <3 min average per failure                          | Wall-clock measurement  |
| Selector quality     | Healer produces semantic selectors, not fragile IDs | Code review             |
| No false fixes       | 0 cases where healer "fixes" by removing assertions | Diff review             |
| Confidence reporting | Healer reports confidence level per fix             | Check healer output     |

---

## Scenario 9: OData Assertions

**Why this is a differentiator**: Most test tools validate what the _UI shows_. Praman also validates what the _backend returns_. OData assertions let you verify that the data displayed in a SmartTable actually matches the OData response, that a Create operation sent the correct payload, and that batch requests are properly structured. This catches bugs that UI-only assertions miss entirely.

### Agent-First: OData-Aware Plan

```bash
# Plan with OData tracing enabled
npx playwright-praman plan \
  --url "$SAP_URL#PurchaseOrder-manage" \
  --auth .auth/sap-session.json \
  --odata-trace \
  --output tests/plans/po-odata-assertions.plan.json
```

The `--odata-trace` flag tells the planner to capture OData request/response pairs alongside UI interactions, producing richer assertion targets in the plan.

### OData Assertion Patterns

```typescript
import { test, expect } from 'playwright-praman';

test.describe('OData assertions', () => {
  test('verify list data matches OData response', async ({ ui5, page }) => {
    await page.goto(`${process.env.SAP_BASE_URL}#PurchaseOrder-manage`);
    await ui5.waitForUI5();

    // Read data directly from the UI5 OData model (browser-side, no HTTP)
    const orders = await ui5.odata.getModelData('/PurchaseOrderSet');
    expect(orders.length).toBeGreaterThan(0);

    // Verify specific entity properties
    const firstOrder = orders[0];
    expect(firstOrder).toHaveProperty('PurchaseOrder');
    expect(firstOrder).toHaveProperty('Supplier');
    expect(firstOrder).toHaveProperty('CompanyCode');
    expect(firstOrder.CompanyCode).toBe('1000');
  });

  test('intercept and validate OData Create payload', async ({ ui5, page }) => {
    const odataRequests: { method: string; url: string; body: string }[] = [];

    // Intercept OData calls
    page.on('request', (req) => {
      if (req.url().includes('/sap/opu/odata/') && req.method() === 'POST') {
        odataRequests.push({
          method: req.method(),
          url: req.url(),
          body: req.postData() ?? '',
        });
      }
    });

    await page.goto(`${process.env.SAP_BASE_URL}#PurchaseOrder-create`);
    await ui5.waitForUI5();

    // Fill form and save
    await ui5.fill(
      { controlType: 'sap.ui.comp.smartfield.SmartField', bindingPath: { path: 'Supplier' } },
      '100001',
    );
    await ui5.press({ controlType: 'sap.m.Button', properties: { text: 'Save' } });
    await ui5.waitForUI5();

    // Assert the OData payload sent to the backend
    expect(odataRequests.length).toBeGreaterThan(0);
    const createRequest = odataRequests.find((r) => r.url.includes('PurchaseOrderSet'));
    expect(createRequest).toBeDefined();

    const payload = JSON.parse(createRequest!.body);
    expect(payload.Supplier).toBe('100001');
  });

  test('validate OData entity count matches table row count', async ({ ui5, page }) => {
    await page.goto(`${process.env.SAP_BASE_URL}#PurchaseOrder-manage`);
    await ui5.waitForUI5();

    await ui5.press({ controlType: 'sap.m.Button', properties: { text: 'Go' } });
    await ui5.waitForUI5();

    // Get count from OData model
    const odataCount = await ui5.odata.getEntityCount('/PurchaseOrderSet');

    // Get count from UI table
    const table = await ui5.control({
      controlType: 'sap.ui.comp.smarttable.SmartTable',
    });
    const uiCount = await ui5.table.getRowCount(table);

    // They must match — if they don't, there's a data binding bug
    expect(uiCount).toBe(odataCount);
  });
});
```

### OData Trace Reporter

Add the OData trace reporter to get performance analytics alongside test results:

```typescript
// playwright.config.ts
import { ODataTraceReporter } from 'playwright-praman/reporters';

export default defineConfig({
  reporter: [['html'], [ODataTraceReporter, { outputDir: 'reports/odata' }]],
});
```

Output in `reports/odata/odata-trace.json`:

```json
{
  "traces": [
    {
      "method": "GET",
      "url": "/sap/opu/odata/sap/API_PURCHASEORDER_PROCESS_SRV/PurchaseOrderSet",
      "entitySet": "PurchaseOrderSet",
      "status": 200,
      "duration": 340,
      "size": 12480
    }
  ],
  "aggregates": {
    "PurchaseOrderSet": {
      "GET": { "count": 12, "avgDuration": 340, "maxDuration": 1200, "errors": 0 }
    }
  }
}
```

### Scoring Criteria

| Metric                | Target                                         | How to Measure                                |
| --------------------- | ---------------------------------------------- | --------------------------------------------- |
| Model data access     | Can read OData model entities from browser     | `ui5.odata.getModelData()` returns data       |
| Request interception  | Can capture and assert OData payloads          | POST assertion test passes                    |
| UI/OData consistency  | Table row count matches OData $count           | Consistency test passes                       |
| Trace reporter output | JSON report with per-entity-set aggregates     | Check `reports/odata/odata-trace.json`        |
| CSRF handling         | Create/Update operations auto-fetch CSRF token | POST succeeds without manual token management |

---

## POC Scorecard

After completing all 9 scenarios, fill in this scorecard. Each scenario is scored 1-5:

| Score | Meaning                                          |
| ----- | ------------------------------------------------ |
| **5** | Agent handled end-to-end, no manual intervention |
| **4** | Agent handled >80%, minor manual touch-up        |
| **3** | Agent handled ~50%, significant manual effort    |
| **2** | Agent produced a starting point, mostly manual   |
| **1** | Agent could not handle, fully manual             |

### Scorecard Template

| #   | Scenario                   | Agent Score (1-5) | Manual Effort | Stability (20 runs) | Notes |
| --- | -------------------------- | ----------------- | ------------- | ------------------- | ----- |
| 1   | Fiori Elements app         |                   |               |                     |       |
| 2   | Smart Tables/Forms         |                   |               |                     |       |
| 3   | Procurement workflow       |                   |               |                     |       |
| 4   | Role-based authorization   |                   |               |                     |       |
| 5   | Transport-induced UI drift |                   |               |                     |       |
| 6   | CI parallelization         |                   |               |                     |       |
| 7   | Flaky network conditions   |                   |               |                     |       |
| 8   | AI healing quality         |                   |               |                     |       |
| 9   | OData assertions           |                   |               |                     |       |
|     | **Weighted Total**         | **/45**           |               |                     |       |

### Weighting by Business Priority

Not all scenarios are equally important to every organization. Assign weights based on your context:

| Priority      | Typical Scenarios                                        | Weight |
| ------------- | -------------------------------------------------------- | ------ |
| **Must-Have** | Fiori Elements (#1), Smart Controls (#2), Workflows (#3) | 2x     |
| **Critical**  | Transport Drift (#5), CI (#6), AI Healing (#8)           | 1.5x   |
| **Important** | Auth (#4), Network (#7), OData (#9)                      | 1x     |

**Go/No-Go Thresholds:**

- **Strong Go**: Weighted score > 75% (34/45) — Praman handles your SAP landscape well
- **Conditional Go**: Weighted score 55-75% (25-34) — viable with investment in manual test engineering alongside agents
- **No-Go**: Weighted score < 55% (below 25) — significant gaps, re-evaluate after next Praman release

---

## Decision Framework: What to Present to Leadership

After the 4-week POC, your report should answer these questions:

### 1. Productivity Multiplier

_"How much faster is test creation with Praman agents vs. manual Playwright?"_

Measure: time to produce a passing spec for the same app, agent-assisted vs. manual.

### 2. Maintenance Cost Reduction

_"After a transport cycle, how many tests required manual intervention?"_

Measure: Scenario #5 results — healer fix rate and time.

### 3. Coverage Velocity

_"How many apps can we cover in a sprint?"_

Extrapolate from POC: if the team produced X specs in 4 weeks across 9 scenarios, project the rate for the full app portfolio.

### 4. CI Feasibility

_"Can we run the full suite in under 30 minutes?"_

Measure: Scenario #6 sharding results — extrapolate from POC suite size to target suite size.

### 5. Risk Assessment

_"What are the biggest technical risks?"_

Document: which scenarios scored below 3, what workarounds were needed, what Praman features are immature.

---

## Quick Start: Day 1 Checklist

If you want to get started today, here is the minimum viable POC setup:

```bash
# 1. Create project
mkdir sap-poc && cd sap-poc
npm init -y

# 2. Install Praman + Playwright
npm install playwright-praman @playwright/test
npx playwright install chromium

# 3. Initialize (scaffolds config, agents, auth setup)
npx playwright-praman init

# 4. Configure SAP credentials
cat > .env << 'EOF'
SAP_BASE_URL=https://your-sap.example.com
SAP_USERNAME=TEST_USER
SAP_PASSWORD=your-password
SAP_CLIENT=100
EOF

# 5. Run seed test to verify connectivity
npx playwright test --project=agent-seed-test

# 6. Point the planner at your first Fiori app
npx playwright-praman plan \
  --url "$SAP_BASE_URL/sap/bc/ui5_ui5/ui2/ushell/shells/abap/FioriLaunchpad.html#YourApp-display" \
  --auth .auth/sap-session.json \
  --output tests/plans/first-app.plan.json

# 7. Generate and run
npx playwright-praman generate --plan tests/plans/first-app.plan.json --output tests/e2e/first-app.spec.ts
npx playwright test tests/e2e/first-app.spec.ts
```

You will have a running test against your real SAP system in under an hour.

---

_Praman is open-source under the Apache-2.0 license.
[Docs](https://praman.dev) · [npm](https://www.npmjs.com/package/playwright-praman) · [GitHub](https://github.com/mrkanitkar/playwright-praman) · [Discord](#)_
