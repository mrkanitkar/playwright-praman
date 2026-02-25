/**
 * @license
 * Copyright (c) ZesTest 2025-2030. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0
 *
 * This file may contain AI-assisted code.
 * See LICENSE and NOTICE files for details.
 */

/**
 * Type-level tests for `src/bridge/bridge-types.ts`.
 *
 * @remarks
 * Verifies PramanBridge, ControlDiscoveryResult, and MethodExecutionResult
 * interface shapes using expectTypeOf.
 */
import { describe, expectTypeOf, it } from 'vitest';

import type {
  ControlDiscoveryResult,
  MethodExecutionResult,
  PramanBridge,
  PramanBridgeUtils,
} from '#bridge/bridge-types.js';
import type { BridgeReturnType } from '#core/types/bridge.js';

describe('PramanBridge', () => {
  it('has version string', () => {
    expectTypeOf<PramanBridge>().toHaveProperty('version');
    expectTypeOf<PramanBridge['version']>().toBeString();
  });

  it('has ready boolean', () => {
    expectTypeOf<PramanBridge>().toHaveProperty('ready');
    expectTypeOf<PramanBridge['ready']>().toBeBoolean();
  });

  it('has getById method', () => {
    expectTypeOf<PramanBridge>().toHaveProperty('getById');
  });

  it('has saveObject method', () => {
    expectTypeOf<PramanBridge>().toHaveProperty('saveObject');
  });

  it('has objectMap as Map', () => {
    expectTypeOf<PramanBridge['objectMap']>().toExtend<Map<string, unknown>>();
  });

  it('has utils property', () => {
    expectTypeOf<PramanBridge['utils']>().toExtend<PramanBridgeUtils>();
  });
});

describe('ControlDiscoveryResult', () => {
  it('has required fields', () => {
    expectTypeOf<ControlDiscoveryResult>().toHaveProperty('id');
    expectTypeOf<ControlDiscoveryResult>().toHaveProperty('controlType');
    expectTypeOf<ControlDiscoveryResult>().toHaveProperty('methods');
    expectTypeOf<ControlDiscoveryResult>().toHaveProperty('domId');
    expectTypeOf<ControlDiscoveryResult>().toHaveProperty('visible');
  });

  it('methods is readonly string array', () => {
    expectTypeOf<ControlDiscoveryResult['methods']>().toExtend<readonly string[]>();
  });

  it('domId is nullable', () => {
    expectTypeOf<ControlDiscoveryResult['domId']>().toExtend<string | null>();
  });
});

describe('MethodExecutionResult', () => {
  it('has returnType as BridgeReturnType', () => {
    expectTypeOf<MethodExecutionResult['returnType']>().toExtend<BridgeReturnType>();
  });

  it('has success boolean', () => {
    expectTypeOf<MethodExecutionResult['success']>().toBeBoolean();
  });

  it('has duration number', () => {
    expectTypeOf<MethodExecutionResult['duration']>().toBeNumber();
  });

  it('accepts generic type parameter', () => {
    type StringResult = MethodExecutionResult<string>;
    expectTypeOf<StringResult['value']>().toExtend<string | undefined>();
  });

  it('defaults to unknown value type', () => {
    expectTypeOf<MethodExecutionResult['value']>().toExtend<unknown>();
  });
});
