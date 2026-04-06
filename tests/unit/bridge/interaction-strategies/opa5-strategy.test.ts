/**
 * @license
 * Copyright (c) ZesTest 2025-2030. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0
 *
 * This file may contain AI-assisted code.
 * See LICENSE and NOTICE files for details.
 */

/**
 * Tests for `src/bridge/interaction-strategies/opa5-strategy.ts`.
 *
 * @remarks
 * Validates the OPA5 interaction strategy that uses
 * RecordReplay.interactWithControl. After C1 fix, all methods use
 * function-form page.evaluate with typed args objects (P17 safe).
 */
import type { Page } from '@playwright/test';
import { describe, expect, it, vi } from 'vitest';

import { Opa5Strategy } from '#bridge/interaction-strategies/opa5-strategy.js';
import { ControlError } from '#core/errors/control-error.js';

describe('Opa5Strategy', () => {
  it('has name "opa5"', () => {
    const strategy = new Opa5Strategy();
    expect(strategy.name).toBe('opa5');
  });

  it('accepts custom config', () => {
    const strategy = new Opa5Strategy({
      interactionTimeout: 10_000,
      autoWait: false,
      debug: true,
    });
    expect(strategy.name).toBe('opa5');
  });

  it('calls page.evaluate for press with function form (P17)', async () => {
    const strategy = new Opa5Strategy();
    const evaluateFn = vi.fn().mockResolvedValue({ success: true });
    const page = { evaluate: evaluateFn } as unknown as Page;
    await strategy.press(page, 'btn1');
    expect(evaluateFn).toHaveBeenCalled();
    // Verify function-form: first arg is a function, second is an args object
    const call: [unknown, Record<string, unknown>] = evaluateFn.mock.calls[0] as [unknown, Record<string, unknown>];
    expect(typeof call[0]).toBe('function');
    expect(call[1]).toEqual(
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment -- expect.any() returns any
      expect.objectContaining({ controlId: 'btn1', ns: expect.any(String) }),
    );
  });

  it('press passes correct args including timeout and config flags', async () => {
    const strategy = new Opa5Strategy({
      interactionTimeout: 8000,
      autoWait: false,
      debug: true,
    });
    const evaluateFn = vi.fn().mockResolvedValue({ success: true });
    const page = { evaluate: evaluateFn } as unknown as Page;
    await strategy.press(page, 'btn1');
    const args = evaluateFn.mock.calls[0]?.[1] as Record<string, unknown>;
    expect(args).toEqual(
      expect.objectContaining({
        controlId: 'btn1',
        timeout: 8000,
        autoWait: false,
        debug: true,
      }),
    );
  });

  it('press throws ControlError when bridge returns failure (BF-007)', async () => {
    const strategy = new Opa5Strategy();
    const evaluateFn = vi
      .fn()
      .mockResolvedValue({ success: false, error: 'RecordReplay not available' });
    const page = { evaluate: evaluateFn } as unknown as Page;
    await expect(strategy.press(page, 'btn1')).rejects.toThrow(ControlError);
  });

  it('press error includes correct error code and details', async () => {
    const strategy = new Opa5Strategy();
    const evaluateFn = vi
      .fn()
      .mockResolvedValue({ success: false, error: 'Control not found: btn1' });
    const page = { evaluate: evaluateFn } as unknown as Page;
    try {
      await strategy.press(page, 'btn1');
      expect.unreachable('Should have thrown');
    } catch (error) {
      expect(error).toBeInstanceOf(ControlError);
      expect((error as ControlError).code).toBe('ERR_CONTROL_INTERACTION_FAILED');
      expect((error as ControlError).details).toHaveProperty('strategy', 'opa5');
    }
  });

  it('calls page.evaluate for enterText with function form (P17)', async () => {
    const strategy = new Opa5Strategy();
    const evaluateFn = vi.fn().mockResolvedValue({ success: true });
    const page = { evaluate: evaluateFn } as unknown as Page;
    await strategy.enterText(page, 'input1', 'hello');
    expect(evaluateFn).toHaveBeenCalled();
    const [fn, args] = evaluateFn.mock.calls[0] as [unknown, unknown];
    expect(typeof fn).toBe('function');
    expect(args).toEqual(
      expect.objectContaining({ controlId: 'input1', text: 'hello' }),
    );
  });

  it('enterText throws ControlError on failure (BF-007)', async () => {
    const strategy = new Opa5Strategy();
    const evaluateFn = vi
      .fn()
      .mockResolvedValue({ success: false, error: 'RecordReplay not available' });
    const page = { evaluate: evaluateFn } as unknown as Page;
    await expect(strategy.enterText(page, 'input1', 'hello')).rejects.toThrow(ControlError);
  });

  it('calls page.evaluate for select with function form (P17)', async () => {
    const strategy = new Opa5Strategy();
    const evaluateFn = vi.fn().mockResolvedValue({ success: true });
    const page = { evaluate: evaluateFn } as unknown as Page;
    await strategy.select(page, 'combo1', 'item1');
    expect(evaluateFn).toHaveBeenCalled();
    const [fn, args] = evaluateFn.mock.calls[0] as [unknown, unknown];
    expect(typeof fn).toBe('function');
    expect(args).toEqual(
      expect.objectContaining({ controlId: 'combo1', itemId: 'item1' }),
    );
  });

  it('select throws ControlError on failure (BF-007)', async () => {
    const strategy = new Opa5Strategy();
    const evaluateFn = vi
      .fn()
      .mockResolvedValue({ success: false, error: 'RecordReplay not available' });
    const page = { evaluate: evaluateFn } as unknown as Page;
    await expect(strategy.select(page, 'combo1', 'item1')).rejects.toThrow(ControlError);
  });

  it('press uses fallback message when error is undefined', async () => {
    const strategy = new Opa5Strategy();
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
    const strategy = new Opa5Strategy();
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
    const strategy = new Opa5Strategy();
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

  describe('config flags are passed correctly via args', () => {
    it('press passes autoWait=false in args', async () => {
      const strategy = new Opa5Strategy({ autoWait: false });
      const evaluateFn = vi.fn().mockResolvedValue({ success: true });
      const page = { evaluate: evaluateFn } as unknown as Page;
      await strategy.press(page, 'btn1');
      const args = evaluateFn.mock.calls[0]?.[1] as Record<string, unknown>;
      expect(args).toHaveProperty('autoWait', false);
    });

    it('enterText passes autoWait=false in args', async () => {
      const strategy = new Opa5Strategy({ autoWait: false });
      const evaluateFn = vi.fn().mockResolvedValue({ success: true });
      const page = { evaluate: evaluateFn } as unknown as Page;
      await strategy.enterText(page, 'input1', 'hello');
      const args = evaluateFn.mock.calls[0]?.[1] as Record<string, unknown>;
      expect(args).toHaveProperty('autoWait', false);
    });

    it('select passes autoWait=false in args', async () => {
      const strategy = new Opa5Strategy({ autoWait: false });
      const evaluateFn = vi.fn().mockResolvedValue({ success: true });
      const page = { evaluate: evaluateFn } as unknown as Page;
      await strategy.select(page, 'combo1', 'item1');
      const args = evaluateFn.mock.calls[0]?.[1] as Record<string, unknown>;
      expect(args).toHaveProperty('autoWait', false);
    });
  });

  describe('debug flag is passed via args', () => {
    it('press passes debug=true in args', async () => {
      const strategy = new Opa5Strategy({ debug: true });
      const evaluateFn = vi.fn().mockResolvedValue({ success: true });
      const page = { evaluate: evaluateFn } as unknown as Page;
      await strategy.press(page, 'btn1');
      const args = evaluateFn.mock.calls[0]?.[1] as Record<string, unknown>;
      expect(args).toHaveProperty('debug', true);
    });

    it('enterText passes debug=true in args', async () => {
      const strategy = new Opa5Strategy({ debug: true });
      const evaluateFn = vi.fn().mockResolvedValue({ success: true });
      const page = { evaluate: evaluateFn } as unknown as Page;
      await strategy.enterText(page, 'input1', 'hello');
      const args = evaluateFn.mock.calls[0]?.[1] as Record<string, unknown>;
      expect(args).toHaveProperty('debug', true);
    });

    it('select passes debug=true in args', async () => {
      const strategy = new Opa5Strategy({ debug: true });
      const evaluateFn = vi.fn().mockResolvedValue({ success: true });
      const page = { evaluate: evaluateFn } as unknown as Page;
      await strategy.select(page, 'combo1', 'item1');
      const args = evaluateFn.mock.calls[0]?.[1] as Record<string, unknown>;
      expect(args).toHaveProperty('debug', true);
    });

    it('press failure path with debug=true still throws ControlError', async () => {
      const strategy = new Opa5Strategy({ debug: true });
      const evaluateFn = vi.fn().mockResolvedValue({ success: false, error: 'test error' });
      const page = { evaluate: evaluateFn } as unknown as Page;
      await expect(strategy.press(page, 'btn1')).rejects.toThrow(ControlError);
    });

    it('enterText failure path with debug=true still throws ControlError', async () => {
      const strategy = new Opa5Strategy({ debug: true });
      const evaluateFn = vi.fn().mockResolvedValue({ success: false, error: 'test error' });
      const page = { evaluate: evaluateFn } as unknown as Page;
      await expect(strategy.enterText(page, 'input1', 'hello')).rejects.toThrow(ControlError);
    });

    it('select failure path with debug=true still throws ControlError', async () => {
      const strategy = new Opa5Strategy({ debug: true });
      const evaluateFn = vi.fn().mockResolvedValue({ success: false, error: 'test error' });
      const page = { evaluate: evaluateFn } as unknown as Page;
      await expect(strategy.select(page, 'combo1', 'item1')).rejects.toThrow(ControlError);
    });
  });

  describe('combined autoWait=false and debug=true', () => {
    it('press with autoWait=false and debug=true passes both flags in args', async () => {
      const strategy = new Opa5Strategy({ autoWait: false, debug: true });
      const evaluateFn = vi.fn().mockResolvedValue({ success: true });
      const page = { evaluate: evaluateFn } as unknown as Page;
      await strategy.press(page, 'btn1');
      const args = evaluateFn.mock.calls[0]?.[1] as Record<string, unknown>;
      expect(args).toHaveProperty('autoWait', false);
      expect(args).toHaveProperty('debug', true);
    });

    it('enterText with autoWait=false and debug=true passes both flags in args', async () => {
      const strategy = new Opa5Strategy({ autoWait: false, debug: true });
      const evaluateFn = vi.fn().mockResolvedValue({ success: true });
      const page = { evaluate: evaluateFn } as unknown as Page;
      await strategy.enterText(page, 'input1', 'hello');
      const args = evaluateFn.mock.calls[0]?.[1] as Record<string, unknown>;
      expect(args).toHaveProperty('autoWait', false);
      expect(args).toHaveProperty('debug', true);
    });

    it('select with autoWait=false and debug=true passes both flags in args', async () => {
      const strategy = new Opa5Strategy({ autoWait: false, debug: true });
      const evaluateFn = vi.fn().mockResolvedValue({ success: true });
      const page = { evaluate: evaluateFn } as unknown as Page;
      await strategy.select(page, 'combo1', 'item1');
      const args = evaluateFn.mock.calls[0]?.[1] as Record<string, unknown>;
      expect(args).toHaveProperty('autoWait', false);
      expect(args).toHaveProperty('debug', true);
    });
  });
});
