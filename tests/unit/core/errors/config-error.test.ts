/**
 * Tests for `src/core/errors/config-error.ts`.
 *
 * @remarks
 * Uses shared `runBaseErrorTests` for base-behavior assertions,
 * then adds ConfigError-specific tests for validationErrors and configPath.
 */
import { describe, expect, it } from 'vitest';

import { runBaseErrorTests } from '../../../helpers/error-test-runner.js';

import { PramanError } from '#core/errors/base.js';
import { ErrorCode } from '#core/errors/codes.js';
import { ConfigError } from '#core/errors/config-error.js';

describe('ConfigError', () => {
  // ── Shared base-behavior tests (10 tests) ────────────────────────────
  runBaseErrorTests(
    ConfigError,
    {
      message: 'Config file contains invalid values',
      attempted: 'Load config from praman.config.ts',
    },
    {
      expectedName: 'ConfigError',
      expectedDefaultCode: ErrorCode.ERR_CONFIG_INVALID,
      expectedDefaultRetryable: false,
    },
  );

  // ── ConfigError-specific tests ────────────────────────────────────────
  it('extends PramanError', () => {
    const error = new ConfigError({
      message: 'Invalid config',
      attempted: 'Load config',
    });
    expect(error).toBeInstanceOf(PramanError);
  });

  it('accepts custom error code', () => {
    const error = new ConfigError({
      code: ErrorCode.ERR_CONFIG_NOT_FOUND,
      message: 'Config not found',
      attempted: 'Load config',
    });
    expect(error.code).toBe(ErrorCode.ERR_CONFIG_NOT_FOUND);
  });

  it('stores validationErrors from options', () => {
    const validationErrors = [
      { path: ['auth', 'strategy'], message: 'Invalid enum', code: 'invalid_enum_value' },
      { path: ['logging', 'level'], message: 'Required', code: 'invalid_type' },
    ];
    const error = new ConfigError({
      message: 'Validation failed',
      attempted: 'Validate config',
      validationErrors,
    });
    expect(error.validationErrors).toEqual(validationErrors);
    expect(error.validationErrors).toHaveLength(2);
  });

  it('defaults validationErrors to empty array', () => {
    const error = new ConfigError({
      message: 'Invalid config',
      attempted: 'Load config',
    });
    expect(error.validationErrors).toEqual([]);
  });

  it('stores configPath from options', () => {
    const error = new ConfigError({
      message: 'Invalid config',
      attempted: 'Load config',
      configPath: '/app/praman.config.ts',
    });
    expect(error.configPath).toBe('/app/praman.config.ts');
  });

  it('configPath is undefined when not provided', () => {
    const error = new ConfigError({
      message: 'Invalid config',
      attempted: 'Load config',
    });
    expect(error.configPath).toBeUndefined();
  });

  it('includes validationErrors in toJSON()', () => {
    const validationErrors = [{ path: ['auth'], message: 'Required', code: 'invalid_type' }];
    const error = new ConfigError({
      message: 'Validation failed',
      attempted: 'Validate config',
      validationErrors,
      configPath: '/app/config.ts',
    });
    const json = error.toJSON();
    expect(json).toHaveProperty('validationErrors', validationErrors);
    expect(json).toHaveProperty('configPath', '/app/config.ts');
  });

  it('includes configPath in toAIContext()', () => {
    const error = new ConfigError({
      message: 'Invalid config',
      attempted: 'Load config',
      configPath: '/app/config.ts',
    });
    const ctx = error.toAIContext();
    expect(ctx).toHaveProperty('configPath', '/app/config.ts');
  });
});
