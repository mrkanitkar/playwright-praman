/**
 * Unit tests for `src/ai/agentic-handler.ts`.
 *
 * @remarks
 * All tests are hermetic — LlmService, CapabilityRegistry, and buildPageContext
 * are mocked via vi.fn(). No real LLM calls are made.
 */

import { describe, expect, it, vi } from 'vitest';

import { AgenticHandler } from '#ai/agentic-handler.js';
import { CapabilityRegistry } from '#ai/capability-registry.js';
import { RecipeRegistry } from '#ai/recipe-registry.js';
import type { AgenticCheckpoint, AiResponse, CapabilityEntry, PageContext } from '#ai/types.js';

// ── Test helpers ────────────────────────────────────────────────────────────

/** Creates a minimal PageContext for testing. */
function makePageContext(): PageContext {
  return {
    url: 'https://example.com/fiori',
    ui5Version: '1.120.0',
    controls: [],
    formFields: [],
    buttons: [
      {
        id: 'btn-save',
        controlType: 'sap.m.Button',
        category: 'interactive',
        visible: true,
        text: 'Save',
      },
    ],
    tables: [],
    navigationElements: [],
    timestamp: new Date().toISOString(),
  };
}

/** Creates a stub success AiResponse with the given data. */
function makeSuccessResponse<T>(data: T): AiResponse<T> {
  return {
    status: 'success',
    data,
    metadata: {
      duration: 100,
      retryable: false,
      suggestions: [],
      model: 'gpt-4o',
      tokens: 500,
    },
  };
}

/** Creates a stub error AiResponse with the given code and message. */
function makeErrorResponse(code: string, message: string): AiResponse<never> {
  return {
    status: 'error',
    data: undefined,
    error: { code, message },
    metadata: {
      duration: 50,
      retryable: true,
      suggestions: [],
    },
  };
}

/** Creates a mock page object (minimal structural type). */
function makeMockPage(): { evaluate: ReturnType<typeof vi.fn>; url: () => string } {
  return {
    evaluate: vi.fn(),
    url: () => 'https://example.com/fiori',
  };
}

/** Creates a CapabilityRegistry with test entries. */
function makeCapabilityRegistry(...entries: CapabilityEntry[]): CapabilityRegistry {
  const registry = new CapabilityRegistry();
  for (const entry of entries) {
    registry.register(entry);
  }
  return registry;
}

const SAMPLE_CAPABILITY: CapabilityEntry = {
  id: 'fill-field',
  name: 'fillField',
  description: 'Fill a labeled form field',
  category: 'interaction',
  usage_example: "await intent.fillField('Vendor', '100001')",
  registryVersion: 1,
};

const SAMPLE_CAPABILITY_B: CapabilityEntry = {
  id: 'click-button',
  name: 'clickButton',
  description: 'Click a button by text',
  category: 'interaction',
  usage_example: "await intent.clickButton('Save')",
  registryVersion: 1,
};

// ── Tests ────────────────────────────────────────────────────────────────────

describe('AgenticHandler', () => {
  // ── constructor ───────────────────────────────────────────────────────────

  describe('constructor', () => {
    it('creates an instance with 3 required args', () => {
      const llmChat = vi.fn();
      const llmComplete = vi.fn();
      const llmClose = vi.fn().mockResolvedValue(undefined);
      const llmIsConfigured = vi.fn().mockReturnValue(true);
      const contextBuilder = vi.fn().mockResolvedValue(makeSuccessResponse(makePageContext()));
      const registry = makeCapabilityRegistry();
      const handler = new AgenticHandler(
        { chat: llmChat, complete: llmComplete, isConfigured: llmIsConfigured, close: llmClose },
        contextBuilder as never,
        registry,
      );
      expect(handler).toBeInstanceOf(AgenticHandler);
    });

    it('creates an instance with 4 args (including recipeRegistry)', () => {
      const llmChat = vi.fn();
      const llmComplete = vi.fn();
      const llmClose = vi.fn().mockResolvedValue(undefined);
      const llmIsConfigured = vi.fn().mockReturnValue(true);
      const contextBuilder = vi.fn().mockResolvedValue(makeSuccessResponse(makePageContext()));
      const registry = makeCapabilityRegistry();
      const recipes = new RecipeRegistry();
      const handler = new AgenticHandler(
        { chat: llmChat, complete: llmComplete, isConfigured: llmIsConfigured, close: llmClose },
        contextBuilder as never,
        registry,
        recipes,
      );
      expect(handler).toBeInstanceOf(AgenticHandler);
    });
  });

  // ── generateTest ─────────────────────────────────────────────────────────

  describe('generateTest()', () => {
    it('calls llm.chat with system and user messages', async () => {
      const llmChat = vi.fn().mockResolvedValue(
        makeSuccessResponse({
          steps: ['Navigate to app', 'Fill vendor'],
          code: "test('x', async () => { await intent.fillField('Vendor', '100001'); });",
        }),
      );
      const contextBuilder = vi.fn().mockResolvedValue(makeSuccessResponse(makePageContext()));
      const registry = makeCapabilityRegistry(SAMPLE_CAPABILITY, SAMPLE_CAPABILITY_B);
      const handler = new AgenticHandler(
        {
          chat: llmChat,
          complete: vi.fn(),
          isConfigured: vi.fn().mockReturnValue(true),
          close: vi.fn().mockResolvedValue(undefined),
        },
        contextBuilder as never,
        registry,
      );

      await handler.generateTest('Create a PO', makeMockPage() as never);

      expect(llmChat).toHaveBeenCalledOnce();
      const callArgs = llmChat.mock.calls[0] as [unknown[], unknown];
      const messages = callArgs[0] as { role: string; content: string }[];
      expect(messages).toHaveLength(2);
      expect(messages[0]?.role).toBe('system');
      expect(messages[1]?.role).toBe('user');
    });

    it('system prompt includes capability list', async () => {
      const llmChat = vi.fn().mockResolvedValue(
        makeSuccessResponse({
          steps: ['step 1'],
          code: "test('x', async () => { await intent.fillField('Vendor', '100001'); });",
        }),
      );
      const contextBuilder = vi.fn().mockResolvedValue(makeSuccessResponse(makePageContext()));
      const registry = makeCapabilityRegistry(SAMPLE_CAPABILITY, SAMPLE_CAPABILITY_B);
      const handler = new AgenticHandler(
        {
          chat: llmChat,
          complete: vi.fn(),
          isConfigured: vi.fn().mockReturnValue(true),
          close: vi.fn().mockResolvedValue(undefined),
        },
        contextBuilder as never,
        registry,
      );

      await handler.generateTest('create PO', makeMockPage() as never);

      const callArgs = llmChat.mock.calls[0] as [unknown[], unknown];
      const messages = callArgs[0] as { role: string; content: string }[];
      const systemContent = messages[0]?.content ?? '';
      expect(systemContent).toContain('fillField');
      expect(systemContent).toContain('clickButton');
    });

    it('user prompt includes scenario text and page context', async () => {
      const llmChat = vi.fn().mockResolvedValue(
        makeSuccessResponse({
          steps: ['navigate'],
          code: "test('x', async () => { await intent.fillField('Vendor', '100001'); });",
        }),
      );
      const contextBuilder = vi.fn().mockResolvedValue(makeSuccessResponse(makePageContext()));
      const registry = makeCapabilityRegistry(SAMPLE_CAPABILITY);
      const handler = new AgenticHandler(
        {
          chat: llmChat,
          complete: vi.fn(),
          isConfigured: vi.fn().mockReturnValue(true),
          close: vi.fn().mockResolvedValue(undefined),
        },
        contextBuilder as never,
        registry,
      );

      const scenario = 'Create a purchase order for vendor V001';
      await handler.generateTest(scenario, makeMockPage() as never);

      const callArgs = llmChat.mock.calls[0] as [unknown[], unknown];
      const messages = callArgs[0] as { role: string; content: string }[];
      const userContent = messages[1]?.content ?? '';
      expect(userContent).toContain(scenario);
      expect(userContent).toContain('example.com');
    });

    it('returns AiResponse with steps and code on success', async () => {
      const rawData = {
        steps: ['Navigate', 'Fill vendor', 'Save'],
        code: "test('create PO', async ({ intent }) => { await intent.procurement.createPurchaseOrder({...}); });",
      };
      const llmChat = vi.fn().mockResolvedValue(makeSuccessResponse(rawData));
      const contextBuilder = vi.fn().mockResolvedValue(makeSuccessResponse(makePageContext()));
      const registry = makeCapabilityRegistry(SAMPLE_CAPABILITY);
      const handler = new AgenticHandler(
        {
          chat: llmChat,
          complete: vi.fn(),
          isConfigured: vi.fn().mockReturnValue(true),
          close: vi.fn().mockResolvedValue(undefined),
        },
        contextBuilder as never,
        registry,
      );

      const result = await handler.generateTest('create PO', makeMockPage() as never);

      expect(result.status).toBe('success');
      if (result.status === 'success') {
        expect(result.data.steps).toHaveLength(3);
        expect(result.data.steps[0]).toBe('Navigate');
        expect(result.data.code).toContain('create PO');
        expect(result.data.metadata.model).toBe('gpt-4o');
        expect(result.data.metadata.capabilities).toBeInstanceOf(Array);
        expect(result.data.metadata.duration).toBeGreaterThanOrEqual(0);
      }
    });

    it('returns error response when context builder fails', async () => {
      const llmChat = vi.fn();
      const contextBuilder = vi
        .fn()
        .mockResolvedValue(makeErrorResponse('ERR_DISCOVERY_FAILED', 'No UI5 framework detected'));
      const registry = makeCapabilityRegistry(SAMPLE_CAPABILITY);
      const handler = new AgenticHandler(
        {
          chat: llmChat,
          complete: vi.fn(),
          isConfigured: vi.fn().mockReturnValue(true),
          close: vi.fn().mockResolvedValue(undefined),
        },
        contextBuilder as never,
        registry,
      );

      const result = await handler.generateTest('create PO', makeMockPage() as never);

      expect(result.status).toBe('error');
      if (result.status === 'error') {
        expect(result.error.code).toBe('ERR_AI_CONTEXT_BUILD_FAILED');
        expect(result.error.message).toContain('No UI5 framework detected');
      }
      expect(llmChat).not.toHaveBeenCalled();
    });

    it('returns error when LLM call fails', async () => {
      const llmChat = vi
        .fn()
        .mockResolvedValue(makeErrorResponse('ERR_AI_LLM_CALL_FAILED', 'API rate limit exceeded'));
      const contextBuilder = vi.fn().mockResolvedValue(makeSuccessResponse(makePageContext()));
      const registry = makeCapabilityRegistry(SAMPLE_CAPABILITY);
      const handler = new AgenticHandler(
        {
          chat: llmChat,
          complete: vi.fn(),
          isConfigured: vi.fn().mockReturnValue(true),
          close: vi.fn().mockResolvedValue(undefined),
        },
        contextBuilder as never,
        registry,
      );

      const result = await handler.generateTest('create PO', makeMockPage() as never);

      expect(result.status).toBe('error');
      if (result.status === 'error') {
        expect(result.error.code).toBe('ERR_AI_LLM_CALL_FAILED');
      }
    });

    it('returns error with partial-context message when context builder returns partial status', async () => {
      // Cover the `status !== 'error'` branch within `status !== 'success'` block
      const partialResponse: AiResponse<never> = {
        status: 'partial',
        data: undefined as never,
        metadata: {
          duration: 50,
          retryable: true,
          suggestions: [],
        },
      };
      const llmChat = vi.fn();
      const contextBuilder = vi.fn().mockResolvedValue(partialResponse);
      const registry = makeCapabilityRegistry(SAMPLE_CAPABILITY);
      const handler = new AgenticHandler(
        {
          chat: llmChat,
          complete: vi.fn(),
          isConfigured: vi.fn().mockReturnValue(true),
          close: vi.fn().mockResolvedValue(undefined),
        },
        contextBuilder as never,
        registry,
      );

      const result = await handler.generateTest('create PO', makeMockPage() as never);

      expect(result.status).toBe('error');
      if (result.status === 'error') {
        expect(result.error.code).toBe('ERR_AI_CONTEXT_BUILD_FAILED');
        expect(result.error.message).toContain('Partial page context');
      }
      expect(llmChat).not.toHaveBeenCalled();
    });

    it('handles missing tokens in LLM metadata gracefully (defaults to 0)', async () => {
      const rawData = {
        steps: ['Navigate', 'Fill vendor'],
        code: "test('create PO', async ({ intent }) => { await intent.procurement.createPurchaseOrder({vendor:'V001'}); });",
      };
      // Response without tokens field
      const responseNoTokens: AiResponse<typeof rawData> = {
        status: 'success',
        data: rawData,
        metadata: {
          duration: 80,
          retryable: false,
          suggestions: [],
          model: 'gpt-4o',
          // tokens intentionally omitted
        },
      };
      const llmChat = vi.fn().mockResolvedValue(responseNoTokens);
      const contextBuilder = vi.fn().mockResolvedValue(makeSuccessResponse(makePageContext()));
      const registry = makeCapabilityRegistry(SAMPLE_CAPABILITY);
      const handler = new AgenticHandler(
        {
          chat: llmChat,
          complete: vi.fn(),
          isConfigured: vi.fn().mockReturnValue(true),
          close: vi.fn().mockResolvedValue(undefined),
        },
        contextBuilder as never,
        registry,
      );

      const result = await handler.generateTest('create PO', makeMockPage() as never);

      expect(result.status).toBe('success');
      if (result.status === 'success') {
        // tokens default to 0 when not in metadata
        expect(result.data.metadata.tokens.input).toBe(0);
        expect(result.data.metadata.tokens.output).toBe(0);
      }
    });

    it('handles missing model in LLM metadata gracefully (defaults to "unknown")', async () => {
      const rawData = {
        steps: ['Navigate'],
        code: "test('x', async ({ intent }) => { await intent.procurement.createPurchaseOrder({vendor:'V001'}); });",
      };
      const responseNoModel: AiResponse<typeof rawData> = {
        status: 'success',
        data: rawData,
        metadata: {
          duration: 80,
          retryable: false,
          suggestions: [],
          // model intentionally omitted
        },
      };
      const llmChat = vi.fn().mockResolvedValue(responseNoModel);
      const contextBuilder = vi.fn().mockResolvedValue(makeSuccessResponse(makePageContext()));
      const registry = makeCapabilityRegistry(SAMPLE_CAPABILITY);
      const handler = new AgenticHandler(
        {
          chat: llmChat,
          complete: vi.fn(),
          isConfigured: vi.fn().mockReturnValue(true),
          close: vi.fn().mockResolvedValue(undefined),
        },
        contextBuilder as never,
        registry,
      );

      const result = await handler.generateTest('create PO', makeMockPage() as never);

      expect(result.status).toBe('success');
      if (result.status === 'success') {
        expect(result.data.metadata.model).toBe('unknown');
      }
    });
  });

  // ── interpretStep ─────────────────────────────────────────────────────────

  describe('interpretStep()', () => {
    it('calls llm.chat with a user message containing the step', async () => {
      const llmChat = vi
        .fn()
        .mockResolvedValue(makeSuccessResponse({ capability: 'fillField', confidence: 0.95 }));
      const contextBuilder = vi.fn().mockResolvedValue(makeSuccessResponse(makePageContext()));
      const registry = makeCapabilityRegistry(SAMPLE_CAPABILITY);
      const handler = new AgenticHandler(
        {
          chat: llmChat,
          complete: vi.fn(),
          isConfigured: vi.fn().mockReturnValue(true),
          close: vi.fn().mockResolvedValue(undefined),
        },
        contextBuilder as never,
        registry,
      );

      await handler.interpretStep('Fill Vendor field with 100001', makeMockPage() as never);

      expect(llmChat).toHaveBeenCalledOnce();
      const callArgs = llmChat.mock.calls[0] as [unknown[], unknown];
      const messages = callArgs[0] as { role: string; content: string }[];
      const content = messages[0]?.content ?? '';
      expect(content).toContain('Fill Vendor field with 100001');
    });

    it('returns success when capability is found in registry', async () => {
      const llmChat = vi
        .fn()
        .mockResolvedValue(makeSuccessResponse({ capability: 'fillField', confidence: 0.9 }));
      const contextBuilder = vi.fn().mockResolvedValue(makeSuccessResponse(makePageContext()));
      const registry = makeCapabilityRegistry(SAMPLE_CAPABILITY);
      const handler = new AgenticHandler(
        {
          chat: llmChat,
          complete: vi.fn(),
          isConfigured: vi.fn().mockReturnValue(true),
          close: vi.fn().mockResolvedValue(undefined),
        },
        contextBuilder as never,
        registry,
      );

      const result = await handler.interpretStep('Fill vendor', makeMockPage() as never);

      expect(result.status).toBe('success');
    });

    it('returns error when LLM returns unknown capability name', async () => {
      const llmChat = vi
        .fn()
        .mockResolvedValue(
          makeSuccessResponse({ capability: 'nonExistentCapability', confidence: 0.5 }),
        );
      const contextBuilder = vi.fn().mockResolvedValue(makeSuccessResponse(makePageContext()));
      const registry = makeCapabilityRegistry(SAMPLE_CAPABILITY);
      const handler = new AgenticHandler(
        {
          chat: llmChat,
          complete: vi.fn(),
          isConfigured: vi.fn().mockReturnValue(true),
          close: vi.fn().mockResolvedValue(undefined),
        },
        contextBuilder as never,
        registry,
      );

      const result = await handler.interpretStep('do something', makeMockPage() as never);

      expect(result.status).toBe('error');
      if (result.status === 'error') {
        expect(result.error.code).toBe('ERR_AI_CAPABILITY_NOT_FOUND');
        expect(result.error.message).toContain('nonExistentCapability');
      }
    });

    it('returns error when LLM call fails during interpretStep', async () => {
      const llmChat = vi
        .fn()
        .mockResolvedValue(makeErrorResponse('ERR_AI_LLM_CALL_FAILED', 'Connection timeout'));
      const contextBuilder = vi.fn().mockResolvedValue(makeSuccessResponse(makePageContext()));
      const registry = makeCapabilityRegistry(SAMPLE_CAPABILITY);
      const handler = new AgenticHandler(
        {
          chat: llmChat,
          complete: vi.fn(),
          isConfigured: vi.fn().mockReturnValue(true),
          close: vi.fn().mockResolvedValue(undefined),
        },
        contextBuilder as never,
        registry,
      );

      const result = await handler.interpretStep('Fill Vendor', makeMockPage() as never);

      expect(result.status).toBe('error');
    });
  });

  // ── suggestActions ────────────────────────────────────────────────────────

  describe('suggestActions()', () => {
    it('calls llm.complete with the page context JSON', async () => {
      const llmComplete = vi
        .fn()
        .mockResolvedValue(
          makeSuccessResponse({ suggestions: ['Click Save button', 'Fill Vendor field'] }),
        );
      const contextBuilder = vi.fn().mockResolvedValue(makeSuccessResponse(makePageContext()));
      const registry = makeCapabilityRegistry(SAMPLE_CAPABILITY);
      const handler = new AgenticHandler(
        {
          chat: vi.fn(),
          complete: llmComplete,
          isConfigured: vi.fn().mockReturnValue(true),
          close: vi.fn().mockResolvedValue(undefined),
        },
        contextBuilder as never,
        registry,
      );

      await handler.suggestActions(makePageContext());

      expect(llmComplete).toHaveBeenCalledOnce();
      const callArgs = llmComplete.mock.calls[0] as [string, unknown];
      const prompt = callArgs[0];
      expect(prompt).toContain('example.com');
    });

    it('returns success with non-empty suggestions array', async () => {
      const llmComplete = vi.fn().mockResolvedValue(
        makeSuccessResponse({
          suggestions: [
            'Click Save button to finalize the purchase order',
            'Fill Vendor field with the vendor ID',
            'Navigate to ME21N for a new PO',
          ],
        }),
      );
      const contextBuilder = vi.fn().mockResolvedValue(makeSuccessResponse(makePageContext()));
      const registry = makeCapabilityRegistry(SAMPLE_CAPABILITY);
      const handler = new AgenticHandler(
        {
          chat: vi.fn(),
          complete: llmComplete,
          isConfigured: vi.fn().mockReturnValue(true),
          close: vi.fn().mockResolvedValue(undefined),
        },
        contextBuilder as never,
        registry,
      );

      const result = await handler.suggestActions(makePageContext());

      expect(result.status).toBe('success');
      if (result.status === 'success') {
        expect(result.data.length).toBeGreaterThan(0);
        expect(result.data[0]).toContain('Save');
      }
    });

    it('returns error when LLM fails for suggestActions', async () => {
      const llmComplete = vi
        .fn()
        .mockResolvedValue(makeErrorResponse('ERR_AI_LLM_CALL_FAILED', 'Model unavailable'));
      const contextBuilder = vi.fn().mockResolvedValue(makeSuccessResponse(makePageContext()));
      const registry = makeCapabilityRegistry(SAMPLE_CAPABILITY);
      const handler = new AgenticHandler(
        {
          chat: vi.fn(),
          complete: llmComplete,
          isConfigured: vi.fn().mockReturnValue(true),
          close: vi.fn().mockResolvedValue(undefined),
        },
        contextBuilder as never,
        registry,
      );

      const result = await handler.suggestActions(makePageContext());

      expect(result.status).toBe('error');
      if (result.status === 'error') {
        expect(result.error.code).toBe('ERR_AI_LLM_CALL_FAILED');
      }
    });
  });

  // ── saveCheckpoint / resumeFromCheckpoint ─────────────────────────────────

  describe('saveCheckpoint() / resumeFromCheckpoint()', () => {
    it('roundtrip: save then retrieve the checkpoint', () => {
      const contextBuilder = vi.fn().mockResolvedValue(makeSuccessResponse(makePageContext()));
      const registry = makeCapabilityRegistry();
      const handler = new AgenticHandler(
        {
          chat: vi.fn(),
          complete: vi.fn(),
          isConfigured: vi.fn().mockReturnValue(true),
          close: vi.fn().mockResolvedValue(undefined),
        },
        contextBuilder as never,
        registry,
      );

      const checkpoint: AgenticCheckpoint = {
        sessionId: 'sess-001',
        currentStep: 2,
        completedSteps: ['navigate', 'fillVendor'],
        remainingSteps: ['fillMaterial', 'save'],
        state: { url: 'https://example.com' },
        timestamp: new Date().toISOString(),
      };

      handler.saveCheckpoint(checkpoint);
      const retrieved = handler.resumeFromCheckpoint('sess-001');

      expect(retrieved).toBeDefined();
      expect(retrieved?.sessionId).toBe('sess-001');
      expect(retrieved?.currentStep).toBe(2);
      expect(retrieved?.completedSteps).toEqual(['navigate', 'fillVendor']);
      expect(retrieved?.remainingSteps).toEqual(['fillMaterial', 'save']);
    });

    it('returns undefined for unknown session ID', () => {
      const contextBuilder = vi.fn().mockResolvedValue(makeSuccessResponse(makePageContext()));
      const registry = makeCapabilityRegistry();
      const handler = new AgenticHandler(
        {
          chat: vi.fn(),
          complete: vi.fn(),
          isConfigured: vi.fn().mockReturnValue(true),
          close: vi.fn().mockResolvedValue(undefined),
        },
        contextBuilder as never,
        registry,
      );

      const result = handler.resumeFromCheckpoint('unknown-session');

      expect(result).toBeUndefined();
    });

    it('can store and retrieve multiple checkpoints independently', () => {
      const contextBuilder = vi.fn().mockResolvedValue(makeSuccessResponse(makePageContext()));
      const registry = makeCapabilityRegistry();
      const handler = new AgenticHandler(
        {
          chat: vi.fn(),
          complete: vi.fn(),
          isConfigured: vi.fn().mockReturnValue(true),
          close: vi.fn().mockResolvedValue(undefined),
        },
        contextBuilder as never,
        registry,
      );

      const checkpointA: AgenticCheckpoint = {
        sessionId: 'sess-A',
        currentStep: 1,
        completedSteps: ['navigate'],
        remainingSteps: ['fill', 'save'],
        state: {},
        timestamp: new Date().toISOString(),
      };

      const checkpointB: AgenticCheckpoint = {
        sessionId: 'sess-B',
        currentStep: 3,
        completedSteps: ['navigate', 'fill', 'save'],
        remainingSteps: [],
        state: { poNumber: '4500012345' },
        timestamp: new Date().toISOString(),
      };

      handler.saveCheckpoint(checkpointA);
      handler.saveCheckpoint(checkpointB);

      expect(handler.resumeFromCheckpoint('sess-A')?.currentStep).toBe(1);
      expect(handler.resumeFromCheckpoint('sess-B')?.currentStep).toBe(3);
      expect(handler.resumeFromCheckpoint('sess-B')?.state).toEqual({ poNumber: '4500012345' });
    });

    it('overwrites an existing checkpoint with the same sessionId', () => {
      const contextBuilder = vi.fn().mockResolvedValue(makeSuccessResponse(makePageContext()));
      const registry = makeCapabilityRegistry();
      const handler = new AgenticHandler(
        {
          chat: vi.fn(),
          complete: vi.fn(),
          isConfigured: vi.fn().mockReturnValue(true),
          close: vi.fn().mockResolvedValue(undefined),
        },
        contextBuilder as never,
        registry,
      );

      const first: AgenticCheckpoint = {
        sessionId: 'sess-001',
        currentStep: 1,
        completedSteps: [],
        remainingSteps: ['step1'],
        state: {},
        timestamp: new Date().toISOString(),
      };

      const updated: AgenticCheckpoint = {
        sessionId: 'sess-001',
        currentStep: 2,
        completedSteps: ['step1'],
        remainingSteps: [],
        state: { done: true },
        timestamp: new Date().toISOString(),
      };

      handler.saveCheckpoint(first);
      handler.saveCheckpoint(updated);

      const retrieved = handler.resumeFromCheckpoint('sess-001');
      expect(retrieved?.currentStep).toBe(2);
      expect(retrieved?.state).toEqual({ done: true });
    });
  });
});
