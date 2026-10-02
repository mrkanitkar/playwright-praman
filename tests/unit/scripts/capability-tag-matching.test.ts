/**
 * @license
 * Copyright (c) ZesTest 2025-2030. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0
 *
 * This file may contain AI-assisted code.
 * See LICENSE and NOTICE files for details.
 */

/**
 * Tests for capability tag matching in `scripts/capability-validation-utils.ts`.
 *
 * @remarks
 * `validate:capabilities` is the only thing that verifies `capabilities.yaml` —
 * the manifest agents read — against the actual source. It matched a YAML entry
 * to a source tag with `tagText.includes(qualifiedName) || tagText.includes(name)`,
 * where `name` is the short name. Substring matching on a short name produces
 * rampant false positives, all three of these observed in a real run:
 *
 * | YAML entry          | wrongly "verified" against |
 * | ------------------- | -------------------------- |
 * | `ui5.control`       | `matchers.getControlProperty` |
 * | `ui5.controls`      | `ui5Wait.forControlState`  |
 * | `ui5.dialog.waitFor`| `ui5.table.waitForData`    |
 *
 * The validator therefore reported 167 of 195 entries as verified when only 155
 * were, and understated the unverified gap as 28 when it was 40. A manifest
 * claiming capabilities the code does not declare is the same class of defect as
 * issue #246, where `files[]` claimed directories that did not exist.
 *
 * Matching must be on the exact qualified name.
 */
import { describe, expect, it } from 'vitest';

import { findCapabilityTag } from '../../../scripts/capability-audit.js';
import type { SourceCapability } from '../../../scripts/capability-validation-utils.js';

function tag(tagText: string, file = 'src/x.ts', line = 1): SourceCapability {
  return { tagText, file, line };
}

describe('findCapabilityTag', () => {
  describe('exact matching', () => {
    it('matches a tag whose qualified name is identical', () => {
      const tags = [tag('ui5.control')];

      expect(findCapabilityTag('ui5.control', tags)?.tagText).toBe('ui5.control');
    });

    it('returns undefined when no tag declares the capability', () => {
      expect(findCapabilityTag('ui5.control', [tag('ui5.fill')])).toBeUndefined();
    });

    it('ignores trailing prose after the qualified name', () => {
      const tags = [tag('ui5.control — discovers a single control')];

      expect(findCapabilityTag('ui5.control', tags)).toBeDefined();
    });
  });

  // Each of these was a real false positive in a live validation run.
  describe('rejects the observed false positives', () => {
    it('does not match ui5.control against matchers.getControlProperty', () => {
      expect(
        findCapabilityTag('ui5.control', [tag('matchers.getControlProperty')]),
      ).toBeUndefined();
    });

    it('does not match ui5.controls against ui5Wait.forControlState', () => {
      expect(findCapabilityTag('ui5.controls', [tag('ui5Wait.forControlState')])).toBeUndefined();
    });

    it('does not match ui5.dialog.waitFor against ui5.table.waitForData', () => {
      expect(
        findCapabilityTag('ui5.dialog.waitFor', [tag('ui5.table.waitForData')]),
      ).toBeUndefined();
    });

    it('does not treat a qualified name as a prefix of a longer one', () => {
      expect(findCapabilityTag('ui5.table', [tag('ui5.table.getRows')])).toBeUndefined();
    });
  });

  describe('selection among many tags', () => {
    it('picks the exact match rather than the first lexical near-miss', () => {
      const tags = [
        tag('ui5.table.waitForData', 'src/modules/table.ts', 558),
        tag('ui5.dialog.waitFor', 'src/modules/dialog.ts', 120),
      ];

      const found = findCapabilityTag('ui5.dialog.waitFor', tags);

      expect(found?.file).toBe('src/modules/dialog.ts');
      expect(found?.line).toBe(120);
    });
  });
});
