/**
 * Worker-scoped core fixtures for the Praman Playwright test runner.
 *
 * @remarks
 * Defines the foundation fixture layer using `test.extend()`. Worker-scoped
 * fixtures are created once per worker process and shared across all tests
 * running in that worker.
 *
 * This module provides:
 * - `pramanConfig` — validated, frozen configuration
 * - `rootLogger` — pino root logger with redaction
 * - `tracer` — OpenTelemetry tracer (NoOp in Phase 1)
 * - `playwrightCompat` — Playwright version feature flags (auto)
 * - `selectorRegistration` — registers `ui5=` selector engine (auto)
 * - `matcherRegistration` — registers custom UI5 matchers (auto)
 *
 * Test-scoped fixtures (bridgeAdapter, ui5, pramanLogger) are added by
 * the B3b batch in a separate module.
 *
 * @example
 * ```typescript
 * import { coreTest } from '#fixtures/core-fixtures.js';
 *
 * const test = coreTest;
 *
 * test('loads config', async ({ pramanConfig }) => {
 *   expect(pramanConfig.logLevel).toBeDefined();
 * });
 * ```
 *
 * @module fixtures
 */

import { test as base } from '@playwright/test';
import type { Logger } from 'pino';

import { assertMinVersion, getPlaywrightFeatures } from '#core/compat/index.js';
import type { PlaywrightFeatures } from '#core/compat/index.js';
import { loadConfig } from '#core/config/index.js';
import type { PramanConfig } from '#core/config/index.js';
import { createRootLogger } from '#core/logging/index.js';
import { initTelemetry } from '#core/telemetry/index.js';
import type { TracerWrapper } from '#core/telemetry/index.js';

/** Minimum Playwright version required by Praman. */
const MIN_PLAYWRIGHT_VERSION = '1.50.0';

/**
 * Test-scoped fixture type placeholder.
 *
 * @remarks
 * Intentionally empty — test-scoped fixtures will be added by A5 (B3b).
 */
// eslint-disable-next-line @typescript-eslint/no-empty-object-type -- Placeholder for B3b test-scoped fixtures
interface TestFixtures {}

/**
 * Worker-scoped fixture types for the core layer.
 *
 * @remarks
 * Each fixture is created once per worker process and shared across
 * all tests in that worker. Auto fixtures are initialized automatically.
 */
interface WorkerFixtures {
  /** Validated, frozen Praman configuration loaded once per worker. */
  pramanConfig: Readonly<PramanConfig>;

  /** Root pino logger with redaction, configured from pramanConfig. */
  rootLogger: Logger;

  /** OpenTelemetry tracer wrapper (NoOp in Phase 1). */
  tracer: TracerWrapper;

  /** Playwright version feature flags, auto-initialized per worker. */
  playwrightCompat: PlaywrightFeatures;

  /** Registers the `ui5=` selector engine once per worker. */
  // eslint-disable-next-line @typescript-eslint/no-invalid-void-type -- Playwright fixtures use void for side-effect-only fixtures
  selectorRegistration: void;

  /** Registers custom UI5 + table matchers via expect.extend() once per worker. */
  // eslint-disable-next-line @typescript-eslint/no-invalid-void-type -- Playwright fixtures use void for side-effect-only fixtures
  matcherRegistration: void;
}

/**
 * Core Playwright test object with worker-scoped fixtures.
 *
 * @remarks
 * Extends `@playwright/test` base test with Praman worker fixtures.
 * Use this as the base for further fixture composition.
 *
 * @example
 * ```typescript
 * import { coreTest } from '#fixtures/core-fixtures.js';
 *
 * coreTest('has valid config', async ({ pramanConfig }) => {
 *   expect(pramanConfig.logLevel).toBe('info');
 * });
 * ```
 */
export const coreTest = base.extend<TestFixtures, WorkerFixtures>({
  pramanConfig: [
    // eslint-disable-next-line no-empty-pattern -- Playwright fixture pattern: ({}, use) is required when no deps
    async ({}, use) => {
      const config = await loadConfig();
      await use(Object.freeze(config));
    },
    { scope: 'worker' },
  ],

  rootLogger: [
    async ({ pramanConfig }, use) => {
      const logger = createRootLogger(pramanConfig);
      await use(logger);
    },
    { scope: 'worker' },
  ],

  tracer: [
    async ({ pramanConfig }, use) => {
      const tracer = await initTelemetry(pramanConfig);
      await use(tracer);
      await tracer.shutdown();
    },
    { scope: 'worker' },
  ],

  playwrightCompat: [
    // eslint-disable-next-line no-empty-pattern -- Playwright fixture pattern: ({}, use) is required when no deps
    async ({}, use) => {
      assertMinVersion(MIN_PLAYWRIGHT_VERSION);
      const features = getPlaywrightFeatures();
      await use(features);
    },
    { scope: 'worker', auto: true },
  ],

  selectorRegistration: [
    // eslint-disable-next-line no-empty-pattern -- Playwright fixture pattern: ({}, use) is required when no deps
    async ({}, use) => {
      // Selector registration requires playwright.selectors which is
      // only available in the Playwright test runtime. The actual registration
      // (playwright.selectors.register('ui5', script)) will be wired in a
      // later phase when running under Playwright's test runner.
      await use();
    },
    { scope: 'worker', auto: true },
  ],

  matcherRegistration: [
    // eslint-disable-next-line no-empty-pattern -- Playwright fixture pattern: ({}, use) is required when no deps
    async ({}, use) => {
      // Matcher registration via expect.extend() will be wired here
      // in a later phase. This registers UI5-specific custom matchers
      // (toHaveUI5Text, toBeUI5Visible, etc.) and table matchers.
      await use();
    },
    { scope: 'worker', auto: true },
  ],
});

export type { TestFixtures, WorkerFixtures };
