/**
 * Tests for `src/bridge/webcomponent-adapter.ts`.
 *
 * @remarks
 * Validates the WebComponentAdapter stub (W2: Phase 2 defines interface
 * + no-crash fallback only. Full support deferred to Phase 3+).
 */
import { describe, expect, it, vi } from 'vitest';

import { createMockBridgePage } from '../../helpers/mock-page.js';

import { WebComponentAdapter } from '#bridge/webcomponent-adapter.js';

describe('WebComponentAdapter', () => {
  it('initializes without error', async () => {
    const page = createMockBridgePage({
      evaluate: vi
        .fn()
        .mockResolvedValueOnce(undefined) // injection
        .mockResolvedValueOnce('1.120.0') // version
        .mockResolvedValueOnce(true), // isReady → isBridgeReady
      waitForFunction: vi.fn().mockResolvedValue(undefined),
    });
    const adapter = new WebComponentAdapter();
    await adapter.init(page);
    expect(await adapter.isReady()).toBe(true);
  });

  it('isWebComponent returns true', async () => {
    const page = createMockBridgePage({
      evaluate: vi
        .fn()
        .mockResolvedValueOnce(undefined) // injection
        .mockResolvedValueOnce('1.120.0'), // version
      waitForFunction: vi.fn().mockResolvedValue(undefined),
    });
    const adapter = new WebComponentAdapter();
    await adapter.init(page);
    expect(await adapter.isWebComponent()).toBe(true);
  });

  it('findControl returns null (stub)', async () => {
    const page = createMockBridgePage({
      evaluate: vi.fn().mockResolvedValueOnce(undefined).mockResolvedValueOnce('1.120.0'),
      waitForFunction: vi.fn().mockResolvedValue(undefined),
    });
    const adapter = new WebComponentAdapter();
    await adapter.init(page);
    const result = await adapter.findControl({ id: 'wc1' });
    expect(result).toBeNull();
  });

  it('findControls returns empty array (stub)', async () => {
    const page = createMockBridgePage({
      evaluate: vi.fn().mockResolvedValueOnce(undefined).mockResolvedValueOnce('1.120.0'),
      waitForFunction: vi.fn().mockResolvedValue(undefined),
    });
    const adapter = new WebComponentAdapter();
    await adapter.init(page);
    const result = await adapter.findControls({ controlType: 'ui5-button' });
    expect(result).toEqual([]);
  });

  it('destroy resets state', async () => {
    const page = createMockBridgePage({
      evaluate: vi.fn().mockResolvedValueOnce(undefined).mockResolvedValueOnce('1.120.0'),
      waitForFunction: vi.fn().mockResolvedValue(undefined),
    });
    const adapter = new WebComponentAdapter();
    await adapter.init(page);
    await adapter.destroy();
    expect(await adapter.isReady()).toBe(false);
  });

  it('getUI5Version returns detected version', async () => {
    const page = createMockBridgePage({
      evaluate: vi.fn().mockResolvedValueOnce(undefined).mockResolvedValueOnce('1.120.0'),
      waitForFunction: vi.fn().mockResolvedValue(undefined),
    });
    const adapter = new WebComponentAdapter();
    await adapter.init(page);
    expect(await adapter.getUI5Version()).toBe('1.120.0');
  });

  it('getUI5Version returns fallback after destroy', async () => {
    const page = createMockBridgePage({
      evaluate: vi.fn().mockResolvedValueOnce(undefined).mockResolvedValueOnce('1.120.0'),
      waitForFunction: vi.fn().mockResolvedValue(undefined),
    });
    const adapter = new WebComponentAdapter();
    await adapter.init(page);
    await adapter.destroy();
    expect(await adapter.getUI5Version()).toBe('0.0.0');
  });

  it('getControlProperty returns undefined (stub)', async () => {
    const page = createMockBridgePage({
      evaluate: vi.fn().mockResolvedValueOnce(undefined).mockResolvedValueOnce('1.120.0'),
      waitForFunction: vi.fn().mockResolvedValue(undefined),
    });
    const adapter = new WebComponentAdapter();
    await adapter.init(page);
    expect(await adapter.getControlProperty('wc1', 'text')).toBeUndefined();
  });

  it('setControlProperty is no-op (stub)', async () => {
    const page = createMockBridgePage({
      evaluate: vi.fn().mockResolvedValueOnce(undefined).mockResolvedValueOnce('1.120.0'),
      waitForFunction: vi.fn().mockResolvedValue(undefined),
    });
    const adapter = new WebComponentAdapter();
    await adapter.init(page);
    await expect(adapter.setControlProperty('wc1', 'text', 'val')).resolves.toBeUndefined();
  });

  it('getControlAggregation returns empty array (stub)', async () => {
    const page = createMockBridgePage({
      evaluate: vi.fn().mockResolvedValueOnce(undefined).mockResolvedValueOnce('1.120.0'),
      waitForFunction: vi.fn().mockResolvedValue(undefined),
    });
    const adapter = new WebComponentAdapter();
    await adapter.init(page);
    expect(await adapter.getControlAggregation('wc1', 'items')).toEqual([]);
  });

  it('executeControlMethod returns undefined (stub)', async () => {
    const page = createMockBridgePage({
      evaluate: vi.fn().mockResolvedValueOnce(undefined).mockResolvedValueOnce('1.120.0'),
      waitForFunction: vi.fn().mockResolvedValue(undefined),
    });
    const adapter = new WebComponentAdapter();
    await adapter.init(page);
    expect(await adapter.executeControlMethod('wc1', 'getText', [])).toBeUndefined();
  });

  it('waitForUI5Stable is no-op (stub)', async () => {
    const page = createMockBridgePage({
      evaluate: vi.fn().mockResolvedValueOnce(undefined).mockResolvedValueOnce('1.120.0'),
      waitForFunction: vi.fn().mockResolvedValue(undefined),
    });
    const adapter = new WebComponentAdapter();
    await adapter.init(page);
    await expect(adapter.waitForUI5Stable()).resolves.toBeUndefined();
  });

  it('getModel returns null (stub)', async () => {
    const page = createMockBridgePage({
      evaluate: vi.fn().mockResolvedValueOnce(undefined).mockResolvedValueOnce('1.120.0'),
      waitForFunction: vi.fn().mockResolvedValue(undefined),
    });
    const adapter = new WebComponentAdapter();
    await adapter.init(page);
    expect(await adapter.getModel('wc1')).toBeNull();
  });

  it('getBindingContext returns null (stub)', async () => {
    const page = createMockBridgePage({
      evaluate: vi.fn().mockResolvedValueOnce(undefined).mockResolvedValueOnce('1.120.0'),
      waitForFunction: vi.fn().mockResolvedValue(undefined),
    });
    const adapter = new WebComponentAdapter();
    await adapter.init(page);
    expect(await adapter.getBindingContext('wc1')).toBeNull();
  });

  it('describeControl returns empty object (stub)', async () => {
    const page = createMockBridgePage({
      evaluate: vi.fn().mockResolvedValueOnce(undefined).mockResolvedValueOnce('1.120.0'),
      waitForFunction: vi.fn().mockResolvedValue(undefined),
    });
    const adapter = new WebComponentAdapter();
    await adapter.init(page);
    expect(await adapter.describeControl('wc1')).toEqual({});
  });

  it('getAvailableMethods returns empty array (stub)', async () => {
    const page = createMockBridgePage({
      evaluate: vi.fn().mockResolvedValueOnce(undefined).mockResolvedValueOnce('1.120.0'),
      waitForFunction: vi.fn().mockResolvedValue(undefined),
    });
    const adapter = new WebComponentAdapter();
    await adapter.init(page);
    expect(await adapter.getAvailableMethods('wc1')).toEqual([]);
  });

  it('getSelectorForControl returns null (stub)', async () => {
    const page = createMockBridgePage({
      evaluate: vi.fn().mockResolvedValueOnce(undefined).mockResolvedValueOnce('1.120.0'),
      waitForFunction: vi.fn().mockResolvedValue(undefined),
    });
    const adapter = new WebComponentAdapter();
    await adapter.init(page);
    expect(await adapter.getSelectorForControl('wc1')).toBeNull();
  });

  it('resetInjectionState is a no-op (stub)', async () => {
    const page = createMockBridgePage({
      evaluate: vi.fn().mockResolvedValueOnce(undefined).mockResolvedValueOnce('1.120.0'),
      waitForFunction: vi.fn().mockResolvedValue(undefined),
    });
    const adapter = new WebComponentAdapter();
    await adapter.init(page);
    expect(() => {
      adapter.resetInjectionState();
    }).not.toThrow();
  });
});
