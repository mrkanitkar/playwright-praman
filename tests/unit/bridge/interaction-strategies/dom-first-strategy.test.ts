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

describe('DomFirstStrategy', () => {
  it('has name "dom-first"', () => {
    const strategy = new DomFirstStrategy();
    expect(strategy.name).toBe('dom-first');
  });

  it('calls page.evaluate for press', async () => {
    const strategy = new DomFirstStrategy();
    const evaluateFn = vi.fn().mockResolvedValue({ success: true });
    const page = {
      evaluate: evaluateFn,
    } as unknown as Page;
    await strategy.press(page, 'btn1');
    expect(evaluateFn).toHaveBeenCalled();
  });

  it('calls page.evaluate for enterText', async () => {
    const strategy = new DomFirstStrategy();
    const evaluateFn = vi.fn().mockResolvedValue({ success: true });
    const page = {
      evaluate: evaluateFn,
    } as unknown as Page;
    await strategy.enterText(page, 'input1', 'hello');
    expect(evaluateFn).toHaveBeenCalled();
  });

  it('calls page.evaluate for select', async () => {
    const strategy = new DomFirstStrategy();
    const evaluateFn = vi.fn().mockResolvedValue({ success: true });
    const page = {
      evaluate: evaluateFn,
    } as unknown as Page;
    await strategy.select(page, 'combo1', 'item1');
    expect(evaluateFn).toHaveBeenCalled();
  });
});
