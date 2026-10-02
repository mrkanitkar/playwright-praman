/**
 * @license
 * Copyright (c) ZesTest 2025-2030. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0
 *
 * This file may contain AI-assisted code.
 * See LICENSE and NOTICE files for details.
 */

/**
 * Tests that every `package.json` `files[]` entry actually ships something.
 *
 * @remarks
 * Regression guard for issue #246: `agents/` and `seeds/` were listed in
 * `files[]` while no such directories existed in the repository. npm silently
 * skips allowlist entries that match nothing, so `npm publish` succeeded, the
 * tarball shipped without any agent assets, and `playwright-praman init` had
 * nothing to copy into the consumer's project.
 *
 * Nothing in the toolchain caught it — `npm pack` does not warn, and the
 * published package looked healthy. The only durable guard is asserting that
 * each allowlist entry resolves to at least one real file, so an aspirational
 * entry fails here rather than in a user's `node_modules`.
 */
import { existsSync, readFileSync, statSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { globSync } from 'glob';
import { describe, expect, it } from 'vitest';

const dirName = dirname(fileURLToPath(import.meta.url));
const root = join(dirName, '../../..');
const pkg = JSON.parse(readFileSync(join(root, 'package.json'), 'utf-8')) as {
  files?: string[];
};

/**
 * Build output. Excluded because `npm run ci` runs `test:unit` before `build`,
 * so `dist/` is legitimately absent on a clean checkout. Its contents are
 * covered by `check:exports` (attw) and the `init-smoke` CI job instead.
 */
const BUILD_OUTPUT = new Set(['dist']);

/** Counts the real files an allowlist entry would contribute to the tarball. */
function publishedFileCount(entry: string): number {
  const bare = entry.replace(/\/$/, '');
  const abs = join(root, bare);

  // eslint-disable-next-line security/detect-non-literal-fs-filename -- test utility: path is the repo root plus an entry from our own package.json
  if (existsSync(abs)) {
    // eslint-disable-next-line security/detect-non-literal-fs-filename -- test utility: same trusted path, already proven to exist
    return statSync(abs).isDirectory()
      ? globSync('**/*', { cwd: abs, nodir: true, dot: true }).length
      : 1;
  }

  return globSync(entry, { cwd: root, nodir: true, dot: true }).length;
}

const allowlist = pkg.files ?? [];
const checked = allowlist.filter(
  (entry) => !entry.startsWith('!') && !BUILD_OUTPUT.has(entry.replace(/\/$/, '')),
);

describe('package.json files[] allowlist', () => {
  it('declares a files[] allowlist', () => {
    expect(allowlist.length).toBeGreaterThan(0);
  });

  // The #246 mechanism: an entry that matches nothing publishes nothing.
  it.each(checked)('"%s" resolves to at least one real file', (entry) => {
    expect(publishedFileCount(entry)).toBeGreaterThan(0);
  });
});

// Issue #246 named these two trees specifically — `init` copies agents into
// .github/ and .claude/, and the seed spec into tests/seeds/.
describe('agent assets consumed by `playwright-praman init` (issue #246)', () => {
  it.each(['agents/', 'seeds/'])('ships %s', (tree) => {
    expect(allowlist).toContain(tree);
  });

  it('ships a Claude agent for every published Copilot agent', () => {
    const byName = (a: string, b: string): number => a.localeCompare(b);
    const claude = globSync('*.md', { cwd: join(root, 'agents/claude') }).sort(byName);
    const copilot = globSync('*.agent.md', { cwd: join(root, 'agents/copilot') })
      .map((f) => f.replace('.agent.md', '.md'))
      .sort(byName);

    expect(claude).toEqual(expect.arrayContaining(copilot));
    expect(copilot.length).toBeGreaterThan(0);
  });
});

/**
 * Found while fixing #246. `skills/playwright-praman-sap-testing/SKILL.md` is
 * the entry point every Praman agent is instructed to read first, yet it was
 * listed under "# Generated" in `.gitignore` while no script produces it — it is
 * hand-authored. Ignored and untracked, it reached the tarball only when the
 * publishing machine happened to hold a copy in its working tree, and it was
 * absent from the published 1.3.5 package altogether.
 *
 * An existence assertion is the correct guard here precisely because CI checks
 * out a clean tree: an ignored, untracked file simply is not present, so this
 * fails in CI even while it would pass on a developer machine that still has a
 * local copy. That asymmetry is the bug, and this is what detects it.
 */
describe('agent skill entry point (hand-authored, must stay tracked)', () => {
  const entry = 'skills/playwright-praman-sap-testing/SKILL.md';

  it('is present in a clean checkout', () => {
    expect(existsSync(join(root, entry))).toBe(true);
  });

  it('is the full instruction set, not a placeholder', () => {
    expect(readFileSync(join(root, entry), 'utf-8').length).toBeGreaterThan(5000);
  });

  it('falls under a files[] entry so npm publishes it', () => {
    expect(publishedFileCount('skills/')).toBeGreaterThan(0);
    expect(allowlist).toContain('skills/');
  });
});
