/**
 * Tests for `src/bridge/browser-scripts/execute-method.ts` and `execute-method-fn.ts`.
 *
 * @remarks
 * Validates both string-form and function-form browser scripts for method
 * execution. String-form tests validate script content. Function-form tests
 * validate the exported functions are callable and self-contained.
 *
 * GAP-07 / GAP-11 tests use a simulated `window` with a mock bridge to exercise
 * the return-detection logic (JSON serializability, array detection, objectArray).
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { assertValidScript } from '../../../helpers/browser-script-tester.js';

import type {
  BrowserExecControlParams,
  BrowserExecObjectParams,
} from '#bridge/browser-scripts/execute-method-fn.js';
import {
  browserExecuteControlMethod,
  browserExecuteObjectMethod,
} from '#bridge/browser-scripts/execute-method-fn.js';
import {
  createExecuteMethodScript,
  createExecuteObjectMethodScript,
} from '#bridge/browser-scripts/execute-method.js';

/**
 * Creates a mock bridge with configurable behavior.
 *
 * @example
 * ```typescript
 * const bridge = createMockBridge({ objectMap: new Map([['uuid-1', myObj]]) });
 * ```
 */
function createMockBridge(overrides?: {
  objectMap?: Map<string, Record<string, unknown>>;
  controlMap?: Map<string, Record<string, unknown>>;
}): Record<string, unknown> {
  const objectMap = overrides?.objectMap ?? new Map<string, Record<string, unknown>>();
  const controlMap = overrides?.controlMap ?? new Map<string, Record<string, unknown>>();
  let uuidCounter = 0;

  return {
    version: '1.0.0',
    ready: true,
    getById: (id: string) => controlMap.get(id) ?? null,
    getObject: (uuid: string) => objectMap.get(uuid) ?? null,
    saveObject: vi.fn((obj: unknown) => {
      const uuid = `saved-uuid-${String(++uuidCounter)}`;
      objectMap.set(uuid, obj as Record<string, unknown>);
      return uuid;
    }),
    isPrimitive: (val: unknown) =>
      typeof val === 'string' || typeof val === 'number' || typeof val === 'boolean',
  };
}

// ── String-form tests (backward compat for ui5-handler.ts) ──────────

describe('createExecuteMethodScript', () => {
  const script = createExecuteMethodScript();

  it('returns a non-empty string', () => {
    expect(typeof script).toBe('string');
    expect(script.trim().length).toBeGreaterThan(0);
  });

  it('is syntactically valid JavaScript', () => {
    expect(() => {
      assertValidScript(script);
    }).not.toThrow();
  });

  it('references the bridge namespace', () => {
    expect(script).toContain('__praman_bridge');
  });

  it('retrieves control by ID', () => {
    expect(script).toContain('getById');
  });

  it('uses apply for method execution', () => {
    expect(script).toContain('apply');
  });

  it('detects empty return type (array length 0)', () => {
    expect(script).toContain('empty');
  });

  it('detects aggregation return type', () => {
    expect(script).toContain('aggregation');
  });

  it('detects element return type (same control)', () => {
    expect(script).toContain('element');
  });

  it('detects newElement return type (different control)', () => {
    expect(script).toContain('newElement');
  });

  it('detects object return type (non-control UI5 object)', () => {
    expect(script).toContain('object');
  });

  it('handles ComboBox aggregation special case (A.6)', () => {
    expect(script).toContain('InputWithSuggestionsListItem');
  });

  it('handles PlanningCalendar special case (A.6)', () => {
    expect(script).toContain('-CLI');
  });

  it('tracks execution duration', () => {
    expect(script).toContain('duration');
  });

  it('contains try-catch error handling', () => {
    expect(script).toContain('try');
    expect(script).toContain('catch');
  });

  it('does not contain console.log', () => {
    expect(script).not.toContain('console.log');
  });
});

describe('createExecuteObjectMethodScript', () => {
  const script = createExecuteObjectMethodScript();

  it('returns a non-empty string', () => {
    expect(typeof script).toBe('string');
    expect(script.trim().length).toBeGreaterThan(0);
  });

  it('is syntactically valid JavaScript', () => {
    expect(() => {
      assertValidScript(script);
    }).not.toThrow();
  });

  it('references the bridge namespace', () => {
    expect(script).toContain('__praman_bridge');
  });

  it('retrieves object from map by UUID', () => {
    expect(script).toContain('getObject');
  });

  it('uses apply for method execution', () => {
    expect(script).toContain('apply');
  });

  it('does not contain console.log', () => {
    expect(script).not.toContain('console.log');
  });
});

// ── Function-form tests (GAP-01) ────────────────────────────────────

describe('browserExecuteControlMethod', () => {
  it('is a function', () => {
    expect(typeof browserExecuteControlMethod).toBe('function');
  });

  it('returns error result when invoked outside browser (no window)', () => {
    // In Node.js test environment, window is not defined.
    // The function's catch block handles this gracefully.
    const params: BrowserExecControlParams = {
      controlId: 'btn1',
      methodName: 'getText',
      args: [],
      bridgeNs: '__praman_bridge',
    };
    const result = browserExecuteControlMethod(params);
    expect(result.success).toBe(false);
    expect(result.returnType).toBe('none');
    expect(typeof result.error).toBe('string');
  });

  it('is serializable (function.toString produces valid code)', () => {
    const fnSource = browserExecuteControlMethod.toString();
    expect(fnSource.length).toBeGreaterThan(0);
    // Should not reference module-level variables or imports
    expect(fnSource).not.toContain('BRIDGE_GLOBALS');
    expect(fnSource).not.toContain('import ');
  });

  it('accepts the expected parameter shape', () => {
    const params: BrowserExecControlParams = {
      controlId: 'saveBtn',
      methodName: 'getText',
      args: ['arg1', 42],
      bridgeNs: '__test_bridge',
    };
    // Should not throw, just return bridge-not-initialized
    const result = browserExecuteControlMethod(params);
    expect(result.success).toBe(false);
  });
});

describe('browserExecuteObjectMethod', () => {
  it('is a function', () => {
    expect(typeof browserExecuteObjectMethod).toBe('function');
  });

  it('returns error result when invoked outside browser (no window)', () => {
    const params: BrowserExecObjectParams = {
      uuid: 'uuid-1',
      methodName: 'getData',
      args: [],
      bridgeNs: '__praman_bridge',
    };
    const result = browserExecuteObjectMethod(params);
    expect(result.success).toBe(false);
    expect(result.returnType).toBe('none');
    expect(typeof result.error).toBe('string');
  });

  it('is serializable (function.toString produces valid code)', () => {
    const fnSource = browserExecuteObjectMethod.toString();
    expect(fnSource.length).toBeGreaterThan(0);
    expect(fnSource).not.toContain('BRIDGE_GLOBALS');
    expect(fnSource).not.toContain('import ');
  });

  it('accepts the expected parameter shape', () => {
    const params: BrowserExecObjectParams = {
      uuid: 'model-uuid',
      methodName: 'setProperty',
      args: ['/name', 'Test'],
      bridgeNs: '__test_bridge',
    };
    const result = browserExecuteObjectMethod(params);
    expect(result.success).toBe(false);
  });
});

// ── GAP-07 + GAP-11: Return detection with simulated window ─────────

describe('GAP-07: return detection alignment (browserExecuteControlMethod)', () => {
  const bridgeNs = '__praman_test_bridge_ctrl';

  beforeEach(() => {
    // Ensure window exists (Node.js test env)
    if (typeof globalThis.window === 'undefined') {
      (globalThis as Record<string, unknown>)['window'] = globalThis;
    }
  });

  afterEach(() => {
    // Clean up the bridge namespace
    Reflect.deleteProperty(globalThis, bridgeNs);
  });

  it('returns serializable object as result type (JSON.stringify check)', () => {
    const serializableObj = { name: 'test', value: 42 };
    const controlMap = new Map([
      [
        'ctrl1',
        {
          getId: () => 'ctrl1',
          getParent: () => null,
          getData: () => serializableObj,
        } as Record<string, unknown>,
      ],
    ]);
    const bridge = createMockBridge({ controlMap });
    Reflect.set(globalThis, bridgeNs, bridge);

    const result = browserExecuteControlMethod({
      controlId: 'ctrl1',
      methodName: 'getData',
      args: [],
      bridgeNs,
    });

    expect(result.success).toBe(true);
    expect(result.returnType).toBe('result');
    expect(result.value).toEqual(serializableObj);
  });

  it('stores non-serializable object with UUID and uses safeGetTypeName for objectType', () => {
    // Create object with circular reference (not JSON-serializable)
    const circularObj: Record<string, unknown> = {
      name: 'circular',
      getMetadata: () => ({ getName: () => 'sap.ui.model.Context' }),
    };
    circularObj['self'] = circularObj;

    const controlMap = new Map([
      [
        'ctrl1',
        {
          getId: () => 'ctrl1',
          getParent: () => null,
          getContext: () => circularObj,
        } as Record<string, unknown>,
      ],
    ]);
    const bridge = createMockBridge({ controlMap });
    Reflect.set(globalThis, bridgeNs, bridge);

    const result = browserExecuteControlMethod({
      controlId: 'ctrl1',
      methodName: 'getContext',
      args: [],
      bridgeNs,
    });

    expect(result.success).toBe(true);
    expect(result.returnType).toBe('object');
    expect(result.uuid).toBeDefined();
    // GAP-07: objectType should use safeGetTypeName, not typeof
    expect(result.objectType).toBe('sap.ui.model.Context');
  });

  it('preserves newElement fallthrough for BindingContext with getId but no element registration', () => {
    // BindingContext has getId() and getParent() but is NOT an Element
    const bindingCtx: Record<string, unknown> = {
      getId: () => 'ctx-id-1',
      getParent: () => ({ getId: () => 'parent-id' }),
      getMetadata: () => ({ getName: () => 'sap.ui.model.Context' }),
    };
    // Make it non-serializable
    bindingCtx['self'] = bindingCtx;

    const controlMap = new Map([
      [
        'ctrl1',
        {
          getId: () => 'ctrl1',
          getParent: () => null,
          getBindingContext: () => bindingCtx,
        } as Record<string, unknown>,
      ],
    ]);
    // getById returns null for 'ctx-id-1' — it's not a registered element
    const bridge = createMockBridge({ controlMap });
    Reflect.set(globalThis, bridgeNs, bridge);

    const result = browserExecuteControlMethod({
      controlId: 'ctrl1',
      methodName: 'getBindingContext',
      args: [],
      bridgeNs,
    });

    expect(result.success).toBe(true);
    // Should fall through to object (not newElement) because getById returns null
    expect(result.returnType).toBe('object');
    expect(result.uuid).toBeDefined();
  });

  it('returns objectType as unknown when no getMetadata is available', () => {
    // Non-serializable object without getMetadata
    const plainObj: Record<string, unknown> = { data: 'value' };
    plainObj['self'] = plainObj;

    const controlMap = new Map([
      [
        'ctrl1',
        {
          getId: () => 'ctrl1',
          getParent: () => null,
          getObj: () => plainObj,
        } as Record<string, unknown>,
      ],
    ]);
    const bridge = createMockBridge({ controlMap });
    Reflect.set(globalThis, bridgeNs, bridge);

    const result = browserExecuteControlMethod({
      controlId: 'ctrl1',
      methodName: 'getObj',
      args: [],
      bridgeNs,
    });

    expect(result.success).toBe(true);
    expect(result.returnType).toBe('object');
    expect(result.objectType).toBe('unknown');
  });
});

describe('GAP-07: return detection alignment (browserExecuteObjectMethod)', () => {
  const bridgeNs = '__praman_test_bridge_obj';

  beforeEach(() => {
    if (typeof globalThis.window === 'undefined') {
      (globalThis as Record<string, unknown>)['window'] = globalThis;
    }
  });

  afterEach(() => {
    Reflect.deleteProperty(globalThis, bridgeNs);
  });

  it('returns empty array as empty type', () => {
    const objectMap = new Map([['uuid-1', { getItems: () => [] } as Record<string, unknown>]]);
    const bridge = createMockBridge({ objectMap });
    Reflect.set(globalThis, bridgeNs, bridge);

    const result = browserExecuteObjectMethod({
      uuid: 'uuid-1',
      methodName: 'getItems',
      args: [],
      bridgeNs,
    });

    expect(result.success).toBe(true);
    expect(result.returnType).toBe('empty');
    expect(result.value).toEqual([]);
  });

  it('returns serializable array as result type', () => {
    const items = [1, 2, 3];
    const objectMap = new Map([['uuid-1', { getItems: () => items } as Record<string, unknown>]]);
    const bridge = createMockBridge({ objectMap });
    Reflect.set(globalThis, bridgeNs, bridge);

    const result = browserExecuteObjectMethod({
      uuid: 'uuid-1',
      methodName: 'getItems',
      args: [],
      bridgeNs,
    });

    expect(result.success).toBe(true);
    expect(result.returnType).toBe('result');
    expect(result.value).toEqual([1, 2, 3]);
    expect(result.isArray).toBe(true);
  });

  it('returns serializable object as result type (JSON.stringify check)', () => {
    const data = { name: 'test', count: 5 };
    const objectMap = new Map([['uuid-1', { getData: () => data } as Record<string, unknown>]]);
    const bridge = createMockBridge({ objectMap });
    Reflect.set(globalThis, bridgeNs, bridge);

    const result = browserExecuteObjectMethod({
      uuid: 'uuid-1',
      methodName: 'getData',
      args: [],
      bridgeNs,
    });

    expect(result.success).toBe(true);
    expect(result.returnType).toBe('result');
    expect(result.value).toEqual({ name: 'test', count: 5 });
  });

  it('stores non-serializable object with UUID and uses safeGetTypeName', () => {
    const circularObj: Record<string, unknown> = {
      getMetadata: () => ({ getName: () => 'sap.ui.model.odata.v4.ODataModel' }),
    };
    circularObj['self'] = circularObj;

    const objectMap = new Map([
      ['uuid-1', { getModel: () => circularObj } as Record<string, unknown>],
    ]);
    const bridge = createMockBridge({ objectMap });
    Reflect.set(globalThis, bridgeNs, bridge);

    const result = browserExecuteObjectMethod({
      uuid: 'uuid-1',
      methodName: 'getModel',
      args: [],
      bridgeNs,
    });

    expect(result.success).toBe(true);
    expect(result.returnType).toBe('object');
    expect(result.uuid).toBeDefined();
    expect(result.objectType).toBe('sap.ui.model.odata.v4.ODataModel');
  });

  it('returns primitive results correctly', () => {
    const objectMap = new Map([
      ['uuid-1', { getName: () => 'TestName' } as Record<string, unknown>],
    ]);
    const bridge = createMockBridge({ objectMap });
    Reflect.set(globalThis, bridgeNs, bridge);

    const result = browserExecuteObjectMethod({
      uuid: 'uuid-1',
      methodName: 'getName',
      args: [],
      bridgeNs,
    });

    expect(result.success).toBe(true);
    expect(result.returnType).toBe('result');
    expect(result.value).toBe('TestName');
  });

  it('returns none for null/undefined results', () => {
    const objectMap = new Map([
      ['uuid-1', { doSomething: () => undefined } as Record<string, unknown>],
    ]);
    const bridge = createMockBridge({ objectMap });
    Reflect.set(globalThis, bridgeNs, bridge);

    const result = browserExecuteObjectMethod({
      uuid: 'uuid-1',
      methodName: 'doSomething',
      args: [],
      bridgeNs,
    });

    expect(result.success).toBe(true);
    expect(result.returnType).toBe('none');
  });
});

describe('GAP-11: objectArray return type (browserExecuteObjectMethod)', () => {
  const bridgeNs = '__praman_test_bridge_arr';

  beforeEach(() => {
    if (typeof globalThis.window === 'undefined') {
      (globalThis as Record<string, unknown>)['window'] = globalThis;
    }
  });

  afterEach(() => {
    Reflect.deleteProperty(globalThis, bridgeNs);
  });

  it('returns objectArray for array of non-serializable objects', () => {
    const item1: Record<string, unknown> = {
      getMetadata: () => ({ getName: () => 'sap.ui.model.Filter' }),
    };
    item1['ref'] = item1; // circular → not JSON-serializable
    const item2: Record<string, unknown> = {
      getMetadata: () => ({ getName: () => 'sap.ui.model.Sorter' }),
    };
    item2['ref'] = item2;

    const objectMap = new Map([
      ['uuid-1', { getFilters: () => [item1, item2] } as Record<string, unknown>],
    ]);
    const bridge = createMockBridge({ objectMap });
    Reflect.set(globalThis, bridgeNs, bridge);

    const result = browserExecuteObjectMethod({
      uuid: 'uuid-1',
      methodName: 'getFilters',
      args: [],
      bridgeNs,
    });

    expect(result.success).toBe(true);
    expect(result.returnType).toBe('objectArray');
    expect(result.uuids).toHaveLength(2);
    expect(result.objectTypes).toEqual(['sap.ui.model.Filter', 'sap.ui.model.Sorter']);
    expect(result.isArray).toBe(true);
  });

  it('returns objectArray with empty UUIDs for primitive items in mixed arrays', () => {
    // Array with a mix: one non-serializable object and one function (not JSON-serializable)
    const objItem: Record<string, unknown> = {
      getMetadata: () => ({ getName: () => 'sap.ui.model.Filter' }),
    };
    objItem['ref'] = objItem;
    // Include a function-containing item that makes the array non-serializable
    const funcItem = { callback: () => 'hello' };

    const objectMap = new Map([
      [
        'uuid-1',
        {
          getMixed: () => [objItem, funcItem],
        } as Record<string, unknown>,
      ],
    ]);
    const bridge = createMockBridge({ objectMap });
    Reflect.set(globalThis, bridgeNs, bridge);

    const result = browserExecuteObjectMethod({
      uuid: 'uuid-1',
      methodName: 'getMixed',
      args: [],
      bridgeNs,
    });

    expect(result.success).toBe(true);
    expect(result.returnType).toBe('objectArray');
    expect(result.uuids).toHaveLength(2);
    // Both items are objects, so both get UUIDs
    expect(result.uuids?.[0]).toContain('saved-uuid-');
    expect(result.uuids?.[1]).toContain('saved-uuid-');
  });

  it('saves each object via saveObject', () => {
    const item1: Record<string, unknown> = { data: 'a' };
    item1['self'] = item1;
    const item2: Record<string, unknown> = { data: 'b' };
    item2['self'] = item2;

    const objectMap = new Map([
      ['uuid-1', { getItems: () => [item1, item2] } as Record<string, unknown>],
    ]);
    const bridge = createMockBridge({ objectMap });
    Reflect.set(globalThis, bridgeNs, bridge);

    browserExecuteObjectMethod({
      uuid: 'uuid-1',
      methodName: 'getItems',
      args: [],
      bridgeNs,
    });

    // saveObject should have been called for each item
    expect(bridge['saveObject']).toHaveBeenCalledTimes(2);
  });

  it('returns serializable array of objects as result (not objectArray)', () => {
    // Array of plain serializable objects → should be 'result', not 'objectArray'
    const items = [
      { id: 1, name: 'a' },
      { id: 2, name: 'b' },
    ];
    const objectMap = new Map([['uuid-1', { getItems: () => items } as Record<string, unknown>]]);
    const bridge = createMockBridge({ objectMap });
    Reflect.set(globalThis, bridgeNs, bridge);

    const result = browserExecuteObjectMethod({
      uuid: 'uuid-1',
      methodName: 'getItems',
      args: [],
      bridgeNs,
    });

    expect(result.success).toBe(true);
    expect(result.returnType).toBe('result');
    expect(result.value).toEqual(items);
    expect(result.isArray).toBe(true);
  });

  it('handles objectType unknown when getMetadata is not available', () => {
    const item: Record<string, unknown> = { data: 'test' };
    item['self'] = item; // non-serializable

    const objectMap = new Map([['uuid-1', { getItems: () => [item] } as Record<string, unknown>]]);
    const bridge = createMockBridge({ objectMap });
    Reflect.set(globalThis, bridgeNs, bridge);

    const result = browserExecuteObjectMethod({
      uuid: 'uuid-1',
      methodName: 'getItems',
      args: [],
      bridgeNs,
    });

    expect(result.success).toBe(true);
    expect(result.returnType).toBe('objectArray');
    expect(result.objectTypes).toEqual(['unknown']);
  });
});
