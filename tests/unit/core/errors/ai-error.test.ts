/**
 * Tests for `src/core/errors/ai-error.ts`.
 */
import { describe, expect, it } from 'vitest';

import { runBaseErrorTests } from '../../../helpers/error-test-runner.js';

import { AIError } from '#core/errors/ai-error.js';
import { PramanError } from '#core/errors/base.js';
import { ErrorCode } from '#core/errors/codes.js';

describe('AIError', () => {
  runBaseErrorTests(
    AIError,
    {
      message: 'AI provider unavailable',
      attempted: 'Generate test steps',
    },
    {
      expectedName: 'AIError',
      expectedDefaultCode: ErrorCode.ERR_AI_PROVIDER_UNAVAILABLE,
      expectedDefaultRetryable: true,
    },
  );

  it('extends PramanError', () => {
    const error = new AIError({
      message: 'Provider unavailable',
      attempted: 'Generate tests',
    });
    expect(error).toBeInstanceOf(PramanError);
  });

  it('accepts custom error code', () => {
    const error = new AIError({
      code: ErrorCode.ERR_AI_RATE_LIMITED,
      message: 'Rate limited',
      attempted: 'Call AI API',
    });
    expect(error.code).toBe(ErrorCode.ERR_AI_RATE_LIMITED);
  });

  it('stores provider from options', () => {
    const error = new AIError({
      message: 'AI failed',
      attempted: 'Generate',
      provider: 'azure-openai',
    });
    expect(error.provider).toBe('azure-openai');
  });

  it('stores model from options', () => {
    const error = new AIError({
      message: 'AI failed',
      attempted: 'Generate',
      model: 'gpt-4o',
    });
    expect(error.model).toBe('gpt-4o');
  });

  it('stores tokenUsage from options', () => {
    const usage = { prompt: 1500, completion: 500, total: 2000 };
    const error = new AIError({
      message: 'Token limit exceeded',
      attempted: 'Generate',
      tokenUsage: usage,
    });
    expect(error.tokenUsage).toEqual(usage);
  });

  it('includes subclass fields in toJSON()', () => {
    const error = new AIError({
      message: 'AI failed',
      attempted: 'Generate',
      provider: 'openai',
      model: 'gpt-4o',
      tokenUsage: { prompt: 100, completion: 50, total: 150 },
    });
    const json = error.toJSON();
    expect(json).toHaveProperty('provider', 'openai');
    expect(json).toHaveProperty('model', 'gpt-4o');
    expect(json).toHaveProperty('tokenUsage');
  });
});
