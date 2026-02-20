/**
 * Tests for `src/core/errors/intent-error.ts`.
 */
import { describe, expect, it } from 'vitest';

import { runBaseErrorTests } from '../../../helpers/error-test-runner.js';

import { PramanError } from '#core/errors/base.js';
import { ErrorCode } from '#core/errors/codes.js';
import { IntentError } from '#core/errors/intent-error.js';

describe('IntentError', () => {
  runBaseErrorTests(
    IntentError,
    {
      message: 'Intent field not found',
      attempted: 'Fill supplier field via vocabulary',
    },
    {
      expectedName: 'IntentError',
      expectedDefaultCode: ErrorCode.ERR_INTENT_FIELD_NOT_FOUND,
      expectedDefaultRetryable: false,
    },
  );

  it('extends PramanError', () => {
    const error = new IntentError({
      message: 'Field not found',
      attempted: 'Fill field',
    });
    expect(error).toBeInstanceOf(PramanError);
  });

  it('accepts ERR_INTENT_ACTION_FAILED code', () => {
    const error = new IntentError({
      code: ErrorCode.ERR_INTENT_ACTION_FAILED,
      message: 'Action failed',
      attempted: 'Click Save button',
    });
    expect(error.code).toBe(ErrorCode.ERR_INTENT_ACTION_FAILED);
  });

  it('accepts ERR_INTENT_NAVIGATION_FAILED code', () => {
    const error = new IntentError({
      code: ErrorCode.ERR_INTENT_NAVIGATION_FAILED,
      message: 'Navigation failed',
      attempted: 'Navigate to Purchase Order app',
    });
    expect(error.code).toBe(ErrorCode.ERR_INTENT_NAVIGATION_FAILED);
  });

  it('accepts ERR_INTENT_VALIDATION_FAILED code', () => {
    const error = new IntentError({
      code: ErrorCode.ERR_INTENT_VALIDATION_FAILED,
      message: 'Validation failed',
      attempted: 'Validate PO form before save',
    });
    expect(error.code).toBe(ErrorCode.ERR_INTENT_VALIDATION_FAILED);
  });

  it('stores fieldName from options', () => {
    const error = new IntentError({
      message: 'Field not found',
      attempted: 'Fill field',
      fieldName: 'supplier',
    });
    expect(error.fieldName).toBe('supplier');
  });

  it('stores sapDomain from options', () => {
    const error = new IntentError({
      message: 'Field not found',
      attempted: 'Fill field',
      sapDomain: 'procurement',
    });
    expect(error.sapDomain).toBe('procurement');
  });

  it('fieldName and sapDomain are undefined when not provided', () => {
    const error = new IntentError({
      message: 'Field not found',
      attempted: 'Fill field',
    });
    expect(error.fieldName).toBeUndefined();
    expect(error.sapDomain).toBeUndefined();
  });

  it('includes fieldName and sapDomain in toJSON()', () => {
    const error = new IntentError({
      message: 'Field not found',
      attempted: 'Fill field',
      fieldName: 'material',
      sapDomain: 'procurement',
    });
    const json = error.toJSON();
    expect(json).toHaveProperty('fieldName', 'material');
    expect(json).toHaveProperty('sapDomain', 'procurement');
  });

  it('includes fieldName and sapDomain in toAIContext()', () => {
    const error = new IntentError({
      message: 'Field not found',
      attempted: 'Fill field',
      fieldName: 'customer',
      sapDomain: 'sales',
    });
    const ctx = error.toAIContext();
    expect(ctx).toHaveProperty('fieldName', 'customer');
    expect(ctx).toHaveProperty('sapDomain', 'sales');
  });
});
