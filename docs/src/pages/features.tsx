import type { ReactNode } from 'react';
import Layout from '@theme/Layout';

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
      </main>
    </Layout>
  );
}
