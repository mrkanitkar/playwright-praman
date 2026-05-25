/**
 * @license
 * Copyright (c) ZesTest 2025-2030. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0
 *
 * This file may contain AI-assisted code.
 * See LICENSE and NOTICE files for details.
 */

/**
 * AI response envelope and domain types for the Praman AI layer.
 *
 * @remarks
 * All types in this module are `readonly` and suitable for use in strict
 * TypeScript. The `AiResponse<T>` discriminated union enables safe narrowing
 * on `status` without casting.
 *
 * @module ai
 */

import type { CapabilityCategory, CapabilityEntry } from './schemas/capability.schema.js';

// ── AI Response Envelope ───────────────────────────────────────────────────

/**
 * Metadata attached to every AI response regardless of status.
 *
 * @intent Track performance and provide self-healing hints.
 *
 * @example
 * ```typescript
 * const meta: AiResponseMetadata = {
 *   duration: 1200,
 *   retryable: true,
 *   suggestions: ['Reduce token count', 'Switch model'],
 *   model: 'gpt-4o',
 *   tokens: 842,
 * };
 * ```
 */
export interface AiResponseMetadata {
  /** Elapsed time in milliseconds for the AI call. */
  readonly duration: number;
  /** Whether the caller can retry this operation. */
  readonly retryable: boolean;
  /** Human-readable recovery hints for agents and testers. */
  readonly suggestions: string[];
  /** Model identifier used for this request, if available. */
  readonly model?: string;
  /** Total token count consumed, if available. */
  readonly tokens?: number;
}

/**
 * Structured error payload included in non-success AI responses.
 *
 * @intent Provide machine-readable error codes alongside human messages.
 *
 * @example
 * ```typescript
 * const err: AiResponseError = {
 *   code: 'ERR_AI_TOKEN_LIMIT',
 *   message: 'Token limit exceeded for GPT-4o',
 * };
 * ```
 */
export interface AiResponseError {
  /** Machine-readable error code (matches `ErrorCode` pattern). */
  readonly code: string;
  /** Human-readable description of what failed. */
  readonly message: string;
}

/**
 * Discriminated union AI response envelope on `status`.
 *
 * @remarks
 * Narrow on `status` to get type-safe access to `data` and `error`:
 * - `'success'` — `data` is `T`, no `error`
 * - `'error'` — `data` is `undefined`, `error` is populated
 * - `'partial'` — `data` is `Partial<T>`, optional `error`
 *
 * @intent Provide type-safe AI result handling without casting.
 *
 * @example
 * ```typescript
 * function handle<T>(response: AiResponse<T>): T | undefined {
 *   if (response.status === 'success') {
 *     return response.data; // T
 *   }
 *   return undefined;
 * }
 * ```
 */
export type AiResponse<T> =
  | {
      readonly status: 'success';
      readonly data: T;
      readonly metadata: AiResponseMetadata;
    }
  | {
      readonly status: 'error';
      readonly data: undefined;
      readonly error: AiResponseError;
      readonly metadata: AiResponseMetadata;
    }
  | {
      readonly status: 'partial';
      readonly data: Partial<T>;
      readonly error?: AiResponseError;
      readonly metadata: AiResponseMetadata;
    };

// ── AI Provider Names ─────────────────────────────────────────────────────

/**
 * Provider name for AI-specific capability formatting.
 *
 * @remarks
 * Used by {@link CapabilityRegistry.forProvider} to select the output format:
 * - `'claude'` — XML-structured capability descriptions
 * - `'openai'` — JSON registry snapshot
 * - `'gemini'` — JSON registry snapshot
 *
 * @example
 * ```typescript
 * const provider: AiProviderName = 'claude';
 * const formatted = registry.forProvider(provider);
 * ```
 */
export type AiProviderName = 'claude' | 'openai' | 'gemini';

// ── Provider Configuration ─────────────────────────────────────────────────

/**
 * Configuration for an AI provider connection.
 *
 * @intent Supply connection details to LLM service factories.
 * @capability pramanAI.llm
 *
 * @example
 * ```typescript
 * const config: AiProviderConfig = {
 *   provider: 'azure-openai',
 *   model: 'gpt-4o',
 *   endpoint: 'https://my-resource.openai.azure.com/',
 *   temperature: 0.2,
 *   maxTokens: 4096,
 * };
 * ```
 */
export interface AiProviderConfig {
  /** LLM provider identifier. */
  readonly provider: 'azure-openai' | 'openai' | 'anthropic';
  /** API key for OpenAI / Azure OpenAI. */
  readonly apiKey?: string;
  /** API key for Anthropic. */
  readonly anthropicApiKey?: string;
  /** Target model name (e.g. `gpt-4o`, `claude-3-5-sonnet-20241022`). */
  readonly model: string;
  /** Base endpoint URL (required for Azure OpenAI deployments). */
  readonly endpoint?: string;
  /** Sampling temperature (0.0–2.0). Lower = more deterministic. */
  readonly temperature: number;
  /** Maximum tokens for the completion (provider default if omitted). */
  readonly maxTokens?: number;
}

// ── Capability Entry (derived from Zod schema) ──────────────────────────

/**
 * Re-exported from the Zod schema — this is the single source of truth.
 *
 * @remarks
 * The `CapabilityEntry` type is derived from `CapabilityEntrySchema` via
 * `z.infer<>`. All validation and shape definition lives in the schema.
 *
 * @see {@link CapabilityEntrySchema} in `./schemas/capability.schema.js`
 *
 * @example
 * ```typescript
 * const entry: CapabilityEntry = {
 *   id: 'UI5-TABLE-001',
 *   qualifiedName: 'ui5.table.detectType',
 *   name: 'detectType',
 *   description: 'Detects the table type and returns metadata.',
 *   category: 'table',
 *   priority: 'fixture',
 *   usageExample: "const info = await ui5.table.detectType('orderTable');",
 *   registryVersion: 1,
 * };
 * ```
 */
export type {
  CapabilityEntry,
  CapabilityCategory,
  CapabilityPriority,
} from './schemas/capability.schema.js';

/**
 * Statistical summary of the capability registry.
 *
 * @intent Provide a quick overview of registered capabilities for dashboards and AI agents.
 *
 * @example
 * ```typescript
 * const stats = registry.getStatistics();
 * logger.info(`Total: ${stats.totalMethods}, Categories: ${stats.categories.join(', ')}`);
 * ```
 */
export interface CapabilityStats {
  /** Total number of registered capability entries. */
  readonly totalMethods: number;
  /** Deduplicated list of category names across all entries. */
  readonly categories: readonly CapabilityCategory[];
  /** ISO 8601 timestamp when the statistics were generated. */
  readonly generatedAt: string;
  /** Package version string. */
  readonly version: string;
  /** Breakdown of entries by priority tier. */
  readonly byPriority: {
    readonly fixture: number;
    readonly namespace: number;
    readonly implementation: number;
  };
}

/**
 * Full JSON export of the capability registry for AI agent consumption.
 *
 * @intent Provide a structured, serialisable snapshot of all capabilities.
 *
 * @example
 * ```typescript
 * const json = registry.toJSON();
 * const prompt = JSON.stringify(json);
 * ```
 */
export interface CapabilitiesJSON {
  /** Package name. */
  readonly name: string;
  /** Package version. */
  readonly version: string;
  /** ISO 8601 timestamp when the export was generated. */
  readonly generatedAt: string;
  /** Total number of registered capability entries. */
  readonly totalMethods: number;
  /** Breakdown of entries by priority tier. */
  readonly byPriority: {
    readonly fixture: number;
    readonly namespace: number;
    readonly implementation: number;
  };
  /** Entries with `priority === 'fixture'` (listed first per Playwright best practice). */
  readonly fixtures: readonly CapabilityEntry[];
  /** All registered entries. */
  readonly methods: readonly CapabilityEntry[];
}

// ── Recipe Entry (derived from Zod schema) ──────────────────────────────

/**
 * Re-exported from the Zod schema — this is the single source of truth.
 *
 * @see {@link RecipeEntrySchema} in `./schemas/recipe.schema.js`
 *
 * @example
 * ```typescript
 * const entry: RecipeEntry = {
 *   id: 'recipe-ui5-button-click',
 *   name: 'Button Click',
 *   description: 'Press a UI5 button by matching its text property.',
 *   domain: 'ui5',
 *   priority: 'essential',
 *   capabilities: ['UI5-UI5-003'],
 *   pattern: "await ui5.click({ controlType: 'sap.m.Button', properties: { text: 'Save' } });",
 * };
 * ```
 */
export type { RecipeEntry, RecipePriority } from './schemas/recipe.schema.js';

// ── Agentic Checkpoint ─────────────────────────────────────────────────────

/**
 * Checkpoint state for long-running agentic test generation sessions.
 *
 * @remarks
 * **Beta** — serialization format may change in minor releases.
 *
 * Serializable to JSON via `JSON.stringify()`. The JSON shape is:
 * ```json
 * {
 *   "sessionId": "string (UUID recommended)",
 *   "currentStep": "number (0-based index)",
 *   "completedSteps": ["string[]"],
 *   "remainingSteps": ["string[]"],
 *   "state": { "arbitrary JSON-safe key/value pairs" },
 *   "timestamp": "string (ISO 8601)"
 * }
 * ```
 *
 * Persist with `JSON.stringify(checkpoint)` and restore with
 * `JSON.parse(stored) as AgenticCheckpoint`. All fields are `readonly`
 * — create a new object to update.
 *
 * The `state` record must only contain JSON-serializable values
 * (no functions, Dates, or circular references).
 *
 * @beta
 * @intent Enable resumable multi-step AI test generation workflows.
 *
 * @example
 * ```typescript
 * const checkpoint: AgenticCheckpoint = {
 *   sessionId: 'sess-001',
 *   currentStep: 2,
 *   completedSteps: ['discover', 'plan'],
 *   remainingSteps: ['generate', 'validate'],
 *   state: { pageUrl: 'https://my.app/launchpad' },
 *   timestamp: new Date().toISOString(),
 * };
 *
 * // Persist to disk
 * await fs.writeFile('checkpoint.json', JSON.stringify(checkpoint));
 *
 * // Restore
 * const restored = JSON.parse(await fs.readFile('checkpoint.json', 'utf8')) as AgenticCheckpoint;
 * handler.saveCheckpoint(restored);
 * ```
 */
export interface AgenticCheckpoint {
  /** Unique session identifier (UUID recommended). */
  readonly sessionId: string;
  /** Index of the currently executing step (0-based). */
  readonly currentStep: number;
  /** Ordered list of step names that have already completed. */
  readonly completedSteps: string[];
  /** Ordered list of step names yet to execute. */
  readonly remainingSteps: string[];
  /** Arbitrary serializable step state (JSON-safe). */
  readonly state: Record<string, unknown>;
  /** ISO 8601 timestamp when this checkpoint was created. */
  readonly timestamp: string;
}

// ── Page Context ───────────────────────────────────────────────────────────

/**
 * A single UI5 control discovered during page analysis.
 *
 * @intent Represent discovered controls for AI-driven selector generation.
 * @capability pramanAI.discoverPage
 * @sapModule sap.ui.core.Control
 *
 * @example
 * ```typescript
 * const control: DiscoveredControl = {
 *   id: 'mainSubmitBtn',
 *   controlType: 'sap.m.Button',
 *   category: 'interactive',
 *   visible: true,
 *   text: 'Submit',
 * };
 * ```
 */
export interface DiscoveredControl {
  /** UI5 control ID (from `control.getId()`). */
  readonly id: string;
  /** Fully-qualified UI5 control type (e.g. `sap.m.Button`). */
  readonly controlType: string;
  /** Semantic category of the control. */
  readonly category: 'interactive' | 'container' | 'navigation' | 'unknown';
  /** Optional object category for Fiori object-page controls. */
  readonly objectCategory?: string;
  /** Whether the control is currently visible in the DOM. */
  readonly visible: boolean;
  /** Display text if available (button label, input value, etc.). */
  readonly text?: string;
  /** Additional control-specific properties. */
  readonly properties?: Record<string, unknown>;
}

/**
 * Full page context snapshot used as AI input for test generation.
 *
 * @remarks
 * Built by `buildPageContext()` / `discoverPage()` after `waitForUI5Stable()`.
 * All arrays are partitioned views of the same discovered controls.
 *
 * @intent Provide structured page state for LLM-driven test authoring.
 * @capability pramanAI.buildContext
 *
 * @example
 * ```typescript
 * const ctx: PageContext = {
 *   url: 'https://my.fiori.app/launchpad',
 *   ui5Version: '1.120.3',
 *   controls: [...],
 *   formFields: [...],
 *   buttons: [...],
 *   tables: [...],
 *   navigationElements: [...],
 *   timestamp: new Date().toISOString(),
 * };
 * ```
 */
export interface PageContext {
  /** Current page URL at time of discovery. */
  readonly url: string;
  /** UI5 framework version detected on the page, if available. */
  readonly ui5Version?: string;
  /** All discovered controls on the page. */
  readonly controls: DiscoveredControl[];
  /** Controls classified as form fields (inputs, selects, etc.). */
  readonly formFields: DiscoveredControl[];
  /** Controls classified as buttons or clickable triggers. */
  readonly buttons: DiscoveredControl[];
  /** Controls classified as data tables or lists. */
  readonly tables: DiscoveredControl[];
  /** Controls classified as navigation elements (links, tiles, etc.). */
  readonly navigationElements: DiscoveredControl[];
  /** ISO 8601 timestamp when the page context was captured. */
  readonly timestamp: string;
  /**
   * Aria snapshot of the page for AI grounding (Playwright 1.60+). Includes
   * element references (`[ref=e2]`), `<iframe>` snapshots (`mode:'ai'`), and
   * bounding boxes (`[box=x,y,w,h]`). Absent when Playwright lacks aria
   * snapshots, when `ai.includeAriaSnapshot` is `false`, or when capture fails.
   */
  readonly ariaSnapshot?: string;
}

// ── AI Generated Test ──────────────────────────────────────────────────────

/**
 * Result of `AgenticHandler.generateTest()` — a fully generated Playwright test.
 *
 * @remarks
 * `steps` contains natural-language descriptions of each step.
 * `code` contains the generated TypeScript/Playwright code.
 * `metadata` carries provenance for debugging and auditing.
 *
 * @intent Hold the output of an AI-generated Playwright test including code and provenance.
 * @capability pramanAI.agentic
 *
 * @example
 * ```typescript
 * const result: AiGeneratedTest = {
 *   steps: ['Navigate to app', 'Fill form', 'Submit'],
 *   code: "test('example', async ({ ui5 }) => { ... })",
 *   metadata: {
 *     model: 'gpt-4o',
 *     tokens: { input: 1200, output: 340 },
 *     duration: 1850,
 *     capabilities: ['click-button', 'fill-input'],
 *   },
 * };
 * ```
 */
export interface AiGeneratedTest {
  /** Natural-language description of each test step in order. */
  readonly steps: string[];
  /** Generated TypeScript/Playwright test code. */
  readonly code: string;
  /** Provenance and cost metadata for the generation. */
  readonly metadata: {
    /** Model used for generation. */
    readonly model: string;
    /** Token usage breakdown. */
    readonly tokens: {
      readonly input: number;
      readonly output: number;
    };
    /** Duration in milliseconds for the LLM call. */
    readonly duration: number;
    /** Capability IDs referenced during generation. */
    readonly capabilities: string[];
  };
}
