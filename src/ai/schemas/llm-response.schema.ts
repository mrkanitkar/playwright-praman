/**
 * @license
 * Copyright (c) ZesTest 2025-2030. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0
 *
 * This file may contain AI-assisted code.
 * See LICENSE and NOTICE files for details.
 */

/**
 * Zod schemas for LLM response validation.
 *
 * @remarks
 * Used to validate structured JSON responses from LLM providers before
 * wrapping them in {@link AiResponse} envelopes.
 *
 * @module ai/schemas
 */

import { z } from 'zod';

/**
 * Raw LLM completion response before envelope wrapping.
 *
 * @example
 * ```typescript
 * const completion: LlmCompletion = {
 *   content: '{"steps":["step 1"]}',
 *   model: 'gpt-4o',
 *   tokens: 150,
 *   finishReason: 'stop',
 * };
 * ```
 */
export const LlmCompletionSchema = z.object({
  content: z.string(),
  model: z.string().optional(),
  tokens: z.number().int().nonnegative().optional(),
  finishReason: z.enum(['stop', 'length', 'content_filter', 'tool_calls']).optional(),
});

/** Raw completion result from any LLM provider. */
export type LlmCompletion = z.infer<typeof LlmCompletionSchema>;

/**
 * Validates that a string is valid JSON.
 *
 * @example
 * ```typescript
 * const result = JsonStringSchema.safeParse('{"key":"value"}');
 * // result.success === true
 * ```
 */
export const JsonStringSchema = z.string().refine(
  (s) => {
    try {
      JSON.parse(s);
      return true;
    } catch {
      return false;
    }
  },
  { message: 'String is not valid JSON' },
);
