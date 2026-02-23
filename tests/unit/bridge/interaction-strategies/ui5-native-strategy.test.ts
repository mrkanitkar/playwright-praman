/**
 * Tests for `src/bridge/interaction-strategies/ui5-native-strategy.ts`.
 *
 * @remarks
 * Validates the UI5-native interaction strategy that uses direct
 * UI5 fire* methods with fallback chain.
 */
import type { Page } from '@playwright/test';
import { describe, expect, it, vi } from 'vitest';

import { UI5NativeStrategy } from '#bridge/interaction-strategies/ui5-native-strategy.js';
import { ControlError } from '#core/errors/control-error.js';

describe('UI5NativeStrategy', () => {
  it('has name "ui5-native"', () => {
    const strategy = new UI5NativeStrategy();
    expect(strategy.name).toBe('ui5-native');
  });

  it('calls page.evaluate for press', async () => {
    const strategy = new UI5NativeStrategy();
    const evaluateFn = vi.fn().mockResolvedValue({ success: true });
    const page = { evaluate: evaluateFn } as unknown as Page;
    await strategy.press(page, 'btn1');
    expect(evaluateFn).toHaveBeenCalled();
  });

  it('press script fires both firePress and fireSelect (BF-005)', async () => {
    const strategy = new UI5NativeStrategy();
    const evaluateFn = vi.fn().mockResolvedValue({ success: true });
    const page = { evaluate: evaluateFn } as unknown as Page;
    await strategy.press(page, 'btn1');
    const script = evaluateFn.mock.calls[0]?.[0] as string;
    expect(script).toContain('firePress');
    expect(script).toContain('fireSelect');
    // Both fire without early return between them
    const pressBlock = script.indexOf('ctrl.firePress');
    const selectBlock = script.indexOf('ctrl.fireSelect');
    const tapBlock = script.indexOf('fireTap');
    expect(pressBlock).toBeLessThan(selectBlock);
    expect(selectBlock).toBeLessThan(tapBlock);
    // No early return between firePress and fireSelect
    const betweenPressAndSelect = script.slice(pressBlock, selectBlock);
    expect(betweenPressAndSelect).not.toContain('return {');
  });

  it('press throws ControlError when bridge returns failure (BF-007)', async () => {
    const strategy = new UI5NativeStrategy();
    const evaluateFn = vi.fn().mockResolvedValue({ success: false, error: 'Bridge not available' });
    const page = { evaluate: evaluateFn } as unknown as Page;
    await expect(strategy.press(page, 'btn1')).rejects.toThrow(ControlError);
  });

  it('press error includes ERR_CONTROL_INTERACTION_FAILED code', async () => {
    const strategy = new UI5NativeStrategy();
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
      expect((error as ControlError).retryable).toBe(true);
    }
  });

  it('calls page.evaluate for enterText', async () => {
    const strategy = new UI5NativeStrategy();
    const evaluateFn = vi.fn().mockResolvedValue({ success: true });
    const page = { evaluate: evaluateFn } as unknown as Page;
    await strategy.enterText(page, 'input1', 'hello');
    expect(evaluateFn).toHaveBeenCalled();
  });

  it('enterText throws ControlError on failure (BF-007)', async () => {
    const strategy = new UI5NativeStrategy();
    const evaluateFn = vi.fn().mockResolvedValue({ success: false, error: 'Bridge not available' });
    const page = { evaluate: evaluateFn } as unknown as Page;
    await expect(strategy.enterText(page, 'input1', 'hello')).rejects.toThrow(ControlError);
  });

  it('calls page.evaluate for select', async () => {
    const strategy = new UI5NativeStrategy();
    const evaluateFn = vi.fn().mockResolvedValue({ success: true });
    const page = { evaluate: evaluateFn } as unknown as Page;
    await strategy.select(page, 'combo1', 'item1');
    expect(evaluateFn).toHaveBeenCalled();
  });

  it('select throws ControlError on failure (BF-007)', async () => {
    const strategy = new UI5NativeStrategy();
    const evaluateFn = vi
      .fn()
      .mockResolvedValue({ success: false, error: 'Control not found: combo1' });
    const page = { evaluate: evaluateFn } as unknown as Page;
    await expect(strategy.select(page, 'combo1', 'item1')).rejects.toThrow(ControlError);
  });

  it('press uses fallback message when error is undefined', async () => {
    const strategy = new UI5NativeStrategy();
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
    const strategy = new UI5NativeStrategy();
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
    const strategy = new UI5NativeStrategy();
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
