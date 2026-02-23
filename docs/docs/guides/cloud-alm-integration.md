---
sidebar_position: 42
title: Cloud ALM Integration
---

# Cloud ALM Integration (P5-010)

SAP Cloud ALM Test Automation supports JUnit XML import for automated test results. Praman
generates JUnit 5 XML via Playwright's built-in JUnit reporter, with annotations for
requirements traceability, test plan mapping, and hybrid manual+automated execution.

## JUnit 5 XML Reporter Setup

Playwright ships a JUnit reporter that produces XML compatible with Cloud ALM's Test
Automation API import endpoint.

```typescript
// playwright.config.ts
import { defineConfig } from '@playwright/test';

export default defineConfig({
  reporter: [
    ['html'],
    [
      'junit',
      {
        outputFile: 'reports/junit-results.xml',
        // Include test steps as nested testcases for Cloud ALM drill-down
        includeProjectInTestName: true,
      },
    ],
  ],
});
```

The generated XML follows JUnit 5 schema:

```xml
<?xml version="1.0" encoding="UTF-8"?>
<testsuites name="Praman E2E" tests="12" failures="1" errors="0" time="142.5">
  <testsuite name="Purchase Order Creation" tests="4" failures="0" time="45.2">
    <testcase name="create standard PO" classname="procurement.create-po" time="12.3">
      <system-out>Navigate to ME21N > Fill header > Add line item > Save</system-out>
    </testcase>
    <testcase name="create PO with contract reference" classname="procurement.create-po" time="15.1"/>
  </testsuite>
</testsuites>
```

## Cloud ALM Import

Upload results to Cloud ALM via the Test Automation API:

```bash
# Upload JUnit XML to Cloud ALM
curl -X POST \
  "https://<cloud-alm-host>/api/calm-testautomation/v1/testResults" \
  -H "Authorization: Bearer $CALM_TOKEN" \
  -H "Content-Type: application/xml" \
  -d @reports/junit-results.xml
```

In a CI pipeline (GitHub Actions):

```yaml
# .github/workflows/e2e.yml
- name: Run Praman E2E tests
  run: npx playwright test

- name: Upload results to Cloud ALM
  if: always()
  run: |
    curl -X POST \
      "${{ secrets.CALM_API_URL }}/testResults" \
      -H "Authorization: Bearer ${{ secrets.CALM_TOKEN }}" \
      -H "Content-Type: application/xml" \
      -d @reports/junit-results.xml
```

## Test Plan Orchestration via Annotations

Use Playwright's `test.info().annotations` to map tests to Cloud ALM test plans, test cases,
and requirements. These annotations are preserved in the JUnit XML output and can be parsed
by Cloud ALM import processors.

### Mapping Tests to Cloud ALM Test Cases

```typescript
import { test, expect } from 'playwright-praman';

test.describe('Sales Order Processing', () => {
  test('create sales order from quotation', async ({ ui5, ui5Navigation }) => {
    // Map to Cloud ALM test case
    test
      .info()
      .annotations.push(
        { type: 'calmTestCaseId', description: 'TC-SO-001' },
        { type: 'calmTestPlanId', description: 'TP-2026-Q1-SALES' },
        { type: 'calmScope', description: 'S/4HANA Sales' },
      );

    await test.step('navigate to Create Sales Order', async () => {
      await ui5Navigation.navigateToApp('SD-SLS-SO', {
        semanticObject: 'SalesOrder',
        action: 'create',
      });
    });

    await test.step('fill order data and save', async () => {
      await ui5.fill({ id: /customerInput/ }, 'CUST-1000');
      await ui5.fill({ id: /materialInput/ }, 'MAT-200');
      await ui5.click({ controlType: 'sap.m.Button', properties: { text: 'Save' } });
    });
  });
});
```

### Organizing by Test Plan

```typescript
// Tag entire describe blocks with a test plan
test.describe('Q1 2026 Regression Suite @TP-2026-Q1-REG', () => {
  test.beforeEach(async ({}, testInfo) => {
    testInfo.annotations.push({ type: 'calmTestPlanId', description: 'TP-2026-Q1-REG' });
  });

  test('verify vendor master data', async ({ ui5 }) => {
    test.info().annotations.push({ type: 'calmTestCaseId', description: 'TC-MM-042' });
    // ... test steps
  });

  test('verify purchase order approval workflow', async ({ ui5 }) => {
    test.info().annotations.push({ type: 'calmTestCaseId', description: 'TC-MM-043' });
    // ... test steps
  });
});
```

## Requirements Traceability

Link automated tests to requirements using `@requirementId` annotations. This enables
bidirectional traceability in Cloud ALM: requirement to test case, and test result to
requirement.

```typescript
test('purchase order three-way match', async ({ ui5, ui5Navigation }) => {
  // Link to requirements
  test
    .info()
    .annotations.push(
      { type: 'requirementId', description: 'REQ-FIN-301' },
      { type: 'requirementId', description: 'REQ-FIN-302' },
      { type: 'calmTestCaseId', description: 'TC-FIN-088' },
    );

  await test.step('verify invoice matches PO and GR', async () => {
    await ui5Navigation.navigateToApp('FI-INV', {
      semanticObject: 'SupplierInvoice',
      action: 'display',
    });

    const statusText = await ui5.control({
      controlType: 'sap.m.ObjectStatus',
      id: /matchStatus/,
    });
    await expect(statusText).toHaveUI5Text('Matched');
  });
});
```

### Extracting Traceability from JUnit XML

A post-processing script can extract annotations from JUnit XML for Cloud ALM import:

```typescript
// scripts/extract-traceability.ts
import { readFileSync } from 'node:fs';
import { XMLParser } from 'fast-xml-parser';

interface TraceabilityEntry {
  testCase: string;
  calmTestCaseId: string;
  requirementIds: string[];
  status: 'passed' | 'failed' | 'skipped';
}

function extractTraceability(junitPath: string): TraceabilityEntry[] {
  const xml = readFileSync(junitPath, 'utf-8');
  const parser = new XMLParser({ ignoreAttributes: false });
  const result = parser.parse(xml);

  const entries: TraceabilityEntry[] = [];

  for (const suite of result.testsuites.testsuite) {
    for (const tc of Array.isArray(suite.testcase) ? suite.testcase : [suite.testcase]) {
      // Extract annotations from system-out or properties
      const calmId = tc['@_calmTestCaseId'] ?? 'UNMAPPED';
      const reqIds = (tc['@_requirementId'] ?? '').split(',').filter(Boolean);

      entries.push({
        testCase: `${suite['@_name']} > ${tc['@_name']}`,
        calmTestCaseId: calmId,
        requirementIds: reqIds,
        status: tc.failure ? 'failed' : 'passed',
      });
    }
  }

  return entries;
}
```

## Hybrid Manual + Automated Test Execution

Cloud ALM supports mixed test plans where some test cases are automated and others are
executed manually. Praman tests coexist with manual test cases in the same test plan.

### Pattern: Automated Tests with Manual Checkpoints

```typescript
test('end-to-end procurement flow with manual approval', async ({ ui5, ui5Navigation }) => {
  test
    .info()
    .annotations.push(
      { type: 'calmTestCaseId', description: 'TC-P2P-001' },
      { type: 'executionType', description: 'hybrid' },
    );

  // Automated: Create purchase requisition
  await test.step('[automated] create purchase requisition', async () => {
    await ui5Navigation.navigateToApp('MM-PUR-PR', {
      semanticObject: 'PurchaseRequisition',
      action: 'create',
    });
    await ui5.fill({ id: /materialInput/ }, 'MAT-500');
    await ui5.fill({ id: /quantityInput/ }, '10');
    await ui5.click({ controlType: 'sap.m.Button', properties: { text: 'Submit' } });
  });

  // Manual checkpoint: manager approval happens outside Playwright
  // Cloud ALM test plan marks TC-P2P-001-APPROVAL as manual
  // The manual tester approves the PR, then the next automated test verifies

  // Automated: Verify approval status after manual step
  await test.step('[automated] verify requisition approved', async () => {
    await ui5Navigation.navigateToApp('MM-PUR-PR', {
      semanticObject: 'PurchaseRequisition',
      action: 'display',
    });
    const status = await ui5.control({
      controlType: 'sap.m.ObjectStatus',
      id: /approvalStatus/,
    });
    await expect(status).toHaveUI5Text('Approved');
  });
});
```

### Pattern: Gating Automated Tests on Manual Prerequisites

Use Playwright's `test.skip()` to gate automated tests on manual prerequisite completion:

```typescript
test('process approved purchase order', async ({ ui5, ui5Navigation }) => {
  test
    .info()
    .annotations.push(
      { type: 'calmTestCaseId', description: 'TC-P2P-003' },
      { type: 'dependsOn', description: 'TC-P2P-002-MANUAL-APPROVAL' },
    );

  // Skip if manual prerequisite is not complete
  // In CI, this can be controlled via environment variable
  const manualApprovalDone = process.env['MANUAL_APPROVAL_COMPLETE'] === 'true';
  test.skip(!manualApprovalDone, 'Waiting for manual approval step TC-P2P-002');

  await test.step('convert approved PR to purchase order', async () => {
    // ... automated conversion steps
  });
});
```

## Cloud ALM Dashboard Mapping

After import, tests appear in Cloud ALM with this structure:

| Cloud ALM Field | Playwright Source                                   |
| --------------- | --------------------------------------------------- |
| Test Plan       | `calmTestPlanId` annotation                         |
| Test Case       | `calmTestCaseId` annotation                         |
| Requirement     | `requirementId` annotation                          |
| Execution Type  | `executionType` annotation (`automated` / `hybrid`) |
| Test Suite      | `describe()` block name                             |
| Test Name       | `test()` title                                      |
| Duration        | Playwright test duration (seconds)                  |
| Status          | `passed` / `failed` / `skipped`                     |
| Error Details   | Assertion error message + stack trace               |
| Steps           | `test.step()` names in `system-out`                 |
