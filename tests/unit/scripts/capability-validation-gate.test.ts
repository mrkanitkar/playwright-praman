/**
 * @license
 * Copyright (c) ZesTest 2025-2030. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0
 *
 * This file may contain AI-assisted code.
 * See LICENSE and NOTICE files for details.
 */

/**
 * Tests the pass/fail gate of `validate:capabilities`.
 *
 * @remarks
 * The gate only failed under `--strict`, and the `validate:capabilities` npm
 * script does not pass `--strict` — so in CI it reported "Validation passed"
 * unconditionally. It said so while 40 of 195 manifest entries had no
 * implementing `@capability` tag and 4 source tags named capabilities the
 * manifest did not contain.
 *
 * Two disagreements between `capabilities.yaml` and the source are now hard
 * failures in the default mode, because both mean the manifest agents read does
 * not describe the code:
 *
 * - an entry nothing in source declares (the manifest over-promises — the same
 *   defect as issue #246, where `files[]` named directories that did not exist);
 * - a source tag naming no manifest entry (the code claims a capability agents
 *   cannot discover).
 *
 * Untagged exports stay strict-only: that is the much broader CLAUDE.md rule 15
 * sweep, tracked separately, and conflating the two would block all work on it.
 */
import { describe, expect, it } from 'vitest';

import { capabilityValidationFailures } from '../../../scripts/capability-audit.js';

const CLEAN = { unverified: 0, invalidTags: 0, exportsMissingTag: 0 } as const;

describe('capabilityValidationFailures', () => {
  describe('default mode', () => {
    it('passes when the manifest and source agree', () => {
      expect(capabilityValidationFailures(CLEAN, { strict: false })).toEqual([]);
    });

    it('fails when the manifest declares a capability no source implements', () => {
      const failures = capabilityValidationFailures({ ...CLEAN, unverified: 3 }, { strict: false });

      expect(failures).toHaveLength(1);
      expect(failures[0]).toMatch(/3/);
    });

    it('fails when source claims a capability the manifest lacks', () => {
      const failures = capabilityValidationFailures(
        { ...CLEAN, invalidTags: 2 },
        { strict: false },
      );

      expect(failures).toHaveLength(1);
      expect(failures[0]).toMatch(/2/);
    });

    it('reports both disagreements together rather than stopping at the first', () => {
      const failures = capabilityValidationFailures(
        { ...CLEAN, unverified: 1, invalidTags: 1 },
        { strict: false },
      );

      expect(failures).toHaveLength(2);
    });

    // The broad rule-15 sweep is tracked separately; it must not gate every PR.
    it('tolerates untagged exports outside strict mode', () => {
      expect(
        capabilityValidationFailures({ ...CLEAN, exportsMissingTag: 225 }, { strict: false }),
      ).toEqual([]);
    });
  });

  describe('strict mode', () => {
    it('also fails on untagged exports', () => {
      const failures = capabilityValidationFailures(
        { ...CLEAN, exportsMissingTag: 225 },
        { strict: true },
      );

      expect(failures).toHaveLength(1);
      expect(failures[0]).toMatch(/225/);
    });

    it('still passes a fully clean run', () => {
      expect(capabilityValidationFailures(CLEAN, { strict: true })).toEqual([]);
    });
  });
});
