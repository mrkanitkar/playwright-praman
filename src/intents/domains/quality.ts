/**
 * @license
 * Copyright (c) ZesTest 2025-2030. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0
 *
 * This file may contain AI-assisted code.
 * See LICENSE and NOTICE files for details.
 */

/**
 * Quality Management (QM) intent domain functions.
 *
 * @remarks
 * Covers SAP Quality Management scenarios: inspection lot creation,
 * results recording, and quality notification creation.
 *
 * @sapModule QM
 * @businessContext SAP Quality Management — inspect-to-dispose lifecycle.
 * @module intents
 */

import type { UI5HandlerSlice, VocabLookup } from '../core-wrappers.js';
import { clickButton, fillField, waitForSave } from '../core-wrappers.js';
import type {
  InspectionLotData,
  IntentOptions,
  IntentResult,
  QualityNotificationData,
  ResultsRecordingData,
} from '../types.js';

// ── Inline navigation API interface ───────────────────────────────────────

/**
 * Minimal navigation API for QM intent functions.
 */
interface NavAPI {
  navigateToApp(appId: string, options?: unknown): Promise<void>;
  navigateToHash(hash: string, options?: unknown): Promise<void>;
}

// ── Internal helper ────────────────────────────────────────────────────────

/** Builds a QM-scoped `IntentResult<T>`. */
function qmResult<T>(params: {
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
      sapModule: 'QM',
      stepsExecuted: params.stepsExecuted,
    },
  };
}

// ── Public intent functions ────────────────────────────────────────────────

/**
 * Creates an inspection lot (QM-IM QA01).
 *
 * @remarks
 * Navigates to the `InspectionLot-create` FLP hash, fills material,
 * plant, and optional fields, then clicks Save.
 *
 * @param ui5 - UI5 interaction handler.
 * @param ui5Nav - Navigation API.
 * @param vocabulary - Vocabulary lookup service.
 * @param input - Inspection lot data.
 * @param options - Optional intent options.
 * @returns `IntentResult` describing the outcome.
 *
 * @intent Create a quality inspection lot.
 * @capability intent.quality.createInspectionLot
 * @sapModule QM
 * @businessContext QA01 — create inspection lot.
 *
 * @example
 * ```typescript
 * import * as quality from '#intents/domains/quality.js';
 *
 * await quality.createInspectionLot(ui5, ui5Nav, vocab, {
 *   material: 'RAW-0001',
 *   plant: '1000',
 * });
 * ```
 */
export async function createInspectionLot(
  ui5: UI5HandlerSlice,
  ui5Nav: NavAPI,
  vocabulary: VocabLookup,
  input: InspectionLotData,
  options?: IntentOptions,
): Promise<IntentResult> {
  const startTime = Date.now();
  const steps: string[] = [];
  const appHash = options?.overrides?.appId ?? 'InspectionLot-create';
  const saveText = options?.overrides?.saveButtonText ?? 'Save';

  if (options?.skipNavigation !== true) {
    await ui5Nav.navigateToApp(appHash);
    steps.push('navigate');
  }

  const materialLabel = options?.overrides?.fields?.['Material'] ?? 'Material';
  const materialResult = await fillField(ui5, vocabulary, materialLabel, input.material);
  if (materialResult.status === 'error') {
    return qmResult({
      status: 'error',
      intentName: 'createInspectionLot',
      startTime,
      stepsExecuted: [...steps, ...materialResult.metadata.stepsExecuted],
      ...(materialResult.error !== undefined && { error: materialResult.error }),
    });
  }
  steps.push('fillMaterial');

  const plantLabel = options?.overrides?.fields?.['Plant'] ?? 'Plant';
  const plantResult = await fillField(ui5, vocabulary, plantLabel, input.plant);
  if (plantResult.status === 'error') {
    return qmResult({
      status: 'error',
      intentName: 'createInspectionLot',
      startTime,
      stepsExecuted: [...steps, ...plantResult.metadata.stepsExecuted],
      ...(plantResult.error !== undefined && { error: plantResult.error }),
    });
  }
  steps.push('fillPlant');

  if (input.inspectionType !== undefined) {
    const typeLabel = options?.overrides?.fields?.['Inspection Type'] ?? 'Inspection Type';
    const typeResult = await fillField(ui5, vocabulary, typeLabel, input.inspectionType);
    if (typeResult.status === 'error') {
      return qmResult({
        status: 'error',
        intentName: 'createInspectionLot',
        startTime,
        stepsExecuted: [...steps, ...typeResult.metadata.stepsExecuted],
        ...(typeResult.error !== undefined && { error: typeResult.error }),
      });
    }
    steps.push('fillInspectionType');
  }

  if (input.lotQuantity !== undefined) {
    const qtyLabel = options?.overrides?.fields?.['Lot Quantity'] ?? 'Lot Quantity';
    const qtyResult = await fillField(ui5, vocabulary, qtyLabel, input.lotQuantity);
    if (qtyResult.status === 'error') {
      return qmResult({
        status: 'error',
        intentName: 'createInspectionLot',
        startTime,
        stepsExecuted: [...steps, ...qtyResult.metadata.stepsExecuted],
        ...(qtyResult.error !== undefined && { error: qtyResult.error }),
      });
    }
    steps.push('fillLotQuantity');
  }

  await clickButton(ui5, saveText);
  steps.push('clickSave');

  await waitForSave(ui5, options);
  steps.push('waitForSave');

  return qmResult({
    status: 'success',
    intentName: 'createInspectionLot',
    startTime,
    stepsExecuted: steps,
  });
}

/**
 * Records inspection results for a lot (QM-IM QA32 / QE01).
 *
 * @param ui5 - UI5 interaction handler.
 * @param ui5Nav - Navigation API.
 * @param vocabulary - Vocabulary lookup service.
 * @param input - Results recording data.
 * @param options - Optional intent options.
 * @returns `IntentResult` describing the outcome.
 *
 * @intent Record inspection results for a quality inspection lot.
 * @capability intent.quality.recordResults
 * @sapModule QM
 * @businessContext QE01 — record inspection results.
 *
 * @example
 * ```typescript
 * await quality.recordResults(ui5, ui5Nav, vocab, {
 *   inspectionLot: '000012345678',
 *   result: '10.5',
 * });
 * ```
 */
export async function recordResults(
  ui5: UI5HandlerSlice,
  ui5Nav: NavAPI,
  vocabulary: VocabLookup,
  input: ResultsRecordingData,
  options?: IntentOptions,
): Promise<IntentResult> {
  const startTime = Date.now();
  const steps: string[] = [];
  const appHash = options?.overrides?.appId ?? 'InspectionLot-results';
  const saveText = options?.overrides?.saveButtonText ?? 'Save';

  if (options?.skipNavigation !== true) {
    await ui5Nav.navigateToApp(appHash);
    steps.push('navigate');
  }

  const lotLabel = options?.overrides?.fields?.['Inspection Lot'] ?? 'Inspection Lot';
  const lotResult = await fillField(ui5, vocabulary, lotLabel, input.inspectionLot);
  if (lotResult.status === 'error') {
    return qmResult({
      status: 'error',
      intentName: 'recordResults',
      startTime,
      stepsExecuted: [...steps, ...lotResult.metadata.stepsExecuted],
      ...(lotResult.error !== undefined && { error: lotResult.error }),
    });
  }
  steps.push('fillInspectionLot');

  if (input.result !== undefined) {
    const resLabel = options?.overrides?.fields?.['Mean Value'] ?? 'Mean Value';
    const resResult = await fillField(ui5, vocabulary, resLabel, input.result);
    if (resResult.status === 'error') {
      return qmResult({
        status: 'error',
        intentName: 'recordResults',
        startTime,
        stepsExecuted: [...steps, ...resResult.metadata.stepsExecuted],
        ...(resResult.error !== undefined && { error: resResult.error }),
      });
    }
    steps.push('fillResult');
  }

  await clickButton(ui5, saveText);
  steps.push('clickSave');

  await waitForSave(ui5, options);
  steps.push('waitForSave');

  return qmResult({
    status: 'success',
    intentName: 'recordResults',
    startTime,
    stepsExecuted: steps,
  });
}

/**
 * Creates a quality notification (QM-QN QM01).
 *
 * @param ui5 - UI5 interaction handler.
 * @param ui5Nav - Navigation API.
 * @param vocabulary - Vocabulary lookup service.
 * @param input - Quality notification data.
 * @param options - Optional intent options.
 * @returns `IntentResult` describing the outcome.
 *
 * @intent Create a quality notification for a defect or complaint.
 * @capability intent.quality.createQualityNotification
 * @sapModule QM
 * @businessContext QM01 — create quality notification.
 *
 * @example
 * ```typescript
 * await quality.createQualityNotification(ui5, ui5Nav, vocab, {
 *   notificationType: 'Q1',
 *   description: 'Surface defect on batch 2026-03',
 * });
 * ```
 */
export async function createQualityNotification(
  ui5: UI5HandlerSlice,
  ui5Nav: NavAPI,
  vocabulary: VocabLookup,
  input: QualityNotificationData,
  options?: IntentOptions,
): Promise<IntentResult> {
  const startTime = Date.now();
  const steps: string[] = [];
  const appHash = options?.overrides?.appId ?? 'QualityNotification-create';
  const saveText = options?.overrides?.saveButtonText ?? 'Save';

  if (options?.skipNavigation !== true) {
    await ui5Nav.navigateToApp(appHash);
    steps.push('navigate');
  }

  const typeLabel = options?.overrides?.fields?.['Notification Type'] ?? 'Notification Type';
  const typeResult = await fillField(ui5, vocabulary, typeLabel, input.notificationType);
  if (typeResult.status === 'error') {
    return qmResult({
      status: 'error',
      intentName: 'createQualityNotification',
      startTime,
      stepsExecuted: [...steps, ...typeResult.metadata.stepsExecuted],
      ...(typeResult.error !== undefined && { error: typeResult.error }),
    });
  }
  steps.push('fillNotificationType');

  const descLabel = options?.overrides?.fields?.['Short Text'] ?? 'Short Text';
  const descResult = await fillField(ui5, vocabulary, descLabel, input.description);
  if (descResult.status === 'error') {
    return qmResult({
      status: 'error',
      intentName: 'createQualityNotification',
      startTime,
      stepsExecuted: [...steps, ...descResult.metadata.stepsExecuted],
      ...(descResult.error !== undefined && { error: descResult.error }),
    });
  }
  steps.push('fillDescription');

  if (input.priority !== undefined) {
    const prioLabel = options?.overrides?.fields?.['Priority'] ?? 'Priority';
    const prioResult = await fillField(ui5, vocabulary, prioLabel, input.priority);
    if (prioResult.status === 'error') {
      return qmResult({
        status: 'error',
        intentName: 'createQualityNotification',
        startTime,
        stepsExecuted: [...steps, ...prioResult.metadata.stepsExecuted],
        ...(prioResult.error !== undefined && { error: prioResult.error }),
      });
    }
    steps.push('fillPriority');
  }

  await clickButton(ui5, saveText);
  steps.push('clickSave');

  await waitForSave(ui5, options);
  steps.push('waitForSave');

  return qmResult({
    status: 'success',
    intentName: 'createQualityNotification',
    startTime,
    stepsExecuted: steps,
  });
}
