/**
 * @license
 * Copyright (c) ZesTest 2025-2030. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0
 *
 * This file may contain AI-assisted code.
 * See LICENSE and NOTICE files for details.
 */

/**
 * Tests for `src/cli/logger.ts` — ANSI-colored CLI terminal output functions.
 *
 * @remarks
 * Spies on `console.log` and `console.error` to verify that each logger
 * function writes to the correct stream with the expected ANSI escape codes
 * and formatted content.
 *
 * @module cli/logger
 */
import type { Mock } from 'vitest';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  logBanner,
  logError,
  logSection,
  logStep,
  logSuccess,
  logTable,
  logWarn,
} from '../../../src/cli/logger.js';

// ── Types ─────────────────────────────────────────────────────────────────────

/** Typed spy for console methods that accept variadic unknown arguments. */
type ConsoleSpy = Mock<(...data: unknown[]) => void>;

// ── Helpers ──────────────────────────────────────────────────────────────────

/** Returns the string argument at a given call index of a console spy. */
function callArg(spy: ConsoleSpy, callIndex: number): string {
  return spy.mock.calls[callIndex]?.[0] as string;
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('cli/logger', () => {
  let logSpy: ConsoleSpy;
  let errorSpy: ConsoleSpy;

  beforeEach(() => {
    // eslint-disable-next-line @typescript-eslint/no-empty-function -- silences console in tests
    logSpy = vi.spyOn(console, 'log').mockImplementation(function noop() {}) as ConsoleSpy;
    // eslint-disable-next-line @typescript-eslint/no-empty-function -- silences console in tests
    errorSpy = vi.spyOn(console, 'error').mockImplementation(function noop() {}) as ConsoleSpy;
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('logStep', () => {
    it('formats a numbered progress step with brackets', () => {
      logStep(1, 5, 'Installing');

      expect(logSpy).toHaveBeenCalledOnce();
      const output = callArg(logSpy, 0);
      expect(output).toContain('[1/5]');
      expect(output).toContain('Installing');
    });

    it('includes cyan ANSI code around the step counter', () => {
      logStep(2, 3, 'Checking dependencies');

      const output = callArg(logSpy, 0);
      // Cyan = \x1b[36m, Reset = \x1b[0m
      expect(output).toContain('\x1b[36m');
      expect(output).toContain('\x1b[0m');
    });

    it('writes to console.log, not console.error', () => {
      logStep(1, 1, 'Done');

      expect(logSpy).toHaveBeenCalledOnce();
      expect(errorSpy).not.toHaveBeenCalled();
    });

    it('handles step numbers at the boundary (last step)', () => {
      logStep(5, 5, 'Finalizing');

      const output = callArg(logSpy, 0);
      expect(output).toContain('[5/5]');
      expect(output).toContain('Finalizing');
    });
  });

  describe('logSuccess', () => {
    it('writes the message to console.log', () => {
      logSuccess('All checks passed');

      expect(logSpy).toHaveBeenCalledOnce();
      expect(errorSpy).not.toHaveBeenCalled();
    });

    it('includes the green ANSI code', () => {
      logSuccess('Configuration valid');

      const output = callArg(logSpy, 0);
      // Green = \x1b[32m
      expect(output).toContain('\x1b[32m');
      expect(output).toContain('\x1b[0m');
    });

    it('contains a checkmark symbol', () => {
      logSuccess('Done');

      const output = callArg(logSpy, 0);
      expect(output).toContain('✓');
    });

    it('includes the message text', () => {
      logSuccess('Build succeeded');

      const output = callArg(logSpy, 0);
      expect(output).toContain('Build succeeded');
    });
  });

  describe('logWarn', () => {
    it('writes to console.error, not console.log', () => {
      logWarn('Optional feature unavailable');

      expect(errorSpy).toHaveBeenCalledOnce();
      expect(logSpy).not.toHaveBeenCalled();
    });

    it('includes the yellow ANSI code', () => {
      logWarn('Proceeding with defaults');

      const output = callArg(errorSpy, 0);
      // Yellow = \x1b[33m
      expect(output).toContain('\x1b[33m');
      expect(output).toContain('\x1b[0m');
    });

    it('contains a warning symbol', () => {
      logWarn('Deprecated API in use');

      const output = callArg(errorSpy, 0);
      expect(output).toContain('⚠');
    });

    it('includes the message text', () => {
      logWarn('Dependency version mismatch');

      const output = callArg(errorSpy, 0);
      expect(output).toContain('Dependency version mismatch');
    });
  });

  describe('logError', () => {
    it('writes to console.error, not console.log', () => {
      logError('Fatal configuration error');

      expect(errorSpy).toHaveBeenCalledOnce();
      expect(logSpy).not.toHaveBeenCalled();
    });

    it('includes the red ANSI code', () => {
      logError('Could not connect');

      const output = callArg(errorSpy, 0);
      // Red = \x1b[31m
      expect(output).toContain('\x1b[31m');
      expect(output).toContain('\x1b[0m');
    });

    it('contains a cross symbol', () => {
      logError('Validation failed');

      const output = callArg(errorSpy, 0);
      expect(output).toContain('✗');
    });

    it('includes the message text', () => {
      logError('File not found');

      const output = callArg(errorSpy, 0);
      expect(output).toContain('File not found');
    });
  });

  describe('logSection', () => {
    it('writes to console.log, not console.error', () => {
      logSection('Environment');

      expect(logSpy).toHaveBeenCalledOnce();
      expect(errorSpy).not.toHaveBeenCalled();
    });

    it('includes the bold ANSI code', () => {
      logSection('System Info');

      const output = callArg(logSpy, 0);
      // Bold = \x1b[1m
      expect(output).toContain('\x1b[1m');
      expect(output).toContain('\x1b[0m');
    });

    it('includes the section title', () => {
      logSection('Dependency Check');

      const output = callArg(logSpy, 0);
      expect(output).toContain('Dependency Check');
    });

    it('wraps the title in surrounding newlines', () => {
      logSection('Configuration');

      const output = callArg(logSpy, 0);
      expect(output).toMatch(/^\n/);
      expect(output).toMatch(/\n$/);
    });
  });

  describe('logTable', () => {
    it('writes one line per row via console.log', () => {
      logTable([
        ['Node', '20.0.0'],
        ['OS', 'darwin'],
      ]);

      expect(logSpy).toHaveBeenCalledTimes(2);
      expect(errorSpy).not.toHaveBeenCalled();
    });

    it('pads short keys to the length of the longest key', () => {
      logTable([
        ['Node version', '20.0.0'],
        ['OS', 'darwin'],
      ]);

      // 'OS' (2 chars) is padded to 12 chars (length of 'Node version')
      const shortKeyLine = callArg(logSpy, 1);
      expect(shortKeyLine).toContain('OS          ');
    });

    it('does not pad the longest key', () => {
      logTable([
        ['Node version', '20.0.0'],
        ['OS', 'darwin'],
      ]);

      const longestKeyLine = callArg(logSpy, 0);
      expect(longestKeyLine).toContain('Node version');
      expect(longestKeyLine).toContain('20.0.0');
    });

    it('includes both key and value in each row', () => {
      logTable([['Playwright', '1.42.0']]);

      const output = callArg(logSpy, 0);
      expect(output).toContain('Playwright');
      expect(output).toContain('1.42.0');
    });

    it('handles a single-row table without errors', () => {
      logTable([['Version', '1.0.0']]);

      expect(logSpy).toHaveBeenCalledOnce();
    });
  });

  describe('logBanner', () => {
    it('writes to console.log, not console.error', () => {
      logBanner('Praman CLI', '1.0.0');

      expect(logSpy).toHaveBeenCalledOnce();
      expect(errorSpy).not.toHaveBeenCalled();
    });

    it('includes the bold ANSI code', () => {
      logBanner('Praman CLI', '1.0.0');

      const output = callArg(logSpy, 0);
      expect(output).toContain('\x1b[1m');
    });

    it('includes the cyan ANSI code', () => {
      logBanner('Praman CLI', '1.0.0');

      const output = callArg(logSpy, 0);
      expect(output).toContain('\x1b[36m');
    });

    it('includes both the title and version', () => {
      logBanner('My Tool', '2.3.1');

      const output = callArg(logSpy, 0);
      expect(output).toContain('My Tool');
      expect(output).toContain('2.3.1');
    });

    it('wraps the banner in surrounding newlines', () => {
      logBanner('Praman CLI', '0.0.1');

      const output = callArg(logSpy, 0);
      expect(output).toMatch(/^\n/);
      expect(output).toMatch(/\n$/);
    });
  });
});
