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

  it('press script fires both firePress and fireSelect without early return (BF-005)', async () => {
    const strategy = new DomFirstStrategy();
    const evaluateFn = vi.fn().mockResolvedValue({ success: true });
    const page = { evaluate: evaluateFn } as unknown as Page;
    await strategy.press(page, 'btn1');
    const script = evaluateFn.mock.calls[0]?.[0] as string;
    expect(script).toContain('firePress');
    expect(script).toContain('fireSelect');
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
});
