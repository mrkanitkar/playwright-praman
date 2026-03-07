/**
 * @license
 * Copyright (c) ZesTest 2025-2030. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0
 *
 * This file may contain AI-assisted code.
 * See LICENSE and NOTICE files for details.
 */

/* eslint-disable max-lines -- per-IDE copy specs + 6 scaffold functions exceed 300 LOC */

/**
 * IDE-specific file installation for the Praman CLI `init` command.
 *
 * @remarks
 * Copies agent definitions, seed files, and IDE config snippets from the
 * installed `playwright-praman` package into the user's project directory,
 * based on which IDEs were detected by {@link detectIDEs}.
 *
 * Supports: Claude Code, VS Code, Cursor, Jules, OpenCode.
 * Cross-platform: uses `node:path` and `node:url` — no hardcoded separators.
 *
 * This file exceeds 300 LOC due to the per-IDE copy specs and multiple
 * scaffold functions (skills, seeds, auth, examples, prompts).
 *
 * @module cli/ide-installer
 */

import { access, copyFile, mkdir, readdir, readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

import type { IDEDetection } from './ide-detector.js';
import { logWarn } from './logger.js';
import { getPackageRoot } from './version.js';
import {
  scaffoldCopilotAgentFiles,
  scaffoldCopilotInstructions,
  scaffoldVSCodeFiles,
} from './vscode-copilot-installer.js';

/** Resolver for package-relative paths, passed to extracted modules. */
export type PkgPathFn = (...segments: readonly string[]) => string;
/** File-copy helper signature, passed to extracted modules. */
export type CopyIfMissingFn = (
  srcPath: string,
  destPath: string,
  force: boolean,
  created: string[],
) => Promise<void>;

// ── Package root resolution ───────────────────────────────────────────────────

/**
 * Resolves a path relative to the package root at runtime.
 *
 * @remarks
 * Delegates to {@link getPackageRoot} which walks up from `import.meta.url`
 * to find the `package.json` with `"name": "playwright-praman"`. This is
 * resilient to tsup chunk splitting where the CJS `import.meta.url` shim
 * may point to a chunk file instead of the CLI entry point.
 *
 * @param segments - Path segments relative to the package root.
 * @returns Absolute OS-native path.
 *
 * @example
 * ```typescript
 * pkgPath('agents', 'claude', 'praman-sap-planner.md')
 * // '.../node_modules/playwright-praman/agents/claude/praman-sap-planner.md'
 * ```
 */
function pkgPath(...segments: readonly string[]): string {
  return join(getPackageRoot(), ...segments);
}

// ── File copy spec ────────────────────────────────────────────────────────────

/**
 * A single file-copy operation: source (relative to package root) to
 * destination (relative to targetDir).
 */
interface FileCopySpec {
  /** Path segments from the package root to the source file. */
  readonly srcSegments: readonly string[];
  /** Path segments from targetDir to the destination file. */
  readonly destSegments: readonly string[];
}

/** Shared path segment for user-integration docs inside the package. */
const USER_INTEGRATION_DIR = 'user-integration';

// ── IDE installation specs ────────────────────────────────────────────────────

/**
 * IDE-specific install specs: directories to create and files to copy.
 *
 * @remarks
 * Keyed by {@link IDEDetection} property name. VS Code file content is
 * generated from in-memory templates and handled separately in
 * {@link scaffoldIDEFiles}.
 */
/** Shorthand factory for {@link FileCopySpec}. */
function fc(src: readonly string[], dest: readonly string[]): FileCopySpec {
  return { srcSegments: src, destSegments: dest };
}

interface IDESpec {
  readonly dirs: readonly (readonly string[])[];
  readonly files: readonly FileCopySpec[];
}
const IDE_COPY_SPECS: Readonly<Record<keyof IDEDetection, IDESpec>> = {
  claude: {
    dirs: [
      ['.claude', 'agents'],
      ['.claude', 'prompts'],
    ],
    files: [
      fc(
        ['agents', 'claude', 'praman-sap-planner.md'],
        ['.claude', 'agents', 'praman-sap-planner.md'],
      ),
      fc(
        ['agents', 'claude', 'praman-sap-generator.md'],
        ['.claude', 'agents', 'praman-sap-generator.md'],
      ),
      fc(
        ['agents', 'claude', 'praman-sap-healer.md'],
        ['.claude', 'agents', 'praman-sap-healer.md'],
      ),
      fc(
        ['agents', 'claude', 'prompts', 'praman-sap-plan.md'],
        ['.claude', 'prompts', 'praman-sap-plan.md'],
      ),
      fc(
        ['agents', 'claude', 'prompts', 'praman-sap-generate.md'],
        ['.claude', 'prompts', 'praman-sap-generate.md'],
      ),
      fc(
        ['agents', 'claude', 'prompts', 'praman-sap-heal.md'],
        ['.claude', 'prompts', 'praman-sap-heal.md'],
      ),
      fc(
        ['agents', 'claude', 'prompts', 'praman-sap-coverage.md'],
        ['.claude', 'prompts', 'praman-sap-coverage.md'],
      ),
    ],
  },
  cursor: {
    dirs: [['.cursor', 'rules']],
    files: [
      fc(
        ['docs', USER_INTEGRATION_DIR, 'cursor-rules-appendable.mdc'],
        ['.cursor', 'rules', 'praman.mdc'],
      ),
    ],
  },
  jules: {
    dirs: [],
    files: [
      fc(
        ['docs', USER_INTEGRATION_DIR, 'jules-setup-appendable.md'],
        ['.jules', 'praman-setup.md'],
      ),
    ],
  },
  vscode: { dirs: [['.vscode']], files: [] },
  opencode: { dirs: [], files: [] },
  copilot: {
    dirs: [['.github', 'agents']],
    files: [
      fc(
        ['agents', 'copilot', 'praman-sap-planner.agent.md'],
        ['.github', 'agents', 'praman-sap-planner.agent.md'],
      ),
      fc(
        ['agents', 'copilot', 'praman-sap-generator.agent.md'],
        ['.github', 'agents', 'praman-sap-generator.agent.md'],
      ),
      fc(
        ['agents', 'copilot', 'praman-sap-healer.agent.md'],
        ['.github', 'agents', 'praman-sap-healer.agent.md'],
      ),
    ],
  },
};

// ── Private helpers ───────────────────────────────────────────────────────────

/**
 * Copies `srcPath` to `destPath`, skipping if dest already exists and `force`
 * is `false`. Silently skips if the source file is missing (partial install).
 */
async function copyIfMissing(
  srcPath: string,
  destPath: string,
  force: boolean,
  created: string[],
): Promise<void> {
  if (!force) {
    try {
      await access(destPath);
      return; // file exists — skip
    } catch {
      // file does not exist — proceed to copy
    }
  }
  try {
    await access(srcPath);
  } catch {
    logWarn(`Scaffold source not found: ${srcPath}`);
    return;
  }
  try {
    await copyFile(srcPath, destPath);
    created.push(destPath);
  } catch {
    logWarn(`Failed to copy ${srcPath} → ${destPath}`);
  }
}

/**
 * Copies `srcPath` to `destPath` with backup-aware merge for config files.
 * If dest exists without `'auth-setup'` marker, backs up to `*.original.ts`.
 * Skips if marker present and `force` is `false`.
 */
async function copyOrBackupIfMissing(
  srcPath: string,
  destPath: string,
  force: boolean,
  created: string[],
): Promise<void> {
  let existing: string | undefined;
  try {
    // eslint-disable-next-line security/detect-non-literal-fs-filename -- destPath composed from targetDir + known constant path
    existing = await readFile(destPath, 'utf8');
  } catch {
    /* file does not exist */
  }

  if (existing !== undefined) {
    if (existing.includes('auth-setup') && !force) return;
    const backupPath = destPath.replace(/\.ts$/, '.original.ts');
    // eslint-disable-next-line security/detect-non-literal-fs-filename -- backupPath derived from destPath with known suffix
    await writeFile(backupPath, existing, 'utf8');
    logWarn(`Backed up existing config to ${backupPath}`);
    logWarn('Merge any custom settings from the backup into the new config');
  }
  try {
    await access(srcPath);
  } catch {
    logWarn(`Scaffold source not found: ${srcPath}`);
    return;
  }
  try {
    await copyFile(srcPath, destPath);
    created.push(destPath);
  } catch {
    logWarn(`Failed to copy ${srcPath} → ${destPath}`);
  }
}

// ── Skill files copy ──────────────────────────────────────────────────────────

/**
 * Copies the entire `skills/playwright-praman-sap-testing/` directory from the
 * package into the user's project. Skill files are needed by all AI-capable
 * IDEs (Claude, Copilot, Cursor, Jules, OpenCode) so agents can reference them.
 */
async function scaffoldSkillFiles(
  targetDir: string,
  force: boolean,
  created: string[],
): Promise<void> {
  const srcDir = pkgPath('skills', 'playwright-praman-sap-testing');
  const destDir = join(targetDir, 'skills', 'playwright-praman-sap-testing');

  // eslint-disable-next-line security/detect-non-literal-fs-filename -- destDir composed from targetDir + known constant path
  await mkdir(destDir, { recursive: true });

  let entries: string[];
  try {
    // eslint-disable-next-line security/detect-non-literal-fs-filename -- srcDir is resolved from package root + known constant path
    entries = await readdir(srcDir);
  } catch {
    logWarn(`Skills source directory not found: ${srcDir}`);
    return;
  }

  for (const entry of entries) {
    const srcPath = join(srcDir, entry);
    const destPath = join(destDir, entry);
    await copyIfMissing(srcPath, destPath, force, created);
  }
}

// ── Seed + auth setup file copies ────────────────────────────────────────────

/** Copies the SAP seed file into `tests/seeds/` for AI agent browser auth. */
async function scaffoldSeedFile(
  targetDir: string,
  force: boolean,
  created: string[],
): Promise<void> {
  const destDir = join(targetDir, 'tests', 'seeds');
  // eslint-disable-next-line security/detect-non-literal-fs-filename -- destDir composed from targetDir + known constant path
  await mkdir(destDir, { recursive: true });
  await copyIfMissing(
    pkgPath('seeds', 'sap-seed.spec.ts'),
    join(destDir, 'sap-seed.spec.ts'),
    force,
    created,
  );
}

/** Copies `examples/auth-setup.ts` into `tests/auth.setup.ts` for SAP login. */
async function scaffoldAuthSetupFile(
  targetDir: string,
  force: boolean,
  created: string[],
): Promise<void> {
  await copyIfMissing(
    pkgPath('examples', 'auth-setup.ts'),
    join(targetDir, 'tests', 'auth.setup.ts'),
    force,
    created,
  );
}

// ── Example and spec files copy ──────────────────────────────────────────────

/**
 * Copies the production-ready playwright config, gold-standard example test,
 * plan spec, and env template into the user's project. These serve as
 * reference examples for AI agents and manual test authoring.
 */
async function scaffoldExampleFiles(
  targetDir: string,
  force: boolean,
  created: string[],
): Promise<void> {
  // Playwright config → project root (production-ready with auth projects)
  // Uses backup-aware copy: if config exists without auth-setup, backs up original
  await copyOrBackupIfMissing(
    pkgPath('examples', 'playwright.config.ts'),
    join(targetDir, 'playwright.config.ts'),
    force,
    created,
  );

  // Gold-standard spec → tests/
  const testsDir = join(targetDir, 'tests');
  // eslint-disable-next-line security/detect-non-literal-fs-filename -- destDir composed from targetDir + known constant path
  await mkdir(testsDir, { recursive: true });
  await copyIfMissing(
    pkgPath('examples', 'bom-e2e-praman-gold-standard.spec.ts'),
    join(testsDir, 'bom-e2e-praman-gold-standard.spec.ts'),
    force,
    created,
  );

  // Plan spec → specs/
  const specsDir = join(targetDir, 'specs');
  // eslint-disable-next-line security/detect-non-literal-fs-filename -- destDir composed from targetDir + known constant path
  await mkdir(specsDir, { recursive: true });
  await copyIfMissing(
    pkgPath('specs', 'bom-create-complete.plan.md'),
    join(specsDir, 'bom-create-complete.plan.md'),
    force,
    created,
  );

  // .env.example → project root
  await copyIfMissing(pkgPath('.env.example'), join(targetDir, '.env.example'), force, created);
}

// ── Prompt files copy ─────────────────────────────────────────────────────────

/**
 * Copies the `prompts/` directory from the package into
 * `praman-prompts/` in the user's project root.
 *
 * @remarks
 * The `prompts/` directory MUST remain flat (no subdirectories).
 * `copyIfMissing()` operates on files only — subdirectories would be silently skipped.
 */
async function scaffoldPromptFiles(
  targetDir: string,
  force: boolean,
  created: string[],
): Promise<void> {
  const srcDir = pkgPath('prompts');
  const destDir = join(targetDir, 'praman-prompts');
  // eslint-disable-next-line security/detect-non-literal-fs-filename -- destDir composed from targetDir + known constant path
  await mkdir(destDir, { recursive: true });

  let entries: string[];
  try {
    // eslint-disable-next-line security/detect-non-literal-fs-filename -- srcDir is resolved from package root + known constant path
    entries = await readdir(srcDir);
  } catch {
    logWarn(`Prompts source directory not found: ${srcDir}`);
    return;
  }

  for (const entry of entries) {
    const srcPath = join(srcDir, entry);
    const destPath = join(destDir, entry);
    await copyIfMissing(srcPath, destPath, force, created);
  }
}

// ── Main export ───────────────────────────────────────────────────────────────

/**
 * Installs IDE-specific agent, seed, and config files for each detected IDE.
 *
 * @remarks
 * For each detected IDE, creates required directories and copies files from
 * the package's `agents/`, `seeds/`, and `docs/user-integration/` directories
 * into `targetDir`. Skips files that already exist unless `force` is `true`.
 * Silently skips source files that are not present (graceful degradation when
 * running via `npx` without a full install).
 *
 * @param targetDir - Absolute path to the user's project root.
 * @param detection - IDE detection result from {@link detectIDEs}.
 * @param force - When `true`, overwrite existing destination files.
 * @returns Absolute paths of files that were actually written.
 *
 * @example
 * ```typescript
 * import { scaffoldIDEFiles } from './ide-installer.js';
 *
 * const created = await scaffoldIDEFiles(
 *   '/home/user/project',
 *   { claude: true, vscode: true, cursor: false, opencode: false, jules: false },
 *   false,
 * );
 * console.log('Created:', created);
 * ```
 */
export async function scaffoldIDEFiles(
  targetDir: string,
  detection: IDEDetection,
  force: boolean,
): Promise<readonly string[]> {
  const created: string[] = [];

  for (const ideKey of Object.keys(IDE_COPY_SPECS) as (keyof IDEDetection)[]) {
    // eslint-disable-next-line security/detect-object-injection -- ideKey is a controlled key from Object.keys of a known const
    if (!detection[ideKey]) continue;

    // eslint-disable-next-line security/detect-object-injection -- ideKey is a controlled key from Object.keys of a known const
    const spec = IDE_COPY_SPECS[ideKey];

    // Create required directories
    for (const dirSegments of spec.dirs) {
      // eslint-disable-next-line security/detect-non-literal-fs-filename -- path composed from targetDir + known constant directory segments
      await mkdir(join(targetDir, ...dirSegments), { recursive: true });
    }

    // Copy source files from package root to destination
    for (const copySpec of spec.files) {
      const srcPath = pkgPath(...copySpec.srcSegments);
      const destPath = join(targetDir, ...copySpec.destSegments);
      await copyIfMissing(srcPath, destPath, force, created);
    }
  }

  // VS Code: write generated content (not package copies)
  if (detection.vscode) {
    await scaffoldVSCodeFiles(targetDir, force, created);
  }

  // VS Code implies Copilot — install agents + instructions even without explicit markers
  if (detection.vscode && !detection.copilot) {
    const copilotSpec = IDE_COPY_SPECS.copilot;
    await scaffoldCopilotAgentFiles(
      targetDir,
      copilotSpec.files,
      copilotSpec.dirs,
      pkgPath,
      force,
      created,
      copyIfMissing,
    );
  }

  // Copilot instructions: create or append for VS Code / Copilot users
  if (detection.vscode || detection.copilot) {
    await scaffoldCopilotInstructions(targetDir, pkgPath, force, created);
  }

  // Shared resources: needed by all AI-capable IDEs for agent references
  const needsSharedResources =
    detection.claude ||
    detection.copilot ||
    detection.cursor ||
    detection.jules ||
    detection.opencode ||
    detection.vscode;

  if (needsSharedResources) {
    await scaffoldSeedFile(targetDir, force, created);
    await scaffoldAuthSetupFile(targetDir, force, created);
    await scaffoldSkillFiles(targetDir, force, created);
    await scaffoldExampleFiles(targetDir, force, created);
    await scaffoldPromptFiles(targetDir, force, created);
  }

  return created;
}
