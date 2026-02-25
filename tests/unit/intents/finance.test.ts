/**
 * @license
 * Copyright (c) ZesTest 2025-2030. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0
 *
 * This file may contain AI-assisted code.
 * See LICENSE and NOTICE files for details.
 */

/**
 * Tests for `src/intents/domains/finance.ts` (FI module).
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
import * as finance from '#intents/domains/finance.js';

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

// ── createJournalEntry ────────────────────────────────────────────────────────

describe('finance.createJournalEntry', () => {
  it('navigates to JournalEntry-create and posts the entry', async () => {
    const ui5 = makeUI5();
    const ui5Nav = makeNav();
    const vocab = makeVocab();

    const result = await finance.createJournalEntry(ui5, ui5Nav, vocab, {
      documentDate: '2026-02-20',
      postingDate: '2026-02-20',
      lineItems: [{ glAccount: '400000', debitCredit: 'S', amount: 1000 }],
    });

    expect(result.status).toBe('success');
    expect(result.metadata.sapModule).toBe('FI');
    expect(ui5Nav.navigateToApp).toHaveBeenCalledWith('JournalEntry-create');
    expect(ui5.click).toHaveBeenCalledWith({
      controlType: 'sap.m.Button',
      properties: { text: 'Post' },
    });
  });

  it('sets intentName to createJournalEntry', async () => {
    const ui5 = makeUI5();
    const ui5Nav = makeNav();
    const vocab = makeVocab();

    const result = await finance.createJournalEntry(ui5, ui5Nav, vocab, {
      documentDate: '2026-02-20',
      postingDate: '2026-02-20',
      lineItems: [],
    });

    expect(result.metadata.intentName).toBe('createJournalEntry');
  });

  it('fills GL Account and Amount for each line item', async () => {
    const ui5 = makeUI5();
    const ui5Nav = makeNav();
    const vocab = makeVocab();

    await finance.createJournalEntry(ui5, ui5Nav, vocab, {
      documentDate: '2026-02-20',
      postingDate: '2026-02-20',
      lineItems: [
        { glAccount: '400000', debitCredit: 'S', amount: 1000 },
        { glAccount: '113100', debitCredit: 'H', amount: 1000 },
      ],
    });

    // documentDate + postingDate + 2×(glAccount + amount) = 6 fills
    expect(ui5.fill).toHaveBeenCalledTimes(6);
  });

  it('returns error when document date term is not in vocabulary', async () => {
    const ui5 = makeUI5();
    const ui5Nav = makeNav();
    const vocab: VocabLookup = {
      getFieldSelector: vi.fn().mockResolvedValue(undefined),
    };

    const result = await finance.createJournalEntry(ui5, ui5Nav, vocab, {
      documentDate: '2026-02-20',
      postingDate: '2026-02-20',
      lineItems: [],
    });

    expect(result.status).toBe('error');
    expect(result.error?.code).toBe('ERR_VOCAB_TERM_NOT_FOUND');
  });

  it('skips navigation when skipNavigation is true', async () => {
    const ui5 = makeUI5();
    const ui5Nav = makeNav();
    const vocab = makeVocab();

    await finance.createJournalEntry(
      ui5,
      ui5Nav,
      vocab,
      { documentDate: '2026-02-20', postingDate: '2026-02-20', lineItems: [] },
      { skipNavigation: true },
    );

    expect(ui5Nav.navigateToApp).not.toHaveBeenCalled();
  });

  it('returns error when posting date term is not found (docDate succeeds)', async () => {
    const ui5 = makeUI5();
    const ui5Nav = makeNav();
    let callCount = 0;
    const vocab: VocabLookup = {
      getFieldSelector: vi.fn().mockImplementation(async () => {
        callCount++;
        // First call (Document Date) succeeds, second call (Posting Date) fails
        return callCount === 1 ? Promise.resolve({ id: 'field' }) : Promise.resolve(undefined);
      }),
    };

    const result = await finance.createJournalEntry(ui5, ui5Nav, vocab, {
      documentDate: '2026-02-20',
      postingDate: '2026-02-20',
      lineItems: [],
    });

    expect(result.status).toBe('error');
    expect(result.metadata.stepsExecuted).toContain('fillDocumentDate');
  });

  it('returns error when G/L Account term not found for a line item', async () => {
    const ui5 = makeUI5();
    const ui5Nav = makeNav();
    let callCount = 0;
    const vocab: VocabLookup = {
      getFieldSelector: vi.fn().mockImplementation(async () => {
        callCount++;
        // First 2 calls succeed (docDate, postDate), 3rd (G/L Account) fails
        return callCount <= 2 ? Promise.resolve({ id: 'field' }) : Promise.resolve(undefined);
      }),
    };

    const result = await finance.createJournalEntry(ui5, ui5Nav, vocab, {
      documentDate: '2026-02-20',
      postingDate: '2026-02-20',
      lineItems: [{ glAccount: '400000', debitCredit: 'S', amount: 1000 }],
    });

    expect(result.status).toBe('error');
    expect(result.metadata.stepsExecuted).toContain('fillDocumentDate');
    expect(result.metadata.stepsExecuted).toContain('fillPostingDate');
  });

  it('returns error when Amount term not found for a line item (G/L succeeds)', async () => {
    const ui5 = makeUI5();
    const ui5Nav = makeNav();
    let callCount = 0;
    const vocab: VocabLookup = {
      getFieldSelector: vi.fn().mockImplementation(async () => {
        callCount++;
        // First 3 calls succeed (docDate, postDate, G/L), 4th (Amount) fails
        return callCount <= 3 ? Promise.resolve({ id: 'field' }) : Promise.resolve(undefined);
      }),
    };

    const result = await finance.createJournalEntry(ui5, ui5Nav, vocab, {
      documentDate: '2026-02-20',
      postingDate: '2026-02-20',
      lineItems: [{ glAccount: '400000', debitCredit: 'S', amount: 1000 }],
    });

    expect(result.status).toBe('error');
  });

  it('passes timeout option to waitForSave', async () => {
    const ui5 = makeUI5();
    const ui5Nav = makeNav();
    const vocab = makeVocab();

    const result = await finance.createJournalEntry(
      ui5,
      ui5Nav,
      vocab,
      { documentDate: '2026-02-20', postingDate: '2026-02-20', lineItems: [] },
      { timeout: 30_000 },
    );

    expect(result.status).toBe('success');
    expect(ui5.waitForUI5).toHaveBeenCalledWith(30_000);
  });
});

// ── postVendorInvoice ─────────────────────────────────────────────────────────

describe('finance.postVendorInvoice', () => {
  it('navigates to SupplierInvoice-create and posts the invoice', async () => {
    const ui5 = makeUI5();
    const ui5Nav = makeNav();
    const vocab = makeVocab();

    const result = await finance.postVendorInvoice(ui5, ui5Nav, vocab, {
      vendor: '100001',
      invoiceDate: '2026-02-20',
      amount: 5000,
      currency: 'EUR',
    });

    expect(result.status).toBe('success');
    expect(result.metadata.sapModule).toBe('FI');
    expect(ui5Nav.navigateToApp).toHaveBeenCalledWith('SupplierInvoice-create');
  });

  it('fills vendor, invoice date, and amount fields', async () => {
    const ui5 = makeUI5();
    const ui5Nav = makeNav();
    const vocab = makeVocab();

    await finance.postVendorInvoice(ui5, ui5Nav, vocab, {
      vendor: '100001',
      invoiceDate: '2026-02-20',
      amount: 5000,
    });

    // vendor + invoiceDate + amount = 3 fills
    expect(ui5.fill).toHaveBeenCalledTimes(3);
  });

  it('returns error when vendor term is not found', async () => {
    const ui5 = makeUI5();
    const ui5Nav = makeNav();
    const vocab: VocabLookup = {
      getFieldSelector: vi.fn().mockResolvedValue(undefined),
    };

    const result = await finance.postVendorInvoice(ui5, ui5Nav, vocab, {
      vendor: '100001',
      invoiceDate: '2026-02-20',
      amount: 5000,
    });

    expect(result.status).toBe('error');
    expect(result.error?.code).toBe('ERR_VOCAB_TERM_NOT_FOUND');
  });

  it('returns error when invoice date term not found (vendor succeeds)', async () => {
    const ui5 = makeUI5();
    const ui5Nav = makeNav();
    let callCount = 0;
    const vocab: VocabLookup = {
      getFieldSelector: vi.fn().mockImplementation(async () => {
        callCount++;
        return callCount === 1 ? Promise.resolve({ id: 'field' }) : Promise.resolve(undefined);
      }),
    };

    const result = await finance.postVendorInvoice(ui5, ui5Nav, vocab, {
      vendor: '100001',
      invoiceDate: '2026-02-20',
      amount: 5000,
    });

    expect(result.status).toBe('error');
    expect(result.metadata.stepsExecuted).toContain('fillVendor');
  });

  it('returns error when amount term not found (vendor + invDate succeed)', async () => {
    const ui5 = makeUI5();
    const ui5Nav = makeNav();
    let callCount = 0;
    const vocab: VocabLookup = {
      getFieldSelector: vi.fn().mockImplementation(async () => {
        callCount++;
        return callCount <= 2 ? Promise.resolve({ id: 'field' }) : Promise.resolve(undefined);
      }),
    };

    const result = await finance.postVendorInvoice(ui5, ui5Nav, vocab, {
      vendor: '100001',
      invoiceDate: '2026-02-20',
      amount: 5000,
    });

    expect(result.status).toBe('error');
    expect(result.metadata.stepsExecuted).toContain('fillVendor');
    expect(result.metadata.stepsExecuted).toContain('fillInvoiceDate');
  });

  it('skips navigation when skipNavigation is true', async () => {
    const ui5 = makeUI5();
    const ui5Nav = makeNav();
    const vocab = makeVocab();

    await finance.postVendorInvoice(
      ui5,
      ui5Nav,
      vocab,
      { vendor: '100001', invoiceDate: '2026-02-20', amount: 5000 },
      { skipNavigation: true },
    );

    expect(ui5Nav.navigateToApp).not.toHaveBeenCalled();
  });
});

// ── processPayment ────────────────────────────────────────────────────────────

describe('finance.processPayment', () => {
  it('navigates to OutgoingPayment-create and posts the payment', async () => {
    const ui5 = makeUI5();
    const ui5Nav = makeNav();
    const vocab = makeVocab();

    const result = await finance.processPayment(ui5, ui5Nav, vocab, {
      vendor: '100001',
      amount: 5000,
      paymentDate: '2026-02-28',
    });

    expect(result.status).toBe('success');
    expect(result.metadata.sapModule).toBe('FI');
    expect(result.metadata.intentName).toBe('processPayment');
    expect(ui5Nav.navigateToApp).toHaveBeenCalledWith('OutgoingPayment-create');
  });

  it('fills vendor, amount, and payment date fields', async () => {
    const ui5 = makeUI5();
    const ui5Nav = makeNav();
    const vocab = makeVocab();

    await finance.processPayment(ui5, ui5Nav, vocab, {
      vendor: '100001',
      amount: 5000,
      paymentDate: '2026-02-28',
    });

    // vendor + amount + paymentDate = 3 fills
    expect(ui5.fill).toHaveBeenCalledTimes(3);
  });

  it('returns error when vendor term is not found', async () => {
    const ui5 = makeUI5();
    const ui5Nav = makeNav();
    const vocab: VocabLookup = {
      getFieldSelector: vi.fn().mockResolvedValue(undefined),
    };

    const result = await finance.processPayment(ui5, ui5Nav, vocab, {
      vendor: '100001',
      amount: 5000,
      paymentDate: '2026-02-28',
    });

    expect(result.status).toBe('error');
    expect(result.error?.code).toBe('ERR_VOCAB_TERM_NOT_FOUND');
  });

  it('returns error when amount term not found (vendor succeeds)', async () => {
    const ui5 = makeUI5();
    const ui5Nav = makeNav();
    let callCount = 0;
    const vocab: VocabLookup = {
      getFieldSelector: vi.fn().mockImplementation(async () => {
        callCount++;
        return callCount === 1 ? Promise.resolve({ id: 'field' }) : Promise.resolve(undefined);
      }),
    };

    const result = await finance.processPayment(ui5, ui5Nav, vocab, {
      vendor: '100001',
      amount: 5000,
      paymentDate: '2026-02-28',
    });

    expect(result.status).toBe('error');
    expect(result.metadata.stepsExecuted).toContain('fillVendor');
  });

  it('returns error when payment date term not found (vendor + amount succeed)', async () => {
    const ui5 = makeUI5();
    const ui5Nav = makeNav();
    let callCount = 0;
    const vocab: VocabLookup = {
      getFieldSelector: vi.fn().mockImplementation(async () => {
        callCount++;
        return callCount <= 2 ? Promise.resolve({ id: 'field' }) : Promise.resolve(undefined);
      }),
    };

    const result = await finance.processPayment(ui5, ui5Nav, vocab, {
      vendor: '100001',
      amount: 5000,
      paymentDate: '2026-02-28',
    });

    expect(result.status).toBe('error');
    expect(result.metadata.stepsExecuted).toContain('fillVendor');
    expect(result.metadata.stepsExecuted).toContain('fillAmount');
  });

  it('skips navigation when skipNavigation is true', async () => {
    const ui5 = makeUI5();
    const ui5Nav = makeNav();
    const vocab = makeVocab();

    await finance.processPayment(
      ui5,
      ui5Nav,
      vocab,
      { vendor: '100001', amount: 5000, paymentDate: '2026-02-28' },
      { skipNavigation: true },
    );

    expect(ui5Nav.navigateToApp).not.toHaveBeenCalled();
  });

  it('passes timeout option through to waitForSave', async () => {
    const ui5 = makeUI5();
    const ui5Nav = makeNav();
    const vocab = makeVocab();

    const result = await finance.processPayment(
      ui5,
      ui5Nav,
      vocab,
      { vendor: '100001', amount: 5000, paymentDate: '2026-02-28' },
      { timeout: 20_000 },
    );

    expect(result.status).toBe('success');
    expect(ui5.waitForUI5).toHaveBeenCalledWith(20_000);
  });
});
