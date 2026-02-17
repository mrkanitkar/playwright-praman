/**
 * Tests for `src/proxy/proxy-converter.ts`.
 *
 * @remarks
 * Validates bidirectional conversion between UI5ControlProxy and UI5Object (D17).
 * Detects whether a method result represents a control or non-control object
 * and creates the appropriate proxy type.
 */
import { describe, expect, it } from 'vitest';

import { createMockBridgeAdapter } from '../../helpers/mock-bridge-adapter.js';
import { createMockBridgePage } from '../../helpers/mock-page.js';

import type { MethodExecutionResult } from '#bridge/bridge-types.js';
import {
  convertToControlProxy,
  convertToObjectProxy,
  isControlResult,
} from '#proxy/proxy-converter.js';

describe('proxy-converter', () => {
  describe('isControlResult', () => {
    it('returns true for element returnType', () => {
      const result: MethodExecutionResult = {
        success: true,
        returnType: 'element',
        value: { id: 'btn1', controlType: 'sap.m.Button' },
        duration: 1,
      };
      expect(isControlResult(result)).toBe(true);
    });

    it('returns true for newElement returnType', () => {
      const result: MethodExecutionResult = {
        success: true,
        returnType: 'newElement',
        value: { id: 'btn2', controlType: 'sap.m.Button' },
        duration: 1,
      };
      expect(isControlResult(result)).toBe(true);
    });

    it('returns false for object returnType', () => {
      const result: MethodExecutionResult = {
        success: true,
        returnType: 'object',
        uuid: 'obj-1',
        objectType: 'sap.ui.model.json.JSONModel',
        duration: 1,
      };
      expect(isControlResult(result)).toBe(false);
    });

    it('returns false for result returnType', () => {
      const result: MethodExecutionResult = {
        success: true,
        returnType: 'result',
        value: 'Save',
        duration: 1,
      };
      expect(isControlResult(result)).toBe(false);
    });

    it('returns false for failed results', () => {
      const result: MethodExecutionResult = {
        success: false,
        returnType: 'element',
        error: 'Not found',
        duration: 1,
      };
      expect(isControlResult(result)).toBe(false);
    });
  });

  describe('convertToControlProxy', () => {
    it('creates a control proxy from element result', () => {
      const result: MethodExecutionResult = {
        success: true,
        returnType: 'element',
        value: { id: 'btn1', controlType: 'sap.m.Button' },
        duration: 1,
      };
      const adapter = createMockBridgeAdapter();
      const proxy = convertToControlProxy(result, adapter, new Set(['getText']));
      expect(proxy.id).toBe('btn1');
      expect(proxy.controlType).toBe('sap.m.Button');
    });

    it('creates a control proxy from newElement result', () => {
      const result: MethodExecutionResult = {
        success: true,
        returnType: 'newElement',
        value: { id: 'newBtn', controlType: 'sap.m.ToggleButton' },
        duration: 1,
      };
      const adapter = createMockBridgeAdapter();
      const proxy = convertToControlProxy(result, adapter, new Set());
      expect(proxy.id).toBe('newBtn');
      expect(proxy.controlType).toBe('sap.m.ToggleButton');
    });
  });

  describe('convertToObjectProxy', () => {
    it('creates a UI5Object proxy from object result', () => {
      const result: MethodExecutionResult = {
        success: true,
        returnType: 'object',
        uuid: 'model-uuid',
        objectType: 'sap.ui.model.json.JSONModel',
        duration: 1,
      };
      const page = createMockBridgePage();
      const proxy = convertToObjectProxy(result, page);
      expect(proxy).toBeDefined();
      const record = proxy as Record<string, unknown>;
      expect(record['uuid']).toBe('model-uuid');
      expect(record['type']).toBe('sap.ui.model.json.JSONModel');
    });

    it('defaults missing uuid and objectType', () => {
      const result: MethodExecutionResult = {
        success: true,
        returnType: 'object',
        duration: 1,
      };
      const page = createMockBridgePage();
      const proxy = convertToObjectProxy(result, page);
      const record = proxy as Record<string, unknown>;
      expect(record['uuid']).toBe('');
      expect(record['type']).toBe('unknown');
    });
  });
});
