/**
 * Tests for `src/intents/domains/sales.ts` (SD module).
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
import * as sales from '#intents/domains/sales.js';

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
    getText: vi.fn().mockResolvedValue('Completely Delivered'),
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

// ── createSalesOrder ──────────────────────────────────────────────────────────

describe('sales.createSalesOrder', () => {
  it('navigates to SalesOrder-create and fills required fields', async () => {
    const ui5 = makeUI5();
    const ui5Nav = makeNav();
    const vocab = makeVocab();

    const result = await sales.createSalesOrder(ui5, ui5Nav, vocab, {
      customer: '200001',
      material: 'FG-1000',
      quantity: 5,
      salesOrganization: '1000',
    });

    expect(result.status).toBe('success');
    expect(result.metadata.sapModule).toBe('SD');
    expect(ui5Nav.navigateToApp).toHaveBeenCalledWith('SalesOrder-create');
    expect(ui5.fill).toHaveBeenCalledTimes(3);
    expect(ui5.click).toHaveBeenCalledWith({
      controlType: 'sap.m.Button',
      properties: { text: 'Save' },
    });
  });

  it('sets intentName to createSalesOrder', async () => {
    const ui5 = makeUI5();
    const ui5Nav = makeNav();
    const vocab = makeVocab();

    const result = await sales.createSalesOrder(ui5, ui5Nav, vocab, {
      customer: '1',
      material: 'M',
      quantity: 1,
      salesOrganization: '1',
    });

    expect(result.metadata.intentName).toBe('createSalesOrder');
  });

  it('returns error when customer term is not in vocabulary', async () => {
    const ui5 = makeUI5();
    const ui5Nav = makeNav();
    const vocab: VocabLookup = {
      getFieldSelector: vi.fn().mockResolvedValue(undefined),
    };

    const result = await sales.createSalesOrder(ui5, ui5Nav, vocab, {
      customer: '1',
      material: 'M',
      quantity: 1,
      salesOrganization: '1',
    });

    expect(result.status).toBe('error');
    expect(result.error?.code).toBe('ERR_VOCAB_TERM_NOT_FOUND');
  });

  it('skips navigation when skipNavigation is true', async () => {
    const ui5 = makeUI5();
    const ui5Nav = makeNav();
    const vocab = makeVocab();

    await sales.createSalesOrder(
      ui5,
      ui5Nav,
      vocab,
      { customer: '1', material: 'M', quantity: 1, salesOrganization: '1' },
      { skipNavigation: true },
    );

    expect(ui5Nav.navigateToApp).not.toHaveBeenCalled();
  });

  it('returns error when material term not found (customer succeeds)', async () => {
    const ui5 = makeUI5();
    const ui5Nav = makeNav();
    let callCount = 0;
    const vocab: VocabLookup = {
      getFieldSelector: vi.fn().mockImplementation(async () => {
        callCount++;
        return callCount === 1 ? Promise.resolve({ id: 'field' }) : Promise.resolve(undefined);
      }),
    };

    const result = await sales.createSalesOrder(ui5, ui5Nav, vocab, {
      customer: '1',
      material: 'M',
      quantity: 1,
      salesOrganization: '1',
    });

    expect(result.status).toBe('error');
    expect(result.metadata.stepsExecuted).toContain('fillCustomer');
  });

  it('returns error when quantity term not found (customer + material succeed)', async () => {
    const ui5 = makeUI5();
    const ui5Nav = makeNav();
    let callCount = 0;
    const vocab: VocabLookup = {
      getFieldSelector: vi.fn().mockImplementation(async () => {
        callCount++;
        return callCount <= 2 ? Promise.resolve({ id: 'field' }) : Promise.resolve(undefined);
      }),
    };

    const result = await sales.createSalesOrder(ui5, ui5Nav, vocab, {
      customer: '1',
      material: 'M',
      quantity: 1,
      salesOrganization: '1',
    });

    expect(result.status).toBe('error');
    expect(result.metadata.stepsExecuted).toContain('fillCustomer');
    expect(result.metadata.stepsExecuted).toContain('fillMaterial');
  });

  it('passes timeout option through to waitForSave', async () => {
    const ui5 = makeUI5();
    const ui5Nav = makeNav();
    const vocab = makeVocab();

    const result = await sales.createSalesOrder(
      ui5,
      ui5Nav,
      vocab,
      { customer: '1', material: 'M', quantity: 1, salesOrganization: '1' },
      { timeout: 30_000 },
    );

    expect(result.status).toBe('success');
    expect(ui5.waitForUI5).toHaveBeenCalledWith(30_000);
  });

  it('includes stepsExecuted with all fill steps', async () => {
    const ui5 = makeUI5();
    const ui5Nav = makeNav();
    const vocab = makeVocab();

    const result = await sales.createSalesOrder(ui5, ui5Nav, vocab, {
      customer: '1',
      material: 'M',
      quantity: 1,
      salesOrganization: '1',
    });

    expect(result.metadata.stepsExecuted).toContain('navigate');
    expect(result.metadata.stepsExecuted).toContain('fillCustomer');
    expect(result.metadata.stepsExecuted).toContain('fillMaterial');
    expect(result.metadata.stepsExecuted).toContain('fillQuantity');
    expect(result.metadata.stepsExecuted).toContain('clickSave');
  });
});

// ── createQuotation ───────────────────────────────────────────────────────────

describe('sales.createQuotation', () => {
  it('navigates to Quotation-create and saves', async () => {
    const ui5 = makeUI5();
    const ui5Nav = makeNav();
    const vocab = makeVocab();

    const result = await sales.createQuotation(ui5, ui5Nav, vocab, {
      customer: '200001',
      material: 'FG-1000',
      quantity: 10,
    });

    expect(result.status).toBe('success');
    expect(result.metadata.sapModule).toBe('SD');
    expect(ui5Nav.navigateToApp).toHaveBeenCalledWith('Quotation-create');
  });

  it('returns error when customer term is not found in vocabulary', async () => {
    const ui5 = makeUI5();
    const ui5Nav = makeNav();
    const vocab: VocabLookup = {
      getFieldSelector: vi.fn().mockResolvedValue(undefined),
    };

    const result = await sales.createQuotation(ui5, ui5Nav, vocab, {
      customer: '200001',
      material: 'FG-1000',
      quantity: 10,
    });

    expect(result.status).toBe('error');
    expect(result.error?.code).toBe('ERR_VOCAB_TERM_NOT_FOUND');
  });

  it('returns error when material term not found (customer succeeds)', async () => {
    const ui5 = makeUI5();
    const ui5Nav = makeNav();
    let callCount = 0;
    const vocab: VocabLookup = {
      getFieldSelector: vi.fn().mockImplementation(async () => {
        callCount++;
        return callCount === 1 ? Promise.resolve({ id: 'field' }) : Promise.resolve(undefined);
      }),
    };

    const result = await sales.createQuotation(ui5, ui5Nav, vocab, {
      customer: '200001',
      material: 'FG-1000',
      quantity: 10,
    });

    expect(result.status).toBe('error');
    expect(result.metadata.stepsExecuted).toContain('fillCustomer');
  });

  it('skips navigation when skipNavigation is true', async () => {
    const ui5 = makeUI5();
    const ui5Nav = makeNav();
    const vocab = makeVocab();

    await sales.createQuotation(
      ui5,
      ui5Nav,
      vocab,
      { customer: '200001', material: 'FG-1000', quantity: 10 },
      { skipNavigation: true },
    );

    expect(ui5Nav.navigateToApp).not.toHaveBeenCalled();
  });

  it('passes timeout option through to waitForSave', async () => {
    const ui5 = makeUI5();
    const ui5Nav = makeNav();
    const vocab = makeVocab();

    const result = await sales.createQuotation(
      ui5,
      ui5Nav,
      vocab,
      { customer: '200001', material: 'FG-1000', quantity: 10 },
      { timeout: 20_000 },
    );

    expect(result.status).toBe('success');
    expect(ui5.waitForUI5).toHaveBeenCalledWith(20_000);
  });

  it('includes fillCustomer and fillMaterial in stepsExecuted', async () => {
    const ui5 = makeUI5();
    const ui5Nav = makeNav();
    const vocab = makeVocab();

    const result = await sales.createQuotation(ui5, ui5Nav, vocab, {
      customer: '200001',
      material: 'FG-1000',
      quantity: 10,
    });

    expect(result.metadata.stepsExecuted).toContain('fillCustomer');
    expect(result.metadata.stepsExecuted).toContain('fillMaterial');
    expect(result.metadata.stepsExecuted).toContain('clickSave');
  });
});

// ── approveQuotation ──────────────────────────────────────────────────────────

describe('sales.approveQuotation', () => {
  it('navigates to Quotation-manage and clicks Approve', async () => {
    const ui5 = makeUI5();
    const ui5Nav = makeNav();

    const result = await sales.approveQuotation(ui5, ui5Nav, { quotationNumber: '20000123' });

    expect(result.status).toBe('success');
    expect(result.metadata.sapModule).toBe('SD');
    expect(ui5Nav.navigateToApp).toHaveBeenCalledWith('Quotation-manage');
    expect(ui5.click).toHaveBeenCalledWith({
      controlType: 'sap.m.Button',
      properties: { text: 'Approve' },
    });
  });

  it('skips navigation when skipNavigation is true', async () => {
    const ui5 = makeUI5();
    const ui5Nav = makeNav();

    await sales.approveQuotation(
      ui5,
      ui5Nav,
      { quotationNumber: '20000123' },
      { skipNavigation: true },
    );

    expect(ui5Nav.navigateToApp).not.toHaveBeenCalled();
  });

  it('passes timeout option through to waitForSave', async () => {
    const ui5 = makeUI5();
    const ui5Nav = makeNav();

    const result = await sales.approveQuotation(
      ui5,
      ui5Nav,
      { quotationNumber: '20000123' },
      { timeout: 10_000 },
    );

    expect(result.status).toBe('success');
    expect(ui5.waitForUI5).toHaveBeenCalledWith(10_000);
  });

  it('includes clickApprove and waitForSave in stepsExecuted', async () => {
    const ui5 = makeUI5();
    const ui5Nav = makeNav();

    const result = await sales.approveQuotation(ui5, ui5Nav, { quotationNumber: '20000123' });

    expect(result.metadata.stepsExecuted).toContain('clickApprove');
    expect(result.metadata.stepsExecuted).toContain('waitForSave');
  });
});

// ── searchSalesOrders ─────────────────────────────────────────────────────────

describe('sales.searchSalesOrders', () => {
  it('navigates to SalesOrder-manage and clicks Go', async () => {
    const ui5 = makeUI5();
    const ui5Nav = makeNav();
    const vocab = makeVocab();

    const result = await sales.searchSalesOrders(ui5, ui5Nav, vocab, { Customer: '200001' });

    expect(result.status).toBe('success');
    expect(result.metadata.sapModule).toBe('SD');
    expect(ui5Nav.navigateToApp).toHaveBeenCalledWith('SalesOrder-manage');
  });

  it('returns error when a search criteria term is not found in vocabulary', async () => {
    const ui5 = makeUI5();
    const ui5Nav = makeNav();
    const vocab: VocabLookup = {
      getFieldSelector: vi.fn().mockResolvedValue(undefined),
    };

    const result = await sales.searchSalesOrders(ui5, ui5Nav, vocab, { Customer: '200001' });

    expect(result.status).toBe('error');
    expect(result.error?.code).toBe('ERR_VOCAB_TERM_NOT_FOUND');
  });

  it('skips navigation when skipNavigation is true', async () => {
    const ui5 = makeUI5();
    const ui5Nav = makeNav();
    const vocab = makeVocab();

    await sales.searchSalesOrders(
      ui5,
      ui5Nav,
      vocab,
      { Customer: '200001' },
      { skipNavigation: true },
    );

    expect(ui5Nav.navigateToApp).not.toHaveBeenCalled();
  });
});

// ── searchCustomers ────────────────────────────────────────────────────────────

describe('sales.searchCustomers', () => {
  it('navigates to Customer-manage and clicks Go', async () => {
    const ui5 = makeUI5();
    const ui5Nav = makeNav();

    const result = await sales.searchCustomers(ui5, ui5Nav);

    expect(result.status).toBe('success');
    expect(result.metadata.sapModule).toBe('SD');
    expect(ui5Nav.navigateToApp).toHaveBeenCalledWith('Customer-manage');
  });

  it('skips navigation when skipNavigation is true', async () => {
    const ui5 = makeUI5();
    const ui5Nav = makeNav();

    await sales.searchCustomers(ui5, ui5Nav, { skipNavigation: true });

    expect(ui5Nav.navigateToApp).not.toHaveBeenCalled();
  });

  it('includes clickGo in stepsExecuted', async () => {
    const ui5 = makeUI5();
    const ui5Nav = makeNav();

    const result = await sales.searchCustomers(ui5, ui5Nav);

    expect(result.metadata.stepsExecuted).toContain('clickGo');
  });
});

// ── checkDeliveryStatus ───────────────────────────────────────────────────────

describe('sales.checkDeliveryStatus', () => {
  it('navigates to SalesOrder-manage and returns delivery status text', async () => {
    const ui5 = makeUI5();
    const ui5Nav = makeNav();

    const result = await sales.checkDeliveryStatus(ui5, ui5Nav, { salesOrderNumber: '10000001' });

    expect(result.status).toBe('success');
    expect(result.metadata.sapModule).toBe('SD');
    expect(result.data).toBe('Completely Delivered');
  });

  it('includes getDeliveryStatus in stepsExecuted', async () => {
    const ui5 = makeUI5();
    const ui5Nav = makeNav();

    const result = await sales.checkDeliveryStatus(ui5, ui5Nav, { salesOrderNumber: '10000001' });

    expect(result.metadata.stepsExecuted).toContain('getDeliveryStatus');
  });

  it('skips navigation when skipNavigation is true', async () => {
    const ui5 = makeUI5();
    const ui5Nav = makeNav();

    await sales.checkDeliveryStatus(
      ui5,
      ui5Nav,
      { salesOrderNumber: '10000001' },
      { skipNavigation: true },
    );

    expect(ui5Nav.navigateToApp).not.toHaveBeenCalled();
  });

  it('includes navigate in stepsExecuted when navigation is not skipped', async () => {
    const ui5 = makeUI5();
    const ui5Nav = makeNav();

    const result = await sales.checkDeliveryStatus(ui5, ui5Nav, { salesOrderNumber: '10000001' });

    expect(result.metadata.stepsExecuted).toContain('navigate');
  });
});
