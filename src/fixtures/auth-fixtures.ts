/**
 * @license
 * Copyright (c) ZesTest 2025-2030. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0
 *
 * This file may contain AI-assisted code.
 * See LICENSE and NOTICE files for details.
 */

/**
 * Authentication fixtures for SAP systems.
 *
 * @remarks
 * Provides Playwright fixtures for SAP authentication:
 * - `sapAuthConfig` — configurable auth options (per-project fixture option)
 * - `sapAuth` — SAPAuthHandler instance initialized with a strategy
 *
 * The fixture does NOT auto-login or auto-logout. Authentication lifecycle
 * is managed by the Playwright setup project pattern (D28).
 *
 * Dependencies from coreTest (via mergeTests):
 * - `pramanConfig` — from coreTest worker fixtures
 *
 * @example
 * ```typescript
 * import { authTest } from '#fixtures/auth-fixtures.js';
 *
 * const test = authTest;
 *
 * test('has auth handler', async ({ sapAuth }) => {
 *   // sapAuth is a SAPAuthHandler — call login() explicitly
 *   await sapAuth.login(page, config);
 * });
 * ```
 *
 * @module fixtures
 */

import { test as base } from '@playwright/test';

import { createAuthStrategy } from '../auth/auth-factory.js';
import { SAPAuthHandler } from '../auth/auth-handler.js';
import type { SAPAuthConfig } from '../auth/auth-types.js';

/**
 * Auth fixture option types.
 *
 * @ai
 * @aiContext Configuration for SAP authentication strategies.
 *
 * @remarks
 * Configurable per-project via `test.use({ sapAuthConfig: { ... } })`.
 *
 * @example
 * ```typescript
 * import type { AuthFixtureOptions } from '#fixtures/auth-fixtures.js';
 *
 * const options: AuthFixtureOptions = {
 *   sapAuthConfig: { url: 'https://sap.example.com', username: 'admin', password: 'secret' },
 * };
 * ```
 */
export interface AuthFixtureOptions {
  /** SAP authentication configuration, settable per project. */
  readonly sapAuthConfig: SAPAuthConfig;
}

/**
 * Auth fixture types.
 *
 * @ai
 * @aiContext Provides the sapAuth handler for login/logout in tests.
 *
 * @remarks
 * Test-scoped fixtures provided to each test.
 *
 * @example
 * ```typescript
 * import type { AuthFixtures } from '#fixtures/auth-fixtures.js';
 * ```
 */
export interface AuthFixtures {
  /** SAPAuthHandler instance initialized with strategy from config. */
  readonly sapAuth: SAPAuthHandler;
}

/**
 * Cross-fixture dependency type (provided by coreTest via mergeTests).
 *
 * @remarks
 * PW-MERGE-1: `pramanConfig` is declared as a fixture option placeholder
 * so TypeScript understands the dependency chain. At runtime, coreTest
 * supplies the real value via `mergeTests(coreTest, authTest)`.
 *
 * @example
 * ```typescript
 * import type { AuthDeps } from '#fixtures/auth-fixtures.js';
 * ```
 */
export interface AuthDeps {
  /** Validated, frozen Praman configuration from coreTest. */
  readonly pramanConfig: Readonly<Record<string, unknown>>;
}

/**
 * Minimal no-op logger for auth fixture construction.
 *
 * @intent Suppress logging during fixture wiring — auth strategies receive a logger
 * at construction time, but fixture setup should be silent. Real logging begins
 * when the user calls `sapAuth.login()`, which uses the strategy's own logger.
 */
const fixtureLogger = {
  info(): void {
    /* no-op in fixture — lifecycle logging deferred to explicit login() */
  },
  warn(): void {
    /* no-op in fixture — warning logging deferred to explicit login() */
  },
  error(): void {
    /* no-op in fixture — error logging deferred to explicit login() */
  },
};

/**
 * Auth test object with sapAuth handler and sapAuthConfig option.
 *
 * @ai
 * @aiContext Use to access the SAP auth handler for login/logout operations.
 *
 * @remarks
 * Extends `@playwright/test` base with auth fixtures:
 *
 * - `pramanConfig` — placeholder for coreTest cross-fixture dep (PW-MERGE-1)
 * - `sapAuthConfig` — fixture option with empty defaults
 * - `sapAuth` — creates SAPAuthHandler with auto-detected or explicit strategy
 *
 * NOTE: No auto-login — test setup projects call `handler.login()` explicitly.
 * NOTE: No auto-logout — session managed by setup project (D28 pattern).
 *
 * @capability sapAuth.login
 *
 * @example
 * ```typescript
 * import { authTest } from '#fixtures/auth-fixtures.js';
 *
 * authTest('authenticates to SAP', async ({ sapAuth, page }) => {
 *   await sapAuth.login(page, { url: '...', username: '...', password: '...' });
 * });
 * ```
 */
export const authTest = base.extend<AuthFixtures & AuthFixtureOptions, AuthDeps>({
  // Placeholder — provided by coreTest via mergeTests (PW-MERGE-1)
  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion -- PW-MERGE-1: placeholder overridden by mergeTests
  pramanConfig: [undefined!, { option: true, scope: 'worker' }],

  sapAuthConfig: [{ url: '', username: '', password: '' }, { option: true }],

  sapAuth: async ({ sapAuthConfig, page }, use) => {
    const strategy = createAuthStrategy(sapAuthConfig);
    const handler = new SAPAuthHandler({
      strategy,
      logger: fixtureLogger,
    });

    // NOTE: No auto-login — relies on setup project (D28 pattern)
    await use(handler);

    // Teardown: server-side logout to avoid dangling sessions (BF-009)
    if (handler.getSessionInfo() !== null) {
      await handler.logout(page);
    }
  },
});
