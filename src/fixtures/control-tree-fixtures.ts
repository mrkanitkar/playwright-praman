/**
 * @license
 * Copyright (c) ZesTest 2025-2030. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0
 *
 * This file may contain AI-assisted code.
 * See LICENSE and NOTICE files for details.
 */

/**
 * Control tree capture fixture — automatic UI5 control registry serialization.
 *
 * @ai
 * @aiContext Auto-enabled fixture that serializes the UI5 control registry into a
 * hierarchical tree and attaches it as a Playwright test artifact on teardown.
 * The attachment appears in the Playwright trace viewer alongside screenshots
 * and DOM snapshots, providing immediate visibility into control state.
 *
 * @remarks
 * Provides one auto test-scoped fixture:
 * - `controlTreeCapture` — executes the control tree browser script on
 *   teardown and attaches the result via `testInfo.attach()`.
 *
 * The fixture is enabled by default. When `pramanConfig.controlTreeCapture`
 * is undefined, the fixture proceeds with defaults (`maxDepth: 10`,
 * `maxControls: 5000`). Set `controlTreeCapture: { enabled: false }` to
 * disable entirely.
 *
 * Dependencies from coreTest (via mergeTests):
 * - `page` — Playwright built-in
 * - `pramanConfig` — from coreTest worker fixtures
 *
 * Follows the `odata-trace-fixtures.ts` pattern: attaches unconditionally
 * when data exists. The **reporter** (not the fixture) filters by test status.
 *
 * @example
 * ```typescript
 * // praman.config.ts — customize control tree capture
 * import { defineConfig } from 'playwright-praman';
 *
 * export default defineConfig({
 *   controlTreeCapture: { enabled: true, maxDepth: 15, maxControls: 8000 },
 * });
 * ```
 *
 * @example
 * ```typescript
 * // praman.config.ts — disable control tree capture
 * import { defineConfig } from 'playwright-praman';
 *
 * export default defineConfig({
 *   controlTreeCapture: { enabled: false },
 * });
 * ```
 *
 * @module fixtures
 */

import { Buffer } from 'node:buffer';

import { test as base } from '@playwright/test';
import type { Page } from '@playwright/test';

import { createControlTreeScript } from '#bridge/browser-scripts/control-tree.js';
import {
  CONTROL_TREE_ATTACHMENT_NAME,
  CONTROL_TREE_CONTENT_TYPE,
} from '#bridge/control-tree-types.js';
import type { PramanConfig } from '#core/config/index.js';
import { createLogger } from '#core/logging/index.js';

// ── Types ────────────────────────────────────────────────────────────

/**
 * Control tree capture fixture types.
 *
 * @remarks
 * The fixture is `void` because it is an auto side-effect fixture.
 *
 * @example
 * ```typescript
 * import type { ControlTreeFixtures } from '#fixtures/control-tree-fixtures.js';
 * ```
 */
export interface ControlTreeFixtures {
  /** Captures UI5 control tree and attaches it as a test artifact on teardown. */
  // eslint-disable-next-line @typescript-eslint/no-invalid-void-type -- Playwright fixtures use void for side-effect-only fixtures
  controlTreeCapture: void;
}

/**
 * Dependency fixture types required by control tree fixtures.
 *
 * @remarks
 * These come from coreTest via mergeTests and are declared here
 * as `{ option: true }` placeholders (PW-MERGE-1 pattern) so
 * they don't collide with the real definitions in coreTest.
 */
interface ControlTreeDeps {
  /** Validated, frozen Praman configuration (from coreTest). */
  pramanConfig: Readonly<PramanConfig>;
}

// ── Fixture ──────────────────────────────────────────────────────────

/**
 * Control tree test object with automatic UI5 control registry capture.
 *
 * @remarks
 * Extends `@playwright/test` base with one auto test-scoped fixture:
 *
 * `controlTreeCapture` — on teardown, executes a self-contained browser
 * script that serializes the UI5 element registry into a hierarchical tree.
 * The script does NOT require bridge injection — it accesses
 * `sap.ui.core.Element.registry` directly for reliability during failures.
 *
 * The result is attached as `'ui5-control-tree'` (application/json) for
 * the {@link ControlTreeReporter} and Playwright trace viewer to consume.
 *
 * @capability ui5.inspect
 *
 * @example
 * ```typescript
 * import { controlTreeTest } from '#fixtures/control-tree-fixtures.js';
 *
 * controlTreeTest('page loads with tree capture', async ({ page }) => {
 *   // controlTreeCapture is auto-active
 * });
 * ```
 */
export const controlTreeTest = base.extend<ControlTreeFixtures, ControlTreeDeps>({
  // Placeholder — provided by coreTest via mergeTests (PW-MERGE-1)
  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion -- PW-MERGE-1: placeholder overridden by mergeTests
  pramanConfig: [undefined!, { option: true, scope: 'worker' }],

  controlTreeCapture: [
    async (
      { page, pramanConfig }: { page: Page; pramanConfig: Readonly<PramanConfig> },
      use,
      testInfo,
    ) => {
      const captureConfig = pramanConfig.controlTreeCapture;

      // Disabled explicitly via config
      if (captureConfig?.enabled === false) {
        await use();
        return;
      }

      await use();

      // Teardown: capture control tree and attach unconditionally
      const log = createLogger('control-tree');
      try {
        const maxDepth = captureConfig?.maxDepth ?? 10;
        const maxControls = captureConfig?.maxControls ?? 5_000;

        const script = createControlTreeScript({ maxDepth, maxControls });
        const snapshot: unknown = await page.evaluate(script);

        if (snapshot !== null && snapshot !== undefined) {
          await testInfo.attach(CONTROL_TREE_ATTACHMENT_NAME, {
            contentType: CONTROL_TREE_CONTENT_TYPE,
            body: Buffer.from(JSON.stringify(snapshot, null, 2), 'utf8'),
          });
          log.debug('UI5 control tree attached to test artifacts');
        } else {
          log.debug('No UI5 controls found on page — skipping control tree attachment');
        }
      } catch (captureError: unknown) {
        // Non-fatal: page may have closed, navigated away, or UI5 not present
        log.debug({ err: captureError }, 'Control tree capture failed (non-fatal)');
      }
    },
    { auto: true },
  ],
});

export type { ControlTreeDeps as ControlTreeWorkerFixtures };
