/**
 * @license
 * Copyright (c) ZesTest 2025-2030. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0
 *
 * This file may contain AI-assisted code.
 * See LICENSE and NOTICE files for details.
 */

/**
 * Writing and verifying generated files.
 *
 * @remarks
 * Generators used to write raw content, which prettier then rewrote on commit.
 * `docs/capabilities.md` and `src/ai/capability-registry.generated.ts`
 * oscillated as a result: generate, commit (prettier reformats), generate again,
 * dirty again. While that was true no drift check could exist, because the files
 * were never byte-stable.
 *
 * Formatting inside the generator makes the output canonical before it lands, so
 * generator output, the committed bytes, and what prettier wants all coincide.
 *
 * One helper answers both questions a generator has — "write this" and "is what
 * is on disk what I would have written?" — so the drift check compares against
 * the identical pipeline rather than a reimplementation that could disagree
 * with it.
 *
 * @module scripts
 */

import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname } from 'node:path';

import { format, resolveConfig } from 'prettier';

/** Whether to write the file or only report whether it is current. */
export type EmitMode = 'write' | 'check';

/**
 * Outcome of emitting one generated file.
 *
 * @example
 * ```typescript
 * const result = await emitGenerated(path, content, 'check');
 * if (result.changed) console.error(`stale: ${result.path}`);
 * ```
 */
export interface EmitResult {
  /** The file acted on, so callers can report exactly which files drifted. */
  readonly path: string;
  /** In `write` mode, whether bytes changed. In `check` mode, whether it is stale. */
  readonly changed: boolean;
}

/**
 * Formats content the way prettier would, given the target file's extension.
 *
 * @remarks
 * Returns the content untouched when prettier has no parser for the extension,
 * so a generator may emit arbitrary file types through the same path.
 *
 * @param content - Raw generated content.
 * @param filePath - Destination path, used to infer the parser.
 * @returns Canonically formatted content.
 *
 * @example
 * ```typescript
 * const canonical = await formatForPath('export const a = {b:1}', 'out.ts');
 * ```
 */
export async function formatForPath(content: string, filePath: string): Promise<string> {
  const options = await resolveConfig(filePath);
  try {
    return await format(content, { ...options, filepath: filePath });
  } catch {
    // No parser for this extension — emit as-is rather than failing the build.
    return content;
  }
}

/**
 * Reads a file, treating "not there" as no content.
 *
 * @remarks
 * Reads and handles failure rather than calling `existsSync` first. The
 * check-then-act form is a time-of-check/time-of-use race — CodeQL's
 * `js/file-system-race`, raised as high severity — because the file can change
 * between the two calls. Attempting the read is both race-free and the
 * idiomatic Node form.
 */
function readIfPresent(filePath: string): string | undefined {
  try {
    // eslint-disable-next-line security/detect-non-literal-fs-filename -- generator utility: path is built by the caller from the repo root
    return readFileSync(filePath, 'utf8');
  } catch {
    return undefined;
  }
}

/**
 * Writes a generated file, or reports whether the one on disk is current.
 *
 * @remarks
 * `check` never writes and never throws for a missing file: an absent artifact
 * is drift, which is exactly what CI needs to be told.
 *
 * @param filePath - Absolute destination path.
 * @param content - Raw generated content, formatted before comparison.
 * @param mode - `write` to emit, `check` to verify only.
 * @returns Which file was handled and whether it changed or is stale.
 *
 * @example
 * ```typescript
 * const results = await Promise.all(
 *   artifacts.map((a) => emitGenerated(a.path, a.content, check ? 'check' : 'write')),
 * );
 * const stale = results.filter((r) => r.changed);
 * ```
 */
export async function emitGenerated(
  filePath: string,
  content: string,
  mode: EmitMode,
): Promise<EmitResult> {
  const formatted = await formatForPath(content, filePath);
  const current = readIfPresent(filePath);
  const changed = current !== formatted;

  if (mode === 'check' || !changed) {
    return { path: filePath, changed };
  }

  // eslint-disable-next-line security/detect-non-literal-fs-filename -- generator utility: creating the artifact's own directory
  mkdirSync(dirname(filePath), { recursive: true });
  // eslint-disable-next-line security/detect-non-literal-fs-filename -- generator utility: writing the artifact the caller named
  writeFileSync(filePath, formatted, 'utf8');
  return { path: filePath, changed: true };
}
