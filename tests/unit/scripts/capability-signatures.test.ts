/**
 * @license
 * Copyright (c) ZesTest 2025-2030. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0
 *
 * This file may contain AI-assisted code.
 * See LICENSE and NOTICE files for details.
 */

/**
 * Tests for `scripts/capability-signatures.ts` — code-derived argument hints.
 *
 * @remarks
 * SKILL.md's capability table was hand-maintained and had drifted badly: it
 * listed 135 of 198 capabilities, omitted all five `control.*` entries (two of
 * which CLAUDE.md rule 5 makes mandatory for every input), and carried wrong
 * parameters — `fill(selector, text)` when the real parameter is `value`.
 *
 * `capabilities.yaml` has no signature field, so hints have to come from the
 * code. The `@capability` tags make that possible: each one sits on a
 * declaration, so the tag links a manifest entry to a real signature.
 *
 * Tag placement is loose, though — it means "participates in this capability",
 * not "is its implementation". `ui5.control` is tagged in three places, none of
 * them the `control()` method, and `control.setValue` is tagged on
 * `createControlProxy` because the method is forwarded dynamically.
 *
 * So the rule is deliberately conservative: emit a signature **only** when the
 * tag sits on a declaration whose name matches the manifest's `name`, and
 * otherwise emit `name(...)`. It can never print a wrong signature, and coverage
 * rises on its own as tags are tightened. Printing a plausible-but-wrong
 * signature into the file agents read would be worse than printing none.
 */
import { describe, expect, it } from 'vitest';

import { renderCapabilitySignature } from '../../../scripts/capability-signatures.js';
import type { TaggedDeclaration } from '../../../scripts/capability-signatures.js';

function decl(
  qualifiedName: string,
  declarationName: string,
  parameters: readonly string[] = [],
): TaggedDeclaration {
  return { qualifiedName, declarationName, parameters };
}

describe('renderCapabilitySignature', () => {
  describe('when the tag sits on the implementing declaration', () => {
    it('renders the real parameter names', () => {
      const tagged = [decl('ui5.fill', 'fill', ['selector', 'value'])];

      const rendered = renderCapabilitySignature(
        { qualifiedName: 'ui5.fill', name: 'fill' },
        tagged,
      );

      expect(rendered).toBe('fill(selector, value)');
    });

    it('renders a no-argument method with empty parentheses', () => {
      const tagged = [decl('ui5.destroy', 'destroy', [])];

      const rendered = renderCapabilitySignature(
        { qualifiedName: 'ui5.destroy', name: 'destroy' },
        tagged,
      );

      expect(rendered).toBe('destroy()');
    });

    it('keeps the optional marker already present on a parameter', () => {
      const tagged = [decl('ui5.waitForUI5', 'waitForUI5', ['timeout?'])];

      const rendered = renderCapabilitySignature(
        { qualifiedName: 'ui5.waitForUI5', name: 'waitForUI5' },
        tagged,
      );

      expect(rendered).toBe('waitForUI5(timeout?)');
    });
  });

  // The conservative half: never assert a signature we cannot prove.
  describe('when no tagged declaration matches the capability name', () => {
    it('falls back to an explicit unknown-arguments form', () => {
      // `control.setValue` is tagged on createControlProxy, which forwards it.
      const tagged = [decl('control.setValue', 'createControlProxy', ['state'])];

      const rendered = renderCapabilitySignature(
        { qualifiedName: 'control.setValue', name: 'setValue' },
        tagged,
      );

      expect(rendered).toBe('setValue(...)');
    });

    it('does not borrow parameters from a differently-named declaration', () => {
      const tagged = [decl('ui5.control', 'browserBindTest', ['page'])];

      const rendered = renderCapabilitySignature(
        { qualifiedName: 'ui5.control', name: 'control' },
        tagged,
      );

      expect(rendered).not.toContain('page');
      expect(rendered).toBe('control(...)');
    });

    it('falls back when the capability has no tagged declaration at all', () => {
      const rendered = renderCapabilitySignature(
        { qualifiedName: 'ui5.date.setDatePicker', name: 'setDatePicker' },
        [],
      );

      expect(rendered).toBe('setDatePicker(...)');
    });
  });

  describe('when a capability is tagged in several places', () => {
    it('picks the declaration whose name matches, not the first listed', () => {
      const tagged = [
        decl('ui5.control', 'browserBindTest', ['page']),
        decl('ui5.control', 'UI5Handler', []),
        decl('ui5.control', 'control', ['selector', 'options?']),
      ];

      const rendered = renderCapabilitySignature(
        { qualifiedName: 'ui5.control', name: 'control' },
        tagged,
      );

      expect(rendered).toBe('control(selector, options?)');
    });

    it('ignores declarations tagged for a different capability', () => {
      const tagged = [
        decl('ui5.table.waitForData', 'waitForData', ['page', 'tableId']),
        decl('ui5.dialog.waitFor', 'waitFor', ['selector', 'options?']),
      ];

      const rendered = renderCapabilitySignature(
        { qualifiedName: 'ui5.dialog.waitFor', name: 'waitFor' },
        tagged,
      );

      expect(rendered).toBe('waitFor(selector, options?)');
    });
  });
});
