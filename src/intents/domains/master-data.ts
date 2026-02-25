/**
 * @license
 * Copyright (c) ZesTest 2025-2030. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0
 *
 * This file may contain AI-assisted code.
 * See LICENSE and NOTICE files for details.
 */

/**
 * Master Data (MD) intent domain functions.
 *
 * @remarks
 * Covers SAP master data creation scenarios: vendor master (MM-MK),
 * customer master (SD-MD), and material master (MM-MM).
 *
 * @sapModule MD
 * @businessContext SAP cross-module master data — vendor, customer, material.
 * @module intents
 */

import type { UI5HandlerSlice, VocabLookup } from '../core-wrappers.js';
import { clickButton, fillField, waitForSave } from '../core-wrappers.js';
import type {
  CustomerMasterData,
  IntentOptions,
  IntentResult,
  MaterialMasterData,
  VendorMasterData,
} from '../types.js';

// ── Inline navigation API interface ───────────────────────────────────────

/**
 * Minimal navigation API for MD intent functions.
 */
interface NavAPI {
  navigateToApp(appId: string, options?: unknown): Promise<void>;
  navigateToHash(hash: string, options?: unknown): Promise<void>;
}

// ── Internal helper ────────────────────────────────────────────────────────

/** Builds an MD-scoped `IntentResult<T>`. */
function mdResult<T>(params: {
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
      sapModule: 'MD',
      stepsExecuted: params.stepsExecuted,
    },
  } as IntentResult<T>;
}

// ── Public intent functions ────────────────────────────────────────────────

/**
 * Creates a vendor master record (MM-MK MK01 / Manage Suppliers).
 *
 * @remarks
 * Navigates to `Supplier-create`, fills name, country, and optional fields,
 * then clicks Save.
 *
 * @param ui5 - UI5 interaction handler.
 * @param ui5Nav - Navigation API.
 * @param vocabulary - Vocabulary lookup service.
 * @param input - Vendor master data.
 * @param options - Optional intent options.
 * @returns `IntentResult` describing the outcome.
 *
 * @intent Create a new vendor/supplier master record.
 * @sapModule MD
 * @businessContext MK01 / Manage Suppliers — vendor master creation.
 *
 * @example
 * ```typescript
 * import * as masterData from '#intents/domains/master-data.js';
 *
 * await masterData.createVendorMaster(ui5, ui5Nav, vocab, {
 *   name: 'Acme GmbH',
 *   country: 'DE',
 *   taxId: 'DE123456789',
 * });
 * ```
 */
export async function createVendorMaster(
  ui5: UI5HandlerSlice,
  ui5Nav: NavAPI,
  vocabulary: VocabLookup,
  input: VendorMasterData,
  options?: IntentOptions,
): Promise<IntentResult> {
  const startTime = Date.now();
  const steps: string[] = [];

  if (options?.skipNavigation !== true) {
    await ui5Nav.navigateToApp('Supplier-create');
    steps.push('navigate');
  }

  const nameResult = await fillField(ui5, vocabulary, 'Name', input.name);
  if (nameResult.status === 'error') {
    return mdResult({
      status: 'error',
      intentName: 'createVendorMaster',
      startTime,
      stepsExecuted: [...steps, ...nameResult.metadata.stepsExecuted],
      ...(nameResult.error !== undefined && { error: nameResult.error }),
    });
  }
  steps.push('fillName');

  const countryResult = await fillField(ui5, vocabulary, 'Country', input.country);
  if (countryResult.status === 'error') {
    return mdResult({
      status: 'error',
      intentName: 'createVendorMaster',
      startTime,
      stepsExecuted: [...steps, ...countryResult.metadata.stepsExecuted],
      ...(countryResult.error !== undefined && { error: countryResult.error }),
    });
  }
  steps.push('fillCountry');

  if (input.taxId !== undefined) {
    const taxResult = await fillField(ui5, vocabulary, 'Tax ID', input.taxId);
    if (taxResult.status === 'error') {
      return mdResult({
        status: 'error',
        intentName: 'createVendorMaster',
        startTime,
        stepsExecuted: [...steps, ...taxResult.metadata.stepsExecuted],
        ...(taxResult.error !== undefined && { error: taxResult.error }),
      });
    }
    steps.push('fillTaxId');
  }

  await clickButton(ui5, 'Save');
  steps.push('clickSave');

  await waitForSave(ui5, options);
  steps.push('waitForSave');

  return mdResult({
    status: 'success',
    intentName: 'createVendorMaster',
    startTime,
    stepsExecuted: steps,
  });
}

/**
 * Creates a customer master record (SD-MD XD01 / Manage Customers).
 *
 * @remarks
 * Navigates to `Customer-create`, fills name, country, and optional fields,
 * then clicks Save.
 *
 * @param ui5 - UI5 interaction handler.
 * @param ui5Nav - Navigation API.
 * @param vocabulary - Vocabulary lookup service.
 * @param input - Customer master data.
 * @param options - Optional intent options.
 * @returns `IntentResult` describing the outcome.
 *
 * @intent Create a new customer master record.
 * @sapModule MD
 * @businessContext XD01 / Manage Customers — customer master creation.
 *
 * @example
 * ```typescript
 * await masterData.createCustomerMaster(ui5, ui5Nav, vocab, {
 *   name: 'Globex Corp',
 *   country: 'US',
 *   salesOrganization: '1000',
 * });
 * ```
 */
export async function createCustomerMaster(
  ui5: UI5HandlerSlice,
  ui5Nav: NavAPI,
  vocabulary: VocabLookup,
  input: CustomerMasterData,
  options?: IntentOptions,
): Promise<IntentResult> {
  const startTime = Date.now();
  const steps: string[] = [];

  if (options?.skipNavigation !== true) {
    await ui5Nav.navigateToApp('Customer-create');
    steps.push('navigate');
  }

  const nameResult = await fillField(ui5, vocabulary, 'Name', input.name);
  if (nameResult.status === 'error') {
    return mdResult({
      status: 'error',
      intentName: 'createCustomerMaster',
      startTime,
      stepsExecuted: [...steps, ...nameResult.metadata.stepsExecuted],
      ...(nameResult.error !== undefined && { error: nameResult.error }),
    });
  }
  steps.push('fillName');

  const countryResult = await fillField(ui5, vocabulary, 'Country', input.country);
  if (countryResult.status === 'error') {
    return mdResult({
      status: 'error',
      intentName: 'createCustomerMaster',
      startTime,
      stepsExecuted: [...steps, ...countryResult.metadata.stepsExecuted],
      ...(countryResult.error !== undefined && { error: countryResult.error }),
    });
  }
  steps.push('fillCountry');

  if (input.salesOrganization !== undefined) {
    const salesOrgResult = await fillField(
      ui5,
      vocabulary,
      'Sales Organization',
      input.salesOrganization,
    );
    if (salesOrgResult.status === 'error') {
      return mdResult({
        status: 'error',
        intentName: 'createCustomerMaster',
        startTime,
        stepsExecuted: [...steps, ...salesOrgResult.metadata.stepsExecuted],
        ...(salesOrgResult.error !== undefined && { error: salesOrgResult.error }),
      });
    }
    steps.push('fillSalesOrganization');
  }

  await clickButton(ui5, 'Save');
  steps.push('clickSave');

  await waitForSave(ui5, options);
  steps.push('waitForSave');

  return mdResult({
    status: 'success',
    intentName: 'createCustomerMaster',
    startTime,
    stepsExecuted: steps,
  });
}

/**
 * Creates a material master record (MM-MM MM01 / Manage Material Master).
 *
 * @remarks
 * Navigates to `Material-create`, fills material number, description,
 * and optional type and base unit, then clicks Save.
 *
 * @param ui5 - UI5 interaction handler.
 * @param ui5Nav - Navigation API.
 * @param vocabulary - Vocabulary lookup service.
 * @param input - Material master data.
 * @param options - Optional intent options.
 * @returns `IntentResult` describing the outcome.
 *
 * @intent Create a new material master record.
 * @sapModule MD
 * @businessContext MM01 / Manage Material Master — material master creation.
 *
 * @example
 * ```typescript
 * await masterData.createMaterialMaster(ui5, ui5Nav, vocab, {
 *   materialNumber: 'RAW-0001',
 *   description: 'Raw material A',
 *   materialType: 'ROH',
 *   baseUnit: 'KG',
 * });
 * ```
 */
export async function createMaterialMaster(
  ui5: UI5HandlerSlice,
  ui5Nav: NavAPI,
  vocabulary: VocabLookup,
  input: MaterialMasterData,
  options?: IntentOptions,
): Promise<IntentResult> {
  const startTime = Date.now();
  const steps: string[] = [];

  if (options?.skipNavigation !== true) {
    await ui5Nav.navigateToApp('Material-create');
    steps.push('navigate');
  }

  const materialResult = await fillField(ui5, vocabulary, 'Material Number', input.materialNumber);
  if (materialResult.status === 'error') {
    return mdResult({
      status: 'error',
      intentName: 'createMaterialMaster',
      startTime,
      stepsExecuted: [...steps, ...materialResult.metadata.stepsExecuted],
      ...(materialResult.error !== undefined && { error: materialResult.error }),
    });
  }
  steps.push('fillMaterialNumber');

  const descResult = await fillField(ui5, vocabulary, 'Description', input.description);
  if (descResult.status === 'error') {
    return mdResult({
      status: 'error',
      intentName: 'createMaterialMaster',
      startTime,
      stepsExecuted: [...steps, ...descResult.metadata.stepsExecuted],
      ...(descResult.error !== undefined && { error: descResult.error }),
    });
  }
  steps.push('fillDescription');

  if (input.materialType !== undefined) {
    const typeResult = await fillField(ui5, vocabulary, 'Material Type', input.materialType);
    if (typeResult.status === 'error') {
      return mdResult({
        status: 'error',
        intentName: 'createMaterialMaster',
        startTime,
        stepsExecuted: [...steps, ...typeResult.metadata.stepsExecuted],
        ...(typeResult.error !== undefined && { error: typeResult.error }),
      });
    }
    steps.push('fillMaterialType');
  }

  if (input.baseUnit !== undefined) {
    const unitResult = await fillField(ui5, vocabulary, 'Base Unit', input.baseUnit);
    if (unitResult.status === 'error') {
      return mdResult({
        status: 'error',
        intentName: 'createMaterialMaster',
        startTime,
        stepsExecuted: [...steps, ...unitResult.metadata.stepsExecuted],
        ...(unitResult.error !== undefined && { error: unitResult.error }),
      });
    }
    steps.push('fillBaseUnit');
  }

  await clickButton(ui5, 'Save');
  steps.push('clickSave');

  await waitForSave(ui5, options);
  steps.push('waitForSave');

  return mdResult({
    status: 'success',
    intentName: 'createMaterialMaster',
    startTime,
    stepsExecuted: steps,
  });
}
