/**
 * Tests for `src/core/errors/plugin-error.ts`.
 */
import { describe, expect, it } from 'vitest';

import { runBaseErrorTests } from '../../../helpers/error-test-runner.js';

import { PramanError } from '#core/errors/base.js';
import { ErrorCode } from '#core/errors/codes.js';
import { PluginError } from '#core/errors/plugin-error.js';

describe('PluginError', () => {
  runBaseErrorTests(
    PluginError,
    {
      message: 'Plugin failed to load',
      attempted: 'Load plugin my-plugin',
      pluginName: 'my-plugin',
    },
    {
      expectedName: 'PluginError',
      expectedDefaultCode: ErrorCode.ERR_PLUGIN_LOAD,
      expectedDefaultRetryable: false,
    },
  );

  it('extends PramanError', () => {
    const error = new PluginError({
      message: 'Plugin failed',
      attempted: 'Load plugin',
      pluginName: 'test-plugin',
    });
    expect(error).toBeInstanceOf(PramanError);
  });

  it('accepts custom error code', () => {
    const error = new PluginError({
      code: ErrorCode.ERR_PLUGIN_INCOMPATIBLE,
      message: 'Incompatible plugin',
      attempted: 'Check compatibility',
      pluginName: 'old-plugin',
    });
    expect(error.code).toBe(ErrorCode.ERR_PLUGIN_INCOMPATIBLE);
  });

  it('stores pluginName from options (required)', () => {
    const error = new PluginError({
      message: 'Plugin failed',
      attempted: 'Load plugin',
      pluginName: 'my-plugin',
    });
    expect(error.pluginName).toBe('my-plugin');
  });

  it('stores pluginVersion from options', () => {
    const error = new PluginError({
      message: 'Plugin incompatible',
      attempted: 'Check version',
      pluginName: 'my-plugin',
      pluginVersion: '2.1.0',
    });
    expect(error.pluginVersion).toBe('2.1.0');
  });

  it('includes subclass fields in toJSON()', () => {
    const error = new PluginError({
      message: 'Plugin failed',
      attempted: 'Load plugin',
      pluginName: 'my-plugin',
      pluginVersion: '1.0.0',
    });
    const json = error.toJSON();
    expect(json).toHaveProperty('pluginName', 'my-plugin');
    expect(json).toHaveProperty('pluginVersion', '1.0.0');
  });
});
