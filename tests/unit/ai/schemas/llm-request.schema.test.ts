/**
 * Unit tests for `src/ai/schemas/llm-request.schema.ts`.
 *
 * @remarks
 * Pure Zod validation tests — no mocking needed.
 * Tests ChatMessageSchema and ChatRequestSchema.
 */

import { describe, expect, it } from 'vitest';

import { ChatMessageSchema, ChatRequestSchema } from '#ai/schemas/llm-request.schema.js';

// ── ChatMessageSchema ─────────────────────────────────────────────────────────

describe('ChatMessageSchema', () => {
  describe('valid inputs', () => {
    it('accepts a user message', () => {
      const result = ChatMessageSchema.safeParse({ role: 'user', content: 'hello' });
      expect(result.success).toBe(true);
    });

    it('accepts a system message', () => {
      const result = ChatMessageSchema.safeParse({ role: 'system', content: 'You are helpful.' });
      expect(result.success).toBe(true);
    });

    it('accepts an assistant message', () => {
      const result = ChatMessageSchema.safeParse({
        role: 'assistant',
        content: 'Here is your answer.',
      });
      expect(result.success).toBe(true);
    });

    it('preserves the role field on parsed output', () => {
      const result = ChatMessageSchema.safeParse({ role: 'user', content: 'test' });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.role).toBe('user');
      }
    });

    it('preserves the content field on parsed output', () => {
      const result = ChatMessageSchema.safeParse({ role: 'user', content: 'hello world' });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.content).toBe('hello world');
      }
    });

    it('accepts long content strings', () => {
      const longContent = 'a'.repeat(5000);
      const result = ChatMessageSchema.safeParse({ role: 'user', content: longContent });
      expect(result.success).toBe(true);
    });
  });

  describe('invalid inputs', () => {
    it('rejects empty content string', () => {
      const result = ChatMessageSchema.safeParse({ role: 'user', content: '' });
      expect(result.success).toBe(false);
    });

    it('rejects an invalid role', () => {
      const result = ChatMessageSchema.safeParse({ role: 'unknown', content: 'hi' });
      expect(result.success).toBe(false);
    });

    it('rejects role "admin"', () => {
      const result = ChatMessageSchema.safeParse({ role: 'admin', content: 'hi' });
      expect(result.success).toBe(false);
    });

    it('rejects missing role field', () => {
      const result = ChatMessageSchema.safeParse({ content: 'hello' });
      expect(result.success).toBe(false);
    });

    it('rejects missing content field', () => {
      const result = ChatMessageSchema.safeParse({ role: 'user' });
      expect(result.success).toBe(false);
    });

    it('rejects null content', () => {
      const result = ChatMessageSchema.safeParse({ role: 'user', content: null });
      expect(result.success).toBe(false);
    });

    it('rejects numeric content', () => {
      const result = ChatMessageSchema.safeParse({ role: 'user', content: 42 });
      expect(result.success).toBe(false);
    });

    it('rejects null entirely', () => {
      const result = ChatMessageSchema.safeParse(null);
      expect(result.success).toBe(false);
    });

    it('rejects undefined', () => {
      const result = ChatMessageSchema.safeParse(undefined);
      expect(result.success).toBe(false);
    });

    it('rejects a string instead of object', () => {
      const result = ChatMessageSchema.safeParse('not an object');
      expect(result.success).toBe(false);
    });
  });
});

// ── ChatRequestSchema ─────────────────────────────────────────────────────────

describe('ChatRequestSchema', () => {
  describe('valid inputs', () => {
    it('accepts a minimal request with just messages', () => {
      const result = ChatRequestSchema.safeParse({
        messages: [{ role: 'user', content: 'hello' }],
      });
      expect(result.success).toBe(true);
    });

    it('accepts a full request with all optional fields', () => {
      const result = ChatRequestSchema.safeParse({
        messages: [{ role: 'user', content: 'hello' }],
        model: 'gpt-4o',
        temperature: 0.5,
        maxTokens: 2048,
      });
      expect(result.success).toBe(true);
    });

    it('accepts multiple messages', () => {
      const result = ChatRequestSchema.safeParse({
        messages: [
          { role: 'system', content: 'You are an expert.' },
          { role: 'user', content: 'Explain SAP.' },
          { role: 'assistant', content: 'SAP is an ERP...' },
          { role: 'user', content: 'Tell me more.' },
        ],
      });
      expect(result.success).toBe(true);
    });

    it('accepts temperature 0 (minimum)', () => {
      const result = ChatRequestSchema.safeParse({
        messages: [{ role: 'user', content: 'hi' }],
        temperature: 0,
      });
      expect(result.success).toBe(true);
    });

    it('accepts temperature 2 (maximum)', () => {
      const result = ChatRequestSchema.safeParse({
        messages: [{ role: 'user', content: 'hi' }],
        temperature: 2,
      });
      expect(result.success).toBe(true);
    });

    it('preserves all fields in parsed output', () => {
      const input = {
        messages: [{ role: 'user' as const, content: 'hello' }],
        model: 'gpt-4o',
        temperature: 0.3,
        maxTokens: 1024,
      };
      const result = ChatRequestSchema.safeParse(input);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.model).toBe('gpt-4o');
        expect(result.data.temperature).toBe(0.3);
        expect(result.data.maxTokens).toBe(1024);
        expect(result.data.messages).toHaveLength(1);
      }
    });
  });

  describe('invalid inputs', () => {
    it('rejects empty messages array', () => {
      const result = ChatRequestSchema.safeParse({ messages: [] });
      expect(result.success).toBe(false);
    });

    it('rejects missing messages field', () => {
      const result = ChatRequestSchema.safeParse({ model: 'gpt-4o' });
      expect(result.success).toBe(false);
    });

    it('rejects temperature below 0', () => {
      const result = ChatRequestSchema.safeParse({
        messages: [{ role: 'user', content: 'hi' }],
        temperature: -0.1,
      });
      expect(result.success).toBe(false);
    });

    it('rejects temperature above 2', () => {
      const result = ChatRequestSchema.safeParse({
        messages: [{ role: 'user', content: 'hi' }],
        temperature: 2.1,
      });
      expect(result.success).toBe(false);
    });

    it('rejects non-integer maxTokens', () => {
      const result = ChatRequestSchema.safeParse({
        messages: [{ role: 'user', content: 'hi' }],
        maxTokens: 1.5,
      });
      expect(result.success).toBe(false);
    });

    it('rejects negative maxTokens', () => {
      const result = ChatRequestSchema.safeParse({
        messages: [{ role: 'user', content: 'hi' }],
        maxTokens: -10,
      });
      expect(result.success).toBe(false);
    });

    it('rejects zero maxTokens', () => {
      const result = ChatRequestSchema.safeParse({
        messages: [{ role: 'user', content: 'hi' }],
        maxTokens: 0,
      });
      expect(result.success).toBe(false);
    });

    it('rejects invalid message within the array', () => {
      const result = ChatRequestSchema.safeParse({
        messages: [{ role: 'invalid-role', content: 'hi' }],
      });
      expect(result.success).toBe(false);
    });

    it('rejects null', () => {
      const result = ChatRequestSchema.safeParse(null);
      expect(result.success).toBe(false);
    });
  });
});
