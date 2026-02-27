import type { ReactNode } from 'react';
import Layout from '@theme/Layout';

/* ─── Feature Parity Comparison ────────────────────────────── */

type CellStatus = 'check' | 'partial' | 'no';
interface Cell { v: CellStatus; label: string }
interface Row { feature: string; native: Cell; praman: Cell }
interface Section { title: string; rows: Row[] }

const C = (v: CellStatus, label: string): Cell => ({ v, label });

const SECTIONS: Section[] = [
  {
    title: 'General Test Automation',
    rows: [
      { feature: 'Modern async/await syntax',    native: C('check',   '✓'),                           praman: C('check',   '✓') },
      { feature: 'TypeScript support',            native: C('check',   '✓ Native, strict'),             praman: C('check',   '✓ Strict + branded types') },
      { feature: 'Parallel execution',            native: C('check',   '✓ Workers'),                    praman: C('check',   '✓ Workers') },
      { feature: 'Auto-wait for elements',        native: C('check',   '✓ Web-first assertions'),       praman: C('check',   '✓ Web-first + UI5 stability') },
      { feature: 'Visual regression testing',     native: C('check',   '✓ Native screenshots'),         praman: C('check',   '✓ Native (Playwright)') },
      { feature: 'Network interception',          native: C('check',   '✓ Full page.route()'),          praman: C('check',   '✓ Full + analytics blocking') },
      { feature: 'Multi-browser support',         native: C('check',   '✓ Chrome / Firefox / WebKit'),  praman: C('check',   '✓ Chrome / Firefox / WebKit') },
    ],
  },
  {
    title: 'Control Discovery & Interaction',
    rows: [
      { feature: 'UI5 control selector engine',        native: C('no',      '✗'),                     praman: C('check', '✓ ui5= engine, 4-tier strategy') },
      { feature: 'Discovery strategy depth',           native: C('no',      '✗'),                     praman: C('check',   '✓ Cache → ID → RecordReplay → registry') },
      { feature: 'Control result caching',             native: C('no',      '✗'),                     praman: C('check',   '✓ LRU 200 entries, 5 s TTL, automatic') },
      { feature: 'Typed UI5 control interfaces',       native: C('no',      '✗'),                     praman: C('check',   '✓ 199 controls, 4,092 methods') },
      { feature: 'SmartField / MDC inner control',     native: C('no',      '✗'),                     praman: C('check',   '✓ SmartField, SmartFilterBar, mdc.Field, mdc.ValueHelp') },
      { feature: 'Interaction strategy selection',     native: C('no',      '✗'),                     praman: C('check', '✓ UI5-native / DOM-first / OPA5') },
      { feature: 'OPA5-standard interaction',          native: C('no',      '✗'),                     praman: C('check',   '✓ RecordReplay API (selectable)') },
      { feature: 'Direct UI5 method access',           native: C('no',      '✗ page.evaluate only'),  praman: C('check',   '✓ Typed proxy + exec()') },
      { feature: 'Method safety blacklist',            native: C('no',      '✗'),                     praman: C('check',   '✓ 71 static + 2 dynamic rules') },
      { feature: 'Control metadata introspection',     native: C('no',      '✗'),                     praman: C('check',   '✓ getControlMetadata(), retrieveMembers()') },
      { feature: 'Auto-wait for UI5 stability',        native: C('no',      '✗'),                     praman: C('check',   '✓ 3-tier: bootstrap → stable → DOM settle') },
      { feature: 'Dialog auto-discovery',              native: C('no',      '✗'),                     praman: C('check',   '✓ 10 dialog types via sap-ui-static') },
      { feature: 'UI5-specific custom assertions',     native: C('no',      '✗'),                     praman: C('check',   '✓ 10 matchers: ValueState, Binding, RowCount…') },
      { feature: 'Table variants supported',           native: C('no',      '✗'),                     praman: C('check',   '✓ 6 variants incl. SmartTable, mdc.Table') },
      { feature: 'UI5 control tree / page discovery',  native: C('no',      '✗'),                     praman: C('check',   '✓ discoverPage() → PageContext') },
      { feature: 'UI5 bridge injection',               native: C('no',      '✗'),                     praman: C('check',   '✓') },
      { feature: 'UI5 version compatibility',          native: C('no',      '✗'),                     praman: C('check',   '✓ 1.71+') },
    ],
  },
  {
    title: 'SAP Authentication',
    rows: [
      { feature: 'SAP Cloud (SAML / OAuth)',     native: C('no',      '✗ Manual'),        praman: C('check',   '✓ Built-in, 6 strategies') },
      { feature: 'SAP On-Premise (NetWeaver)',   native: C('no',      '✗ Manual'),        praman: C('check',   '✓ Basic auth, auto-detect') },
      { feature: 'Session persistence',          native: C('check',   '✓ storageState'),  praman: C('check',   '✓ storageState + SAP tokens') },
      { feature: 'Auth strategy auto-detection', native: C('no',      '✗'),               praman: C('check',   '✓ detectSystemType()') },
      { feature: 'Custom auth strategy plug-in', native: C('no',      '✗'),               praman: C('check',   '✓ registerAuthStrategy()') },
    ],
  },
  {
    title: 'Fiori Launchpad',
    rows: [
      { feature: 'Tile navigation',              native: C('no',      '✗ Manual DOM'),  praman: C('check', '✓ navigateToTile() by title') },
      { feature: 'Intent-based navigation',      native: C('no',      '✗'),             praman: C('check',   '✓ navigateToIntent() with params') },
      { feature: 'Shell search & open app',      native: C('no',      '✗'),             praman: C('check',   '✓ searchAndOpenApp()') },
      { feature: 'FLP user locale / settings',   native: C('no',      '✗'),             praman: C('check',   '✓ getLanguage(), getDateFormat()…') },
      { feature: 'SM12 lock management',         native: C('no',      '✗'),             praman: C('check',   '✓ getLockEntries(), auto-cleanup') },
      { feature: 'BTP WorkZone frame support',   native: C('no',      '✗'),             praman: C('check', '✓ btpWorkZone fixture') },
    ],
  },
  {
    title: 'OData / Backend Testing',
    rows: [
      { feature: 'OData CRUD operations',        native: C('no',      '✗ fetch / axios manual'),  praman: C('check',   '✓ queryEntities, create, update, delete') },
      { feature: 'Query params ($filter…)',       native: C('no',      '✗'),                       praman: C('check',   '✓ $filter, $select, $expand, $orderby') },
      { feature: 'CSRF token + ETag handling',   native: C('no',      '✗'),                       praman: C('check',   '✓ Automatic') },
      { feature: 'Model-level data access',      native: C('no',      '✗'),                       praman: C('check', '✓ getModelData(), waitForODataLoad()') },
      { feature: 'OData trace reporter',         native: C('no',      '✗'),                       praman: C('check',   '✓ Per-entity-set call analytics') },
    ],
  },
  {
    title: 'AI & Test Intelligence',
    rows: [
      { feature: 'AI-first fixture design',      native: C('no',  '✗'),  praman: C('check',   '✓ Capability & recipe registries, SKILL.md') },
      { feature: 'SAP domain intent APIs',       native: C('no',  '✗'),  praman: C('check',   '✓ 5 domains: procurement, sales, finance, mfg, master data') },
      { feature: 'SAP vocabulary service',       native: C('no',  '✗'),  praman: C('check',   '✓ 6 domains, fuzzy match, field → selector') },
      { feature: 'Agentic test generation',      native: C('no',  '✗'),  praman: C('check',   '✓ generateTest(), checkpoint, suggestActions()') },
      { feature: 'LLM provider abstraction',     native: C('no',  '✗'),  praman: C('check',   '✓ Claude / OpenAI / Azure OpenAI') },
      { feature: 'Fiori Elements test helpers',  native: C('no',  '✗'),  praman: C('check',   '✓ listReport, objectPage, FE test library') },
      { feature: 'Compliance reporter',          native: C('no',  '✗'),  praman: C('check',   '✓ Step categorisation, compliance %') },
      { feature: 'LLM-friendly docs (llms.txt)', native: C('no',  '✗'),  praman: C('check',   '✓ llmstxt.org standard, 4 topic files') },
    ],
  },
  {
    title: 'Developer Experience',
    rows: [
      { feature: 'Setup CLI',                 native: C('no',      '✗'),                praman: C('check',   '✓ npx playwright-praman init') },
      { feature: 'Doctor / diagnostics CLI',  native: C('no',      '✗'),                praman: C('check',   '✓ npx playwright-praman doctor') },
      { feature: 'Structured error codes',    native: C('partial', '⚠ JS Error only'),  praman: C('check',   '✓ 14 classes, 56 codes, suggestions[]') },
      { feature: 'API documentation',         native: C('check',   '✓ Full docs'),      praman: C('check',   '✓ TSDoc + API Extractor') },
      { feature: 'Playwright fixture pattern',native: C('check',   '✓ test.extend()'),  praman: C('check',   '✓ 21 fixtures, 5 auto-fixtures') },
    ],
  },
  {
    title: 'Performance',
    rows: [
      { feature: 'Test execution speed',          native: C('check',   '⚡ Fast — native browser'),  praman: C('check',  '⚡ Fast — Playwright-based') },
      { feature: 'Browser startup time',           native: C('check',   '⚡ Fast'),                   praman: C('check',  '⚡ Fast') },
      { feature: 'Parallel execution efficiency',  native: C('check',   '✓ High — workers'),          praman: C('check',  '✓ High — workers') },
    ],
  },
];

function ParityCell({ cell, isPraman }: { cell: Cell; isPraman: boolean }): ReactNode {
  const cls = cell.v === 'check' ? 'praman-parity-check'
    : cell.v === 'partial' ? 'praman-parity-partial'
    : 'praman-parity-no';
  return (
    <td className={isPraman ? 'praman-parity-col--praman' : undefined}>
      <span className={cls}>{cell.label}</span>
    </td>
  );
}

function ParityComparison(): ReactNode {
  return (
    <section className="praman-parity-wrap">
      <div className="praman-parity-inner">
        <div className="praman-parity-header">
          <p className="praman-section-label">Comparison</p>
          <h2>Feature Parity Comparison</h2>
          <p>
            Comprehensive comparison of SAP UI5 test automation capabilities.
            Playwright Native retains advantages in speed, ecosystem, and visual testing.
          </p>
        </div>
        <div className="praman-parity-table-wrap">
          <table className="praman-parity-table">
            <thead>
              <tr>
                <th>Feature</th>
                <th>Playwright Native</th>
                <th>Playwright + Praman</th>
              </tr>
            </thead>
            <tbody>
              {SECTIONS.map((section) => (
                <>
                  <tr key={section.title} className="praman-parity-section-row">
                    <td colSpan={3}>{section.title}</td>
                  </tr>
                  {section.rows.map((row) => (
                    <tr key={row.feature}>
                      <td>{row.feature}</td>
                      <ParityCell cell={row.native} isPraman={false} />
                      <ParityCell cell={row.praman} isPraman={true} />
                    </tr>
                  ))}
                </>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}

function FeatureGrid(): ReactNode {
  const features = [
    {
      icon: '\u{1F916}',
      title: 'AI-First Architecture',
      desc: 'SKILL.md entry points let any AI agent — Copilot, Claude, Jules — discover capabilities, generate tests, and verify compliance autonomously.',
    },
    {
      icon: '\u{1F3AF}',
      title: 'SAP UI5 Native Control Access',
      desc: 'ui5.control() with auto-retry, self-healing, and 3-tier API resolution. LTS 1.108, 1.120, 1.136. Uses UI5 control APIs, not brittle DOM selectors.',
    },
    {
      icon: '\u{1F527}',
      title: '21 Fixtures, 199 Interfaces, 4,092 Methods',
      desc: '61 UI5 control types across 8 libraries — sap.m, sap.ui.table, sap.ui.comp, sap.uxap, sap.f, and more. Just destructure and go.',
    },
    {
      icon: '\u{26A1}',
      title: 'Playwright Native',
      desc: 'Extends @playwright/test directly. Parallel execution, auto-wait, trace viewer, UI mode. Web-first assertions with zero compromise.',
    },
    {
      icon: '\u{1F4CA}',
      title: 'Enterprise Observability',
      desc: 'OpenTelemetry tracing with Azure and AWS. Role-based quality reports, pino structured logging, compliance reporters, defect video and logs.',
    },
    {
      icon: '\u{1F512}',
      title: 'SAP Authentication & FLP',
      desc: 'Built-in SAP auth flows, Fiori Launchpad navigation, SM12 lock management. Multi-system support for ECC and S/4HANA.',
    },
    {
      icon: '\u{1F4E6}',
      title: 'OData V2 & V4 Support',
      desc: 'Full OData CRUD operations, batch processing, deep entity creation. Mock server support for hermetic testing.',
    },
    {
      icon: '\u{1F3D7}',
      title: 'Fiori Elements Helpers',
      desc: 'List Report, Object Page, Analytical List Page. SmartTable, SmartFilterBar, SmartField — all typed and proxied.',
    },
    {
      icon: '\u{1F30D}',
      title: 'Cross-Platform',
      desc: 'Windows, macOS, Linux. CI runs on 3-OS matrix. node:path, node:fs/promises — no platform assumptions.',
    },
    {
      icon: '\u{1F4DD}',
      title: 'Structured Error Intelligence',
      desc: 'Every error includes code, attempted action, retryable flag, and suggestions array. AI agents can self-heal from failures.',
    },
    {
      icon: '\u{2699}',
      title: 'Dual ESM + CJS Output',
      desc: 'tsup-built with conditional exports. Validated by attw. Works in any Node.js environment without configuration.',
    },
    {
      icon: '\u{1F9EA}',
      title: 'Agentic Test Generation',
      desc: 'Plan, generate, and heal tests with Praman SAP agents. Seed-based auth, live browser validation, 7 mandatory compliance rules.',
    },
  ];

  return (
    <section style={{ padding: '3rem 2rem 5rem', maxWidth: 1100, margin: '0 auto' }}>
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
        gap: '1.5rem',
      }}>
        {features.map((f, i) => (
          <div key={i} className="feature-card">
            <div className="feature-icon">{f.icon}</div>
            <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '0.5rem' }}>{f.title}</h3>
            <p style={{ color: 'var(--praman-ink-secondary)', fontSize: '0.88rem', marginBottom: 0 }}>{f.desc}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

function Numbers(): ReactNode {
  const stats = [
    { value: '21', label: 'Fixtures' },
    { value: '199', label: 'Typed Interfaces' },
    { value: '4,092', label: 'Methods' },
    { value: '61', label: 'UI5 Control Types' },
    { value: '8', label: 'SAP Libraries' },
    { value: '6', label: 'Sub-Path Exports' },
  ];

  return (
    <section style={{ padding: '3rem 2rem', maxWidth: 900, margin: '0 auto' }}>
      <div style={{
        display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
        gap: '1.5rem', textAlign: 'center',
      }}>
        {stats.map((s, i) => (
          <div key={i}>
            <div style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--ifm-color-primary)' }}>{s.value}</div>
            <div style={{ fontSize: '0.82rem', color: 'var(--praman-ink-secondary)', fontWeight: 500 }}>{s.label}</div>
          </div>
        ))}
      </div>
    </section>
  );
}

export default function Features(): ReactNode {
  return (
    <Layout title="Features" description="Praman features — AI-first SAP UI5 test automation capabilities">
      <main>
        <section style={{ padding: '6rem 2rem 2rem', textAlign: 'center', maxWidth: 800, margin: '0 auto' }}>
          <p className="praman-section-label">Features</p>
          <h1 className="hero__title" style={{ fontSize: '2.8rem' }}>Everything You Need for SAP Testing</h1>
          <p className="hero__subtitle">
            From AI-powered test generation to enterprise observability — built for
            teams migrating to S/4HANA.
          </p>
        </section>
        <Numbers />
        <div style={{ width: 48, height: 1, background: 'var(--praman-border)', margin: '0 auto' }} />
        <FeatureGrid />
        <ParityComparison />
      </main>
    </Layout>
  );
}
