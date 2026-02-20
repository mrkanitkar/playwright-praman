/**
 * Tests for `src/cli/doctor.ts` — diagnostic doctor command.
 *
 * @remarks
 * Mocks all CLI dependencies (logger, version, validator, ide-detector)
 * to verify that `runDoctor` orchestrates banner, environment table,
 * IDE detection, pre-flight checks, and summary output correctly.
 *
 * @module cli/doctor
 */

import process from 'node:process';

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import type { IDEDetection } from '../../../src/cli/ide-detector.js';
import type { ValidationReport } from '../../../src/cli/validator.js';

// ── Mocks ───────────────────────────────────────────────────────────────────

vi.mock('../../../src/cli/logger.js', () => ({
  logBanner: vi.fn(),
  logSection: vi.fn(),
  logTable: vi.fn(),
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

const { logBanner, logSection, logTable, logSuccess, logWarn, logError } =
  await import('../../../src/cli/logger.js');
const { getVersion } = await import('../../../src/cli/version.js');
const { validate } = await import('../../../src/cli/validator.js');
const { detectIDEs, getIDELabels } = await import('../../../src/cli/ide-detector.js');

const mockedLogBanner = vi.mocked(logBanner);
const mockedLogSection = vi.mocked(logSection);
const mockedLogTable = vi.mocked(logTable);
const mockedLogSuccess = vi.mocked(logSuccess);
const mockedLogWarn = vi.mocked(logWarn);
const mockedLogError = vi.mocked(logError);
const mockedGetVersion = vi.mocked(getVersion);
const mockedValidate = vi.mocked(validate);
const mockedDetectIDEs = vi.mocked(detectIDEs);
const mockedGetIDELabels = vi.mocked(getIDELabels);

// ── Helpers ─────────────────────────────────────────────────────────────────

function makeDetection(overrides: Partial<IDEDetection> = {}): IDEDetection {
  return {
    vscode: false,
    claude: false,
    cursor: false,
    opencode: false,
    jules: false,
    ...overrides,
  };
}

function makeReport(checks: ValidationReport['checks']): ValidationReport {
  return {
    checks,
    passed: checks.filter((c) => c.status === 'pass').length,
    failed: checks.filter((c) => c.status === 'fail').length,
    warnings: checks.filter((c) => c.status === 'warn').length,
  };
}

// ── Tests ───────────────────────────────────────────────────────────────────

describe('cli/doctor', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    mockedGetVersion.mockReturnValue('1.0.0');
    mockedDetectIDEs.mockReturnValue(makeDetection());
    mockedGetIDELabels.mockReturnValue([]);
    mockedValidate.mockReturnValue(makeReport([]));
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  // We lazily import runDoctor to ensure mocks are in place.
  async function loadDoctor(): Promise<{ runDoctor: () => void }> {
    return import('../../../src/cli/doctor.js');
  }

  describe('banner', () => {
    it('calls logBanner with Praman Doctor title and version', async () => {
      const { runDoctor } = await loadDoctor();
      runDoctor();

      expect(mockedLogBanner).toHaveBeenCalledOnce();
      expect(mockedLogBanner).toHaveBeenCalledWith('Praman Doctor', '1.0.0');
    });

    it('uses the version returned by getVersion', async () => {
      mockedGetVersion.mockReturnValue('2.5.0');

      const { runDoctor } = await loadDoctor();
      runDoctor();

      expect(mockedLogBanner).toHaveBeenCalledWith('Praman Doctor', '2.5.0');
    });
  });

  describe('environment section', () => {
    it('calls logSection with Environment', async () => {
      const { runDoctor } = await loadDoctor();
      runDoctor();

      expect(mockedLogSection).toHaveBeenCalledWith('Environment');
    });

    it('displays environment table with Node.js version, platform, and Praman version', async () => {
      const { runDoctor } = await loadDoctor();
      runDoctor();

      expect(mockedLogTable).toHaveBeenCalledWith(
        expect.arrayContaining([
          ['Node.js', process.versions.node],
          ['Platform', process.platform],
          ['Praman', '1.0.0'],
        ]),
      );
    });
  });

  describe('IDE detection section', () => {
    it('calls logSection with IDE Detection', async () => {
      const { runDoctor } = await loadDoctor();
      runDoctor();

      expect(mockedLogSection).toHaveBeenCalledWith('IDE Detection');
    });

    it('calls detectIDEs with process.cwd()', async () => {
      const { runDoctor } = await loadDoctor();
      runDoctor();

      expect(mockedDetectIDEs).toHaveBeenCalledWith(process.cwd());
    });

    it('shows detected IDEs via logSuccess when IDEs are found', async () => {
      mockedDetectIDEs.mockReturnValue(makeDetection({ vscode: true, claude: true }));
      mockedGetIDELabels.mockReturnValue(['VS Code', 'Claude Code']);

      const { runDoctor } = await loadDoctor();
      runDoctor();

      expect(mockedLogSuccess).toHaveBeenCalledWith(expect.stringContaining('VS Code'));
      expect(mockedLogSuccess).toHaveBeenCalledWith(expect.stringContaining('Claude Code'));
    });

    it('shows warning when no IDEs are detected', async () => {
      mockedDetectIDEs.mockReturnValue(makeDetection());
      mockedGetIDELabels.mockReturnValue([]);

      const { runDoctor } = await loadDoctor();
      runDoctor();

      expect(mockedLogWarn).toHaveBeenCalledWith(expect.stringContaining('No IDE'));
    });
  });

  describe('pre-flight checks section', () => {
    it('calls logSection with Pre-flight Checks', async () => {
      const { runDoctor } = await loadDoctor();
      runDoctor();

      expect(mockedLogSection).toHaveBeenCalledWith('Pre-flight Checks');
    });

    it('calls validate to run pre-flight checks', async () => {
      const { runDoctor } = await loadDoctor();
      runDoctor();

      expect(mockedValidate).toHaveBeenCalledOnce();
    });

    it('shows logSuccess for checks with pass status', async () => {
      mockedValidate.mockReturnValue(
        makeReport([{ name: 'Node.js version', status: 'pass', message: 'v20.11.0' }]),
      );

      const { runDoctor } = await loadDoctor();
      runDoctor();

      expect(mockedLogSuccess).toHaveBeenCalledWith('Node.js version: v20.11.0');
    });

    it('shows logWarn for checks with warn status', async () => {
      mockedValidate.mockReturnValue(
        makeReport([{ name: 'SAP_CLOUD_BASE_URL', status: 'warn', message: 'not set' }]),
      );

      const { runDoctor } = await loadDoctor();
      runDoctor();

      expect(mockedLogWarn).toHaveBeenCalledWith('SAP_CLOUD_BASE_URL: not set');
    });

    it('shows logError for checks with fail status', async () => {
      mockedValidate.mockReturnValue(
        makeReport([
          { name: 'Node.js version', status: 'fail', message: 'v16.0.0 (requires >=20)' },
        ]),
      );

      const { runDoctor } = await loadDoctor();
      runDoctor();

      expect(mockedLogError).toHaveBeenCalledWith('Node.js version: v16.0.0 (requires >=20)');
    });

    it('handles mixed pass/warn/fail checks', async () => {
      mockedValidate.mockReturnValue(
        makeReport([
          { name: 'Node.js version', status: 'pass', message: 'v20.11.0' },
          { name: 'SAP_CLOUD_BASE_URL', status: 'warn', message: 'not set' },
          { name: '@playwright/test', status: 'fail', message: 'not installed' },
        ]),
      );

      const { runDoctor } = await loadDoctor();
      runDoctor();

      expect(mockedLogSuccess).toHaveBeenCalledWith('Node.js version: v20.11.0');
      expect(mockedLogWarn).toHaveBeenCalledWith('SAP_CLOUD_BASE_URL: not set');
      expect(mockedLogError).toHaveBeenCalledWith('@playwright/test: not installed');
    });
  });

  describe('summary section', () => {
    it('calls logSection with Summary', async () => {
      const { runDoctor } = await loadDoctor();
      runDoctor();

      expect(mockedLogSection).toHaveBeenCalledWith('Summary');
    });

    it('shows all-pass summary when every check passes', async () => {
      mockedValidate.mockReturnValue(
        makeReport([
          { name: 'Node.js version', status: 'pass', message: 'v20.11.0' },
          { name: 'npm available', status: 'pass', message: 'v10.5.0' },
        ]),
      );

      const { runDoctor } = await loadDoctor();
      runDoctor();

      expect(mockedLogSuccess).toHaveBeenCalledWith(expect.stringContaining('2 passed'));
    });

    it('includes failure and warning counts in summary', async () => {
      mockedValidate.mockReturnValue(
        makeReport([
          { name: 'Node.js version', status: 'pass', message: 'v20.11.0' },
          { name: 'SAP_CLOUD_BASE_URL', status: 'warn', message: 'not set' },
          { name: '@playwright/test', status: 'fail', message: 'not installed' },
        ]),
      );

      const { runDoctor } = await loadDoctor();
      runDoctor();

      // Summary should mention 1 passed, 1 failed, 1 warning
      expect(mockedLogSuccess).toHaveBeenCalledWith(expect.stringContaining('1 passed'));
      expect(mockedLogWarn).toHaveBeenCalledWith(expect.stringContaining('1 warning'));
      expect(mockedLogError).toHaveBeenCalledWith(expect.stringContaining('1 failed'));
    });
  });

  describe('section ordering', () => {
    it('calls sections in the expected order', async () => {
      const callOrder: string[] = [];
      mockedLogBanner.mockImplementation(() => {
        callOrder.push('banner');
      });
      mockedLogSection.mockImplementation((title: string) => {
        callOrder.push(title);
      });

      const { runDoctor } = await loadDoctor();
      runDoctor();

      expect(callOrder).toEqual([
        'banner',
        'Environment',
        'IDE Detection',
        'Pre-flight Checks',
        'Summary',
      ]);
    });
  });
});
