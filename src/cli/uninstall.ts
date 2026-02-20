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
import { readdir, rmdir, unlink } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import process from 'node:process';

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
  readonly category: 'agent' | 'ide' | 'skill' | 'seed' | 'config' | 'vocabulary';
  /** Human-readable label for display. */
  readonly label: string;
}

/** Full manifest of scaffolded files that may be removed. */
const SCAFFOLDED_MANIFEST: readonly FileEntry[] = [
  // config
  { relativePath: 'playwright.config.ts', category: 'config', label: 'Playwright config' },
  { relativePath: 'praman.config.ts', category: 'config', label: 'Praman config' },
  { relativePath: 'tsconfig.json', category: 'config', label: 'TypeScript config' },
  // agent
  {
    relativePath: '.github/copilot-instructions.md',
    category: 'agent',
    label: 'Copilot instructions',
  },
  { relativePath: 'AGENTS.md', category: 'agent', label: 'OpenAI Agents config' },
  { relativePath: 'CLAUDE.md', category: 'agent', label: 'Claude Code config' },
  // ide
  { relativePath: '.vscode/extensions.json', category: 'ide', label: 'VS Code extensions' },
  { relativePath: '.cursor/rules/', category: 'ide', label: 'Cursor rules' },
  { relativePath: '.jules/setup.md', category: 'ide', label: 'Jules setup' },
  // skill
  { relativePath: '.github/skills/', category: 'skill', label: 'GitHub skills' },
  // seed
  { relativePath: 'tests/example.spec.ts', category: 'seed', label: 'Example test seed' },
  // vocabulary
  { relativePath: 'vocabulary/', category: 'vocabulary', label: 'Vocabulary JSON files' },
];

/** Category display labels for grouped output. */
const CATEGORY_LABELS: Readonly<Record<FileEntry['category'], string>> = {
  config: 'Configuration',
  agent: 'AI Agent Files',
  ide: 'IDE Settings',
  skill: 'Skill Files',
  seed: 'Seed Tests',
  vocabulary: 'Vocabulary',
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

/** Removes files and cleans empty parent directories. Returns count of removed files. */
async function removeFiles(files: readonly FileEntry[], targetDir: string): Promise<number> {
  const dirsToCheck = new Set<string>();
  let removed = 0;

  for (const file of files) {
    const fullPath = join(targetDir, file.relativePath);
    try {
      // eslint-disable-next-line security/detect-non-literal-fs-filename -- path composed from targetDir + known manifest paths
      await unlink(fullPath);
      removed++;
      dirsToCheck.add(dirname(fullPath));
    } catch {
      logWarn(`Could not remove: ${file.relativePath}`);
    }
  }

  await cleanEmptyDirs(dirsToCheck, targetDir);
  return removed;
}

/** Removes empty directories bottom-up, stopping at targetDir. */
async function cleanEmptyDirs(dirs: ReadonlySet<string>, targetDir: string): Promise<void> {
  const sortedDirs = [...dirs].sort((a, b) => b.length - a.length);
  for (const dir of sortedDirs) {
    if (dir === targetDir || !dir.startsWith(targetDir)) {
      continue;
    }
    try {
      // eslint-disable-next-line security/detect-non-literal-fs-filename -- path derived from targetDir + dirname of known manifest paths
      const entries = await readdir(dir);
      if (entries.length === 0) {
        // eslint-disable-next-line security/detect-non-literal-fs-filename -- empty directory inside targetDir
        await rmdir(dir);
      }
    } catch {
      // Directory may already be removed or inaccessible — skip silently
    }
  }
}

/** Attempts to uninstall Playwright browsers via npx. */
function removeBrowsers(): void {
  try {
    // eslint-disable-next-line sonarjs/no-os-command-from-path -- intentional: Playwright CLI browser removal via npx
    execSync('npx playwright uninstall --all', { stdio: 'inherit' });
    logSuccess('Playwright browsers removed.');
  } catch {
    logWarn('Failed to remove Playwright browsers.');
  }
}

/**
 * Executes the uninstall command, removing scaffolded files from the project.
 *
 * @remarks
 * In dry-run mode (default), lists what would be removed without deleting.
 * With `--confirm`, deletes files and cleans up empty parent directories.
 * With `--remove-browsers`, also runs `npx playwright uninstall --all`.
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

  if (!options.confirm) {
    logWarn(
      `Dry-run: ${String(files.length)} file(s) would be removed. Run with --confirm to remove these files.`,
    );
    return;
  }

  const removed = await removeFiles(files, options.targetDir);

  if (options.removeBrowsers) {
    removeBrowsers();
  }

  logSuccess(`Removed ${String(removed)} of ${String(files.length)} scaffolded file(s).`);
}
