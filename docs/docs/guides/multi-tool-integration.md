---
sidebar_position: 55
title: Multi-Tool Integration
---

# Multi-Tool Integration

Praman generates test results as standard Playwright output (HTML, JUnit XML, JSON). For teams
using external test management tools -- Tricentis qTest, TestRail, Xray for Jira -- this guide
covers adapter patterns for forwarding results.

## Architecture: Custom Playwright Reporters

Each integration follows the same pattern: a custom Playwright reporter that transforms test
results into the target tool's API format.

```
Playwright Test Run
       │
       ▼
┌──────────────┐
│  Reporter    │  onBegin / onTestEnd / onEnd
│  (adapter)   │
└──────┬───────┘
       │
       ▼
┌──────────────┐
│  Tool API    │  qTest / TestRail / Xray
│  (HTTP)      │
└──────────────┘
```

All adapters extend Playwright's `Reporter` interface and run passively alongside tests --
no test code changes required.

## Base Reporter Class

A shared base class handles common concerns: batching, error handling, and retry logic.

```typescript
// reporters/base-tool-reporter.ts
import type { Reporter, TestCase, TestResult, FullResult } from '@playwright/test/reporter';

interface ToolReporterConfig {
  /** API base URL for the test management tool */
  apiUrl: string;
  /** Authentication token or API key */
  apiToken: string;
  /** Project or container ID in the target tool */
  projectId: string;
  /** Batch size for API calls (default: 50) */
  batchSize?: number;
  /** Retry failed API calls (default: 3) */
  maxRetries?: number;
}

interface PendingResult {
  testTitle: string;
  suiteName: string;
  status: 'passed' | 'failed' | 'skipped';
  duration: number;
  errorMessage?: string;
  annotations: Record<string, string>;
}

abstract class BaseToolReporter implements Reporter {
  protected readonly config: ToolReporterConfig;
  protected readonly results: PendingResult[] = [];

  constructor(config: ToolReporterConfig) {
    this.config = config;
  }

  onTestEnd(test: TestCase, result: TestResult): void {
    const annotations: Record<string, string> = {};
    for (const ann of test.annotations) {
      annotations[ann.type] = ann.description ?? '';
    }

    this.results.push({
      testTitle: test.title,
      suiteName: test.parent.title,
      status:
        result.status === 'passed' ? 'passed' : result.status === 'failed' ? 'failed' : 'skipped',
      duration: result.duration,
      errorMessage: result.errors.map((e) => e.message).join('\n'),
      annotations,
    });
  }

  async onEnd(result: FullResult): Promise<void> {
    const batchSize = this.config.batchSize ?? 50;
    for (let i = 0; i < this.results.length; i += batchSize) {
      const batch = this.results.slice(i, i + batchSize);
      await this.uploadBatch(batch);
    }
  }

  /** Implement this method to upload a batch of results to the target tool */
  protected abstract uploadBatch(batch: PendingResult[]): Promise<void>;

  /** HTTP POST with retry logic */
  protected async postWithRetry(url: string, body: unknown): Promise<Response> {
    const maxRetries = this.config.maxRetries ?? 3;
    let lastError: Error | undefined;

    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        const response = await fetch(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${this.config.apiToken}`,
          },
          body: JSON.stringify(body),
        });

        if (response.ok) return response;
        if (response.status >= 400 && response.status < 500) {
          // Client errors are not retryable
          throw new Error(`API error ${response.status}: ${await response.text()}`);
        }
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
      }

      // Exponential backoff with jitter
      const delay = Math.min(1000 * 2 ** attempt + Math.random() * 500, 10_000);
      await new Promise((resolve) => setTimeout(resolve, delay));
    }

    throw lastError ?? new Error('Upload failed after retries');
  }
}
```

## Tricentis qTest Adapter

qTest uses a REST API for test execution results. The adapter maps Playwright tests to qTest
test runs.

```typescript
// reporters/qtest-reporter.ts

interface QTestConfig extends ToolReporterConfig {
  /** qTest test cycle ID */
  testCycleId: string;
}

class QTestReporter extends BaseToolReporter {
  private readonly testCycleId: string;

  constructor(config: QTestConfig) {
    super(config);
    this.testCycleId = config.testCycleId;
  }

  protected async uploadBatch(batch: PendingResult[]): Promise<void> {
    const testLogs = batch.map((result) => ({
      name: result.testTitle,
      status: this.mapStatus(result.status),
      exe_start_date: new Date().toISOString(),
      exe_end_date: new Date(Date.now() + result.duration).toISOString(),
      note: result.errorMessage ?? '',
      test_case_version_id: result.annotations['qtestCaseId'] ?? undefined,
      // Map test steps from Playwright step names
      test_step_logs: [],
    }));

    await this.postWithRetry(
      `${this.config.apiUrl}/api/v3/projects/${this.config.projectId}/test-runs`,
      { test_logs: testLogs, parent_id: this.testCycleId, parent_type: 'test-cycle' },
    );
  }

  private mapStatus(status: string): string {
    switch (status) {
      case 'passed':
        return 'PASSED';
      case 'failed':
        return 'FAILED';
      default:
        return 'SKIPPED';
    }
  }
}

// Usage in playwright.config.ts:
// reporter: [[QTestReporter, {
//   apiUrl: 'https://mycompany.qtestnet.com',
//   apiToken: process.env.QTEST_TOKEN,
//   projectId: '12345',
//   testCycleId: '67890',
// }]]
```

Link tests to qTest test cases using annotations:

```typescript
test('create purchase order', async ({ ui5 }) => {
  test.info().annotations.push({ type: 'qtestCaseId', description: 'TC-45678' });
  // ... test steps
});
```

## TestRail Adapter

TestRail's API accepts results per test run. The adapter creates or updates a test run with
results.

```typescript
// reporters/testrail-reporter.ts

interface TestRailConfig extends ToolReporterConfig {
  /** TestRail test run ID (or 'auto' to create new runs) */
  runId: string | 'auto';
  /** Suite ID for auto-created runs */
  suiteId?: string;
}

class TestRailReporter extends BaseToolReporter {
  private readonly runId: string;
  private readonly suiteId?: string;

  constructor(config: TestRailConfig) {
    super(config);
    this.runId = config.runId;
    this.suiteId = config.suiteId;
  }

  protected async uploadBatch(batch: PendingResult[]): Promise<void> {
    let runId = this.runId;

    // Auto-create a test run if configured
    if (runId === 'auto') {
      const response = await this.postWithRetry(
        `${this.config.apiUrl}/index.php?/api/v2/add_run/${this.config.projectId}`,
        {
          suite_id: this.suiteId,
          name: `Praman E2E - ${new Date().toISOString().slice(0, 10)}`,
          include_all: false,
          case_ids: batch
            .map((r) => r.annotations['testrailCaseId'])
            .filter(Boolean)
            .map(Number),
        },
      );
      const data = (await response.json()) as { id: number };
      runId = String(data.id);
    }

    // Upload results
    const results = batch
      .filter((r) => r.annotations['testrailCaseId'])
      .map((r) => ({
        case_id: Number(r.annotations['testrailCaseId']),
        status_id: r.status === 'passed' ? 1 : r.status === 'failed' ? 5 : 2,
        elapsed: `${Math.round(r.duration / 1000)}s`,
        comment: r.errorMessage ?? 'Automated test passed',
      }));

    await this.postWithRetry(
      `${this.config.apiUrl}/index.php?/api/v2/add_results_for_cases/${runId}`,
      { results },
    );
  }
}

// Usage in playwright.config.ts:
// reporter: [[TestRailReporter, {
//   apiUrl: 'https://mycompany.testrail.io',
//   apiToken: process.env.TESTRAIL_TOKEN,
//   projectId: '1',
//   runId: 'auto',
//   suiteId: '5',
// }]]
```

Link tests to TestRail cases:

```typescript
test('verify three-way match', async ({ ui5 }) => {
  test.info().annotations.push({ type: 'testrailCaseId', description: '7891' });
  // ... test steps
});
```

## Xray for Jira Adapter

Xray supports both Cloud and Server/Data Center deployments. The adapter uses the Xray REST
API to import execution results.

```typescript
// reporters/xray-reporter.ts

interface XrayConfig extends ToolReporterConfig {
  /** Xray deployment type */
  deployment: 'cloud' | 'server';
  /** Jira project key */
  jiraProjectKey: string;
  /** Test plan issue key (e.g., 'PROJ-123') */
  testPlanKey?: string;
}

class XrayReporter extends BaseToolReporter {
  private readonly deployment: string;
  private readonly jiraProjectKey: string;
  private readonly testPlanKey?: string;

  constructor(config: XrayConfig) {
    super(config);
    this.deployment = config.deployment;
    this.jiraProjectKey = config.jiraProjectKey;
    this.testPlanKey = config.testPlanKey;
  }

  protected async uploadBatch(batch: PendingResult[]): Promise<void> {
    const execution = {
      testExecutionKey: undefined as string | undefined,
      info: {
        project: this.jiraProjectKey,
        summary: `Praman E2E - ${new Date().toISOString().slice(0, 10)}`,
        description: 'Automated test execution via Praman + Playwright',
        testPlanKey: this.testPlanKey,
      },
      tests: batch
        .filter((r) => r.annotations['xrayTestKey'])
        .map((r) => ({
          testKey: r.annotations['xrayTestKey'],
          status: r.status === 'passed' ? 'PASSED' : r.status === 'failed' ? 'FAILED' : 'TODO',
          comment: r.errorMessage ?? '',
          executedBy: 'praman-automation',
          start: new Date().toISOString(),
          finish: new Date(Date.now() + r.duration).toISOString(),
        })),
    };

    const apiBase =
      this.deployment === 'cloud'
        ? 'https://xray.cloud.getxray.app/api/v2'
        : `${this.config.apiUrl}/rest/raven/2.0/api`;

    await this.postWithRetry(`${apiBase}/import/execution`, execution);
  }
}

// Usage in playwright.config.ts:
// reporter: [[XrayReporter, {
//   apiUrl: 'https://jira.mycompany.com',
//   apiToken: process.env.XRAY_TOKEN,
//   projectId: 'PROJ',
//   deployment: 'cloud',
//   jiraProjectKey: 'PROJ',
//   testPlanKey: 'PROJ-456',
// }]]
```

Link tests to Xray test issues:

```typescript
test('validate goods receipt', async ({ ui5 }) => {
  test.info().annotations.push({ type: 'xrayTestKey', description: 'PROJ-789' });
  // ... test steps
});
```

## Using Multiple Reporters Simultaneously

Playwright supports multiple reporters in parallel. Combine Praman reporters with tool-specific
adapters:

```typescript
// playwright.config.ts
import { ComplianceReporter, ODataTraceReporter } from 'playwright-praman/reporters';

export default defineConfig({
  reporter: [
    ['html'],
    ['junit', { outputFile: 'reports/junit-results.xml' }],
    [ComplianceReporter, { outputDir: 'reports' }],
    [ODataTraceReporter, { outputDir: 'reports' }],
    // Add your tool-specific reporter
    [
      TestRailReporter,
      {
        apiUrl: process.env['TESTRAIL_URL']!,
        apiToken: process.env['TESTRAIL_TOKEN']!,
        projectId: '1',
        runId: 'auto',
        suiteId: '5',
      },
    ],
  ],
});
```

## Annotation Convention Summary

| Annotation Type  | Description                     | Used By          |
| ---------------- | ------------------------------- | ---------------- |
| `qtestCaseId`    | qTest test case ID              | qTest adapter    |
| `testrailCaseId` | TestRail case ID (numeric)      | TestRail adapter |
| `xrayTestKey`    | Xray/Jira issue key             | Xray adapter     |
| `calmTestCaseId` | Cloud ALM test case ID          | Cloud ALM        |
| `calmTestPlanId` | Cloud ALM test plan ID          | Cloud ALM        |
| `requirementId`  | Requirement ID for traceability | All tools        |
| `executionType`  | `automated` / `hybrid`          | Cloud ALM        |

These annotations are additive -- a single test can carry annotations for multiple tools,
enabling parallel reporting to different systems from the same test run.
