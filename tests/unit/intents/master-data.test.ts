/**
 * Tests for `src/intents/domains/master-data.ts` (MD module).
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
import * as masterData from '#intents/domains/master-data.js';

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

// ── createVendorMaster ────────────────────────────────────────────────────────

describe('masterData.createVendorMaster', () => {
  it('navigates to Supplier-create and fills name and country', async () => {
    const ui5 = makeUI5();
    const ui5Nav = makeNav();
    const vocab = makeVocab();

    const result = await masterData.createVendorMaster(ui5, ui5Nav, vocab, {
      name: 'Acme GmbH',
      country: 'DE',
    });

    expect(result.status).toBe('success');
    expect(result.metadata.sapModule).toBe('MD');
    expect(result.metadata.intentName).toBe('createVendorMaster');
    expect(ui5Nav.navigateToApp).toHaveBeenCalledWith('Supplier-create');
    // name + country = 2 fills (no taxId provided)
    expect(ui5.fill).toHaveBeenCalledTimes(2);
  });

  it('also fills taxId when provided', async () => {
    const ui5 = makeUI5();
    const ui5Nav = makeNav();
    const vocab = makeVocab();

    await masterData.createVendorMaster(ui5, ui5Nav, vocab, {
      name: 'Acme GmbH',
      country: 'DE',
      taxId: 'DE123456789',
    });

    // name + country + taxId = 3 fills
    expect(ui5.fill).toHaveBeenCalledTimes(3);
  });

  it('returns error when name term is not in vocabulary', async () => {
    const ui5 = makeUI5();
    const ui5Nav = makeNav();
    const vocab: VocabLookup = {
      getFieldSelector: vi.fn().mockResolvedValue(undefined),
    };

    const result = await masterData.createVendorMaster(ui5, ui5Nav, vocab, {
      name: 'Acme GmbH',
      country: 'DE',
    });

    expect(result.status).toBe('error');
    expect(result.error?.code).toBe('ERR_VOCAB_TERM_NOT_FOUND');
  });

  it('skips navigation when skipNavigation is true', async () => {
    const ui5 = makeUI5();
    const ui5Nav = makeNav();
    const vocab = makeVocab();

    await masterData.createVendorMaster(
      ui5,
      ui5Nav,
      vocab,
      { name: 'Acme GmbH', country: 'DE' },
      { skipNavigation: true },
    );

    expect(ui5Nav.navigateToApp).not.toHaveBeenCalled();
  });

  it('includes fillName and fillCountry in stepsExecuted', async () => {
    const ui5 = makeUI5();
    const ui5Nav = makeNav();
    const vocab = makeVocab();

    const result = await masterData.createVendorMaster(ui5, ui5Nav, vocab, {
      name: 'Acme GmbH',
      country: 'DE',
    });

    expect(result.metadata.stepsExecuted).toContain('fillName');
    expect(result.metadata.stepsExecuted).toContain('fillCountry');
    expect(result.metadata.stepsExecuted).toContain('clickSave');
  });

  it('returns error when country term not found (name succeeds)', async () => {
    const ui5 = makeUI5();
    const ui5Nav = makeNav();
    let callCount = 0;
    const vocab: VocabLookup = {
      getFieldSelector: vi.fn().mockImplementation(async () => {
        callCount++;
        return callCount === 1 ? Promise.resolve({ id: 'field' }) : Promise.resolve(undefined);
      }),
    };

    const result = await masterData.createVendorMaster(ui5, ui5Nav, vocab, {
      name: 'Acme GmbH',
      country: 'DE',
    });

    expect(result.status).toBe('error');
    expect(result.metadata.stepsExecuted).toContain('fillName');
  });

  it('returns error when taxId term not found (name + country succeed)', async () => {
    const ui5 = makeUI5();
    const ui5Nav = makeNav();
    let callCount = 0;
    const vocab: VocabLookup = {
      getFieldSelector: vi.fn().mockImplementation(async () => {
        callCount++;
        return callCount <= 2 ? Promise.resolve({ id: 'field' }) : Promise.resolve(undefined);
      }),
    };

    const result = await masterData.createVendorMaster(ui5, ui5Nav, vocab, {
      name: 'Acme GmbH',
      country: 'DE',
      taxId: 'DE123456789',
    });

    expect(result.status).toBe('error');
    expect(result.metadata.stepsExecuted).toContain('fillName');
    expect(result.metadata.stepsExecuted).toContain('fillCountry');
  });

  it('includes fillTaxId in stepsExecuted on success with taxId', async () => {
    const ui5 = makeUI5();
    const ui5Nav = makeNav();
    const vocab = makeVocab();

    const result = await masterData.createVendorMaster(ui5, ui5Nav, vocab, {
      name: 'Acme GmbH',
      country: 'DE',
      taxId: 'DE123456789',
    });

    expect(result.status).toBe('success');
    expect(result.metadata.stepsExecuted).toContain('fillTaxId');
  });

  it('passes timeout option through to waitForSave', async () => {
    const ui5 = makeUI5();
    const ui5Nav = makeNav();
    const vocab = makeVocab();

    const result = await masterData.createVendorMaster(
      ui5,
      ui5Nav,
      vocab,
      { name: 'Acme GmbH', country: 'DE' },
      { timeout: 20_000 },
    );

    expect(result.status).toBe('success');
    expect(ui5.waitForUI5).toHaveBeenCalledWith(20_000);
  });
});

// ── createCustomerMaster ──────────────────────────────────────────────────────

describe('masterData.createCustomerMaster', () => {
  it('navigates to Customer-create and fills required fields', async () => {
    const ui5 = makeUI5();
    const ui5Nav = makeNav();
    const vocab = makeVocab();

    const result = await masterData.createCustomerMaster(ui5, ui5Nav, vocab, {
      name: 'Globex Corp',
      country: 'US',
    });

    expect(result.status).toBe('success');
    expect(result.metadata.sapModule).toBe('MD');
    expect(result.metadata.intentName).toBe('createCustomerMaster');
    expect(ui5Nav.navigateToApp).toHaveBeenCalledWith('Customer-create');
    // name + country = 2 fills (no salesOrganization provided)
    expect(ui5.fill).toHaveBeenCalledTimes(2);
  });

  it('also fills salesOrganization when provided', async () => {
    const ui5 = makeUI5();
    const ui5Nav = makeNav();
    const vocab = makeVocab();

    await masterData.createCustomerMaster(ui5, ui5Nav, vocab, {
      name: 'Globex Corp',
      country: 'US',
      salesOrganization: '1000',
    });

    // name + country + salesOrganization = 3 fills
    expect(ui5.fill).toHaveBeenCalledTimes(3);
  });

  it('returns error when name term is not in vocabulary', async () => {
    const ui5 = makeUI5();
    const ui5Nav = makeNav();
    const vocab: VocabLookup = {
      getFieldSelector: vi.fn().mockResolvedValue(undefined),
    };

    const result = await masterData.createCustomerMaster(ui5, ui5Nav, vocab, {
      name: 'Globex Corp',
      country: 'US',
    });

    expect(result.status).toBe('error');
    expect(result.error?.code).toBe('ERR_VOCAB_TERM_NOT_FOUND');
  });

  it('returns error when country term not found (name succeeds)', async () => {
    const ui5 = makeUI5();
    const ui5Nav = makeNav();
    let callCount = 0;
    const vocab: VocabLookup = {
      getFieldSelector: vi.fn().mockImplementation(async () => {
        callCount++;
        return callCount === 1 ? Promise.resolve({ id: 'field' }) : Promise.resolve(undefined);
      }),
    };

    const result = await masterData.createCustomerMaster(ui5, ui5Nav, vocab, {
      name: 'Globex Corp',
      country: 'US',
    });

    expect(result.status).toBe('error');
    expect(result.metadata.stepsExecuted).toContain('fillName');
  });

  it('returns error when salesOrganization term not found (name + country succeed)', async () => {
    const ui5 = makeUI5();
    const ui5Nav = makeNav();
    let callCount = 0;
    const vocab: VocabLookup = {
      getFieldSelector: vi.fn().mockImplementation(async () => {
        callCount++;
        return callCount <= 2 ? Promise.resolve({ id: 'field' }) : Promise.resolve(undefined);
      }),
    };

    const result = await masterData.createCustomerMaster(ui5, ui5Nav, vocab, {
      name: 'Globex Corp',
      country: 'US',
      salesOrganization: '1000',
    });

    expect(result.status).toBe('error');
    expect(result.metadata.stepsExecuted).toContain('fillName');
    expect(result.metadata.stepsExecuted).toContain('fillCountry');
  });

  it('includes fillSalesOrganization in stepsExecuted on success', async () => {
    const ui5 = makeUI5();
    const ui5Nav = makeNav();
    const vocab = makeVocab();

    const result = await masterData.createCustomerMaster(ui5, ui5Nav, vocab, {
      name: 'Globex Corp',
      country: 'US',
      salesOrganization: '1000',
    });

    expect(result.status).toBe('success');
    expect(result.metadata.stepsExecuted).toContain('fillSalesOrganization');
  });

  it('skips navigation when skipNavigation is true', async () => {
    const ui5 = makeUI5();
    const ui5Nav = makeNav();
    const vocab = makeVocab();

    await masterData.createCustomerMaster(
      ui5,
      ui5Nav,
      vocab,
      { name: 'Globex Corp', country: 'US' },
      { skipNavigation: true },
    );

    expect(ui5Nav.navigateToApp).not.toHaveBeenCalled();
  });

  it('passes timeout option through to waitForSave', async () => {
    const ui5 = makeUI5();
    const ui5Nav = makeNav();
    const vocab = makeVocab();

    const result = await masterData.createCustomerMaster(
      ui5,
      ui5Nav,
      vocab,
      { name: 'Globex Corp', country: 'US' },
      { timeout: 25_000 },
    );

    expect(result.status).toBe('success');
    expect(ui5.waitForUI5).toHaveBeenCalledWith(25_000);
  });
});

// ── createMaterialMaster ──────────────────────────────────────────────────────

describe('masterData.createMaterialMaster', () => {
  it('navigates to Material-create and fills required fields', async () => {
    const ui5 = makeUI5();
    const ui5Nav = makeNav();
    const vocab = makeVocab();

    const result = await masterData.createMaterialMaster(ui5, ui5Nav, vocab, {
      materialNumber: 'RAW-0001',
      description: 'Raw material A',
    });

    expect(result.status).toBe('success');
    expect(result.metadata.sapModule).toBe('MD');
    expect(result.metadata.intentName).toBe('createMaterialMaster');
    expect(ui5Nav.navigateToApp).toHaveBeenCalledWith('Material-create');
    // materialNumber + description = 2 fills
    expect(ui5.fill).toHaveBeenCalledTimes(2);
  });

  it('fills materialType and baseUnit when provided', async () => {
    const ui5 = makeUI5();
    const ui5Nav = makeNav();
    const vocab = makeVocab();

    await masterData.createMaterialMaster(ui5, ui5Nav, vocab, {
      materialNumber: 'RAW-0001',
      description: 'Raw material A',
      materialType: 'ROH',
      baseUnit: 'KG',
    });

    // materialNumber + description + materialType + baseUnit = 4 fills
    expect(ui5.fill).toHaveBeenCalledTimes(4);
  });

  it('returns error when material number term is not found in vocabulary', async () => {
    const ui5 = makeUI5();
    const ui5Nav = makeNav();
    const vocab: VocabLookup = {
      getFieldSelector: vi.fn().mockResolvedValue(undefined),
    };

    const result = await masterData.createMaterialMaster(ui5, ui5Nav, vocab, {
      materialNumber: 'RAW-0001',
      description: 'Raw material A',
    });

    expect(result.status).toBe('error');
    expect(result.error?.code).toBe('ERR_VOCAB_TERM_NOT_FOUND');
  });

  it('skips navigation when skipNavigation is true', async () => {
    const ui5 = makeUI5();
    const ui5Nav = makeNav();
    const vocab = makeVocab();

    await masterData.createMaterialMaster(
      ui5,
      ui5Nav,
      vocab,
      { materialNumber: 'RAW-0001', description: 'Raw material A' },
      { skipNavigation: true },
    );

    expect(ui5Nav.navigateToApp).not.toHaveBeenCalled();
  });

  it('includes fillMaterialNumber and fillDescription in stepsExecuted', async () => {
    const ui5 = makeUI5();
    const ui5Nav = makeNav();
    const vocab = makeVocab();

    const result = await masterData.createMaterialMaster(ui5, ui5Nav, vocab, {
      materialNumber: 'RAW-0001',
      description: 'Raw material A',
    });

    expect(result.metadata.stepsExecuted).toContain('fillMaterialNumber');
    expect(result.metadata.stepsExecuted).toContain('fillDescription');
    expect(result.metadata.stepsExecuted).toContain('clickSave');
  });

  it('returns error when description term not found (materialNumber succeeds)', async () => {
    const ui5 = makeUI5();
    const ui5Nav = makeNav();
    let callCount = 0;
    const vocab: VocabLookup = {
      getFieldSelector: vi.fn().mockImplementation(async () => {
        callCount++;
        return callCount === 1 ? Promise.resolve({ id: 'field' }) : Promise.resolve(undefined);
      }),
    };

    const result = await masterData.createMaterialMaster(ui5, ui5Nav, vocab, {
      materialNumber: 'RAW-0001',
      description: 'Raw material A',
    });

    expect(result.status).toBe('error');
    expect(result.metadata.stepsExecuted).toContain('fillMaterialNumber');
  });

  it('returns error when materialType term not found (required fields succeed)', async () => {
    const ui5 = makeUI5();
    const ui5Nav = makeNav();
    let callCount = 0;
    const vocab: VocabLookup = {
      getFieldSelector: vi.fn().mockImplementation(async () => {
        callCount++;
        return callCount <= 2 ? Promise.resolve({ id: 'field' }) : Promise.resolve(undefined);
      }),
    };

    const result = await masterData.createMaterialMaster(ui5, ui5Nav, vocab, {
      materialNumber: 'RAW-0001',
      description: 'Raw material A',
      materialType: 'ROH',
    });

    expect(result.status).toBe('error');
    expect(result.metadata.stepsExecuted).toContain('fillMaterialNumber');
    expect(result.metadata.stepsExecuted).toContain('fillDescription');
  });

  it('returns error when baseUnit term not found (materialType succeeds)', async () => {
    const ui5 = makeUI5();
    const ui5Nav = makeNav();
    let callCount = 0;
    const vocab: VocabLookup = {
      getFieldSelector: vi.fn().mockImplementation(async () => {
        callCount++;
        // materialNumber + description + materialType succeed (3), baseUnit fails
        return callCount <= 3 ? Promise.resolve({ id: 'field' }) : Promise.resolve(undefined);
      }),
    };

    const result = await masterData.createMaterialMaster(ui5, ui5Nav, vocab, {
      materialNumber: 'RAW-0001',
      description: 'Raw material A',
      materialType: 'ROH',
      baseUnit: 'KG',
    });

    expect(result.status).toBe('error');
    expect(result.metadata.stepsExecuted).toContain('fillMaterialType');
  });

  it('fills only materialType when baseUnit is not provided', async () => {
    const ui5 = makeUI5();
    const ui5Nav = makeNav();
    const vocab = makeVocab();

    const result = await masterData.createMaterialMaster(ui5, ui5Nav, vocab, {
      materialNumber: 'RAW-0001',
      description: 'Raw material A',
      materialType: 'ROH',
    });

    expect(result.status).toBe('success');
    // materialNumber + description + materialType = 3 fills
    expect(ui5.fill).toHaveBeenCalledTimes(3);
    expect(result.metadata.stepsExecuted).toContain('fillMaterialType');
  });

  it('fills only baseUnit when materialType is not provided', async () => {
    const ui5 = makeUI5();
    const ui5Nav = makeNav();
    const vocab = makeVocab();

    const result = await masterData.createMaterialMaster(ui5, ui5Nav, vocab, {
      materialNumber: 'RAW-0001',
      description: 'Raw material A',
      baseUnit: 'KG',
    });

    expect(result.status).toBe('success');
    // materialNumber + description + baseUnit = 3 fills
    expect(ui5.fill).toHaveBeenCalledTimes(3);
    expect(result.metadata.stepsExecuted).toContain('fillBaseUnit');
  });

  it('passes timeout option through to waitForSave', async () => {
    const ui5 = makeUI5();
    const ui5Nav = makeNav();
    const vocab = makeVocab();

    const result = await masterData.createMaterialMaster(
      ui5,
      ui5Nav,
      vocab,
      { materialNumber: 'RAW-0001', description: 'Raw material A' },
      { timeout: 10_000 },
    );

    expect(result.status).toBe('success');
    expect(ui5.waitForUI5).toHaveBeenCalledWith(10_000);
  });
});
