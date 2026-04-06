/**
 * @license
 * Copyright (c) ZesTest 2025-2030. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0
 *
 * This file may contain AI-assisted code.
 * See LICENSE and NOTICE files for details.
 */

/**
 * Tests for Docker scaffolding in `src/cli/scaffolder.ts`.
 *
 * @remarks
 * Mocks `node:fs/promises` and `node:child_process` to verify that
 * `isDockerAvailable()` gracefully handles missing Docker and that
 * `scaffoldDockerFiles()` copies templates only when Docker is present.
 *
 * @module cli/scaffolder-docker
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

/** Track execFile calls to simulate Docker availability. */
let dockerAvailableOverride = true;

vi.mock('node:child_process', () => ({
  execFile: vi.fn(
    (_cmd: string, _args: readonly string[], callback: (error: Error | null) => void) => {
      if (dockerAvailableOverride) {
        callback(null);
      } else {
        callback(new Error('command not found: docker'));
      }
    },
  ),
}));

const { isDockerAvailable, scaffoldDockerFiles } = await import('../../../src/cli/scaffolder.js');
const { logWarn } = await import('../../../src/cli/logger.js');

/** Safe non-tmp test path to avoid sonarjs/publicly-writable-directories. */
const TEST_DIR = join('/home', 'testuser', 'my-sap-project');
const PKG_ROOT = join('/pkg', 'playwright-praman');

// ── Tests ───────────────────────────────────────────────────────────────────

describe('cli/scaffolder — Docker support', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockFs.files.clear();
    mockFs.dirs.clear();
    mockFs.written.clear();
    mockFs.deleted.length = 0;
    dockerAvailableOverride = true;
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  // ── isDockerAvailable ──────────────────────────────────────────────────

  describe('isDockerAvailable', () => {
    it('returns true when Docker is installed', async () => {
      dockerAvailableOverride = true;
      const result = await isDockerAvailable();
      expect(result).toBe(true);
    });

    it('returns false when Docker is not installed', async () => {
      dockerAvailableOverride = false;
      const result = await isDockerAvailable();
      expect(result).toBe(false);
    });
  });

  // ── scaffoldDockerFiles ────────────────────────────────────────────────

  describe('scaffoldDockerFiles', () => {
    it('skips copying when Docker is not available', async () => {
      dockerAvailableOverride = false;
      const created: string[] = [];

      await scaffoldDockerFiles(TEST_DIR, false, created);

      expect(created).toHaveLength(0);
      expect(mockFs.written.size).toBe(0);
    });

    it('copies Docker templates when Docker is available and sources exist', async () => {
      dockerAvailableOverride = true;

      // Seed the package source files so copyFile can find them
      const composeSrc = join(PKG_ROOT, 'examples', 'docker', 'docker-compose.yml');
      const dockerfileSrc = join(PKG_ROOT, 'examples', 'docker', 'Dockerfile');
      mockFs.files.set(composeSrc, 'services:\n  praman-tests:\n');
      mockFs.files.set(dockerfileSrc, 'FROM mcr.microsoft.com/playwright:v1.59.0-noble\n');

      const created: string[] = [];
      await scaffoldDockerFiles(TEST_DIR, false, created);

      const composeDest = join(TEST_DIR, 'examples', 'docker', 'docker-compose.yml');
      const dockerfileDest = join(TEST_DIR, 'examples', 'docker', 'Dockerfile');
      expect(created).toContain(composeDest);
      expect(created).toContain(dockerfileDest);
    });

    it('does not overwrite existing files when force is false', async () => {
      dockerAvailableOverride = true;

      // Seed the package source files
      const composeSrc = join(PKG_ROOT, 'examples', 'docker', 'docker-compose.yml');
      const dockerfileSrc = join(PKG_ROOT, 'examples', 'docker', 'Dockerfile');
      mockFs.files.set(composeSrc, 'services:\n');
      mockFs.files.set(dockerfileSrc, 'FROM node:20\n');

      // Pre-populate destination so file already exists
      const composeDest = join(TEST_DIR, 'examples', 'docker', 'docker-compose.yml');
      mockFs.files.set(composeDest, 'existing-content');

      const created: string[] = [];
      await scaffoldDockerFiles(TEST_DIR, false, created);

      // docker-compose.yml should be skipped, Dockerfile should be copied
      expect(created).not.toContain(composeDest);
      const dockerfileDest = join(TEST_DIR, 'examples', 'docker', 'Dockerfile');
      expect(created).toContain(dockerfileDest);
    });

    it('warns when source templates are not found', async () => {
      dockerAvailableOverride = true;

      // Do NOT seed source files — they will be missing
      const created: string[] = [];
      await scaffoldDockerFiles(TEST_DIR, false, created);

      expect(created).toHaveLength(0);
      expect(logWarn).toHaveBeenCalledWith(
        expect.stringContaining('Docker template source not found'),
      );
    });
  });
});
