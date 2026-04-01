/**
 * @license
 * Copyright (c) ZesTest 2025-2030. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0
 *
 * This file may contain AI-assisted code.
 * See LICENSE and NOTICE files for details.
 */

/**
 * Tests for `src/cli/program.ts` — `--no-cli` flag parsing.
 *
 * @remarks
 * Verifies that the `--no-cli` option is correctly parsed by the `init` and
 * `init-agents` Commander commands, and that `cli` defaults to `true` when
 * the flag is omitted (CLI agents are installed by default).
 *
 * Uses `createProgram()` factory per test with `exitOverride()` and
 * `configureOutput()` for test isolation.
 *
 * @module cli/program-cli
 */

import process from 'node:process';

import type { Command } from 'commander';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// ── Mocks ───────────────────────────────────────────────────────────────────

vi.mock('../../../src/cli/init.js', () => ({
  runInit: vi.fn().mockResolvedValue(undefined),
}));

vi.mock('../../../src/cli/init-agents.js', () => ({
  runInitAgents: vi.fn().mockResolvedValue(undefined),
  isValidLoop: vi.fn().mockReturnValue(true),
}));

vi.mock('../../../src/cli/doctor.js', () => ({
  runDoctor: vi.fn(),
}));

vi.mock('../../../src/cli/uninstall.js', () => ({
  runUninstall: vi.fn().mockResolvedValue(undefined),
}));

vi.mock('../../../src/cli/config-show.js', () => ({
  runConfigShow: vi.fn().mockResolvedValue(undefined),
}));

vi.mock('../../../src/cli/version.js', () => ({
  getVersion: vi.fn().mockReturnValue('1.0.0'),
}));

vi.mock('../../../src/cli/logger.js', () => ({
  logBanner: vi.fn(),
  logError: vi.fn(),
  logStep: vi.fn(),
  logSuccess: vi.fn(),
  logWarn: vi.fn(),
  logSection: vi.fn(),
  logTable: vi.fn(),
}));

const { runInit } = await import('../../../src/cli/init.js');
const { runInitAgents } = await import('../../../src/cli/init-agents.js');

const mockedRunInit = vi.mocked(runInit);
const mockedRunInitAgents = vi.mocked(runInitAgents);

// ── Helpers ─────────────────────────────────────────────────────────────────

let prog: Command;

/** Silences Commander output during tests. */
const outputConfig = {
  writeOut: () => {
    /* suppress stdout */
  },
  writeErr: () => {
    /* suppress stderr */
  },
};

/** Creates a fresh Commander program with output capture and exit override. */
async function createTestProgram(): Promise<Command> {
  const { createProgram } = await import('../../../src/cli/program.js');
  const p = createProgram();
  p.exitOverride();
  p.configureOutput(outputConfig);
  // Commander 14 does not propagate configureOutput to subcommands
  for (const cmd of p.commands) {
    cmd.exitOverride();
    cmd.configureOutput(outputConfig);
  }
  return p;
}

// ── Tests ───────────────────────────────────────────────────────────────────

describe('cli/program — --no-cli flag parsing', () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    process.exitCode = undefined;
    prog = await createTestProgram();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    process.exitCode = undefined;
  });

  it('init without --no-cli defaults cli to true', async () => {
    await prog.parseAsync(['init'], { from: 'user' });

    expect(mockedRunInit).toHaveBeenCalledOnce();
    expect(mockedRunInit).toHaveBeenCalledWith(expect.objectContaining({ cli: true }));
  });

  it('init --no-cli sets cli: false in parsed options', async () => {
    await prog.parseAsync(['init', '--no-cli'], { from: 'user' });

    expect(mockedRunInit).toHaveBeenCalledOnce();
    expect(mockedRunInit).toHaveBeenCalledWith(expect.objectContaining({ cli: false }));
  });

  it('init-agents without --no-cli defaults cli to true', async () => {
    await prog.parseAsync(['init-agents'], { from: 'user' });

    expect(mockedRunInitAgents).toHaveBeenCalledOnce();
    expect(mockedRunInitAgents).toHaveBeenCalledWith(expect.objectContaining({ cli: true }));
  });

  it('init-agents --no-cli sets cli: false in parsed options', async () => {
    await prog.parseAsync(['init-agents', '--no-cli'], { from: 'user' });

    expect(mockedRunInitAgents).toHaveBeenCalledOnce();
    expect(mockedRunInitAgents).toHaveBeenCalledWith(expect.objectContaining({ cli: false }));
  });
});
