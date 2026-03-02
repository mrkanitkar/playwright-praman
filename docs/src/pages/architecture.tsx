import type { ReactNode } from 'react';
import { useState, useEffect } from 'react';
import Layout from '@theme/Layout';

/* ── Data ──────────────────────────────────────────────── */
const activatePhases = [
  { phase: 'Discover', highlight: false },
  { phase: 'Prepare', highlight: false },
  { phase: 'Explore', highlight: false },
  { phase: 'Realize', highlight: true },
  { phase: 'Deploy', highlight: false },
  { phase: 'Run', highlight: true },
];

const steps = [
  { num: '01', label: 'Business Flow', desc: 'Import Signavio / BPMN process definitions as test scope' },
  { num: '02', label: 'Test Scenario Generation', desc: 'AI agent generates test scenarios from business flows' },
  { num: '03', label: 'Connect OData & Test Data', desc: 'OData V2/V4 CRUD + UI5 control discovery across 61 types' },
  { num: '04', label: 'Explore SAP App', desc: 'Live browser navigation, SmartFields, dialogs, FLP pages' },
  { num: '05', label: 'Create Test Cases', desc: 'Assertions, steps, expected results, 7 compliance rules' },
  { num: '06', label: 'Create Test Script', desc: 'Playwright + Praman fixtures, typed proxies, AI healing' },
  { num: '07', label: 'Execution Reports', desc: 'Compliance reports, heatmaps, data integrity validation' },
  { num: '08', label: 'Pull in SAP Cloud ALM', desc: 'Sync test results to ALM for governance & monitoring' },
];

/* ── Theme tokens — aligned with custom.css central theme ─ */
const PRIMARY = 'var(--ifm-color-primary)';         // #0070ad in light, #4aa9d5 in dark
const PRIMARY_HEX = '#0070ad';                       // for hex-alpha ops (boxShadow, SVG)
const SURFACE_PRIMARY = '#edf4fa';                   // light-blue tinted surface (was #f0fdfa teal)

/* ── Full Architecture Section ─────────────────────────── */
function ArchitectureFlow(): ReactNode {
  const [active, setActive] = useState(0);

  useEffect(() => {
    const t = setInterval(() => setActive((p) => (p + 1) % steps.length), 2800);
    return () => clearInterval(t);
  }, []);

  return (
    <div>
      <style>{`
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes flowDash { to { stroke-dashoffset: -24; } }
        @keyframes pulseNode { 0%,100% { box-shadow: 0 0 0 0 rgba(0,112,173,0.3); } 50% { box-shadow: 0 0 0 8px rgba(0,112,173,0); } }
        @keyframes dropDown { to { stroke-dashoffset: -16; } }
      `}</style>

      {/* ── Row 1: SAP Activate Chevrons ──────────────── */}
      <div style={{ fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.12em', color: '#334155', marginBottom: '0.5rem' }}>
        SAP Activate Methodology
      </div>
      <div style={{ display: 'flex' }}>
        {activatePhases.map((p, i) => {
          const bg = p.highlight ? PRIMARY : '#f1f5f9';
          const fg = p.highlight ? '#fff' : '#334155';
          const arrow = p.highlight ? PRIMARY : '#cbd5e1';
          return (
            <div key={i} style={{ display: 'flex', alignItems: 'center', flex: 1 }}>
              <div style={{
                flex: 1, padding: '0.65rem 0', textAlign: 'center',
                background: bg, color: fg,
                fontSize: '0.78rem', fontWeight: p.highlight ? 700 : 500,
              }}>
                {p.phase}
              </div>
              {i < activatePhases.length - 1 && (
                <svg width="16" height="36" style={{ flexShrink: 0 }}>
                  <polygon points="0,0 16,18 0,36" fill={arrow} />
                </svg>
              )}
            </div>
          );
        })}
      </div>

      {/* ── Animated dotted connectors from Realize & Run down to pipeline ── */}
      <div style={{ position: 'relative', height: 56 }}>
        {/* Realize connector — from chevron 4 (center ~58%) curving down-left to pipeline start (~6%) */}
        <div style={{
          position: 'absolute', top: 0, left: '56%', width: '2px', height: '100%',
        }}>
          <svg width="100%" height="100%" viewBox="0 0 2 56" preserveAspectRatio="none" style={{ position: 'absolute', top: 0, left: 0, overflow: 'visible' }}>
            <line x1="1" y1="0" x2="1" y2="56"
              stroke={PRIMARY} strokeWidth="3" strokeDasharray="6 4"
              style={{ animation: 'dropDown 0.8s linear infinite' }} />
          </svg>
          {/* Arrow at bottom */}
          <div style={{
            position: 'absolute', bottom: -4, left: '50%', transform: 'translateX(-50%)',
            width: 0, height: 0,
            borderLeft: '5px solid transparent', borderRight: '5px solid transparent',
            borderTop: `8px solid ${PRIMARY}`,
          }} />
        </div>

        {/* Run connector — from chevron 6 (center ~92%) dropping straight down to pipeline end (~94%) */}
        <div style={{
          position: 'absolute', top: 0, left: '91%', width: '2px', height: '100%',
        }}>
          <svg width="100%" height="100%" viewBox="0 0 2 56" preserveAspectRatio="none" style={{ position: 'absolute', top: 0, left: 0, overflow: 'visible' }}>
            <line x1="1" y1="0" x2="1" y2="56"
              stroke={PRIMARY} strokeWidth="3" strokeDasharray="6 4"
              style={{ animation: 'dropDown 0.8s linear infinite' }} />
          </svg>
          {/* Arrow at bottom */}
          <div style={{
            position: 'absolute', bottom: -4, left: '50%', transform: 'translateX(-50%)',
            width: 0, height: 0,
            borderLeft: '5px solid transparent', borderRight: '5px solid transparent',
            borderTop: `8px solid ${PRIMARY}`,
          }} />
        </div>

      </div>

      {/* ── Row 2: Praman Pipeline (full width, with header bar) ── */}
      <div style={{
        border: `2px solid ${PRIMARY}`, borderRadius: 12,
        overflow: 'hidden',
        boxShadow: `0 4px 16px rgba(0,112,173,0.12)`,
      }}>
        {/* Full-width header bar */}
        <div style={{
          background: PRIMARY, color: '#fff',
          padding: '0.5rem 1rem',
          fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase',
          textAlign: 'center',
        }}>
          AI + Playwright + Praman
        </div>
        {/* Pipeline nodes */}
        <div style={{
          display: 'flex', alignItems: 'flex-start',
          background: '#f8fffe', padding: '0.5rem 0.3rem 0.3rem',
        }}>
        {steps.map((s, i) => {
          const isActive = i === active;
          return (
            <div key={i} style={{ display: 'flex', alignItems: 'flex-start', flex: 1, minWidth: 0 }}>
              <div onClick={() => setActive(i)} style={{
                flex: 1, minWidth: 0,
                textAlign: 'center', cursor: 'pointer',
                padding: '0.4rem 0.2rem',
              }}>
                {/* Circle node */}
                <div style={{
                  width: isActive ? 42 : 32, height: isActive ? 42 : 32,
                  borderRadius: '50%', margin: '0 auto 0.4rem',
                  background: PRIMARY,
                  color: '#fff',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: isActive ? '0.75rem' : '0.62rem', fontWeight: 700,
                  transition: 'width 0.3s, height 0.3s',
                  animation: isActive ? 'pulseNode 2s ease-in-out infinite' : 'none',
                }}>
                  {s.num}
                </div>
                {/* Label */}
                <div style={{
                  fontSize: isActive ? '0.65rem' : '0.58rem',
                  fontWeight: 700,
                  color: '#0f172a',
                  lineHeight: 1.25,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}>
                  {s.label}
                </div>
              </div>
              {/* Animated connector */}
              {i < steps.length - 1 && (
                <div style={{ display: 'flex', alignItems: 'center', height: 42, paddingTop: '0.4rem', flexShrink: 0 }}>
                  <svg width="18" height="10" style={{ overflow: 'visible' }}>
                    <line x1="0" y1="5" x2="12" y2="5"
                      stroke={PRIMARY}
                      strokeWidth="2"
                      strokeDasharray={isActive ? '5 3' : 'none'}
                      style={{
                        animation: isActive ? 'flowDash 0.8s linear infinite' : 'none',
                      }} />
                    <polygon points="12,1.5 18,5 12,8.5" fill={PRIMARY} />
                  </svg>
                </div>
              )}
            </div>
          );
        })}
        </div>
      </div>

      {/* ── Detail card ── */}
      <div key={active} style={{
        marginTop: '1rem', padding: '0.8rem 1rem',
        background: SURFACE_PRIMARY, borderRadius: 8,
        borderLeft: `4px solid ${PRIMARY}`,
        animation: 'fadeIn 0.3s ease-out both',
      }}>
        <div style={{ fontSize: '0.58rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.1em', color: PRIMARY, marginBottom: '0.2rem' }}>
          Step {active + 1} of {steps.length}
        </div>
        <div style={{ fontSize: '0.92rem', fontWeight: 600, color: '#0f172a', marginBottom: '0.15rem' }}>
          {steps[active].label}
        </div>
        <div style={{ fontSize: '0.88rem', color: '#1e293b', lineHeight: 1.5 }}>
          {steps[active].desc}
        </div>
      </div>
    </div>
  );
}

/* ── E2E Flow Data ────────────────────────────────────── */
const AMBER = '#f59e0b';
const INDIGO = '#6366f1';
const SLATE = '#334155';

interface FlowLane {
  id: string;
  label: string;
  color: string;
  icon: string;
}

interface FlowMessage {
  from: number;
  to: number;
  label: string;
  detail: string;
  dashed?: boolean;
}

const lanes: FlowLane[] = [
  { id: 'seed', label: 'Seed File', color: AMBER, icon: 'S' },
  { id: 'mcp', label: 'Playwright MCP', color: INDIGO, icon: 'P' },
  { id: 'planner', label: 'Praman SAP Planner', color: PRIMARY, icon: 'A' },
  { id: 'fiori', label: 'SAP Fiori / OData', color: '#e11d48', icon: 'F' },
  { id: 'output', label: 'Test Artifacts', color: SLATE, icon: 'T' },
];

const messages: FlowMessage[] = [
  { from: 0, to: 1, label: 'Auth & Browser Session', detail: 'Seed file provides SAP credentials + opens authenticated browser via Playwright MCP' },
  { from: 1, to: 2, label: 'Live Browser Context', detail: 'MCP passes browser page to Praman SAP Planner agent with snapshot access' },
  { from: 2, to: 3, label: 'Navigate & Discover', detail: 'Agent navigates FLP tiles, discovers SmartFields, SmartTables, UI5 controls, OData entities' },
  { from: 3, to: 2, label: 'Control Metadata + OData Schema', detail: 'Returns 61 control types, bindings, value helps, OData V2/V4 entity sets & properties', dashed: true },
  { from: 2, to: 4, label: 'Generate Test Plan', detail: 'AI designs test cases with assertions, steps, expected results — 7 compliance rules enforced' },
  { from: 2, to: 4, label: 'Generate Test Script', detail: 'Produces Playwright + Praman fixture code: setValue(), fireChange(), waitForUI5(), typed proxies' },
  { from: 4, to: 1, label: 'Execute & Validate', detail: 'Test scripts run against live SAP system via Playwright MCP — screenshots, traces, logs', dashed: true },
  { from: 1, to: 4, label: 'Evidence Artifacts', detail: 'Compliance reports, business flow heatmaps, data integrity validation, defect videos' },
];

/* ── E2E Flow Diagram ────────────────────────────────── */
function E2EFlow(): ReactNode {
  const [activeMsg, setActiveMsg] = useState(0);

  useEffect(() => {
    const t = setInterval(() => setActiveMsg((p) => (p + 1) % messages.length), 3200);
    return () => clearInterval(t);
  }, []);

  const laneW = 152;
  const laneGap = 16;
  const totalW = lanes.length * laneW + (lanes.length - 1) * laneGap;
  const headerH = 72;
  const msgH = 60;
  const topPad = 24;
  const svgH = headerH + topPad + messages.length * msgH + 40;

  const laneX = (i: number) => i * (laneW + laneGap) + laneW / 2;

  return (
    <div style={{ overflowX: 'auto' }}>
      <style>{`
        @keyframes dataFlow { to { stroke-dashoffset: -20; } }
      `}</style>

      <svg width={totalW} height={svgH} style={{ display: 'block', margin: '0 auto' }}>
        {/* Lane headers */}
        {lanes.map((l, i) => {
          const x = laneX(i);
          return (
            <g key={l.id}>
              {/* Vertical lifeline */}
              <line x1={x} y1={headerH + 4} x2={x} y2={svgH - 10}
                stroke={l.color} strokeWidth="2" strokeDasharray="6 4" opacity="0.35" />
              {/* Header box */}
              <rect x={x - laneW / 2 + 4} y={4} width={laneW - 8} height={headerH - 8}
                rx="10" fill={l.color} opacity="0.12" stroke={l.color} strokeWidth="2" />
              {/* Icon circle */}
              <circle cx={x} cy={26} r={14} fill={l.color} />
              <text x={x} y={31} textAnchor="middle" fill="#fff" fontSize="13" fontWeight="800">
                {l.icon}
              </text>
              {/* Label */}
              <text x={x} y={headerH - 4} textAnchor="middle" fill="#0f172a" fontSize="12" fontWeight="700">
                {l.label}
              </text>
            </g>
          );
        })}

        {/* Messages */}
        {messages.map((m, i) => {
          const y = headerH + topPad + i * msgH + msgH / 2;
          const x1 = laneX(m.from);
          const x2 = laneX(m.to);
          const isActive = i === activeMsg;
          const dir = x2 > x1 ? 1 : -1;
          const arrowX = x2 - dir * 8;
          const midX = (x1 + x2) / 2;

          return (
            <g key={i}>
              {/* Step number */}
              <circle cx={14} cy={y} r={11} fill={lanes[m.from].color} />
              <text x={14} y={y + 4} textAnchor="middle" fill="#fff" fontSize="10" fontWeight="800">
                {i + 1}
              </text>
              {/* Arrow line */}
              <line x1={x1} y1={y} x2={arrowX} y2={y}
                stroke={lanes[m.from].color}
                strokeWidth={2}
                strokeDasharray={m.dashed ? '8 4' : isActive ? '8 4' : 'none'}
                style={{
                  animation: isActive ? 'dataFlow 0.6s linear infinite' : 'none',
                }} />
              {/* Arrowhead */}
              <polygon
                points={`${x2},${y} ${x2 - dir * 10},${y - 5} ${x2 - dir * 10},${y + 5}`}
                fill={lanes[m.to].color} />
              {/* Label */}
              <text x={midX} y={y - 10} textAnchor="middle"
                fill="#0f172a" fontSize="11.5" fontWeight="700">
                {m.label}
              </text>
              {/* Active indicator glow */}
              {isActive && (
                <rect x={Math.min(x1, x2) - 4} y={y - 20} width={Math.abs(x2 - x1) + 8} height={30}
                  rx={6} fill={lanes[m.from].color} opacity="0.06" />
              )}
            </g>
          );
        })}
      </svg>

      {/* Active message detail card */}
      <div key={activeMsg} style={{
        marginTop: '1rem', padding: '0.8rem 1rem',
        background: SURFACE_PRIMARY, borderRadius: 8,
        borderLeft: `4px solid ${lanes[messages[activeMsg].from].color}`,
        animation: 'fadeIn 0.3s ease-out both',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.2rem' }}>
          <span style={{
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            width: 20, height: 20, borderRadius: '50%',
            background: PRIMARY, color: '#fff', fontSize: '0.6rem', fontWeight: 700,
          }}>
            {activeMsg + 1}
          </span>
          <span style={{ fontSize: '0.58rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.1em', color: PRIMARY }}>
            {lanes[messages[activeMsg].from].label} {'\u2192'} {lanes[messages[activeMsg].to].label}
          </span>
        </div>
        <div style={{ fontSize: '0.92rem', fontWeight: 600, color: '#0f172a', marginBottom: '0.15rem' }}>
          {messages[activeMsg].label}
        </div>
        <div style={{ fontSize: '0.88rem', color: '#1e293b', lineHeight: 1.5 }}>
          {messages[activeMsg].detail}
        </div>
      </div>
    </div>
  );
}

/* ── Section 3: Internal Orchestration ────────────────── */

interface SeqActor {
  id: string;
  label: string;
  sub: string;
  color: string;
}

interface SeqMsg {
  from: number;
  to: number;
  label: string;
  code: string;
  detail: string;
  ret?: boolean; // dashed return arrow
}

const actors: SeqActor[] = [
  { id: 'test', label: 'Test Code', sub: 'bom-e2e.spec.ts', color: '#6366f1' },
  { id: 'fixture', label: 'Fixtures', sub: 'ui5, sapAuth, odata', color: PRIMARY_HEX },
  { id: 'bridge', label: 'UI5 Bridge', sub: 'window.__praman_bridge', color: '#f59e0b' },
  { id: 'ui5', label: 'UI5 Runtime', sub: 'sap.ui.getCore()', color: '#e11d48' },
  { id: 'proxy', label: 'Control Proxy', sub: 'UI5ControlProxy', color: '#8b5cf6' },
  { id: 'assert', label: 'Assertions', sub: 'expect + matchers', color: '#334155' },
];

const seqMessages: SeqMsg[] = [
  {
    from: 0, to: 1,
    label: 'import { test, expect }',
    code: "import { test, expect } from 'playwright-praman'",
    detail: 'Test destructures ui5 fixture from merged fixture chain. mergeTests() composes auth, navigation, stability, Fiori Elements, and AI fixtures into a single test object.',
  },
  {
    from: 1, to: 2,
    label: 'Inject Bridge',
    code: 'ensureBridgeInjected(page)',
    detail: 'Idempotent injection via WeakSet. Waits for sap.ui.require to exist, then evaluates createBridgeInjectionScript() to set window.__praman_bridge with objectMap, getById(), and 3-tier control lookup.',
  },
  {
    from: 2, to: 3,
    label: '3-Tier Control Lookup',
    code: "bridge.getById('createBOMFragment--material')",
    detail: 'Tier 1: Element.getElementById() (UI5 < 1.120). Tier 2: ElementRegistry.get() (UI5 >= 1.120). Tier 3: sap.ui.getCore().byId() fallback. Returns BridgeControlRef with id, controlType, methods[].',
  },
  {
    from: 3, to: 1, ret: true,
    label: 'ControlDiscoveryResult',
    code: '{ id, controlType, methods[], domId, visible }',
    detail: 'Discovery result includes control type (sap.ui.comp.smartfield.SmartField), available methods list, DOM reference ID, and visibility flag. Supports enhanced matching: properties, viewName, bindingPath.',
  },
  {
    from: 1, to: 4,
    label: 'Create Proxy',
    code: 'createControlProxy({ id, controlType, methods, page })',
    detail: 'ES Proxy with 8-step get trap: Symbol handling, anti-thenable, direct props, built-in overrides (press/setValue/getId), blacklist check, cached dynamic method forwarder, fluent chaining.',
  },
  {
    from: 0, to: 4,
    label: 'Call UI5 Methods',
    code: 'await control.setValue(material); await control.fireChange()',
    detail: 'Proxy routes method calls through page.evaluate() to bridge. 7-type return handler: result (primitive), element (sub-proxy), aggregation (array of proxies), object (UUID-keyed), empty, none, unknown.',
  },
  {
    from: 4, to: 2,
    label: 'Execute in Browser',
    code: 'page.evaluate(createExecuteMethodScript(), id, method, args)',
    detail: 'Bridge resolves control, invokes method, detects return type. Non-serializable objects saved to bridge.objectMap with UUID key. Interaction strategy: firePress() > fireSelect() > fireTap() > DOM click.',
  },
  {
    from: 1, to: 3,
    label: 'Smart Wait',
    code: 'waitForUI5Stable() — getUIPending() === 0',
    detail: 'Polls sap.ui.getCore().getUIPending() every 250ms. Auto-triggered on framenavigated events. Timeout: 30s. Also briefDOMSettle() for non-UI5 transitions. Ensures OData responses are processed.',
  },
  {
    from: 4, to: 0, ret: true,
    label: 'Chainable Result',
    code: 'await smartTable.getTable().getRows()[0].getBindingContext()',
    detail: 'createChainableResult() wraps promises for fluent chaining. getRows() returns array of sub-proxies via aggregation return type. Each sub-proxy is a full UI5ControlProxy with all methods available.',
  },
  {
    from: 0, to: 5,
    label: 'Assert & Report',
    code: "expect(btnText).toBe('Create BOM')",
    detail: 'Playwright expect + custom UI5 matchers: checkUI5Text, checkUI5Property, checkUI5Enabled, checkUI5Visible, checkUI5Binding, checkUI5ValueState. Table matchers: checkUI5CellText, checkUI5RowCount.',
  },
];

function InternalOrchestration(): ReactNode {
  const [activeStep, setActiveStep] = useState(0);

  useEffect(() => {
    const t = setInterval(() => setActiveStep((p) => (p + 1) % seqMessages.length), 4000);
    return () => clearInterval(t);
  }, []);

  const actorW = 130;
  const actorGap = 18;
  const totalW = actors.length * actorW + (actors.length - 1) * actorGap;
  const headerH = 80;
  const msgH = 54;
  const topPad = 16;
  const svgH = headerH + topPad + seqMessages.length * msgH + 30;
  const actorX = (i: number) => i * (actorW + actorGap) + actorW / 2;

  return (
    <div style={{ overflowX: 'auto' }}>
      <style>{`
        @keyframes seqPulse { 0%,100% { stroke-opacity: 0.3; } 50% { stroke-opacity: 1; } }
        @keyframes seqFlow { to { stroke-dashoffset: -16; } }
      `}</style>

      <svg width={totalW} height={svgH} style={{ display: 'block', margin: '0 auto' }}>
        {/* Actor columns */}
        {actors.map((a, i) => {
          const x = actorX(i);
          return (
            <g key={a.id}>
              {/* Lifeline */}
              <line x1={x} y1={headerH + 2} x2={x} y2={svgH - 8}
                stroke={a.color} strokeWidth="1.5" strokeDasharray="5 4" opacity="0.3" />
              {/* Header */}
              <rect x={x - actorW / 2 + 2} y={2} width={actorW - 4} height={headerH - 6}
                rx="8" fill={a.color} opacity="0.08" stroke={a.color} strokeWidth="2" />
              <circle cx={x} cy={22} r={13} fill={a.color} />
              <text x={x} y={27} textAnchor="middle" fill="#fff" fontSize="12" fontWeight="800">
                {a.id.charAt(0).toUpperCase()}
              </text>
              <text x={x} y={48} textAnchor="middle" fill="#0f172a" fontSize="11" fontWeight="700">
                {a.label}
              </text>
              <text x={x} y={62} textAnchor="middle" fill="#1e293b" fontSize="9.5" fontWeight="600">
                {a.sub}
              </text>
            </g>
          );
        })}

        {/* Messages */}
        {seqMessages.map((m, i) => {
          const y = headerH + topPad + i * msgH + msgH / 2;
          const x1 = actorX(m.from);
          const x2 = actorX(m.to);
          const isActive = i === activeStep;
          const dir = x2 > x1 ? 1 : -1;
          const midX = (x1 + x2) / 2;

          return (
            <g key={i}>
              {/* Step badge */}
              <circle cx={8} cy={y} r={10} fill={actors[m.from].color} />
              <text x={8} y={y + 3.5} textAnchor="middle"
                fill="#fff" fontSize="9" fontWeight="800">
                {i + 1}
              </text>

              {/* Arrow line */}
              <line x1={x1 + dir * 4} y1={y} x2={x2 - dir * 10} y2={y}
                stroke={actors[m.from].color}
                strokeWidth={2}
                strokeDasharray={m.ret ? '6 3' : isActive ? '8 3' : 'none'}
                style={{
                  animation: isActive ? 'seqFlow 0.5s linear infinite' : 'none',
                }} />
              {/* Arrowhead */}
              <polygon
                points={`${x2 - dir * 2},${y} ${x2 - dir * 10},${y - 4.5} ${x2 - dir * 10},${y + 4.5}`}
                fill={actors[m.to].color} />

              {/* Label above arrow */}
              <text x={midX} y={y - 8} textAnchor="middle"
                fill="#0f172a" fontSize="10.5" fontWeight="700">
                {m.label}
              </text>

              {/* Active indicator glow */}
              {isActive && (
                <rect x={Math.min(x1, x2) - 4} y={y - 18} width={Math.abs(x2 - x1) + 8} height={28}
                  rx={6} fill={actors[m.from].color} opacity="0.08" />
              )}
            </g>
          );
        })}

        {/* Active step highlight bar on lifelines */}
        {(() => {
          const m = seqMessages[activeStep];
          const y = headerH + topPad + activeStep * msgH + msgH / 2;
          const fromX = actorX(m.from);
          const toX = actorX(m.to);
          return (
            <>
              <rect x={fromX - 3} y={y - 18} width={6} height={36} rx={3}
                fill={actors[m.from].color} opacity="0.2" />
              <rect x={toX - 3} y={y - 18} width={6} height={36} rx={3}
                fill={actors[m.to].color} opacity="0.2" />
            </>
          );
        })()}
      </svg>

      {/* Detail card with code snippet */}
      <div key={activeStep} style={{
        marginTop: '1rem', borderRadius: 10, overflow: 'hidden',
        border: `2px solid ${actors[seqMessages[activeStep].from].color}20`,
        animation: 'fadeIn 0.3s ease-out both',
      }}>
        {/* Code bar */}
        <div style={{
          background: '#1e293b', padding: '0.6rem 1rem',
          fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
          fontSize: '0.78rem', color: '#a5f3fc', lineHeight: 1.4,
          overflowX: 'auto', whiteSpace: 'nowrap',
        }}>
          <span style={{ color: '#67e8f9', marginRight: '0.5rem' }}>{'>'}</span>
          {seqMessages[activeStep].code}
        </div>
        {/* Description */}
        <div style={{ padding: '0.8rem 1rem', background: '#f8fafc' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.3rem' }}>
            <span style={{
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
              width: 22, height: 22, borderRadius: '50%',
              background: actors[seqMessages[activeStep].from].color,
              color: '#fff', fontSize: '0.62rem', fontWeight: 700,
            }}>
              {activeStep + 1}
            </span>
            <span style={{ fontSize: '0.92rem', fontWeight: 700, color: '#0f172a' }}>
              {seqMessages[activeStep].label}
            </span>
            <span style={{ fontSize: '0.8rem', color: '#334155', fontWeight: 600 }}>
              {actors[seqMessages[activeStep].from].label} {'\u2192'} {actors[seqMessages[activeStep].to].label}
            </span>
          </div>
          <div style={{ fontSize: '0.88rem', color: '#1e293b', lineHeight: 1.6 }}>
            {seqMessages[activeStep].detail}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── Section 4: Technical Documentation ───────────────── */

/* Shared doc styles */
const docSection: React.CSSProperties = { marginBottom: '3rem' };
const docH3: React.CSSProperties = { fontSize: '1.45rem', fontWeight: 800, color: '#020617', marginBottom: '0.75rem', borderBottom: '3px solid var(--ifm-color-primary)', paddingBottom: '0.5rem' };
const docH4: React.CSSProperties = { fontSize: '1.12rem', fontWeight: 800, color: '#0f172a', marginBottom: '0.5rem', marginTop: '1.25rem' };
const docP: React.CSSProperties = { fontSize: '0.95rem', color: '#1e293b', lineHeight: 1.7, marginBottom: '0.75rem' };
const docCode: React.CSSProperties = { fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace', fontSize: '0.86rem', background: '#e2e8f0', padding: '0.15rem 0.45rem', borderRadius: 4, color: '#020617', fontWeight: 600 };
const docTable: React.CSSProperties = { width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem', marginBottom: '1rem' };
const docTh: React.CSSProperties = { textAlign: 'left', padding: '0.6rem 0.75rem', background: SURFACE_PRIMARY, borderBottom: `3px solid ${PRIMARY}`, fontWeight: 800, color: '#020617', fontSize: '0.88rem' };
const docTd: React.CSSProperties = { padding: '0.55rem 0.75rem', borderBottom: '1px solid #e2e8f0', color: '#0f172a', verticalAlign: 'top', fontWeight: 500 };
const metricCard: React.CSSProperties = { display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '1rem', background: SURFACE_PRIMARY, borderRadius: 8, border: '2px solid rgba(0,112,173,0.19)' };
const metricNum: React.CSSProperties = { fontSize: '2rem', fontWeight: 900, color: PRIMARY, lineHeight: 1 };
const metricLabel: React.CSSProperties = { fontSize: '0.78rem', fontWeight: 700, color: '#1e293b', textTransform: 'uppercase', letterSpacing: '0.05em', marginTop: '0.3rem', textAlign: 'center' };
const layerBox = (color: string): React.CSSProperties => ({ border: `2px solid ${color}`, borderRadius: 10, padding: '1rem 1.2rem', marginBottom: '0.75rem', background: `${color}0a` });
const layerTag = (color: string): React.CSSProperties => ({ display: 'inline-block', padding: '0.2rem 0.6rem', borderRadius: 4, background: color, color: '#fff', fontSize: '0.74rem', fontWeight: 800, marginRight: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.04em' });
const codeBlock: React.CSSProperties = { background: '#1e293b', borderRadius: 8, padding: '0.75rem 1rem', fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace', fontSize: '0.82rem', color: '#e2e8f0', lineHeight: 1.6, overflowX: 'auto', marginBottom: '1rem' };

/* ── Architecture Layer Diagram (static SVG) ────────── */
function LayerDiagram(): ReactNode {
  const layers = [
    { name: 'AI Layer', sub: 'ai/, intents/, vocabulary/', color: '#8b5cf6', modules: 'PramanAI, Intents, Vocabulary, AI Healing' },
    { name: 'Fixtures', sub: 'fixtures/, matchers/', color: '#6366f1', modules: '11 fixtures via mergeTests(), 10 custom matchers' },
    { name: 'Typed Proxy', sub: 'proxy/', color: PRIMARY_HEX, modules: 'UI5ControlProxy, 8-step get trap, 13 built-in overrides' },
    { name: 'Bridge Adapters', sub: 'bridge/, selectors/', color: '#f59e0b', modules: '10 browser scripts, 3 strategies, injection engine' },
    { name: 'Core Infrastructure', sub: 'core/, auth/, modules/', color: '#e11d48', modules: 'Errors, Config, Logging, Types, Selectors, Wait Helpers' },
  ];

  const boxH = 64;
  const gap = 6;
  const W = 680;
  const totalH = layers.length * (boxH + gap) + 40;

  return (
    <svg width={W} height={totalH} style={{ display: 'block', margin: '0 auto' }}>
      {layers.map((l, i) => {
        const y = i * (boxH + gap) + 20;
        const w = W - 40 - i * 28;
        const x = (W - w) / 2;
        return (
          <g key={l.name}>
            <rect x={x} y={y} width={w} height={boxH} rx={10}
              fill={`${l.color}12`} stroke={l.color} strokeWidth={2} />
            <text x={x + 14} y={y + 22} fill={l.color} fontSize="13" fontWeight="800">
              {`Layer ${5 - i}: ${l.name}`}
            </text>
            <text x={x + 14} y={y + 38} fill="#1e293b" fontSize="11" fontWeight="600">
              {l.sub}
            </text>
            <text x={x + 14} y={y + 52} fill="#334155" fontSize="10" fontWeight="600">
              {l.modules}
            </text>
            {/* Down arrow between layers */}
            {i < layers.length - 1 && (
              <polygon points={`${W / 2 - 6},${y + boxH + 1} ${W / 2 + 6},${y + boxH + 1} ${W / 2},${y + boxH + gap - 1}`}
                fill={l.color} opacity="0.5" />
            )}
          </g>
        );
      })}
    </svg>
  );
}

/* ── Data Flow Diagram (HTML/CSS) ────────────────────── */
function DataFlowDiagram(): ReactNode {
  const flowNode = (label: string, color: string, step: number): ReactNode => (
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        width: 28, height: 28, borderRadius: '50%', background: color,
        color: '#fff', fontSize: '0.72rem', fontWeight: 800, flexShrink: 0,
      }}>{step}</div>
      <div style={{
        padding: '0.4rem 0.75rem', borderRadius: 6,
        border: `2px solid ${color}`, background: `${color}0c`,
        fontSize: '0.88rem', fontWeight: 700, color: '#0f172a', whiteSpace: 'nowrap',
      }}>{label}</div>
    </div>
  );

  const arrow: ReactNode = (
    <div style={{ display: 'flex', alignItems: 'center', padding: '0 0.15rem', flexShrink: 0 }}>
      <svg width="28" height="12"><polygon points="0,2 22,6 0,10" fill="#334155" /><line x1="0" y1="6" x2="20" y2="6" stroke="#334155" strokeWidth="2" /></svg>
    </div>
  );

  const downArrow: ReactNode = (
    <div style={{ display: 'flex', justifyContent: 'center', padding: '0.25rem 0' }}>
      <svg width="12" height="22"><polygon points="2,0 10,0 6,18" fill="#334155" /><line x1="6" y1="0" x2="6" y2="16" stroke="#334155" strokeWidth="2" /></svg>
    </div>
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0 }}>
      {/* Row 1: Forward path */}
      <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '0.25rem' }}>
        {flowNode('Test Code', '#6366f1', 1)}{arrow}
        {flowNode('Fixtures', PRIMARY_HEX, 2)}{arrow}
        {flowNode('Bridge Injection', '#f59e0b', 3)}{arrow}
        {flowNode('Browser Context', '#e11d48', 4)}
      </div>
      {downArrow}
      {/* Row 2: Proxy + execution */}
      <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '0.25rem' }}>
        {flowNode('Control Proxy', '#8b5cf6', 5)}{arrow}
        {flowNode('page.evaluate()', '#f59e0b', 6)}{arrow}
        {flowNode('UI5 Runtime', '#e11d48', 7)}
      </div>
      {downArrow}
      {/* Row 3: Return path */}
      <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '0.25rem' }}>
        {flowNode('Return Handler', PRIMARY_HEX, 8)}{arrow}
        {flowNode('Assertions', '#334155', 9)}{arrow}
        {flowNode('Report', '#6366f1', 10)}
      </div>
    </div>
  );
}

/* ── Proxy Get Trap Diagram (HTML/CSS) ───────────────── */
function ProxyGetTrapDiagram(): ReactNode {
  const steps = [
    { label: 'Symbol?', desc: 'toPrimitive \u2192 string, others \u2192 undefined', color: '#6366f1' },
    { label: 'Anti-thenable?', desc: 'then/catch/finally \u2192 undefined', color: '#6366f1' },
    { label: 'Direct prop?', desc: 'id, controlType \u2192 local state', color: PRIMARY_HEX },
    { label: 'Built-in?', desc: '13 overrides (press, setValue, getId\u2026)', color: PRIMARY_HEX },
    { label: 'Blacklisted?', desc: 'throwIfBlacklisted \u2192 ControlError', color: '#e11d48' },
    { label: 'Dynamic forwarder', desc: 'getOrCreateForwarder(prop) \u2192 cached', color: '#f59e0b' },
    { label: 'page.evaluate()', desc: 'Execute method in browser via bridge', color: '#f59e0b' },
    { label: '9-type return', desc: 'Classify \u2192 proxy / primitive / array', color: '#8b5cf6' },
  ];

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '0.5rem' }}>
      {steps.map((s, i) => (
        <div key={i} style={{
          display: 'flex', alignItems: 'flex-start', gap: '0.6rem',
          padding: '0.65rem 0.75rem', borderRadius: 8,
          border: `2px solid ${s.color}`, background: `${s.color}08`,
        }}>
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            width: 28, height: 28, borderRadius: '50%', background: s.color,
            color: '#fff', fontSize: '0.75rem', fontWeight: 900, flexShrink: 0,
          }}>{i + 1}</div>
          <div>
            <div style={{ fontSize: '0.9rem', fontWeight: 800, color: '#0f172a' }}>{s.label}</div>
            <div style={{ fontSize: '0.82rem', fontWeight: 500, color: '#1e293b', marginTop: '0.1rem' }}>{s.desc}</div>
          </div>
        </div>
      ))}
    </div>
  );
}

/* ── Main Technical Documentation Component ──────────── */
function TechnicalDocumentation(): ReactNode {
  return (
    <div>
      {/* ── 4.1 Metrics at a Glance ────────────── */}
      <div style={docSection}>
        <h3 style={docH3}>Metrics at a Glance</h3>
        <p style={docP}>All numbers verified against source code. No estimates — every metric is counted from the actual codebase.</p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '0.75rem', marginBottom: '1.5rem' }}>
          {[
            { num: '97K', label: 'Total LOC' },
            { num: '46.4K', label: 'Source LOC' },
            { num: '50.6K', label: 'Test LOC' },
            { num: '180', label: 'Source Files' },
            { num: '392', label: 'Functions' },
            { num: '275', label: 'Exported Functions' },
            { num: '551', label: 'Type Definitions' },
            { num: '389', label: 'Interfaces' },
            { num: '162', label: 'Type Aliases' },
            { num: '11', label: 'Fixture Modules' },
            { num: '10', label: 'Custom Matchers' },
            { num: '13', label: 'Proxy Overrides' },
            { num: '10', label: 'Bridge Scripts' },
            { num: '13', label: 'Error Classes' },
            { num: '3', label: 'Interaction Strategies' },
            { num: '61', label: 'UI5 Control Types' },
            { num: '6', label: 'Sub-path Exports' },
            { num: '11', label: 'ESLint Plugins' },
            { num: '14', label: 'Source Directories' },
            { num: '9', label: 'Return Type Classes' },
            { num: '8', label: 'Proxy Trap Steps' },
          ].map((m) => (
            <div key={m.label} style={metricCard}>
              <span style={metricNum}>{m.num}</span>
              <span style={metricLabel}>{m.label}</span>
            </div>
          ))}
        </div>

        {/* Testing & Coverage row */}
        <h4 style={{ ...docH4, marginTop: '1.5rem', marginBottom: '0.75rem' }}>Testing & Coverage</h4>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '0.75rem', marginBottom: '1rem' }}>
          {[
            { num: '162', label: 'Unit Test Files', accent: '#6366f1' },
            { num: '3,442', label: 'Test Cases', accent: '#6366f1' },
            { num: '758', label: 'Test Suites', accent: '#6366f1' },
            { num: '9', label: 'E2E Spec Files', accent: '#8b5cf6' },
            { num: '99.1%', label: 'Stmt Coverage', accent: '#16a34a' },
            { num: '95.6%', label: 'Branch Coverage', accent: '#16a34a' },
            { num: '99.1%', label: 'Function Coverage', accent: '#16a34a' },
            { num: '99.3%', label: 'Line Coverage', accent: '#16a34a' },
          ].map((m) => (
            <div key={m.label} style={{ ...metricCard, border: `1px solid ${m.accent}20` }}>
              <span style={{ ...metricNum, color: m.accent }}>{m.num}</span>
              <span style={metricLabel}>{m.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ── 4.2 Core Architecture Layers ────────── */}
      <div style={docSection}>
        <h3 style={docH3}>Core Architecture Layers</h3>
        <p style={docP}>
          Praman follows a strict 5-layer architecture. Lower layers never import from higher layers.
          Each layer has a well-defined responsibility and communicates only with its adjacent layers.
        </p>
        <LayerDiagram />

        <div style={{ marginTop: '1.5rem' }}>
          <div style={layerBox('#e11d48')}>
            <div><span style={layerTag('#e11d48')}>Layer 1</span><strong style={{ color: '#0f172a', fontSize: '0.95rem' }}>Core Infrastructure</strong></div>
            <p style={{ ...docP, marginTop: '0.4rem', marginBottom: 0 }}>
              Foundation layer: 13 typed error classes extending <span style={docCode}>PramanError</span> with
              structured <span style={docCode}>code</span>, <span style={docCode}>attempted</span>, <span style={docCode}>retryable</span>, and <span style={docCode}>suggestions[]</span> fields.
              Config system using <span style={docCode}>{'Readonly<PramanConfig>'}</span>. Pino-based structured logging (no console.log).
              Wait helpers: <span style={docCode}>waitForUI5Stable()</span>, <span style={docCode}>briefDOMSettle()</span>, <span style={docCode}>waitForUI5Bootstrap()</span>.
              551 type definitions (389 interfaces + 162 type aliases).
            </p>
          </div>

          <div style={layerBox('#f59e0b')}>
            <div><span style={layerTag('#f59e0b')}>Layer 2</span><strong style={{ color: '#0f172a', fontSize: '0.95rem' }}>Bridge Adapters</strong></div>
            <p style={{ ...docP, marginTop: '0.4rem', marginBottom: 0 }}>
              10 browser scripts injected via <span style={docCode}>page.evaluate()</span>.
              Idempotent injection using <span style={docCode}>WeakSet</span> — <span style={docCode}>ensureBridgeInjected(page)</span> sets
              up <span style={docCode}>{'window.__praman_bridge'}</span> with objectMap, getById(), and 3-tier control lookup.
              3 interaction strategies: <strong>UI5Native</strong> (firePress/fireSelect/fireTap fallback chain),
              <strong> DomFirst</strong> (DOM click first), <strong>OPA5</strong> (RecordReplay-based).
            </p>
          </div>

          <div style={layerBox(PRIMARY_HEX)}>
            <div><span style={layerTag(PRIMARY_HEX)}>Layer 3</span><strong style={{ color: '#0f172a', fontSize: '0.95rem' }}>Typed Proxy</strong></div>
            <p style={{ ...docP, marginTop: '0.4rem', marginBottom: 0 }}>
              ES <span style={docCode}>Proxy</span> with 8-step get trap resolution. 13 built-in method overrides
              (getId, getControlType, press, enterText, select, exec, getAggregation, toString, toJSON,
              renewWebElementReference, getControlMetadata, getControlInfoFull, retrieveMembers).
              9-type return classification system. Fluent chaining via <span style={docCode}>createChainableResult()</span>.
              Blacklist enforcement prevents calling dangerous methods.
            </p>
          </div>

          <div style={layerBox('#6366f1')}>
            <div><span style={layerTag('#6366f1')}>Layer 4</span><strong style={{ color: '#0f172a', fontSize: '0.95rem' }}>Fixtures</strong></div>
            <p style={{ ...docP, marginTop: '0.4rem', marginBottom: 0 }}>
              11 fixture modules composed via Playwright{'\''}s <span style={docCode}>mergeTests()</span>:
              module, auth, nav, stability, fe, ai, intent, shellFooter, flpLocks, flpSettings, testData.
              10 custom UI5 matchers: checkUI5Text, checkUI5Visible, checkUI5Enabled, checkUI5Property,
              checkUI5ValueState, checkUI5Binding, checkUI5ControlType, checkUI5RowCount, checkUI5CellText,
              checkUI5SelectedRows.
            </p>
          </div>

          <div style={layerBox('#8b5cf6')}>
            <div><span style={layerTag('#8b5cf6')}>Layer 5</span><strong style={{ color: '#0f172a', fontSize: '0.95rem' }}>AI Layer</strong></div>
            <p style={{ ...docP, marginTop: '0.4rem', marginBottom: 0 }}>
              AI integration with optional dependencies (<span style={docCode}>@anthropic-ai/sdk</span>, <span style={docCode}>openai</span>).
              Intent-based test generation, vocabulary system for SAP domain terms, AI-powered test healing.
              Exports via sub-paths: <span style={docCode}>playwright-praman/ai</span>, <span style={docCode}>playwright-praman/intents</span>,
              <span style={docCode}> playwright-praman/vocabulary</span>.
            </p>
          </div>
        </div>
      </div>

      {/* ── 4.3 Core Design Principles ──────────── */}
      <div style={docSection}>
        <h3 style={docH3}>Core Design Principles</h3>
        <table style={docTable}>
          <thead>
            <tr>
              <th style={docTh}>Principle</th>
              <th style={docTh}>Implementation</th>
              <th style={docTh}>Enforcement</th>
            </tr>
          </thead>
          <tbody>
            {[
              ['Strict TypeScript', 'No `any`, no `as unknown as T`. 551 types, exactOptionalPropertyTypes, verbatimModuleSyntax', 'typescript-eslint strict type-checked'],
              ['Immutable Config', 'Readonly<PramanConfig> — never mutated at runtime', 'TypeScript compiler + code review'],
              ['Structured Errors', '13 error classes with code, attempted, retryable, suggestions[]', 'PramanError base class enforcement'],
              ['No console.log', 'Pino structured logging only', 'ESLint rule + code review'],
              ['No page.waitForTimeout()', 'Smart waits: waitForUI5Stable(), briefDOMSettle()', 'eslint-plugin-playwright ban list'],
              ['ESM-first', 'import/export only, node: prefix, .js extensions', 'eslint-plugin-n, eslint-plugin-import-x'],
              ['Layer Isolation', 'Lower layers never import higher layers', 'eslint-plugin-import-x boundaries'],
              ['Web-first Assertions', 'Playwright expect + custom UI5 matchers', 'eslint-plugin-playwright'],
              ['Cross-platform', 'node:path, node:fs/promises, no hardcoded separators', 'CI 3-OS matrix (Linux, macOS, Windows)'],
              ['Per-file Coverage', 'Tier 1: 100%, Tier 2: 95%, Tier 3: 90% — no file hides behind averages', '@vitest/coverage-v8 perFile: true'],
              ['TSDoc Documentation', 'Microsoft TSDoc standard, custom tags (@intent, @guarantee, @capability)', 'eslint-plugin-tsdoc with syntax: error'],
              ['Security First', '@microsoft/eslint-plugin-sdl, eslint-plugin-security, SHA-pinned Actions', '11 ESLint plugins, zero tolerance'],
            ].map(([principle, impl, enforce]) => (
              <tr key={principle}>
                <td style={{ ...docTd, fontWeight: 700, whiteSpace: 'nowrap' }}>{principle}</td>
                <td style={docTd}>{impl}</td>
                <td style={{ ...docTd, color: '#334155', fontSize: '0.85rem' }}>{enforce}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* ── 4.4 Data Flow ──────────────────────── */}
      <div style={docSection}>
        <h3 style={docH3}>Data Flow</h3>
        <p style={docP}>
          The data flow traces a single UI5 interaction from test code through all 5 architecture layers and back.
          Non-serializable objects are stored in the bridge{'\''}s objectMap with UUID keys for later retrieval.
        </p>
        <DataFlowDiagram />
        <div style={{ marginTop: '1rem' }}>
          <h4 style={docH4}>Flow Steps</h4>
          <ol style={{ ...docP, paddingLeft: '1.5rem' }}>
            <li><strong>Test Code</strong> calls fixture method (e.g., <span style={docCode}>ui5.control(selector)</span>)</li>
            <li><strong>Fixtures</strong> ensure bridge is injected (idempotent via WeakSet), then invoke bridge</li>
            <li><strong>Bridge Injection</strong> sets up <span style={docCode}>{'window.__praman_bridge'}</span> with objectMap + getById()</li>
            <li><strong>Browser Context</strong> executes 3-tier control discovery in the live SAP application</li>
            <li><strong>Control Proxy</strong> wraps the discovered control with ES Proxy for method interception</li>
            <li><strong>page.evaluate()</strong> routes each method call through bridge scripts to the UI5 runtime</li>
            <li><strong>Return Handler</strong> classifies the result into one of 9 types, creates sub-proxies for elements</li>
            <li><strong>Assertions</strong> verify the result using Playwright expect + 10 custom UI5 matchers</li>
          </ol>
        </div>
      </div>

      {/* ── 4.5 Directory Structure ────────────── */}
      <div style={docSection}>
        <h3 style={docH3}>Directory Structure</h3>
        <table style={{ ...docTable, fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace', fontSize: '0.82rem' }}>
          <thead>
            <tr>
              <th style={{ ...docTh, width: '40%' }}>Path</th>
              <th style={docTh}>Description</th>
            </tr>
          </thead>
          <tbody>
            {[
              ['src/ai/', 'AI integration (Anthropic, OpenAI)'],
              ['src/auth/', 'SAP authentication flows'],
              ['src/bridge/', 'Browser bridge + injection engine'],
              ['  bridge/browser-scripts/', '10 scripts evaluated in browser context'],
              ['  bridge/interaction-strategies/', '3 strategies (UI5Native, DomFirst, OPA5)'],
              ['src/cli/', 'CLI tooling'],
              ['src/core/', 'Foundation: errors, config, logging, types'],
              ['  core/constants/', 'Control types (61), timeouts, defaults'],
              ['  core/errors/', '13 error classes + base + codes'],
              ['  core/logging/', 'Pino structured logger'],
              ['  core/types/', '551 type definitions'],
              ['  core/utils/', 'Wait helpers, path helpers, compat'],
              ['src/fe/', 'SAP Fiori Elements support'],
              ['src/fixtures/', '11 Playwright fixture modules'],
              ['src/intents/', 'Intent-based test generation'],
              ['src/matchers/', '10 custom UI5 matchers'],
              ['src/modules/', 'Module system'],
              ['src/proxy/', 'UI5ControlProxy (8-step get trap)'],
              ['src/reporters/', 'Custom Playwright reporters'],
              ['src/selectors/', 'UI5 selector engine'],
              ['src/vocabulary/', 'SAP domain vocabulary'],
              ['src/index.ts', 'Main entry: exports test, expect'],
              ['src/version.ts', 'Package version'],
            ].map(([path, desc]) => {
              const isChild = path.startsWith('  ');
              return (
                <tr key={path} style={{ background: isChild ? '#f8fafc' : 'transparent' }}>
                  <td style={{ ...docTd, fontWeight: isChild ? 500 : 700, color: isChild ? '#334155' : PRIMARY, paddingLeft: isChild ? '2rem' : '0.75rem' }}>
                    {isChild ? '\u2514\u2500 ' : ''}{path.trim()}
                  </td>
                  <td style={docTd}>{desc}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* ── 4.6 Sub-path Exports ───────────────── */}
      <div style={docSection}>
        <h3 style={docH3}>Package Exports</h3>
        <p style={docP}>
          6 sub-path exports with dual ESM + CJS output. Every export is validated
          by <span style={docCode}>@arethetypeswrong/cli</span> (attw) to ensure correct resolution in all bundlers.
        </p>
        <table style={docTable}>
          <thead>
            <tr>
              <th style={docTh}>Import Path</th>
              <th style={docTh}>ESM</th>
              <th style={docTh}>CJS</th>
              <th style={docTh}>Contents</th>
            </tr>
          </thead>
          <tbody>
            {[
              ['playwright-praman', './dist/index.js', './dist/index.cjs', 'test, expect, fixtures, proxy, matchers'],
              ['playwright-praman/ai', './dist/ai/index.js', './dist/ai/index.cjs', 'AI integration, healing, LLM adapters'],
              ['playwright-praman/intents', './dist/intents/index.js', './dist/intents/index.cjs', 'Intent-based test generation'],
              ['playwright-praman/vocabulary', './dist/vocabulary/index.js', './dist/vocabulary/index.cjs', 'SAP domain vocabulary system'],
              ['playwright-praman/fe', './dist/fe/index.js', './dist/fe/index.cjs', 'SAP Fiori Elements helpers'],
              ['playwright-praman/reporters', './dist/reporters/index.js', './dist/reporters/index.cjs', 'Custom Playwright reporters'],
            ].map(([path, esm, cjs, contents]) => (
              <tr key={path}>
                <td style={{ ...docTd, fontWeight: 700 }}><span style={docCode}>{path}</span></td>
                <td style={docTd}><span style={{ ...docCode, fontSize: '0.74rem' }}>{esm}</span></td>
                <td style={docTd}><span style={{ ...docCode, fontSize: '0.74rem' }}>{cjs}</span></td>
                <td style={docTd}>{contents}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <p style={{ ...docP, fontSize: '0.88rem', color: '#334155' }}>
          Built by <strong>tsup</strong> with format: [{'\''}esm{'\''},{'\''}cjs{'\''} ], cjsInterop: true, shims: true.
          Each export includes matching .d.ts and .d.cts type declaration files.
        </p>
      </div>

      {/* ── 4.7 Proxy Architecture ─────────────── */}
      <div style={docSection}>
        <h3 style={docH3}>Proxy Architecture</h3>
        <p style={docP}>
          The <span style={docCode}>UI5ControlProxy</span> is the central abstraction that makes SAP UI5 controls
          feel like local TypeScript objects. It uses an ES <span style={docCode}>Proxy</span> get trap that resolves
          property access through an 8-step pipeline.
        </p>
        <ProxyGetTrapDiagram />

        <h4 style={docH4}>13 Built-in Method Overrides</h4>
        <p style={docP}>
          These methods are intercepted by <span style={docCode}>resolveKnownProperty()</span> and handled
          specially — they do not go through the generic dynamic method forwarder.
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.5rem' }}>
          {[
            { method: 'getId()', desc: 'Returns local state synchronously' },
            { method: 'getControlType()', desc: 'Returns local state synchronously' },
            { method: 'getAggregation(name)', desc: 'Returns array of sub-proxies' },
            { method: 'press()', desc: 'Delegates to interaction strategy' },
            { method: 'enterText(text)', desc: 'Delegates to interaction strategy' },
            { method: 'select(value)', desc: 'Delegates to interaction strategy' },
            { method: 'exec(fn)', desc: 'Evaluates user function in browser' },
            { method: 'toString()', desc: 'Returns proxy display string' },
            { method: 'toJSON()', desc: 'Returns proxy display string' },
            { method: 'renewWebElementReference()', desc: 'Checks control existence' },
            { method: 'getControlMetadata()', desc: 'Class name, props, aggregations' },
            { method: 'getControlInfoFull()', desc: 'Full introspection + prototype' },
            { method: 'retrieveMembers()', desc: 'Method names from prototype chain' },
          ].map((m) => (
            <div key={m.method} style={{ padding: '0.4rem 0.6rem', background: '#f8fafc', borderRadius: 6, border: '1px solid #e2e8f0' }}>
              <span style={{ ...docCode, fontSize: '0.76rem', color: PRIMARY }}>{m.method}</span>
              <div style={{ fontSize: '0.82rem', color: '#1e293b', marginTop: '0.15rem' }}>{m.desc}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ── 4.8 Nine-Type Return Detection System ── */}
      <div style={docSection}>
        <h3 style={docH3}>Nine-Type Return Detection System</h3>
        <p style={docP}>
          When a method is executed in the browser via <span style={docCode}>page.evaluate()</span>, the bridge
          classifies the return value into one of 9 types defined in <span style={docCode}>BridgeReturnType</span>.
          Each type triggers a different handler in the proxy.
        </p>
        <table style={docTable}>
          <thead>
            <tr>
              <th style={docTh}>#</th>
              <th style={docTh}>Type</th>
              <th style={docTh}>Condition</th>
              <th style={docTh}>Proxy Action</th>
            </tr>
          </thead>
          <tbody>
            {[
              ['1', 'result', 'Primitive value (string, number, boolean)', 'Returns raw value directly'],
              ['2', 'empty', 'void / undefined / null return', 'Returns undefined, enables chaining'],
              ['3', 'element', 'Existing UI5 control (same control ref)', 'Wraps in new sub-proxy with control metadata'],
              ['4', 'newElement', 'Newly discovered control reference', 'Creates fresh proxy with full discovery'],
              ['5', 'aggregation', 'Array of child controls', 'Returns array of sub-proxies, each fully typed'],
              ['6', 'object', 'Non-control UI5 object (model, binding)', 'Stored in objectMap with UUID, returns accessor proxy'],
              ['7', 'objectArray', 'Array of non-control UI5 objects', 'Each stored with UUID in objectMap'],
              ['8', 'none', 'Unclassified return (logged as warning)', 'Returns undefined with diagnostic logging'],
              ['9', 'unknown', 'Instance check failed', 'Returns undefined with diagnostic logging'],
            ].map(([num, type, condition, action]) => (
              <tr key={type}>
                <td style={{ ...docTd, fontWeight: 700, color: PRIMARY, textAlign: 'center' }}>{num}</td>
                <td style={{ ...docTd, fontWeight: 700 }}><span style={docCode}>{type}</span></td>
                <td style={docTd}>{condition}</td>
                <td style={docTd}>{action}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* ── 4.9 Three-Tier Control Discovery ───── */}
      <div style={docSection}>
        <h3 style={docH3}>Three-Tier Control Discovery</h3>
        <p style={docP}>
          Control discovery is the mechanism by which Praman locates a UI5 control in the browser. The 3-tier
          approach ensures compatibility across UI5 versions (1.71 through 2.x) and handles complex selectors.
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {/* Tier 1 */}
          <div style={{ border: `2px solid ${PRIMARY_HEX}`, borderRadius: 10, overflow: 'hidden' }}>
            <div style={{ background: PRIMARY_HEX, color: '#fff', padding: '0.5rem 0.75rem', fontSize: '0.78rem', fontWeight: 700 }}>
              Tier 1: bridge.getById() — Exact ID Match
            </div>
            <div style={{ padding: '0.75rem' }}>
              <p style={{ ...docP, marginBottom: '0.5rem' }}>
                Direct lookup by control ID. Fastest path for full ID selectors. Skipped when <span style={docCode}>forceRegistryScan</span> is true.
                Internally, <span style={docCode}>bridge.getById()</span> itself chains through 3 version-aware APIs (D19):
              </p>
              <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                {[
                  { step: '1a', api: 'Element.getElementById(id)', ver: 'UI5 2.x', color: PRIMARY_HEX },
                  { step: '1b', api: 'ElementRegistry.get(id)', ver: 'UI5 >= 1.120', color: '#0ea5e9' },
                  { step: '1c', api: 'sap.ui.getCore().byId(id)', ver: 'UI5 < 1.120 (legacy)', color: '#334155' },
                ].map((f) => (
                  <div key={f.step} style={{
                    flex: '1 1 200px', padding: '0.5rem 0.65rem',
                    background: `${f.color}08`, border: `1px solid ${f.color}30`, borderRadius: 6,
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.2rem' }}>
                      <span style={{
                        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                        width: 20, height: 20, borderRadius: '50%', background: f.color,
                        color: '#fff', fontSize: '0.62rem', fontWeight: 800,
                      }}>{f.step}</span>
                      <span style={{ ...docCode, fontSize: '0.76rem', color: f.color }}>{f.api}</span>
                    </div>
                    <div style={{ fontSize: '0.82rem', color: '#1e293b' }}>{f.ver}</div>
                  </div>
                ))}
              </div>
              <p style={{ ...docP, fontSize: '0.85rem', color: '#334155', marginTop: '0.4rem', marginBottom: 0 }}>
                Each API is tried in order — first non-null result wins. This ensures compatibility from UI5 1.71 through 2.x.
              </p>
            </div>
          </div>

          {/* Tier 2 */}
          <div style={{ border: '2px solid #f59e0b', borderRadius: 10, overflow: 'hidden' }}>
            <div style={{ background: '#f59e0b', color: '#fff', padding: '0.5rem 0.75rem', fontSize: '0.78rem', fontWeight: 700 }}>
              Tier 2: Registry Scan — Enhanced Matching (GAP-02)
            </div>
            <div style={{ padding: '0.75rem' }}>
              <p style={{ ...docP, marginBottom: '0.4rem' }}>
                Iterates <span style={docCode}>Element.registry.all()</span> with support for: exact ID, suffix (<span style={docCode}>--id</span>),
                RegExp (<span style={docCode}>/pattern/</span>), controlType, properties, viewName, bindingPath.
                Prefers visible controls (GAP-21) — when multiple matches exist, visible controls are selected first.
              </p>
              <div style={{ fontSize: '0.85rem', color: '#334155' }}>
                API: <span style={docCode}>sap.ui.core.Element.registry.all()</span> with fallback to <span style={docCode}>sap.ui.core.ElementRegistry</span>
              </div>
            </div>
          </div>

          {/* Tier 3 */}
          <div style={{ border: '2px solid #6366f1', borderRadius: 10, overflow: 'hidden' }}>
            <div style={{ background: '#6366f1', color: '#fff', padding: '0.5rem 0.75rem', fontSize: '0.78rem', fontWeight: 700 }}>
              Tier 3: RecordReplay — Selector-based
            </div>
            <div style={{ padding: '0.75rem' }}>
              <p style={{ ...docP, marginBottom: '0.4rem' }}>
                Uses <span style={docCode}>RecordReplay.findDOMElementByControlSelector</span> for controlType + properties selectors.
                Maps DOM element back to UI5 control via version-aware conversion:
              </p>
              <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                <div style={{ flex: '1 1 200px', padding: '0.4rem 0.6rem', background: '#f8fafc', borderRadius: 6, border: '1px solid #e2e8f0' }}>
                  <span style={{ ...docCode, fontSize: '0.76rem', color: '#6366f1' }}>Element.closestTo(dom)</span>
                  <div style={{ fontSize: '0.82rem', color: '#1e293b' }}>UI5 {'>'} 1.106 — primary</div>
                </div>
                <div style={{ flex: '1 1 200px', padding: '0.4rem 0.6rem', background: '#f8fafc', borderRadius: 6, border: '1px solid #e2e8f0' }}>
                  <span style={{ ...docCode, fontSize: '0.84rem', color: '#334155' }}>jQuery(dom).control(0)</span>
                  <div style={{ fontSize: '0.82rem', color: '#1e293b' }}>Legacy jQuery fallback</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── 4.10 Execution Strategy Options ────── */}
      <div style={docSection}>
        <h3 style={docH3}>Execution Strategy Options</h3>
        <p style={docP}>
          Praman provides 3 interaction strategies for invoking UI5 control methods. The strategy is selected
          per-test or per-action, giving fine-grained control over how interactions are executed.
        </p>
        <table style={docTable}>
          <thead>
            <tr>
              <th style={docTh}>Strategy</th>
              <th style={docTh}>Approach</th>
              <th style={docTh}>Fallback Chain</th>
              <th style={docTh}>Best For</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td style={{ ...docTd, fontWeight: 700 }}>UI5Native</td>
              <td style={docTd}>Calls UI5 control API methods directly in browser context</td>
              <td style={docTd}><span style={docCode}>firePress()</span> → <span style={docCode}>fireSelect()</span> → <span style={docCode}>fireTap()</span> → DOM click</td>
              <td style={docTd}>Standard SAP Fiori apps, most reliable</td>
            </tr>
            <tr>
              <td style={{ ...docTd, fontWeight: 700 }}>DomFirst</td>
              <td style={docTd}>Performs DOM interaction first, falls back to UI5 API</td>
              <td style={docTd}>DOM <span style={docCode}>click()</span> → <span style={docCode}>firePress()</span> → <span style={docCode}>fireTap()</span></td>
              <td style={docTd}>Hybrid apps, custom controls, non-standard handlers</td>
            </tr>
            <tr>
              <td style={{ ...docTd, fontWeight: 700 }}>OPA5</td>
              <td style={docTd}>Uses SAP OPA5 test framework{'\''}s RecordReplay engine</td>
              <td style={docTd}><span style={docCode}>RecordReplay.interactWithControl()</span> → DOM fallback</td>
              <td style={docTd}>Complex controls, SmartFields, value helps</td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* ── 4.11 Technology Stack ──────────────── */}
      <div style={docSection}>
        <h3 style={docH3}>Technology Stack</h3>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
          <div>
            <h4 style={docH4}>Runtime Dependencies</h4>
            <table style={docTable}>
              <tbody>
                <tr><td style={{ ...docTd, fontWeight: 700 }}>@playwright/test</td><td style={docTd}>{'>='}1.57.0 {'<'}2.0.0 (peer)</td></tr>
                <tr><td style={{ ...docTd, fontWeight: 700 }}>commander</td><td style={docTd}>14.0.3 — CLI framework</td></tr>
                <tr><td style={{ ...docTd, fontWeight: 700 }}>pino</td><td style={docTd}>10.3.1 — structured logging</td></tr>
                <tr><td style={{ ...docTd, fontWeight: 700 }}>zod</td><td style={docTd}>4.3.6 — schema validation</td></tr>
              </tbody>
            </table>
            <h4 style={docH4}>Optional AI Dependencies</h4>
            <table style={docTable}>
              <tbody>
                <tr><td style={{ ...docTd, fontWeight: 700 }}>@anthropic-ai/sdk</td><td style={docTd}>{'>='}0.78.0 (optional peer)</td></tr>
                <tr><td style={{ ...docTd, fontWeight: 700 }}>openai</td><td style={docTd}>{'>='}6.22.0 (optional peer)</td></tr>
                <tr><td style={{ ...docTd, fontWeight: 700 }}>@opentelemetry/api</td><td style={docTd}>{'>='}1.9.0 (optional peer)</td></tr>
                <tr><td style={{ ...docTd, fontWeight: 700 }}>@opentelemetry/sdk-node</td><td style={docTd}>{'>='}0.212.0 (optional peer)</td></tr>
              </tbody>
            </table>
          </div>
          <div>
            <h4 style={docH4}>Build & Quality Tooling</h4>
            <table style={docTable}>
              <tbody>
                <tr><td style={{ ...docTd, fontWeight: 700 }}>TypeScript</td><td style={docTd}>5.9.3 — strict mode</td></tr>
                <tr><td style={{ ...docTd, fontWeight: 700 }}>tsup</td><td style={docTd}>8.5.1 — dual ESM+CJS build</td></tr>
                <tr><td style={{ ...docTd, fontWeight: 700 }}>Vitest</td><td style={docTd}>4.0.18 — unit testing</td></tr>
                <tr><td style={{ ...docTd, fontWeight: 700 }}>@vitest/coverage-v8</td><td style={docTd}>4.0.18 — per-file coverage</td></tr>
                <tr><td style={{ ...docTd, fontWeight: 700 }}>ESLint</td><td style={docTd}>11 plugins, zero tolerance</td></tr>
                <tr><td style={{ ...docTd, fontWeight: 700 }}>attw</td><td style={docTd}>0.18.2 — export validation</td></tr>
                <tr><td style={{ ...docTd, fontWeight: 700 }}>API Extractor</td><td style={docTd}>7.56.3 — API surface</td></tr>
                <tr><td style={{ ...docTd, fontWeight: 700 }}>TypeDoc</td><td style={docTd}>0.28.17 — docs generation</td></tr>
                <tr><td style={{ ...docTd, fontWeight: 700 }}>knip</td><td style={docTd}>5.83.1 — dead code detection</td></tr>
                <tr><td style={{ ...docTd, fontWeight: 700 }}>cspell</td><td style={docTd}>9.6.4 — spell checking</td></tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* ── 4.12 Security & Compliance ─────────── */}
      <div style={docSection}>
        <h3 style={docH3}>Security & Compliance</h3>
        <p style={docP}>
          Multi-layered security posture verified against actual CI workflows, ESLint config, package.json scripts,
          and GitHub repository settings. Every item below is implemented and enforced in code.
        </p>

        {/* SBOM & Supply Chain */}
        <h4 style={docH4}>SBOM & Supply Chain</h4>
        <table style={docTable}>
          <thead>
            <tr>
              <th style={docTh}>Measure</th>
              <th style={docTh}>Tool / Implementation</th>
              <th style={docTh}>Details</th>
            </tr>
          </thead>
          <tbody>
            {[
              ['SBOM Generation', '@cyclonedx/cyclonedx-npm 4.1.2', 'CycloneDX 1.5 JSON output; npm run generate:sbom; auto-generated in release pipeline'],
              ['npm Provenance', 'npm publish --provenance', 'OIDC-signed provenance attestation on every npm publish; id-token: write in release.yml'],
              ['SHA-Pinned Actions', 'Full SHA commit hashes', 'All actions in ci.yml, release.yml, docs.yml pinned to exact SHAs (not floating tags)'],
              ['Dependency Lockfile', 'package-lock.json v3', 'lockfileVersion 3 with SHA-512 integrity hashes; npm ci enforced in all CI steps'],
              ['Dependabot', '.github/dependabot.yml', 'Weekly updates for npm (prod: patch-only, dev: minor+patch) and github-actions ecosystems'],
              ['License Inventory', 'license-report.json + ScanCode', 'Full dependency license audit; ScanCode Toolkit 32.0.2 scan of src/ for copyright/license detection'],
              ['NOTICE File', 'Root NOTICE + LICENSE', 'Apache 2.0 license; NOTICE with attribution; both published to npm via files field'],
            ].map(([measure, tool, details]) => (
              <tr key={measure}>
                <td style={{ ...docTd, fontWeight: 700, whiteSpace: 'nowrap' }}>{measure}</td>
                <td style={docTd}><span style={docCode}>{tool}</span></td>
                <td style={docTd}>{details}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Static Analysis & Code Security */}
        <h4 style={docH4}>Static Analysis & Code Security</h4>
        <table style={docTable}>
          <thead>
            <tr>
              <th style={docTh}>Measure</th>
              <th style={docTh}>Tool / Implementation</th>
              <th style={docTh}>Details</th>
            </tr>
          </thead>
          <tbody>
            {[
              ['Microsoft SDL', '@microsoft/eslint-plugin-sdl 1.1.0', '8 SDL rules: no-insecure-url, no-inner-html, no-postmessage-star-origin, etc.'],
              ['OWASP Security', 'eslint-plugin-security 3.0.1', '12 rules: detect-eval, detect-unsafe-regex, detect-child-process, detect-non-literal-regexp'],
              ['CodeQL Analysis', 'github/codeql-action (CI)', 'Weekly + PR scans with security-extended query suite for JavaScript/TypeScript'],
              ['npm Audit', 'npm audit --audit-level=high', 'Runs in CI security job on every push/PR; --omit=dev excludes devDependencies'],
              ['Code Quality', 'eslint-plugin-sonarjs 3.0.7', 'Detects cognitive complexity, code duplication, code smells'],
              ['Dead Code', 'knip 5.83.1', 'Eliminates unused exports, dependencies, files from production surface'],
              ['TypeScript Strict', 'strict + noUncheckedIndexedAccess', 'No any, exactOptionalPropertyTypes, verbatimModuleSyntax, isolatedModules'],
            ].map(([measure, tool, details]) => (
              <tr key={measure}>
                <td style={{ ...docTd, fontWeight: 700, whiteSpace: 'nowrap' }}>{measure}</td>
                <td style={docTd}><span style={docCode}>{tool}</span></td>
                <td style={docTd}>{details}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Credential & Runtime Security */}
        <h4 style={docH4}>Credential & Runtime Security</h4>
        <table style={docTable}>
          <thead>
            <tr>
              <th style={docTh}>Measure</th>
              <th style={docTh}>Tool / Implementation</th>
              <th style={docTh}>Details</th>
            </tr>
          </thead>
          <tbody>
            {[
              ['Log Redaction', 'Pino redaction (14 paths)', 'Redacts password, token, apiKey, secret, authorization, cookie, sessionId, credentials, accessToken, refreshToken, bearerToken + auth/config paths'],
              ['Env-Only Credentials', 'process.env + GitHub Secrets', 'SAP_CLOUD_*, SAP_ONPREM_*, ANTHROPIC_API_KEY — never hardcoded; passed via CI secrets'],
              ['Bridge Isolation', 'WeakSet idempotency', 'ensureBridgeInjected() prevents double injection and memory leaks'],
              ['Input Validation', 'Zod 4.3.6 schema validation', 'All external input validated at system boundaries before processing'],
              ['.gitignore Secrets', '.env, .env.local, .auth/', 'Secret files excluded from version control'],
              ['SECURITY.md', 'Responsible disclosure policy', 'Responsible disclosure via security@zestest.in'],
            ].map(([measure, tool, details]) => (
              <tr key={measure}>
                <td style={{ ...docTd, fontWeight: 700, whiteSpace: 'nowrap' }}>{measure}</td>
                <td style={docTd}><span style={docCode}>{tool}</span></td>
                <td style={docTd}>{details}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* CI/CD Security Gates */}
        <h4 style={docH4}>CI/CD Security Gates</h4>
        <table style={docTable}>
          <thead>
            <tr>
              <th style={docTh}>Gate</th>
              <th style={docTh}>Trigger</th>
              <th style={docTh}>Enforcement</th>
            </tr>
          </thead>
          <tbody>
            {[
              ['Pre-commit Hook', 'git commit', 'Husky: check-no-js-in-src + lint-staged (ESLint --fix, Prettier, markdownlint)'],
              ['Commit Message', 'git commit', 'commitlint @commitlint/config-conventional via commit-msg hook'],
              ['Pre-push Hook', 'git push', 'Husky: typecheck + unit tests with coverage + build — all must pass'],
              ['CI Security Job', 'Push to main / PR', 'npm audit --audit-level=high --omit=dev — fails on HIGH/CRITICAL vulns'],
              ['CodeQL Scan', 'Push to main / PR / Weekly', 'security-extended queries; results in GitHub Security tab'],
              ['CODEOWNERS Review', 'Every PR', '* @mrkanitkar — all files require owner review'],
              ['Workflow Permissions', 'All CI workflows', 'Least-privilege: contents:read default, scoped write only where needed'],
              ['Concurrency Control', 'ci.yml', 'cancel-in-progress: true — prevents resource exhaustion from stacked runs'],
              ['License Headers', 'Every lint pass', 'eslint-plugin-headers enforces Apache 2.0 SPDX header as error on all src/ files'],
            ].map(([gate, trigger, enforcement]) => (
              <tr key={gate}>
                <td style={{ ...docTd, fontWeight: 700, whiteSpace: 'nowrap' }}>{gate}</td>
                <td style={docTd}>{trigger}</td>
                <td style={docTd}>{enforcement}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* ── 4.13 Best Practice Alignment ───────── */}
      <div style={docSection}>
        <h3 style={docH3}>Best Practice Alignment</h3>
        <table style={docTable}>
          <thead>
            <tr>
              <th style={docTh}>Standard</th>
              <th style={docTh}>Practices Adopted</th>
            </tr>
          </thead>
          <tbody>
            {[
              ['Playwright', 'Web-first assertions, fixture DI, project dependencies for auth, test.step()'],
              ['Microsoft', 'TSDoc standard, API Extractor, SDL security, OpenTelemetry, SHA-pinned Actions, cross-platform CI'],
              ['Google TS Style', 'Readonly<> config, no barrel re-exports of internals, strict type checking'],
              ['Google SRE', 'Exponential backoff + jitter in retries, structured error codes'],
              ['Google Testing', 'Tiered coverage (100% errors, 95% core, 90% global), per-file enforcement'],
              ['Node.js', 'ESM-first with CJS fallback, node: prefix, engines field, files field, dual exports'],
              ['Anthropic / Claude', 'retryable + suggestions[] on errors, AI response envelope, checkpoint serialization'],
              ['npm', 'Dual ESM+CJS via conditional exports, validated by attw, clean package.json files field'],
            ].map(([standard, practices]) => (
              <tr key={standard}>
                <td style={{ ...docTd, fontWeight: 700, whiteSpace: 'nowrap' }}>{standard}</td>
                <td style={docTd}>{practices}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* ── 4.14 Documentation Strategy ────────── */}
      <div style={docSection}>
        <h3 style={docH3}>Documentation Strategy</h3>
        <table style={docTable}>
          <thead>
            <tr>
              <th style={docTh}>Layer</th>
              <th style={docTh}>Tool</th>
              <th style={docTh}>Output</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td style={{ ...docTd, fontWeight: 700 }}>Inline Documentation</td>
              <td style={docTd}>Microsoft TSDoc with custom tags (@intent, @guarantee, @capability, @recipe, @ai, @aiContext, @sapModule, @businessContext)</td>
              <td style={docTd}>Every public function has TSDoc + @example</td>
            </tr>
            <tr>
              <td style={{ ...docTd, fontWeight: 700 }}>API Reference</td>
              <td style={docTd}>@microsoft/api-extractor + TypeDoc 0.28.17</td>
              <td style={docTd}>Generated API surface documentation</td>
            </tr>
            <tr>
              <td style={{ ...docTd, fontWeight: 700 }}>Linting</td>
              <td style={docTd}>eslint-plugin-tsdoc (syntax: {'\''}error{'\''}) </td>
              <td style={docTd}>Zero tolerance on TSDoc syntax violations</td>
            </tr>
            <tr>
              <td style={{ ...docTd, fontWeight: 700 }}>Website</td>
              <td style={docTd}>Docusaurus 3.x with custom React pages</td>
              <td style={docTd}>Architecture, features, personas, demo</td>
            </tr>
            <tr>
              <td style={{ ...docTd, fontWeight: 700 }}>Agent Instructions</td>
              <td style={docTd}>CLAUDE.md, AGENTS.md, .cursor/rules/, .github/copilot-instructions.md</td>
              <td style={docTd}>7 IDE/agent configurations</td>
            </tr>
            <tr>
              <td style={{ ...docTd, fontWeight: 700 }}>Skill Files</td>
              <td style={docTd}>12 skill files in skills/playwright-praman-sap-testing/</td>
              <td style={docTd}>Agent-readable domain expertise</td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* ── 4.15 ESLint Plugin Coverage ─────────── */}
      <div style={docSection}>
        <h3 style={docH3}>ESLint Plugin Coverage (11 Plugins)</h3>
        <p style={docP}>
          Zero errors, zero warnings policy. All 11 plugins run on every lint pass.
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '0.5rem' }}>
          {[
            { plugin: 'typescript-eslint', scope: 'Strict type-checked rules', ver: 'v8.55.0' },
            { plugin: 'eslint-plugin-tsdoc', scope: 'TSDoc syntax validation', ver: 'v0.5.0' },
            { plugin: 'eslint-plugin-playwright', scope: 'Playwright best practices', ver: 'v2.5.1' },
            { plugin: 'eslint-plugin-security', scope: 'Security vulnerability detection', ver: 'v3.0.1' },
            { plugin: '@microsoft/eslint-plugin-sdl', scope: 'SDL compliance rules', ver: 'v1.1.0' },
            { plugin: 'eslint-plugin-sonarjs', scope: 'Code smell + complexity', ver: 'v3.0.7' },
            { plugin: 'eslint-plugin-n', scope: 'Node.js best practices', ver: 'v17.24.0' },
            { plugin: 'eslint-plugin-promise', scope: 'Promise anti-patterns', ver: 'v7.2.1' },
            { plugin: 'eslint-plugin-import-x', scope: 'Import ordering + boundaries', ver: 'v4.16.1' },
            { plugin: 'eslint-plugin-unicorn', scope: 'Modern JS best practices', ver: 'v63.0.0' },
            { plugin: 'eslint-plugin-headers', scope: 'Apache-2.0 license headers', ver: 'v1.3.4' },
          ].map((p) => (
            <div key={p.plugin} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.4rem 0.6rem', background: '#f8fafc', borderRadius: 6, border: '1px solid #e2e8f0' }}>
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: PRIMARY, flexShrink: 0 }} />
              <div>
                <div style={{ fontSize: '0.78rem', fontWeight: 700, color: '#0f172a' }}>{p.plugin}</div>
                <div style={{ fontSize: '0.82rem', color: '#1e293b' }}>{p.scope} — {p.ver}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── 4.16 Coverage Strategy ──────────────── */}
      <div style={docSection}>
        <h3 style={docH3}>Tiered Coverage Strategy</h3>
        <p style={docP}>
          Google/Microsoft best practice: per-file enforcement ensures no single file hides behind project averages.
        </p>
        <table style={docTable}>
          <thead>
            <tr>
              <th style={docTh}>Tier</th>
              <th style={docTh}>Scope</th>
              <th style={docTh}>Statements</th>
              <th style={docTh}>Branches</th>
              <th style={docTh}>Functions</th>
              <th style={docTh}>Lines</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td style={{ ...docTd, fontWeight: 700 }}>Tier 1</td>
              <td style={docTd}>Error classes, public API (src/core/errors/)</td>
              <td style={{ ...docTd, textAlign: 'center', fontWeight: 700, color: '#16a34a' }}>100%</td>
              <td style={{ ...docTd, textAlign: 'center', fontWeight: 700, color: '#16a34a' }}>100%</td>
              <td style={{ ...docTd, textAlign: 'center', fontWeight: 700, color: '#16a34a' }}>100%</td>
              <td style={{ ...docTd, textAlign: 'center', fontWeight: 700, color: '#16a34a' }}>100%</td>
            </tr>
            <tr>
              <td style={{ ...docTd, fontWeight: 700 }}>Tier 2</td>
              <td style={docTd}>Core infrastructure (src/core/)</td>
              <td style={{ ...docTd, textAlign: 'center', fontWeight: 700, color: PRIMARY }}>95%</td>
              <td style={{ ...docTd, textAlign: 'center', fontWeight: 700, color: PRIMARY }}>90%</td>
              <td style={{ ...docTd, textAlign: 'center', fontWeight: 700, color: PRIMARY }}>95%</td>
              <td style={{ ...docTd, textAlign: 'center', fontWeight: 700, color: PRIMARY }}>95%</td>
            </tr>
            <tr>
              <td style={{ ...docTd, fontWeight: 700 }}>Tier 3</td>
              <td style={docTd}>All other modules (global)</td>
              <td style={{ ...docTd, textAlign: 'center', fontWeight: 700, color: '#f59e0b' }}>90%</td>
              <td style={{ ...docTd, textAlign: 'center', fontWeight: 700, color: '#f59e0b' }}>85%</td>
              <td style={{ ...docTd, textAlign: 'center', fontWeight: 700, color: '#f59e0b' }}>90%</td>
              <td style={{ ...docTd, textAlign: 'center', fontWeight: 700, color: '#f59e0b' }}>90%</td>
            </tr>
          </tbody>
        </table>
        <p style={{ ...docP, fontSize: '0.88rem', color: '#334155' }}>
          Tool: @vitest/coverage-v8 with perFile: true. Reporters: text, lcov, json-summary, json, html.
          Watermarks: Yellow 80-95%, Green 95%+.
        </p>
      </div>
    </div>
  );
}

/* ── Page ──────────────────────────────────────────────── */
export default function Architecture(): ReactNode {
  return (
    <Layout title="Architecture" description="Approach for SAP S/4 HANA Test Automation">
      <main>
        <section style={{ padding: '6rem 2rem 2rem', textAlign: 'center', maxWidth: 800, margin: '0 auto' }}>
          <p className="praman-section-label">Architecture</p>
          <h1 className="hero__title" style={{ fontSize: '2.8rem' }}>
            Approach for SAP S/4 HANA Test Automation
          </h1>
          <p className="hero__subtitle">
            Aligned to SAP Activate. Quality automation starts in <strong>Realize</strong>.
          </p>
        </section>

        <section style={{ maxWidth: 900, margin: '0 auto', padding: '2rem' }}>
          <ArchitectureFlow />
        </section>

        {/* ── Section 2: E2E Flow ── */}
        <section style={{ maxWidth: 960, margin: '0 auto', padding: '3rem 2rem 4rem' }}>
          <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
            <p className="praman-section-label">How It Works</p>
            <h2 style={{ fontSize: '1.8rem', fontWeight: 700, color: '#0f172a', marginBottom: '0.5rem' }}>
              How Playwright + Praman Plugin Works: End-to-End Flow
            </h2>
            <p style={{ fontSize: '0.95rem', color: '#1e293b', maxWidth: 640, margin: '0 auto' }}>
              From seed file authentication through live SAP discovery to compliant test artifacts — fully orchestrated by AI agents.
            </p>
          </div>
          <E2EFlow />
        </section>

        {/* ── Section 3: Internal Orchestration ── */}
        <section style={{ maxWidth: 1020, margin: '0 auto', padding: '3rem 2rem 5rem' }}>
          <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
            <p className="praman-section-label">Internal Architecture</p>
            <h2 style={{ fontSize: '1.8rem', fontWeight: 700, color: '#0f172a', marginBottom: '0.5rem' }}>
              End-to-End Orchestration
            </h2>
            <p style={{ fontSize: '0.95rem', color: '#1e293b', maxWidth: 720, margin: '0 auto' }}>
              Test code {'\u2192'} Fixtures {'\u2192'} Bridge {'\u2192'} UI5 Control Resolution {'\u2192'} Smart Waits & Retries {'\u2192'} Assertions.
              <br />
              Traced from the real <strong>BOM E2E Gold Standard</strong> test through 6 architectural layers.
            </p>
          </div>
          <InternalOrchestration />
        </section>

        {/* ── Section 4: Technical Documentation ── */}
        <section style={{ maxWidth: 1020, margin: '0 auto', padding: '3rem 2rem 5rem' }}>
          <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
            <p className="praman-section-label">Technical Reference</p>
            <h2 style={{ fontSize: '1.8rem', fontWeight: 700, color: '#0f172a', marginBottom: '0.5rem' }}>
              Architecture Deep Dive
            </h2>
            <p style={{ fontSize: '0.95rem', color: '#1e293b', maxWidth: 720, margin: '0 auto' }}>
              Comprehensive technical documentation verified against source code.
              180 source files, 551 type definitions, 5-layer architecture — every number counted, not estimated.
            </p>
          </div>
          <TechnicalDocumentation />
        </section>

        {/* ── Acknowledgments ── */}
        <section style={{ maxWidth: 1020, margin: '0 auto', padding: '0 2rem 5rem' }}>
          <div style={{
            border: '1px solid #e2e8f0', borderRadius: 12, padding: '1.5rem 2rem',
            background: '#f8fafc',
          }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#0f172a', marginBottom: '0.75rem' }}>
              Acknowledgments
            </h3>
            <p style={{ fontSize: '0.92rem', color: '#1e293b', lineHeight: 1.7, marginBottom: '0.75rem' }}>
              Praman was developed independently and does not contain code from the projects listed below.
              We would like to thank the following open-source project whose architectural patterns served
              as inspiration during Praman{'\u2019'}s design:
            </p>
            <div style={{
              display: 'flex', alignItems: 'flex-start', gap: '1rem',
              padding: '1rem', background: '#fff', borderRadius: 8, border: '1px solid #e2e8f0',
            }}>
              <div style={{
                width: 44, height: 44, borderRadius: '50%', flexShrink: 0,
                background: PRIMARY_HEX, display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: '#fff', fontSize: '1.1rem', fontWeight: 800,
              }}>
                w5
              </div>
              <div>
                <div style={{ fontSize: '0.95rem', fontWeight: 700, color: '#0f172a', marginBottom: '0.2rem' }}>
                  wdi5{' '}
                  <a href="https://github.com/ui5-community/wdi5" target="_blank" rel="noopener noreferrer"
                    style={{ fontSize: '0.8rem', fontWeight: 500, color: PRIMARY }}>
                    github.com/ui5-community/wdi5
                  </a>
                </div>
                <p style={{ fontSize: '0.9rem', color: '#1e293b', lineHeight: 1.6, margin: 0 }}>
                  The wdi5 project by the UI5 Community pioneered the approach of bridging Playwright (and WebdriverIO)
                  with SAP UI5{'\u2019'}s control model in the browser. Architectural patterns for SAP UI5 browser bridge
                  design were studied during Praman{'\u2019'}s independent, ground-up implementation. We are grateful to the
                  wdi5 maintainers and contributors for their excellent open-source work under the Apache License 2.0.
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>
    </Layout>
  );
}
