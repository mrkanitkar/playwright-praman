/**
 * @license
 * Copyright (c) ZesTest 2025-2030. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0
 *
 * This file may contain AI-assisted code.
 * See LICENSE and NOTICE files for details.
 */

/**
 * Tests for `scripts/generated-file.ts` — writing and verifying generated files.
 *
 * @remarks
 * Every generated artifact in this repo was rewritten by prettier after its
 * generator produced it, so `docs/capabilities.md` and
 * `src/ai/capability-registry.generated.ts` oscillated: generate, commit
 * (prettier reformats), generate again, dirty again. That oscillation is why a
 * drift check was impossible — the files were never byte-stable.
 *
 * Formatting the content *inside* the generator makes the output already
 * canonical, so generator output, the committed file, and what prettier wants
 * are the same bytes. The same helper then answers both questions a generator
 * needs — "write this" and "is what's on disk what I would have written?" —
 * which keeps the drift check honest by construction: it compares against the
 * identical pipeline rather than a reimplementation of it.
 */
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { emitGenerated } from '../../../scripts/generated-file.js';

let dir: string;

/** Reads a file from the scratch directory. */
function read(name: string): string {
  // eslint-disable-next-line security/detect-non-literal-fs-filename -- test utility: path built from the temp dir
  return readFileSync(join(dir, name), 'utf8');
}

/** Seeds a file in the scratch directory. */
function seed(name: string, content: string): void {
  // eslint-disable-next-line security/detect-non-literal-fs-filename -- test utility: path built from the temp dir
  writeFileSync(join(dir, name), content, 'utf8');
}

describe('emitGenerated', () => {
  beforeEach(() => {
    dir = mkdtempSync(join(tmpdir(), 'praman-emit-'));
  });

  afterEach(() => {
    rmSync(dir, { recursive: true, force: true });
  });

  describe('write mode', () => {
    it('creates a file that does not exist yet', async () => {
      const result = await emitGenerated(join(dir, 'out.md'), '# Title\n', 'write');

      expect(result.changed).toBe(true);
      expect(read('out.md')).toContain('# Title');
    });

    it('reports no change when the formatted content already matches', async () => {
      const path = join(dir, 'out.md');
      await emitGenerated(path, '# Title\n', 'write');

      const second = await emitGenerated(path, '# Title\n', 'write');

      expect(second.changed).toBe(false);
    });

    it('overwrites stale content', async () => {
      seed('out.md', '# Old\n');

      const result = await emitGenerated(join(dir, 'out.md'), '# New\n', 'write');

      expect(result.changed).toBe(true);
      expect(read('out.md')).toContain('# New');
    });
  });

  // The whole point: output is canonical before it lands, so prettier has
  // nothing left to change and the file stays byte-stable across commits.
  describe('formatting', () => {
    it('formats markdown so prettier would not rewrite it afterwards', async () => {
      const unpadded = '# T\n\n| a | b |\n|---|---|\n| 1 | 2 |\n';
      const path = join(dir, 'table.md');

      await emitGenerated(path, unpadded, 'write');

      // Prettier pads markdown table cells; emitting already-padded content
      // means a later prettier run is a no-op.
      expect(read('table.md')).toContain('| --- | --- |');
    });

    it('formats TypeScript to the repo style', async () => {
      const path = join(dir, 'out.ts');

      await emitGenerated(path, 'export const a = {b:1,c:2}\n', 'write');

      const written = read('out.ts');
      expect(written).toContain('export const a = { b: 1, c: 2 };');
    });

    it('is idempotent — emitting its own output changes nothing', async () => {
      const path = join(dir, 'idem.ts');
      await emitGenerated(path, 'export const x = {y:1}\n', 'write');
      const once = read('idem.ts');

      const again = await emitGenerated(path, once, 'write');

      expect(again.changed).toBe(false);
      expect(read('idem.ts')).toBe(once);
    });

    it('leaves content alone when prettier has no parser for the extension', async () => {
      const path = join(dir, 'data.bin');

      await emitGenerated(path, 'raw-bytes-here', 'write');

      expect(read('data.bin')).toBe('raw-bytes-here');
    });
  });

  // check mode is what CI runs: it must answer the question without writing.
  describe('check mode', () => {
    it('reports drift without touching the file', async () => {
      seed('out.md', '# Old\n');

      const result = await emitGenerated(join(dir, 'out.md'), '# New\n', 'check');

      expect(result.changed).toBe(true);
      expect(read('out.md')).toContain('# Old');
    });

    it('reports no drift when the file is current', async () => {
      const path = join(dir, 'out.md');
      await emitGenerated(path, '# Title\n', 'write');

      const result = await emitGenerated(path, '# Title\n', 'check');

      expect(result.changed).toBe(false);
    });

    it('reports drift for a missing file rather than throwing', async () => {
      const result = await emitGenerated(join(dir, 'absent.md'), '# Title\n', 'check');

      expect(result.changed).toBe(true);
    });

    it('does not create the file it was asked about', async () => {
      await emitGenerated(join(dir, 'absent.md'), '# Title\n', 'check');

      expect(() => read('absent.md')).toThrow();
    });
  });

  describe('result shape', () => {
    it('returns the path it acted on, for reporting which files drifted', async () => {
      const path = join(dir, 'out.md');

      const result = await emitGenerated(path, '# Title\n', 'check');

      expect(result.path).toBe(path);
    });
  });
});
