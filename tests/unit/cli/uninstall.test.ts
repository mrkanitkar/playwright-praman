/**
 * @license
 * Copyright (c) ZesTest 2025-2030. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0
 *
 * This file may contain AI-assisted code.
 * See LICENSE and NOTICE files for details.
 */

/**
 * Tests for `src/cli/uninstall.ts` — uninstall command.
 *
 * @remarks
 * Mocks `node:fs`, `node:fs/promises`, `node:child_process`, and the CLI
 * logger to verify argument parsing, file manifest filtering, move-to-trash
 * logic, and browser removal without touching the real filesystem.
 *
 * @module cli/uninstall
 */

import { join } from 'node:path';

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
const mockRm = vi.fn().mockResolvedValue(undefined);
const mockMkdir = vi.fn().mockResolvedValue(undefined);
const mockCopyFile = vi.fn().mockResolvedValue(undefined);
const mockRename = vi.fn().mockResolvedValue(undefined);
vi.mock('node:fs/promises', () => ({
  unlink: mockUnlink,
  readdir: mockReaddir,
  rmdir: mockRmdir,
  rm: mockRm,
  mkdir: mockMkdir,
  copyFile: mockCopyFile,
  rename: mockRename,
}));

const mockExecSync = vi.fn();
vi.mock('node:child_process', () => ({
  execSync: mockExecSync,
}));

/** Mock for readline question — controls interactive prompt response. */
const mockQuestion = vi.fn();
const mockClose = vi.fn();
vi.mock('node:readline', () => ({
  createInterface: vi.fn(() => ({
    question: mockQuestion,
    close: mockClose,
  })),
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

const { TRASH_DIR_NAME, getScaffoldedFiles, runUninstall } =
  await import('../../../src/cli/uninstall.js');

/** Safe non-tmp test path to avoid sonarjs/publicly-writable-directories. */
const TEST_DIR = join('/home', 'testuser', 'project');

/** Simulates user typing 'y' or 'n' at the interactive prompt. */
function mockPromptAnswer(answer: string): void {
  mockQuestion.mockImplementation((_msg: string, callback: (answer: string) => void) => {
    callback(answer);
  });
}

// ── Tests ───────────────────────────────────────────────────────────────────

describe('cli/uninstall', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockExistsSync.mockReturnValue(false);
  });

  afterEach(() => {
    vi.restoreAllMocks();
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
        (p: string) =>
          p === join(TEST_DIR, 'playwright.config.ts') ||
          p === join(TEST_DIR, '.github/copilot-instructions.md'),
      );

      const files = getScaffoldedFiles(TEST_DIR, baseOptions);

      expect(files).toHaveLength(2);
      expect(files.map((f) => f.relativePath)).toContain('playwright.config.ts');
      expect(files.map((f) => f.relativePath)).toContain('.github/copilot-instructions.md');
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
    });

    it('includes auth.setup.ts in seed category', () => {
      mockExistsSync.mockReturnValue(true);

      const files = getScaffoldedFiles(TEST_DIR, baseOptions);
      const paths = files.map((f) => f.relativePath);

      expect(paths).toContain('tests/auth.setup.ts');
    });

    it('includes .gitignore in config category', () => {
      mockExistsSync.mockReturnValue(true);

      const files = getScaffoldedFiles(TEST_DIR, baseOptions);
      const paths = files.map((f) => f.relativePath);

      expect(paths).toContain('.gitignore');
    });

    it('includes praman-prompts/ directory in prompt category', () => {
      mockExistsSync.mockReturnValue(true);

      const files = getScaffoldedFiles(TEST_DIR, baseOptions);
      const promptEntry = files.find((f) => f.relativePath === 'praman-prompts/');

      expect(promptEntry).toBeDefined();
      expect(promptEntry?.category).toBe('prompt');
    });

    it('prompt category is not filtered by keepConfig or keepAgents', () => {
      mockExistsSync.mockReturnValue(true);

      const filesKeepConfig = getScaffoldedFiles(TEST_DIR, { ...baseOptions, keepConfig: true });
      const filesKeepAgents = getScaffoldedFiles(TEST_DIR, { ...baseOptions, keepAgents: true });

      expect(filesKeepConfig.some((f) => f.category === 'prompt')).toBe(true);
      expect(filesKeepAgents.some((f) => f.category === 'prompt')).toBe(true);
    });

    it('includes prompt category when all categories listed', () => {
      mockExistsSync.mockReturnValue(true);

      const files = getScaffoldedFiles(TEST_DIR, baseOptions);
      const categories = new Set(files.map((f) => f.category));

      expect(categories.has('prompt')).toBe(true);
    });

    // ── CLI manifest entries ──────────────────────────────────────────────

    it('includes CLI agent entries in manifest', () => {
      mockExistsSync.mockReturnValue(true);

      const files = getScaffoldedFiles(TEST_DIR, baseOptions);
      const paths = files.map((f) => f.relativePath);

      expect(paths).toContain('.claude/agents/praman-sap-planner-cli.md');
      expect(paths).toContain('.claude/agents/praman-sap-generator-cli.md');
      expect(paths).toContain('.claude/agents/praman-sap-healer-cli.md');
      expect(paths).toContain('.claude/prompts/praman-cli-plan.md');
      expect(paths).toContain('.claude/prompts/praman-cli-generate.md');
      expect(paths).toContain('.claude/prompts/praman-cli-heal.md');
      expect(paths).toContain('.claude/prompts/praman-cli-coverage.md');
    });

    it('includes Copilot CLI agent entries in manifest', () => {
      mockExistsSync.mockReturnValue(true);

      const files = getScaffoldedFiles(TEST_DIR, baseOptions);
      const paths = files.map((f) => f.relativePath);

      expect(paths).toContain('.github/agents/praman-sap-planner-cli.agent.md');
      expect(paths).toContain('.github/agents/praman-sap-generator-cli.agent.md');
      expect(paths).toContain('.github/agents/praman-sap-healer-cli.agent.md');
    });

    it('includes CLI skill directories in manifest', () => {
      mockExistsSync.mockReturnValue(true);

      const files = getScaffoldedFiles(TEST_DIR, baseOptions);
      const paths = files.map((f) => f.relativePath);

      expect(paths).toContain('skills/praman-sap-cli/');
      expect(paths).toContain('.claude/skills/praman-sap-cli/');
      expect(paths).toContain('.github/skills/praman-sap-cli/');
    });

    it('includes CLI config and IDE entries in manifest', () => {
      mockExistsSync.mockReturnValue(true);

      const files = getScaffoldedFiles(TEST_DIR, baseOptions);
      const paths = files.map((f) => f.relativePath);

      expect(paths).toContain('.playwright/praman-cli.config.json');
      expect(paths).toContain('.cursor/rules/praman-cli.mdc');
    });

    it('includes .auth/ directory in config category', () => {
      mockExistsSync.mockReturnValue(true);

      const files = getScaffoldedFiles(TEST_DIR, baseOptions);
      const authEntry = files.find((f) => f.relativePath === '.auth/');

      expect(authEntry).toBeDefined();
      expect(authEntry?.category).toBe('config');
    });

    it('includes playwright.config.original.ts backup in config category', () => {
      mockExistsSync.mockReturnValue(true);

      const files = getScaffoldedFiles(TEST_DIR, baseOptions);
      const backupEntry = files.find((f) => f.relativePath === 'playwright.config.original.ts');

      expect(backupEntry).toBeDefined();
      expect(backupEntry?.category).toBe('config');
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
      expect(mockRename).not.toHaveBeenCalled();
    });

    it('displays grouped manifest and prompts when no --confirm', async () => {
      mockExistsSync.mockImplementation(
        (p: string) =>
          p === join(TEST_DIR, 'playwright.config.ts') ||
          p === join(TEST_DIR, '.github/copilot-instructions.md'),
      );
      mockPromptAnswer('n');

      await runUninstall({
        targetDir: TEST_DIR,
        confirm: false,
        keepConfig: false,
        keepAgents: false,
        removeBrowsers: false,
      });

      expect(logSection).toHaveBeenCalled();
      expect(logStep).toHaveBeenCalled();
      expect(mockQuestion).toHaveBeenCalled();
    });

    it('does not move files when user declines prompt', async () => {
      mockExistsSync.mockReturnValue(true);
      mockPromptAnswer('n');

      await runUninstall({
        targetDir: TEST_DIR,
        confirm: false,
        keepConfig: false,
        keepAgents: false,
        removeBrowsers: false,
      });

      expect(mockRename).not.toHaveBeenCalled();
      expect(logWarn).toHaveBeenCalledWith('Aborted. No files were moved.');
    });

    it('moves files to deleted-praman-files/ when user approves prompt', async () => {
      mockExistsSync.mockImplementation(
        (p: string) => p === join(TEST_DIR, 'playwright.config.ts'),
      );
      mockPromptAnswer('y');

      await runUninstall({
        targetDir: TEST_DIR,
        confirm: false,
        keepConfig: false,
        keepAgents: false,
        removeBrowsers: false,
      });

      expect(mockMkdir).toHaveBeenCalledWith(
        join(TEST_DIR, TRASH_DIR_NAME),
        expect.objectContaining({ recursive: true }),
      );
      expect(mockRename).toHaveBeenCalledWith(
        join(TEST_DIR, 'playwright.config.ts'),
        join(TEST_DIR, TRASH_DIR_NAME, 'playwright.config.ts'),
      );
    });

    it('skips prompt and moves files when --confirm is set', async () => {
      mockExistsSync.mockImplementation(
        (p: string) => p === join(TEST_DIR, 'playwright.config.ts'),
      );

      await runUninstall({
        targetDir: TEST_DIR,
        confirm: true,
        keepConfig: false,
        keepAgents: false,
        removeBrowsers: false,
      });

      expect(mockQuestion).not.toHaveBeenCalled();
      expect(mockRename).toHaveBeenCalledWith(
        join(TEST_DIR, 'playwright.config.ts'),
        join(TEST_DIR, TRASH_DIR_NAME, 'playwright.config.ts'),
      );
    });

    it('logs success with count after confirmed move', async () => {
      mockExistsSync.mockImplementation(
        (p: string) =>
          p === join(TEST_DIR, 'playwright.config.ts') ||
          p === join(TEST_DIR, '.github/copilot-instructions.md'),
      );

      await runUninstall({
        targetDir: TEST_DIR,
        confirm: true,
        keepConfig: false,
        keepAgents: false,
        removeBrowsers: false,
      });

      expect(logSuccess).toHaveBeenCalledWith(expect.stringContaining('2 of 2'));
      expect(logSuccess).toHaveBeenCalledWith(expect.stringContaining(TRASH_DIR_NAME));
    });

    it('logs preservation message after move', async () => {
      mockExistsSync.mockImplementation(
        (p: string) => p === join(TEST_DIR, 'playwright.config.ts'),
      );

      await runUninstall({
        targetDir: TEST_DIR,
        confirm: true,
        keepConfig: false,
        keepAgents: false,
        removeBrowsers: false,
      });

      expect(logWarn).toHaveBeenCalledWith(expect.stringContaining('delete manually when ready'));
    });

    it('handles move errors gracefully', async () => {
      mockExistsSync.mockImplementation(
        (p: string) => p === join(TEST_DIR, 'playwright.config.ts'),
      );
      mockRename.mockRejectedValueOnce(new Error('EACCES'));

      await runUninstall({
        targetDir: TEST_DIR,
        confirm: true,
        keepConfig: false,
        keepAgents: false,
        removeBrowsers: false,
      });

      expect(logWarn).toHaveBeenCalledWith(expect.stringContaining('Could not move'));
      // Should still log summary
      expect(logSuccess).toHaveBeenCalledWith(expect.stringContaining('0 of 1'));
    });

    it('cleans empty directories after file move', async () => {
      mockExistsSync.mockImplementation(
        (p: string) => p === join(TEST_DIR, '.vscode', 'extensions.json'),
      );
      mockReaddir.mockResolvedValue([]);

      await runUninstall({
        targetDir: TEST_DIR,
        confirm: true,
        keepConfig: false,
        keepAgents: false,
        removeBrowsers: false,
      });

      expect(mockRmdir).toHaveBeenCalledWith(join(TEST_DIR, '.vscode'));
    });

    it('does not remove targetDir itself even if empty', async () => {
      mockExistsSync.mockImplementation(
        (p: string) => p === join(TEST_DIR, 'playwright.config.ts'),
      );
      mockReaddir.mockResolvedValue([]);

      await runUninstall({
        targetDir: TEST_DIR,
        confirm: true,
        keepConfig: false,
        keepAgents: false,
        removeBrowsers: false,
      });

      // playwright.config.ts is in targetDir root, dirname is targetDir — should NOT be rmdir'd
      expect(mockRmdir).not.toHaveBeenCalledWith(TEST_DIR);
    });

    it('uses recursive copy for directory entries', async () => {
      mockExistsSync.mockImplementation(
        (p: string) => p === join(TEST_DIR, 'skills/praman-sap-cli/'),
      );
      // Simulate empty directory so copyDirRecursive resolves quickly
      mockReaddir.mockResolvedValue([]);

      await runUninstall({
        targetDir: TEST_DIR,
        confirm: true,
        keepConfig: false,
        keepAgents: false,
        removeBrowsers: false,
      });

      // Should create destination directory
      expect(mockMkdir).toHaveBeenCalledWith(
        join(TEST_DIR, TRASH_DIR_NAME, 'skills/praman-sap-cli/'),
        expect.objectContaining({ recursive: true }),
      );
      // Should read source directory contents
      expect(mockReaddir).toHaveBeenCalledWith(
        join(TEST_DIR, 'skills/praman-sap-cli/'),
        expect.objectContaining({ withFileTypes: true }),
      );
      // Should remove empty source directory after copy
      expect(mockRmdir).toHaveBeenCalledWith(join(TEST_DIR, 'skills/praman-sap-cli/'));
    });

    it('calls execSync for browser removal when removeBrowsers is true', async () => {
      mockExistsSync.mockImplementation(
        (p: string) => p === join(TEST_DIR, 'playwright.config.ts'),
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
        (p: string) => p === join(TEST_DIR, 'playwright.config.ts'),
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

    it('does not call browser uninstall when removeBrowsers is false', async () => {
      mockExistsSync.mockImplementation(
        (p: string) => p === join(TEST_DIR, 'playwright.config.ts'),
      );

      await runUninstall({
        targetDir: TEST_DIR,
        confirm: true,
        keepConfig: false,
        keepAgents: false,
        removeBrowsers: false,
      });

      expect(mockExecSync).not.toHaveBeenCalledWith(
        'npx playwright uninstall --all',
        expect.anything(),
      );
    });

    it('runs npm uninstall playwright-praman after file move', async () => {
      mockExistsSync.mockImplementation(
        (p: string) => p === join(TEST_DIR, 'playwright.config.ts'),
      );

      await runUninstall({
        targetDir: TEST_DIR,
        confirm: true,
        keepConfig: false,
        keepAgents: false,
        removeBrowsers: false,
      });

      expect(mockExecSync).toHaveBeenCalledWith(
        'npm uninstall playwright-praman',
        expect.objectContaining({ cwd: TEST_DIR }),
      );
    });

    it('handles npm uninstall failure gracefully', async () => {
      mockExistsSync.mockImplementation(
        (p: string) => p === join(TEST_DIR, 'playwright.config.ts'),
      );
      mockExecSync.mockImplementation(() => {
        throw new Error('uninstall failed');
      });

      await runUninstall({
        targetDir: TEST_DIR,
        confirm: true,
        keepConfig: false,
        keepAgents: false,
        removeBrowsers: false,
      });

      expect(logWarn).toHaveBeenCalledWith(
        expect.stringContaining('Failed to uninstall playwright-praman'),
      );
    });
  });
});
