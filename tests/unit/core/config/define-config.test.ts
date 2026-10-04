/**
 * @license
 * Copyright (c) ZesTest 2025-2030. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0
 *
 * This file may contain AI-assisted code.
 * See LICENSE and NOTICE files for details.
 */

/**
 * Tests for `defineConfig()` in `src/core/config/loader.ts`.
 *
 * @remarks
 * Verifies backward-compatible single-arg usage, environment-aware
 * overrides via `PRAMAN_ENV` / `NODE_ENV`, shallow merge semantics,
 * and unknown-environment fallback.
 */
import process from 'node:process';

import { afterEach, describe, expect, it, vi } from 'vitest';

import { defineConfig } from '#core/config/loader.js';
import type { PramanConfigInput } from '#core/config/schema.js';

describe('defineConfig', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  // ── Backward compatibility (single arg) ─────────────────────────────
  it('returns input unchanged when called with a single argument', () => {
    const input: PramanConfigInput = { logLevel: 'debug', ui5WaitTimeout: 5_000 };
    const result = defineConfig(input);
    expect(result).toStrictEqual(input);
  });

  // ── environments is undefined ───────────────────────────────────────
  it('returns base unchanged when environments is undefined', () => {
    vi.stubEnv('PRAMAN_ENV', 'ci');
    const base: PramanConfigInput = { logLevel: 'info' };
    const envs: Record<string, Partial<PramanConfigInput>> | undefined = undefined;
    const result = defineConfig(base, envs);
    expect(result).toStrictEqual(base);
  });

  // ── PRAMAN_ENV selects the right override ───────────────────────────
  it('merges environment overrides when PRAMAN_ENV matches a key', () => {
    vi.stubEnv('PRAMAN_ENV', 'ci');
    const base: PramanConfigInput = { logLevel: 'info', ui5WaitTimeout: 30_000 };
    const result = defineConfig(base, {
      ci: { logLevel: 'error', skipStabilityWait: true },
    });
    expect(result).toStrictEqual({
      logLevel: 'error',
      ui5WaitTimeout: 30_000,
      skipStabilityWait: true,
    });
  });

  // ── NODE_ENV fallback ───────────────────────────────────────────────
  it('falls back to NODE_ENV when PRAMAN_ENV is not set', () => {
    vi.stubEnv('NODE_ENV', 'production');
    // Ensure PRAMAN_ENV is not set
    delete process.env['PRAMAN_ENV'];
    const base: PramanConfigInput = { logLevel: 'info' };
    const result = defineConfig(base, {
      production: { logLevel: 'error' },
    });
    expect(result).toStrictEqual({ logLevel: 'error' });
  });

  // ── PRAMAN_ENV takes precedence over NODE_ENV ───────────────────────
  it('uses PRAMAN_ENV over NODE_ENV when both are set', () => {
    vi.stubEnv('PRAMAN_ENV', 'staging');
    vi.stubEnv('NODE_ENV', 'production');
    const base: PramanConfigInput = { logLevel: 'info' };
    const result = defineConfig(base, {
      staging: { logLevel: 'debug' },
      production: { logLevel: 'error' },
    });
    expect(result).toStrictEqual({ logLevel: 'debug' });
  });

  // ── No env vars set ─────────────────────────────────────────────────
  it('returns base unchanged when no env vars are set', () => {
    // Ensure neither env var is set
    delete process.env['PRAMAN_ENV'];
    delete process.env['NODE_ENV'];
    const base: PramanConfigInput = { logLevel: 'verbose', ui5WaitTimeout: 10_000 };
    const result = defineConfig(base, {
      ci: { logLevel: 'error' },
    });
    expect(result).toStrictEqual(base);
  });

  // ── Unknown environment name ────────────────────────────────────────
  it('returns base unchanged when env name does not match any key', () => {
    vi.stubEnv('PRAMAN_ENV', 'unknown-env');
    const base: PramanConfigInput = { logLevel: 'info' };
    const result = defineConfig(base, {
      ci: { logLevel: 'error' },
      staging: { logLevel: 'debug' },
    });
    expect(result).toStrictEqual(base);
  });

  // ── Shallow merge semantics ─────────────────────────────────────────
  it('replaces nested objects entirely (shallow merge, not deep)', () => {
    vi.stubEnv('PRAMAN_ENV', 'ci');
    const base: PramanConfigInput = {
      logLevel: 'info',
      auth: {
        strategy: 'basic',
        username: 'user1',
        password: 'pass1',
        client: '200',
      },
    };
    const result = defineConfig(base, {
      ci: {
        auth: {
          strategy: 'btp-saml',
        },
      },
    });
    // The entire auth object should be replaced, not deep-merged.
    // So username, password, and client from base.auth should be gone.
    expect(result).toStrictEqual({
      logLevel: 'info',
      auth: {
        strategy: 'btp-saml',
      },
    });
  });
});
