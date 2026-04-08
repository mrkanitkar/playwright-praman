/**
 * @license
 * Copyright (c) ZesTest 2025-2030. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0
 *
 * This file may contain AI-assisted code.
 * See LICENSE and NOTICE files for details.
 */

/**
 * Tests for `src/core/telemetry/dynamic-loader.ts`.
 */
import { describe, expect, it, vi } from 'vitest';

vi.mock('#core/logging/index.js', () => ({
  createLogger: vi.fn(() => ({
    warn: vi.fn(),
    info: vi.fn(),
    debug: vi.fn(),
    error: vi.fn(),
    child: vi.fn(),
  })),
  createRootLogger: vi.fn(),
  resetDefaultLogger: vi.fn(),
}));

import { ErrorCode } from '#core/errors/codes.js';
import { TelemetryError } from '#core/errors/telemetry-error.js';
import { tryImportOTel, requireOTel } from '#core/telemetry/dynamic-loader.js';

describe('tryImportOTel', () => {
  it('returns module when package is available', async () => {
    const mod = await tryImportOTel<{ trace: unknown }>('@opentelemetry/api');
    expect(mod).toBeDefined();
    expect(mod?.trace).toBeDefined();
  });

  it('returns undefined for non-existent package', async () => {
    const mod = await tryImportOTel<unknown>('@nonexistent/package-12345');
    expect(mod).toBeUndefined();
  });
});

describe('requireOTel', () => {
  it('returns module when package is available', async () => {
    const mod = await requireOTel<{ trace: unknown }>('@opentelemetry/api');
    expect(mod).toBeDefined();
    expect(mod.trace).toBeDefined();
  });

  it('throws TelemetryError for non-existent package', async () => {
    await expect(requireOTel<unknown>('@nonexistent/package-12345')).rejects.toThrow(
      TelemetryError,
    );
  });

  it('throws with ERR_TELEMETRY_PEER_DEP_MISSING code', async () => {
    try {
      await requireOTel<unknown>('@nonexistent/package-12345');
      expect.unreachable('Should have thrown');
    } catch (error: unknown) {
      expect(error).toBeInstanceOf(TelemetryError);
      expect((error as TelemetryError).code).toBe(ErrorCode.ERR_TELEMETRY_PEER_DEP_MISSING);
      expect((error as TelemetryError).packageName).toBe('@nonexistent/package-12345');
    }
  });

  it('includes install suggestion in error', async () => {
    try {
      await requireOTel<unknown>('@nonexistent/package-12345');
      expect.unreachable('Should have thrown');
    } catch (error: unknown) {
      expect((error as TelemetryError).suggestions.length).toBeGreaterThan(0);
      expect((error as TelemetryError).suggestions[0]).toContain('npm install');
    }
  });
});
