/**
 * @license
 * Copyright (c) ZesTest 2025-2030. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0
 *
 * This file may contain AI-assisted code.
 * See LICENSE and NOTICE files for details.
 */

/**
 * Tests for `src/cli/init-agents.ts` — lightweight agent installer command.
 *
 * @remarks
 * Mocks CLI dependencies (logger, version, ide-detector, ide-installer)
 * to verify that `runInitAgents` orchestrates IDE detection, agent
 * installation, and summary output correctly.
 *
 * @module cli/init-agents
 */

import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { IDEDetection } from '../../../src/cli/ide-detector.js';

// ── Mocks ───────────────────────────────────────────────────────────────────

vi.mock('../../../src/cli/logger.js', () => ({
  logBanner: vi.fn(),
  logStep: vi.fn(),
  logSection: vi.fn(),
  logSuccess: vi.fn(),
  logWarn: vi.fn(),
  logError: vi.fn(),
}));

vi.mock('../../../src/cli/version.js', () => ({
  getVersion: vi.fn(() => '1.0.0'),
}));

vi.mock('../../../src/cli/ide-detector.js', () => ({
  detectIDEs: vi.fn(),
  getIDELabels: vi.fn(),
}));

vi.mock('../../../src/cli/ide-installer.js', () => ({
  scaffoldIDEFiles: vi.fn(),
}));

const { logBanner, logSuccess, logWarn } = await import('../../../src/cli/logger.js');
const { detectIDEs, getIDELabels } = await import('../../../src/cli/ide-detector.js');
const { scaffoldIDEFiles } = await import('../../../src/cli/ide-installer.js');

const { runInitAgents, buildDetection, isValidLoop } =
  await import('../../../src/cli/init-agents.js');

const mockedLogBanner = vi.mocked(logBanner);
const mockedLogSuccess = vi.mocked(logSuccess);
const mockedLogWarn = vi.mocked(logWarn);
const mockedDetectIDEs = vi.mocked(detectIDEs);
const mockedGetIDELabels = vi.mocked(getIDELabels);
const mockedScaffoldIDEFiles = vi.mocked(scaffoldIDEFiles);

// ── Helpers ─────────────────────────────────────────────────────────────────

function makeDetection(overrides: Partial<IDEDetection> = {}): IDEDetection {
  return {
    vscode: false,
    claude: false,
    cursor: false,
    opencode: false,
    jules: false,
    copilot: false,
    ...overrides,
  };
}

const TARGET_DIR = '/test-project';

// ── Tests ───────────────────────────────────────────────────────────────────

describe('init-agents', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockedScaffoldIDEFiles.mockResolvedValue([]);
  });

  describe('runInitAgents', () => {
    it('should show banner with version', async () => {
      mockedDetectIDEs.mockReturnValue(makeDetection({ claude: true }));
      mockedGetIDELabels.mockReturnValue(['Claude Code']);
      mockedScaffoldIDEFiles.mockResolvedValue(['/test-project/.claude/agents/planner.md']);

      await runInitAgents({ targetDir: TARGET_DIR, loop: 'detect', force: false });

      expect(mockedLogBanner).toHaveBeenCalledWith('Praman Agent Installer', '1.0.0');
    });

    it('should auto-detect IDEs when loop is "detect"', async () => {
      const detection = makeDetection({ vscode: true });
      mockedDetectIDEs.mockReturnValue(detection);
      mockedGetIDELabels.mockReturnValue(['VS Code']);
      mockedScaffoldIDEFiles.mockResolvedValue(['/test-project/.vscode/settings.json']);

      await runInitAgents({ targetDir: TARGET_DIR, loop: 'detect', force: false });

      expect(mockedDetectIDEs).toHaveBeenCalledWith(TARGET_DIR);
      expect(mockedScaffoldIDEFiles).toHaveBeenCalledWith(TARGET_DIR, detection, false);
    });

    it('should build single-IDE detection when loop is specified', async () => {
      mockedScaffoldIDEFiles.mockResolvedValue(['/test-project/.claude/agents/planner.md']);

      await runInitAgents({ targetDir: TARGET_DIR, loop: 'claude', force: false });

      expect(mockedDetectIDEs).not.toHaveBeenCalled();
      expect(mockedScaffoldIDEFiles).toHaveBeenCalledWith(
        TARGET_DIR,
        expect.objectContaining({ claude: true, vscode: false, cursor: false }),
        false,
      );
    });

    it('should pass force flag through to scaffoldIDEFiles', async () => {
      mockedScaffoldIDEFiles.mockResolvedValue(['/test-project/.cursor/rules/praman.mdc']);

      await runInitAgents({ targetDir: TARGET_DIR, loop: 'cursor', force: true });

      expect(mockedScaffoldIDEFiles).toHaveBeenCalledWith(TARGET_DIR, expect.anything(), true);
    });

    it('should warn and return early when no IDEs detected', async () => {
      mockedDetectIDEs.mockReturnValue(makeDetection());
      mockedGetIDELabels.mockReturnValue([]);

      await runInitAgents({ targetDir: TARGET_DIR, loop: 'detect', force: false });

      expect(mockedLogWarn).toHaveBeenCalledWith(expect.stringContaining('No IDE markers'));
      expect(mockedScaffoldIDEFiles).not.toHaveBeenCalled();
    });

    it('should warn when no new files created', async () => {
      mockedScaffoldIDEFiles.mockResolvedValue([]);

      await runInitAgents({ targetDir: TARGET_DIR, loop: 'jules', force: false });

      expect(mockedLogWarn).toHaveBeenCalledWith(expect.stringContaining('No new files'));
    });

    it('should log created file count on success', async () => {
      mockedScaffoldIDEFiles.mockResolvedValue([
        '/test-project/.claude/agents/planner.md',
        '/test-project/.claude/agents/generator.md',
        '/test-project/.claude/agents/healer.md',
      ]);

      await runInitAgents({ targetDir: TARGET_DIR, loop: 'claude', force: false });

      expect(mockedLogSuccess).toHaveBeenCalledWith(expect.stringContaining('3 file(s)'));
    });
  });

  describe('buildDetection', () => {
    it('should enable only the specified IDE', () => {
      const result = buildDetection('claude');

      expect(result).toEqual({
        vscode: false,
        claude: true,
        cursor: false,
        opencode: false,
        jules: false,
        copilot: false,
      });
    });

    it('should enable vscode when loop is vscode', () => {
      const result = buildDetection('vscode');

      expect(result.vscode).toBe(true);
      expect(result.claude).toBe(false);
    });
  });

  describe('isValidLoop', () => {
    it('should accept all valid IDE names', () => {
      expect(isValidLoop('vscode')).toBe(true);
      expect(isValidLoop('claude')).toBe(true);
      expect(isValidLoop('cursor')).toBe(true);
      expect(isValidLoop('jules')).toBe(true);
      expect(isValidLoop('opencode')).toBe(true);
      expect(isValidLoop('copilot')).toBe(true);
      expect(isValidLoop('detect')).toBe(true);
    });

    it('should reject invalid values', () => {
      expect(isValidLoop('emacs')).toBe(false);
      expect(isValidLoop('vim')).toBe(false);
      expect(isValidLoop('')).toBe(false);
    });
  });
});
