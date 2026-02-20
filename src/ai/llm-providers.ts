/**
 * LLM provider call implementations for Azure OpenAI, OpenAI, and Anthropic.
 *
 * @remarks
 * This module is internal to the AI layer. All functions perform a single
 * provider API call and return a {@link CompletionResult}. Dynamic imports
 * are used so provider SDK packages remain optional dependencies.
 *
 * @module ai
 */

import type { ChatMessage } from '#ai/schemas/llm-request.schema.js';
import type { PramanConfig } from '#core/config/schema.js';
import { AIError } from '#core/errors/ai-error.js';

// ── Shared types ───────────────────────────────────────────────────────────

/**
 * Normalised completion result returned by all provider call functions.
 *
 * @intent Provide a provider-agnostic result container.
 */
export interface CompletionResult {
  readonly content: string;
  readonly model?: string;
  readonly tokens?: number;
}

// ── Anthropic local types (avoids requiring the SDK at typecheck time) ─────

interface AnthropicClient {
  messages: {
    create(params: Record<string, unknown>): Promise<unknown>;
  };
}

interface AnthropicSdkModule {
  default: new (opts: { apiKey: string | undefined }) => AnthropicClient;
}

interface AnthropicTextBlock {
  readonly type: 'text';
  readonly text: string;
}

interface AnthropicContentBlock {
  readonly type: string;
}

interface AnthropicResponse {
  readonly content: readonly (AnthropicTextBlock | AnthropicContentBlock)[];
  readonly model: string;
  readonly usage: {
    readonly input_tokens: number;
    readonly output_tokens: number;
  };
}

// ── Provider call functions ────────────────────────────────────────────────

/**
 * Call Azure OpenAI via the `openai` SDK.
 *
 * @param messages - Conversation turns to send
 * @param aiConfig - Validated AI configuration block
 * @returns Normalised completion result
 * @throws {@link AIError} when the `openai` package is missing
 */
export async function callAzureOpenAI(
  messages: ChatMessage[],
  aiConfig: NonNullable<PramanConfig['ai']>,
): Promise<CompletionResult> {
  const { AzureOpenAI } = await import('openai').catch(() => {
    throw new AIError({
      code: 'ERR_AI_NOT_CONFIGURED',
      message: 'openai package is not installed. Add it to optionalDependencies.',
      attempted: 'Load openai package for Azure OpenAI provider',
      retryable: false,
      suggestions: ['Run: npm install openai'],
    });
  });

  const client = new AzureOpenAI({
    endpoint: aiConfig.endpoint,
    apiKey: aiConfig.apiKey,
    apiVersion: aiConfig.apiVersion,
    deployment: aiConfig.deployment,
  });

  const response = await client.chat.completions.create({
    model: aiConfig.model ?? aiConfig.deployment ?? 'gpt-4o',
    messages: messages.map((m) => ({ role: m.role, content: m.content })),
    temperature: aiConfig.temperature,
    ...(aiConfig.maxTokens !== undefined && { max_tokens: aiConfig.maxTokens }),
    response_format: { type: 'json_object' },
  });

  // openai SDK: choices[0] is guaranteed present; message.content may be null
  const content = response.choices[0]?.message.content ?? '';
  const tokens = response.usage?.total_tokens;

  return {
    content,
    model: response.model,
    ...(tokens !== undefined && { tokens }),
  };
}

/**
 * Call OpenAI via the `openai` SDK.
 *
 * @param messages - Conversation turns to send
 * @param aiConfig - Validated AI configuration block
 * @returns Normalised completion result
 * @throws {@link AIError} when the `openai` package is missing
 */
export async function callOpenAI(
  messages: ChatMessage[],
  aiConfig: NonNullable<PramanConfig['ai']>,
): Promise<CompletionResult> {
  const { OpenAI } = await import('openai').catch(() => {
    throw new AIError({
      code: 'ERR_AI_NOT_CONFIGURED',
      message: 'openai package is not installed. Add it to optionalDependencies.',
      attempted: 'Load openai package for OpenAI provider',
      retryable: false,
      suggestions: ['Run: npm install openai'],
    });
  });

  const client = new OpenAI({ apiKey: aiConfig.apiKey });

  const response = await client.chat.completions.create({
    model: aiConfig.model ?? 'gpt-4o',
    messages: messages.map((m) => ({ role: m.role, content: m.content })),
    temperature: aiConfig.temperature,
    ...(aiConfig.maxTokens !== undefined && { max_tokens: aiConfig.maxTokens }),
    response_format: { type: 'json_object' },
  });

  // openai SDK: choices[0] is guaranteed present; message.content may be null
  const content = response.choices[0]?.message.content ?? '';
  const tokens = response.usage?.total_tokens;

  return {
    content,
    model: response.model,
    ...(tokens !== undefined && { tokens }),
  };
}

/**
 * Call Anthropic Claude via the `\@anthropic-ai/sdk` SDK.
 *
 * @remarks
 * The SDK is loaded via dynamic `import()` so it remains optional.
 * System messages are extracted from the conversation and sent separately
 * via Anthropic's `system` parameter.
 *
 * @param messages - Conversation turns to send
 * @param aiConfig - Validated AI configuration block
 * @returns Normalised completion result
 * @throws {@link AIError} when the `\@anthropic-ai/sdk` package is missing
 */
export async function callAnthropic(
  messages: ChatMessage[],
  aiConfig: NonNullable<PramanConfig['ai']>,
): Promise<CompletionResult> {
  // Dynamic import — @anthropic-ai/sdk is optional and may not be installed.
  const { default: AnthropicClass } = (await import('@anthropic-ai/sdk').catch(() => {
    throw new AIError({
      code: 'ERR_AI_NOT_CONFIGURED',
      message: '@anthropic-ai/sdk package is not installed. Add it to optionalDependencies.',
      attempted: 'Load @anthropic-ai/sdk package for Anthropic provider',
      retryable: false,
      suggestions: ['Run: npm install @anthropic-ai/sdk'],
    });
  })) as AnthropicSdkModule;

  const client: AnthropicClient = new AnthropicClass({
    apiKey: aiConfig.anthropicApiKey,
  });

  const systemMsg = messages.find((m) => m.role === 'system')?.content;
  const conversationMessages = messages
    .filter((m) => m.role !== 'system')
    .map((m) => ({
      role: m.role as 'user' | 'assistant',
      content: m.content,
    }));

  const response = (await client.messages.create({
    model: aiConfig.model ?? 'claude-opus-4-6',
    max_tokens: aiConfig.maxTokens ?? 4096,
    temperature: aiConfig.temperature,
    messages: conversationMessages,
    ...(systemMsg !== undefined && { system: systemMsg }),
  })) as AnthropicResponse;

  const firstBlock = response.content[0];
  const content = firstBlock?.type === 'text' ? (firstBlock as AnthropicTextBlock).text : '';

  return {
    content,
    model: response.model,
    tokens: response.usage.input_tokens + response.usage.output_tokens,
  };
}
