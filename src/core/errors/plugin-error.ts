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
 */
export class PluginError extends PramanError {
  readonly pluginName: string;
  readonly pluginVersion: string | undefined;

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
