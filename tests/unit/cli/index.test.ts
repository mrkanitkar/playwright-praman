/**
 * Tests for `src/cli/index.ts` -- CLI entry point and command routing.
 *
 * @remarks
 * Mocks all CLI subcommand modules (init, doctor, uninstall, version, logger)
 * to verify that `main()` correctly routes argv to the appropriate handler,
 * passes sliced arguments, and handles errors with `logError` + `process.exitCode`.
 *
 * @module cli/index
 */
import process from 'node:process';

import type { Mock } from 'vitest';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// ── Types ───────────────────────────────────────────────────────────────────

/** Typed spy for console methods that accept variadic unknown arguments. */
type ConsoleSpy = Mock<(...data: unknown[]) => void>;

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
  parseUninstallArgs: vi.fn().mockReturnValue({
    targetDir: TEST_DIR,
    confirm: false,
    keepConfig: false,
    keepAgents: false,
    removeBrowsers: false,
  }),
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
const { parseUninstallArgs, runUninstall } = await import('../../../src/cli/uninstall.js');
const { getVersion } = await import('../../../src/cli/version.js');
const { logError } = await import('../../../src/cli/logger.js');

const mockedRunInit = vi.mocked(runInit);
const mockedRunDoctor = vi.mocked(runDoctor);
const mockedParseUninstallArgs = vi.mocked(parseUninstallArgs);
const mockedRunUninstall = vi.mocked(runUninstall);
const mockedGetVersion = vi.mocked(getVersion);
const mockedLogError = vi.mocked(logError);

// ── Helpers ─────────────────────────────────────────────────────────────────

/** Builds an argv array that mimics `process.argv` structure. */
function makeArgv(...args: string[]): readonly string[] {
  return ['node', 'playwright-praman', ...args];
}

/** Lazily imports `main` to ensure mocks are registered before module load. */
async function loadMain(): Promise<{ main: (argv: readonly string[]) => Promise<void> }> {
  return import('../../../src/cli/index.js');
}

/** Collects all console.log output into a single string. */
function collectOutput(spy: ConsoleSpy): string {
  return spy.mock.calls.map((call) => String(call[0])).join('\n');
}

// ── Tests ───────────────────────────────────────────────────────────────────

describe('cli/index', () => {
  let consoleSpy: ConsoleSpy;

  beforeEach(() => {
    vi.clearAllMocks();
    // eslint-disable-next-line @typescript-eslint/no-empty-function -- silences console in tests
    consoleSpy = vi.spyOn(console, 'log').mockImplementation(function noop() {}) as ConsoleSpy;
    mockedGetVersion.mockReturnValue('1.0.0');
    process.exitCode = undefined;
  });

  afterEach(() => {
    vi.restoreAllMocks();
    process.exitCode = undefined;
  });

  describe('init command', () => {
    it('routes "init" to runInit with empty args when none provided', async () => {
      const { main } = await loadMain();
      await main(makeArgv('init'));

      expect(mockedRunInit).toHaveBeenCalledOnce();
      expect(mockedRunInit).toHaveBeenCalledWith([]);
    });

    it('passes sliced args (argv[3..]) to runInit', async () => {
      const { main } = await loadMain();
      await main(makeArgv('init', '--force', '--target', TEST_DIR));

      expect(mockedRunInit).toHaveBeenCalledWith(['--force', '--target', TEST_DIR]);
    });
  });

  describe('doctor command', () => {
    it('routes "doctor" to runDoctor with no arguments', async () => {
      const { main } = await loadMain();
      await main(makeArgv('doctor'));

      expect(mockedRunDoctor).toHaveBeenCalledOnce();
      expect(mockedRunDoctor).toHaveBeenCalledWith();
    });
  });

  describe('uninstall command', () => {
    it('routes "uninstall" to parseUninstallArgs and runUninstall', async () => {
      const { main } = await loadMain();
      await main(makeArgv('uninstall'));

      expect(mockedParseUninstallArgs).toHaveBeenCalledOnce();
      expect(mockedRunUninstall).toHaveBeenCalledOnce();
    });

    it('passes sliced args (argv[3..]) to parseUninstallArgs', async () => {
      const { main } = await loadMain();
      await main(makeArgv('uninstall', '--confirm', '--keep-config'));

      expect(mockedParseUninstallArgs).toHaveBeenCalledWith(['--confirm', '--keep-config']);
    });

    it('passes parsed options from parseUninstallArgs to runUninstall', async () => {
      const mockOptions = {
        targetDir: '/custom/path',
        confirm: true,
        keepConfig: true,
        keepAgents: false,
        removeBrowsers: false,
      };
      mockedParseUninstallArgs.mockReturnValue(mockOptions);

      const { main } = await loadMain();
      await main(makeArgv('uninstall', '--confirm', '--keep-config'));

      expect(mockedRunUninstall).toHaveBeenCalledWith(mockOptions);
    });
  });

  describe('--help and -h flags', () => {
    it('prints usage info with all commands for --help', async () => {
      const { main } = await loadMain();
      await main(makeArgv('--help'));

      const output = collectOutput(consoleSpy);
      expect(output).toContain('Usage:');
      expect(output).toContain('playwright-praman');
      expect(output).toContain('init');
      expect(output).toContain('doctor');
      expect(output).toContain('uninstall');
    });

    it('prints help text for -h shorthand', async () => {
      const { main } = await loadMain();
      await main(makeArgv('-h'));

      const output = collectOutput(consoleSpy);
      expect(output).toContain('Commands:');
    });
  });

  describe('--version and -v flags', () => {
    it('prints version from getVersion for --version', async () => {
      const { main } = await loadMain();
      await main(makeArgv('--version'));

      expect(mockedGetVersion).toHaveBeenCalledOnce();
      expect(consoleSpy).toHaveBeenCalledWith('1.0.0');
    });

    it('prints version for -v shorthand', async () => {
      const { main } = await loadMain();
      await main(makeArgv('-v'));

      expect(consoleSpy).toHaveBeenCalledWith('1.0.0');
    });

    it('reflects dynamic version value from getVersion', async () => {
      mockedGetVersion.mockReturnValue('2.5.0');

      const { main } = await loadMain();
      await main(makeArgv('--version'));

      expect(consoleSpy).toHaveBeenCalledWith('2.5.0');
    });
  });

  describe('default / unknown command', () => {
    it('prints help for unknown commands', async () => {
      const { main } = await loadMain();
      await main(makeArgv('foobar'));

      expect(collectOutput(consoleSpy)).toContain('Usage:');
    });

    it('prints help when no command is provided', async () => {
      const { main } = await loadMain();
      await main(makeArgv());

      expect(collectOutput(consoleSpy)).toContain('Usage:');
    });
  });

  describe('error handling', () => {
    it('catches Error and logs message via logError', async () => {
      mockedRunInit.mockRejectedValueOnce(new Error('init failed'));

      const { main } = await loadMain();
      await main(makeArgv('init'));

      expect(mockedLogError).toHaveBeenCalledWith('init failed');
    });

    it('catches non-Error and converts to string via logError', async () => {
      mockedRunInit.mockRejectedValueOnce('string error');

      const { main } = await loadMain();
      await main(makeArgv('init'));

      expect(mockedLogError).toHaveBeenCalledWith('string error');
    });

    it('sets process.exitCode to 1 on error', async () => {
      mockedRunUninstall.mockRejectedValueOnce(new Error('uninstall failed'));

      const { main } = await loadMain();
      await main(makeArgv('uninstall'));

      expect(process.exitCode).toBe(1);
    });

    it('does not set process.exitCode on success', async () => {
      const { main } = await loadMain();
      await main(makeArgv('doctor'));

      expect(process.exitCode).toBeUndefined();
    });
  });

  describe('subcommand isolation', () => {
    it('init does not invoke doctor or uninstall', async () => {
      const { main } = await loadMain();
      await main(makeArgv('init'));

      expect(mockedRunInit).toHaveBeenCalledOnce();
      expect(mockedRunDoctor).not.toHaveBeenCalled();
      expect(mockedRunUninstall).not.toHaveBeenCalled();
    });

    it('doctor does not invoke init or uninstall', async () => {
      const { main } = await loadMain();
      await main(makeArgv('doctor'));

      expect(mockedRunDoctor).toHaveBeenCalledOnce();
      expect(mockedRunInit).not.toHaveBeenCalled();
      expect(mockedRunUninstall).not.toHaveBeenCalled();
    });

    it('uninstall does not invoke init or doctor', async () => {
      const { main } = await loadMain();
      await main(makeArgv('uninstall'));

      expect(mockedRunUninstall).toHaveBeenCalledOnce();
      expect(mockedRunInit).not.toHaveBeenCalled();
      expect(mockedRunDoctor).not.toHaveBeenCalled();
    });
  });
});
