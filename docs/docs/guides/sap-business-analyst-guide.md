---
title: 'For SAP Business Analysts'
---

You know SAP business processes inside out. You can walk through a Purchase-to-Pay cycle
in your sleep, spot a missing three-way match before anyone else, and explain why a particular
approval workflow exists. This guide shows how that knowledge translates directly into
automated test coverage -- without requiring you to become a programmer.

## You Don't Need to Code

Praman includes an AI-powered workflow that turns plain-language business process descriptions
into executable Playwright tests. Here is how it works:

1. **You describe the process.** Write a business scenario the way you would explain it to a
   colleague: "Create a purchase order for vendor 100001 with material MAT-001, quantity 10,
   plant 1000. Save it and confirm the success message shows a PO number."

2. **The AI agent generates the test.** Praman's agent reads your description, opens the SAP
   Fiori app in a real browser, discovers the UI controls, and writes a complete Playwright test.

3. **The test engineer reviews and commits.** Your team's test engineer validates the generated
   test, adjusts selectors if needed, and adds it to version control.

4. **The test runs automatically.** Every time someone deploys a change, CI/CD runs the test
   and reports pass or fail -- with screenshots on failure.

You stay in your comfort zone (business process knowledge), and the tooling handles the
technical translation.

### The AI Command

When working with the Praman agent, a single command kicks off the full pipeline:

```text
/praman-sap-coverage
```

This command tells the agent to:

- **Plan**: Analyze the SAP app and identify testable scenarios
- **Generate**: Write Playwright tests for each scenario
- **Heal**: Fix any tests that fail on first run

You provide the business context. The agent handles the code.

## Your SAP Knowledge Is the Test Plan

Every piece of business knowledge you carry maps to a specific test automation artifact.

| What You Know                              | How It Becomes Test Automation               |
| ------------------------------------------ | -------------------------------------------- |
| Business processes (P2P, O2C, R2R)         | End-to-end test scenarios                    |
| SAP transactions (ME21N, VA01, FB60)       | Fiori app navigation via transaction mapping |
| Expected outcomes and golden rules         | Assertion criteria (pass/fail checks)        |
| Edge cases and business exceptions         | Negative test coverage                       |
| Compliance and audit requirements          | Automated evidence collection                |
| Approval workflows and authorization roles | Role-based test configurations               |
| Master data dependencies                   | Test data setup templates                    |
| Tolerance limits and thresholds            | Boundary value test cases                    |

When a BA says "the PO should not save without a valid vendor," that is already a test
specification. Praman turns it into an executable check.

## How a Test Gets Created

There are three paths from business requirement to running test. Your team will likely use
all three depending on the situation.

### Path A: AI Agent Generates from Your Description

You write a natural-language scenario. The agent does the rest.

**Your description:**

> Create a purchase order in the Manage Purchase Orders app. Use vendor 100001, purchasing
> organization 1000, company code 1000. Add one item: material MAT-001, quantity 10, plant 1000. Save and verify the success message contains a PO number.

**What the agent produces:**

A complete, runnable Playwright test file with Praman fixtures, proper navigation, field
interactions, and assertions. The test engineer on your team reviews and approves it.

### Path B: Test Engineer Writes from Your Functional Spec

You provide a structured specification. A test engineer translates it into code.

**Your spec:**

| Step | Action                     | Expected Result                     |
| ---- | -------------------------- | ----------------------------------- |
| 1    | Open Create Purchase Order | App loads, header fields are empty  |
| 2    | Enter Vendor: 100001       | Vendor name auto-populates          |
| 3    | Enter PurchOrg: 1000       | Field accepted                      |
| 4    | Enter Material: MAT-001    | Material description auto-populates |
| 5    | Enter Quantity: 10         | Field accepted                      |
| 6    | Click Save                 | Success message with PO number      |

**The test engineer maps each row to a `test.step()`.** The resulting test mirrors your
spec line by line.

### Path C: Record and Replay

A tester walks through the scenario in a browser while Praman records the interactions.
The recording is converted into a test file that can be edited and maintained. This approach
works well for complex workflows where describing every click would be tedious.

## Reading Test Results

After tests run, you get results in several formats. Here is what to look for.

### Playwright HTML Report

Open it with `npx playwright show-report`. The report shows:

- **Pass/Fail/Skip counts** at the top -- a quick health check
- **Each test** as a collapsible row. Green means pass, red means fail
- **Test steps** inside each test (the `test.step()` blocks). These match your spec steps
- **Screenshots on failure** -- an automatic browser screenshot captured at the moment of failure
- **Traces on retry** -- a full recording of every action, network call, and DOM change

When a test fails, the screenshot and trace tell you _exactly_ what the user would have seen.
You do not need to reproduce the issue manually.

### Business Process Heatmaps

When multiple tests cover a single business process (for example, P2P), Praman's reporter
can generate a heatmap showing which process steps are covered and which are not. This helps
you identify gaps in test coverage and prioritize new scenarios.

### Compliance Evidence Artifacts

Every test run produces timestamped artifacts: screenshots, trace files, and structured
JSON results. These serve as audit evidence that a process was validated at a specific point
in time. For SOX, GxP, or internal audit requirements, these artifacts can be archived
alongside your change documentation.

## SAP Transaction to Fiori App to Test Mapping

This table maps common SAP transactions to their Fiori equivalents and shows how Praman
tests interact with each.

| SAP TCode | Description              | Fiori App / Intent                     | Praman Test Approach                          |
| --------- | ------------------------ | -------------------------------------- | --------------------------------------------- |
| ME21N     | Create Purchase Order    | `PurchaseOrder-create`                 | `ui5Navigation` + `feObjectPage.fillField()`  |
| ME23N     | Display Purchase Order   | `PurchaseOrder-display`                | `feListReport` search + detail verification   |
| VA01      | Create Sales Order       | `SalesOrder-create`                    | `ui5Navigation` + `feObjectPage.fillField()`  |
| VA03      | Display Sales Order      | `SalesOrder-display`                   | `feListReport` search + field assertions      |
| FB60      | Enter Vendor Invoice     | `SupplierInvoice-create`               | `ui5.fill()` for SmartFields + post action    |
| FBL1N     | Vendor Line Items        | `SupplierLineItem-analyzeJournalEntry` | `feListReport` filters + row count assertions |
| CO01      | Create Production Order  | `ProductionOrder-create`               | `ui5Navigation` + header/operation fill       |
| MM01      | Create Material Master   | `Material-create`                      | Multi-tab navigation + field fill per view    |
| MIGO      | Goods Movement           | `GoodsReceipt-create`                  | PO reference + item verification + post       |
| VL01N     | Create Outbound Delivery | `OutboundDelivery-create`              | SO reference + picking quantity + post GI     |
| MIRO      | Invoice Verification     | `SupplierInvoice-verify`               | PO reference + amount match + post            |
| F-28      | Incoming Payment         | `IncomingPayment-post`                 | Customer + invoice reference + clearing       |

For the full mapping reference, see the [Transaction Mapping](./transaction-mapping) guide.

## What a Test Looks Like

Below is a complete test for creating a Purchase Order. Every line is commented to explain
what it does in business terms.

```typescript
// This line loads the Praman test framework.
// Think of it as "opening the test toolkit."
import { test, expect } from 'playwright-praman';

// Test data — the values we will enter into the PO form.
// Keeping them here makes it easy to change without touching the test logic.
const poData = {
  vendor: '100001', // SAP vendor number
  purchaseOrg: '1000', // Purchasing organization
  companyCode: '1000', // Company code
  material: 'MAT-001', // Material number for the line item
  quantity: '10', // Order quantity
  plant: '1000', // Receiving plant
};

// This defines a single test. The text in quotes is the test name
// that appears in reports.
test('create a standard purchase order', async ({
  ui5, // Tool for finding and interacting with SAP UI5 controls
  ui5Navigation, // Tool for navigating between SAP Fiori apps
  ui5Footer, // Tool for clicking footer buttons (Save, Edit, Cancel)
}) => {
  // Step 1: Navigate to the Create Purchase Order app.
  // This is equivalent to entering transaction ME21N in SAP GUI,
  // but for the Fiori version of the app.
  await test.step('Navigate to Create Purchase Order', async () => {
    await ui5Navigation.navigateToApp('PurchaseOrder-create');
  });

  // Step 2: Fill in the PO header fields.
  // Each ui5.fill() call finds a field on screen and types a value into it.
  await test.step('Fill header data', async () => {
    await ui5.fill({ id: 'vendorInput' }, poData.vendor);
    await ui5.fill({ id: 'purchOrgInput' }, poData.purchaseOrg);
    await ui5.fill({ id: 'compCodeInput' }, poData.companyCode);
  });

  // Step 3: Add a line item to the PO.
  await test.step('Add line item', async () => {
    await ui5.fill({ id: 'materialInput' }, poData.material);
    await ui5.fill({ id: 'quantityInput' }, poData.quantity);
    await ui5.fill({ id: 'plantInput' }, poData.plant);
  });

  // Step 4: Click the Save button in the footer bar.
  await test.step('Save the purchase order', async () => {
    await ui5Footer.clickSave();
  });

  // Step 5: Verify that SAP shows a success message.
  // This is the automated equivalent of visually checking
  // "Purchase Order 4500000123 created" on screen.
  await test.step('Verify success message', async () => {
    const message = await ui5.control({
      controlType: 'sap.m.MessageStrip',
      properties: { type: 'Success' },
      searchOpenDialogs: true,
    });
    await expect(message).toBeUI5Visible();
  });
});
```

When this test runs, the HTML report shows five collapsible steps -- one per `test.step()`
block. If step 4 fails, you see a screenshot of the exact screen state at the moment of
failure, so you can immediately tell whether it was a data issue, a missing authorization,
or an application bug.

## Your Role in the Team

You do not need to write code to add value to test automation. Here is how your existing
activities map to the testing workflow.

| Your Current Activity               | Test Automation Contribution               | Artifact You Produce                  |
| ----------------------------------- | ------------------------------------------ | ------------------------------------- |
| Write functional specifications     | Define test scenarios and expected results | Scenario descriptions or spec tables  |
| Validate UAT results                | Review Playwright HTML reports             | Pass/fail sign-off                    |
| Document business rules             | Define assertion criteria                  | Expected value lists, tolerance rules |
| Identify edge cases and exceptions  | Define negative test cases                 | Edge case catalog                     |
| Manage test data in spreadsheets    | Configure test data templates              | Data sets for parameterized tests     |
| Map process flows (Visio, Signavio) | Define end-to-end test chains              | Process flow to test step mapping     |
| Verify compliance requirements      | Review audit evidence artifacts            | Compliance checklist sign-off         |
| Triage production defects           | Prioritize regression test additions       | Defect-to-test-case traceability      |

The most effective SAP test automation teams pair a Business Analyst with a Test Engineer.
The BA defines _what_ to test and _what the expected outcome is_. The engineer handles _how_
it gets automated.

## Glossary of Technical Terms

These terms come up frequently in test automation conversations. Each is explained using
SAP-familiar analogies.

| Term            | Definition                                                                                                                                                                                                         |
| --------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **TypeScript**  | The programming language tests are written in. Think of it as ABAP for the browser -- a typed, structured language that catches errors before runtime.                                                             |
| **npm**         | The package manager for JavaScript/TypeScript projects. Similar to how you install transports in SAP -- `npm install` brings in the libraries your project needs.                                                  |
| **Fixture**     | A pre-configured helper object injected into your test automatically. Similar to an ECATT variant that provides test data and tools -- you request `ui5` or `fe` in your test signature and they are ready to use. |
| **Assertion**   | A check that verifies an expected outcome. The `expect()` function is the automated equivalent of a UAT tester visually confirming "the PO number appears on screen."                                              |
| **Selector**    | The address of a UI element on screen. Like a field technical name in SAP (e.g., `EKKO-EBELN`), a selector tells Praman which control to interact with.                                                            |
| **CI/CD**       | Continuous Integration / Continuous Delivery. An automated pipeline that runs tests every time code changes are deployed -- like a transport release process that includes automatic quality checks.               |
| **Git**         | Version control for code files. Similar to SAP transport management -- it tracks who changed what, when, and why. Developers work in "branches" (like transport requests) and merge them into the main codebase.   |
| **HTML Report** | The test results page generated by Playwright. Open it in any browser to see pass/fail status, screenshots, and step-by-step traces for every test.                                                                |
| **Test Step**   | A named block within a test (`test.step()`). Corresponds to a row in your functional spec -- "Step 3: Enter vendor number." Steps appear as collapsible sections in the report.                                    |
| **Headed Mode** | Running the browser visibly on screen so you can watch the test execute. Useful for demos and debugging. In CI/CD, tests run "headless" (no visible browser) for speed.                                            |

## Next Steps

Ready to go deeper? Here is a suggested reading path.

1. **[Getting Started](./getting-started)** -- Install Praman and run your first test
2. **[Playwright Primer](./playwright-primer)** -- Ground-up introduction for non-programmers
3. **[Business Process Examples](./business-process-examples)** -- Complete P2P, O2C, and R2R test examples
4. **[Running Your Agent](./running-your-agent)** -- Set up and run the AI-powered test generation agent
5. **[Transaction Mapping](./transaction-mapping)** -- Full SAP transaction to Fiori app mapping reference
