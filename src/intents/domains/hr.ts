/**
 * @license
 * Copyright (c) ZesTest 2025-2030. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0
 *
 * This file may contain AI-assisted code.
 * See LICENSE and NOTICE files for details.
 */

/**
 * Human Resources (HR) intent domain functions.
 *
 * @remarks
 * Covers SAP Human Capital Management scenarios: employee creation,
 * time recording, and absence (leave) request creation.
 *
 * @sapModule HR
 * @businessContext SAP HCM — hire-to-retire lifecycle.
 * @module intents
 */

import type { UI5HandlerSlice, VocabLookup } from '../core-wrappers.js';
import { clickButton, fillField, waitForSave } from '../core-wrappers.js';
import type {
  AbsenceRequestData,
  EmployeeData,
  IntentOptions,
  IntentResult,
  TimeRecordingData,
} from '../types.js';

// ── Inline navigation API interface ───────────────────────────────────────

/**
 * Minimal navigation API for HR intent functions.
 */
interface NavAPI {
  navigateToApp(appId: string, options?: unknown): Promise<void>;
  navigateToHash(hash: string, options?: unknown): Promise<void>;
}

// ── Internal helper ────────────────────────────────────────────────────────

/** Builds an HR-scoped `IntentResult<T>`. */
function hrResult<T>(params: {
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
      sapModule: 'HR',
      stepsExecuted: params.stepsExecuted,
    },
  };
}

// ── Public intent functions ────────────────────────────────────────────────

/**
 * Creates an employee master record (PA — PA30/PA40).
 *
 * @remarks
 * Navigates to the `Employee-create` FLP hash, fills first name,
 * last name, and personnel area, then clicks Save.
 *
 * @param ui5 - UI5 interaction handler.
 * @param ui5Nav - Navigation API.
 * @param vocabulary - Vocabulary lookup service.
 * @param input - Employee data.
 * @param options - Optional intent options.
 * @returns `IntentResult` describing the outcome.
 *
 * @intent Create an employee master record.
 * @capability intent.hr.createEmployee
 * @sapModule HR
 * @businessContext PA30 — maintain HR master data / hiring action.
 *
 * @example
 * ```typescript
 * import * as hr from '#intents/domains/hr.js';
 *
 * await hr.createEmployee(ui5, ui5Nav, vocab, {
 *   firstName: 'Max',
 *   lastName: 'Mustermann',
 *   personnelArea: '1000',
 * });
 * ```
 */
export async function createEmployee(
  ui5: UI5HandlerSlice,
  ui5Nav: NavAPI,
  vocabulary: VocabLookup,
  input: EmployeeData,
  options?: IntentOptions,
): Promise<IntentResult> {
  const startTime = Date.now();
  const steps: string[] = [];
  const appHash = options?.overrides?.appId ?? 'Employee-create';
  const saveText = options?.overrides?.saveButtonText ?? 'Save';

  if (options?.skipNavigation !== true) {
    await ui5Nav.navigateToApp(appHash);
    steps.push('navigate');
  }

  const fnLabel = options?.overrides?.fields?.['First Name'] ?? 'First Name';
  const fnResult = await fillField(ui5, vocabulary, fnLabel, input.firstName);
  if (fnResult.status === 'error') {
    return hrResult({
      status: 'error',
      intentName: 'createEmployee',
      startTime,
      stepsExecuted: [...steps, ...fnResult.metadata.stepsExecuted],
      ...(fnResult.error !== undefined && { error: fnResult.error }),
    });
  }
  steps.push('fillFirstName');

  const lnLabel = options?.overrides?.fields?.['Last Name'] ?? 'Last Name';
  const lnResult = await fillField(ui5, vocabulary, lnLabel, input.lastName);
  if (lnResult.status === 'error') {
    return hrResult({
      status: 'error',
      intentName: 'createEmployee',
      startTime,
      stepsExecuted: [...steps, ...lnResult.metadata.stepsExecuted],
      ...(lnResult.error !== undefined && { error: lnResult.error }),
    });
  }
  steps.push('fillLastName');

  const paLabel = options?.overrides?.fields?.['Personnel Area'] ?? 'Personnel Area';
  const paResult = await fillField(ui5, vocabulary, paLabel, input.personnelArea);
  if (paResult.status === 'error') {
    return hrResult({
      status: 'error',
      intentName: 'createEmployee',
      startTime,
      stepsExecuted: [...steps, ...paResult.metadata.stepsExecuted],
      ...(paResult.error !== undefined && { error: paResult.error }),
    });
  }
  steps.push('fillPersonnelArea');

  await clickButton(ui5, saveText);
  steps.push('clickSave');

  await waitForSave(ui5, options);
  steps.push('waitForSave');

  return hrResult({
    status: 'success',
    intentName: 'createEmployee',
    startTime,
    stepsExecuted: steps,
  });
}

/**
 * Records employee work time (PT — CATS / CAT2).
 *
 * @param ui5 - UI5 interaction handler.
 * @param ui5Nav - Navigation API.
 * @param vocabulary - Vocabulary lookup service.
 * @param input - Time recording data.
 * @param options - Optional intent options.
 * @returns `IntentResult` describing the outcome.
 *
 * @intent Record employee working time.
 * @capability intent.hr.recordTime
 * @sapModule HR
 * @businessContext CAT2 — time sheet entry.
 *
 * @example
 * ```typescript
 * await hr.recordTime(ui5, ui5Nav, vocab, {
 *   employeeId: '00001234',
 *   date: '2026-04-15',
 *   hours: 8,
 * });
 * ```
 */
export async function recordTime(
  ui5: UI5HandlerSlice,
  ui5Nav: NavAPI,
  vocabulary: VocabLookup,
  input: TimeRecordingData,
  options?: IntentOptions,
): Promise<IntentResult> {
  const startTime = Date.now();
  const steps: string[] = [];
  const appHash = options?.overrides?.appId ?? 'TimeEntry-create';
  const saveText = options?.overrides?.saveButtonText ?? 'Save';

  if (options?.skipNavigation !== true) {
    await ui5Nav.navigateToApp(appHash);
    steps.push('navigate');
  }

  const empLabel = options?.overrides?.fields?.['Employee ID'] ?? 'Employee ID';
  const empResult = await fillField(ui5, vocabulary, empLabel, input.employeeId);
  if (empResult.status === 'error') {
    return hrResult({
      status: 'error',
      intentName: 'recordTime',
      startTime,
      stepsExecuted: [...steps, ...empResult.metadata.stepsExecuted],
      ...(empResult.error !== undefined && { error: empResult.error }),
    });
  }
  steps.push('fillEmployeeId');

  const dateLabel = options?.overrides?.fields?.['Date'] ?? 'Date';
  const dateResult = await fillField(ui5, vocabulary, dateLabel, input.date);
  if (dateResult.status === 'error') {
    return hrResult({
      status: 'error',
      intentName: 'recordTime',
      startTime,
      stepsExecuted: [...steps, ...dateResult.metadata.stepsExecuted],
      ...(dateResult.error !== undefined && { error: dateResult.error }),
    });
  }
  steps.push('fillDate');

  const hrsLabel = options?.overrides?.fields?.['Hours'] ?? 'Hours';
  const hrsResult = await fillField(ui5, vocabulary, hrsLabel, String(input.hours));
  if (hrsResult.status === 'error') {
    return hrResult({
      status: 'error',
      intentName: 'recordTime',
      startTime,
      stepsExecuted: [...steps, ...hrsResult.metadata.stepsExecuted],
      ...(hrsResult.error !== undefined && { error: hrsResult.error }),
    });
  }
  steps.push('fillHours');

  await clickButton(ui5, saveText);
  steps.push('clickSave');

  await waitForSave(ui5, options);
  steps.push('waitForSave');

  return hrResult({
    status: 'success',
    intentName: 'recordTime',
    startTime,
    stepsExecuted: steps,
  });
}

/**
 * Creates an absence (leave) request (PT — PA61 / Leave Request app).
 *
 * @param ui5 - UI5 interaction handler.
 * @param ui5Nav - Navigation API.
 * @param vocabulary - Vocabulary lookup service.
 * @param input - Absence request data.
 * @param options - Optional intent options.
 * @returns `IntentResult` describing the outcome.
 *
 * @intent Create an employee absence (leave) request.
 * @capability intent.hr.requestAbsence
 * @sapModule HR
 * @businessContext PA61 / Leave Request — create absence record.
 *
 * @example
 * ```typescript
 * await hr.requestAbsence(ui5, ui5Nav, vocab, {
 *   employeeId: '00001234',
 *   absenceType: '0100',
 *   startDate: '2026-05-01',
 *   endDate: '2026-05-05',
 * });
 * ```
 */
export async function requestAbsence(
  ui5: UI5HandlerSlice,
  ui5Nav: NavAPI,
  vocabulary: VocabLookup,
  input: AbsenceRequestData,
  options?: IntentOptions,
): Promise<IntentResult> {
  const startTime = Date.now();
  const steps: string[] = [];
  const appHash = options?.overrides?.appId ?? 'LeaveRequest-create';
  const saveText = options?.overrides?.saveButtonText ?? 'Save';

  if (options?.skipNavigation !== true) {
    await ui5Nav.navigateToApp(appHash);
    steps.push('navigate');
  }

  const empLabel = options?.overrides?.fields?.['Employee ID'] ?? 'Employee ID';
  const empResult = await fillField(ui5, vocabulary, empLabel, input.employeeId);
  if (empResult.status === 'error') {
    return hrResult({
      status: 'error',
      intentName: 'requestAbsence',
      startTime,
      stepsExecuted: [...steps, ...empResult.metadata.stepsExecuted],
      ...(empResult.error !== undefined && { error: empResult.error }),
    });
  }
  steps.push('fillEmployeeId');

  const typeLabel = options?.overrides?.fields?.['Absence Type'] ?? 'Absence Type';
  const typeResult = await fillField(ui5, vocabulary, typeLabel, input.absenceType);
  if (typeResult.status === 'error') {
    return hrResult({
      status: 'error',
      intentName: 'requestAbsence',
      startTime,
      stepsExecuted: [...steps, ...typeResult.metadata.stepsExecuted],
      ...(typeResult.error !== undefined && { error: typeResult.error }),
    });
  }
  steps.push('fillAbsenceType');

  const startLabel = options?.overrides?.fields?.['Start Date'] ?? 'Start Date';
  const startResult = await fillField(ui5, vocabulary, startLabel, input.startDate);
  if (startResult.status === 'error') {
    return hrResult({
      status: 'error',
      intentName: 'requestAbsence',
      startTime,
      stepsExecuted: [...steps, ...startResult.metadata.stepsExecuted],
      ...(startResult.error !== undefined && { error: startResult.error }),
    });
  }
  steps.push('fillStartDate');

  const endLabel = options?.overrides?.fields?.['End Date'] ?? 'End Date';
  const endResult = await fillField(ui5, vocabulary, endLabel, input.endDate);
  if (endResult.status === 'error') {
    return hrResult({
      status: 'error',
      intentName: 'requestAbsence',
      startTime,
      stepsExecuted: [...steps, ...endResult.metadata.stepsExecuted],
      ...(endResult.error !== undefined && { error: endResult.error }),
    });
  }
  steps.push('fillEndDate');

  await clickButton(ui5, saveText);
  steps.push('clickSave');

  await waitForSave(ui5, options);
  steps.push('waitForSave');

  return hrResult({
    status: 'success',
    intentName: 'requestAbsence',
    startTime,
    stepsExecuted: steps,
  });
}
