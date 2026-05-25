/**
 * @license
 * Copyright (c) ZesTest 2025-2030. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0
 *
 * This file may contain AI-assisted code.
 * See LICENSE and NOTICE files for details.
 */

/**
 * Tests for `src/fixtures/flp-settings-handler.ts` -- FLPSettingsHandler class.
 *
 * @remarks
 * FLPSettingsHandler reads user settings (language, date/time/number formats,
 * timezone) from the UShell Container API via `page.evaluate()`.
 *
 * Mock strategy: vi.mock() for logger, inline vi.fn() for page.
 *
 * @module fixtures
 */

import type { Page } from '@playwright/test';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { FLPError } from '#core/errors/flp-error.js';

// ── Mock logger ────────────────────────────────────────────────────────
const mockChildLogger = {
  debug: vi.fn(),
  info: vi.fn(),
  warn: vi.fn(),
  error: vi.fn(),
};

const mockCreateLogger = vi.fn().mockReturnValue(mockChildLogger);

vi.mock('#core/logging/logger.js', () => ({
  createLogger: mockCreateLogger,
}));

// ── Import after mocks ─────────────────────────────────────────────────
const { FLPSettingsHandler } = await import('#fixtures/flp-settings-handler.js');

// ── Helpers ─────────────────────────────────────────────────────────────

type MockPage = Page & { evaluate: ReturnType<typeof vi.fn> };

function createMockPage(evaluateResult: unknown = null): MockPage {
  return {
    evaluate: vi.fn().mockResolvedValue(evaluateResult),
    on: vi.fn(),
    off: vi.fn(),
    mainFrame: vi.fn(),
  } as unknown as MockPage;
}

// ── Tests ───────────────────────────────────────────────────────────────

describe('FLPSettingsHandler', () => {
  let page: MockPage;
  let handler: InstanceType<typeof FLPSettingsHandler>;

  beforeEach(() => {
    vi.clearAllMocks();
    page = createMockPage();
    handler = new FLPSettingsHandler({ page: page });
  });

  // ═══════════════════════════════════════════════════════════════════════
  // Group 1: Constructor
  // ═══════════════════════════════════════════════════════════════════════

  describe('constructor', () => {
    it('creates handler with default timeout', () => {
      expect(mockCreateLogger).toHaveBeenCalledWith('flp-settings');
    });

    it('accepts a custom timeout option', () => {
      const customHandler = new FLPSettingsHandler({
        page: page,
        timeout: 5000,
      });
      // Handler should construct without error
      expect(customHandler).toBeDefined();
    });
  });

  // ═══════════════════════════════════════════════════════════════════════
  // Group 2: getLanguage
  // ═══════════════════════════════════════════════════════════════════════

  describe('getLanguage()', () => {
    it('returns language from evaluate result', async () => {
      page.evaluate.mockResolvedValue('EN');

      const result = await handler.getLanguage();

      expect(result).toBe('EN');
      expect(page.evaluate).toHaveBeenCalledOnce();
    });

    it('throws FLPError when Container is unavailable', async () => {
      page.evaluate.mockResolvedValue(null);

      await expect(handler.getLanguage()).rejects.toThrow(FLPError);

      try {
        await handler.getLanguage();
      } catch (error: unknown) {
        expect(error).toBeInstanceOf(FLPError);
        const flpError = error as FLPError;
        expect(flpError.code).toBe('ERR_FLP_SHELL_NOT_FOUND');
        expect(flpError.retryable).toBe(true);
        expect(flpError.suggestions.length).toBeGreaterThan(0);
        expect(flpError.flpService).toBe('UShell Container');
      }
    });

    it('wraps evaluate rejection in FLPError', async () => {
      page.evaluate.mockRejectedValue(new Error('Page crashed'));

      await expect(handler.getLanguage()).rejects.toThrow(FLPError);

      try {
        await handler.getLanguage();
      } catch (error: unknown) {
        expect(error).toBeInstanceOf(FLPError);
        const flpError = error as FLPError;
        expect(flpError.code).toBe('ERR_FLP_API_UNAVAILABLE');
        expect(flpError.message).toContain('Page crashed');
        expect(flpError.cause).toBeInstanceOf(Error);
      }
    });
  });

  // ═══════════════════════════════════════════════════════════════════════
  // Group 3: getDateFormat
  // ═══════════════════════════════════════════════════════════════════════

  describe('getDateFormat()', () => {
    it('returns date format from evaluate result', async () => {
      page.evaluate.mockResolvedValue('1');

      const result = await handler.getDateFormat();

      expect(result).toBe('1');
      expect(page.evaluate).toHaveBeenCalledOnce();
    });

    it('throws FLPError when Container is unavailable', async () => {
      page.evaluate.mockResolvedValue(null);

      await expect(handler.getDateFormat()).rejects.toThrow(FLPError);
    });
  });

  // ═══════════════════════════════════════════════════════════════════════
  // Group 4: getTimeFormat
  // ═══════════════════════════════════════════════════════════════════════

  describe('getTimeFormat()', () => {
    it('returns time format from evaluate result', async () => {
      page.evaluate.mockResolvedValue('0');

      const result = await handler.getTimeFormat();

      expect(result).toBe('0');
      expect(page.evaluate).toHaveBeenCalledOnce();
    });

    it('throws FLPError when Container is unavailable', async () => {
      page.evaluate.mockResolvedValue(null);

      await expect(handler.getTimeFormat()).rejects.toThrow(FLPError);
    });
  });

  // ═══════════════════════════════════════════════════════════════════════
  // Group 5: getTimezone
  // ═══════════════════════════════════════════════════════════════════════

  describe('getTimezone()', () => {
    it('returns timezone from evaluate result', async () => {
      page.evaluate.mockResolvedValue('Europe/Berlin');

      const result = await handler.getTimezone();

      expect(result).toBe('Europe/Berlin');
      expect(page.evaluate).toHaveBeenCalledOnce();
    });

    it('throws FLPError when Container is unavailable', async () => {
      page.evaluate.mockResolvedValue(null);

      await expect(handler.getTimezone()).rejects.toThrow(FLPError);
    });
  });

  // ═══════════════════════════════════════════════════════════════════════
  // Group 6: getNumberFormat
  // ═══════════════════════════════════════════════════════════════════════

  describe('getNumberFormat()', () => {
    it('returns number format from evaluate result', async () => {
      page.evaluate.mockResolvedValue(',');

      const result = await handler.getNumberFormat();

      expect(result).toBe(',');
      expect(page.evaluate).toHaveBeenCalledOnce();
    });

    it('throws FLPError when Container is unavailable', async () => {
      page.evaluate.mockResolvedValue(null);

      await expect(handler.getNumberFormat()).rejects.toThrow(FLPError);
    });
  });

  // ═══════════════════════════════════════════════════════════════════════
  // Group 7: getAllSettings
  // ═══════════════════════════════════════════════════════════════════════

  describe('getAllSettings()', () => {
    it('returns all settings from single evaluate call', async () => {
      const mockSettings = {
        language: 'EN',
        dateFormat: '1',
        timeFormat: '0',
        timezone: 'UTC',
        numberFormat: ',',
      };
      page.evaluate.mockResolvedValue(mockSettings);

      const result = await handler.getAllSettings();

      expect(result).toStrictEqual(mockSettings);
      expect(page.evaluate).toHaveBeenCalledOnce();
    });

    it('throws FLPError when Container is unavailable', async () => {
      page.evaluate.mockResolvedValue(null);

      await expect(handler.getAllSettings()).rejects.toThrow(FLPError);

      try {
        await handler.getAllSettings();
      } catch (error: unknown) {
        expect(error).toBeInstanceOf(FLPError);
        const flpError = error as FLPError;
        expect(flpError.code).toBe('ERR_FLP_SHELL_NOT_FOUND');
        expect(flpError.flpService).toBe('UShell Container');
        expect(flpError.suggestions.length).toBeGreaterThan(0);
      }
    });

    it('wraps evaluate rejection in FLPError with API_UNAVAILABLE code', async () => {
      page.evaluate.mockRejectedValue(new Error('Execution context was destroyed'));

      await expect(handler.getAllSettings()).rejects.toThrow(FLPError);

      try {
        await handler.getAllSettings();
      } catch (error: unknown) {
        expect(error).toBeInstanceOf(FLPError);
        const flpError = error as FLPError;
        expect(flpError.code).toBe('ERR_FLP_API_UNAVAILABLE');
        expect(flpError.message).toContain('Execution context was destroyed');
        expect(flpError.cause).toBeInstanceOf(Error);
      }
    });
  });

  // ═══════════════════════════════════════════════════════════════════════
  // Group 8: readUserSetting (private, tested via getLanguage rejection)
  // ═══════════════════════════════════════════════════════════════════════

  describe('readUserSetting() — error wrapping for non-Error throws', () => {
    it('wraps non-Error rejection without cause', async () => {
      page.evaluate.mockRejectedValue('string-error');

      try {
        await handler.getLanguage();
      } catch (error: unknown) {
        expect(error).toBeInstanceOf(FLPError);
        const flpError = error as FLPError;
        expect(flpError.code).toBe('ERR_FLP_API_UNAVAILABLE');
        expect(flpError.message).toContain('string-error');
        expect(flpError.cause).toBeUndefined();
      }
    });
  });

  describe('getAllSettings() — error wrapping for non-Error throws', () => {
    it('wraps non-Error rejection without cause', async () => {
      page.evaluate.mockRejectedValue(42);

      try {
        await handler.getAllSettings();
      } catch (error: unknown) {
        expect(error).toBeInstanceOf(FLPError);
        const flpError = error as FLPError;
        expect(flpError.code).toBe('ERR_FLP_API_UNAVAILABLE');
        expect(flpError.message).toContain('42');
        expect(flpError.cause).toBeUndefined();
      }
    });
  });

  // ═══════════════════════════════════════════════════════════════════════
  // Group 9: Logging
  // ═══════════════════════════════════════════════════════════════════════

  describe('logging', () => {
    it('creates a child logger with module name "flp-settings"', () => {
      expect(mockCreateLogger).toHaveBeenCalledWith('flp-settings');
    });

    it('logs debug message when reading individual setting', async () => {
      page.evaluate.mockResolvedValue('EN');

      await handler.getLanguage();

      expect(mockChildLogger.debug).toHaveBeenCalled();
    });

    it('logs debug message when reading all settings', async () => {
      const mockSettings = {
        language: 'EN',
        dateFormat: '1',
        timeFormat: '0',
        timezone: 'UTC',
        numberFormat: ',',
      };
      page.evaluate.mockResolvedValue(mockSettings);

      await handler.getAllSettings();

      // Called twice: once at start, once after retrieval
      expect(mockChildLogger.debug).toHaveBeenCalledTimes(2);
    });
  });

  // ═══════════════════════════════════════════════════════════════════════
  // Group 10: evaluate call arguments
  // ═══════════════════════════════════════════════════════════════════════

  describe('evaluate call arguments', () => {
    it('passes getter name as argument for individual settings', async () => {
      page.evaluate.mockResolvedValue('EN');

      await handler.getLanguage();

      // page.evaluate is called with (fn, 'getLanguage')
      const callArgs = page.evaluate.mock.calls[0] as unknown[];
      expect(callArgs[1]).toBe('getLanguage');
    });

    it('passes getDateFormat as argument for date format', async () => {
      page.evaluate.mockResolvedValue('1');

      await handler.getDateFormat();

      const callArgs = page.evaluate.mock.calls[0] as unknown[];
      expect(callArgs[1]).toBe('getDateFormat');
    });

    it('passes getTimeFormat as argument for time format', async () => {
      page.evaluate.mockResolvedValue('0');

      await handler.getTimeFormat();

      const callArgs = page.evaluate.mock.calls[0] as unknown[];
      expect(callArgs[1]).toBe('getTimeFormat');
    });

    it('passes getTimezone as argument for timezone', async () => {
      page.evaluate.mockResolvedValue('UTC');

      await handler.getTimezone();

      const callArgs = page.evaluate.mock.calls[0] as unknown[];
      expect(callArgs[1]).toBe('getTimezone');
    });

    it('passes getNumberFormat as argument for number format', async () => {
      page.evaluate.mockResolvedValue(',');

      await handler.getNumberFormat();

      const callArgs = page.evaluate.mock.calls[0] as unknown[];
      expect(callArgs[1]).toBe('getNumberFormat');
    });

    it('does not pass extra arguments for getAllSettings', async () => {
      const mockSettings = {
        language: 'EN',
        dateFormat: '1',
        timeFormat: '0',
        timezone: 'UTC',
        numberFormat: ',',
      };
      page.evaluate.mockResolvedValue(mockSettings);

      await handler.getAllSettings();

      const callArgs = page.evaluate.mock.calls[0] as unknown[];
      // getAllSettings only passes the function, no second argument
      expect(callArgs).toHaveLength(1);
    });
  });
});
