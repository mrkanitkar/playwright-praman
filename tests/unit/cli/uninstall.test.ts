/**
 * Tests for `src/cli/uninstall.ts` — uninstall command.
 *
 * @remarks
 * Mocks `node:fs`, `node:fs/promises`, `node:child_process`, and the CLI
 * logger to verify argument parsing, file manifest filtering, dry-run and
 * confirm modes, and browser removal without touching the real filesystem.
 *
 * @module cli/uninstall
 */

import process from 'node:process';

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import type { UninstallOptions } from '../../../src/cli/uninstall.js';

// ── Mocks ───────────────────────────────────────────────────────────────────

const mockExistsSync = vi.fn().mockReturnValue(false);
vi.mock('node:fs', () => ({
  existsSync: mockExistsSync,
}));

const mockUnlink = vi.fn().mockResolvedValue(undefined);
const mockReaddir = vi.fn().mockResolvedValue([]);
const mockRmdir = vi.fn().mockResolvedValue(undefined);
vi.mock('node:fs/promises', () => ({
  unlink: mockUnlink,
  readdir: mockReaddir,
  rmdir: mockRmdir,
}));

const mockExecSync = vi.fn();
vi.mock('node:child_process', () => ({
  execSync: mockExecSync,
}));

vi.mock('../../../src/cli/logger.js', () => ({
  logStep: vi.fn(),
  logSuccess: vi.fn(),
  logWarn: vi.fn(),
  logError: vi.fn(),
  logSection: vi.fn(),
  logTable: vi.fn(),
  logBanner: vi.fn(),
}));

const { logStep, logSuccess, logWarn, logSection } = await import('../../../src/cli/logger.js');

const { parseUninstallArgs, getScaffoldedFiles, runUninstall } =
  await import('../../../src/cli/uninstall.js');

/** Safe non-tmp test path to avoid sonarjs/publicly-writable-directories. */
const TEST_DIR = '/home/testuser/project';

// ── Tests ───────────────────────────────────────────────────────────────────

describe('cli/uninstall', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockExistsSync.mockReturnValue(false);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  // ── parseUninstallArgs ──────────────────────────────────────────────────

  describe('parseUninstallArgs', () => {
    it('returns defaults when no arguments are provided', () => {
      const opts = parseUninstallArgs([]);

      expect(opts.confirm).toBe(false);
      expect(opts.keepConfig).toBe(false);
      expect(opts.keepAgents).toBe(false);
      expect(opts.removeBrowsers).toBe(false);
    });

    it('sets confirm to true with --confirm flag', () => {
      const opts = parseUninstallArgs(['--confirm']);

      expect(opts.confirm).toBe(true);
    });

    it('sets keepConfig to true with --keep-config flag', () => {
      const opts = parseUninstallArgs(['--keep-config']);

      expect(opts.keepConfig).toBe(true);
    });

    it('sets keepAgents to true with --keep-agents flag', () => {
      const opts = parseUninstallArgs(['--keep-agents']);

      expect(opts.keepAgents).toBe(true);
    });

    it('sets removeBrowsers to true with --remove-browsers flag', () => {
      const opts = parseUninstallArgs(['--remove-browsers']);

      expect(opts.removeBrowsers).toBe(true);
    });

    it('sets targetDir with --target flag', () => {
      const opts = parseUninstallArgs(['--target', TEST_DIR]);

      expect(opts.targetDir).toBe(TEST_DIR);
    });

    it('handles multiple flags combined', () => {
      const opts = parseUninstallArgs([
        '--confirm',
        '--keep-config',
        '--keep-agents',
        '--remove-browsers',
        '--target',
        TEST_DIR,
      ]);

      expect(opts.confirm).toBe(true);
      expect(opts.keepConfig).toBe(true);
      expect(opts.keepAgents).toBe(true);
      expect(opts.removeBrowsers).toBe(true);
      expect(opts.targetDir).toBe(TEST_DIR);
    });

    it('uses process.cwd() as default targetDir', () => {
      const opts = parseUninstallArgs([]);

      expect(opts.targetDir).toBe(process.cwd());
    });
  });

  // ── getScaffoldedFiles ──────────────────────────────────────────────────

  describe('getScaffoldedFiles', () => {
    const baseOptions: UninstallOptions = {
      targetDir: TEST_DIR,
      confirm: false,
      keepConfig: false,
      keepAgents: false,
      removeBrowsers: false,
    };

    it('returns entries only for files that exist on disk', () => {
      mockExistsSync.mockImplementation(
        (path: string) =>
          path === `${TEST_DIR}/playwright.config.ts` || path === `${TEST_DIR}/AGENTS.md`,
      );

      const files = getScaffoldedFiles(TEST_DIR, baseOptions);

      expect(files).toHaveLength(2);
      expect(files.map((f) => f.relativePath)).toContain('playwright.config.ts');
      expect(files.map((f) => f.relativePath)).toContain('AGENTS.md');
    });

    it('returns empty array when no scaffolded files exist', () => {
      mockExistsSync.mockReturnValue(false);

      const files = getScaffoldedFiles(TEST_DIR, baseOptions);

      expect(files).toEqual([]);
    });

    it('filters out config category when keepConfig is true', () => {
      mockExistsSync.mockReturnValue(true);

      const files = getScaffoldedFiles(TEST_DIR, {
        ...baseOptions,
        keepConfig: true,
      });

      const categories = files.map((f) => f.category);
      expect(categories).not.toContain('config');
    });

    it('filters out agent category when keepAgents is true', () => {
      mockExistsSync.mockReturnValue(true);

      const files = getScaffoldedFiles(TEST_DIR, {
        ...baseOptions,
        keepAgents: true,
      });

      const categories = files.map((f) => f.category);
      expect(categories).not.toContain('agent');
    });

    it('returns results sorted by relativePath', () => {
      mockExistsSync.mockReturnValue(true);

      const files = getScaffoldedFiles(TEST_DIR, baseOptions);
      const paths = files.map((f) => f.relativePath);
      const sorted = [...paths].sort((a, b) => a.localeCompare(b));

      expect(paths).toEqual(sorted);
    });

    it('includes all categories when no filters are applied', () => {
      mockExistsSync.mockReturnValue(true);

      const files = getScaffoldedFiles(TEST_DIR, baseOptions);
      const categories = new Set(files.map((f) => f.category));

      expect(categories.has('config')).toBe(true);
      expect(categories.has('agent')).toBe(true);
      expect(categories.has('ide')).toBe(true);
      expect(categories.has('skill')).toBe(true);
      expect(categories.has('seed')).toBe(true);
      expect(categories.has('vocabulary')).toBe(true);
    });
  });

  // ── runUninstall ────────────────────────────────────────────────────────

  describe('runUninstall', () => {
    it('logs warning and returns early when no scaffolded files found', async () => {
      mockExistsSync.mockReturnValue(false);

      await runUninstall({
        targetDir: TEST_DIR,
        confirm: false,
        keepConfig: false,
        keepAgents: false,
        removeBrowsers: false,
      });

      expect(logWarn).toHaveBeenCalledWith(expect.stringContaining('No scaffolded files found'));
      expect(mockUnlink).not.toHaveBeenCalled();
    });

    it('displays grouped manifest in dry-run mode', async () => {
      mockExistsSync.mockImplementation(
        (path: string) =>
          path === `${TEST_DIR}/playwright.config.ts` || path === `${TEST_DIR}/AGENTS.md`,
      );

      await runUninstall({
        targetDir: TEST_DIR,
        confirm: false,
        keepConfig: false,
        keepAgents: false,
        removeBrowsers: false,
      });

      expect(logSection).toHaveBeenCalled();
      expect(logStep).toHaveBeenCalled();
    });

    it('does not delete files in dry-run mode', async () => {
      mockExistsSync.mockReturnValue(true);

      await runUninstall({
        targetDir: TEST_DIR,
        confirm: false,
        keepConfig: false,
        keepAgents: false,
        removeBrowsers: false,
      });

      expect(mockUnlink).not.toHaveBeenCalled();
    });

    it('shows dry-run message with --confirm suggestion', async () => {
      mockExistsSync.mockReturnValue(true);

      await runUninstall({
        targetDir: TEST_DIR,
        confirm: false,
        keepConfig: false,
        keepAgents: false,
        removeBrowsers: false,
      });

      expect(logWarn).toHaveBeenCalledWith(expect.stringContaining('Run with --confirm'));
    });

    it('deletes files when confirm is true', async () => {
      mockExistsSync.mockImplementation(
        (path: string) => path === `${TEST_DIR}/playwright.config.ts`,
      );

      await runUninstall({
        targetDir: TEST_DIR,
        confirm: true,
        keepConfig: false,
        keepAgents: false,
        removeBrowsers: false,
      });

      expect(mockUnlink).toHaveBeenCalledWith(`${TEST_DIR}/playwright.config.ts`);
    });

    it('logs success with count after confirmed removal', async () => {
      mockExistsSync.mockImplementation(
        (path: string) =>
          path === `${TEST_DIR}/playwright.config.ts` || path === `${TEST_DIR}/AGENTS.md`,
      );

      await runUninstall({
        targetDir: TEST_DIR,
        confirm: true,
        keepConfig: false,
        keepAgents: false,
        removeBrowsers: false,
      });

      expect(logSuccess).toHaveBeenCalledWith(expect.stringContaining('2 of 2'));
    });

    it('handles unlink errors gracefully', async () => {
      mockExistsSync.mockImplementation(
        (path: string) => path === `${TEST_DIR}/playwright.config.ts`,
      );
      mockUnlink.mockRejectedValueOnce(new Error('EACCES'));

      await runUninstall({
        targetDir: TEST_DIR,
        confirm: true,
        keepConfig: false,
        keepAgents: false,
        removeBrowsers: false,
      });

      expect(logWarn).toHaveBeenCalledWith(expect.stringContaining('Could not remove'));
      // Should still log summary
      expect(logSuccess).toHaveBeenCalledWith(expect.stringContaining('0 of 1'));
    });

    it('cleans empty directories after file removal', async () => {
      mockExistsSync.mockImplementation(
        (path: string) => path === `${TEST_DIR}/.vscode/extensions.json`,
      );
      mockReaddir.mockResolvedValue([]);

      await runUninstall({
        targetDir: TEST_DIR,
        confirm: true,
        keepConfig: false,
        keepAgents: false,
        removeBrowsers: false,
      });

      expect(mockRmdir).toHaveBeenCalledWith(`${TEST_DIR}/.vscode`);
    });

    it('does not remove targetDir itself even if empty', async () => {
      mockExistsSync.mockImplementation((path: string) => path === `${TEST_DIR}/AGENTS.md`);
      mockReaddir.mockResolvedValue([]);

      await runUninstall({
        targetDir: TEST_DIR,
        confirm: true,
        keepConfig: false,
        keepAgents: false,
        removeBrowsers: false,
      });

      // AGENTS.md is in targetDir root, dirname is targetDir — should NOT be rmdir'd
      expect(mockRmdir).not.toHaveBeenCalledWith(TEST_DIR);
    });

    it('calls execSync for browser removal when removeBrowsers is true', async () => {
      mockExistsSync.mockImplementation(
        (path: string) => path === `${TEST_DIR}/playwright.config.ts`,
      );

      await runUninstall({
        targetDir: TEST_DIR,
        confirm: true,
        keepConfig: false,
        keepAgents: false,
        removeBrowsers: true,
      });

      expect(mockExecSync).toHaveBeenCalledWith(
        'npx playwright uninstall --all',
        expect.objectContaining({ stdio: 'inherit' }),
      );
    });

    it('handles browser removal failure gracefully', async () => {
      mockExistsSync.mockImplementation(
        (path: string) => path === `${TEST_DIR}/playwright.config.ts`,
      );
      mockExecSync.mockImplementation(() => {
        throw new Error('Command failed');
      });

      await runUninstall({
        targetDir: TEST_DIR,
        confirm: true,
        keepConfig: false,
        keepAgents: false,
        removeBrowsers: true,
      });

      expect(logWarn).toHaveBeenCalledWith(
        expect.stringContaining('Failed to remove Playwright browsers'),
      );
    });

    it('does not call execSync when removeBrowsers is false', async () => {
      mockExistsSync.mockImplementation(
        (path: string) => path === `${TEST_DIR}/playwright.config.ts`,
      );

      await runUninstall({
        targetDir: TEST_DIR,
        confirm: true,
        keepConfig: false,
        keepAgents: false,
        removeBrowsers: false,
      });

      expect(mockExecSync).not.toHaveBeenCalled();
    });
  });
});
