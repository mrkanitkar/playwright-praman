/**
 * Tests for `src/bridge/hybrid-adapter.ts`.
 *
 * @remarks
 * Validates the HybridAdapter that auto-detects per element (W3)
 * and delegates to Classic or WebComponent adapter.
 *
 * HybridAdapter.init() calls init() on both sub-adapters, so the mock
 * page receives: injection + object-map + version (classic) + version (webcomponent).
 * The second injection is skipped via WeakSet in ensureBridgeInjected.
 */
import { describe, expect, it, vi } from 'vitest';

import { createMockBridgePage } from '../../helpers/mock-page.js';

import { HybridAdapter } from '#bridge/hybrid-adapter.js';

describe('HybridAdapter', () => {
  it('initializes both sub-adapters', async () => {
    const page = createMockBridgePage({
      evaluate: vi
        .fn()
        .mockResolvedValueOnce(undefined) // injection (classic)
        .mockResolvedValueOnce(undefined) // object-map (classic)
        .mockResolvedValueOnce('1.120.0') // version (classic)
        .mockResolvedValueOnce('1.120.0') // version (webcomp — injection skipped)
        .mockResolvedValueOnce(true), // isReady → isBridgeReady
      waitForFunction: vi.fn().mockResolvedValue(undefined),
    });
    const adapter = new HybridAdapter();
    await adapter.init(page);
    expect(await adapter.isReady()).toBe(true);
  });

  it('isWebComponent returns false (delegates to classic by default)', async () => {
    const page = createMockBridgePage({
      evaluate: vi
        .fn()
        .mockResolvedValueOnce(undefined) // injection
        .mockResolvedValueOnce(undefined) // object-map
        .mockResolvedValueOnce('1.120.0') // version (classic)
        .mockResolvedValueOnce('1.120.0'), // version (webcomp)
      waitForFunction: vi.fn().mockResolvedValue(undefined),
    });
    const adapter = new HybridAdapter();
    await adapter.init(page);
    expect(await adapter.isWebComponent()).toBe(false);
  });

  it('delegates findControl to classic adapter', async () => {
    const discoveryResult = {
      id: 'btn1',
      controlType: 'sap.m.Button',
      methods: ['getText'],
      domId: 'btn1',
      visible: true,
    };
    const page = createMockBridgePage({
      evaluate: vi
        .fn()
        .mockResolvedValueOnce(undefined) // injection
        .mockResolvedValueOnce(undefined) // object-map
        .mockResolvedValueOnce('1.120.0') // version (classic)
        .mockResolvedValueOnce('1.120.0') // version (webcomp)
        .mockResolvedValueOnce(discoveryResult), // findControl
      waitForFunction: vi.fn().mockResolvedValue(undefined),
    });
    const adapter = new HybridAdapter();
    await adapter.init(page);
    const result = await adapter.findControl({ id: 'btn1' });
    expect(result).toEqual(expect.objectContaining({ id: 'btn1', controlType: 'sap.m.Button' }));
  });

  it('destroy resets state', async () => {
    const page = createMockBridgePage({
      evaluate: vi
        .fn()
        .mockResolvedValueOnce(undefined) // injection
        .mockResolvedValueOnce(undefined) // object-map
        .mockResolvedValueOnce('1.120.0') // version (classic)
        .mockResolvedValueOnce('1.120.0') // version (webcomp)
        .mockResolvedValue(undefined), // subsequent calls (destroy cleanup)
      waitForFunction: vi.fn().mockResolvedValue(undefined),
    });
    const adapter = new HybridAdapter();
    await adapter.init(page);
    await adapter.destroy();
    expect(await adapter.isReady()).toBe(false);
  });

  it('getUI5Version delegates to classic adapter', async () => {
    const page = createMockBridgePage({
      evaluate: vi
        .fn()
        .mockResolvedValueOnce(undefined) // injection
        .mockResolvedValueOnce(undefined) // object-map
        .mockResolvedValueOnce('1.120.0') // version (classic)
        .mockResolvedValueOnce('1.120.0'), // version (webcomp)
      waitForFunction: vi.fn().mockResolvedValue(undefined),
    });
    const adapter = new HybridAdapter();
    await adapter.init(page);
    expect(await adapter.getUI5Version()).toBe('1.120.0');
  });

  it('delegates findControls to classic adapter', async () => {
    const results = [
      { id: 'btn1', controlType: 'sap.m.Button', methods: [], domId: 'btn1', visible: true },
    ];
    const page = createMockBridgePage({
      evaluate: vi
        .fn()
        .mockResolvedValueOnce(undefined) // injection
        .mockResolvedValueOnce(undefined) // object-map
        .mockResolvedValueOnce('1.120.0') // version (classic)
        .mockResolvedValueOnce('1.120.0') // version (webcomp)
        .mockResolvedValueOnce(results), // findControls
      waitForFunction: vi.fn().mockResolvedValue(undefined),
    });
    const adapter = new HybridAdapter();
    await adapter.init(page);
    const found = await adapter.findControls({ controlType: 'sap.m.Button' });
    expect(found).toHaveLength(1);
  });

  it('delegates getControlProperty to classic adapter', async () => {
    const page = createMockBridgePage({
      evaluate: vi
        .fn()
        .mockResolvedValueOnce(undefined) // injection
        .mockResolvedValueOnce(undefined) // object-map
        .mockResolvedValueOnce('1.120.0') // version (classic)
        .mockResolvedValueOnce('1.120.0') // version (webcomp)
        .mockResolvedValueOnce({ success: true, returnType: 'result', value: 'OK', duration: 1 }),
      waitForFunction: vi.fn().mockResolvedValue(undefined),
    });
    const adapter = new HybridAdapter();
    await adapter.init(page);
    expect(await adapter.getControlProperty('btn1', 'text')).toBe('OK');
  });

  it('delegates setControlProperty to classic adapter', async () => {
    const page = createMockBridgePage({
      evaluate: vi
        .fn()
        .mockResolvedValueOnce(undefined) // injection
        .mockResolvedValueOnce(undefined) // object-map
        .mockResolvedValueOnce('1.120.0') // version (classic)
        .mockResolvedValueOnce('1.120.0') // version (webcomp)
        .mockResolvedValueOnce(undefined), // setProperty
      waitForFunction: vi.fn().mockResolvedValue(undefined),
    });
    const adapter = new HybridAdapter();
    await adapter.init(page);
    await adapter.setControlProperty('btn1', 'text', 'New');
    expect(page.evaluate).toHaveBeenCalledTimes(5);
  });

  it('delegates getControlAggregation to classic adapter', async () => {
    const page = createMockBridgePage({
      evaluate: vi
        .fn()
        .mockResolvedValueOnce(undefined) // injection
        .mockResolvedValueOnce(undefined) // object-map
        .mockResolvedValueOnce('1.120.0') // version (classic)
        .mockResolvedValueOnce('1.120.0') // version (webcomp)
        .mockResolvedValueOnce({
          success: true,
          returnType: 'aggregation',
          uuids: ['i1'],
          objectTypes: ['sap.m.StandardListItem'],
          duration: 1,
        }),
      waitForFunction: vi.fn().mockResolvedValue(undefined),
    });
    const adapter = new HybridAdapter();
    await adapter.init(page);
    const items = await adapter.getControlAggregation('list1', 'items');
    expect(items).toHaveLength(1);
  });

  it('delegates executeControlMethod to classic adapter', async () => {
    const page = createMockBridgePage({
      evaluate: vi
        .fn()
        .mockResolvedValueOnce(undefined) // injection
        .mockResolvedValueOnce(undefined) // object-map
        .mockResolvedValueOnce('1.120.0') // version (classic)
        .mockResolvedValueOnce('1.120.0') // version (webcomp)
        .mockResolvedValueOnce({ success: true, returnType: 'result', value: 42, duration: 1 }),
      waitForFunction: vi.fn().mockResolvedValue(undefined),
    });
    const adapter = new HybridAdapter();
    await adapter.init(page);
    expect(await adapter.executeControlMethod('btn1', 'getCount', [])).toBe(42);
  });

  it('delegates waitForUI5Stable to classic adapter', async () => {
    const page = createMockBridgePage({
      evaluate: vi
        .fn()
        .mockResolvedValueOnce(undefined) // injection
        .mockResolvedValueOnce(undefined) // object-map
        .mockResolvedValueOnce('1.120.0') // version (classic)
        .mockResolvedValueOnce('1.120.0'), // version (webcomp)
      waitForFunction: vi.fn().mockResolvedValue(undefined),
    });
    const adapter = new HybridAdapter();
    await adapter.init(page);
    await adapter.waitForUI5Stable();
    expect(page.waitForFunction).toHaveBeenCalled();
  });

  it('delegates getModel to classic adapter', async () => {
    const page = createMockBridgePage({
      evaluate: vi
        .fn()
        .mockResolvedValueOnce(undefined) // injection
        .mockResolvedValueOnce(undefined) // object-map
        .mockResolvedValueOnce('1.120.0') // version (classic)
        .mockResolvedValueOnce('1.120.0') // version (webcomp)
        .mockResolvedValueOnce({ name: 'default' }),
      waitForFunction: vi.fn().mockResolvedValue(undefined),
    });
    const adapter = new HybridAdapter();
    await adapter.init(page);
    expect(await adapter.getModel('view1')).toEqual({ name: 'default' });
  });

  it('delegates getBindingContext to classic adapter', async () => {
    const page = createMockBridgePage({
      evaluate: vi
        .fn()
        .mockResolvedValueOnce(undefined) // injection
        .mockResolvedValueOnce(undefined) // object-map
        .mockResolvedValueOnce('1.120.0') // version (classic)
        .mockResolvedValueOnce('1.120.0') // version (webcomp)
        .mockResolvedValueOnce({ path: '/P(1)' }),
      waitForFunction: vi.fn().mockResolvedValue(undefined),
    });
    const adapter = new HybridAdapter();
    await adapter.init(page);
    expect(await adapter.getBindingContext('t1')).toEqual({ path: '/P(1)' });
  });

  it('delegates describeControl to classic adapter', async () => {
    const page = createMockBridgePage({
      evaluate: vi
        .fn()
        .mockResolvedValueOnce(undefined) // injection
        .mockResolvedValueOnce(undefined) // object-map
        .mockResolvedValueOnce('1.120.0') // version (classic)
        .mockResolvedValueOnce('1.120.0') // version (webcomp)
        .mockResolvedValueOnce({ id: 'btn1', controlType: 'sap.m.Button' }),
      waitForFunction: vi.fn().mockResolvedValue(undefined),
    });
    const adapter = new HybridAdapter();
    await adapter.init(page);
    expect(await adapter.describeControl('btn1')).toHaveProperty('id', 'btn1');
  });

  it('delegates getAvailableMethods to classic adapter', async () => {
    const page = createMockBridgePage({
      evaluate: vi
        .fn()
        .mockResolvedValueOnce(undefined) // injection
        .mockResolvedValueOnce(undefined) // object-map
        .mockResolvedValueOnce('1.120.0') // version (classic)
        .mockResolvedValueOnce('1.120.0') // version (webcomp)
        .mockResolvedValueOnce(['getText', 'getEnabled']),
      waitForFunction: vi.fn().mockResolvedValue(undefined),
    });
    const adapter = new HybridAdapter();
    await adapter.init(page);
    const methods = await adapter.getAvailableMethods('btn1');
    expect(methods).toContain('getText');
  });

  it('delegates getSelectorForControl to classic adapter', async () => {
    const selectorResult = {
      selector: { controlType: 'sap.m.Button', properties: { text: 'Save' } },
      strategy: 'properties',
    };
    const page = createMockBridgePage({
      evaluate: vi
        .fn()
        .mockResolvedValueOnce(undefined) // injection
        .mockResolvedValueOnce(undefined) // object-map
        .mockResolvedValueOnce('1.120.0') // version (classic)
        .mockResolvedValueOnce('1.120.0') // version (webcomp)
        .mockResolvedValueOnce(selectorResult), // getSelectorForControl
      waitForFunction: vi.fn().mockResolvedValue(undefined),
    });
    const adapter = new HybridAdapter();
    await adapter.init(page);
    const result = await adapter.getSelectorForControl('btn1');
    expect(result).toEqual(selectorResult);
  });

  it('delegates resetInjectionState to both sub-adapters', async () => {
    const page = createMockBridgePage({
      evaluate: vi
        .fn()
        .mockResolvedValueOnce(undefined) // injection
        .mockResolvedValueOnce(undefined) // object-map
        .mockResolvedValueOnce('1.120.0') // version (classic)
        .mockResolvedValueOnce('1.120.0'), // version (webcomp)
      waitForFunction: vi.fn().mockResolvedValue(undefined),
    });
    const adapter = new HybridAdapter();
    await adapter.init(page);
    expect(() => {
      adapter.resetInjectionState();
    }).not.toThrow();
  });
});
