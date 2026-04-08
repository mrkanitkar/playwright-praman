/**
 * @license
 * Copyright (c) ZesTest 2025-2030. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0
 *
 * This file may contain AI-assisted code.
 * See LICENSE and NOTICE files for details.
 */

/**
 * Tests for `src/modules/date.ts` -- date/time picker value management.
 *
 * @remarks
 * Verifies date picker set/get, date range selection, time picker set/get,
 * format conversion, validation, and option handling.
 *
 * Mock strategy: minimal DatePage with evaluate method that captures scripts.
 *
 * @module modules
 */
import { afterEach, describe, expect, it, vi } from 'vitest';

import type { DatePage } from '../../../src/modules/date.js';

import { ControlError } from '#core/errors/control-error.js';

// Import module under test
const {
  DATE_FORMATS,
  setDatePickerValue,
  getDatePickerValue,
  setDateRangeSelection,
  getDateRangeSelection,
  setAndValidateDate,
  setTimePickerValue,
  getTimePickerValue,
  formatDateForUI5,
} = await import('../../../src/modules/date.js');

/**
 * Creates a mock page that returns configured responses from evaluate calls.
 *
 * @param responses - Ordered list of values to return from successive evaluate calls.
 */
function createMockPage(responses: unknown[] = []): {
  evaluate: ReturnType<typeof vi.fn>;
} {
  const evaluateFn = vi.fn<(...args: unknown[]) => Promise<unknown>>();
  for (const response of responses) {
    evaluateFn.mockResolvedValueOnce(response);
  }
  // Default fallback for any extra calls
  evaluateFn.mockResolvedValue(undefined);
  return { evaluate: evaluateFn };
}

/**
 * Casts a mock page to DatePage for type-safe function calls.
 */
function asPage(mock: ReturnType<typeof createMockPage>): DatePage {
  return mock as unknown as DatePage;
}

describe('date module', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  // ── setDatePickerValue ────────────────────────────────────────────────

  describe('setDatePickerValue', () => {
    it('sets date from a Date object', async () => {
      const page = createMockPage([
        { valueFormat: 'yyyy-MM-dd' }, // format query
        { success: true, value: '2024-01-15' }, // setValue
        undefined, // DOM settle
      ]);

      await setDatePickerValue(asPage(page), 'dp1', new Date(2024, 0, 15));

      expect(page.evaluate).toHaveBeenCalledTimes(3);
    });

    it('sets date from an ISO string', async () => {
      const page = createMockPage([
        { valueFormat: 'yyyy-MM-dd' },
        { success: true, value: '2024-06-20' },
        undefined,
      ]);

      await setDatePickerValue(asPage(page), 'dp1', '2024-06-20');

      expect(page.evaluate).toHaveBeenCalledTimes(3);
    });

    it('converts date to the control valueFormat', async () => {
      const page = createMockPage([
        { valueFormat: 'dd.MM.yyyy' }, // European format
        { success: true },
        undefined,
      ]);

      await setDatePickerValue(asPage(page), 'dp1', new Date(2024, 0, 15));

      // The second evaluate call should contain the European-formatted value
      const setCall = page.evaluate.mock.calls[1] as unknown[];
      const script = setCall[0] as string;
      expect(script).toContain('15.01.2024');
    });

    it('fires change event after setting value', async () => {
      const page = createMockPage([{ valueFormat: 'yyyy-MM-dd' }, { success: true }, undefined]);

      await setDatePickerValue(asPage(page), 'dp1', '2024-01-15');

      const setCall = page.evaluate.mock.calls[1] as unknown[];
      const script = setCall[0] as string;
      expect(script).toContain('fireChange');
      expect(script).toContain('valid: true');
    });

    it('performs stability wait by default', async () => {
      const page = createMockPage([
        { valueFormat: 'yyyy-MM-dd' },
        { success: true },
        undefined, // DOM settle call
      ]);

      await setDatePickerValue(asPage(page), 'dp1', '2024-01-15');

      // 3 calls: format query, setValue, DOM settle
      expect(page.evaluate).toHaveBeenCalledTimes(3);
      const settleCall = page.evaluate.mock.calls[2] as unknown[];
      const settleScript = settleCall[0] as string;
      expect(settleScript).toContain('setTimeout');
    });

    it('skips stability wait when skipStabilityWait is true', async () => {
      const page = createMockPage([{ valueFormat: 'yyyy-MM-dd' }, { success: true }]);

      await setDatePickerValue(asPage(page), 'dp1', '2024-01-15', { skipStabilityWait: true });

      // Only 2 calls: format query and setValue (no DOM settle)
      expect(page.evaluate).toHaveBeenCalledTimes(2);
    });

    it('throws ControlError for invalid date input', async () => {
      const page = createMockPage([]);

      await expect(setDatePickerValue(asPage(page), 'dp1', 'not-a-date')).rejects.toThrow(
        ControlError,
      );
    });

    it('throws ControlError when control is not found', async () => {
      const page = createMockPage([
        { error: 'not_found' }, // format query returns not_found
      ]);

      const error = await setDatePickerValue(asPage(page), 'dp1', '2024-01-15').catch(
        (e: unknown) => e,
      );

      expect(error).toBeInstanceOf(ControlError);
      expect((error as ControlError).code).toBe('ERR_CONTROL_NOT_FOUND');
      expect((error as ControlError).message).toContain('DatePicker control not found: dp1');
      expect((error as ControlError).retryable).toBe(true);
    });
  });

  // ── getDatePickerValue ────────────────────────────────────────────────

  describe('getDatePickerValue', () => {
    it('returns the current date value', async () => {
      const page = createMockPage(['2024-01-15']);

      const result = await getDatePickerValue(asPage(page), 'dp1');

      expect(result).toBe('2024-01-15');
    });

    it('returns empty string when control has no value', async () => {
      const page = createMockPage(['']);

      const result = await getDatePickerValue(asPage(page), 'dp1');

      expect(result).toBe('');
    });
  });

  // ── setDateRangeSelection ─────────────────────────────────────────────

  describe('setDateRangeSelection', () => {
    it('sets both start and end dates', async () => {
      const page = createMockPage([
        { success: true },
        undefined, // DOM settle
      ]);

      await setDateRangeSelection(asPage(page), 'range1', '2024-01-01', '2024-01-31');

      const setCall = page.evaluate.mock.calls[0] as unknown[];
      const script = setCall[0] as string;
      expect(script).toContain('setDateValue');
      expect(script).toContain('setSecondDateValue');
    });

    it('fires change event after setting range', async () => {
      const page = createMockPage([{ success: true }, undefined]);

      await setDateRangeSelection(asPage(page), 'range1', '2024-01-01', '2024-01-31');

      const setCall = page.evaluate.mock.calls[0] as unknown[];
      const script = setCall[0] as string;
      expect(script).toContain('fireChange');
    });

    it('throws ControlError when start date is after end date', async () => {
      const page = createMockPage([]);

      await expect(
        setDateRangeSelection(asPage(page), 'range1', '2024-01-31', '2024-01-01'),
      ).rejects.toThrow(ControlError);

      await expect(
        setDateRangeSelection(asPage(page), 'range1', '2024-01-31', '2024-01-01'),
      ).rejects.toThrow('Start date must not be after end date');
    });
  });

  // ── setTimePickerValue ────────────────────────────────────────────────

  describe('setTimePickerValue', () => {
    it('sets time value in HH:mm format', async () => {
      const page = createMockPage([
        { success: true },
        undefined, // DOM settle
      ]);

      await setTimePickerValue(asPage(page), 'tp1', '14:30');

      const setCall = page.evaluate.mock.calls[0] as unknown[];
      const script = setCall[0] as string;
      expect(script).toContain('14:30');
    });

    it('sets time value with seconds precision', async () => {
      const page = createMockPage([{ success: true }, undefined]);

      await setTimePickerValue(asPage(page), 'tp1', '14:30:45');

      const setCall = page.evaluate.mock.calls[0] as unknown[];
      const script = setCall[0] as string;
      expect(script).toContain('14:30:45');
    });

    it('fires change event after setting time', async () => {
      const page = createMockPage([{ success: true }, undefined]);

      await setTimePickerValue(asPage(page), 'tp1', '09:00');

      const setCall = page.evaluate.mock.calls[0] as unknown[];
      const script = setCall[0] as string;
      expect(script).toContain('fireChange');
      expect(script).toContain('valid: true');
    });

    it('throws ControlError for invalid time format', async () => {
      const page = createMockPage([]);

      await expect(setTimePickerValue(asPage(page), 'tp1', '25:99')).rejects.toThrow(ControlError);

      await expect(setTimePickerValue(asPage(page), 'tp1', 'invalid')).rejects.toThrow(
        ControlError,
      );
    });
  });

  // ── getTimePickerValue ────────────────────────────────────────────────

  describe('getTimePickerValue', () => {
    it('returns the current time value', async () => {
      const page = createMockPage(['14:30']);

      const result = await getTimePickerValue(asPage(page), 'tp1');

      expect(result).toBe('14:30');
    });
  });

  // ── formatDateForUI5 ─────────────────────────────────────────────────

  describe('formatDateForUI5', () => {
    it('formats date as yyyy-MM-dd (ISO)', () => {
      const result = formatDateForUI5(new Date(2024, 0, 15), 'yyyy-MM-dd');

      expect(result).toBe('2024-01-15');
    });

    it('formats date as dd.MM.yyyy (European)', () => {
      const result = formatDateForUI5(new Date(2024, 0, 15), 'dd.MM.yyyy');

      expect(result).toBe('15.01.2024');
    });

    it('formats date as MM/dd/yyyy (US)', () => {
      const result = formatDateForUI5(new Date(2024, 0, 15), 'MM/dd/yyyy');

      expect(result).toBe('01/15/2024');
    });

    it('formats date as yyyyMMdd (SAP internal)', () => {
      const result = formatDateForUI5(new Date(2024, 0, 15), 'yyyyMMdd');

      expect(result).toBe('20240115');
    });

    it('formats date as yyyy/MM/dd (Japanese)', () => {
      const result = formatDateForUI5(new Date(2024, 0, 15), 'yyyy/MM/dd');

      expect(result).toBe('2024/01/15');
    });

    it('throws ControlError for unsupported format', () => {
      expect(() => formatDateForUI5(new Date(2024, 0, 15), 'dd-MMM-yyyy')).toThrow(ControlError);
      expect(() => formatDateForUI5(new Date(2024, 0, 15), 'dd-MMM-yyyy')).toThrow(
        'Unsupported date format',
      );
    });
  });

  // ── getDateRangeSelection ─────────────────────────────────────────────

  describe('getDateRangeSelection', () => {
    it('returns both start and end date strings', async () => {
      const page = createMockPage([{ startDate: '2024-01-01', endDate: '2024-01-31' }]);

      const result = await getDateRangeSelection(asPage(page), 'range1');

      expect(result.startDate).toBe('2024-01-01');
      expect(result.endDate).toBe('2024-01-31');
    });

    it('returns empty strings when no dates are set', async () => {
      const page = createMockPage([{ startDate: '', endDate: '' }]);

      const result = await getDateRangeSelection(asPage(page), 'range1');

      expect(result.startDate).toBe('');
      expect(result.endDate).toBe('');
    });
  });

  // ── setAndValidateDate ────────────────────────────────────────────────

  describe('setAndValidateDate', () => {
    it('sets date and succeeds when value state is not Error', async () => {
      const page = createMockPage([
        { valueFormat: 'yyyy-MM-dd' }, // format query
        { success: true }, // setValue
        undefined, // DOM settle
        'None', // getValueState
      ]);

      await expect(setAndValidateDate(asPage(page), 'dp1', '2024-01-15')).resolves.toBeUndefined();
    });

    it('throws ControlError when value state is Error', async () => {
      const page = createMockPage([
        { valueFormat: 'yyyy-MM-dd' },
        { success: true },
        undefined, // DOM settle
        'Error', // getValueState returns Error
      ]);

      await expect(setAndValidateDate(asPage(page), 'dp1', '2024-01-15')).rejects.toThrow(
        ControlError,
      );

      // Re-create page mock since it was consumed
      const page2 = createMockPage([
        { valueFormat: 'yyyy-MM-dd' },
        { success: true },
        undefined,
        'Error',
      ]);

      await expect(setAndValidateDate(asPage(page2), 'dp1', '2024-01-15')).rejects.toThrow(
        'Date validation failed',
      );
    });
  });

  // ── locale/timezone options ───────────────────────────────────────────

  // ── DATE_FORMATS constants ────────────────────────────────────────────

  describe('DATE_FORMATS constants', () => {
    it('contains all expected format patterns', () => {
      expect(DATE_FORMATS.ISO).toBe('yyyy-MM-dd');
      expect(DATE_FORMATS.SAP_INTERNAL).toBe('yyyyMMdd');
      expect(DATE_FORMATS.EUROPEAN).toBe('dd.MM.yyyy');
      expect(DATE_FORMATS.US).toBe('MM/dd/yyyy');
      expect(DATE_FORMATS.JAPANESE).toBe('yyyy/MM/dd');
    });

    it('has exactly five format entries', () => {
      expect(Object.keys(DATE_FORMATS)).toHaveLength(5);
    });
  });
});
