/**
 * @license
 * Copyright (c) ZesTest 2025-2030. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0
 *
 * This file may contain AI-assisted code.
 * See LICENSE and NOTICE files for details.
 */

/**
 * `praman snapshot` command runner — side-effecting CLI orchestration.
 *
 * @remarks
 * Provides the CLI action handler and the Playwright CLI bridge that executes
 * the UI5 ElementRegistry enricher script and writes output.
 *
 * Pure types, the enricher script, filter helpers, and formatters live in
 * `snapshot-formatters.ts` to keep each module under the 300-line limit.
 *
 * @module cli/snapshot-command
 */

import { execSync } from 'node:child_process';
import * as nodeFs from 'node:fs';
import process from 'node:process';

import { logBanner, logError, logSuccess, logWarn } from './logger.js';
import type { ControlSnapshot, SnapshotOptions } from './snapshot-formatters.js';
import {
  buildEnricherScript,
  filterByType,
  formatJson,
  formatTable,
  formatYaml,
  limitDepth,
} from './snapshot-formatters.js';
import { getVersion } from './version.js';

import type { PramanErrorOptions } from '#core/errors/base.js';
import { PramanError } from '#core/errors/base.js';
import { ErrorCode } from '#core/errors/codes.js';

export type { BindingDescriptor, ControlSnapshot, SnapshotOptions } from './snapshot-formatters.js';
export {
  buildEnricherScript,
  filterByType,
  formatJson,
  formatTable,
  formatYaml,
  limitDepth,
} from './snapshot-formatters.js';

// ── Error class ───────────────────────────────────────────────────────────────

/**
 * Error thrown when snapshot execution fails.
 *
 * @remarks
 * Extends {@link PramanError} with a fixed `ERR_BRIDGE_EXECUTION` code and
 * `retryable: false` — snapshot failures are caused by script errors or
 * missing sessions, neither of which self-heals on retry.
 *
 * @example
 * ```typescript
 * throw new SnapshotError({
 *   message: 'Playwright CLI exited with code 1',
 *   attempted: 'Run snapshot enricher script',
 * });
 * ```
 */
export class SnapshotError extends PramanError {
  /**
   * Creates a new SnapshotError.
   *
   * @param options - Base error options (minus `code` and `retryable`).
   *
   * @example
   * ```typescript
   * const error = new SnapshotError({
   *   message: 'No active Playwright session found',
   *   attempted: 'Connect to session "default"',
   * });
   * ```
   */
  constructor(options: Omit<PramanErrorOptions, 'code' | 'retryable'>) {
    super({
      code: ErrorCode.ERR_BRIDGE_EXECUTION,
      retryable: false,
      message: options.message,
      attempted: options.attempted,
      ...(options.severity !== undefined ? { severity: options.severity } : {}),
      ...(options.details !== undefined ? { details: options.details } : {}),
      ...(options.suggestions !== undefined ? { suggestions: options.suggestions } : {}),
      ...(options.cause !== undefined ? { cause: options.cause } : {}),
    });
    this.name = 'SnapshotError';
  }
}

// ── Playwright CLI runner ─────────────────────────────────────────────────────

/**
 * Executes the enricher script via `playwright cli run-code` and returns
 * the raw `ControlSnapshot[]` before filtering or formatting.
 *
 * @remarks
 * Uses `execSync` to spawn Playwright CLI synchronously so it fits naturally
 * into Commander.js's action handler without requiring a full async spawn chain.
 * The enricher script is passed as an inline `--code` argument.
 *
 * @param session - Playwright session name (passed as `--session` to run-code).
 * @returns Parsed array of {@link ControlSnapshot} records.
 * @throws {@link SnapshotError} When the CLI exits non-zero or returns malformed JSON.
 *
 * @example
 * ```typescript
 * const controls = executeEnricherScript('pwtest');
 * ```
 */
export function executeEnricherScript(session: string): ControlSnapshot[] {
  const script = buildEnricherScript();
  const escapedScript = script.replaceAll('"', '\\"');
  const cmd = `npx playwright cli run-code --session ${session} --code "${escapedScript}"`;

  let raw: string;
  try {
    // eslint-disable-next-line sonarjs/os-command -- intentional: spawns playwright-cli, session name validated by Commander option parser
    raw = execSync(cmd, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }).trim();
  } catch (error: unknown) {
    const msg =
      error instanceof Error ? error.message : 'Playwright CLI exited with a non-zero status code';
    throw new SnapshotError({
      message: `Snapshot enricher script failed: ${msg}`,
      attempted: `Execute UI5 ElementRegistry reader via playwright cli run-code (session: ${session})`,
      suggestions: [
        'Ensure a Playwright browser session is open (run playwright cli open)',
        `Check session name: "${session}" — use --session to override`,
        'Verify playwright-praman is installed in the target project',
        'Check the browser console for JavaScript errors',
      ],
      details: { session, command: `playwright cli run-code --session ${session}` },
    });
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new SnapshotError({
      message: `Snapshot enricher returned non-JSON output: ${raw.slice(0, 200)}`,
      attempted: 'Parse ElementRegistry JSON from playwright cli run-code',
      suggestions: [
        'The page may not be a UI5 application',
        'Ensure the SAP framework has fully bootstrapped before running snapshot',
      ],
      details: { session, rawLength: raw.length },
    });
  }

  if (
    parsed !== null &&
    typeof parsed === 'object' &&
    !Array.isArray(parsed) &&
    '__error' in parsed
  ) {
    const errObj = parsed;
    throw new SnapshotError({
      message: `Enricher script threw an error: ${String(errObj.__error)}`,
      attempted: 'Read UI5 ElementRegistry in browser context',
      suggestions: [
        'The SAP framework may not be fully initialized',
        'Try again after the page has loaded completely',
      ],
      details: { session, browserError: String(errObj.__error) },
    });
  }

  if (!Array.isArray(parsed)) {
    throw new SnapshotError({
      message: `Enricher returned unexpected shape (expected array, got ${typeof parsed})`,
      attempted: 'Deserialise ElementRegistry snapshot',
      suggestions: ['This is an internal Praman error — please report it on GitHub'],
      details: { session },
    });
  }

  return parsed as ControlSnapshot[];
}

// ── Output writer ─────────────────────────────────────────────────────────────

/**
 * Writes formatted snapshot output to a file or stdout.
 *
 * @param content - The formatted string to write.
 * @param outputPath - File path. When `undefined`, writes to stdout.
 *
 * @example
 * ```typescript
 * writeOutput(formatJson(snapshots), opts.output);
 * ```
 */
export function writeOutput(content: string, outputPath: string | undefined): void {
  if (outputPath !== undefined) {
    // eslint-disable-next-line security/detect-non-literal-fs-filename -- outputPath is user-supplied CLI argument, intentional
    nodeFs.writeFileSync(outputPath, content, 'utf8');
    logSuccess(`Snapshot written to ${outputPath}`);
  } else {
    process.stdout.write(content);
  }
}

// ── Format dispatcher ─────────────────────────────────────────────────────────

/**
 * Dispatches a snapshot array to the appropriate formatter.
 *
 * @param controls - The control snapshot array to format.
 * @param format - The output format: `'json'`, `'yaml'`, or `'table'`.
 * @returns The formatted string.
 *
 * @example
 * ```typescript
 * const text = applyFormat(controls, 'table');
 * ```
 */
function applyFormat(
  controls: readonly ControlSnapshot[],
  format: 'json' | 'yaml' | 'table',
): string {
  switch (format) {
    case 'yaml':
      return formatYaml(controls);
    case 'table':
      return formatTable(controls);
    case 'json':
      return formatJson(controls);
  }
}

// ── Main command handler ──────────────────────────────────────────────────────

/**
 * Main handler for the `praman snapshot` CLI command.
 *
 * @remarks
 * Orchestrates the full snapshot pipeline:
 * 1. Log banner
 * 2. Execute enricher script via Playwright CLI (Track B)
 * 3. Apply `--filter` and `--depth` post-processing
 * 4. Format output as JSON, YAML, or table
 * 5. Write to file or stdout
 *
 * @param opts - Parsed command options from Commander.js.
 *
 * @example
 * ```typescript
 * runSnapshot({
 *   session: 'pwtest',
 *   format: 'table',
 *   filter: 'sap.m.Button',
 * });
 * ```
 */
export function runSnapshot(opts: SnapshotOptions): void {
  const session = opts.session ?? 'pwtest';
  const format = opts.format ?? 'json';
  const depth = opts.depth ?? 0;

  logBanner('Praman Snapshot', getVersion());

  let controls: ControlSnapshot[];
  try {
    controls = executeEnricherScript(session);
  } catch (error: unknown) {
    if (error instanceof SnapshotError) {
      logError(error.toUserMessage());
    } else {
      logError(error instanceof Error ? error.message : String(error));
    }
    process.exitCode = 1;
    return;
  }

  if (opts.filter !== undefined && opts.filter.length > 0) {
    const before = controls.length;
    controls = filterByType(controls, opts.filter);
    if (controls.length === 0) {
      logWarn(
        `No controls matched filter "${opts.filter}" (${String(before)} total controls found)`,
      );
    }
  }

  if (depth > 0) {
    controls = limitDepth(controls, depth);
  }

  writeOutput(applyFormat(controls, format), opts.output);

  if (opts.output !== undefined) {
    logSuccess(
      `Captured ${String(controls.length)} UI5 control${controls.length === 1 ? '' : 's'}`,
    );
  }
}
