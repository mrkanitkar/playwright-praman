/**
 * @license
 * Copyright (c) ZesTest 2025-2030. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0
 *
 * This file may contain AI-assisted code.
 * See LICENSE and NOTICE files for details.
 */

/**
 * Tests for `src/cli/init.ts` — project initializer command.
 *
 * @remarks
 * Mocks all CLI dependencies (logger, version, validator, ide-detector,
 * scaffolder) to verify that `runInit` orchestrates banner, validation,
 * IDE detection, scaffolding, and next steps output correctly.
 *
 * @module cli/init
 */

import process from 'node:process';

import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { IDEDetection } from '../../../src/cli/ide-detector.js';
import type { ScaffoldResult } from '../../../src/cli/scaffolder.js';
import type { CheckResult, ValidationReport } from '../../../src/cli/validator.js';

// ── Mocks ───────────────────────────────────────────────────────────────────

vi.mock('../../../src/cli/logger.js', () => ({
  logBanner: vi.fn(),
  logStep: vi.fn(),
  logSection: vi.fn(),
  logSuccess: vi.fn(),
  logWarn: vi.fn(),
  logError: vi.fn(),
}));

vi.mock('../../../src/cli/version.js', () => ({
  getVersion: vi.fn(() => '1.0.0'),
}));

vi.mock('../../../src/cli/validator.js', () => ({
  validate: vi.fn(),
}));

vi.mock('../../../src/cli/ide-detector.js', () => ({
  detectIDEs: vi.fn(),
  getIDELabels: vi.fn(),
}));

vi.mock('../../../src/cli/scaffolder.js', () => ({
  scaffoldProject: vi.fn(),
}));

const { logBanner, logStep, logSection, logSuccess, logWarn, logError } =
  await import('../../../src/cli/logger.js');
const { getVersion } = await import('../../../src/cli/version.js');
const { validate } = await import('../../../src/cli/validator.js');
const { detectIDEs, getIDELabels } = await import('../../../src/cli/ide-detector.js');
const { scaffoldProject } = await import('../../../src/cli/scaffolder.js');

const mockedLogBanner = vi.mocked(logBanner);
const mockedLogStep = vi.mocked(logStep);
const mockedLogSection = vi.mocked(logSection);
const mockedLogSuccess = vi.mocked(logSuccess);
const mockedLogWarn = vi.mocked(logWarn);
const mockedLogError = vi.mocked(logError);
const mockedGetVersion = vi.mocked(getVersion);
const mockedValidate = vi.mocked(validate);
const mockedDetectIDEs = vi.mocked(detectIDEs);
const mockedGetIDELabels = vi.mocked(getIDELabels);
const mockedScaffoldProject = vi.mocked(scaffoldProject);

// ── Helpers ─────────────────────────────────────────────────────────────────

function makeDetection(overrides: Partial<IDEDetection> = {}): IDEDetection {
  return {
    vscode: false,
    claude: false,
    cursor: false,
    opencode: false,
    jules: false,
    copilot: false,
    ...overrides,
  };
}

function makeReport(checks: readonly CheckResult[]): ValidationReport {
  return {
    checks,
    passed: checks.filter((c) => c.status === 'pass').length,
    failed: checks.filter((c) => c.status === 'fail').length,
    warnings: checks.filter((c) => c.status === 'warn').length,
  };
}

function makeSuccessResult(files: readonly string[] = []): ScaffoldResult {
  return { success: true, filesCreated: files };
}

function makeFailureResult(reason: string): ScaffoldResult {
  return { success: false, reason };
}

/** Sets up default mocks for a happy-path scenario. */
function setupHappyPath(): void {
  mockedGetVersion.mockReturnValue('1.0.0');
  mockedValidate.mockReturnValue(
    makeReport([
      { name: 'Node.js version', status: 'pass', message: 'v20.11.0' },
      { name: 'npm available', status: 'pass', message: 'v10.5.0' },
    ]),
  );
  mockedDetectIDEs.mockReturnValue(makeDetection({ vscode: true }));
  mockedGetIDELabels.mockReturnValue(['VS Code']);
  mockedScaffoldProject.mockResolvedValue(
    makeSuccessResult(['playwright.config.ts', 'praman.config.ts']),
  );
}

// ── Lazy import ─────────────────────────────────────────────────────────────

async function loadInit(): Promise<{
  runInit: (args: readonly string[]) => Promise<void>;
  parseInitArgs: (argv: readonly string[]) => {
    readonly targetDir: string;
    readonly force: boolean;
    readonly skipInstall: boolean;
  };
}> {
  return import('../../../src/cli/init.js');
}

// ── Tests ───────────────────────────────────────────────────────────────────

describe('cli/init', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    setupHappyPath();
  });

  // ── parseInitArgs ───────────────────────────────────────────────────────

  describe('parseInitArgs', () => {
    it('returns default values when no arguments are provided', async () => {
      const { parseInitArgs } = await loadInit();
      const result = parseInitArgs([]);

      expect(result).toStrictEqual({
        targetDir: process.cwd(),
        force: false,
        skipInstall: false,
      });
    });

    it('parses --force flag', async () => {
      const { parseInitArgs } = await loadInit();
      const result = parseInitArgs(['--force']);

      expect(result.force).toBe(true);
    });

    it('parses --skip-install flag', async () => {
      const { parseInitArgs } = await loadInit();
      const result = parseInitArgs(['--skip-install']);

      expect(result.skipInstall).toBe(true);
    });

    it('parses --target with a directory value', async () => {
      const { parseInitArgs } = await loadInit();
      const result = parseInitArgs(['--target', '/home/testuser/my-project']);

      expect(result.targetDir).toBe('/home/testuser/my-project');
    });

    it('ignores --target when no value follows', async () => {
      const { parseInitArgs } = await loadInit();
      const result = parseInitArgs(['--target']);

      expect(result.targetDir).toBe(process.cwd());
    });

    it('ignores --target when value starts with --', async () => {
      const { parseInitArgs } = await loadInit();
      const result = parseInitArgs(['--target', '--force']);

      expect(result.targetDir).toBe(process.cwd());
      expect(result.force).toBe(true);
    });

    it('parses all flags together', async () => {
      const { parseInitArgs } = await loadInit();
      const result = parseInitArgs([
        '--force',
        '--skip-install',
        '--target',
        '/home/testuser/test-project',
      ]);

      expect(result).toStrictEqual({
        targetDir: '/home/testuser/test-project',
        force: true,
        skipInstall: true,
      });
    });

    it('handles flags in any order', async () => {
      const { parseInitArgs } = await loadInit();
      const result = parseInitArgs([
        '--target',
        '/home/testuser/test-project',
        '--skip-install',
        '--force',
      ]);

      expect(result).toStrictEqual({
        targetDir: '/home/testuser/test-project',
        force: true,
        skipInstall: true,
      });
    });
  });

  // ── runInit: banner ──────────────────────────────────────────────────────

  describe('banner', () => {
    it('calls logBanner with Praman Init title and version', async () => {
      const { runInit } = await loadInit();
      await runInit([]);

      expect(mockedLogBanner).toHaveBeenCalledOnce();
      expect(mockedLogBanner).toHaveBeenCalledWith('Praman Init', '1.0.0');
    });

    it('uses the version returned by getVersion', async () => {
      mockedGetVersion.mockReturnValue('2.5.0');

      const { runInit } = await loadInit();
      await runInit([]);

      expect(mockedLogBanner).toHaveBeenCalledWith('Praman Init', '2.5.0');
    });
  });

  // ── runInit: validation ───────────────────────────────────────────────────

  describe('validation', () => {
    it('calls validate to run environment checks', async () => {
      const { runInit } = await loadInit();
      await runInit([]);

      expect(mockedValidate).toHaveBeenCalledOnce();
    });

    it('displays logStep for validation step', async () => {
      const { runInit } = await loadInit();
      await runInit([]);

      expect(mockedLogStep).toHaveBeenCalledWith(1, 4, 'Validating environment');
    });

    it('shows logSuccess for passing checks', async () => {
      mockedValidate.mockReturnValue(
        makeReport([{ name: 'Node.js version', status: 'pass', message: 'v20.11.0' }]),
      );

      const { runInit } = await loadInit();
      await runInit([]);

      expect(mockedLogSuccess).toHaveBeenCalledWith('Node.js version: v20.11.0');
    });

    it('shows logWarn for warning checks', async () => {
      mockedValidate.mockReturnValue(
        makeReport([
          { name: 'Node.js version', status: 'pass', message: 'v20.11.0' },
          { name: 'npm available', status: 'pass', message: 'v10.5.0' },
          { name: 'SAP_CLOUD_BASE_URL', status: 'warn', message: 'not set' },
        ]),
      );

      const { runInit } = await loadInit();
      await runInit([]);

      expect(mockedLogWarn).toHaveBeenCalledWith('SAP_CLOUD_BASE_URL: not set');
    });

    it('shows logError for failing checks', async () => {
      mockedValidate.mockReturnValue(
        makeReport([
          { name: 'Node.js version', status: 'pass', message: 'v20.11.0' },
          { name: 'npm available', status: 'pass', message: 'v10.5.0' },
          { name: '@playwright/test', status: 'fail', message: 'not installed' },
        ]),
      );

      const { runInit } = await loadInit();
      await runInit([]);

      expect(mockedLogError).toHaveBeenCalledWith('@playwright/test: not installed');
    });

    it('exits early when Node.js version check fails', async () => {
      mockedValidate.mockReturnValue(
        makeReport([
          { name: 'Node.js version', status: 'fail', message: 'v16.0.0 (requires >=20)' },
          { name: 'npm available', status: 'pass', message: 'v10.5.0' },
        ]),
      );

      const { runInit } = await loadInit();
      await runInit([]);

      expect(mockedLogError).toHaveBeenCalledWith(
        'Critical environment check failed. Cannot continue.',
      );
      expect(mockedScaffoldProject).not.toHaveBeenCalled();
    });

    it('exits early when npm check fails', async () => {
      mockedValidate.mockReturnValue(
        makeReport([
          { name: 'Node.js version', status: 'pass', message: 'v20.11.0' },
          { name: 'npm available', status: 'fail', message: 'npm not found' },
        ]),
      );

      const { runInit } = await loadInit();
      await runInit([]);

      expect(mockedLogError).toHaveBeenCalledWith(
        'Critical environment check failed. Cannot continue.',
      );
      expect(mockedScaffoldProject).not.toHaveBeenCalled();
    });

    it('continues when non-critical checks fail', async () => {
      mockedValidate.mockReturnValue(
        makeReport([
          { name: 'Node.js version', status: 'pass', message: 'v20.11.0' },
          { name: 'npm available', status: 'pass', message: 'v10.5.0' },
          { name: '@playwright/test', status: 'fail', message: 'not installed' },
        ]),
      );

      const { runInit } = await loadInit();
      await runInit([]);

      expect(mockedScaffoldProject).toHaveBeenCalledOnce();
    });
  });

  // ── runInit: IDE detection ─────────────────────────────────────────────────

  describe('IDE detection', () => {
    it('calls detectIDEs with targetDir', async () => {
      const { runInit } = await loadInit();
      await runInit(['--target', '/home/testuser/test-dir']);

      expect(mockedDetectIDEs).toHaveBeenCalledWith('/home/testuser/test-dir');
    });

    it('displays logStep for IDE detection step', async () => {
      const { runInit } = await loadInit();
      await runInit([]);

      expect(mockedLogStep).toHaveBeenCalledWith(2, 4, 'Detecting IDEs');
    });

    it('shows detected IDEs via logSuccess', async () => {
      mockedDetectIDEs.mockReturnValue(makeDetection({ vscode: true, claude: true }));
      mockedGetIDELabels.mockReturnValue(['VS Code', 'Claude Code']);

      const { runInit } = await loadInit();
      await runInit([]);

      expect(mockedLogSuccess).toHaveBeenCalledWith('Detected: VS Code');
      expect(mockedLogSuccess).toHaveBeenCalledWith('Detected: Claude Code');
    });

    it('shows warning when no IDEs are detected', async () => {
      mockedDetectIDEs.mockReturnValue(makeDetection());
      mockedGetIDELabels.mockReturnValue([]);

      const { runInit } = await loadInit();
      await runInit([]);

      expect(mockedLogWarn).toHaveBeenCalledWith('No IDEs detected');
    });
  });

  // ── runInit: scaffolding ──────────────────────────────────────────────────

  describe('scaffolding', () => {
    it('calls scaffoldProject with targetDir, force, and detection', async () => {
      const { runInit } = await loadInit();
      await runInit(['--force', '--target', '/home/testuser/scaffold-test']);

      expect(mockedScaffoldProject).toHaveBeenCalledWith(
        expect.objectContaining({
          targetDir: '/home/testuser/scaffold-test',
          force: true,
        }),
      );
    });

    it('displays logStep for scaffolding step', async () => {
      const { runInit } = await loadInit();
      await runInit([]);

      expect(mockedLogStep).toHaveBeenCalledWith(3, 4, 'Scaffolding project');
    });

    it('shows created files on success', async () => {
      mockedScaffoldProject.mockResolvedValue(
        makeSuccessResult(['playwright.config.ts', 'praman.config.ts']),
      );

      const { runInit } = await loadInit();
      await runInit([]);

      expect(mockedLogSuccess).toHaveBeenCalledWith('Created: playwright.config.ts');
      expect(mockedLogSuccess).toHaveBeenCalledWith('Created: praman.config.ts');
    });

    it('shows error and exits early on scaffold failure', async () => {
      mockedScaffoldProject.mockResolvedValue(makeFailureResult('directory-exists'));

      const { runInit } = await loadInit();
      await runInit([]);

      expect(mockedLogError).toHaveBeenCalledWith('Scaffold failed: directory-exists');
      // Should not reach next steps section
      expect(mockedLogSection).not.toHaveBeenCalledWith('Next Steps');
    });

    it('passes force=false by default', async () => {
      const { runInit } = await loadInit();
      await runInit([]);

      expect(mockedScaffoldProject).toHaveBeenCalledWith(
        expect.objectContaining({
          targetDir: process.cwd(),
          force: false,
        }),
      );
    });
  });

  // ── runInit: next steps ──────────────────────────────────────────────────

  describe('next steps', () => {
    it('displays logStep for done step', async () => {
      const { runInit } = await loadInit();
      await runInit([]);

      expect(mockedLogStep).toHaveBeenCalledWith(4, 4, 'Done!');
    });

    it('calls logSection with Next Steps', async () => {
      const { runInit } = await loadInit();
      await runInit([]);

      expect(mockedLogSection).toHaveBeenCalledWith('Next Steps');
    });

    it('shows npm install step by default', async () => {
      const { runInit } = await loadInit();
      await runInit([]);

      expect(mockedLogSuccess).toHaveBeenCalledWith('Run: npm install');
    });

    it('skips npm install step when --skip-install is set', async () => {
      const { runInit } = await loadInit();
      await runInit(['--skip-install']);

      // logSuccess should NOT have been called with 'Run: npm install'
      const calls = mockedLogSuccess.mock.calls.map((call) => call[0]);
      expect(calls).not.toContain('Run: npm install');
    });

    it('shows playwright install step', async () => {
      const { runInit } = await loadInit();
      await runInit([]);

      expect(mockedLogSuccess).toHaveBeenCalledWith('Run: npx playwright install');
    });

    it('shows playwright test step', async () => {
      const { runInit } = await loadInit();
      await runInit([]);

      expect(mockedLogSuccess).toHaveBeenCalledWith('Run: npx playwright test --ui');
    });
  });

  // ── runInit: step ordering ────────────────────────────────────────────────

  describe('step ordering', () => {
    it('calls steps in the expected order', async () => {
      const callOrder: string[] = [];
      mockedLogBanner.mockImplementation(() => {
        callOrder.push('banner');
      });
      mockedLogStep.mockImplementation((_step: number, _total: number, message: string) => {
        callOrder.push(`step:${message}`);
      });
      mockedLogSection.mockImplementation((title: string) => {
        callOrder.push(`section:${title}`);
      });

      const { runInit } = await loadInit();
      await runInit([]);

      expect(callOrder).toStrictEqual([
        'banner',
        'step:Validating environment',
        'step:Detecting IDEs',
        'step:Scaffolding project',
        'step:Done!',
        'section:Next Steps',
      ]);
    });
  });
});
