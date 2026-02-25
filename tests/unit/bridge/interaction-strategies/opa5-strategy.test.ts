/**
 * Tests for `src/bridge/interaction-strategies/opa5-strategy.ts`.
 *
 * @remarks
 * Validates the OPA5 interaction strategy that uses
 * RecordReplay.interactWithControl.
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

  it('calls page.evaluate for press', async () => {
    const strategy = new Opa5Strategy();
    const evaluateFn = vi.fn().mockResolvedValue({ success: true });
    const page = { evaluate: evaluateFn } as unknown as Page;
    await strategy.press(page, 'btn1');
    expect(evaluateFn).toHaveBeenCalled();
  });

  it('press fallback fires both firePress and fireSelect without early return (BF-005)', async () => {
    const strategy = new Opa5Strategy();
    const evaluateFn = vi.fn().mockResolvedValue({ success: true });
    const page = { evaluate: evaluateFn } as unknown as Page;
    await strategy.press(page, 'btn1');
    const script = evaluateFn.mock.calls[0]?.[0] as string;
    expect(script).toContain('firePress');
    expect(script).toContain('fireSelect');
    const pressBlock = script.indexOf('ctrl.firePress');
    const selectBlock = script.indexOf('ctrl.fireSelect');
    expect(pressBlock).toBeLessThan(selectBlock);
    // No early return between firePress and fireSelect
    const betweenPressAndSelect = script.slice(pressBlock, selectBlock);
    expect(betweenPressAndSelect).not.toContain('return {');
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

  it('calls page.evaluate for enterText', async () => {
    const strategy = new Opa5Strategy();
    const evaluateFn = vi.fn().mockResolvedValue({ success: true });
    const page = { evaluate: evaluateFn } as unknown as Page;
    await strategy.enterText(page, 'input1', 'hello');
    expect(evaluateFn).toHaveBeenCalled();
  });

  it('enterText throws ControlError on failure (BF-007)', async () => {
    const strategy = new Opa5Strategy();
    const evaluateFn = vi
      .fn()
      .mockResolvedValue({ success: false, error: 'RecordReplay not available' });
    const page = { evaluate: evaluateFn } as unknown as Page;
    await expect(strategy.enterText(page, 'input1', 'hello')).rejects.toThrow(ControlError);
  });

  it('calls page.evaluate for select', async () => {
    const strategy = new Opa5Strategy();
    const evaluateFn = vi.fn().mockResolvedValue({ success: true });
    const page = { evaluate: evaluateFn } as unknown as Page;
    await strategy.select(page, 'combo1', 'item1');
    expect(evaluateFn).toHaveBeenCalled();
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

  describe('autoWait=false branch', () => {
    it('press omits autoWaiter code when autoWait is false', async () => {
      const strategy = new Opa5Strategy({ autoWait: false });
      const evaluateFn = vi.fn().mockResolvedValue({ success: true });
      const page = { evaluate: evaluateFn } as unknown as Page;
      await strategy.press(page, 'btn1');
      const script = evaluateFn.mock.calls[0]?.[0] as string;
      expect(script).not.toContain('autoWaiter');
      expect(script).not.toContain('hasToWait');
    });

    it('enterText omits autoWaiter code when autoWait is false', async () => {
      const strategy = new Opa5Strategy({ autoWait: false });
      const evaluateFn = vi.fn().mockResolvedValue({ success: true });
      const page = { evaluate: evaluateFn } as unknown as Page;
      await strategy.enterText(page, 'input1', 'hello');
      const script = evaluateFn.mock.calls[0]?.[0] as string;
      expect(script).not.toContain('autoWaiter');
      expect(script).not.toContain('hasToWait');
    });

    it('select omits autoWaiter code when autoWait is false', async () => {
      const strategy = new Opa5Strategy({ autoWait: false });
      const evaluateFn = vi.fn().mockResolvedValue({ success: true });
      const page = { evaluate: evaluateFn } as unknown as Page;
      await strategy.select(page, 'combo1', 'item1');
      const script = evaluateFn.mock.calls[0]?.[0] as string;
      expect(script).not.toContain('autoWaiter');
      expect(script).not.toContain('hasToWait');
    });
  });

  describe('debug=true branch', () => {
    it('press includes console.log when debug is true', async () => {
      const strategy = new Opa5Strategy({ debug: true });
      const evaluateFn = vi.fn().mockResolvedValue({ success: true });
      const page = { evaluate: evaluateFn } as unknown as Page;
      await strategy.press(page, 'btn1');
      const script = evaluateFn.mock.calls[0]?.[0] as string;
      expect(script).toContain("console.log('[praman:opa5]'");
      expect(script).toContain("'press'");
    });

    it('enterText includes console.log when debug is true', async () => {
      const strategy = new Opa5Strategy({ debug: true });
      const evaluateFn = vi.fn().mockResolvedValue({ success: true });
      const page = { evaluate: evaluateFn } as unknown as Page;
      await strategy.enterText(page, 'input1', 'hello');
      const script = evaluateFn.mock.calls[0]?.[0] as string;
      expect(script).toContain("console.log('[praman:opa5]'");
      expect(script).toContain("'enterText'");
    });

    it('select includes console.log when debug is true', async () => {
      const strategy = new Opa5Strategy({ debug: true });
      const evaluateFn = vi.fn().mockResolvedValue({ success: true });
      const page = { evaluate: evaluateFn } as unknown as Page;
      await strategy.select(page, 'combo1', 'item1');
      const script = evaluateFn.mock.calls[0]?.[0] as string;
      expect(script).toContain("console.log('[praman:opa5]'");
      expect(script).toContain("'select'");
    });

    it('press failure path includes debug console.log', async () => {
      const strategy = new Opa5Strategy({ debug: true });
      const evaluateFn = vi.fn().mockResolvedValue({ success: false, error: 'test error' });
      const page = { evaluate: evaluateFn } as unknown as Page;
      await expect(strategy.press(page, 'btn1')).rejects.toThrow(ControlError);
      const script = evaluateFn.mock.calls[0]?.[0] as string;
      // Debug logging appears in both success and catch blocks
      const debugLogCount = (script.match(/console\.log/g) ?? []).length;
      expect(debugLogCount).toBe(2);
    });

    it('enterText failure path includes debug console.log', async () => {
      const strategy = new Opa5Strategy({ debug: true });
      const evaluateFn = vi.fn().mockResolvedValue({ success: false, error: 'test error' });
      const page = { evaluate: evaluateFn } as unknown as Page;
      await expect(strategy.enterText(page, 'input1', 'hello')).rejects.toThrow(ControlError);
      const script = evaluateFn.mock.calls[0]?.[0] as string;
      const debugLogCount = (script.match(/console\.log/g) ?? []).length;
      expect(debugLogCount).toBe(2);
    });

    it('select failure path includes debug console.log', async () => {
      const strategy = new Opa5Strategy({ debug: true });
      const evaluateFn = vi.fn().mockResolvedValue({ success: false, error: 'test error' });
      const page = { evaluate: evaluateFn } as unknown as Page;
      await expect(strategy.select(page, 'combo1', 'item1')).rejects.toThrow(ControlError);
      const script = evaluateFn.mock.calls[0]?.[0] as string;
      const debugLogCount = (script.match(/console\.log/g) ?? []).length;
      expect(debugLogCount).toBe(2);
    });
  });

  describe('combined autoWait=false and debug=true', () => {
    it('press with autoWait=false and debug=true covers both branches', async () => {
      const strategy = new Opa5Strategy({ autoWait: false, debug: true });
      const evaluateFn = vi.fn().mockResolvedValue({ success: true });
      const page = { evaluate: evaluateFn } as unknown as Page;
      await strategy.press(page, 'btn1');
      const script = evaluateFn.mock.calls[0]?.[0] as string;
      expect(script).not.toContain('autoWaiter');
      expect(script).toContain("console.log('[praman:opa5]'");
    });

    it('enterText with autoWait=false and debug=true covers both branches', async () => {
      const strategy = new Opa5Strategy({ autoWait: false, debug: true });
      const evaluateFn = vi.fn().mockResolvedValue({ success: true });
      const page = { evaluate: evaluateFn } as unknown as Page;
      await strategy.enterText(page, 'input1', 'hello');
      const script = evaluateFn.mock.calls[0]?.[0] as string;
      expect(script).not.toContain('autoWaiter');
      expect(script).toContain("console.log('[praman:opa5]'");
    });

    it('select with autoWait=false and debug=true covers both branches', async () => {
      const strategy = new Opa5Strategy({ autoWait: false, debug: true });
      const evaluateFn = vi.fn().mockResolvedValue({ success: true });
      const page = { evaluate: evaluateFn } as unknown as Page;
      await strategy.select(page, 'combo1', 'item1');
      const script = evaluateFn.mock.calls[0]?.[0] as string;
      expect(script).not.toContain('autoWaiter');
      expect(script).toContain("console.log('[praman:opa5]'");
    });
  });
});
