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

  it('falls back to pure defaults when both env and overrides cause validation failure', async () => {
    // Set an invalid env var to cause first parse to fail
    vi.stubEnv('PRAMAN_LOG_LEVEL', 'invalid-level');
    // Pass invalid overrides to cause fallback parse to also fail
    const config = await loadConfig({
      overrides: { logLevel: 'also-invalid' as 'info' },
    });
    // Should fall back to pure defaults
    expect(config.logLevel).toBe('info');
    expect(config.ui5WaitTimeout).toBe(30_000);
    expect(Object.isFrozen(config)).toBe(true);
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
