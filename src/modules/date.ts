/**
 * @license
 * Copyright (c) ZesTest 2025-2030. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0
 *
 * This file may contain AI-assisted code.
 * See LICENSE and NOTICE files for details.
 */

/**
 * Date/time picker module providing date value management with automatic format conversion.
 *
 * @remarks
 * Pure-function module. All browser-context code uses string scripts via `page.evaluate()`.
 * `sap.m.DatePicker.setValue()` expects date in the control's `valueFormat` (default: `yyyy-MM-dd`).
 * Setting wrong format causes silent failure showing invalid date. This module reads `valueFormat`,
 * converts the input, then sets the value correctly.
 *
 * @example
 * ```typescript
 * import { setDatePickerValue, getDatePickerValue, formatDateForUI5 } from '../modules/date.js';
 *
 * await setDatePickerValue(page, 'datePicker1', new Date(2024, 0, 15));
 * const value = await getDatePickerValue(page, 'datePicker1');
 * const formatted = formatDateForUI5(new Date(2024, 0, 15), 'dd.MM.yyyy');
 * ```
 *
 * @module modules
 */

import { ErrorCode } from '#core/errors/codes.js';
import { ControlError } from '#core/errors/control-error.js';
import { DEFAULT_TIMEOUTS } from '#core/utils/constants.js';

/**
 * Supported UI5 date format patterns.
 *
 * @example
 * ```typescript
 * import { DATE_FORMATS } from '../modules/date.js';
 * const isoFormat = DATE_FORMATS.ISO; // 'yyyy-MM-dd'
 * ```
 */
export const DATE_FORMATS = {
  ISO: 'yyyy-MM-dd',
  SAP_INTERNAL: 'yyyyMMdd',
  EUROPEAN: 'dd.MM.yyyy',
  US: 'MM/dd/yyyy',
  JAPANESE: 'yyyy/MM/dd',
} as const;

/**
 * Union of supported date format pattern strings.
 *
 * @example
 * ```typescript
 * const fmt: DateFormatPattern = 'yyyy-MM-dd';
 * ```
 */
export type DateFormatPattern = (typeof DATE_FORMATS)[keyof typeof DATE_FORMATS];

/**
 * Accepted date input: a Date object or an ISO date string.
 *
 * @example
 * ```typescript
 * const d1: DateInput = new Date(2024, 0, 15);
 * const d2: DateInput = '2024-01-15';
 * ```
 */
export type DateInput = Date | string;

/**
 * Options for date/time picker operations.
 *
 * @example
 * ```typescript
 * const opts: DateOptions = { timeout: 5000, skipStabilityWait: true };
 * ```
 */
export interface DateOptions {
  /** Timeout in milliseconds for the operation. */
  readonly timeout?: number;
  /** Whether to skip stability wait after setting. */
  readonly skipStabilityWait?: boolean;
  /** Locale for formatting (reserved for future use). */
  readonly locale?: string;
  /** Timezone for formatting (reserved for future use). */
  readonly timezone?: string;
}

/**
 * Result of a date range selection query.
 *
 * @example
 * ```typescript
 * const range: DateRangeResult = { startDate: '2024-01-01', endDate: '2024-01-31' };
 * ```
 */
export interface DateRangeResult {
  /** The start date string. */
  readonly startDate: string;
  /** The end date string. */
  readonly endDate: string;
}

/**
 * Minimal page interface for date picker operations.
 *
 * @remarks
 * Decouples from full Playwright Page, enabling unit testing with lightweight mocks.
 *
 * @example
 * ```typescript
 * const page: DatePage = { evaluate: async (script) => ({}) };
 * ```
 */
export interface DatePage {
  evaluate<TResult>(pageFunction: string, arg?: unknown): Promise<TResult>;
}

/**
 * Reads the current string value from a UI5 control via `getValue()`.
 *
 * @param page - Playwright Page (or compatible subset).
 * @param controlId - The ID of the UI5 control.
 * @returns The current value string, or empty string if control not found.
 */
async function getControlStringValue(page: DatePage, controlId: string): Promise<string> {
  const script = `(function() {
    var ctrl = sap.ui.getCore().byId(${JSON.stringify(controlId)});
    if (!ctrl) return '';
    return ctrl.getValue() || '';
  })()`;

  return page.evaluate<string>(script, undefined);
}

/**
 * Converts a {@link DateInput} to a Date object, validating it is a real date.
 *
 * @param input - Date object or ISO string.
 * @returns A valid Date.
 * @throws ControlError if the input is not a valid date.
 *
 * @example
 * ```typescript
 * const d = toValidDate('2024-01-15');
 * ```
 */
function toValidDate(input: DateInput): Date {
  const date = typeof input === 'string' ? new Date(input) : input;
  if (Number.isNaN(date.getTime())) {
    throw new ControlError({
      code: ErrorCode.ERR_CONTROL_PROPERTY,
      message: `Invalid date input: ${String(input)}`,
      attempted: `Parse date input: ${String(input)}`,
      retryable: false,
      suggestions: [
        'Provide a valid Date object or ISO date string (e.g., "2024-01-15")',
        'Check that the date string follows ISO 8601 format',
      ],
    });
  }
  return date;
}

/**
 * Formats a Date object into a UI5-compatible date string.
 *
 * @capability ui5.date.setDatePicker
 * @intent Convert a Date to a UI5 date format string for use with DatePicker controls.
 * @guarantee Returns a correctly formatted date string matching the specified pattern.
 * @ai
 * @aiContext Pure function (no browser context). Supports ISO, SAP_INTERNAL, EUROPEAN, US, JAPANESE formats.
 * Use to prepare date values before passing to setDatePickerValue().
 * @sapModule sap.m.DatePicker — valueFormat conversion
 * @businessContext Format dates for SAP UI5 date picker controls with locale-aware patterns.
 *
 * @remarks
 * Pure function (no browser context). Supports the five patterns in {@link DATE_FORMATS}.
 *
 * @param date - The date to format (Date object or ISO string).
 * @param format - The target format pattern.
 * @returns The formatted date string.
 * @throws ControlError if the format is unsupported or the date is invalid.
 *
 * @example
 * ```typescript
 * formatDateForUI5(new Date(2024, 0, 15), 'yyyy-MM-dd'); // '2024-01-15'
 * formatDateForUI5(new Date(2024, 0, 15), 'dd.MM.yyyy'); // '15.01.2024'
 * ```
 */
export function formatDateForUI5(date: DateInput, format: string): string {
  const d = toValidDate(date);
  const year = String(d.getFullYear());
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');

  switch (format) {
    case DATE_FORMATS.ISO: {
      return `${year}-${month}-${day}`;
    }
    case DATE_FORMATS.SAP_INTERNAL: {
      return `${year}${month}${day}`;
    }
    case DATE_FORMATS.EUROPEAN: {
      return `${day}.${month}.${year}`;
    }
    case DATE_FORMATS.US: {
      return `${month}/${day}/${year}`;
    }
    case DATE_FORMATS.JAPANESE: {
      return `${year}/${month}/${day}`;
    }
    default: {
      throw new ControlError({
        code: ErrorCode.ERR_CONTROL_PROPERTY,
        message: `Unsupported date format: ${format}`,
        attempted: `Format date to pattern: ${format}`,
        retryable: false,
        details: { format, supportedFormats: Object.values(DATE_FORMATS) },
        suggestions: [
          `Use one of the supported formats: ${Object.values(DATE_FORMATS).join(', ')}`,
          'Check the DatePicker valueFormat property for the expected pattern',
        ],
      });
    }
  }
}

/**
 * Sets a date value on a `sap.m.DatePicker` control.
 *
 * @capability ui5.date.setDatePicker
 * @intent Set a date on a UI5 DatePicker control with automatic format conversion.
 * @guarantee On success, the control's value is set and fireChange() has been called.
 * @prerequisite The control must be a sap.m.DatePicker and must exist in the UI5 view.
 * @recipe Date picker interaction:
 * 1. `await setDatePickerValue(page, controlId, date)`
 * 2. Optionally validate: `await setAndValidateDate(page, controlId, date)`
 * 3. Read back: `const val = await getDatePickerValue(page, controlId)`
 * @ai
 * @aiContext Reads the control's valueFormat, converts the input to match, then calls
 * setValue() + fireChange(). This prevents the silent wrong-format bug where the date
 * shows as invalid in the UI.
 * @sapModule sap.m.DatePicker — setValue(), getValueFormat(), fireChange()
 * @businessContext Set dates on SAP form fields (posting date, delivery date, etc.).
 *
 * @remarks
 * Reads the control's `valueFormat`, converts the input accordingly, then calls
 * `setValue()` and `fireChange({valid: true})` in a single evaluate script.
 *
 * @param page - Playwright Page (or compatible subset).
 * @param controlId - The ID of the DatePicker control.
 * @param date - The date to set (Date object or ISO string).
 * @param options - Optional date operation settings.
 *
 * @example
 * ```typescript
 * await setDatePickerValue(page, 'datePicker1', new Date(2024, 0, 15));
 * await setDatePickerValue(page, 'datePicker1', '2024-01-15');
 * ```
 */
export async function setDatePickerValue(
  page: DatePage,
  controlId: string,
  date: DateInput,
  options?: DateOptions,
): Promise<void> {
  const d = toValidDate(date);
  const isoValue = formatDateForUI5(d, DATE_FORMATS.ISO);
  const timeout = options?.timeout ?? DEFAULT_TIMEOUTS.CONTROL_DISCOVERY;

  const script = `(function() {
    var ctrl = sap.ui.getCore().byId(${JSON.stringify(controlId)});
    if (!ctrl) return { error: 'not_found' };
    var fmt = ctrl.getValueFormat ? ctrl.getValueFormat() : '';
    return { valueFormat: fmt || 'yyyy-MM-dd' };
  })()`;

  const formatResult = await page.evaluate<{ error?: string; valueFormat?: string }>(
    script,
    undefined,
  );

  if (formatResult.error === 'not_found') {
    throw new ControlError({
      code: ErrorCode.ERR_CONTROL_NOT_FOUND,
      message: `DatePicker control not found: ${controlId}`,
      attempted: `Set date on DatePicker: ${controlId}`,
      retryable: true,
      details: { controlId, timeout },
      suggestions: [
        'Verify the control ID exists in the UI5 view',
        'Check if the page has fully loaded',
        'Ensure the control is a sap.m.DatePicker',
      ],
    });
  }

  const valueFormat = formatResult.valueFormat ?? DATE_FORMATS.ISO;
  const formattedValue = formatDateForUI5(d, valueFormat);

  const setScript = `(function() {
    var ctrl = sap.ui.getCore().byId(${JSON.stringify(controlId)});
    if (!ctrl) return { error: 'not_found' };
    ctrl.setValue(${JSON.stringify(formattedValue)});
    if (typeof ctrl.fireChange === 'function') {
      ctrl.fireChange({ value: ${JSON.stringify(formattedValue)}, valid: true });
    }
    return { success: true, value: ${JSON.stringify(isoValue)} };
  })()`;

  await page.evaluate<{ error?: string; success?: boolean; value?: string }>(setScript, undefined);

  if (options?.skipStabilityWait !== true) {
    await page.evaluate(
      `new Promise(function(resolve) { setTimeout(resolve, ${String(DEFAULT_TIMEOUTS.DOM_SETTLE)}); })`,
      undefined,
    );
  }
}

/**
 * Gets the current value from a `sap.m.DatePicker` control.
 *
 * @capability ui5.date.getDatePicker
 * @intent Read the current date string from a DatePicker control.
 * @guarantee Returns the raw date string from the control's getValue() method.
 * @ai
 * @aiContext Returns the raw string value from getValue(). Format depends on the control's valueFormat.
 * @sapModule sap.m.DatePicker — getValue()
 * @businessContext Read current date values from SAP form fields for assertions.
 *
 * @param page - Playwright Page (or compatible subset).
 * @param controlId - The ID of the DatePicker control.
 * @returns The current date value string.
 *
 * @example
 * ```typescript
 * const value = await getDatePickerValue(page, 'datePicker1');
 * ```
 */
export async function getDatePickerValue(page: DatePage, controlId: string): Promise<string> {
  return getControlStringValue(page, controlId);
}

/**
 * Sets a date range on a `sap.m.DateRangeSelection` control.
 *
 * @capability ui5.date.setDateRange
 * @intent Set both start and end dates on a DateRangeSelection control.
 * @guarantee On success, both date values are set and fireChange() is called.
 * @prerequisite startDate must be before or equal to endDate.
 * @ai
 * @aiContext Uses setDateValue() and setSecondDateValue() + fireChange(). Validates
 * that start date is before or equal to end date before setting.
 * @sapModule sap.m.DateRangeSelection — setDateValue(), setSecondDateValue()
 * @businessContext Set date range filters (fiscal period, delivery window, reporting range).
 *
 * @param page - Playwright Page (or compatible subset).
 * @param controlId - The ID of the DateRangeSelection control.
 * @param startDate - The start date.
 * @param endDate - The end date.
 * @param options - Optional date operation settings.
 * @throws ControlError if startDate is after endDate.
 *
 * @example
 * ```typescript
 * await setDateRangeSelection(page, 'range1', '2024-01-01', '2024-01-31');
 * ```
 */
export async function setDateRangeSelection(
  page: DatePage,
  controlId: string,
  startDate: DateInput,
  endDate: DateInput,
  options?: DateOptions,
): Promise<void> {
  const start = toValidDate(startDate);
  const end = toValidDate(endDate);

  if (start.getTime() > end.getTime()) {
    throw new ControlError({
      code: ErrorCode.ERR_CONTROL_PROPERTY,
      message: 'Start date must not be after end date',
      attempted: `Set date range on control: ${controlId}`,
      retryable: false,
      details: { controlId, startDate: start.toISOString(), endDate: end.toISOString() },
      suggestions: [
        'Ensure the start date is before or equal to the end date',
        'Swap the start and end dates if they were provided in wrong order',
      ],
    });
  }

  const startISO = formatDateForUI5(start, DATE_FORMATS.ISO);
  const endISO = formatDateForUI5(end, DATE_FORMATS.ISO);

  const script = `(function() {
    var ctrl = sap.ui.getCore().byId(${JSON.stringify(controlId)});
    if (!ctrl) return { error: 'not_found' };
    ctrl.setDateValue(new Date(${JSON.stringify(startISO)}));
    ctrl.setSecondDateValue(new Date(${JSON.stringify(endISO)}));
    if (typeof ctrl.fireChange === 'function') {
      ctrl.fireChange({ value: ${JSON.stringify(startISO + ' - ' + endISO)}, valid: true });
    }
    return { success: true };
  })()`;

  await page.evaluate<{ error?: string; success?: boolean }>(script, undefined);

  if (options?.skipStabilityWait !== true) {
    await page.evaluate(
      `new Promise(function(resolve) { setTimeout(resolve, ${String(DEFAULT_TIMEOUTS.DOM_SETTLE)}); })`,
      undefined,
    );
  }
}

/**
 * Gets the current date range from a `sap.m.DateRangeSelection` control.
 *
 * @capability ui5.date.getDateRange
 * @intent Read the current start and end dates from a DateRangeSelection control.
 * @guarantee Returns an object with start and end date strings in ISO format from the control.
 * @ai
 * @aiContext Returns ISO-formatted date strings from getDateValue() and getSecondDateValue().
 * @sapModule sap.m.DateRangeSelection — getDateValue(), getSecondDateValue()
 * @businessContext Read current date range filter values for assertions.
 *
 * @param page - Playwright Page (or compatible subset).
 * @param controlId - The ID of the DateRangeSelection control.
 * @returns The start and end date strings.
 *
 * @example
 * ```typescript
 * const range = await getDateRangeSelection(page, 'range1');
 * // { startDate: '2024-01-01', endDate: '2024-01-31' }
 * ```
 */
export async function getDateRangeSelection(
  page: DatePage,
  controlId: string,
): Promise<DateRangeResult> {
  const script = `(function() {
    var ctrl = sap.ui.getCore().byId(${JSON.stringify(controlId)});
    if (!ctrl) return { startDate: '', endDate: '' };
    var from = ctrl.getDateValue();
    var to = ctrl.getSecondDateValue();
    function fmt(d) {
      if (!d) return '';
      var y = d.getFullYear();
      var m = ('0' + (d.getMonth() + 1)).slice(-2);
      var day = ('0' + d.getDate()).slice(-2);
      return y + '-' + m + '-' + day;
    }
    return { startDate: fmt(from), endDate: fmt(to) };
  })()`;

  return page.evaluate<DateRangeResult>(script, undefined);
}

/**
 * Sets a date and validates that the control does not enter an error state.
 *
 * @capability ui5.date.setAndValidate
 * @intent Set a date and verify the control does not show a validation error.
 * @guarantee On success, the date is set and the control's valueState is not 'Error'.
 * @ai
 * @aiContext Combines setDatePickerValue() with a valueState check. Throws if the date
 * is outside the allowed range (minDate/maxDate) or format is invalid.
 * @sapModule sap.m.DatePicker — setValue(), getValueState()
 * @businessContext Safely set dates with validation in SAP forms (e.g., fiscal period constraints).
 *
 * @param page - Playwright Page (or compatible subset).
 * @param controlId - The ID of the DatePicker control.
 * @param date - The date to set.
 * @param options - Optional date operation settings.
 * @throws ControlError if the control enters an error value state after setting.
 *
 * @example
 * ```typescript
 * await setAndValidateDate(page, 'datePicker1', '2024-01-15');
 * ```
 */
export async function setAndValidateDate(
  page: DatePage,
  controlId: string,
  date: DateInput,
  options?: DateOptions,
): Promise<void> {
  await setDatePickerValue(page, controlId, date, options);

  const validateScript = `(function() {
    var ctrl = sap.ui.getCore().byId(${JSON.stringify(controlId)});
    if (!ctrl) return 'None';
    return ctrl.getValueState ? ctrl.getValueState() : 'None';
  })()`;

  const valueState = await page.evaluate<string>(validateScript, undefined);

  if (valueState === 'Error') {
    throw new ControlError({
      code: ErrorCode.ERR_CONTROL_PROPERTY,
      message: `Date validation failed for control: ${controlId}`,
      attempted: `Set and validate date on: ${controlId}`,
      retryable: false,
      details: { controlId, date: String(date), valueState },
      suggestions: [
        'Check that the date is within the allowed range (minDate/maxDate)',
        'Verify the date format matches the control valueFormat',
        'Inspect the control value state text for specific validation errors',
      ],
    });
  }
}

/**
 * Sets a time value on a `sap.m.TimePicker` control.
 *
 * @capability ui5.date.setTimePicker
 * @intent Set a time value on a UI5 TimePicker control.
 * @guarantee On success, the time value is set and fireChange() is called.
 * @ai
 * @aiContext Validates HH:mm or HH:mm:ss format before setting. Uses setValue() + fireChange().
 * @sapModule sap.m.TimePicker — setValue(), fireChange()
 * @businessContext Set time values in SAP forms (shift start, delivery time, etc.).
 *
 * @param page - Playwright Page (or compatible subset).
 * @param controlId - The ID of the TimePicker control.
 * @param time - Time string (e.g., '14:30' or '14:30:00').
 * @param options - Optional date operation settings.
 * @throws ControlError if the time format is invalid.
 *
 * @example
 * ```typescript
 * await setTimePickerValue(page, 'timePicker1', '14:30');
 * await setTimePickerValue(page, 'timePicker1', '14:30:45');
 * ```
 */
export async function setTimePickerValue(
  page: DatePage,
  controlId: string,
  time: string,
  options?: DateOptions,
): Promise<void> {
  const timePattern = /^(?:[01]\d|2[0-3]):[0-5]\d(?::[0-5]\d)?$/;
  if (!timePattern.test(time)) {
    throw new ControlError({
      code: ErrorCode.ERR_CONTROL_PROPERTY,
      message: `Invalid time format: ${time}`,
      attempted: `Set time on TimePicker: ${controlId}`,
      retryable: false,
      details: { controlId, time },
      suggestions: [
        'Use HH:mm format (e.g., "14:30")',
        'Use HH:mm:ss format for seconds precision (e.g., "14:30:00")',
      ],
    });
  }

  const script = `(function() {
    var ctrl = sap.ui.getCore().byId(${JSON.stringify(controlId)});
    if (!ctrl) return { error: 'not_found' };
    ctrl.setValue(${JSON.stringify(time)});
    if (typeof ctrl.fireChange === 'function') {
      ctrl.fireChange({ value: ${JSON.stringify(time)}, valid: true });
    }
    return { success: true };
  })()`;

  await page.evaluate<{ error?: string; success?: boolean }>(script, undefined);

  if (options?.skipStabilityWait !== true) {
    await page.evaluate(
      `new Promise(function(resolve) { setTimeout(resolve, ${String(DEFAULT_TIMEOUTS.DOM_SETTLE)}); })`,
      undefined,
    );
  }
}

/**
 * Gets the current value from a `sap.m.TimePicker` control.
 *
 * @capability ui5.date.getTimePicker
 * @intent Read the current time string from a TimePicker control.
 * @guarantee Returns the raw time string from the control's getValue() method.
 * @ai
 * @aiContext Returns the raw string value from getValue().
 * @sapModule sap.m.TimePicker — getValue()
 * @businessContext Read current time values from SAP form fields for assertions.
 *
 * @param page - Playwright Page (or compatible subset).
 * @param controlId - The ID of the TimePicker control.
 * @returns The current time value string.
 *
 * @example
 * ```typescript
 * const time = await getTimePickerValue(page, 'timePicker1');
 * // '14:30'
 * ```
 */
export async function getTimePickerValue(page: DatePage, controlId: string): Promise<string> {
  return getControlStringValue(page, controlId);
}
