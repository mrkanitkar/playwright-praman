import type { ReactNode } from 'react';
import Link from '@docusaurus/Link';
import Layout from '@theme/Layout';

interface Persona {
  role: string;
  title: string;
  challenge: string;
  solution: string;
  cta: string;
}

function PersonaCard({ role, title, challenge, solution, cta }: Persona): ReactNode {
  return (
    <div style={{
      padding: '2rem',
      border: '1px solid var(--praman-border)',
      borderRadius: '10px',
      borderTop: '3px solid var(--ifm-color-primary)',
      background: 'var(--ifm-background-color)',
    }}>
      <div style={{
        fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase',
        letterSpacing: '0.1em', color: 'var(--ifm-color-primary)', marginBottom: '0.5rem',
      }}>
        {role}
      </div>
      <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '1rem' }}>{title}</h3>
      <div style={{ marginBottom: '1rem' }}>
        <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--praman-accent-secondary)', marginBottom: '0.3rem' }}>
          CHALLENGE
        </div>
        <p style={{ color: 'var(--praman-ink-secondary)', fontSize: '0.88rem', marginBottom: 0 }}>{challenge}</p>
      </div>
      <div>
        <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--ifm-color-primary)', marginBottom: '0.3rem' }}>
          HOW PRAMAN HELPS
        </div>
        <p style={{ color: 'var(--praman-ink-secondary)', fontSize: '0.88rem', marginBottom: 0 }}>{solution}</p>
      </div>
      <div style={{ marginTop: '1.5rem' }}>
        <Link className="praman-btn praman-btn-light" style={{ fontSize: '0.82rem', padding: '0.5rem 1.2rem' }} to="/docs">
          {cta}
        </Link>
      </div>
    </div>
  );
}

function PersonaGrid(): ReactNode {
  const personas: Persona[] = [
    {
      role: 'SAP Program Manager',
      title: 'Deliver S/4HANA on time with evidence',
      challenge: 'Migration timelines slip because testing is manual, slow, and you never know if business processes actually work end-to-end until go-live.',
      solution: 'Automated regression suites with compliance reports, business flow heatmaps, and data integrity validation — delivered as evidence artifacts in every run.',
      cta: 'See Compliance Reports',
    },
    {
      role: 'SAP Basis / Technical Lead',
      title: 'Test 199 UI5 control types without brittle selectors',
      challenge: 'UI5 generates dynamic IDs. Traditional Selenium/Playwright selectors break on every transport. You spend more time fixing tests than writing them.',
      solution: 'Native UI5 control APIs with 3-tier resolution, auto-retry, and self-healing. Tests survive UI5 version upgrades and theme changes.',
      cta: 'Explore Control Proxy',
    },
    {
      role: 'QA / Test Automation Engineer',
      title: 'Write SAP tests like a Playwright expert',
      challenge: 'Learning SAP UI5 internals on top of Playwright is overwhelming. SmartFields, OData bindings, FLP navigation — where do you start?',
      solution: '21 typed fixtures with auto-complete. ui5, odata, sapAuth, flp — destructure and go. setValue() + fireChange() + waitForUI5() patterns built in.',
      cta: 'Get Started',
    },
    {
      role: 'Developer / Full-Stack Engineer',
      title: 'Ship Fiori apps with confidence',
      challenge: 'You build custom Fiori apps but have no automated way to verify they work across SAP systems, browsers, and UI5 versions.',
      solution: 'Cross-platform, cross-browser testing on real SAP systems. Fiori Elements helpers for List Report, Object Page. OData V2/V4 mock support.',
      cta: 'See Fiori Elements',
    },
    {
      role: 'CISO / Security Lead',
      title: 'Compliance testing with zero vendor lock-in',
      challenge: 'Commercial SAP testing tools require cloud accounts, send data externally, and create security review overhead.',
      solution: 'Open source, runs in your environment, on your infrastructure. No external data transmission. TypeScript source you can audit. Apache-2.0 license.',
      cta: 'Review Security',
    },
    {
      role: 'AI / Platform Engineer',
      title: 'Let AI agents write and maintain SAP tests',
      challenge: 'AI coding agents struggle with SAP because there are no structured entry points, no capability discovery, and error messages are opaque.',
      solution: 'SKILL.md entry points, capabilities.list() API, structured errors with suggestions[]. Works with Copilot, Claude Code, Jules, Cursor, and any LLM agent.',
      cta: 'See AI Architecture',
    },
  ];

  return (
    <section style={{ padding: '3rem 2rem 5rem', maxWidth: 1100, margin: '0 auto' }}>
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
        gap: '1.5rem',
      }}>
        {personas.map((p, i) => (
          <PersonaCard key={i} {...p} />
        ))}
      </div>
    </section>
  );
}

interface Guide {
  icon: string;
  from: string;
  title: string;
  desc: string;
  path: string;
}

function QuickStartGuides(): ReactNode {
  const guides: Guide[] = [
    {
      icon: '🔄',
      from: 'Coming from wdi5',
      title: 'Migration from wdi5',
      desc: 'Map your wdi5 selectors, authenticators, and FE library patterns to Praman equivalents. Side-by-side code comparisons.',
      path: '/docs/guides/migration-from-wdi5',
    },
    {
      icon: '🎭',
      from: 'Already using Playwright',
      title: 'Migration from Vanilla Playwright',
      desc: 'Add SAP UI5 control access to your existing Playwright suite. Drop-in fixture replacement with zero test rewrites.',
      path: '/docs/guides/migration-from-playwright',
    },
    {
      icon: '📖',
      from: 'New to Playwright',
      title: 'Playwright Primer for SAP Testers',
      desc: 'Start here if you come from a manual testing or Selenium background. Covers async/await, fixtures, and web-first assertions.',
      path: '/docs/guides/playwright-primer',
    },
    {
      icon: '🏗️',
      from: 'Coming from Tosca',
      title: 'From Tosca to Playwright + Praman',
      desc: 'Translate Tosca modules and TestCases into Playwright test files. Covers auth setup, FLP navigation, and table scanning.',
      path: '/docs/guides/migration-from-tosca',
    },
    {
      icon: '🤖',
      from: 'Using Claude Code / Cursor / VS Code',
      title: 'Agent & IDE Setup',
      desc: 'Install AI agents, seed files, and IDE configs automatically via `init`. Covers Claude Code, VS Code, Cursor, and Jules.',
      path: '/docs/guides/agent-setup',
    },
  ];

  return (
    <section style={{
      borderTop: '1px solid var(--praman-border)',
      background: 'var(--praman-surface-alt)',
      padding: '3.5rem 2rem 5rem',
    }}>
      <div style={{ maxWidth: 1100, margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
          <p className="praman-section-label">Onboarding</p>
          <h2 className="hero__title" style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>
            Quick Start by Background
          </h2>
          <p className="hero__subtitle" style={{ fontSize: '1rem' }}>
            Pick the guide that matches where you are coming from.
          </p>
        </div>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
          gap: '1.25rem',
        }}>
          {guides.map((g) => (
            <Link
              key={g.path}
              to={g.path}
              style={{ textDecoration: 'none' }}
            >
              <div style={{
                height: '100%',
                padding: '1.5rem',
                border: '1px solid var(--praman-border)',
                borderRadius: '10px',
                borderTop: '3px solid var(--ifm-color-primary)',
                background: 'var(--ifm-background-color)',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.5rem',
                transition: 'box-shadow 0.15s, transform 0.15s',
              }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLDivElement).style.boxShadow = 'var(--praman-shadow-md)';
                  (e.currentTarget as HTMLDivElement).style.transform = 'translateY(-2px)';
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLDivElement).style.boxShadow = 'none';
                  (e.currentTarget as HTMLDivElement).style.transform = 'none';
                }}
              >
                <div style={{ fontSize: '1.6rem', lineHeight: 1 }}>{g.icon}</div>
                <div style={{
                  fontSize: '0.68rem', fontWeight: 700, textTransform: 'uppercase',
                  letterSpacing: '0.09em', color: 'var(--ifm-color-primary)',
                }}>
                  {g.from}
                </div>
                <div style={{ fontSize: '0.97rem', fontWeight: 700, color: 'var(--praman-ink)' }}>
                  {g.title}
                </div>
                <p style={{
                  fontSize: '0.83rem', color: 'var(--praman-ink-secondary)',
                  lineHeight: 1.6, margin: 0, flex: 1,
                }}>
                  {g.desc}
                </p>
                <div style={{
                  marginTop: '0.75rem', fontSize: '0.8rem', fontWeight: 600,
                  color: 'var(--ifm-color-primary)',
                }}>
                  Read guide →
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

export default function Personas(): ReactNode {
  return (
    <Layout title="Who Uses Praman — SAP Testers, AI Agents, Business Analysts" description="Three entry points for SAP test automation: AI agents generate tests via SKILL.md, test engineers use typed Playwright fixtures, business analysts validate OData outcomes.">
      <main>
        <section style={{ padding: '6rem 2rem 2rem', textAlign: 'center', maxWidth: 800, margin: '0 auto' }}>
          <p className="praman-section-label">Personas</p>
          <h1 className="hero__title" style={{ fontSize: '2.8rem' }}>Built for Your Role</h1>
          <p className="hero__subtitle">
            Whether you manage SAP programs, write Fiori apps, or build AI agents —
            Praman meets you where you are.
          </p>
        </section>
        <PersonaGrid />
        <QuickStartGuides />
      </main>
    </Layout>
  );
}
