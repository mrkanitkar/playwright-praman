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
});
