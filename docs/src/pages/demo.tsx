import type { ReactNode } from 'react';
import Link from '@docusaurus/Link';
import Layout from '@theme/Layout';
import VideoEmbed from '../components/VideoEmbed';

function DemoStep({ step, title, desc }: { step: string; title: string; desc: string }): ReactNode {
  return (
    <div style={{
      display: 'grid', gridTemplateColumns: '48px 1fr', gap: '1rem', alignItems: 'start',
    }}>
      <div style={{
        width: 48, height: 48, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: 'var(--ifm-color-primary)', color: '#fff', fontWeight: 700, fontSize: '1.1rem',
      }}>
        {step}
      </div>
      <div>
        <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '0.3rem' }}>{title}</h3>
        <p style={{ color: 'var(--praman-ink-secondary)', fontSize: '0.88rem', marginBottom: 0 }}>{desc}</p>
      </div>
    </div>
  );
}

const VIDEOS = [
  { id: 'Q1EqVPy4-QQ', title: 'Praman — Getting Started' },
];

function VideoSeries(): ReactNode {
  const [featured, ...rest] = VIDEOS;
  return (
    <section style={{ padding: '3rem 2rem', maxWidth: 800, margin: '0 auto' }}>
      <p className="praman-section-label" style={{ textAlign: 'center' }}>Watch</p>
      <h2 className="praman-section-title" style={{ textAlign: 'center' }}>Praman in Action</h2>
      <div style={{ marginTop: '2rem' }}>
        <VideoEmbed videoId={featured.id} title={featured.title} />
      </div>
      {rest.length > 0 && (
        <div className="praman-video-grid">
          {rest.map((v) => (
            <VideoEmbed key={v.id} videoId={v.id} title={v.title} />
          ))}
        </div>
      )}
    </section>
  );
}

function HowItWorks(): ReactNode {
  return (
    <section style={{ padding: '3rem 2rem', maxWidth: 700, margin: '0 auto' }}>
      <p className="praman-section-label" style={{ textAlign: 'center' }}>How It Works</p>
      <h2 className="praman-section-title" style={{ textAlign: 'center' }}>From Install to Evidence in Minutes</h2>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem', marginTop: '2.5rem' }}>
        <DemoStep step="1" title="Install Praman" desc="npm install playwright-praman — one package, 6 sub-path exports, zero config." />
        <DemoStep step="2" title="Configure Your SAP System" desc="Point to your SAP S/4HANA or ECC system. Set auth credentials. Define your FLP entry point." />
        <DemoStep step="3" title="Write or Generate Tests" desc="Use AI agents to auto-generate tests or write them manually with 17 typed fixtures. ui5, odata, sapAuth — just destructure." />
        <DemoStep step="4" title="Run with Evidence" desc="npx playwright test — parallel execution, compliance reports, business flow heatmaps, data integrity validation." />
      </div>
    </section>
  );
}

function CodeExample(): ReactNode {
  return (
    <section style={{ padding: '3rem 2rem 5rem', maxWidth: 700, margin: '0 auto' }}>
      <p className="praman-section-label" style={{ textAlign: 'center' }}>Live Example</p>
      <h2 className="praman-section-title" style={{ textAlign: 'center' }}>Purchase Order Verification</h2>
      <div className="praman-code-block" style={{ marginTop: '2rem' }}>
        <div className="praman-code-dots"><span /><span /><span /></div>
        <pre><code>
          <span className="kw">import</span>{' { '}<span className="fn">test</span>{', '}<span className="fn">expect</span>{' } '}<span className="kw">from</span>{' '}<span className="str">{"'playwright-praman'"}</span>{';'}{'\n'}
          {'\n'}
          <span className="fn">test</span>{'('}<span className="str">{"'verify PO creation in ME21N'"}</span>{', '}<span className="kw">async</span>{' ({ '}<span className="fn">ui5</span>{', '}<span className="fn">odata</span>{', '}<span className="fn">sapAuth</span>{' }) => {'}{'\n'}
          {'  '}<span className="cmt">{'// Step 1: Navigate to transaction'}</span>{'\n'}
          {'  '}<span className="kw">await</span>{' '}<span className="fn">test</span>{'.'}<span className="fn">step</span>{'('}<span className="str">{"'Open ME21N'"}</span>{', '}<span className="kw">async</span>{' () => {'}{'\n'}
          {'    '}<span className="kw">await</span>{' '}<span className="fn">ui5</span>{'.'}<span className="fn">navigation</span>{'.'}<span className="fn">toTransaction</span>{'('}<span className="str">{"'ME21N'"}</span>{');'}{'\n'}
          {'  });'}{'\n'}
          {'\n'}
          {'  '}<span className="cmt">{'// Step 2: Fill PO header'}</span>{'\n'}
          {'  '}<span className="kw">await</span>{' '}<span className="fn">test</span>{'.'}<span className="fn">step</span>{'('}<span className="str">{"'Enter vendor and material'"}</span>{', '}<span className="kw">async</span>{' () => {'}{'\n'}
          {'    '}<span className="kw">const</span>{' vendor = '}<span className="kw">await</span>{' '}<span className="fn">ui5</span>{'.'}<span className="fn">control</span>{'({ '}<span className="fn">id</span>{': '}<span className="str">{"'vendorInput'"}</span>{' });'}{'\n'}
          {'    '}<span className="kw">await</span>{' vendor.'}<span className="fn">setValue</span>{'('}<span className="str">{"'1000'"}</span>{');'}{'\n'}
          {'    '}<span className="kw">await</span>{' vendor.'}<span className="fn">fireChange</span>{'();'}{'\n'}
          {'  });'}{'\n'}
          {'\n'}
          {'  '}<span className="cmt">{'// Step 3: Verify via OData'}</span>{'\n'}
          {'  '}<span className="kw">await</span>{' '}<span className="fn">test</span>{'.'}<span className="fn">step</span>{'('}<span className="str">{"'Validate PO in backend'"}</span>{', '}<span className="kw">async</span>{' () => {'}{'\n'}
          {'    '}<span className="kw">const</span>{' result = '}<span className="kw">await</span>{' '}<span className="fn">odata</span>{'.'}<span className="fn">read</span>{'('}<span className="str">{"'/PurchaseOrders'"}</span>{');'}{'\n'}
          {'    '}<span className="fn">expect</span>{'(result.value.length).'}<span className="fn">toBeGreaterThan</span>{'(0);'}{'\n'}
          {'  });'}{'\n'}
          {'});'}
        </code></pre>
      </div>
    </section>
  );
}

function AgentWorkflow(): ReactNode {
  return (
    <section style={{ padding: '3rem 2rem 5rem', maxWidth: 800, margin: '0 auto' }}>
      <p className="praman-section-label" style={{ textAlign: 'center' }}>Agentic Workflow</p>
      <h2 className="praman-section-title" style={{ textAlign: 'center' }}>AI Agents Write Your Tests</h2>
      <div className="praman-pitch-grid" style={{ marginTop: '2rem' }}>
        <div className="praman-pitch-cell">
          <div className="praman-pitch-step">Plan</div>
          <h3>Explore & Plan</h3>
          <p>Agent navigates your live SAP system, discovers controls, and creates a test plan with assertions.</p>
        </div>
        <div className="praman-pitch-cell">
          <div className="praman-pitch-step">Generate</div>
          <h3>Write Tests</h3>
          <p>Agent generates compliant Playwright tests using Praman fixtures. 7 mandatory rules enforced.</p>
        </div>
        <div className="praman-pitch-cell">
          <div className="praman-pitch-step">Validate</div>
          <h3>Run & Verify</h3>
          <p>Tests execute against the live system. Failures are captured with screenshots, traces, and logs.</p>
        </div>
        <div className="praman-pitch-cell">
          <div className="praman-pitch-step">Heal</div>
          <h3>Fix & Evolve</h3>
          <p>Healer agent diagnoses failures, fixes selectors, updates assertions, and re-validates automatically.</p>
        </div>
      </div>
    </section>
  );
}

function CTASection(): ReactNode {
  return (
    <section className="praman-cta" style={{ textAlign: 'center', padding: '5rem 2rem' }}>
      <h2>Ready to see it in action?</h2>
      <p>Get started with Praman in under 5 minutes.</p>
      <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center' }}>
        <Link className="praman-btn praman-btn-dark" to="/docs">Get Started</Link>
        <Link className="praman-btn praman-btn-light" href="https://github.com/mrkanitkar/playwright-praman">View on GitHub</Link>
      </div>
    </section>
  );
}

export default function Demo(): ReactNode {
  return (
    <Layout title="SAP Test Automation Demo — Install to Evidence in 4 Steps" description="See Praman in action: install, configure SAP S/4HANA, generate Playwright tests with AI agents, run with compliance reports and evidence.">
      <main>
        <section style={{ padding: '6rem 2rem 2rem', textAlign: 'center', maxWidth: 800, margin: '0 auto' }}>
          <p className="praman-section-label">Demo</p>
          <h1 className="hero__title" style={{ fontSize: '2.8rem' }}>See Praman in Action</h1>
          <p className="hero__subtitle">
            From npm install to compliance evidence — watch how Praman transforms SAP testing.
          </p>
        </section>
        <VideoSeries />
        <div style={{ width: 48, height: 1, background: 'var(--praman-border)', margin: '0 auto' }} />
        <HowItWorks />
        <div style={{ width: 48, height: 1, background: 'var(--praman-border)', margin: '0 auto' }} />
        <CodeExample />
        <div style={{ width: 48, height: 1, background: 'var(--praman-border)', margin: '0 auto' }} />
        <AgentWorkflow />
        <CTASection />
      </main>
    </Layout>
  );
}
