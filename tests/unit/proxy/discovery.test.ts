/**
 * Tests for `src/proxy/discovery.ts`.
 *
 * @remarks
 * Validates node-side control discovery orchestration with strategy chain.
 */
import { describe, expect, it, vi } from 'vitest';

import { createMockBridgeAdapter } from '../../helpers/mock-bridge-adapter.js';

import { ControlProxyCache } from '#proxy/cache.js';
import { discoverControl } from '#proxy/discovery.js';

describe('discoverControl', () => {
  it('returns proxy from cache on hit', async () => {
    const adapter = createMockBridgeAdapter();
    const cache = new ControlProxyCache();
    // Pre-populate cache with a mock entry
    const selector = { id: 'btn1' };
    const mockProxy = { id: 'btn1', controlType: 'sap.m.Button' };
    cache.set(selector, mockProxy as never);
    const result = await discoverControl(selector, adapter, cache, ['recordreplay']);
    expect(result).toBeDefined();
    expect(result?.id).toBe('btn1');
    // adapter.findControl should NOT have been called (cache hit)
    expect(adapter.findControl).not.toHaveBeenCalled();
  });

  it('falls through to adapter on cache miss', async () => {
    const adapter = createMockBridgeAdapter({
      findControl: vi.fn().mockResolvedValue({ id: 'btn1', controlType: 'sap.m.Button' }),
      getAvailableMethods: vi.fn().mockResolvedValue(['getText', 'getEnabled']),
    });
    const cache = new ControlProxyCache();
    const result = await discoverControl({ id: 'btn1' }, adapter, cache, [
      'recordreplay',
      'direct-id',
    ]);
    expect(result).toBeDefined();
    expect(adapter.findControl).toHaveBeenCalled();
  });

  it('returns null when control not found', async () => {
    const adapter = createMockBridgeAdapter({
      findControl: vi.fn().mockResolvedValue(null),
    });
    const cache = new ControlProxyCache();
    const result = await discoverControl({ id: 'nonexistent' }, adapter, cache, ['recordreplay']);
    expect(result).toBeNull();
  });

  it('caches discovered proxy for subsequent lookups', async () => {
    const adapter = createMockBridgeAdapter({
      findControl: vi.fn().mockResolvedValue({ id: 'btn1', controlType: 'sap.m.Button' }),
      getAvailableMethods: vi.fn().mockResolvedValue(['getText']),
    });
    const cache = new ControlProxyCache();
    const selector = { id: 'btn1' };
    await discoverControl(selector, adapter, cache, ['recordreplay']);
    // Second call should hit cache
    const result2 = await discoverControl(selector, adapter, cache, ['recordreplay']);
    expect(result2).toBeDefined();
    // findControl called only once (second was a cache hit)
    expect(adapter.findControl).toHaveBeenCalledTimes(1);
  });

  it('passes selector to adapter.findControl', async () => {
    const adapter = createMockBridgeAdapter({
      findControl: vi.fn().mockResolvedValue(null),
    });
    const cache = new ControlProxyCache();
    const selector = { controlType: 'sap.m.Button', properties: { text: 'Save' } };
    await discoverControl(selector, adapter, cache, ['recordreplay']);
    expect(adapter.findControl).toHaveBeenCalledWith(selector);
  });

  // ── Strategy chain (G1) ────────────────────────────────────────────
  it('direct-id strategy strips selector to id-only', async () => {
    const adapter = createMockBridgeAdapter({
      findControl: vi.fn().mockResolvedValue({ id: 'btn1', controlType: 'sap.m.Button' }),
      getAvailableMethods: vi.fn().mockResolvedValue(['getText']),
    });
    const cache = new ControlProxyCache();
    const selector = { id: 'btn1', controlType: 'sap.m.Button', properties: { text: 'Save' } };
    await discoverControl(selector, adapter, cache, ['direct-id']);
    // direct-id should strip to id-only for fastest lookup
    expect(adapter.findControl).toHaveBeenCalledWith({ id: 'btn1' });
  });

  it('recordreplay strategy passes full selector', async () => {
    const adapter = createMockBridgeAdapter({
      findControl: vi.fn().mockResolvedValue(null),
    });
    const cache = new ControlProxyCache();
    const selector = { controlType: 'sap.m.Button', properties: { text: 'Save' } };
    await discoverControl(selector, adapter, cache, ['recordreplay']);
    expect(adapter.findControl).toHaveBeenCalledWith(selector);
  });

  it('falls back to next strategy when first returns null', async () => {
    const adapter = createMockBridgeAdapter({
      findControl: vi
        .fn()
        .mockResolvedValueOnce(null) // direct-id fails
        .mockResolvedValueOnce({ id: 'btn1', controlType: 'sap.m.Button' }), // recordreplay succeeds
      getAvailableMethods: vi.fn().mockResolvedValue(['getText']),
    });
    const cache = new ControlProxyCache();
    const selector = { id: 'btn1', controlType: 'sap.m.Button' };
    const result = await discoverControl(selector, adapter, cache, ['direct-id', 'recordreplay']);
    expect(result).toBeDefined();
    expect(adapter.findControl).toHaveBeenCalledTimes(2);
    // First call: direct-id (id-only)
    expect(adapter.findControl).toHaveBeenNthCalledWith(1, { id: 'btn1' });
    // Second call: recordreplay (full selector)
    expect(adapter.findControl).toHaveBeenNthCalledWith(2, selector);
  });

  it('skips direct-id strategy when selector has no id', async () => {
    const adapter = createMockBridgeAdapter({
      findControl: vi.fn().mockResolvedValue({ id: 'btn1', controlType: 'sap.m.Button' }),
      getAvailableMethods: vi.fn().mockResolvedValue([]),
    });
    const cache = new ControlProxyCache();
    const selector = { controlType: 'sap.m.Button', properties: { text: 'Save' } };
    await discoverControl(selector, adapter, cache, ['direct-id', 'recordreplay']);
    // direct-id skipped (no id), only recordreplay called with full selector
    expect(adapter.findControl).toHaveBeenCalledTimes(1);
    expect(adapter.findControl).toHaveBeenCalledWith(selector);
  });

  it('skips registry strategy (Phase 3+ placeholder)', async () => {
    const adapter = createMockBridgeAdapter({
      findControl: vi.fn().mockResolvedValue(null),
    });
    const cache = new ControlProxyCache();
    await discoverControl({ id: 'btn1' }, adapter, cache, ['registry']);
    // registry is a no-op, findControl should not be called
    expect(adapter.findControl).not.toHaveBeenCalled();
  });

  it('stops at first successful strategy', async () => {
    const adapter = createMockBridgeAdapter({
      findControl: vi.fn().mockResolvedValue({ id: 'btn1', controlType: 'sap.m.Button' }),
      getAvailableMethods: vi.fn().mockResolvedValue([]),
    });
    const cache = new ControlProxyCache();
    await discoverControl({ id: 'btn1' }, adapter, cache, ['direct-id', 'recordreplay']);
    // direct-id succeeds, recordreplay should not be attempted
    expect(adapter.findControl).toHaveBeenCalledTimes(1);
  });
});
