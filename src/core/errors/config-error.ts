/**
 * @license
 * Copyright (c) ZesTest 2025-2030. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0
 *
 * This file may contain AI-assisted code.
 * See LICENSE and NOTICE files for details.
 */

/**
 * ConfigError — error subclass for configuration-related failures.
 *
 * @remarks
 * Thrown when config files are invalid, missing, or unparseable.
 * Carries optional `validationErrors` (Zod-decoupled) and `configPath`.
 *
 * Default code: `ERR_CONFIG_INVALID`. Default retryable: `false`
 * (config errors are deterministic — retrying won't help).
 *
 * @example
 * ```typescript
 * import { ConfigError } from '#core/errors/config-error.js';
 *
 * throw new ConfigError({
 *   message: 'Config file contains invalid values',
 *   attempted: 'Load config from praman.config.ts',
 *   configPath: '/app/praman.config.ts',
 *   validationErrors: [{ path: ['auth'], message: 'Required', code: 'invalid_type' }],
 * });
 * ```
 *
 * @module errors
 */

import { PramanError } from './base.js';
import type { AIErrorContext, PramanErrorOptions, SerializedPramanError } from './base.js';
import { ErrorCode } from './codes.js';

import type { ValidationIssue } from '#core/types/validation.js';

/**
 * Options for constructing a ConfigError.
 */
export interface ConfigErrorOptions extends Omit<PramanErrorOptions, 'code' | 'retryable'> {
  readonly code?:
    | typeof ErrorCode.ERR_CONFIG_INVALID
    | typeof ErrorCode.ERR_CONFIG_NOT_FOUND
    | typeof ErrorCode.ERR_CONFIG_PARSE;
  readonly retryable?: boolean;
  readonly validationErrors?: readonly ValidationIssue[];
  readonly configPath?: string;
}

/**
 * Error subclass for configuration failures.
 *
 * @failureMode Invalid config file — YAML/JSON parse error or Zod schema validation failure
 *
 * @failureMode Missing config — no praman.config.ts/yml found in project root
 *
 * @failureMode Schema validation — config values out of range or wrong type
 *
 * @example
 * ```typescript
 * const error = new ConfigError({
 *   message: 'Invalid auth strategy',
 *   attempted: 'Validate config',
 *   validationErrors: [{ path: ['auth'], message: 'Invalid', code: 'invalid_enum_value' }],
 * });
 * ```
 */
export class ConfigError extends PramanError {
  readonly validationErrors: readonly ValidationIssue[];
  readonly configPath: string | undefined;

  /**
   * Creates a new ConfigError instance.
   *
   * @param options - Config error construction options including validation errors and config path.
   *
   * @example
   * ```typescript
   * import { ConfigError } from '#core/errors/config-error.js';
   *
   * const error = new ConfigError({
   *   message: 'Config file contains invalid values',
   *   attempted: 'Load config from praman.config.ts',
   *   configPath: '/app/praman.config.ts',
   *   validationErrors: [{ path: ['auth'], message: 'Required', code: 'invalid_type' }],
   * });
   * ```
   */
  constructor(options: ConfigErrorOptions) {
    super({
      ...options,
      code: options.code ?? ErrorCode.ERR_CONFIG_INVALID,
      retryable: options.retryable ?? false,
    });

    this.name = 'ConfigError';
    this.validationErrors = Object.freeze([...(options.validationErrors ?? [])]);
    this.configPath = options.configPath;

    Object.defineProperty(this, 'validationErrors', { writable: false, configurable: false });
    Object.defineProperty(this, 'configPath', { writable: false, configurable: false });
  }

  /**
   * Serializes the error to a JSON-safe object with configuration fields.
   *
   * @returns Base fields plus `validationErrors` and `configPath`.
   *
   * @example
   * ```typescript
   * const json = error.toJSON();
   * // json.configPath === '/app/praman.config.ts'
   * // json.validationErrors === [{ path: ['auth'], message: 'Required', code: 'invalid_type' }]
   * ```
   */
  override toJSON(): SerializedPramanError & {
    readonly validationErrors: readonly ValidationIssue[];
    readonly configPath: string | undefined;
  } {
    return {
      ...super.toJSON(),
      validationErrors: this.validationErrors,
      configPath: this.configPath,
    };
  }

  /**
   * Returns structured context for AI agents with configuration diagnostics.
   *
   * @returns Base AI context plus `validationErrors` and `configPath` fields
   * to help diagnose configuration issues and suggest fixes.
   *
   * @example
   * ```typescript
   * const context = error.toAIContext();
   * // context.validationErrors, context.configPath available
   * // Send to LLM for config fix suggestions
   * ```
   */
  override toAIContext(): AIErrorContext & {
    readonly validationErrors: readonly ValidationIssue[];
    readonly configPath: string | undefined;
  } {
    return {
      ...super.toAIContext(),
      validationErrors: this.validationErrors,
      configPath: this.configPath,
    };
  }
}
