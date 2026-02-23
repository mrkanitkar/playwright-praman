/**
 * Tests for `src/bridge/version-check.ts`.
 *
 * @remarks
 * Validates UI5 minimum version detection and warning behavior.
 * Mocks page.evaluate() to return various version strings and
 * verifies logger.warn() is called appropriately.
 */
import type { Page } from '@playwright/test';
import type { Logger } from 'pino';
import { describe, expect, it, vi } from 'vitest';

import { checkUI5Version } from '#bridge/version-check.js';

function createMockPage(version: string): Page {
  return {
    evaluate: vi.fn().mockResolvedValue(version),
  } as unknown as Page;
}

function createMockLogger(): Logger {
  return {
    warn: vi.fn(),
    info: vi.fn(),
    debug: vi.fn(),
    error: vi.fn(),
  } as unknown as Logger;
}

describe('checkUI5Version', () => {
  it('returns detected version for supported UI5 (1.120.0)', async () => {
    const page = createMockPage('1.120.0');
    const logger = createMockLogger();
    const version = await checkUI5Version(page, logger);
    expect(version).toBe('1.120.0');
    expect(logger.warn).not.toHaveBeenCalled();
  });

  it('returns version and does not warn for exactly 1.96.0', async () => {
    const page = createMockPage('1.96.0');
    const logger = createMockLogger();
    const version = await checkUI5Version(page, logger);
    expect(version).toBe('1.96.0');
    expect(logger.warn).not.toHaveBeenCalled();
  });

  it('warns when UI5 version is below minimum (1.84.0)', async () => {
    const page = createMockPage('1.84.0');
    const logger = createMockLogger();
    const version = await checkUI5Version(page, logger);
    expect(version).toBe('1.84.0');
    expect(logger.warn).toHaveBeenCalledOnce();
    expect(logger.warn).toHaveBeenCalledWith(
      { detected: '1.84.0', minimum: '1.96.0' },
      expect.stringContaining('below minimum'),
    );
  });

  it('warns when version is undetectable (0.0.0)', async () => {
    const page = createMockPage('0.0.0');
    const logger = createMockLogger();
    const version = await checkUI5Version(page, logger);
    expect(version).toBe('0.0.0');
    expect(logger.warn).toHaveBeenCalledOnce();
    expect(logger.warn).toHaveBeenCalledWith(expect.stringContaining('could not be detected'));
  });

  it('returns version for very new UI5 (1.132.0)', async () => {
    const page = createMockPage('1.132.0');
    const logger = createMockLogger();
    const version = await checkUI5Version(page, logger);
    expect(version).toBe('1.132.0');
    expect(logger.warn).not.toHaveBeenCalled();
  });
});
