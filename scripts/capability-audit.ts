/**
 * @license
 * Copyright (c) ZesTest 2025-2030. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0
 *
 * This file may contain AI-assisted code.
 * See LICENSE and NOTICE files for details.
 */

/**
 * Audit rules relating `capabilities.yaml` to the `@capability` tags in source.
 *
 * @remarks
 * `capabilities.yaml` is the manifest AI agents read to learn what Praman can do,
 * and these rules are the only thing tying it to the actual code. They are kept
 * apart from the scanning helpers in `capability-validation-utils.ts` because
 * they are pure decisions over counts and names, which makes them unit-testable
 * without touching the filesystem.
 *
 * @module scripts
 */

import type { SourceCapability } from './capability-validation-utils.js';

/**
 * Extracts the qualified name from a raw `@capability` tag value.
 *
 * @remarks
 * `CAPABILITY_TAG_REGEX` captures everything after the tag, so a tag written as
 * `@capability ui5.control — discovers one control` yields the prose too. Only
 * the first whitespace-delimited token is the qualified name.
 *
 * @param tagText - Raw text captured after `@capability`.
 * @returns The qualified name alone.
 *
 * @example
 * ```typescript
 * capabilityNameFromTag('ui5.control — discovers one control'); // 'ui5.control'
 * ```
 */
export function capabilityNameFromTag(tagText: string): string {
  return tagText.trim().split(/\s+/)[0] ?? '';
}

/**
 * Finds the source tag that declares a capability, matching the exact name.
 *
 * @remarks
 * Matching is an exact comparison of qualified names, deliberately. The previous
 * implementation accepted a substring match against the capability's *short*
 * name, which reported unrelated code as the implementation — `ui5.control`
 * matched `matchers.getControlProperty`, `ui5.controls` matched
 * `ui5Wait.forControlState`, and `ui5.dialog.waitFor` matched
 * `ui5.table.waitForData`. That inflated the verified count and hid the real gap,
 * which is worse than no verification at all: it reported the manifest agents
 * read as checked against code when it was not.
 *
 * @param qualifiedName - Qualified name from `capabilities.yaml`.
 * @param sourceTags - Tags scanned from source.
 * @returns The declaring tag, or `undefined` when no source declares it.
 *
 * @example
 * ```typescript
 * const tag = findCapabilityTag('ui5.control', sourceTags);
 * if (tag === undefined) throw new Error('ui5.control is undocumented in source');
 * ```
 */
export function findCapabilityTag(
  qualifiedName: string,
  sourceTags: readonly SourceCapability[],
): SourceCapability | undefined {
  return sourceTags.find((tag) => capabilityNameFromTag(tag.tagText) === qualifiedName);
}

/**
 * Counts that decide whether capability validation passes.
 *
 * @example
 * ```typescript
 * const counts: CapabilityValidationCounts = {
 *   unverified: 0,
 *   invalidTags: 0,
 *   exportsMissingTag: 225,
 * };
 * ```
 */
export interface CapabilityValidationCounts {
  /** Manifest entries with no implementing `@capability` tag in source. */
  readonly unverified: number;
  /** Source tags naming a capability absent from the manifest. */
  readonly invalidTags: number;
  /** Exported symbols carrying no `@capability` tag at all. */
  readonly exportsMissingTag: number;
}

/**
 * Decides whether `capabilities.yaml` and the source agree well enough to pass.
 *
 * @remarks
 * Two disagreements are hard failures even outside `--strict`, because either one
 * means the manifest agents read does not describe the code: an entry nothing
 * declares (the manifest over-promises, the same defect as issue #246 where
 * `files[]` named directories that did not exist), and a tag naming no entry (the
 * code claims a capability agents cannot discover).
 *
 * Untagged exports remain strict-only. That is the far broader CLAUDE.md rule 15
 * sweep; gating every PR on it would block work on it rather than enable it.
 *
 * @param counts - Observed validation counts.
 * @param options - `strict` additionally requires every export to be tagged.
 * @returns One message per failure; empty when validation passes.
 *
 * @example
 * ```typescript
 * const failures = capabilityValidationFailures(counts, { strict: false });
 * if (failures.length > 0) process.exitCode = 1;
 * ```
 */
export function capabilityValidationFailures(
  counts: CapabilityValidationCounts,
  options: { readonly strict: boolean },
): string[] {
  const failures: string[] = [];

  if (counts.unverified > 0) {
    failures.push(
      `${String(counts.unverified)} capabilities.yaml entries have no @capability tag in source — ` +
        `the manifest promises capabilities the code does not declare.`,
    );
  }
  if (counts.invalidTags > 0) {
    failures.push(
      `${String(counts.invalidTags)} @capability tags name no capabilities.yaml entry — ` +
        `the code claims capabilities agents cannot discover.`,
    );
  }
  if (options.strict && counts.exportsMissingTag > 0) {
    failures.push(`${String(counts.exportsMissingTag)} exports are missing a @capability tag.`);
  }

  return failures;
}
