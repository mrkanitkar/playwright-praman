/**
 * @license
 * Copyright (c) ZesTest 2025-2030. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0
 *
 * This file may contain AI-assisted code.
 * See LICENSE and NOTICE files for details.
 */

/**
 * Warehouse Management (WM) intent domain functions.
 *
 * @remarks
 * Covers SAP Warehouse Management scenarios: goods movement posting
 * and transfer order creation.
 *
 * @sapModule WM
 * @businessContext SAP Warehouse Management — inventory movement lifecycle.
 * @module intents
 */

import type { UI5HandlerSlice, VocabLookup } from '../core-wrappers.js';
import { clickButton, fillField, waitForSave } from '../core-wrappers.js';
import type {
  GoodsMovementData,
  IntentOptions,
  IntentResult,
  TransferOrderData,
} from '../types.js';

// ── Inline navigation API interface ───────────────────────────────────────

/**
 * Minimal navigation API for WM intent functions.
 */
interface NavAPI {
  navigateToApp(appId: string, options?: unknown): Promise<void>;
  navigateToHash(hash: string, options?: unknown): Promise<void>;
}

// ── Internal helper ────────────────────────────────────────────────────────

/** Builds a WM-scoped `IntentResult<T>`. */
function wmResult<T>(params: {
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
      sapModule: 'WM',
      stepsExecuted: params.stepsExecuted,
    },
  };
}

// ── Public intent functions ────────────────────────────────────────────────

/**
 * Creates a goods movement posting (WM — MIGO).
 *
 * @remarks
 * Navigates to the `GoodsMovement-create` FLP hash, fills movement type,
 * plant, material, and quantity, then clicks Post.
 *
 * @param ui5 - UI5 interaction handler.
 * @param ui5Nav - Navigation API.
 * @param vocabulary - Vocabulary lookup service.
 * @param input - Goods movement data.
 * @param options - Optional intent options.
 * @returns `IntentResult` describing the outcome.
 *
 * @intent Create a warehouse goods movement posting.
 * @capability intent.warehouse.createGoodsMovement
 * @sapModule WM
 * @businessContext MIGO — goods movement (receipt, issue, transfer posting).
 *
 * @example
 * ```typescript
 * import * as warehouse from '#intents/domains/warehouse.js';
 *
 * await warehouse.createGoodsMovement(ui5, ui5Nav, vocab, {
 *   movementType: '101',
 *   plant: '1000',
 *   material: 'RAW-0001',
 *   quantity: 100,
 * });
 * ```
 */
export async function createGoodsMovement(
  ui5: UI5HandlerSlice,
  ui5Nav: NavAPI,
  vocabulary: VocabLookup,
  input: GoodsMovementData,
  options?: IntentOptions,
): Promise<IntentResult> {
  const startTime = Date.now();
  const steps: string[] = [];
  const appHash = options?.overrides?.appId ?? 'GoodsMovement-create';
  const saveText = options?.overrides?.saveButtonText ?? 'Post';

  if (options?.skipNavigation !== true) {
    await ui5Nav.navigateToApp(appHash);
    steps.push('navigate');
  }

  const mvtLabel = options?.overrides?.fields?.['Movement Type'] ?? 'Movement Type';
  const mvtResult = await fillField(ui5, vocabulary, mvtLabel, input.movementType);
  if (mvtResult.status === 'error') {
    return wmResult({
      status: 'error',
      intentName: 'createGoodsMovement',
      startTime,
      stepsExecuted: [...steps, ...mvtResult.metadata.stepsExecuted],
      ...(mvtResult.error !== undefined && { error: mvtResult.error }),
    });
  }
  steps.push('fillMovementType');

  const plantLabel = options?.overrides?.fields?.['Plant'] ?? 'Plant';
  const plantResult = await fillField(ui5, vocabulary, plantLabel, input.plant);
  if (plantResult.status === 'error') {
    return wmResult({
      status: 'error',
      intentName: 'createGoodsMovement',
      startTime,
      stepsExecuted: [...steps, ...plantResult.metadata.stepsExecuted],
      ...(plantResult.error !== undefined && { error: plantResult.error }),
    });
  }
  steps.push('fillPlant');

  const matLabel = options?.overrides?.fields?.['Material'] ?? 'Material';
  const matResult = await fillField(ui5, vocabulary, matLabel, input.material);
  if (matResult.status === 'error') {
    return wmResult({
      status: 'error',
      intentName: 'createGoodsMovement',
      startTime,
      stepsExecuted: [...steps, ...matResult.metadata.stepsExecuted],
      ...(matResult.error !== undefined && { error: matResult.error }),
    });
  }
  steps.push('fillMaterial');

  const qtyLabel = options?.overrides?.fields?.['Quantity'] ?? 'Quantity';
  const qtyResult = await fillField(ui5, vocabulary, qtyLabel, String(input.quantity));
  if (qtyResult.status === 'error') {
    return wmResult({
      status: 'error',
      intentName: 'createGoodsMovement',
      startTime,
      stepsExecuted: [...steps, ...qtyResult.metadata.stepsExecuted],
      ...(qtyResult.error !== undefined && { error: qtyResult.error }),
    });
  }
  steps.push('fillQuantity');

  await clickButton(ui5, saveText);
  steps.push('clickPost');

  await waitForSave(ui5, options);
  steps.push('waitForSave');

  return wmResult({
    status: 'success',
    intentName: 'createGoodsMovement',
    startTime,
    stepsExecuted: steps,
  });
}

/**
 * Creates a transfer order for bin-to-bin movement (WM-TO / EWM).
 *
 * @param ui5 - UI5 interaction handler.
 * @param ui5Nav - Navigation API.
 * @param vocabulary - Vocabulary lookup service.
 * @param input - Transfer order data.
 * @param options - Optional intent options.
 * @returns `IntentResult` describing the outcome.
 *
 * @intent Create a warehouse transfer order for bin movement.
 * @capability intent.warehouse.createTransferOrder
 * @sapModule WM
 * @businessContext LT01 — create transfer order.
 *
 * @example
 * ```typescript
 * await warehouse.createTransferOrder(ui5, ui5Nav, vocab, {
 *   warehouseNumber: '100',
 *   material: 'FG-1000',
 *   quantity: 25,
 * });
 * ```
 */
export async function createTransferOrder(
  ui5: UI5HandlerSlice,
  ui5Nav: NavAPI,
  vocabulary: VocabLookup,
  input: TransferOrderData,
  options?: IntentOptions,
): Promise<IntentResult> {
  const startTime = Date.now();
  const steps: string[] = [];
  const appHash = options?.overrides?.appId ?? 'TransferOrder-create';
  const saveText = options?.overrides?.saveButtonText ?? 'Save';

  if (options?.skipNavigation !== true) {
    await ui5Nav.navigateToApp(appHash);
    steps.push('navigate');
  }

  const whLabel = options?.overrides?.fields?.['Warehouse Number'] ?? 'Warehouse Number';
  const whResult = await fillField(ui5, vocabulary, whLabel, input.warehouseNumber);
  if (whResult.status === 'error') {
    return wmResult({
      status: 'error',
      intentName: 'createTransferOrder',
      startTime,
      stepsExecuted: [...steps, ...whResult.metadata.stepsExecuted],
      ...(whResult.error !== undefined && { error: whResult.error }),
    });
  }
  steps.push('fillWarehouseNumber');

  const matLabel = options?.overrides?.fields?.['Material'] ?? 'Material';
  const matResult = await fillField(ui5, vocabulary, matLabel, input.material);
  if (matResult.status === 'error') {
    return wmResult({
      status: 'error',
      intentName: 'createTransferOrder',
      startTime,
      stepsExecuted: [...steps, ...matResult.metadata.stepsExecuted],
      ...(matResult.error !== undefined && { error: matResult.error }),
    });
  }
  steps.push('fillMaterial');

  const qtyLabel = options?.overrides?.fields?.['Quantity'] ?? 'Quantity';
  const qtyResult = await fillField(ui5, vocabulary, qtyLabel, String(input.quantity));
  if (qtyResult.status === 'error') {
    return wmResult({
      status: 'error',
      intentName: 'createTransferOrder',
      startTime,
      stepsExecuted: [...steps, ...qtyResult.metadata.stepsExecuted],
      ...(qtyResult.error !== undefined && { error: qtyResult.error }),
    });
  }
  steps.push('fillQuantity');

  await clickButton(ui5, saveText);
  steps.push('clickSave');

  await waitForSave(ui5, options);
  steps.push('waitForSave');

  return wmResult({
    status: 'success',
    intentName: 'createTransferOrder',
    startTime,
    stepsExecuted: steps,
  });
}
