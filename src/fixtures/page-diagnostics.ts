/**
 * @license
 * Copyright (c) ZesTest 2025-2030. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0
 *
 * This file may contain AI-assisted code.
 * See LICENSE and NOTICE files for details.
 */

/**
 * UI5 diagnostics capture — console output, page errors, and network requests.
 *
 * @ai
 * @aiContext Collects what the page said and did, for attachment to a failing
 * test. UI5 logs heavily through `sap/base/Log`, so this turns "the assertion
 * failed" into "the assertion failed and here is what UI5 was complaining about".
 *
 * @remarks
 * Uses `page.consoleMessages()`, `page.pageErrors()` and `page.requests()`,
 * all present at Praman's 1.57 Playwright floor — no version gate required.
 *
 * **Every call is deliberately argument-free.** From 1.59 these methods accept a
 * `filter` option, but at the floor they take none. JavaScript silently ignores
 * surplus arguments, so passing `{ filter }` to an older runtime would return
 * *every* message while the caller believed it received only the filtered
 * subset — wrong data rather than a crash. Failure diagnostics want everything
 * anyway, so there is no reason to pass it. Guard on
 * `hasConsoleMessageFilter` if that ever changes.
 *
 * Each source is captured independently: diagnostics run against a page that
 * has just failed and may be closed or mid-navigation, so one failing source
 * must not cost the other two.
 *
 * @example
 * ```typescript
 * import { collectPageDiagnostics } from '#fixtures/page-diagnostics.js';
 *
 * const diagnostics = await collectPageDiagnostics(page);
 * if (!diagnostics.isEmpty) {
 *   logger.warn({ diagnostics }, 'UI5 reported problems');
 * }
 * ```
 *
 * @module fixtures
 */

import type { ConsoleMessage, Page, Request } from '@playwright/test';

import { createLogger } from '#core/logging/logger.js';

/**
 * Maximum entries retained per diagnostic source.
 *
 * @remarks
 * UI5 is extremely chatty — an uncapped capture would bloat every failure
 * artifact. The caps keep attachments reviewable while retaining enough to
 * diagnose.
 *
 * @example
 * ```typescript
 * import { DIAGNOSTIC_CAPS } from '#fixtures/page-diagnostics.js';
 *
 * logger.info(DIAGNOSTIC_CAPS.consoleMessages); // 200
 * ```
 */
export const DIAGNOSTIC_CAPS = {
  consoleMessages: 200,
  pageErrors: 50,
  requests: 200,
} as const;

/** One console message, flattened for JSON attachment. */
interface CapturedConsoleMessage {
  readonly type: string;
  readonly text: string;
}

/** One network request, flattened for JSON attachment. */
interface CapturedRequest {
  readonly method: string;
  readonly url: string;
}

/**
 * Diagnostics gathered from a page.
 *
 * @example
 * ```typescript
 * const diagnostics: PageDiagnostics = await collectPageDiagnostics(page);
 * logger.info(diagnostics.consoleMessages.length);
 * ```
 */
export interface PageDiagnostics {
  readonly consoleMessages: readonly CapturedConsoleMessage[];
  readonly pageErrors: readonly string[];
  readonly requests: readonly CapturedRequest[];
  /** Which sources hit their cap, so a reader knows the list is partial. */
  readonly truncated: {
    readonly consoleMessages: boolean;
    readonly pageErrors: boolean;
    readonly requests: boolean;
  };
  /** `true` when nothing at all was captured — nothing worth attaching. */
  readonly isEmpty: boolean;
}

/** Shape of the page APIs used here, kept local so older type packages still compile. */
interface DiagnosticPage {
  consoleMessages?: () => Promise<ConsoleMessage[]>;
  pageErrors?: () => Promise<Error[]>;
  requests?: () => Promise<Request[]>;
}

/**
 * Runs one capture, returning an empty list rather than throwing.
 *
 * @param source - Name of the source, for debug logging.
 * @param fn - The capture call, or `undefined` when the API is absent.
 * @returns The captured values, or `[]` on any failure.
 */
async function captureSafely<T>(
  source: string,
  fn: (() => Promise<T[]>) | undefined,
): Promise<T[]> {
  if (typeof fn !== 'function') return [];
  try {
    return await fn();
  } catch (error: unknown) {
    createLogger('page-diagnostics').debug(
      { source, error: error instanceof Error ? error.message : String(error) },
      'Diagnostic capture failed (non-fatal)',
    );
    return [];
  }
}

/** Applies a cap, reporting whether anything was dropped. */
function applyCap<T>(items: readonly T[], cap: number): { kept: T[]; truncated: boolean } {
  return { kept: items.slice(0, cap), truncated: items.length > cap };
}

/**
 * Collects console output, page errors, and network requests from a page.
 *
 * @param page - The Playwright page to inspect.
 * @returns Capped, JSON-serialisable diagnostics. Never throws.
 *
 * @capability ui5Diagnostics.collect
 *
 * @example
 * ```typescript
 * const diagnostics = await collectPageDiagnostics(page);
 * await testInfo.attach('ui5-diagnostics', {
 *   contentType: 'application/json',
 *   body: Buffer.from(JSON.stringify(diagnostics, null, 2), 'utf8'),
 * });
 * ```
 */
export async function collectPageDiagnostics(page: Page): Promise<PageDiagnostics> {
  const api: DiagnosticPage = page;

  // Bound to the page so `this` survives extraction for the typeof check.
  const rawConsole = await captureSafely('consoleMessages', api.consoleMessages?.bind(page));
  const rawErrors = await captureSafely('pageErrors', api.pageErrors?.bind(page));
  const rawRequests = await captureSafely('requests', api.requests?.bind(page));

  const consoleCap = applyCap(rawConsole, DIAGNOSTIC_CAPS.consoleMessages);
  const errorCap = applyCap(rawErrors, DIAGNOSTIC_CAPS.pageErrors);
  const requestCap = applyCap(rawRequests, DIAGNOSTIC_CAPS.requests);

  const consoleMessages = consoleCap.kept.map((message) => ({
    type: message.type(),
    text: message.text(),
  }));
  const pageErrors = errorCap.kept.map((error) =>
    error instanceof Error ? (error.stack ?? error.message) : String(error),
  );
  const requests = requestCap.kept.map((request) => ({
    method: request.method(),
    url: request.url(),
  }));

  return {
    consoleMessages,
    pageErrors,
    requests,
    truncated: {
      consoleMessages: consoleCap.truncated,
      pageErrors: errorCap.truncated,
      requests: requestCap.truncated,
    },
    isEmpty: consoleMessages.length === 0 && pageErrors.length === 0 && requests.length === 0,
  };
}
