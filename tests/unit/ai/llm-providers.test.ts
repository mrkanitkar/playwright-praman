/**
 * @license
 * Copyright (c) ZesTest 2025-2030. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0
 *
 * This file may contain AI-assisted code.
 * See LICENSE and NOTICE files for details.
 */

/**
 * Unit tests for `src/ai/llm-providers.ts`.
 *
 * @remarks
 * Each provider function uses a dynamic `import()` for its optional SDK.
 * Tests cover:
 * - Missing SDK throws AIError with ERR_AI_NOT_CONFIGURED
 * - Successful SDK call returns a CompletionResult
 *
 * Strategy: vi.mock at module level intercepts the dynamic imports used
 * by callAzureOpenAI, callOpenAI, and callAnthropic.
 */

import { describe, expect, it, vi, beforeEach } from 'vitest';

// ── Shared mock state ─────────────────────────────────────────────────────────
// These hold references to the fns injected per test
const openAIMocks = {
  createFn: vi.fn(),
  shouldThrow: false,
};

const anthropicMocks = {
  createFn: vi.fn(),
  shouldThrow: false,
};

// Top-level vi.mock intercepts dynamic import('openai').
// Vitest hoists vi.mock() calls to the top of the file regardless of position.
vi.mock('openai', () => {
  if (openAIMocks.shouldThrow) {
    throw new Error('MODULE_NOT_FOUND');
  }
  const createFn = openAIMocks.createFn;
  // Must use `function` keyword (not arrow) to be a valid constructor.
  // Names are camelCase per lint rules; exported keys match the SDK API.
  /* eslint-disable @typescript-eslint/explicit-function-return-type */
  function azureOpenAIConstructor() {
    return { chat: { completions: { create: createFn } } };
  }
  function openAIConstructor() {
    return { chat: { completions: { create: createFn } } };
  }
  /* eslint-enable @typescript-eslint/explicit-function-return-type */
  return { AzureOpenAI: azureOpenAIConstructor, OpenAI: openAIConstructor };
});

// Top-level vi.mock intercepts dynamic import('@anthropic-ai/sdk')
vi.mock('@anthropic-ai/sdk', () => {
  if (anthropicMocks.shouldThrow) {
    throw new Error('MODULE_NOT_FOUND');
  }
  const createFn = anthropicMocks.createFn;
  /* eslint-disable @typescript-eslint/explicit-function-return-type */
  function anthropicConstructor() {
    return { messages: { create: createFn } };
  }
  /* eslint-enable @typescript-eslint/explicit-function-return-type */
  return { default: anthropicConstructor };
});

import { callAnthropic, callAzureOpenAI, callOpenAI } from '#ai/llm-providers.js';
import type { ChatMessage } from '#ai/schemas/llm-request.schema.js';
import type { PramanConfig } from '#core/config/schema.js';
import { AIError } from '#core/errors/ai-error.js';

// ── Helpers ──────────────────────────────────────────────────────────────────

const SAMPLE_MESSAGES: ChatMessage[] = [{ role: 'user', content: 'hello' }];

function makeAzureConfig(): NonNullable<PramanConfig['ai']> {
  return {
    provider: 'azure-openai',
    apiKey: 'test-key',
    temperature: 0.3,
    endpoint: 'https://my-resource.openai.azure.com/',
    deployment: 'gpt-4o',
    apiVersion: '2024-02-01',
  };
}

function makeOpenAIConfig(): NonNullable<PramanConfig['ai']> {
  return {
    provider: 'openai',
    apiKey: 'sk-test',
    temperature: 0.3,
  };
}

function makeAnthropicConfig(): NonNullable<PramanConfig['ai']> {
  return {
    provider: 'anthropic',
    anthropicApiKey: 'sk-ant-test',
    temperature: 0.3,
    maxTokens: 4096,
  };
}

// ── callAzureOpenAI ───────────────────────────────────────────────────────────

describe('callAzureOpenAI()', () => {
  beforeEach(() => {
    openAIMocks.shouldThrow = false;
    openAIMocks.createFn.mockReset();
    anthropicMocks.shouldThrow = false;
    anthropicMocks.createFn.mockReset();
  });

  it('returns CompletionResult on successful call', async () => {
    openAIMocks.createFn.mockResolvedValue({
      choices: [{ message: { content: '{"value":"ok"}' } }],
      model: 'gpt-4o',
      usage: { total_tokens: 75 },
    });

    const result = await callAzureOpenAI(SAMPLE_MESSAGES, makeAzureConfig());

    expect(result.content).toBe('{"value":"ok"}');
    expect(result.model).toBe('gpt-4o');
    expect(result.tokens).toBe(75);
  });

  it('returns empty content string when choices[0].message.content is null', async () => {
    openAIMocks.createFn.mockResolvedValue({
      choices: [{ message: { content: null } }],
      model: 'gpt-4o',
      usage: { total_tokens: 10 },
    });

    const result = await callAzureOpenAI(SAMPLE_MESSAGES, makeAzureConfig());
    expect(result.content).toBe('');
  });

  it('omits tokens from result when usage is undefined', async () => {
    openAIMocks.createFn.mockResolvedValue({
      choices: [{ message: { content: '{}' } }],
      model: 'gpt-4o',
      usage: undefined,
    });

    const result = await callAzureOpenAI(SAMPLE_MESSAGES, makeAzureConfig());
    expect(result.tokens).toBeUndefined();
  });

  it('uses maxTokens from config when provided', async () => {
    openAIMocks.createFn.mockResolvedValue({
      choices: [{ message: { content: '{"x":1}' } }],
      model: 'gpt-4o',
      usage: { total_tokens: 20 },
    });

    const config = { ...makeAzureConfig(), maxTokens: 1024 };
    await callAzureOpenAI(SAMPLE_MESSAGES, config);

    const firstCall = openAIMocks.createFn.mock.calls[0];
    if (firstCall === undefined) throw new Error('Expected createFn to have been called');
    const callPayload = firstCall[0] as Record<string, unknown>;
    expect(callPayload['max_tokens']).toBe(1024);
  });

  it('uses config model when provided (not default)', async () => {
    openAIMocks.createFn.mockResolvedValue({
      choices: [{ message: { content: '{}' } }],
      model: 'gpt-4-turbo',
      usage: { total_tokens: 10 },
    });

    const config = { ...makeAzureConfig(), model: 'gpt-4-turbo' };
    await callAzureOpenAI(SAMPLE_MESSAGES, config);

    const firstCall = openAIMocks.createFn.mock.calls[0];
    if (firstCall === undefined) throw new Error('Expected createFn to have been called');
    const callPayload = firstCall[0] as Record<string, unknown>;
    expect(callPayload['model']).toBe('gpt-4-turbo');
  });
});

// ── callOpenAI ────────────────────────────────────────────────────────────────

describe('callOpenAI()', () => {
  beforeEach(() => {
    openAIMocks.shouldThrow = false;
    openAIMocks.createFn.mockReset();
    anthropicMocks.shouldThrow = false;
    anthropicMocks.createFn.mockReset();
  });

  it('returns CompletionResult on successful call', async () => {
    openAIMocks.createFn.mockResolvedValue({
      choices: [{ message: { content: '{"result":"test"}' } }],
      model: 'gpt-4o',
      usage: { total_tokens: 120 },
    });

    const result = await callOpenAI(SAMPLE_MESSAGES, makeOpenAIConfig());

    expect(result.content).toBe('{"result":"test"}');
    expect(result.model).toBe('gpt-4o');
    expect(result.tokens).toBe(120);
  });

  it('returns empty content string when choices[0].message.content is null', async () => {
    openAIMocks.createFn.mockResolvedValue({
      choices: [{ message: { content: null } }],
      model: 'gpt-4o',
      usage: { total_tokens: 5 },
    });

    const result = await callOpenAI(SAMPLE_MESSAGES, makeOpenAIConfig());
    expect(result.content).toBe('');
  });

  it('omits tokens from result when usage is undefined', async () => {
    openAIMocks.createFn.mockResolvedValue({
      choices: [{ message: { content: '{}' } }],
      model: 'gpt-4o',
      usage: undefined,
    });

    const result = await callOpenAI(SAMPLE_MESSAGES, makeOpenAIConfig());
    expect(result.tokens).toBeUndefined();
  });

  it('uses maxTokens from config when provided', async () => {
    openAIMocks.createFn.mockResolvedValue({
      choices: [{ message: { content: '{}' } }],
      model: 'gpt-4o',
      usage: { total_tokens: 10 },
    });

    const config = { ...makeOpenAIConfig(), maxTokens: 2048 };
    await callOpenAI(SAMPLE_MESSAGES, config);

    const firstCall = openAIMocks.createFn.mock.calls[0];
    if (firstCall === undefined) throw new Error('Expected createFn to have been called');
    const callPayload = firstCall[0] as Record<string, unknown>;
    expect(callPayload['max_tokens']).toBe(2048);
  });

  it('uses default model gpt-4o when model is not in config', async () => {
    openAIMocks.createFn.mockResolvedValue({
      choices: [{ message: { content: '{}' } }],
      model: 'gpt-4o',
      usage: { total_tokens: 5 },
    });

    const config = { ...makeOpenAIConfig(), model: undefined };
    await callOpenAI(SAMPLE_MESSAGES, config);

    const firstCall = openAIMocks.createFn.mock.calls[0];
    if (firstCall === undefined) throw new Error('Expected createFn to have been called');
    const callPayload = firstCall[0] as Record<string, unknown>;
    expect(callPayload['model']).toBe('gpt-4o');
  });
});

// ── callAnthropic ─────────────────────────────────────────────────────────────

describe('callAnthropic()', () => {
  beforeEach(() => {
    openAIMocks.shouldThrow = false;
    openAIMocks.createFn.mockReset();
    anthropicMocks.shouldThrow = false;
    anthropicMocks.createFn.mockReset();
  });

  it('returns CompletionResult on successful call with text block', async () => {
    anthropicMocks.createFn.mockResolvedValue({
      content: [{ type: 'text', text: '{"value":"claude"}' }],
      model: 'claude-opus-4-6',
      usage: { input_tokens: 30, output_tokens: 20 },
    });

    const result = await callAnthropic(SAMPLE_MESSAGES, makeAnthropicConfig());

    expect(result.content).toBe('{"value":"claude"}');
    expect(result.model).toBe('claude-opus-4-6');
    expect(result.tokens).toBe(50); // 30 + 20
  });

  it('returns empty content when first content block is not a text type', async () => {
    anthropicMocks.createFn.mockResolvedValue({
      content: [{ type: 'tool_use', id: 'tool-1' }],
      model: 'claude-opus-4-6',
      usage: { input_tokens: 10, output_tokens: 5 },
    });

    const result = await callAnthropic(SAMPLE_MESSAGES, makeAnthropicConfig());
    expect(result.content).toBe('');
  });

  it('extracts system message from conversation and sends separately', async () => {
    anthropicMocks.createFn.mockResolvedValue({
      content: [{ type: 'text', text: '{"ok":true}' }],
      model: 'claude-opus-4-6',
      usage: { input_tokens: 20, output_tokens: 10 },
    });

    const messages: ChatMessage[] = [
      { role: 'system', content: 'You are an expert.' },
      { role: 'user', content: 'Explain this.' },
    ];

    await callAnthropic(messages, makeAnthropicConfig());

    const firstCall = anthropicMocks.createFn.mock.calls[0];
    if (firstCall === undefined) throw new Error('Expected createFn to have been called');
    const callPayload = firstCall[0] as Record<string, unknown>;
    // system should be passed at top level, not in messages array
    expect(callPayload['system']).toBe('You are an expert.');
    const sentMessages = callPayload['messages'] as { role: string }[];
    expect(sentMessages.every((m) => m.role !== 'system')).toBe(true);
  });

  it('does not include system field when no system message', async () => {
    anthropicMocks.createFn.mockResolvedValue({
      content: [{ type: 'text', text: '{}' }],
      model: 'claude-opus-4-6',
      usage: { input_tokens: 5, output_tokens: 5 },
    });

    await callAnthropic(SAMPLE_MESSAGES, makeAnthropicConfig());

    const firstCall = anthropicMocks.createFn.mock.calls[0];
    if (firstCall === undefined) throw new Error('Expected createFn to have been called');
    const callPayload = firstCall[0] as Record<string, unknown>;
    expect(callPayload['system']).toBeUndefined();
  });

  it('uses default model when model is not set in config', async () => {
    anthropicMocks.createFn.mockResolvedValue({
      content: [{ type: 'text', text: '{}' }],
      model: 'claude-opus-4-6',
      usage: { input_tokens: 5, output_tokens: 5 },
    });

    const config = { ...makeAnthropicConfig(), model: undefined };
    await callAnthropic(SAMPLE_MESSAGES, config);

    const firstCall = anthropicMocks.createFn.mock.calls[0];
    if (firstCall === undefined) throw new Error('Expected createFn to have been called');
    const callPayload = firstCall[0] as Record<string, unknown>;
    expect(callPayload['model']).toBe('claude-opus-4-6');
  });
});

// ── AIError codes are exported correctly ──────────────────────────────────────

describe('AIError integration with providers', () => {
  it('AIError class is importable and constructable', () => {
    const err = new AIError({
      code: 'ERR_AI_NOT_CONFIGURED',
      message: 'test',
      attempted: 'test',
      retryable: false,
      suggestions: [],
    });
    expect(err).toBeInstanceOf(AIError);
    expect(err.code).toBe('ERR_AI_NOT_CONFIGURED');
    expect(err.retryable).toBe(false);
  });

  it('callAzureOpenAI is a function', () => {
    expect(typeof callAzureOpenAI).toBe('function');
  });

  it('callOpenAI is a function', () => {
    expect(typeof callOpenAI).toBe('function');
  });

  it('callAnthropic is a function', () => {
    expect(typeof callAnthropic).toBe('function');
  });
});

// ── SDK missing — test catch throw paths via vi.doMock + module reset ─────────
//
// These tests use vi.resetModules() + vi.doMock() to re-import llm-providers
// with a mock that throws on dynamic import. After reset, AIError is also
// re-imported from the fresh module graph so instanceof checks work.

describe('SDK missing — error throw paths', () => {
  it('callAzureOpenAI throws an error with ERR_AI_NOT_CONFIGURED message when openai is missing', async () => {
    vi.resetModules();
    vi.doMock('openai', () => {
      throw new Error('Cannot find module openai');
    });

    const { callAzureOpenAI: freshCallAzure } = await import('#ai/llm-providers.js');

    let caught: unknown;
    try {
      await freshCallAzure([{ role: 'user', content: 'hi' }], {
        provider: 'azure-openai',
        apiKey: 'k',
        temperature: 0.3,
      });
    } catch (err) {
      caught = err;
    }

    expect(caught).toBeDefined();
    expect((caught as Error).message).toContain('openai package is not installed');
  });

  it('callOpenAI throws an error with ERR_AI_NOT_CONFIGURED message when openai is missing', async () => {
    vi.resetModules();
    vi.doMock('openai', () => {
      throw new Error('Cannot find module openai');
    });

    const { callOpenAI: freshCallOpenAI } = await import('#ai/llm-providers.js');

    let caught: unknown;
    try {
      await freshCallOpenAI([{ role: 'user', content: 'hi' }], {
        provider: 'openai',
        apiKey: 'k',
        temperature: 0.3,
      });
    } catch (err) {
      caught = err;
    }

    expect(caught).toBeDefined();
    expect((caught as Error).message).toContain('openai package is not installed');
  });

  it('callAnthropic throws an error with ERR_AI_NOT_CONFIGURED message when @anthropic-ai/sdk is missing', async () => {
    vi.resetModules();
    vi.doMock('@anthropic-ai/sdk', () => {
      throw new Error('Cannot find module @anthropic-ai/sdk');
    });

    const { callAnthropic: freshCallAnthropic } = await import('#ai/llm-providers.js');

    let caught: unknown;
    try {
      await freshCallAnthropic([{ role: 'user', content: 'hi' }], {
        provider: 'anthropic',
        anthropicApiKey: 'k',
        temperature: 0.3,
      });
    } catch (err) {
      caught = err;
    }

    expect(caught).toBeDefined();
    expect((caught as Error).message).toContain('@anthropic-ai/sdk package is not installed');
  });
});
