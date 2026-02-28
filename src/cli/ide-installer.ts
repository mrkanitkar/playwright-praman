/**
 * @license
 * Copyright (c) ZesTest 2025-2030. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0
 *
 * This file may contain AI-assisted code.
 * See LICENSE and NOTICE files for details.
 */

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
 * @module cli/ide-installer
 */

import { access, copyFile, mkdir, readdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import type { IDEDetection } from './ide-detector.js';
import { logWarn } from './logger.js';

// ── Package root resolution ───────────────────────────────────────────────────

/**
 * Resolves a path relative to the package root at runtime.
 *
 * @remarks
 * The CLI bundle lives at `dist/cli/index.js`.
 * Two `..` hops from that file's directory reach the package root
 * where `agents/`, `seeds/`, and `docs/user-integration/` are installed.
 *
 * With tsup `shims: true`, `import.meta.url` is polyfilled in CJS output.
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
  return resolve(dirname(fileURLToPath(import.meta.url)), '..', '..', ...segments);
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

// ── VS Code generated templates ───────────────────────────────────────────────

const VSCODE_SETTINGS = [
  '{',
  '  "playwright.reuseBrowser": false,',
  '  "playwright.showTrace": true,',
  '  "editor.formatOnSave": true,',
  '  "typescript.preferences.importModuleSpecifierEnding": "js",',
  '  "[typescript]": { "editor.defaultFormatter": "esbenp.prettier-vscode" }',
  '}\n',
].join('\n');

const VSCODE_EXTENSIONS = [
  '{ "recommendations": [',
  '    "ms-playwright.playwright", "dbaeumer.vscode-eslint",',
  '    "esbenp.prettier-vscode", "ms-vscode.vscode-typescript-next"',
  '] }\n',
].join('\n');

const VSCODE_SNIPPETS = `{
  "Praman UI5 Test": {
    "prefix": "praman-test",
    "scope": "typescript",
    "body": [
      "import { test, expect } from 'playwright-praman';",
      "",
      "test('$1', async ({ ui5 }) => {",
      "  const control = await ui5.control({ $2 });",
      "  $0",
      "});"
    ],
    "description": "Praman SAP UI5 test scaffold"
  },
  "Praman Step": {
    "prefix": "praman-step",
    "scope": "typescript",
    "body": ["await test.step('$1', async () => {", "  $0", "});"],
    "description": "Praman test step"
  }
}
`;

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
    await copyFile(srcPath, destPath);
    created.push(destPath);
  } catch {
    // Source file not present (partial install, npx usage) — skip silently
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
    await copyFile(srcPath, destPath);
    created.push(destPath);
  } catch {
    /* source not present — skip silently */
  }
}

/**
 * Writes `content` to `filePath`, skipping if the file already exists and
 * `force` is `false`.
 */
async function writeIfMissing(
  filePath: string,
  content: string,
  force: boolean,
  created: string[],
): Promise<void> {
  if (!force) {
    try {
      await access(filePath);
      return; // file exists — skip
    } catch {
      // file does not exist — proceed to write
    }
  }
  // eslint-disable-next-line security/detect-non-literal-fs-filename -- filePath from targetDir + known constant names
  await writeFile(filePath, content, 'utf8');
  created.push(filePath);
}

/**
 * Writes the three generated VS Code config files into `.vscode/`.
 */
async function scaffoldVSCodeFiles(
  targetDir: string,
  force: boolean,
  created: string[],
): Promise<void> {
  const vscodePairs: readonly (readonly [string, string])[] = [
    [join(targetDir, '.vscode', 'settings.json'), VSCODE_SETTINGS],
    [join(targetDir, '.vscode', 'extensions.json'), VSCODE_EXTENSIONS],
    [join(targetDir, '.vscode', 'praman.code-snippets'), VSCODE_SNIPPETS],
  ];
  for (const [filePath, content] of vscodePairs) {
    await writeIfMissing(filePath, content, force, created);
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
    // Package skills directory not present (partial install) — skip silently
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

// ── Copilot agent files ───────────────────────────────────────────────────────

/** Marker string used to detect if Praman copilot instructions are already appended. */
const PRAMAN_COPILOT_MARKER = 'Praman SAP Test Automation';

/**
 * Copies Copilot agent `.agent.md` files into `.github/agents/` when VS Code
 * is detected but no explicit Copilot markers exist.
 */
async function scaffoldCopilotAgentFiles(
  targetDir: string,
  force: boolean,
  created: string[],
): Promise<void> {
  const copilotSpec = IDE_COPY_SPECS.copilot;

  for (const dirSegments of copilotSpec.dirs) {
    // eslint-disable-next-line security/detect-non-literal-fs-filename -- path composed from targetDir + known constant directory segments
    await mkdir(join(targetDir, ...dirSegments), { recursive: true });
  }

  for (const copySpec of copilotSpec.files) {
    const srcPath = pkgPath(...copySpec.srcSegments);
    const destPath = join(targetDir, ...copySpec.destSegments);
    await copyIfMissing(srcPath, destPath, force, created);
  }
}

// ── Copilot instructions scaffolding ──────────────────────────────────────────

/**
 * Creates or appends to `.github/copilot-instructions.md` with Praman
 * integration content from the package's user-integration docs.
 */
async function scaffoldCopilotInstructions(
  targetDir: string,
  force: boolean,
  created: string[],
): Promise<void> {
  const destPath = join(targetDir, '.github', 'copilot-instructions.md');
  const srcPath = pkgPath('docs', USER_INTEGRATION_DIR, 'copilot-instructions-appendable.md');

  let appendContent: string;
  try {
    // eslint-disable-next-line security/detect-non-literal-fs-filename -- srcPath resolved from package root + known constant path
    appendContent = await readFile(srcPath, 'utf8');
  } catch {
    // Source file not present — skip silently
    return;
  }

  // eslint-disable-next-line security/detect-non-literal-fs-filename -- destPath composed from targetDir + known constant path
  await mkdir(join(targetDir, '.github'), { recursive: true });

  let existingContent = '';
  try {
    // eslint-disable-next-line security/detect-non-literal-fs-filename -- destPath composed from targetDir + known constant path
    existingContent = await readFile(destPath, 'utf8');
  } catch {
    // File does not exist — will create fresh
  }

  // Skip if Praman section is already present
  if (existingContent.includes(PRAMAN_COPILOT_MARKER) && !force) {
    return;
  }

  const finalContent =
    existingContent.length > 0 ? `${existingContent.trimEnd()}\n\n${appendContent}` : appendContent;

  // eslint-disable-next-line security/detect-non-literal-fs-filename -- destPath composed from targetDir + known constant path
  await writeFile(destPath, finalContent, 'utf8');
  created.push(destPath);
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
    await scaffoldCopilotAgentFiles(targetDir, force, created);
  }

  // Copilot instructions: create or append for VS Code / Copilot users
  if (detection.vscode || detection.copilot) {
    await scaffoldCopilotInstructions(targetDir, force, created);
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
  }

  return created;
}
