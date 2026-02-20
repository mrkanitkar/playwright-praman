/**
 * Unit tests for `src/ai/schemas/llm-response.schema.ts`.
 *
 * @remarks
 * Pure Zod validation tests — no mocking needed.
 * Tests LlmCompletionSchema and JsonStringSchema.
 */

import { describe, expect, it } from 'vitest';

import { JsonStringSchema, LlmCompletionSchema } from '#ai/schemas/llm-response.schema.js';

// ── LlmCompletionSchema ───────────────────────────────────────────────────────

describe('LlmCompletionSchema', () => {
  describe('valid inputs', () => {
    it('accepts a minimal completion with only content', () => {
      const result = LlmCompletionSchema.safeParse({ content: '{"steps":["step 1"]}' });
      expect(result.success).toBe(true);
    });

    it('accepts a full completion with all optional fields', () => {
      const result = LlmCompletionSchema.safeParse({
        content: '{"key":"value"}',
        model: 'gpt-4o',
        tokens: 150,
        finishReason: 'stop',
      });
      expect(result.success).toBe(true);
    });

    it('accepts empty string content', () => {
      const result = LlmCompletionSchema.safeParse({ content: '' });
      expect(result.success).toBe(true);
    });

    it('accepts finishReason "length"', () => {
      const result = LlmCompletionSchema.safeParse({
        content: '{}',
        finishReason: 'length',
      });
      expect(result.success).toBe(true);
    });

    it('accepts finishReason "content_filter"', () => {
      const result = LlmCompletionSchema.safeParse({
        content: '{}',
        finishReason: 'content_filter',
      });
      expect(result.success).toBe(true);
    });

    it('accepts finishReason "tool_calls"', () => {
      const result = LlmCompletionSchema.safeParse({
        content: '{}',
        finishReason: 'tool_calls',
      });
      expect(result.success).toBe(true);
    });

    it('accepts tokens as 0 (nonnegative)', () => {
      const result = LlmCompletionSchema.safeParse({ content: '{}', tokens: 0 });
      expect(result.success).toBe(true);
    });

    it('preserves all fields in parsed output', () => {
      const input = {
        content: '{"result":"ok"}',
        model: 'claude-opus-4-6',
        tokens: 200,
        finishReason: 'stop' as const,
      };
      const result = LlmCompletionSchema.safeParse(input);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.content).toBe('{"result":"ok"}');
        expect(result.data.model).toBe('claude-opus-4-6');
        expect(result.data.tokens).toBe(200);
        expect(result.data.finishReason).toBe('stop');
      }
    });
  });

  describe('invalid inputs', () => {
    it('rejects missing content field', () => {
      const result = LlmCompletionSchema.safeParse({ model: 'gpt-4o' });
      expect(result.success).toBe(false);
    });

    it('rejects null content', () => {
      const result = LlmCompletionSchema.safeParse({ content: null });
      expect(result.success).toBe(false);
    });

    it('rejects numeric content', () => {
      const result = LlmCompletionSchema.safeParse({ content: 42 });
      expect(result.success).toBe(false);
    });

    it('rejects invalid finishReason', () => {
      const result = LlmCompletionSchema.safeParse({
        content: '{}',
        finishReason: 'unknown_reason',
      });
      expect(result.success).toBe(false);
    });

    it('rejects negative tokens', () => {
      const result = LlmCompletionSchema.safeParse({ content: '{}', tokens: -1 });
      expect(result.success).toBe(false);
    });

    it('rejects non-integer tokens', () => {
      const result = LlmCompletionSchema.safeParse({ content: '{}', tokens: 1.5 });
      expect(result.success).toBe(false);
    });

    it('rejects null entirely', () => {
      const result = LlmCompletionSchema.safeParse(null);
      expect(result.success).toBe(false);
    });

    it('rejects undefined', () => {
      const result = LlmCompletionSchema.safeParse(undefined);
      expect(result.success).toBe(false);
    });
  });
});

// ── JsonStringSchema ──────────────────────────────────────────────────────────

describe('JsonStringSchema', () => {
  describe('valid inputs', () => {
    it('accepts a valid JSON object string', () => {
      const result = JsonStringSchema.safeParse('{"key":"value"}');
      expect(result.success).toBe(true);
    });

    it('accepts a valid JSON array string', () => {
      const result = JsonStringSchema.safeParse('[1,2,3]');
      expect(result.success).toBe(true);
    });

    it('accepts a JSON string containing a number', () => {
      const result = JsonStringSchema.safeParse('42');
      expect(result.success).toBe(true);
    });

    it('accepts a JSON string containing true', () => {
      const result = JsonStringSchema.safeParse('true');
      expect(result.success).toBe(true);
    });

    it('accepts a JSON string containing null', () => {
      const result = JsonStringSchema.safeParse('null');
      expect(result.success).toBe(true);
    });

    it('accepts a JSON string containing a nested object', () => {
      const nested = JSON.stringify({ steps: ['step 1', 'step 2'], code: 'test("x", () => {})' });
      const result = JsonStringSchema.safeParse(nested);
      expect(result.success).toBe(true);
    });

    it('accepts an empty JSON object "{}"', () => {
      const result = JsonStringSchema.safeParse('{}');
      expect(result.success).toBe(true);
    });

    it('accepts an empty JSON array "[]"', () => {
      const result = JsonStringSchema.safeParse('[]');
      expect(result.success).toBe(true);
    });
  });

  describe('invalid inputs', () => {
    it('rejects a plain text string (not JSON)', () => {
      const result = JsonStringSchema.safeParse('not valid json');
      expect(result.success).toBe(false);
    });

    it('rejects JSON with trailing comma', () => {
      const result = JsonStringSchema.safeParse('{"key":"value",}');
      expect(result.success).toBe(false);
    });

    it('rejects single-quoted JSON', () => {
      const result = JsonStringSchema.safeParse("{'key':'value'}");
      expect(result.success).toBe(false);
    });

    it('rejects an empty string', () => {
      const result = JsonStringSchema.safeParse('');
      expect(result.success).toBe(false);
    });

    it('rejects JSON with unclosed braces', () => {
      const result = JsonStringSchema.safeParse('{"key": "value"');
      expect(result.success).toBe(false);
    });

    it('rejects null', () => {
      const result = JsonStringSchema.safeParse(null);
      expect(result.success).toBe(false);
    });

    it('rejects undefined', () => {
      const result = JsonStringSchema.safeParse(undefined);
      expect(result.success).toBe(false);
    });

    it('includes error message "String is not valid JSON" for invalid input', () => {
      const result = JsonStringSchema.safeParse('broken {json}');
      expect(result.success).toBe(false);
      if (!result.success) {
        const messages = result.error.issues.map((i) => i.message);
        expect(messages.some((m) => m.includes('not valid JSON'))).toBe(true);
      }
    });
  });
});
