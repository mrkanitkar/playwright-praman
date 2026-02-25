/**
 * @license
 * Copyright (c) ZesTest 2025-2030. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0
 *
 * This file may contain AI-assisted code.
 * See LICENSE and NOTICE files for details.
 */

/**
 * Integration tests for LlmService.
 *
 * @remarks
 * Requires real API credentials in `.env.test`. Tests are skipped if
 * environment variables are not set. Run with:
 * ```
 * npm run test:ai-integration
 * ```
 *
 * @module tests/integration/ai
 */

import process from 'node:process';

import 'dotenv/config';
import { describe, expect, it } from 'vitest';
import { z } from 'zod';

import { createLlmService } from '../../../src/ai/llm-service.js';
import type { PramanConfig } from '../../../src/core/config/schema.js';

// ── Helpers ─────────────────────────────────────────────────────────────────

const SimpleResponseSchema = z.object({
  message: z.string(),
  timestamp: z.string().optional(),
});

function makeAzureConfig(): Readonly<PramanConfig> {
  return {
    baseUrl: 'https://example.com',
    ai: {
      provider: 'azure-openai',
      apiKey: process.env['AZURE_OPENAI_API_KEY'],
      endpoint: process.env['AZURE_OPENAI_ENDPOINT'],
      deployment: process.env['AZURE_OPENAI_DEPLOYMENT'] ?? 'gpt-4o',
      apiVersion: process.env['AZURE_OPENAI_API_VERSION'] ?? '2024-02-01',
      model: process.env['AZURE_OPENAI_DEPLOYMENT'] ?? 'gpt-4o',
      temperature: 0.3,
    },
  } as unknown as Readonly<PramanConfig>;
}

function makeOpenAIConfig(): Readonly<PramanConfig> {
  return {
    baseUrl: 'https://example.com',
    ai: {
      provider: 'openai',
      apiKey: process.env['OPENAI_API_KEY'],
      model: 'gpt-4o-mini',
      temperature: 0.3,
    },
  } as unknown as Readonly<PramanConfig>;
}

function makeAnthropicConfig(): Readonly<PramanConfig> {
  return {
    baseUrl: 'https://example.com',
    ai: {
      provider: 'anthropic',
      anthropicApiKey: process.env['ANTHROPIC_API_KEY'],
      model: 'claude-haiku-4-5-20251001',
      temperature: 0.3,
      maxTokens: 512,
    },
  } as unknown as Readonly<PramanConfig>;
}

// ── Tests ────────────────────────────────────────────────────────────────────

describe('LlmService', () => {
  describe('isConfigured()', () => {
    it('returns true when config.ai is present, or throws when absent', () => {
      const hasAzureCredentials =
        Boolean(process.env['AZURE_OPENAI_API_KEY']) &&
        Boolean(process.env['AZURE_OPENAI_ENDPOINT']);

      if (hasAzureCredentials) {
        const llm = createLlmService(makeAzureConfig());
        expect(llm.isConfigured()).toBe(true);
      } else {
        expect(() => {
          createLlmService({
            baseUrl: 'https://example.com',
          } as unknown as Readonly<PramanConfig>);
        }).toThrow();
      }
    });
  });

  describe('Azure OpenAI provider', () => {
    const hasCredentials =
      Boolean(process.env['AZURE_OPENAI_API_KEY']) && Boolean(process.env['AZURE_OPENAI_ENDPOINT']);

    it.skipIf(!hasCredentials)('complete() returns AiResponse success envelope', async () => {
      const llm = createLlmService(makeAzureConfig());
      const result = await llm.complete(
        'Respond with JSON: {"message": "hello from azure", "timestamp": "2024-01-01"}',
        SimpleResponseSchema,
      );

      expect(result.status).toBe('success');
      if (result.status !== 'success') return;
      expect(result.data).toMatchObject({ message: expect.any(String) as string });
      expect(result.metadata.duration).toBeGreaterThan(0);
      expect(result.metadata.retryable).toBe(false);
    });

    it.skipIf(!hasCredentials)('close() resolves without error', async () => {
      const llm = createLlmService(makeAzureConfig());
      await expect(llm.close()).resolves.toBeUndefined();
    });
  });

  describe('OpenAI provider', () => {
    const hasCredentials = Boolean(process.env['OPENAI_API_KEY']);

    it.skipIf(!hasCredentials)('complete() returns AiResponse success envelope', async () => {
      const llm = createLlmService(makeOpenAIConfig());
      const result = await llm.complete(
        'Respond with JSON: {"message": "hello from openai"}',
        SimpleResponseSchema,
      );

      expect(result.status).toBe('success');
      if (result.status !== 'success') return;
      expect(result.data).toMatchObject({ message: expect.any(String) as string });
      expect(result.metadata.duration).toBeGreaterThan(0);
    });
  });

  describe('Anthropic provider', () => {
    const hasCredentials = Boolean(process.env['ANTHROPIC_API_KEY']);

    it.skipIf(!hasCredentials)('complete() returns AiResponse success envelope', async () => {
      const llm = createLlmService(makeAnthropicConfig());
      const result = await llm.complete(
        'Respond with JSON only: {"message": "hello from anthropic"}',
        SimpleResponseSchema,
      );

      expect(result.status).toBe('success');
      if (result.status !== 'success') return;
      expect(result.data).toMatchObject({ message: expect.any(String) as string });
      expect(result.metadata.duration).toBeGreaterThan(0);
    });
  });

  describe('Error handling', () => {
    it('createLlmService throws AIError when config.ai is missing', () => {
      expect(() => {
        createLlmService({
          baseUrl: 'https://example.com',
        } as unknown as Readonly<PramanConfig>);
      }).toThrowError();
    });
  });
});
