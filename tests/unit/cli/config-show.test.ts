/**
 * @license
 * Copyright (c) ZesTest 2025-2030. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0
 *
 * This file may contain AI-assisted code.
 * See LICENSE and NOTICE files for details.
 */

/**
 * Tests for `src/cli/config-show.ts` — config display command.
 *
 * @remarks
 * Mocks `loadConfig` and CLI logger to verify that `runConfigShow`
 * loads config, redacts sensitive fields, and outputs correctly in
 * both pretty and JSON modes.
 *
 * @module cli/config-show
 */

import process from 'node:process';

import type { MockInstance } from 'vitest';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import type { PramanConfig } from '../../../src/core/config/schema.js';

// ── Mocks ───────────────────────────────────────────────────────────────────

vi.mock('#core/config/loader.js', () => ({
  loadConfig: vi.fn(),
}));

vi.mock('../../../src/cli/logger.js', () => ({
  logBanner: vi.fn(),
  logSection: vi.fn(),
  logTable: vi.fn(),
  logSuccess: vi.fn(),
  logWarn: vi.fn(),
  logError: vi.fn(),
}));

vi.mock('../../../src/cli/version.js', () => ({
  getVersion: vi.fn(() => '1.0.0'),
}));

const { loadConfig } = await import('#core/config/loader.js');
const { logBanner, logSection, logTable, logWarn } = await import('../../../src/cli/logger.js');

const mockedLoadConfig = vi.mocked(loadConfig);
const mockedLogBanner = vi.mocked(logBanner);
const mockedLogSection = vi.mocked(logSection);
const mockedLogTable = vi.mocked(logTable);
const mockedLogWarn = vi.mocked(logWarn);

// ── Helpers ─────────────────────────────────────────────────────────────────

function makeConfig(overrides: Partial<PramanConfig> = {}): PramanConfig {
  return {
    logLevel: 'info',
    ui5WaitTimeout: 30_000,
    controlDiscoveryTimeout: 10_000,
    interactionStrategy: 'ui5-native',
    discoveryStrategies: ['direct-id', 'recordreplay'],
    skipStabilityWait: false,
    preferVisibleControls: true,
    ignoreAutoWaitUrls: [],
    ...overrides,
  } as PramanConfig;
}

// ── Tests ───────────────────────────────────────────────────────────────────

describe('config-show', () => {
  let stdoutSpy: MockInstance<(chunk: string | Uint8Array) => boolean>;

  beforeEach(() => {
    vi.clearAllMocks();
    stdoutSpy = vi.spyOn(process.stdout, 'write').mockReturnValue(true) as MockInstance<
      (chunk: string | Uint8Array) => boolean
    >;
    mockedLoadConfig.mockResolvedValue(makeConfig());
  });

  afterEach(() => {
    stdoutSpy.mockRestore();
    vi.unstubAllEnvs();
  });

  // ── redactValue ───────────────────────────────────────────────────────

  describe('redactValue', () => {
    it('redacts known sensitive keys', async () => {
      const { redactValue } = await import('../../../src/cli/config-show.js');

      expect(redactValue('my-secret', 'password')).toBe('[REDACTED]');
      expect(redactValue('key-123', 'apiKey')).toBe('[REDACTED]');
      expect(redactValue('anth-key', 'anthropicApiKey')).toBe('[REDACTED]');
    });

    it('does not redact non-sensitive keys', async () => {
      const { redactValue } = await import('../../../src/cli/config-show.js');

      expect(redactValue('debug', 'logLevel')).toBe('debug');
      expect(redactValue('basic', 'strategy')).toBe('basic');
    });

    it('deep-walks objects and redacts nested sensitive fields', async () => {
      const { redactValue } = await import('../../../src/cli/config-show.js');

      const testSecret = 'test-val-' + String(Date.now());
      const input = {
        auth: { strategy: 'basic', password: testSecret, username: 'admin' },
        ai: { provider: 'openai', apiKey: 'sk-abc', anthropicApiKey: 'ant-xyz' },
      };
      const result = redactValue(input) as Record<string, Record<string, unknown>>;

      expect(result['auth']?.['password']).toBe('[REDACTED]');
      expect(result['auth']?.['strategy']).toBe('basic');
      expect(result['auth']?.['username']).toBe('admin');
      expect(result['ai']?.['apiKey']).toBe('[REDACTED]');
      expect(result['ai']?.['anthropicApiKey']).toBe('[REDACTED]');
      expect(result['ai']?.['provider']).toBe('openai');
    });

    it('handles arrays without redacting', async () => {
      const { redactValue } = await import('../../../src/cli/config-show.js');

      expect(redactValue(['a', 'b'])).toEqual(['a', 'b']);
    });

    it('passes through primitives', async () => {
      const { redactValue } = await import('../../../src/cli/config-show.js');

      expect(redactValue(42)).toBe(42);
      expect(redactValue(true)).toBe(true);
      expect(redactValue(null)).toBeNull();
    });
  });

  // ── detectActiveEnvVars ───────────────────────────────────────────────

  describe('detectActiveEnvVars', () => {
    it('returns empty when no PRAMAN_ env vars set', async () => {
      const { detectActiveEnvVars } = await import('../../../src/cli/config-show.js');

      const result = detectActiveEnvVars();
      expect(result).toEqual([]);
    });

    it('detects set PRAMAN_ env vars', async () => {
      vi.stubEnv('PRAMAN_LOG_LEVEL', 'debug');
      vi.stubEnv('PRAMAN_DEBUG', 'true');

      const { detectActiveEnvVars } = await import('../../../src/cli/config-show.js');

      const result = detectActiveEnvVars();
      expect(result).toContainEqual(['PRAMAN_LOG_LEVEL', 'debug']);
      expect(result).toContainEqual(['PRAMAN_DEBUG', 'true']);
    });

    it('detects nested PRAMAN_ env vars (ai, telemetry, odataTracing)', async () => {
      vi.stubEnv('PRAMAN_AI_PROVIDER', 'openai');
      vi.stubEnv('PRAMAN_TELEMETRY_ENABLED', 'true');
      vi.stubEnv('PRAMAN_ODATA_TRACING_ENABLED', 'true');

      const { detectActiveEnvVars } = await import('../../../src/cli/config-show.js');

      const result = detectActiveEnvVars();
      expect(result).toContainEqual(['PRAMAN_AI_PROVIDER', 'openai']);
      expect(result).toContainEqual(['PRAMAN_TELEMETRY_ENABLED', 'true']);
      expect(result).toContainEqual(['PRAMAN_ODATA_TRACING_ENABLED', 'true']);
    });
  });

  // ── runConfigShow (JSON mode) ─────────────────────────────────────────

  describe('runConfigShow --json', () => {
    it('outputs valid JSON to stdout', async () => {
      const { runConfigShow } = await import('../../../src/cli/config-show.js');

      await runConfigShow({ json: true, showSecrets: false });

      expect(stdoutSpy).toHaveBeenCalledOnce();
      const calls = stdoutSpy.mock.calls as [string | Uint8Array][];
      const output = String(calls[0]?.[0]);
      const parsed: unknown = JSON.parse(output);
      expect(parsed).toBeDefined();
    });

    it('redacts sensitive fields in JSON output', async () => {
      const testPw = 'test-pw-' + String(Date.now());
      mockedLoadConfig.mockResolvedValue(
        makeConfig({
          auth: {
            strategy: 'basic',
            baseUrl: 'https://sap.example.com',
            password: testPw,
            client: '100',
            language: 'EN',
          },
        }),
      );

      const { runConfigShow } = await import('../../../src/cli/config-show.js');
      await runConfigShow({ json: true, showSecrets: false });

      const calls = stdoutSpy.mock.calls as [string | Uint8Array][];
      const output = String(calls[0]?.[0]);
      const parsed = JSON.parse(output) as Record<string, Record<string, unknown>>;
      expect(parsed['auth']?.['password']).toBe('[REDACTED]');
      expect(parsed['auth']?.['strategy']).toBe('basic');
    });

    it('shows secrets when --show-secrets is true', async () => {
      const testKey = 'sk-test-' + String(Date.now());
      mockedLoadConfig.mockResolvedValue(
        makeConfig({
          ai: {
            provider: 'openai',
            apiKey: testKey,
            temperature: 0.3,
          },
        }),
      );

      const { runConfigShow } = await import('../../../src/cli/config-show.js');
      await runConfigShow({ json: true, showSecrets: true });

      const calls = stdoutSpy.mock.calls as [string | Uint8Array][];
      const output = String(calls[0]?.[0]);
      const parsed = JSON.parse(output) as Record<string, Record<string, unknown>>;
      expect(parsed['ai']?.['apiKey']).toBe(testKey);
    });

    it('logs a warning when --show-secrets is used', async () => {
      const { runConfigShow } = await import('../../../src/cli/config-show.js');

      await runConfigShow({ json: true, showSecrets: true });

      expect(mockedLogWarn).toHaveBeenCalledWith(expect.stringContaining('secrets are visible'));
    });
  });

  // ── runConfigShow (pretty mode) ───────────────────────────────────────

  describe('runConfigShow pretty', () => {
    it('displays banner with version', async () => {
      const { runConfigShow } = await import('../../../src/cli/config-show.js');

      await runConfigShow({ json: false, showSecrets: false });

      expect(mockedLogBanner).toHaveBeenCalledWith('Praman Config', '1.0.0');
    });

    it('displays env var overrides section', async () => {
      const { runConfigShow } = await import('../../../src/cli/config-show.js');

      await runConfigShow({ json: false, showSecrets: false });

      expect(mockedLogSection).toHaveBeenCalledWith('Env Var Overrides');
    });

    it('displays resolved configuration section', async () => {
      const { runConfigShow } = await import('../../../src/cli/config-show.js');

      await runConfigShow({ json: false, showSecrets: false });

      expect(mockedLogSection).toHaveBeenCalledWith('Resolved Configuration');
    });

    it('displays top-level config values in table', async () => {
      const { runConfigShow } = await import('../../../src/cli/config-show.js');

      await runConfigShow({ json: false, showSecrets: false });

      // logTable is called at least once with top-level fields
      expect(mockedLogTable).toHaveBeenCalled();
      expect(mockedLogTable.mock.calls.length).toBeGreaterThanOrEqual(1);
      // The second call should contain logLevel (config table)
      const secondCall = mockedLogTable.mock.calls[1]?.[0] as [string, string][] | undefined;
      if (secondCall !== undefined) {
        const configKeys = secondCall.map(([k]) => k);
        expect(configKeys).toContain('logLevel');
      }
    });

    it('renders nested sections separately', async () => {
      const testPw = 'test-pw-' + String(Date.now());
      mockedLoadConfig.mockResolvedValue(
        makeConfig({
          auth: {
            strategy: 'basic',
            baseUrl: 'https://sap.example.com',
            password: testPw,
            client: '100',
            language: 'EN',
          },
        }),
      );

      const { runConfigShow } = await import('../../../src/cli/config-show.js');

      await runConfigShow({ json: false, showSecrets: false });

      expect(mockedLogSection).toHaveBeenCalledWith('auth');
    });

    it('does not write to stdout in pretty mode', async () => {
      const { runConfigShow } = await import('../../../src/cli/config-show.js');

      await runConfigShow({ json: false, showSecrets: false });

      expect(stdoutSpy).not.toHaveBeenCalled();
    });
  });
});
