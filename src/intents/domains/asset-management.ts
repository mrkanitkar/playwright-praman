/**
 * @license
 * Copyright (c) ZesTest 2025-2030. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0
 *
 * This file may contain AI-assisted code.
 * See LICENSE and NOTICE files for details.
 */

/**
 * Asset Management (AM) intent domain functions.
 *
 * @remarks
 * Covers SAP Fixed Asset Accounting scenarios: asset acquisition,
 * asset retirement, and asset transfer.
 *
 * @sapModule AM
 * @businessContext SAP Asset Accounting (FI-AA) — acquire-to-retire lifecycle.
 * @module intents
 */

import type { UI5HandlerSlice, VocabLookup } from '../core-wrappers.js';
import { clickButton, fillField, waitForSave } from '../core-wrappers.js';
import type {
  AssetAcquisitionData,
  AssetRetirementData,
  AssetTransferData,
  IntentOptions,
  IntentResult,
} from '../types.js';

// ── Inline navigation API interface ───────────────────────────────────────

/**
 * Minimal navigation API for AM intent functions.
 */
interface NavAPI {
  navigateToApp(appId: string, options?: unknown): Promise<void>;
  navigateToHash(hash: string, options?: unknown): Promise<void>;
}

// ── Internal helper ────────────────────────────────────────────────────────

/** Builds an AM-scoped `IntentResult<T>`. */
function amResult<T>(params: {
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
      sapModule: 'AM',
      stepsExecuted: params.stepsExecuted,
    },
  };
}

// ── Public intent functions ────────────────────────────────────────────────

/**
 * Posts an asset acquisition (FI-AA AS01 / ABZON).
 *
 * @remarks
 * Navigates to the `Asset-acquire` FLP hash, fills asset class,
 * description, acquisition value, and capitalization date, then clicks Save.
 *
 * @param ui5 - UI5 interaction handler.
 * @param ui5Nav - Navigation API.
 * @param vocabulary - Vocabulary lookup service.
 * @param input - Asset acquisition data.
 * @param options - Optional intent options.
 * @returns `IntentResult` describing the outcome.
 *
 * @intent Acquire a fixed asset and post the capitalization.
 * @capability intent.assetManagement.acquireAsset
 * @sapModule AM
 * @businessContext AS01/ABZON — create and acquire fixed asset.
 *
 * @example
 * ```typescript
 * import * as assetManagement from '#intents/domains/asset-management.js';
 *
 * await assetManagement.acquireAsset(ui5, ui5Nav, vocab, {
 *   assetClass: '1000',
 *   description: 'CNC Milling Machine',
 *   acquisitionValue: 150_000,
 *   capitalizationDate: '2026-04-01',
 * });
 * ```
 */
export async function acquireAsset(
  ui5: UI5HandlerSlice,
  ui5Nav: NavAPI,
  vocabulary: VocabLookup,
  input: AssetAcquisitionData,
  options?: IntentOptions,
): Promise<IntentResult> {
  const startTime = Date.now();
  const steps: string[] = [];
  const appHash = options?.overrides?.appId ?? 'Asset-acquire';
  const saveText = options?.overrides?.saveButtonText ?? 'Save';

  if (options?.skipNavigation !== true) {
    await ui5Nav.navigateToApp(appHash);
    steps.push('navigate');
  }

  const classLabel = options?.overrides?.fields?.['Asset Class'] ?? 'Asset Class';
  const classResult = await fillField(ui5, vocabulary, classLabel, input.assetClass);
  if (classResult.status === 'error') {
    return amResult({
      status: 'error',
      intentName: 'acquireAsset',
      startTime,
      stepsExecuted: [...steps, ...classResult.metadata.stepsExecuted],
      ...(classResult.error !== undefined && { error: classResult.error }),
    });
  }
  steps.push('fillAssetClass');

  const descLabel = options?.overrides?.fields?.['Description'] ?? 'Description';
  const descResult = await fillField(ui5, vocabulary, descLabel, input.description);
  if (descResult.status === 'error') {
    return amResult({
      status: 'error',
      intentName: 'acquireAsset',
      startTime,
      stepsExecuted: [...steps, ...descResult.metadata.stepsExecuted],
      ...(descResult.error !== undefined && { error: descResult.error }),
    });
  }
  steps.push('fillDescription');

  const valLabel = options?.overrides?.fields?.['Acquisition Value'] ?? 'Acquisition Value';
  const valResult = await fillField(ui5, vocabulary, valLabel, String(input.acquisitionValue));
  if (valResult.status === 'error') {
    return amResult({
      status: 'error',
      intentName: 'acquireAsset',
      startTime,
      stepsExecuted: [...steps, ...valResult.metadata.stepsExecuted],
      ...(valResult.error !== undefined && { error: valResult.error }),
    });
  }
  steps.push('fillAcquisitionValue');

  const dateLabel = options?.overrides?.fields?.['Capitalization Date'] ?? 'Capitalization Date';
  const dateResult = await fillField(ui5, vocabulary, dateLabel, input.capitalizationDate);
  if (dateResult.status === 'error') {
    return amResult({
      status: 'error',
      intentName: 'acquireAsset',
      startTime,
      stepsExecuted: [...steps, ...dateResult.metadata.stepsExecuted],
      ...(dateResult.error !== undefined && { error: dateResult.error }),
    });
  }
  steps.push('fillCapitalizationDate');

  await clickButton(ui5, saveText);
  steps.push('clickSave');

  await waitForSave(ui5, options);
  steps.push('waitForSave');

  return amResult({
    status: 'success',
    intentName: 'acquireAsset',
    startTime,
    stepsExecuted: steps,
  });
}

/**
 * Retires (scraps or sells) a fixed asset (FI-AA ABAVN).
 *
 * @param ui5 - UI5 interaction handler.
 * @param ui5Nav - Navigation API.
 * @param vocabulary - Vocabulary lookup service.
 * @param input - Asset retirement data.
 * @param options - Optional intent options.
 * @returns `IntentResult` describing the outcome.
 *
 * @intent Retire a fixed asset by scrapping or sale.
 * @capability intent.assetManagement.retireAsset
 * @sapModule AM
 * @businessContext ABAVN — asset retirement without revenue / with revenue.
 *
 * @example
 * ```typescript
 * await assetManagement.retireAsset(ui5, ui5Nav, vocab, {
 *   assetNumber: '000000001000',
 *   retirementDate: '2026-06-30',
 * });
 * ```
 */
export async function retireAsset(
  ui5: UI5HandlerSlice,
  ui5Nav: NavAPI,
  vocabulary: VocabLookup,
  input: AssetRetirementData,
  options?: IntentOptions,
): Promise<IntentResult> {
  const startTime = Date.now();
  const steps: string[] = [];
  const appHash = options?.overrides?.appId ?? 'Asset-retire';
  const saveText = options?.overrides?.saveButtonText ?? 'Save';

  if (options?.skipNavigation !== true) {
    await ui5Nav.navigateToApp(appHash);
    steps.push('navigate');
  }

  const assetLabel = options?.overrides?.fields?.['Asset Number'] ?? 'Asset Number';
  const assetResult = await fillField(ui5, vocabulary, assetLabel, input.assetNumber);
  if (assetResult.status === 'error') {
    return amResult({
      status: 'error',
      intentName: 'retireAsset',
      startTime,
      stepsExecuted: [...steps, ...assetResult.metadata.stepsExecuted],
      ...(assetResult.error !== undefined && { error: assetResult.error }),
    });
  }
  steps.push('fillAssetNumber');

  const dateLabel = options?.overrides?.fields?.['Retirement Date'] ?? 'Retirement Date';
  const dateResult = await fillField(ui5, vocabulary, dateLabel, input.retirementDate);
  if (dateResult.status === 'error') {
    return amResult({
      status: 'error',
      intentName: 'retireAsset',
      startTime,
      stepsExecuted: [...steps, ...dateResult.metadata.stepsExecuted],
      ...(dateResult.error !== undefined && { error: dateResult.error }),
    });
  }
  steps.push('fillRetirementDate');

  await clickButton(ui5, saveText);
  steps.push('clickSave');

  await waitForSave(ui5, options);
  steps.push('waitForSave');

  return amResult({
    status: 'success',
    intentName: 'retireAsset',
    startTime,
    stepsExecuted: steps,
  });
}

/**
 * Transfers a fixed asset to another asset master (FI-AA ABUMN).
 *
 * @param ui5 - UI5 interaction handler.
 * @param ui5Nav - Navigation API.
 * @param vocabulary - Vocabulary lookup service.
 * @param input - Asset transfer data.
 * @param options - Optional intent options.
 * @returns `IntentResult` describing the outcome.
 *
 * @intent Transfer a fixed asset between company codes or cost centres.
 * @capability intent.assetManagement.transferAsset
 * @sapModule AM
 * @businessContext ABUMN — asset transfer within / between company codes.
 *
 * @example
 * ```typescript
 * await assetManagement.transferAsset(ui5, ui5Nav, vocab, {
 *   sourceAsset: '000000001000',
 *   targetAsset: '000000002000',
 *   transferDate: '2026-07-01',
 * });
 * ```
 */
export async function transferAsset(
  ui5: UI5HandlerSlice,
  ui5Nav: NavAPI,
  vocabulary: VocabLookup,
  input: AssetTransferData,
  options?: IntentOptions,
): Promise<IntentResult> {
  const startTime = Date.now();
  const steps: string[] = [];
  const appHash = options?.overrides?.appId ?? 'Asset-transfer';
  const saveText = options?.overrides?.saveButtonText ?? 'Save';

  if (options?.skipNavigation !== true) {
    await ui5Nav.navigateToApp(appHash);
    steps.push('navigate');
  }

  const srcLabel = options?.overrides?.fields?.['Source Asset'] ?? 'Source Asset';
  const srcResult = await fillField(ui5, vocabulary, srcLabel, input.sourceAsset);
  if (srcResult.status === 'error') {
    return amResult({
      status: 'error',
      intentName: 'transferAsset',
      startTime,
      stepsExecuted: [...steps, ...srcResult.metadata.stepsExecuted],
      ...(srcResult.error !== undefined && { error: srcResult.error }),
    });
  }
  steps.push('fillSourceAsset');

  const tgtLabel = options?.overrides?.fields?.['Target Asset'] ?? 'Target Asset';
  const tgtResult = await fillField(ui5, vocabulary, tgtLabel, input.targetAsset);
  if (tgtResult.status === 'error') {
    return amResult({
      status: 'error',
      intentName: 'transferAsset',
      startTime,
      stepsExecuted: [...steps, ...tgtResult.metadata.stepsExecuted],
      ...(tgtResult.error !== undefined && { error: tgtResult.error }),
    });
  }
  steps.push('fillTargetAsset');

  const dateLabel = options?.overrides?.fields?.['Transfer Date'] ?? 'Transfer Date';
  const dateResult = await fillField(ui5, vocabulary, dateLabel, input.transferDate);
  if (dateResult.status === 'error') {
    return amResult({
      status: 'error',
      intentName: 'transferAsset',
      startTime,
      stepsExecuted: [...steps, ...dateResult.metadata.stepsExecuted],
      ...(dateResult.error !== undefined && { error: dateResult.error }),
    });
  }
  steps.push('fillTransferDate');

  await clickButton(ui5, saveText);
  steps.push('clickSave');

  await waitForSave(ui5, options);
  steps.push('waitForSave');

  return amResult({
    status: 'success',
    intentName: 'transferAsset',
    startTime,
    stepsExecuted: steps,
  });
}
