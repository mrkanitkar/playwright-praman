/**
 * Tests for `src/proxy/ui5-object-proxy.ts`.
 *
 * @remarks
 * Validates the Proxy wrapper for UI5Object that enables method forwarding.
 */
import { describe, expect, it, vi } from 'vitest';

import { createMockBridgePage } from '../../helpers/mock-page.js';

import { createUI5ObjectProxy } from '#proxy/ui5-object-proxy.js';
import { UI5Object } from '#proxy/ui5-object.js';

describe('ui5-object-proxy', () => {
  it('creates a proxy from a UI5Object', () => {
    const page = createMockBridgePage();
    const obj = UI5Object.create({ uuid: 'u1', type: 'sap.ui.model.json.JSONModel', page });
    const proxy = createUI5ObjectProxy(obj);
    expect(proxy).toBeDefined();
  });

  it('forwards method calls to UI5Object.executeMethod', async () => {
    const page = createMockBridgePage({
      evaluate: vi.fn().mockResolvedValue({ success: true, value: { name: 'test' }, duration: 1 }),
    });
    const obj = UI5Object.create({ uuid: 'u1', type: 'sap.ui.model.json.JSONModel', page });
    const proxy = createUI5ObjectProxy(obj) as Record<string, (...args: unknown[]) => unknown>;
    const result = await proxy['getData']();
    expect(result).toEqual({ success: true, value: { name: 'test' }, duration: 1 });
  });

  it('anti-thenable: then returns undefined', () => {
    const page = createMockBridgePage();
    const obj = UI5Object.create({ uuid: 'u1', type: 'Type', page });
    const proxy = createUI5ObjectProxy(obj) as Record<string, unknown>;
    expect(proxy['then']).toBeUndefined();
  });

  it('exposes uuid property', () => {
    const page = createMockBridgePage();
    const obj = UI5Object.create({ uuid: 'u1', type: 'Type', page });
    const proxy = createUI5ObjectProxy(obj) as Record<string, unknown>;
    expect(proxy['uuid']).toBe('u1');
  });

  it('exposes type property', () => {
    const page = createMockBridgePage();
    const obj = UI5Object.create({ uuid: 'u1', type: 'sap.ui.model.json.JSONModel', page });
    const proxy = createUI5ObjectProxy(obj) as Record<string, unknown>;
    expect(proxy['type']).toBe('sap.ui.model.json.JSONModel');
  });

  it('toString returns meaningful representation', () => {
    const page = createMockBridgePage();
    const obj = UI5Object.create({ uuid: 'u1', type: 'sap.ui.model.json.JSONModel', page });
    const proxy = createUI5ObjectProxy(obj) as Record<string, unknown>;
    const toStringFn = Reflect.get(proxy as object, 'toString') as () => string;
    expect(toStringFn()).toContain('UI5Object');
  });

  it('is not extensible', () => {
    const page = createMockBridgePage();
    const obj = UI5Object.create({ uuid: 'u1', type: 'Type', page });
    const proxy = createUI5ObjectProxy(obj);
    expect(Object.isExtensible(proxy as object)).toBe(false);
  });
});
