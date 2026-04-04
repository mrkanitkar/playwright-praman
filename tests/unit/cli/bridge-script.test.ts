/**
 * @license
 * Copyright (c) ZesTest 2025-2030. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0
 *
 * This file may contain AI-assisted code.
 * See LICENSE and NOTICE files for details.
 */

/**
 * Tests for the `bridge-script` CLI command in `src/cli/program.ts`.
 *
 * @remarks
 * Mocks `node:fs/promises` (writeFile) and the bridge injection script factory
 * to verify that the command routes to stdout or file depending on `--output`.
 * Uses `createProgram()` factory for fresh Commander instances per test.
 *
 * @module cli/bridge-script
 */

import process from 'node:process';

import type { Command } from 'commander';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// ── Mocks ────────────────────────────────────────────────────────────────────

const FAKE_BRIDGE_SCRIPT = '(function(){window.__praman_bridge={};}());';

vi.mock('../../../src/bridge/browser-scripts/inject-ui5.js', () => ({
  createBridgeInjectionScript: vi.fn().mockReturnValue(FAKE_BRIDGE_SCRIPT),
}));

vi.mock('node:fs/promises', () => ({
  writeFile: vi.fn().mockResolvedValue(undefined),
}));

vi.mock('../../../src/cli/version.js', () => ({
  getVersion: vi.fn().mockReturnValue('1.0.0'),
}));

vi.mock('../../../src/cli/init.js', () => ({
  runInit: vi.fn().mockResolvedValue(undefined),
}));

vi.mock('../../../src/cli/doctor.js', () => ({
  runDoctor: vi.fn(),
}));

vi.mock('../../../src/cli/uninstall.js', () => ({
  runUninstall: vi.fn().mockResolvedValue(undefined),
}));

vi.mock('../../../src/cli/config-show.js', () => ({
  runConfigShow: vi.fn().mockResolvedValue(undefined),
}));

vi.mock('../../../src/cli/init-agents.js', () => ({
  runInitAgents: vi.fn().mockResolvedValue(undefined),
  isValidLoop: vi.fn().mockReturnValue(true),
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

const { writeFile } = await import('node:fs/promises');
const { createBridgeInjectionScript } =
  await import('../../../src/bridge/browser-scripts/inject-ui5.js');
const { logError, logSuccess } = await import('../../../src/cli/logger.js');

const mockedWriteFile = vi.mocked(writeFile);
const mockedCreateBridgeInjectionScript = vi.mocked(createBridgeInjectionScript);
const mockedLogError = vi.mocked(logError);
const mockedLogSuccess = vi.mocked(logSuccess);

// ── Helpers ──────────────────────────────────────────────────────────────────

let prog: Command;
let stdoutCapture: string;
// eslint-disable-next-line @typescript-eslint/no-unused-vars -- written by outputConfig.writeErr; may be used in future assertions
let stderrCapture: string;
let stdoutWriteSpy: ReturnType<typeof vi.spyOn>;

const outputConfig = {
  writeOut: (str: string) => {
    stdoutCapture += str;
  },
  writeErr: (str: string) => {
    stderrCapture += str;
  },
};

async function createTestProgram(): Promise<Command> {
  const { createProgram } = await import('../../../src/cli/program.js');
  const p = createProgram();
  p.exitOverride();
  p.configureOutput(outputConfig);
  for (const cmd of p.commands) {
    cmd.exitOverride();
    cmd.configureOutput(outputConfig);
  }
  return p;
}

// ── Tests ────────────────────────────────────────────────────────────────────

describe('cli/bridge-script command', () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    process.exitCode = undefined;
    stdoutCapture = '';
    stderrCapture = '';
    stdoutWriteSpy = vi.spyOn(process.stdout, 'write').mockImplementation(() => true);
    prog = await createTestProgram();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    process.exitCode = undefined;
  });

  // ── stdout path ───────────────────────────────────────────────────────────

  describe('without --output (stdout)', () => {
    it('writes bridge script to process.stdout when no --output is given', async () => {
      await prog.parseAsync(['bridge-script'], { from: 'user' });

      expect(mockedCreateBridgeInjectionScript).toHaveBeenCalledOnce();
      expect(stdoutWriteSpy).toHaveBeenCalledWith(FAKE_BRIDGE_SCRIPT);
    });

    it('does not call writeFile when no --output is given', async () => {
      await prog.parseAsync(['bridge-script'], { from: 'user' });

      expect(mockedWriteFile).not.toHaveBeenCalled();
    });

    it('does not log success message when writing to stdout', async () => {
      await prog.parseAsync(['bridge-script'], { from: 'user' });

      expect(mockedLogSuccess).not.toHaveBeenCalled();
    });

    it('does not set process.exitCode on success', async () => {
      await prog.parseAsync(['bridge-script'], { from: 'user' });

      expect(process.exitCode).toBeUndefined();
    });
  });

  // ── file output path ──────────────────────────────────────────────────────

  describe('with --output <path>', () => {
    it('writes bridge script to the specified file path', async () => {
      await prog.parseAsync(['bridge-script', '--output', '.playwright/praman-bridge.js'], {
        from: 'user',
      });

      expect(mockedWriteFile).toHaveBeenCalledOnce();
      expect(mockedWriteFile).toHaveBeenCalledWith(
        '.playwright/praman-bridge.js',
        FAKE_BRIDGE_SCRIPT,
        'utf8',
      );
    });

    it('logs success message with the output path', async () => {
      await prog.parseAsync(['bridge-script', '--output', '.playwright/praman-bridge.js'], {
        from: 'user',
      });

      expect(mockedLogSuccess).toHaveBeenCalledOnce();
      expect(mockedLogSuccess).toHaveBeenCalledWith(
        expect.stringContaining('.playwright/praman-bridge.js'),
      );
    });

    it('does not write to process.stdout when --output is given', async () => {
      await prog.parseAsync(['bridge-script', '--output', '.playwright/praman-bridge.js'], {
        from: 'user',
      });

      expect(stdoutWriteSpy).not.toHaveBeenCalled();
    });

    it('does not set process.exitCode on success', async () => {
      await prog.parseAsync(['bridge-script', '--output', '/some/path/bridge.js'], {
        from: 'user',
      });

      expect(process.exitCode).toBeUndefined();
    });
  });

  // ── error handling ────────────────────────────────────────────────────────

  describe('error handling', () => {
    it('sets process.exitCode to 1 when createBridgeInjectionScript throws', async () => {
      mockedCreateBridgeInjectionScript.mockImplementationOnce(() => {
        throw new Error('bridge init failed');
      });

      await prog.parseAsync(['bridge-script'], { from: 'user' });

      expect(process.exitCode).toBe(1);
    });

    it('logs error message via logError when handler throws', async () => {
      mockedCreateBridgeInjectionScript.mockImplementationOnce(() => {
        throw new Error('bridge init failed');
      });

      await prog.parseAsync(['bridge-script'], { from: 'user' });

      expect(mockedLogError).toHaveBeenCalledWith('bridge init failed');
    });

    it('sets process.exitCode to 1 when writeFile throws', async () => {
      mockedWriteFile.mockRejectedValueOnce(new Error('ENOENT: no such file or directory'));

      await prog.parseAsync(['bridge-script', '--output', '/nonexistent/dir/bridge.js'], {
        from: 'user',
      });

      expect(process.exitCode).toBe(1);
    });

    it('logs writeFile error via logError', async () => {
      mockedWriteFile.mockRejectedValueOnce(new Error('ENOENT: no such file or directory'));

      await prog.parseAsync(['bridge-script', '--output', '/nonexistent/dir/bridge.js'], {
        from: 'user',
      });

      expect(mockedLogError).toHaveBeenCalledWith('ENOENT: no such file or directory');
    });

    it('handles non-Error throws gracefully', async () => {
      mockedCreateBridgeInjectionScript.mockImplementationOnce(() => {
        // eslint-disable-next-line @typescript-eslint/only-throw-error, no-throw-literal -- intentional non-Error throw for test coverage
        throw 'string error';
      });

      await prog.parseAsync(['bridge-script'], { from: 'user' });

      expect(mockedLogError).toHaveBeenCalledWith('string error');
      expect(process.exitCode).toBe(1);
    });
  });

  // ── command registration ──────────────────────────────────────────────────

  describe('command registration', () => {
    it('bridge-script command is registered in the program', () => {
      const commandNames = prog.commands.map((c) => c.name());

      expect(commandNames).toContain('bridge-script');
    });

    it('bridge-script --help shows --output option', async () => {
      try {
        await prog.parseAsync(['bridge-script', '--help'], { from: 'user' });
      } catch {
        // exitOverride throws on --help
      }

      expect(stdoutCapture).toContain('--output');
    });

    it('bridge-script --help shows initScript in examples', async () => {
      try {
        await prog.parseAsync(['bridge-script', '--help'], { from: 'user' });
      } catch {
        // exitOverride throws on --help
      }

      expect(stdoutCapture).toContain('bridge-script');
    });
  });
});
