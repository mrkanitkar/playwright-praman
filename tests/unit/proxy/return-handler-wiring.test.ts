/**
 * Tests for sub-proxy wiring in `handleBridgeReturn` (B3d).
 *
 * @remarks
 * When a `BridgeReturnContext` is provided, `handleBridgeReturn` must
 * create typed proxies instead of returning bare refs for `element`,
 * `newElement`, `aggregation`, and `object` return types.
 *
 * Existing behaviour (no context) is tested in `return-handler.test.ts`.
 */
import { describe, expect, it } from 'vitest';

import { createMockBridgeAdapter } from '../../helpers/mock-bridge-adapter.js';
import { createMockBridgePage } from '../../helpers/mock-page.js';

import type { MethodExecutionResult } from '#bridge/bridge-types.js';
import { handleBridgeReturn } from '#proxy/return-handler.js';
import type { BridgeReturnContext } from '#proxy/return-handler.js';

/**
 * Helper to build a standard BridgeReturnContext for tests.
 */
function createTestContext(overrides?: Partial<BridgeReturnContext>): BridgeReturnContext {
  return {
    adapter: createMockBridgeAdapter(),
    page: createMockBridgePage(),
    methods: new Set(['getText', 'setText']),
    ...overrides,
  };
}

describe('return-handler wiring (B3d)', () => {
  describe('element → control proxy', () => {
    it('creates a control proxy for element result with context', () => {
      const result: MethodExecutionResult = {
        success: true,
        returnType: 'element',
        value: { id: 'btn1', controlType: 'sap.m.Button' },
        duration: 1,
      };
      const ctx = createTestContext();
      const proxy = handleBridgeReturn(result, ctx);

      // A control proxy exposes `id` and `controlType` properties
      const record = proxy as Record<string, unknown>;
      expect(record['id']).toBe('btn1');
      expect(record['controlType']).toBe('sap.m.Button');
      // Must NOT be a plain object — must be a Proxy with method forwarding
      expect(typeof record['getText']).toBe('function');
    });
  });

  describe('newElement → control proxy', () => {
    it('creates a control proxy for newElement result with context', () => {
      const result: MethodExecutionResult = {
        success: true,
        returnType: 'newElement',
        value: { id: 'newBtn', controlType: 'sap.m.ToggleButton' },
        duration: 1,
      };
      const ctx = createTestContext();
      const proxy = handleBridgeReturn(result, ctx);

      const record = proxy as Record<string, unknown>;
      expect(record['id']).toBe('newBtn');
      expect(record['controlType']).toBe('sap.m.ToggleButton');
      expect(typeof record['getText']).toBe('function');
    });
  });

  describe('aggregation → proxy array', () => {
    it('creates an array of object proxies for aggregation result with context', () => {
      const result: MethodExecutionResult = {
        success: true,
        returnType: 'aggregation',
        uuids: ['uuid-1', 'uuid-2'],
        objectTypes: ['sap.m.StandardListItem', 'sap.m.StandardListItem'],
        duration: 1,
      };
      const ctx = createTestContext();
      const returned = handleBridgeReturn(result, ctx) as readonly unknown[];

      expect(returned).toHaveLength(2);
      // Each item is a UI5Object proxy with uuid and type
      const first = returned[0] as Record<string, unknown>;
      expect(first['uuid']).toBe('uuid-1');
      expect(first['type']).toBe('sap.m.StandardListItem');
      // Must be a proxy with method forwarding
      expect(typeof first['getData']).toBe('function');
    });

    it('returns empty array for aggregation with no uuids and context', () => {
      const result: MethodExecutionResult = {
        success: true,
        returnType: 'aggregation',
        uuids: [],
        objectTypes: [],
        duration: 1,
      };
      const ctx = createTestContext();
      const returned = handleBridgeReturn(result, ctx) as readonly unknown[];

      expect(returned).toEqual([]);
    });
  });

  describe('object → UI5Object proxy', () => {
    it('creates a UI5Object proxy for object result with context', () => {
      const result: MethodExecutionResult = {
        success: true,
        returnType: 'object',
        uuid: 'model-uuid-1',
        objectType: 'sap.ui.model.json.JSONModel',
        duration: 1,
      };
      const ctx = createTestContext();
      const proxy = handleBridgeReturn(result, ctx);

      const record = proxy as Record<string, unknown>;
      expect(record['uuid']).toBe('model-uuid-1');
      expect(record['type']).toBe('sap.ui.model.json.JSONModel');
      // Must be a proxy with method forwarding
      expect(typeof record['getData']).toBe('function');
    });
  });

  describe('non-proxy types remain unchanged', () => {
    it('returns plain value for result type even with context', () => {
      const result: MethodExecutionResult<string> = {
        success: true,
        returnType: 'result',
        value: 'Save',
        duration: 1,
      };
      const ctx = createTestContext();
      expect(handleBridgeReturn(result, ctx)).toBe('Save');
    });

    it('returns undefined for empty type even with context', () => {
      const result: MethodExecutionResult = {
        success: true,
        returnType: 'empty',
        duration: 1,
      };
      const ctx = createTestContext();
      expect(handleBridgeReturn(result, ctx)).toBeUndefined();
    });

    it('returns undefined for none type even with context', () => {
      const result: MethodExecutionResult = {
        success: true,
        returnType: 'none',
        duration: 1,
      };
      const ctx = createTestContext();
      expect(handleBridgeReturn(result, ctx)).toBeUndefined();
    });
  });

  describe('chained proxy methods', () => {
    it('element proxy supports dynamic method calls', async () => {
      const adapter = createMockBridgeAdapter();
      adapter.executeControlMethod.mockResolvedValue({
        success: true,
        returnType: 'result',
        value: 'Click Me',
        duration: 1,
      } satisfies MethodExecutionResult<string>);

      const result: MethodExecutionResult = {
        success: true,
        returnType: 'element',
        value: { id: 'btn1', controlType: 'sap.m.Button' },
        duration: 1,
      };
      const ctx = createTestContext({ adapter });
      const proxy = handleBridgeReturn(result, ctx);

      // The proxy should forward getText() to adapter.executeControlMethod
      // Use UI5ControlBase type assertion for the proxy
      const controlProxy = proxy as { getText: () => Promise<unknown> };
      const text = await controlProxy.getText();
      expect(text).toBe('Click Me');
    });

    it('object proxy supports method calls via UUID', async () => {
      const page = createMockBridgePage();
      page.evaluate.mockResolvedValue({ success: true, value: { name: 'test' }, duration: 1 });

      const result: MethodExecutionResult = {
        success: true,
        returnType: 'object',
        uuid: 'obj-uuid-1',
        objectType: 'sap.ui.model.json.JSONModel',
        duration: 1,
      };
      const ctx = createTestContext({ page });
      const proxy = handleBridgeReturn(result, ctx);

      // The proxy should forward getData() to page.evaluate via UI5Object
      const objectProxy = proxy as { getData: () => Promise<unknown> };
      const data = await objectProxy.getData();
      expect(page.evaluate).toHaveBeenCalled();
      expect(data).toEqual({ success: true, value: { name: 'test' }, duration: 1 });
    });
  });

  describe('context passing', () => {
    it('passes adapter and page to converter for element type', () => {
      const adapter = createMockBridgeAdapter();
      const page = createMockBridgePage();
      const result: MethodExecutionResult = {
        success: true,
        returnType: 'element',
        value: { id: 'inp1', controlType: 'sap.m.Input' },
        duration: 1,
      };
      const ctx: BridgeReturnContext = { adapter, page, methods: new Set(['getValue']) };
      const proxy = handleBridgeReturn(result, ctx);

      // Verify we got a proxy (not a plain value object)
      const record = proxy as Record<string, unknown>;
      expect(record['id']).toBe('inp1');
      // Verify the proxy uses the provided adapter by calling a method
      expect(typeof record['getValue']).toBe('function');
    });

    it('passes adapter to converter for object type', () => {
      const adapter = createMockBridgeAdapter();
      const page = createMockBridgePage();
      const result: MethodExecutionResult = {
        success: true,
        returnType: 'object',
        uuid: 'ctx-uuid',
        objectType: 'sap.ui.model.odata.v4.ODataModel',
        duration: 1,
      };
      const ctx: BridgeReturnContext = { adapter, page };
      const proxy = handleBridgeReturn(result, ctx);

      const record = proxy as Record<string, unknown>;
      expect(record['uuid']).toBe('ctx-uuid');
      expect(record['type']).toBe('sap.ui.model.odata.v4.ODataModel');
    });
  });
});
