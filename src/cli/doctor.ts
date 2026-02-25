/**
 * @license
 * Copyright (c) ZesTest 2025-2030. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0
 *
 * This file may contain AI-assisted code.
 * See LICENSE and NOTICE files for details.
 */

/**
 * Diagnostic doctor command for the Praman CLI.
 *
 * @remarks
 * Runs environment checks, IDE detection, and pre-flight validation,
 * then displays a structured diagnostic report in the terminal.
 * Uses the CLI logger (not pino) for human-readable coloured output.
 *
 * @module cli/doctor
 */

import process from 'node:process';

import { detectIDEs, getIDELabels } from './ide-detector.js';
import { logBanner, logError, logSection, logSuccess, logTable, logWarn } from './logger.js';
import { validate } from './validator.js';
import { getVersion } from './version.js';

/**
 * Runs the Praman doctor diagnostic command.
 *
 * @remarks
 * Displays environment information, detected IDEs, pre-flight check
 * results, and a pass/fail/warn summary. All output is written to
 * the terminal via the CLI logger functions.
 *
 * @example
 * ```typescript
 * import { runDoctor } from './doctor.js';
 *
 * runDoctor();
 * ```
 */
export function runDoctor(): void {
  const version = getVersion();

  // ── Banner ──────────────────────────────────────────────────────────────────
  logBanner('Praman Doctor', version);

  // ── Environment ─────────────────────────────────────────────────────────────
  logSection('Environment');
  logTable([
    ['Node.js', process.versions.node],
    ['Platform', process.platform],
    ['Praman', version],
  ]);

  // ── IDE Detection ───────────────────────────────────────────────────────────
  logSection('IDE Detection');
  const detection = detectIDEs(process.cwd());
  const labels = getIDELabels(detection);

  if (labels.length > 0) {
    for (const label of labels) {
      logSuccess(`Detected: ${label}`);
    }
  } else {
    logWarn('No IDEs detected');
  }

  // ── Pre-flight Checks ──────────────────────────────────────────────────────
  logSection('Pre-flight Checks');
  const report = validate();

  for (const check of report.checks) {
    const text = `${check.name}: ${check.message}`;
    if (check.status === 'pass') {
      logSuccess(text);
    } else if (check.status === 'warn') {
      logWarn(text);
    } else {
      logError(text);
    }
  }

  // ── Summary ─────────────────────────────────────────────────────────────────
  logSection('Summary');

  if (report.passed > 0) {
    logSuccess(`${String(report.passed)} passed`);
  }
  if (report.warnings > 0) {
    logWarn(`${String(report.warnings)} warning${report.warnings === 1 ? '' : 's'}`);
  }
  if (report.failed > 0) {
    logError(`${String(report.failed)} failed`);
  }
}
