/**
 * @license
 * Copyright (c) ZesTest 2025-2030. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0
 *
 * This file may contain AI-assisted code.
 * See LICENSE and NOTICE files for details.
 */

/**
 * Tests for `src/cli/ide-installer.ts` — CLI agent file installation (`cli=true`).
 *
 * @remarks
 * Mocks `node:fs/promises` and the logger to verify that `scaffoldIDEFiles()`
 * installs CLI-specific agent definitions, config, and skill files when the
 * `cli` parameter is `true`, and does NOT install them when `cli` is `false`.
 *
 * @module cli/ide-installer-cli
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

const { scaffoldIDEFiles } = await import('../../../src/cli/ide-installer.js');

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
 * Seeds the mock filesystem with package source files needed for CLI copy
 * operations. Without these the `copyIfMissing` helper silently skips.
 *
 * @param prefix - The package root prefix resolved by `pkgPath()`.
 */
function seedCliSourceFiles(prefix: string): void {
  // Claude CLI agent files
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

  // CLI config template
  mockFs.files.set(
    join(prefix, 'examples', 'praman-cli.config.json'),
    '{"browser":{"browserName":"chromium"}}',
  );

  // CLI skill files (flat directory)
  mockFs.files.set(join(prefix, 'skills', 'praman-sap-cli', 'SKILL.md'), 'cli-skill');
  mockFs.files.set(join(prefix, 'skills', 'praman-sap-cli', 'claude-SKILL.md'), 'claude-cli-skill');
  mockFs.files.set(join(prefix, 'skills', 'praman-sap-cli', 'cli-patterns.md'), 'cli-patterns');
  // CLI skill references subdirectory
  mockFs.files.set(join(prefix, 'skills', 'praman-sap-cli', 'references', 'ref1.md'), 'ref1');
}

/**
 * Seeds shared (non-CLI) source files so that `scaffoldIDEFiles` does not
 * short-circuit before reaching the CLI section.
 */
function seedSharedSourceFiles(prefix: string): void {
  // Standard Claude agent files (MCP-based, not CLI)
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

  // Copilot agent files (MCP-based)
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

  // Cursor rule file (MCP-based)
  mockFs.files.set(
    join(prefix, 'docs', 'user-integration', 'cursor-rules-appendable.mdc'),
    'cursor-rule',
  );

  // Seed file
  mockFs.files.set(join(prefix, 'seeds', 'sap-seed.spec.ts'), 'seed-content');

  // Auth setup
  mockFs.files.set(join(prefix, 'examples', 'auth-setup.ts'), 'auth-setup');

  // Example files
  mockFs.files.set(
    join(prefix, 'examples', 'playwright.config.ts'),
    'import "dotenv"; // auth-setup',
  );
  mockFs.files.set(
    join(prefix, 'examples', 'bom-e2e-praman-gold-standard.spec.ts'),
    'gold-standard',
  );
  mockFs.files.set(join(prefix, '.env.example'), 'SAP_URL=');

  // Plan spec
  mockFs.files.set(join(prefix, 'specs', 'bom-create-complete.plan.md'), 'plan');

  // Skill files (MCP-based)
  mockFs.files.set(join(prefix, 'skills', 'playwright-praman-sap-testing', 'SKILL.md'), 'skill');
}

// ── Tests ───────────────────────────────────────────────────────────────────

describe('cli/ide-installer — CLI agent files (cli=true)', () => {
  /** Package root prefix used by `pkgPath()` in the source. */
  let pkgPrefix: string;

  beforeEach(() => {
    vi.clearAllMocks();
    mockFs.files.clear();
    mockFs.dirs.clear();
    mockFs.written.clear();
    mockFs.deleted.length = 0;

    // The pkgPath function resolves via getPackageRoot which reads package.json.
    // Since we mock node:fs/promises, readFileSync (used by getPackageRoot) is NOT
    // mocked — it uses the real fs. The pkgPath prefix is the real package root.
    // We seed files at the paths that pkgPath() will resolve to. Since we cannot
    // call pkgPath directly, we derive the prefix from the project root.
    // eslint-disable-next-line n/prefer-global/process -- test file uses process.cwd() for fixture paths
    pkgPrefix = join(process.cwd());

    seedSharedSourceFiles(pkgPrefix);
    seedCliSourceFiles(pkgPrefix);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('copies Claude CLI agent files when cli=true and detection.claude=true', async () => {
    const detection = makeDetection({ claude: true });

    await scaffoldIDEFiles(TEST_DIR, detection, false, true);

    // Verify CLI-specific Claude agent files were written to destination
    expect(
      mockFs.written.has(join(TEST_DIR, '.claude', 'agents', 'praman-sap-planner-cli.md')),
    ).toBe(true);
    expect(
      mockFs.written.has(join(TEST_DIR, '.claude', 'agents', 'praman-sap-generator-cli.md')),
    ).toBe(true);
    expect(
      mockFs.written.has(join(TEST_DIR, '.claude', 'agents', 'praman-sap-healer-cli.md')),
    ).toBe(true);
    expect(mockFs.written.has(join(TEST_DIR, '.claude', 'prompts', 'praman-cli-plan.md'))).toBe(
      true,
    );
    expect(mockFs.written.has(join(TEST_DIR, '.claude', 'prompts', 'praman-cli-generate.md'))).toBe(
      true,
    );
    expect(mockFs.written.has(join(TEST_DIR, '.claude', 'prompts', 'praman-cli-heal.md'))).toBe(
      true,
    );
    expect(mockFs.written.has(join(TEST_DIR, '.claude', 'prompts', 'praman-cli-coverage.md'))).toBe(
      true,
    );
  });

  it('copies Copilot CLI agent files when cli=true and detection.copilot=true', async () => {
    const detection = makeDetection({ copilot: true });

    await scaffoldIDEFiles(TEST_DIR, detection, false, true);

    expect(
      mockFs.written.has(join(TEST_DIR, '.github', 'agents', 'praman-sap-planner-cli.agent.md')),
    ).toBe(true);
    expect(
      mockFs.written.has(join(TEST_DIR, '.github', 'agents', 'praman-sap-generator-cli.agent.md')),
    ).toBe(true);
    expect(
      mockFs.written.has(join(TEST_DIR, '.github', 'agents', 'praman-sap-healer-cli.agent.md')),
    ).toBe(true);
  });

  it('copies Cursor CLI rule when cli=true and detection.cursor=true', async () => {
    const detection = makeDetection({ cursor: true });

    await scaffoldIDEFiles(TEST_DIR, detection, false, true);

    expect(mockFs.written.has(join(TEST_DIR, '.cursor', 'rules', 'praman-cli.mdc'))).toBe(true);
  });

  it('scaffolds CLI config file when cli=true', async () => {
    const detection = makeDetection({ claude: true });

    await scaffoldIDEFiles(TEST_DIR, detection, false, true);

    // CLI config is copied to .playwright/praman-cli.config.json
    expect(mockFs.written.has(join(TEST_DIR, '.playwright', 'praman-cli.config.json'))).toBe(true);
  });

  it('scaffolds CLI skill files to project root when cli=true', async () => {
    const detection = makeDetection({ claude: true });

    await scaffoldIDEFiles(TEST_DIR, detection, false, true);

    // CLI skill files are copied to skills/praman-sap-cli/
    const skillDir = join(TEST_DIR, 'skills', 'praman-sap-cli');
    expect(mockFs.dirs.has(skillDir)).toBe(true);
  });

  it('installs CLI skill to .claude/skills/ when detection.claude=true', async () => {
    const detection = makeDetection({ claude: true });

    await scaffoldIDEFiles(TEST_DIR, detection, false, true);

    // claude-SKILL.md should be copied as SKILL.md under .claude/skills/
    const claudeSkillPath = join(TEST_DIR, '.claude', 'skills', 'praman-sap-cli', 'SKILL.md');
    expect(mockFs.written.has(claudeSkillPath)).toBe(true);

    // References should also be copied
    const refPath = join(TEST_DIR, '.claude', 'skills', 'praman-sap-cli', 'references', 'ref1.md');
    expect(mockFs.written.has(refPath)).toBe(true);
  });

  it('installs CLI skill to .github/skills/ when detection.copilot=true', async () => {
    const detection = makeDetection({ copilot: true });

    await scaffoldIDEFiles(TEST_DIR, detection, false, true);

    // SKILL.md should be copied under .github/skills/
    const copilotSkillPath = join(TEST_DIR, '.github', 'skills', 'praman-sap-cli', 'SKILL.md');
    expect(mockFs.written.has(copilotSkillPath)).toBe(true);

    // References should also be copied
    const refPath = join(TEST_DIR, '.github', 'skills', 'praman-sap-cli', 'references', 'ref1.md');
    expect(mockFs.written.has(refPath)).toBe(true);
  });

  it('installs CLI skill to .github/skills/ when detection.vscode=true (implies Copilot)', async () => {
    const detection = makeDetection({ vscode: true });

    await scaffoldIDEFiles(TEST_DIR, detection, false, true);

    const copilotSkillPath = join(TEST_DIR, '.github', 'skills', 'praman-sap-cli', 'SKILL.md');
    expect(mockFs.written.has(copilotSkillPath)).toBe(true);
  });

  it('does NOT install CLI skill to .claude/skills/ when detection.claude=false', async () => {
    const detection = makeDetection({ copilot: true }); // claude=false

    await scaffoldIDEFiles(TEST_DIR, detection, false, true);

    const claudeSkillPath = join(TEST_DIR, '.claude', 'skills', 'praman-sap-cli', 'SKILL.md');
    expect(mockFs.written.has(claudeSkillPath)).toBe(false);
  });

  it('does NOT copy CLI files when cli=false (default)', async () => {
    const detection = makeDetection({ claude: true });

    // cli defaults to false when omitted
    await scaffoldIDEFiles(TEST_DIR, detection, false);

    // No CLI-specific files should be present
    expect(
      mockFs.written.has(join(TEST_DIR, '.claude', 'agents', 'praman-sap-planner-cli.md')),
    ).toBe(false);
    expect(mockFs.written.has(join(TEST_DIR, '.playwright', 'praman-cli.config.json'))).toBe(false);
  });

  it('does not affect existing MCP agent files when cli=true', async () => {
    const detection = makeDetection({ claude: true });

    // First scaffold without CLI to create MCP files
    await scaffoldIDEFiles(TEST_DIR, detection, false, false);

    const mcpPlannerPath = join(TEST_DIR, '.claude', 'agents', 'praman-sap-planner.md');
    const mcpPlannerContent = mockFs.written.get(mcpPlannerPath);

    // Clear the written tracking but keep files in the mock fs
    mockFs.written.clear();

    // Now scaffold with CLI — MCP files should remain untouched (not overwritten)
    await scaffoldIDEFiles(TEST_DIR, detection, false, true);

    // The MCP planner file should NOT have been re-written (it already existed)
    expect(mockFs.written.has(mcpPlannerPath)).toBe(false);

    // The file should still exist with its original content
    expect(mockFs.files.get(mcpPlannerPath)).toBe(mcpPlannerContent);

    // But CLI files should have been written
    expect(
      mockFs.written.has(join(TEST_DIR, '.claude', 'agents', 'praman-sap-planner-cli.md')),
    ).toBe(true);
  });
});
