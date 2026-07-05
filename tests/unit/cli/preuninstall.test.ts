/**
 * @license
 * Copyright (c) ZesTest 2025-2030. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0
 *
 * This file may contain AI-assisted code.
 * See LICENSE and NOTICE files for details.
 */

/**
 * Tests for `src/cli/preuninstall.ts` — npm preuninstall lifecycle script.
 *
 * @remarks
 * Tests the project root resolution logic used during `npm remove`.
 * The `resolveProjectRoot` function is the only exported unit; the
 * `main()` function is tested indirectly via integration behavior.
 *
 * @module cli/preuninstall
 */

import { join } from 'node:path';
import process from 'node:process';

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// ── Mocks ───────────────────────────────────────────────────────────────────

vi.mock('../../../src/cli/logger.js', () => ({
  logStep: vi.fn(),
  logSuccess: vi.fn(),
  logWarn: vi.fn(),
  logError: vi.fn(),
  logSection: vi.fn(),
  logTable: vi.fn(),
  logBanner: vi.fn(),
}));

const mockGetScaffoldedFiles = vi.fn().mockReturnValue([]);
const mockMoveFilesToTrash = vi.fn().mockResolvedValue(0);
vi.mock('../../../src/cli/uninstall.js', () => ({
  TRASH_DIR_NAME: 'deleted-praman-files',
  getScaffoldedFiles: mockGetScaffoldedFiles,
  moveFilesToTrash: mockMoveFilesToTrash,
}));

const { resolveProjectRoot } = await import('../../../src/cli/preuninstall.js');

// ── Tests ───────────────────────────────────────────────────────────────────

describe('cli/preuninstall', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('resolveProjectRoot', () => {
    it('resolves project root from node_modules/playwright-praman CWD', () => {
      const projectRoot = join('/home', 'user', 'my-project');
      vi.spyOn(process, 'cwd').mockReturnValue(
        join(projectRoot, 'node_modules', 'playwright-praman'),
      );

      const result = resolveProjectRoot();

      expect(result).toBe(projectRoot);
    });

    it('resolves project root from hoisted node_modules in monorepo', () => {
      const monorepoRoot = join('/home', 'user', 'monorepo');
      vi.spyOn(process, 'cwd').mockReturnValue(
        join(monorepoRoot, 'node_modules', 'playwright-praman'),
      );

      const result = resolveProjectRoot();

      expect(result).toBe(monorepoRoot);
    });

    it('returns undefined when CWD is not inside node_modules/playwright-praman', () => {
      vi.spyOn(process, 'cwd').mockReturnValue(join('/home', 'user', 'my-project'));

      const result = resolveProjectRoot();

      expect(result).toBeUndefined();
    });

    it('returns undefined for global install paths', () => {
      vi.spyOn(process, 'cwd').mockReturnValue(
        join('/usr', 'lib', 'node_modules', 'some-other-pkg'),
      );

      const result = resolveProjectRoot();

      expect(result).toBeUndefined();
    });

    it('handles nested node_modules (uses last occurrence)', () => {
      const innerRoot = join('/home', 'user', 'project', 'node_modules', 'some-dep');
      vi.spyOn(process, 'cwd').mockReturnValue(
        join(innerRoot, 'node_modules', 'playwright-praman'),
      );

      const result = resolveProjectRoot();

      expect(result).toBe(innerRoot);
    });

    it('strips trailing forward slash from resolved root', () => {
      // On posix, join produces /home/user/project/node_modules/playwright-praman
      // The slash before node_modules remains after slicing at marker index
      vi.spyOn(process, 'cwd').mockReturnValue(
        '/home/user/project/node_modules/playwright-praman',
      );

      const result = resolveProjectRoot();

      // Verify no trailing slash
      expect(result).toBe('/home/user/project');
      expect(result?.endsWith('/')).toBe(false);
    });

    it('strips trailing backslash from resolved root (Windows paths)', () => {
      // On Windows, paths use backslashes. The marker is searched via lastIndexOf
      // which is string-based, so we can simulate a Windows-style path.
      // The marker produced by join() on macOS uses /, but lastIndexOf is literal,
      // so we need the marker string as it would appear. On macOS, marker = 'node_modules/playwright-praman'
      // For this test, we construct a CWD that produces a trailing backslash after slicing.
      // Since join on posix uses /, we directly test with a crafted path containing the posix marker
      // but with a scenario where root ends with backslash.
      const marker = join('node_modules', 'playwright-praman');
      // Craft a CWD like: C:\Users\test\<marker> — where slicing leaves 'C:\\Users\\test\\'
      const craftedCwd = `C:\\Users\\test\\${marker}`;
      vi.spyOn(process, 'cwd').mockReturnValue(craftedCwd);

      const result = resolveProjectRoot();

      // After slicing at marker index, root = 'C:\\Users\\test\\'
      // The trailing backslash should be stripped
      expect(result).toBe('C:\\Users\\test');
      expect(result?.endsWith('\\')).toBe(false);
    });
  });

  describe('main() lifecycle behavior', () => {
    it('moves scaffolded files when project root resolves and files exist', async () => {
      const projectRoot = join('/home', 'user', 'my-project');
      vi.spyOn(process, 'cwd').mockReturnValue(
        join(projectRoot, 'node_modules', 'playwright-praman'),
      );

      const fakeFiles = [
        { relativePath: 'playwright.config.ts', category: 'config' as const, label: 'Playwright config' },
        { relativePath: 'praman.config.ts', category: 'config' as const, label: 'Praman config' },
      ];
      mockGetScaffoldedFiles.mockReturnValue(fakeFiles);
      mockMoveFilesToTrash.mockResolvedValue(2);

      // Re-import to trigger the IIFE with new mock state
      vi.resetModules();
      // Re-apply mocks before re-import
      vi.doMock('../../../src/cli/logger.js', () => ({
        logStep: vi.fn(),
        logSuccess: vi.fn(),
        logWarn: vi.fn(),
        logError: vi.fn(),
        logSection: vi.fn(),
        logTable: vi.fn(),
        logBanner: vi.fn(),
      }));
      vi.doMock('../../../src/cli/uninstall.js', () => ({
        TRASH_DIR_NAME: 'deleted-praman-files',
        getScaffoldedFiles: vi.fn().mockReturnValue(fakeFiles),
        moveFilesToTrash: vi.fn().mockResolvedValue(2),
      }));

      const loggerMod = await import('../../../src/cli/logger.js');
      await import('../../../src/cli/preuninstall.js');

      // Wait for the IIFE to settle
      await new Promise((resolve) => {
        setTimeout(resolve, 50);
      });

      expect(loggerMod.logWarn).toHaveBeenCalledWith(
        expect.stringContaining('Moving 2 Praman scaffolded file(s)'),
      );
      expect(loggerMod.logWarn).toHaveBeenCalledWith(expect.stringContaining('playwright.config.ts'));
      expect(loggerMod.logSuccess).toHaveBeenCalledWith(
        expect.stringContaining('2 of 2'),
      );
    });

    it('does nothing when project root cannot be resolved', async () => {
      vi.spyOn(process, 'cwd').mockReturnValue(join('/home', 'user', 'my-project'));

      vi.resetModules();
      vi.doMock('../../../src/cli/logger.js', () => ({
        logStep: vi.fn(),
        logSuccess: vi.fn(),
        logWarn: vi.fn(),
        logError: vi.fn(),
        logSection: vi.fn(),
        logTable: vi.fn(),
        logBanner: vi.fn(),
      }));
      vi.doMock('../../../src/cli/uninstall.js', () => ({
        TRASH_DIR_NAME: 'deleted-praman-files',
        getScaffoldedFiles: vi.fn().mockReturnValue([]),
        moveFilesToTrash: vi.fn().mockResolvedValue(0),
      }));

      const loggerMod = await import('../../../src/cli/logger.js');
      await import('../../../src/cli/preuninstall.js');

      await new Promise((resolve) => {
        setTimeout(resolve, 50);
      });

      // main() should return early — no logging
      expect(loggerMod.logWarn).not.toHaveBeenCalled();
      expect(loggerMod.logSuccess).not.toHaveBeenCalled();
    });

    it('does nothing when no scaffolded files exist', async () => {
      const projectRoot = join('/home', 'user', 'my-project');
      vi.spyOn(process, 'cwd').mockReturnValue(
        join(projectRoot, 'node_modules', 'playwright-praman'),
      );

      vi.resetModules();
      vi.doMock('../../../src/cli/logger.js', () => ({
        logStep: vi.fn(),
        logSuccess: vi.fn(),
        logWarn: vi.fn(),
        logError: vi.fn(),
        logSection: vi.fn(),
        logTable: vi.fn(),
        logBanner: vi.fn(),
      }));
      vi.doMock('../../../src/cli/uninstall.js', () => ({
        TRASH_DIR_NAME: 'deleted-praman-files',
        getScaffoldedFiles: vi.fn().mockReturnValue([]),
        moveFilesToTrash: vi.fn().mockResolvedValue(0),
      }));

      const loggerMod = await import('../../../src/cli/logger.js');
      await import('../../../src/cli/preuninstall.js');

      await new Promise((resolve) => {
        setTimeout(resolve, 50);
      });

      // Should not log success when no files to move
      expect(loggerMod.logSuccess).not.toHaveBeenCalled();
    });

    it('always exits 0 even when main() throws', async () => {
      const projectRoot = join('/home', 'user', 'my-project');
      vi.spyOn(process, 'cwd').mockReturnValue(
        join(projectRoot, 'node_modules', 'playwright-praman'),
      );

      vi.resetModules();
      vi.doMock('../../../src/cli/logger.js', () => ({
        logStep: vi.fn(),
        logSuccess: vi.fn(),
        logWarn: vi.fn(),
        logError: vi.fn(),
        logSection: vi.fn(),
        logTable: vi.fn(),
        logBanner: vi.fn(),
      }));
      vi.doMock('../../../src/cli/uninstall.js', () => ({
        TRASH_DIR_NAME: 'deleted-praman-files',
        getScaffoldedFiles: vi.fn().mockImplementation(() => {
          throw new Error('Unexpected failure');
        }),
        moveFilesToTrash: vi.fn().mockResolvedValue(0),
      }));

      // Should not throw — IIFE catches all errors
      await expect(import('../../../src/cli/preuninstall.js')).resolves.toBeDefined();

      await new Promise((resolve) => {
        setTimeout(resolve, 50);
      });
    });

    it('logs individual file paths during move', async () => {
      const projectRoot = join('/home', 'user', 'my-project');
      vi.spyOn(process, 'cwd').mockReturnValue(
        join(projectRoot, 'node_modules', 'playwright-praman'),
      );

      const fakeFiles = [
        { relativePath: '.vscode/settings.json', category: 'ide' as const, label: 'VS Code settings' },
      ];

      vi.resetModules();
      vi.doMock('../../../src/cli/logger.js', () => ({
        logStep: vi.fn(),
        logSuccess: vi.fn(),
        logWarn: vi.fn(),
        logError: vi.fn(),
        logSection: vi.fn(),
        logTable: vi.fn(),
        logBanner: vi.fn(),
      }));
      vi.doMock('../../../src/cli/uninstall.js', () => ({
        TRASH_DIR_NAME: 'deleted-praman-files',
        getScaffoldedFiles: vi.fn().mockReturnValue(fakeFiles),
        moveFilesToTrash: vi.fn().mockResolvedValue(1),
      }));

      const loggerMod = await import('../../../src/cli/logger.js');
      await import('../../../src/cli/preuninstall.js');

      await new Promise((resolve) => {
        setTimeout(resolve, 50);
      });

      expect(loggerMod.logWarn).toHaveBeenCalledWith(expect.stringContaining('.vscode/settings.json'));
    });

    it('logs preservation message after successful move', async () => {
      const projectRoot = join('/home', 'user', 'my-project');
      vi.spyOn(process, 'cwd').mockReturnValue(
        join(projectRoot, 'node_modules', 'playwright-praman'),
      );

      const fakeFiles = [
        { relativePath: 'playwright.config.ts', category: 'config' as const, label: 'Playwright config' },
      ];

      vi.resetModules();
      vi.doMock('../../../src/cli/logger.js', () => ({
        logStep: vi.fn(),
        logSuccess: vi.fn(),
        logWarn: vi.fn(),
        logError: vi.fn(),
        logSection: vi.fn(),
        logTable: vi.fn(),
        logBanner: vi.fn(),
      }));
      vi.doMock('../../../src/cli/uninstall.js', () => ({
        TRASH_DIR_NAME: 'deleted-praman-files',
        getScaffoldedFiles: vi.fn().mockReturnValue(fakeFiles),
        moveFilesToTrash: vi.fn().mockResolvedValue(1),
      }));

      const loggerMod = await import('../../../src/cli/logger.js');
      await import('../../../src/cli/preuninstall.js');

      await new Promise((resolve) => {
        setTimeout(resolve, 50);
      });

      expect(loggerMod.logWarn).toHaveBeenCalledWith(
        expect.stringContaining('delete manually when ready'),
      );
    });
  });
});
