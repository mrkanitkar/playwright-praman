import type { ReactNode } from 'react';
import clsx from 'clsx';
import Link from '@docusaurus/Link';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import Layout from '@theme/Layout';
import Heading from '@theme/Heading';

import styles from './index.module.css';

function HomepageHeader(): ReactNode {
  const { siteConfig } = useDocusaurusContext();
  return (
    <header className={clsx('hero hero--primary', styles.heroBanner)}>
      <div className="container">
        <Heading as="h1" className="hero__title">
          {siteConfig.title}
        </Heading>
        <p className="hero__subtitle">
          SAP S/4 HANA Test Automation with Agentic AI
        </p>
        <p style={{ fontSize: '1.1rem', opacity: 0.85, marginBottom: '2rem' }}>
          Crafted with Prudence. Powered by Purpose.
        </p>
        <div className={styles.buttons}>
          <Link
            className="button button--secondary button--lg"
            to="/docs"
            style={{ marginRight: '1rem' }}
          >
            Get Started
          </Link>
          <Link
            className="button button--outline button--lg"
            to="/docs/api"
            style={{ color: '#fff', borderColor: 'rgba(255,255,255,0.4)' }}
          >
            API Reference
          </Link>
        </div>
      </div>
    </header>
  );
}

type FeatureItem = {
  icon: string;
  title: string;
  description: ReactNode;
};

const features: FeatureItem[] = [
  {
    icon: '🤖',
    title: 'AI-First Architecture',
    description: (
      <>
        Designed for AI agents with <code>SKILL.md</code> entry points,{' '}
        <code>capabilities.list()</code> discovery, and compliance verification.
        Perfect for GitHub Copilot, Claude, and Jules.
      </>
    ),
  },
  {
    icon: '🔧',
    title: '32+ Powerful Fixtures',
    description: (
      <>
        Access UI5 controls, OData operations, navigation, authentication, and
        intent wrappers through Playwright&apos;s fixture pattern. Zero
        initialization required.
      </>
    ),
  },
  {
    icon: '🎯',
    title: 'SAP UI5 Native',
    description: (
      <>
        The <code>ui5.control()</code> pattern provides reliable interaction with
        SAP Fiori apps. No more flaky selectors — use UI5&apos;s own control APIs
        with auto-retry and self-healing.
      </>
    ),
  },
  {
    icon: '🏗️',
    title: '5-Layer Architecture',
    description: (
      <>
        Core → Bridge → Proxy → Fixtures → AI. Clean separation of concerns with
        typed proxies, bridge adapters, and vocabulary-driven intents.
      </>
    ),
  },
  {
    icon: '📊',
    title: 'Enterprise Observability',
    description: (
      <>
        Built-in OpenTelemetry tracing, pino structured logging, and compliance
        reporters. Full visibility into every test action.
      </>
    ),
  },
  {
    icon: '⚡',
    title: 'Playwright Native',
    description: (
      <>
        Extends <code>@playwright/test</code> natively. Use all Playwright
        features — parallel execution, auto-wait, trace viewer, and UI mode.
      </>
    ),
  },
];

function FeatureCard({ icon, title, description }: FeatureItem): ReactNode {
  return (
    <div className="col col--4" style={{ marginBottom: '1.5rem' }}>
      <div className="feature-card" style={{ height: '100%' }}>
        <div className="feature-icon">{icon}</div>
        <Heading as="h3" style={{ fontSize: '1.15rem' }}>
          {title}
        </Heading>
        <p style={{ color: 'var(--ifm-color-secondary-darkest)', fontSize: '0.95rem' }}>
          {description}
        </p>
      </div>
    </div>
  );
}

export default function Home(): ReactNode {
  return (
    <Layout
      title="AI-First SAP UI5 Test Automation"
      description="Praman — AI-First SAP UI5 Test Automation Platform for Playwright. Enterprise-grade testing with agentic AI, typed proxies, and 32+ fixtures."
    >
      <HomepageHeader />
      <main>
        <section style={{ padding: '4rem 0' }}>
          <div className="container">
            <div className="row">
              {features.map((props, idx) => (
                <FeatureCard key={idx} {...props} />
              ))}
            </div>
          </div>
        </section>
      </main>
    </Layout>
  );
}
