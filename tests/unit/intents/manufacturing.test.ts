/**
 * @license
 * Copyright (c) ZesTest 2025-2030. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0
 *
 * This file may contain AI-assisted code.
 * See LICENSE and NOTICE files for details.
 */

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

  it('returns error when plant term not found (material succeeds)', async () => {
    const ui5 = makeUI5();
    const ui5Nav = makeNav();
    let callCount = 0;
    const vocab: VocabLookup = {
      getFieldSelector: vi.fn().mockImplementation(async () => {
        callCount++;
        return callCount === 1 ? Promise.resolve({ id: 'field' }) : Promise.resolve(undefined);
      }),
    };

    const result = await manufacturing.createProductionOrder(ui5, ui5Nav, vocab, {
      material: 'FG-1000',
      plant: '1000',
      quantity: 50,
    });

    expect(result.status).toBe('error');
    expect(result.metadata.stepsExecuted).toContain('fillMaterial');
  });

  it('returns error when quantity term not found (material + plant succeed)', async () => {
    const ui5 = makeUI5();
    const ui5Nav = makeNav();
    let callCount = 0;
    const vocab: VocabLookup = {
      getFieldSelector: vi.fn().mockImplementation(async () => {
        callCount++;
        return callCount <= 2 ? Promise.resolve({ id: 'field' }) : Promise.resolve(undefined);
      }),
    };

    const result = await manufacturing.createProductionOrder(ui5, ui5Nav, vocab, {
      material: 'FG-1000',
      plant: '1000',
      quantity: 50,
    });

    expect(result.status).toBe('error');
    expect(result.metadata.stepsExecuted).toContain('fillMaterial');
    expect(result.metadata.stepsExecuted).toContain('fillPlant');
  });

  it('returns error when scheduledStart term not found (required fields succeed)', async () => {
    const ui5 = makeUI5();
    const ui5Nav = makeNav();
    let callCount = 0;
    const vocab: VocabLookup = {
      getFieldSelector: vi.fn().mockImplementation(async () => {
        callCount++;
        // First 3 succeed (material, plant, qty), 4th (scheduledStart) fails
        return callCount <= 3 ? Promise.resolve({ id: 'field' }) : Promise.resolve(undefined);
      }),
    };

    const result = await manufacturing.createProductionOrder(ui5, ui5Nav, vocab, {
      material: 'FG-1000',
      plant: '1000',
      quantity: 50,
      scheduledStart: '2026-03-01',
    });

    expect(result.status).toBe('error');
    expect(result.metadata.stepsExecuted).toContain('fillMaterial');
    expect(result.metadata.stepsExecuted).toContain('fillPlant');
    expect(result.metadata.stepsExecuted).toContain('fillQuantity');
  });

  it('includes fillScheduledStart in stepsExecuted on success', async () => {
    const ui5 = makeUI5();
    const ui5Nav = makeNav();
    const vocab = makeVocab();

    const result = await manufacturing.createProductionOrder(ui5, ui5Nav, vocab, {
      material: 'FG-1000',
      plant: '1000',
      quantity: 50,
      scheduledStart: '2026-03-01',
    });

    expect(result.status).toBe('success');
    expect(result.metadata.stepsExecuted).toContain('fillScheduledStart');
  });

  it('passes timeout option through to waitForSave', async () => {
    const ui5 = makeUI5();
    const ui5Nav = makeNav();
    const vocab = makeVocab();

    const result = await manufacturing.createProductionOrder(
      ui5,
      ui5Nav,
      vocab,
      { material: 'FG-1000', plant: '1000', quantity: 50 },
      { timeout: 30_000 },
    );

    expect(result.status).toBe('success');
    expect(ui5.waitForUI5).toHaveBeenCalledWith(30_000);
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

  it('returns error when quantity term not found (order number succeeds)', async () => {
    const ui5 = makeUI5();
    const ui5Nav = makeNav();
    let callCount = 0;
    const vocab: VocabLookup = {
      getFieldSelector: vi.fn().mockImplementation(async () => {
        callCount++;
        return callCount === 1 ? Promise.resolve({ id: 'field' }) : Promise.resolve(undefined);
      }),
    };

    const result = await manufacturing.confirmProductionOrder(ui5, ui5Nav, vocab, {
      orderNumber: '1000012',
      quantity: 50,
    });

    expect(result.status).toBe('error');
    expect(result.metadata.stepsExecuted).toContain('fillOrderNumber');
  });

  it('skips navigation when skipNavigation is true', async () => {
    const ui5 = makeUI5();
    const ui5Nav = makeNav();
    const vocab = makeVocab();

    await manufacturing.confirmProductionOrder(
      ui5,
      ui5Nav,
      vocab,
      { orderNumber: '1000012', quantity: 50 },
      { skipNavigation: true },
    );

    expect(ui5Nav.navigateToApp).not.toHaveBeenCalled();
  });

  it('passes timeout option through to waitForSave', async () => {
    const ui5 = makeUI5();
    const ui5Nav = makeNav();
    const vocab = makeVocab();

    const result = await manufacturing.confirmProductionOrder(
      ui5,
      ui5Nav,
      vocab,
      { orderNumber: '1000012', quantity: 50 },
      { timeout: 15_000 },
    );

    expect(result.status).toBe('success');
    expect(ui5.waitForUI5).toHaveBeenCalledWith(15_000);
  });
});
