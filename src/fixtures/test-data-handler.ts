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
 *
 * Substitution is recursive: nested objects and arrays are traversed.
 * Non-string primitives (numbers, booleans, null) pass through unchanged.
 *
 * @example
 * ```typescript
 * const testData = new TestDataHandler({ baseDir: '/tmp/test-data' });
 * const order = testData.generate({ id: '{{uuid}}', createdAt: '{{timestamp}}' });
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
        throw new Error(
          `Failed to load test data file "${filename}" from ${this.baseDir}: ${message}`,
        );
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
   * Recursively substitutes template placeholders in a value.
   *
   * @param value - Value to process (string, array, object, or primitive).
   * @returns The value with all placeholders replaced.
   */
  private substituteTemplateValues(value: unknown): unknown {
    if (typeof value === 'string') {
      if (value === '{{uuid}}') return randomUUID();
      if (value === '{{timestamp}}') return new Date().toISOString();
      return value
        .replaceAll('{{uuid}}', randomUUID())
        .replaceAll('{{timestamp}}', new Date().toISOString());
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
