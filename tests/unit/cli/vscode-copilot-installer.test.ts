/**
 * @license
 * Copyright (c) ZesTest 2025-2030. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0
 *
 * This file may contain AI-assisted code.
 * See LICENSE and NOTICE files for details.
 */

/**
 * Tests for `src/cli/vscode-copilot-installer.ts` — VS Code scaffolding.
 *
 * @remarks
 * Mocks `node:fs/promises` to verify that `scaffoldVSCodeFiles()` writes
 * all expected files (settings, extensions, snippets, launch) and that the
 * generated JSON templates are valid.
 *
 * @module cli/vscode-copilot-installer
 */

import { join } from 'node:path';

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { createMockFileSystem } from '../../helpers/mock-filesystem.js';

// ── Mocks ───────────────────────────────────────────────────────────────────

let mockFs: ReturnType<typeof createMockFileSystem>;

vi.mock('node:fs/promises', () => {
  mockFs = createMockFileSystem();
  return mockFs.mocks;
});

vi.mock('../../../src/cli/logger.js', () => ({
  logStep: vi.fn(),
  logSuccess: vi.fn(),
  logWarn: vi.fn(),
  logError: vi.fn(),
  logSection: vi.fn(),
  logTable: vi.fn(),
  logBanner: vi.fn(),
}));

const { scaffoldVSCodeFiles } = await import('../../../src/cli/vscode-copilot-installer.js');

/** Safe non-tmp test path to avoid sonarjs/publicly-writable-directories. */
const TEST_DIR = join('/home', 'testuser', 'my-sap-project');

/**
 * Reads written content from mock filesystem and asserts it is defined.
 *
 * @param path - Absolute file path to look up.
 * @returns The file content string.
 */
function getWrittenContent(path: string): string {
  const content = mockFs.written.get(path);
  expect(content).toBeDefined();
  return content!; // eslint-disable-line @typescript-eslint/no-non-null-assertion -- guarded by expect().toBeDefined()
}

// ── Tests ───────────────────────────────────────────────────────────────────

describe('cli/vscode-copilot-installer', () => {
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

  // ── scaffoldVSCodeFiles — writes expected files ──────────────────────────

  describe('scaffoldVSCodeFiles — writes expected files', () => {
    it('writes settings.json', async () => {
      const created: string[] = [];
      await scaffoldVSCodeFiles(TEST_DIR, false, created);

      const settingsPath = join(TEST_DIR, '.vscode', 'settings.json');
      expect(mockFs.written.has(settingsPath)).toBe(true);
      expect(created).toContain(settingsPath);
    });

    it('writes extensions.json', async () => {
      const created: string[] = [];
      await scaffoldVSCodeFiles(TEST_DIR, false, created);

      const extensionsPath = join(TEST_DIR, '.vscode', 'extensions.json');
      expect(mockFs.written.has(extensionsPath)).toBe(true);
      expect(created).toContain(extensionsPath);
    });

    it('writes praman.code-snippets', async () => {
      const created: string[] = [];
      await scaffoldVSCodeFiles(TEST_DIR, false, created);

      const snippetsPath = join(TEST_DIR, '.vscode', 'praman.code-snippets');
      expect(mockFs.written.has(snippetsPath)).toBe(true);
      expect(created).toContain(snippetsPath);
    });

    it('writes launch.json', async () => {
      const created: string[] = [];
      await scaffoldVSCodeFiles(TEST_DIR, false, created);

      const launchPath = join(TEST_DIR, '.vscode', 'launch.json');
      expect(mockFs.written.has(launchPath)).toBe(true);
      expect(created).toContain(launchPath);
    });

    it('creates exactly 4 files', async () => {
      const created: string[] = [];
      await scaffoldVSCodeFiles(TEST_DIR, false, created);

      expect(created).toHaveLength(4);
    });
  });

  // ── JSON validity ────────────────────────────────────────────────────────

  describe('generated JSON templates are valid', () => {
    it('snippets template parses as valid JSON', async () => {
      const created: string[] = [];
      await scaffoldVSCodeFiles(TEST_DIR, false, created);

      const snippetsPath = join(TEST_DIR, '.vscode', 'praman.code-snippets');
      const snippetsContent = getWrittenContent(snippetsPath);

      const parsed: unknown = JSON.parse(snippetsContent);
      expect(parsed).toBeTypeOf('object');
      expect(parsed).not.toBeNull();
    });

    it('snippets template contains all 6 snippet entries', async () => {
      const created: string[] = [];
      await scaffoldVSCodeFiles(TEST_DIR, false, created);

      const snippetsPath = join(TEST_DIR, '.vscode', 'praman.code-snippets');
      const parsed = JSON.parse(getWrittenContent(snippetsPath)) as Record<string, unknown>;
      const keys = Object.keys(parsed);

      expect(keys).toContain('Praman UI5 Test');
      expect(keys).toContain('Praman Step');
      expect(keys).toContain('Praman Button Click');
      expect(keys).toContain('Praman Input Fill');
      expect(keys).toContain('Praman Table Read');
      expect(keys).toContain('Praman Dialog Handle');
      expect(keys).toHaveLength(6);
    });

    it('launch template parses as valid JSON', async () => {
      const created: string[] = [];
      await scaffoldVSCodeFiles(TEST_DIR, false, created);

      const launchPath = join(TEST_DIR, '.vscode', 'launch.json');
      const launchContent = getWrittenContent(launchPath);

      const parsed: unknown = JSON.parse(launchContent);
      expect(parsed).toBeTypeOf('object');
      expect(parsed).not.toBeNull();
    });

    it('launch template contains 3 configurations', async () => {
      const created: string[] = [];
      await scaffoldVSCodeFiles(TEST_DIR, false, created);

      const launchPath = join(TEST_DIR, '.vscode', 'launch.json');
      const parsed = JSON.parse(getWrittenContent(launchPath)) as {
        configurations: readonly { name: string }[];
      };

      expect(parsed.configurations).toHaveLength(3);
      expect(parsed.configurations[0]?.name).toBe('Debug Current Test (Headed)');
      expect(parsed.configurations[1]?.name).toBe('Debug All Tests (Headed)');
      expect(parsed.configurations[2]?.name).toBe('Run Praman Doctor');
    });
  });

  // ── writeIfMissing — skip existing ───────────────────────────────────────

  describe('scaffoldVSCodeFiles — does not overwrite existing files', () => {
    it('skips files that already exist when force is false', async () => {
      const settingsPath = join(TEST_DIR, '.vscode', 'settings.json');
      mockFs.files.set(settingsPath, '{"existing": true}');

      const created: string[] = [];
      await scaffoldVSCodeFiles(TEST_DIR, false, created);

      // settings.json should NOT be in created (it already existed)
      expect(created).not.toContain(settingsPath);
      // But the other 3 files should be created
      expect(created).toHaveLength(3);
    });

    it('overwrites existing files when force is true', async () => {
      const settingsPath = join(TEST_DIR, '.vscode', 'settings.json');
      mockFs.files.set(settingsPath, '{"existing": true}');

      const created: string[] = [];
      await scaffoldVSCodeFiles(TEST_DIR, true, created);

      // All 4 files should be written when force=true
      expect(created).toHaveLength(4);
      expect(created).toContain(settingsPath);
    });
  });
});
