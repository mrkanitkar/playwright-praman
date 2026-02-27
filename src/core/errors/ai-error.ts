/**
 * @license
 * Copyright (c) ZesTest 2025-2030. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0
 *
 * This file may contain AI-assisted code.
 * See LICENSE and NOTICE files for details.
 */

/**
 * AIError — error subclass for AI provider failures.
 *
 * @remarks
 * Thrown when AI providers are unavailable, responses are invalid,
 * token limits are exceeded, or rate limits are hit.
 *
 * Default code: `ERR_AI_PROVIDER_UNAVAILABLE`. Default retryable: `true`
 * (API rate limits and transient failures are retryable).
 *
 * @example
 * ```typescript
 * import { AIError } from '#core/errors/ai-error.js';
 *
 * throw new AIError({
 *   message: 'Token limit exceeded for GPT-4o',
 *   attempted: 'Generate test steps from intent',
 *   provider: 'azure-openai',
 *   model: 'gpt-4o',
 *   tokenUsage: { prompt: 12000, completion: 0, total: 12000 },
 * });
 * ```
 *
 * @module errors
 */

import { PramanError } from './base.js';
import type { AIErrorContext, PramanErrorOptions, SerializedPramanError } from './base.js';
import { ErrorCode } from './codes.js';

/** Token usage breakdown for AI operations. */
export interface TokenUsage {
  readonly prompt: number;
  readonly completion: number;
  readonly total: number;
}

/**
 * Options for constructing an AIError.
 */
export interface AIErrorOptions extends Omit<PramanErrorOptions, 'code' | 'retryable'> {
  readonly code?:
    | typeof ErrorCode.ERR_AI_PROVIDER_UNAVAILABLE
    | typeof ErrorCode.ERR_AI_RESPONSE_INVALID
    | typeof ErrorCode.ERR_AI_TOKEN_LIMIT
    | typeof ErrorCode.ERR_AI_RATE_LIMITED
    | typeof ErrorCode.ERR_AI_NOT_CONFIGURED
    | typeof ErrorCode.ERR_AI_LLM_CALL_FAILED
    | typeof ErrorCode.ERR_AI_RESPONSE_PARSE_FAILED
    | typeof ErrorCode.ERR_AI_CONTEXT_BUILD_FAILED
    | typeof ErrorCode.ERR_AI_STEP_INTERPRET_FAILED
    | typeof ErrorCode.ERR_AI_INVALID_REQUEST
    | typeof ErrorCode.ERR_AI_CAPABILITY_NOT_FOUND;
  readonly retryable?: boolean;
  readonly provider?: string;
  readonly model?: string;
  readonly tokenUsage?: TokenUsage;
}

/**
 * Error subclass for AI provider failures.
 *
 * @aiContext AI provider failure context enabling LLM self-healing
 *
 * @example
 * ```typescript
 * const error = new AIError({
 *   message: 'Provider unavailable',
 *   attempted: 'Generate test steps',
 *   provider: 'azure-openai',
 * });
 * ```
 */
export class AIError extends PramanError {
  readonly provider: string | undefined;
  readonly model: string | undefined;
  readonly tokenUsage: TokenUsage | undefined;

  /**
   * Creates a new AIError instance.
   *
   * @param options - AI error construction options including provider context.
   *
   * @example
   * ```typescript
   * import { AIError } from '#core/errors/ai-error.js';
   *
   * const error = new AIError({
   *   message: 'Token limit exceeded for GPT-4o',
   *   attempted: 'Generate test steps from intent',
   *   provider: 'azure-openai',
   *   model: 'gpt-4o',
   *   tokenUsage: { prompt: 12000, completion: 0, total: 12000 },
   * });
   * ```
   */
  constructor(options: AIErrorOptions) {
    super({
      ...options,
      code: options.code ?? ErrorCode.ERR_AI_PROVIDER_UNAVAILABLE,
      retryable: options.retryable ?? true,
    });

    this.name = 'AIError';
    this.provider = options.provider;
    this.model = options.model;
    this.tokenUsage = options.tokenUsage;

    Object.defineProperty(this, 'provider', { writable: false, configurable: false });
    Object.defineProperty(this, 'model', { writable: false, configurable: false });
    Object.defineProperty(this, 'tokenUsage', { writable: false, configurable: false });
  }

  /**
   * Serializes the error to a JSON-safe object with AI provider fields.
   *
   * @returns Base fields plus `provider`, `model`, and `tokenUsage`.
   *
   * @example
   * ```typescript
   * const json = error.toJSON();
   * // json.provider === 'azure-openai'
   * // json.model === 'gpt-4o'
   * // json.tokenUsage === { prompt: 12000, completion: 0, total: 12000 }
   * ```
   */
  override toJSON(): SerializedPramanError & {
    readonly provider: string | undefined;
    readonly model: string | undefined;
    readonly tokenUsage: TokenUsage | undefined;
  } {
    return {
      ...super.toJSON(),
      provider: this.provider,
      model: this.model,
      tokenUsage: this.tokenUsage,
    };
  }

  /**
   * Returns structured context for AI agents with provider diagnostics.
   *
   * @returns Base AI context plus `provider`, `model`, and `tokenUsage`
   * fields to enable LLM self-healing and retry decisions.
   *
   * @example
   * ```typescript
   * const context = error.toAIContext();
   * // context.provider, context.model, context.tokenUsage available
   * // Send to LLM for provider fallback or token budget adjustment
   * ```
   */
  override toAIContext(): AIErrorContext & {
    readonly provider: string | undefined;
    readonly model: string | undefined;
    readonly tokenUsage: TokenUsage | undefined;
  } {
    return {
      ...super.toAIContext(),
      provider: this.provider,
      model: this.model,
      tokenUsage: this.tokenUsage,
    };
  }
}
