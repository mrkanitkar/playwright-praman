import type { ReactNode } from 'react';
import Layout from '@theme/Layout';

/* ─── Report Data ─────────────────────────────────────────── */

interface TestModule {
  id: string;
  name: string;
  status: 'PASSED' | 'FAILED' | 'WARNING';
  duration: string;
  steps: number;
  passedSteps: number;
  description: string;
}

interface BusinessFlow {
  name: string;
  steps: { label: string; status: 'pass' | 'fail' | 'warn' | 'pending' }[];
}

interface DataCheck {
  label: string;
  eccValue: string;
  s4Value: string;
  status: 'match' | 'mismatch' | 'review';
}

const REPORT_META = {
  title: 'SAP FI — Period Close Validation',
  system: 'S/4HANA 2023 FPS02',
  client: '100',
  environment: 'QA (Pre-Production)',
  generated: '27 Feb 2026, 14:32 UTC',
  duration: '12m 38s',
  browser: 'Chromium 131',
  executor: 'Praman v1.0 + Playwright 1.49',
};

const SUMMARY = {
  total: 24,
  passed: 20,
  failed: 2,
  warnings: 2,
  passRate: 83,
  coverage: 6,
  modules: ['FI-GL', 'FI-AP', 'FI-AR', 'FI-AA', 'FI-TV', 'CO-PA'],
};

const MODULES: TestModule[] = [
  { id: 'FI-GL-001', name: 'GL Account Posting (FB50)',     status: 'PASSED',  duration: '1m 12s', steps: 8, passedSteps: 8, description: 'Create GL posting, verify document number, check balance update' },
  { id: 'FI-GL-002', name: 'GL Balance Display (FAGLB03)',  status: 'PASSED',  duration: '0m 45s', steps: 5, passedSteps: 5, description: 'Navigate to balance display, verify period totals, check currency conversion' },
  { id: 'FI-AP-001', name: 'Vendor Invoice (MIRO)',         status: 'PASSED',  duration: '2m 03s', steps: 12, passedSteps: 12, description: 'Enter invoice, match PO, simulate and post, verify FI document' },
  { id: 'FI-AP-002', name: 'Payment Run (F110)',            status: 'FAILED',  duration: '3m 22s', steps: 10, passedSteps: 7,  description: 'Configure payment proposal, execute run, verify bank transfer document' },
  { id: 'FI-AR-001', name: 'Customer Invoice (VF01)',       status: 'PASSED',  duration: '1m 38s', steps: 7, passedSteps: 7, description: 'Create billing document, release to accounting, verify AR line item' },
  { id: 'FI-AA-001', name: 'Asset Acquisition (AS01/ABZON)', status: 'WARNING', duration: '1m 55s', steps: 9, passedSteps: 8, description: 'Create asset master, post acquisition, verify depreciation area values' },
  { id: 'FI-AA-002', name: 'Depreciation Run (AFAB)',       status: 'PASSED',  duration: '0m 52s', steps: 6, passedSteps: 6, description: 'Execute depreciation run for period, verify posting documents' },
  { id: 'CO-PA-001', name: 'Profitability Segment (KE30)',  status: 'WARNING', duration: '1m 11s', steps: 5, passedSteps: 4, description: 'Display profitability report, verify segment allocation, check derivation' },
];

const BUSINESS_FLOWS: BusinessFlow[] = [
  {
    name: 'Procure-to-Pay',
    steps: [
      { label: 'Purchase Requisition (ME51N)', status: 'pass' },
      { label: 'Purchase Order (ME21N)', status: 'pass' },
      { label: 'Goods Receipt (MIGO)', status: 'pass' },
      { label: 'Invoice Verification (MIRO)', status: 'pass' },
      { label: 'Payment Run (F110)', status: 'fail' },
    ],
  },
  {
    name: 'Order-to-Cash',
    steps: [
      { label: 'Sales Order (VA01)', status: 'pass' },
      { label: 'Delivery (VL01N)', status: 'pass' },
      { label: 'Billing (VF01)', status: 'pass' },
      { label: 'Incoming Payment (F-28)', status: 'pass' },
      { label: 'Account Clearing', status: 'pass' },
    ],
  },
  {
    name: 'Period Close',
    steps: [
      { label: 'Foreign Currency Valuation (FAGL_FC_VAL)', status: 'pass' },
      { label: 'Depreciation Run (AFAB)', status: 'pass' },
      { label: 'GR/IR Clearing (F.13)', status: 'pass' },
      { label: 'Financial Statement (F.01)', status: 'warn' },
      { label: 'Period Lock (OB52)', status: 'pending' },
    ],
  },
];

const DATA_CHECKS: DataCheck[] = [
  { label: 'GL Balance — Cash Account (1000100)', eccValue: '2,345,678.90 EUR', s4Value: '2,345,678.90 EUR', status: 'match' },
  { label: 'GL Balance — AP Control (2100000)',   eccValue: '1,892,341.20 EUR', s4Value: '1,892,341.20 EUR', status: 'match' },
  { label: 'GL Balance — AR Control (1400000)',   eccValue: '3,102,445.00 EUR', s4Value: '3,102,445.00 EUR', status: 'match' },
  { label: 'Asset Net Book Value (FI-AA)',        eccValue: '45,230,100.00 EUR', s4Value: '45,229,988.50 EUR', status: 'review' },
  { label: 'Open AP Items Count',                 eccValue: '1,234', s4Value: '1,234', status: 'match' },
  { label: 'Open AR Items Count',                 eccValue: '892',   s4Value: '892',   status: 'match' },
  { label: 'Depreciation — Current Period',       eccValue: '312,450.00 EUR', s4Value: '312,562.30 EUR', status: 'mismatch' },
];

const PERFORMANCE = [
  { flow: 'GL Account Posting',     avg: '1.2s', peak: '2.1s', rate: 100, grade: 'A+' },
  { flow: 'Vendor Invoice Entry',   avg: '2.8s', peak: '4.5s', rate: 100, grade: 'A' },
  { flow: 'Payment Run',            avg: '8.4s', peak: '12.1s', rate: 70,  grade: 'C' },
  { flow: 'Depreciation Execution', avg: '3.1s', peak: '5.2s', rate: 100, grade: 'A' },
  { flow: 'Balance Display',        avg: '0.9s', peak: '1.4s', rate: 100, grade: 'A+' },
  { flow: 'Billing Document',       avg: '1.8s', peak: '3.0s', rate: 100, grade: 'A' },
];

/* ─── Components ──────────────────────────────────────────── */

function statusColor(s: string): string {
  if (s === 'PASSED' || s === 'pass' || s === 'match') return '#22c55e';
  if (s === 'FAILED' || s === 'fail' || s === 'mismatch') return '#ef4444';
  if (s === 'WARNING' || s === 'warn' || s === 'review') return '#f59e0b';
  return '#94a3b8';
}

function statusIcon(s: string): string {
  if (s === 'pass' || s === 'match' || s === 'PASSED') return '\u2705';
  if (s === 'fail' || s === 'mismatch' || s === 'FAILED') return '\u274C';
  if (s === 'warn' || s === 'review' || s === 'WARNING') return '\u26A0\uFE0F';
  return '\u23F3';
}

function gradeColor(g: string): string {
  if (g.startsWith('A')) return '#22c55e';
  if (g.startsWith('B')) return '#3b82f6';
  if (g.startsWith('C')) return '#f59e0b';
  return '#ef4444';
}

function ReportHeader(): ReactNode {
  return (
    <div className="er-header">
      <div className="er-header-inner">
        <div className="er-header-top">
          <span className="er-badge er-badge--blue">SAMPLE REPORT</span>
          <span className="er-badge er-badge--outline">Auto-Generated by Praman</span>
        </div>
        <h1 className="er-header-title">{REPORT_META.title}</h1>
        <p className="er-header-subtitle">
          End-to-end validation of Financial Accounting module — Period Close scenario with
          data integrity checks against ECC baseline.
        </p>
        <div className="er-meta-grid">
          {Object.entries({
            System: REPORT_META.system,
            Client: REPORT_META.client,
            Environment: REPORT_META.environment,
            Generated: REPORT_META.generated,
            Duration: REPORT_META.duration,
            Engine: REPORT_META.executor,
          }).map(([k, v]) => (
            <div key={k} className="er-meta-item">
              <span className="er-meta-label">{k}</span>
              <span className="er-meta-value">{v}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function ExecutiveSummary(): ReactNode {
  const cards = [
    { value: SUMMARY.total, label: 'Total Tests', color: 'var(--ifm-color-primary)' },
    { value: `${SUMMARY.passRate}%`, label: 'Pass Rate', color: SUMMARY.passRate >= 90 ? '#22c55e' : '#f59e0b' },
    { value: SUMMARY.passed, label: 'Passed', color: '#22c55e' },
    { value: SUMMARY.failed, label: 'Failed', color: '#ef4444' },
    { value: SUMMARY.warnings, label: 'Warnings', color: '#f59e0b' },
    { value: SUMMARY.coverage, label: 'Modules', color: 'var(--ifm-color-primary)' },
  ];

  return (
    <section className="er-section">
      <h2 className="er-section-title">Executive Summary</h2>
      <div className="er-summary-grid">
        {cards.map((c) => (
          <div key={c.label} className="er-summary-card">
            <div className="er-summary-value" style={{ color: c.color }}>{c.value}</div>
            <div className="er-summary-label">{c.label}</div>
          </div>
        ))}
      </div>
      <div className="er-modules-bar">
        <span className="er-modules-label">Modules Covered:</span>
        {SUMMARY.modules.map((m) => (
          <span key={m} className="er-module-chip">{m}</span>
        ))}
      </div>
    </section>
  );
}

function TestModuleResults(): ReactNode {
  return (
    <section className="er-section">
      <h2 className="er-section-title">Test Module Results</h2>
      <div className="er-modules-grid">
        {MODULES.map((m) => (
          <div key={m.id} className="er-module-card" style={{ borderLeftColor: statusColor(m.status) }}>
            <div className="er-module-top">
              <span className="er-module-id">{m.id}</span>
              <span className="er-status-badge" style={{ background: statusColor(m.status) }}>{m.status}</span>
            </div>
            <h3 className="er-module-name">{m.name}</h3>
            <p className="er-module-desc">{m.description}</p>
            <div className="er-module-stats">
              <span>Duration: <strong>{m.duration}</strong></span>
              <span>Steps: <strong>{m.passedSteps}/{m.steps}</strong></span>
            </div>
            <div className="er-module-progress-track">
              <div className="er-module-progress-fill"
                style={{ width: `${(m.passedSteps / m.steps) * 100}%`, background: statusColor(m.status) }} />
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function BusinessProcessFlows(): ReactNode {
  return (
    <section className="er-section">
      <h2 className="er-section-title">Business Process Flows</h2>
      <p className="er-section-desc">End-to-end validation of critical SAP business processes across modules.</p>
      <div className="er-flows-grid">
        {BUSINESS_FLOWS.map((flow) => {
          const passCount = flow.steps.filter((s) => s.status === 'pass').length;
          return (
            <div key={flow.name} className="er-flow-card">
              <div className="er-flow-header">
                <h3 className="er-flow-name">{flow.name}</h3>
                <span className="er-flow-count">{passCount}/{flow.steps.length} passed</span>
              </div>
              <div className="er-flow-steps">
                {flow.steps.map((step, i) => (
                  <div key={step.label} className="er-flow-step">
                    <div className="er-flow-step-indicator">
                      <div className="er-flow-dot" style={{ background: statusColor(step.status) }}>
                        <span style={{ fontSize: '0.55rem' }}>{statusIcon(step.status)}</span>
                      </div>
                      {i < flow.steps.length - 1 && (
                        <div className="er-flow-connector" style={{ background: statusColor(step.status) }} />
                      )}
                    </div>
                    <span className="er-flow-step-label">{step.label}</span>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

function DataIntegrity(): ReactNode {
  return (
    <section className="er-section">
      <h2 className="er-section-title">Data Integrity — ECC vs S/4HANA</h2>
      <p className="er-section-desc">Compares migrated financial data between source ECC and target S/4HANA to ensure reconciliation accuracy.</p>
      <div className="er-table-wrap">
        <table className="er-table">
          <thead>
            <tr>
              <th>Validation Check</th>
              <th>ECC Value</th>
              <th>S/4HANA Value</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {DATA_CHECKS.map((d) => (
              <tr key={d.label}>
                <td className="er-check-label">{d.label}</td>
                <td className="er-check-mono">{d.eccValue}</td>
                <td className="er-check-mono">{d.s4Value}</td>
                <td>
                  <span className="er-data-status" style={{ color: statusColor(d.status), borderColor: statusColor(d.status) }}>
                    {statusIcon(d.status)} {d.status === 'match' ? 'Match' : d.status === 'review' ? 'Review' : 'Mismatch'}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function PerformanceAnalysis(): ReactNode {
  return (
    <section className="er-section">
      <h2 className="er-section-title">Performance Analysis</h2>
      <div className="er-perf-kpi-row">
        {[
          { value: '2.1s', label: 'Avg Response' },
          { value: '99.2%', label: 'Availability' },
          { value: '48', label: 'API Calls' },
          { value: '86', label: 'Screenshots' },
        ].map((k) => (
          <div key={k.label} className="er-perf-kpi">
            <div className="er-perf-kpi-value">{k.value}</div>
            <div className="er-perf-kpi-label">{k.label}</div>
          </div>
        ))}
      </div>
      <div className="er-table-wrap">
        <table className="er-table">
          <thead>
            <tr>
              <th>Business Flow</th>
              <th>Avg Response</th>
              <th>Peak</th>
              <th>Success Rate</th>
              <th>Grade</th>
            </tr>
          </thead>
          <tbody>
            {PERFORMANCE.map((p) => (
              <tr key={p.flow}>
                <td>{p.flow}</td>
                <td className="er-check-mono">{p.avg}</td>
                <td className="er-check-mono">{p.peak}</td>
                <td>
                  <div className="er-rate-bar-wrap">
                    <div className="er-rate-bar">
                      <div className="er-rate-bar-fill" style={{ width: `${p.rate}%`, background: p.rate >= 90 ? '#22c55e' : '#f59e0b' }} />
                    </div>
                    <span className="er-rate-label">{p.rate}%</span>
                  </div>
                </td>
                <td>
                  <span className="er-grade" style={{ color: gradeColor(p.grade), borderColor: gradeColor(p.grade) }}>{p.grade}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function ComplianceScores(): ReactNode {
  const scores = [
    { label: 'Regulatory Compliance', score: 94, detail: 'SOX controls, audit trail, document retention' },
    { label: 'Data Quality', score: 91, detail: 'Reconciliation accuracy, duplicate detection, completeness' },
    { label: 'Internal Controls', score: 97, detail: 'Segregation of duties, approval workflows, posting authorities' },
  ];

  return (
    <section className="er-section">
      <h2 className="er-section-title">Compliance Scores</h2>
      <div className="er-compliance-grid">
        {scores.map((s) => (
          <div key={s.label} className="er-compliance-card">
            <div className="er-compliance-ring">
              <svg viewBox="0 0 36 36" className="er-ring-svg">
                <path className="er-ring-bg" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                <path className="er-ring-fill" strokeDasharray={`${s.score}, 100`} style={{ stroke: s.score >= 95 ? '#22c55e' : s.score >= 90 ? '#3b82f6' : '#f59e0b' }}
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
              </svg>
              <span className="er-ring-label">{s.score}%</span>
            </div>
            <h3 className="er-compliance-title">{s.label}</h3>
            <p className="er-compliance-detail">{s.detail}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

/* ─── New Section: Complete Business Process Test Documentation ─── */

interface ProcessTest {
  tcode: string;
  description: string;
  preconditions: string[];
  steps: { action: string; expected: string; actual: string; status: 'pass' | 'fail' | 'warn' }[];
  postconditions: string[];
  duration: string;
  screenshots: number;
}

const PROCESS_TESTS: ProcessTest[] = [
  {
    tcode: 'FB50',
    description: 'GL Account Document Posting — Create journal entry for intercompany transfer',
    preconditions: [
      'User has posting authorization for Company Code 1000',
      'Fiscal period 02/2026 is open (OB52)',
      'GL accounts 113100 and 211000 exist and are not blocked',
    ],
    steps: [
      { action: 'Navigate to FB50 via Fiori tile "Post GL Account Document"', expected: 'GL posting screen loads with company code 1000 pre-filled', actual: 'Screen loaded in 1.2s, company code pre-filled', status: 'pass' },
      { action: 'Enter posting date 27.02.2026, document type SA, reference "IC-2026-0438"', expected: 'Header fields accepted, no validation errors', actual: 'All header fields accepted', status: 'pass' },
      { action: 'Line 1: Debit account 113100, amount 50,000.00 EUR, cost center 1000', expected: 'Line item accepted with correct field status', actual: 'Line item created, cost center validated', status: 'pass' },
      { action: 'Line 2: Credit account 211000, amount 50,000.00 EUR', expected: 'Document balanced (debit = credit)', actual: 'Balance check passed, document balanced', status: 'pass' },
      { action: 'Simulate document', expected: 'Simulation shows 2 line items, balance zero, no errors', actual: 'Simulation successful, preview displayed', status: 'pass' },
      { action: 'Post document', expected: 'Document number generated in range 10xxxxxxxx', actual: 'Document 1000004538 posted successfully', status: 'pass' },
      { action: 'Verify document in FAGLB03', expected: 'Both line items visible with correct amounts', actual: 'Both entries found, amounts match', status: 'pass' },
      { action: 'Verify OData: /sap/opu/odata/sap/API_JOURNALENTRYITEMBASIC_SRV', expected: 'Journal entry retrievable via API with matching reference', actual: 'OData response 200, reference IC-2026-0438 confirmed', status: 'pass' },
    ],
    postconditions: [
      'Document 1000004538 created in company code 1000',
      'GL account 113100 debited, 211000 credited',
      'Change document logged for audit trail',
    ],
    duration: '1m 12s',
    screenshots: 8,
  },
  {
    tcode: 'F110',
    description: 'Automatic Payment Run — Execute payment proposal and run for open vendor invoices',
    preconditions: [
      'Open vendor invoices exist for company code 1000',
      'Payment method "T" (bank transfer) configured',
      'House bank MAIN with account ID 01 active',
    ],
    steps: [
      { action: 'Navigate to F110, enter run date 27.02.2026, identification "TEST01"', expected: 'Payment run parameters screen loads', actual: 'Screen loaded, parameters accepted', status: 'pass' },
      { action: 'Configure: Company code 1000, Payment method T, Next payment date 28.02.2026', expected: 'Parameter tab completed without errors', actual: 'Parameters saved', status: 'pass' },
      { action: 'Enter vendor range 100000–199999 on free selection tab', expected: 'Vendor range accepted', actual: 'Range accepted', status: 'pass' },
      { action: 'Execute payment proposal', expected: 'Proposal generated with list of payable invoices', actual: 'Proposal created: 12 invoices, total 234,567.89 EUR', status: 'pass' },
      { action: 'Review proposal log — check for exceptions', expected: 'No blocked or errored items', actual: 'Exception log shows 2 items blocked — insufficient funds on house bank', status: 'fail' },
      { action: 'Execute payment run', expected: 'Payment documents generated for all proposed items', actual: 'Payment run aborted due to proposal exceptions', status: 'fail' },
      { action: 'Verify payment documents in FBL1N', expected: 'Clearing documents visible for paid invoices', actual: 'No clearing documents — payment did not execute', status: 'fail' },
    ],
    postconditions: [
      'Payment run FAILED — house bank balance insufficient',
      'Proposal log retained for investigation',
      'No vendor items were cleared',
    ],
    duration: '3m 22s',
    screenshots: 14,
  },
  {
    tcode: 'AFAB',
    description: 'Depreciation Run — Execute planned depreciation for period 02/2026',
    preconditions: [
      'Depreciation areas 01 (book) and 20 (tax) configured for company code 1000',
      'Period 01/2026 depreciation already posted',
      'Asset master records active with valid useful life',
    ],
    steps: [
      { action: 'Navigate to AFAB, enter company code 1000, fiscal year 2026, period 02', expected: 'Depreciation run selection screen loads', actual: 'Screen loaded, parameters pre-validated', status: 'pass' },
      { action: 'Select "Planned posting run", check "Test run" first', expected: 'Test run completes with preview of depreciation amounts', actual: 'Test run: 1,247 assets processed, total depreciation 312,562.30 EUR', status: 'pass' },
      { action: 'Review test run log for errors or warnings', expected: 'No errors; warnings acceptable (e.g., fully depreciated assets)', actual: 'Log shows 3 warnings for fully depreciated assets — acceptable', status: 'warn' },
      { action: 'Uncheck "Test run", execute production depreciation run', expected: 'Depreciation documents posted to GL', actual: 'Production run completed, 1,244 documents posted', status: 'pass' },
      { action: 'Verify GL impact via FAGLB03 — depreciation expense account 640000', expected: 'Account 640000 shows period 02 debit of 312,562.30 EUR', actual: 'Account balance matches: 312,562.30 EUR', status: 'pass' },
      { action: 'Spot-check 3 individual assets in AW01N', expected: 'Net book values updated correctly per depreciation key', actual: 'All 3 assets verified — NBV reduced by monthly planned amount', status: 'pass' },
    ],
    postconditions: [
      'Period 02/2026 depreciation posted for 1,244 assets',
      '3 fully depreciated assets skipped (expected)',
      'GL account 640000 updated with total depreciation',
    ],
    duration: '0m 52s',
    screenshots: 6,
  },
];

function BusinessProcessDocumentation(): ReactNode {
  return (
    <section className="er-section">
      <h2 className="er-section-title">Complete Business Process Test Documentation</h2>
      <p className="er-section-desc">
        Step-by-step test evidence for each transaction — action performed, expected result, actual result, and verdict.
        Every step is captured with screenshots and OData response snapshots.
      </p>
      <div className="er-process-docs">
        {PROCESS_TESTS.map((pt) => {
          const passCount = pt.steps.filter((s) => s.status === 'pass').length;
          const allPass = passCount === pt.steps.length;
          const hasFail = pt.steps.some((s) => s.status === 'fail');
          const overallStatus = hasFail ? 'FAILED' : allPass ? 'PASSED' : 'WARNING';
          return (
            <div key={pt.tcode} className="er-process-card">
              <div className="er-process-card-header">
                <div>
                  <span className="er-process-tcode">{pt.tcode}</span>
                  <span className="er-status-badge" style={{ background: statusColor(overallStatus), marginLeft: '0.5rem' }}>{overallStatus}</span>
                </div>
                <div className="er-process-meta-pills">
                  <span className="er-process-pill">{pt.duration}</span>
                  <span className="er-process-pill">{pt.screenshots} screenshots</span>
                  <span className="er-process-pill">{passCount}/{pt.steps.length} steps passed</span>
                </div>
              </div>
              <p className="er-process-desc">{pt.description}</p>

              {/* Preconditions */}
              <div className="er-process-conditions">
                <h4 className="er-process-conditions-title">Preconditions</h4>
                <ul className="er-process-condition-list">
                  {pt.preconditions.map((p) => (
                    <li key={p}>{p}</li>
                  ))}
                </ul>
              </div>

              {/* Step table */}
              <div className="er-table-wrap" style={{ marginBottom: '0.75rem' }}>
                <table className="er-table er-process-table">
                  <thead>
                    <tr>
                      <th style={{ width: 36 }}>#</th>
                      <th>Action</th>
                      <th>Expected</th>
                      <th>Actual</th>
                      <th style={{ width: 56 }}>Result</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pt.steps.map((s, i) => (
                      <tr key={i} className={s.status === 'fail' ? 'er-row-fail' : ''}>
                        <td style={{ textAlign: 'center', fontWeight: 700, color: 'var(--praman-ink-secondary)' }}>{i + 1}</td>
                        <td>{s.action}</td>
                        <td className="er-process-expected">{s.expected}</td>
                        <td className="er-process-actual">{s.actual}</td>
                        <td style={{ textAlign: 'center' }}>
                          <span style={{ fontSize: '0.9rem' }}>{statusIcon(s.status)}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Postconditions */}
              <div className="er-process-conditions er-process-conditions--post">
                <h4 className="er-process-conditions-title">Postconditions / Evidence</h4>
                <ul className="er-process-condition-list">
                  {pt.postconditions.map((p) => (
                    <li key={p}>{p}</li>
                  ))}
                </ul>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

/* ─── New Section: Comprehensive Data Integrity Validation ─── */

interface IntegrityModule {
  module: string;
  checks: { label: string; rule: string; eccValue: string; s4Value: string; variance: string; status: 'pass' | 'fail' | 'warn' }[];
}

const INTEGRITY_MODULES: IntegrityModule[] = [
  {
    module: 'General Ledger (FI-GL)',
    checks: [
      { label: 'Trial Balance — Total Assets', rule: 'ECC total = S/4 total (tolerance ±0.01)', eccValue: '125,430,290.00', s4Value: '125,430,290.00', variance: '0.00', status: 'pass' },
      { label: 'Trial Balance — Total Liabilities', rule: 'ECC total = S/4 total (tolerance ±0.01)', eccValue: '98,210,445.50', s4Value: '98,210,445.50', variance: '0.00', status: 'pass' },
      { label: 'Retained Earnings (account 340000)', rule: 'Exact match', eccValue: '27,219,844.50', s4Value: '27,219,844.50', variance: '0.00', status: 'pass' },
      { label: 'Intercompany Elimination Balance', rule: 'Net zero across company codes', eccValue: '0.00', s4Value: '0.00', variance: '0.00', status: 'pass' },
      { label: 'Document Count — Fiscal Year 2025', rule: 'ECC count = S/4 count', eccValue: '148,230', s4Value: '148,230', variance: '0', status: 'pass' },
    ],
  },
  {
    module: 'Accounts Payable (FI-AP)',
    checks: [
      { label: 'Open Items Total', rule: 'ECC total = S/4 total', eccValue: '1,892,341.20', s4Value: '1,892,341.20', variance: '0.00', status: 'pass' },
      { label: 'Vendor Master Count', rule: 'ECC count = S/4 count', eccValue: '4,521', s4Value: '4,521', variance: '0', status: 'pass' },
      { label: 'Payment Block Consistency', rule: 'Blocked items match', eccValue: '23 blocked', s4Value: '23 blocked', variance: '0', status: 'pass' },
      { label: 'Withholding Tax Totals', rule: 'ECC WHT = S/4 WHT (tolerance ±0.01)', eccValue: '89,450.30', s4Value: '89,450.30', variance: '0.00', status: 'pass' },
    ],
  },
  {
    module: 'Accounts Receivable (FI-AR)',
    checks: [
      { label: 'Open Items Total', rule: 'ECC total = S/4 total', eccValue: '3,102,445.00', s4Value: '3,102,445.00', variance: '0.00', status: 'pass' },
      { label: 'Customer Master Count', rule: 'ECC count = S/4 count', eccValue: '2,891', s4Value: '2,891', variance: '0', status: 'pass' },
      { label: 'Dunning Level Distribution', rule: 'Level counts match', eccValue: 'L1:340 L2:89 L3:12', s4Value: 'L1:340 L2:89 L3:12', variance: '0', status: 'pass' },
      { label: 'Credit Memo Totals', rule: 'ECC CM = S/4 CM', eccValue: '45,230.00', s4Value: '45,230.00', variance: '0.00', status: 'pass' },
    ],
  },
  {
    module: 'Asset Accounting (FI-AA)',
    checks: [
      { label: 'Asset Count (Active)', rule: 'ECC count = S/4 count', eccValue: '38,124', s4Value: '38,124', variance: '0', status: 'pass' },
      { label: 'Total Acquisition Value', rule: 'ECC APC = S/4 APC (tolerance ±1.00)', eccValue: '245,890,200.00', s4Value: '245,890,200.00', variance: '0.00', status: 'pass' },
      { label: 'Total Accumulated Depreciation', rule: 'ECC dep = S/4 dep (tolerance ±100)', eccValue: '200,660,100.00', s4Value: '200,660,211.50', variance: '111.50', status: 'warn' },
      { label: 'Net Book Value', rule: 'APC − Accum. Dep = NBV', eccValue: '45,230,100.00', s4Value: '45,229,988.50', variance: '111.50', status: 'warn' },
      { label: 'Depreciation Area 01 vs 20 Delta', rule: 'Book/tax delta consistent', eccValue: '1,230,450.00', s4Value: '1,230,450.00', variance: '0.00', status: 'pass' },
    ],
  },
];

function ComprehensiveDataIntegrity(): ReactNode {
  const totalChecks = INTEGRITY_MODULES.reduce((sum, m) => sum + m.checks.length, 0);
  const passChecks = INTEGRITY_MODULES.reduce((sum, m) => sum + m.checks.filter((c) => c.status === 'pass').length, 0);
  const warnChecks = INTEGRITY_MODULES.reduce((sum, m) => sum + m.checks.filter((c) => c.status === 'warn').length, 0);
  const failChecks = INTEGRITY_MODULES.reduce((sum, m) => sum + m.checks.filter((c) => c.status === 'fail').length, 0);

  return (
    <section className="er-section">
      <h2 className="er-section-title">Comprehensive Data Integrity Validation</h2>
      <p className="er-section-desc">
        Module-by-module reconciliation between source ECC and target S/4HANA. Each check includes the business rule,
        both system values, computed variance, and pass/fail verdict.
      </p>

      {/* Summary bar */}
      <div className="er-integrity-summary">
        <span className="er-integrity-stat"><strong>{totalChecks}</strong> checks</span>
        <span className="er-integrity-stat" style={{ color: '#22c55e' }}>{statusIcon('pass')} {passChecks} passed</span>
        <span className="er-integrity-stat" style={{ color: '#f59e0b' }}>{statusIcon('warn')} {warnChecks} review</span>
        <span className="er-integrity-stat" style={{ color: '#ef4444' }}>{statusIcon('fail')} {failChecks} failed</span>
        <span className="er-integrity-stat"><strong>{Math.round((passChecks / totalChecks) * 100)}%</strong> integrity score</span>
      </div>

      {/* Module tables */}
      {INTEGRITY_MODULES.map((mod) => (
        <div key={mod.module} className="er-integrity-module">
          <h3 className="er-integrity-module-title">{mod.module}</h3>
          <div className="er-table-wrap">
            <table className="er-table">
              <thead>
                <tr>
                  <th>Check</th>
                  <th>Business Rule</th>
                  <th>ECC</th>
                  <th>S/4HANA</th>
                  <th>Variance</th>
                  <th style={{ width: 56 }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {mod.checks.map((c) => (
                  <tr key={c.label} className={c.status === 'fail' ? 'er-row-fail' : c.status === 'warn' ? 'er-row-warn' : ''}>
                    <td className="er-check-label">{c.label}</td>
                    <td style={{ fontSize: '0.72rem', color: 'var(--praman-ink-secondary)' }}>{c.rule}</td>
                    <td className="er-check-mono">{c.eccValue}</td>
                    <td className="er-check-mono">{c.s4Value}</td>
                    <td className="er-check-mono" style={{ color: c.variance !== '0.00' && c.variance !== '0' ? '#f59e0b' : 'inherit' }}>{c.variance}</td>
                    <td style={{ textAlign: 'center' }}>
                      <span style={{ fontSize: '0.9rem' }}>{statusIcon(c.status)}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ))}
    </section>
  );
}

/* ─── New Section: Business Rules Compliance Summary ─── */

interface ComplianceRule {
  id: string;
  rule: string;
  category: string;
  validation: string;
  status: 'compliant' | 'non-compliant' | 'partial';
  notes: string;
}

const COMPLIANCE_RULES: ComplianceRule[] = [
  // SOX / Regulatory
  { id: 'SOX-001', rule: 'Segregation of Duties — Posting & Approval', category: 'SOX Controls', validation: 'User who posts cannot approve same document', status: 'compliant', notes: 'Verified across 148K documents — no violations found' },
  { id: 'SOX-002', rule: 'Document Change Audit Trail', category: 'SOX Controls', validation: 'All FI document changes logged in CDHDR/CDPOS', status: 'compliant', notes: '100% change document coverage confirmed' },
  { id: 'SOX-003', rule: 'Period Lock Enforcement', category: 'SOX Controls', validation: 'Closed periods reject postings (OB52)', status: 'compliant', notes: 'Period 01/2026 locked, posting attempt correctly rejected' },
  { id: 'SOX-004', rule: 'Payment Authorization Limits', category: 'SOX Controls', validation: 'Payments >50K require dual approval', status: 'compliant', notes: 'Threshold enforced — 3 payments verified with dual sign-off' },
  // Data Quality
  { id: 'DQ-001', rule: 'GL Account Completeness', category: 'Data Quality', validation: 'All ECC GL accounts exist in S/4HANA CoA', status: 'compliant', notes: '1,847 accounts migrated, 0 missing' },
  { id: 'DQ-002', rule: 'Vendor Master Completeness', category: 'Data Quality', validation: 'All active vendors migrated with bank details', status: 'compliant', notes: '4,521 vendors migrated, bank details 100% complete' },
  { id: 'DQ-003', rule: 'Asset Depreciation Key Mapping', category: 'Data Quality', validation: 'ECC depreciation keys mapped to S/4 equivalents', status: 'partial', notes: '3 custom depreciation keys require manual review (ZLIN, ZDEG, ZMAN)' },
  { id: 'DQ-004', rule: 'Tax Code Consistency', category: 'Data Quality', validation: 'Tax codes produce identical tax amounts', status: 'compliant', notes: 'All 42 tax codes verified with sample transactions' },
  // Internal Controls
  { id: 'IC-001', rule: 'Tolerance Group Limits', category: 'Internal Controls', validation: 'Posting tolerance groups enforced per user', status: 'compliant', notes: 'Tolerance group SAPALL: ±5%, verified with boundary test' },
  { id: 'IC-002', rule: 'Automatic Clearing Rules', category: 'Internal Controls', validation: 'F.13 clearing criteria match ECC config', status: 'compliant', notes: 'Clearing by assignment number — 234 items auto-cleared correctly' },
  { id: 'IC-003', rule: 'GR/IR Reconciliation', category: 'Internal Controls', validation: 'GR/IR balance matches open PO/invoice delta', status: 'non-compliant', notes: 'Variance of 12,340.00 EUR — 3 invoices missing goods receipt' },
  { id: 'IC-004', rule: 'Dunning Procedure Configuration', category: 'Internal Controls', validation: 'Dunning levels and intervals match ECC', status: 'compliant', notes: '4 dunning levels, intervals 14/28/42/56 days — exact match' },
];

function BusinessRulesCompliance(): ReactNode {
  const categories = [...new Set(COMPLIANCE_RULES.map((r) => r.category))];

  return (
    <section className="er-section">
      <h2 className="er-section-title">Business Rules Compliance Summary</h2>
      <p className="er-section-desc">
        Validates that S/4HANA configuration and data adhere to regulatory requirements (SOX), internal control policies,
        and data quality standards. Each rule includes the validation method, outcome, and auditor notes.
      </p>

      {/* Score cards */}
      <div className="er-compliance-score-row">
        {categories.map((cat) => {
          const rules = COMPLIANCE_RULES.filter((r) => r.category === cat);
          const compliant = rules.filter((r) => r.status === 'compliant').length;
          const pct = Math.round((compliant / rules.length) * 100);
          return (
            <div key={cat} className="er-compliance-score-card">
              <div className="er-compliance-score-pct" style={{ color: pct >= 95 ? '#22c55e' : pct >= 80 ? '#3b82f6' : '#f59e0b' }}>{pct}%</div>
              <div className="er-compliance-score-label">{cat}</div>
              <div className="er-compliance-score-detail">{compliant}/{rules.length} compliant</div>
            </div>
          );
        })}
      </div>

      {/* Rules table */}
      <div className="er-table-wrap">
        <table className="er-table er-compliance-table">
          <thead>
            <tr>
              <th style={{ width: 72 }}>Rule ID</th>
              <th>Business Rule</th>
              <th>Category</th>
              <th>Validation Method</th>
              <th style={{ width: 100 }}>Status</th>
            </tr>
          </thead>
          <tbody>
            {COMPLIANCE_RULES.map((r) => (
              <tr key={r.id} className={r.status === 'non-compliant' ? 'er-row-fail' : r.status === 'partial' ? 'er-row-warn' : ''}>
                <td className="er-check-mono" style={{ fontWeight: 700 }}>{r.id}</td>
                <td>
                  <div className="er-check-label">{r.rule}</div>
                  <div style={{ fontSize: '0.68rem', color: 'var(--praman-ink-secondary)', marginTop: '0.15rem' }}>{r.notes}</div>
                </td>
                <td><span className="er-module-chip">{r.category}</span></td>
                <td style={{ fontSize: '0.74rem' }}>{r.validation}</td>
                <td>
                  <span className="er-compliance-status-badge" style={{
                    background: r.status === 'compliant' ? 'rgba(34,197,94,0.1)' : r.status === 'partial' ? 'rgba(245,158,11,0.1)' : 'rgba(239,68,68,0.1)',
                    color: r.status === 'compliant' ? '#22c55e' : r.status === 'partial' ? '#f59e0b' : '#ef4444',
                    borderColor: r.status === 'compliant' ? '#22c55e' : r.status === 'partial' ? '#f59e0b' : '#ef4444',
                  }}>
                    {r.status === 'compliant' ? '\u2705 Compliant' : r.status === 'partial' ? '\u26A0\uFE0F Partial' : '\u274C Non-Compliant'}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function EvidenceArtifacts(): ReactNode {
  const artifacts = [
    { icon: '\uD83D\uDCF9', label: 'Test Execution Video', desc: 'Full recording with step timestamps', format: 'WebM' },
    { icon: '\uD83D\uDCF8', label: 'Screenshots (86)', desc: 'Step-level captures, failure highlights', format: 'PNG' },
    { icon: '\uD83D\uDCC4', label: 'Playwright Trace', desc: 'Network, console, DOM snapshots', format: 'ZIP' },
    { icon: '\uD83D\uDCCA', label: 'OData Snapshots', desc: 'Request/response per entity set', format: 'JSON' },
    { icon: '\uD83D\uDD12', label: 'Accessibility Report', desc: 'WCAG 2.1 AA compliance scan', format: 'HTML' },
    { icon: '\uD83D\uDCCB', label: 'OpenTelemetry Trace', desc: 'Distributed trace spans', format: 'OTLP' },
  ];

  return (
    <section className="er-section">
      <h2 className="er-section-title">Evidence Artifacts</h2>
      <p className="er-section-desc">Every test run produces audit-ready artifacts — timestamped and structured for sign-off.</p>
      <div className="er-artifacts-grid">
        {artifacts.map((a) => (
          <div key={a.label} className="er-artifact-card">
            <div className="er-artifact-icon">{a.icon}</div>
            <div>
              <div className="er-artifact-label">{a.label}</div>
              <div className="er-artifact-desc">{a.desc}</div>
            </div>
            <span className="er-artifact-format">{a.format}</span>
          </div>
        ))}
      </div>
    </section>
  );
}

/* ─── Report Index (gallery) ──────────────────────────────── */

function ReportGallery(): ReactNode {
  const allReports = [
    { title: 'Executive Dashboard', scope: 'Steering Committee quality overview', slug: 'executive-dashboard', icon: '\u{1F4CA}' },
    { title: 'Process Deep Dive', scope: 'O2C, P2P, R2R, H2R, P2D, WM drill-down', slug: 'process-deep-dive', icon: '\u{1F504}' },
    { title: 'Role Readiness', scope: 'Day-1 readiness by business role', slug: 'role-readiness', icon: '\u{1F465}' },
    { title: 'Data Migration', scope: 'Master data validation & accuracy', slug: 'data-migration', icon: '\u{1F4E6}' },
    { title: 'Risk Register', scope: 'CFO risk report with revenue exposure', slug: 'risk-register', icon: '\u26A0\uFE0F' },
    { title: 'Performance Heatmap', scope: 'Transaction response times & SLAs', slug: 'performance', icon: '\u{1F525}' },
    { title: 'SAP FI Quality', scope: 'Financial Accounting module validation', slug: '#sap-fi-report', icon: '\u{1F4B0}' },
    { title: 'Accessibility Audit', scope: 'WCAG 2.1 AA across 16 Fiori apps', slug: 'accessibility', icon: '\u267F' },
    { title: 'Interface Quality', scope: '142 interfaces, 20 third-party systems', slug: 'interfaces', icon: '\u{1F517}' },
    { title: 'Global Impact', scope: '18 countries, network simulation', slug: 'global-impact', icon: '\u{1F30D}' },
    { title: 'User Experience', scope: 'Locale, browser, device testing', slug: 'user-experience', icon: '\u{1F464}' },
    { title: 'E2E Cross-System', scope: '8 end-to-end scenarios across systems', slug: 'e2e-quality', icon: '\u{1F500}' },
    { title: 'How It Works', scope: 'Praman architecture & data flow', slug: 'how-it-works', icon: '\u2699\uFE0F' },
  ];

  return (
    <section className="er-section" style={{ paddingBottom: 0 }}>
      {/* Important note */}
      <div style={{
        maxWidth: 960,
        margin: '0 auto 1.5rem',
        padding: '0.75rem 1rem',
        background: 'rgba(245, 158, 11, 0.08)',
        border: '1px solid rgba(245, 158, 11, 0.3)',
        borderRadius: 8,
        fontSize: '0.85rem',
        color: 'var(--ifm-font-color-base)',
      }}>
        <strong>Important:</strong> These reports are examples of what you can design and develop. Please read the documentation help for more details.
      </div>

      {/* Full Dashboard banner */}
      <a
        href="/playwright-praman/example-reports/dashboard"
        target="_blank"
        rel="noopener noreferrer"
        style={{
          display: 'block',
          maxWidth: 960,
          margin: '0 auto 1rem',
          padding: '0.75rem 1.25rem',
          background: 'linear-gradient(135deg, #1e3a5f 0%, #1e40af 100%)',
          borderRadius: 8,
          color: '#fff',
          textDecoration: 'none',
          textAlign: 'center',
        }}
      >
        <div style={{ fontSize: '1rem', fontWeight: 700 }}>S/4HANA Quality Dashboard — All Reports</div>
        <div style={{ fontSize: '0.78rem', opacity: 0.8, marginTop: 2 }}>Full tabbed dashboard with steering committee view, risk register, performance heatmap, and more</div>
      </a>

      {/* Compact report link list */}
      <div style={{
        maxWidth: 960,
        margin: '0 auto',
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
        gap: '0.5rem',
      }}>
        {allReports.map((r) => {
          const isAnchor = r.slug.startsWith('#');
          return (
            <a
              key={r.slug}
              href={isAnchor ? r.slug : `/playwright-praman/example-reports/${r.slug}`}
              target={isAnchor ? undefined : '_blank'}
              rel={isAnchor ? undefined : 'noopener noreferrer'}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.5rem 0.75rem',
                background: 'var(--ifm-card-background-color)',
                border: '1px solid var(--praman-border, #e2e8f0)',
                borderRadius: 6,
                textDecoration: 'none',
                color: 'inherit',
                fontSize: '0.82rem',
                transition: 'border-color 0.15s, box-shadow 0.15s',
              }}
              onMouseOver={(e) => { e.currentTarget.style.borderColor = 'var(--ifm-color-primary)'; e.currentTarget.style.boxShadow = '0 1px 4px rgba(0,0,0,0.08)'; }}
              onMouseOut={(e) => { e.currentTarget.style.borderColor = 'var(--praman-border, #e2e8f0)'; e.currentTarget.style.boxShadow = 'none'; }}
            >
              <span>{r.icon}</span>
              <span><strong>{r.title}</strong><br /><span style={{ fontSize: '0.72rem', color: 'var(--praman-ink-secondary, #64748b)' }}>{r.scope}</span></span>
            </a>
          );
        })}
      </div>
    </section>
  );
}

/* ─── Page ─────────────────────────────────────────────────── */

export default function ExampleReports(): ReactNode {
  return (
    <Layout title="Example Reports" description="Praman example reports — evidence-based SAP test reports for every stakeholder">
      <main className="er-page">
        {/* Hero */}
        <section className="er-hero">
          <p className="praman-section-label">Evidence</p>
          <h1 className="er-hero-title">Example Reports</h1>
          <p className="er-hero-subtitle">
            Build reports that speak to every stakeholder — from CFO compliance dashboards
            to developer trace files. Every Praman test run produces audit-ready evidence.
          </p>
        </section>

        {/* Gallery */}
        <ReportGallery />

        {/* Divider */}
        <div style={{ maxWidth: 960, margin: '0 auto', padding: '0 2rem' }}>
          <div style={{ borderTop: '1px solid var(--praman-border)', margin: '2rem 0' }} />
        </div>

        {/* Sample Report */}
        <div id="sap-fi-report" className="er-report-container">
          <ReportHeader />
          <ExecutiveSummary />
          <TestModuleResults />
          <BusinessProcessFlows />
          <BusinessProcessDocumentation />
          <DataIntegrity />
          <ComprehensiveDataIntegrity />
          <PerformanceAnalysis />
          <ComplianceScores />
          <BusinessRulesCompliance />
          <EvidenceArtifacts />
        </div>

        {/* Footer CTA */}
        <section className="er-footer-cta">
          <h2>Generate Your Own Reports</h2>
          <p>Every <code>npx playwright test</code> run with Praman produces these reports automatically.</p>
          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
            <a href="/playwright-praman/docs" className="er-cta-btn er-cta-btn--primary">Get Started</a>
            <a href="/playwright-praman/features" className="er-cta-btn er-cta-btn--outline">See All Features</a>
          </div>
        </section>
      </main>
    </Layout>
  );
}
