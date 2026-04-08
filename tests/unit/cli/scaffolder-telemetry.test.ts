/**
 * @license
 * Copyright (c) ZesTest 2025-2030. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0
 *
 * This file may contain AI-assisted code.
 * See LICENSE and NOTICE files for details.
 */

/**
 * Tests for telemetry example scaffolding in `src/cli/scaffolder.ts`.
 *
 * @remarks
 * Mocks `node:fs/promises` to verify that `scaffoldTelemetryExamples()`
 * copies telemetry config examples into the user's project at
 * `examples/telemetry/`.
 *
 * @module cli/scaffolder-telemetry
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

vi.mock('../../../src/cli/version.js', () => ({
  getVersion: vi.fn(() => '1.0.0'),
  getPackageRoot: vi.fn(() => join('/pkg', 'playwright-praman')),
}));

// Mock child_process so `isDockerAvailable()` never spawns a real process.
vi.mock('node:child_process', () => ({
  execFile: (_cmd: string, _args: string[], cb: (err: Error | null) => void) => {
    cb(new Error('mock: docker not available'));
  },
}));

const { scaffoldTelemetryExamples } = await import('../../../src/cli/scaffolder.js');
const { logWarn } = await import('../../../src/cli/logger.js');

/** Safe non-tmp test path to avoid sonarjs/publicly-writable-directories. */
const TEST_DIR = join('/home', 'testuser', 'my-sap-project');
const PKG_ROOT = join('/pkg', 'playwright-praman');

const TELEMETRY_FILES = [
  'praman.config.telemetry.ts',
  'praman.config.azure-monitor.ts',
  'playwright.config.otel-reporter.ts',
] as const;

// ── Tests ───────────────────────────────────────────────────────────────────

describe('cli/scaffolder — telemetry examples', () => {
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

  describe('scaffoldTelemetryExamples', () => {
    it('copies all telemetry example files when sources exist', async () => {
      // Seed the package source files
      for (const fileName of TELEMETRY_FILES) {
        const srcPath = join(PKG_ROOT, 'examples', fileName);
        mockFs.files.set(srcPath, `// ${fileName} content`);
      }

      const created: string[] = [];
      await scaffoldTelemetryExamples(TEST_DIR, false, created);

      for (const fileName of TELEMETRY_FILES) {
        const destPath = join(TEST_DIR, 'examples', 'telemetry', fileName);
        expect(created).toContain(destPath);
      }
    });

    it('creates the examples/telemetry/ directory', async () => {
      for (const fileName of TELEMETRY_FILES) {
        mockFs.files.set(join(PKG_ROOT, 'examples', fileName), '// content');
      }

      const created: string[] = [];
      await scaffoldTelemetryExamples(TEST_DIR, false, created);

      const destDir = join(TEST_DIR, 'examples', 'telemetry');
      expect(mockFs.mocks.mkdir).toHaveBeenCalledWith(
        destDir,
        expect.objectContaining({ recursive: true }),
      );
    });

    it('does not overwrite existing files when force is false', async () => {
      // Seed package sources
      for (const fileName of TELEMETRY_FILES) {
        mockFs.files.set(join(PKG_ROOT, 'examples', fileName), '// content');
      }

      // Pre-populate one destination file
      const existingDest = join(TEST_DIR, 'examples', 'telemetry', TELEMETRY_FILES[0]);
      mockFs.files.set(existingDest, 'existing-content');

      const created: string[] = [];
      await scaffoldTelemetryExamples(TEST_DIR, false, created);

      // First file should be skipped, others should be copied
      expect(created).not.toContain(existingDest);
      expect(created).toContain(join(TEST_DIR, 'examples', 'telemetry', TELEMETRY_FILES[1]));
      expect(created).toContain(join(TEST_DIR, 'examples', 'telemetry', TELEMETRY_FILES[2]));
    });

    it('overwrites existing files when force is true', async () => {
      // Seed package sources
      for (const fileName of TELEMETRY_FILES) {
        mockFs.files.set(join(PKG_ROOT, 'examples', fileName), '// content');
      }

      // Pre-populate one destination file
      const existingDest = join(TEST_DIR, 'examples', 'telemetry', TELEMETRY_FILES[0]);
      mockFs.files.set(existingDest, 'existing-content');

      const created: string[] = [];
      await scaffoldTelemetryExamples(TEST_DIR, true, created);

      // All files should be copied even though one already existed
      expect(created).toHaveLength(TELEMETRY_FILES.length);
    });

    it('warns when source templates are not found', async () => {
      // Do NOT seed source files — they will be missing
      const created: string[] = [];
      await scaffoldTelemetryExamples(TEST_DIR, false, created);

      expect(created).toHaveLength(0);
      expect(logWarn).toHaveBeenCalledWith(
        expect.stringContaining('Telemetry example source not found'),
      );
    });
  });
});
