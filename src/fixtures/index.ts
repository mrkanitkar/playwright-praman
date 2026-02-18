/**
 * Fixtures module — Playwright fixture composition for Praman.
 *
 * @module fixtures
 */

// ── Core fixtures (worker-scoped + test-scoped) ─────────────────────
export { coreTest } from './core-fixtures.js';
export type { TestFixtures, WorkerFixtures } from './core-fixtures.js';

// ── Stability fixtures (auto test-scoped) ───────────────────────────
export { stabilityTest } from './stability-fixtures.js';
export type { StabilityFixtures, StabilityWorkerFixtures } from './stability-fixtures.js';

// ── Auth fixtures (sapAuth handler + sapAuthConfig option) ──────────
export { authTest } from './auth-fixtures.js';
export type { AuthFixtureOptions, AuthFixtures } from './auth-fixtures.js';
