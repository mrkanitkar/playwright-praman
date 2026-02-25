/**
 * @license
 * Copyright (c) ZesTest 2025-2030. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0
 *
 * This file may contain AI-assisted code.
 * See LICENSE and NOTICE files for details.
 */

/**
 * Tests for `src/core/logging/logger.ts` — pino logger factory.
 *
 * @remarks
 * M11: Uses `vi.mock('pino')` inline to mock pino without side effects.
 * Tests verify logger creation, child loggers, log levels, and redaction.
 *
 * @module logging
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import type { PramanConfig } from '#core/config/schema.js';
import { PramanConfigSchema } from '#core/config/schema.js';

// Mock pino before importing logger module
const mockChildLogger = {
  info: vi.fn(),
  warn: vi.fn(),
  error: vi.fn(),
  debug: vi.fn(),
  child: vi.fn(),
  level: 'info',
};

const mockRootLogger = {
  info: vi.fn(),
  warn: vi.fn(),
  error: vi.fn(),
  debug: vi.fn(),
  child: vi.fn().mockReturnValue(mockChildLogger),
  level: 'info',
};

const pinoMock = vi.fn().mockReturnValue(mockRootLogger);

vi.mock('pino', () => ({
  default: pinoMock,
}));

// Import after mock
const { createLogger, createRootLogger, resetDefaultLogger } =
  await import('#core/logging/logger.js');

describe('createRootLogger', () => {
  let config: Readonly<PramanConfig>;

  beforeEach(() => {
    config = PramanConfigSchema.parse({});
    vi.clearAllMocks();
  });

  it('creates a pino logger instance', () => {
    const logger = createRootLogger(config);

    expect(logger).toBeDefined();
    expect(logger).toHaveProperty('info');
    expect(logger).toHaveProperty('child');
  });

  it('passes log level from config', () => {
    const debugConfig = PramanConfigSchema.parse({ logLevel: 'debug' });

    createRootLogger(debugConfig);

    expect(pinoMock).toHaveBeenCalledWith(expect.objectContaining({ level: 'debug' }));
  });

  it('includes redaction config', () => {
    createRootLogger(config);

    const callArgs = pinoMock.mock.calls[0] as [Record<string, unknown>];
    const pinoOptions = callArgs[0];

    expect(pinoOptions).toHaveProperty('redact');
    const redact = pinoOptions['redact'] as { paths: string[]; censor: string };
    expect(redact.paths).toContain('*.password');
    expect(redact.paths).toContain('*.token');
    expect(redact.censor).toBe('[Redacted]');
  });

  it('sets name to playwright-praman', () => {
    createRootLogger(config);

    expect(pinoMock).toHaveBeenCalledWith(expect.objectContaining({ name: 'playwright-praman' }));
  });
});

describe('createLogger', () => {
  let config: Readonly<PramanConfig>;

  beforeEach(() => {
    config = PramanConfigSchema.parse({});
    vi.clearAllMocks();
    resetDefaultLogger();
  });

  afterEach(() => {
    resetDefaultLogger();
  });

  it('creates a child logger with module binding', () => {
    const rootLogger = createRootLogger(config);
    const child = createLogger('selector', rootLogger);

    expect(mockRootLogger.child).toHaveBeenCalledWith({ module: 'selector' });
    expect(child).toBeDefined();
  });

  it('creates independent child loggers', () => {
    const rootLogger = createRootLogger(config);

    createLogger('selector', rootLogger);
    createLogger('bridge', rootLogger);

    expect(mockRootLogger.child).toHaveBeenCalledTimes(2);
    expect(mockRootLogger.child).toHaveBeenCalledWith({ module: 'selector' });
    expect(mockRootLogger.child).toHaveBeenCalledWith({ module: 'bridge' });
  });

  it('uses default logger when no parent provided', () => {
    createRootLogger(config);

    const child = createLogger('config');

    expect(child).toBeDefined();
  });

  it('returns a logger with standard log methods', () => {
    const rootLogger = createRootLogger(config);
    const child = createLogger('test', rootLogger);

    expect(child).toHaveProperty('info');
    expect(child).toHaveProperty('warn');
    expect(child).toHaveProperty('error');
    expect(child).toHaveProperty('debug');
  });

  it('creates fallback logger when no default or parent is available', () => {
    // resetDefaultLogger() already called in beforeEach — no default logger set
    // Call createLogger without parent and without having called createRootLogger
    const child = createLogger('orphan');

    expect(child).toBeDefined();
    // pinoMock was called to create the fallback
    expect(pinoMock).toHaveBeenCalledWith(
      expect.objectContaining({ name: 'playwright-praman', level: 'info' }),
    );
  });
});

describe('resetDefaultLogger', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    resetDefaultLogger();
  });

  it('allows re-creating default logger after reset', () => {
    const config = PramanConfigSchema.parse({});

    const logger1 = createRootLogger(config);
    resetDefaultLogger();
    const logger2 = createRootLogger(config);

    expect(logger1).toBeDefined();
    expect(logger2).toBeDefined();
  });
});
