/**
 * PramanError — base error class for all Praman errors.
 *
 * @remarks
 * All error subclasses extend this base. Provides structured serialization
 * via `toJSON()`, user-friendly output via `toUserMessage()`, and AI-first
 * introspection via `toAIContext()`.
 *
 * Properties are frozen after construction for immutability.
 *
 * @example
 * ```typescript
 * import { PramanError } from '#core/errors/base.js';
 * import { ErrorCode } from '#core/errors/codes.js';
 *
 * throw new PramanError({
 *   code: ErrorCode.ERR_CONFIG_INVALID,
 *   message: 'Config file is invalid',
 *   attempted: 'Load config from praman.config.ts',
 *   retryable: false,
 *   suggestions: ['Check config file syntax'],
 * });
 * ```
 *
 * @module errors
 */

import type { ErrorCode } from './codes.js';

/**
 * Options for constructing a PramanError.
 */
export interface PramanErrorOptions {
  readonly code: ErrorCode;
  readonly message: string;
  readonly attempted: string;
  readonly retryable: boolean;
  readonly severity?: 'error' | 'warning' | 'info';
  readonly details?: Readonly<Record<string, unknown>>;
  readonly suggestions?: readonly string[];
  readonly cause?: Error;
}

/**
 * Serialized form of a PramanError (output of `toJSON()`).
 */
export interface SerializedPramanError {
  readonly name: string;
  readonly code: ErrorCode;
  readonly message: string;
  readonly attempted: string;
  readonly retryable: boolean;
  readonly severity: string;
  readonly details: Readonly<Record<string, unknown>>;
  readonly suggestions: readonly string[];
  readonly timestamp: string;
  readonly stack: string | undefined;
}

/**
 * AI-first structured context for error introspection.
 */
export interface AIErrorContext {
  readonly code: ErrorCode;
  readonly message: string;
  readonly attempted: string;
  readonly retryable: boolean;
  readonly severity: string;
  readonly details: Readonly<Record<string, unknown>>;
  readonly suggestions: readonly string[];
  readonly timestamp: string;
}

/**
 * Base error class for all Praman errors.
 *
 * @remarks
 * Extends `Error` with structured diagnostic fields:
 * - `code` — machine-readable error code from `ErrorCode`
 * - `attempted` — human description of the operation that failed
 * - `retryable` — whether the caller can retry the operation
 * - `severity` — 'error', 'warning', or 'info'
 * - `details` — structured key-value context
 * - `suggestions` — recovery hints for humans and AI agents
 * - `timestamp` — ISO 8601 creation time
 *
 * @example
 * ```typescript
 * const error = new PramanError({
 *   code: 'ERR_CONFIG_INVALID',
 *   message: 'Invalid config',
 *   attempted: 'Load config',
 *   retryable: false,
 * });
 * logger.error(error.toUserMessage());
 * ```
 */
export class PramanError extends Error {
  readonly code: ErrorCode;
  readonly attempted: string;
  readonly retryable: boolean;
  readonly severity: 'error' | 'warning' | 'info';
  readonly details: Readonly<Record<string, unknown>>;
  readonly suggestions: readonly string[];
  readonly timestamp: string;

  constructor(options: PramanErrorOptions) {
    super(options.message, options.cause !== undefined ? { cause: options.cause } : undefined);

    this.name = 'PramanError';
    this.code = options.code;
    this.attempted = options.attempted;
    this.retryable = options.retryable;
    this.severity = options.severity ?? 'error';
    this.details = Object.freeze({ ...options.details });
    this.suggestions = Object.freeze([...(options.suggestions ?? [])]);
    this.timestamp = new Date().toISOString();

    // Freeze own properties for immutability
    Object.defineProperty(this, 'code', { writable: false, configurable: false });
    Object.defineProperty(this, 'attempted', { writable: false, configurable: false });
    Object.defineProperty(this, 'retryable', { writable: false, configurable: false });
    Object.defineProperty(this, 'severity', { writable: false, configurable: false });
    Object.defineProperty(this, 'details', { writable: false, configurable: false });
    Object.defineProperty(this, 'suggestions', { writable: false, configurable: false });
    Object.defineProperty(this, 'timestamp', { writable: false, configurable: false });
  }

  /**
   * Serializes the error to a plain JSON-safe object.
   *
   * @returns Structured representation with all diagnostic fields.
   *
   * @example
   * ```typescript
   * const json = error.toJSON();
   * logger.debug(JSON.stringify(json, null, 2));
   * ```
   */
  toJSON(): SerializedPramanError {
    return {
      name: this.name,
      code: this.code,
      message: this.message,
      attempted: this.attempted,
      retryable: this.retryable,
      severity: this.severity,
      details: this.details,
      suggestions: this.suggestions,
      timestamp: this.timestamp,
      stack: this.stack,
    };
  }

  /**
   * Formats the error for human-readable console output.
   *
   * @returns Multi-line formatted string with all diagnostic sections.
   *
   * @example
   * ```typescript
   * console.error(error.toUserMessage());
   * ```
   */
  toUserMessage(): string {
    const lines: string[] = [];

    lines.push(`[${this.code}] ${this.message}`);
    lines.push('');
    lines.push(`  Attempted: ${this.attempted}`);
    lines.push(`  Severity:  ${this.severity}`);
    lines.push(`  Retryable: ${this.retryable ? 'yes' : 'no'}`);

    if (this.suggestions.length > 0) {
      lines.push('');
      lines.push('  Suggestions:');
      for (const [index, suggestion] of this.suggestions.entries()) {
        lines.push(`    ${String(index + 1)}. ${suggestion}`);
      }
    }

    const detailKeys = Object.keys(this.details);
    if (detailKeys.length > 0) {
      lines.push('');
      lines.push('  Details:');
      for (const [key, value] of Object.entries(this.details)) {
        lines.push(`    ${key}: ${String(value)}`);
      }
    }

    return lines.join('\n');
  }

  /**
   * Returns structured context for AI agents to reason about the error.
   *
   * @remarks
   * Same as `toJSON()` but omits `stack` and `name` — AI agents don't
   * need stack traces, and the error type is conveyed by `code`.
   *
   * @returns AI-friendly context object.
   *
   * @example
   * ```typescript
   * const context = error.toAIContext();
   * // Send to LLM for self-healing analysis
   * ```
   */
  toAIContext(): AIErrorContext {
    return {
      code: this.code,
      message: this.message,
      attempted: this.attempted,
      retryable: this.retryable,
      severity: this.severity,
      details: this.details,
      suggestions: this.suggestions,
      timestamp: this.timestamp,
    };
  }
}
