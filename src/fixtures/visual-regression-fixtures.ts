/**
 * @license
 * Copyright (c) ZesTest 2025-2030. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0
 *
 * This file may contain AI-assisted code.
 * See LICENSE and NOTICE files for details.
 */

/**
 * Visual regression fixture — screenshot comparison with FLP chrome masking.
 *
 * @remarks
 * Wraps Playwright's `toHaveScreenshot()` with SAP-aware defaults:
 * configurable threshold, optional FLP shell masking, and a magenta
 * mask colour that stands out in diff images.
 *
 * The `maskFLPChrome()` helper returns locators for the three standard
 * Fiori Launchpad shell elements (header bar, shell head, me-area button)
 * so they can be excluded from pixel comparisons — these elements change
 * between sessions and environments.
 *
 * @example
 * ```typescript
 * import { visualRegressionTest } from 'playwright-praman';
 *
 * visualRegressionTest('PO list visual', async ({ visualRegression }) => {
 *   await visualRegression.compareScreenshot('po-list.png', {
 *     mask: visualRegression.maskFLPChrome(),
 *   });
 * });
 * ```
 *
 * @module fixtures/visual-regression-fixtures
 */

import type { Locator } from '@playwright/test';
import { expect, test as base } from '@playwright/test';

// ── Constants ─────────────────────────────────────────────────────────

/**
 * CSS selectors for standard Fiori Launchpad shell chrome elements.
 *
 * @remarks
 * These elements render session-specific content (user avatar, notifications
 * badge, dynamic header text) that causes false-positive visual diffs.
 * Pass `maskFLPChrome()` into `compareScreenshot` to exclude them.
 */
export const FLP_CHROME_SELECTORS = [
  '#shell-header',
  '.sapUshellShellHead',
  '#meAreaHeaderButton',
] as const;

// ── Types ─────────────────────────────────────────────────────────────

/**
 * Options for visual regression screenshot comparison.
 *
 * @capability visualRegression.options
 *
 * @example
 * ```typescript
 * const opts: VisualRegressionOptions = {
 *   threshold: 0.1,
 *   mask: visualRegression.maskFLPChrome(),
 *   fullPage: true,
 * };
 * ```
 */
export interface VisualRegressionOptions {
  /** Per-pixel colour distance threshold (0-1). Default: 0.2. */
  threshold?: number;
  /** Maximum number of different pixels before the assertion fails. */
  maxDiffPixels?: number;
  /** Maximum ratio of different pixels (0-1) before the assertion fails. */
  maxDiffPixelRatio?: number;
  /** Locators to mask with a solid colour rectangle. */
  mask?: Locator[];
  /** Colour used to fill masked regions. Default: `'#FF00FF'`. */
  maskColor?: string;
  /** Capture the full scrollable page instead of the viewport. Default: false. */
  fullPage?: boolean;
}

/**
 * Visual regression fixture API.
 *
 * @capability visualRegression.fixture
 *
 * @example
 * ```typescript
 * await visualRegression.compareScreenshot('overview.png', {
 *   mask: visualRegression.maskFLPChrome(),
 *   threshold: 0.15,
 * });
 * ```
 */
export interface VisualRegressionFixture {
  /**
   * Compares a screenshot of the current page against a stored baseline.
   *
   * @param name - Snapshot file name (e.g. `'po-list.png'`).
   * @param options - Optional comparison settings.
   *
   * @example
   * ```typescript
   * await visualRegression.compareScreenshot('login-page.png');
   * ```
   */
  compareScreenshot(name: string, options?: VisualRegressionOptions): Promise<void>;

  /**
   * Returns locators for the three standard FLP shell chrome elements.
   *
   * @remarks
   * Pass the returned array as the `mask` option to `compareScreenshot`
   * to exclude session-specific shell content from visual comparisons.
   *
   * @example
   * ```typescript
   * const flpMask = visualRegression.maskFLPChrome();
   * await visualRegression.compareScreenshot('detail.png', { mask: flpMask });
   * ```
   */
  maskFLPChrome(): Locator[];
}

/**
 * Playwright fixture map for `visualRegressionTest`.
 *
 * @capability visualRegression.fixture
 *
 * @example
 * ```typescript
 * import { visualRegressionTest } from 'playwright-praman';
 *
 * visualRegressionTest('visual check', async ({ visualRegression }) => {
 *   await visualRegression.compareScreenshot('home.png');
 * });
 * ```
 */
export interface VisualRegressionFixtures {
  visualRegression: VisualRegressionFixture;
}

// ── Default values ────────────────────────────────────────────────────

/** Default per-pixel threshold for screenshot comparison. */
const DEFAULT_THRESHOLD = 0.2;

/** Default mask colour — magenta stands out clearly in diff images. */
const DEFAULT_MASK_COLOR = '#FF00FF';

// ── Fixture extension ─────────────────────────────────────────────────

/**
 * Standalone visual regression test object.
 *
 * @remarks
 * Extends Playwright's base `test` with a `visualRegression` fixture
 * providing `compareScreenshot` and `maskFLPChrome`.
 *
 * @capability visualRegression.fixture
 *
 * @example
 * ```typescript
 * import { visualRegressionTest } from 'playwright-praman';
 *
 * visualRegressionTest('object page visual', async ({ visualRegression }) => {
 *   await visualRegression.compareScreenshot('object-page.png', {
 *     mask: visualRegression.maskFLPChrome(),
 *     fullPage: true,
 *   });
 * });
 * ```
 */
export const visualRegressionTest = base.extend<VisualRegressionFixtures>({
  visualRegression: async ({ page }, use) => {
    const fixture: VisualRegressionFixture = {
      async compareScreenshot(
        name: string,
        options?: VisualRegressionOptions,
      ): Promise<void> {
        const mask = options?.mask ?? [];
        const screenshotOptions: Record<string, unknown> = {
          threshold: options?.threshold ?? DEFAULT_THRESHOLD,
          mask,
          maskColor: options?.maskColor ?? DEFAULT_MASK_COLOR,
          fullPage: options?.fullPage ?? false,
        };
        if (options?.maxDiffPixels !== undefined) {
          screenshotOptions['maxDiffPixels'] = options.maxDiffPixels;
        }
        if (options?.maxDiffPixelRatio !== undefined) {
          screenshotOptions['maxDiffPixelRatio'] = options.maxDiffPixelRatio;
        }
        await expect(page).toHaveScreenshot(name, screenshotOptions);
      },
      maskFLPChrome(): Locator[] {
        return FLP_CHROME_SELECTORS.map((sel) => page.locator(sel));
      },
    };
    await use(fixture);
  },
});
