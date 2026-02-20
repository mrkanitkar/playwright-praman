/**
 * CLI logger with ANSI-colored output for terminal display.
 *
 * @remarks
 * Distinct from the pino-based application logger. This is for CLI commands
 * (init, doctor) that produce human-readable terminal output.
 *
 * @module cli/logger
 */

/* eslint-disable no-console -- CLI logger intentionally uses console for terminal output */

const RESET = '\x1b[0m';
const BOLD = '\x1b[1m';
const RED = '\x1b[31m';
const GREEN = '\x1b[32m';
const YELLOW = '\x1b[33m';
const CYAN = '\x1b[36m';

/**
 * Logs a numbered progress step.
 *
 * @param step - Current step number.
 * @param total - Total number of steps.
 * @param message - Step description.
 *
 * @example
 * ```typescript
 * logStep(1, 5, 'Validating environment');
 * // Output: [1/5] Validating environment
 * ```
 */
export function logStep(step: number, total: number, message: string): void {
  console.log(`${CYAN}[${String(step)}/${String(total)}]${RESET} ${message}`);
}

/**
 * Logs a success message with green checkmark.
 *
 * @param message - The success message to display.
 *
 * @example
 * ```typescript
 * logSuccess('Configuration validated');
 * // Output: ✓ Configuration validated
 * ```
 */
export function logSuccess(message: string): void {
  console.log(`${GREEN}✓${RESET} ${message}`);
}

/**
 * Logs a warning message in yellow.
 *
 * @param message - The warning message to display.
 *
 * @example
 * ```typescript
 * logWarn('Optional dependency not found');
 * // Output: ⚠ Optional dependency not found
 * ```
 */
export function logWarn(message: string): void {
  console.error(`${YELLOW}⚠${RESET} ${message}`);
}

/**
 * Logs an error message in red.
 *
 * @param message - The error message to display.
 *
 * @example
 * ```typescript
 * logError('Failed to read configuration file');
 * // Output: ✗ Failed to read configuration file
 * ```
 */
export function logError(message: string): void {
  console.error(`${RED}✗${RESET} ${message}`);
}

/**
 * Logs a bold section header with surrounding blank lines.
 *
 * @param title - The section title to display.
 *
 * @example
 * ```typescript
 * logSection('Environment Check');
 * // Output: (blank line) Environment Check (blank line)
 * ```
 */
export function logSection(title: string): void {
  console.log(`\n${BOLD}${title}${RESET}\n`);
}

/**
 * Logs a key-value table with keys padded to the longest key length.
 *
 * @param rows - Array of `[key, value]` tuples to display.
 *
 * @example
 * ```typescript
 * logTable([
 *   ['Node version', '20.11.0'],
 *   ['OS', 'darwin'],
 * ]);
 * // Output:
 * //   Node version  20.11.0
 * //   OS            darwin
 * ```
 */
export function logTable(rows: readonly (readonly [string, string])[]): void {
  const maxKeyLen = Math.max(...rows.map(([key]) => key.length));
  for (const [key, value] of rows) {
    console.log(`  ${key.padEnd(maxKeyLen)}  ${value}`);
  }
}

/**
 * Logs a banner with the application name and version in bold cyan.
 *
 * @param title - The application name or banner title.
 * @param version - The version string to display beside the title.
 *
 * @example
 * ```typescript
 * logBanner('Praman CLI', '1.0.0');
 * // Output: (blank line) Praman CLI 1.0.0 (blank line)
 * ```
 */
export function logBanner(title: string, version: string): void {
  console.log(`\n${BOLD}${CYAN}${title}${RESET} ${version}\n`);
}
