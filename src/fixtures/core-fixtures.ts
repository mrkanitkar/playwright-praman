/**
 * @license
 * Copyright (c) ZesTest 2025-2030. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0
 *
 * This file may contain AI-assisted code.
 * See LICENSE and NOTICE files for details.
 */

/**
 * Core fixtures for the Praman Playwright test runner.
 *
 * @ai
 * @aiContext Foundation fixture layer. Provides `pramanConfig` (validated config),
 * `pramanLogger` (structured logger), `ui5` (UI5Handler for control interactions),
 * and auto-fixtures for selector engine and matcher registration.
 *
 * @remarks
 * Defines the foundation fixture layer using `test.extend()`.
 *
 * Worker-scoped fixtures (created once per worker process):
 * - `pramanConfig` — validated, frozen configuration
 * - `rootLogger` — pino root logger with redaction
 * - `tracer` — OpenTelemetry tracer (NoOp in Phase 1)
 * - `playwrightCompat` — Playwright version feature flags (auto)
 * - `selectorRegistration` — registers `ui5=` selector engine (auto)
 * - `matcherRegistration` — registers custom UI5 matchers (auto)
 *
 * Test-scoped fixtures (created per test):
 * - `pramanLogger` — child logger per test
 * - `ui5` — UI5Handler for control discovery, interaction, and lifecycle
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

import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';

import { expect, test as base } from '@playwright/test';
import type { Frame } from '@playwright/test';
import type { Logger } from 'pino';

import { applyRegisteredMatchers } from '../matchers/matcher-registry.js';
import {
  checkUI5CellText,
  checkUI5RowCount,
  checkUI5SelectedRows,
} from '../matchers/table-matchers.js';
import {
  checkUI5Binding,
  checkUI5ControlType,
  checkUI5Enabled,
  checkUI5Property,
  checkUI5Text,
  checkUI5ValueState,
  checkUI5Visible,
} from '../matchers/ui5-matchers.js';

import { UI5Handler } from './ui5-handler.js';

import { createObjectCleanupScript } from '#bridge/browser-scripts/object-map.js';
import { resetPageInjection } from '#bridge/injection.js';
import { createInteractionStrategy } from '#bridge/interaction-strategies/strategy-factory.js';
import { assertMinVersion, getPlaywrightFeatures } from '#core/compat/index.js';
import type { PlaywrightFeatures } from '#core/compat/index.js';
import { loadConfig } from '#core/config/index.js';
import type { PramanConfig } from '#core/config/index.js';
import { createLogger, createRootLogger } from '#core/logging/index.js';
import { initTelemetry } from '#core/telemetry/index.js';
import type { TracerWrapper } from '#core/telemetry/index.js';

/** Minimum Playwright version required by Praman. */
const MIN_PLAYWRIGHT_VERSION = '1.57.0';

/**
 * Lazy-cached selector engine bundle source.
 * Read once per Node.js process (not per Playwright worker) to avoid redundant disk I/O.
 */
let cachedEngineBundleSource: string | undefined;

/**
 * Read and cache the pre-built ui5-engine.js browser bundle.
 *
 * @returns The bundle source string wrapped for Playwright selector registration.
 */
function getEngineBundleSource(): string {
  if (cachedEngineBundleSource === undefined) {
    const distDir = dirname(fileURLToPath(import.meta.url));
    const enginePath = resolve(distDir, 'browser', 'ui5-engine.js');
    const bundleSource = readFileSync(enginePath, 'utf-8');
    cachedEngineBundleSource = `(() => { const module = {exports: {}}; ${bundleSource}; return module.exports.default })()`;
  }
  return cachedEngineBundleSource;
}

/**
 * Test-scoped fixture types for the core layer.
 *
 * @remarks
 * Each fixture is created per test and torn down after the test completes.
 * - `pramanLogger` — child logger scoped to the test
 * - `ui5` — UI5Handler for control discovery, interaction, and lifecycle
 *
 * @browserContext Requires active browser session with UI5 page
 *
 * @example
 * ```typescript
 * test('uses logger', async ({ pramanLogger, ui5 }) => {
 *   pramanLogger.info('Test started');
 * });
 * ```
 */
interface TestFixtures {
  /** Child logger scoped to the current test. */
  pramanLogger: Logger;

  /** UI5Handler providing control(), controls(), click(), fill(), waitFor(), etc. */
  ui5: UI5Handler;
}

/**
 * Worker-scoped fixture types for the core layer.
 *
 * @remarks
 * Each fixture is created once per worker process and shared across
 * all tests in that worker. Auto fixtures are initialized automatically.
 *
 * @example
 * ```typescript
 * test('reads config', async ({ pramanConfig }) => {
 *   expect(pramanConfig.logLevel).toBeDefined();
 * });
 * ```
 */
interface WorkerFixtures {
  /**
   * Validated, frozen Praman configuration loaded once per worker.
   *
   * @intent Provide a single source of truth for all Praman settings (timeouts, strategies,
   * selectors, log level) so that every test in the worker shares identical configuration
   * without re-parsing or risking mutation.
   */
  pramanConfig: Readonly<PramanConfig>;

  /**
   * Root pino logger with redaction, configured from pramanConfig.
   *
   * @intent Establish structured logging with PII redaction at the worker level so that
   * test-scoped child loggers inherit consistent formatting, log level, and transport
   * configuration without redundant setup.
   */
  rootLogger: Logger;

  /**
   * OpenTelemetry tracer wrapper (NoOp in Phase 1).
   *
   * @intent Enable distributed tracing instrumentation from day one so that bridge calls,
   * control discovery, and interactions can be traced end-to-end when a real exporter is
   * configured. NoOp in Phase 1 ensures zero overhead until needed.
   */
  tracer: TracerWrapper;

  /**
   * Playwright version feature flags, auto-initialized per worker.
   *
   * @intent Detect Playwright version capabilities once per worker so that feature-gated
   * code (e.g., `selectors.register` content mode, `locator.filter`) can branch without
   * repeated version parsing.
   */
  playwrightCompat: PlaywrightFeatures;

  /**
   * Registers the `ui5=` selector engine once per worker.
   *
   * @intent Make `page.locator('ui5=...')` available in all tests by registering the
   * custom selector engine at the worker level. This enables Playwright-native locator
   * strategies for UI5 controls alongside standard CSS/XPath selectors.
   */
  // eslint-disable-next-line @typescript-eslint/no-invalid-void-type -- Playwright fixtures use void for side-effect-only fixtures
  selectorRegistration: void;

  /**
   * Registers custom UI5 + table matchers via expect.extend() once per worker.
   *
   * @intent Provide domain-specific assertions (`toHaveUI5Text`, `toBeUI5Visible`,
   * `toHaveUI5RowCount`, etc.) that poll with auto-retry semantics, matching Playwright's
   * web-first assertion pattern. Registered once per worker to avoid duplicate extension.
   */
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
 * @capability ui5.control
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
      const skipCheck =
        process.env['PRAMAN_SKIP_VERSION_CHECK'] === 'true' ||
        process.env['PRAMAN_SKIP_VERSION_CHECK'] === '1';
      if (!skipCheck) {
        assertMinVersion(MIN_PLAYWRIGHT_VERSION);
      }
      const features = getPlaywrightFeatures();
      await use(features);
    },
    { scope: 'worker', auto: true },
  ],

  selectorRegistration: [
    async ({ playwright }, use) => {
      // Content-based registration: use the lazy-cached pre-built browser bundle.
      // The bundle is a CJS module that assigns `module.exports.default` to the
      // Playwright SelectorEngine ({query, queryAll}). We wrap it in an IIFE that
      // creates a `module` shim and returns the default export — same pattern as
      // playwright-ui5.
      try {
        const wrappedSource = getEngineBundleSource();
        await playwright.selectors.register('ui5', { content: wrappedSource });
      } catch (error: unknown) {
        const isAlreadyRegistered =
          error instanceof Error && error.message.includes('has been already registered');
        if (!isAlreadyRegistered) {
          throw error;
        }
      }

      await use();
    },
    { scope: 'worker', auto: true },
  ],

  matcherRegistration: [
    // eslint-disable-next-line no-empty-pattern -- Playwright fixture pattern: ({}, use) is required when no deps
    async ({}, use) => {
      // Built-in matchers
      expect.extend({
        toHaveUI5Text: checkUI5Text,
        toBeUI5Visible: checkUI5Visible,
        toBeUI5Enabled: checkUI5Enabled,
        toHaveUI5Property: checkUI5Property,
        toHaveUI5ValueState: checkUI5ValueState,
        toHaveUI5RowCount: checkUI5RowCount,
        toHaveUI5CellText: checkUI5CellText,
        toHaveUI5SelectedRows: checkUI5SelectedRows,
        toHaveUI5Binding: checkUI5Binding,
        toBeUI5ControlType: checkUI5ControlType,
      });

      // User-registered custom matchers (freezes the registry)
      const customMatchers = applyRegisteredMatchers();
      if (Object.keys(customMatchers).length > 0) {
        expect.extend(customMatchers);
      }

      await use();
    },
    { scope: 'worker', auto: true },
  ],

  // ── Test-scoped fixtures ──────────────────────────────────────────

  pramanLogger: async ({ rootLogger }, use) => {
    const logger = createLogger('test', rootLogger);
    await use(logger);
  },

  ui5: async ({ page, pramanConfig, rootLogger, tracer }, use) => {
    const logger = createLogger('bridge', rootLogger);
    const strategy = createInteractionStrategy(pramanConfig.interactionStrategy, pramanConfig.opa5);

    // Listen for main frame navigation to reset bridge injection state.
    // After navigation the injected bridge script is gone, so the next
    // bridge operation must re-inject.
    const navigationListener = (frame: Frame): void => {
      if (frame === page.mainFrame()) {
        logger.debug('Main frame navigated — clearing bridge injection state');
        resetPageInjection(page);
      }
    };
    page.on('framenavigated', navigationListener);

    const handler = new UI5Handler({
      page,
      interactionStrategy: strategy,
      discoveryStrategies: pramanConfig.discoveryStrategies,
      config: {
        ui5WaitTimeout: pramanConfig.ui5WaitTimeout,
        controlDiscoveryTimeout:
          // eslint-disable-next-line @typescript-eslint/no-deprecated, sonarjs/deprecation -- backward-compat fallback
          pramanConfig.selectors?.defaultTimeout ?? pramanConfig.controlDiscoveryTimeout,
        preferVisibleControls:
          pramanConfig.selectors?.preferVisibleControls ?? pramanConfig.preferVisibleControls,
        skipStabilityWait:
          pramanConfig.selectors?.skipStabilityWait ?? pramanConfig.skipStabilityWait,
      },
      tracer,
    });

    try {
      await use(handler);
    } finally {
      // Teardown: remove navigation listener (always — even if use() throws)
      page.off('framenavigated', navigationListener);
      try {
        // Clean up browser-side object map to prevent memory leaks
        const cleanupScript = createObjectCleanupScript();
        await page.evaluate(cleanupScript).catch((error: unknown) => {
          logger.debug(
            { err: error },
            'Object map cleanup failed (non-fatal — page may have navigated away)',
          );
        });
      } finally {
        await handler.destroy();
      }
    }
  },
});

export type { TestFixtures, WorkerFixtures };
