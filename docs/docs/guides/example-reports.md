---
title: Example Reports & Data Architecture
---

# Example Reports & Data Architecture

Praman generates 12 dashboard reports that provide a comprehensive view of SAP S/4HANA quality across functional testing, performance, accessibility,
integration, and geographic readiness. This guide explains how each report gets its data and what Praman is responsible for producing.

:::important
These reports are examples of what you can design and develop. Please read the documentation help for more details.
:::

## The 5 Data Source Categories

Every field in the quality dashboard traces back to one of 5 source categories:

| #   | Source                              | What It Is                                                                           |
| --- | ----------------------------------- | ------------------------------------------------------------------------------------ |
| 1   | **Playwright Test Execution**       | Direct output from Playwright + Praman running tests against SAP Fiori / UI5         |
| 2   | **SAP Backend Telemetry**           | Data extracted from SAP monitoring transactions (ST03N, STAD, SM37) via OData or RFC |
| 3   | **SAP Focused Run / Web Analytics** | Real User Monitoring (RUM) data from SAP observability tools                         |
| 4   | **Third-Party System APIs**         | Health and transaction data from connected external systems                          |
| 5   | **Configuration / Manual Input**    | Business metadata maintained by the project team (process owners, SLAs, revenue)     |

## Source Category Deep Dive

<details>
<summary><strong>Source 1: Playwright Test Execution (Praman)</strong></summary>

This is what Praman directly produces. Every Playwright test run generates:

**Per-test-step data:**

- Transaction response time (page.evaluate + UI5 rendering + network roundtrip)
- Pass / fail / blocked status with error message and screenshot
- Memory consumption (via `performance.measureUserAgentSpecificMemory()`)
- CPU time (via `PerformanceObserver` long task monitoring)
- Network timing (via `PerformanceResourceTiming` API)
- DOM snapshot and UI5 control tree state at point of failure

**Per-test-suite data:**

- Total scenarios executed, passed, failed, blocked
- Execution duration (wall clock)
- Browser/viewport/locale configuration used
- Playwright trace file (.zip) for debugging

**Accessibility scan data (via @axe-core/playwright):**

- WCAG violations per page with rule ID, severity, DOM selector, HTML snippet
- Principle classification (perceivable / operable / understandable / robust)
- Screen reader compatibility assertions
- Keyboard navigation assertions (focus trap detection, tab order)
- Color contrast ratios (computed from rendered styles)

**Integration test data:**

- HTTP response codes from OData/REST calls during test execution
- CPI iFlow message IDs triggered during test
- Response latency of each external API call intercepted by Playwright's route handler
- Data integrity assertions (field values match expected after cross-system flow)

**How Praman captures SAP-specific metrics:**

```javascript
// Inside Playwright test, Praman uses page.evaluate() to call UI5 native APIs
const metrics = await page.evaluate(() => {
  // UI5 performance measurement
  const perfMon = sap.ui.require('sap/ui/performance/Measurement');
  const measurements = perfMon.getAllMeasurements();

  // OData request timing
  const oDataModel = sap.ui.getCore().getModel();
  const pendingRequests = oDataModel.getPendingChanges();

  // Browser performance API
  const navTiming = performance.getEntriesByType('navigation')[0];
  const resourceTiming = performance.getEntriesByType('resource');

  return { measurements, navTiming, resourceTiming };
});
```

</details>

<details>
<summary><strong>Source 2: SAP Backend Telemetry</strong></summary>

Extracted from SAP via OData services, RFC calls, or scheduled ABAP reports:

| SAP Transaction                | What It Provides                                                  | How to Extract                             |
| ------------------------------ | ----------------------------------------------------------------- | ------------------------------------------ |
| **ST03N** (Workload Monitor)   | Per-TCode response time breakdown, peak load periods, user counts | OData or RFC: `SWNC_GET_WORKLOAD_SNAPSHOT` |
| **STAD** (Statistical Records) | Dialog step detail: frontend roundtrip, network, memory per step  | RFC: `SAPWL_STATREC_READ`                  |
| **SM37** (Job Monitor)         | Batch job execution times, status, start/end timestamps           | OData or RFC: `BAPI_XBP_JOB_STATUS_GET`    |
| **SM21** (System Log)          | Runtime errors, dumps, resource exhaustion events                 | RFC: `BAPI_XMI_LOGOFF` pattern             |
| **SLG1** (Application Log)     | Business-level errors (posting failures, workflow errors)         | OData: Application Log API                 |
| **SM59** (RFC Destinations)    | Connection status to external systems, latency                    | RFC: `RFC_SYSTEM_INFO`                     |
| **SE16/CDS Views**             | Master data record counts, migration verification                 | OData CDS View exposure                    |

</details>

<details>
<summary><strong>Source 3: SAP Focused Run / Web Analytics</strong></summary>

Real User Monitoring data — tells you what actual users experience vs what tests simulate:

| Tool                  | Data Provided                                                                                                 |
| --------------------- | ------------------------------------------------------------------------------------------------------------- |
| **Focused Run RUM**   | Browser type, OS, screen resolution, client-measured page load, network latency by geography, connection type |
| **SAP Web Analytics** | Geographic user distribution, locale preferences, Fiori app usage patterns, session duration                  |

Praman reads this data to set up browser contexts that match actual user conditions:

```javascript
// Praman configures Playwright context from Focused Run data
const context = await browser.newContext({
  locale: 'de-DE', // from Web Analytics
  viewport: { width: 1920, height: 1080 }, // from Focused Run RUM
  geolocation: { latitude: 50.1, longitude: 8.7 },
});
```

</details>

<details>
<summary><strong>Source 4: Third-Party System APIs</strong></summary>

Health and transaction data from connected external systems:

| System                 | What to Query                                             | API/Method                                     |
| ---------------------- | --------------------------------------------------------- | ---------------------------------------------- |
| **SAP CPI**            | iFlow execution logs, message status, error details       | CPI OData API: `/api/v1/MessageProcessingLogs` |
| **ERP Integrations**   | Connection status, OAuth token validity, sync queue depth | REST API health endpoints                      |
| **Banking Partners**   | File delivery status, payment status codes                | SFTP + EBICS/SWIFT status                      |
| **Logistics Carriers** | Shipment API response time, label generation success rate | Carrier tracking APIs                          |

</details>

<details>
<summary><strong>Source 5: Configuration / Manual Input</strong></summary>

Business metadata that doesn't come from any system — maintained by the project team:

- Process names, owners, business impact classification (critical/high/medium/low)
- Revenue-at-risk estimates per process
- SLA targets (response time thresholds, success rate targets)
- Rollout wave assignments (which countries in which wave)
- Company codes, currency, locale mappings
- Regulatory requirements (EAA, Section 508, etc.)
- Interface catalog (which interfaces exist, their criticality, message types)
- Role-to-process mappings, user counts per role

</details>

---

## The 12 Dashboard Reports

Click any report below to view its data model and field-by-field source mapping.

| #   | Report                                                                                     | Primary Sources                    |
| --- | ------------------------------------------------------------------------------------------ | ---------------------------------- |
| 1   | [Executive Steering Committee Dashboard](#report-1-executive-steering-committee-dashboard) | Playwright, Config                 |
| 2   | [Business Process Deep Dive](#report-2-business-process-deep-dive)                         | Playwright, Config                 |
| 3   | [Role-Based Readiness](#report-3-role-based-readiness)                                     | Playwright, Config, Web Analytics  |
| 4   | [Data Migration Quality](#report-4-data-migration-quality)                                 | Playwright, SAP Backend            |
| 5   | [Risk Register (CFO Report)](#report-5-risk-register-cfo-report)                           | Playwright, Config                 |
| 6   | [How It Works](#report-6-how-it-works)                                                     | Static                             |
| 7   | [Performance Heatmap](#report-7-performance-heatmap)                                       | Playwright, SAP Backend, Config    |
| 8   | [Geographic & Customer Impact](#report-8-geographic--customer-impact)                      | Playwright, Focused Run, Config    |
| 9   | [Real User Experience Simulation](#report-9-real-user-experience-simulation)               | Playwright, Config                 |
| 10  | [SAP FI — Financial Accounting Quality](#report-10-sap-fi--financial-accounting-quality)   | Playwright, SAP Backend, Config    |
| 11  | [WCAG 2.1 AA Accessibility Compliance](#report-11-wcag-21-aa-accessibility-compliance)     | Playwright (axe-core), Config      |
| 12  | [Interface & Integration Quality](#report-12-interface--integration-quality)               | 3rd Party, SAP Backend, Playwright |
| 13  | [End-to-End Cross-System Quality](#report-13-end-to-end-cross-system-quality)              | Playwright, 3rd Party, Config      |

---

<details id="report-1-executive-steering-committee-dashboard">
<summary><strong>Report 1: Executive Steering Committee Dashboard</strong></summary>

**Data models:** `PROCESS_DATA`, `WEEKLY_TREND`

| Field                         | Source              | Detail                                        |
| ----------------------------- | ------------------- | --------------------------------------------- |
| `id`, `name`, `owner`         | Config              | Business process catalog                      |
| `tcodes`                      | Config              | Test scenario definitions                     |
| `totalScenarios`              | Playwright          | Count of test specs in suite                  |
| `passed`, `failed`, `blocked` | Playwright          | Test execution results                        |
| `businessImpact`              | Config              | Business classification                       |
| `revenueAtRisk`               | Config              | Finance team estimate                         |
| `usersAffected`               | Web Analytics       | User count per process                        |
| `failureDetails[].scenario`   | Playwright          | Test spec name that failed                    |
| `failureDetails[].severity`   | Config              | Pre-classified per test scenario              |
| `WEEKLY_TREND[].readiness`    | Playwright          | Computed: (passed / total) x 100              |
| `WEEKLY_TREND[].defectsOpen`  | Playwright + Config | Open defect count from failures + bug tracker |

</details>

<details id="report-2-business-process-deep-dive">
<summary><strong>Report 2: Business Process Deep Dive</strong></summary>

**Data models:** `PROCESS_DATA` (same as Report 1, different visualization)

All fields same as Report 1 — this report is a different view of the same data, showing per-process drill-down with TCode-level test results.

</details>

<details id="report-3-role-based-readiness">
<summary><strong>Report 3: Role-Based Readiness</strong></summary>

**Data models:** `ROLE_READINESS`

| Field           | Source        | Detail                                                 |
| --------------- | ------------- | ------------------------------------------------------ |
| `role`          | Config        | SAP role catalog (PFCG roles mapped to business roles) |
| `process`       | Config        | Role-to-process mapping                                |
| `readiness`     | Playwright    | % of test scenarios passing that this role executes    |
| `users`         | Web Analytics | Active user count for this role                        |
| `criticalPaths` | Config        | Number of critical test paths assigned to this role    |
| `blocked`       | Playwright    | Count of critical paths blocked/failing for this role  |

**How readiness is computed:** Each test scenario is tagged with the SAP roles that execute it. A role's readiness = (passing scenarios for that role) / (total scenarios for that role) x 100.

</details>

<details id="report-4-data-migration-quality">
<summary><strong>Report 4: Data Migration Quality</strong></summary>

**Data models:** `MIGRATION_DATA`

| Field       | Source           | Detail                                             |
| ----------- | ---------------- | -------------------------------------------------- |
| `entity`    | Config           | Migration object catalog                           |
| `records`   | SAP Backend      | Record count from CDS view                         |
| `validated` | Playwright + SAP | Praman runs validation queries via OData CDS views |
| `errors`    | Playwright + SAP | Records failing validation rules                   |
| `critical`  | Playwright + SAP | Subset classified as blocking                      |
| `status`    | Playwright       | Computed from error rate thresholds                |

```javascript
// Praman validates migration data via OData CDS views
const response = await request.get(
  '/sap/opu/odata/sap/Z_MIGRATION_VALIDATION_CDS/CustomerValidation?$filter=HasErrors eq true',
);
```

</details>

<details id="report-5-risk-register-cfo-report">
<summary><strong>Report 5: Risk Register (CFO Report)</strong></summary>

**Data models:** Derived from `PROCESS_DATA`, `MIGRATION_DATA`, `PERF_DATA`

| Field             | Source              | Detail                                                             |
| ----------------- | ------------------- | ------------------------------------------------------------------ |
| Risk items        | Playwright + Config | Auto-generated from failing tests, blocked scenarios, SLA breaches |
| Revenue at risk   | Config              | Finance team estimates linked to process failures                  |
| Mitigation status | Config              | Manual tracking of remediation progress                            |

This report is **fully derived** — no unique data model. It aggregates failure data from other reports and overlays business context.

</details>

<details id="report-6-how-it-works">
<summary><strong>Report 6: How It Works</strong></summary>

**Data models:** `SAP_DATA_SOURCES`

Static informational page describing the testing methodology. No dynamic data.

</details>

<details id="report-7-performance-heatmap">
<summary><strong>Report 7: Performance Heatmap</strong></summary>

**Data models:** `PERF_DATA` (processes, transactions, batchJobs, targets)

| Field                 | Source              | Detail                                         |
| --------------------- | ------------------- | ---------------------------------------------- |
| **Process-level**     |                     |                                                |
| `status`              | Playwright          | Computed from transaction performance vs SLA   |
| `e2eTime`             | Playwright          | Sum of all transaction avg times               |
| `avgMemory`           | Playwright          | `performance.measureUserAgentSpecificMemory()` |
| `avgCpu`              | Playwright          | `PerformanceObserver` long-task monitoring     |
| `avgNetwork`          | Playwright          | `PerformanceResourceTiming` network component  |
| **Transaction-level** |                     |                                                |
| `avgTime`             | Playwright          | Mean response time across all test executions  |
| `p95Time`             | Playwright          | 95th percentile response time                  |
| `sla`                 | Config              | SLA target per transaction                     |
| `eccBaseline`         | SAP Backend (ST03N) | Historical ECC response time                   |
| `trend`               | Playwright          | Compare current avg to previous runs           |
| `samples`             | Playwright          | Total test executions for this TCode           |
| **Batch Jobs**        |                     |                                                |
| `s4Time`              | SAP Backend (SM37)  | Job runtime from SM37 job log                  |
| `eccTime`             | SAP Backend (ST03N) | Historical ECC batch job runtime               |
| `memory`, `cpu`       | SAP Backend (ST06)  | Server-side resource consumption               |

:::info
Transaction response times come from Playwright (client-side), while batch job times come from SAP SM37 (server-side). Praman measures what the _user_ experiences; SM37 measures what the _server_ does.
:::

</details>

<details id="report-8-geographic--customer-impact">
<summary><strong>Report 8: Geographic & Customer Impact</strong></summary>

**Data models:** `GLOBAL_REGIONS`, `SAP_DATA_SOURCES`

| Field                                 | Source              | Detail                                            |
| ------------------------------------- | ------------------- | ------------------------------------------------- |
| **Country metadata**                  |                     |                                                   |
| `users`                               | Web Analytics       | Active user count per country                     |
| `companyCode`, `locale`, `currency`   | Config              | SAP org structure                                 |
| `wave`                                | Config              | Rollout wave assignment                           |
| `peakHour`                            | SAP Backend (ST03N) | Peak usage hour from workload monitor             |
| **Network profile**                   |                     |                                                   |
| `network.latency`                     | Focused Run RUM     | Client-to-server latency per geography            |
| `network.bandwidth`                   | Focused Run RUM     | Measured throughput                               |
| **Browser/Device profile**            |                     |                                                   |
| `browser.Chrome`                      | Focused Run RUM     | Browser market share per country                  |
| `device.desktop`                      | Focused Run RUM     | Device type distribution                          |
| **Simulation results**                |                     |                                                   |
| `simulation.transactions[].optimal`   | SAP Backend (ST03N) | Baseline from low-latency location                |
| `simulation.transactions[].simulated` | Playwright          | Measured time with country network/locale profile |
| `simulation.overallScore`             | Playwright          | Weighted score from all simulated transactions    |
| `simulation.avgDegradation`           | Playwright          | ((simulated - optimal) / optimal) x 100           |

```javascript
// For each country, Praman creates a context matching real conditions
const deContext = await browser.newContext({
  locale: 'de-DE',
  timezoneId: 'Europe/Berlin',
  viewport: { width: 1920, height: 1080 },
  geolocation: { latitude: 50.1, longitude: 8.7 },
});
// Run same test scenarios — difference = geographic degradation
```

</details>

<details id="report-9-real-user-experience-simulation">
<summary><strong>Report 9: Real User Experience Simulation</strong></summary>

**Data models:** `GLOBAL_REGIONS`, `LOCALE_VALIDATION`, `BROWSER_COMPAT`

| Field                              | Source     | Detail                                                |
| ---------------------------------- | ---------- | ----------------------------------------------------- |
| `LOCALE_VALIDATION[].dateFormat`   | Playwright | Validated by entering dates and checking rendering    |
| `LOCALE_VALIDATION[].numberFormat` | Playwright | Validated by entering amounts and checking formatting |
| `BROWSER_COMPAT[].browser`         | Config     | Browser matrix for testing                            |
| `BROWSER_COMPAT[].status`          | Playwright | Full suite execution on this browser                  |
| `BROWSER_COMPAT[].issues`          | Playwright | Count of browser-specific failures                    |

Same test suite run across Chrome, Firefox, WebKit (Safari), Edge with different locale settings and responsive viewport testing.

</details>

<details id="report-10-sap-fi--financial-accounting-quality">
<summary><strong>Report 10: SAP FI — Financial Accounting Quality</strong></summary>

**Data models:** `FI_QUALITY_DATA`

| Field                         | Source             | Detail                                                             |
| ----------------------------- | ------------------ | ------------------------------------------------------------------ |
| **Document posting tests**    |                    |                                                                    |
| `postingScenarios`            | Config             | FI posting test catalog (FB01, F-02, VF01, MIRO)                   |
| `passed`, `failed`, `blocked` | Playwright         | Test execution results per posting type                            |
| `responseTime`                | Playwright         | Time to complete posting including SAP roundtrip                   |
| **Balance verification**      |                    |                                                                    |
| `trialBalance.match`          | Playwright + SAP   | Automated comparison after posting                                 |
| `intercompanyBalance`         | Playwright + SAP   | IC reconciliation verification                                     |
| **Period-end close**          |                    |                                                                    |
| `closingTasks[].status`       | Playwright         | Automated tests for period-end transactions (F.01, S_ALR_87012284) |
| `closingTasks[].runtime`      | SAP Backend (SM37) | Batch job execution time                                           |
| **Tax & compliance**          |                    |                                                                    |
| `taxCalculation.accuracy`     | Playwright         | Tax determination results vs expected                              |
| `withholdingTax.status`       | Playwright         | WHT posting and reporting tests                                    |
| `regulatoryReports`           | Config             | Country-specific reporting requirements                            |

</details>

<details id="report-11-wcag-21-aa-accessibility-compliance">
<summary><strong>Report 11: WCAG 2.1 AA Accessibility Compliance</strong></summary>

**Data models:** `ACCESSIBILITY_DATA`

| Field                                    | Source                | Detail                                           |
| ---------------------------------------- | --------------------- | ------------------------------------------------ |
| `apps[].score`                           | Playwright (axe-core) | Weighted score from violation count and severity |
| `apps[].violations`                      | Playwright (axe-core) | Total axe-core violations detected               |
| `apps[].critical`, `serious`, `moderate` | Playwright (axe-core) | Violations by severity level                     |
| `apps[].screenReader`                    | Playwright            | ARIA roles, live regions, focus management       |
| `apps[].keyboard`                        | Playwright            | Tab reachability, focus traps, Esc behavior      |
| `violationsByType[].rule`                | Playwright (axe-core) | axe rule ID (e.g. `color-contrast`)              |
| `violationsByType[].principle`           | Playwright (axe-core) | WCAG principle mapping                           |
| `regulatoryRequirements[]`               | Config                | Legal/compliance team input (EAA, Section 508)   |

```javascript
import AxeBuilder from '@axe-core/playwright';

test('Fiori app accessibility', async ({ page }) => {
  await page.goto('/sap/bc/ui5_ui5/.../FioriLaunchpad.html#PurchaseOrder-manage');
  await page.waitForSelector('sap-ui-content');

  const results = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
    .analyze();

  // Produces: violations[], passes[], incomplete[]
  // Each violation: id, impact, description, nodes[]{html, target, failureSummary}
});
```

</details>

<details id="report-12-interface--integration-quality">
<summary><strong>Report 12: Interface & Integration Quality</strong></summary>

**Data models:** `INTERFACE_DATA`

| Field                                     | Source                 | Detail                                       |
| ----------------------------------------- | ---------------------- | -------------------------------------------- |
| **Interface catalog**                     |                        |                                              |
| `id`, `name`, `type`                      | Config                 | Integration team documentation               |
| `source`, `target`, `direction`           | Config                 | Integration architecture                     |
| `frequency`, `criticality`                | Config                 | Business classification                      |
| `dailyVolume`                             | 3rd Party + SAP        | CPI message log count                        |
| `avgLatency`                              | 3rd Party + Playwright | API timing or CPI processing duration        |
| `errorRate`                               | 3rd Party + SAP        | Error messages / total messages              |
| `status`                                  | Playwright + 3rd Party | Computed from errorRate + latency vs SLA     |
| **Third-party system health**             |                        |                                              |
| `thirdPartySystems[].status`              | 3rd Party + Playwright | Aggregated from interface statuses           |
| `thirdPartySystems[].uptime`              | 3rd Party + SAP        | CPI message success rate over rolling window |
| **Stability history**                     |                        |                                              |
| `stabilityHistory[].totalUp`, `totalDown` | Playwright + 3rd Party | Weekly pass/fail aggregation                 |
| `interfaceStability[].weeksDown`          | Playwright             | Consecutive weeks failing                    |

</details>

<details id="report-13-end-to-end-cross-system-quality">
<summary><strong>Report 13: End-to-End Cross-System Quality</strong></summary>

**Data models:** `E2E_SCENARIOS`

| Field                   | Source                 | Detail                               |
| ----------------------- | ---------------------- | ------------------------------------ |
| `id`, `name`, `process` | Config                 | Scenario catalog                     |
| `status`                | Playwright             | Overall: fail if any step fails      |
| `criticality`           | Config                 | Business classification              |
| `sla`                   | Config                 | End-to-end SLA target                |
| `revenueAtRisk`         | Config                 | Finance team estimate                |
| `steps[].system`        | Config                 | System in the chain                  |
| `steps[].status`        | Playwright + 3rd Party | Result of testing this specific step |
| `steps[].time`          | Playwright             | Measured execution time              |
| `steps[].interface`     | Config                 | Interface ID (links to Report 12)    |
| `e2eTime`               | Playwright             | Sum of all step times                |
| `dataIntegrity`         | Playwright             | Values match end-to-end              |

</details>

---

## Data Flow Architecture

```text
+-----------------------------------------------------------------+
|                    DATA SOURCE LAYER                             |
+---------------+--------------+-------------+--------+-----------+
| Playwright    | SAP Backend  | Focused     | 3rd    | Config    |
| + Praman      | ST03N/STAD   | Run / Web   | Party  | YAML/JSON |
| + axe-core    | SM37/SM59    | Analytics   | APIs   | files     |
+---------------+--------------+-------------+--------+-----------+
                              |
                    PRAMAN AGGREGATION ENGINE
              Collects > Normalizes > Computes Scores > Tracks History
                              |
                    OUTPUT: dashboard-data.json
              Fed into React dashboard (Docusaurus / standalone)
+-----------------------------------------------------------------+
```

## What Percentage Comes From Where?

Estimated across all ~180 unique data fields in the dashboard:

| Source                          | Field Count | %       | What                                                                                                  |
| ------------------------------- | ----------- | ------- | ----------------------------------------------------------------------------------------------------- |
| **Playwright + Praman**         | ~75 fields  | **42%** | Test results, response times, pass/fail, accessibility scans, memory/CPU/network, E2E chain status    |
| **Configuration**               | ~55 fields  | **30%** | Process catalog, SLA targets, business impact, interface catalog, role mappings, remediation guidance |
| **SAP Backend**                 | ~25 fields  | **14%** | ECC baselines (ST03N), batch job times (SM37), record counts (CDS), peak hours                        |
| **Focused Run / Web Analytics** | ~15 fields  | **8%**  | Geographic distribution, network latency, browser/device stats                                        |
| **Third-Party APIs**            | ~10 fields  | **6%**  | External system health, CPI message logs, file delivery status                                        |

## Implementation Priority

### Phase 1 — Core (Reports 1-3, 5-7)

1. **Playwright test execution results** — pass/fail/blocked, response times, error details
2. **Config files** — process catalog, SLA targets, test scenario definitions
3. **Basic SAP telemetry** — ST03N baselines for ECC comparison

### Phase 2 — Depth (Reports 4, 8-9)

1. **Migration validation queries** — CDS views for record counts and error detection
2. **Focused Run / Web Analytics** — geographic profiles for realistic simulation
3. **Locale/browser matrix testing** — multi-context Playwright execution

### Phase 3 — Enterprise (Reports 10-13)

1. **axe-core integration** — accessibility scanning per Fiori app
2. **CPI monitoring API** — interface health, message volumes, error rates
3. **Third-party API health checks** — external system connectivity validation
4. **E2E chain orchestration** — multi-system flow testing with Playwright as orchestrator

## What Praman Needs to Ship

| Praman Feature                                            | Reports It Feeds |
| --------------------------------------------------------- | ---------------- |
| Test execution reporter (pass/fail/time/error)            | 1, 2, 3, 5, 7    |
| `page.evaluate()` SAP UI5 performance extraction          | 7                |
| Browser Performance API collection (memory/CPU/network)   | 7, 8             |
| Multi-context execution (locale/browser/viewport/network) | 8, 9             |
| @axe-core/playwright integration                          | 11               |
| HTTP request interception + timing (route handler)        | 12, 13           |
| CPI OData log fetcher                                     | 12, 13           |
| Config file parser (YAML/JSON process catalog)            | All              |
| Historical result aggregator (weekly trends, stability)   | 1, 7, 12         |
| Dashboard data JSON generator                             | All              |
