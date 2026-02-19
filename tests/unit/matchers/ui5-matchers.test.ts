/**
 * Tests for `src/matchers/ui5-matchers.ts` — custom matcher functions for UI5 control assertions.
 *
 * @remarks
 * These tests verify the raw matcher logic functions using mocked Playwright pages.
 * The matchers are NOT Playwright expect.extend() registrations — those are done in fixtures.
 *
 * @module matchers
 */
import type { Page } from '@playwright/test';
import { describe, expect, it, vi } from 'vitest';

import {
  checkUI5Enabled,
  checkUI5Property,
  checkUI5Text,
  checkUI5ValueState,
  checkUI5Visible,
} from '../../../src/matchers/ui5-matchers.js';

vi.mock('#bridge/injection.js', () => ({
  ensureBridgeInjected: vi.fn().mockResolvedValue(undefined),
}));

vi.mock('#bridge/browser-scripts/execute-method.js', () => ({
  createExecuteMethodScript: vi.fn().mockReturnValue('(function(){})()'),
}));

/**
 * Creates a mock Playwright Page that returns a MethodExecutionResult
 * with the given value from `page.evaluate()`.
 *
 * @param value - The value to return as `result.value`.
 * @returns A mock Page with evaluate stubbed.
 */
function createMockPage(value?: unknown): Page & { evaluate: ReturnType<typeof vi.fn> } {
  return {
    evaluate: vi.fn().mockResolvedValue({ value }),
  } as unknown as Page & { evaluate: ReturnType<typeof vi.fn> };
}

describe('checkUI5Text', () => {
  it('passes with exact string match', async () => {
    const page = createMockPage('Save');

    const result = await checkUI5Text(page, 'btn1', 'Save');

    expect(result.pass).toBe(true);
    expect(page.evaluate).toHaveBeenCalled();
  });

  it('fails with string mismatch', async () => {
    const page = createMockPage('Cancel');

    const result = await checkUI5Text(page, 'btn1', 'Save');

    expect(result.pass).toBe(false);
  });

  it('passes with RegExp match', async () => {
    const page = createMockPage('Save Draft');

    const result = await checkUI5Text(page, 'btn1', /Save/);

    expect(result.pass).toBe(true);
  });

  it('fails with RegExp mismatch', async () => {
    const page = createMockPage('Cancel');

    const result = await checkUI5Text(page, 'btn1', /Save/);

    expect(result.pass).toBe(false);
  });

  it('fail message includes actual and expected values', async () => {
    const page = createMockPage('Cancel');

    const result = await checkUI5Text(page, 'btn1', 'Save');

    const message = result.message();
    expect(message).toContain('Cancel');
    expect(message).toContain('Save');
  });

  it('pass message mentions "not to match" for negated assertion', async () => {
    const page = createMockPage('Save');

    const result = await checkUI5Text(page, 'btn1', 'Save');

    expect(result.pass).toBe(true);
    expect(result.message()).toContain('not to match');
  });
});

describe('checkUI5Visible', () => {
  it('passes when control is visible', async () => {
    const page = createMockPage(true);

    const result = await checkUI5Visible(page, 'ctrl1');

    expect(result.pass).toBe(true);
    expect(page.evaluate).toHaveBeenCalled();
  });

  it('fails when control is not visible', async () => {
    const page = createMockPage(false);

    const result = await checkUI5Visible(page, 'ctrl1');

    expect(result.pass).toBe(false);
    expect(result.message()).toContain('visible');
  });

  it('pass message mentions "not to be visible" for negated assertion', async () => {
    const page = createMockPage(true);

    const result = await checkUI5Visible(page, 'ctrl1');

    expect(result.pass).toBe(true);
    expect(result.message()).toContain('not to be visible');
  });
});

describe('checkUI5Enabled', () => {
  it('passes when control is enabled', async () => {
    const page = createMockPage(true);

    const result = await checkUI5Enabled(page, 'ctrl1');

    expect(result.pass).toBe(true);
    expect(page.evaluate).toHaveBeenCalled();
  });

  it('fails when control is disabled', async () => {
    const page = createMockPage(false);

    const result = await checkUI5Enabled(page, 'ctrl1');

    expect(result.pass).toBe(false);
    expect(result.message()).toContain('enabled');
  });

  it('pass message mentions "not to be enabled" for negated assertion', async () => {
    const page = createMockPage(true);

    const result = await checkUI5Enabled(page, 'ctrl1');

    expect(result.pass).toBe(true);
    expect(result.message()).toContain('not to be enabled');
  });
});

describe('checkUI5Property', () => {
  it('passes with matching string property', async () => {
    const page = createMockPage('Hello');

    const result = await checkUI5Property(page, 'ctrl1', 'text', 'Hello');

    expect(result.pass).toBe(true);
    expect(page.evaluate).toHaveBeenCalled();
  });

  it('fails with mismatched numeric property', async () => {
    const page = createMockPage(42);

    const result = await checkUI5Property(page, 'ctrl1', 'value', 99);

    expect(result.pass).toBe(false);
  });

  it('fails when property is undefined and includes message', async () => {
    const page = createMockPage();

    const result = await checkUI5Property(page, 'ctrl1', 'text', 'Hello');

    expect(result.pass).toBe(false);
    const message = result.message();
    expect(message).toContain('text');
    expect(message).toContain('Hello');
  });

  it('passes with deep-equal object values', async () => {
    const objValue = { key: 'value', nested: { a: 1 } };
    const page = createMockPage(objValue);

    const result = await checkUI5Property(page, 'ctrl1', 'data', {
      key: 'value',
      nested: { a: 1 },
    });

    expect(result.pass).toBe(true);
  });

  it('fails with deep-unequal object values', async () => {
    const page = createMockPage({ key: 'actual' });

    const result = await checkUI5Property(page, 'ctrl1', 'data', { key: 'expected' });

    expect(result.pass).toBe(false);
  });

  it('pass message mentions "not to equal" for negated assertion', async () => {
    const page = createMockPage('Hello');

    const result = await checkUI5Property(page, 'ctrl1', 'text', 'Hello');

    expect(result.pass).toBe(true);
    expect(result.message()).toContain('not to equal');
  });
});

describe('checkUI5ValueState', () => {
  it('passes with matching value state', async () => {
    const page = createMockPage('Error');

    const result = await checkUI5ValueState(page, 'input1', 'Error');

    expect(result.pass).toBe(true);
    expect(page.evaluate).toHaveBeenCalled();
  });

  it('fails with mismatched value state', async () => {
    const page = createMockPage('None');

    const result = await checkUI5ValueState(page, 'input1', 'Error');

    expect(result.pass).toBe(false);
  });

  it('message includes value state names', async () => {
    const page = createMockPage('None');

    const result = await checkUI5ValueState(page, 'input1', 'Error');

    const message = result.message();
    expect(message).toContain('Error');
    expect(message).toContain('None');
  });

  it('pass message mentions "not to be" for negated assertion', async () => {
    const page = createMockPage('Error');

    const result = await checkUI5ValueState(page, 'input1', 'Error');

    expect(result.pass).toBe(true);
    expect(result.message()).toContain('not to be');
  });
});
