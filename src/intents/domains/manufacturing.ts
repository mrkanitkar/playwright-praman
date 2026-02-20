/**
 * Manufacturing (PP) intent domain functions.
 *
 * @remarks
 * Covers SAP Production Planning scenarios: production order creation
 * and operation confirmation.
 *
 * @sapModule PP
 * @businessContext SAP Production Planning — make-to-order/make-to-stock lifecycle.
 * @module intents
 */

import type { UI5HandlerSlice, VocabLookup } from '../core-wrappers.js';
import { clickButton, fillField, waitForSave } from '../core-wrappers.js';
import type {
  IntentOptions,
  IntentResult,
  ProductionConfirmationData,
  ProductionOrderData,
} from '../types.js';

// ── Inline navigation API interface ───────────────────────────────────────

/**
 * Minimal navigation API for PP intent functions.
 */
interface NavAPI {
  navigateToApp(appId: string, options?: unknown): Promise<void>;
  navigateToHash(hash: string, options?: unknown): Promise<void>;
}

// ── Internal helper ────────────────────────────────────────────────────────

/** Builds a PP-scoped `IntentResult<T>`. */
function ppResult<T>(params: {
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
      sapModule: 'PP',
      stepsExecuted: params.stepsExecuted,
    },
  } as IntentResult<T>;
}

// ── Public intent functions ────────────────────────────────────────────────

/**
 * Creates a production order (PP-SFC CO01).
 *
 * @remarks
 * Navigates to `ProductionOrder-create`, fills material, plant, and
 * quantity, then clicks Save.
 *
 * @param ui5 - UI5 interaction handler.
 * @param ui5Nav - Navigation API.
 * @param vocabulary - Vocabulary lookup service.
 * @param input - Production order data.
 * @param options - Optional intent options.
 * @returns `IntentResult` describing the outcome.
 *
 * @intent Create a production order from structured input data.
 * @sapModule PP
 * @businessContext CO01 — create production order.
 *
 * @example
 * ```typescript
 * import * as manufacturing from '#intents/domains/manufacturing.js';
 *
 * await manufacturing.createProductionOrder(ui5, ui5Nav, vocab, {
 *   material: 'FG-1000',
 *   plant: '1000',
 *   quantity: 50,
 * });
 * ```
 */
export async function createProductionOrder(
  ui5: UI5HandlerSlice,
  ui5Nav: NavAPI,
  vocabulary: VocabLookup,
  input: ProductionOrderData,
  options?: IntentOptions,
): Promise<IntentResult> {
  const startTime = Date.now();
  const steps: string[] = [];

  if (options?.skipNavigation !== true) {
    await ui5Nav.navigateToApp('ProductionOrder-create');
    steps.push('navigate');
  }

  const materialResult = await fillField(ui5, vocabulary, 'Material', input.material);
  if (materialResult.status === 'error') {
    return ppResult({
      status: 'error',
      intentName: 'createProductionOrder',
      startTime,
      stepsExecuted: [...steps, ...materialResult.metadata.stepsExecuted],
      ...(materialResult.error !== undefined && { error: materialResult.error }),
    });
  }
  steps.push('fillMaterial');

  const plantResult = await fillField(ui5, vocabulary, 'Plant', input.plant);
  if (plantResult.status === 'error') {
    return ppResult({
      status: 'error',
      intentName: 'createProductionOrder',
      startTime,
      stepsExecuted: [...steps, ...plantResult.metadata.stepsExecuted],
      ...(plantResult.error !== undefined && { error: plantResult.error }),
    });
  }
  steps.push('fillPlant');

  const qtyResult = await fillField(ui5, vocabulary, 'Quantity', String(input.quantity));
  if (qtyResult.status === 'error') {
    return ppResult({
      status: 'error',
      intentName: 'createProductionOrder',
      startTime,
      stepsExecuted: [...steps, ...qtyResult.metadata.stepsExecuted],
      ...(qtyResult.error !== undefined && { error: qtyResult.error }),
    });
  }
  steps.push('fillQuantity');

  if (input.scheduledStart !== undefined) {
    const startResult = await fillField(ui5, vocabulary, 'Scheduled Start', input.scheduledStart);
    if (startResult.status === 'error') {
      return ppResult({
        status: 'error',
        intentName: 'createProductionOrder',
        startTime,
        stepsExecuted: [...steps, ...startResult.metadata.stepsExecuted],
        ...(startResult.error !== undefined && { error: startResult.error }),
      });
    }
    steps.push('fillScheduledStart');
  }

  await clickButton(ui5, 'Save');
  steps.push('clickSave');

  await waitForSave(ui5, options);
  steps.push('waitForSave');

  return ppResult({
    status: 'success',
    intentName: 'createProductionOrder',
    startTime,
    stepsExecuted: steps,
  });
}

/**
 * Confirms a production order operation (PP-SFC CO11N).
 *
 * @remarks
 * Navigates to `ProductionOrder-confirm`, fills order number and quantity,
 * then clicks Save.
 *
 * @param ui5 - UI5 interaction handler.
 * @param ui5Nav - Navigation API.
 * @param vocabulary - Vocabulary lookup service.
 * @param input - Production order confirmation data.
 * @param options - Optional intent options.
 * @returns `IntentResult` describing the outcome.
 *
 * @intent Confirm a production order operation (goods produced).
 * @sapModule PP
 * @businessContext CO11N — enter production order confirmation.
 *
 * @example
 * ```typescript
 * await manufacturing.confirmProductionOrder(ui5, ui5Nav, vocab, {
 *   orderNumber: '1000012',
 *   quantity: 50,
 * });
 * ```
 */
export async function confirmProductionOrder(
  ui5: UI5HandlerSlice,
  ui5Nav: NavAPI,
  vocabulary: VocabLookup,
  input: ProductionConfirmationData,
  options?: IntentOptions,
): Promise<IntentResult> {
  const startTime = Date.now();
  const steps: string[] = [];

  if (options?.skipNavigation !== true) {
    await ui5Nav.navigateToApp('ProductionOrder-confirm');
    steps.push('navigate');
  }

  const orderResult = await fillField(ui5, vocabulary, 'Order Number', input.orderNumber);
  if (orderResult.status === 'error') {
    return ppResult({
      status: 'error',
      intentName: 'confirmProductionOrder',
      startTime,
      stepsExecuted: [...steps, ...orderResult.metadata.stepsExecuted],
      ...(orderResult.error !== undefined && { error: orderResult.error }),
    });
  }
  steps.push('fillOrderNumber');

  const qtyResult = await fillField(ui5, vocabulary, 'Quantity', String(input.quantity));
  if (qtyResult.status === 'error') {
    return ppResult({
      status: 'error',
      intentName: 'confirmProductionOrder',
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

  return ppResult({
    status: 'success',
    intentName: 'confirmProductionOrder',
    startTime,
    stepsExecuted: steps,
  });
}
