/**
 * @license
 * Copyright (c) ZesTest 2025-2030. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0
 *
 * This file may contain AI-assisted code.
 * See LICENSE and NOTICE files for details.
 */

/**
 * Finance (FI) intent domain functions.
 *
 * @remarks
 * Covers SAP Financial Accounting scenarios: journal entry posting,
 * vendor invoice posting, and payment processing.
 *
 * @sapModule FI
 * @businessContext SAP Financial Accounting — record-to-report lifecycle.
 * @module intents
 */

import type { UI5HandlerSlice, VocabLookup } from '../core-wrappers.js';
import { clickButton, fillField, waitForSave } from '../core-wrappers.js';
import type {
  IntentOptions,
  IntentResult,
  JournalEntryData,
  PaymentData,
  VendorInvoiceData,
} from '../types.js';

// ── Inline navigation API interface ───────────────────────────────────────

/**
 * Minimal navigation API for FI intent functions.
 */
interface NavAPI {
  navigateToApp(appId: string, options?: unknown): Promise<void>;
  navigateToHash(hash: string, options?: unknown): Promise<void>;
}

// ── Internal helper ────────────────────────────────────────────────────────

/** Builds an FI-scoped `IntentResult<T>`. */
function fiResult<T>(params: {
  status: 'success' | 'error' | 'partial';
  intentName: string;
  startTime: number;
  stepsExecuted: string[];
  data?: T;
  error?: { readonly code: string; readonly message: string };
  retryable?: boolean;
  suggestions?: string[];
}): IntentResult<T> {
  // Type assertion: exactOptionalPropertyTypes requires omitting undefined optional fields;
  // conditional spread produces a union type TypeScript cannot narrow to IntentResult<T>
  return {
    status: params.status,
    ...(params.data !== undefined && { data: params.data }),
    ...(params.error !== undefined && { error: params.error }),
    metadata: {
      duration: Date.now() - params.startTime,
      retryable: params.retryable ?? false,
      suggestions: params.suggestions ?? [],
      intentName: params.intentName,
      sapModule: 'FI',
      stepsExecuted: params.stepsExecuted,
    },
  };
}

// ── Public intent functions ────────────────────────────────────────────────

/**
 * Creates and posts a journal entry (FI-GL FB50).
 *
 * @remarks
 * Navigates to the `JournalEntry-create` FLP hash, fills document date,
 * posting date, and line items, then clicks Post.
 *
 * @param ui5 - UI5 interaction handler.
 * @param ui5Nav - Navigation API.
 * @param vocabulary - Vocabulary lookup service.
 * @param input - Journal entry data.
 * @param options - Optional intent options.
 * @returns `IntentResult` describing the outcome.
 *
 * @intent Create and post a general-ledger journal entry.
 * @capability intent.finance.createJournalEntry
 * @sapModule FI
 * @businessContext FB50 — enter G/L account document.
 *
 * @example
 * ```typescript
 * import * as finance from '#intents/domains/finance.js';
 *
 * await finance.createJournalEntry(ui5, ui5Nav, vocab, {
 *   documentDate: '2026-02-20',
 *   postingDate: '2026-02-20',
 *   lineItems: [{ glAccount: '400000', debitCredit: 'S', amount: 1000 }],
 * });
 * ```
 */
export async function createJournalEntry(
  ui5: UI5HandlerSlice,
  ui5Nav: NavAPI,
  vocabulary: VocabLookup,
  input: JournalEntryData,
  options?: IntentOptions,
): Promise<IntentResult> {
  const startTime = Date.now();
  const steps: string[] = [];

  if (options?.skipNavigation !== true) {
    await ui5Nav.navigateToApp('JournalEntry-create');
    steps.push('navigate');
  }

  const docDateResult = await fillField(ui5, vocabulary, 'Document Date', input.documentDate);
  if (docDateResult.status === 'error') {
    return fiResult({
      status: 'error',
      intentName: 'createJournalEntry',
      startTime,
      stepsExecuted: [...steps, ...docDateResult.metadata.stepsExecuted],
      ...(docDateResult.error !== undefined && { error: docDateResult.error }),
    });
  }
  steps.push('fillDocumentDate');

  const postDateResult = await fillField(ui5, vocabulary, 'Posting Date', input.postingDate);
  if (postDateResult.status === 'error') {
    return fiResult({
      status: 'error',
      intentName: 'createJournalEntry',
      startTime,
      stepsExecuted: [...steps, ...postDateResult.metadata.stepsExecuted],
      ...(postDateResult.error !== undefined && { error: postDateResult.error }),
    });
  }
  steps.push('fillPostingDate');

  // Fill line items — iterate through the provided items
  for (const [index, lineItem] of input.lineItems.entries()) {
    const glResult = await fillField(ui5, vocabulary, 'G/L Account', lineItem.glAccount);
    if (glResult.status === 'error') {
      return fiResult({
        status: 'error',
        intentName: 'createJournalEntry',
        startTime,
        stepsExecuted: [...steps, ...glResult.metadata.stepsExecuted],
        ...(glResult.error !== undefined && { error: glResult.error }),
      });
    }
    steps.push(`fillGLAccount[${String(index)}]`);

    const amtResult = await fillField(ui5, vocabulary, 'Amount', String(lineItem.amount));
    if (amtResult.status === 'error') {
      return fiResult({
        status: 'error',
        intentName: 'createJournalEntry',
        startTime,
        stepsExecuted: [...steps, ...amtResult.metadata.stepsExecuted],
        ...(amtResult.error !== undefined && { error: amtResult.error }),
      });
    }
    steps.push(`fillAmount[${String(index)}]`);
  }

  await clickButton(ui5, 'Post');
  steps.push('clickPost');

  await waitForSave(ui5, options);
  steps.push('waitForSave');

  return fiResult({
    status: 'success',
    intentName: 'createJournalEntry',
    startTime,
    stepsExecuted: steps,
  });
}

/**
 * Posts a vendor invoice (FI-AP FB60).
 *
 * @param ui5 - UI5 interaction handler.
 * @param ui5Nav - Navigation API.
 * @param vocabulary - Vocabulary lookup service.
 * @param input - Vendor invoice data.
 * @param options - Optional intent options.
 * @returns `IntentResult` describing the outcome.
 *
 * @intent Post a vendor invoice for accounts payable.
 * @capability intent.finance.postVendorInvoice
 * @sapModule FI
 * @businessContext FB60 — enter vendor invoice.
 *
 * @example
 * ```typescript
 * await finance.postVendorInvoice(ui5, ui5Nav, vocab, {
 *   vendor: '100001',
 *   invoiceDate: '2026-02-20',
 *   amount: 5000,
 *   currency: 'EUR',
 * });
 * ```
 */
export async function postVendorInvoice(
  ui5: UI5HandlerSlice,
  ui5Nav: NavAPI,
  vocabulary: VocabLookup,
  input: VendorInvoiceData,
  options?: IntentOptions,
): Promise<IntentResult> {
  const startTime = Date.now();
  const steps: string[] = [];

  if (options?.skipNavigation !== true) {
    await ui5Nav.navigateToApp('SupplierInvoice-create');
    steps.push('navigate');
  }

  const vendorResult = await fillField(ui5, vocabulary, 'Vendor', input.vendor);
  if (vendorResult.status === 'error') {
    return fiResult({
      status: 'error',
      intentName: 'postVendorInvoice',
      startTime,
      stepsExecuted: [...steps, ...vendorResult.metadata.stepsExecuted],
      ...(vendorResult.error !== undefined && { error: vendorResult.error }),
    });
  }
  steps.push('fillVendor');

  const invDateResult = await fillField(ui5, vocabulary, 'Invoice Date', input.invoiceDate);
  if (invDateResult.status === 'error') {
    return fiResult({
      status: 'error',
      intentName: 'postVendorInvoice',
      startTime,
      stepsExecuted: [...steps, ...invDateResult.metadata.stepsExecuted],
      ...(invDateResult.error !== undefined && { error: invDateResult.error }),
    });
  }
  steps.push('fillInvoiceDate');

  const amtResult = await fillField(ui5, vocabulary, 'Amount', String(input.amount));
  if (amtResult.status === 'error') {
    return fiResult({
      status: 'error',
      intentName: 'postVendorInvoice',
      startTime,
      stepsExecuted: [...steps, ...amtResult.metadata.stepsExecuted],
      ...(amtResult.error !== undefined && { error: amtResult.error }),
    });
  }
  steps.push('fillAmount');

  await clickButton(ui5, 'Post');
  steps.push('clickPost');

  await waitForSave(ui5, options);
  steps.push('waitForSave');

  return fiResult({
    status: 'success',
    intentName: 'postVendorInvoice',
    startTime,
    stepsExecuted: steps,
  });
}

/**
 * Processes an outgoing vendor payment (FI-AP F110 / Manage Payment Runs).
 *
 * @param ui5 - UI5 interaction handler.
 * @param ui5Nav - Navigation API.
 * @param vocabulary - Vocabulary lookup service.
 * @param input - Payment data.
 * @param options - Optional intent options.
 * @returns `IntentResult` describing the outcome.
 *
 * @intent Process an outgoing payment for a vendor.
 * @capability intent.finance.processPayment
 * @sapModule FI
 * @businessContext F-53 / Manage Payment Runs — outgoing payment.
 *
 * @example
 * ```typescript
 * await finance.processPayment(ui5, ui5Nav, vocab, {
 *   vendor: '100001',
 *   amount: 5000,
 *   paymentDate: '2026-02-28',
 * });
 * ```
 */
export async function processPayment(
  ui5: UI5HandlerSlice,
  ui5Nav: NavAPI,
  vocabulary: VocabLookup,
  input: PaymentData,
  options?: IntentOptions,
): Promise<IntentResult> {
  const startTime = Date.now();
  const steps: string[] = [];

  if (options?.skipNavigation !== true) {
    await ui5Nav.navigateToApp('OutgoingPayment-create');
    steps.push('navigate');
  }

  const vendorResult = await fillField(ui5, vocabulary, 'Vendor', input.vendor);
  if (vendorResult.status === 'error') {
    return fiResult({
      status: 'error',
      intentName: 'processPayment',
      startTime,
      stepsExecuted: [...steps, ...vendorResult.metadata.stepsExecuted],
      ...(vendorResult.error !== undefined && { error: vendorResult.error }),
    });
  }
  steps.push('fillVendor');

  const amtResult = await fillField(ui5, vocabulary, 'Amount', String(input.amount));
  if (amtResult.status === 'error') {
    return fiResult({
      status: 'error',
      intentName: 'processPayment',
      startTime,
      stepsExecuted: [...steps, ...amtResult.metadata.stepsExecuted],
      ...(amtResult.error !== undefined && { error: amtResult.error }),
    });
  }
  steps.push('fillAmount');

  const dateResult = await fillField(ui5, vocabulary, 'Payment Date', input.paymentDate);
  if (dateResult.status === 'error') {
    return fiResult({
      status: 'error',
      intentName: 'processPayment',
      startTime,
      stepsExecuted: [...steps, ...dateResult.metadata.stepsExecuted],
      ...(dateResult.error !== undefined && { error: dateResult.error }),
    });
  }
  steps.push('fillPaymentDate');

  await clickButton(ui5, 'Post');
  steps.push('clickPost');

  await waitForSave(ui5, options);
  steps.push('waitForSave');

  return fiResult({
    status: 'success',
    intentName: 'processPayment',
    startTime,
    stepsExecuted: steps,
  });
}
