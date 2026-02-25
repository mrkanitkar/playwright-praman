/**
 * LLM provider abstraction for AI-powered test operations.
 *
 * @remarks
 * Supports Azure OpenAI, OpenAI, and Anthropic Claude providers.
 * Provider selection is driven by `config.ai.provider`.
 * All responses are wrapped in {@link AiResponse} envelopes for consistent
 * agent consumption.
 *
 * Provider packages (`openai`, `\@anthropic-ai/sdk`) are loaded via dynamic
 * `import()` — they are optional dependencies and only resolved when the
 * corresponding provider is configured.
 *
 * @intent Provide LLM text generation with structured output validation
 * @capability ai-llm-service
 * @sapModule All
 *
 * @example
 * ```typescript
 * const llm = createLlmService(pramanConfig);
 * if (llm.isConfigured()) {
 *   const result = await llm.complete('Summarize this page', MySchema);
 *   if (result.status === 'success') {
 *     logger.info(result.data);
 *   }
 * }
 * ```
 *
 * @module ai
 */

import { z } from 'zod';

import type { CompletionResult } from '#ai/llm-providers.js';
import { callAnthropic, callAzureOpenAI, callOpenAI } from '#ai/llm-providers.js';
import { ChatMessageSchema } from '#ai/schemas/llm-request.schema.js';
import type { ChatMessage } from '#ai/schemas/llm-request.schema.js';
import { LlmCompletionSchema } from '#ai/schemas/llm-response.schema.js';
import type { AiResponse } from '#ai/types.js';
import type { PramanConfig } from '#core/config/schema.js';
import { AIError } from '#core/errors/ai-error.js';

// ── Public Interface ────────────────────────────────────────────────────────

/**
 * LLM provider service interface.
 *
 * @remarks
 * All methods return {@link AiResponse} envelopes — never throw on API errors.
 * Only `createLlmService()` throws (when the provider is not configured).
 *
 * @intent Uniform interface over Azure OpenAI, OpenAI, and Anthropic
 */
export interface LlmService {
  /**
   * Send a single prompt and receive a structured response.
   *
   * @remarks
   * Internally constructs a single user message and delegates to {@link chat}.
   *
   * @param prompt - Natural language instruction for the LLM
   * @param schema - Zod schema to validate the JSON response
   * @returns Validated response or error envelope
   */
  complete(prompt: string, schema: z.ZodType): Promise<AiResponse<unknown>>;

  /**
   * Send a multi-turn conversation and receive a structured response.
   *
   * @param messages - Ordered list of conversation turns
   * @param schema - Zod schema to validate the JSON response
   * @returns Validated response or error envelope
   */
  chat(messages: ChatMessage[], schema: z.ZodType): Promise<AiResponse<unknown>>;

  /**
   * Return whether the AI provider is configured.
   *
   * @remarks
   * Returns `false` gracefully when `config.ai` is undefined. Never throws.
   * Use this to degrade gracefully when AI is not available.
   */
  isConfigured(): boolean;

  /**
   * Close the LLM connection and release resources.
   *
   * @remarks
   * Called automatically in the `pramanAI` fixture teardown. Safe to call
   * multiple times — idempotent.
   */
  close(): Promise<void>;
}

// ── Factory ────────────────────────────────────────────────────────────────

/**
 * Create an {@link LlmService} from the Praman configuration.
 *
 * @remarks
 * Reads `config.ai.provider` to select the provider. Throws {@link AIError}
 * with `code: 'ERR_AI_NOT_CONFIGURED'` when `config.ai` is absent.
 *
 * Provider packages are loaded lazily on first call to `complete()` or
 * `chat()`. An `AIError` with `code: 'ERR_AI_NOT_CONFIGURED'` is also thrown
 * if the package is not installed.
 *
 * @param config - Validated Praman configuration (Readonly)
 * @throws {@link AIError} when `config.ai` is undefined
 *
 * @example
 * ```typescript
 * const llm = createLlmService(pramanConfig);
 * const result = await llm.complete('Generate test steps', StepsSchema);
 * ```
 */
export function createLlmService(config: Readonly<PramanConfig>): LlmService {
  if (config.ai === undefined) {
    throw new AIError({
      code: 'ERR_AI_NOT_CONFIGURED',
      message: 'AI provider is not configured in PramanConfig',
      attempted: 'Initialize LlmService',
      retryable: false,
      suggestions: [
        'Set config.ai.provider and config.ai.apiKey in your praman.config.ts',
        "For Azure OpenAI: set provider='azure-openai', endpoint, deployment, apiVersion",
        "For OpenAI: set provider='openai', apiKey",
        "For Anthropic: set provider='anthropic', anthropicApiKey",
      ],
    });
  }

  return new LlmServiceImpl(config);
}

// ── Implementation ─────────────────────────────────────────────────────────

class LlmServiceImpl implements LlmService {
  constructor(private readonly config: Readonly<PramanConfig>) {}

  isConfigured(): boolean {
    return this.config.ai !== undefined;
  }

  async close(): Promise<void> {
    // No-op — HTTP connections are stateless for OpenAI/Anthropic
    return Promise.resolve();
  }

  async complete(prompt: string, schema: z.ZodType): Promise<AiResponse<unknown>> {
    const messages: ChatMessage[] = [{ role: 'user', content: prompt }];
    return this.chat(messages, schema);
  }

  async chat(messages: ChatMessage[], schema: z.ZodType): Promise<AiResponse<unknown>> {
    if (this.config.ai === undefined) {
      throw new AIError({
        code: 'ERR_AI_NOT_CONFIGURED',
        message: 'AI provider is not configured',
        attempted: 'Call LlmService.chat()',
        retryable: false,
        suggestions: ['Set config.ai in your praman.config.ts'],
      });
    }

    // ── Input validation: validate chat messages against schema ──────────
    const messagesValidation = z.array(ChatMessageSchema).safeParse(messages);
    if (!messagesValidation.success) {
      throw new AIError({
        code: 'ERR_AI_INVALID_REQUEST',
        message: `Invalid chat messages: ${messagesValidation.error.message}`,
        attempted: 'Validate chat messages before sending to LLM provider',
        retryable: false,
        suggestions: [
          'Each message must have a role (system, user, or assistant) and non-empty content',
          'Verify the messages array is not empty',
        ],
      });
    }

    const startTime = Date.now();
    const aiConfig = this.config.ai;

    try {
      let completion: CompletionResult;

      switch (aiConfig.provider) {
        case 'azure-openai': {
          completion = await callAzureOpenAI(messages, aiConfig);
          break;
        }
        case 'openai': {
          completion = await callOpenAI(messages, aiConfig);
          break;
        }
        case 'anthropic': {
          completion = await callAnthropic(messages, aiConfig);
          break;
        }
        default: {
          const exhaustiveCheck: never = aiConfig.provider;
          throw new AIError({
            code: 'ERR_AI_NOT_CONFIGURED',
            message: `Unknown AI provider: ${String(exhaustiveCheck)}`,
            attempted: 'Select LLM provider',
            retryable: false,
            suggestions: ['Set config.ai.provider to azure-openai, openai, or anthropic'],
          });
        }
      }

      return parseAndValidate(completion, schema, Date.now() - startTime);
    } catch (error) {
      if (error instanceof AIError) throw error;

      const duration = Date.now() - startTime;
      const message = error instanceof Error ? error.message : 'Unknown LLM API error';

      return {
        status: 'error',
        data: undefined,
        error: { code: 'ERR_AI_LLM_CALL_FAILED', message },
        metadata: {
          duration,
          retryable: true,
          suggestions: [
            'Check your API key and endpoint configuration',
            'Verify network connectivity to the LLM provider',
            'Check provider quota and rate limits',
          ],
        },
      };
    }
  }
}

// ── Private helpers ────────────────────────────────────────────────────────

function parseAndValidate(
  completion: CompletionResult,
  schema: z.ZodType,
  duration: number,
): AiResponse<unknown> {
  // ── Pre-validation: verify raw completion structure from provider ────
  const completionValidation = LlmCompletionSchema.safeParse(completion);
  if (!completionValidation.success) {
    return {
      status: 'error',
      data: undefined,
      error: {
        code: 'ERR_AI_RESPONSE_PARSE_FAILED',
        message: `Malformed completion from LLM provider: ${completionValidation.error.message}`,
      },
      metadata: {
        duration,
        retryable: true,
        suggestions: [
          'The LLM provider returned an unexpected response structure',
          'Check provider SDK version compatibility',
          'Verify the API endpoint is returning valid completions',
        ],
        ...(completion.model !== undefined && { model: completion.model }),
        ...(completion.tokens !== undefined && { tokens: completion.tokens }),
      },
    };
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(completion.content);
  } catch {
    return {
      status: 'error',
      data: undefined,
      error: {
        code: 'ERR_AI_RESPONSE_PARSE_FAILED',
        message: `LLM response is not valid JSON: ${completion.content.slice(0, 100)}`,
      },
      metadata: {
        duration,
        retryable: true,
        suggestions: [
          'Ensure the LLM is instructed to respond with JSON only',
          'Add response_format: json_object to the request if supported',
          'Check if the model supports JSON mode',
        ],
        ...(completion.model !== undefined && { model: completion.model }),
        ...(completion.tokens !== undefined && { tokens: completion.tokens }),
      },
    };
  }

  const validation = schema.safeParse(parsed);
  if (!validation.success) {
    return {
      status: 'error',
      data: undefined,
      error: {
        code: 'ERR_AI_RESPONSE_PARSE_FAILED',
        message: `Response validation failed: ${validation.error.message}`,
      },
      metadata: {
        duration,
        retryable: true,
        suggestions: [
          'Verify the Zod schema matches the expected LLM output format',
          'Add more specific instructions to the prompt about output structure',
        ],
        ...(completion.model !== undefined && { model: completion.model }),
        ...(completion.tokens !== undefined && { tokens: completion.tokens }),
      },
    };
  }

  return {
    status: 'success',
    data: validation.data,
    metadata: {
      duration,
      retryable: false,
      suggestions: [],
      ...(completion.model !== undefined && { model: completion.model }),
      ...(completion.tokens !== undefined && { tokens: completion.tokens }),
    },
  };
}
