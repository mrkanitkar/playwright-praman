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

vi.mock('../../../src/cli/uninstall.js', () => ({
  TRASH_DIR_NAME: 'deleted-praman-files',
  getScaffoldedFiles: vi.fn().mockReturnValue([]),
  moveFilesToTrash: vi.fn().mockResolvedValue(0),
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
  });
});
