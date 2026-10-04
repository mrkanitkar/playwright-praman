/**
 * @license
 * Copyright (c) ZesTest 2025-2030. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0
 *
 * This file may contain AI-assisted code.
 * See LICENSE and NOTICE files for details.
 */

/**
 * Tests for `src/fixtures/visual-regression-fixtures.ts`.
 *
 * @remarks
 * Verifies that `visualRegressionTest` is a valid Playwright fixture extension,
 * `FLP_CHROME_SELECTORS` has the expected entries, and the type interfaces
 * expose the correct properties.
 *
 * @module fixtures
 */

import type { Locator } from '@playwright/test';
import { describe, expect, expectTypeOf, it, vi } from 'vitest';

const mockToHaveScreenshot = vi.fn().mockResolvedValue(undefined);
const mockLocator = vi.fn().mockImplementation((sel: string) => ({ selector: sel }));

vi.mock('@playwright/test', () => ({
  test: {
    extend: vi.fn().mockImplementation((fixtures: Record<string, unknown>) => ({
      extend: vi.fn(),
      _fixtureDefinitions: fixtures,
    })),
  },
  expect: vi.fn().mockReturnValue({
    toHaveScreenshot: mockToHaveScreenshot,
  }),
}));

import type {
  VisualRegressionFixture,
  VisualRegressionFixtures,
  VisualRegressionOptions,
} from '../../../src/fixtures/visual-regression-fixtures.js';

describe('visual-regression-fixtures', () => {
  it('visualRegressionTest is a valid Playwright fixture extension', async () => {
    const { visualRegressionTest } = await import(
      '../../../src/fixtures/visual-regression-fixtures.js'
    );
    expect(visualRegressionTest).toBeDefined();
    expect(typeof visualRegressionTest.extend).toBe('function');
  });

  it('defines a visualRegression fixture key', async () => {
    const { visualRegressionTest } = await import(
      '../../../src/fixtures/visual-regression-fixtures.js'
    );
    const defs = (
      visualRegressionTest as unknown as { _fixtureDefinitions: Record<string, unknown> }
    )._fixtureDefinitions;
    expect(defs).toHaveProperty('visualRegression');
  });

  it('FLP_CHROME_SELECTORS has 3 entries', async () => {
    const { FLP_CHROME_SELECTORS } = await import(
      '../../../src/fixtures/visual-regression-fixtures.js'
    );
    expect(FLP_CHROME_SELECTORS).toHaveLength(3);
    expect(FLP_CHROME_SELECTORS).toContain('#shell-header');
    expect(FLP_CHROME_SELECTORS).toContain('.sapUshellShellHead');
    expect(FLP_CHROME_SELECTORS).toContain('#meAreaHeaderButton');
  });

  it('VisualRegressionFixtures type has visualRegression property', () => {
    expectTypeOf<VisualRegressionFixtures>().toHaveProperty('visualRegression');
  });

  it('VisualRegressionFixture type has compareScreenshot and maskFLPChrome', () => {
    expectTypeOf<VisualRegressionFixture>().toHaveProperty('compareScreenshot');
    expectTypeOf<VisualRegressionFixture>().toHaveProperty('maskFLPChrome');
  });

  it('VisualRegressionOptions type has threshold property', () => {
    expectTypeOf<VisualRegressionOptions>().toHaveProperty('threshold');
  });

  describe('fixture body', () => {
    async function runFixture(): Promise<VisualRegressionFixture> {
      const { visualRegressionTest } = await import(
        '../../../src/fixtures/visual-regression-fixtures.js'
      );
      const defs = (
        visualRegressionTest as unknown as { _fixtureDefinitions: Record<string, unknown> }
      )._fixtureDefinitions;
      const fn = defs['visualRegression'] as (
        deps: Record<string, unknown>,
        use: (v: unknown) => Promise<void>,
      ) => Promise<void>;

      const fakePage = { locator: mockLocator };
      let captured: unknown;
      await fn({ page: fakePage }, async (value) => {
        captured = value;
        await Promise.resolve();
      });
      return captured as VisualRegressionFixture;
    }

    it('compareScreenshot calls toHaveScreenshot with defaults', async () => {
      mockToHaveScreenshot.mockClear();
      const fixture = await runFixture();
      await fixture.compareScreenshot('test.png');

      expect(mockToHaveScreenshot).toHaveBeenCalledOnce();
      expect(mockToHaveScreenshot).toHaveBeenCalledWith('test.png', {
        threshold: 0.2,
        mask: [],
        maskColor: '#FF00FF',
        fullPage: false,
      });
    });

    it('compareScreenshot forwards custom options', async () => {
      mockToHaveScreenshot.mockClear();
      const fixture = await runFixture();
      const customMask = [{ selector: '#custom' }];
      await fixture.compareScreenshot('custom.png', {
        threshold: 0.1,
        maxDiffPixels: 50,
        maxDiffPixelRatio: 0.01,
        mask: customMask as unknown as Locator[],
        maskColor: '#000000',
        fullPage: true,
      });

      expect(mockToHaveScreenshot).toHaveBeenCalledWith('custom.png', {
        threshold: 0.1,
        maxDiffPixels: 50,
        maxDiffPixelRatio: 0.01,
        mask: customMask,
        maskColor: '#000000',
        fullPage: true,
      });
    });

    it('maskFLPChrome returns 3 locators', async () => {
      mockLocator.mockClear();
      const fixture = await runFixture();
      const locators = fixture.maskFLPChrome();

      expect(locators).toHaveLength(3);
      expect(mockLocator).toHaveBeenCalledTimes(3);
      expect(mockLocator).toHaveBeenCalledWith('#shell-header');
      expect(mockLocator).toHaveBeenCalledWith('.sapUshellShellHead');
      expect(mockLocator).toHaveBeenCalledWith('#meAreaHeaderButton');
    });
  });
});
