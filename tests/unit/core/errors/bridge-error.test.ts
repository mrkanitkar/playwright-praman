/**
 * Tests for `src/core/errors/bridge-error.ts`.
 */
import { describe, expect, it } from 'vitest';

import { runBaseErrorTests } from '../../../helpers/error-test-runner.js';

import { PramanError } from '#core/errors/base.js';
import { BridgeError } from '#core/errors/bridge-error.js';
import { ErrorCode } from '#core/errors/codes.js';

describe('BridgeError', () => {
  runBaseErrorTests(
    BridgeError,
    {
      message: 'Bridge not ready',
      attempted: 'Inject bridge adapter',
    },
    {
      expectedName: 'BridgeError',
      expectedDefaultCode: ErrorCode.ERR_BRIDGE_NOT_READY,
      expectedDefaultRetryable: true,
    },
  );

  it('extends PramanError', () => {
    const error = new BridgeError({
      message: 'Bridge not ready',
      attempted: 'Inject bridge',
    });
    expect(error).toBeInstanceOf(PramanError);
  });

  it('accepts custom error code', () => {
    const error = new BridgeError({
      code: ErrorCode.ERR_BRIDGE_INJECTION,
      message: 'Injection failed',
      attempted: 'Inject bridge',
    });
    expect(error.code).toBe(ErrorCode.ERR_BRIDGE_INJECTION);
  });

  it('stores ui5Version from options', () => {
    const error = new BridgeError({
      message: 'Version mismatch',
      attempted: 'Check UI5 version',
      ui5Version: '1.120.0',
    });
    expect(error.ui5Version).toBe('1.120.0');
  });

  it('stores adapterType from options', () => {
    const error = new BridgeError({
      message: 'Adapter failed',
      attempted: 'Initialize adapter',
      adapterType: 'record-replay',
    });
    expect(error.adapterType).toBe('record-replay');
  });

  it('includes subclass fields in toJSON()', () => {
    const error = new BridgeError({
      message: 'Bridge failed',
      attempted: 'Inject bridge',
      ui5Version: '1.120.0',
      adapterType: 'classic',
    });
    const json = error.toJSON();
    expect(json).toHaveProperty('ui5Version', '1.120.0');
    expect(json).toHaveProperty('adapterType', 'classic');
  });

  it('includes subclass fields in toAIContext()', () => {
    const error = new BridgeError({
      message: 'Bridge failed',
      attempted: 'Inject bridge',
      ui5Version: '1.120.0',
    });
    const ctx = error.toAIContext();
    expect(ctx).toHaveProperty('ui5Version', '1.120.0');
  });
});
