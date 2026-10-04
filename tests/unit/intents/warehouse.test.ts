/**
 * @license
 * Copyright (c) ZesTest 2025-2030. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0
 *
 * This file may contain AI-assisted code.
 * See LICENSE and NOTICE files for details.
 */

/**
 * Tests for `src/intents/domains/warehouse.ts` (WM module).
 *
 * @module intents
 */

import { describe, expect, it, vi } from 'vitest';

import type { UI5Selector } from '#core/types/selectors.js';
import type { UI5HandlerSlice, VocabLookup } from '#intents/core-wrappers.js';
import * as warehouse from '#intents/domains/warehouse.js';

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

// ── createGoodsMovement ─────────────────────────────────────────────────────

describe('warehouse.createGoodsMovement', () => {
  it('navigates to GoodsMovement-create and posts', async () => {
    const ui5 = makeUI5();
    const ui5Nav = makeNav();
    const vocab = makeVocab();

    const result = await warehouse.createGoodsMovement(ui5, ui5Nav, vocab, {
      movementType: '101',
      plant: '1000',
      material: 'RAW-0001',
      quantity: 100,
    });

    expect(result.status).toBe('success');
    expect(result.metadata.sapModule).toBe('WM');
    expect(ui5Nav.navigateToApp).toHaveBeenCalledWith('GoodsMovement-create');
  });

  it('fills required fields', async () => {
    const ui5 = makeUI5();
    const ui5Nav = makeNav();
    const vocab = makeVocab();

    await warehouse.createGoodsMovement(ui5, ui5Nav, vocab, {
      movementType: '101',
      plant: '1000',
      material: 'RAW-0001',
      quantity: 100,
    });

    // movementType + plant + material + quantity = 4 fills
    expect(ui5.fill).toHaveBeenCalledTimes(4);
  });

  it('clicks Post button', async () => {
    const ui5 = makeUI5();
    const ui5Nav = makeNav();
    const vocab = makeVocab();

    await warehouse.createGoodsMovement(ui5, ui5Nav, vocab, {
      movementType: '101',
      plant: '1000',
      material: 'RAW-0001',
      quantity: 100,
    });

    expect(ui5.click).toHaveBeenCalledWith({
      controlType: 'sap.m.Button',
      properties: { text: 'Post' },
    });
  });

  it('returns result with correct sapModule', async () => {
    const ui5 = makeUI5();
    const ui5Nav = makeNav();
    const vocab = makeVocab();

    const result = await warehouse.createGoodsMovement(ui5, ui5Nav, vocab, {
      movementType: '101',
      plant: '1000',
      material: 'RAW-0001',
      quantity: 100,
    });

    expect(result.metadata.sapModule).toBe('WM');
    expect(result.metadata.intentName).toBe('createGoodsMovement');
  });

  it('skips navigation when skipNavigation is true', async () => {
    const ui5 = makeUI5();
    const ui5Nav = makeNav();
    const vocab = makeVocab();

    await warehouse.createGoodsMovement(
      ui5,
      ui5Nav,
      vocab,
      { movementType: '101', plant: '1000', material: 'RAW-0001', quantity: 100 },
      { skipNavigation: true },
    );

    expect(ui5Nav.navigateToApp).not.toHaveBeenCalled();
  });

  it('passes timeout option to waitForSave', async () => {
    const ui5 = makeUI5();
    const ui5Nav = makeNav();
    const vocab = makeVocab();

    const result = await warehouse.createGoodsMovement(
      ui5,
      ui5Nav,
      vocab,
      { movementType: '101', plant: '1000', material: 'RAW-0001', quantity: 100 },
      { timeout: 30_000 },
    );

    expect(result.status).toBe('success');
    expect(ui5.waitForUI5).toHaveBeenCalledWith(30_000);
  });

  it('returns error when movement type term is not in vocabulary', async () => {
    const ui5 = makeUI5();
    const ui5Nav = makeNav();
    const vocab: VocabLookup = {
      getFieldSelector: vi.fn().mockResolvedValue(undefined),
    };

    const result = await warehouse.createGoodsMovement(ui5, ui5Nav, vocab, {
      movementType: '101',
      plant: '1000',
      material: 'RAW-0001',
      quantity: 100,
    });

    expect(result.status).toBe('error');
    expect(result.error?.code).toBe('ERR_VOCAB_TERM_NOT_FOUND');
  });

  it('uses custom appId from overrides', async () => {
    const ui5 = makeUI5();
    const ui5Nav = makeNav();
    const vocab = makeVocab();

    await warehouse.createGoodsMovement(
      ui5,
      ui5Nav,
      vocab,
      { movementType: '101', plant: '1000', material: 'RAW-0001', quantity: 100 },
      { overrides: { appId: 'ZGoodsMovement-post' } },
    );

    expect(ui5Nav.navigateToApp).toHaveBeenCalledWith('ZGoodsMovement-post');
  });

  it('uses custom saveButtonText from overrides', async () => {
    const ui5 = makeUI5();
    const ui5Nav = makeNav();
    const vocab = makeVocab();

    await warehouse.createGoodsMovement(
      ui5,
      ui5Nav,
      vocab,
      { movementType: '101', plant: '1000', material: 'RAW-0001', quantity: 100 },
      { overrides: { saveButtonText: 'Submit' } },
    );

    expect(ui5.click).toHaveBeenCalledWith({
      controlType: 'sap.m.Button',
      properties: { text: 'Submit' },
    });
  });

  it('uses custom field label from overrides', async () => {
    const ui5 = makeUI5();
    const ui5Nav = makeNav();
    const vocab = makeVocab();

    await warehouse.createGoodsMovement(
      ui5,
      ui5Nav,
      vocab,
      { movementType: '101', plant: '1000', material: 'RAW-0001', quantity: 100 },
      { overrides: { fields: { 'Movement Type': 'Mvt Type' } } },
    );

    expect(vocab.getFieldSelector).toHaveBeenCalledWith('Mvt Type');
  });

  it('uses all field overrides simultaneously', async () => {
    const ui5 = makeUI5();
    const ui5Nav = makeNav();
    const vocab = makeVocab();

    await warehouse.createGoodsMovement(
      ui5,
      ui5Nav,
      vocab,
      { movementType: '101', plant: '1000', material: 'RAW-0001', quantity: 100 },
      {
        overrides: {
          appId: 'ZGoodsMovement-post',
          saveButtonText: 'Submit',
          fields: {
            'Movement Type': 'Mvt Type',
            Plant: 'Werk',
            Material: 'Product',
            Quantity: 'Qty',
          },
        },
      },
    );

    expect(ui5Nav.navigateToApp).toHaveBeenCalledWith('ZGoodsMovement-post');
    expect(ui5.click).toHaveBeenCalledWith({
      controlType: 'sap.m.Button',
      properties: { text: 'Submit' },
    });
    expect(vocab.getFieldSelector).toHaveBeenCalledWith('Mvt Type');
    expect(vocab.getFieldSelector).toHaveBeenCalledWith('Werk');
    expect(vocab.getFieldSelector).toHaveBeenCalledWith('Product');
    expect(vocab.getFieldSelector).toHaveBeenCalledWith('Qty');
  });

  it('returns error when plant term is not found (movementType succeeds)', async () => {
    const ui5 = makeUI5();
    const ui5Nav = makeNav();
    let callCount = 0;
    const vocab: VocabLookup = {
      getFieldSelector: vi.fn().mockImplementation(async () => {
        callCount++;
        return callCount === 1 ? Promise.resolve({ id: 'field' }) : Promise.resolve(undefined);
      }),
    };

    const result = await warehouse.createGoodsMovement(ui5, ui5Nav, vocab, {
      movementType: '101',
      plant: '1000',
      material: 'RAW-0001',
      quantity: 100,
    });

    expect(result.status).toBe('error');
    expect(result.metadata.stepsExecuted).toContain('fillMovementType');
  });

  it('returns error when material term is not found (mvt + plant succeed)', async () => {
    const ui5 = makeUI5();
    const ui5Nav = makeNav();
    let callCount = 0;
    const vocab: VocabLookup = {
      getFieldSelector: vi.fn().mockImplementation(async () => {
        callCount++;
        return callCount <= 2 ? Promise.resolve({ id: 'field' }) : Promise.resolve(undefined);
      }),
    };

    const result = await warehouse.createGoodsMovement(ui5, ui5Nav, vocab, {
      movementType: '101',
      plant: '1000',
      material: 'RAW-0001',
      quantity: 100,
    });

    expect(result.status).toBe('error');
    expect(result.metadata.stepsExecuted).toContain('fillMovementType');
    expect(result.metadata.stepsExecuted).toContain('fillPlant');
  });

  it('returns error when quantity term is not found (mvt + plant + mat succeed)', async () => {
    const ui5 = makeUI5();
    const ui5Nav = makeNav();
    let callCount = 0;
    const vocab: VocabLookup = {
      getFieldSelector: vi.fn().mockImplementation(async () => {
        callCount++;
        return callCount <= 3 ? Promise.resolve({ id: 'field' }) : Promise.resolve(undefined);
      }),
    };

    const result = await warehouse.createGoodsMovement(ui5, ui5Nav, vocab, {
      movementType: '101',
      plant: '1000',
      material: 'RAW-0001',
      quantity: 100,
    });

    expect(result.status).toBe('error');
    expect(result.metadata.stepsExecuted).toContain('fillMovementType');
    expect(result.metadata.stepsExecuted).toContain('fillPlant');
    expect(result.metadata.stepsExecuted).toContain('fillMaterial');
  });
});

// ── createTransferOrder ─────────────────────────────────────────────────────

describe('warehouse.createTransferOrder', () => {
  it('navigates to TransferOrder-create and saves', async () => {
    const ui5 = makeUI5();
    const ui5Nav = makeNav();
    const vocab = makeVocab();

    const result = await warehouse.createTransferOrder(ui5, ui5Nav, vocab, {
      warehouseNumber: '100',
      material: 'FG-1000',
      quantity: 25,
    });

    expect(result.status).toBe('success');
    expect(result.metadata.sapModule).toBe('WM');
    expect(ui5Nav.navigateToApp).toHaveBeenCalledWith('TransferOrder-create');
  });

  it('fills required fields', async () => {
    const ui5 = makeUI5();
    const ui5Nav = makeNav();
    const vocab = makeVocab();

    await warehouse.createTransferOrder(ui5, ui5Nav, vocab, {
      warehouseNumber: '100',
      material: 'FG-1000',
      quantity: 25,
    });

    // warehouseNumber + material + quantity = 3 fills
    expect(ui5.fill).toHaveBeenCalledTimes(3);
  });

  it('clicks Save button', async () => {
    const ui5 = makeUI5();
    const ui5Nav = makeNav();
    const vocab = makeVocab();

    await warehouse.createTransferOrder(ui5, ui5Nav, vocab, {
      warehouseNumber: '100',
      material: 'FG-1000',
      quantity: 25,
    });

    expect(ui5.click).toHaveBeenCalledWith({
      controlType: 'sap.m.Button',
      properties: { text: 'Save' },
    });
  });

  it('returns result with correct sapModule', async () => {
    const ui5 = makeUI5();
    const ui5Nav = makeNav();
    const vocab = makeVocab();

    const result = await warehouse.createTransferOrder(ui5, ui5Nav, vocab, {
      warehouseNumber: '100',
      material: 'FG-1000',
      quantity: 25,
    });

    expect(result.metadata.sapModule).toBe('WM');
    expect(result.metadata.intentName).toBe('createTransferOrder');
  });

  it('skips navigation when skipNavigation is true', async () => {
    const ui5 = makeUI5();
    const ui5Nav = makeNav();
    const vocab = makeVocab();

    await warehouse.createTransferOrder(
      ui5,
      ui5Nav,
      vocab,
      { warehouseNumber: '100', material: 'FG-1000', quantity: 25 },
      { skipNavigation: true },
    );

    expect(ui5Nav.navigateToApp).not.toHaveBeenCalled();
  });

  it('passes timeout option to waitForSave', async () => {
    const ui5 = makeUI5();
    const ui5Nav = makeNav();
    const vocab = makeVocab();

    const result = await warehouse.createTransferOrder(
      ui5,
      ui5Nav,
      vocab,
      { warehouseNumber: '100', material: 'FG-1000', quantity: 25 },
      { timeout: 20_000 },
    );

    expect(result.status).toBe('success');
    expect(ui5.waitForUI5).toHaveBeenCalledWith(20_000);
  });

  it('returns error when warehouse number term is not found', async () => {
    const ui5 = makeUI5();
    const ui5Nav = makeNav();
    const vocab: VocabLookup = {
      getFieldSelector: vi.fn().mockResolvedValue(undefined),
    };

    const result = await warehouse.createTransferOrder(ui5, ui5Nav, vocab, {
      warehouseNumber: '100',
      material: 'FG-1000',
      quantity: 25,
    });

    expect(result.status).toBe('error');
    expect(result.error?.code).toBe('ERR_VOCAB_TERM_NOT_FOUND');
  });

  it('uses custom appId from overrides', async () => {
    const ui5 = makeUI5();
    const ui5Nav = makeNav();
    const vocab = makeVocab();

    await warehouse.createTransferOrder(
      ui5,
      ui5Nav,
      vocab,
      { warehouseNumber: '100', material: 'FG-1000', quantity: 25 },
      { overrides: { appId: 'ZTransferOrder-create' } },
    );

    expect(ui5Nav.navigateToApp).toHaveBeenCalledWith('ZTransferOrder-create');
  });

  it('uses custom saveButtonText from overrides', async () => {
    const ui5 = makeUI5();
    const ui5Nav = makeNav();
    const vocab = makeVocab();

    await warehouse.createTransferOrder(
      ui5,
      ui5Nav,
      vocab,
      { warehouseNumber: '100', material: 'FG-1000', quantity: 25 },
      { overrides: { saveButtonText: 'Execute' } },
    );

    expect(ui5.click).toHaveBeenCalledWith({
      controlType: 'sap.m.Button',
      properties: { text: 'Execute' },
    });
  });

  it('uses custom field label from overrides', async () => {
    const ui5 = makeUI5();
    const ui5Nav = makeNav();
    const vocab = makeVocab();

    await warehouse.createTransferOrder(
      ui5,
      ui5Nav,
      vocab,
      { warehouseNumber: '100', material: 'FG-1000', quantity: 25 },
      { overrides: { fields: { 'Warehouse Number': 'WH No.' } } },
    );

    expect(vocab.getFieldSelector).toHaveBeenCalledWith('WH No.');
  });

  it('uses all field overrides simultaneously', async () => {
    const ui5 = makeUI5();
    const ui5Nav = makeNav();
    const vocab = makeVocab();

    await warehouse.createTransferOrder(
      ui5,
      ui5Nav,
      vocab,
      { warehouseNumber: '100', material: 'FG-1000', quantity: 25 },
      {
        overrides: {
          appId: 'ZTransferOrder-create',
          saveButtonText: 'Execute',
          fields: {
            'Warehouse Number': 'WH No.',
            Material: 'Product',
            Quantity: 'Qty',
          },
        },
      },
    );

    expect(ui5Nav.navigateToApp).toHaveBeenCalledWith('ZTransferOrder-create');
    expect(ui5.click).toHaveBeenCalledWith({
      controlType: 'sap.m.Button',
      properties: { text: 'Execute' },
    });
    expect(vocab.getFieldSelector).toHaveBeenCalledWith('WH No.');
    expect(vocab.getFieldSelector).toHaveBeenCalledWith('Product');
    expect(vocab.getFieldSelector).toHaveBeenCalledWith('Qty');
  });

  it('returns error when material term is not found (warehouseNumber succeeds)', async () => {
    const ui5 = makeUI5();
    const ui5Nav = makeNav();
    let callCount = 0;
    const vocab: VocabLookup = {
      getFieldSelector: vi.fn().mockImplementation(async () => {
        callCount++;
        return callCount === 1 ? Promise.resolve({ id: 'field' }) : Promise.resolve(undefined);
      }),
    };

    const result = await warehouse.createTransferOrder(ui5, ui5Nav, vocab, {
      warehouseNumber: '100',
      material: 'FG-1000',
      quantity: 25,
    });

    expect(result.status).toBe('error');
    expect(result.metadata.stepsExecuted).toContain('fillWarehouseNumber');
  });

  it('returns error when quantity term is not found (wh + material succeed)', async () => {
    const ui5 = makeUI5();
    const ui5Nav = makeNav();
    let callCount = 0;
    const vocab: VocabLookup = {
      getFieldSelector: vi.fn().mockImplementation(async () => {
        callCount++;
        return callCount <= 2 ? Promise.resolve({ id: 'field' }) : Promise.resolve(undefined);
      }),
    };

    const result = await warehouse.createTransferOrder(ui5, ui5Nav, vocab, {
      warehouseNumber: '100',
      material: 'FG-1000',
      quantity: 25,
    });

    expect(result.status).toBe('error');
    expect(result.metadata.stepsExecuted).toContain('fillWarehouseNumber');
    expect(result.metadata.stepsExecuted).toContain('fillMaterial');
  });
});
