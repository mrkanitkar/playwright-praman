/**
 * Fixtures module — Playwright fixture composition for Praman.
 *
 * @module fixtures
 */

// ── Core fixtures (worker-scoped + test-scoped) ─────────────────────
export { coreTest } from './core-fixtures.js';
export type { TestFixtures, WorkerFixtures } from './core-fixtures.js';
