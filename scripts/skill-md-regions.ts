/**
 * @license
 * Copyright (c) ZesTest 2025-2030. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0
 *
 * This file may contain AI-assisted code.
 * See LICENSE and NOTICE files for details.
 */

/**
 * Generated regions inside a hand-authored markdown file.
 *
 * @remarks
 * `skills/playwright-praman-sap-testing/SKILL.md` is the instruction set every
 * Praman agent reads first. Most of it is genuinely editorial and should stay
 * hand-written. Two parts are facts about the code, and both had rotted: the
 * header claimed `v1.0.1` while the package was 1.3.5, and the capability table
 * listed 135 of 198 entries, with wrong parameters on some of them.
 *
 * Marker-delimited regions let the generator own exactly those facts and nothing
 * else. Verified that prettier leaves the markers and any fenced block inside
 * them untouched, so the file stays byte-stable across commits.
 *
 * @module scripts
 */

/** Marker names for the regions a generator owns. */
export const REGION_MARKERS = {
  /** Package name, version and import line. */
  meta: 'praman:generated:meta',
  /** The capability table agents read in place of runtime APIs. */
  capabilities: 'praman:generated:capabilities',
} as const;

/** Builds the literal HTML comment that opens or closes a region. */
function marker(region: string, edge: 'start' | 'end'): string {
  return `<!-- ${region} ${edge} -->`;
}

/**
 * Replaces the body between a region's start and end markers.
 *
 * @remarks
 * Absent or out-of-order markers throw rather than being skipped. A silent
 * no-op would leave a stale claim in front of every agent, which is the exact
 * failure this mechanism exists to prevent.
 *
 * @param content - Full file content.
 * @param region - Region name from {@link REGION_MARKERS}.
 * @param body - Replacement body, without the markers.
 * @param filePath - Optional path, named in errors to aid diagnosis.
 * @returns The content with that region's body replaced.
 * @throws Error when the markers are missing or out of order.
 *
 * @capability generated.skillRegion
 *
 * @example
 * ```typescript
 * const updated = replaceRegion(skillMd, REGION_MARKERS.meta, metaBlock, 'SKILL.md');
 * ```
 */
export function replaceRegion(
  content: string,
  region: string,
  body = '',
  filePath?: string,
): string {
  const where = filePath === undefined ? '' : ` in ${filePath}`;
  const open = marker(region, 'start');
  const close = marker(region, 'end');

  const startIndex = content.indexOf(open);
  const endIndex = content.indexOf(close);

  if (startIndex === -1 && endIndex === -1) {
    throw new Error(`Generated region "${region}" not found${where}: expected ${open} … ${close}`);
  }
  if (startIndex === -1) {
    throw new Error(`Generated region "${region}"${where} has an end marker but no start marker`);
  }
  if (endIndex === -1) {
    throw new Error(`Generated region "${region}"${where} has a start marker but no end marker`);
  }
  if (endIndex < startIndex) {
    throw new Error(
      `Generated region "${region}"${where} has its markers in the wrong order — end appears before start`,
    );
  }

  const head = content.slice(0, startIndex + open.length);
  const tail = content.slice(endIndex);
  const trimmed = body.trim();
  const middle = trimmed === '' ? '\n\n' : `\n\n${trimmed}\n\n`;

  return `${head}${middle}${tail}`;
}
