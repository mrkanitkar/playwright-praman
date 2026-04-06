/**
 * @license
 * Copyright (c) ZesTest 2025-2030. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0
 *
 * This file may contain AI-assisted code.
 * See LICENSE and NOTICE files for details.
 */

/**
 * Tests for `src/core/config/loader.ts`.
 *
 * @remarks
 * Verifies config loading from defaults, env var overrides,
 * defineConfig passthrough, and frozen output.
 */
import { describe, expect, it, vi, afterEach } from 'vitest';

import { defineConfig, loadConfig } from '#core/config/loader.js';
import { ConfigError } from '#core/errors/config-error.js';

describe('loadConfig', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  // ── Default loading ──────────────────────────────────────────────────
  it('returns all defaults when no config file or overrides', async () => {
    const config = await loadConfig();
    expect(config.logLevel).toBe('info');
    expect(config.ui5WaitTimeout).toBe(30_000);
    expect(config.controlDiscoveryTimeout).toBe(10_000);
    expect(config.interactionStrategy).toBe('ui5-native');
    expect(config.discoveryStrategies).toEqual(['direct-id', 'recordreplay']);
    expect(config.skipStabilityWait).toBe(false);
    expect(config.preferVisibleControls).toBe(true);
    expect(config.ignoreAutoWaitUrls).toEqual([]);
  });

  it('returns frozen config object', async () => {
    const config = await loadConfig();
    expect(Object.isFrozen(config)).toBe(true);
  });

  it('accepts inline overrides', async () => {
    const config = await loadConfig({
      overrides: { logLevel: 'debug', ui5WaitTimeout: 5000 },
    });
    expect(config.logLevel).toBe('debug');
    expect(config.ui5WaitTimeout).toBe(5000);
  });

  // ── Env var overrides ────────────────────────────────────────────────
  it('overrides logLevel from PRAMAN_LOG_LEVEL env var', async () => {
    vi.stubEnv('PRAMAN_LOG_LEVEL', 'verbose');
    const config = await loadConfig();
    expect(config.logLevel).toBe('verbose');
  });

  it('overrides ui5WaitTimeout from PRAMAN_UI5_WAIT_TIMEOUT env var', async () => {
    vi.stubEnv('PRAMAN_UI5_WAIT_TIMEOUT', '5000');
    const config = await loadConfig();
    expect(config.ui5WaitTimeout).toBe(5000);
  });

  it('overrides controlDiscoveryTimeout from env var', async () => {
    vi.stubEnv('PRAMAN_CONTROL_DISCOVERY_TIMEOUT', '8000');
    const config = await loadConfig();
    expect(config.controlDiscoveryTimeout).toBe(8000);
  });

  it('overrides interactionStrategy from env var', async () => {
    vi.stubEnv('PRAMAN_INTERACTION_STRATEGY', 'dom-first');
    const config = await loadConfig();
    expect(config.interactionStrategy).toBe('dom-first');
  });

  it('overrides skipStabilityWait from env var', async () => {
    vi.stubEnv('PRAMAN_SKIP_STABILITY_WAIT', 'true');
    const config = await loadConfig();
    expect(config.skipStabilityWait).toBe(true);
  });

  it('overrides preferVisibleControls from env var', async () => {
    vi.stubEnv('PRAMAN_PREFER_VISIBLE', 'false');
    const config = await loadConfig();
    expect(config.preferVisibleControls).toBe(false);
  });

  it('env overrides take precedence over inline overrides', async () => {
    vi.stubEnv('PRAMAN_LOG_LEVEL', 'error');
    const config = await loadConfig({
      overrides: { logLevel: 'debug' },
    });
    expect(config.logLevel).toBe('error');
  });

  // ── discoveryStrategies env var ─────────────────────────────────────
  it('parses PRAMAN_DISCOVERY_STRATEGIES as comma-separated array', async () => {
    vi.stubEnv('PRAMAN_DISCOVERY_STRATEGIES', 'direct-id,recordreplay');
    const config = await loadConfig();
    expect(config.discoveryStrategies).toEqual(['direct-id', 'recordreplay']);
  });

  it('parses single discovery strategy value as single-element array', async () => {
    vi.stubEnv('PRAMAN_DISCOVERY_STRATEGIES', 'recordreplay');
    const config = await loadConfig();
    expect(config.discoveryStrategies).toEqual(['recordreplay']);
  });

  it('trims whitespace around discovery strategy values', async () => {
    vi.stubEnv('PRAMAN_DISCOVERY_STRATEGIES', ' direct-id , recordreplay ');
    const config = await loadConfig();
    expect(config.discoveryStrategies).toEqual(['direct-id', 'recordreplay']);
  });

  it('filters empty segments from trailing comma', async () => {
    vi.stubEnv('PRAMAN_DISCOVERY_STRATEGIES', 'direct-id,,recordreplay');
    const config = await loadConfig();
    expect(config.discoveryStrategies).toEqual(['direct-id', 'recordreplay']);
  });

  it('falls back to default on invalid strategy in env var', async () => {
    vi.stubEnv('PRAMAN_DISCOVERY_STRATEGIES', 'direct-id,invalid');
    const config = await loadConfig();
    expect(config.discoveryStrategies).toEqual(['direct-id', 'recordreplay']);
  });

  it('falls back to default on empty env var', async () => {
    vi.stubEnv('PRAMAN_DISCOVERY_STRATEGIES', '');
    const config = await loadConfig();
    expect(config.discoveryStrategies).toEqual(['direct-id', 'recordreplay']);
  });

  // ── PRAMAN_DEBUG convenience toggle ─────────────────────────────────
  it('sets logLevel to debug when PRAMAN_DEBUG=true', async () => {
    vi.stubEnv('PRAMAN_DEBUG', 'true');
    const config = await loadConfig();
    expect(config.logLevel).toBe('debug');
  });

  it('PRAMAN_LOG_LEVEL takes precedence over PRAMAN_DEBUG', async () => {
    vi.stubEnv('PRAMAN_DEBUG', 'true');
    vi.stubEnv('PRAMAN_LOG_LEVEL', 'error');
    const config = await loadConfig();
    expect(config.logLevel).toBe('error');
  });

  it('ignores PRAMAN_DEBUG when set to false', async () => {
    vi.stubEnv('PRAMAN_DEBUG', 'false');
    const config = await loadConfig();
    expect(config.logLevel).toBe('info');
  });

  it('ignores PRAMAN_DEBUG when set to non-true value', async () => {
    vi.stubEnv('PRAMAN_DEBUG', '1');
    const config = await loadConfig();
    expect(config.logLevel).toBe('info');
  });

  // ── Invalid / fallback ────────────────────────────────────────────
  it('ignores invalid env var values (falls back to default)', async () => {
    vi.stubEnv('PRAMAN_LOG_LEVEL', 'invalid-level');
    const config = await loadConfig();
    expect(config.logLevel).toBe('info');
  });

  it('ignores non-numeric timeout env var (falls back to default)', async () => {
    vi.stubEnv('PRAMAN_UI5_WAIT_TIMEOUT', 'not-a-number');
    const config = await loadConfig();
    expect(config.ui5WaitTimeout).toBe(30_000);
  });

  it('throws ConfigError when both env and overrides cause validation failure', async () => {
    // Set an invalid env var to cause first parse to fail
    vi.stubEnv('PRAMAN_LOG_LEVEL', 'invalid-level');
    // Pass invalid overrides to cause fallback parse to also fail
    await expect(loadConfig({ overrides: { logLevel: 'also-invalid' as 'info' } })).rejects.toThrow(
      ConfigError,
    );
  });

  it('ConfigError includes validation errors and suggestions', async () => {
    vi.stubEnv('PRAMAN_LOG_LEVEL', 'invalid-level');
    try {
      await loadConfig({ overrides: { logLevel: 'also-invalid' as 'info' } });
      expect.fail('Expected ConfigError to be thrown');
    } catch (error: unknown) {
      expect(error).toBeInstanceOf(ConfigError);
      const configError = error as ConfigError;
      expect(configError.validationErrors.length).toBeGreaterThan(0);
      expect(configError.suggestions.length).toBeGreaterThan(0);
      expect(configError.retryable).toBe(false);
    }
  });

  it('logs warning and falls back to overrides when only env vars are invalid', async () => {
    vi.stubEnv('PRAMAN_LOG_LEVEL', 'invalid-level');
    // Valid overrides should succeed even when env vars are invalid
    const config = await loadConfig({
      overrides: { logLevel: 'debug' },
    });
    expect(config.logLevel).toBe('debug');
    expect(Object.isFrozen(config)).toBe(true);
  });

  // ── Nested env var overrides (auth, ai, telemetry, odataTracing) ────
  it('overrides auth fields from PRAMAN_AUTH_* env vars', async () => {
    vi.stubEnv('PRAMAN_AUTH_BASE_URL', 'https://sap.example.com');
    vi.stubEnv('PRAMAN_AUTH_STRATEGY', 'basic');
    vi.stubEnv('PRAMAN_AUTH_USERNAME', 'admin');
    vi.stubEnv('PRAMAN_AUTH_PASSWORD', 'secret');
    vi.stubEnv('PRAMAN_AUTH_CLIENT', '100');
    vi.stubEnv('PRAMAN_AUTH_LANGUAGE', 'DE');
    const config = await loadConfig();
    expect(config.auth).toMatchObject({
      baseUrl: 'https://sap.example.com',
      strategy: 'basic',
      username: 'admin',

      password: 'secret',
      client: '100',
      language: 'DE',
    });
  });

  it('overrides ai fields from PRAMAN_AI_* env vars', async () => {
    vi.stubEnv('PRAMAN_AI_PROVIDER', 'openai');
    vi.stubEnv('PRAMAN_AI_API_KEY', 'sk-test-key');
    vi.stubEnv('PRAMAN_AI_MODEL', 'gpt-4o');
    vi.stubEnv('PRAMAN_AI_TEMPERATURE', '0.7');
    const config = await loadConfig();
    expect(config.ai).toMatchObject({
      provider: 'openai',
      apiKey: 'sk-test-key',
      model: 'gpt-4o',
      temperature: 0.7,
    });
  });

  it('overrides telemetry fields from PRAMAN_TELEMETRY_* env vars', async () => {
    vi.stubEnv('PRAMAN_TELEMETRY_ENABLED', 'true');
    vi.stubEnv('PRAMAN_TELEMETRY_ENDPOINT', 'https://otel:4318');
    vi.stubEnv('PRAMAN_TELEMETRY_SERVICE_NAME', 'my-tests');
    const config = await loadConfig();
    expect(config.telemetry).toMatchObject({
      openTelemetry: true,
      endpoint: 'https://otel:4318',
      serviceName: 'my-tests',
    });
  });

  it('overrides odataTracing.enabled from PRAMAN_ODATA_TRACING_ENABLED', async () => {
    vi.stubEnv('PRAMAN_ODATA_TRACING_ENABLED', 'true');
    const config = await loadConfig();
    expect(config.odataTracing).toMatchObject({ enabled: true });
  });

  it('parses PRAMAN_AI_TEMPERATURE as number', async () => {
    vi.stubEnv('PRAMAN_AI_PROVIDER', 'openai');
    vi.stubEnv('PRAMAN_AI_API_KEY', 'sk-key');
    vi.stubEnv('PRAMAN_AI_TEMPERATURE', '0.3');
    const config = await loadConfig();
    expect(config.ai?.temperature).toBe(0.3);
  });

  it('ignores non-numeric PRAMAN_AI_TEMPERATURE', async () => {
    vi.stubEnv('PRAMAN_AI_PROVIDER', 'openai');
    vi.stubEnv('PRAMAN_AI_API_KEY', 'sk-key');
    vi.stubEnv('PRAMAN_AI_TEMPERATURE', 'hot');
    const config = await loadConfig();
    // temperature should not be set to the invalid value
    expect(config.ai?.temperature).not.toBe('hot');
  });

  it('deep-merges nested env vars without clobbering inline overrides', async () => {
    vi.stubEnv('PRAMAN_AUTH_USERNAME', 'env-user');
    const config = await loadConfig({
      overrides: {
        auth: {
          baseUrl: 'https://inline.example.com',
          strategy: 'basic',

          password: 'inline-pw',
        },
      },
    });
    // Env var wins for username
    expect(config.auth?.username).toBe('env-user');
    // Inline overrides preserved for fields not in env
    expect(config.auth?.baseUrl).toBe('https://inline.example.com');
    expect(config.auth?.strategy).toBe('basic');
    expect(config.auth?.password).toBe('inline-pw');
  });

  it('falls back gracefully when nested env vars cause validation failure', async () => {
    // auth.baseUrl is required as a URL — set username without baseUrl
    vi.stubEnv('PRAMAN_AUTH_USERNAME', 'just-user');
    // Should fall back to overrides-only (no auth section) without throwing
    const config = await loadConfig({ overrides: { logLevel: 'debug' } });
    expect(config.logLevel).toBe('debug');
  });

  // ── OPA5 env var overrides ──────────────────────────────────────────
  it('reads PRAMAN_OPA5_DEBUG env var', async () => {
    vi.stubEnv('PRAMAN_OPA5_DEBUG', 'true');
    const config = await loadConfig();
    expect(config.opa5).toMatchObject({ debug: true });
  });

  it('reads PRAMAN_OPA5_AUTO_WAIT env var', async () => {
    vi.stubEnv('PRAMAN_OPA5_AUTO_WAIT', 'false');
    const config = await loadConfig();
    expect(config.opa5).toMatchObject({ autoWait: false });
  });

  it('reads PRAMAN_OPA5_INTERACTION_TIMEOUT env var as number', async () => {
    vi.stubEnv('PRAMAN_OPA5_INTERACTION_TIMEOUT', '10000');
    const config = await loadConfig();
    expect(config.opa5).toMatchObject({ interactionTimeout: 10_000 });
  });

  it('ignores missing opa5 env vars and uses schema defaults', async () => {
    const config = await loadConfig();
    // opa5 is optional, but if provided by env, defaults from schema apply
    // When no env vars set, opa5 should be undefined (optional section)
    expect(config.opa5).toBeUndefined();
  });

  // ── controlTreeCapture env var overrides ────────────────────────────
  it('reads PRAMAN_CONTROL_TREE_MAX_DEPTH env var as number', async () => {
    vi.stubEnv('PRAMAN_CONTROL_TREE_MAX_DEPTH', '20');
    const config = await loadConfig();
    expect(config.controlTreeCapture).toMatchObject({ maxDepth: 20 });
  });

  it('reads PRAMAN_CONTROL_TREE_ENABLED env var', async () => {
    vi.stubEnv('PRAMAN_CONTROL_TREE_ENABLED', 'false');
    const config = await loadConfig();
    expect(config.controlTreeCapture).toMatchObject({ enabled: false });
  });

  it('reads PRAMAN_CONTROL_TREE_MAX_CONTROLS env var as number', async () => {
    vi.stubEnv('PRAMAN_CONTROL_TREE_MAX_CONTROLS', '10000');
    const config = await loadConfig();
    expect(config.controlTreeCapture).toMatchObject({ maxControls: 10_000 });
  });

  // ── captureFailureArtifacts env var ─────────────────────────────────
  it('reads PRAMAN_CAPTURE_FAILURE_ARTIFACTS env var', async () => {
    vi.stubEnv('PRAMAN_CAPTURE_FAILURE_ARTIFACTS', 'false');
    const config = await loadConfig();
    expect(config.captureFailureArtifacts).toBe(false);
  });

  it('defaults captureFailureArtifacts to true when env var not set', async () => {
    const config = await loadConfig();
    expect(config.captureFailureArtifacts).toBe(true);
  });
});

describe('defineConfig', () => {
  it('returns the input unchanged (type helper)', () => {
    const input = { logLevel: 'debug' as const, ui5WaitTimeout: 5000 };
    const result = defineConfig(input);
    expect(result).toBe(input);
  });

  it('accepts empty object', () => {
    const input = {};
    const result = defineConfig(input);
    expect(result).toBe(input);
  });
});
