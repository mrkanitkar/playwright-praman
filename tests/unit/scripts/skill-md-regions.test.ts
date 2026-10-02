/**
 * @license
 * Copyright (c) ZesTest 2025-2030. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0
 *
 * This file may contain AI-assisted code.
 * See LICENSE and NOTICE files for details.
 */

/**
 * Tests for `scripts/skill-md-regions.ts` — generated regions in a hand-authored file.
 *
 * @remarks
 * `skills/playwright-praman-sap-testing/SKILL.md` is the instruction set every
 * Praman agent reads first. Most of it is genuinely editorial — the seven rules,
 * the anti-patterns, the control guidance — and should stay hand-written. Two
 * parts are facts about the code and had rotted: the header claimed `v1.0.1`
 * while the package was 1.3.5, and the capability table listed 135 of 198
 * entries with some wrong parameters.
 *
 * Marker-delimited regions let the generator own exactly those facts while
 * leaving the prose alone.
 *
 * Missing markers are an error rather than a silent no-op. If someone edits the
 * file and drops a marker, the generator must say so: quietly skipping would
 * leave a stale claim in front of every agent, which is the failure this whole
 * change exists to prevent.
 */
import { describe, expect, it } from 'vitest';

import { REGION_MARKERS, replaceRegion } from '../../../scripts/skill-md-regions.js';

const DOC = [
  '# Title',
  '',
  `<!-- ${REGION_MARKERS.meta} start -->`,
  '',
  'OLD META',
  '',
  `<!-- ${REGION_MARKERS.meta} end -->`,
  '',
  '## Hand-written prose',
  '',
  'Keep me exactly as I am.',
  '',
  `<!-- ${REGION_MARKERS.capabilities} start -->`,
  '',
  'OLD TABLE',
  '',
  `<!-- ${REGION_MARKERS.capabilities} end -->`,
  '',
  'Trailing prose.',
  '',
].join('\n');

describe('replaceRegion', () => {
  describe('replacement', () => {
    it('replaces the body between the markers', () => {
      const out = replaceRegion(DOC, REGION_MARKERS.meta, 'NEW META');

      expect(out).toContain('NEW META');
      expect(out).not.toContain('OLD META');
    });

    it('keeps the markers themselves', () => {
      const out = replaceRegion(DOC, REGION_MARKERS.meta, 'NEW META');

      expect(out).toContain(`<!-- ${REGION_MARKERS.meta} start -->`);
      expect(out).toContain(`<!-- ${REGION_MARKERS.meta} end -->`);
    });

    it('leaves hand-written prose untouched', () => {
      const out = replaceRegion(DOC, REGION_MARKERS.meta, 'NEW META');

      expect(out).toContain('Keep me exactly as I am.');
      expect(out).toContain('Trailing prose.');
    });

    it('leaves the other region untouched', () => {
      const out = replaceRegion(DOC, REGION_MARKERS.meta, 'NEW META');

      expect(out).toContain('OLD TABLE');
    });

    it('replaces each region independently when applied in turn', () => {
      const out = replaceRegion(
        replaceRegion(DOC, REGION_MARKERS.meta, 'NEW META'),
        REGION_MARKERS.capabilities,
        'NEW TABLE',
      );

      expect(out).toContain('NEW META');
      expect(out).toContain('NEW TABLE');
      expect(out).not.toContain('OLD META');
      expect(out).not.toContain('OLD TABLE');
    });

    it('handles a multi-line body including a fenced block', () => {
      const body = ['```text', 'ui5', '  control(selector)', '```'].join('\n');

      const out = replaceRegion(DOC, REGION_MARKERS.capabilities, body);

      expect(out).toContain('  control(selector)');
      expect(out).toContain('```text');
    });

    it('is idempotent — replacing with the same body changes nothing', () => {
      const once = replaceRegion(DOC, REGION_MARKERS.meta, 'NEW META');

      expect(replaceRegion(once, REGION_MARKERS.meta, 'NEW META')).toBe(once);
    });

    it('empties a region when given an empty body', () => {
      const out = replaceRegion(DOC, REGION_MARKERS.meta, '');

      expect(out).not.toContain('OLD META');
      expect(out).toContain(`<!-- ${REGION_MARKERS.meta} end -->`);
    });
  });

  // Silently skipping would leave a stale claim in front of every agent.
  describe('malformed input is loud', () => {
    it('throws when the region is absent entirely', () => {
      expect(() => replaceRegion('# Just prose\n', REGION_MARKERS.meta)).toThrow(
        /praman:generated:meta/,
      );
    });

    it('throws when only the start marker is present', () => {
      const doc = `# T\n<!-- ${REGION_MARKERS.meta} start -->\nbody\n`;

      expect(() => replaceRegion(doc, REGION_MARKERS.meta, 'X')).toThrow(/end/i);
    });

    it('throws when only the end marker is present', () => {
      const doc = `# T\nbody\n<!-- ${REGION_MARKERS.meta} end -->\n`;

      expect(() => replaceRegion(doc, REGION_MARKERS.meta, 'X')).toThrow(/start/i);
    });

    it('throws when the end marker precedes the start marker', () => {
      const doc = [
        `<!-- ${REGION_MARKERS.meta} end -->`,
        'body',
        `<!-- ${REGION_MARKERS.meta} start -->`,
      ].join('\n');

      expect(() => replaceRegion(doc, REGION_MARKERS.meta, 'X')).toThrow(/order|before/i);
    });

    it('names the file in the error when one is supplied, to aid diagnosis', () => {
      expect(() => replaceRegion('# T\n', REGION_MARKERS.meta, 'X', 'SKILL.md')).toThrow(
        /SKILL\.md/,
      );
    });
  });
});
