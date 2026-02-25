/**
 * @license
 * Copyright (c) ZesTest 2025-2030. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0
 *
 * This file may contain AI-assisted code.
 * See LICENSE and NOTICE files for details.
 */

/**
 * Tests for `src/core/utils/step-decorator.ts` — Playwright step wrapper.
 *
 * @remarks
 * Verifies withStep executes functions and createStepName formats names correctly.
 * Tests run outside Playwright test context so withStep degrades gracefully.
 *
 * @module utils
 */
import { describe, expect, it } from 'vitest';

import { PramanError } from '#core/errors/base.js';
import { ErrorCode } from '#core/errors/codes.js';
import {
  ACTION_MAP,
  createStepName,
  formatSelectorForStep,
  generateStepName,
  isInsideTestContext,
  ui5Step,
  withStep,
} from '#core/utils/step-decorator.js';

describe('withStep', () => {
  it('executes fn and returns result', async () => {
    const result = await withStep('test step', async () => await Promise.resolve(42));
    expect(result).toBe(42);
  });

  it('propagates errors from fn', async () => {
    await expect(
      withStep('failing step', async () => await Promise.reject(new Error('step-error'))),
    ).rejects.toThrow('step-error');
  });

  it('works outside Playwright test context (graceful degradation)', async () => {
    // No Playwright test context available in Vitest — should still work
    const result = await withStep('no-context', async () => await Promise.resolve('ok'));
    expect(result).toBe('ok');
  });

  it('preserves PramanError stack on async error', async () => {
    const pramanError = new PramanError({
      code: ErrorCode.ERR_CONFIG_INVALID,
      message: 'test error',
      attempted: 'test',
      retryable: false,
    });

    await expect(
      withStep('error step', async () => await Promise.reject(pramanError)),
    ).rejects.toThrow(pramanError);
  });
});

describe('createStepName', () => {
  it('formats name without target', () => {
    expect(createStepName('selector', 'parse')).toBe('selector > parse');
  });

  it('formats name with target', () => {
    expect(createStepName('selector', 'parse', 'ui5=sap.m.Button')).toBe(
      'selector > parse: ui5=sap.m.Button',
    );
  });

  it('omits colon for empty target string', () => {
    expect(createStepName('selector', 'parse', '')).toBe('selector > parse');
  });
});

describe('isInsideTestContext', () => {
  it('returns false in Vitest', () => {
    // No active Playwright test runner — test.info() throws outside test context
    expect(isInsideTestContext()).toBe(false);
  });

  it('returns false when test.info() throws', () => {
    // Equivalent assertion: the result must be exactly false (not truthy, not undefined)
    const result = isInsideTestContext();
    expect(result).toBe(false);
  });

  it('never throws regardless of context', () => {
    // isInsideTestContext must be safe to call at any time — must not propagate exceptions
    expect(() => isInsideTestContext()).not.toThrow();
  });

  it('always returns a boolean value', () => {
    // Regardless of context, the return type must be exactly boolean
    const result = isInsideTestContext();
    expect(typeof result).toBe('boolean');
  });
});

describe('ACTION_MAP', () => {
  it('has expected UI5Handler keys', () => {
    const ui5Keys = [
      'click',
      'fill',
      'press',
      'select',
      'check',
      'uncheck',
      'clear',
      'getText',
      'getValue',
      'control',
      'controls',
      'waitForUI5',
      'waitFor',
      'destroy',
    ];
    for (const key of ui5Keys) {
      expect(ACTION_MAP).toHaveProperty(key);
    }
  });

  it('has expected ShellHandler keys', () => {
    const shellKeys = ['expectShellHeader', 'clickHome', 'openUserMenu'];
    for (const key of shellKeys) {
      expect(ACTION_MAP).toHaveProperty(key);
    }
  });

  it('has expected FooterHandler keys', () => {
    const footerKeys = [
      'clickSave',
      'clickApply',
      'clickCancel',
      'clickEdit',
      'clickDelete',
      'clickCreate',
    ];
    for (const key of footerKeys) {
      expect(ACTION_MAP).toHaveProperty(key);
    }
  });

  it('has expected AgenticHandler keys', () => {
    const agenticKeys = ['generateTest', 'interpretStep', 'suggestActions'];
    for (const key of agenticKeys) {
      expect(ACTION_MAP).toHaveProperty(key);
    }
  });

  it('has expected SAPAuthHandler keys', () => {
    const authKeys = ['login', 'loginFromEnv', 'logout', 'isAuthenticated'];
    for (const key of authKeys) {
      expect(ACTION_MAP).toHaveProperty(key);
    }
  });

  it('has all values as non-empty strings', () => {
    for (const [key, value] of Object.entries(ACTION_MAP)) {
      expect(typeof value).toBe('string');
      expect(value.length, `ACTION_MAP['${key}'] should be non-empty`).toBeGreaterThan(0);
    }
  });

  it('covers all 40 public async handler methods', () => {
    // 15 UI5 + 3 Shell + 6 Footer + 3 Agentic + 6 FLPSettings + 4 Auth + 3 TestData = 40
    expect(Object.keys(ACTION_MAP)).toHaveLength(40);
  });
});

describe('formatSelectorForStep', () => {
  it('returns empty string for null', () => {
    expect(formatSelectorForStep(null)).toBe('');
  });

  it('returns empty string for undefined', () => {
    expect(formatSelectorForStep(undefined)).toBe('');
  });

  it('returns quoted string for string input', () => {
    expect(formatSelectorForStep('ui5=sap.m.Button')).toBe('"ui5=sap.m.Button"');
  });

  it('returns String(value) for number input', () => {
    expect(formatSelectorForStep(42)).toBe('42');
  });

  it('returns String(value) for boolean input', () => {
    expect(formatSelectorForStep(true)).toBe('true');
  });

  it('extracts id from object selector', () => {
    const result = formatSelectorForStep({ id: 'save' });
    expect(result).toBe('{ id: "save" }');
  });

  it('shortens controlType by stripping sap.m prefix', () => {
    const result = formatSelectorForStep({ controlType: 'sap.m.Button' });
    expect(result).toBe('{ type: "Button" }');
  });

  it('shortens controlType with deeper namespace', () => {
    const result = formatSelectorForStep({ controlType: 'sap.ui.comp.smartfield.SmartField' });
    expect(result).toBe('{ type: "SmartField" }');
  });

  it('extracts both id and controlType', () => {
    const result = formatSelectorForStep({ controlType: 'sap.m.Button', id: 'save' });
    expect(result).toBe('{ id: "save", type: "Button" }');
  });

  it('extracts properties.text', () => {
    const result = formatSelectorForStep({ properties: { text: 'Save' } });
    expect(result).toBe('{ text: "Save" }');
  });

  it('extracts properties.name', () => {
    const result = formatSelectorForStep({ properties: { name: 'submitBtn' } });
    expect(result).toBe('{ name: "submitBtn" }');
  });

  it('extracts properties.text and properties.name together', () => {
    const result = formatSelectorForStep({ properties: { text: 'Save', name: 'saveBtn' } });
    expect(result).toBe('{ text: "Save", name: "saveBtn" }');
  });

  it('returns {} for empty object', () => {
    expect(formatSelectorForStep({})).toBe('{}');
  });

  it('falls back to first 3 keys for non-standard objects', () => {
    const result = formatSelectorForStep({ foo: 1, bar: 'hello', baz: true, extra: 'ignored' });
    expect(result).toBe('{ foo: 1, bar: "hello", baz: true }');
  });

  it('handles nested selector with properties only', () => {
    const result = formatSelectorForStep({ properties: { text: 'Save' } });
    expect(result).toContain('text: "Save"');
  });

  it('handles RegExp id values', () => {
    const result = formatSelectorForStep({ id: /^submit/i });
    expect(result).toBe('{ id: /^submit/i }');
  });

  it('handles array values in selector', () => {
    const result = formatSelectorForStep({ items: [1, 2, 3] });
    expect(result).toBe('{ items: [1, 2, 3] }');
  });

  it('handles circular references without infinite loop', () => {
    const circular: Record<string, unknown> = { key: 'value' };
    circular['self'] = circular;

    // Should not throw and should not hang
    const result = formatSelectorForStep(circular);
    expect(typeof result).toBe('string');
    expect(result).toContain('key: "value"');
  });

  it('handles object with only controlType and properties', () => {
    const result = formatSelectorForStep({
      controlType: 'sap.m.Input',
      properties: { text: 'Hello' },
    });
    expect(result).toBe('{ type: "Input", text: "Hello" }');
  });

  it('returns String(value) for bigint input', () => {
    expect(formatSelectorForStep(BigInt(42))).toBe('42');
  });

  it('returns [unknown] for symbol input', () => {
    expect(formatSelectorForStep(Symbol('test'))).toBe('[unknown]');
  });

  it('returns [unknown] for function input', () => {
    expect(formatSelectorForStep(() => 'noop')).toBe('[unknown]');
  });

  it('formats nested null value via formatValue', () => {
    const result = formatSelectorForStep({ foo: null, bar: 'x' });
    expect(result).toBe('{ foo: null, bar: "x" }');
  });

  it('formats nested undefined value via formatValue', () => {
    const result = formatSelectorForStep({ foo: undefined, bar: 'x' });
    expect(result).toBe('{ foo: undefined, bar: "x" }');
  });

  it('formats nested symbol value via formatValue', () => {
    const sym = Symbol('mySymbol');
    const result = formatSelectorForStep({ tag: sym });
    expect(result).toBe('{ tag: Symbol(mySymbol) }');
  });

  it('formats nested function value via formatValue', () => {
    const result = formatSelectorForStep({ callback: () => 'noop' });
    expect(result).toBe('{ callback: [Function] }');
  });

  it('formats nested bigint value via formatValue', () => {
    const result = formatSelectorForStep({ amount: BigInt(100) });
    expect(result).toBe('{ amount: 100 }');
  });

  it('formats nested object (non-array) value via formatValue', () => {
    // A non-priority object with a nested plain object as a value
    const result = formatSelectorForStep({ config: { timeout: 3000 } });
    expect(result).toBe('{ config: { timeout: 3000 } }');
  });

  it('formats deeply nested objects through formatValue', () => {
    const result = formatSelectorForStep({
      outer: { inner: { deep: 'value' } },
    });
    expect(result).toBe('{ outer: { inner: { deep: "value" } } }');
  });

  it('handles controlType without dots (no split needed)', () => {
    const result = formatSelectorForStep({ controlType: 'Button' });
    // split('.').pop() returns 'Button' when there are no dots
    expect(result).toBe('{ type: "Button" }');
  });
});

describe('generateStepName', () => {
  it('maps known action click with selector', () => {
    const result = generateStepName('UI5Handler', 'click', [{ id: 'saveBtn' }]);
    expect(result).toBe('Click { id: "saveBtn" }');
  });

  it('maps known action fill with selector', () => {
    const result = generateStepName('UI5Handler', 'fill', [{ id: 'input1' }]);
    expect(result).toBe('Fill { id: "input1" }');
  });

  it('maps known action waitForUI5 without selector', () => {
    const result = generateStepName('UI5Handler', 'waitForUI5', []);
    expect(result).toBe('Wait for UI5');
  });

  it('maps known action destroy without selector', () => {
    const result = generateStepName('UI5Handler', 'destroy', []);
    expect(result).toBe('Destroy handler');
  });

  it('maps known action login without selector', () => {
    const result = generateStepName('SAPAuthHandler', 'login', [{ user: 'admin' }]);
    expect(result).toContain('Login');
  });

  it('PascalCases unknown camelCase actions', () => {
    const result = generateStepName('UI5Handler', 'customMethodName', []);
    expect(result).toBe('Custom method name');
  });

  it('handles single-word unknown method name', () => {
    const result = generateStepName('Handler', 'refresh', []);
    expect(result).toBe('Refresh');
  });

  it('handles empty string method name', () => {
    const result = generateStepName('Handler', '', []);
    expect(result).toBe('');
  });

  it('formats selector argument from first arg', () => {
    const result = generateStepName('UI5Handler', 'click', [
      { controlType: 'sap.m.Button', id: 'submit' },
    ]);
    expect(result).toBe('Click { id: "submit", type: "Button" }');
  });

  it('handles string first argument', () => {
    const result = generateStepName('UI5Handler', 'fill', ['some-value']);
    expect(result).toBe('Fill "some-value"');
  });

  it('ignores className in output (used for future extensions)', () => {
    // className is accepted but not currently included in the step name
    const result1 = generateStepName('UI5Handler', 'click', [{ id: 'btn' }]);
    const result2 = generateStepName('ShellHandler', 'click', [{ id: 'btn' }]);
    expect(result1).toBe(result2);
  });

  it('maps ALL ACTION_MAP entries correctly', () => {
    for (const [method, verb] of Object.entries(ACTION_MAP)) {
      const result = generateStepName('Handler', method, []);
      expect(result).toBe(verb);
    }
  });

  it('handles method name with numbers', () => {
    const result = generateStepName('Handler', 'waitFor2ndControl', []);
    expect(typeof result).toBe('string');
    expect(result.length).toBeGreaterThan(0);
  });

  it('handles methods from ShellHandler', () => {
    expect(generateStepName('ShellHandler', 'clickHome', [])).toBe('Click home');
    expect(generateStepName('ShellHandler', 'openUserMenu', [])).toBe('Open user menu');
    expect(generateStepName('ShellHandler', 'expectShellHeader', [])).toBe('Verify shell header');
  });

  it('handles methods from FooterHandler', () => {
    expect(generateStepName('FooterHandler', 'clickSave', [])).toBe('Click Save');
    expect(generateStepName('FooterHandler', 'clickCancel', [])).toBe('Click Cancel');
    expect(generateStepName('FooterHandler', 'clickCreate', [])).toBe('Click Create');
  });

  it('handles methods from AgenticHandler', () => {
    expect(generateStepName('AgenticHandler', 'generateTest', [])).toBe('Generate test');
    expect(generateStepName('AgenticHandler', 'interpretStep', [])).toBe('Interpret step');
    expect(generateStepName('AgenticHandler', 'suggestActions', [])).toBe('Suggest actions');
  });

  it('handles methods from SAPAuthHandler', () => {
    expect(generateStepName('SAPAuthHandler', 'loginFromEnv', [])).toBe('Login from env');
    expect(generateStepName('SAPAuthHandler', 'isAuthenticated', [])).toBe('Check authentication');
    expect(generateStepName('SAPAuthHandler', 'logout', [])).toBe('Logout');
  });
});

describe('ui5Step', () => {
  it('calls target method and returns result', async () => {
    class TestHandler {
      @ui5Step
      async getValue(): Promise<string> {
        return await Promise.resolve('test-value');
      }
    }
    const handler = new TestHandler();
    expect(await handler.getValue()).toBe('test-value');
  });

  it('preserves this context', async () => {
    class TestHandler {
      readonly name = 'handler';

      @ui5Step
      async getName(): Promise<string> {
        return await Promise.resolve(this.name);
      }
    }
    const handler = new TestHandler();
    expect(await handler.getName()).toBe('handler');
  });

  it('propagates errors from target method', async () => {
    class TestHandler {
      @ui5Step
      async failingMethod(): Promise<never> {
        return await Promise.reject(new Error('decorator-error'));
      }
    }
    const handler = new TestHandler();
    await expect(handler.failingMethod()).rejects.toThrow('decorator-error');
  });

  it('propagates PramanError unchanged', async () => {
    const pramanError = new PramanError({
      code: ErrorCode.ERR_CONFIG_INVALID,
      message: 'praman error in decorator',
      attempted: 'test',
      retryable: false,
    });

    class TestHandler {
      @ui5Step
      async failingMethod(): Promise<never> {
        return await Promise.reject(pramanError);
      }
    }
    const handler = new TestHandler();
    await expect(handler.failingMethod()).rejects.toThrow(pramanError);
  });

  it('degrades gracefully outside test context (Vitest)', async () => {
    // In Vitest, isInsideTestContext() returns false, so decorator is a passthrough
    let called = false;
    class TestHandler {
      @ui5Step
      async doSomething(): Promise<string> {
        called = true;
        return await Promise.resolve('done');
      }
    }
    const handler = new TestHandler();
    const result = await handler.doSomething();
    expect(called).toBe(true);
    expect(result).toBe('done');
  });

  it('passes arguments through to target method', async () => {
    class TestHandler {
      @ui5Step
      async add(a: number, b: number): Promise<number> {
        return await Promise.resolve(a + b);
      }
    }
    const handler = new TestHandler();
    expect(await handler.add(3, 4)).toBe(7);
  });

  it('works with methods that accept selector-like objects', async () => {
    class TestHandler {
      @ui5Step
      async click(selector: { id: string }): Promise<string> {
        return await Promise.resolve(`clicked ${selector.id}`);
      }
    }
    const handler = new TestHandler();
    expect(await handler.click({ id: 'saveBtn' })).toBe('clicked saveBtn');
  });

  it('works on multiple methods of the same class', async () => {
    class TestHandler {
      @ui5Step
      async first(): Promise<string> {
        return await Promise.resolve('first');
      }

      @ui5Step
      async second(): Promise<string> {
        return await Promise.resolve('second');
      }
    }
    const handler = new TestHandler();
    // eslint-disable-next-line playwright/no-useless-await -- decorator wraps method in Promise
    const firstResult = await handler.first();
    const secondResult = await handler.second();
    expect(firstResult).toBe('first');
    expect(secondResult).toBe('second');
  });

  it('works across multiple instances of the same class', async () => {
    class TestHandler {
      constructor(readonly prefix: string) {}

      @ui5Step
      async greet(): Promise<string> {
        return await Promise.resolve(`${this.prefix}-hello`);
      }
    }
    const handlerA = new TestHandler('A');
    const handlerB = new TestHandler('B');
    expect(await handlerA.greet()).toBe('A-hello');
    expect(await handlerB.greet()).toBe('B-hello');
  });

  it('handles symbol method names', async () => {
    const myMethod = Symbol('myMethod');

    class TestHandler {
      @ui5Step
      async [myMethod](): Promise<string> {
        return await Promise.resolve('symbol-result');
      }
    }
    const handler = new TestHandler();
    expect(await handler[myMethod]()).toBe('symbol-result');
  });
});
