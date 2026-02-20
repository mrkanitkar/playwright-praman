/**
 * Tests for `src/intents/domains/manufacturing.ts` (PP module).
 *
 * @remarks
 * All tests are hermetic. ui5, ui5Nav, and vocabulary mocks are plain
 * vi.fn() stubs — no real bridge interaction.
 *
 * @module intents
 */

import { describe, expect, it, vi } from 'vitest';

import type { UI5Selector } from '#core/types/selectors.js';
import type { UI5HandlerSlice, VocabLookup } from '#intents/core-wrappers.js';
import * as manufacturing from '#intents/domains/manufacturing.js';

// ── Test helpers ──────────────────────────────────────────────────────────────

type UI5Mock = UI5HandlerSlice & {
  click: ReturnType<typeof vi.fn>;
  fill: ReturnType<typeof vi.fn>;
  select: ReturnType<typeof vi.fn>;
  getText: ReturnType<typeof vi.fn>;
  waitForUI5: ReturnType<typeof vi.fn>;
  control: ReturnType<typeof vi.fn>;
};

function makeUI5(): UI5Mock {
  return {
    control: vi.fn().mockResolvedValue({}),
    click: vi.fn().mockResolvedValue(undefined),
    fill: vi.fn().mockResolvedValue(undefined),
    select: vi.fn().mockResolvedValue(undefined),
    getText: vi.fn().mockResolvedValue(''),
    waitForUI5: vi.fn().mockResolvedValue(undefined),
  };
}

function makeNav(): {
  navigateToApp: ReturnType<typeof vi.fn<(appId: string, options?: unknown) => Promise<void>>>;
  navigateToHash: ReturnType<typeof vi.fn<(hash: string, options?: unknown) => Promise<void>>>;
} {
  return {
    navigateToApp: vi
      .fn<(appId: string, options?: unknown) => Promise<void>>()
      .mockResolvedValue(undefined),
    navigateToHash: vi
      .fn<(hash: string, options?: unknown) => Promise<void>>()
      .mockResolvedValue(undefined),
  };
}

function makeVocab(selector: UI5Selector = { id: 'field' }): VocabLookup {
  return {
    getFieldSelector: vi.fn().mockResolvedValue(selector),
  };
}

// ── createProductionOrder ─────────────────────────────────────────────────────

describe('manufacturing.createProductionOrder', () => {
  it('navigates to ProductionOrder-create and fills required fields', async () => {
    const ui5 = makeUI5();
    const ui5Nav = makeNav();
    const vocab = makeVocab();

    const result = await manufacturing.createProductionOrder(ui5, ui5Nav, vocab, {
      material: 'FG-1000',
      plant: '1000',
      quantity: 50,
    });

    expect(result.status).toBe('success');
    expect(result.metadata.sapModule).toBe('PP');
    expect(result.metadata.intentName).toBe('createProductionOrder');
    expect(ui5Nav.navigateToApp).toHaveBeenCalledWith('ProductionOrder-create');
    expect(ui5.click).toHaveBeenCalledWith({
      controlType: 'sap.m.Button',
      properties: { text: 'Save' },
    });
  });

  it('fills material, plant, and quantity — 3 total fills when no scheduledStart', async () => {
    const ui5 = makeUI5();
    const ui5Nav = makeNav();
    const vocab = makeVocab();

    await manufacturing.createProductionOrder(ui5, ui5Nav, vocab, {
      material: 'FG-1000',
      plant: '1000',
      quantity: 50,
    });

    expect(ui5.fill).toHaveBeenCalledTimes(3);
  });

  it('also fills scheduledStart when provided', async () => {
    const ui5 = makeUI5();
    const ui5Nav = makeNav();
    const vocab = makeVocab();

    await manufacturing.createProductionOrder(ui5, ui5Nav, vocab, {
      material: 'FG-1000',
      plant: '1000',
      quantity: 50,
      scheduledStart: '2026-03-01',
    });

    // material + plant + quantity + scheduledStart = 4 fills
    expect(ui5.fill).toHaveBeenCalledTimes(4);
  });

  it('returns error when material term is not found in vocabulary', async () => {
    const ui5 = makeUI5();
    const ui5Nav = makeNav();
    const vocab: VocabLookup = {
      getFieldSelector: vi.fn().mockResolvedValue(undefined),
    };

    const result = await manufacturing.createProductionOrder(ui5, ui5Nav, vocab, {
      material: 'FG-1000',
      plant: '1000',
      quantity: 50,
    });

    expect(result.status).toBe('error');
    expect(result.error?.code).toBe('ERR_VOCAB_TERM_NOT_FOUND');
  });

  it('skips navigation when skipNavigation is true', async () => {
    const ui5 = makeUI5();
    const ui5Nav = makeNav();
    const vocab = makeVocab();

    await manufacturing.createProductionOrder(
      ui5,
      ui5Nav,
      vocab,
      { material: 'FG-1000', plant: '1000', quantity: 50 },
      { skipNavigation: true },
    );

    expect(ui5Nav.navigateToApp).not.toHaveBeenCalled();
  });

  it('includes stepsExecuted in metadata', async () => {
    const ui5 = makeUI5();
    const ui5Nav = makeNav();
    const vocab = makeVocab();

    const result = await manufacturing.createProductionOrder(ui5, ui5Nav, vocab, {
      material: 'FG-1000',
      plant: '1000',
      quantity: 50,
    });

    expect(result.metadata.stepsExecuted).toContain('navigate');
    expect(result.metadata.stepsExecuted).toContain('fillMaterial');
    expect(result.metadata.stepsExecuted).toContain('fillPlant');
    expect(result.metadata.stepsExecuted).toContain('fillQuantity');
    expect(result.metadata.stepsExecuted).toContain('clickSave');
  });
});

// ── confirmProductionOrder ────────────────────────────────────────────────────

describe('manufacturing.confirmProductionOrder', () => {
  it('navigates to ProductionOrder-confirm and saves confirmation', async () => {
    const ui5 = makeUI5();
    const ui5Nav = makeNav();
    const vocab = makeVocab();

    const result = await manufacturing.confirmProductionOrder(ui5, ui5Nav, vocab, {
      orderNumber: '1000012',
      quantity: 50,
    });

    expect(result.status).toBe('success');
    expect(result.metadata.sapModule).toBe('PP');
    expect(result.metadata.intentName).toBe('confirmProductionOrder');
    expect(ui5Nav.navigateToApp).toHaveBeenCalledWith('ProductionOrder-confirm');
  });

  it('fills order number and quantity — 2 total fills', async () => {
    const ui5 = makeUI5();
    const ui5Nav = makeNav();
    const vocab = makeVocab();

    await manufacturing.confirmProductionOrder(ui5, ui5Nav, vocab, {
      orderNumber: '1000012',
      quantity: 50,
    });

    expect(ui5.fill).toHaveBeenCalledTimes(2);
  });

  it('returns error when order number term is not found in vocabulary', async () => {
    const ui5 = makeUI5();
    const ui5Nav = makeNav();
    const vocab: VocabLookup = {
      getFieldSelector: vi.fn().mockResolvedValue(undefined),
    };

    const result = await manufacturing.confirmProductionOrder(ui5, ui5Nav, vocab, {
      orderNumber: '1000012',
      quantity: 50,
    });

    expect(result.status).toBe('error');
    expect(result.error?.code).toBe('ERR_VOCAB_TERM_NOT_FOUND');
  });

  it('includes fillOrderNumber and fillQuantity in stepsExecuted', async () => {
    const ui5 = makeUI5();
    const ui5Nav = makeNav();
    const vocab = makeVocab();

    const result = await manufacturing.confirmProductionOrder(ui5, ui5Nav, vocab, {
      orderNumber: '1000012',
      quantity: 50,
    });

    expect(result.metadata.stepsExecuted).toContain('fillOrderNumber');
    expect(result.metadata.stepsExecuted).toContain('fillQuantity');
  });
});
