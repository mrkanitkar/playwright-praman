// SPDX-License-Identifier: Apache-2.0
// Copyright 2024-2026 ZesTest (support@zestest.in)
import type { ReactNode } from 'react';
import Layout from '@theme/Layout';

function Section({ title, children }: { title: string; children: ReactNode }): ReactNode {
  return (
    <div className="praman-prose-section">
      <h2>{title}</h2>
      {children}
    </div>
  );
}

export default function Contributing(): ReactNode {
  return (
    <Layout title="Contributing" description="Contributing to Praman">
      <main className="praman-prose-page">
        <h1>Contributing to Praman</h1>
        <p style={{ marginBottom: '2rem' }}>
          Thank you for your interest in contributing to Praman — an AI-first SAP UI5 test
          automation platform for Playwright.
        </p>

        <Section title="Development Setup">
          <h3>Prerequisites</h3>
          <ul>
            <li>
              Node.js 22+ (see <code className="praman-prose-code">.nvmrc</code> for exact version)
            </li>
            <li>npm (ships with Node.js)</li>
            <li>Git</li>
          </ul>
          <h3>Getting Started</h3>
          <div className="praman-prose-code-block">
            <pre>{`git clone https://github.com/mrkanitkar/playwright-praman.git
cd playwright-praman
npm install
npm run ci  # Validates full setup: lint + typecheck + test + build`}</pre>
          </div>
          <h3>Key Commands</h3>
          <table className="praman-prose-table">
            <thead>
              <tr>
                <th>Command</th>
                <th>Purpose</th>
              </tr>
            </thead>
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
                <tr key={cmd}>
                  <td>
                    <code className="praman-prose-code">{cmd}</code>
                  </td>
                  <td>{purpose}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Section>

        <Section title="Architecture">
          <div className="praman-prose-code-block">
            <pre>{`Layer 5: AI            — LLM-powered test generation
Layer 4: Fixtures      — Playwright fixture DI
Layer 3: Typed Proxy   — TypeScript control wrappers
Layer 2: Bridge        — Browser-based control discovery (page.evaluate)
Layer 1: Core          — Logging, config, errors, utilities`}</pre>
          </div>
          <p>
            <strong>Sub-path exports:</strong> <code className="praman-prose-code">.</code>,{' '}
            <code className="praman-prose-code">./ai</code>,{' '}
            <code className="praman-prose-code">./intents</code>,{' '}
            <code className="praman-prose-code">./vocabulary</code>,{' '}
            <code className="praman-prose-code">./fe</code>,{' '}
            <code className="praman-prose-code">./reporters</code>
          </p>
          <p>
            <strong>Path aliases:</strong> <code className="praman-prose-code">#core/*</code>,{' '}
            <code className="praman-prose-code">#bridge/*</code>,{' '}
            <code className="praman-prose-code">#proxy/*</code>,{' '}
            <code className="praman-prose-code">#fixtures/*</code>
          </p>
        </Section>

        <Section title="Code Standards">
          <p>
            TypeScript strict mode. No <code className="praman-prose-code">any</code>, no{' '}
            <code className="praman-prose-code">{'as unknown as T'}</code>. ESM only. Node builtins
            use <code className="praman-prose-code">node:</code> prefix. Relative imports include{' '}
            <code className="praman-prose-code">.js</code> extension. Maximum 300 LOC per file.
          </p>
          <p>
            <strong>Documentation:</strong> Microsoft TSDoc (not JSDoc). Every public function must
            have TSDoc with an <code className="praman-prose-code">@example</code> tag.
          </p>
          <p>
            <strong>Errors:</strong> All errors extend{' '}
            <code className="praman-prose-code">PramanError</code> with{' '}
            <code className="praman-prose-code">code</code>,{' '}
            <code className="praman-prose-code">attempted</code>,{' '}
            <code className="praman-prose-code">retryable</code>,{' '}
            <code className="praman-prose-code">suggestions[]</code>. Use pino logger — never{' '}
            <code className="praman-prose-code">console.log</code>.
          </p>
          <p>
            <strong>Linting:</strong> 11 ESLint plugins, zero tolerance (0 errors, 0 warnings).
          </p>
        </Section>

        <Section title="Commit Messages">
          <p>
            We use{' '}
            <a
              href="https://www.conventionalcommits.org/"
              target="_blank"
              rel="noopener noreferrer"
            >
              Conventional Commits
            </a>{' '}
            enforced by commitlint.
          </p>
          <div className="praman-prose-code-block">
            <pre>{`feat(proxy): add bidirectional type conversion
fix(bridge): handle stale control reference
docs(auth): add Office365 strategy example
test(core): add config validation edge cases`}</pre>
          </div>
          <p>
            <strong>Types:</strong> feat, fix, docs, style, refactor, perf, test, build, ci, chore,
            revert
          </p>
          <p>
            <strong>Limits:</strong> Subject max 72 characters, header max 100 characters.
          </p>
        </Section>

        <Section title="Testing">
          <p>
            <strong>Unit:</strong> Vitest 4.x with{' '}
            <code className="praman-prose-code">describe</code> /{' '}
            <code className="praman-prose-code">it</code> pattern. File naming:{' '}
            <code className="praman-prose-code">*.test.ts</code>. Hermetic — no network calls.
          </p>
          <p>
            <strong>Integration:</strong> Playwright with{' '}
            <code className="praman-prose-code">test.step()</code>. File naming:{' '}
            <code className="praman-prose-code">*.spec.ts</code>. Requires SAP credentials.
          </p>
          <p>
            <strong>Coverage:</strong> Tier 1 (errors): 100%. Tier 2 (core): 95%. Tier 3 (global):
            90%. Per-file enforcement.
          </p>
        </Section>

        <Section title="Git Hooks">
          <table className="praman-prose-table">
            <thead>
              <tr>
                <th>Hook</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>
                  <strong>pre-commit</strong>
                </td>
                <td>lint-staged (ESLint + Prettier on staged files)</td>
              </tr>
              <tr>
                <td>
                  <strong>commit-msg</strong>
                </td>
                <td>commitlint validation</td>
              </tr>
              <tr>
                <td>
                  <strong>pre-push</strong>
                </td>
                <td>typecheck + unit tests with coverage + build</td>
              </tr>
            </tbody>
          </table>
        </Section>

        <Section title="Pull Requests">
          <ol>
            <li>
              Create a feature branch from <code className="praman-prose-code">main</code>
            </li>
            <li>Make your changes following the code standards above</li>
            <li>
              Ensure <code className="praman-prose-code">npm run ci</code> passes locally
            </li>
            <li>Submit a PR with a clear description of what and why</li>
            <li>Wait for CI checks (3-OS matrix) and code review</li>
          </ol>
        </Section>

        <Section title="Reporting Issues">
          <ul>
            <li>
              <strong>Bugs:</strong> Open a GitHub issue with steps to reproduce
            </li>
            <li>
              <strong>Security vulnerabilities:</strong> Email{' '}
              <a href="mailto:security@zestest.in">security@zestest.in</a> (see SECURITY.md)
            </li>
            <li>
              <strong>Feature requests:</strong> Open a GitHub issue with use case description
            </li>
          </ul>
        </Section>

        <Section title="License">
          <p>
            By contributing, you agree that your contributions will be licensed under the{' '}
            <a href="/license">Apache License 2.0</a>.
          </p>
        </Section>
      </main>
    </Layout>
  );
}
