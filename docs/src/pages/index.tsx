import type { ReactNode } from 'react';
import Link from '@docusaurus/Link';
import Layout from '@theme/Layout';

function Hero(): ReactNode {
  return (
    <section style={{ padding: '8rem 2rem 4rem', textAlign: 'center', maxWidth: 800, margin: '0 auto' }}>
      <span style={{
        display: 'inline-block', padding: '0.3rem 0.8rem', borderRadius: 99,
        border: '1px solid var(--praman-border)', fontSize: '0.78rem', fontWeight: 500,
        color: 'var(--praman-ink-secondary)', marginBottom: '2rem',
      }}>
        Open Source &middot; Agentic-First
      </span>
      <h1 className="hero__title">
        Transform your SAP to S/4 HANA with evidence, not hope.
      </h1>
      <p className="hero__subtitle" style={{ marginBottom: '1.5rem' }}>
        Praman is the autonomous agentic testing Playwright plugin for SAP S/4HANA.
        Built on Playwright. Powered by AI.
      </p>
      <div className="praman-pills">
        <span>Your Environment</span><span className="dot">&bull;</span>
        <span>Any Agent</span><span className="dot">&bull;</span>
        <span>Any LLM</span>
      </div>
      <div className="praman-pills">
        <span>Greenfield</span><span className="dot">&bull;</span>
        <span>Brownfield</span><span className="dot">&bull;</span>
        <span>Bluefield</span>
      </div>
      <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center', marginTop: '2rem' }}>
        <Link className="praman-btn praman-btn-dark" to="/docs">Get Started</Link>
        <Link className="praman-btn praman-btn-light" to="/docs/api">API Reference</Link>
      </div>
    </section>
  );
}

function CodeShowcase(): ReactNode {
  return (
    <div style={{ maxWidth: 580, margin: '0 auto', padding: '0 2rem 3rem', textAlign: 'center' }}>
      <p className="praman-section-label">Your agent generates SAP S/4HANA Playwright scripts</p>
      <div className="praman-code-block">
        <div className="praman-code-dots"><span /><span /><span /></div>
        <pre><code>
          <span className="cmt">{'// Praman: AI-first SAP testing'}</span>{'\n'}
          <span className="kw">import</span>{' { '}<span className="fn">test</span>{' } '}<span className="kw">from</span>{' '}<span className="str">{"'playwright-praman'"}</span>{';'}{'\n'}
          {'\n'}
          <span className="fn">test</span>{'('}<span className="str">{"'verify purchase order'"}</span>{', '}<span className="kw">async</span>{' ({ '}<span className="fn">ui5</span>{', '}<span className="fn">odata</span>{' }) => {'}{'\n'}
          {'  '}<span className="kw">await</span>{' '}<span className="fn">ui5</span>{'.'}<span className="fn">control</span>{"({ id: "}<span className="str">{"'orderTable'"}</span>{' });'}{'\n'}
          {'  '}<span className="kw">await</span>{' '}<span className="fn">odata</span>{'.'}<span className="fn">read</span>{'('}<span className="str">{"'/PurchaseOrders'"}</span>{');'}{'\n'}
          {'});'}
        </code></pre>
      </div>
    </div>
  );
}

function PitchGrid(): ReactNode {
  return (
    <section style={{ padding: '3rem 2rem 5rem', maxWidth: 1100, margin: '0 auto' }}>
      <div style={{ textAlign: 'center' }}>
        <p className="praman-section-label">Why Praman</p>
        <h2 className="praman-section-title">The Problem. The Solution. The Proof.</h2>
        <p style={{ fontSize: '1rem', color: 'var(--praman-ink-secondary)', marginBottom: '2.5rem', maxWidth: 500, marginLeft: 'auto', marginRight: 'auto' }}>
          Four questions that define why autonomous SAP testing matters.
        </p>
      </div>
      <div className="praman-pitch-grid">
        <div className="praman-pitch-cell">
          <div className="praman-pitch-step">Why</div>
          <h3>End to End Quality Matters</h3>
          <p>Third party apps, Business flows, Test data, UI5 controls, Delay in timeline.</p>
        </div>
        <div className="praman-pitch-cell">
          <div className="praman-pitch-step">What</div>
          <h3>Agentic AI Native Quality Automation</h3>
          <p>Input Signavio flow or test case, connect to HANA using OData, check data availability and speak to UI5 elements and web components.</p>
        </div>
        <div className="praman-pitch-cell">
          <div className="praman-pitch-step">So What</div>
          <h3>Deploy with evidence</h3>
          <p>Data Integrity Validation, Business Flow Performance Heatmap in every run, Accessibility Testing, Compliance.</p>
        </div>
        <div className="praman-pitch-cell">
          <div className="praman-pitch-step">Then What</div>
          <h3>Tests that write themselves</h3>
          <p>AI agents write, maintain, and evolve tests through SKILL.md entry points.</p>
        </div>
      </div>
    </section>
  );
}

function Capabilities(): ReactNode {
  return (
    <section style={{ padding: '5rem 2rem', maxWidth: 900, margin: '0 auto' }}>
      <p className="praman-section-label">Capabilities</p>
      <h2 className="praman-section-title">What you get</h2>
      <ul className="praman-features-list">
        <li>
          <div className="icon">&#x1F916;</div>
          <div>
            <h3>AI-First Architecture</h3>
            <p>SKILL.md entry points, capabilities.list() discovery, compliance verification. Built for Copilot, Claude, and Jules.</p>
          </div>
        </li>
        <li>
          <div className="icon">&#x1F527;</div>
          <div>
            <h3>21 Fixtures, 199 Typed Interfaces, 4,092 Methods</h3>
            <p>61 UI5 control types across 8 libraries — sap.m, sap.ui.table, sap.ui.comp, sap.uxap, sap.f, and more. OData CRUD, Fiori Elements, FLP navigation, SAP auth, SM12 locks, AI discovery. Just destructure and go.</p>
          </div>
        </li>
        <li>
          <div className="icon">&#x1F3AF;</div>
          <div>
            <h3>SAP UI5 Native — LTS 1.108 &middot; 1.120 &middot; 1.136</h3>
            <p>ui5.control() with auto-retry, self-healing, and 3-tier API resolution across UI5 LTS versions. Uses UI5's own control APIs, not brittle DOM selectors.</p>
          </div>
        </li>
        <li>
          <div className="icon">&#x1F3D7;</div>
          <div>
            <h3>6-Layer Architecture</h3>
            <p>Core Infrastructure &rarr; Selectors &amp; Matchers &rarr; Bridge &amp; Browser Scripts &rarr; Control Proxy &rarr; Fixtures &amp; Auth &rarr; AI &amp; Intents. 3 interaction strategies, 7 return-type handlers, TTL+LRU caching, 10 error subclasses.</p>
          </div>
        </li>
        <li>
          <div className="icon">&#x1F4CA;</div>
          <div>
            <h3>Enterprise Observability</h3>
            <p>OpenTelemetry tracing with Azure and AWS, role-based quality reports, pino structured logging, compliance reporters, defect video, logs. Full visibility into every action.</p>
          </div>
        </li>
        <li>
          <div className="icon">&#x26A1;</div>
          <div>
            <h3>Playwright Native</h3>
            <p>Extends @playwright/test. Parallel execution, auto-wait, trace viewer, UI mode. Zero compromise.</p>
          </div>
        </li>
      </ul>
    </section>
  );
}

function Philosophy(): ReactNode {
  return (
    <div className="praman-philosophy">
      <section style={{ padding: '5rem 2rem', maxWidth: 1100, margin: '0 auto', textAlign: 'center' }}>
        <p className="praman-section-label">Philosophy</p>
        <h2 className="praman-section-title">Four Pillars of Evidence</h2>
        <div className="praman-quote">
          &ldquo;In Ancient India, <em>Pram&#x101;&#x1E47;a</em> was the standard to separate fact from illusion.
          In the Modern Enterprise, <strong>Praman</strong> separates a &lsquo;Successful Deployment&rsquo;
          from a &lsquo;Business Disruption.&rsquo;&rdquo;
        </div>
        <div className="praman-pillars-grid" style={{ textAlign: 'left' }}>
          <div className="praman-pillar">
            <div className="praman-pillar-label">Pratyaksha</div>
            <h3>Perception</h3>
            <p>Real-time, deep-object visibility into the S/4HANA Fiori layer.</p>
          </div>
          <div className="praman-pillar">
            <div className="praman-pillar-label">Anum&#x101;na</div>
            <h3>Inference</h3>
            <p>Agentic AI that predicts and heals breaks before user impact.</p>
          </div>
          <div className="praman-pillar">
            <div className="praman-pillar-label">Upam&#x101;na</div>
            <h3>Comparison</h3>
            <p>Validation between Legacy ECC and New S/4HANA states.</p>
          </div>
          <div className="praman-pillar">
            <div className="praman-pillar-label">Shabda</div>
            <h3>Authority</h3>
            <p>Playwright — the gold standard of modern web automation.</p>
          </div>
        </div>
      </section>
    </div>
  );
}

function AssuranceBar(): ReactNode {
  return (
    <section style={{ textAlign: 'center', padding: '2.5rem 2rem' }}>
      <div className="praman-assurance">
        <div className="praman-assurance-item"><span>&#10003;</span> CISO-Approved</div>
        <div className="praman-assurance-item"><span>&#10003;</span> Open Source</div>
        <div className="praman-assurance-item"><span>&#10003;</span> Customizable</div>
        <div className="praman-assurance-item"><span>&#10003;</span> Cross-Platform</div>
        <div className="praman-assurance-item"><span>&#10003;</span> TypeScript</div>
      </div>
    </section>
  );
}

function CTA(): ReactNode {
  return (
    <section className="praman-cta" style={{ textAlign: 'center', padding: '5rem 2rem' }}>
      <h2>Start testing with evidence.</h2>
      <p>Open source. Your environment. Your rules.</p>
      <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center' }}>
        <Link className="praman-btn praman-btn-dark" to="/docs">Get Started</Link>
        <Link className="praman-btn praman-btn-light" href="https://github.com/mrkanitkar/playwright-praman">View on GitHub</Link>
      </div>
    </section>
  );
}

export default function Home(): ReactNode {
  return (
    <Layout
      title="AI-First SAP UI5 Test Automation"
      description="Praman — AI-First SAP UI5 Test Automation Platform for Playwright. Enterprise-grade testing with agentic AI, typed proxies, and 32+ fixtures."
    >
      <main>
        <Hero />
        <CodeShowcase />
        <div style={{ width: 48, height: 1, background: 'var(--praman-border)', margin: '0 auto' }} />
        <PitchGrid />
        <Capabilities />
        <Philosophy />
        <AssuranceBar />
        <CTA />
      </main>
    </Layout>
  );
}
