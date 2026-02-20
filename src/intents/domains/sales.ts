/**
 * Sales (SD) intent domain functions.
 *
 * @remarks
 * Covers SAP Sales & Distribution scenarios: sales orders, quotations,
 * customer search, and delivery status checks.
 *
 * @sapModule SD
 * @businessContext SAP Sales & Distribution — order-to-cash lifecycle.
 * @module intents
 */

import type { UI5HandlerSlice, VocabLookup } from '../core-wrappers.js';
import { clickButton, fillField, navigateAndSearch, waitForSave } from '../core-wrappers.js';
import type { IntentOptions, IntentResult } from '../types.js';

// ── Inline navigation API interface ───────────────────────────────────────

/**
 * Minimal navigation API for SD intent functions.
 */
interface NavAPI {
  navigateToApp(appId: string, options?: unknown): Promise<void>;
  navigateToHash(hash: string, options?: unknown): Promise<void>;
}

// ── Internal helper ────────────────────────────────────────────────────────

/** Builds an SD-scoped `IntentResult<T>`. */
function sdResult<T>(params: {
  status: 'success' | 'error' | 'partial';
  intentName: string;
  startTime: number;
  stepsExecuted: string[];
  data?: T;
  error?: { readonly code: string; readonly message: string };
  retryable?: boolean;
  suggestions?: string[];
}): IntentResult<T> {
  return {
    status: params.status,
    ...(params.data !== undefined && { data: params.data }),
    ...(params.error !== undefined && { error: params.error }),
    metadata: {
      duration: Date.now() - params.startTime,
      retryable: params.retryable ?? false,
      suggestions: params.suggestions ?? [],
      intentName: params.intentName,
      sapModule: 'SD',
      stepsExecuted: params.stepsExecuted,
    },
  } as IntentResult<T>;
}

// ── Public intent functions ────────────────────────────────────────────────

/**
 * Creates a sales order in SAP VA01 / Create Sales Order.
 *
 * @param ui5 - UI5 interaction handler.
 * @param ui5Nav - Navigation API.
 * @param vocabulary - Vocabulary lookup service.
 * @param input - Sales order creation parameters.
 * @param options - Optional intent options.
 * @returns `IntentResult` describing the outcome.
 *
 * @intent Create a sales order from structured input data.
 * @sapModule SD
 * @businessContext VA01 — create sales order.
 *
 * @example
 * ```typescript
 * import * as sales from '#intents/domains/sales.js';
 *
 * await sales.createSalesOrder(ui5, ui5Nav, vocab, {
 *   customer: '200001',
 *   material: 'FG-1000',
 *   quantity: 5,
 *   salesOrganization: '1000',
 * });
 * ```
 */
export async function createSalesOrder(
  ui5: UI5HandlerSlice,
  ui5Nav: NavAPI,
  vocabulary: VocabLookup,
  input: {
    readonly customer: string;
    readonly material: string;
    readonly quantity: number;
    readonly salesOrganization: string;
  },
  options?: IntentOptions,
): Promise<IntentResult> {
  const startTime = Date.now();
  const steps: string[] = [];

  if (options?.skipNavigation !== true) {
    await ui5Nav.navigateToApp('SalesOrder-create');
    steps.push('navigate');
  }

  const customerResult = await fillField(ui5, vocabulary, 'Customer', input.customer);
  if (customerResult.status === 'error') {
    return sdResult({
      status: 'error',
      intentName: 'createSalesOrder',
      startTime,
      stepsExecuted: [...steps, ...customerResult.metadata.stepsExecuted],
      ...(customerResult.error !== undefined && { error: customerResult.error }),
    });
  }
  steps.push('fillCustomer');

  const materialResult = await fillField(ui5, vocabulary, 'Material', input.material);
  if (materialResult.status === 'error') {
    return sdResult({
      status: 'error',
      intentName: 'createSalesOrder',
      startTime,
      stepsExecuted: [...steps, ...materialResult.metadata.stepsExecuted],
      ...(materialResult.error !== undefined && { error: materialResult.error }),
    });
  }
  steps.push('fillMaterial');

  const qtyResult = await fillField(ui5, vocabulary, 'Quantity', String(input.quantity));
  if (qtyResult.status === 'error') {
    return sdResult({
      status: 'error',
      intentName: 'createSalesOrder',
      startTime,
      stepsExecuted: [...steps, ...qtyResult.metadata.stepsExecuted],
      ...(qtyResult.error !== undefined && { error: qtyResult.error }),
    });
  }
  steps.push('fillQuantity');

  await clickButton(ui5, 'Save');
  steps.push('clickSave');

  await waitForSave(ui5, options);
  steps.push('waitForSave');

  return sdResult({
    status: 'success',
    intentName: 'createSalesOrder',
    startTime,
    stepsExecuted: steps,
  });
}

/**
 * Creates a quotation (VA21) in SAP.
 *
 * @param ui5 - UI5 interaction handler.
 * @param ui5Nav - Navigation API.
 * @param vocabulary - Vocabulary lookup service.
 * @param input - Quotation creation parameters.
 * @param options - Optional intent options.
 * @returns `IntentResult` describing the outcome.
 *
 * @intent Create a sales quotation from structured input data.
 * @sapModule SD
 * @businessContext VA21 — create quotation.
 *
 * @example
 * ```typescript
 * await sales.createQuotation(ui5, ui5Nav, vocab, {
 *   customer: '200001',
 *   material: 'FG-1000',
 *   quantity: 10,
 * });
 * ```
 */
export async function createQuotation(
  ui5: UI5HandlerSlice,
  ui5Nav: NavAPI,
  vocabulary: VocabLookup,
  input: {
    readonly customer: string;
    readonly material: string;
    readonly quantity: number;
  },
  options?: IntentOptions,
): Promise<IntentResult> {
  const startTime = Date.now();
  const steps: string[] = [];

  if (options?.skipNavigation !== true) {
    await ui5Nav.navigateToApp('Quotation-create');
    steps.push('navigate');
  }

  const customerResult = await fillField(ui5, vocabulary, 'Customer', input.customer);
  if (customerResult.status === 'error') {
    return sdResult({
      status: 'error',
      intentName: 'createQuotation',
      startTime,
      stepsExecuted: [...steps, ...customerResult.metadata.stepsExecuted],
      ...(customerResult.error !== undefined && { error: customerResult.error }),
    });
  }
  steps.push('fillCustomer');

  const materialResult = await fillField(ui5, vocabulary, 'Material', input.material);
  if (materialResult.status === 'error') {
    return sdResult({
      status: 'error',
      intentName: 'createQuotation',
      startTime,
      stepsExecuted: [...steps, ...materialResult.metadata.stepsExecuted],
      ...(materialResult.error !== undefined && { error: materialResult.error }),
    });
  }
  steps.push('fillMaterial');

  await clickButton(ui5, 'Save');
  steps.push('clickSave');

  await waitForSave(ui5, options);
  steps.push('waitForSave');

  return sdResult({
    status: 'success',
    intentName: 'createQuotation',
    startTime,
    stepsExecuted: steps,
  });
}

/**
 * Approves a quotation by navigating to it and clicking Approve.
 *
 * @param ui5 - UI5 interaction handler.
 * @param ui5Nav - Navigation API.
 * @param input - Approval parameters.
 * @param options - Optional intent options.
 * @returns `IntentResult` describing the outcome.
 *
 * @intent Approve a sales quotation via the FLP workflow.
 * @sapModule SD
 * @businessContext VA23 / Manage Quotations — approval action.
 *
 * @example
 * ```typescript
 * await sales.approveQuotation(ui5, ui5Nav, { quotationNumber: '20000123' });
 * ```
 */
export async function approveQuotation(
  ui5: UI5HandlerSlice,
  ui5Nav: NavAPI,
  input: { readonly quotationNumber: string },
  options?: IntentOptions,
): Promise<IntentResult> {
  const startTime = Date.now();
  const steps: string[] = [];

  if (options?.skipNavigation !== true) {
    await ui5Nav.navigateToApp('Quotation-manage');
    steps.push('navigate');
  }

  await ui5.click({ controlType: 'sap.m.Button', properties: { text: 'Approve' } });
  steps.push('clickApprove');

  await waitForSave(ui5, options);
  steps.push('waitForSave');

  return sdResult({
    status: 'success',
    intentName: 'approveQuotation',
    startTime,
    stepsExecuted: steps,
  });
}

/**
 * Searches for sales orders using filter bar criteria.
 *
 * @param ui5 - UI5 interaction handler.
 * @param ui5Nav - Navigation API.
 * @param vocabulary - Vocabulary lookup service.
 * @param criteria - Key/value map of filter label → value.
 * @param options - Optional intent options.
 * @returns `IntentResult` describing the outcome.
 *
 * @intent Search sales orders using smart filter bar criteria.
 * @sapModule SD
 * @businessContext VA05 / Manage Sales Orders — list search.
 *
 * @example
 * ```typescript
 * await sales.searchSalesOrders(ui5, ui5Nav, vocab, { Customer: '200001' });
 * ```
 */
export async function searchSalesOrders(
  ui5: UI5HandlerSlice,
  ui5Nav: NavAPI,
  vocabulary: VocabLookup,
  criteria: Readonly<Record<string, string>>,
  options?: IntentOptions,
): Promise<IntentResult> {
  const startTime = Date.now();

  const searchResult = await navigateAndSearch(
    ui5,
    ui5Nav,
    vocabulary,
    'SalesOrder-manage',
    criteria,
    options,
  );

  return sdResult({
    status: searchResult.status,
    intentName: 'searchSalesOrders',
    startTime,
    stepsExecuted: searchResult.metadata.stepsExecuted,
    ...(searchResult.error !== undefined && { error: searchResult.error }),
  });
}

/**
 * Searches for customer master records.
 *
 * @param ui5 - UI5 interaction handler.
 * @param ui5Nav - Navigation API.
 * @param criteria - Key/value map of filter label → value.
 * @param options - Optional intent options.
 * @returns `IntentResult` describing the outcome.
 *
 * @intent Search customer master records via the FLP list app.
 * @sapModule SD
 * @businessContext XD03 / Manage Customers — customer search.
 *
 * @example
 * ```typescript
 * await sales.searchCustomers(ui5, ui5Nav);
 * ```
 */
export async function searchCustomers(
  ui5: UI5HandlerSlice,
  ui5Nav: NavAPI,
  options?: IntentOptions,
): Promise<IntentResult> {
  const startTime = Date.now();
  const steps: string[] = [];

  if (options?.skipNavigation !== true) {
    await ui5Nav.navigateToApp('Customer-manage');
    steps.push('navigate');
  }

  await ui5.click({ controlType: 'sap.m.Button', properties: { text: 'Go' } });
  steps.push('clickGo');

  return sdResult({
    status: 'success',
    intentName: 'searchCustomers',
    startTime,
    stepsExecuted: steps,
  });
}

/**
 * Checks the delivery status for a sales order.
 *
 * @param ui5 - UI5 interaction handler.
 * @param ui5Nav - Navigation API.
 * @param input - Sales order reference.
 * @param options - Optional intent options.
 * @returns `IntentResult<string>` where `data` is the delivery status text.
 *
 * @intent Read the delivery status of a sales order.
 * @sapModule SD
 * @businessContext VL06O / Manage Outbound Deliveries — status check.
 *
 * @example
 * ```typescript
 * const result = await sales.checkDeliveryStatus(ui5, ui5Nav, { salesOrderNumber: '10000001' });
 * console.log(result.data); // e.g. 'Completely Delivered'
 * ```
 */
export async function checkDeliveryStatus(
  ui5: UI5HandlerSlice,
  ui5Nav: NavAPI,
  input: { readonly salesOrderNumber: string },
  options?: IntentOptions,
): Promise<IntentResult<string>> {
  const startTime = Date.now();
  const steps: string[] = [];

  if (options?.skipNavigation !== true) {
    await ui5Nav.navigateToApp('SalesOrder-manage');
    steps.push('navigate');
  }

  const status = await ui5.getText({
    controlType: 'sap.m.ObjectStatus',
    properties: { title: 'Delivery Status' },
  });
  steps.push('getDeliveryStatus');

  return sdResult({
    status: 'success',
    intentName: 'checkDeliveryStatus',
    startTime,
    stepsExecuted: steps,
    data: status,
  });
}
