/**
 * @license
 * Copyright (c) ZesTest 2025-2030. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0
 *
 * This file may contain AI-assisted code.
 * See LICENSE and NOTICE files for details.
 */

/**
 * TestDataHandler -- generates, persists, and cleans up test data.
 *
 * @ai
 * @aiContext Handler class for test data lifecycle: generate() with uuid/timestamp placeholders,
 * save()/load() for JSON persistence, cleanup() for automatic file removal on teardown.
 *
 * @remarks
 * Provides template-based data generation with placeholder substitution,
 * JSON file persistence, and automatic cleanup of persisted files on teardown.
 *
 * Placeholder tokens:
 * - `{{uuid}}` — replaced with a random UUID via `node:crypto`
 * - `{{timestamp}}` — replaced with an ISO-8601 timestamp
 * - `{{today}}` — current date in YYYY-MM-DD (SAP date format)
 * - `{{tomorrow}}` — tomorrow's date in YYYY-MM-DD
 * - `{{yesterday}}` — yesterday's date in YYYY-MM-DD
 * - `{{date+N}}` — date N days from now (e.g., `{{date+7}}`)
 * - `{{date-N}}` — date N days ago (e.g., `{{date-1}}`)
 *
 * Substitution is recursive: nested objects and arrays are traversed.
 * Non-string primitives (numbers, booleans, null) pass through unchanged.
 *
 * @example
 * ```typescript
 * const testData = new TestDataHandler({ baseDir: '/tmp/test-data' });
 * const order = testData.generate({
 *   id: '{{uuid}}',
 *   createdAt: '{{timestamp}}',
 *   deliveryDate: '{{today}}',
 *   dueDate: '{{date+30}}',
 * });
 * await testData.save('order.json', order);
 * const loaded = await testData.load<{ id: string }>('order.json');
 * await testData.cleanup();
 * ```
 *
 * @module fixtures
 */

import { randomUUID } from 'node:crypto';
import { mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

import type { Logger } from 'pino';

import { PramanError } from '#core/errors/base.js';
import { ErrorCode } from '#core/errors/codes.js';
import { createLogger } from '#core/logging/logger.js';
import { ui5Step, withStep } from '#core/utils/step-decorator.js';

// ── Types ────────────────────────────────────────────────────────────────

/**
 * Options for constructing a TestDataHandler.
 *
 * @example
 * ```typescript
 * const options: TestDataHandlerOptions = { baseDir: '/tmp/test-data' };
 * ```
 */
export interface TestDataHandlerOptions {
  /** Base directory for persisted test data files. */
  readonly baseDir: string;
}

// ── Class ────────────────────────────────────────────────────────────────

/**
 * Generates, persists, and cleans up test data files.
 *
 * @remarks
 * Designed for use in Playwright test fixtures. On teardown, call
 * {@link TestDataHandler.cleanup | cleanup()} to remove all persisted files.
 *
 * @capability testData.generate
 *
 * @example
 * ```typescript
 * const handler = new TestDataHandler({ baseDir: '/tmp/test-data' });
 * const data = handler.generate({ orderId: '{{uuid}}' });
 * await handler.save('order.json', data);
 * await handler.cleanup();
 * ```
 */
export class TestDataHandler {
  private readonly baseDir: string;
  private readonly log: Logger;
  private readonly trackedFiles: string[] = [];

  constructor(options: TestDataHandlerOptions) {
    this.baseDir = options.baseDir;
    this.log = createLogger('test-data');
  }

  /**
   * Generates test data from a template with placeholder substitution.
   *
   * @remarks
   * Deep-clones the template and replaces placeholder tokens:
   * - `{{uuid}}` — random UUID (each occurrence gets a unique value)
   * - `{{timestamp}}` — ISO-8601 timestamp at generation time
   * - `{{today}}` — current date in YYYY-MM-DD (SAP date format)
   * - `{{tomorrow}}` — tomorrow's date in YYYY-MM-DD
   * - `{{yesterday}}` — yesterday's date in YYYY-MM-DD
   * - `{{date+N}}` / `{{date-N}}` — date offset by N days
   *
   * Recursively processes nested objects and arrays. Non-string
   * primitives pass through unchanged.
   *
   * @param template - Object template with optional placeholder strings.
   * @returns A deep copy with all placeholders substituted.
   *
   * @example
   * ```typescript
   * const order = handler.generate({
   *   id: '{{uuid}}',
   *   createdAt: '{{timestamp}}',
   *   deliveryDate: '{{today}}',
   *   dueDate: '{{date+30}}',
   *   items: [{ sku: 'prefix-{{uuid}}' }],
   * });
   * ```
   */
  generate<T extends Record<string, unknown>>(template: T): T {
    return this.substituteTemplateValues(template) as T;
  }

  /**
   * Persists data as JSON to a file in the base directory.
   *
   * @remarks
   * Creates the base directory if it does not exist. The file path is
   * tracked for automatic removal during {@link TestDataHandler.cleanup | cleanup()}.
   *
   * @param filename - File name (relative to baseDir).
   * @param data - Data to serialize as JSON.
   *
   * @capability testData.save
   *
   * @example
   * ```typescript
   * await handler.save('order.json', { id: '123', total: 99.99 });
   * ```
   */
  @ui5Step
  async save(filename: string, data: unknown): Promise<void> {
    // eslint-disable-next-line security/detect-non-literal-fs-filename -- path composed from trusted baseDir option
    await mkdir(this.baseDir, { recursive: true });
    const filePath = join(this.baseDir, filename);
    // eslint-disable-next-line security/detect-non-literal-fs-filename -- path composed from trusted baseDir + caller filename
    await writeFile(filePath, JSON.stringify(data, undefined, 2), 'utf8');
    this.trackedFiles.push(filePath);
    this.log.debug({ filePath }, 'Saved test data file');
  }

  /**
   * Loads and parses a JSON file from the base directory.
   *
   * @param filename - File name (relative to baseDir).
   * @returns The parsed JSON content.
   * @throws Error if the file cannot be read.
   *
   * @capability testData.load
   *
   * @example
   * ```typescript
   * const order = await handler.load<{ id: string }>('order.json');
   * ```
   */
  async load<T>(filename: string): Promise<T> {
    return withStep(`Load test data "${filename}"`, async () => {
      const filePath = join(this.baseDir, filename);
      try {
        // eslint-disable-next-line security/detect-non-literal-fs-filename -- path composed from trusted baseDir + caller filename
        const content = await readFile(filePath, 'utf8');
        return JSON.parse(content) as T;
      } catch (error: unknown) {
        const message = error instanceof Error ? error.message : String(error);
        throw new PramanError({
          code: ErrorCode.ERR_CONFIG_PARSE,
          message: `Failed to load test data file "${filename}" from ${this.baseDir}: ${message}`,
          attempted: `Load and parse JSON test data file: ${filename}`,
          retryable: false,
          suggestions: [
            `Verify the file "${filename}" exists in ${this.baseDir}`,
            'Check that the file contains valid JSON',
          ],
        });
      }
    });
  }

  /**
   * Removes all tracked test data files and the base directory.
   *
   * @remarks
   * Files are deleted in reverse order (last saved first). Individual
   * deletion failures are logged as warnings but do not throw. After
   * file cleanup, attempts to remove the base directory.
   *
   * @capability testData.cleanup
   *
   * @example
   * ```typescript
   * await handler.cleanup();
   * ```
   */
  @ui5Step
  async cleanup(): Promise<void> {
    const reversed = [...this.trackedFiles].reverse();
    for (const filePath of reversed) {
      try {
        await rm(filePath, { force: true });
        this.log.debug({ filePath }, 'Deleted test data file');
      } catch (error: unknown) {
        this.log.warn({ filePath, error }, 'Failed to delete test data file');
      }
    }
    this.trackedFiles.length = 0;

    try {
      await rm(this.baseDir, { recursive: true, force: true });
      this.log.debug({ baseDir: this.baseDir }, 'Removed test data directory');
    } catch (error: unknown) {
      this.log.warn({ baseDir: this.baseDir, error }, 'Failed to remove test data directory');
    }
  }

  /**
   * Formats a Date as YYYY-MM-DD (ISO 8601 date, matching SAP date fields).
   *
   * @param date - The date to format.
   * @returns The date string in YYYY-MM-DD format.
   */
  private formatSAPDate(date: Date): string {
    const year = String(date.getFullYear());
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  /**
   * Returns a new Date offset by the given number of days from today.
   *
   * @param days - Number of days to offset (positive = future, negative = past).
   * @returns A new Date instance offset by the specified days.
   */
  private offsetDate(days: number): Date {
    const date = new Date();
    date.setDate(date.getDate() + days);
    return date;
  }

  /** Pattern matching `{{date+N}}` or `{{date-N}}` placeholders. */
  private static readonly DATE_OFFSET_PATTERN = /\{\{date([+-]\d+)\}\}/g;

  /** Pattern matching a whole-string `{{date+N}}` or `{{date-N}}` placeholder. */
  private static readonly DATE_OFFSET_EXACT_PATTERN = /^\{\{date([+-]\d+)\}\}$/;

  /**
   * Substitutes all template placeholders in a single string value.
   *
   * @param value - The string to process.
   * @returns The string with all placeholders replaced.
   */
  private substituteStringPlaceholders(value: string): string {
    // Exact-match fast path (avoids unnecessary string allocations)
    if (value === '{{uuid}}') return randomUUID();
    if (value === '{{timestamp}}') return new Date().toISOString();
    if (value === '{{today}}') return this.formatSAPDate(new Date());
    if (value === '{{tomorrow}}') return this.formatSAPDate(this.offsetDate(1));
    if (value === '{{yesterday}}') return this.formatSAPDate(this.offsetDate(-1));

    const exactDateMatch = TestDataHandler.DATE_OFFSET_EXACT_PATTERN.exec(value);
    if (exactDateMatch !== null) {
      return this.formatSAPDate(this.offsetDate(Number(exactDateMatch[1])));
    }

    // Mixed-string path: replace all occurrences within a larger string
    return value
      .replaceAll('{{uuid}}', randomUUID())
      .replaceAll('{{timestamp}}', new Date().toISOString())
      .replaceAll('{{today}}', this.formatSAPDate(new Date()))
      .replaceAll('{{tomorrow}}', this.formatSAPDate(this.offsetDate(1)))
      .replaceAll('{{yesterday}}', this.formatSAPDate(this.offsetDate(-1)))
      .replaceAll(TestDataHandler.DATE_OFFSET_PATTERN, (_match, offset: string) =>
        this.formatSAPDate(this.offsetDate(Number(offset))),
      );
  }

  /**
   * Recursively substitutes template placeholders in a value.
   *
   * @param value - Value to process (string, array, object, or primitive).
   * @returns The value with all placeholders replaced.
   */
  private substituteTemplateValues(value: unknown): unknown {
    if (typeof value === 'string') {
      return this.substituteStringPlaceholders(value);
    }
    if (Array.isArray(value)) {
      return value.map((item: unknown) => this.substituteTemplateValues(item));
    }
    if (value !== null && typeof value === 'object') {
      const result: Record<string, unknown> = {};
      for (const [key, val] of Object.entries(value as Record<string, unknown>)) {
        // eslint-disable-next-line security/detect-object-injection -- key is from Object.entries, not user input
        result[key] = this.substituteTemplateValues(val);
      }
      return result;
    }
    return value;
  }
}
