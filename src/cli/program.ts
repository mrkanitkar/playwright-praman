/**
 * @license
 * Copyright (c) ZesTest 2025-2030. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0
 *
 * This file may contain AI-assisted code.
 * See LICENSE and NOTICE files for details.
 */
/**
 * Commander.js program definition for the Praman CLI.
 *
 * @remarks
 * Defines the CLI command structure using Commander.js, matching
 * Playwright's architecture pattern where `program.ts` exports the
 * program instance and `index.ts` (bin entry) calls `.parse()`.
 *
 * The `createProgram()` factory enables per-test fresh instances,
 * avoiding Commander's internal state leakage between test runs.
 *
 * @example
 * ```typescript
 * import { createProgram } from './program.js';
 *
 * const program = createProgram();
 * program.parse(process.argv);
 * ```
 *
 * @module cli/program
 */

import process from 'node:process';

import { Command } from 'commander';

import { runDoctor } from './doctor.js';
import type { InitOptions } from './init.js';
import { runInit } from './init.js';
import { logError } from './logger.js';
import type { UninstallOptions } from './uninstall.js';
import { runUninstall } from './uninstall.js';
import { getVersion } from './version.js';

/**
 * Creates a configured Commander program instance for the Praman CLI.
 *
 * @remarks
 * Every command action handler wraps its async logic in try/catch,
 * matching Playwright's error boundary pattern. On failure, the error
 * message is logged via `logError()` and `process.exitCode` is set to 1.
 *
 * @returns A fully configured Commander `Command` instance.
 *
 * @example
 * ```typescript
 * const program = createProgram();
 * await program.parseAsync(['node', 'praman', 'init', '--force']);
 * ```
 */
export function createProgram(): Command {
  const prog = new Command();

  prog
    .name('playwright-praman')
    .description('AI-First SAP UI5 Test Automation for Playwright')
    .version(getVersion(), '-v, --version')
    .showHelpAfterError(true);

  prog
    .command('init')
    .description('Scaffold a new Praman project')
    .option('--force', 'Overwrite existing files', false)
    .option('--skip-install', 'Skip npm install step', false)
    .option('--target <dir>', 'Target directory', process.cwd())
    .addHelpText(
      'afterAll',
      `
Examples:
  $ npx playwright-praman init
  $ npx playwright-praman init --force
  $ npx playwright-praman init --skip-install --target ./my-project`,
    )
    .action(async (opts: { force: boolean; skipInstall: boolean; target: string }) => {
      try {
        const initOpts: InitOptions = {
          targetDir: opts.target,
          force: opts.force,
          skipInstall: opts.skipInstall,
        };
        await runInit(initOpts);
      } catch (error: unknown) {
        logError(error instanceof Error ? error.message : String(error));
        process.exitCode = 1;
      }
    });

  prog
    .command('doctor')
    .description('Run environment diagnostics')
    .addHelpText(
      'afterAll',
      `
Examples:
  $ npx playwright-praman doctor`,
    )
    .action(() => {
      try {
        runDoctor();
      } catch (error: unknown) {
        logError(error instanceof Error ? error.message : String(error));
        process.exitCode = 1;
      }
    });

  prog
    .command('uninstall')
    .description('Remove scaffolded files')
    .option('--confirm', 'Skip confirmation prompt', false)
    .option('--keep-config', 'Keep config files', false)
    .option('--keep-agents', 'Keep agent files', false)
    .option('--remove-browsers', 'Also remove Playwright browsers', false)
    .option('--target <dir>', 'Target directory', process.cwd())
    .addHelpText(
      'afterAll',
      `
Examples:
  $ npx playwright-praman uninstall
  $ npx playwright-praman uninstall --confirm
  $ npx playwright-praman uninstall --confirm --keep-config --keep-agents`,
    )
    .action(
      async (opts: {
        confirm: boolean;
        keepConfig: boolean;
        keepAgents: boolean;
        removeBrowsers: boolean;
        target: string;
      }) => {
        try {
          const uninstallOpts: UninstallOptions = {
            targetDir: opts.target,
            confirm: opts.confirm,
            keepConfig: opts.keepConfig,
            keepAgents: opts.keepAgents,
            removeBrowsers: opts.removeBrowsers,
          };
          await runUninstall(uninstallOpts);
        } catch (error: unknown) {
          logError(error instanceof Error ? error.message : String(error));
          process.exitCode = 1;
        }
      },
    );

  return prog;
}

/** Singleton program instance for the CLI entry point. */
export const program = createProgram();
