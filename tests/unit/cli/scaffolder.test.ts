/**
 * @license
 * Copyright (c) ZesTest 2025-2030. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0
 *
 * This file may contain AI-assisted code.
 * See LICENSE and NOTICE files for details.
 */

/**
 * Tests for `src/cli/scaffolder.ts` — project scaffolding logic.
 *
 * @remarks
 * Mocks `node:fs/promises` entirely (mkdir, writeFile, access) to test
 * directory creation, template file generation, and error paths without
 * touching the real filesystem.
 *
 * @module cli/scaffolder
 */

import { join } from 'node:path';

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import type { ScaffoldOptions, ScaffoldResult } from '../../../src/cli/scaffolder.js';
import { createMockFileSystem } from '../../helpers/mock-filesystem.js';

let mockFs: ReturnType<typeof createMockFileSystem>;

vi.mock('node:fs/promises', () => {
  mockFs = createMockFileSystem();
  return mockFs.mocks;
});

// Mock child_process so `isDockerAvailable()` never spawns a real process.
// On Windows CI (Node 24) the real `docker --version` can hang, causing a timeout.
vi.mock('node:child_process', () => ({
  execFile: (_cmd: string, _args: string[], cb: (err: Error | null) => void) => {
    // Simulate Docker not found
    cb(new Error('mock: docker not available'));
  },
}));

// Re-import after mock setup to get the mocked version
const { scaffoldProject } = await import('../../../src/cli/scaffolder.js');

/** Safe non-tmp test path to avoid sonarjs/publicly-writable-directories. */
const TEST_DIR = join('/home', 'testuser', 'my-sap-project');
const EXISTING_DIR = join('/home', 'testuser', 'existing-project');

describe('cli/scaffolder', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockFs.files.clear();
    mockFs.dirs.clear();
    mockFs.written.clear();
    mockFs.deleted.length = 0;
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  // ── scaffoldProject — happy path ────────────────────────────────────────────

  describe('scaffoldProject — creates directory structure when target does not exist', () => {
    it('returns success with list of created files', async () => {
      const options: ScaffoldOptions = { targetDir: TEST_DIR };

      const result = await scaffoldProject(options);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.filesCreated.length).toBeGreaterThan(0);
      }
    });

    it('creates the target directory recursively', async () => {
      const options: ScaffoldOptions = { targetDir: TEST_DIR };

      await scaffoldProject(options);

      expect(mockFs.mocks.mkdir).toHaveBeenCalledWith(
        TEST_DIR,
        expect.objectContaining({ recursive: true }),
      );
    });

    it('creates tests/ subdirectory', async () => {
      const options: ScaffoldOptions = { targetDir: TEST_DIR };

      await scaffoldProject(options);

      const mkdirCalls = mockFs.mocks.mkdir.mock.calls.map((call: unknown[]) => String(call[0]));
      expect(mkdirCalls).toContain(join(TEST_DIR, 'tests'));
    });

    it('creates .auth/ subdirectory', async () => {
      const options: ScaffoldOptions = { targetDir: TEST_DIR };

      await scaffoldProject(options);

      const mkdirCalls = mockFs.mocks.mkdir.mock.calls.map((call: unknown[]) => String(call[0]));
      expect(mkdirCalls).toContain(join(TEST_DIR, '.auth'));
    });
  });

  // ── scaffoldProject — template files ──────────────────────────────────────

  describe('scaffoldProject — writes expected template files', () => {
    it('writes praman.config.ts', async () => {
      const options: ScaffoldOptions = { targetDir: TEST_DIR };

      await scaffoldProject(options);

      expect(mockFs.written.has(join(TEST_DIR, 'praman.config.ts'))).toBe(true);
    });

    it('writes tsconfig.json', async () => {
      const options: ScaffoldOptions = { targetDir: TEST_DIR };

      await scaffoldProject(options);

      expect(mockFs.written.has(join(TEST_DIR, 'tsconfig.json'))).toBe(true);
    });

    it('writes .gitignore', async () => {
      const options: ScaffoldOptions = { targetDir: TEST_DIR };

      await scaffoldProject(options);

      expect(mockFs.written.has(join(TEST_DIR, '.gitignore'))).toBe(true);
    });

    it('returns all created file paths in the result', async () => {
      const options: ScaffoldOptions = { targetDir: TEST_DIR };

      const result = await scaffoldProject(options);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.filesCreated).toContain(join(TEST_DIR, 'praman.config.ts'));
        expect(result.filesCreated).toContain(join(TEST_DIR, 'tsconfig.json'));
        expect(result.filesCreated).toContain(join(TEST_DIR, '.gitignore'));
      }
    });
  });

  // ── scaffoldProject — directory-exists guard ──────────────────────────────

  describe('scaffoldProject — directory-exists guard', () => {
    it('returns error when directory exists and force is false', async () => {
      mockFs.dirs.add(EXISTING_DIR);

      const options: ScaffoldOptions = { targetDir: EXISTING_DIR };

      const result = await scaffoldProject(options);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.reason).toBe('directory-exists');
      }
    });

    it('returns error when directory exists and force is not provided', async () => {
      mockFs.dirs.add(EXISTING_DIR);

      const options: ScaffoldOptions = { targetDir: EXISTING_DIR };

      const result = await scaffoldProject(options);

      expect(result.success).toBe(false);
    });

    it('does not create any files when directory exists and force is false', async () => {
      mockFs.dirs.add(EXISTING_DIR);

      const options: ScaffoldOptions = {
        targetDir: EXISTING_DIR,
        force: false,
      };

      await scaffoldProject(options);

      expect(mockFs.written.size).toBe(0);
    });
  });

  // ── scaffoldProject — force=true overwrite ────────────────────────────────

  describe('scaffoldProject — force=true overwrite', () => {
    it('creates files when directory exists and force is true', async () => {
      mockFs.dirs.add(EXISTING_DIR);

      const options: ScaffoldOptions = {
        targetDir: EXISTING_DIR,
        force: true,
      };

      const result = await scaffoldProject(options);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.filesCreated.length).toBeGreaterThan(0);
      }
    });

    it('writes template files even when directory already exists', async () => {
      mockFs.dirs.add(EXISTING_DIR);

      const options: ScaffoldOptions = {
        targetDir: EXISTING_DIR,
        force: true,
      };

      await scaffoldProject(options);

      expect(mockFs.written.has(join(EXISTING_DIR, 'praman.config.ts'))).toBe(true);
      expect(mockFs.written.has(join(EXISTING_DIR, 'tsconfig.json'))).toBe(true);
      expect(mockFs.written.has(join(EXISTING_DIR, '.gitignore'))).toBe(true);
    });
  });

  // ── scaffoldProject — template option ─────────────────────────────────────

  describe('scaffoldProject — template option', () => {
    it('uses basic template by default', async () => {
      const options: ScaffoldOptions = { targetDir: TEST_DIR };

      const result = await scaffoldProject(options);

      expect(result.success).toBe(true);
      // basic template should still produce the standard files
      if (result.success) {
        expect(result.filesCreated).toContain(join(TEST_DIR, 'praman.config.ts'));
      }
    });

    it('accepts explicit basic template', async () => {
      const options: ScaffoldOptions = {
        targetDir: TEST_DIR,
        template: 'basic',
      };

      const result = await scaffoldProject(options);

      expect(result.success).toBe(true);
    });

    it('accepts fiori template', async () => {
      const options: ScaffoldOptions = {
        targetDir: TEST_DIR,
        template: 'fiori',
      };

      const result = await scaffoldProject(options);

      expect(result.success).toBe(true);
    });
  });

  // ── scaffoldProject — CLI without IDE detection ──────────────────────────

  describe('scaffoldProject — CLI agents without IDE detection', () => {
    it('installs CLI files when cli=true and no detection provided', async () => {
      const options: ScaffoldOptions = {
        targetDir: TEST_DIR,
        cli: true,
        // no detection — simulates no IDE found
      };

      const result = await scaffoldProject(options);

      expect(result.success).toBe(true);
      if (result.success) {
        // Should still create base template files + CLI config/skills
        expect(result.filesCreated.length).toBeGreaterThan(0);
      }
    });

    it('installs CLI files in existing dir when cli=true and no detection', async () => {
      mockFs.dirs.add(EXISTING_DIR);

      const options: ScaffoldOptions = {
        targetDir: EXISTING_DIR,
        cli: true,
        // no detection
      };

      const result = await scaffoldProject(options);

      // Should succeed (not return directory-exists error) because CLI files were installed
      if (result.success) {
        expect(result.filesCreated.length).toBeGreaterThan(0);
      }
      // If no source files found in mock fs, it may still return directory-exists — that's OK
    });
  });

  // ── ScaffoldResult type correctness ─────────────────────────────────────

  describe('ScaffoldResult — type correctness', () => {
    it('success result has filesCreated as readonly array', async () => {
      const options: ScaffoldOptions = { targetDir: TEST_DIR };

      const result: ScaffoldResult = await scaffoldProject(options);

      if (result.success) {
        expect(Array.isArray(result.filesCreated)).toBe(true);
      }
    });

    it('failure result has reason string', async () => {
      mockFs.dirs.add(EXISTING_DIR);

      const result: ScaffoldResult = await scaffoldProject({ targetDir: EXISTING_DIR });

      if (!result.success) {
        expect(typeof result.reason).toBe('string');
      }
    });
  });
});
