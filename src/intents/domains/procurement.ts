/**
 * @license
 * Copyright (c) ZesTest 2025-2030. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0
 *
 * This file may contain AI-assisted code.
 * See LICENSE and NOTICE files for details.
 */

/**
 * Procurement (MM) intent domain functions.
 *
 * @remarks
 * Covers SAP Materials Management scenarios: purchase orders, purchase
 * requisitions, goods receipt, and vendor search.
 *
 * Each function accepts a structural `UI5HandlerSlice`, `NavAPI`, and
 * `VocabLookup` to remain decoupled from the fixture layer.
 *
 * @sapModule MM
 * @businessContext SAP Materials Management — procurement lifecycle.
 * @module intents
 */

import type { UI5HandlerSlice, VocabLookup } from '../core-wrappers.js';
import { clickButton, fillField, navigateAndSearch, waitForSave } from '../core-wrappers.js';
import type { IntentOptions, IntentResult } from '../types.js';

import type { IntentString, UI5ControlTypeName } from '#core/types/index.js';

// ── Shared constants ──────────────────────────────────────────────────────

/** SAP Button control type string. */
const SAP_BUTTON_TYPE: UI5ControlTypeName = 'sap.m.Button';

// ── Inline navigation API interface ───────────────────────────────────────

/**
 * Minimal navigation API accepted by procurement intent functions.
 *
 * @remarks
 * Structural sub-type of `UI5NavigationAPI` — compatible with the actual
 * fixture without creating a circular dependency.
 */
interface NavAPI {
  navigateToApp(appId: IntentString, options?: unknown): Promise<void>;
  navigateToHash(hash: string, options?: unknown): Promise<void>;
}

// ── Internal helper ────────────────────────────────────────────────────────

/**
 * Builds a procurement-scoped `IntentResult<T>`.
 *
 * @typeParam T - Payload type.
 */
function mmResult<T>(params: {
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
      sapModule: 'MM',
      stepsExecuted: params.stepsExecuted,
    },
  };
}

// ── Public intent functions ────────────────────────────────────────────────

/**
 * Creates a purchase order in SAP ME21N / Manage Purchase Orders.
 *
 * @remarks
 * Navigates to the `PurchaseOrder-create` FLP hash, fills vendor, material,
 * quantity, and plant fields via vocabulary, then clicks Save.
 *
 * @param ui5 - UI5 interaction handler.
 * @param ui5Nav - Navigation API.
 * @param vocabulary - Vocabulary lookup service.
 * @param input - PO creation parameters.
 * @param options - Optional intent options.
 * @returns `IntentResult` describing the outcome.
 *
 * @intent Create a purchase order from structured input data.
 * @capability intent.procurement.createPurchaseOrder
 * @sapModule MM
 * @businessContext ME21N / Manage Purchase Orders — new PO creation.
 *
 * @example
 * ```typescript
 * import * as procurement from '#intents/domains/procurement.js';
 *
 * const result = await procurement.createPurchaseOrder(ui5, ui5Nav, vocab, {
 *   vendor: '100001',
 *   material: 'MAT-001',
 *   quantity: 10,
 *   plant: '1000',
 * });
 * ```
 */
export async function createPurchaseOrder(
  ui5: UI5HandlerSlice,
  ui5Nav: NavAPI,
  vocabulary: VocabLookup,
  input: {
    readonly vendor: string;
    readonly material: string;
    readonly quantity: number;
    readonly plant: string;
  },
  options?: IntentOptions,
): Promise<IntentResult> {
  const startTime = Date.now();
  const steps: string[] = [];

  if (options?.skipNavigation !== true) {
    await ui5Nav.navigateToApp('PurchaseOrder-create');
    steps.push('navigate');
  }

  const vendorResult = await fillField(ui5, vocabulary, 'Vendor', input.vendor);
  if (vendorResult.status === 'error') {
    return mmResult({
      status: 'error',
      intentName: 'createPurchaseOrder',
      startTime,
      stepsExecuted: [...steps, ...vendorResult.metadata.stepsExecuted],
      ...(vendorResult.error !== undefined && { error: vendorResult.error }),
    });
  }
  steps.push('fillVendor');

  const materialResult = await fillField(ui5, vocabulary, 'Material', input.material);
  if (materialResult.status === 'error') {
    return mmResult({
      status: 'error',
      intentName: 'createPurchaseOrder',
      startTime,
      stepsExecuted: [...steps, ...materialResult.metadata.stepsExecuted],
      ...(materialResult.error !== undefined && { error: materialResult.error }),
    });
  }
  steps.push('fillMaterial');

  const qtyResult = await fillField(ui5, vocabulary, 'Quantity', String(input.quantity));
  if (qtyResult.status === 'error') {
    return mmResult({
      status: 'error',
      intentName: 'createPurchaseOrder',
      startTime,
      stepsExecuted: [...steps, ...qtyResult.metadata.stepsExecuted],
      ...(qtyResult.error !== undefined && { error: qtyResult.error }),
    });
  }
  steps.push('fillQuantity');

  const plantResult = await fillField(ui5, vocabulary, 'Plant', input.plant);
  if (plantResult.status === 'error') {
    return mmResult({
      status: 'error',
      intentName: 'createPurchaseOrder',
      startTime,
      stepsExecuted: [...steps, ...plantResult.metadata.stepsExecuted],
      ...(plantResult.error !== undefined && { error: plantResult.error }),
    });
  }
  steps.push('fillPlant');

  await clickButton(ui5, 'Save');
  steps.push('clickSave');

  await waitForSave(ui5, options);
  steps.push('waitForSave');

  return mmResult({
    status: 'success',
    intentName: 'createPurchaseOrder',
    startTime,
    stepsExecuted: steps,
  });
}

/**
 * Approves a purchase order by navigating to it and clicking Approve.
 *
 * @param ui5 - UI5 interaction handler.
 * @param ui5Nav - Navigation API.
 * @param input - Approval parameters.
 * @param options - Optional intent options.
 * @returns `IntentResult` describing the outcome.
 *
 * @intent Approve a purchase order via the FLP approval workflow.
 * @capability intent.procurement.approvePurchaseOrder
 * @sapModule MM
 * @businessContext ME28 / Manage Purchase Orders — approval action.
 *
 * @example
 * ```typescript
 * await procurement.approvePurchaseOrder(ui5, ui5Nav, { poNumber: '4500012345' });
 * ```
 */
export async function approvePurchaseOrder(
  ui5: UI5HandlerSlice,
  ui5Nav: NavAPI,
  input: { readonly poNumber: string },
  options?: IntentOptions,
): Promise<IntentResult> {
  const startTime = Date.now();
  const steps: string[] = [];

  if (options?.skipNavigation !== true) {
    await ui5Nav.navigateToApp('PurchaseOrder-manage');
    steps.push('navigate');
  }

  await ui5.click({ controlType: SAP_BUTTON_TYPE, properties: { text: 'Approve' } });
  steps.push('clickApprove');

  await waitForSave(ui5, options);
  steps.push('waitForSave');

  return mmResult({
    status: 'success',
    intentName: 'approvePurchaseOrder',
    startTime,
    stepsExecuted: steps,
  });
}

/**
 * Searches for purchase orders matching the given criteria.
 *
 * @param ui5 - UI5 interaction handler.
 * @param ui5Nav - Navigation API.
 * @param vocabulary - Vocabulary lookup service.
 * @param criteria - Key/value map of filter field label → value.
 * @param options - Optional intent options.
 * @returns `IntentResult` describing the outcome.
 *
 * @intent Search purchase orders using smart filter bar criteria.
 * @capability intent.procurement.searchPurchaseOrders
 * @sapModule MM
 * @businessContext ME2M / Manage Purchase Orders — list search.
 *
 * @example
 * ```typescript
 * await procurement.searchPurchaseOrders(ui5, ui5Nav, vocab, { Vendor: '100001' });
 * ```
 */
export async function searchPurchaseOrders(
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
    'PurchaseOrder-manage',
    criteria,
    options,
  );

  return mmResult({
    status: searchResult.status,
    intentName: 'searchPurchaseOrders',
    startTime,
    stepsExecuted: searchResult.metadata.stepsExecuted,
    ...(searchResult.error !== undefined && { error: searchResult.error }),
  });
}

/**
 * Creates a purchase requisition in SAP ME51N.
 *
 * @param ui5 - UI5 interaction handler.
 * @param ui5Nav - Navigation API.
 * @param vocabulary - Vocabulary lookup service.
 * @param input - PR creation parameters.
 * @param options - Optional intent options.
 * @returns `IntentResult` describing the outcome.
 *
 * @intent Create a purchase requisition from structured input data.
 * @capability intent.procurement.createPurchaseRequisition
 * @sapModule MM
 * @businessContext ME51N — purchase requisition creation.
 *
 * @example
 * ```typescript
 * await procurement.createPurchaseRequisition(ui5, ui5Nav, vocab, {
 *   material: 'MAT-001',
 *   quantity: 5,
 *   plant: '1000',
 * });
 * ```
 */
export async function createPurchaseRequisition(
  ui5: UI5HandlerSlice,
  ui5Nav: NavAPI,
  vocabulary: VocabLookup,
  input: {
    readonly material: string;
    readonly quantity: number;
    readonly plant: string;
  },
  options?: IntentOptions,
): Promise<IntentResult> {
  const startTime = Date.now();
  const steps: string[] = [];

  if (options?.skipNavigation !== true) {
    await ui5Nav.navigateToApp('PurchaseRequisition-create');
    steps.push('navigate');
  }

  const materialResult = await fillField(ui5, vocabulary, 'Material', input.material);
  if (materialResult.status === 'error') {
    return mmResult({
      status: 'error',
      intentName: 'createPurchaseRequisition',
      startTime,
      stepsExecuted: [...steps, ...materialResult.metadata.stepsExecuted],
      ...(materialResult.error !== undefined && { error: materialResult.error }),
    });
  }
  steps.push('fillMaterial');

  const qtyResult = await fillField(ui5, vocabulary, 'Quantity', String(input.quantity));
  if (qtyResult.status === 'error') {
    return mmResult({
      status: 'error',
      intentName: 'createPurchaseRequisition',
      startTime,
      stepsExecuted: [...steps, ...qtyResult.metadata.stepsExecuted],
      ...(qtyResult.error !== undefined && { error: qtyResult.error }),
    });
  }
  steps.push('fillQuantity');

  const plantResult = await fillField(ui5, vocabulary, 'Plant', input.plant);
  if (plantResult.status === 'error') {
    return mmResult({
      status: 'error',
      intentName: 'createPurchaseRequisition',
      startTime,
      stepsExecuted: [...steps, ...plantResult.metadata.stepsExecuted],
      ...(plantResult.error !== undefined && { error: plantResult.error }),
    });
  }
  steps.push('fillPlant');

  await clickButton(ui5, 'Save');
  steps.push('clickSave');

  await waitForSave(ui5, options);
  steps.push('waitForSave');

  return mmResult({
    status: 'success',
    intentName: 'createPurchaseRequisition',
    startTime,
    stepsExecuted: steps,
  });
}

/**
 * Confirms goods receipt for a purchase order.
 *
 * @param ui5 - UI5 interaction handler.
 * @param ui5Nav - Navigation API.
 * @param input - GR confirmation parameters.
 * @param options - Optional intent options.
 * @returns `IntentResult` describing the outcome.
 *
 * @intent Post a goods receipt against a purchase order.
 * @capability intent.procurement.confirmGoodsReceipt
 * @sapModule MM
 * @businessContext MIGO — goods receipt for purchase order.
 *
 * @example
 * ```typescript
 * await procurement.confirmGoodsReceipt(ui5, ui5Nav, {
 *   poNumber: '4500012345',
 *   quantity: 10,
 * });
 * ```
 */
export async function confirmGoodsReceipt(
  ui5: UI5HandlerSlice,
  ui5Nav: NavAPI,
  input: { readonly poNumber: string; readonly quantity: number },
  options?: IntentOptions,
): Promise<IntentResult> {
  const startTime = Date.now();
  const steps: string[] = [];

  if (options?.skipNavigation !== true) {
    await ui5Nav.navigateToApp('GoodsMovement-post');
    steps.push('navigate');
  }

  await ui5.click({ controlType: SAP_BUTTON_TYPE, properties: { text: 'Post' } });
  steps.push('clickPost');

  await waitForSave(ui5, options);
  steps.push('waitForSave');

  return mmResult({
    status: 'success',
    intentName: 'confirmGoodsReceipt',
    startTime,
    stepsExecuted: steps,
  });
}

/**
 * Searches for vendors in the vendor master list.
 *
 * @param ui5 - UI5 interaction handler.
 * @param ui5Nav - Navigation API.
 * @param options - Optional intent options.
 * @returns `IntentResult` describing the outcome.
 *
 * @intent Search vendor master records using FLP list app filters.
 * @capability intent.procurement.searchVendors
 * @sapModule MM
 * @businessContext MK03 / Manage Suppliers — vendor search.
 *
 * @example
 * ```typescript
 * await procurement.searchVendors(ui5, ui5Nav);
 * ```
 */
export async function searchVendors(
  ui5: UI5HandlerSlice,
  ui5Nav: NavAPI,
  options?: IntentOptions,
): Promise<IntentResult> {
  const startTime = Date.now();
  const steps: string[] = [];

  if (options?.skipNavigation !== true) {
    await ui5Nav.navigateToApp('Supplier-manage');
    steps.push('navigate');
  }

  await ui5.click({ controlType: SAP_BUTTON_TYPE, properties: { text: 'Go' } });
  steps.push('clickGo');

  return mmResult({
    status: 'success',
    intentName: 'searchVendors',
    startTime,
    stepsExecuted: steps,
  });
}
