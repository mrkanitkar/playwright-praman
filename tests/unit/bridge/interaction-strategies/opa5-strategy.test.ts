/**
 * Tests for `src/bridge/interaction-strategies/opa5-strategy.ts`.
 *
 * @remarks
 * Validates the OPA5 interaction strategy that uses
 * RecordReplay.interactWithControl.
 */
import { describe, expect, it, vi } from 'vitest';

import { createMockBridgePage } from '../../../helpers/mock-page.js';

import { Opa5Strategy } from '#bridge/interaction-strategies/opa5-strategy.js';

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
    const page = createMockBridgePage({
      evaluate: vi.fn().mockResolvedValue({ success: true }),
    });
    await strategy.press(page, 'btn1');
    expect(page.evaluate).toHaveBeenCalled();
  });

  it('calls page.evaluate for enterText', async () => {
    const strategy = new Opa5Strategy();
    const page = createMockBridgePage({
      evaluate: vi.fn().mockResolvedValue({ success: true }),
    });
    await strategy.enterText(page, 'input1', 'hello');
    expect(page.evaluate).toHaveBeenCalled();
  });

  it('calls page.evaluate for select', async () => {
    const strategy = new Opa5Strategy();
    const page = createMockBridgePage({
      evaluate: vi.fn().mockResolvedValue({ success: true }),
    });
    await strategy.select(page, 'combo1', 'item1');
    expect(page.evaluate).toHaveBeenCalled();
  });
});
