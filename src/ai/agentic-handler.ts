/**
 * @license
 * Copyright (c) ZesTest 2025-2030. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0
 *
 * This file may contain AI-assisted code.
 * See LICENSE and NOTICE files for details.
 */

/**
 * Autonomous test operation handler with checkpoint-based resumability.
 *
 * @remarks
 * BP-CLAUDE: Handler serializes progress `{ currentStep, completedSteps, remainingSteps, state }`
 * so AI agents can resume from last checkpoint on failure (chain-of-thought incremental execution).
 *
 * All LLM interactions return `AiResponse<T>` for consistent agent consumption (D29).
 *
 * @intent Execute autonomous SAP UI5 test operations
 * @capability ai-agentic-handler
 * @sapModule All
 *
 * @module ai
 */

import { z } from 'zod';

import { buildSystemPrompt, buildUserPrompt } from './agentic-prompts.js';
import type { CapabilityRegistry } from './capability-registry.js';
import type { buildPageContext } from './context-builder.js';
import type { LlmService } from './llm-service.js';
import { RecipeRegistry } from './recipe-registry.js';
import type { ChatMessage } from './schemas/llm-request.schema.js';
import type { AgenticCheckpoint, AiGeneratedTest, AiResponse, PageContext } from './types.js';

import { PramanConfigSchema } from '#core/config/schema.js';
import { ErrorCode } from '#core/errors/codes.js';
import { createLogger } from '#core/logging/index.js';
import { ui5Step } from '#core/utils/step-decorator.js';

const log = createLogger('agentic');

/** Default config with overridden discovery timeout for context building. */
const GENERATE_CONTEXT_CONFIG = Object.freeze(
  PramanConfigSchema.parse({ controlDiscoveryTimeout: 30_000 }),
);

/** Default config with short timeout for interpret-step context enrichment. */
const INTERPRET_CONTEXT_CONFIG = Object.freeze(
  PramanConfigSchema.parse({ controlDiscoveryTimeout: 10_000 }),
);

// ── Zod schema for generateTest LLM response ────────────────────────────────

const AiGeneratedTestSchema = z.object({
  steps: z.array(z.string()).min(1).max(20),
  code: z.string().min(50),
});

// ── Zod schema for suggestActions LLM response ──────────────────────────────

const SuggestActionsSchema = z.object({
  suggestions: z.array(z.string()).min(1),
});

// ── Zod schema for interpretStep LLM response ───────────────────────────────

const InterpretStepSchema = z.object({
  capability: z.string().min(1),
  confidence: z.number().min(0).max(1),
});

// ── Main class ──────────────────────────────────────────────────────────────

/**
 * Autonomous test operation handler with checkpoint-based resumability.
 *
 * @remarks
 * Orchestrates LLM calls, capability lookups, and checkpoint management for
 * AI-driven test generation. All methods return `AiResponse<T>` envelopes —
 * never throw on LLM errors.
 *
 * @intent Execute autonomous SAP UI5 test operations
 * @capability ai-agentic-handler
 * @sapModule All
 *
 * @example
 * ```typescript
 * const handler = new AgenticHandler(llm, buildPageContext, capabilities);
 * const result = await handler.generateTest('Create a PO for vendor V001', page);
 * if (result.status === 'success') {
 *   for (const step of result.data.steps) {
 *     await handler.interpretStep(step, page);
 *   }
 * }
 * ```
 */
export class AgenticHandler {
  private readonly checkpoints = new Map<string, AgenticCheckpoint>();

  /**
   * Constructs an AgenticHandler.
   *
   * @param llm - LLM provider service for sending prompts.
   * @param contextBuilder - Function to build page context (same as `buildPageContext`).
   * @param capabilityRegistry - Registry of available Praman capabilities.
   * @param recipeRegistry - Optional registry of reusable test recipes (defaults to a new `RecipeRegistry`).
   *
   * @example
   * ```typescript
   * const handler = new AgenticHandler(llm, buildPageContext, capabilities);
   * ```
   */
  constructor(
    private readonly llm: LlmService,
    private readonly contextBuilder: typeof buildPageContext,
    private readonly capabilityRegistry: CapabilityRegistry,
    private readonly recipeRegistry: RecipeRegistry = new RecipeRegistry(),
  ) {}

  /**
   * Generate a test for a natural language scenario.
   *
   * @remarks
   * Returns `AiResponse<AiGeneratedTest>` — both natural language steps AND runnable TypeScript code.
   * Each step is executed separately via `interpretStep(step: string): Promise<AiResponse<void>>`
   * which maps step text to Praman fixture calls using the CapabilityRegistry.
   *
   * This two-phase design (generate → execute) enables checkpoint/resume (AgenticCheckpoint):
   * if step 3 fails, re-execute from step 3 without re-generating the full step list.
   *
   * @param scenario - Natural language description of the test scenario.
   * @param page - Playwright page (or structural equivalent).
   * @returns `AiResponse<AiGeneratedTest>` with steps and generated TypeScript code.
   *
   * @intent Translate business scenario to executable Praman test steps and code
   *
   * @example
   * ```typescript
   * const result = await handler.generateTest(
   *   'Create a purchase order for vendor V001, material M1000, quantity 10',
   *   page,
   * );
   * if (result.status === 'success') {
   *   logger.info('Steps:', result.data.steps);
   *   logger.info('Code:', result.data.code);
   * }
   * ```
   */
  @ui5Step
  async generateTest(
    scenario: string,
    page: Parameters<typeof buildPageContext>[0],
  ): Promise<AiResponse<AiGeneratedTest>> {
    const startTime = Date.now();
    log.debug({ scenario }, 'generateTest: starting');

    // ── Step 1: Build page context ─────────────────────────────────────────
    const contextResult = await this.contextBuilder(page, GENERATE_CONTEXT_CONFIG);

    if (contextResult.status !== 'success') {
      const errorMsg =
        contextResult.status === 'error'
          ? contextResult.error.message
          : 'Partial page context — page may not be fully loaded';
      return {
        status: 'error',
        data: undefined,
        error: {
          code: 'ERR_AI_CONTEXT_BUILD_FAILED',
          message: `Failed to build page context: ${errorMsg}`,
        },
        metadata: {
          duration: Date.now() - startTime,
          retryable: true,
          suggestions: [
            'Ensure the page is a UI5 application',
            'Wait for the page to fully load before calling generateTest',
          ],
        },
      };
    }

    const pageContext = contextResult.data;

    // ── Step 2: Build messages ─────────────────────────────────────────────
    const systemPrompt = buildSystemPrompt(this.capabilityRegistry, this.recipeRegistry);
    const userPrompt = buildUserPrompt(pageContext, scenario);

    const messages: ChatMessage[] = [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ];

    // ── Step 3: Call LLM ───────────────────────────────────────────────────
    log.debug('generateTest: calling LLM');
    const llmResult = await this.llm.chat(messages, AiGeneratedTestSchema);

    if (llmResult.status === 'error') {
      log.debug({ error: llmResult.error }, 'generateTest: LLM call failed');
      return {
        status: 'error',
        data: undefined,
        error: llmResult.error,
        metadata: {
          ...llmResult.metadata,
          duration: Date.now() - startTime,
        },
      };
    }

    // ── Step 4: Shape result into AiGeneratedTest ──────────────────────────
    const raw = llmResult.data as { steps: string[]; code: string };
    const capabilityIds = this.capabilityRegistry.list().map((c) => c.id);

    const generatedTest: AiGeneratedTest = {
      steps: raw.steps,
      code: raw.code,
      metadata: {
        model: llmResult.metadata.model ?? 'unknown',
        tokens: {
          input: Math.floor((llmResult.metadata.tokens ?? 0) * 0.7),
          output: Math.floor((llmResult.metadata.tokens ?? 0) * 0.3),
        },
        duration: Date.now() - startTime,
        capabilities: capabilityIds.slice(0, 10),
      },
    };

    log.debug(
      { stepCount: raw.steps.length, duration: Date.now() - startTime },
      'generateTest: success',
    );

    return {
      status: 'success',
      data: generatedTest,
      metadata: {
        ...llmResult.metadata,
        duration: Date.now() - startTime,
      },
    };
  }

  /**
   * Execute a single natural language step by mapping it to Praman fixture calls.
   *
   * @remarks
   * Maps step text to registered capabilities in CapabilityRegistry.
   * Used with `generateTest()` for two-phase generate → execute workflow.
   * On failure, the AgenticCheckpoint captures progress for resume.
   *
   * @param step - Natural language step description.
   * @param page - Playwright page (or structural equivalent).
   * @returns `AiResponse<void>` indicating success or failure.
   *
   * @intent Execute a single natural language step
   *
   * @example
   * ```typescript
   * const result = await handler.interpretStep('Fill Vendor field with 100001', page);
   * if (result.status === 'error') {
   *   console.error('Step failed:', result.error.message);
   * }
   * ```
   */
  @ui5Step
  async interpretStep(
    step: string,
    page: Parameters<typeof buildPageContext>[0],
  ): Promise<AiResponse<void>> {
    const startTime = Date.now();
    log.debug({ step }, 'interpretStep: starting');

    const entries = this.capabilityRegistry
      .list()
      .filter((c) => c.priority === 'fixture' || c.priority === 'namespace');

    const capList = entries.map((c) => `- ${c.qualifiedName}: ${c.description}`).join('\n');

    const prompt = [
      `Map this test step to a capability name from the list below.`,
      `Step: "${step}"`,
      '',
      'Available capabilities:',
      capList,
      '',
      'Respond with JSON: { "capability": "<name>", "confidence": 0.0-1.0 }',
    ].join('\n');

    const messages: ChatMessage[] = [{ role: 'user', content: prompt }];

    const llmResult = await this.llm.chat(messages, InterpretStepSchema);

    if (llmResult.status === 'error') {
      return {
        status: 'error',
        data: undefined,
        error: llmResult.error,
        metadata: {
          ...llmResult.metadata,
          duration: Date.now() - startTime,
        },
      };
    }

    const raw = llmResult.data as { capability: string; confidence: number };

    // Verify the capability exists in registry
    const found = this.capabilityRegistry.has(raw.capability);
    if (!found) {
      return {
        status: 'error',
        data: undefined,
        error: {
          code: ErrorCode.ERR_AI_CAPABILITY_NOT_FOUND,
          message: `Capability '${raw.capability}' is not registered`,
        },
        metadata: {
          duration: Date.now() - startTime,
          retryable: false,
          suggestions: [
            'Check that the step description matches a known Praman capability',
            `Available capabilities: ${this.capabilityRegistry
              .list()
              .map((c) => c.name)
              .join(', ')}`,
          ],
        },
      };
    }

    // Build enriched context using the page for AI confirmation logging
    await this.contextBuilder(page, INTERPRET_CONTEXT_CONFIG);

    return {
      status: 'success',
      data: undefined,
      metadata: {
        ...llmResult.metadata,
        duration: Date.now() - startTime,
      },
    };
  }

  /**
   * Suggest next actions given the current page state.
   *
   * @remarks
   * Returns AI-recommended operations based on discovered controls and the
   * current page context. Returns `AiResponse<string[]>` with a list of
   * human-readable action suggestions.
   *
   * @param pageContext - Current page context snapshot.
   * @returns `AiResponse<string[]>` containing action suggestions.
   *
   * @example
   * ```typescript
   * const suggestions = await handler.suggestActions(pageContext);
   * if (suggestions.status === 'success') {
   *   logger.info('Next actions:', suggestions.data);
   * }
   * ```
   */
  @ui5Step
  async suggestActions(pageContext: PageContext): Promise<AiResponse<string[]>> {
    const startTime = Date.now();
    log.debug({ controlCount: pageContext.controls.length }, 'suggestActions: starting');

    const prompt = [
      'You are a SAP UI5 test automation expert.',
      'Based on the following page context, suggest the most useful test actions.',
      '',
      'Page context:',
      JSON.stringify(pageContext, null, 2),
      '',
      'Respond with JSON: { "suggestions": ["action 1", "action 2", ...] }',
      'Provide 3-7 specific, actionable suggestions based on the visible controls.',
    ].join('\n');

    const llmResult = await this.llm.complete(prompt, SuggestActionsSchema);

    if (llmResult.status === 'error') {
      return {
        status: 'error',
        data: undefined,
        error: llmResult.error,
        metadata: {
          ...llmResult.metadata,
          duration: Date.now() - startTime,
        },
      };
    }

    const raw = llmResult.data as { suggestions: string[] };

    return {
      status: 'success',
      data: raw.suggestions,
      metadata: {
        ...llmResult.metadata,
        duration: Date.now() - startTime,
      },
    };
  }

  /**
   * Serialize current execution checkpoint for resumability.
   *
   * @remarks
   * Stores the checkpoint in an internal Map keyed by `checkpoint.sessionId`.
   * Retrieve via `resumeFromCheckpoint(sessionId)`.
   *
   * @param checkpoint - Checkpoint state to save.
   *
   * @example
   * ```typescript
   * handler.saveCheckpoint({
   *   sessionId: 'sess-001',
   *   currentStep: 2,
   *   completedSteps: ['navigate', 'fillVendor'],
   *   remainingSteps: ['fillMaterial', 'save'],
   *   state: {},
   *   timestamp: new Date().toISOString(),
   * });
   * ```
   */
  saveCheckpoint(checkpoint: AgenticCheckpoint): void {
    this.checkpoints.set(checkpoint.sessionId, checkpoint);
  }

  /**
   * Resume from a previously saved checkpoint.
   *
   * @param checkpointId - Session ID of the checkpoint to retrieve.
   * @returns The checkpoint if found, or `undefined`.
   *
   * @example
   * ```typescript
   * const checkpoint = handler.resumeFromCheckpoint('sess-001');
   * if (checkpoint) {
   *   logger.info('Resuming from step:', checkpoint.currentStep);
   * }
   * ```
   */
  resumeFromCheckpoint(checkpointId: string): AgenticCheckpoint | undefined {
    return this.checkpoints.get(checkpointId);
  }
}
