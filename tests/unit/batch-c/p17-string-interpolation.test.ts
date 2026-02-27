/**
 * @license
 * Copyright (c) ZesTest 2025-2030. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0
 *
 * This file may contain AI-assisted code.
 * See LICENSE and NOTICE files for details.
 */

/**
 * P17: Verify string interpolation in page.evaluate() uses safe encoding.
 *
 * @remarks
 * The DomFirstStrategy previously used raw string interpolation in
 * page.evaluate() strings. This test verifies that special characters
 * in controlId and text values are safely handled using JSON.stringify
 * or the page.evaluate(fn, args) pattern.
 *
 * @module batch-c
 */

import type { Page } from '@playwright/test';
import { describe, expect, it, vi } from 'vitest';

import { DomFirstStrategy } from '#bridge/interaction-strategies/dom-first-strategy.js';

describe('P17: DomFirstStrategy special character safety', () => {
  /**
   * Creates a mock Page whose evaluate captures the arguments for inspection.
   */
  function createCapturePage(): {
    page: Page;
    getCapturedArgs: () => unknown[];
  } {
    const capturedArgs: unknown[] = [];
    const evaluateFn = vi.fn().mockImplementation((...args: unknown[]) => {
      capturedArgs.push(...args);
      return { success: true };
    });
    return {
      page: { evaluate: evaluateFn } as unknown as Page,
      getCapturedArgs: () => capturedArgs,
    };
  }

  describe('enterText — special characters in text value', () => {
    it('safely handles single quotes in text', async () => {
      const strategy = new DomFirstStrategy();
      const { page, getCapturedArgs } = createCapturePage();

      await strategy.enterText(page, 'input1', "it's a test");

      // If using string interpolation, 'it's a test' would break the JS string
      // The evaluate call should not produce a syntax error
      const args = getCapturedArgs();
      expect(args.length).toBeGreaterThan(0);

      // If a function is the first argument, special chars are safe via serialization
      // If a string is the first argument, it should use JSON.stringify for the text
      const firstArg = args[0];
      if (typeof firstArg === 'string') {
        // Verify the string doesn't contain raw unescaped single quotes in value position
        // The text "it's a test" should be JSON.stringify'd or properly escaped
        expect(firstArg).not.toContain("'it's a test'");
      }
      // If using page.evaluate(fn, args) pattern, the function is passed safely
    });

    it('safely handles backslashes in text', async () => {
      const strategy = new DomFirstStrategy();
      const { page, getCapturedArgs } = createCapturePage();

      await strategy.enterText(page, 'input1', 'path\\to\\file');

      const args = getCapturedArgs();
      const firstArg = args[0];
      if (typeof firstArg === 'string') {
        // Backslashes should be properly escaped or JSON.stringify'd
        expect(firstArg).not.toContain("'path\\to\\file'");
      }
    });

    it('safely handles newlines and control characters in text', async () => {
      const strategy = new DomFirstStrategy();
      const { page } = createCapturePage();

      // Should not throw — the text contains characters that break string literals
      await expect(
        strategy.enterText(page, 'input1', 'line1\nline2\ttab'),
      ).resolves.toBeUndefined();
    });

    it('uses page.evaluate(fn, args) pattern instead of string interpolation', async () => {
      const strategy = new DomFirstStrategy();
      const evaluateFn = vi.fn().mockResolvedValue({ success: true });
      const page = { evaluate: evaluateFn } as unknown as Page;

      await strategy.enterText(page, 'input1', 'hello');

      // After refactoring, the first argument should be a function, not a string
      const firstArg: unknown = evaluateFn.mock.calls[0]?.[0];
      expect(typeof firstArg).toBe('function');
    });
  });

  describe('press — special characters in controlId', () => {
    it('uses page.evaluate(fn, args) pattern instead of string interpolation', async () => {
      const strategy = new DomFirstStrategy();
      const evaluateFn = vi.fn().mockResolvedValue({ success: true });
      const page = { evaluate: evaluateFn } as unknown as Page;

      await strategy.press(page, 'btn1');

      // After refactoring, the first argument should be a function, not a string
      const firstArg: unknown = evaluateFn.mock.calls[0]?.[0];
      expect(typeof firstArg).toBe('function');
    });
  });

  describe('select — special characters in controlId and itemId', () => {
    it('uses page.evaluate(fn, args) pattern instead of string interpolation', async () => {
      const strategy = new DomFirstStrategy();
      const evaluateFn = vi.fn().mockResolvedValue({ success: true });
      const page = { evaluate: evaluateFn } as unknown as Page;

      await strategy.select(page, 'combo1', 'item1');

      // After refactoring, the first argument should be a function, not a string
      const firstArg: unknown = evaluateFn.mock.calls[0]?.[0];
      expect(typeof firstArg).toBe('function');
    });
  });
});
