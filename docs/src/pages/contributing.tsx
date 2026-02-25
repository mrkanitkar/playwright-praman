import type { ReactNode } from 'react';
import Layout from '@theme/Layout';

const TEAL = '#0d9488';
const code: React.CSSProperties = { fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace', fontSize: '0.86rem', background: '#e2e8f0', padding: '0.15rem 0.45rem', borderRadius: 4, color: '#020617', fontWeight: 600 };
const th: React.CSSProperties = { textAlign: 'left', padding: '0.6rem 0.75rem', background: '#f0fdfa', borderBottom: `3px solid ${TEAL}`, fontWeight: 800, color: '#020617', fontSize: '0.88rem' };
const td: React.CSSProperties = { padding: '0.55rem 0.75rem', borderBottom: '1px solid #e2e8f0', color: '#0f172a', fontWeight: 500 };
const codeBlock: React.CSSProperties = { background: '#1e293b', borderRadius: 8, padding: '0.75rem 1rem', fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace', fontSize: '0.84rem', color: '#e2e8f0', lineHeight: 1.6, overflowX: 'auto', marginBottom: '1rem' };

export default function Contributing(): ReactNode {
  return (
    <Layout title="Contributing" description="Contributing to Praman">
      <main style={{ maxWidth: 800, margin: '0 auto', padding: '4rem 2rem' }}>
        <h1 style={{ fontSize: '2.2rem', fontWeight: 800, color: '#020617', marginBottom: '0.5rem' }}>
          Contributing to Praman
        </h1>
        <p style={{ fontSize: '1rem', color: '#1e293b', lineHeight: 1.7, marginBottom: '2rem' }}>
          Thank you for your interest in contributing to Praman — an AI-first SAP UI5 test automation platform for Playwright.
        </p>

        <Section title="Development Setup">
          <h3 style={h3}>Prerequisites</h3>
          <ul><li>Node.js 20+ (see <span style={code}>.nvmrc</span> for exact version)</li><li>npm (ships with Node.js)</li><li>Git</li></ul>
          <h3 style={h3}>Getting Started</h3>
          <div style={codeBlock}><pre style={{ margin: 0 }}>{`git clone https://github.com/mrkanitkar/playwright-praman.git
cd playwright-praman
npm install
npm run ci  # Validates full setup: lint + typecheck + test + build`}</pre></div>

          <h3 style={h3}>Key Commands</h3>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem', marginBottom: '1rem' }}>
            <thead><tr><th style={th}>Command</th><th style={th}>Purpose</th></tr></thead>
            <tbody>
              {[
                ['npm run lint', 'ESLint (0 errors, 0 warnings)'],
                ['npm run typecheck', 'TypeScript type checking'],
                ['npm run test:unit', 'Unit tests (Vitest)'],
                ['npm run test:unit:coverage', 'Unit tests with coverage report'],
                ['npm run build', 'Production build (tsup, ESM + CJS)'],
                ['npm run check:exports', 'Validate export map (attw)'],
                ['npm run ci', 'Full CI pipeline locally'],
                ['npm run spellcheck', 'Spell check (cspell)'],
                ['npm run deadcode', 'Dead code detection (knip)'],
              ].map(([cmd, purpose]) => (
                <tr key={cmd}><td style={td}><span style={code}>{cmd}</span></td><td style={td}>{purpose}</td></tr>
              ))}
            </tbody>
          </table>
        </Section>

        <Section title="Architecture">
          <div style={codeBlock}><pre style={{ margin: 0 }}>{`Layer 5: AI            — LLM-powered test generation
Layer 4: Fixtures      — Playwright fixture DI
Layer 3: Typed Proxy   — TypeScript control wrappers
Layer 2: Bridge        — Browser-based control discovery (page.evaluate)
Layer 1: Core          — Logging, config, errors, utilities`}</pre></div>
          <p><strong>Sub-path exports:</strong> <span style={code}>.</span>, <span style={code}>./ai</span>, <span style={code}>./intents</span>, <span style={code}>./vocabulary</span>, <span style={code}>./fe</span>, <span style={code}>./reporters</span></p>
          <p><strong>Path aliases:</strong> <span style={code}>#core/*</span>, <span style={code}>#bridge/*</span>, <span style={code}>#proxy/*</span>, <span style={code}>#fixtures/*</span></p>
        </Section>

        <Section title="Code Standards">
          <p>TypeScript strict mode. No <span style={code}>any</span>, no <span style={code}>{'as unknown as T'}</span>. ESM only. Node builtins use <span style={code}>node:</span> prefix. Relative imports include <span style={code}>.js</span> extension. Maximum 300 LOC per file.</p>
          <p><strong>Documentation:</strong> Microsoft TSDoc (not JSDoc). Every public function must have TSDoc with an <span style={code}>@example</span> tag.</p>
          <p><strong>Errors:</strong> All errors extend <span style={code}>PramanError</span> with <span style={code}>code</span>, <span style={code}>attempted</span>, <span style={code}>retryable</span>, <span style={code}>suggestions[]</span>. Use pino logger — never <span style={code}>console.log</span>.</p>
          <p><strong>Linting:</strong> 11 ESLint plugins, zero tolerance (0 errors, 0 warnings).</p>
        </Section>

        <Section title="Commit Messages">
          <p>We use <a href="https://www.conventionalcommits.org/" target="_blank" rel="noopener noreferrer">Conventional Commits</a> enforced by commitlint.</p>
          <div style={codeBlock}><pre style={{ margin: 0 }}>{`feat(proxy): add bidirectional type conversion
fix(bridge): handle stale control reference
docs(auth): add Office365 strategy example
test(core): add config validation edge cases`}</pre></div>
          <p><strong>Types:</strong> feat, fix, docs, style, refactor, perf, test, build, ci, chore, revert</p>
          <p><strong>Limits:</strong> Subject max 72 characters, header max 100 characters.</p>
        </Section>

        <Section title="Testing">
          <p><strong>Unit:</strong> Vitest 4.x with <span style={code}>describe</span> / <span style={code}>it</span> pattern. File naming: <span style={code}>*.test.ts</span>. Hermetic — no network calls.</p>
          <p><strong>Integration:</strong> Playwright with <span style={code}>test.step()</span>. File naming: <span style={code}>*.spec.ts</span>. Requires SAP credentials.</p>
          <p><strong>Coverage:</strong> Tier 1 (errors): 100%. Tier 2 (core): 95%. Tier 3 (global): 90%. Per-file enforcement.</p>
        </Section>

        <Section title="Git Hooks">
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem', marginBottom: '1rem' }}>
            <thead><tr><th style={th}>Hook</th><th style={th}>Action</th></tr></thead>
            <tbody>
              <tr><td style={{ ...td, fontWeight: 700 }}>pre-commit</td><td style={td}>lint-staged (ESLint + Prettier on staged files)</td></tr>
              <tr><td style={{ ...td, fontWeight: 700 }}>commit-msg</td><td style={td}>commitlint validation</td></tr>
              <tr><td style={{ ...td, fontWeight: 700 }}>pre-push</td><td style={td}>typecheck + unit tests with coverage + build</td></tr>
            </tbody>
          </table>
        </Section>

        <Section title="Pull Requests">
          <ol>
            <li>Create a feature branch from <span style={code}>main</span></li>
            <li>Make your changes following the code standards above</li>
            <li>Ensure <span style={code}>npm run ci</span> passes locally</li>
            <li>Submit a PR with a clear description of what and why</li>
            <li>Wait for CI checks (3-OS matrix) and code review</li>
          </ol>
        </Section>

        <Section title="Reporting Issues">
          <ul>
            <li><strong>Bugs:</strong> Open a GitHub issue with steps to reproduce</li>
            <li><strong>Security vulnerabilities:</strong> Email <a href="mailto:security@zestest.in">security@zestest.in</a> (see SECURITY.md)</li>
            <li><strong>Feature requests:</strong> Open a GitHub issue with use case description</li>
          </ul>
        </Section>

        <Section title="License">
          <p>By contributing, you agree that your contributions will be licensed under the <a href="/playwright-praman/license">Apache License 2.0</a>.</p>
        </Section>
      </main>
    </Layout>
  );
}

const h3: React.CSSProperties = { fontSize: '1.1rem', fontWeight: 700, color: '#0f172a', marginTop: '1.25rem', marginBottom: '0.5rem' };

function Section({ title, children }: { title: string; children: ReactNode }): ReactNode {
  return (
    <div style={{ marginBottom: '2rem' }}>
      <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#0f172a', marginBottom: '0.75rem' }}>{title}</h2>
      <div style={{ fontSize: '0.95rem', color: '#1e293b', lineHeight: 1.7 }}>{children}</div>
    </div>
  );
}
