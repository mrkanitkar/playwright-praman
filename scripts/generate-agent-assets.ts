#!/usr/bin/env tsx
/**
 * Generate the distributable agent, seed, and CLI-skill trees from the
 * in-repo `.claude/` sources.
 *
 * @remarks
 * `src/cli/ide-installer.ts` copies agent definitions, prompts, the SAP seed
 * spec, and the CLI skill out of the *published package root* — from `agents/`,
 * `seeds/`, and `skills/praman-sap-cli/`. Those trees are listed in
 * package.json `files[]`, but nothing ever built them, so `npx playwright-praman
 * init` silently produced no agent, prompt, or seed files (issue #224).
 *
 * The canonical sources live under `.claude/`, which is a development-time
 * directory and is not published. This script projects them into the
 * publishable layout so both stay in one place.
 *
 * Run with: `npm run generate:agent-assets`
 * Verify with: `npm run validate:agent-assets` (fails on drift; used by CI)
 *
 * Mapping:
 * 1. `.claude/agents/praman-sap-*.md`  -> `agents/claude/*.md`
 * 2. `.claude/agents/praman-sap-*.md`  -> `agents/copilot/*.agent.md`
 * 3. `.claude/prompts/praman-*.md`     -> `agents/claude/prompts/*.md`
 * 4. `tests/seeds/sap-seed.spec.ts`    -> `seeds/sap-seed.spec.ts`
 * 5. `.claude/skills/praman-sap-cli/`  -> `skills/praman-sap-cli/`
 */

import {
  cpSync,
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import { dirname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');

/** Agent basenames published for every supported IDE. */
const AGENTS: readonly string[] = [
  'praman-sap-planner',
  'praman-sap-generator',
  'praman-sap-healer',
  'praman-sap-planner-cli',
  'praman-sap-generator-cli',
  'praman-sap-healer-cli',
];

/** Prompt basenames published alongside the Claude agents. */
const PROMPTS: readonly string[] = [
  'praman-sap-plan',
  'praman-sap-generate',
  'praman-sap-heal',
  'praman-sap-coverage',
  'praman-cli-plan',
  'praman-cli-generate',
  'praman-cli-heal',
  'praman-cli-coverage',
];

interface Emitted {
  readonly path: string;
  /** `undefined` when the source is not present in this checkout. */
  readonly content: string | undefined;
}

/**
 * Reads a source file, or returns `undefined` when it is not present.
 *
 * @remarks
 * Some `.claude/` sources are git-ignored local authoring files, so they exist
 * on a maintainer's machine but not in a clean CI checkout. The *outputs* are
 * committed either way. When a source is absent we therefore fall back to
 * verifying that the published artefact exists, rather than failing the build.
 */
function readSource(relPath: string): string | undefined {
  const abs = join(ROOT, relPath);
  return existsSync(abs) ? readFileSync(abs, 'utf8') : undefined;
}

/** Builds the full set of generated files in memory. */
function buildAssets(): Emitted[] {
  const out: Emitted[] = [];

  for (const name of AGENTS) {
    const content = readSource(join('.claude', 'agents', `${name}.md`));
    out.push({ path: join('agents', 'claude', `${name}.md`), content });
    out.push({ path: join('agents', 'copilot', `${name}.agent.md`), content });
  }

  for (const name of PROMPTS) {
    const content = readSource(join('.claude', 'prompts', `${name}.md`));
    out.push({ path: join('agents', 'claude', 'prompts', `${name}.md`), content });
  }

  out.push({
    path: join('seeds', 'sap-seed.spec.ts'),
    content: readSource(join('tests', 'seeds', 'sap-seed.spec.ts')),
  });

  return out;
}

/** Recursively lists files under a directory, relative to it. */
function listFiles(dir: string, base = dir): string[] {
  if (!existsSync(dir)) return [];
  const found: string[] = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const abs = join(dir, entry.name);
    if (entry.isDirectory()) found.push(...listFiles(abs, base));
    else found.push(relative(base, abs));
  }
  return found.sort();
}

/**
 * Copies the CLI skill tree wholesale.
 *
 * @remarks
 * `.claude/skills/` is git-ignored, so the source is absent in a clean checkout
 * while the published `skills/praman-sap-cli/` is committed. Returns the list of
 * published files so the caller can at least assert they exist.
 */
function copyCliSkill(write: boolean): { readonly files: string[]; readonly hasSource: boolean } {
  const src = join(ROOT, '.claude', 'skills', 'praman-sap-cli');
  const dest = join(ROOT, 'skills', 'praman-sap-cli');
  const hasSource = existsSync(src);

  if (hasSource && write) {
    rmSync(dest, { recursive: true, force: true });
    cpSync(src, dest, { recursive: true });
  }

  const from = hasSource ? src : dest;
  return {
    files: listFiles(from).map((f) => join('skills', 'praman-sap-cli', f)),
    hasSource,
  };
}

function main(): void {
  const check = process.argv.includes('--check');
  const assets = buildAssets();
  const drift: string[] = [];
  const absent: string[] = [];
  let sourceless = 0;

  for (const { path: relPath, content } of assets) {
    const abs = join(ROOT, relPath);

    if (content === undefined) {
      // No source in this checkout — the published artefact must still be there.
      sourceless += 1;
      if (!existsSync(abs)) absent.push(relPath);
      continue;
    }

    if (check) {
      if (!existsSync(abs)) absent.push(relPath);
      else if (readFileSync(abs, 'utf8') !== content) drift.push(relPath);
      continue;
    }

    mkdirSync(dirname(abs), { recursive: true });
    writeFileSync(abs, content, 'utf8');
  }

  const skill = copyCliSkill(!check);
  if (skill.files.length === 0) absent.push('skills/praman-sap-cli/**');

  const total = assets.length + skill.files.length;

  if (!check) {
    console.log(`Generated ${String(total)} agent asset files:`);
    console.log(`  agents/claude/          ${String(AGENTS.length)} agents + prompts`);
    console.log(`  agents/copilot/         ${String(AGENTS.length)} agents`);
    console.log(`  seeds/                  1 seed spec`);
    console.log(`  skills/praman-sap-cli/  ${String(skill.files.length)} files`);
    if (sourceless > 0) {
      console.log(`  (${String(sourceless)} left as-is — source not in this checkout)`);
    }
    return;
  }

  // These are the artefacts `playwright-praman init` copies into a user's
  // project. If any is missing the package ships broken — that is issue #224.
  if (absent.length > 0) {
    console.error('Published agent assets are MISSING — init would ship broken:\n');
    for (const a of absent) console.error(`  ${a}`);
    console.error('\nRun: npm run generate:agent-assets');
    process.exit(1);
  }

  if (drift.length > 0) {
    console.error('Generated agent assets are out of date:\n');
    for (const d of drift) console.error(`  ${d}`);
    console.error('\nRun: npm run generate:agent-assets');
    process.exit(1);
  }

  const checked = total - sourceless;
  console.log(
    `Agent assets OK — ${String(total)} present, ${String(checked)} content-verified` +
      (sourceless > 0 ? `, ${String(sourceless)} presence-only (source not tracked).` : '.'),
  );
}

main();
