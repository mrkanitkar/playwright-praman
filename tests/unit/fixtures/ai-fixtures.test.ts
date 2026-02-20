/**
 * Tests for `src/fixtures/ai-fixtures.ts` — AI Playwright fixtures.
 *
 * @remarks
 * Uses vitest with mocked `@playwright/test`, `#ai/index.js`, and
 * `#vocabulary/index.js`. Fixture definitions are captured via
 * `createMockTestExtend()` and executed directly to verify behavior
 * without requiring a Playwright test runner.
 *
 * @module fixtures
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  createMockExpectExtend,
  createMockTestExtend,
} from '../../helpers/mock-playwright-test.js';

// ── Shared mock state — must be accessible by both hoisted vi.mock and tests ──
// vi.mock factories are hoisted; vi.hoisted() runs before the factory.
const mocks = vi.hoisted(() => {
  const llmClose = vi.fn().mockResolvedValue(undefined);
  const llmChat = vi.fn();
  const llmComplete = vi.fn();
  const llmIsConfigured = vi.fn().mockReturnValue(true);
  const llmService = {
    chat: llmChat,
    complete: llmComplete,
    isConfigured: llmIsConfigured,
    close: llmClose,
  };
  const createLlmService = vi.fn().mockReturnValue(llmService);

  const capabilityRegistry = {
    list: vi.fn().mockReturnValue([]),
    byCategory: vi.fn().mockReturnValue([]),
    find: vi.fn().mockReturnValue([]),
    forAI: vi.fn().mockReturnValue([]),
    get: vi.fn().mockReturnValue(undefined),
    has: vi.fn().mockReturnValue(false),
    register: vi.fn(),
  };
  // Use class syntax so `new CapabilityRegistry()` works (classes are valid constructors)
  // eslint-disable-next-line @typescript-eslint/no-extraneous-class
  class CapabilityRegistry {
    constructor() {
      return capabilityRegistry;
    }
  }

  const recipeRegistry = {
    getTopRecipes: vi.fn().mockReturnValue([]),
    addRecipe: vi.fn(),
    list: vi.fn().mockReturnValue([]),
  };
  // eslint-disable-next-line @typescript-eslint/no-extraneous-class
  class RecipeRegistry {
    constructor() {
      return recipeRegistry;
    }
  }

  const agenticHandler = {
    generateTest: vi.fn(),
    interpretStep: vi.fn(),
    suggestActions: vi.fn(),
    saveCheckpoint: vi.fn(),
    resumeFromCheckpoint: vi.fn(),
    _constructorArgs: null as unknown[] | null,
  };
  // eslint-disable-next-line @typescript-eslint/no-extraneous-class
  class AgenticHandler {
    constructor(...args: unknown[]) {
      agenticHandler._constructorArgs = args;
      return agenticHandler;
    }
  }

  const discoverPage = vi
    .fn()
    .mockResolvedValue({ status: 'success', data: {}, metadata: { duration: 0 } });
  const buildPageContext = vi
    .fn()
    .mockResolvedValue({ status: 'success', data: {}, metadata: { duration: 0 } });

  const vocabularyService = {
    search: vi.fn().mockResolvedValue([]),
    loadDomain: vi.fn().mockResolvedValue(undefined),
    getStats: vi
      .fn()
      .mockReturnValue({ loadedDomains: [], totalTerms: 0, cacheHits: 0, cacheMisses: 0 }),
    resolve: vi.fn().mockResolvedValue(null),
  };
  const createVocabularyService = vi.fn().mockReturnValue(vocabularyService);

  return {
    llmService,
    llmClose,
    llmIsConfigured,
    createLlmService,
    capabilityRegistry,
    CapabilityRegistry,
    recipeRegistry,
    RecipeRegistry,
    agenticHandler,
    AgenticHandler,
    discoverPage,
    buildPageContext,
    vocabularyService,
    createVocabularyService,
  };
});

// ── Mock #ai/index.js ─────────────────────────────────────────────────
vi.mock('#ai/index.js', () => ({
  createLlmService: mocks.createLlmService,
  CapabilityRegistry: mocks.CapabilityRegistry,
  RecipeRegistry: mocks.RecipeRegistry,
  AgenticHandler: mocks.AgenticHandler,
  discoverPage: mocks.discoverPage,
  buildPageContext: mocks.buildPageContext,
}));

// ── Mock #vocabulary/index.js ─────────────────────────────────────────
vi.mock('#vocabulary/index.js', () => ({
  createVocabularyService: mocks.createVocabularyService,
}));

// ── Mock Playwright ───────────────────────────────────────────────────
const mockTestExtend = createMockTestExtend();
const mockExpectExtend = createMockExpectExtend();

vi.mock('@playwright/test', () => ({
  test: {
    extend: mockTestExtend,
    step: vi.fn().mockImplementation(async (_title: string, fn: () => Promise<unknown>) => fn()),
  },
  expect: {
    extend: mockExpectExtend,
  },
}));

// ── Mock Playwright page ──────────────────────────────────────────────
const mockPage = {
  evaluate: vi.fn().mockResolvedValue(undefined),
  waitForFunction: vi.fn().mockResolvedValue(undefined),
  url: vi.fn().mockReturnValue('https://example.com/fiori'),
};

// ── Mock config ───────────────────────────────────────────────────────
const mockConfig = Object.freeze({
  logLevel: 'info',
  controlDiscoveryTimeout: 30_000,
});

// ── Import after mocks ────────────────────────────────────────────────
const { aiTest } = await import('#fixtures/ai-fixtures.js');

// ── Helpers ───────────────────────────────────────────────────────────

/**
 * Extracts the fixture function from a fixture definition.
 *
 * @param definition - The fixture definition from `_fixtureDefinitions`
 * @returns The fixture function
 *
 * @example
 * ```typescript
 * const fn = extractFixtureFn(fixtures['pramanAI']);
 * ```
 */
function extractFixtureFn(definition: unknown): (...args: any[]) => Promise<void> {
  if (Array.isArray(definition)) {
    return definition[0] as (...args: any[]) => Promise<void>;
  }
  return definition as (...args: any[]) => Promise<void>;
}

/**
 * Extracts fixture options from a fixture definition tuple.
 *
 * @param definition - The fixture definition from `_fixtureDefinitions`
 * @returns The fixture options or undefined if bare function
 *
 * @example
 * ```typescript
 * const opts = extractFixtureOptions(fixtures['pramanConfig']);
 * ```
 */
function extractFixtureOptions(definition: unknown): Record<string, unknown> | undefined {
  if (Array.isArray(definition) && definition.length > 1) {
    return definition[1] as Record<string, unknown>;
  }
  return undefined;
}

/**
 * Simulates Playwright's `use()` callback for fixture testing.
 *
 * @param fn - The fixture function to execute
 * @param deps - Dependencies to pass as the first argument
 * @returns The value passed to `use()`
 *
 * @example
 * ```typescript
 * const ai = await runFixture<PramanAIFixture>(fixtureFn, { page: mockPage, pramanConfig: mockConfig });
 * ```
 */
async function runFixture<T>(
  fn: (deps: Record<string, unknown>, use: (value: T) => Promise<void>) => Promise<void>,
  deps: Record<string, unknown>,
): Promise<T> {
  let captured: T | undefined;
  const useFn = async (value: T): Promise<void> => {
    captured = value;
    await Promise.resolve();
  };
  await fn(deps, useFn);
  return captured as T;
}

// ── Fixture definitions reference ─────────────────────────────────────
const fixtures = (aiTest as unknown as { _fixtureDefinitions: Record<string, unknown> })
  ._fixtureDefinitions;

// ── Reset helper ──────────────────────────────────────────────────────

/**
 * Resets all mock defaults between tests.
 *
 * @example
 * ```typescript
 * beforeEach(() => { resetAllMockDefaults(); });
 * ```
 */
function resetAllMockDefaults(): void {
  vi.clearAllMocks();
  mocks.llmClose.mockResolvedValue(undefined);
  mocks.llmIsConfigured.mockReturnValue(true);
  mocks.createLlmService.mockReturnValue(mocks.llmService);
  mocks.createVocabularyService.mockReturnValue(mocks.vocabularyService);
  mocks.discoverPage.mockResolvedValue({ status: 'success', data: {}, metadata: { duration: 0 } });
  mocks.buildPageContext.mockResolvedValue({
    status: 'success',
    data: {},
    metadata: { duration: 0 },
  });
  mocks.agenticHandler._constructorArgs = null;
}

// ── Tests ─────────────────────────────────────────────────────────────

describe('ai-fixtures fixture definitions', () => {
  beforeEach(() => {
    resetAllMockDefaults();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('pramanConfig option placeholder (PW-MERGE-1)', () => {
    it('pramanConfig is registered as a fixture definition', () => {
      expect(fixtures).toHaveProperty('pramanConfig');
    });

    it('pramanConfig is an option fixture with scope worker', () => {
      const opts = extractFixtureOptions(fixtures['pramanConfig']);
      expect(opts).toBeDefined();
      expect(opts?.['option']).toBe(true);
      expect(opts?.['scope']).toBe('worker');
    });
  });

  describe('pramanAI fixture', () => {
    it('is registered as a fixture definition', () => {
      expect(fixtures).toHaveProperty('pramanAI');
    });

    it('provides all required methods and sub-objects', async () => {
      const fn = extractFixtureFn(fixtures['pramanAI']);
      const ai = await runFixture<Record<string, unknown>>(fn, {
        page: mockPage,
        pramanConfig: mockConfig,
      });

      expect(ai).toBeDefined();
      expect(typeof ai['discoverPage']).toBe('function');
      expect(typeof ai['buildContext']).toBe('function');
      expect(ai['capabilities']).toBeDefined();
      expect(ai['recipes']).toBeDefined();
      expect(ai['agentic']).toBeDefined();
      expect(ai['llm']).toBeDefined();
      expect(ai['vocabulary']).toBeDefined();
    });

    it('creates LlmService from pramanConfig', async () => {
      const fn = extractFixtureFn(fixtures['pramanAI']);
      await runFixture<Record<string, unknown>>(fn, {
        page: mockPage,
        pramanConfig: mockConfig,
      });

      expect(mocks.createLlmService).toHaveBeenCalledOnce();
      expect(mocks.createLlmService).toHaveBeenCalledWith(mockConfig);
    });

    it('creates VocabularyService', async () => {
      const fn = extractFixtureFn(fixtures['pramanAI']);
      await runFixture<Record<string, unknown>>(fn, {
        page: mockPage,
        pramanConfig: mockConfig,
      });

      expect(mocks.createVocabularyService).toHaveBeenCalledOnce();
    });

    it('exposes the llmService as llm', async () => {
      const fn = extractFixtureFn(fixtures['pramanAI']);
      const ai = await runFixture<Record<string, unknown>>(fn, {
        page: mockPage,
        pramanConfig: mockConfig,
      });

      expect(ai['llm']).toBe(mocks.llmService);
    });

    it('exposes the capabilityRegistry as capabilities', async () => {
      const fn = extractFixtureFn(fixtures['pramanAI']);
      const ai = await runFixture<Record<string, unknown>>(fn, {
        page: mockPage,
        pramanConfig: mockConfig,
      });

      expect(ai['capabilities']).toBe(mocks.capabilityRegistry);
    });

    it('exposes the recipeRegistry as recipes', async () => {
      const fn = extractFixtureFn(fixtures['pramanAI']);
      const ai = await runFixture<Record<string, unknown>>(fn, {
        page: mockPage,
        pramanConfig: mockConfig,
      });

      expect(ai['recipes']).toBe(mocks.recipeRegistry);
    });

    it('exposes the agenticHandler as agentic', async () => {
      const fn = extractFixtureFn(fixtures['pramanAI']);
      const ai = await runFixture<Record<string, unknown>>(fn, {
        page: mockPage,
        pramanConfig: mockConfig,
      });

      expect(ai['agentic']).toBe(mocks.agenticHandler);
    });

    it('exposes the vocabularyService as vocabulary', async () => {
      const fn = extractFixtureFn(fixtures['pramanAI']);
      const ai = await runFixture<Record<string, unknown>>(fn, {
        page: mockPage,
        pramanConfig: mockConfig,
      });

      expect(ai['vocabulary']).toBe(mocks.vocabularyService);
    });

    it('AgenticHandler is constructed with llm, buildPageContext, capabilities, recipes', async () => {
      const fn = extractFixtureFn(fixtures['pramanAI']);
      await runFixture<Record<string, unknown>>(fn, {
        page: mockPage,
        pramanConfig: mockConfig,
      });

      const args = mocks.agenticHandler._constructorArgs;
      expect(args).not.toBeNull();
      // args[0] = llm, args[1] = buildPageContext, args[2] = capabilities, args[3] = recipes
      expect(args?.[0]).toBe(mocks.llmService);
      expect(args?.[1]).toBe(mocks.buildPageContext);
      expect(args?.[2]).toBe(mocks.capabilityRegistry);
      expect(args?.[3]).toBe(mocks.recipeRegistry);
    });

    it('discoverPage delegates to discoverPage(page, opts)', async () => {
      const fn = extractFixtureFn(fixtures['pramanAI']);
      const ai = await runFixture<Record<string, unknown>>(fn, {
        page: mockPage,
        pramanConfig: mockConfig,
      });

      const discoverPageFn = ai['discoverPage'] as (opts?: unknown) => Promise<unknown>;
      const opts = { interactiveOnly: true };
      await discoverPageFn(opts);

      expect(mocks.discoverPage).toHaveBeenCalledOnce();
    });

    it('buildContext delegates to buildPageContext(page, pramanConfig)', async () => {
      const fn = extractFixtureFn(fixtures['pramanAI']);
      const ai = await runFixture<Record<string, unknown>>(fn, {
        page: mockPage,
        pramanConfig: mockConfig,
      });

      const buildContextFn = ai['buildContext'] as () => Promise<unknown>;
      await buildContextFn();

      expect(mocks.buildPageContext).toHaveBeenCalledOnce();
    });

    it('calls llm.close() during teardown', async () => {
      const fn = extractFixtureFn(fixtures['pramanAI']);
      await runFixture<Record<string, unknown>>(fn, {
        page: mockPage,
        pramanConfig: mockConfig,
      });

      expect(mocks.llmClose).toHaveBeenCalledOnce();
    });

    it('swallows llm.close() errors without propagating', async () => {
      mocks.llmClose.mockRejectedValue(new Error('Connection reset'));

      const fn = extractFixtureFn(fixtures['pramanAI']);
      await expect(
        runFixture<Record<string, unknown>>(fn, {
          page: mockPage,
          pramanConfig: mockConfig,
        }),
      ).resolves.toBeDefined();
    });
  });
});
