/**
 * @license
 * Copyright (c) ZesTest 2025-2030. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0
 *
 * This file may contain AI-assisted code.
 * See LICENSE and NOTICE files for details.
 */

/**
 * Shared test runner for PramanError subclass base-behavior assertions.
 *
 * @remarks
 * Runs 10 standard tests that every PramanError subclass must pass.
 * Call `runBaseErrorTests()` inside the subclass's `describe()` block
 * to avoid duplicating base-behavior assertions across 10 error files.
 *
 * @example
 * ```typescript
 * import { runBaseErrorTests } from '../../helpers/error-test-runner.js';
 * import { ConfigError } from '#core/errors/config-error.js';
 *
 * describe('ConfigError', () => {
 *   runBaseErrorTests(ConfigError, {
 *     message: 'test config error',
 *     attempted: 'load config',
 *   }, {
 *     expectedName: 'ConfigError',
 *     expectedDefaultCode: 'ERR_CONFIG_INVALID',
 *     expectedDefaultRetryable: false,
 *   });
 * });
 * ```
 *
 * @module test-helpers
 */

import { expect, it } from 'vitest';

import type { PramanError } from '#core/errors/base.js';

/** Constructor type for PramanError subclasses (accepts any options shape). */
type PramanErrorConstructor = new (options: any) => PramanError;

/** Expectations for shared base-behavior tests. */
export interface BaseErrorExpectations {
  /** Expected value of `error.name`. */
  readonly expectedName: string;
  /** Expected default error code when code is not explicitly provided. */
  readonly expectedDefaultCode: string;
  /** Expected default retryable value when not explicitly provided. */
  readonly expectedDefaultRetryable: boolean;
}

/**
 * Runs 10 standard base-behavior tests for a PramanError subclass.
 *
 * @param errorClass - The error subclass constructor.
 * @param sampleOptions - Minimal options to construct the error (without code/retryable).
 * @param expectations - Expected defaults for the subclass.
 *
 * @example
 * ```typescript
 * runBaseErrorTests(BridgeError, {
 *   message: 'bridge failed',
 *   attempted: 'inject bridge',
 * }, {
 *   expectedName: 'BridgeError',
 *   expectedDefaultCode: 'ERR_BRIDGE_NOT_READY',
 *   expectedDefaultRetryable: true,
 * });
 * ```
 */
export function runBaseErrorTests(
  errorClass: PramanErrorConstructor,
  sampleOptions: Record<string, unknown>,
  expectations: BaseErrorExpectations,
): void {
  it('is an instance of its own class', () => {
    const error = new errorClass(sampleOptions);
    expect(error).toBeInstanceOf(errorClass);
  });

  it('is an instance of PramanError', () => {
    // Import dynamically to avoid circular deps in type-only module
    const error = new errorClass(sampleOptions);
    expect(error).toHaveProperty('code');
    expect(error).toHaveProperty('attempted');
    expect(error).toHaveProperty('retryable');
    expect(error).toHaveProperty('toJSON');
    expect(error).toHaveProperty('toUserMessage');
    expect(error).toHaveProperty('toAIContext');
  });

  it('is an instance of Error', () => {
    const error = new errorClass(sampleOptions);
    expect(error).toBeInstanceOf(Error);
  });

  it(`has name set to ${expectations.expectedName}`, () => {
    const error = new errorClass(sampleOptions);
    expect(error.name).toBe(expectations.expectedName);
  });

  it(`defaults code to ${expectations.expectedDefaultCode}`, () => {
    const error = new errorClass(sampleOptions);
    expect(error.code).toBe(expectations.expectedDefaultCode);
  });

  it(`defaults retryable to ${String(expectations.expectedDefaultRetryable)}`, () => {
    const error = new errorClass(sampleOptions);
    expect(error.retryable).toBe(expectations.expectedDefaultRetryable);
  });

  it('toJSON() includes all base fields', () => {
    const error = new errorClass(sampleOptions);
    const json = error.toJSON();
    expect(json).toHaveProperty('name', expectations.expectedName);
    expect(json).toHaveProperty('code', expectations.expectedDefaultCode);
    expect(json).toHaveProperty('message');
    expect(json).toHaveProperty('attempted');
    expect(json).toHaveProperty('retryable');
    expect(json).toHaveProperty('severity');
    expect(json).toHaveProperty('details');
    expect(json).toHaveProperty('suggestions');
    expect(json).toHaveProperty('timestamp');
    expect(json).toHaveProperty('stack');
  });

  it('toAIContext() includes all fields except stack and name', () => {
    const error = new errorClass(sampleOptions);
    const ctx = error.toAIContext();
    expect(ctx).toHaveProperty('code', expectations.expectedDefaultCode);
    expect(ctx).toHaveProperty('message');
    expect(ctx).toHaveProperty('attempted');
    expect(ctx).toHaveProperty('retryable');
    expect(ctx).toHaveProperty('severity');
    expect(ctx).toHaveProperty('details');
    expect(ctx).toHaveProperty('suggestions');
    expect(ctx).toHaveProperty('timestamp');
    expect(ctx).not.toHaveProperty('stack');
    expect(ctx).not.toHaveProperty('name');
  });

  it('toUserMessage() produces formatted string', () => {
    const error = new errorClass(sampleOptions);
    const msg = error.toUserMessage();
    expect(msg).toContain(`[${expectations.expectedDefaultCode}]`);
    expect(msg).toContain('Attempted:');
    expect(msg).toContain('Severity:');
    expect(msg).toContain('Retryable:');
  });

  it('properties are readonly', () => {
    const error = new errorClass(sampleOptions);
    expect(() => {
      // @ts-expect-error -- testing runtime immutability
      error.code = 'ERR_BRIDGE_TIMEOUT';
    }).toThrow();
  });
}
