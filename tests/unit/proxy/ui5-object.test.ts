/**
 * Tests for `src/proxy/ui5-object.ts`.
 *
 * @remarks
 * Validates the UI5Object class that represents non-control UI5 objects
 * (models, bindings, router, etc.) stored in the bridge's objectMap.
 * Also validates the `toProxy()` method for dynamic method forwarding,
 * explicit typed methods, NON_PROXIED_PROPERTIES, `has` trap, and
 * async `create()` with `loadMethods()`.
 */
import type { Page } from '@playwright/test';
import { describe, expect, it, vi } from 'vitest';

import { UI5Object } from '#proxy/ui5-object.js';

/** Creates a minimal mock Page for testing. */
function createMockPage(overrides?: Partial<Record<string, unknown>>): Page {
  return {
    evaluate: vi.fn().mockResolvedValue([]),
    waitForFunction: vi.fn(),
    ...overrides,
  } as unknown as Page;
}

/**
 * Creates a mock page whose evaluate function dispatches based on call order:
 * - First call: loadMethods (returns method names array)
 * - Subsequent calls: return the provided result
 */
function createMockPageWithMethods(
  methods: string[],
  subsequentResult?: unknown,
): { page: Page; evaluateFn: ReturnType<typeof vi.fn> } {
  const evaluateFn = vi.fn();
  // First call is loadMethods, return method names
  evaluateFn.mockResolvedValueOnce(methods);
  if (subsequentResult !== undefined) {
    evaluateFn.mockResolvedValue(subsequentResult);
  }
  return {
    page: { evaluate: evaluateFn, waitForFunction: vi.fn() } as unknown as Page,
    evaluateFn,
  };
}

describe('UI5Object', () => {
  it('creates with uuid and type via async factory', async () => {
    const page = createMockPage();
    const obj = await UI5Object.create({
      uuid: 'uuid-1',
      type: 'sap.ui.model.json.JSONModel',
      page,
    });
    expect(obj.uuid).toBe('uuid-1');
    expect(obj.type).toBe('sap.ui.model.json.JSONModel');
  });

  it('create() calls loadMethods via page.evaluate', async () => {
    const evaluateFn = vi.fn().mockResolvedValue(['getData', 'setData']);
    const page = createMockPage({ evaluate: evaluateFn });
    const obj = await UI5Object.create({
      uuid: 'uuid-1',
      type: 'sap.ui.model.json.JSONModel',
      page,
    });
    // loadMethods should have been called once during create
    expect(evaluateFn).toHaveBeenCalledTimes(1);
    expect(obj.methodCache.has('getData')).toBe(true);
    expect(obj.methodCache.has('setData')).toBe(true);
  });

  it('methodCache is empty when loadMethods returns empty array', async () => {
    const page = createMockPage();
    const obj = await UI5Object.create({
      uuid: 'uuid-1',
      type: 'sap.ui.model.json.JSONModel',
      page,
    });
    expect(obj.methodCache.size).toBe(0);
  });

  it('executeMethod calls page.evaluate with function-form', async () => {
    const { page, evaluateFn } = createMockPageWithMethods(['getData'], {
      success: true,
      returnType: 'result',
      value: 42,
      duration: 1,
    });
    const obj = await UI5Object.create({
      uuid: 'uuid-1',
      type: 'sap.ui.model.json.JSONModel',
      page,
    });
    const result = await obj.executeMethod('getData', []);
    expect(result).toBe(42);
    // First call = loadMethods, second call = executeMethod
    expect(evaluateFn).toHaveBeenCalledTimes(2);
    const [fn, args] = evaluateFn.mock.calls[1] as [unknown, Record<string, unknown>];
    expect(typeof fn).toBe('function');
    expect(args).toEqual(expect.objectContaining({ uuid: 'uuid-1', methodName: 'getData' }));
  });

  it('executeMethod passes arguments in params object', async () => {
    const { page, evaluateFn } = createMockPageWithMethods(['setProperty'], {
      success: true,
      returnType: 'result',
      value: 'ok',
      duration: 1,
    });
    const obj = await UI5Object.create({
      uuid: 'uuid-1',
      type: 'sap.ui.model.json.JSONModel',
      page,
    });
    await obj.executeMethod('setProperty', ['/name', 'Test']);
    const [fn, args] = evaluateFn.mock.calls[1] as [unknown, Record<string, unknown>];
    expect(typeof fn).toBe('function');
    expect(args).toEqual(
      expect.objectContaining({
        uuid: 'uuid-1',
        methodName: 'setProperty',
        args: ['/name', 'Test'],
        bridgeNs: '__praman_bridge',
      }),
    );
  });

  it('toString returns meaningful string', async () => {
    const page = createMockPage();
    const obj = await UI5Object.create({
      uuid: 'uuid-1',
      type: 'sap.ui.model.json.JSONModel',
      page,
    });
    expect(String(obj)).toBe('[UI5Object sap.ui.model.json.JSONModel uuid-1]');
  });

  it('multiple instances have distinct uuids', async () => {
    const page = createMockPage();
    const obj1 = await UI5Object.create({ uuid: 'a', type: 'TypeA', page });
    const obj2 = await UI5Object.create({ uuid: 'b', type: 'TypeB', page });
    expect(obj1.uuid).not.toBe(obj2.uuid);
  });

  // ── Explicit typed methods ─────────────────────────────────────────

  describe('getBindingContext()', () => {
    it('returns sub-proxy for object return type', async () => {
      const evaluateFn = vi.fn();
      // 1st call: loadMethods for parent object
      evaluateFn.mockResolvedValueOnce(['getBindingContext']);
      // 2nd call: getBindingContext execution
      evaluateFn.mockResolvedValueOnce({
        success: true,
        returnType: 'object',
        uuid: 'ctx-uuid',
        objectType: 'sap.ui.model.Context',
        duration: 1,
      });
      // 3rd call: loadMethods for sub-object (Context)
      evaluateFn.mockResolvedValueOnce(['getPath', 'getObject']);
      const page = { evaluate: evaluateFn, waitForFunction: vi.fn() } as unknown as Page;
      const obj = await UI5Object.create({
        uuid: 'uuid-1',
        type: 'sap.ui.model.json.JSONModel',
        page,
      });
      const ctx = (await obj.getBindingContext()) as Record<string, unknown>;
      expect(ctx['uuid']).toBe('ctx-uuid');
      expect(ctx['type']).toBe('sap.ui.model.Context');
    });

    it('passes modelName argument when provided', async () => {
      const { page, evaluateFn } = createMockPageWithMethods(['getBindingContext'], {
        success: true,
        returnType: 'none',
        duration: 1,
      });
      const obj = await UI5Object.create({
        uuid: 'uuid-1',
        type: 'sap.ui.model.json.JSONModel',
        page,
      });
      await obj.getBindingContext('myModel');
      const [, args] = evaluateFn.mock.calls[1] as [unknown, Record<string, unknown>];
      expect(args).toEqual(
        expect.objectContaining({
          methodName: 'getBindingContext',
          args: ['myModel'],
        }),
      );
    });

    it('returns undefined for none return type', async () => {
      const { page } = createMockPageWithMethods(['getBindingContext'], {
        success: true,
        returnType: 'none',
        duration: 1,
      });
      const obj = await UI5Object.create({
        uuid: 'uuid-1',
        type: 'sap.ui.model.json.JSONModel',
        page,
      });
      expect(await obj.getBindingContext()).toBeUndefined();
    });

    it('throws BridgeError on failure', async () => {
      const { page } = createMockPageWithMethods(['getBindingContext'], {
        success: false,
        returnType: 'none',
        error: 'No context',
        duration: 1,
      });
      const obj = await UI5Object.create({
        uuid: 'uuid-1',
        type: 'sap.ui.model.json.JSONModel',
        page,
      });
      await expect(obj.getBindingContext()).rejects.toThrow('No context');
    });
  });

  describe('getProperty()', () => {
    it('delegates to executeMethod', async () => {
      const { page } = createMockPageWithMethods(['getProperty'], {
        success: true,
        returnType: 'result',
        value: 'hello',
        duration: 1,
      });
      const obj = await UI5Object.create({
        uuid: 'uuid-1',
        type: 'sap.ui.model.json.JSONModel',
        page,
      });
      const val = await obj.getProperty('/name');
      expect(val).toBe('hello');
    });
  });

  describe('setProperty()', () => {
    it('delegates to executeMethod', async () => {
      const { page, evaluateFn } = createMockPageWithMethods(['setProperty'], {
        success: true,
        returnType: 'none',
        duration: 1,
      });
      const obj = await UI5Object.create({
        uuid: 'uuid-1',
        type: 'sap.ui.model.json.JSONModel',
        page,
      });
      await obj.setProperty('/name', 'NewVal');
      const [, args] = evaluateFn.mock.calls[1] as [unknown, Record<string, unknown>];
      expect(args).toEqual(
        expect.objectContaining({
          methodName: 'setProperty',
          args: ['/name', 'NewVal'],
        }),
      );
    });
  });

  // ── toProxy() ─────────────────────────────────────────────────────

  describe('toProxy()', () => {
    it('returns a proxy object', async () => {
      const page = createMockPage();
      const obj = await UI5Object.create({
        uuid: 'uuid-1',
        type: 'sap.ui.model.json.JSONModel',
        page,
      });
      const proxy = obj.toProxy();
      expect(proxy).toBeDefined();
    });

    it('exposes uuid and type on the proxy', async () => {
      const page = createMockPage();
      const obj = await UI5Object.create({
        uuid: 'uuid-1',
        type: 'sap.ui.model.json.JSONModel',
        page,
      });
      const proxy = obj.toProxy() as Record<string, unknown>;
      expect(proxy['uuid']).toBe('uuid-1');
      expect(proxy['type']).toBe('sap.ui.model.json.JSONModel');
    });

    it('forwards method calls to executeMethod via function-form evaluate', async () => {
      const { page, evaluateFn } = createMockPageWithMethods(['getData'], {
        success: true,
        returnType: 'result',
        value: { name: 'Test' },
        duration: 1,
      });
      const obj = await UI5Object.create({
        uuid: 'uuid-1',
        type: 'sap.ui.model.json.JSONModel',
        page,
      });
      const proxy = obj.toProxy() as Record<
        string,
        ((...args: unknown[]) => Promise<unknown>) | undefined
      >;
      const getData = proxy['getData'];
      expect(getData).toBeDefined();
      const result = await getData?.();
      expect(result).toEqual({ name: 'Test' });
      // loadMethods + getData
      expect(evaluateFn).toHaveBeenCalledTimes(2);
      const [fn, args] = evaluateFn.mock.calls[1] as [unknown, Record<string, unknown>];
      expect(typeof fn).toBe('function');
      expect(args).toEqual(expect.objectContaining({ uuid: 'uuid-1', methodName: 'getData' }));
    });

    it('forwards method arguments through the proxy params', async () => {
      const { page, evaluateFn } = createMockPageWithMethods(['setProperty'], {
        success: true,
        returnType: 'none',
        duration: 1,
      });
      const obj = await UI5Object.create({
        uuid: 'uuid-1',
        type: 'sap.ui.model.json.JSONModel',
        page,
      });
      const proxy = obj.toProxy() as Record<
        string,
        ((...args: unknown[]) => Promise<unknown>) | undefined
      >;
      const setProperty = proxy['setProperty'];
      expect(setProperty).toBeDefined();
      await setProperty?.('/name', 'Test');
      const [, args] = evaluateFn.mock.calls[1] as [unknown, Record<string, unknown>];
      expect(args).toEqual(
        expect.objectContaining({
          uuid: 'uuid-1',
          methodName: 'setProperty',
          args: ['/name', 'Test'],
        }),
      );
    });

    it('returns undefined for then/catch/finally (anti-thenable)', async () => {
      const page = createMockPage();
      const obj = await UI5Object.create({
        uuid: 'uuid-1',
        type: 'sap.ui.model.json.JSONModel',
        page,
      });
      const proxy = obj.toProxy() as Record<string, unknown>;
      expect(proxy['then']).toBeUndefined();
      expect(proxy['catch']).toBeUndefined();
      expect(proxy['finally']).toBeUndefined();
    });

    it('returns undefined for symbol access', async () => {
      const page = createMockPage();
      const obj = await UI5Object.create({
        uuid: 'uuid-1',
        type: 'sap.ui.model.json.JSONModel',
        page,
      });
      const proxy = obj.toProxy() as Record<symbol, unknown>;
      expect(proxy[Symbol.toPrimitive]).toBeUndefined();
    });

    it('toString returns meaningful string', async () => {
      const page = createMockPage();
      const obj = await UI5Object.create({
        uuid: 'uuid-1',
        type: 'sap.ui.model.json.JSONModel',
        page,
      });
      const proxy = obj.toProxy() as Record<string, (() => string) | undefined>;
      // eslint-disable-next-line @typescript-eslint/dot-notation -- bracket notation avoids unbound-method on Object.prototype.toString
      const toStringFn = proxy['toString'];
      expect(toStringFn).toBeDefined();
      expect(toStringFn?.()).toBe('[UI5Object sap.ui.model.json.JSONModel uuid-1]');
    });

    it('toJSON returns meaningful string', async () => {
      const page = createMockPage();
      const obj = await UI5Object.create({
        uuid: 'uuid-1',
        type: 'sap.ui.model.json.JSONModel',
        page,
      });
      const proxy = obj.toProxy() as Record<string, (() => string) | undefined>;
      const toJSON = proxy['toJSON'];
      expect(toJSON).toBeDefined();
      expect(toJSON?.()).toBe('[UI5Object sap.ui.model.json.JSONModel uuid-1]');
    });

    it('proxy is not extensible', async () => {
      const page = createMockPage();
      const obj = await UI5Object.create({
        uuid: 'uuid-1',
        type: 'sap.ui.model.json.JSONModel',
        page,
      });
      const proxy = obj.toProxy();
      expect(Object.isExtensible(proxy as object)).toBe(false);
    });

    it('returns undefined for none return type', async () => {
      const { page } = createMockPageWithMethods([], {
        success: true,
        returnType: 'none',
        duration: 1,
      });
      const obj = await UI5Object.create({
        uuid: 'uuid-1',
        type: 'sap.ui.model.json.JSONModel',
        page,
      });
      const proxy = obj.toProxy() as Record<
        string,
        ((...args: unknown[]) => Promise<unknown>) | undefined
      >;
      const getProperty = proxy['getSomething'];
      const result = await getProperty?.('/nonexistent');
      expect(result).toBeUndefined();
    });

    it('creates sub-proxy for object return type', async () => {
      const evaluateFn = vi.fn();
      // First call: loadMethods for parent
      evaluateFn.mockResolvedValueOnce(['getContext']);
      // Second call: executeMethod (getContext)
      evaluateFn.mockResolvedValueOnce({
        success: true,
        returnType: 'object',
        uuid: 'sub-uuid',
        objectType: 'sap.ui.model.Context',
        duration: 1,
      });
      // Third call: loadMethods for sub-object
      evaluateFn.mockResolvedValueOnce(['getPath']);
      const page = { evaluate: evaluateFn, waitForFunction: vi.fn() } as unknown as Page;
      const obj = await UI5Object.create({
        uuid: 'uuid-1',
        type: 'sap.ui.model.json.JSONModel',
        page,
      });
      const proxy = obj.toProxy() as Record<
        string,
        ((...args: unknown[]) => Promise<unknown>) | undefined
      >;
      const getContext = proxy['getContext'];
      const subProxy = (await getContext?.()) as Record<string, unknown> | undefined;
      expect(subProxy).toBeDefined();
      expect(subProxy?.['uuid']).toBe('sub-uuid');
      expect(subProxy?.['type']).toBe('sap.ui.model.Context');
    });

    it('throws BridgeError on execution failure', async () => {
      const { page } = createMockPageWithMethods([], {
        success: false,
        returnType: 'none',
        error: 'Object not found: uuid-1',
        duration: 1,
      });
      const obj = await UI5Object.create({
        uuid: 'uuid-1',
        type: 'sap.ui.model.json.JSONModel',
        page,
      });
      await expect(obj.executeMethod('getData', [])).rejects.toThrow('Object not found: uuid-1');
    });

    // ── NON_PROXIED_PROPERTIES routing ──────────────────────────────

    it('routes getBindingContext through explicit method via proxy', async () => {
      const { page } = createMockPageWithMethods(['getBindingContext'], {
        success: true,
        returnType: 'none',
        duration: 1,
      });
      const obj = await UI5Object.create({
        uuid: 'uuid-1',
        type: 'sap.ui.model.json.JSONModel',
        page,
      });
      const proxy = obj.toProxy() as Record<
        string,
        ((...args: unknown[]) => Promise<unknown>) | undefined
      >;
      const bindingCtx = proxy['getBindingContext'];
      expect(bindingCtx).toBeDefined();
      const result = await bindingCtx?.();
      expect(result).toBeUndefined(); // 'none' returnType
    });

    it('routes getProperty through explicit method via proxy', async () => {
      const { page } = createMockPageWithMethods(['getProperty'], {
        success: true,
        returnType: 'result',
        value: 'TestVal',
        duration: 1,
      });
      const obj = await UI5Object.create({
        uuid: 'uuid-1',
        type: 'sap.ui.model.json.JSONModel',
        page,
      });
      const proxy = obj.toProxy() as Record<
        string,
        ((...args: unknown[]) => Promise<unknown>) | undefined
      >;
      const getProp = proxy['getProperty'];
      expect(getProp).toBeDefined();
      const val = await getProp?.('/name');
      expect(val).toBe('TestVal');
    });

    it('routes setProperty through explicit method via proxy', async () => {
      const { page } = createMockPageWithMethods(['setProperty'], {
        success: true,
        returnType: 'none',
        duration: 1,
      });
      const obj = await UI5Object.create({
        uuid: 'uuid-1',
        type: 'sap.ui.model.json.JSONModel',
        page,
      });
      const proxy = obj.toProxy() as Record<
        string,
        ((...args: unknown[]) => Promise<void>) | undefined
      >;
      const setProp = proxy['setProperty'];
      expect(setProp).toBeDefined();
      await setProp?.('/name', 'NewVal');
    });

    it('returns undefined for constructor access (NON_PROXIED_PROPERTIES)', async () => {
      const page = createMockPage();
      const obj = await UI5Object.create({
        uuid: 'uuid-1',
        type: 'sap.ui.model.json.JSONModel',
        page,
      });
      const proxy = obj.toProxy() as Record<string, unknown>;
      // eslint-disable-next-line @typescript-eslint/dot-notation -- testing proxy property routing
      expect(proxy['constructor']).toBeUndefined();
    });

    it('returns undefined for __proto__ access (NON_PROXIED_PROPERTIES)', async () => {
      const page = createMockPage();
      const obj = await UI5Object.create({
        uuid: 'uuid-1',
        type: 'sap.ui.model.json.JSONModel',
        page,
      });
      const proxy = obj.toProxy() as Record<string, unknown>;
      expect(proxy['__proto__']).toBeUndefined();
    });

    // ── has trap ────────────────────────────────────────────────────

    it('has trap reports true for methods in methodCache', async () => {
      const evaluateFn = vi.fn().mockResolvedValue(['getData', 'setData']);
      const page = createMockPage({ evaluate: evaluateFn });
      const obj = await UI5Object.create({
        uuid: 'uuid-1',
        type: 'sap.ui.model.json.JSONModel',
        page,
      });
      const proxy = obj.toProxy() as object;
      expect('getData' in proxy).toBe(true);
      expect('setData' in proxy).toBe(true);
    });

    it('has trap reports false for methods not in methodCache', async () => {
      const page = createMockPage();
      const obj = await UI5Object.create({
        uuid: 'uuid-1',
        type: 'sap.ui.model.json.JSONModel',
        page,
      });
      const proxy = obj.toProxy() as object;
      expect('nonExistentMethod' in proxy).toBe(false);
    });

    it('has trap always reports true for uuid and type', async () => {
      const page = createMockPage();
      const obj = await UI5Object.create({
        uuid: 'uuid-1',
        type: 'sap.ui.model.json.JSONModel',
        page,
      });
      const proxy = obj.toProxy() as object;
      expect('uuid' in proxy).toBe(true);
      expect('type' in proxy).toBe(true);
    });

    it('has trap reports false for symbol properties', async () => {
      const page = createMockPage();
      const obj = await UI5Object.create({
        uuid: 'uuid-1',
        type: 'sap.ui.model.json.JSONModel',
        page,
      });
      const proxy = obj.toProxy() as object;
      expect(Symbol.toPrimitive in proxy).toBe(false);
    });
  });

  // ── handleObjectReturn — additional return type coverage ──────────

  describe('handleObjectReturn — returnType branches', () => {
    it('throws BridgeError with fallback message when error property is undefined', async () => {
      const { page } = createMockPageWithMethods([], {
        success: false,
        returnType: 'none',
        // error is omitted — triggers `result.error ?? "Method failed on ..."` fallback
        duration: 1,
      });
      const obj = await UI5Object.create({
        uuid: 'uuid-1',
        type: 'sap.ui.model.json.JSONModel',
        page,
      });
      await expect(obj.executeMethod('badMethod', [])).rejects.toThrow(
        'Method failed on sap.ui.model.json.JSONModel',
      );
    });

    it('returns undefined for unknown returnType', async () => {
      const { page } = createMockPageWithMethods([], {
        success: true,
        returnType: 'unknown',
        duration: 1,
      });
      const obj = await UI5Object.create({
        uuid: 'uuid-1',
        type: 'sap.ui.model.json.JSONModel',
        page,
      });
      const result = await obj.executeMethod('someMethod', []);
      expect(result).toBeUndefined();
    });

    it('returns value for empty returnType', async () => {
      const { page } = createMockPageWithMethods([], {
        success: true,
        returnType: 'empty',
        value: null,
        duration: 1,
      });
      const obj = await UI5Object.create({
        uuid: 'uuid-1',
        type: 'sap.ui.model.json.JSONModel',
        page,
      });
      const result = await obj.executeMethod('emptyMethod', []);
      expect(result).toBeNull();
    });

    it('returns value for element returnType', async () => {
      const { page } = createMockPageWithMethods([], {
        success: true,
        returnType: 'element',
        value: { id: 'ctrl-1', controlType: 'sap.m.Button' },
        duration: 1,
      });
      const obj = await UI5Object.create({
        uuid: 'uuid-1',
        type: 'sap.ui.model.json.JSONModel',
        page,
      });
      const result = await obj.executeMethod('getElement', []);
      expect(result).toEqual({ id: 'ctrl-1', controlType: 'sap.m.Button' });
    });

    it('returns value for newElement returnType', async () => {
      const { page } = createMockPageWithMethods([], {
        success: true,
        returnType: 'newElement',
        value: { id: 'new-ctrl', controlType: 'sap.m.Input' },
        duration: 1,
      });
      const obj = await UI5Object.create({
        uuid: 'uuid-1',
        type: 'sap.ui.model.json.JSONModel',
        page,
      });
      const result = await obj.executeMethod('createElement', []);
      expect(result).toEqual({ id: 'new-ctrl', controlType: 'sap.m.Input' });
    });

    it('returns value for aggregation returnType', async () => {
      const { page } = createMockPageWithMethods([], {
        success: true,
        returnType: 'aggregation',
        value: [{ id: 'item-1' }, { id: 'item-2' }],
        duration: 1,
      });
      const obj = await UI5Object.create({
        uuid: 'uuid-1',
        type: 'sap.ui.model.json.JSONModel',
        page,
      });
      const result = await obj.executeMethod('getAggregation', []);
      expect(result).toEqual([{ id: 'item-1' }, { id: 'item-2' }]);
    });

    it('creates sub-proxy with fallback uuid/objectType when missing', async () => {
      const evaluateFn = vi.fn();
      // 1st call: loadMethods for parent
      evaluateFn.mockResolvedValueOnce([]);
      // 2nd call: executeMethod returns object with no uuid/objectType
      evaluateFn.mockResolvedValueOnce({
        success: true,
        returnType: 'object',
        // uuid and objectType intentionally omitted — triggers ?? fallbacks
        duration: 1,
      });
      // 3rd call: loadMethods for sub-object
      evaluateFn.mockResolvedValueOnce([]);
      const page = { evaluate: evaluateFn, waitForFunction: vi.fn() } as unknown as Page;

      const obj = await UI5Object.create({
        uuid: 'uuid-1',
        type: 'sap.ui.model.json.JSONModel',
        page,
      });
      const sub = (await obj.executeMethod('getUnknown', [])) as Record<string, unknown>;
      expect(sub['uuid']).toBe('');
      expect(sub['type']).toBe('unknown');
    });
  });

  // ── GAP-11: objectArray return type handling ────────────────────────

  describe('handleObjectReturn — objectArray (GAP-11)', () => {
    it('creates proxied UI5Objects for each UUID in objectArray', async () => {
      const evaluateFn = vi.fn();
      // 1st call: loadMethods for parent
      evaluateFn.mockResolvedValueOnce(['getFilters']);
      // 2nd call: executeMethod returns objectArray
      evaluateFn.mockResolvedValueOnce({
        success: true,
        returnType: 'objectArray',
        uuids: ['filter-uuid-1', 'filter-uuid-2'],
        objectTypes: ['sap.ui.model.Filter', 'sap.ui.model.Sorter'],
        isArray: true,
        duration: 1,
      });
      // 3rd call: loadMethods for first sub-object
      evaluateFn.mockResolvedValueOnce(['getPath']);
      // 4th call: loadMethods for second sub-object
      evaluateFn.mockResolvedValueOnce(['getSortOrder']);
      const page = { evaluate: evaluateFn, waitForFunction: vi.fn() } as unknown as Page;

      const obj = await UI5Object.create({
        uuid: 'uuid-1',
        type: 'sap.ui.model.json.JSONModel',
        page,
      });
      const result = (await obj.executeMethod('getFilters', [])) as (Record<
        string,
        unknown
      > | null)[];

      expect(result).toHaveLength(2);
      expect(result[0]).toBeDefined();
      expect(result[0]?.['uuid']).toBe('filter-uuid-1');
      expect(result[0]?.['type']).toBe('sap.ui.model.Filter');
      expect(result[1]).toBeDefined();
      expect(result[1]?.['uuid']).toBe('filter-uuid-2');
      expect(result[1]?.['type']).toBe('sap.ui.model.Sorter');
    });

    it('returns null for items with empty UUIDs in objectArray', async () => {
      const evaluateFn = vi.fn();
      // 1st call: loadMethods
      evaluateFn.mockResolvedValueOnce(['getMixed']);
      // 2nd call: objectArray with one empty UUID (primitive item)
      evaluateFn.mockResolvedValueOnce({
        success: true,
        returnType: 'objectArray',
        uuids: ['obj-uuid-1', ''],
        objectTypes: ['sap.ui.model.Filter', 'primitive'],
        isArray: true,
        duration: 1,
      });
      // 3rd call: loadMethods for first sub-object
      evaluateFn.mockResolvedValueOnce(['getPath']);
      const page = { evaluate: evaluateFn, waitForFunction: vi.fn() } as unknown as Page;

      const obj = await UI5Object.create({
        uuid: 'uuid-1',
        type: 'sap.ui.model.json.JSONModel',
        page,
      });
      const result = (await obj.executeMethod('getMixed', [])) as (Record<
        string,
        unknown
      > | null)[];

      expect(result).toHaveLength(2);
      expect(result[0]?.['uuid']).toBe('obj-uuid-1');
      // Empty UUID → null
      expect(result[1]).toBeNull();
    });

    it('returns empty array for objectArray with no UUIDs', async () => {
      const evaluateFn = vi.fn();
      evaluateFn.mockResolvedValueOnce(['getItems']);
      evaluateFn.mockResolvedValueOnce({
        success: true,
        returnType: 'objectArray',
        uuids: [],
        objectTypes: [],
        isArray: true,
        duration: 1,
      });
      const page = { evaluate: evaluateFn, waitForFunction: vi.fn() } as unknown as Page;

      const obj = await UI5Object.create({
        uuid: 'uuid-1',
        type: 'sap.ui.model.json.JSONModel',
        page,
      });
      const result = (await obj.executeMethod('getItems', [])) as unknown[];

      expect(result).toEqual([]);
    });

    it('proxied sub-objects from objectArray support method calls', async () => {
      const evaluateFn = vi.fn();
      // 1st: loadMethods parent
      evaluateFn.mockResolvedValueOnce(['getFilters']);
      // 2nd: objectArray result
      evaluateFn.mockResolvedValueOnce({
        success: true,
        returnType: 'objectArray',
        uuids: ['filter-uuid-1'],
        objectTypes: ['sap.ui.model.Filter'],
        isArray: true,
        duration: 1,
      });
      // 3rd: loadMethods for sub-object
      evaluateFn.mockResolvedValueOnce(['getPath', 'getValue1']);
      // 4th: calling getPath on sub-object → result
      evaluateFn.mockResolvedValue({
        success: true,
        returnType: 'result',
        value: '/CustomerName',
        duration: 1,
      });
      const page = { evaluate: evaluateFn, waitForFunction: vi.fn() } as unknown as Page;

      const obj = await UI5Object.create({
        uuid: 'uuid-1',
        type: 'sap.ui.model.json.JSONModel',
        page,
      });
      const filters = (await obj.executeMethod('getFilters', [])) as Record<string, unknown>[];
      const firstFilter = filters[0] as Record<
        string,
        ((...args: unknown[]) => Promise<unknown>) | undefined
      >;
      const getPath = firstFilter['getPath'];
      expect(getPath).toBeDefined();
      const pathResult = await getPath?.();
      expect(pathResult).toBe('/CustomerName');
    });

    it('handles objectArray with missing uuids/objectTypes (fallback to empty arrays)', async () => {
      const evaluateFn = vi.fn();
      evaluateFn.mockResolvedValueOnce([]);
      evaluateFn.mockResolvedValueOnce({
        success: true,
        returnType: 'objectArray',
        // uuids and objectTypes intentionally omitted — triggers ?? [] fallbacks
        duration: 1,
      });
      const page = { evaluate: evaluateFn, waitForFunction: vi.fn() } as unknown as Page;

      const obj = await UI5Object.create({
        uuid: 'uuid-1',
        type: 'sap.ui.model.json.JSONModel',
        page,
      });
      const result = (await obj.executeMethod('getMissing', [])) as unknown[];
      expect(result).toEqual([]);
    });

    it('uses fallback type "unknown" when objectTypes array is shorter than uuids', async () => {
      const evaluateFn = vi.fn();
      evaluateFn.mockResolvedValueOnce([]);
      evaluateFn.mockResolvedValueOnce({
        success: true,
        returnType: 'objectArray',
        uuids: ['a-uuid', 'b-uuid'],
        objectTypes: ['sap.ui.model.Filter'],
        // second type is missing — triggers at(idx) ?? 'unknown' fallback
        isArray: true,
        duration: 1,
      });
      // loadMethods for first sub-object
      evaluateFn.mockResolvedValueOnce([]);
      // loadMethods for second sub-object
      evaluateFn.mockResolvedValueOnce([]);
      const page = { evaluate: evaluateFn, waitForFunction: vi.fn() } as unknown as Page;

      const obj = await UI5Object.create({
        uuid: 'uuid-1',
        type: 'sap.ui.model.json.JSONModel',
        page,
      });
      const result = (await obj.executeMethod('getItems', [])) as (Record<
        string,
        unknown
      > | null)[];

      expect(result).toHaveLength(2);
      expect(result[0]?.['type']).toBe('sap.ui.model.Filter');
      expect(result[1]?.['type']).toBe('unknown');
    });
  });

  // ── Additional proxy get trap coverage ──────────────────────────────

  describe('toProxy() — additional get trap paths', () => {
    it('valueOf returns string representation', async () => {
      const page = createMockPage();
      const obj = await UI5Object.create({
        uuid: 'uuid-1',
        type: 'sap.ui.model.json.JSONModel',
        page,
      });
      const proxy = obj.toProxy() as Record<string, (() => string) | undefined>;
      // eslint-disable-next-line @typescript-eslint/dot-notation -- bracket notation avoids unbound-method on Object.prototype.valueOf
      const valueOfFn = proxy['valueOf'];
      expect(valueOfFn).toBeDefined();
      expect(valueOfFn?.()).toBe('[UI5Object sap.ui.model.json.JSONModel uuid-1]');
    });

    it('routes executeMethod through explicit method via proxy', async () => {
      const { page } = createMockPageWithMethods([], {
        success: true,
        returnType: 'result',
        value: 'exec-result',
        duration: 1,
      });
      const obj = await UI5Object.create({
        uuid: 'uuid-1',
        type: 'sap.ui.model.json.JSONModel',
        page,
      });
      const proxy = obj.toProxy() as Record<
        string,
        ((...args: unknown[]) => Promise<unknown>) | undefined
      >;
      const execMethod = proxy['executeMethod'];
      expect(execMethod).toBeDefined();
      const result = await execMethod?.('someMethod', []);
      expect(result).toBe('exec-result');
    });

    it('returns undefined for prototype access (NON_PROXIED_PROPERTIES)', async () => {
      const page = createMockPage();
      const obj = await UI5Object.create({
        uuid: 'uuid-1',
        type: 'sap.ui.model.json.JSONModel',
        page,
      });
      const proxy = obj.toProxy() as Record<string, unknown>;
      expect(proxy['prototype']).toBeUndefined();
    });

    it('returns undefined for getMetadata access (NON_PROXIED not EXPLICIT)', async () => {
      const page = createMockPage();
      const obj = await UI5Object.create({
        uuid: 'uuid-1',
        type: 'sap.ui.model.json.JSONModel',
        page,
      });
      const proxy = obj.toProxy() as Record<string, unknown>;
      expect(proxy['getMetadata']).toBeUndefined();
    });

    it('returns undefined for destroy access (NON_PROXIED not EXPLICIT)', async () => {
      const page = createMockPage();
      const obj = await UI5Object.create({
        uuid: 'uuid-1',
        type: 'sap.ui.model.json.JSONModel',
        page,
      });
      const proxy = obj.toProxy() as Record<string, unknown>;
      expect(proxy['destroy']).toBeUndefined();
    });

    it('preventExtensions trap returns true', async () => {
      const page = createMockPage();
      const obj = await UI5Object.create({
        uuid: 'uuid-1',
        type: 'sap.ui.model.json.JSONModel',
        page,
      });
      const proxy = obj.toProxy() as object;
      // Object.preventExtensions calls the preventExtensions trap
      expect(Object.preventExtensions(proxy)).toBe(proxy);
    });

    it('forwards arbitrary unknown method names through generic forwarder', async () => {
      const { page, evaluateFn } = createMockPageWithMethods([], {
        success: true,
        returnType: 'result',
        value: 'dynamic-result',
        duration: 1,
      });
      const obj = await UI5Object.create({
        uuid: 'uuid-1',
        type: 'sap.ui.model.json.JSONModel',
        page,
      });
      const proxy = obj.toProxy() as Record<
        string,
        ((...args: unknown[]) => Promise<unknown>) | undefined
      >;
      const dynamicMethod = proxy['someArbitraryMethod'];
      expect(dynamicMethod).toBeDefined();
      const result = await dynamicMethod?.('arg1', 'arg2');
      expect(result).toBe('dynamic-result');
      // Verify args were forwarded
      const [, args] = evaluateFn.mock.calls[1] as [unknown, Record<string, unknown>];
      expect(args).toEqual(
        expect.objectContaining({
          methodName: 'someArbitraryMethod',
          args: ['arg1', 'arg2'],
        }),
      );
    });
  });

  // ── getBindingContext without modelName ─────────────────────────────

  describe('getBindingContext() — no modelName path', () => {
    it('passes empty args array when modelName is undefined', async () => {
      const { page, evaluateFn } = createMockPageWithMethods(['getBindingContext'], {
        success: true,
        returnType: 'none',
        duration: 1,
      });
      const obj = await UI5Object.create({
        uuid: 'uuid-1',
        type: 'sap.ui.model.json.JSONModel',
        page,
      });
      await obj.getBindingContext();
      const [, args] = evaluateFn.mock.calls[1] as [unknown, Record<string, unknown>];
      expect(args).toEqual(
        expect.objectContaining({
          methodName: 'getBindingContext',
          args: [],
        }),
      );
    });
  });

  // ── loadMethods browser callback coverage ──────────────────────────
  //
  // The loadMethods() browser callback runs inside page.evaluate(). To get
  // V8 coverage of the callback body, we make the mock actually invoke the
  // callback function with a synthetic global/window setup.

  describe('loadMethods — browser callback branches', () => {
    /**
     * Creates a mock page whose evaluate function invokes the passed
     * callback against a synthetic `window` object. This lets V8 track
     * coverage of the callback body.
     *
     * The browser callback uses `Reflect.get(window, ...)` — in Node.js
     * `window` does not exist, so we temporarily alias `globalThis` as
     * `window` before invoking the callback.
     */
    function createCallbackInvokingPage(bridgeSetup: Record<string, unknown> | undefined): {
      page: Page;
      evaluateFn: ReturnType<typeof vi.fn>;
    } {
      const evaluateFn = vi.fn().mockImplementation(
        // eslint-disable-next-line @typescript-eslint/promise-function-async -- synchronous mock wrapping; page.evaluate signature expects Promise return
        (
          fn: (params: { uuid: string; bridgeNs: string }) => string[],
          args: { uuid: string; bridgeNs: string },
        ): Promise<string[]> => {
          const bridgeNs = args.bridgeNs;
          // In Node.js, `window` is not defined. The callback references it
          // via `Reflect.get(window, ...)`, so we temporarily define it.
          const hadWindow = 'window' in globalThis;
          if (!hadWindow) {
            Reflect.set(globalThis, 'window', globalThis);
          }
          if (bridgeSetup !== undefined) {
            Reflect.set(globalThis, bridgeNs, bridgeSetup);
          }
          try {
            return Promise.resolve(fn(args));
          } finally {
            Reflect.deleteProperty(globalThis, bridgeNs);
            if (!hadWindow) {
              Reflect.deleteProperty(globalThis, 'window');
            }
          }
        },
      );
      return {
        page: { evaluate: evaluateFn, waitForFunction: vi.fn() } as unknown as Page,
        evaluateFn,
      };
    }

    it('returns empty array when bridge namespace is not on window', async () => {
      const { page } = createCallbackInvokingPage(undefined);
      const obj = await UI5Object.create({
        uuid: 'uuid-1',
        type: 'sap.ui.model.json.JSONModel',
        page,
      });
      expect(obj.methodCache.size).toBe(0);
    });

    it('returns empty array when getObject function is missing from bridge', async () => {
      const { page } = createCallbackInvokingPage({
        // Bridge exists but has no getObject function
        someOtherUtil: () => null,
      });
      const obj = await UI5Object.create({
        uuid: 'uuid-1',
        type: 'sap.ui.model.json.JSONModel',
        page,
      });
      expect(obj.methodCache.size).toBe(0);
    });

    it('returns empty array when getObject returns null (object not found)', async () => {
      const { page } = createCallbackInvokingPage({
        getObject: () => null,
      });
      const obj = await UI5Object.create({
        uuid: 'uuid-1',
        type: 'sap.ui.model.json.JSONModel',
        page,
      });
      expect(obj.methodCache.size).toBe(0);
    });

    it('collects public methods from prototype chain', async () => {
      // Create a mock UI5-like object with a prototype chain
      class BaseObj {
        getData(): string {
          return 'data';
        }
        // eslint-disable-next-line @typescript-eslint/no-unused-vars -- stub for prototype chain testing
        setData(_d: string): void {
          /* noop */
        }
        /** Private method — should be excluded by the _-prefix filter */
        // eslint-disable-next-line @typescript-eslint/naming-convention -- intentional _-prefix to test exclusion filter
        _internalMethod(): void {
          /* noop */
        }
      }
      class DerivedObj extends BaseObj {
        getProperty(): string {
          return 'prop';
        }
      }

      const { page } = createCallbackInvokingPage({
        getObject: () => new DerivedObj(),
      });
      const obj = await UI5Object.create({
        uuid: 'uuid-1',
        type: 'sap.ui.model.json.JSONModel',
        page,
      });
      // Should include public methods from both DerivedObj and BaseObj prototypes
      expect(obj.methodCache.has('getProperty')).toBe(true);
      expect(obj.methodCache.has('getData')).toBe(true);
      expect(obj.methodCache.has('setData')).toBe(true);
      // Should exclude _-prefixed internal methods
      expect(obj.methodCache.has('_internalMethod')).toBe(false);
      // constructor is a function on the prototype and doesn't start with _,
      // so the callback DOES include it (filtering is only _-prefixed).
      expect(obj.methodCache.has('constructor')).toBe(true);
    });

    it('excludes duplicate method names across prototype levels', async () => {
      class Base {
        sharedMethod(): string {
          return 'base';
        }
      }
      class Child extends Base {
        // Override — same name should appear only once
        override sharedMethod(): string {
          return 'child';
        }
        childOnly(): void {
          /* noop */
        }
      }

      const { page } = createCallbackInvokingPage({
        getObject: () => new Child(),
      });
      const obj = await UI5Object.create({
        uuid: 'uuid-1',
        type: 'TestType',
        page,
      });
      // sharedMethod appears in both prototypes but should only be in cache once
      expect(obj.methodCache.has('sharedMethod')).toBe(true);
      expect(obj.methodCache.has('childOnly')).toBe(true);
      // Verify it's exactly the methods we expect (constructor is excluded because it starts with lowercase but is still a function)
      // Actually constructor doesn't start with _ and IS a function, so it would be included.
      // Let's just check the total - depends on how many methods are on the chain.
      expect(obj.methodCache.size).toBeGreaterThanOrEqual(2);
    });

    it('excludes non-function properties from prototype chain', async () => {
      // Create an object with non-function properties on its prototype
      const proto = {
        methodA(): string {
          return 'a';
        },
        stringProp: 'hello',
        numProp: 42,
        boolProp: true,
      };
      const mockObj = Object.create(proto) as Record<string, unknown>;

      const { page } = createCallbackInvokingPage({
        getObject: () => mockObj,
      });
      const obj = await UI5Object.create({
        uuid: 'uuid-1',
        type: 'TestType',
        page,
      });
      expect(obj.methodCache.has('methodA')).toBe(true);
      // Non-function properties should be excluded
      expect(obj.methodCache.has('stringProp')).toBe(false);
      expect(obj.methodCache.has('numProp')).toBe(false);
      expect(obj.methodCache.has('boolProp')).toBe(false);
    });
  });
});
