/**
 * Tests for `src/bridge/interaction-strategies/ui5-native-strategy.ts`.
 *
 * @remarks
 * Validates the UI5-native interaction strategy that uses direct
 * UI5 fire* methods with fallback chain.
 */
import { describe, expect, it, vi } from 'vitest';

import { createMockBridgePage } from '../../../helpers/mock-page.js';

import { UI5NativeStrategy } from '#bridge/interaction-strategies/ui5-native-strategy.js';

describe('UI5NativeStrategy', () => {
  it('has name "ui5-native"', () => {
    const strategy = new UI5NativeStrategy();
    expect(strategy.name).toBe('ui5-native');
  });

  it('calls page.evaluate for press', async () => {
    const strategy = new UI5NativeStrategy();
    const page = createMockBridgePage({
      evaluate: vi.fn().mockResolvedValue({ success: true }),
    });
    await strategy.press(page, 'btn1');
    expect(page.evaluate).toHaveBeenCalled();
  });

  it('calls page.evaluate for enterText', async () => {
    const strategy = new UI5NativeStrategy();
    const page = createMockBridgePage({
      evaluate: vi.fn().mockResolvedValue({ success: true }),
    });
    await strategy.enterText(page, 'input1', 'hello');
    expect(page.evaluate).toHaveBeenCalled();
  });

  it('calls page.evaluate for select', async () => {
    const strategy = new UI5NativeStrategy();
    const page = createMockBridgePage({
      evaluate: vi.fn().mockResolvedValue({ success: true }),
    });
    await strategy.select(page, 'combo1', 'item1');
    expect(page.evaluate).toHaveBeenCalled();
  });
});
