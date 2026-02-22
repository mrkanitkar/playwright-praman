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
 * - `'openai'` — JSON function-calling tool schemas
 * - `'gemini'` — Plain text capability listing
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
 * @capability AI provider selection, model routing.
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

// ── Capability Registry ────────────────────────────────────────────────────

/**
 * A single entry in the capability registry exposed to AI agents.
 *
 * @remarks
 * Generated entries are produced by `npm run generate:capabilities` and
 * written to `capability-registry.generated.ts`. Manual entries can be
 * registered via `CapabilityRegistry.register()`.
 *
 * @intent Describe a Praman API capability for AI-driven test generation.
 * @capability AI agent context, test scaffolding.
 * @sapModule Any Praman module that exposes a test helper.
 *
 * @example
 * ```typescript
 * const entry: CapabilityEntry = {
 *   id: 'click-button',
 *   name: 'clickButton',
 *   description: 'Clicks a UI5 button by selector',
 *   category: 'interaction',
 *   intent: 'click',
 *   sapModule: 'sap.m.Button',
 *   usage_example: "await ui5.click({ id: 'submitBtn' })",
 *   registryVersion: 1,
 * };
 * ```
 */
export interface CapabilityEntry {
  /** Unique kebab-case identifier for this capability. */
  readonly id: string;
  /** Human-readable function or method name. */
  readonly name: string;
  /** One-sentence description of what this capability does. */
  readonly description: string;
  /** Logical grouping for filtering (e.g. `'interaction'`, `'navigation'`). */
  readonly category: string;
  /** Optional intent tag from TSDoc `@intent`. */
  readonly intent?: string;
  /** Optional SAP UI5 module tag from TSDoc `@sapModule`. */
  readonly sapModule?: string;
  /** Ready-to-run usage example string. */
  readonly usage_example: string;
  /** Registry schema version for forward compatibility. */
  readonly registryVersion: number;
  /**
   * Priority tier for API surface stratification.
   *
   * @remarks
   * - `'fixture'` — Primary Playwright fixture (recommended for consumers)
   * - `'namespace'` — Secondary utility / handler export
   * - `'implementation'` — Internal implementation detail
   */
  readonly priority?: 'fixture' | 'namespace' | 'implementation';
}

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
  readonly categories: readonly string[];
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

// ── Recipe Registry ────────────────────────────────────────────────────────

/**
 * Priority level indicating how important a recipe is for adoption.
 *
 * @remarks
 * - `essential` — Must-know patterns for any SAP Fiori test suite.
 * - `recommended` — Best-practice patterns for common scenarios.
 * - `advanced` — Specialized patterns for complex edge cases.
 * - `deprecated` — Superseded patterns kept for backward compatibility.
 *
 * @example
 * ```typescript
 * const priority: RecipePriority = 'essential';
 * ```
 */
export type RecipePriority = 'essential' | 'recommended' | 'advanced' | 'deprecated';

/**
 * A single recipe entry describing a reusable test pattern.
 *
 * @remarks
 * Recipes are curated test patterns that AI agents can emit verbatim or
 * adapt. `role` indicates who the recipe is primarily designed for.
 * `priority` indicates how important it is for adoption.
 *
 * @intent Provide reusable SAP Fiori test patterns for AI generation.
 * @capability AI recipe lookup, test scaffolding, human reference.
 *
 * @example
 * ```typescript
 * const entry: RecipeEntry = {
 *   id: 'login-sap-cloud',
 *   title: 'Login to SAP BTP via SAML',
 *   description: 'Authenticates against SAP BTP using cloud SAML strategy',
 *   category: 'auth',
 *   role: 'both',
 *   priority: 'essential',
 *   code: "await auth.loginCloud({ user: process.env.SAP_USER! })",
 *   tags: ['auth', 'saml', 'btp'],
 * };
 * ```
 */
export interface RecipeEntry {
  /** Unique kebab-case identifier for this recipe. */
  readonly id: string;
  /** Short descriptive title shown in documentation and AI context. */
  readonly title: string;
  /** One or two sentence explanation of what this recipe demonstrates. */
  readonly description: string;
  /** Category for grouping and filtering (e.g. `'auth'`, `'navigation'`). */
  readonly category: string;
  /** Who this recipe is intended for. */
  readonly role: 'ai-agent' | 'human-tester' | 'both';
  /** Priority level for adoption guidance. */
  readonly priority: RecipePriority;
  /** Ready-to-use TypeScript code for the recipe. */
  readonly code: string;
  /** Free-form tags for semantic search. */
  readonly tags: string[];
}

// ── Agentic Checkpoint ─────────────────────────────────────────────────────

/**
 * Checkpoint state for long-running agentic test generation sessions.
 *
 * @remarks
 * Serializable to JSON for persistence across process restarts.
 * `state` holds arbitrary step-specific data.
 *
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
 * @capability Control discovery, AI page context.
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
 * @capability AI context building, page discovery.
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
 * @capability AI test generation, agentic workflow.
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
