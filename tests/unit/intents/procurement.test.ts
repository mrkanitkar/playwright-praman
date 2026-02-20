/**
 * Tests for `src/intents/domains/procurement.ts` (MM module).
 *
 * @remarks
 * All tests are hermetic. ui5, ui5Nav, and vocabulary mocks are simple
 * vi.fn() stubs — no real bridge or fixture interaction.
 *
 * @module intents
 */

import { describe, expect, it, vi } from 'vitest';

import type { UI5Selector } from '#core/types/selectors.js';
import type { UI5HandlerSlice, VocabLookup } from '#intents/core-wrappers.js';
import * as procurement from '#intents/domains/procurement.js';

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

/** Returns a VocabLookup that resolves every term to the given selector. */
function makeVocab(selector: UI5Selector = { id: 'field' }): VocabLookup {
  return {
    getFieldSelector: vi.fn().mockResolvedValue(selector),
  };
}

// ── createPurchaseOrder ────────────────────────────────────────────────────────

describe('procurement.createPurchaseOrder', () => {
  it('navigates to PurchaseOrder-create and fills required fields', async () => {
    const ui5 = makeUI5();
    const ui5Nav = makeNav();
    const vocab = makeVocab();

    const result = await procurement.createPurchaseOrder(ui5, ui5Nav, vocab, {
      vendor: '100001',
      material: 'MAT-001',
      quantity: 10,
      plant: '1000',
    });

    expect(result.status).toBe('success');
    expect(ui5Nav.navigateToApp).toHaveBeenCalledWith('PurchaseOrder-create');
    expect(ui5.fill).toHaveBeenCalledTimes(4);
    expect(ui5.click).toHaveBeenCalledWith({
      controlType: 'sap.m.Button',
      properties: { text: 'Save' },
    });
  });

  it('sets sapModule to MM', async () => {
    const ui5 = makeUI5();
    const ui5Nav = makeNav();
    const vocab = makeVocab();

    const result = await procurement.createPurchaseOrder(ui5, ui5Nav, vocab, {
      vendor: '1',
      material: 'M',
      quantity: 1,
      plant: '1',
    });

    expect(result.metadata.sapModule).toBe('MM');
    expect(result.metadata.intentName).toBe('createPurchaseOrder');
  });

  it('returns error when vendor term is not in vocabulary', async () => {
    const ui5 = makeUI5();
    const ui5Nav = makeNav();
    const vocab: VocabLookup = {
      getFieldSelector: vi.fn().mockResolvedValue(undefined),
    };

    const result = await procurement.createPurchaseOrder(ui5, ui5Nav, vocab, {
      vendor: '1',
      material: 'M',
      quantity: 1,
      plant: '1',
    });

    expect(result.status).toBe('error');
    expect(result.error?.code).toBe('ERR_VOCAB_TERM_NOT_FOUND');
  });

  it('skips navigation when skipNavigation is true', async () => {
    const ui5 = makeUI5();
    const ui5Nav = makeNav();
    const vocab = makeVocab();

    await procurement.createPurchaseOrder(
      ui5,
      ui5Nav,
      vocab,
      { vendor: '1', material: 'M', quantity: 1, plant: '1' },
      { skipNavigation: true },
    );

    expect(ui5Nav.navigateToApp).not.toHaveBeenCalled();
  });

  it('includes stepsExecuted in metadata', async () => {
    const ui5 = makeUI5();
    const ui5Nav = makeNav();
    const vocab = makeVocab();

    const result = await procurement.createPurchaseOrder(ui5, ui5Nav, vocab, {
      vendor: '1',
      material: 'M',
      quantity: 1,
      plant: '1',
    });

    expect(result.metadata.stepsExecuted).toContain('navigate');
    expect(result.metadata.stepsExecuted).toContain('fillVendor');
    expect(result.metadata.stepsExecuted).toContain('clickSave');
  });

  it('returns error when material term not found (vendor succeeds)', async () => {
    const ui5 = makeUI5();
    const ui5Nav = makeNav();
    let callCount = 0;
    const vocab: VocabLookup = {
      getFieldSelector: vi.fn().mockImplementation(async () => {
        callCount++;
        return callCount === 1 ? Promise.resolve({ id: 'field' }) : Promise.resolve(undefined);
      }),
    };

    const result = await procurement.createPurchaseOrder(ui5, ui5Nav, vocab, {
      vendor: '1',
      material: 'M',
      quantity: 1,
      plant: '1',
    });

    expect(result.status).toBe('error');
    expect(result.metadata.stepsExecuted).toContain('fillVendor');
  });

  it('returns error when quantity term not found (vendor + material succeed)', async () => {
    const ui5 = makeUI5();
    const ui5Nav = makeNav();
    let callCount = 0;
    const vocab: VocabLookup = {
      getFieldSelector: vi.fn().mockImplementation(async () => {
        callCount++;
        return callCount <= 2 ? Promise.resolve({ id: 'field' }) : Promise.resolve(undefined);
      }),
    };

    const result = await procurement.createPurchaseOrder(ui5, ui5Nav, vocab, {
      vendor: '1',
      material: 'M',
      quantity: 1,
      plant: '1',
    });

    expect(result.status).toBe('error');
    expect(result.metadata.stepsExecuted).toContain('fillVendor');
    expect(result.metadata.stepsExecuted).toContain('fillMaterial');
  });

  it('returns error when plant term not found (vendor + material + qty succeed)', async () => {
    const ui5 = makeUI5();
    const ui5Nav = makeNav();
    let callCount = 0;
    const vocab: VocabLookup = {
      getFieldSelector: vi.fn().mockImplementation(async () => {
        callCount++;
        return callCount <= 3 ? Promise.resolve({ id: 'field' }) : Promise.resolve(undefined);
      }),
    };

    const result = await procurement.createPurchaseOrder(ui5, ui5Nav, vocab, {
      vendor: '1',
      material: 'M',
      quantity: 1,
      plant: '1',
    });

    expect(result.status).toBe('error');
    expect(result.metadata.stepsExecuted).toContain('fillVendor');
    expect(result.metadata.stepsExecuted).toContain('fillMaterial');
    expect(result.metadata.stepsExecuted).toContain('fillQuantity');
  });

  it('passes timeout option through to waitForSave', async () => {
    const ui5 = makeUI5();
    const ui5Nav = makeNav();
    const vocab = makeVocab();

    const result = await procurement.createPurchaseOrder(
      ui5,
      ui5Nav,
      vocab,
      { vendor: '1', material: 'M', quantity: 1, plant: '1' },
      { timeout: 30_000 },
    );

    expect(result.status).toBe('success');
    expect(ui5.waitForUI5).toHaveBeenCalledWith(30_000);
  });
});

// ── approvePurchaseOrder ──────────────────────────────────────────────────────

describe('procurement.approvePurchaseOrder', () => {
  it('navigates to PurchaseOrder-manage and clicks Approve', async () => {
    const ui5 = makeUI5();
    const ui5Nav = makeNav();

    const result = await procurement.approvePurchaseOrder(ui5, ui5Nav, { poNumber: '4500012345' });

    expect(result.status).toBe('success');
    expect(result.metadata.sapModule).toBe('MM');
    expect(ui5Nav.navigateToApp).toHaveBeenCalledWith('PurchaseOrder-manage');
    expect(ui5.click).toHaveBeenCalledWith({
      controlType: 'sap.m.Button',
      properties: { text: 'Approve' },
    });
  });

  it('skips navigation when skipNavigation is true', async () => {
    const ui5 = makeUI5();
    const ui5Nav = makeNav();

    await procurement.approvePurchaseOrder(
      ui5,
      ui5Nav,
      { poNumber: '4500012345' },
      { skipNavigation: true },
    );

    expect(ui5Nav.navigateToApp).not.toHaveBeenCalled();
  });

  it('passes timeout option through to waitForSave', async () => {
    const ui5 = makeUI5();
    const ui5Nav = makeNav();

    const result = await procurement.approvePurchaseOrder(
      ui5,
      ui5Nav,
      { poNumber: '4500012345' },
      { timeout: 10_000 },
    );

    expect(result.status).toBe('success');
    expect(ui5.waitForUI5).toHaveBeenCalledWith(10_000);
  });

  it('includes clickApprove and waitForSave in stepsExecuted', async () => {
    const ui5 = makeUI5();
    const ui5Nav = makeNav();

    const result = await procurement.approvePurchaseOrder(ui5, ui5Nav, { poNumber: '4500012345' });

    expect(result.metadata.stepsExecuted).toContain('clickApprove');
    expect(result.metadata.stepsExecuted).toContain('waitForSave');
  });
});

// ── searchPurchaseOrders ──────────────────────────────────────────────────────

describe('procurement.searchPurchaseOrders', () => {
  it('navigates to PurchaseOrder-manage and clicks Go', async () => {
    const ui5 = makeUI5();
    const ui5Nav = makeNav();
    const vocab = makeVocab();

    const result = await procurement.searchPurchaseOrders(ui5, ui5Nav, vocab, { Vendor: '100001' });

    expect(result.status).toBe('success');
    expect(result.metadata.sapModule).toBe('MM');
    expect(ui5Nav.navigateToApp).toHaveBeenCalledWith('PurchaseOrder-manage');
    expect(ui5.click).toHaveBeenCalledWith({
      controlType: 'sap.m.Button',
      properties: { text: 'Go' },
    });
  });

  it('returns error when a search criteria term is not found in vocabulary', async () => {
    const ui5 = makeUI5();
    const ui5Nav = makeNav();
    const vocab: VocabLookup = {
      getFieldSelector: vi.fn().mockResolvedValue(undefined),
    };

    const result = await procurement.searchPurchaseOrders(ui5, ui5Nav, vocab, {
      Vendor: '100001',
    });

    expect(result.status).toBe('error');
    expect(result.error?.code).toBe('ERR_VOCAB_TERM_NOT_FOUND');
  });

  it('skips navigation when skipNavigation is true', async () => {
    const ui5 = makeUI5();
    const ui5Nav = makeNav();
    const vocab = makeVocab();

    await procurement.searchPurchaseOrders(
      ui5,
      ui5Nav,
      vocab,
      { Vendor: '100001' },
      { skipNavigation: true },
    );

    expect(ui5Nav.navigateToApp).not.toHaveBeenCalled();
  });
});

// ── createPurchaseRequisition ─────────────────────────────────────────────────

describe('procurement.createPurchaseRequisition', () => {
  it('navigates to PurchaseRequisition-create and fills fields', async () => {
    const ui5 = makeUI5();
    const ui5Nav = makeNav();
    const vocab = makeVocab();

    const result = await procurement.createPurchaseRequisition(ui5, ui5Nav, vocab, {
      material: 'MAT-001',
      quantity: 5,
      plant: '1000',
    });

    expect(result.status).toBe('success');
    expect(result.metadata.sapModule).toBe('MM');
    expect(ui5Nav.navigateToApp).toHaveBeenCalledWith('PurchaseRequisition-create');
  });

  it('returns error when material term is not found in vocabulary', async () => {
    const ui5 = makeUI5();
    const ui5Nav = makeNav();
    const vocab: VocabLookup = {
      getFieldSelector: vi.fn().mockResolvedValue(undefined),
    };

    const result = await procurement.createPurchaseRequisition(ui5, ui5Nav, vocab, {
      material: 'MAT-001',
      quantity: 5,
      plant: '1000',
    });

    expect(result.status).toBe('error');
    expect(result.error?.code).toBe('ERR_VOCAB_TERM_NOT_FOUND');
  });

  it('returns error when quantity term not found (material succeeds)', async () => {
    const ui5 = makeUI5();
    const ui5Nav = makeNav();
    let callCount = 0;
    const vocab: VocabLookup = {
      getFieldSelector: vi.fn().mockImplementation(async () => {
        callCount++;
        return callCount === 1 ? Promise.resolve({ id: 'field' }) : Promise.resolve(undefined);
      }),
    };

    const result = await procurement.createPurchaseRequisition(ui5, ui5Nav, vocab, {
      material: 'MAT-001',
      quantity: 5,
      plant: '1000',
    });

    expect(result.status).toBe('error');
    expect(result.metadata.stepsExecuted).toContain('fillMaterial');
  });

  it('returns error when plant term not found (material + quantity succeed)', async () => {
    const ui5 = makeUI5();
    const ui5Nav = makeNav();
    let callCount = 0;
    const vocab: VocabLookup = {
      getFieldSelector: vi.fn().mockImplementation(async () => {
        callCount++;
        return callCount <= 2 ? Promise.resolve({ id: 'field' }) : Promise.resolve(undefined);
      }),
    };

    const result = await procurement.createPurchaseRequisition(ui5, ui5Nav, vocab, {
      material: 'MAT-001',
      quantity: 5,
      plant: '1000',
    });

    expect(result.status).toBe('error');
    expect(result.metadata.stepsExecuted).toContain('fillMaterial');
    expect(result.metadata.stepsExecuted).toContain('fillQuantity');
  });

  it('skips navigation when skipNavigation is true', async () => {
    const ui5 = makeUI5();
    const ui5Nav = makeNav();
    const vocab = makeVocab();

    await procurement.createPurchaseRequisition(
      ui5,
      ui5Nav,
      vocab,
      { material: 'MAT-001', quantity: 5, plant: '1000' },
      { skipNavigation: true },
    );

    expect(ui5Nav.navigateToApp).not.toHaveBeenCalled();
  });

  it('passes timeout option through to waitForSave', async () => {
    const ui5 = makeUI5();
    const ui5Nav = makeNav();
    const vocab = makeVocab();

    const result = await procurement.createPurchaseRequisition(
      ui5,
      ui5Nav,
      vocab,
      { material: 'MAT-001', quantity: 5, plant: '1000' },
      { timeout: 20_000 },
    );

    expect(result.status).toBe('success');
    expect(ui5.waitForUI5).toHaveBeenCalledWith(20_000);
  });
});

// ── confirmGoodsReceipt ───────────────────────────────────────────────────────

describe('procurement.confirmGoodsReceipt', () => {
  it('navigates to GoodsMovement-post and clicks Post', async () => {
    const ui5 = makeUI5();
    const ui5Nav = makeNav();

    const result = await procurement.confirmGoodsReceipt(ui5, ui5Nav, {
      poNumber: '4500012345',
      quantity: 10,
    });

    expect(result.status).toBe('success');
    expect(result.metadata.sapModule).toBe('MM');
    expect(ui5Nav.navigateToApp).toHaveBeenCalledWith('GoodsMovement-post');
    expect(ui5.click).toHaveBeenCalledWith({
      controlType: 'sap.m.Button',
      properties: { text: 'Post' },
    });
  });

  it('skips navigation when skipNavigation is true', async () => {
    const ui5 = makeUI5();
    const ui5Nav = makeNav();

    await procurement.confirmGoodsReceipt(
      ui5,
      ui5Nav,
      { poNumber: '4500012345', quantity: 10 },
      { skipNavigation: true },
    );

    expect(ui5Nav.navigateToApp).not.toHaveBeenCalled();
  });

  it('passes timeout option through to waitForSave', async () => {
    const ui5 = makeUI5();
    const ui5Nav = makeNav();

    const result = await procurement.confirmGoodsReceipt(
      ui5,
      ui5Nav,
      { poNumber: '4500012345', quantity: 10 },
      { timeout: 15_000 },
    );

    expect(result.status).toBe('success');
    expect(ui5.waitForUI5).toHaveBeenCalledWith(15_000);
  });

  it('includes clickPost and waitForSave in stepsExecuted', async () => {
    const ui5 = makeUI5();
    const ui5Nav = makeNav();

    const result = await procurement.confirmGoodsReceipt(ui5, ui5Nav, {
      poNumber: '4500012345',
      quantity: 10,
    });

    expect(result.metadata.stepsExecuted).toContain('clickPost');
    expect(result.metadata.stepsExecuted).toContain('waitForSave');
  });
});

// ── searchVendors ─────────────────────────────────────────────────────────────

describe('procurement.searchVendors', () => {
  it('navigates to Supplier-manage and clicks Go', async () => {
    const ui5 = makeUI5();
    const ui5Nav = makeNav();

    const result = await procurement.searchVendors(ui5, ui5Nav);

    expect(result.status).toBe('success');
    expect(result.metadata.sapModule).toBe('MM');
    expect(ui5Nav.navigateToApp).toHaveBeenCalledWith('Supplier-manage');
  });

  it('skips navigation when skipNavigation is true', async () => {
    const ui5 = makeUI5();
    const ui5Nav = makeNav();

    await procurement.searchVendors(ui5, ui5Nav, { skipNavigation: true });

    expect(ui5Nav.navigateToApp).not.toHaveBeenCalled();
  });

  it('includes clickGo in stepsExecuted', async () => {
    const ui5 = makeUI5();
    const ui5Nav = makeNav();

    const result = await procurement.searchVendors(ui5, ui5Nav);

    expect(result.metadata.stepsExecuted).toContain('clickGo');
  });
});
