/**
 * Tests for `src/core/errors/selector-error.ts`.
 */
import { describe, expect, it } from 'vitest';

import { runBaseErrorTests } from '../../../helpers/error-test-runner.js';

import { PramanError } from '#core/errors/base.js';
import { ErrorCode } from '#core/errors/codes.js';
import { SelectorError } from '#core/errors/selector-error.js';

describe('SelectorError', () => {
  runBaseErrorTests(
    SelectorError,
    {
      message: 'Invalid selector syntax',
      attempted: 'Parse selector string',
    },
    {
      expectedName: 'SelectorError',
      expectedDefaultCode: ErrorCode.ERR_SELECTOR_INVALID,
      expectedDefaultRetryable: false,
    },
  );

  it('extends PramanError', () => {
    const error = new SelectorError({
      message: 'Invalid selector',
      attempted: 'Parse selector',
    });
    expect(error).toBeInstanceOf(PramanError);
  });

  it('accepts custom error code', () => {
    const error = new SelectorError({
      code: ErrorCode.ERR_SELECTOR_AMBIGUOUS,
      message: 'Ambiguous selector',
      attempted: 'Resolve selector',
    });
    expect(error.code).toBe(ErrorCode.ERR_SELECTOR_AMBIGUOUS);
  });

  it('stores selectorString from options', () => {
    const error = new SelectorError({
      message: 'Invalid selector',
      attempted: 'Parse selector',
      selectorString: 'sap.m.Button#submitBtn',
    });
    expect(error.selectorString).toBe('sap.m.Button#submitBtn');
  });

  it('stores parsedSelector from options', () => {
    const selector = { id: 'submitBtn', controlType: 'sap.m.Button' };
    const error = new SelectorError({
      message: 'Ambiguous selector',
      attempted: 'Resolve selector',
      parsedSelector: selector,
    });
    expect(error.parsedSelector).toEqual(selector);
  });

  it('includes subclass fields in toJSON()', () => {
    const error = new SelectorError({
      message: 'Invalid selector',
      attempted: 'Parse selector',
      selectorString: 'sap.m.Button#btn',
      parsedSelector: { id: 'btn' },
    });
    const json = error.toJSON();
    expect(json).toHaveProperty('selectorString', 'sap.m.Button#btn');
    expect(json).toHaveProperty('parsedSelector');
  });
});
