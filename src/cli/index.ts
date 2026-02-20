#!/usr/bin/env node
/**
 * Praman CLI entry point -- routes subcommands to handlers.
 *
 * @remarks
 * Supports: `init`, `doctor`, `uninstall`
 * No external CLI framework -- uses process.argv parsing.
 *
 * The module exports `main()` for programmatic invocation and testing.
 * When executed directly via the `bin` entry, the self-executing call
 * at the bottom of this file invokes `main(process.argv)`.
 *
 * @example
 * ```bash
 * npx playwright-praman init
 * npx playwright-praman doctor
 * npx playwright-praman --help
 * npx playwright-praman --version
 * ```
 *
 * @module cli
 */

/* eslint-disable no-console -- CLI entry point intentionally uses console for --help and --version output */

import process from 'node:process';

import { runDoctor } from './doctor.js';
import { runInit } from './init.js';
import { logError } from './logger.js';
import { parseUninstallArgs, runUninstall } from './uninstall.js';
import { getVersion } from './version.js';

/**
 * Prints CLI usage information to stdout.
 *
 * @example
 * ```typescript
 * printHelp();
 * ```
 */
function printHelp(): void {
  console.log(`
Usage: playwright-praman <command> [options]

Commands:
  init          Scaffold a new Praman project
  doctor        Run environment diagnostics
  uninstall     Remove scaffolded files

Options:
  --help, -h       Show this help message
  --version, -v    Show version number
`);
}

/**
 * Prints the package version to stdout.
 *
 * @example
 * ```typescript
 * printVersion();
 * ```
 */
function printVersion(): void {
  console.log(getVersion());
}

/**
 * CLI entry point -- parses `argv` and dispatches to the appropriate subcommand.
 *
 * @remarks
 * Expects `argv` in the format of `process.argv` where:
 * - `argv[0]` is the Node.js executable path
 * - `argv[1]` is the script path
 * - `argv[2]` is the subcommand
 * - `argv[3..]` are subcommand-specific arguments
 *
 * @param argv - The raw argument array, typically `process.argv`.
 *
 * @example
 * ```typescript
 * import { main } from './cli/index.js';
 *
 * await main(['node', 'praman', 'init', '--force']);
 * await main(['node', 'praman', 'doctor']);
 * await main(['node', 'praman', '--version']);
 * ```
 */
export async function main(argv: readonly string[]): Promise<void> {
  const command = argv[2];

  try {
    switch (command) {
      case 'init': {
        await runInit(argv.slice(3));
        break;
      }

      case 'doctor': {
        runDoctor();
        break;
      }

      case 'uninstall': {
        const options = parseUninstallArgs(argv.slice(3));
        await runUninstall(options);
        break;
      }

      case '--version':
      case '-v': {
        printVersion();
        break;
      }

      case '--help':
      case '-h':
      case undefined:
      default: {
        printHelp();
        break;
      }
    }
  } catch (error: unknown) {
    logError(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  }
}

// ── Auto-execute when invoked as a CLI binary ──────────────────────────
// eslint-disable-next-line unicorn/prefer-top-level-await -- CJS output format does not support top-level await
void main(process.argv);
