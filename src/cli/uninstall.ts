/**
 * @license
 * Copyright (c) ZesTest 2025-2030. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0
 *
 * This file may contain AI-assisted code.
 * See LICENSE and NOTICE files for details.
 */

/**
 * Uninstall command — removes scaffolded files from the project.
 *
 * @remarks
 * Dry-run by default. Requires `--confirm` flag to execute actual removal.
 * Protected files (`.env`, `tests/`, `node_modules/`, `package.json`) are NEVER removed.
 * Optionally removes Playwright browsers with `--remove-browsers`.
 *
 * @module cli/uninstall
 */

import { execSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { readdir, rm, rmdir, unlink } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import process from 'node:process';
import { createInterface } from 'node:readline';

import { logSection, logStep, logSuccess, logWarn } from './logger.js';

/**
 * Options controlling the uninstall behavior.
 *
 * @example
 * ```typescript
 * const options: UninstallOptions = {
 *   targetDir: '/home/user/my-sap-tests',
 *   confirm: false, keepConfig: false, keepAgents: false, removeBrowsers: false,
 * };
 * ```
 */
export interface UninstallOptions {
  /** Absolute path to the project directory. */
  readonly targetDir: string;
  /** When `true`, actually remove files. Dry-run when `false`. */
  readonly confirm: boolean;
  /** When `true`, keep config category files. */
  readonly keepConfig: boolean;
  /** When `true`, keep agent category files. */
  readonly keepAgents: boolean;
  /** When `true`, uninstall Playwright browsers after file removal. */
  readonly removeBrowsers: boolean;
}

/**
 * Describes a scaffolded file that is a candidate for removal.
 *
 * @example
 * ```typescript
 * const entry: FileEntry = { relativePath: 'playwright.config.ts', category: 'config', label: 'Playwright config' };
 * ```
 */
export interface FileEntry {
  /** Path relative to the project root. */
  readonly relativePath: string;
  /** Category of the scaffolded file. */
  readonly category: 'agent' | 'ide' | 'skill' | 'seed' | 'config';
  /** Human-readable label for display. */
  readonly label: string;
}

/** Full manifest of scaffolded files that may be removed. */
const SCAFFOLDED_MANIFEST: readonly FileEntry[] = [
  // config — created by scaffolder.ts
  { relativePath: 'playwright.config.ts', category: 'config', label: 'Playwright config' },
  { relativePath: 'praman.config.ts', category: 'config', label: 'Praman config' },
  { relativePath: 'tsconfig.json', category: 'config', label: 'TypeScript config' },

  // agent — Claude Code
  {
    relativePath: '.claude/agents/praman-sap-planner.md',
    category: 'agent',
    label: 'Claude planner agent',
  },
  {
    relativePath: '.claude/agents/praman-sap-generator.md',
    category: 'agent',
    label: 'Claude generator agent',
  },
  {
    relativePath: '.claude/agents/praman-sap-healer.md',
    category: 'agent',
    label: 'Claude healer agent',
  },
  {
    relativePath: '.claude/prompts/praman-sap-plan.md',
    category: 'agent',
    label: 'Claude plan prompt',
  },
  {
    relativePath: '.claude/prompts/praman-sap-generate.md',
    category: 'agent',
    label: 'Claude generate prompt',
  },
  {
    relativePath: '.claude/prompts/praman-sap-heal.md',
    category: 'agent',
    label: 'Claude heal prompt',
  },
  {
    relativePath: '.claude/prompts/praman-sap-coverage.md',
    category: 'agent',
    label: 'Claude coverage prompt',
  },

  // agent — Copilot
  {
    relativePath: '.github/agents/praman-sap-planner.agent.md',
    category: 'agent',
    label: 'Copilot planner agent',
  },
  {
    relativePath: '.github/agents/praman-sap-generator.agent.md',
    category: 'agent',
    label: 'Copilot generator agent',
  },
  {
    relativePath: '.github/agents/praman-sap-healer.agent.md',
    category: 'agent',
    label: 'Copilot healer agent',
  },
  {
    relativePath: '.github/copilot-instructions.md',
    category: 'agent',
    label: 'Copilot instructions',
  },

  // ide
  { relativePath: '.vscode/settings.json', category: 'ide', label: 'VS Code settings' },
  { relativePath: '.vscode/extensions.json', category: 'ide', label: 'VS Code extensions' },
  { relativePath: '.vscode/praman.code-snippets', category: 'ide', label: 'VS Code snippets' },
  { relativePath: '.cursor/rules/praman.mdc', category: 'ide', label: 'Cursor rules' },
  { relativePath: '.jules/praman-setup.md', category: 'ide', label: 'Jules setup' },

  // skill — entire directory handled via removeDirectory
  {
    relativePath: 'skills/playwright-praman-sap-testing/',
    category: 'skill',
    label: 'Praman skill files',
  },

  // seed
  { relativePath: 'tests/seeds/sap-seed.spec.ts', category: 'seed', label: 'SAP seed file' },
  { relativePath: 'tests/auth.setup.ts', category: 'seed', label: 'SAP auth setup' },

  // examples
  {
    relativePath: 'tests/bom-e2e-praman-gold-standard.spec.ts',
    category: 'seed',
    label: 'Gold-standard example',
  },
  {
    relativePath: 'specs/bom-create-complete.plan.md',
    category: 'seed',
    label: 'Example plan spec',
  },
  { relativePath: '.env.example', category: 'config', label: 'Environment template' },
  { relativePath: '.gitignore', category: 'config', label: 'Git ignore rules' },
];

/** Category display labels for grouped output. */
const CATEGORY_LABELS: Readonly<Record<FileEntry['category'], string>> = {
  config: 'Configuration',
  agent: 'AI Agent Files',
  ide: 'IDE Settings',
  skill: 'Skill Files',
  seed: 'Seed Tests',
};

/**
 * Parses CLI arguments into {@link UninstallOptions}.
 *
 * @param argv - Raw CLI argument array (e.g., `process.argv.slice(2)`).
 * @returns Parsed options with defaults applied.
 *
 * @example
 * ```typescript
 * const opts = parseUninstallArgs(['--confirm', '--keep-config']);
 * // opts.confirm === true, opts.keepConfig === true
 * ```
 */
export function parseUninstallArgs(argv: readonly string[]): UninstallOptions {
  let targetDir = process.cwd();
  let confirm = false;
  let keepConfig = false;
  let keepAgents = false;
  let removeBrowsers = false;

  const flagSet = new Set(argv);
  confirm = flagSet.has('--confirm');
  keepConfig = flagSet.has('--keep-config');
  keepAgents = flagSet.has('--keep-agents');
  removeBrowsers = flagSet.has('--remove-browsers');

  const targetIndex = argv.indexOf('--target');
  if (targetIndex !== -1) {
    const next = argv[targetIndex + 1];
    if (next !== undefined) {
      targetDir = next;
    }
  }

  return { targetDir, confirm, keepConfig, keepAgents, removeBrowsers };
}

/**
 * Returns the list of scaffolded files that exist in the target directory.
 *
 * @remarks
 * Filters the manifest by existence on disk and by the `keepConfig` /
 * `keepAgents` options. Results are sorted alphabetically by relative path.
 *
 * @param targetDir - Absolute path to the project root.
 * @param options - Uninstall options controlling category filtering.
 * @returns Sorted array of {@link FileEntry} objects for files that exist.
 *
 * @example
 * ```typescript
 * const files = getScaffoldedFiles('/home/user/project', {
 *   targetDir: '/home/user/project',
 *   confirm: false,
 *   keepConfig: true,
 *   keepAgents: false,
 *   removeBrowsers: false,
 * });
 * ```
 */
export function getScaffoldedFiles(
  targetDir: string,
  options: UninstallOptions,
): readonly FileEntry[] {
  const candidates = SCAFFOLDED_MANIFEST.filter((entry) => {
    if (options.keepConfig && entry.category === 'config') return false;
    if (options.keepAgents && entry.category === 'agent') return false;
    return true;
  }).filter((entry) => {
    const fullPath = join(targetDir, entry.relativePath);
    // eslint-disable-next-line security/detect-non-literal-fs-filename -- path composed from targetDir + known manifest paths
    return existsSync(fullPath);
  });

  return candidates.sort((a, b) => a.relativePath.localeCompare(b.relativePath));
}

/** Displays the file manifest grouped by category. */
function displayManifest(files: readonly FileEntry[]): void {
  const categories = new Set(files.map((f) => f.category));
  const totalFiles = files.length;
  let stepIndex = 0;

  for (const category of categories) {
    const categoryFiles = files.filter((f) => f.category === category);
    // eslint-disable-next-line security/detect-object-injection -- category is from FileEntry union type, not user input
    logSection(CATEGORY_LABELS[category]);
    for (const file of categoryFiles) {
      stepIndex++;
      logStep(stepIndex, totalFiles, file.relativePath);
    }
  }
}

/** Removes files/directories and cleans empty parent directories. Returns count removed. */
async function removeFiles(files: readonly FileEntry[], targetDir: string): Promise<number> {
  const dirsToCheck = new Set<string>();
  let removed = 0;

  for (const file of files) {
    const isDir = file.relativePath.endsWith('/');
    const fullPath = join(targetDir, file.relativePath);
    try {
      if (isDir) {
        await rm(fullPath, { recursive: true, force: true });
      } else {
        // eslint-disable-next-line security/detect-non-literal-fs-filename -- path composed from targetDir + known manifest paths
        await unlink(fullPath);
      }
      removed++;
      dirsToCheck.add(dirname(fullPath));
    } catch {
      logWarn(`Could not remove: ${file.relativePath}`);
    }
  }

  await cleanEmptyDirs(dirsToCheck, targetDir);
  return removed;
}

/** Removes empty directories bottom-up, walking parent chain up to targetDir. */
async function cleanEmptyDirs(dirs: ReadonlySet<string>, targetDir: string): Promise<void> {
  const visited = new Set<string>();
  const sortedDirs = [...dirs].sort((a, b) => b.length - a.length);

  for (const startDir of sortedDirs) {
    let dir = startDir;
    while (dir !== targetDir && dir.startsWith(targetDir) && !visited.has(dir)) {
      visited.add(dir);
      try {
        // eslint-disable-next-line security/detect-non-literal-fs-filename -- path derived from targetDir + dirname of known manifest paths
        const entries = await readdir(dir);
        if (entries.length === 0) {
          // eslint-disable-next-line security/detect-non-literal-fs-filename -- empty directory inside targetDir
          await rmdir(dir);
          dir = dirname(dir);
        } else {
          break;
        }
      } catch {
        break;
      }
    }
  }
}

/** Prompts the user for yes/no confirmation via stdin. */
async function promptConfirm(message: string): Promise<boolean> {
  const rl = createInterface({ input: process.stdin, output: process.stdout });
  return new Promise((resolve) => {
    rl.question(`${message} (y/N) `, (answer) => {
      rl.close();
      resolve(answer.trim().toLowerCase() === 'y');
    });
  });
}

/** Attempts to uninstall Playwright browsers via npx. */
function removeBrowsersCmd(): void {
  try {
    // eslint-disable-next-line sonarjs/no-os-command-from-path -- intentional: Playwright CLI browser removal via npx
    execSync('npx playwright uninstall --all', { stdio: 'inherit' });
    logSuccess('Playwright browsers removed.');
  } catch {
    logWarn('Failed to remove Playwright browsers.');
  }
}

/** Runs `npm uninstall playwright-praman` to remove the package. */
function uninstallPackage(targetDir: string): void {
  try {
    // eslint-disable-next-line sonarjs/no-os-command-from-path -- intentional: npm uninstall via CLI
    execSync('npm uninstall playwright-praman', { cwd: targetDir, stdio: 'inherit' });
    logSuccess('playwright-praman package removed.');
  } catch {
    logWarn('Failed to uninstall playwright-praman package.');
  }
}

/**
 * Executes the uninstall command, removing scaffolded files from the project.
 *
 * @remarks
 * Lists what will be removed and prompts the user for confirmation.
 * With `--confirm`, skips the interactive prompt.
 * With `--remove-browsers`, also runs `npx playwright uninstall --all`.
 * Always runs `npm uninstall playwright-praman` after file removal.
 *
 * @param options - Uninstall configuration.
 *
 * @example
 * ```typescript
 * await runUninstall({
 *   targetDir: '/home/user/project',
 *   confirm: true,
 *   keepConfig: false,
 *   keepAgents: false,
 *   removeBrowsers: false,
 * });
 * ```
 */
export async function runUninstall(options: UninstallOptions): Promise<void> {
  const files = getScaffoldedFiles(options.targetDir, options);

  if (files.length === 0) {
    logWarn('No scaffolded files found to remove.');
    return;
  }

  displayManifest(files);

  // Interactive confirmation unless --confirm flag is set
  if (!options.confirm) {
    logWarn(`This will remove ${String(files.length)} file(s) and uninstall playwright-praman.`);
    const approved = await promptConfirm('Proceed with removal?');
    if (!approved) {
      logWarn('Aborted. No files were removed.');
      return;
    }
  }

  const removed = await removeFiles(files, options.targetDir);

  if (options.removeBrowsers) {
    removeBrowsersCmd();
  }

  uninstallPackage(options.targetDir);
  logSuccess(`Removed ${String(removed)} of ${String(files.length)} scaffolded file(s).`);
}
