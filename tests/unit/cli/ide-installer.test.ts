/**
 * @license
 * Copyright (c) ZesTest 2025-2030. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0
 *
 * This file may contain AI-assisted code.
 * See LICENSE and NOTICE files for details.
 */

/**
 * Comprehensive tests for `src/cli/ide-installer.ts` — IDE scaffolding.
 *
 * @remarks
 * Uses mock filesystem + table-driven tests to verify each IDE's scaffold
 * output, backup behavior, directory creation, edge cases, and force mode.
 *
 * @module cli/ide-installer
 */

import { join } from 'node:path';

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import type { IDEDetection } from '../../../src/cli/ide-detector.js';
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

vi.mock('../../../src/cli/vscode-copilot-installer.js', () => ({
  scaffoldVSCodeFiles: vi.fn().mockResolvedValue(undefined),
  scaffoldCopilotAgentFiles: vi.fn().mockResolvedValue(undefined),
  scaffoldCopilotInstructions: vi.fn().mockResolvedValue(undefined),
}));

const { logWarn } = await import('../../../src/cli/logger.js');
const { scaffoldVSCodeFiles, scaffoldCopilotAgentFiles, scaffoldCopilotInstructions } =
  await import('../../../src/cli/vscode-copilot-installer.js');
const { scaffoldIDEFiles, scaffoldCliAgents } = await import(
  '../../../src/cli/ide-installer.js'
);

/** Safe non-tmp test path. */
const TEST_DIR = join('/home', 'testuser', 'project');

// ── Helpers ─────────────────────────────────────────────────────────────────

/** Creates a full IDEDetection with all flags set to false by default. */
function makeDetection(overrides: Partial<IDEDetection> = {}): IDEDetection {
  return {
    claude: false,
    vscode: false,
    cursor: false,
    opencode: false,
    jules: false,
    copilot: false,
    ...overrides,
  };
}

/**
 * Resolves the package root prefix used by pkgPath() in the source.
 * Since getPackageRoot uses readFileSync (NOT mocked), it resolves to process.cwd().
 */
function getPkgPrefix(): string {
  return process.cwd();
}

/** Seeds all source files needed for a full scaffoldIDEFiles run. */
function seedAllSourceFiles(prefix: string): void {
  // Claude agent files
  mockFs.files.set(join(prefix, 'agents', 'claude', 'praman-sap-planner.md'), 'planner');
  mockFs.files.set(join(prefix, 'agents', 'claude', 'praman-sap-generator.md'), 'generator');
  mockFs.files.set(join(prefix, 'agents', 'claude', 'praman-sap-healer.md'), 'healer');
  mockFs.files.set(join(prefix, 'agents', 'claude', 'prompts', 'praman-sap-plan.md'), 'plan');
  mockFs.files.set(
    join(prefix, 'agents', 'claude', 'prompts', 'praman-sap-generate.md'),
    'generate',
  );
  mockFs.files.set(join(prefix, 'agents', 'claude', 'prompts', 'praman-sap-heal.md'), 'heal');
  mockFs.files.set(
    join(prefix, 'agents', 'claude', 'prompts', 'praman-sap-coverage.md'),
    'coverage',
  );

  // Copilot agent files
  mockFs.files.set(
    join(prefix, 'agents', 'copilot', 'praman-sap-planner.agent.md'),
    'copilot-planner',
  );
  mockFs.files.set(
    join(prefix, 'agents', 'copilot', 'praman-sap-generator.agent.md'),
    'copilot-generator',
  );
  mockFs.files.set(
    join(prefix, 'agents', 'copilot', 'praman-sap-healer.agent.md'),
    'copilot-healer',
  );

  // Cursor rule file
  mockFs.files.set(
    join(prefix, 'docs', 'user-integration', 'cursor-rules-appendable.mdc'),
    'cursor-rule-content',
  );

  // Jules setup file
  mockFs.files.set(
    join(prefix, 'docs', 'user-integration', 'jules-setup-appendable.md'),
    'jules-setup-content',
  );

  // Seed + auth + example files
  mockFs.files.set(join(prefix, 'seeds', 'sap-seed.spec.ts'), 'seed-content');
  mockFs.files.set(join(prefix, 'examples', 'auth-setup.ts'), 'auth-setup-content');
  mockFs.files.set(
    join(prefix, 'examples', 'playwright.config.ts'),
    '// auth-setup project config',
  );
  mockFs.files.set(
    join(prefix, 'examples', 'bom-e2e-praman-gold-standard.spec.ts'),
    'gold-standard-content',
  );
  mockFs.files.set(join(prefix, '.env.example'), 'SAP_URL=https://example.sap');
  mockFs.files.set(join(prefix, 'specs', 'bom-create-complete.plan.md'), 'plan-spec-content');

  // Skill files (flat directory)
  mockFs.files.set(
    join(prefix, 'skills', 'playwright-praman-sap-testing', 'SKILL.md'),
    'skill-content',
  );
  mockFs.files.set(
    join(prefix, 'skills', 'playwright-praman-sap-testing', 'skills-tdd.md'),
    'tdd-skill',
  );

  // Prompt files (flat directory)
  mockFs.files.set(join(prefix, 'prompts', 'plan-prompt.md'), 'plan-prompt');
  mockFs.files.set(join(prefix, 'prompts', 'generate-prompt.md'), 'generate-prompt');

  // CLI agent files
  mockFs.files.set(join(prefix, 'agents', 'claude', 'praman-sap-planner-cli.md'), 'planner-cli');
  mockFs.files.set(
    join(prefix, 'agents', 'claude', 'praman-sap-generator-cli.md'),
    'generator-cli',
  );
  mockFs.files.set(join(prefix, 'agents', 'claude', 'praman-sap-healer-cli.md'), 'healer-cli');
  mockFs.files.set(join(prefix, 'agents', 'claude', 'prompts', 'praman-cli-plan.md'), 'cli-plan');
  mockFs.files.set(
    join(prefix, 'agents', 'claude', 'prompts', 'praman-cli-generate.md'),
    'cli-generate',
  );
  mockFs.files.set(join(prefix, 'agents', 'claude', 'prompts', 'praman-cli-heal.md'), 'cli-heal');
  mockFs.files.set(
    join(prefix, 'agents', 'claude', 'prompts', 'praman-cli-coverage.md'),
    'cli-coverage',
  );

  // Copilot CLI agent files
  mockFs.files.set(
    join(prefix, 'agents', 'copilot', 'praman-sap-planner-cli.agent.md'),
    'copilot-planner-cli',
  );
  mockFs.files.set(
    join(prefix, 'agents', 'copilot', 'praman-sap-generator-cli.agent.md'),
    'copilot-generator-cli',
  );
  mockFs.files.set(
    join(prefix, 'agents', 'copilot', 'praman-sap-healer-cli.agent.md'),
    'copilot-healer-cli',
  );

  // Cursor CLI rule file
  mockFs.files.set(join(prefix, 'docs', 'user-integration', 'praman-cli.mdc'), 'cursor-cli-rule');

  // CLI config
  mockFs.files.set(
    join(prefix, 'examples', 'praman-cli.config.json'),
    '{"browser":{"browserName":"chromium"}}',
  );

  // CLI skill files
  mockFs.files.set(join(prefix, 'skills', 'praman-sap-cli', 'SKILL.md'), 'cli-skill');
  mockFs.files.set(join(prefix, 'skills', 'praman-sap-cli', 'claude-SKILL.md'), 'claude-cli-skill');
  mockFs.files.set(join(prefix, 'skills', 'praman-sap-cli', 'cli-patterns.md'), 'cli-patterns');
  mockFs.files.set(join(prefix, 'skills', 'praman-sap-cli', 'references', 'ref1.md'), 'ref1');
}

// ── Tests ───────────────────────────────────────────────────────────────────

describe('cli/ide-installer — scaffoldIDEFiles', () => {
  let pkgPrefix: string;

  beforeEach(() => {
    vi.clearAllMocks();
    mockFs.files.clear();
    mockFs.dirs.clear();
    mockFs.written.clear();
    mockFs.deleted.length = 0;
    pkgPrefix = getPkgPrefix();
    seedAllSourceFiles(pkgPrefix);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  // ── Table-driven per-IDE file creation tests ─────────────────────────────

  describe('per-IDE scaffold: Claude Code', () => {
    it('creates .claude directories and copies agent + prompt files', async () => {
      const detection = makeDetection({ claude: true });

      const created = await scaffoldIDEFiles(TEST_DIR, detection, false);

      // Directories created
      expect(mockFs.dirs.has(join(TEST_DIR, '.claude', 'agents'))).toBe(true);
      expect(mockFs.dirs.has(join(TEST_DIR, '.claude', 'prompts'))).toBe(true);

      // Agent files copied
      expect(
        mockFs.written.has(join(TEST_DIR, '.claude', 'agents', 'praman-sap-planner.md')),
      ).toBe(true);
      expect(
        mockFs.written.has(join(TEST_DIR, '.claude', 'agents', 'praman-sap-generator.md')),
      ).toBe(true);
      expect(
        mockFs.written.has(join(TEST_DIR, '.claude', 'agents', 'praman-sap-healer.md')),
      ).toBe(true);

      // Prompt files copied
      expect(mockFs.written.has(join(TEST_DIR, '.claude', 'prompts', 'praman-sap-plan.md'))).toBe(
        true,
      );
      expect(
        mockFs.written.has(join(TEST_DIR, '.claude', 'prompts', 'praman-sap-generate.md')),
      ).toBe(true);
      expect(mockFs.written.has(join(TEST_DIR, '.claude', 'prompts', 'praman-sap-heal.md'))).toBe(
        true,
      );
      expect(
        mockFs.written.has(join(TEST_DIR, '.claude', 'prompts', 'praman-sap-coverage.md')),
      ).toBe(true);

      // Returns created files
      expect(created.length).toBeGreaterThan(0);
    });
  });

  describe('per-IDE scaffold: Cursor', () => {
    it('creates .cursor/rules directory and copies rule file', async () => {
      const detection = makeDetection({ cursor: true });

      await scaffoldIDEFiles(TEST_DIR, detection, false);

      expect(mockFs.dirs.has(join(TEST_DIR, '.cursor', 'rules'))).toBe(true);
      expect(mockFs.written.has(join(TEST_DIR, '.cursor', 'rules', 'praman.mdc'))).toBe(true);
      expect(mockFs.written.get(join(TEST_DIR, '.cursor', 'rules', 'praman.mdc'))).toBe(
        'cursor-rule-content',
      );
    });
  });

  describe('per-IDE scaffold: Jules', () => {
    it('copies jules setup file (no dirs to create — placed in .jules/ directly)', async () => {
      const detection = makeDetection({ jules: true });

      await scaffoldIDEFiles(TEST_DIR, detection, false);

      expect(mockFs.written.has(join(TEST_DIR, '.jules', 'praman-setup.md'))).toBe(true);
      expect(mockFs.written.get(join(TEST_DIR, '.jules', 'praman-setup.md'))).toBe(
        'jules-setup-content',
      );
    });
  });

  describe('per-IDE scaffold: VS Code', () => {
    it('calls scaffoldVSCodeFiles for VS Code detection', async () => {
      const detection = makeDetection({ vscode: true });

      await scaffoldIDEFiles(TEST_DIR, detection, false);

      expect(scaffoldVSCodeFiles).toHaveBeenCalledWith(TEST_DIR, false, expect.any(Array));
    });

    it('calls scaffoldCopilotAgentFiles when vscode=true but copilot=false', async () => {
      const detection = makeDetection({ vscode: true, copilot: false });

      await scaffoldIDEFiles(TEST_DIR, detection, false);

      expect(scaffoldCopilotAgentFiles).toHaveBeenCalledWith(
        TEST_DIR,
        expect.any(Array),
        expect.any(Array),
        expect.any(Function),
        false,
        expect.any(Array),
        expect.any(Function),
      );
    });

    it('calls scaffoldCopilotInstructions for vscode detection', async () => {
      const detection = makeDetection({ vscode: true });

      await scaffoldIDEFiles(TEST_DIR, detection, false);

      expect(scaffoldCopilotInstructions).toHaveBeenCalledWith(
        TEST_DIR,
        expect.any(Function),
        false,
        expect.any(Array),
      );
    });
  });

  describe('per-IDE scaffold: Copilot', () => {
    it('creates .github/agents directory and copies copilot agent files', async () => {
      const detection = makeDetection({ copilot: true });

      await scaffoldIDEFiles(TEST_DIR, detection, false);

      expect(mockFs.dirs.has(join(TEST_DIR, '.github', 'agents'))).toBe(true);
      expect(
        mockFs.written.has(join(TEST_DIR, '.github', 'agents', 'praman-sap-planner.agent.md')),
      ).toBe(true);
      expect(
        mockFs.written.has(join(TEST_DIR, '.github', 'agents', 'praman-sap-generator.agent.md')),
      ).toBe(true);
      expect(
        mockFs.written.has(join(TEST_DIR, '.github', 'agents', 'praman-sap-healer.agent.md')),
      ).toBe(true);
    });

    it('calls scaffoldCopilotInstructions for copilot detection', async () => {
      const detection = makeDetection({ copilot: true });

      await scaffoldIDEFiles(TEST_DIR, detection, false);

      expect(scaffoldCopilotInstructions).toHaveBeenCalledWith(
        TEST_DIR,
        expect.any(Function),
        false,
        expect.any(Array),
      );
    });

    it('does NOT call scaffoldCopilotAgentFiles when copilot is explicitly detected', async () => {
      // The vscode → copilot implicit install only fires when copilot=false
      const detection = makeDetection({ copilot: true, vscode: false });

      await scaffoldIDEFiles(TEST_DIR, detection, false);

      expect(scaffoldCopilotAgentFiles).not.toHaveBeenCalled();
    });
  });

  describe('per-IDE scaffold: OpenCode', () => {
    it('installs shared resources when opencode is detected (no IDE-specific files)', async () => {
      const detection = makeDetection({ opencode: true });

      await scaffoldIDEFiles(TEST_DIR, detection, false);

      // OpenCode has empty dirs and empty files arrays — only shared resources
      expect(mockFs.written.has(join(TEST_DIR, 'tests', 'seeds', 'sap-seed.spec.ts'))).toBe(true);
      expect(mockFs.written.has(join(TEST_DIR, 'tests', 'auth.setup.ts'))).toBe(true);
    });
  });

  // ── Shared resources tests ──────────────────────────────────────────────

  describe('shared resources', () => {
    it('scaffolds seed file into tests/seeds/', async () => {
      const detection = makeDetection({ claude: true });

      await scaffoldIDEFiles(TEST_DIR, detection, false);

      expect(mockFs.dirs.has(join(TEST_DIR, 'tests', 'seeds'))).toBe(true);
      expect(mockFs.written.has(join(TEST_DIR, 'tests', 'seeds', 'sap-seed.spec.ts'))).toBe(true);
      expect(mockFs.written.get(join(TEST_DIR, 'tests', 'seeds', 'sap-seed.spec.ts'))).toBe(
        'seed-content',
      );
    });

    it('scaffolds auth setup file into tests/', async () => {
      const detection = makeDetection({ claude: true });

      await scaffoldIDEFiles(TEST_DIR, detection, false);

      expect(mockFs.written.has(join(TEST_DIR, 'tests', 'auth.setup.ts'))).toBe(true);
      expect(mockFs.written.get(join(TEST_DIR, 'tests', 'auth.setup.ts'))).toBe(
        'auth-setup-content',
      );
    });

    it('scaffolds skill files from skills/ directory', async () => {
      const detection = makeDetection({ claude: true });

      await scaffoldIDEFiles(TEST_DIR, detection, false);

      const skillDestDir = join(TEST_DIR, 'skills', 'playwright-praman-sap-testing');
      expect(mockFs.dirs.has(skillDestDir)).toBe(true);
      expect(mockFs.written.has(join(skillDestDir, 'SKILL.md'))).toBe(true);
      expect(mockFs.written.has(join(skillDestDir, 'skills-tdd.md'))).toBe(true);
    });

    it('scaffolds example files (gold-standard spec, plan spec, .env.example)', async () => {
      const detection = makeDetection({ claude: true });

      await scaffoldIDEFiles(TEST_DIR, detection, false);

      expect(
        mockFs.written.has(join(TEST_DIR, 'tests', 'bom-e2e-praman-gold-standard.spec.ts')),
      ).toBe(true);
      expect(mockFs.written.has(join(TEST_DIR, 'specs', 'bom-create-complete.plan.md'))).toBe(true);
      expect(mockFs.written.has(join(TEST_DIR, '.env.example'))).toBe(true);
    });

    it('scaffolds prompt files from prompts/ directory', async () => {
      const detection = makeDetection({ claude: true });

      await scaffoldIDEFiles(TEST_DIR, detection, false);

      const promptDestDir = join(TEST_DIR, 'praman-prompts');
      expect(mockFs.dirs.has(promptDestDir)).toBe(true);
      expect(mockFs.written.has(join(promptDestDir, 'plan-prompt.md'))).toBe(true);
      expect(mockFs.written.has(join(promptDestDir, 'generate-prompt.md'))).toBe(true);
    });

    it('does NOT scaffold shared resources when no IDE is detected', async () => {
      const detection = makeDetection(); // all false

      await scaffoldIDEFiles(TEST_DIR, detection, false);

      expect(mockFs.written.has(join(TEST_DIR, 'tests', 'seeds', 'sap-seed.spec.ts'))).toBe(false);
      expect(mockFs.written.has(join(TEST_DIR, 'tests', 'auth.setup.ts'))).toBe(false);
    });
  });

  // ── No-overwrite behavior ──────────────────────────────────────────────

  describe('no-overwrite behavior (force=false)', () => {
    it('does not overwrite existing destination files when force=false', async () => {
      const detection = makeDetection({ claude: true });

      // Pre-populate a destination file
      const destPath = join(TEST_DIR, '.claude', 'agents', 'praman-sap-planner.md');
      mockFs.files.set(destPath, 'user-customized-content');

      await scaffoldIDEFiles(TEST_DIR, detection, false);

      // Should NOT have been re-written
      expect(mockFs.written.has(destPath)).toBe(false);
      // Original content preserved
      expect(mockFs.files.get(destPath)).toBe('user-customized-content');
    });

    it('does not overwrite existing seed file when force=false', async () => {
      const detection = makeDetection({ claude: true });

      const seedPath = join(TEST_DIR, 'tests', 'seeds', 'sap-seed.spec.ts');
      mockFs.files.set(seedPath, 'my-custom-seed');

      await scaffoldIDEFiles(TEST_DIR, detection, false);

      expect(mockFs.written.has(seedPath)).toBe(false);
      expect(mockFs.files.get(seedPath)).toBe('my-custom-seed');
    });

    it('does not overwrite existing skill files when force=false', async () => {
      const detection = makeDetection({ claude: true });

      const skillPath = join(TEST_DIR, 'skills', 'playwright-praman-sap-testing', 'SKILL.md');
      mockFs.files.set(skillPath, 'custom-skill');

      await scaffoldIDEFiles(TEST_DIR, detection, false);

      expect(mockFs.written.has(skillPath)).toBe(false);
    });

    it('does not overwrite existing prompt files when force=false', async () => {
      const detection = makeDetection({ claude: true });

      const promptPath = join(TEST_DIR, 'praman-prompts', 'plan-prompt.md');
      mockFs.files.set(promptPath, 'custom-prompt');

      await scaffoldIDEFiles(TEST_DIR, detection, false);

      expect(mockFs.written.has(promptPath)).toBe(false);
    });
  });

  // ── Force mode ────────────────────────────────────────────────────────

  describe('force mode (force=true)', () => {
    it('overwrites existing destination files when force=true', async () => {
      const detection = makeDetection({ claude: true });

      const destPath = join(TEST_DIR, '.claude', 'agents', 'praman-sap-planner.md');
      mockFs.files.set(destPath, 'old-content');

      await scaffoldIDEFiles(TEST_DIR, detection, true);

      expect(mockFs.written.has(destPath)).toBe(true);
      expect(mockFs.written.get(destPath)).toBe('planner');
    });

    it('overwrites existing seed file when force=true', async () => {
      const detection = makeDetection({ claude: true });

      const seedPath = join(TEST_DIR, 'tests', 'seeds', 'sap-seed.spec.ts');
      mockFs.files.set(seedPath, 'old-seed');

      await scaffoldIDEFiles(TEST_DIR, detection, true);

      expect(mockFs.written.has(seedPath)).toBe(true);
      expect(mockFs.written.get(seedPath)).toBe('seed-content');
    });
  });

  // ── Missing source file handling ─────────────────────────────────────

  describe('missing source files (graceful degradation)', () => {
    it('silently skips when source file does not exist', async () => {
      const detection = makeDetection({ jules: true });

      // Remove the jules source file from mock fs
      mockFs.files.delete(join(pkgPrefix, 'docs', 'user-integration', 'jules-setup-appendable.md'));

      await scaffoldIDEFiles(TEST_DIR, detection, false);

      // Should log a warning for missing source
      expect(logWarn).toHaveBeenCalledWith(expect.stringContaining('Scaffold source not found'));
      // Destination should NOT be created
      expect(mockFs.written.has(join(TEST_DIR, '.jules', 'praman-setup.md'))).toBe(false);
    });

    it('silently skips when skills source directory does not exist', async () => {
      const detection = makeDetection({ claude: true });

      // Override readdir to throw ENOENT for the skills directory
      const skillsSrcDir = join(pkgPrefix, 'skills', 'playwright-praman-sap-testing');
      mockFs.mocks.readdir.mockImplementation((dirPath: string) => {
        if (dirPath === skillsSrcDir) {
          return Promise.reject(
            Object.assign(new Error('ENOENT: no such directory'), { code: 'ENOENT' }),
          );
        }
        // Fallback: compute entries from files map
        const entries: string[] = [];
        const prefix = dirPath.endsWith('/') ? dirPath : `${dirPath}/`;
        for (const filePath of mockFs.files.keys()) {
          const normalized = filePath.replaceAll('\\', '/');
          const normalizedPrefix = prefix.replaceAll('\\', '/');
          if (normalized.startsWith(normalizedPrefix) && !normalized.slice(normalizedPrefix.length).includes('/')) {
            entries.push(normalized.slice(normalizedPrefix.length));
          }
        }
        return Promise.resolve(entries);
      });

      await scaffoldIDEFiles(TEST_DIR, detection, false);

      expect(logWarn).toHaveBeenCalledWith(
        expect.stringContaining('Skills source directory not found'),
      );
    });

    it('silently skips when prompts source directory does not exist', async () => {
      const detection = makeDetection({ claude: true });

      // Override readdir to throw ENOENT for the prompts directory
      const promptsSrcDir = join(pkgPrefix, 'prompts');
      mockFs.mocks.readdir.mockImplementation((dirPath: string) => {
        if (dirPath === promptsSrcDir) {
          return Promise.reject(
            Object.assign(new Error('ENOENT: no such directory'), { code: 'ENOENT' }),
          );
        }
        // Fallback: compute entries from files map
        const entries: string[] = [];
        const prefix = dirPath.endsWith('/') ? dirPath : `${dirPath}/`;
        for (const filePath of mockFs.files.keys()) {
          const normalized = filePath.replaceAll('\\', '/');
          const normalizedPrefix = prefix.replaceAll('\\', '/');
          if (normalized.startsWith(normalizedPrefix) && !normalized.slice(normalizedPrefix.length).includes('/')) {
            entries.push(normalized.slice(normalizedPrefix.length));
          }
        }
        return Promise.resolve(entries);
      });

      await scaffoldIDEFiles(TEST_DIR, detection, false);

      expect(logWarn).toHaveBeenCalledWith(
        expect.stringContaining('Prompts source directory not found'),
      );
    });
  });

  // ── playwright.config.ts backup behavior ─────────────────────────────

  describe('playwright.config.ts backup behavior', () => {
    it('copies config normally when no existing config exists', async () => {
      const detection = makeDetection({ claude: true });

      await scaffoldIDEFiles(TEST_DIR, detection, false);

      const backupPath = join(TEST_DIR, 'playwright.config.original.ts');
      expect(mockFs.written.has(backupPath)).toBe(false);
      expect(logWarn).not.toHaveBeenCalledWith(expect.stringContaining('Backed up'));
    });

    it('backs up existing config when it lacks auth-setup marker', async () => {
      const detection = makeDetection({ claude: true });

      const configPath = join(TEST_DIR, 'playwright.config.ts');
      const bareConfig = `import { defineConfig } from '@playwright/test';
export default defineConfig({ testDir: './tests' });`;
      mockFs.files.set(configPath, bareConfig);

      await scaffoldIDEFiles(TEST_DIR, detection, false);

      const backupPath = join(TEST_DIR, 'playwright.config.original.ts');
      expect(mockFs.written.has(backupPath)).toBe(true);
      expect(mockFs.written.get(backupPath)).toBe(bareConfig);
      expect(logWarn).toHaveBeenCalledWith(expect.stringContaining('Backed up'));
      expect(logWarn).toHaveBeenCalledWith(expect.stringContaining('Merge any custom settings'));
    });

    it('skips backup when existing config already has auth-setup marker', async () => {
      const detection = makeDetection({ claude: true });

      const configPath = join(TEST_DIR, 'playwright.config.ts');
      mockFs.files.set(configPath, "// auth-setup project config\nexport default defineConfig({});");

      await scaffoldIDEFiles(TEST_DIR, detection, false);

      const backupPath = join(TEST_DIR, 'playwright.config.original.ts');
      expect(mockFs.written.has(backupPath)).toBe(false);
    });

    it('backs up and replaces when force=true even if marker is present', async () => {
      const detection = makeDetection({ claude: true });

      const configPath = join(TEST_DIR, 'playwright.config.ts');
      const markerConfig = "// auth-setup already\nexport default defineConfig({});";
      mockFs.files.set(configPath, markerConfig);

      await scaffoldIDEFiles(TEST_DIR, detection, true);

      const backupPath = join(TEST_DIR, 'playwright.config.original.ts');
      expect(mockFs.written.has(backupPath)).toBe(true);
      expect(mockFs.written.get(backupPath)).toBe(markerConfig);
    });

    it('logs warning when example config source is missing', async () => {
      const detection = makeDetection({ claude: true });

      // Remove the config source
      mockFs.files.delete(join(pkgPrefix, 'examples', 'playwright.config.ts'));

      await scaffoldIDEFiles(TEST_DIR, detection, false);

      expect(logWarn).toHaveBeenCalledWith(expect.stringContaining('Scaffold source not found'));
    });
  });

  // ── Multiple IDEs detected simultaneously ───────────────────────────

  describe('multiple IDEs detected simultaneously', () => {
    it('scaffolds all detected IDEs and shared resources', async () => {
      const detection = makeDetection({ claude: true, cursor: true, jules: true });

      await scaffoldIDEFiles(TEST_DIR, detection, false);

      // Claude files
      expect(
        mockFs.written.has(join(TEST_DIR, '.claude', 'agents', 'praman-sap-planner.md')),
      ).toBe(true);
      // Cursor files
      expect(mockFs.written.has(join(TEST_DIR, '.cursor', 'rules', 'praman.mdc'))).toBe(true);
      // Jules files
      expect(mockFs.written.has(join(TEST_DIR, '.jules', 'praman-setup.md'))).toBe(true);
      // Shared resources
      expect(mockFs.written.has(join(TEST_DIR, 'tests', 'seeds', 'sap-seed.spec.ts'))).toBe(true);
    });

    it('scaffolds VS Code + Copilot without duplicate copilot calls', async () => {
      const detection = makeDetection({ vscode: true, copilot: true });

      await scaffoldIDEFiles(TEST_DIR, detection, false);

      // VS Code files scaffolded
      expect(scaffoldVSCodeFiles).toHaveBeenCalled();
      // Copilot files should be created via the main loop (copilot: true)
      expect(
        mockFs.written.has(join(TEST_DIR, '.github', 'agents', 'praman-sap-planner.agent.md')),
      ).toBe(true);
      // The implicit vscode → copilot fallback should NOT fire since copilot is explicitly true
      expect(scaffoldCopilotAgentFiles).not.toHaveBeenCalled();
    });
  });

  // ── Return value ───────────────────────────────────────────────────────

  describe('return value', () => {
    it('returns array of created file paths', async () => {
      const detection = makeDetection({ jules: true });

      const created = await scaffoldIDEFiles(TEST_DIR, detection, false);

      expect(Array.isArray(created)).toBe(true);
      expect(created).toContain(join(TEST_DIR, '.jules', 'praman-setup.md'));
    });

    it('returns empty array when no IDE is detected', async () => {
      const detection = makeDetection(); // all false

      const created = await scaffoldIDEFiles(TEST_DIR, detection, false);

      expect(created).toEqual([]);
    });
  });
});

// ── scaffoldCliAgents direct tests ─────────────────────────────────────────

describe('cli/ide-installer — scaffoldCliAgents', () => {
  let pkgPrefix: string;

  beforeEach(() => {
    vi.clearAllMocks();
    mockFs.files.clear();
    mockFs.dirs.clear();
    mockFs.written.clear();
    mockFs.deleted.length = 0;
    pkgPrefix = getPkgPrefix();
    seedAllSourceFiles(pkgPrefix);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('installs CLI config regardless of detection', async () => {
    const detection = makeDetection({ claude: true });
    const created: string[] = [];

    await scaffoldCliAgents(TEST_DIR, detection, false, created);

    expect(mockFs.written.has(join(TEST_DIR, '.playwright', 'praman-cli.config.json'))).toBe(true);
    expect(created).toContain(join(TEST_DIR, '.playwright', 'praman-cli.config.json'));
  });

  it('installs project-root skills when detection is undefined', async () => {
    const created: string[] = [];

    await scaffoldCliAgents(TEST_DIR, undefined, false, created);

    // Project-root skill files installed
    const skillDir = join(TEST_DIR, 'skills', 'praman-sap-cli');
    expect(mockFs.dirs.has(skillDir)).toBe(true);
    // CLI config still installed
    expect(mockFs.written.has(join(TEST_DIR, '.playwright', 'praman-cli.config.json'))).toBe(true);
  });

  it('does NOT install IDE-specific CLI agents when detection is undefined', async () => {
    const created: string[] = [];

    await scaffoldCliAgents(TEST_DIR, undefined, false, created);

    // No IDE-specific paths
    expect(
      mockFs.written.has(join(TEST_DIR, '.claude', 'agents', 'praman-sap-planner-cli.md')),
    ).toBe(false);
  });

  it('installs Claude CLI agents when detection.claude=true', async () => {
    const detection = makeDetection({ claude: true });
    const created: string[] = [];

    await scaffoldCliAgents(TEST_DIR, detection, false, created);

    expect(
      mockFs.written.has(join(TEST_DIR, '.claude', 'agents', 'praman-sap-planner-cli.md')),
    ).toBe(true);
    expect(
      mockFs.written.has(join(TEST_DIR, '.claude', 'agents', 'praman-sap-generator-cli.md')),
    ).toBe(true);
    expect(
      mockFs.written.has(join(TEST_DIR, '.claude', 'agents', 'praman-sap-healer-cli.md')),
    ).toBe(true);
  });

  it('installs CLI skill to .claude/skills/ when detection.claude=true', async () => {
    const detection = makeDetection({ claude: true });
    const created: string[] = [];

    await scaffoldCliAgents(TEST_DIR, detection, false, created);

    const claudeSkillPath = join(TEST_DIR, '.claude', 'skills', 'praman-sap-cli', 'SKILL.md');
    expect(mockFs.written.has(claudeSkillPath)).toBe(true);
  });

  it('installs CLI skill to .github/skills/ when detection.copilot=true', async () => {
    const detection = makeDetection({ copilot: true });
    const created: string[] = [];

    await scaffoldCliAgents(TEST_DIR, detection, false, created);

    const copilotSkillPath = join(TEST_DIR, '.github', 'skills', 'praman-sap-cli', 'SKILL.md');
    expect(mockFs.written.has(copilotSkillPath)).toBe(true);
  });

  it('installs CLI skill to .github/skills/ when detection.vscode=true', async () => {
    const detection = makeDetection({ vscode: true });
    const created: string[] = [];

    await scaffoldCliAgents(TEST_DIR, detection, false, created);

    const copilotSkillPath = join(TEST_DIR, '.github', 'skills', 'praman-sap-cli', 'SKILL.md');
    expect(mockFs.written.has(copilotSkillPath)).toBe(true);
  });

  it('installs references subdirectory for CLI skills', async () => {
    const detection = makeDetection({ claude: true });
    const created: string[] = [];

    await scaffoldCliAgents(TEST_DIR, detection, false, created);

    const refPath = join(TEST_DIR, '.claude', 'skills', 'praman-sap-cli', 'references', 'ref1.md');
    expect(mockFs.written.has(refPath)).toBe(true);
  });

  it('logs warning when CLI skills source directory is missing', async () => {
    const detection = makeDetection({ claude: true });
    const created: string[] = [];

    // Override readdir to throw ENOENT for the CLI skills directory
    const cliSkillSrcDir = join(pkgPrefix, 'skills', 'praman-sap-cli');
    mockFs.mocks.readdir.mockImplementation((dirPath: string) => {
      if (dirPath === cliSkillSrcDir) {
        return Promise.reject(
          Object.assign(new Error('ENOENT: no such directory'), { code: 'ENOENT' }),
        );
      }
      // Fallback: compute entries from files map
      const entries: string[] = [];
      const prefix = dirPath.endsWith('/') ? dirPath : `${dirPath}/`;
      for (const filePath of mockFs.files.keys()) {
        const normalized = filePath.replaceAll('\\', '/');
        const normalizedPrefix = prefix.replaceAll('\\', '/');
        if (normalized.startsWith(normalizedPrefix) && !normalized.slice(normalizedPrefix.length).includes('/')) {
          entries.push(normalized.slice(normalizedPrefix.length));
        }
      }
      return Promise.resolve(entries);
    });

    await scaffoldCliAgents(TEST_DIR, detection, false, created);

    expect(logWarn).toHaveBeenCalledWith(
      expect.stringContaining('CLI skills source directory not found'),
    );
  });

  it('logs warning when CLI skills references directory is missing', async () => {
    const detection = makeDetection({ claude: true });
    const created: string[] = [];

    // Override readdir to throw ENOENT ONLY for paths ending with /references
    mockFs.mocks.readdir.mockImplementation((dirPath: string) => {
      if (dirPath.endsWith(join('praman-sap-cli', 'references'))) {
        return Promise.reject(
          Object.assign(new Error('ENOENT: no such directory'), { code: 'ENOENT' }),
        );
      }
      // Fallback: compute entries from files map
      const entries: string[] = [];
      const prefix = dirPath.endsWith('/') ? dirPath : `${dirPath}/`;
      for (const filePath of mockFs.files.keys()) {
        const normalized = filePath.replaceAll('\\', '/');
        const normalizedPrefix = prefix.replaceAll('\\', '/');
        if (normalized.startsWith(normalizedPrefix) && !normalized.slice(normalizedPrefix.length).includes('/')) {
          entries.push(normalized.slice(normalizedPrefix.length));
        }
      }
      return Promise.resolve(entries);
    });

    await scaffoldCliAgents(TEST_DIR, detection, false, created);

    expect(logWarn).toHaveBeenCalledWith(
      expect.stringContaining('CLI skills references directory not found'),
    );
  });

  it('skips non-matching IDE keys in CLI_COPY_SPECS', async () => {
    // detection with only cursor=true — claude and copilot specs should be skipped
    const detection = makeDetection({ cursor: true });
    const created: string[] = [];

    await scaffoldCliAgents(TEST_DIR, detection, false, created);

    expect(
      mockFs.written.has(join(TEST_DIR, '.claude', 'agents', 'praman-sap-planner-cli.md')),
    ).toBe(false);
    expect(
      mockFs.written.has(join(TEST_DIR, '.github', 'agents', 'praman-sap-planner-cli.agent.md')),
    ).toBe(false);
    // But cursor CLI rule should be present
    expect(mockFs.written.has(join(TEST_DIR, '.cursor', 'rules', 'praman-cli.mdc'))).toBe(true);
  });

  it('does not overwrite existing CLI files when force=false', async () => {
    const detection = makeDetection({ claude: true });
    const created: string[] = [];

    const destPath = join(TEST_DIR, '.claude', 'agents', 'praman-sap-planner-cli.md');
    mockFs.files.set(destPath, 'user-custom-cli-planner');

    await scaffoldCliAgents(TEST_DIR, detection, false, created);

    expect(mockFs.written.has(destPath)).toBe(false);
    expect(mockFs.files.get(destPath)).toBe('user-custom-cli-planner');
  });

  it('overwrites existing CLI files when force=true', async () => {
    const detection = makeDetection({ claude: true });
    const created: string[] = [];

    const destPath = join(TEST_DIR, '.claude', 'agents', 'praman-sap-planner-cli.md');
    mockFs.files.set(destPath, 'user-custom-cli-planner');

    await scaffoldCliAgents(TEST_DIR, detection, true, created);

    expect(mockFs.written.has(destPath)).toBe(true);
    expect(mockFs.written.get(destPath)).toBe('planner-cli');
  });
});

// ── copyIfMissing edge case (copy failure) ──────────────────────────────────

describe('cli/ide-installer — copyIfMissing failure path', () => {
  let pkgPrefix: string;

  beforeEach(() => {
    vi.clearAllMocks();
    mockFs.files.clear();
    mockFs.dirs.clear();
    mockFs.written.clear();
    mockFs.deleted.length = 0;
    pkgPrefix = getPkgPrefix();
    seedAllSourceFiles(pkgPrefix);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('logs warning when copyFile fails (e.g., permission error)', async () => {
    const detection = makeDetection({ jules: true });

    // Make the source file exist but make copyFile reject for this specific file
    const julesSrc = join(
      pkgPrefix,
      'docs',
      'user-integration',
      'jules-setup-appendable.md',
    );
    mockFs.files.set(julesSrc, 'jules-content');

    // Override copyFile to fail for this pair
    mockFs.mocks.copyFile.mockImplementation((src: string, dest: string) => {
      if (dest.includes('.jules')) {
        return Promise.reject(new Error('EPERM: permission denied'));
      }
      // Fallback: replicate the default mock behavior
      const content = mockFs.files.get(src);
      if (content === undefined) {
        return Promise.reject(
          Object.assign(new Error(`ENOENT: no such file, copyfile '${src}'`), { code: 'ENOENT' }),
        );
      }
      mockFs.files.set(dest, content);
      mockFs.written.set(dest, content);
      return Promise.resolve();
    });

    await scaffoldIDEFiles(TEST_DIR, detection, false);

    expect(logWarn).toHaveBeenCalledWith(expect.stringContaining('Failed to copy'));
  });
});
