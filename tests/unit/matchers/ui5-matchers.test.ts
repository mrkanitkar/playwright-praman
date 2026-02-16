/**
 * Tests for `src/matchers/ui5-matchers.ts` — custom matcher functions for UI5 control assertions.
 *
 * @remarks
 * These tests verify the raw matcher logic functions using mocked bridge adapters.
 * The matchers are NOT Playwright expect.extend() registrations — those are done in fixtures.
 *
 * @module matchers
 */
import { describe, expect, it } from 'vitest';

import {
  checkUI5Enabled,
  checkUI5Property,
  checkUI5Text,
  checkUI5ValueState,
  checkUI5Visible,
} from '../../../src/matchers/ui5-matchers.js';
import { createMockBridgeAdapter } from '../../helpers/mock-bridge-adapter.js';

describe('checkUI5Text', () => {
  it('passes with exact string match', async () => {
    const adapter = createMockBridgeAdapter();
    adapter.getControlProperty.mockResolvedValue('Save');

    const result = await checkUI5Text(adapter, 'btn1', 'Save');

    expect(result.pass).toBe(true);
    expect(adapter.getControlProperty).toHaveBeenCalledWith('btn1', 'text');
  });

  it('fails with string mismatch', async () => {
    const adapter = createMockBridgeAdapter();
    adapter.getControlProperty.mockResolvedValue('Cancel');

    const result = await checkUI5Text(adapter, 'btn1', 'Save');

    expect(result.pass).toBe(false);
  });

  it('passes with RegExp match', async () => {
    const adapter = createMockBridgeAdapter();
    adapter.getControlProperty.mockResolvedValue('Save Draft');

    const result = await checkUI5Text(adapter, 'btn1', /Save/);

    expect(result.pass).toBe(true);
  });

  it('fails with RegExp mismatch', async () => {
    const adapter = createMockBridgeAdapter();
    adapter.getControlProperty.mockResolvedValue('Cancel');

    const result = await checkUI5Text(adapter, 'btn1', /Save/);

    expect(result.pass).toBe(false);
  });

  it('message includes actual and expected values', async () => {
    const adapter = createMockBridgeAdapter();
    adapter.getControlProperty.mockResolvedValue('Cancel');

    const result = await checkUI5Text(adapter, 'btn1', 'Save');

    const message = result.message();
    expect(message).toContain('Cancel');
    expect(message).toContain('Save');
  });
});

describe('checkUI5Visible', () => {
  it('passes when control is visible', async () => {
    const adapter = createMockBridgeAdapter();
    adapter.getControlProperty.mockResolvedValue(true);

    const result = await checkUI5Visible(adapter, 'ctrl1');

    expect(result.pass).toBe(true);
    expect(adapter.getControlProperty).toHaveBeenCalledWith('ctrl1', 'visible');
  });

  it('fails when control is not visible', async () => {
    const adapter = createMockBridgeAdapter();
    adapter.getControlProperty.mockResolvedValue(false);

    const result = await checkUI5Visible(adapter, 'ctrl1');

    expect(result.pass).toBe(false);
    expect(result.message()).toContain('visible');
  });
});

describe('checkUI5Enabled', () => {
  it('passes when control is enabled', async () => {
    const adapter = createMockBridgeAdapter();
    adapter.getControlProperty.mockResolvedValue(true);

    const result = await checkUI5Enabled(adapter, 'ctrl1');

    expect(result.pass).toBe(true);
    expect(adapter.getControlProperty).toHaveBeenCalledWith('ctrl1', 'enabled');
  });

  it('fails when control is disabled', async () => {
    const adapter = createMockBridgeAdapter();
    adapter.getControlProperty.mockResolvedValue(false);

    const result = await checkUI5Enabled(adapter, 'ctrl1');

    expect(result.pass).toBe(false);
    expect(result.message()).toContain('enabled');
  });
});

describe('checkUI5Property', () => {
  it('passes with matching string property', async () => {
    const adapter = createMockBridgeAdapter();
    adapter.getControlProperty.mockResolvedValue('Hello');

    const result = await checkUI5Property(adapter, 'ctrl1', 'text', 'Hello');

    expect(result.pass).toBe(true);
    expect(adapter.getControlProperty).toHaveBeenCalledWith('ctrl1', 'text');
  });

  it('fails with mismatched numeric property', async () => {
    const adapter = createMockBridgeAdapter();
    adapter.getControlProperty.mockResolvedValue(42);

    const result = await checkUI5Property(adapter, 'ctrl1', 'value', 99);

    expect(result.pass).toBe(false);
  });

  it('fails when property is undefined and includes message', async () => {
    const adapter = createMockBridgeAdapter();
    adapter.getControlProperty.mockResolvedValue(undefined);

    const result = await checkUI5Property(adapter, 'ctrl1', 'text', 'Hello');

    expect(result.pass).toBe(false);
    const message = result.message();
    expect(message).toContain('text');
    expect(message).toContain('Hello');
  });
});

describe('checkUI5ValueState', () => {
  it('passes with matching value state', async () => {
    const adapter = createMockBridgeAdapter();
    adapter.getControlProperty.mockResolvedValue('Error');

    const result = await checkUI5ValueState(adapter, 'input1', 'Error');

    expect(result.pass).toBe(true);
    expect(adapter.getControlProperty).toHaveBeenCalledWith('input1', 'valueState');
  });

  it('fails with mismatched value state', async () => {
    const adapter = createMockBridgeAdapter();
    adapter.getControlProperty.mockResolvedValue('None');

    const result = await checkUI5ValueState(adapter, 'input1', 'Error');

    expect(result.pass).toBe(false);
  });

  it('message includes value state names', async () => {
    const adapter = createMockBridgeAdapter();
    adapter.getControlProperty.mockResolvedValue('None');

    const result = await checkUI5ValueState(adapter, 'input1', 'Error');

    const message = result.message();
    expect(message).toContain('Error');
    expect(message).toContain('None');
  });
});
