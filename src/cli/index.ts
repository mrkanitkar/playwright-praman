#!/usr/bin/env node
/**
 * @license
 * Copyright (c) ZesTest 2025-2030. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0
 *
 * This file may contain AI-assisted code.
 * See LICENSE and NOTICE files for details.
 */
/**
 * Praman CLI entry point — imports the Commander program and executes it.
 *
 * @remarks
 * This is the bin entry point (`dist/cli/index.js`). It imports the
 * program from `./program.js` and calls `.parse(process.argv)`.
 * Matches Playwright's pattern: `cli.js` imports program and calls parse.
 *
 * For testing and programmatic use, import from `./program.js` instead.
 *
 * @example
 * ```bash
 * npx playwright-praman init
 * npx playwright-praman doctor
 * npx playwright-praman --help
 * ```
 *
 * @module cli
 */

import process from 'node:process';

void (async () => {
  // Load .env file if dotenv is available (devDependency)
  try {
    await import('dotenv/config');
  } catch {
    // dotenv not installed — env vars must be set manually
  }

  const { program } = await import('./program.js');
  await program.parseAsync(process.argv);
})();
