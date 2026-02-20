/**
 * Tests for `src/fixtures/intent-fixtures.ts` — Intent Playwright fixtures.
 *
 * @remarks
 * Uses vitest with mocked `@playwright/test`, `#intents/index.js`, and
 * `#vocabulary/index.js`. Fixture definitions are captured via
 * `createMockTestExtend()` and executed directly to verify behavior
 * without requiring a Playwright test runner.
 *
 * Validates that:
 * - vocabulary domains are preloaded before `use()` is called
 * - all `core`, `procurement`, and `sales` namespace methods are exposed
 * - each method delegates to the corresponding intent module function
 *
 * @module fixtures
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  createMockExpectExtend,
  createMockTestExtend,
} from '../../helpers/mock-playwright-test.js';

// ── Shared mock state — hoisted so vi.mock factories can reference them ──
const mocks = vi.hoisted(() => {
  // ── Vocabulary service ────────────────────────────────────────────────
  const loadDomain = vi.fn().mockResolvedValue(undefined);
  const vocabularyService = {
    search: vi.fn().mockResolvedValue([]),
    loadDomain,
    getStats: vi
      .fn()
      .mockReturnValue({ loadedDomains: [], totalTerms: 0, cacheHits: 0, cacheMisses: 0 }),
    resolve: vi.fn().mockResolvedValue(null),
  };
  const createVocabularyService = vi.fn().mockReturnValue(vocabularyService);

  // ── Core intent wrappers ──────────────────────────────────────────────
  const fillField = vi.fn().mockResolvedValue({ status: 'success', data: undefined });
  const clickButton = vi.fn().mockResolvedValue({ status: 'success', data: undefined });
  const selectOption = vi.fn().mockResolvedValue({ status: 'success', data: undefined });
  const assertField = vi.fn().mockResolvedValue({ status: 'success', data: true });
  const confirmAndWait = vi.fn().mockResolvedValue({ status: 'success', data: undefined });
  const waitForSave = vi.fn().mockResolvedValue({ status: 'success', data: undefined });

  // ── Procurement domain ────────────────────────────────────────────────
  const createPurchaseOrder = vi.fn().mockResolvedValue({ status: 'success', data: undefined });
  const approvePurchaseOrder = vi.fn().mockResolvedValue({ status: 'success', data: undefined });
  const searchPurchaseOrders = vi.fn().mockResolvedValue({ status: 'success', data: undefined });
  const createPurchaseRequisition = vi
    .fn()
    .mockResolvedValue({ status: 'success', data: undefined });
  const confirmGoodsReceipt = vi.fn().mockResolvedValue({ status: 'success', data: undefined });
  const searchVendors = vi.fn().mockResolvedValue({ status: 'success', data: undefined });

  // ── Sales domain ──────────────────────────────────────────────────────
  const createSalesOrder = vi.fn().mockResolvedValue({ status: 'success', data: undefined });
  const createQuotation = vi.fn().mockResolvedValue({ status: 'success', data: undefined });
  const approveQuotation = vi.fn().mockResolvedValue({ status: 'success', data: undefined });
  const searchSalesOrders = vi.fn().mockResolvedValue({ status: 'success', data: undefined });
  const searchCustomers = vi.fn().mockResolvedValue({ status: 'success', data: undefined });
  const checkDeliveryStatus = vi.fn().mockResolvedValue({ status: 'success', data: 'In Transit' });

  return {
    // vocabulary
    loadDomain,
    vocabularyService,
    createVocabularyService,
    // core
    fillField,
    clickButton,
    selectOption,
    assertField,
    confirmAndWait,
    waitForSave,
    // procurement
    createPurchaseOrder,
    approvePurchaseOrder,
    searchPurchaseOrders,
    createPurchaseRequisition,
    confirmGoodsReceipt,
    searchVendors,
    // sales
    createSalesOrder,
    createQuotation,
    approveQuotation,
    searchSalesOrders,
    searchCustomers,
    checkDeliveryStatus,
  };
});

// ── Mock #intents/index.js ────────────────────────────────────────────
vi.mock('#intents/index.js', () => ({
  fillField: mocks.fillField,
  clickButton: mocks.clickButton,
  selectOption: mocks.selectOption,
  assertField: mocks.assertField,
  confirmAndWait: mocks.confirmAndWait,
  waitForSave: mocks.waitForSave,
  procurement: {
    createPurchaseOrder: mocks.createPurchaseOrder,
    approvePurchaseOrder: mocks.approvePurchaseOrder,
    searchPurchaseOrders: mocks.searchPurchaseOrders,
    createPurchaseRequisition: mocks.createPurchaseRequisition,
    confirmGoodsReceipt: mocks.confirmGoodsReceipt,
    searchVendors: mocks.searchVendors,
  },
  sales: {
    createSalesOrder: mocks.createSalesOrder,
    createQuotation: mocks.createQuotation,
    approveQuotation: mocks.approveQuotation,
    searchSalesOrders: mocks.searchSalesOrders,
    searchCustomers: mocks.searchCustomers,
    checkDeliveryStatus: mocks.checkDeliveryStatus,
  },
}));

// ── Mock #vocabulary/index.js ─────────────────────────────────────────
vi.mock('#vocabulary/index.js', () => ({
  createVocabularyService: mocks.createVocabularyService,
}));

// ── Mock #ai/index.js (needed because intentTest extends aiTest) ───────
// Use class syntax so `new CapabilityRegistry()` works as a constructor
// eslint-disable-next-line @typescript-eslint/no-extraneous-class
class CapabilityRegistry {
  constructor() {
    return {
      list: vi.fn().mockReturnValue([]),
      byCategory: vi.fn(),
      find: vi.fn(),
      forAI: vi.fn(),
      get: vi.fn(),
      has: vi.fn(),
      register: vi.fn(),
    };
  }
}
// eslint-disable-next-line @typescript-eslint/no-extraneous-class
class RecipeRegistry {
  constructor() {
    return { getTopRecipes: vi.fn().mockReturnValue([]), addRecipe: vi.fn(), list: vi.fn() };
  }
}
// eslint-disable-next-line @typescript-eslint/no-extraneous-class
class AgenticHandler {
  constructor() {
    return {
      generateTest: vi.fn(),
      interpretStep: vi.fn(),
      suggestActions: vi.fn(),
      saveCheckpoint: vi.fn(),
      resumeFromCheckpoint: vi.fn(),
    };
  }
}

vi.mock('#ai/index.js', () => ({
  createLlmService: vi.fn().mockReturnValue({
    chat: vi.fn(),
    complete: vi.fn(),
    isConfigured: vi.fn(),
    close: vi.fn().mockResolvedValue(undefined),
  }),
  CapabilityRegistry,
  RecipeRegistry,
  AgenticHandler,
  discoverPage: vi
    .fn()
    .mockResolvedValue({ status: 'success', data: {}, metadata: { duration: 0 } }),
  buildPageContext: vi
    .fn()
    .mockResolvedValue({ status: 'success', data: {}, metadata: { duration: 0 } }),
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

// ── Import after mocks ────────────────────────────────────────────────
const { intentTest } = await import('#fixtures/intent-fixtures.js');

// ── Helpers ───────────────────────────────────────────────────────────

/**
 * Extracts the fixture function from a fixture definition.
 *
 * @param definition - The fixture definition from `_fixtureDefinitions`
 * @returns The fixture function
 *
 * @example
 * ```typescript
 * const fn = extractFixtureFn(fixtures['intent']);
 * ```
 */
function extractFixtureFn(definition: unknown): (...args: any[]) => Promise<void> {
  if (Array.isArray(definition)) {
    return definition[0] as (...args: any[]) => Promise<void>;
  }
  return definition as (...args: any[]) => Promise<void>;
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
 * const intent = await runFixture<IntentFixture>(fixtureFn, { page: mockPage });
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

/**
 * Safely retrieves a method from a Record type, throwing if undefined.
 *
 * @remarks
 * Replaces non-null assertions (`!`) on Record bracket-access which ESLint
 * forbids via `@typescript-eslint/no-non-null-assertion`. With
 * `noUncheckedIndexedAccess`, `Record<string, T>[key]` returns `T | undefined`.
 * This helper narrows the type at runtime with a clear error message.
 *
 * @param obj - The record to look up
 * @param key - The property name
 * @returns The value, guaranteed to be defined
 *
 * @example
 * ```typescript
 * const fn = method(core, 'fillField');
 * await fn('Vendor', '100001');
 * ```
 */
function method<T>(obj: Record<string, T>, key: string): T {
  const value = obj[key];
  if (value === undefined) {
    throw new Error(`Expected property "${key}" to be defined`);
  }
  return value;
}

// ── Fixture definitions reference ─────────────────────────────────────
const fixtures = (intentTest as unknown as { _fixtureDefinitions: Record<string, unknown> })
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
  mocks.loadDomain.mockResolvedValue(undefined);
  mocks.createVocabularyService.mockReturnValue(mocks.vocabularyService);
  mocks.fillField.mockResolvedValue({ status: 'success', data: undefined });
  mocks.clickButton.mockResolvedValue({ status: 'success', data: undefined });
  mocks.selectOption.mockResolvedValue({ status: 'success', data: undefined });
  mocks.assertField.mockResolvedValue({ status: 'success', data: true });
  mocks.confirmAndWait.mockResolvedValue({ status: 'success', data: undefined });
  mocks.waitForSave.mockResolvedValue({ status: 'success', data: undefined });
  mocks.createPurchaseOrder.mockResolvedValue({ status: 'success', data: undefined });
  mocks.approvePurchaseOrder.mockResolvedValue({ status: 'success', data: undefined });
  mocks.searchPurchaseOrders.mockResolvedValue({ status: 'success', data: undefined });
  mocks.createPurchaseRequisition.mockResolvedValue({ status: 'success', data: undefined });
  mocks.confirmGoodsReceipt.mockResolvedValue({ status: 'success', data: undefined });
  mocks.searchVendors.mockResolvedValue({ status: 'success', data: undefined });
  mocks.createSalesOrder.mockResolvedValue({ status: 'success', data: undefined });
  mocks.createQuotation.mockResolvedValue({ status: 'success', data: undefined });
  mocks.approveQuotation.mockResolvedValue({ status: 'success', data: undefined });
  mocks.searchSalesOrders.mockResolvedValue({ status: 'success', data: undefined });
  mocks.searchCustomers.mockResolvedValue({ status: 'success', data: undefined });
  mocks.checkDeliveryStatus.mockResolvedValue({ status: 'success', data: 'In Transit' });
}

// ── Tests ─────────────────────────────────────────────────────────────

describe('intent-fixtures fixture definitions', () => {
  beforeEach(() => {
    resetAllMockDefaults();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('intent fixture', () => {
    it('is registered as a fixture definition', () => {
      expect(fixtures).toHaveProperty('intent');
    });

    it('provides core, procurement, and sales namespaces', async () => {
      const fn = extractFixtureFn(fixtures['intent']);
      const intent = await runFixture<Record<string, unknown>>(fn, { page: mockPage });

      expect(intent).toBeDefined();
      expect(intent['core']).toBeDefined();
      expect(intent['procurement']).toBeDefined();
      expect(intent['sales']).toBeDefined();
    });

    it('preloads all 4 vocabulary domains before use()', async () => {
      const fn = extractFixtureFn(fixtures['intent']);
      let domainsLoadedBeforeUse = false;

      // Wrap use() to check state at the moment use() is called (value not needed)
      const captureUse = async (): Promise<void> => {
        domainsLoadedBeforeUse = mocks.loadDomain.mock.calls.length >= 4;
        await Promise.resolve();
      };

      await fn({ page: mockPage }, captureUse as never);

      expect(domainsLoadedBeforeUse).toBe(true);
    });

    it('calls loadDomain for procurement, sales, finance, manufacturing', async () => {
      const fn = extractFixtureFn(fixtures['intent']);
      await runFixture<Record<string, unknown>>(fn, { page: mockPage });

      const domainArgs = mocks.loadDomain.mock.calls.map((c) => c[0] as string);
      expect(domainArgs).toContain('procurement');
      expect(domainArgs).toContain('sales');
      expect(domainArgs).toContain('finance');
      expect(domainArgs).toContain('manufacturing');
    });

    // ── core namespace ──────────────────────────────────────────────────

    it('core.fillField delegates to fillField intent function', async () => {
      const fn = extractFixtureFn(fixtures['intent']);
      const intent = await runFixture<Record<string, unknown>>(fn, { page: mockPage });

      const core = intent['core'] as Record<string, (...args: unknown[]) => Promise<unknown>>;
      await method(core, 'fillField')('Vendor', '100001');

      expect(mocks.fillField).toHaveBeenCalledOnce();
    });

    it('core.clickButton delegates to clickButton intent function', async () => {
      const fn = extractFixtureFn(fixtures['intent']);
      const intent = await runFixture<Record<string, unknown>>(fn, { page: mockPage });

      const core = intent['core'] as Record<string, (...args: unknown[]) => Promise<unknown>>;
      await method(core, 'clickButton')('Save');

      expect(mocks.clickButton).toHaveBeenCalledOnce();
    });

    it('core.selectOption delegates to selectOption intent function', async () => {
      const fn = extractFixtureFn(fixtures['intent']);
      const intent = await runFixture<Record<string, unknown>>(fn, { page: mockPage });

      const core = intent['core'] as Record<string, (...args: unknown[]) => Promise<unknown>>;
      await method(core, 'selectOption')('Status', 'Active');

      expect(mocks.selectOption).toHaveBeenCalledOnce();
    });

    it('core.assertField delegates to assertField intent function', async () => {
      const fn = extractFixtureFn(fixtures['intent']);
      const intent = await runFixture<Record<string, unknown>>(fn, { page: mockPage });

      const core = intent['core'] as Record<string, (...args: unknown[]) => Promise<unknown>>;
      await method(core, 'assertField')('Vendor', '100001');

      expect(mocks.assertField).toHaveBeenCalledOnce();
    });

    it('core.confirmAndWait delegates to confirmAndWait intent function', async () => {
      const fn = extractFixtureFn(fixtures['intent']);
      const intent = await runFixture<Record<string, unknown>>(fn, { page: mockPage });

      const core = intent['core'] as Record<string, (...args: unknown[]) => Promise<unknown>>;
      await method(core, 'confirmAndWait')();

      expect(mocks.confirmAndWait).toHaveBeenCalledOnce();
    });

    it('core.waitForSave delegates to waitForSave intent function', async () => {
      const fn = extractFixtureFn(fixtures['intent']);
      const intent = await runFixture<Record<string, unknown>>(fn, { page: mockPage });

      const core = intent['core'] as Record<string, (...args: unknown[]) => Promise<unknown>>;
      await method(core, 'waitForSave')();

      expect(mocks.waitForSave).toHaveBeenCalledOnce();
    });

    // ── procurement namespace ──────────────────────────────────────────

    it('procurement.createPurchaseOrder delegates to procurement.createPurchaseOrder', async () => {
      const fn = extractFixtureFn(fixtures['intent']);
      const intent = await runFixture<Record<string, unknown>>(fn, { page: mockPage });

      const proc = intent['procurement'] as Record<
        string,
        (...args: unknown[]) => Promise<unknown>
      >;
      await method(
        proc,
        'createPurchaseOrder',
      )({
        vendor: '100001',
        material: 'MAT-001',
        quantity: 10,
        plant: '1000',
      });

      expect(mocks.createPurchaseOrder).toHaveBeenCalledOnce();
    });

    it('procurement.approvePurchaseOrder delegates to procurement.approvePurchaseOrder', async () => {
      const fn = extractFixtureFn(fixtures['intent']);
      const intent = await runFixture<Record<string, unknown>>(fn, { page: mockPage });

      const proc = intent['procurement'] as Record<
        string,
        (...args: unknown[]) => Promise<unknown>
      >;
      await method(proc, 'approvePurchaseOrder')({ poNumber: '4500000001' });

      expect(mocks.approvePurchaseOrder).toHaveBeenCalledOnce();
    });

    it('procurement.searchPurchaseOrders delegates to procurement.searchPurchaseOrders', async () => {
      const fn = extractFixtureFn(fixtures['intent']);
      const intent = await runFixture<Record<string, unknown>>(fn, { page: mockPage });

      const proc = intent['procurement'] as Record<
        string,
        (...args: unknown[]) => Promise<unknown>
      >;
      await method(proc, 'searchPurchaseOrders')({ Vendor: '100001' });

      expect(mocks.searchPurchaseOrders).toHaveBeenCalledOnce();
    });

    it('procurement.createPurchaseRequisition delegates to procurement.createPurchaseRequisition', async () => {
      const fn = extractFixtureFn(fixtures['intent']);
      const intent = await runFixture<Record<string, unknown>>(fn, { page: mockPage });

      const proc = intent['procurement'] as Record<
        string,
        (...args: unknown[]) => Promise<unknown>
      >;
      await method(
        proc,
        'createPurchaseRequisition',
      )({ material: 'MAT-001', quantity: 5, plant: '1000' });

      expect(mocks.createPurchaseRequisition).toHaveBeenCalledOnce();
    });

    it('procurement.confirmGoodsReceipt delegates to procurement.confirmGoodsReceipt', async () => {
      const fn = extractFixtureFn(fixtures['intent']);
      const intent = await runFixture<Record<string, unknown>>(fn, { page: mockPage });

      const proc = intent['procurement'] as Record<
        string,
        (...args: unknown[]) => Promise<unknown>
      >;
      await method(proc, 'confirmGoodsReceipt')({ poNumber: '4500000001', quantity: 10 });

      expect(mocks.confirmGoodsReceipt).toHaveBeenCalledOnce();
    });

    it('procurement.searchVendors delegates to procurement.searchVendors', async () => {
      const fn = extractFixtureFn(fixtures['intent']);
      const intent = await runFixture<Record<string, unknown>>(fn, { page: mockPage });

      const proc = intent['procurement'] as Record<
        string,
        (...args: unknown[]) => Promise<unknown>
      >;
      await method(proc, 'searchVendors')();

      expect(mocks.searchVendors).toHaveBeenCalledOnce();
    });

    // ── sales namespace ────────────────────────────────────────────────

    it('sales.createSalesOrder delegates to sales.createSalesOrder', async () => {
      const fn = extractFixtureFn(fixtures['intent']);
      const intent = await runFixture<Record<string, unknown>>(fn, { page: mockPage });

      const sales = intent['sales'] as Record<string, (...args: unknown[]) => Promise<unknown>>;
      await method(
        sales,
        'createSalesOrder',
      )({
        customer: '200001',
        material: 'FG-1000',
        quantity: 5,
        salesOrganization: '1000',
      });

      expect(mocks.createSalesOrder).toHaveBeenCalledOnce();
    });

    it('sales.createQuotation delegates to sales.createQuotation', async () => {
      const fn = extractFixtureFn(fixtures['intent']);
      const intent = await runFixture<Record<string, unknown>>(fn, { page: mockPage });

      const sales = intent['sales'] as Record<string, (...args: unknown[]) => Promise<unknown>>;
      await method(
        sales,
        'createQuotation',
      )({ customer: '200001', material: 'FG-1000', quantity: 5 });

      expect(mocks.createQuotation).toHaveBeenCalledOnce();
    });

    it('sales.approveQuotation delegates to sales.approveQuotation', async () => {
      const fn = extractFixtureFn(fixtures['intent']);
      const intent = await runFixture<Record<string, unknown>>(fn, { page: mockPage });

      const sales = intent['sales'] as Record<string, (...args: unknown[]) => Promise<unknown>>;
      await method(sales, 'approveQuotation')({ quotationNumber: 'Q-001' });

      expect(mocks.approveQuotation).toHaveBeenCalledOnce();
    });

    it('sales.searchSalesOrders delegates to sales.searchSalesOrders', async () => {
      const fn = extractFixtureFn(fixtures['intent']);
      const intent = await runFixture<Record<string, unknown>>(fn, { page: mockPage });

      const sales = intent['sales'] as Record<string, (...args: unknown[]) => Promise<unknown>>;
      await method(sales, 'searchSalesOrders')({ Customer: '200001' });

      expect(mocks.searchSalesOrders).toHaveBeenCalledOnce();
    });

    it('sales.searchCustomers delegates to sales.searchCustomers', async () => {
      const fn = extractFixtureFn(fixtures['intent']);
      const intent = await runFixture<Record<string, unknown>>(fn, { page: mockPage });

      const sales = intent['sales'] as Record<string, (...args: unknown[]) => Promise<unknown>>;
      await method(sales, 'searchCustomers')();

      expect(mocks.searchCustomers).toHaveBeenCalledOnce();
    });

    it('sales.checkDeliveryStatus delegates to sales.checkDeliveryStatus', async () => {
      const fn = extractFixtureFn(fixtures['intent']);
      const intent = await runFixture<Record<string, unknown>>(fn, { page: mockPage });

      const sales = intent['sales'] as Record<string, (...args: unknown[]) => Promise<unknown>>;
      const result = await method(sales, 'checkDeliveryStatus')({ salesOrderNumber: 'SO-001' });

      expect(mocks.checkDeliveryStatus).toHaveBeenCalledOnce();
      expect((result as Record<string, unknown>)['data']).toBe('In Transit');
    });
  });
});
