/**
 * @license
 * Copyright (c) ZesTest 2025-2030. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0
 *
 * This file may contain AI-assisted code.
 * See LICENSE and NOTICE files for details.
 */

/**
 * PluginError — error subclass for plugin lifecycle failures.
 *
 * @remarks
 * Thrown when plugins fail to load, initialize, or are incompatible.
 * The `pluginName` field is required.
 *
 * Default code: `ERR_PLUGIN_LOAD`. Default retryable: `false`
 * (plugin errors need config/code fix).
 *
 * @example
 * ```typescript
 * import { PluginError } from '#core/errors/plugin-error.js';
 *
 * throw new PluginError({
 *   message: 'Plugin incompatible with Praman v1.0',
 *   attempted: 'Load plugin my-custom-auth',
 *   pluginName: 'my-custom-auth',
 *   pluginVersion: '0.5.0',
 * });
 * ```
 *
 * @module errors
 */

import { PramanError } from './base.js';
import type { AIErrorContext, PramanErrorOptions, SerializedPramanError } from './base.js';
import { ErrorCode } from './codes.js';

/**
 * Options for constructing a PluginError.
 */
export interface PluginErrorOptions extends Omit<PramanErrorOptions, 'code' | 'retryable'> {
  readonly code?:
    | typeof ErrorCode.ERR_PLUGIN_LOAD
    | typeof ErrorCode.ERR_PLUGIN_INIT
    | typeof ErrorCode.ERR_PLUGIN_INCOMPATIBLE;
  readonly retryable?: boolean;
  readonly pluginName: string;
  readonly pluginVersion?: string;
}

/**
 * Error subclass for plugin lifecycle failures.
 *
 * @example
 * ```typescript
 * const error = new PluginError({
 *   message: 'Plugin failed to load',
 *   attempted: 'Load plugin',
 *   pluginName: 'my-plugin',
 * });
 * ```
 *
 * @failureMode Load failed — plugin module could not be imported
 * @failureMode Init failed — plugin setup() threw an error
 * @failureMode Incompatible version — plugin requires a different Praman version
 */
export class PluginError extends PramanError {
  readonly pluginName: string;
  readonly pluginVersion: string | undefined;

  /**
   * Creates a new PluginError instance.
   *
   * @param options - Plugin error construction options including the required
   *   plugin name and optional version for diagnostic context.
   *
   * @example
   * ```typescript
   * import { PluginError } from '#core/errors/plugin-error.js';
   *
   * const error = new PluginError({
   *   message: 'Plugin incompatible with Praman v1.0',
   *   attempted: 'Load plugin my-custom-auth',
   *   pluginName: 'my-custom-auth',
   *   pluginVersion: '0.5.0',
   *   code: 'ERR_PLUGIN_INCOMPATIBLE',
   * });
   * ```
   */
  constructor(options: PluginErrorOptions) {
    super({
      ...options,
      code: options.code ?? ErrorCode.ERR_PLUGIN_LOAD,
      retryable: options.retryable ?? false,
    });

    this.name = 'PluginError';
    this.pluginName = options.pluginName;
    this.pluginVersion = options.pluginVersion;

    Object.defineProperty(this, 'pluginName', { writable: false, configurable: false });
    Object.defineProperty(this, 'pluginVersion', { writable: false, configurable: false });
  }

  /**
   * Serializes this error to a JSON-safe object with plugin-specific fields.
   *
   * @returns Base serialization extended with `pluginName` and `pluginVersion`.
   *
   * @example
   * ```typescript
   * const json = error.toJSON();
   * console.log(json.pluginName);    // 'my-custom-auth'
   * console.log(json.pluginVersion); // '0.5.0'
   * ```
   */
  override toJSON(): SerializedPramanError & {
    readonly pluginName: string;
    readonly pluginVersion: string | undefined;
  } {
    return {
      ...super.toJSON(),
      pluginName: this.pluginName,
      pluginVersion: this.pluginVersion,
    };
  }

  /**
   * Returns AI-agent-friendly context with plugin-specific diagnostic fields.
   *
   * @returns Base AI context extended with plugin name and version details.
   *
   * @example
   * ```typescript
   * const ctx = error.toAIContext();
   * // LLM can use ctx.pluginName to locate the plugin package
   * // and ctx.pluginVersion to check compatibility requirements
   * ```
   */
  override toAIContext(): AIErrorContext & {
    readonly pluginName: string;
    readonly pluginVersion: string | undefined;
  } {
    return {
      ...super.toAIContext(),
      pluginName: this.pluginName,
      pluginVersion: this.pluginVersion,
    };
  }
}
