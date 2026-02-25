/**
 * @license
 * Copyright (c) ZesTest 2025-2030. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0
 *
 * This file may contain AI-assisted code.
 * See LICENSE and NOTICE files for details.
 */

/**
 * Tests for `src/core/config/schema.ts`.
 *
 * @remarks
 * Verifies PramanConfigSchema validation, defaults, and the AI sub-schema
 * including Azure OpenAI and Anthropic provider fields added in Phase 5.
 */
import { describe, expect, it } from 'vitest';

import { PramanConfigSchema } from '../../../src/core/config/schema.js';

describe('PramanConfigSchema', () => {
  // ── Defaults ────────────────────────────────────────────────────────
  it('accepts empty config and applies defaults', () => {
    const result = PramanConfigSchema.safeParse({});
    expect(result.success).toBe(true);
  });

  // ── AI sub-schema ────────────────────────────────────────────────────
  describe('ai sub-schema', () => {
    it('accepts azure-openai provider (default)', () => {
      const result = PramanConfigSchema.safeParse({ ai: { provider: 'azure-openai' } });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.ai?.provider).toBe('azure-openai');
      }
    });

    it('accepts openai provider', () => {
      const result = PramanConfigSchema.safeParse({ ai: { provider: 'openai' } });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.ai?.provider).toBe('openai');
      }
    });

    it('accepts anthropic provider', () => {
      const result = PramanConfigSchema.safeParse({ ai: { provider: 'anthropic' } });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.ai?.provider).toBe('anthropic');
      }
    });

    it('rejects unknown provider', () => {
      const result = PramanConfigSchema.safeParse({ ai: { provider: 'unknown-provider' } });
      expect(result.success).toBe(false);
    });

    it('accepts endpoint as a valid URL string', () => {
      const result = PramanConfigSchema.safeParse({
        ai: { endpoint: 'https://my-resource.openai.azure.com' },
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.ai?.endpoint).toBe('https://my-resource.openai.azure.com');
      }
    });

    it('rejects endpoint that is not a URL', () => {
      const result = PramanConfigSchema.safeParse({ ai: { endpoint: 'not-a-url' } });
      expect(result.success).toBe(false);
    });

    it('accepts deployment as a string', () => {
      const result = PramanConfigSchema.safeParse({ ai: { deployment: 'gpt-4o' } });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.ai?.deployment).toBe('gpt-4o');
      }
    });

    it('accepts apiVersion as a string', () => {
      const result = PramanConfigSchema.safeParse({ ai: { apiVersion: '2024-02-01' } });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.ai?.apiVersion).toBe('2024-02-01');
      }
    });

    it('accepts anthropicApiKey as a string', () => {
      const result = PramanConfigSchema.safeParse({
        ai: { anthropicApiKey: 'sk-ant-api03-xxxx' },
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.ai?.anthropicApiKey).toBe('sk-ant-api03-xxxx');
      }
    });

    it('endpoint, deployment, apiVersion, anthropicApiKey are undefined when not provided', () => {
      const result = PramanConfigSchema.safeParse({ ai: {} });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.ai?.endpoint).toBeUndefined();
        expect(result.data.ai?.deployment).toBeUndefined();
        expect(result.data.ai?.apiVersion).toBeUndefined();
        expect(result.data.ai?.anthropicApiKey).toBeUndefined();
      }
    });

    it('accepts all Azure OpenAI fields together', () => {
      const result = PramanConfigSchema.safeParse({
        ai: {
          provider: 'azure-openai',
          apiKey: 'my-api-key',
          model: 'gpt-4o',
          endpoint: 'https://my-resource.openai.azure.com',
          deployment: 'gpt-4o-deployment',
          apiVersion: '2024-02-01',
        },
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.ai?.provider).toBe('azure-openai');
        expect(result.data.ai?.endpoint).toBe('https://my-resource.openai.azure.com');
        expect(result.data.ai?.deployment).toBe('gpt-4o-deployment');
        expect(result.data.ai?.apiVersion).toBe('2024-02-01');
      }
    });

    it('accepts Anthropic provider with anthropicApiKey', () => {
      const result = PramanConfigSchema.safeParse({
        ai: {
          provider: 'anthropic',
          anthropicApiKey: 'sk-ant-api03-xxxx',
          model: 'claude-opus-4-6',
        },
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.ai?.provider).toBe('anthropic');
        expect(result.data.ai?.anthropicApiKey).toBe('sk-ant-api03-xxxx');
        expect(result.data.ai?.model).toBe('claude-opus-4-6');
      }
    });
  });
});
