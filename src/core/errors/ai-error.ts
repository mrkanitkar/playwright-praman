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
