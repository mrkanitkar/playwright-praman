/**
 * Stability fixtures — request interception and UI5 auto-wait.
 *
 * @remarks
 * Provides two auto test-scoped fixtures:
 * - `requestInterceptor` — blocks WalkMe/analytics via `page.route()`
 * - `ui5Stability` — calls `waitForUI5Stable()` on main frame navigations
 *
 * Dependencies from coreTest (via mergeTests):
 * - `page` — Playwright built-in
 * - `pramanConfig` — from coreTest worker fixtures
 *
 * PW-STAB-1: Navigation listener MUST check `frame === page.mainFrame()`
 * to avoid false triggers from iframes.
 *
 * @example
 * ```typescript
 * import { stabilityTest } from '#fixtures/stability-fixtures.js';
 *
 * const test = stabilityTest;
 *
 * test('page loads without WalkMe interference', async ({ page }) => {
 *   // requestInterceptor and ui5Stability are auto-enabled
 * });
 * ```
 *
 * @module fixtures
 */

import { test as base } from '@playwright/test';
import type { Frame, Page } from '@playwright/test';

import type { PramanConfig } from '#core/config/index.js';
import { DEFAULT_IGNORE_PATTERNS, DEFAULT_TIMEOUTS } from '#core/utils/constants.js';
import { waitForUI5Stable } from '#core/utils/wait-helpers.js';

/**
 * Stability fixture types.
 *
 * @remarks
 * Both fixtures are `void` because they are auto side-effect fixtures.
 *
 * @example
 * ```typescript
 * import type { StabilityFixtures } from '#fixtures/stability-fixtures.js';
 * ```
 */
export interface StabilityFixtures {
  /** Blocks WalkMe and analytics requests during test execution. */
  // eslint-disable-next-line @typescript-eslint/no-invalid-void-type -- Playwright fixtures use void for side-effect-only fixtures
  requestInterceptor: void;
  /** Waits for UI5 stability after main frame navigations. */
  // eslint-disable-next-line @typescript-eslint/no-invalid-void-type -- Playwright fixtures use void for side-effect-only fixtures
  ui5Stability: void;
}

/**
 * Dependency fixture types required by stability fixtures.
 *
 * @remarks
 * These come from coreTest via mergeTests and are declared here
 * as `{ option: true }` placeholders (PW-MERGE-1 pattern) so
 * they don't collide with the real definitions in coreTest.
 */
interface StabilityDeps {
  /** Validated, frozen Praman configuration (from coreTest). */
  pramanConfig: Readonly<PramanConfig>;
}

/**
 * Stability test object with auto request interception and UI5 wait.
 *
 * @remarks
 * Extends `@playwright/test` base with two auto test-scoped fixtures:
 *
 * 1. `requestInterceptor` — registers `page.route()` handlers that abort
 *    requests matching WalkMe/analytics patterns from
 *    {@link DEFAULT_IGNORE_PATTERNS} plus any user-configured
 *    `ignoreAutoWaitUrls`.
 *
 * 2. `ui5Stability` — registers a `framenavigated` listener that calls
 *    `waitForUI5Stable()` on main frame navigations. Skipped when
 *    `pramanConfig.skipStabilityWait` is `true`. Failures are caught
 *    silently to avoid breaking tests.
 *
 * @example
 * ```typescript
 * import { stabilityTest } from '#fixtures/stability-fixtures.js';
 *
 * stabilityTest('page loads stably', async ({ page }) => {
 *   // Both fixtures are auto-active
 * });
 * ```
 */
export const stabilityTest = base.extend<StabilityFixtures, StabilityDeps>({
  // Placeholder — provided by coreTest via mergeTests (PW-MERGE-1)
  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion -- PW-MERGE-1: placeholder overridden by mergeTests
  pramanConfig: [undefined!, { option: true, scope: 'worker' }],

  requestInterceptor: [
    async ({ page, pramanConfig }: { page: Page; pramanConfig: Readonly<PramanConfig> }, use) => {
      const patterns = [...DEFAULT_IGNORE_PATTERNS, ...pramanConfig.ignoreAutoWaitUrls];

      for (const pattern of patterns) {
        // security/detect-non-literal-regexp: pattern comes from config constants, not user input
        // eslint-disable-next-line security/detect-non-literal-regexp -- patterns are from trusted constants/config
        await page.route(new RegExp(pattern), async (route) => {
          await route.abort();
        });
      }

      await use();
    },
    { auto: true },
  ],

  ui5Stability: [
    async ({ page, pramanConfig }: { page: Page; pramanConfig: Readonly<PramanConfig> }, use) => {
      if (pramanConfig.skipStabilityWait) {
        await use();
        return;
      }

      const navigationListener = (frame: Frame): void => {
        if (frame !== page.mainFrame()) {
          return;
        }

        // Fire-and-forget: waitForUI5Stable failure is non-fatal (PW-STAB-1)
        void (async () => {
          try {
            await waitForUI5Stable(page as unknown as Parameters<typeof waitForUI5Stable>[0], {
              timeout: DEFAULT_TIMEOUTS.UI5_WAIT,
            });
          } catch {
            // Silently catch — stability wait failure should not break the test
          }
        })();
      };

      page.on('framenavigated', navigationListener);

      await use();

      // Teardown: remove listener
      page.off('framenavigated', navigationListener);
    },
    { auto: true },
  ],
});

export type { StabilityDeps as StabilityWorkerFixtures };
