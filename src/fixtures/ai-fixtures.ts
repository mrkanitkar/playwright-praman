/**
 * AI fixtures — provides `pramanAI` fixture for AI-powered test operations.
 *
 * @remarks
 * Extends the Playwright base test with a `pramanAI` fixture that wires up the
 * full AI stack: LLM service, capability registry, recipe registry, vocabulary
 * service, and agentic handler. All modules are loaded via dynamic import
 * so their optional peer dependencies are never required unless AI is used.
 *
 * Cross-fixture dependencies (`pramanConfig`, `page`) are declared as `option`
 * placeholders (PW-MERGE-1) so they can be provided by `coreTest` via
 * `mergeTests()`.
 *
 * LLM teardown (`llm.close()`) runs in a `try/catch` so connection errors
 * during teardown are non-fatal.
 *
 * @example
 * ```typescript
 * import { aiTest } from 'playwright-praman';
 *
 * aiTest('AI page discovery', async ({ pramanAI }) => {
 *   const context = await pramanAI.buildContext();
 *   if (context.status === 'success') {
 *     const suggestions = await pramanAI.agentic.suggestActions(context.data);
 *   }
 * });
 * ```
 *
 * @module fixtures
 */

import { test as base } from '@playwright/test';

import type { AgenticHandler } from '../ai/agentic-handler.js';
import type { DiscoverPageOptions } from '../ai/bulk-discovery.js';
import type { CapabilityRegistry } from '../ai/capability-registry.js';
import type { LlmService } from '../ai/llm-service.js';
import type { RecipeRegistry } from '../ai/recipe-registry.js';
import type { AiResponse, PageContext } from '../ai/types.js';
import type { PramanConfig } from '../core/config/schema.js';
import type { VocabularyService } from '../vocabulary/types.js';

// ── Public fixture type ─────────────────────────────────────────────────────

/**
 * The `pramanAI` fixture object provided to AI-enabled Playwright tests.
 *
 * @remarks
 * Exposes the complete AI stack: discovery, capability/recipe registries,
 * agentic handler, LLM service, context builder, and vocabulary service.
 *
 * @intent Provide unified AI capabilities to Playwright tests via a single fixture.
 * @capability ai-fixture, ai-context-building, ai-agentic-handler
 *
 * @example
 * ```typescript
 * aiTest('generate test', async ({ pramanAI }) => {
 *   const result = await pramanAI.agentic.generateTest('create PO', page);
 * });
 * ```
 */
export interface PramanAIFixture {
  /**
   * Discovers all UI5 controls on the current page.
   *
   * @param options - Optional discovery configuration.
   * @returns `AiResponse<PageContext>` with discovered controls.
   *
   * @example
   * ```typescript
   * const ctx = await pramanAI.discoverPage({ interactiveOnly: true });
   * ```
   */
  discoverPage: (options?: DiscoverPageOptions) => Promise<AiResponse<PageContext>>;

  /** Pre-loaded capability registry for AI prompt construction. */
  capabilities: CapabilityRegistry;

  /** Pre-loaded recipe registry for AI test pattern examples. */
  recipes: RecipeRegistry;

  /** Agentic handler for autonomous test generation and step execution. */
  agentic: AgenticHandler;

  /** Raw LLM service for direct prompting (advanced usage). */
  llm: LlmService;

  /**
   * Builds enriched page context with UI5 version for the current page.
   *
   * @returns `AiResponse<PageContext>` including UI5 version if detected.
   *
   * @example
   * ```typescript
   * const ctx = await pramanAI.buildContext();
   * if (ctx.status === 'success') { logger.info(ctx.data.ui5Version); }
   * ```
   */
  buildContext: () => Promise<AiResponse<PageContext>>;

  /** Vocabulary service for business term resolution. */
  vocabulary: VocabularyService;
}

/** Worker-level dependencies provided by coreTest via mergeTests. */
export interface AIWorkerDeps {
  /** Readonly Praman configuration (PW-MERGE-1 placeholder). */
  pramanConfig: Readonly<PramanConfig>;
}

/** Test fixture map for the aiTest extension. */
export interface AIFixtures {
  /** AI stack fixture for AI-powered test operations. */
  pramanAI: PramanAIFixture;
}

// ── Fixture definition ──────────────────────────────────────────────────────

/**
 * Playwright test object extended with the `pramanAI` fixture.
 *
 * @remarks
 * Extends the base Playwright test with `pramanAI`. Cross-fixture dependencies
 * (`pramanConfig`, `page`) are injected at runtime via `mergeTests()`. All AI
 * module imports are dynamic so the optional AI peer dependencies are resolved
 * at runtime, not at module load.
 *
 * @intent Expose AI capabilities to Playwright tests
 * @capability ai-fixture
 *
 * @example
 * ```typescript
 * import { aiTest } from 'playwright-praman';
 *
 * aiTest('AI-powered test', async ({ pramanAI }) => {
 *   const ctx = await pramanAI.buildContext();
 * });
 * ```
 */
export const aiTest = base.extend<AIFixtures, AIWorkerDeps>({
  // ── Cross-fixture option placeholders (PW-MERGE-1) ──────────────────────
  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion -- PW-MERGE-1: placeholder overridden by mergeTests
  pramanConfig: [undefined!, { option: true, scope: 'worker' }],

  // ── pramanAI fixture ─────────────────────────────────────────────────────
  pramanAI: async ({ pramanConfig, page }, use) => {
    const [aiModule, vocabModule] = await Promise.all([
      import('#ai/index.js'),
      import('#vocabulary/index.js'),
    ]);

    const {
      createLlmService,
      CapabilityRegistry,
      RecipeRegistry,
      AgenticHandler,
      discoverPage,
      buildPageContext,
    } = aiModule;

    const { createVocabularyService } = vocabModule;

    const llm = createLlmService(pramanConfig);
    const capabilities = new CapabilityRegistry();
    const recipes = new RecipeRegistry();
    const vocabulary = createVocabularyService();
    const agentic = new AgenticHandler(llm, buildPageContext, capabilities, recipes);
    // Type assertion: Playwright Page structurally satisfies DiscoveryPage (url() + evaluate())
    // but the fixture's inferred page type from mergeTests is narrower than the import-time Page
    const discoveryPage = page as unknown as Parameters<typeof discoverPage>[0];

    await use({
      discoverPage: async (opts?: DiscoverPageOptions) => discoverPage(discoveryPage, opts),
      capabilities,
      recipes,
      agentic,
      llm,
      buildContext: async () => buildPageContext(discoveryPage, pramanConfig),
      vocabulary,
    });

    try {
      await llm.close();
    } catch {
      // Non-fatal — LLM teardown failure should not fail the test
    }
  },
});
