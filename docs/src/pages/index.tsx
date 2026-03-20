import { Fragment, useCallback, useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import Link from '@docusaurus/Link';
import Layout from '@theme/Layout';

/* ── SVG Slide Illustrations ──────────────────────────────── */

function AgenticSVG(): ReactNode {
  const agents = [
    { cx: 140, cy: 28, label: 'UI5' },
    { cx: 206, cy: 73, label: 'OData' },
    { cx: 180, cy: 150, label: 'Copilot' },
    { cx: 100, cy: 150, label: 'Claude' },
    { cx: 74, cy: 73, label: 'Jules' },
  ];
  const hx = 140, hy = 96;
  return (
    <svg viewBox="0 0 280 185" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"
      style={{ width: '100%', maxWidth: 300 }}>
      {agents.map(a => (
        <line key={a.label} x1={hx} y1={hy} x2={a.cx} y2={a.cy}
          stroke="rgba(255,255,255,0.28)" strokeWidth="1.5" strokeDasharray="5 4" />
      ))}
      {agents.map(a => (
        <circle key={`dot-${a.label}`}
          cx={Math.round((hx + a.cx) / 2)}
          cy={Math.round((hy + a.cy) / 2)}
          r="3.5" fill="rgba(255,215,0,0.85)" />
      ))}
      <circle cx={hx} cy={hy} r="34" fill="none"
        stroke="rgba(255,215,0,0.2)" strokeWidth="2" strokeDasharray="6 4" />
      <circle cx={hx} cy={hy} r="26" fill="rgba(255,215,0,0.88)" />
      <text x={hx} y={hy - 4} textAnchor="middle" fill="#1e3c72" fontSize="9" fontWeight="800">PRAMAN</text>
      <text x={hx} y={hy + 8} textAnchor="middle" fill="#1e3c72" fontSize="7.5" fontWeight="600">Plugin</text>
      {agents.map(a => (
        <g key={`node-${a.label}`}>
          <circle cx={a.cx} cy={a.cy} r="15"
            fill="rgba(255,255,255,0.1)" stroke="rgba(255,255,255,0.55)" strokeWidth="1.5" />
          <text x={a.cx} y={a.cy + 4} textAnchor="middle"
            fill="white" fontSize="8.5" fontWeight="600">{a.label}</text>
        </g>
      ))}
    </svg>
  );
}

function UI5SVG(): ReactNode {
  const controls = [
    'Button', 'Input', 'Table', 'List',
    'Dialog', 'Select', 'DatePicker', 'Form',
    'Panel', 'Tree', 'Chart', 'Link',
  ];
  return (
    <svg viewBox="0 0 280 185" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"
      style={{ width: '100%', maxWidth: 300 }}>
      {controls.map((label, i) => {
        const col = i % 4;
        const row = Math.floor(i / 4);
        const x = 10 + col * 66;
        const y = 8 + row * 48;
        const highlighted = i < 4;
        return (
          <g key={label}>
            <rect x={x} y={y} width={58} height={33} rx="6"
              fill={highlighted ? 'rgba(255,215,0,0.14)' : 'rgba(255,255,255,0.07)'}
              stroke={highlighted ? 'rgba(255,215,0,0.7)' : 'rgba(255,255,255,0.22)'}
              strokeWidth="1" />
            <text x={x + 29} y={y + 21} textAnchor="middle"
              fill={highlighted ? 'rgba(255,215,0,0.95)' : 'rgba(255,255,255,0.75)'}
              fontSize="8.5" fontWeight={highlighted ? '700' : '400'}>{label}</text>
          </g>
        );
      })}
      <rect x="38" y="158" width="204" height="20" rx="10"
        fill="rgba(255,255,255,0.08)" stroke="rgba(255,215,0,0.5)" strokeWidth="1" />
      <text x="140" y="172" textAnchor="middle" fill="rgba(255,215,0,0.95)"
        fontSize="10" fontWeight="700">61 Controls · 8 Libraries · 3 LTS Versions</text>
    </svg>
  );
}

function PlaywrightSVG(): ReactNode {
  const codeLines = [
    { text: "import { test } from 'playwright-praman'", color: 'rgba(255,255,255,0.55)' },
    { text: '', color: '' },
    { text: "test('verify PO', async ({ ui5, odata }) => {", color: '#c4b5fd' },
    { text: "  await ui5.control({ id: 'orderTable' });", color: '#93c5fd' },
    { text: "  await odata.read('/PurchaseOrders');", color: '#93c5fd' },
    { text: "  await expect(ui5).toHaveValue('PO-001');", color: '#86efac' },
    { text: '});', color: '#c4b5fd' },
  ];
  return (
    <svg viewBox="0 0 280 185" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"
      style={{ width: '100%', maxWidth: 300 }}>
      <rect x="8" y="4" width="264" height="174" rx="10"
        fill="rgba(16,32,64,0.75)" stroke="rgba(255,255,255,0.2)" strokeWidth="1.5" />
      <rect x="8" y="4" width="264" height="28" rx="10" fill="rgba(255,255,255,0.08)" />
      <rect x="8" y="24" width="264" height="8" fill="rgba(255,255,255,0.08)" />
      <circle cx="26" cy="18" r="5" fill="#ef4444" opacity="0.85" />
      <circle cx="41" cy="18" r="5" fill="#f59e0b" opacity="0.85" />
      <circle cx="56" cy="18" r="5" fill="#22c55e" opacity="0.85" />
      <text x="140" y="21" textAnchor="middle" fill="rgba(255,255,255,0.45)"
        fontSize="8.5">playwright-praman · test.ts</text>
      {codeLines.map((line, i) => (
        <text key={i} x="20" y={50 + i * 17} fill={line.color}
          fontSize="9.5" fontFamily="monospace">{line.text}</text>
      ))}
    </svg>
  );
}

function ArchitectureSVG(): ReactNode {
  const layers = [
    { label: 'AI & Intents', sub: 'capabilities · SKILL.md · intent APIs', fill: 'rgba(255,215,0,0.18)', stroke: 'rgba(255,215,0,0.65)' },
    { label: 'Fixtures & Auth', sub: '21 fixtures · SAP auth · OData · FLP', fill: 'rgba(255,255,255,0.12)', stroke: 'rgba(255,255,255,0.35)' },
    { label: 'Control Proxy', sub: 'typed proxies · 7 return-type handlers', fill: 'rgba(255,255,255,0.09)', stroke: 'rgba(255,255,255,0.28)' },
    { label: 'Bridge & Browser', sub: 'UI5 bridge · browser scripts · TTL cache', fill: 'rgba(255,255,255,0.06)', stroke: 'rgba(255,255,255,0.22)' },
    { label: 'Core Infrastructure', sub: 'config · errors · logging · selectors', fill: 'rgba(255,255,255,0.03)', stroke: 'rgba(255,255,255,0.16)' },
  ];
  return (
    <svg viewBox="0 0 280 185" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"
      style={{ width: '100%', maxWidth: 300 }}>
      {layers.map(({ label, sub, fill, stroke }, i) => {
        const y = 4 + i * 35;
        return (
          <g key={label}>
            <rect x="12" y={y} width="228" height="29" rx="5"
              fill={fill} stroke={stroke} strokeWidth="1" />
            <text x="24" y={y + 12} fill="white" fontSize="9.5" fontWeight="700">{label}</text>
            <text x="24" y={y + 23} fill="rgba(255,255,255,0.52)" fontSize="7.5">{sub}</text>
            {i < 4 && (
              <text x="252" y={y + 23} fill="rgba(255,255,255,0.38)" fontSize="14">↓</text>
            )}
          </g>
        );
      })}
      <text x="272" y="95" textAnchor="middle" fill="rgba(255,215,0,0.65)"
        fontSize="8" fontWeight="700"
        transform="rotate(90 272 95)">6-LAYER ARCHITECTURE</text>
    </svg>
  );
}

function EnterpriseSVG(): ReactNode {
  const checks = [
    { y: 90, label: 'CISO-Approved' },
    { y: 116, label: 'OpenTelemetry' },
    { y: 142, label: 'SBOM + CodeQL' },
  ];
  return (
    <svg viewBox="0 0 280 185" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"
      style={{ width: '100%', maxWidth: 300 }}>
      <path d="M140 8 L202 36 L202 108 Q202 158 140 180 Q78 158 78 108 L78 36 Z"
        fill="rgba(255,255,255,0.06)" stroke="rgba(255,215,0,0.65)" strokeWidth="2" />
      <path d="M140 24 L190 48 L190 108 Q190 148 140 166 Q90 148 90 108 L90 48 Z"
        fill="rgba(255,215,0,0.05)" stroke="rgba(255,255,255,0.12)" strokeWidth="1" />
      <rect x="126" y="38" width="28" height="20" rx="4"
        fill="rgba(255,215,0,0.25)" stroke="rgba(255,215,0,0.7)" strokeWidth="1.5" />
      <path d="M132 38 Q132 29 140 29 Q148 29 148 38"
        fill="none" stroke="rgba(255,215,0,0.7)" strokeWidth="2" />
      <circle cx="140" cy="49" r="4" fill="rgba(255,215,0,0.9)" />
      {checks.map(({ y, label }) => (
        <g key={label}>
          <circle cx="110" cy={y - 4} r="9"
            fill="rgba(255,215,0,0.15)" stroke="rgba(255,215,0,0.5)" strokeWidth="1" />
          <text x="110" y={y} textAnchor="middle" fill="#ffd700" fontSize="11" fontWeight="700">✓</text>
          <text x="126" y={y} fill="rgba(255,255,255,0.88)" fontSize="10.5" fontWeight="500">{label}</text>
        </g>
      ))}
    </svg>
  );
}

function PersonaSVG(): ReactNode {
  const personas = [
    {
      icon: '⬡',
      role: 'AI Agent',
      desc: 'Reads SKILL.md entry points, calls capabilities.list(), receives structured JSON responses',
      fill: 'rgba(255,215,0,0.12)',
      stroke: 'rgba(255,215,0,0.55)',
    },
    {
      icon: '</> ',
      role: 'Test Automation Engineer',
      desc: 'Destructures { ui5, odata, flp, auth } from Playwright fixtures; calls ui5.control({ id }) with built-in retry',
      fill: 'rgba(255,255,255,0.1)',
      stroke: 'rgba(255,255,255,0.3)',
    },
    {
      icon: '▤',
      role: 'SAP Business Analyst',
      desc: 'Validates OData entity responses and asserts field values against expected business-rule outcomes',
      fill: 'rgba(255,255,255,0.07)',
      stroke: 'rgba(255,255,255,0.22)',
    },
  ];
  return (
    <svg viewBox="0 0 300 185" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"
      style={{ width: '100%', maxWidth: 320 }}>
      {personas.map(({ icon, role, desc, fill, stroke }, i) => {
        const y = 6 + i * 58;
        return (
          <g key={role}>
            <rect x="8" y={y} width="284" height="50" rx="8"
              fill={fill} stroke={stroke} strokeWidth="1" />
            {/* Icon circle */}
            <circle cx="32" cy={y + 25} r="16"
              fill="rgba(255,255,255,0.08)" stroke={stroke} strokeWidth="1" />
            <text x="32" y={y + 29} textAnchor="middle"
              fill="rgba(255,215,0,0.9)" fontSize="12">{icon}</text>
            {/* Role label */}
            <text x="56" y={y + 17} fill="white" fontSize="10" fontWeight="700">{role}</text>
            {/* Description — wrapped into two lines via tspan */}
            <text x="56" y={y + 30} fill="rgba(255,255,255,0.68)" fontSize="8.2" fontWeight="400">
              <tspan x="56" dy="0">{desc.length > 52 ? desc.slice(0, 52) : desc}</tspan>
              {desc.length > 52 && (
                <tspan x="56" dy="11">{desc.slice(52)}</tspan>
              )}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

/* ── Carousel Data ─────────────────────────────────────────── */

interface CarouselSlide {
  id: string;
  badge: string;
  title: string;
  subtitle: string;
  tags: string[];
  primaryCta: { label: string; to: string };
  secondaryCta: { label: string; to: string };
  Visual: () => ReactNode;
}

const SLIDES: CarouselSlide[] = [
  {
    id: 'agentic',
    badge: 'Open Source · Agentic-First',
    title: 'Transform your SAP to S/4HANA with Quality, not hope.',
    subtitle: 'Autonomous agentic testing for SAP S/4HANA. Built on Playwright. Powered by AI.',
    tags: ['Your Environment', 'Any Agent', 'Any LLM'],
    primaryCta: { label: 'Get Started', to: '/docs' },
    secondaryCta: { label: 'API Reference', to: '/docs/api' },
    Visual: AgenticSVG,
  },
  {
    id: 'personas',
    badge: 'Who Uses Praman',
    title: 'One plugin. Three distinct entry points.',
    subtitle: 'Each role interacts with Praman through its own interface — no shared abstraction, no lowest-common-denominator API.',
    tags: ['AI Agents', 'Test Engineers', 'Business Analysts'],
    primaryCta: { label: 'View Personas', to: '/personas' },
    secondaryCta: { label: 'Documentation', to: '/docs' },
    Visual: PersonaSVG,
  },
  {
    id: 'ui5',
    badge: 'SAP UI5 Native',
    title: 'Every UI5 control. Every LTS version. Every interaction.',
    subtitle: '61 control types across sap.m, sap.ui.table, sap.ui.comp, and more — with typed, self-healing fixtures across LTS 1.108 · 1.120 · 1.136.',
    tags: ['21 Fixtures', '199 Typed Interfaces', '4,092 Methods'],
    primaryCta: { label: 'Explore Fixtures', to: '/docs' },
    secondaryCta: { label: 'View Capabilities', to: '/features' },
    Visual: UI5SVG,
  },
  {
    id: 'playwright',
    badge: 'Playwright Native',
    title: 'Playwright speed. SAP precision. Zero compromise.',
    subtitle: 'Extends @playwright/test with SAP-specific selectors, auth, and UI5-aware interactions. Parallel execution, auto-wait, trace viewer — unchanged.',
    tags: ['Greenfield', 'Brownfield', 'Bluefield'],
    primaryCta: { label: 'Get Started', to: '/docs' },
    secondaryCta: { label: 'Documentation', to: '/docs' },
    Visual: PlaywrightSVG,
  },
  {
    id: 'architecture',
    badge: 'Architecture',
    title: 'Built to last. Designed for AI agents.',
    subtitle: '6-layer architecture: Core → Bridge → Proxy → Fixtures → AI. 3 interaction strategies, TTL+LRU caching, 10 error subclasses, full OTel tracing.',
    tags: ['TypeScript', 'Open Source', 'ESM + CJS'],
    primaryCta: { label: 'View Architecture', to: '/architecture' },
    secondaryCta: { label: 'API Reference', to: '/docs/api' },
    Visual: ArchitectureSVG,
  },
  {
    id: 'enterprise',
    badge: 'Enterprise Ready',
    title: 'Deploy with evidence, not hope.',
    subtitle: 'OpenTelemetry tracing, pino structured logging, compliance reporters, defect video, SBOM, and CodeQL security scanning. CISO-approved from day one.',
    tags: ['CISO-Approved', 'Cross-Platform', 'Zero Lock-in'],
    primaryCta: { label: 'Get Started', to: '/docs' },
    secondaryCta: { label: 'Contributing', to: '/contributing' },
    Visual: EnterpriseSVG,
  },
];

const AUTO_ADVANCE_MS = 4500;

/* ── Hero Carousel ─────────────────────────────────────────── */

function HeroCarousel(): ReactNode {
  const [current, setCurrent] = useState(0);
  const [paused, setPaused] = useState(false);

  const goNext = useCallback(() => {
    setCurrent(c => (c + 1) % SLIDES.length);
  }, []);

  const goPrev = useCallback(() => {
    setCurrent(c => (c - 1 + SLIDES.length) % SLIDES.length);
  }, []);

  useEffect(() => {
    if (paused) return;
    const id = setInterval(goNext, AUTO_ADVANCE_MS);
    return () => { clearInterval(id); };
  }, [paused, goNext]);

  return (
    <div
      className="praman-hero-wrap praman-carousel praman-hero-section"
      onMouseEnter={() => { setPaused(true); }}
      onMouseLeave={() => { setPaused(false); }}
    >
      {/* Persistent H1 — always visible to crawlers and users */}
      <div className="praman-hero-persistent">
        <h1 className="praman-hero-h1">
          Playwright-Praman — Agent-First SAP UI5 Test Automation Plugin for Playwright
        </h1>
        <p className="praman-hero-tagline">
          Enterprise Playwright plugin for SAP S/4HANA test automation. 61 UI5 controls, 21
          fixtures, 199 typed interfaces, 4,092 methods. Free and open source.
        </p>
      </div>
      <div className="praman-carousel-inner">
        {SLIDES.map((s, i) => {
          const { Visual } = s;
          return (
            <div
              key={s.id}
              className={`praman-carousel-slide${i === current ? ' active' : ''}`}
              aria-hidden={i !== current}
            >
              <div className="praman-carousel-content">
                <div className="praman-carousel-text">
                  <span className="praman-carousel-badge">{s.badge}</span>
                  {i === 0 ? (
                    <h1 className="praman-carousel-title">{s.title}</h1>
                  ) : (
                    <h2 className="praman-carousel-title">{s.title}</h2>
                  )}
                  <p className="praman-carousel-subtitle">{s.subtitle}</p>
                  <div className="praman-pills">
                    {s.tags.map((tag, j) => (
                      <Fragment key={tag}>
                        <span>{tag}</span>
                        {j < s.tags.length - 1 && <span className="dot">&bull;</span>}
                      </Fragment>
                    ))}
                  </div>
                  <div className="praman-carousel-cta">
                    <Link className="praman-btn praman-btn-hero-primary" to={s.primaryCta.to}>
                      {s.primaryCta.label}
                    </Link>
                    <Link className="praman-btn praman-btn-hero-outline" to={s.secondaryCta.to}>
                      {s.secondaryCta.label}
                    </Link>
                  </div>
                </div>
                <div className="praman-carousel-visual">
                  <Visual />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <button
        className="praman-carousel-arrow praman-carousel-arrow-prev"
        onClick={goPrev}
        aria-label="Previous slide"
      >
        &#8249;
      </button>
      <button
        className="praman-carousel-arrow praman-carousel-arrow-next"
        onClick={goNext}
        aria-label="Next slide"
      >
        &#8250;
      </button>

      <div className="praman-carousel-dots" role="tablist">
        {SLIDES.map((s, i) => (
          <button
            key={s.id}
            role="tab"
            className={`praman-carousel-dot${i === current ? ' active' : ''}`}
            onClick={() => { setCurrent(i); }}
            aria-label={`Slide ${i + 1}`}
            aria-selected={i === current}
          />
        ))}
      </div>
    </div>
  );
}

/* ── Page Sections (unchanged) ─────────────────────────────── */

function GlanceSection(): ReactNode {
  return (
    <div className="praman-glance-outer">
    <section className="praman-glance-section">
      <h2 className="praman-glance-title">Praman Plugin at a Glance</h2>
      <div className="praman-info-cards">
        <div className="praman-info-card">
          <h4>What is Praman Plugin?</h4>
          <p>
            Enterprise Playwright plugin for SAP S/4HANA. Describe your business process — AI agents deliver production-ready test scripts.
          </p>
        </div>
        <div className="praman-info-card">
          <h4>When to Use?</h4>
          <ul className="praman-when-to-use-list">
            <li><strong>SAP RISE &amp; Public Cloud migration</strong> — validate every Fiori app before and after cutover</li>
            <li><strong>Frequent upgrade cycles</strong> — quarterly UI5 patches, feature packs, and S/4HANA updates need continuous regression</li>
            <li><strong>No documentation</strong> — AI agents discover controls from your live system, no specs required</li>
            <li><strong>Cost reduction</strong> — replace manual test scripting with autonomous agent-generated tests</li>
            <li><strong>Agentic automation</strong> — build a complete plan → generate → heal pipeline with zero human scripting</li>
            <li><strong>Greenfield, brownfield, or bluefield</strong> — one plugin covers every S/4HANA deployment model</li>
          </ul>
        </div>
        <div className="praman-info-card">
          <h4>Agent-First Design</h4>
          <p>
            Business analysts define the process. AI agents — Claude, Copilot, Jules — generate the tests. No scripting required.
          </p>
        </div>
      </div>
    </section>
    </div>
  );
}

/* ── Agent Flow: Signavio → Test Plan → Playwright Script ──── */

function SignavioFlowSVG(): ReactNode {
  return (
    <svg viewBox="0 0 160 270" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"
      style={{ width: '100%', maxWidth: 160, display: 'block', margin: '0 auto' }}>
      {/* Header bar */}
      <rect x="0" y="0" width="160" height="16" rx="3" fill="rgba(255,255,255,0.07)" />
      <text x="80" y="11" textAnchor="middle" fill="rgba(255,255,255,0.45)"
        fontSize="7" fontWeight="600">Purchase Order Process</text>

      {/* Start event */}
      <circle cx="80" cy="34" r="11" fill="rgba(34,197,94,0.2)" stroke="#22c55e" strokeWidth="1.5" />
      <text x="80" y="38" textAnchor="middle" fill="#22c55e" fontSize="9" fontWeight="700">▶</text>
      {/* Arrow */}
      <line x1="80" y1="45" x2="80" y2="55" stroke="rgba(255,255,255,0.35)" strokeWidth="1.5" />
      <polygon points="77,55 83,55 80,61" fill="rgba(255,255,255,0.35)" />

      {/* Task 1 */}
      <rect x="10" y="61" width="140" height="26" rx="5"
        fill="rgba(0,112,173,0.28)" stroke="rgba(100,180,240,0.45)" strokeWidth="1" />
      <text x="80" y="78" textAnchor="middle" fill="rgba(255,255,255,0.85)"
        fontSize="8" fontWeight="500">Identify Procurement Need</text>
      {/* Arrow */}
      <line x1="80" y1="87" x2="80" y2="97" stroke="rgba(255,255,255,0.35)" strokeWidth="1.5" />
      <polygon points="77,97 83,97 80,103" fill="rgba(255,255,255,0.35)" />

      {/* Task 2 */}
      <rect x="10" y="103" width="140" height="26" rx="5"
        fill="rgba(0,112,173,0.28)" stroke="rgba(100,180,240,0.45)" strokeWidth="1" />
      <text x="80" y="120" textAnchor="middle" fill="rgba(255,255,255,0.85)"
        fontSize="8" fontWeight="500">Select Vendor</text>
      {/* Arrow */}
      <line x1="80" y1="129" x2="80" y2="139" stroke="rgba(255,255,255,0.35)" strokeWidth="1.5" />
      <polygon points="77,139 83,139 80,145" fill="rgba(255,255,255,0.35)" />

      {/* Task 3 — highlighted: Create PO */}
      <rect x="10" y="145" width="140" height="30" rx="5"
        fill="rgba(255,215,0,0.13)" stroke="rgba(255,215,0,0.6)" strokeWidth="1.5" />
      <text x="80" y="160" textAnchor="middle" fill="rgba(255,215,0,0.95)"
        fontSize="8" fontWeight="700">Create PO (ME21N)</text>
      <text x="80" y="170" textAnchor="middle" fill="rgba(255,255,255,0.55)"
        fontSize="6.5">Material · Qty · Vendor · Plant</text>
      {/* Arrow */}
      <line x1="80" y1="175" x2="80" y2="185" stroke="rgba(255,255,255,0.35)" strokeWidth="1.5" />
      <polygon points="77,185 83,185 80,191" fill="rgba(255,255,255,0.35)" />

      {/* Gateway diamond */}
      <polygon points="80,191 108,205 80,219 52,205"
        fill="rgba(245,158,11,0.13)" stroke="rgba(245,158,11,0.5)" strokeWidth="1" />
      <text x="80" y="208" textAnchor="middle" fill="rgba(255,255,255,0.65)"
        fontSize="6.5">Approved?</text>
      {/* Arrow (Yes) */}
      <line x1="80" y1="219" x2="80" y2="229" stroke="rgba(255,255,255,0.35)" strokeWidth="1.5" />
      <polygon points="77,229 83,229 80,235" fill="rgba(255,255,255,0.35)" />

      {/* Task 4 */}
      <rect x="10" y="235" width="140" height="26" rx="5"
        fill="rgba(0,112,173,0.28)" stroke="rgba(100,180,240,0.45)" strokeWidth="1" />
      <text x="80" y="252" textAnchor="middle" fill="rgba(255,255,255,0.85)"
        fontSize="8" fontWeight="500">Post Purchase Order</text>
    </svg>
  );
}

function AgentFlowSection(): ReactNode {
  return (
    <div className="praman-agent-flow-outer">
      <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
        <p className="praman-section-label">How it works</p>
        <h2 className="praman-section-title">From business process to Playwright test — autonomously</h2>
      </div>
      <p style={{ textAlign: 'center', maxWidth: 700, margin: '0 auto 2rem', fontSize: '1.08rem', color: 'var(--praman-ink-secondary)', lineHeight: 1.7 }}>
        Submit a Signavio flow, a test case description, or a business process in plain language.
        Praman&apos;s AI agents connect to your live SAP system, discover every UI5 control,
        generate a structured test plan, and deliver production-ready Playwright scripts —
        covering SAP end-to-end quality from requirement to deployment evidence. No scripting. No selectors. No delays.
      </p>
      <div className="praman-agent-flow-grid">

        {/* Panel 1: Signavio */}
        <div className="praman-agent-flow-panel">
          <p className="praman-flow-step-label">① Input</p>
          <p className="praman-flow-panel-title">Signavio Business Flow</p>
          <div className="praman-code-block praman-flow-block">
            <div className="praman-code-dots"><span /><span /><span /></div>
            <SignavioFlowSVG />
          </div>
        </div>

        {/* Animated connector 1 */}
        <div className="praman-flow-connector" aria-hidden="true">
          <div className="praman-flow-line" />
          <div className="praman-flow-dot" style={{ animationDelay: '0s' }} />
          <div className="praman-flow-dot" style={{ animationDelay: '0.55s' }} />
          <div className="praman-flow-dot" style={{ animationDelay: '1.1s' }} />
          <div className="praman-flow-arrow">›</div>
        </div>

        {/* Panel 2: Test Plan */}
        <div className="praman-agent-flow-panel">
          <p className="praman-flow-step-label">② Agent Generates</p>
          <p className="praman-flow-panel-title">Test Plan</p>
          <div className="praman-code-block praman-flow-block">
            <div className="praman-code-dots"><span /><span /><span /></div>
            <pre><code>
              <span className="cmt">{'# Create Purchase Order'}</span>{'\n'}
              {'\n'}
              <span className="kw">{'### Test 1: Navigate to ME21N'}</span>{'\n'}
              {'1. '}<span className="fn">{'Open FLP → Purchasing tile'}</span>{'\n'}
              {'   '}<span className="str">{'✓'}</span>{' expect: ME21N app loads\n'}
              {'\n'}
              <span className="kw">{'### Test 2: Enter Header Data'}</span>{'\n'}
              {'1. '}<span className="fn">{'Set Vendor: 1000 (Müller GmbH)'}</span>{'\n'}
              {'   '}<span className="str">{'✓'}</span>{' expect: Vendor name auto-filled\n'}
              {'2. '}<span className="fn">{'Purch.Org: 1010, Group: 001'}</span>{'\n'}
              {'   '}<span className="str">{'✓'}</span>{' expect: Header accepted\n'}
              {'\n'}
              <span className="kw">{'### Test 3: Submit & Verify'}</span>{'\n'}
              {'1. '}<span className="fn">{"Click 'Order' → Post PO"}</span>{'\n'}
              {'   '}<span className="str">{'✓'}</span>{' expect: PO# 4500000xxx\n'}
              {'2. '}<span className="fn">{'OData: GET /A_PurchaseOrder'}</span>{'\n'}
              {'   '}<span className="str">{'✓'}</span>{' expect: Status = Open'}
            </code></pre>
          </div>
        </div>

        {/* Animated connector 2 */}
        <div className="praman-flow-connector" aria-hidden="true">
          <div className="praman-flow-line" />
          <div className="praman-flow-dot" style={{ animationDelay: '0.25s' }} />
          <div className="praman-flow-dot" style={{ animationDelay: '0.8s' }} />
          <div className="praman-flow-dot" style={{ animationDelay: '1.35s' }} />
          <div className="praman-flow-arrow">›</div>
        </div>

        {/* Panel 3: Playwright Script */}
        <div className="praman-agent-flow-panel">
          <p className="praman-flow-step-label">③ Agent Generates</p>
          <p className="praman-flow-panel-title">Playwright Test</p>
          <div className="praman-code-block praman-flow-block">
            <div className="praman-code-dots"><span /><span /><span /></div>
            <pre><code>
              <span className="cmt">{'// Praman: AI-first SAP testing'}</span>{'\n'}
              <span className="kw">import</span>{' { '}<span className="fn">test</span>{' } '}<span className="kw">from</span>{'\n'}
              {'  '}<span className="str">{"'playwright-praman'"}</span>{';'}{'\n'}
              {'\n'}
              <span className="fn">test</span>{'('}<span className="str">{"'verify purchase order'"}</span>{','}{'\n'}
              {'  '}<span className="kw">async</span>{' ({ '}<span className="fn">ui5</span>{', '}<span className="fn">odata</span>{' }) => {'}{'\n'}
              {'\n'}
              {'  '}<span className="kw">await</span>{' '}<span className="fn">ui5</span>{'.'}<span className="fn">control</span>{'({'}{'\n'}
              {'    id: '}<span className="str">{"'vendorInput'"}</span>{','}{'\n'}
              {'    '}<span className="fn">setValue</span>{'('}<span className="str">{"'1000'"}</span>{');'}{'\n'}
              {'  });'}{'\n'}
              {'\n'}
              {'  '}<span className="kw">await</span>{' '}<span className="fn">odata</span>{'.'}<span className="fn">read</span>{'('}{'\n'}
              {'    '}<span className="str">{"'/A_PurchaseOrder'"}</span>{'\n'}
              {'  );'}{'\n'}
              {'\n'}
              {'  '}<span className="kw">await</span>{' expect('}<span className="fn">ui5</span>{')'}{'\n'}
              {'    .'}<span className="fn">toHaveValue</span>{'('}<span className="str">{"'Open'"}</span>{');'}{'\n'}
              {'});'}
            </code></pre>
          </div>
        </div>

      </div>
    </div>
  );
}

/* ── Reports Section ───────────────────────────────────────── */

function ReportsSection(): ReactNode {
  const heatmapRows = [
    { label: 'Depreciation Run (F.16)', time: '89.4s', pct: 100, status: 'CRITICAL', color: '#dc3545' },
    { label: 'Period Close (F.16/F110)', time: '62.1s', pct: 69,  status: 'REVIEW',   color: '#f59e0b' },
    { label: 'Procure-to-Pay',          time: '45.2s', pct: 51,  status: 'GOOD',     color: '#0070ad' },
    { label: 'Asset Accounting',        time: '29.8s', pct: 33,  status: 'OPTIMAL',  color: '#22c55e' },
  ];

  const roles = [
    { role: 'CFO', kpi: 'Financial KPIs, compliance score, period-close status' },
    { role: 'Procurement', kpi: 'PO cycle times, vendor SLA, Procure-to-Pay flow' },
    { role: 'Sales', kpi: 'Order-to-Cash duration, AR validation, collection rate' },
    { role: 'Board', kpi: 'Executive summary, business risk score, test pass rate' },
  ];

  return (
    <section className="praman-reports-outer">
      <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
        <p className="praman-section-label">Evidence</p>
        <h2 className="praman-section-title">Build your Reports that speak to every stakeholder</h2>
      </div>
      <div className="praman-reports-grid">

        {/* Card 1: Role-Based Reports */}
        <div className="praman-report-card praman-report-card--blue">
          <div className="praman-report-card-header">
            <span className="praman-report-icon">&#x1F4CB;</span>
            <h3 className="praman-report-card-title">Reports by Business Role</h3>
          </div>
          <p className="praman-report-card-desc">
            Each stakeholder sees only what matters to their role — generated from the same test run.
          </p>
          <ul className="praman-report-role-list">
            {roles.map(({ role, kpi }) => (
              <li key={role}>
                <span className="praman-report-role-badge">{role}</span>
                <span className="praman-report-role-kpi">{kpi}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Card 2: Track Transformation */}
        <div className="praman-report-card praman-report-card--purple">
          <div className="praman-report-card-header">
            <span className="praman-report-icon">&#x1F4CA;</span>
            <h3 className="praman-report-card-title">Track Transformation</h3>
          </div>
          <p className="praman-report-card-desc" style={{ marginBottom: '0.2rem' }}>
            Asset Accounting <span style={{ color: 'var(--capgemini-blue)', fontWeight: 700 }}>(FI-AA)</span>
          </p>
          <div className="praman-report-metrics">
            <div className="praman-report-metric">
              <span className="praman-report-metric-val">95.4%</span>
              <span>Accuracy Score</span>
            </div>
            <div className="praman-report-metric">
              <span className="praman-report-metric-val">38K</span>
              <span>Assets Migrated</span>
            </div>
            <div className="praman-report-metric">
              <span className="praman-report-metric-val">$2.3B</span>
              <span>Total Asset Value</span>
            </div>
            <div className="praman-report-metric">
              <span className="praman-report-metric-val" style={{ color: '#f59e0b' }}>1,234</span>
              <span>Depreciation Errors</span>
            </div>
          </div>
          <div style={{ marginTop: 'auto', paddingTop: '0.5rem' }}>
            <span style={{
              display: 'inline-block',
              padding: '0.2rem 0.65rem',
              borderRadius: '4px',
              background: 'rgba(245,158,11,0.12)',
              border: '1px solid rgba(245,158,11,0.45)',
              color: '#b45309',
              fontSize: '0.68rem',
              fontWeight: 700,
              letterSpacing: '0.06em',
              textTransform: 'uppercase',
            }}>&#x26A0; Review Required</span>
          </div>
        </div>

        {/* Card 3: Performance Heatmap */}
        <div className="praman-report-card praman-report-card--dark">
          <div className="praman-report-card-header">
            <span className="praman-report-icon">&#x1F525;</span>
            <h3 className="praman-report-card-title">Business Flow Performance Heatmap</h3>
          </div>
          <p className="praman-report-card-desc">
            Identifies bottlenecks by business flow — pinpoint which process is slowing your Financial Period Close.
          </p>
          <div className="praman-heatmap-rows">
            {heatmapRows.map(({ label, time, pct, status, color }) => (
              <div key={label} className="praman-heatmap-row">
                <div className="praman-heatmap-label">
                  <span>{label}</span>
                  <span className="praman-heatmap-time">{time}</span>
                </div>
                <div className="praman-heatmap-bar-track">
                  <div className="praman-heatmap-bar-fill"
                    style={{ width: `${pct}%`, background: color }} />
                </div>
                <span className="praman-heatmap-status" style={{ color }}>{status}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Card 4: Compliance Evidence */}
        <div className="praman-report-card praman-report-card--green">
          <div className="praman-report-card-header">
            <span className="praman-report-icon">&#x1F6E1;&#xFE0F;</span>
            <h3 className="praman-report-card-title">Deploy with Evidence</h3>
          </div>
          <p className="praman-report-card-desc">
            Every run produces audit-ready artefacts — timestamped and structured for sign-off.
          </p>
          <ul className="praman-report-evidence-list">
            <li><span className="praman-evidence-check">&#10003;</span> OData response snapshots per transaction</li>
            <li><span className="praman-evidence-check">&#10003;</span> Defect video with step-level timestamps</li>
            <li><span className="praman-evidence-check">&#10003;</span> Accessibility score (WCAG 2.1)</li>
            <li><span className="praman-evidence-check">&#10003;</span> Data integrity diff: ECC vs S/4HANA</li>
            <li><span className="praman-evidence-check">&#10003;</span> CISO-approved, OpenTelemetry traced</li>
          </ul>
        </div>

      </div>
    </section>
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
          <p>Submit a business process or test case — Praman&apos;s AI agents autonomously generate test plans, produce Playwright scripts, validate OData integrity, and interact with every UI5 control. From requirement to evidence in minutes, not sprints.</p>
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
            <h3>Agent-First Architecture</h3>
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
            <p>ui5.control() with auto-retry, self-healing, and 3-tier API resolution across UI5 LTS versions. Uses UI5&apos;s own control APIs, not brittle DOM selectors.</p>
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
      title="Playwright-Praman — SAP UI5 Test Automation Plugin"
      description="Praman — Agent-First SAP UI5 Test Automation Plugin for Playwright. Enterprise-grade testing with agentic AI, typed proxies, and 32+ fixtures."
    >
      <main>
        <HeroCarousel />
        <GlanceSection />
        <AgentFlowSection />
        <ReportsSection />
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
