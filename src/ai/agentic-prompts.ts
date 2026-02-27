/**
 * @license
 * Copyright (c) ZesTest 2025-2030. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0
 *
 * This file may contain AI-assisted code.
 * See LICENSE and NOTICE files for details.
 */

/**
 * Prompt builders for the AgenticHandler's LLM interactions.
 *
 * @remarks
 * Extracted from `agentic-handler.ts` to keep each module under 300 LOC.
 *
 * @module ai
 */

import type { CapabilityRegistry } from './capability-registry.js';
import type { RecipeRegistry } from './recipe-registry.js';
import type { PageContext } from './types.js';

import { createLogger } from '#core/logging/index.js';

const log = createLogger('agentic');

/** Maximum characters for the serialized page context in LLM prompts. */
export const MAX_CONTEXT_CHARS = 50_000;

/** Maximum number of controls to include in the page context. */
export const MAX_CONTEXT_CONTROLS = 200;

/**
 * Builds the system prompt for LLM test generation.
 *
 * @aiContext LLM prompt construction for AI-powered test generation
 * @guarantee Includes capability listing and recipe examples in system prompt
 *
 * @param capabilityRegistry - Registry of available Praman capabilities.
 * @param recipeRegistry - Registry of reusable test recipes.
 * @returns Formatted system prompt string.
 *
 * @example
 * ```typescript
 * import { buildSystemPrompt } from '#ai/agentic-prompts.js';
 *
 * const systemPrompt = buildSystemPrompt(capabilities, recipes);
 * // Pass as system message to LLM provider
 * ```
 */
export function buildSystemPrompt(
  capabilityRegistry: CapabilityRegistry,
  recipeRegistry: RecipeRegistry,
): string {
  // Only include fixture and namespace priority entries (exclude implementation details)
  const entries = capabilityRegistry
    .list()
    .filter((c) => c.priority === 'fixture' || c.priority === 'namespace');

  // Group by namespace (derived from qualifiedName: "ui5.table.getRows" -> "ui5.table")
  const grouped = new Map<string, { qualifiedName: string; name: string; description: string }[]>();
  for (const entry of entries) {
    const parts = entry.qualifiedName.split('.');
    const namespace = parts.length > 1 ? parts.slice(0, -1).join('.') : (parts[0] ?? 'other');
    const existing = grouped.get(namespace);
    const item = {
      qualifiedName: entry.qualifiedName,
      name: entry.name,
      description: entry.description,
    };
    if (existing !== undefined) {
      existing.push(item);
    } else {
      grouped.set(namespace, [item]);
    }
  }

  // Format as namespace-grouped listing
  const capSections: string[] = [];
  for (const [namespace, items] of grouped) {
    capSections.push(`## ${namespace}`);
    for (const item of items) {
      capSections.push(`- ${item.qualifiedName}: ${item.description}`);
    }
    capSections.push('');
  }

  const recipeExamples = recipeRegistry
    .getTopRecipes(5)
    .map((r) => r.pattern)
    .join('\n\n');

  return [
    'You are a Playwright test generator for SAP UI5 applications using the Praman library.',
    'Generate both:',
    '1. A numbered list of test steps (natural language)',
    '2. Complete TypeScript test code using Praman fixtures',
    '',
    'Available capabilities (grouped by namespace):',
    '',
    ...capSections,
    'Example recipes:',
    recipeExamples,
    '',
    'Rules:',
    '- Use only capabilities listed above',
    '- Use TypeScript strict mode',
    "- Import from 'playwright-praman'",
    '- Use async/await',
    '- Wrap test in test() block from Praman',
    '',
    'Respond with JSON: { "steps": ["step 1...", "step 2..."], "code": "import { test } from \'playwright-praman\';\\n..." }',
  ].join('\n');
}

/**
 * Builds the user prompt for LLM test generation with bounded page context.
 *
 * @aiContext LLM prompt with bounded page context for test step generation
 * @guarantee Context truncated to MAX_CONTEXT_CHARS and MAX_CONTEXT_CONTROLS limits
 *
 * @param pageContext - Current page context snapshot.
 * @param scenario - Natural language test scenario description.
 * @returns Formatted user prompt string.
 *
 * @example
 * ```typescript
 * import { buildUserPrompt } from '#ai/agentic-prompts.js';
 *
 * const userPrompt = buildUserPrompt(pageContext, userIntent);
 * // Pass as user message to LLM provider
 * ```
 */
export function buildUserPrompt(pageContext: PageContext, scenario: string): string {
  // Bound the context to prevent oversized LLM prompts
  const boundedContext: PageContext = {
    ...pageContext,
    controls: pageContext.controls.slice(0, MAX_CONTEXT_CONTROLS),
  };

  let contextJson = JSON.stringify(boundedContext, null, 2);
  if (contextJson.length > MAX_CONTEXT_CHARS) {
    contextJson = contextJson.slice(0, MAX_CONTEXT_CHARS) + '\n... (truncated)';
  }

  if (boundedContext.controls.length < pageContext.controls.length) {
    log.debug(
      { total: pageContext.controls.length, included: boundedContext.controls.length },
      'buildUserPrompt: truncated controls for LLM prompt',
    );
  }

  return [
    'Page context:',
    contextJson,
    '',
    'Test scenario:',
    scenario,
    '',
    'Respond with JSON:',
    '{',
    '  "steps": ["step 1...", "step 2..."],',
    '  "code": "import { test } from \'playwright-praman\';\\n..."',
    '}',
  ].join('\n');
}
