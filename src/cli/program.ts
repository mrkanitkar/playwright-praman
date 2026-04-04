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

import { writeFile } from 'node:fs/promises';
import process from 'node:process';

import { Command } from 'commander';

import { createBridgeInjectionScript } from '../bridge/browser-scripts/inject-ui5.js';

import type { ConfigShowOptions } from './config-show.js';
import { runConfigShow } from './config-show.js';
import { runDoctor } from './doctor.js';
import type { InitAgentsOptions } from './init-agents.js';
import { isValidLoop, runInitAgents } from './init-agents.js';
import type { InitOptions } from './init.js';
import { runInit } from './init.js';
import { logError, logSuccess } from './logger.js';
import type { SnapshotOptions } from './snapshot-command.js';
import { runSnapshot } from './snapshot-command.js';
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
    .option(
      '--no-cli',
      'Disable Playwright CLI agent definitions (CLI agents are installed by default)',
    )
    .option(TARGET_DIR_OPTION, TARGET_DIR_DESC, process.cwd())
    .addHelpText(
      'afterAll',
      `
Examples:
  $ npx playwright-praman init
  $ npx playwright-praman init --force
  $ npx playwright-praman init --no-cli
  $ npx playwright-praman init --target ./my-project`,
    )
    .action(async (opts: { force: boolean; cli: boolean; target: string }) => {
      try {
        const initOpts: InitOptions = {
          targetDir: opts.target,
          force: opts.force,
          cli: opts.cli,
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
    .option('--no-cli', 'Disable CLI-based agents (Playwright CLI agents are installed by default)')
    .option(TARGET_DIR_OPTION, TARGET_DIR_DESC, process.cwd())
    .addHelpText(
      'afterAll',
      `
Examples:
  $ npx playwright-praman init-agents --loop=vscode
  $ npx playwright-praman init-agents --loop=claude
  $ npx playwright-praman init-agents --loop=claude --no-cli
  $ npx playwright-praman init-agents --loop=opencode
  $ npx playwright-praman init-agents --loop=cursor
  $ npx playwright-praman init-agents              # auto-detect`,
    )
    .action(async (opts: { loop: string; force: boolean; cli: boolean; target: string }) => {
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
          cli: opts.cli,
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

  prog
    .command('bridge-script')
    .description('Export bridge init script for playwright-cli initScript config')
    .option('--output <path>', 'Write to file instead of stdout')
    .addHelpText(
      'afterAll',
      `
Examples:
  $ npx playwright-praman bridge-script
  $ npx playwright-praman bridge-script --output .playwright/praman-bridge.js`,
    )
    .action(async (opts: { output?: string }) => {
      try {
        const script = createBridgeInjectionScript();
        if (opts.output !== undefined) {
          // eslint-disable-next-line security/detect-non-literal-fs-filename -- opts.output is a user-provided CLI argument for bridge script output path
          await writeFile(opts.output, script, 'utf8');
          logSuccess(`Bridge script written to ${opts.output}`);
        } else {
          process.stdout.write(script);
        }
      } catch (error: unknown) {
        logError(error instanceof Error ? error.message : String(error));
        process.exitCode = 1;
      }
    });

  prog
    .command('snapshot')
    .description('Capture a structured SAP UI5 control tree snapshot from a live session')
    .option('--session <name>', 'Playwright session name to connect to', 'pwtest')
    .option('--output <path>', 'Write snapshot to file (default: stdout)')
    .option('--format <fmt>', 'Output format: json | yaml | table', 'json')
    .option('--depth <n>', 'Maximum number of controls to return (0 = unlimited)', '0')
    .option('--filter <type>', 'Filter by control type prefix (e.g. sap.m.Button)')
    .addHelpText(
      'afterAll',
      `
Examples:
  $ npx playwright-praman snapshot
  $ npx playwright-praman snapshot --format table
  $ npx playwright-praman snapshot --filter sap.m.Button
  $ npx playwright-praman snapshot --depth 50 --output snapshot.json
  $ npx playwright-praman snapshot --session mySession --format yaml`,
    )
    .action(
      (opts: {
        session?: string;
        output?: string;
        format?: string;
        depth?: string;
        filter?: string;
      }) => {
        try {
          const rawFormat = opts.format ?? 'json';
          const format: 'json' | 'yaml' | 'table' =
            rawFormat === 'yaml' || rawFormat === 'table' ? rawFormat : 'json';
          const snapshotOpts: SnapshotOptions = {
            ...(opts.session !== undefined ? { session: opts.session } : {}),
            ...(opts.output !== undefined ? { output: opts.output } : {}),
            format,
            depth: opts.depth !== undefined ? Number.parseInt(opts.depth, 10) : 0,
            ...(opts.filter !== undefined ? { filter: opts.filter } : {}),
          };
          runSnapshot(snapshotOpts);
        } catch (error: unknown) {
          logError(error instanceof Error ? error.message : String(error));
          process.exitCode = 1;
        }
      },
    );

  // ── capabilities command ──
  prog
    .command('capabilities')
    .description('Show Praman capability manifest for agents')
    .option('--format <fmt>', 'Output format: json, table, agent', 'json')
    .option('--agent', 'Shortcut for --format=agent')
    .action(async (opts: { format?: string; agent?: boolean }) => {
      try {
        const { runCapabilities } = await import('./capabilities-command.js');
        const format =
          opts.agent === true
            ? 'agent'
            : ((opts.format as 'json' | 'table' | 'agent' | undefined) ?? 'json');
        runCapabilities({ format });
      } catch (error: unknown) {
        logError(error instanceof Error ? error.message : String(error));
        process.exitCode = 1;
      }
    });

  // ── verify-spec command ──
  prog
    .command('verify-spec <file>')
    .description('Verify a generated .spec.ts against gold-standard rules')
    .action(async (file: string) => {
      try {
        const { runVerifySpec } = await import('./verify-spec-command.js');
        runVerifySpec(file);
      } catch (error: unknown) {
        logError(error instanceof Error ? error.message : String(error));
        process.exitCode = 1;
      }
    });

  return prog;
}

/** Singleton program instance for the CLI entry point. */
export const program = createProgram();
