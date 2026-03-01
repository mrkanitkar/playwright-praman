/**
 * @license
 * Copyright (c) ZesTest 2025-2030. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0
 *
 * This file may contain AI-assisted code.
 * See LICENSE and NOTICE files for details.
 */

/**
 * Tests for `src/cli/program.ts` — Commander.js program definition.
 *
 * @remarks
 * Mocks all CLI subcommand modules (init, doctor, uninstall, version, logger)
 * to verify that the Commander program correctly routes commands to handlers,
 * passes parsed options, and handles errors with `logError` + `process.exitCode`.
 *
 * Uses `createProgram()` factory per test with `exitOverride()` and
 * `configureOutput()` for test isolation.
 *
 * @module cli/program
 */

import process from 'node:process';

import type { Command, CommanderError } from 'commander';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// ── Mocks ───────────────────────────────────────────────────────────────────

/** Safe non-tmp test path to avoid sonarjs/publicly-writable-directories. */
const TEST_DIR = '/home/testuser/project';

vi.mock('../../../src/cli/init.js', () => ({
  runInit: vi.fn().mockResolvedValue(undefined),
}));

vi.mock('../../../src/cli/doctor.js', () => ({
  runDoctor: vi.fn(),
}));

vi.mock('../../../src/cli/uninstall.js', () => ({
  runUninstall: vi.fn().mockResolvedValue(undefined),
}));

vi.mock('../../../src/cli/version.js', () => ({
  getVersion: vi.fn().mockReturnValue('1.0.0'),
}));

vi.mock('../../../src/cli/logger.js', () => ({
  logBanner: vi.fn(),
  logError: vi.fn(),
  logStep: vi.fn(),
  logSuccess: vi.fn(),
  logWarn: vi.fn(),
  logSection: vi.fn(),
  logTable: vi.fn(),
}));

const { runInit } = await import('../../../src/cli/init.js');
const { runDoctor } = await import('../../../src/cli/doctor.js');
const { runUninstall } = await import('../../../src/cli/uninstall.js');
const { logError } = await import('../../../src/cli/logger.js');

const mockedRunInit = vi.mocked(runInit);
const mockedRunDoctor = vi.mocked(runDoctor);
const mockedRunUninstall = vi.mocked(runUninstall);
const mockedLogError = vi.mocked(logError);

// ── Helpers ─────────────────────────────────────────────────────────────────

let prog: Command;
let stdoutCapture: string;
let stderrCapture: string;

/** Output config shared by parent program and all subcommands. */
const outputConfig = {
  writeOut: (str: string) => {
    stdoutCapture += str;
  },
  writeErr: (str: string) => {
    stderrCapture += str;
  },
};

/** Creates a fresh Commander program with output capture and exit override. */
async function createTestProgram(): Promise<Command> {
  const { createProgram } = await import('../../../src/cli/program.js');
  const p = createProgram();
  p.exitOverride();
  p.configureOutput(outputConfig);
  // Commander 14 does not propagate configureOutput to subcommands
  for (const cmd of p.commands) {
    cmd.exitOverride();
    cmd.configureOutput(outputConfig);
  }
  return p;
}

// ── Tests ───────────────────────────────────────────────────────────────────

describe('cli/program (Commander.js)', () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    process.exitCode = undefined;
    stdoutCapture = '';
    stderrCapture = '';
    prog = await createTestProgram();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    process.exitCode = undefined;
  });

  // ── init command ────────────────────────────────────────────────────────

  describe('init command', () => {
    it('routes "init" to runInit with default options', async () => {
      await prog.parseAsync(['init'], { from: 'user' });

      expect(mockedRunInit).toHaveBeenCalledOnce();
      expect(mockedRunInit).toHaveBeenCalledWith(
        expect.objectContaining({
          force: false,
          skipInstall: false,
        }),
      );
    });

    it('passes --force flag to runInit as force: true', async () => {
      await prog.parseAsync(['init', '--force'], { from: 'user' });

      expect(mockedRunInit).toHaveBeenCalledWith(expect.objectContaining({ force: true }));
    });

    it('passes --skip-install flag to runInit as skipInstall: true', async () => {
      await prog.parseAsync(['init', '--skip-install'], { from: 'user' });

      expect(mockedRunInit).toHaveBeenCalledWith(expect.objectContaining({ skipInstall: true }));
    });

    it('passes --target <dir> to runInit as targetDir', async () => {
      await prog.parseAsync(['init', '--target', TEST_DIR], { from: 'user' });

      expect(mockedRunInit).toHaveBeenCalledWith(expect.objectContaining({ targetDir: TEST_DIR }));
    });

    it('passes all init options together', async () => {
      await prog.parseAsync(['init', '--force', '--skip-install', '--target', TEST_DIR], {
        from: 'user',
      });

      expect(mockedRunInit).toHaveBeenCalledWith({
        targetDir: TEST_DIR,
        force: true,
        skipInstall: true,
      });
    });

    it('uses process.cwd() as default target', async () => {
      await prog.parseAsync(['init'], { from: 'user' });

      expect(mockedRunInit).toHaveBeenCalledWith(
        expect.objectContaining({ targetDir: process.cwd() }),
      );
    });
  });

  // ── doctor command ──────────────────────────────────────────────────────

  describe('doctor command', () => {
    it('routes "doctor" to runDoctor', async () => {
      await prog.parseAsync(['doctor'], { from: 'user' });

      expect(mockedRunDoctor).toHaveBeenCalledOnce();
    });
  });

  // ── uninstall command ───────────────────────────────────────────────────

  describe('uninstall command', () => {
    it('routes "uninstall" to runUninstall with default options', async () => {
      await prog.parseAsync(['uninstall'], { from: 'user' });

      expect(mockedRunUninstall).toHaveBeenCalledOnce();
      expect(mockedRunUninstall).toHaveBeenCalledWith(
        expect.objectContaining({
          confirm: false,
          keepConfig: false,
          keepAgents: false,
          removeBrowsers: false,
        }),
      );
    });

    it('passes --confirm flag', async () => {
      await prog.parseAsync(['uninstall', '--confirm'], { from: 'user' });

      expect(mockedRunUninstall).toHaveBeenCalledWith(expect.objectContaining({ confirm: true }));
    });

    it('passes --keep-config flag', async () => {
      await prog.parseAsync(['uninstall', '--keep-config'], { from: 'user' });

      expect(mockedRunUninstall).toHaveBeenCalledWith(
        expect.objectContaining({ keepConfig: true }),
      );
    });

    it('passes --keep-agents flag', async () => {
      await prog.parseAsync(['uninstall', '--keep-agents'], { from: 'user' });

      expect(mockedRunUninstall).toHaveBeenCalledWith(
        expect.objectContaining({ keepAgents: true }),
      );
    });

    it('passes --remove-browsers flag', async () => {
      await prog.parseAsync(['uninstall', '--remove-browsers'], { from: 'user' });

      expect(mockedRunUninstall).toHaveBeenCalledWith(
        expect.objectContaining({ removeBrowsers: true }),
      );
    });

    it('passes --target <dir> to uninstall', async () => {
      await prog.parseAsync(['uninstall', '--target', TEST_DIR], { from: 'user' });

      expect(mockedRunUninstall).toHaveBeenCalledWith(
        expect.objectContaining({ targetDir: TEST_DIR }),
      );
    });

    it('passes all uninstall options together', async () => {
      await prog.parseAsync(
        [
          'uninstall',
          '--confirm',
          '--keep-config',
          '--keep-agents',
          '--remove-browsers',
          '--target',
          TEST_DIR,
        ],
        { from: 'user' },
      );

      expect(mockedRunUninstall).toHaveBeenCalledWith({
        targetDir: TEST_DIR,
        confirm: true,
        keepConfig: true,
        keepAgents: true,
        removeBrowsers: true,
      });
    });
  });

  // ── --version flag ──────────────────────────────────────────────────────

  describe('--version flag', () => {
    it('outputs version from getVersion and exits with code 0', async () => {
      try {
        await prog.parseAsync(['--version'], { from: 'user' });
      } catch (error: unknown) {
        expect((error as CommanderError).exitCode).toBe(0);
      }

      expect(stdoutCapture).toContain('1.0.0');
    });

    it('handles -v shorthand', async () => {
      try {
        await prog.parseAsync(['-v'], { from: 'user' });
      } catch {
        // exitOverride throws on --version
      }

      expect(stdoutCapture).toContain('1.0.0');
    });
  });

  // ── --help flag ───────────────────────────────────────────────────────

  describe('--help flag', () => {
    it('outputs help text with all command names', async () => {
      try {
        await prog.parseAsync(['--help'], { from: 'user' });
      } catch {
        // exitOverride throws on --help
      }

      expect(stdoutCapture).toContain('init');
      expect(stdoutCapture).toContain('doctor');
      expect(stdoutCapture).toContain('uninstall');
    });

    it('handles -h shorthand', async () => {
      try {
        await prog.parseAsync(['-h'], { from: 'user' });
      } catch {
        // exitOverride throws on -h
      }

      expect(stdoutCapture).toContain('init');
    });

    it('init --help shows init-specific options', async () => {
      try {
        await prog.parseAsync(['init', '--help'], { from: 'user' });
      } catch {
        // exitOverride throws on --help for subcommands
      }

      expect(mockedRunInit).not.toHaveBeenCalled();
      expect(stdoutCapture).toContain('--force');
      expect(stdoutCapture).toContain('--skip-install');
    });
  });

  // ── no command ──────────────────────────────────────────────────────

  describe('no command', () => {
    it('shows help when no command is provided', async () => {
      try {
        await prog.parseAsync([], { from: 'user' });
      } catch {
        // exitOverride throws on help display
      }

      // Commander writes auto-help to stderr (not stdout)
      expect(stderrCapture).toContain('init');
      expect(stderrCapture).toContain('doctor');
      expect(stderrCapture).toContain('uninstall');
    });
  });

  // ── unknown command handling ──────────────────────────────────────────

  describe('unknown command handling', () => {
    it('throws CommanderError for unknown commands', async () => {
      try {
        await prog.parseAsync(['foobar'], { from: 'user' });
        expect.fail('Should have thrown');
      } catch (error: unknown) {
        expect(error).toBeDefined();
      }

      expect(stderrCapture).toContain('foobar');
    });
  });

  // ── error handling ────────────────────────────────────────────────────

  describe('error handling', () => {
    it('catches handler errors and sets process.exitCode to 1', async () => {
      mockedRunInit.mockRejectedValueOnce(new Error('init failed'));

      await prog.parseAsync(['init'], { from: 'user' });

      expect(process.exitCode).toBe(1);
    });

    it('logs error message via logError on handler failure', async () => {
      mockedRunInit.mockRejectedValueOnce(new Error('init failed'));

      await prog.parseAsync(['init'], { from: 'user' });

      expect(mockedLogError).toHaveBeenCalledWith('init failed');
    });

    it('handles non-Error throws gracefully', async () => {
      mockedRunInit.mockRejectedValueOnce('string error');

      await prog.parseAsync(['init'], { from: 'user' });

      expect(mockedLogError).toHaveBeenCalledWith('string error');
    });

    it('does not set process.exitCode on success', async () => {
      await prog.parseAsync(['doctor'], { from: 'user' });

      expect(process.exitCode).toBeUndefined();
    });
  });

  // ── subcommand isolation ──────────────────────────────────────────────

  describe('subcommand isolation', () => {
    it('init does not invoke doctor or uninstall', async () => {
      await prog.parseAsync(['init'], { from: 'user' });

      expect(mockedRunInit).toHaveBeenCalledOnce();
      expect(mockedRunDoctor).not.toHaveBeenCalled();
      expect(mockedRunUninstall).not.toHaveBeenCalled();
    });

    it('doctor does not invoke init or uninstall', async () => {
      await prog.parseAsync(['doctor'], { from: 'user' });

      expect(mockedRunDoctor).toHaveBeenCalledOnce();
      expect(mockedRunInit).not.toHaveBeenCalled();
      expect(mockedRunUninstall).not.toHaveBeenCalled();
    });

    it('uninstall does not invoke init or doctor', async () => {
      await prog.parseAsync(['uninstall'], { from: 'user' });

      expect(mockedRunUninstall).toHaveBeenCalledOnce();
      expect(mockedRunInit).not.toHaveBeenCalled();
      expect(mockedRunDoctor).not.toHaveBeenCalled();
    });
  });
});
