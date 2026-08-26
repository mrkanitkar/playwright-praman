#!/usr/bin/env tsx
/**
 * End-to-end smoke test for `npx playwright-praman init`.
 *
 * @remarks
 * Packs the package, installs the tarball into a throwaway empty directory, runs
 * `init` exactly as a new user would, and asserts that every artefact the
 * Getting Started guide promises actually appears.
 *
 * This exists because issue #224 shipped: `init` created a single file, printed
 * "Done!", and exited 0. Every unit test passed throughout, because none of them
 * ran the real command against the real packed artefact. Only an end-to-end
 * check over the published tarball catches that class of failure.
 *
 * Run with: `npm run smoke:init`
 */

import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');

/**
 * Artefacts the Getting Started guide promises, taken directly from the report
 * in issue #224. Paths are relative to the initialised project.
 */
const REQUIRED: readonly string[] = [
  '.gitignore',
  'tsconfig.json',
  'praman.config.ts',
  '.env.example',
  'tests/seeds/sap-seed.spec.ts',
  'praman-prompts',
  '.github/agents/praman-sap-planner.agent.md',
  '.github/agents/praman-sap-generator.agent.md',
  '.github/agents/praman-sap-healer.agent.md',
  '.github/skills/praman-sap-cli/SKILL.md',
  '.claude/agents/praman-sap-planner.md',
];

/** Runs a command, returning stdout and throwing on a non-zero exit. */
function run(cmd: string, args: readonly string[], cwd: string): string {
  return execFileSync(cmd, [...args], {
    cwd,
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
    shell: process.platform === 'win32',
  });
}

function main(): void {
  const workDir = mkdtempSync(join(tmpdir(), 'praman-smoke-'));
  const projectDir = join(workDir, 'project');

  try {
    console.log('Packing package...');
    const tarball = run('npm', ['pack', '--pack-destination', workDir], ROOT)
      .trim()
      .split('\n')
      .at(-1)
      ?.trim();
    if (tarball === undefined || tarball === '') {
      throw new Error('npm pack produced no tarball name');
    }

    console.log(`Installing ${tarball} into an empty project...`);
    mkdirSync(projectDir, { recursive: true });
    writeFileSync(
      join(projectDir, 'package.json'),
      '{\n  "name": "praman-smoke",\n  "private": true,\n  "version": "0.0.0"\n}\n',
      'utf8',
    );
    run(
      'npm',
      ['install', '--no-audit', '--no-fund', join(workDir, tarball), '@playwright/test'],
      projectDir,
    );

    console.log('Running init...');
    let initOut: string;
    try {
      initOut = run('npx', ['playwright-praman', 'init'], projectDir);
    } catch (error: unknown) {
      // init now exits non-zero when it cannot scaffold, so surface its own
      // output rather than a raw execFileSync dump.
      const asExec = error as { stdout?: string; stderr?: string };
      console.error('init exited non-zero:\n');
      console.error(asExec.stdout ?? '');
      console.error(asExec.stderr ?? String(error));
      process.exitCode = 1;
      return;
    }

    const missing = REQUIRED.filter((rel) => !existsSync(join(projectDir, rel)));

    if (missing.length > 0) {
      console.error(initOut);
      console.error('\ninit did not create the documented artefacts:\n');
      for (const rel of missing) console.error(`  MISSING  ${rel}`);
      process.exitCode = 1;
      return;
    }

    console.log(`\nOK: init created all ${String(REQUIRED.length)} documented artefacts.`);
  } finally {
    rmSync(workDir, { recursive: true, force: true });
  }
}

main();
