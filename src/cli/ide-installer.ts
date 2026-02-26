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

import { access, copyFile, mkdir, writeFile } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import type { IDEDetection } from './ide-detector.js';

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

const VSCODE_SETTINGS = `{
  "playwright.reuseBrowser": false,
  "playwright.showTrace": true,
  "editor.formatOnSave": true,
  "typescript.preferences.importModuleSpecifierEnding": "js",
  "[typescript]": {
    "editor.defaultFormatter": "esbenp.prettier-vscode"
  }
}
`;

const VSCODE_EXTENSIONS = `{
  "recommendations": [
    "ms-playwright.playwright",
    "dbaeumer.vscode-eslint",
    "esbenp.prettier-vscode",
    "ms-vscode.vscode-typescript-next"
  ]
}
`;

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

// ── IDE installation specs ────────────────────────────────────────────────────

/**
 * IDE-specific install specs: directories to create and files to copy.
 *
 * @remarks
 * Keyed by {@link IDEDetection} property name. VS Code file content is
 * generated from in-memory templates and handled separately in
 * {@link scaffoldIDEFiles}.
 */
const IDE_COPY_SPECS: Readonly<
  Record<
    keyof IDEDetection,
    {
      readonly dirs: readonly (readonly string[])[];
      readonly files: readonly FileCopySpec[];
    }
  >
> = {
  claude: {
    dirs: [
      ['.claude', 'agents'],
      ['.claude', 'prompts'],
      ['tests', 'seeds'],
    ],
    files: [
      {
        srcSegments: ['agents', 'claude', 'praman-sap-planner.md'],
        destSegments: ['.claude', 'agents', 'praman-sap-planner.md'],
      },
      {
        srcSegments: ['agents', 'claude', 'praman-sap-generator.md'],
        destSegments: ['.claude', 'agents', 'praman-sap-generator.md'],
      },
      {
        srcSegments: ['agents', 'claude', 'praman-sap-healer.md'],
        destSegments: ['.claude', 'agents', 'praman-sap-healer.md'],
      },
      {
        srcSegments: ['agents', 'claude', 'prompts', 'praman-sap-plan.md'],
        destSegments: ['.claude', 'prompts', 'praman-sap-plan.md'],
      },
      {
        srcSegments: ['agents', 'claude', 'prompts', 'praman-sap-generate.md'],
        destSegments: ['.claude', 'prompts', 'praman-sap-generate.md'],
      },
      {
        srcSegments: ['agents', 'claude', 'prompts', 'praman-sap-heal.md'],
        destSegments: ['.claude', 'prompts', 'praman-sap-heal.md'],
      },
      {
        srcSegments: ['agents', 'claude', 'prompts', 'praman-sap-coverage.md'],
        destSegments: ['.claude', 'prompts', 'praman-sap-coverage.md'],
      },
      {
        srcSegments: ['seeds', 'sap-seed.spec.ts'],
        destSegments: ['tests', 'seeds', 'sap-seed.spec.ts'],
      },
    ],
  },
  cursor: {
    dirs: [['.cursor', 'rules']],
    files: [
      {
        srcSegments: ['docs', 'user-integration', 'cursor-rules-appendable.mdc'],
        destSegments: ['.cursor', 'rules', 'praman.mdc'],
      },
    ],
  },
  jules: {
    dirs: [],
    files: [
      {
        srcSegments: ['docs', 'user-integration', 'jules-setup-appendable.md'],
        destSegments: ['.jules', 'praman-setup.md'],
      },
    ],
  },
  vscode: {
    dirs: [['.vscode']],
    files: [], // VS Code uses generated template content — handled inline below
  },
  opencode: {
    dirs: [],
    files: [],
  },
  copilot: {
    dirs: [['.github', 'agents']],
    files: [
      {
        srcSegments: ['agents', 'copilot', 'praman-sap-planner.agent.md'],
        destSegments: ['.github', 'agents', 'praman-sap-planner.agent.md'],
      },
      {
        srcSegments: ['agents', 'copilot', 'praman-sap-generator.agent.md'],
        destSegments: ['.github', 'agents', 'praman-sap-generator.agent.md'],
      },
      {
        srcSegments: ['agents', 'copilot', 'praman-sap-healer.agent.md'],
        destSegments: ['.github', 'agents', 'praman-sap-healer.agent.md'],
      },
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

  return created;
}
