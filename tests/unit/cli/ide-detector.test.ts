/**
 * @license
 * Copyright (c) ZesTest 2025-2030. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0
 *
 * This file may contain AI-assisted code.
 * See LICENSE and NOTICE files for details.
 */

/**
 * Tests for `src/cli/ide-detector.ts` — IDE detection by marker files.
 *
 * @remarks
 * Mocks `node:fs` `existsSync` to exercise marker-file detection without
 * touching the real file system. Mocks `process.env` to cover the
 * `TERM_PROGRAM=vscode` fallback path.
 *
 * @module cli
 */
import { join } from 'node:path';

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('node:fs', () => ({
  existsSync: vi.fn().mockReturnValue(false),
}));

const { existsSync } = await import('node:fs');
const mockExistsSync = vi.mocked(existsSync);

const { detectIDEs, getIDELabels } = await import('../../../src/cli/ide-detector.js');

describe('detectIDEs', () => {
  beforeEach(() => {
    mockExistsSync.mockReturnValue(false);
    vi.unstubAllEnvs();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('detects VS Code when .vscode directory marker exists', () => {
    mockExistsSync.mockImplementation(
      (p: unknown) => typeof p === 'string' && p.endsWith('.vscode'),
    );

    const result = detectIDEs('/project');

    expect(result.vscode).toBe(true);
    expect(result.claude).toBe(false);
    expect(result.cursor).toBe(false);
    expect(result.opencode).toBe(false);
    expect(result.jules).toBe(false);
  });

  it('detects Claude Code when CLAUDE.md file exists', () => {
    mockExistsSync.mockImplementation(
      (p: unknown) => typeof p === 'string' && p.endsWith('CLAUDE.md'),
    );

    const result = detectIDEs('/project');

    expect(result.claude).toBe(true);
    expect(result.vscode).toBe(false);
    expect(result.cursor).toBe(false);
    expect(result.opencode).toBe(false);
    expect(result.jules).toBe(false);
  });

  it('detects Cursor when .cursor directory marker exists', () => {
    mockExistsSync.mockImplementation(
      (p: unknown) => typeof p === 'string' && p.endsWith('.cursor'),
    );

    const result = detectIDEs('/project');

    expect(result.cursor).toBe(true);
    expect(result.vscode).toBe(false);
    expect(result.claude).toBe(false);
  });

  it('detects Cursor when .cursorrc file exists', () => {
    mockExistsSync.mockImplementation(
      (p: unknown) => typeof p === 'string' && p.endsWith('.cursorrc'),
    );

    const result = detectIDEs('/project');

    expect(result.cursor).toBe(true);
  });

  it('detects OpenCode when .opencode directory marker exists', () => {
    mockExistsSync.mockImplementation(
      (p: unknown) => typeof p === 'string' && p.endsWith('.opencode'),
    );

    const result = detectIDEs('/project');

    expect(result.opencode).toBe(true);
    expect(result.vscode).toBe(false);
    expect(result.claude).toBe(false);
    expect(result.cursor).toBe(false);
    expect(result.jules).toBe(false);
  });

  it('detects Jules when .jules directory marker exists', () => {
    mockExistsSync.mockImplementation(
      (p: unknown) => typeof p === 'string' && p.endsWith('.jules'),
    );

    const result = detectIDEs('/project');

    expect(result.jules).toBe(true);
    expect(result.vscode).toBe(false);
    expect(result.claude).toBe(false);
    expect(result.cursor).toBe(false);
    expect(result.opencode).toBe(false);
  });

  it('returns all false when no marker files are found', () => {
    mockExistsSync.mockReturnValue(false);

    const result = detectIDEs('/project');

    expect(result.vscode).toBe(false);
    expect(result.claude).toBe(false);
    expect(result.cursor).toBe(false);
    expect(result.opencode).toBe(false);
    expect(result.jules).toBe(false);
  });

  it('detects VS Code via TERM_PROGRAM env var fallback when no .vscode marker', () => {
    mockExistsSync.mockReturnValue(false);
    vi.stubEnv('TERM_PROGRAM', 'vscode');

    const result = detectIDEs('/project');

    expect(result.vscode).toBe(true);
    expect(result.claude).toBe(false);
  });

  it('does not activate VS Code env fallback for other TERM_PROGRAM values', () => {
    mockExistsSync.mockReturnValue(false);
    vi.stubEnv('TERM_PROGRAM', 'iTerm.app');

    const result = detectIDEs('/project');

    expect(result.vscode).toBe(false);
  });

  it('detects multiple IDEs simultaneously', () => {
    mockExistsSync.mockImplementation((p: unknown) => {
      if (typeof p !== 'string') return false;
      return p.endsWith('.vscode') || p.endsWith('CLAUDE.md') || p.endsWith('.jules');
    });

    const result = detectIDEs('/project');

    expect(result.vscode).toBe(true);
    expect(result.claude).toBe(true);
    expect(result.jules).toBe(true);
    expect(result.cursor).toBe(false);
    expect(result.opencode).toBe(false);
  });

  it('passes the correct joined path to existsSync', () => {
    mockExistsSync.mockReturnValue(false);

    const testProjectDir = join('/my', 'project');
    detectIDEs(testProjectDir);

    const calledPaths = mockExistsSync.mock.calls.map((call) => call[0] as string);
    expect(calledPaths.some((p) => p.includes(testProjectDir))).toBe(true);
  });
});

describe('getIDELabels', () => {
  it('returns labels for all detected IDEs', () => {
    const detection = {
      vscode: true,
      claude: true,
      cursor: false,
      opencode: false,
      jules: false,
      copilot: false,
    };

    const labels = getIDELabels(detection);

    expect(labels).toEqual(['VS Code', 'Claude Code']);
  });

  it('returns an empty array when nothing is detected', () => {
    const detection = {
      vscode: false,
      claude: false,
      cursor: false,
      opencode: false,
      jules: false,
      copilot: false,
    };

    const labels = getIDELabels(detection);

    expect(labels).toHaveLength(0);
    expect(labels).toEqual([]);
  });

  it('returns a single label when one IDE is detected', () => {
    const detection = {
      vscode: false,
      claude: false,
      cursor: true,
      opencode: false,
      jules: false,
      copilot: false,
    };

    const labels = getIDELabels(detection);

    expect(labels).toEqual(['Cursor']);
  });

  it('returns labels for all six IDEs when all are detected', () => {
    const detection = {
      vscode: true,
      claude: true,
      cursor: true,
      opencode: true,
      jules: true,
      copilot: true,
    };

    const labels = getIDELabels(detection);

    expect(labels).toHaveLength(6);
    expect(labels).toContain('VS Code');
    expect(labels).toContain('Claude Code');
    expect(labels).toContain('Cursor');
    expect(labels).toContain('OpenCode');
    expect(labels).toContain('Jules');
    expect(labels).toContain('GitHub Copilot');
  });

  it('returns a readonly array', () => {
    const detection = {
      vscode: true,
      claude: false,
      cursor: false,
      opencode: false,
      jules: false,
      copilot: false,
    };

    const labels = getIDELabels(detection);

    // The return type is readonly string[] — verify it is a plain array at runtime
    expect(Array.isArray(labels)).toBe(true);
  });
});
