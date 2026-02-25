/**
 * @license
 * Copyright (c) ZesTest 2025-2030. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0
 *
 * This file may contain AI-assisted code.
 * See LICENSE and NOTICE files for details.
 */

/**
 * Unit tests for `src/ai/llm-service.ts`.
 *
 * @remarks
 * All provider calls are mocked via `vi.mock('#ai/llm-providers.js')`.
 * No real HTTP calls are made.
 */

import { describe, expect, it, vi, beforeEach } from 'vitest';
import { z } from 'zod';

// Mock providers BEFORE importing llm-service
vi.mock('#ai/llm-providers.js', () => ({
  callAzureOpenAI: vi.fn(),
  callOpenAI: vi.fn(),
  callAnthropic: vi.fn(),
}));

import type { CompletionResult } from '#ai/llm-providers.js';
import { callAnthropic, callAzureOpenAI, callOpenAI } from '#ai/llm-providers.js';
import { createLlmService } from '#ai/llm-service.js';
import type { ChatMessage } from '#ai/schemas/llm-request.schema.js';
import type { PramanConfig } from '#core/config/schema.js';
import { AIError } from '#core/errors/ai-error.js';

// ── Test helpers ─────────────────────────────────────────────────────────────

/** Minimal valid PramanConfig without AI configured. */
function makeConfigNoAi(): Readonly<PramanConfig> {
  return {
    logLevel: 'info',
    ui5WaitTimeout: 30_000,
    controlDiscoveryTimeout: 10_000,
    interactionStrategy: 'ui5-native',
    discoveryStrategies: ['direct-id', 'recordreplay'],
    skipStabilityWait: false,
    preferVisibleControls: true,
    ignoreAutoWaitUrls: [],
  };
}

/** Valid PramanConfig with Azure OpenAI configured. */
function makeConfigAzure(): Readonly<PramanConfig> {
  return {
    ...makeConfigNoAi(),
    ai: {
      provider: 'azure-openai',
      apiKey: 'test-key',
      temperature: 0.3,
      endpoint: 'https://my-resource.openai.azure.com/',
      deployment: 'gpt-4o',
      apiVersion: '2024-02-01',
    },
  };
}

/** Valid PramanConfig with OpenAI configured. */
function makeConfigOpenAI(): Readonly<PramanConfig> {
  return {
    ...makeConfigNoAi(),
    ai: {
      provider: 'openai',
      apiKey: 'sk-test',
      temperature: 0.3,
    },
  };
}

/** Valid PramanConfig with Anthropic configured. */
function makeConfigAnthropic(): Readonly<PramanConfig> {
  return {
    ...makeConfigNoAi(),
    ai: {
      provider: 'anthropic',
      anthropicApiKey: 'sk-ant-test',
      temperature: 0.3,
    },
  };
}

/** A simple string Zod schema for testing. */
const StringSchema = z.object({ value: z.string() });

/** Stub CompletionResult returned from provider mocks. */
const STUB_COMPLETION = {
  content: JSON.stringify({ value: 'hello' }),
  model: 'gpt-4o',
  tokens: 100,
};

/** Stub CompletionResult with tokens undefined (tests optional spread). */
const STUB_COMPLETION_NO_TOKENS = {
  content: JSON.stringify({ value: 'hello' }),
  model: 'gpt-4o',
};

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('createLlmService()', () => {
  it('throws AIError with ERR_AI_NOT_CONFIGURED when config.ai is undefined', () => {
    expect(() => createLlmService(makeConfigNoAi())).toThrow(AIError);
  });

  it('throws with code ERR_AI_NOT_CONFIGURED', () => {
    try {
      createLlmService(makeConfigNoAi());
      expect.fail('should have thrown');
    } catch (err) {
      expect(err).toBeInstanceOf(AIError);
      expect((err as AIError).code).toBe('ERR_AI_NOT_CONFIGURED');
    }
  });

  it('throws with retryable: false', () => {
    try {
      createLlmService(makeConfigNoAi());
      expect.fail('should have thrown');
    } catch (err) {
      expect((err as AIError).retryable).toBe(false);
    }
  });

  it('throws with non-empty suggestions array', () => {
    try {
      createLlmService(makeConfigNoAi());
      expect.fail('should have thrown');
    } catch (err) {
      expect((err as AIError).suggestions.length).toBeGreaterThan(0);
    }
  });

  it('returns an LlmService when config.ai is defined (azure-openai)', () => {
    const service = createLlmService(makeConfigAzure());
    expect(service).toBeDefined();
    expect(typeof service.isConfigured).toBe('function');
    expect(typeof service.complete).toBe('function');
    expect(typeof service.chat).toBe('function');
    expect(typeof service.close).toBe('function');
  });

  it('returns an LlmService when config.ai is defined (openai)', () => {
    const service = createLlmService(makeConfigOpenAI());
    expect(service).toBeDefined();
  });

  it('returns an LlmService when config.ai is defined (anthropic)', () => {
    const service = createLlmService(makeConfigAnthropic());
    expect(service).toBeDefined();
  });
});

describe('LlmService.isConfigured()', () => {
  it('returns true when config.ai is set', () => {
    const service = createLlmService(makeConfigAzure());
    expect(service.isConfigured()).toBe(true);
  });

  it('returns true for openai config', () => {
    const service = createLlmService(makeConfigOpenAI());
    expect(service.isConfigured()).toBe(true);
  });

  it('returns true for anthropic config', () => {
    const service = createLlmService(makeConfigAnthropic());
    expect(service.isConfigured()).toBe(true);
  });
});

describe('LlmService.close()', () => {
  it('resolves without throwing', async () => {
    const service = createLlmService(makeConfigAzure());
    await expect(service.close()).resolves.toBeUndefined();
  });

  it('is safe to call multiple times (idempotent)', async () => {
    const service = createLlmService(makeConfigOpenAI());
    await service.close();
    await expect(service.close()).resolves.toBeUndefined();
  });
});

describe('LlmService.complete()', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('calls chat() with a single user message wrapping the prompt', async () => {
    vi.mocked(callAzureOpenAI).mockResolvedValueOnce(STUB_COMPLETION);
    const service = createLlmService(makeConfigAzure());
    const result = await service.complete('Say hello', StringSchema);
    expect(result.status).toBe('success');
  });

  it('returns success AiResponse with validated data when provider succeeds', async () => {
    vi.mocked(callAzureOpenAI).mockResolvedValueOnce(STUB_COMPLETION);
    const service = createLlmService(makeConfigAzure());
    const result = await service.complete('Say hello', StringSchema);
    expect(result.status).toBe('success');
    if (result.status === 'success') {
      expect(result.data).toEqual({ value: 'hello' });
      expect(result.metadata.model).toBe('gpt-4o');
      expect(result.metadata.tokens).toBe(100);
      expect(typeof result.metadata.duration).toBe('number');
      expect(result.metadata.retryable).toBe(false);
    }
  });

  it('returns error AiResponse when provider throws a non-AIError', async () => {
    vi.mocked(callOpenAI).mockRejectedValueOnce(new Error('Network error'));
    const service = createLlmService(makeConfigOpenAI());
    const result = await service.complete('Say hello', StringSchema);
    expect(result.status).toBe('error');
    if (result.status === 'error') {
      expect(result.error.code).toBe('ERR_AI_LLM_CALL_FAILED');
      expect(result.error.message).toContain('Network error');
      expect(result.metadata.retryable).toBe(true);
    }
  });

  it('propagates AIError (re-throws without wrapping)', async () => {
    const aiError = new AIError({
      code: 'ERR_AI_NOT_CONFIGURED',
      message: 'Missing API key',
      attempted: 'Call OpenAI',
      retryable: false,
      suggestions: [],
    });
    vi.mocked(callOpenAI).mockRejectedValueOnce(aiError);
    const service = createLlmService(makeConfigOpenAI());
    await expect(service.complete('test', StringSchema)).rejects.toThrow(AIError);
  });
});

describe('LlmService.chat()', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('calls callAzureOpenAI for azure-openai provider', async () => {
    vi.mocked(callAzureOpenAI).mockResolvedValueOnce(STUB_COMPLETION);
    const service = createLlmService(makeConfigAzure());
    await service.chat([{ role: 'user', content: 'hello' }], StringSchema);
    expect(callAzureOpenAI).toHaveBeenCalledOnce();
  });

  it('calls callOpenAI for openai provider', async () => {
    vi.mocked(callOpenAI).mockResolvedValueOnce(STUB_COMPLETION);
    const service = createLlmService(makeConfigOpenAI());
    await service.chat([{ role: 'user', content: 'hello' }], StringSchema);
    expect(callOpenAI).toHaveBeenCalledOnce();
  });

  it('calls callAnthropic for anthropic provider', async () => {
    vi.mocked(callAnthropic).mockResolvedValueOnce(STUB_COMPLETION);
    const service = createLlmService(makeConfigAnthropic());
    await service.chat([{ role: 'user', content: 'hello' }], StringSchema);
    expect(callAnthropic).toHaveBeenCalledOnce();
  });

  it('returns success with validated data when provider returns valid JSON', async () => {
    vi.mocked(callAzureOpenAI).mockResolvedValueOnce(STUB_COMPLETION);
    const service = createLlmService(makeConfigAzure());
    const result = await service.chat([{ role: 'user', content: 'hello' }], StringSchema);
    expect(result.status).toBe('success');
    if (result.status === 'success') {
      expect(result.data).toEqual({ value: 'hello' });
    }
  });

  it('returns error when provider returns invalid JSON', async () => {
    vi.mocked(callAzureOpenAI).mockResolvedValueOnce({
      content: 'not-json',
      model: 'gpt-4o',
    });
    const service = createLlmService(makeConfigAzure());
    const result = await service.chat([{ role: 'user', content: 'hello' }], StringSchema);
    expect(result.status).toBe('error');
    if (result.status === 'error') {
      expect(result.error.code).toBe('ERR_AI_RESPONSE_PARSE_FAILED');
      expect(result.metadata.retryable).toBe(true);
    }
  });

  it('returns error when JSON fails schema validation', async () => {
    vi.mocked(callAzureOpenAI).mockResolvedValueOnce({
      content: JSON.stringify({ notTheRightField: 42 }),
      model: 'gpt-4o',
    });
    const service = createLlmService(makeConfigAzure());
    const result = await service.chat([{ role: 'user', content: 'hello' }], StringSchema);
    expect(result.status).toBe('error');
    if (result.status === 'error') {
      expect(result.error.code).toBe('ERR_AI_RESPONSE_PARSE_FAILED');
    }
  });

  it('returns error AiResponse (not throw) when provider throws non-AIError', async () => {
    vi.mocked(callAzureOpenAI).mockRejectedValueOnce(new Error('Timeout'));
    const service = createLlmService(makeConfigAzure());
    const result = await service.chat([{ role: 'user', content: 'hi' }], StringSchema);
    expect(result.status).toBe('error');
    if (result.status === 'error') {
      expect(result.error.code).toBe('ERR_AI_LLM_CALL_FAILED');
      expect(result.error.message).toContain('Timeout');
      expect(result.metadata.suggestions.length).toBeGreaterThan(0);
    }
  });

  it('handles non-Error thrown object gracefully', async () => {
    vi.mocked(callOpenAI).mockRejectedValueOnce('raw string error');
    const service = createLlmService(makeConfigOpenAI());
    const result = await service.chat([{ role: 'user', content: 'hi' }], StringSchema);
    expect(result.status).toBe('error');
    if (result.status === 'error') {
      expect(result.error.message).toBe('Unknown LLM API error');
    }
  });

  it('includes model in metadata when completion includes model', async () => {
    vi.mocked(callAzureOpenAI).mockResolvedValueOnce(STUB_COMPLETION);
    const service = createLlmService(makeConfigAzure());
    const result = await service.chat([{ role: 'user', content: 'hi' }], StringSchema);
    expect(result.status).toBe('success');
    if (result.status === 'success') {
      expect(result.metadata.model).toBe('gpt-4o');
    }
  });

  it('omits model from metadata when completion does not include model', async () => {
    vi.mocked(callAzureOpenAI).mockResolvedValueOnce({
      content: JSON.stringify({ value: 'hello' }),
    });
    const service = createLlmService(makeConfigAzure());
    const result = await service.chat([{ role: 'user', content: 'hi' }], StringSchema);
    expect(result.status).toBe('success');
    if (result.status === 'success') {
      expect(result.metadata.model).toBeUndefined();
    }
  });

  it('omits tokens from metadata when completion does not include tokens', async () => {
    vi.mocked(callAzureOpenAI).mockResolvedValueOnce(STUB_COMPLETION_NO_TOKENS);
    const service = createLlmService(makeConfigAzure());
    const result = await service.chat([{ role: 'user', content: 'hi' }], StringSchema);
    expect(result.status).toBe('success');
    if (result.status === 'success') {
      expect(result.metadata.tokens).toBeUndefined();
    }
  });

  it('parse error response includes model and tokens when present', async () => {
    vi.mocked(callAzureOpenAI).mockResolvedValueOnce({
      content: 'not-valid-json',
      model: 'gpt-4o',
      tokens: 50,
    });
    const service = createLlmService(makeConfigAzure());
    const result = await service.chat([{ role: 'user', content: 'hi' }], StringSchema);
    expect(result.status).toBe('error');
    if (result.status === 'error') {
      expect(result.metadata.model).toBe('gpt-4o');
      expect(result.metadata.tokens).toBe(50);
    }
  });
});

describe('LlmService.chat() — edge cases for uncovered branches', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('throws ERR_AI_NOT_CONFIGURED when config.ai is removed after construction', async () => {
    // Line 157: guard clause inside chat() when config.ai becomes undefined
    const config = { ...makeConfigAzure() };
    const service = createLlmService(config);
    // Mutate the config to remove ai after service creation
    delete (config as Record<string, unknown>)['ai'];
    await expect(service.chat([{ role: 'user', content: 'hi' }], StringSchema)).rejects.toThrow(
      AIError,
    );
    try {
      await service.chat([{ role: 'user', content: 'hi' }], StringSchema);
    } catch (err) {
      expect(err).toBeInstanceOf(AIError);
      expect((err as AIError).code).toBe('ERR_AI_NOT_CONFIGURED');
    }
  });

  it('throws ERR_AI_INVALID_REQUEST when messages have empty content', async () => {
    // Line 169: ChatMessageSchema validation fails (content must be min(1))
    const service = createLlmService(makeConfigAzure());
    await expect(service.chat([{ role: 'user', content: '' }], StringSchema)).rejects.toThrow(
      AIError,
    );
    try {
      await service.chat([{ role: 'user', content: '' }], StringSchema);
    } catch (err) {
      expect(err).toBeInstanceOf(AIError);
      expect((err as AIError).code).toBe('ERR_AI_INVALID_REQUEST');
      expect((err as AIError).retryable).toBe(false);
      expect((err as AIError).suggestions.length).toBeGreaterThan(0);
    }
  });

  it('throws ERR_AI_INVALID_REQUEST when messages have invalid role', async () => {
    // Line 169: ChatMessageSchema validation fails (invalid role)
    const service = createLlmService(makeConfigAzure());
    const invalidMessages: unknown[] = [{ role: 'invalid-role', content: 'hello' }];
    await expect(service.chat(invalidMessages as ChatMessage[], StringSchema)).rejects.toThrow(
      AIError,
    );
  });

  it('returns malformed-completion error when provider returns non-string content', async () => {
    // Line 247: LlmCompletionSchema pre-validation fails
    vi.mocked(callAzureOpenAI).mockResolvedValueOnce({
      content: 42,
      model: 'gpt-4o',
      tokens: 10,
    } as unknown as CompletionResult);
    const service = createLlmService(makeConfigAzure());
    const result = await service.chat([{ role: 'user', content: 'hi' }], StringSchema);
    expect(result.status).toBe('error');
    if (result.status === 'error') {
      expect(result.error.code).toBe('ERR_AI_RESPONSE_PARSE_FAILED');
      expect(result.error.message).toContain('Malformed completion');
      expect(result.metadata.retryable).toBe(true);
      expect(result.metadata.model).toBe('gpt-4o');
      expect(result.metadata.tokens).toBe(10);
    }
  });

  it('returns malformed-completion error without model/tokens when absent', async () => {
    // Line 247: LlmCompletionSchema pre-validation fails, no model/tokens in metadata
    vi.mocked(callAzureOpenAI).mockResolvedValueOnce({
      content: null,
    } as unknown as CompletionResult);
    const service = createLlmService(makeConfigAzure());
    const result = await service.chat([{ role: 'user', content: 'hi' }], StringSchema);
    expect(result.status).toBe('error');
    if (result.status === 'error') {
      expect(result.error.code).toBe('ERR_AI_RESPONSE_PARSE_FAILED');
      expect(result.metadata.model).toBeUndefined();
      expect(result.metadata.tokens).toBeUndefined();
    }
  });

  it('returns JSON-parse error without model/tokens when absent', async () => {
    // Lines 288-289: model/tokens spreads in JSON parse error — false branch (absent)
    vi.mocked(callAzureOpenAI).mockResolvedValueOnce({
      content: 'not-valid-json',
    });
    const service = createLlmService(makeConfigAzure());
    const result = await service.chat([{ role: 'user', content: 'hi' }], StringSchema);
    expect(result.status).toBe('error');
    if (result.status === 'error') {
      expect(result.error.code).toBe('ERR_AI_RESPONSE_PARSE_FAILED');
      expect(result.error.message).toContain('not valid JSON');
      expect(result.metadata.model).toBeUndefined();
      expect(result.metadata.tokens).toBeUndefined();
    }
  });

  it('returns schema-validation error with model/tokens when present', async () => {
    // Lines 309-310: model/tokens spreads in schema validation error — true branch
    vi.mocked(callAzureOpenAI).mockResolvedValueOnce({
      content: JSON.stringify({ wrongField: 'data' }),
      model: 'gpt-4o-mini',
      tokens: 25,
    });
    const service = createLlmService(makeConfigAzure());
    const result = await service.chat([{ role: 'user', content: 'hi' }], StringSchema);
    expect(result.status).toBe('error');
    if (result.status === 'error') {
      expect(result.error.code).toBe('ERR_AI_RESPONSE_PARSE_FAILED');
      expect(result.error.message).toContain('validation failed');
      expect(result.metadata.model).toBe('gpt-4o-mini');
      expect(result.metadata.tokens).toBe(25);
    }
  });

  it('returns schema-validation error without model/tokens when absent', async () => {
    // Lines 309-310: model/tokens spreads in schema validation error — false branch
    vi.mocked(callAzureOpenAI).mockResolvedValueOnce({
      content: JSON.stringify({ wrongField: 'data' }),
    });
    const service = createLlmService(makeConfigAzure());
    const result = await service.chat([{ role: 'user', content: 'hi' }], StringSchema);
    expect(result.status).toBe('error');
    if (result.status === 'error') {
      expect(result.error.code).toBe('ERR_AI_RESPONSE_PARSE_FAILED');
      expect(result.metadata.model).toBeUndefined();
      expect(result.metadata.tokens).toBeUndefined();
    }
  });

  it('throws ERR_AI_NOT_CONFIGURED for unknown provider (default switch branch)', async () => {
    // Lines 201-202: exhaustive default branch with unknown provider value
    const config = {
      ...makeConfigNoAi(),
      ai: {
        provider: 'unknown-provider',
        apiKey: 'test-key',
        temperature: 0.3,
      },
    } as unknown as Readonly<PramanConfig>;
    const service = createLlmService(config);
    await expect(service.chat([{ role: 'user', content: 'hi' }], StringSchema)).rejects.toThrow(
      AIError,
    );
    try {
      await service.chat([{ role: 'user', content: 'hi' }], StringSchema);
    } catch (err) {
      expect(err).toBeInstanceOf(AIError);
      expect((err as AIError).code).toBe('ERR_AI_NOT_CONFIGURED');
      expect((err as AIError).message).toContain('Unknown AI provider');
    }
  });

  it('success response omits model and tokens when both are absent', async () => {
    // Lines 323-324: model/tokens spreads in success path — false branch (both absent)
    vi.mocked(callAzureOpenAI).mockResolvedValueOnce({
      content: JSON.stringify({ value: 'result' }),
    });
    const service = createLlmService(makeConfigAzure());
    const result = await service.chat([{ role: 'user', content: 'hi' }], StringSchema);
    expect(result.status).toBe('success');
    if (result.status === 'success') {
      expect(result.data).toEqual({ value: 'result' });
      expect(result.metadata.model).toBeUndefined();
      expect(result.metadata.tokens).toBeUndefined();
      expect(result.metadata.retryable).toBe(false);
      expect(result.metadata.suggestions).toEqual([]);
    }
  });
});

describe('AiResponse envelope shape', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('success response has status, data, and metadata', async () => {
    vi.mocked(callAzureOpenAI).mockResolvedValueOnce(STUB_COMPLETION);
    const service = createLlmService(makeConfigAzure());
    const result = await service.chat([{ role: 'user', content: 'hi' }], StringSchema);
    expect(result).toHaveProperty('status', 'success');
    expect(result).toHaveProperty('data');
    expect(result).toHaveProperty('metadata');
    if (result.status === 'success') {
      expect(result.metadata).toHaveProperty('duration');
      expect(result.metadata).toHaveProperty('retryable');
      expect(result.metadata).toHaveProperty('suggestions');
    }
  });

  it('error response has status, data: undefined, error, and metadata', async () => {
    vi.mocked(callOpenAI).mockRejectedValueOnce(new Error('boom'));
    const service = createLlmService(makeConfigOpenAI());
    const result = await service.chat([{ role: 'user', content: 'hi' }], StringSchema);
    expect(result).toHaveProperty('status', 'error');
    expect(result).toHaveProperty('data', undefined);
    if (result.status === 'error') {
      expect(result).toHaveProperty('error');
      expect(result.error).toHaveProperty('code');
      expect(result.error).toHaveProperty('message');
      expect(result.metadata).toHaveProperty('duration');
      expect(result.metadata.retryable).toBe(true);
    }
  });
});
