/**
 * Tests for `src/proxy/return-handler.ts`.
 *
 * @remarks
 * Validates the 7-type return handler that routes bridge call results
 * to appropriate proxy/value types based on the `returnType` discriminant.
 */
import { describe, expect, it } from 'vitest';

import type { MethodExecutionResult } from '#bridge/bridge-types.js';
import { handleBridgeReturn } from '#proxy/return-handler.js';

describe('return-handler', () => {
  describe('handleBridgeReturn', () => {
    it('returns value for "result" returnType', () => {
      const result: MethodExecutionResult<string> = {
        success: true,
        returnType: 'result',
        value: 'Save',
        duration: 1,
      };
      expect(handleBridgeReturn(result)).toBe('Save');
    });

    it('returns undefined for "empty" returnType', () => {
      const result: MethodExecutionResult = {
        success: true,
        returnType: 'empty',
        duration: 1,
      };
      expect(handleBridgeReturn(result)).toBeUndefined();
    });

    it('returns controlRef for "element" returnType', () => {
      const result: MethodExecutionResult = {
        success: true,
        returnType: 'element',
        value: { id: 'btn1', controlType: 'sap.m.Button' },
        duration: 1,
      };
      const returned = handleBridgeReturn(result);
      expect(returned).toEqual({ id: 'btn1', controlType: 'sap.m.Button' });
    });

    it('returns controlRef for "newElement" returnType', () => {
      const result: MethodExecutionResult = {
        success: true,
        returnType: 'newElement',
        value: { id: 'newBtn', controlType: 'sap.m.Button' },
        duration: 1,
      };
      const returned = handleBridgeReturn(result);
      expect(returned).toEqual({ id: 'newBtn', controlType: 'sap.m.Button' });
    });

    it('returns array of UUIDs for "aggregation" returnType', () => {
      const result: MethodExecutionResult = {
        success: true,
        returnType: 'aggregation',
        uuids: ['uuid-1', 'uuid-2'],
        objectTypes: ['sap.m.StandardListItem', 'sap.m.StandardListItem'],
        duration: 1,
      };
      const returned = handleBridgeReturn(result) as readonly unknown[];
      expect(returned).toHaveLength(2);
    });

    it('returns empty array for "aggregation" with no uuids', () => {
      const result: MethodExecutionResult = {
        success: true,
        returnType: 'aggregation',
        uuids: [],
        objectTypes: [],
        duration: 1,
      };
      const returned = handleBridgeReturn(result) as readonly unknown[];
      expect(returned).toEqual([]);
    });

    it('returns object ref for "object" returnType', () => {
      const result: MethodExecutionResult = {
        success: true,
        returnType: 'object',
        uuid: 'obj-uuid-1',
        objectType: 'sap.ui.model.json.JSONModel',
        duration: 1,
      };
      const returned = handleBridgeReturn(result);
      expect(returned).toEqual({
        uuid: 'obj-uuid-1',
        objectType: 'sap.ui.model.json.JSONModel',
      });
    });

    it('returns undefined for "none" returnType', () => {
      const result: MethodExecutionResult = {
        success: true,
        returnType: 'none',
        duration: 1,
      };
      expect(handleBridgeReturn(result)).toBeUndefined();
    });

    it('returns undefined for "unknown" returnType', () => {
      const result: MethodExecutionResult = {
        success: true,
        returnType: 'unknown',
        duration: 1,
      };
      expect(handleBridgeReturn(result)).toBeUndefined();
    });

    it('throws for failed execution', () => {
      const result: MethodExecutionResult = {
        success: false,
        returnType: 'result',
        error: 'Control not found',
        duration: 1,
      };
      expect(() => handleBridgeReturn(result)).toThrow('Control not found');
    });

    it('returns numeric value for "result" returnType', () => {
      const result: MethodExecutionResult<number> = {
        success: true,
        returnType: 'result',
        value: 42,
        duration: 1,
      };
      expect(handleBridgeReturn(result)).toBe(42);
    });

    it('returns boolean value for "result" returnType', () => {
      const result: MethodExecutionResult<boolean> = {
        success: true,
        returnType: 'result',
        value: false,
        duration: 1,
      };
      expect(handleBridgeReturn(result)).toBe(false);
    });
  });
});
