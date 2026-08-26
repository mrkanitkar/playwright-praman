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
import type { InitOptions } from '../../../src/cli/init.js';
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

function makeSuccessResult(
  files: readonly string[] = [],
  skipped: readonly string[] = [],
): ScaffoldResult {
  return { success: true, filesCreated: files, filesSkipped: skipped };
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

/** Safe non-tmp test path to avoid sonarjs/publicly-writable-directories. */
const TEST_DIR = '/home/testuser/test-dir';

/** Default InitOptions for tests (matches Commander defaults). */
const DEFAULT_OPTS: InitOptions = {
  targetDir: process.cwd(),
  force: false,
};

// ── Lazy import ─────────────────────────────────────────────────────────────

async function loadInit(): Promise<{
  runInit: (options: InitOptions) => Promise<void>;
}> {
  return import('../../../src/cli/init.js');
}

// ── Tests ───────────────────────────────────────────────────────────────────

describe('cli/init', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    setupHappyPath();
  });

  // ── runInit: banner ──────────────────────────────────────────────────────

  describe('banner', () => {
    it('calls logBanner with Praman Init title and version', async () => {
      const { runInit } = await loadInit();
      await runInit(DEFAULT_OPTS);

      expect(mockedLogBanner).toHaveBeenCalledOnce();
      expect(mockedLogBanner).toHaveBeenCalledWith('Praman Init', '1.0.0');
    });

    it('uses the version returned by getVersion', async () => {
      mockedGetVersion.mockReturnValue('2.5.0');

      const { runInit } = await loadInit();
      await runInit(DEFAULT_OPTS);

      expect(mockedLogBanner).toHaveBeenCalledWith('Praman Init', '2.5.0');
    });
  });

  // ── runInit: validation ───────────────────────────────────────────────────

  describe('validation', () => {
    it('calls validate to run environment checks', async () => {
      const { runInit } = await loadInit();
      await runInit(DEFAULT_OPTS);

      expect(mockedValidate).toHaveBeenCalledOnce();
    });

    it('displays logStep for validation step', async () => {
      const { runInit } = await loadInit();
      await runInit(DEFAULT_OPTS);

      expect(mockedLogStep).toHaveBeenCalledWith(1, 4, 'Validating environment');
    });

    it('shows logSuccess for passing checks', async () => {
      mockedValidate.mockReturnValue(
        makeReport([{ name: 'Node.js version', status: 'pass', message: 'v20.11.0' }]),
      );

      const { runInit } = await loadInit();
      await runInit(DEFAULT_OPTS);

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
      await runInit(DEFAULT_OPTS);

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
      await runInit(DEFAULT_OPTS);

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
      await runInit(DEFAULT_OPTS);

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
      await runInit(DEFAULT_OPTS);

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
      await runInit(DEFAULT_OPTS);

      expect(mockedScaffoldProject).toHaveBeenCalledOnce();
    });
  });

  // ── runInit: IDE detection ─────────────────────────────────────────────────

  describe('IDE detection', () => {
    it('calls detectIDEs with targetDir', async () => {
      const { runInit } = await loadInit();
      await runInit({ ...DEFAULT_OPTS, targetDir: TEST_DIR });

      expect(mockedDetectIDEs).toHaveBeenCalledWith(TEST_DIR);
    });

    it('displays logStep for IDE detection step', async () => {
      const { runInit } = await loadInit();
      await runInit(DEFAULT_OPTS);

      expect(mockedLogStep).toHaveBeenCalledWith(2, 4, 'Detecting IDEs');
    });

    it('shows detected IDEs via logSuccess', async () => {
      mockedDetectIDEs.mockReturnValue(makeDetection({ vscode: true, claude: true }));
      mockedGetIDELabels.mockReturnValue(['VS Code', 'Claude Code']);

      const { runInit } = await loadInit();
      await runInit(DEFAULT_OPTS);

      expect(mockedLogSuccess).toHaveBeenCalledWith('Detected: VS Code');
      expect(mockedLogSuccess).toHaveBeenCalledWith('Detected: Claude Code');
    });

    it('shows warning when no IDEs are detected', async () => {
      mockedDetectIDEs.mockReturnValue(makeDetection());
      mockedGetIDELabels.mockReturnValue([]);

      const { runInit } = await loadInit();
      await runInit(DEFAULT_OPTS);

      expect(mockedLogWarn).toHaveBeenCalledWith(
        'No IDEs detected — installing the default agent set',
      );
    });

    // Regression: issue #224. IDE markers cannot exist in a fresh project, so
    // detection returns nothing and the documented agent/skill files were never
    // installed. Fall back to the documented defaults instead of writing none.
    it('falls back to copilot + claude when no IDEs are detected', async () => {
      mockedDetectIDEs.mockReturnValue(makeDetection());
      mockedGetIDELabels.mockReturnValue([]);

      const { runInit } = await loadInit();
      await runInit(DEFAULT_OPTS);

      expect(mockedScaffoldProject).toHaveBeenCalledWith(
        expect.objectContaining({
          detection: expect.objectContaining({ copilot: true, claude: true }) as unknown,
        }),
      );
    });

    it('does not override a genuinely detected IDE set', async () => {
      mockedDetectIDEs.mockReturnValue(makeDetection({ cursor: true }));
      mockedGetIDELabels.mockReturnValue(['Cursor']);

      const { runInit } = await loadInit();
      await runInit(DEFAULT_OPTS);

      expect(mockedScaffoldProject).toHaveBeenCalledWith(
        expect.objectContaining({
          detection: expect.objectContaining({ cursor: true, copilot: false }) as unknown,
        }),
      );
    });
  });

  // ── runInit: scaffolding ──────────────────────────────────────────────────

  describe('scaffolding', () => {
    it('calls scaffoldProject with targetDir, force, and detection', async () => {
      const { runInit } = await loadInit();
      await runInit({ ...DEFAULT_OPTS, targetDir: '/home/testuser/scaffold-test', force: true });

      expect(mockedScaffoldProject).toHaveBeenCalledWith(
        expect.objectContaining({
          targetDir: '/home/testuser/scaffold-test',
          force: true,
        }),
      );
    });

    it('displays logStep for scaffolding step', async () => {
      const { runInit } = await loadInit();
      await runInit(DEFAULT_OPTS);

      expect(mockedLogStep).toHaveBeenCalledWith(3, 4, 'Scaffolding project');
    });

    it('shows created files on success', async () => {
      mockedScaffoldProject.mockResolvedValue(
        makeSuccessResult(['playwright.config.ts', 'praman.config.ts']),
      );

      const { runInit } = await loadInit();
      await runInit(DEFAULT_OPTS);

      expect(mockedLogSuccess).toHaveBeenCalledWith('Created: playwright.config.ts');
      expect(mockedLogSuccess).toHaveBeenCalledWith('Created: praman.config.ts');
    });

    // Regression: issue #224. A failed scaffold used to log an error, return,
    // and still exit 0. program.ts maps a thrown error to exitCode 1, so the
    // failure has to propagate.
    it('throws on scaffold failure so the process exits non-zero', async () => {
      mockedScaffoldProject.mockResolvedValue(makeFailureResult('permission-denied'));

      const { runInit } = await loadInit();

      await expect(runInit(DEFAULT_OPTS)).rejects.toThrow('Scaffold failed: permission-denied');
      // Should not reach next steps section
      expect(mockedLogSection).not.toHaveBeenCalledWith('Next Steps');
    });

    it('throws when the scaffold produced no files at all', async () => {
      mockedScaffoldProject.mockResolvedValue(makeSuccessResult([], []));

      const { runInit } = await loadInit();

      await expect(runInit(DEFAULT_OPTS)).rejects.toThrow('Scaffold produced no files');
      expect(mockedLogSection).not.toHaveBeenCalledWith('Next Steps');
    });

    it('reports skipped files rather than claiming to have created them', async () => {
      mockedScaffoldProject.mockResolvedValue(makeSuccessResult(['/p/new.ts'], ['/p/existing.ts']));

      const { runInit } = await loadInit();
      await runInit(DEFAULT_OPTS);

      expect(mockedLogSuccess).toHaveBeenCalledWith('Created: /p/new.ts');
      expect(mockedLogWarn).toHaveBeenCalledWith('Exists, left unchanged: /p/existing.ts');
      expect(mockedLogSuccess).not.toHaveBeenCalledWith('Created: /p/existing.ts');
    });

    it('passes force=false by default', async () => {
      const { runInit } = await loadInit();
      await runInit(DEFAULT_OPTS);

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
      await runInit(DEFAULT_OPTS);

      expect(mockedLogStep).toHaveBeenCalledWith(4, 4, 'Done!');
    });

    it('calls logSection with Next Steps', async () => {
      const { runInit } = await loadInit();
      await runInit(DEFAULT_OPTS);

      expect(mockedLogSection).toHaveBeenCalledWith('Next Steps');
    });

    it('shows env setup step', async () => {
      const { runInit } = await loadInit();
      await runInit(DEFAULT_OPTS);

      expect(mockedLogSuccess).toHaveBeenCalledWith(
        '1. Copy .env.example to .env and fill in SAP credentials',
      );
    });

    it('shows test run step', async () => {
      const { runInit } = await loadInit();
      await runInit(DEFAULT_OPTS);

      expect(mockedLogSuccess).toHaveBeenCalledWith(
        '2. Run tests: npx playwright test --project=chromium --headed',
      );
    });

    it('shows auth setup warning', async () => {
      const { runInit } = await loadInit();
      await runInit(DEFAULT_OPTS);

      expect(mockedLogWarn).toHaveBeenCalledWith(
        'Auth setup (tests/auth.setup.ts) runs automatically before tests',
      );
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
      await runInit(DEFAULT_OPTS);

      expect(callOrder).toStrictEqual([
        'banner',
        'step:Validating environment',
        'step:Detecting IDEs',
        'step:Scaffolding project',
        'step:Done!',
        'section:Next Steps',
        'section:GitHub Copilot Setup',
      ]);
    });
  });
});
