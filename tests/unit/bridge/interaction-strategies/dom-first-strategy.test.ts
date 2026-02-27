/**
 * @license
 * Copyright (c) ZesTest 2025-2030. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0
 *
 * This file may contain AI-assisted code.
 * See LICENSE and NOTICE files for details.
 */

/**
 * Tests for `src/bridge/interaction-strategies/dom-first-strategy.ts`.
 *
 * @remarks
 * Validates the DOM-first interaction strategy that prioritizes
 * DOM events with UI5 fallback.
 */
import type { Page } from '@playwright/test';
import { describe, expect, it, vi } from 'vitest';

import { DomFirstStrategy } from '#bridge/interaction-strategies/dom-first-strategy.js';
import { ControlError } from '#core/errors/control-error.js';

describe('DomFirstStrategy', () => {
  it('has name "dom-first"', () => {
    const strategy = new DomFirstStrategy();
    expect(strategy.name).toBe('dom-first');
  });

  it('calls page.evaluate for press', async () => {
    const strategy = new DomFirstStrategy();
    const evaluateFn = vi.fn().mockResolvedValue({ success: true });
    const page = { evaluate: evaluateFn } as unknown as Page;
    await strategy.press(page, 'btn1');
    expect(evaluateFn).toHaveBeenCalled();
  });

  it('press uses function-based evaluate (P17 safe serialization)', async () => {
    const strategy = new DomFirstStrategy();
    const evaluateFn = vi.fn().mockResolvedValue({ success: true });
    const page = { evaluate: evaluateFn } as unknown as Page;
    await strategy.press(page, 'btn1');
    // After P17 refactoring, the first argument is a function, not a string
    const firstArg: unknown = evaluateFn.mock.calls[0]?.[0];
    expect(typeof firstArg).toBe('function');
    // The function source should contain both firePress and fireSelect (BF-005)
    const fnSource = (firstArg as (...args: never[]) => unknown).toString();
    expect(fnSource).toContain('firePress');
    expect(fnSource).toContain('fireSelect');
    // firePress should appear before fireSelect, and fireSelect before fireTap
    const pressIdx = fnSource.indexOf('firePress');
    const selectIdx = fnSource.indexOf('fireSelect');
    const tapIdx = fnSource.indexOf('fireTap');
    expect(pressIdx).toBeLessThan(selectIdx);
    expect(selectIdx).toBeLessThan(tapIdx);
  });

  it('press throws ControlError when bridge returns failure (BF-007)', async () => {
    const strategy = new DomFirstStrategy();
    const evaluateFn = vi.fn().mockResolvedValue({ success: false, error: 'Bridge not available' });
    const page = { evaluate: evaluateFn } as unknown as Page;
    await expect(strategy.press(page, 'btn1')).rejects.toThrow(ControlError);
  });

  it('calls page.evaluate for enterText', async () => {
    const strategy = new DomFirstStrategy();
    const evaluateFn = vi.fn().mockResolvedValue({ success: true });
    const page = { evaluate: evaluateFn } as unknown as Page;
    await strategy.enterText(page, 'input1', 'hello');
    expect(evaluateFn).toHaveBeenCalled();
  });

  it('enterText throws ControlError on failure (BF-007)', async () => {
    const strategy = new DomFirstStrategy();
    const evaluateFn = vi.fn().mockResolvedValue({ success: false, error: 'Bridge not available' });
    const page = { evaluate: evaluateFn } as unknown as Page;
    await expect(strategy.enterText(page, 'input1', 'hello')).rejects.toThrow(ControlError);
  });

  it('calls page.evaluate for select', async () => {
    const strategy = new DomFirstStrategy();
    const evaluateFn = vi.fn().mockResolvedValue({ success: true });
    const page = { evaluate: evaluateFn } as unknown as Page;
    await strategy.select(page, 'combo1', 'item1');
    expect(evaluateFn).toHaveBeenCalled();
  });

  it('select throws ControlError on failure (BF-007)', async () => {
    const strategy = new DomFirstStrategy();
    const evaluateFn = vi
      .fn()
      .mockResolvedValue({ success: false, error: 'Control not found: combo1' });
    const page = { evaluate: evaluateFn } as unknown as Page;
    await expect(strategy.select(page, 'combo1', 'item1')).rejects.toThrow(ControlError);
  });

  it('press uses fallback message when error is undefined', async () => {
    const strategy = new DomFirstStrategy();
    const evaluateFn = vi.fn().mockResolvedValue({ success: false });
    const page = { evaluate: evaluateFn } as unknown as Page;
    try {
      await strategy.press(page, 'btn1');
      expect.unreachable('Should have thrown');
    } catch (error) {
      expect(error).toBeInstanceOf(ControlError);
      expect((error as ControlError).message).toContain('Press failed on control: btn1');
    }
  });

  it('enterText uses fallback message when error is undefined', async () => {
    const strategy = new DomFirstStrategy();
    const evaluateFn = vi.fn().mockResolvedValue({ success: false });
    const page = { evaluate: evaluateFn } as unknown as Page;
    try {
      await strategy.enterText(page, 'input1', 'hello');
      expect.unreachable('Should have thrown');
    } catch (error) {
      expect(error).toBeInstanceOf(ControlError);
      expect((error as ControlError).message).toContain('Enter text failed on control: input1');
    }
  });

  it('select uses fallback message when error is undefined', async () => {
    const strategy = new DomFirstStrategy();
    const evaluateFn = vi.fn().mockResolvedValue({ success: false });
    const page = { evaluate: evaluateFn } as unknown as Page;
    try {
      await strategy.select(page, 'combo1', 'item1');
      expect.unreachable('Should have thrown');
    } catch (error) {
      expect(error).toBeInstanceOf(ControlError);
      expect((error as ControlError).message).toContain('Select failed on control: combo1');
    }
  });
});
