/**
 * @license
 * Copyright (c) ZesTest 2025-2030. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0
 *
 * This file may contain AI-assisted code.
 * See LICENSE and NOTICE files for details.
 */

/**
 * Tests for `src/matchers/matcher-utils.ts` — shared matcher utilities.
 *
 * @remarks
 * Covers getControlProperty, getControlAggregation, getUI5BindingInfo,
 * getUI5ControlType, and the MatcherPage/UI5BindingInfo types.
 *
 * @module matchers
 */
import { describe, expect, expectTypeOf, it, vi } from 'vitest';

import { ControlError } from '../../../src/core/errors/control-error.js';
import type { MatcherPage, UI5BindingInfo } from '../../../src/matchers/matcher-utils.js';
import {
  getControlAggregation,
  getControlProperty,
  getUI5BindingInfo,
  getUI5ControlType,
  pollUntilPass,
} from '../../../src/matchers/matcher-utils.js';

vi.mock('#bridge/injection.js', () => ({
  ensureBridgeInjected: vi.fn().mockResolvedValue(undefined),
}));

vi.mock('#bridge/browser-scripts/execute-method.js', () => ({
  createExecuteMethodScript: vi.fn().mockReturnValue('(function(){})()'),
}));

/**
 * Creates a minimal MatcherPage mock with a stubbed evaluate method.
 *
 * @param resolvedValue - The value that page.evaluate will resolve with.
 * @returns A MatcherPage with evaluate stubbed.
 */
function createMockPage(
  resolvedValue?: unknown,
): MatcherPage & { evaluate: ReturnType<typeof vi.fn> } {
  return {
    evaluate: vi.fn().mockResolvedValue(resolvedValue),
  };
}

describe('getControlProperty', () => {
  it('returns string value', async () => {
    const page = createMockPage({ value: 'Save' });

    const result = await getControlProperty(page, 'btn1', 'text');

    expect(result).toBe('Save');
    expect(page.evaluate).toHaveBeenCalled();
  });

  it('returns boolean value', async () => {
    const page = createMockPage({ value: true });

    const result = await getControlProperty(page, 'ctrl1', 'visible');

    expect(result).toBe(true);
  });

  it('returns number value', async () => {
    const page = createMockPage({ value: 42 });

    const result = await getControlProperty(page, 'ctrl1', 'maxLength');

    expect(result).toBe(42);
  });

  it('returns undefined for missing property', async () => {
    const page = createMockPage({ value: undefined });

    const result = await getControlProperty(page, 'ctrl1', 'nonexistent');

    expect(result).toBeUndefined();
  });

  it('throws ControlError when page.evaluate rejects', async () => {
    const page: MatcherPage = {
      evaluate: vi.fn().mockRejectedValue(new Error('Control not found')),
    };

    await expect(getControlProperty(page, 'btn1', 'text')).rejects.toThrow(ControlError);
    await expect(getControlProperty(page, 'btn1', 'text')).rejects.toThrow(
      /Failed to read property 'text' from control 'btn1'/,
    );
  });

  it('wraps non-Error thrown values in ControlError details', async () => {
    const page: MatcherPage = {
      evaluate: vi.fn().mockRejectedValue('string-error'),
    };

    const error = await getControlProperty(page, 'btn1', 'text').catch((e: unknown) => e);

    expect(error).toBeInstanceOf(ControlError);
    expect((error as ControlError).code).toBe('ERR_CONTROL_NOT_FOUND');
    expect((error as ControlError).retryable).toBe(true);
    expect((error as ControlError).details).toHaveProperty('cause', 'string-error');
  });
});

describe('getControlAggregation', () => {
  it('returns array of refs', async () => {
    const page = createMockPage({
      success: true,
      returnType: 'aggregation',
      uuids: ['row0', 'row1', 'row2'],
      objectTypes: ['sap.m.ColumnListItem', 'sap.m.ColumnListItem', 'sap.m.ColumnListItem'],
      duration: 0,
    });

    const result = await getControlAggregation(page, 'table1', 'items');

    expect(result).toHaveLength(3);
    expect(result[0]).toEqual({ id: 'row0', controlType: 'sap.m.ColumnListItem' });
    expect(result[1]).toEqual({ id: 'row1', controlType: 'sap.m.ColumnListItem' });
    expect(result[2]).toEqual({ id: 'row2', controlType: 'sap.m.ColumnListItem' });
  });

  it('returns empty array for no items', async () => {
    const page = createMockPage({
      success: true,
      returnType: 'empty',
      value: [],
      duration: 0,
    });

    const result = await getControlAggregation(page, 'table1', 'items');

    expect(result).toEqual([]);
  });

  it('handles nested aggregations with mixed types', async () => {
    const page = createMockPage({
      success: true,
      returnType: 'aggregation',
      uuids: ['cell0', 'cell1'],
      objectTypes: ['sap.m.Text', 'sap.m.Input'],
      duration: 0,
    });

    const result = await getControlAggregation(page, 'row0', 'cells');

    expect(result).toHaveLength(2);
    expect(result[0]).toEqual({ id: 'cell0', controlType: 'sap.m.Text' });
    expect(result[1]).toEqual({ id: 'cell1', controlType: 'sap.m.Input' });
  });

  it('throws ControlError when page.evaluate rejects', async () => {
    const page: MatcherPage = {
      evaluate: vi.fn().mockRejectedValue(new Error('Control not found')),
    };

    await expect(getControlAggregation(page, 'table1', 'items')).rejects.toThrow(ControlError);
    await expect(getControlAggregation(page, 'table1', 'items')).rejects.toThrow(
      /Failed to read aggregation 'items' from control 'table1'/,
    );
  });

  it('wraps non-Error thrown values in ControlError details', async () => {
    const page: MatcherPage = {
      evaluate: vi.fn().mockRejectedValue('string-error'),
    };

    const error = await getControlAggregation(page, 'table1', 'items').catch((e: unknown) => e);

    expect(error).toBeInstanceOf(ControlError);
    expect((error as ControlError).code).toBe('ERR_CONTROL_AGGREGATION');
    expect((error as ControlError).retryable).toBe(true);
    expect((error as ControlError).details).toHaveProperty('cause', 'string-error');
  });

  it('falls back to "unknown" when objectTypes is shorter than uuids', async () => {
    const page = createMockPage({
      success: true,
      returnType: 'aggregation',
      uuids: ['cell0', 'cell1', 'cell2'],
      objectTypes: ['sap.m.Text'],
      duration: 0,
    });

    const result = await getControlAggregation(page, 'row0', 'cells');

    expect(result).toHaveLength(3);
    expect(result[0]).toEqual({ id: 'cell0', controlType: 'sap.m.Text' });
    expect(result[1]).toEqual({ id: 'cell1', controlType: 'unknown' });
    expect(result[2]).toEqual({ id: 'cell2', controlType: 'unknown' });
  });
});

describe('getUI5BindingInfo', () => {
  it('returns binding path and model', async () => {
    const page = createMockPage({ path: '/ProductName', model: '', value: 'Widget A' });

    const result = await getUI5BindingInfo(page, 'input1', 'value');

    expect(result).toEqual({ path: '/ProductName', model: '', value: 'Widget A' });
  });

  it('returns null for unbound property', async () => {
    const page = createMockPage(null);

    const result = await getUI5BindingInfo(page, 'input1', 'value');

    expect(result).toBeNull();
  });

  it('throws ControlError when page.evaluate rejects', async () => {
    const page: MatcherPage = {
      evaluate: vi.fn().mockRejectedValue(new Error('Evaluate failed')),
    };

    await expect(getUI5BindingInfo(page, 'input1', 'value')).rejects.toThrow(ControlError);
    await expect(getUI5BindingInfo(page, 'input1', 'value')).rejects.toThrow(
      /Failed to read binding info for property 'value' on control 'input1'/,
    );
  });

  it('wraps non-Error thrown values in ControlError details', async () => {
    const page: MatcherPage = {
      evaluate: vi.fn().mockRejectedValue('string-error'),
    };

    const error = await getUI5BindingInfo(page, 'input1', 'value').catch((e: unknown) => e);

    expect(error).toBeInstanceOf(ControlError);
    expect((error as ControlError).code).toBe('ERR_CONTROL_NOT_FOUND');
    expect((error as ControlError).retryable).toBe(true);
    expect((error as ControlError).details).toHaveProperty('cause', 'string-error');
  });

  it('returns binding info with named model', async () => {
    const page = createMockPage({
      path: 'ProductName',
      model: 'i18n',
      value: 'Translated Widget',
    });

    const result = await getUI5BindingInfo(page, 'input1', 'value');

    expect(result).toEqual({ path: 'ProductName', model: 'i18n', value: 'Translated Widget' });
  });
});

describe('getUI5ControlType', () => {
  it('returns full type string', async () => {
    const page = createMockPage('sap.m.Button');

    const result = await getUI5ControlType(page, 'btn1');

    expect(result).toBe('sap.m.Button');
  });

  it('returns null for missing control', async () => {
    const page = createMockPage(null);

    const result = await getUI5ControlType(page, 'nonexistent');

    expect(result).toBeNull();
  });

  it('throws ControlError when page.evaluate rejects', async () => {
    const page: MatcherPage = {
      evaluate: vi.fn().mockRejectedValue(new Error('Evaluate failed')),
    };

    await expect(getUI5ControlType(page, 'btn1')).rejects.toThrow(ControlError);
    await expect(getUI5ControlType(page, 'btn1')).rejects.toThrow(
      /Failed to read control type for 'btn1'/,
    );
  });

  it('wraps non-Error thrown values in ControlError details', async () => {
    const page: MatcherPage = {
      evaluate: vi.fn().mockRejectedValue('string-error'),
    };

    const error = await getUI5ControlType(page, 'btn1').catch((e: unknown) => e);

    expect(error).toBeInstanceOf(ControlError);
    expect((error as ControlError).code).toBe('ERR_CONTROL_NOT_FOUND');
    expect((error as ControlError).retryable).toBe(true);
    expect((error as ControlError).details).toHaveProperty('cause', 'string-error');
  });

  it('returns type for composite control', async () => {
    const page = createMockPage('sap.ui.comp.smartfield.SmartField');

    const result = await getUI5ControlType(page, 'smartField1');

    expect(result).toBe('sap.ui.comp.smartfield.SmartField');
  });
});

describe('MatcherPage type', () => {
  it('accepts minimal page object', () => {
    expectTypeOf<{
      evaluate: <TResult>(script: string, arg?: unknown) => Promise<TResult>;
    }>().toExtend<MatcherPage>();
  });
});

describe('UI5BindingInfo type', () => {
  it('has required readonly fields', () => {
    expectTypeOf<UI5BindingInfo>().toHaveProperty('path');
    expectTypeOf<UI5BindingInfo>().toHaveProperty('model');
    expectTypeOf<UI5BindingInfo>().toHaveProperty('value');
  });
});

describe('pollUntilPass', () => {
  it('returns immediately when check passes on first call', async () => {
    const checkFn = vi.fn().mockResolvedValue({
      pass: true,
      message: () => 'passed',
    });

    const result = await pollUntilPass(checkFn, 1000);

    expect(result.pass).toBe(true);
    expect(checkFn).toHaveBeenCalledTimes(1);
  });

  it('retries until check passes', async () => {
    let callCount = 0;
    const checkFn = vi.fn().mockImplementation(async () => {
      callCount++;
      return Promise.resolve({
        pass: callCount >= 3,
        message: () => (callCount >= 3 ? 'passed' : 'still waiting'),
      });
    });

    const result = await pollUntilPass(checkFn, 5000);

    expect(result.pass).toBe(true);
    expect(checkFn).toHaveBeenCalledTimes(3);
  });

  it('returns last failing result when timeout expires', async () => {
    const checkFn = vi.fn().mockResolvedValue({
      pass: false,
      message: () => 'never passed',
    });

    const result = await pollUntilPass(checkFn, 250);

    expect(result.pass).toBe(false);
    expect(result.message()).toBe('never passed');
    expect(checkFn.mock.calls.length).toBeGreaterThanOrEqual(2);
  });

  it('uses default timeout when none is provided', async () => {
    const checkFn = vi.fn().mockResolvedValue({
      pass: true,
      message: () => 'passed',
    });

    const result = await pollUntilPass(checkFn);

    expect(result.pass).toBe(true);
  });
});
