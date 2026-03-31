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

import type { ConfigShowOptions } from './config-show.js';
import { runConfigShow } from './config-show.js';
import { runDoctor } from './doctor.js';
import type { InitAgentsOptions } from './init-agents.js';
import { isValidLoop, runInitAgents } from './init-agents.js';
import type { InitOptions } from './init.js';
import { runInit } from './init.js';
import type { InspectOptions } from './inspect.js';
import { runInspect } from './inspect.js';
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
const TARGET_DIR_OPTION = '--target <dir>' as const;
const TARGET_DIR_DESC = 'Target directory' as const;

export function createProgram(): Command {
  const prog = new Command();

  prog
    .name('playwright-praman')
    .description('Agent-First SAP UI5 Test Automation Plugin for Playwright')
    .version(getVersion(), '-v, --version')
    .showHelpAfterError(true);

  prog
    .command('init')
    .description('Scaffold a new Praman project')
    .option('--force', 'Overwrite existing files', false)
    .option('--skip-install', 'Skip npm install step', false)
    .option(TARGET_DIR_OPTION, TARGET_DIR_DESC, process.cwd())
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
    .command('init-agents')
    .description('Install AI agent definitions for a specific IDE')
    .option(
      '--loop <ide>',
      'IDE target (vscode|claude|cursor|jules|opencode|copilot|detect)',
      'detect',
    )
    .option('--force', 'Overwrite existing agent files', false)
    .option(TARGET_DIR_OPTION, TARGET_DIR_DESC, process.cwd())
    .addHelpText(
      'afterAll',
      `
Examples:
  $ npx playwright-praman init-agents --loop=vscode
  $ npx playwright-praman init-agents --loop=claude
  $ npx playwright-praman init-agents --loop=opencode
  $ npx playwright-praman init-agents --loop=cursor
  $ npx playwright-praman init-agents              # auto-detect`,
    )
    .action(async (opts: { loop: string; force: boolean; target: string }) => {
      try {
        if (!isValidLoop(opts.loop)) {
          logError(
            `Invalid --loop value: "${opts.loop}". Valid: vscode, claude, cursor, jules, opencode, copilot, detect`,
          );
          process.exitCode = 1;
          return;
        }
        const agentOpts: InitAgentsOptions = {
          targetDir: opts.target,
          loop: opts.loop,
          force: opts.force,
        };
        await runInitAgents(agentOpts);
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
    .option(TARGET_DIR_OPTION, TARGET_DIR_DESC, process.cwd())
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

  prog
    .command('inspect [url]')
    .description('Open a live SAP app in a browser and interactively inspect UI5 controls')
    .option('--auth <path>', 'Playwright storageState JSON file for authentication')
    .option('--browser <name>', 'Browser: chromium, firefox, webkit', 'chromium')
    .option('--timeout <ms>', 'UI5 bootstrap timeout in milliseconds', '30000')
    .option('--viewport <WxH>', 'Viewport size', '1920x1080')
    .addHelpText(
      'afterAll',
      `
Examples:
  $ npx playwright-praman inspect https://my-sap.example.com
  $ npx playwright-praman inspect https://my-sap.example.com --auth .auth/user.json
  $ npx playwright-praman inspect --browser firefox`,
    )
    .action(
      async (
        url: string | undefined,
        opts: { auth?: string; browser?: string; timeout?: string; viewport?: string },
      ) => {
        try {
          const browser =
            opts.browser === 'firefox' || opts.browser === 'webkit' || opts.browser === 'chromium'
              ? opts.browser
              : 'chromium';
          const inspectOpts: InspectOptions = {
            ...(url !== undefined ? { url } : {}),
            ...(opts.auth !== undefined ? { auth: opts.auth } : {}),
            browser,
            ...(opts.timeout !== undefined ? { timeout: Number.parseInt(opts.timeout, 10) } : {}),
            ...(opts.viewport !== undefined ? { viewport: opts.viewport } : {}),
          };
          await runInspect(inspectOpts);
        } catch (error: unknown) {
          logError(error instanceof Error ? error.message : String(error));
          process.exitCode = 1;
        }
      },
    );

  prog
    .command('config')
    .description('Display the resolved Praman configuration')
    .option('--json', 'Output as raw JSON', false)
    .option('--show-secrets', 'Show sensitive values without redaction', false)
    .addHelpText(
      'afterAll',
      `
Examples:
  $ npx playwright-praman config
  $ npx playwright-praman config --json
  $ PRAMAN_LOG_LEVEL=debug npx playwright-praman config`,
    )
    .action(async (opts: { json: boolean; showSecrets: boolean }) => {
      try {
        const configOpts: ConfigShowOptions = {
          json: opts.json,
          showSecrets: opts.showSecrets,
        };
        await runConfigShow(configOpts);
      } catch (error: unknown) {
        logError(error instanceof Error ? error.message : String(error));
        process.exitCode = 1;
      }
    });

  return prog;
}

/** Singleton program instance for the CLI entry point. */
export const program = createProgram();
