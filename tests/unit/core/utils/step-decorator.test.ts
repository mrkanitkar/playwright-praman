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
import { createStepName, withStep } from '#core/utils/step-decorator.js';

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
