/**
 * @license
 * Copyright (c) ZesTest 2025-2030. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0
 *
 * This file may contain AI-assisted code.
 * See LICENSE and NOTICE files for details.
 */

/**
 * Browser-bind fixture — exposes the test browser to Playwright CLI agents.
 *
 * @ai
 * @aiContext When `PRAMAN_BIND=1` is set, calls `browser.bind(title)` (Playwright 1.59+) to
 * make the running test browser accessible to `playwright-cli` agents. Enables the
 * "test starts → agent inspects live UI → test continues" agentic workflow. The bind
 * endpoint URL is logged so the agent can connect without polling.
 *
 * @remarks
 * The `browserBind` fixture is **test-scoped** and **opt-in** via the
 * `PRAMAN_BIND` environment variable. When `PRAMAN_BIND` is not set (or is `'0'`),
 * the fixture is a no-op and imposes zero overhead.
 *
 * When `PRAMAN_BIND=1`:
 * 1. Calls `browser.bind('praman-agent')` to open an ephemeral endpoint.
 * 2. Logs the endpoint URL at `info` level so `playwright-cli` can connect.
 * 3. Passes the {@link BrowserBindResult} to the test body.
 * 4. Calls `browser.unbind()` in the `finally` block regardless of test outcome.
 *
 * The bind title defaults to `'praman-agent'` and can be overridden via the
 * `PRAMAN_BIND_TITLE` environment variable.
 *
 * Cross-fixture dependency: `rootLogger` is declared as a `{ option: true }` placeholder
 * (PW-MERGE-1) so it can be provided by `coreTest` via `mergeTests()`.
 *
 * @example
 * ```typescript
 * import { browserBindTest } from '#fixtures/browser-bind-fixture.js';
 * import { mergeTests } from '@playwright/test';
 * import { coreTest } from '#fixtures/core-fixtures.js';
 *
 * const test = mergeTests(coreTest, browserBindTest);
 *
 * // PRAMAN_BIND=1 npx playwright test my-sap.spec.ts
 * test('agent-assisted SAP test', async ({ browserBind }) => {
 *   if (browserBind.bound) {
 *     // Playwright CLI agent can now connect to browserBind.endpointUrl
 *   }
 * });
 * ```
 *
 * @module fixtures
 */

import process from 'node:process';

import { test as base } from '@playwright/test';
import type { Browser } from '@playwright/test';

import { PramanError } from '#core/errors/base.js';
import { ErrorCode } from '#core/errors/codes.js';
import { createLogger } from '#core/logging/index.js';

// ── Types ───────────────────────────────────────────────────────────────────

/**
 * Result provided to the test body by the `browserBind` fixture.
 *
 * @remarks
 * When `PRAMAN_BIND` is not set (or `'0'`), `bound` is `false` and
 * `endpointUrl` is `undefined`. Check `bound` before using the URL.
 *
 * @example
 * ```typescript
 * test('agentic', async ({ browserBind }) => {
 *   if (browserBind.bound) {
 *     console.info('Connect at:', browserBind.endpointUrl);
 *   }
 * });
 * ```
 */
export interface BrowserBindResult {
  /** Whether the browser is currently bound and accessible to external agents. */
  readonly bound: boolean;
  /**
   * The endpoint URL that Playwright CLI can connect to.
   * `undefined` when `bound` is `false`.
   */
  readonly endpointUrl: string | undefined;
  /**
   * The bind title used when calling `browser.bind(title)`.
   * `undefined` when `bound` is `false`.
   */
  readonly bindTitle: string | undefined;
}

/**
 * Test-scoped fixture types for the browser-bind layer.
 *
 * @example
 * ```typescript
 * import type { BrowserBindFixtures } from '#fixtures/browser-bind-fixture.js';
 * ```
 */
export interface BrowserBindFixtures {
  /**
   * Browser bind result for the current test.
   * Always defined; `bound` is `false` when `PRAMAN_BIND` is not set.
   */
  browserBind: BrowserBindResult;
}

/**
 * Worker-level dependencies provided by coreTest via mergeTests.
 *
 * @remarks
 * This interface is intentionally empty. The browser-bind fixture only
 * depends on the Playwright built-in `browser` fixture, which is always
 * available without merging with `coreTest`.
 */
// eslint-disable-next-line @typescript-eslint/no-empty-object-type -- empty worker deps; no cross-fixture dependencies required for this fixture
export interface BrowserBindWorkerDeps {}

// ── Helpers ─────────────────────────────────────────────────────────────────

/**
 * Returns `true` when the `PRAMAN_BIND` environment variable enables binding.
 *
 * @returns `true` if `PRAMAN_BIND` is `'1'` or `'true'`, `false` otherwise.
 *
 * @example
 * ```typescript
 * if (isBrowserBindEnabled()) { ... }
 * ```
 */
function isBrowserBindEnabled(): boolean {
  const val = process.env['PRAMAN_BIND'];
  return val === '1' || val === 'true';
}

/**
 * Returns the bind title from `PRAMAN_BIND_TITLE` or the default `'praman-agent'`.
 *
 * @returns The title string to pass to `browser.bind(title)`.
 *
 * @example
 * ```typescript
 * const title = getBindTitle(); // 'praman-agent'
 * ```
 */
function getBindTitle(): string {
  return process.env['PRAMAN_BIND_TITLE'] ?? 'praman-agent';
}

// ── Fixture definition ──────────────────────────────────────────────────────

/**
 * Playwright test object extended with the `browserBind` fixture.
 *
 * @remarks
 * Extends the base Playwright test with a `browserBind` test-scoped fixture.
 * When `PRAMAN_BIND=1`, calls `browser.bind(title)` (Playwright 1.59+) to expose
 * the browser to Playwright CLI agents and logs the endpoint URL.
 *
 * No `mergeTests()` required — this fixture only depends on the Playwright
 * built-in `browser` fixture.
 *
 * @intent Expose the test browser to Playwright CLI agents for agentic workflows
 * @capability ui5.control
 *
 * @example
 * ```typescript
 * import { browserBindTest } from 'playwright-praman';
 *
 * // PRAMAN_BIND=1 npx playwright test
 * browserBindTest('inspect live', async ({ browserBind }) => {
 *   if (browserBind.bound) {
 *     // agent can connect at browserBind.endpointUrl
 *   }
 * });
 * ```
 */
export const browserBindTest = base.extend<BrowserBindFixtures, BrowserBindWorkerDeps>({
  // ── browserBind fixture ──────────────────────────────────────────────────

  browserBind: async (
    { browser }: { browser: Browser },
    use: (value: BrowserBindResult) => Promise<void>,
  ) => {
    if (!isBrowserBindEnabled()) {
      await use({ bound: false, endpointUrl: undefined, bindTitle: undefined });
      return;
    }

    const log = createLogger('browser-bind');

    // Playwright 1.59 introduced browser.bind() — guard for older versions at runtime.
    // The Browser type from playwright-core 1.59 includes bind() in its interface.
    // We use a safe runtime check to handle older Playwright versions gracefully.
    // Extracted only for a runtime `typeof` feature-check; always invoked via
    // bindFn.call(browser, …), so `this` is preserved.
    /* eslint-disable @typescript-eslint/unbound-method */
    const bindFn = (
      browser as Browser & { bind?: (title: string) => Promise<{ endpoint: string }> }
    ).bind;
    /* eslint-enable @typescript-eslint/unbound-method */
    if (typeof bindFn !== 'function') {
      throw new PramanError({
        code: ErrorCode.ERR_BIND_NOT_SUPPORTED,
        message: 'browser.bind() is not available — requires Playwright 1.59 or later',
        attempted: 'Bind browser for Playwright CLI agent access (PRAMAN_BIND=1)',
        retryable: false,
        suggestions: [
          'Upgrade Playwright to 1.59 or later: npm install -D @playwright/test@latest',
          'Remove PRAMAN_BIND=1 to disable browser binding',
        ],
        details: { pramanBind: process.env['PRAMAN_BIND'] ?? '' },
      });
    }

    const title = getBindTitle();
    let endpointUrl: string | undefined;

    try {
      const bindResult = await bindFn.call(browser, title);
      endpointUrl = bindResult.endpoint;
      log.info({ endpointUrl, title }, 'Browser bound — Playwright CLI agent can connect');
    } catch (error: unknown) {
      throw new PramanError({
        code: ErrorCode.ERR_BIND_FAILED,
        message: `browser.bind('${title}') failed: ${error instanceof Error ? error.message : String(error)}`,
        attempted: 'Call browser.bind() to expose browser to Playwright CLI agents',
        retryable: false,
        ...(error instanceof Error ? { cause: error } : {}),
        suggestions: [
          'Check that no other process has already bound this browser',
          'Verify that the Playwright version supports browser.bind()',
          'Remove PRAMAN_BIND=1 to disable browser binding',
        ],
        details: { pramanBind: process.env['PRAMAN_BIND'] ?? '', title },
      });
    }

    try {
      await use({ bound: true, endpointUrl, bindTitle: title });
    } finally {
      // Extracted only for a runtime `typeof` feature-check; always invoked via
      // unbindFn.call(browser), so `this` is preserved.
      /* eslint-disable-next-line @typescript-eslint/unbound-method */
      const unbindFn = (browser as Browser & { unbind?: () => Promise<void> }).unbind;
      if (typeof unbindFn === 'function') {
        try {
          await unbindFn.call(browser);
          log.debug({ title }, 'Browser unbound');
        } catch (error: unknown) {
          log.debug({ err: error }, 'browser.unbind() failed during teardown (non-fatal)');
        }
      }
    }
  },
});
