/**
 * @license
 * Copyright (c) ZesTest 2025-2030. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0
 *
 * This file may contain AI-assisted code.
 * See LICENSE and NOTICE files for details.
 */

/**
 * Tests for `src/cli/ide-installer.ts` — playwright.config.ts backup behavior.
 *
 * @remarks
 * Mocks `node:fs/promises` and the logger to verify that `scaffoldIDEFiles()`
 * backs up an existing playwright.config.ts when it lacks Praman auth config,
 * and skips when the marker is already present.
 *
 * @module cli/ide-installer
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

const { logWarn } = await import('../../../src/cli/logger.js');
const { scaffoldIDEFiles } = await import('../../../src/cli/ide-installer.js');

/** Safe non-tmp test path. */
const TEST_DIR = join('/home', 'testuser', 'project');

/** Detection that enables shared resources (triggers scaffoldExampleFiles). */
const CLAUDE_DETECTION = {
  claude: true,
  vscode: false,
  cursor: false,
  opencode: false,
  jules: false,
  copilot: false,
};

/** Praman config content that contains the auth-setup marker. */
const PRAMAN_CONFIG = `import 'dotenv/config';
import { defineConfig } from '@playwright/test';

export default defineConfig({
  projects: [
    { name: 'auth-setup', testMatch: '**/auth.setup.ts' },
    { name: 'chromium', dependencies: ['auth-setup'] },
  ],
});
`;

/** A bare playwright config without Praman auth setup. */
const BARE_CONFIG = `import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  use: { ...devices['Desktop Chrome'] },
});
`;

// ── Tests ───────────────────────────────────────────────────────────────────

describe('cli/ide-installer — playwright.config.ts backup', () => {
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

  it('copies config normally when no existing config exists', async () => {
    // Seed the package source file so copyFile can find it
    // The pkgPath resolver won't find real files, so copyFile mock will reject → silent skip
    // Instead, we just verify no backup is created and logWarn is NOT called with backup message
    await scaffoldIDEFiles(TEST_DIR, CLAUDE_DETECTION, false);

    const backupPath = join(TEST_DIR, 'playwright.config.original.ts');
    expect(mockFs.written.has(backupPath)).toBe(false);
    expect(logWarn).not.toHaveBeenCalledWith(expect.stringContaining('Backed up'));
  });

  it('backs up existing config when it lacks auth-setup marker', async () => {
    // Pre-populate the destination config file (bare, no auth-setup)
    const configPath = join(TEST_DIR, 'playwright.config.ts');
    mockFs.files.set(configPath, BARE_CONFIG);

    await scaffoldIDEFiles(TEST_DIR, CLAUDE_DETECTION, false);

    const backupPath = join(TEST_DIR, 'playwright.config.original.ts');
    expect(mockFs.written.has(backupPath)).toBe(true);
    expect(mockFs.written.get(backupPath)).toBe(BARE_CONFIG);
    expect(logWarn).toHaveBeenCalledWith(expect.stringContaining('Backed up'));
    expect(logWarn).toHaveBeenCalledWith(expect.stringContaining('Merge any custom settings'));
  });

  it('skips backup when existing config already has auth-setup marker', async () => {
    const configPath = join(TEST_DIR, 'playwright.config.ts');
    mockFs.files.set(configPath, PRAMAN_CONFIG);

    await scaffoldIDEFiles(TEST_DIR, CLAUDE_DETECTION, false);

    const backupPath = join(TEST_DIR, 'playwright.config.original.ts');
    expect(mockFs.written.has(backupPath)).toBe(false);
    expect(logWarn).not.toHaveBeenCalledWith(expect.stringContaining('Backed up'));
  });

  it('backs up and replaces when force=true even if marker is present', async () => {
    const configPath = join(TEST_DIR, 'playwright.config.ts');
    mockFs.files.set(configPath, PRAMAN_CONFIG);

    await scaffoldIDEFiles(TEST_DIR, CLAUDE_DETECTION, true);

    const backupPath = join(TEST_DIR, 'playwright.config.original.ts');
    expect(mockFs.written.has(backupPath)).toBe(true);
    expect(mockFs.written.get(backupPath)).toBe(PRAMAN_CONFIG);
  });
});
