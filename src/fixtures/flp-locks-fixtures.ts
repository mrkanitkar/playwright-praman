/**
 * FLP Locks fixtures — Playwright fixture wrapping FLPLocksHandler.
 *
 * @ai
 * @aiContext Provides `flpLocks` fixture for managing SAP SM12 lock entries via OData.
 * Query, count, delete lock entries by username. Auto-cleanup tracked locks on teardown.
 *
 * @remarks
 * Provides an `flpLocks` fixture that creates an {@link FLPLocksHandler}
 * with `page` auto-injected from the Playwright fixture system. The handler
 * tracks lock entries during the test and auto-releases them in reverse order
 * during teardown (non-fatal).
 *
 * @example
 * ```typescript
 * import { flpLocksTest } from '#fixtures/flp-locks-fixtures.js';
 *
 * flpLocksTest('manage lock entries', async ({ flpLocks }) => {
 *   const entries = await flpLocks.getLockEntries('TESTUSER');
 *   await flpLocks.deleteAllLockEntries('TESTUSER');
 * });
 * ```
 *
 * @module fixtures
 */

import { test as base } from '@playwright/test';

import { FLPLocksHandler } from './flp-locks-handler.js';

// ── Public fixture types ───────────────────────────────────────────────────

/**
 * Fixture types for the FLP locks handler.
 *
 * @example
 * ```typescript
 * import type { FLPLocksFixtures } from '#fixtures/flp-locks-fixtures.js';
 * ```
 */
export interface FLPLocksFixtures {
  /** FLP lock entry manager (SM12_SRV OData service). */
  flpLocks: FLPLocksHandler;
}

// ── Fixture definition ─────────────────────────────────────────────────────

/**
 * Playwright test object extended with the FLP locks fixture.
 *
 * @remarks
 * The `flpLocks` fixture creates an {@link FLPLocksHandler} instance before
 * each test and calls `cleanup()` during teardown to release tracked lock
 * entries in reverse order (non-fatal on failure).
 *
 * @example
 * ```typescript
 * flpLocksTest('verify lock cleanup', async ({ flpLocks }) => {
 *   const count = await flpLocks.getNumberOfLockEntries('TESTUSER');
 *   await flpLocks.deleteAllLockEntries('TESTUSER');
 *   const entries = await flpLocks.getLockEntries();
 * });
 * ```
 */
export const flpLocksTest = base.extend<FLPLocksFixtures>({
  flpLocks: async ({ page }, use) => {
    const handler = new FLPLocksHandler({ page });
    await use(handler);
    // Teardown: auto-cleanup tracked locks (non-fatal)
    await handler.cleanup();
  },
});
