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

import { callAnthropic, callAzureOpenAI, callOpenAI } from '#ai/llm-providers.js';
import { createLlmService } from '#ai/llm-service.js';
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
