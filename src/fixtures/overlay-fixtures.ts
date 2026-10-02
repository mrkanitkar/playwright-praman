/**
 * @license
 * Copyright (c) ZesTest 2025-2030. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0
 *
 * This file may contain AI-assisted code.
 * See LICENSE and NOTICE files for details.
 */

/**
 * Overlay fixtures — Playwright fixture wrapping {@link OverlayHandler}.
 *
 * @ai
 * @aiContext Provides the `overlays` fixture for handling SAP overlays that
 * interrupt an action. Built-in rules detect and report; call
 * `overlays.register()` with a `dismiss` function to opt into auto-dismissal.
 *
 * @remarks
 * The fixture registers {@link BUILT_IN_OVERLAY_RULES} at test start, unless
 * disabled via `overlays.enabled: false` in `praman.config.ts`. Rules are torn
 * down at the end of the test, because `page.addLocatorHandler()` registrations
 * otherwise live for the whole page lifetime.
 *
 * When any overlay interrupted an action, the detections are attached to the
 * test report as `overlay-detections` — so a "click timed out" becomes a named
 * diagnosis instead of a mystery.
 *
 * @example
 * ```typescript
 * import { overlayTest } from '#fixtures/overlay-fixtures.js';
 *
 * overlayTest('dismiss the product tour', async ({ page, overlays }) => {
 *   await overlays.register({
 *     name: 'product-tour',
 *     selector: '.myTourPopover',
 *     dismiss: async (overlay) => overlay.getByRole('button', { name: 'Skip' }).click(),
 *   });
 *   await page.goto('/');
 * });
 * ```
 *
 * @module fixtures
 */

import { Buffer } from 'node:buffer';

import type { Page } from '@playwright/test';
import { test as base } from '@playwright/test';

import { BUILT_IN_OVERLAY_RULES, OverlayHandler } from './overlay-handler.js';

import type { PramanConfig } from '#core/config/schema.js';
import { createLogger } from '#core/logging/logger.js';

// ── Public fixture types ───────────────────────────────────────────────────

/**
 * Fixture types for overlay interruption handling.
 *
 * @example
 * ```typescript
 * import type { OverlayFixtures } from '#fixtures/overlay-fixtures.js';
 * ```
 */
export interface OverlayFixtures {
  /** Registers and tracks SAP overlay interruption handlers. */
  overlays: OverlayHandler;
}

/**
 * Worker-scoped dependencies supplied by `coreTest` through `mergeTests`.
 *
 * @example
 * ```typescript
 * import type { OverlayDeps } from '#fixtures/overlay-fixtures.js';
 * ```
 */
export interface OverlayDeps {
  pramanConfig: Readonly<PramanConfig>;
}

// ── Fixture definition ─────────────────────────────────────────────────────

/**
 * Playwright test object extended with the `overlays` fixture.
 *
 * @remarks
 * Built-in rules are registered before the test body runs and removed after it,
 * and any detections are attached to the report.
 *
 * @capability ui5Overlays.register
 *
 * @example
 * ```typescript
 * overlayTest('checkout survives interruptions', async ({ page, overlays }) => {
 *   await page.goto('/');
 *   // overlays.detections lists anything that interrupted an action
 * });
 * ```
 */
export const overlayTest = base.extend<OverlayFixtures, OverlayDeps>({
  // Placeholder — provided by coreTest via mergeTests (PW-MERGE-1)
  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion -- PW-MERGE-1: placeholder overridden by mergeTests
  pramanConfig: [undefined!, { option: true, scope: 'worker' }],

  overlays: async (
    { page, pramanConfig }: { page: Page; pramanConfig: Readonly<PramanConfig> },
    use,
    testInfo,
  ) => {
    const log = createLogger('overlay-fixture');
    const handler = new OverlayHandler({ page });

    // Undefined means standalone usage without loadConfig — default to enabled,
    // matching the Zod schema default.
    if (pramanConfig.overlays?.enabled !== false) {
      try {
        await handler.registerAll(BUILT_IN_OVERLAY_RULES);
      } catch (error: unknown) {
        // Registration is a convenience; never fail a test because of it.
        log.debug({ err: error }, 'Built-in overlay rule registration failed (non-fatal)');
      }
    }

    await use(handler);

    if (handler.detections.length > 0) {
      try {
        await testInfo.attach('overlay-detections', {
          contentType: 'application/json',
          body: Buffer.from(JSON.stringify(handler.detections, null, 2), 'utf8'),
        });
      } catch (error: unknown) {
        log.debug({ err: error }, 'Overlay detection attachment failed (non-fatal)');
      }
    }

    await handler.dispose();
  },
});
