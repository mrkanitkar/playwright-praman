/**
 * @license
 * Copyright (c) ZesTest 2025-2030. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0
 *
 * This file may contain AI-assisted code.
 * See LICENSE and NOTICE files for details.
 */

/**
 * Zod schemas for LLM request message types.
 *
 * @remarks
 * These schemas are used by {@link LlmService} to validate chat message
 * arrays before sending to LLM providers.
 *
 * @module ai/schemas
 */

import { z } from 'zod';

/**
 * Schema for a single chat message in a multi-turn conversation.
 *
 * @example
 * ```typescript
 * const msg: ChatMessage = { role: 'user', content: 'Create a purchase order' };
 * ```
 */
export const ChatMessageSchema = z.object({
  role: z.enum(['system', 'user', 'assistant']),
  content: z.string().min(1),
});

/** A single chat message for multi-turn LLM conversations. */
export type ChatMessage = z.infer<typeof ChatMessageSchema>;

/**
 * Schema for a complete chat request payload.
 *
 * @example
 * ```typescript
 * const req: ChatRequest = {
 *   messages: [{ role: 'user', content: 'Hello' }],
 *   temperature: 0.3,
 * };
 * ```
 */
export const ChatRequestSchema = z.object({
  messages: z.array(ChatMessageSchema).min(1),
  model: z.string().optional(),
  temperature: z.number().min(0).max(2).optional(),
  maxTokens: z.number().int().positive().optional(),
});

/** A complete chat request payload. */
export type ChatRequest = z.infer<typeof ChatRequestSchema>;
