/**
 * Type-level tests for `src/core/types/bridge.ts`.
 *
 * @remarks
 * Verifies BridgeReturnType discriminant, BridgeMethodDescriptor shape,
 * and BridgeResult generic envelope.
 */
import { describe, expectTypeOf, it } from 'vitest';

import type { BridgeMethodDescriptor, BridgeResult, BridgeReturnType } from '#core/types/bridge.js';

describe('BridgeReturnType', () => {
  it('accepts all nine return type values', () => {
    expectTypeOf<'empty'>().toExtend<BridgeReturnType>();
    expectTypeOf<'result'>().toExtend<BridgeReturnType>();
    expectTypeOf<'element'>().toExtend<BridgeReturnType>();
    expectTypeOf<'newElement'>().toExtend<BridgeReturnType>();
    expectTypeOf<'aggregation'>().toExtend<BridgeReturnType>();
    expectTypeOf<'object'>().toExtend<BridgeReturnType>();
    expectTypeOf<'objectArray'>().toExtend<BridgeReturnType>();
    expectTypeOf<'none'>().toExtend<BridgeReturnType>();
    expectTypeOf<'unknown'>().toExtend<BridgeReturnType>();
  });

  it('rejects invalid return types', () => {
    expectTypeOf<'void'>().not.toExtend<BridgeReturnType>();
    expectTypeOf<'string'>().not.toExtend<BridgeReturnType>();
  });
});

describe('BridgeMethodDescriptor', () => {
  it('matches the expected shape', () => {
    const descriptor: BridgeMethodDescriptor = {
      name: 'getText',
      args: [],
      returnType: 'result',
    };
    expectTypeOf(descriptor).toExtend<BridgeMethodDescriptor>();
  });

  it('requires all three fields', () => {
    expectTypeOf<BridgeMethodDescriptor>().toHaveProperty('name');
    expectTypeOf<BridgeMethodDescriptor>().toHaveProperty('args');
    expectTypeOf<BridgeMethodDescriptor>().toHaveProperty('returnType');
  });

  it('args accepts readonly array of unknown', () => {
    const descriptor: BridgeMethodDescriptor = {
      name: 'setProperty',
      args: ['text', 'Hello'] as const,
      returnType: 'empty',
    };
    expectTypeOf(descriptor.args).toExtend<readonly unknown[]>();
  });
});

describe('BridgeResult', () => {
  it('accepts a success result with typed data', () => {
    const result: BridgeResult<string> = {
      success: true,
      data: 'Save',
      duration: 42,
    };
    expectTypeOf(result).toExtend<BridgeResult<string>>();
  });

  it('accepts a failure result with error message', () => {
    const result: BridgeResult = {
      success: false,
      error: 'Control not found',
      duration: 100,
    };
    expectTypeOf(result).toExtend<BridgeResult>();
  });

  it('requires success and duration fields', () => {
    expectTypeOf<BridgeResult>().toHaveProperty('success');
    expectTypeOf<BridgeResult>().toHaveProperty('duration');
  });

  it('data field accepts any value when no type parameter given', () => {
    const result: BridgeResult = { success: true, duration: 10, data: 'anything' };
    expectTypeOf(result.data).toBeUnknown();
  });
});
