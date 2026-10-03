/**
 * @license
 * Copyright (c) ZesTest 2025-2030. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0
 *
 * This file may contain AI-assisted code.
 * See LICENSE and NOTICE files for details.
 */

/**
 * Tests for `src/core/logging/redaction.ts` -- redaction configuration for pino logger.
 *
 * @remarks
 * Verifies that REDACTION_PATHS covers all known sensitive fields,
 * paths conform to pino's redaction format, and createRedactConfig
 * returns the expected shape with correct censor value.
 */
import { describe, expect, it } from 'vitest';

import { createRedactConfig, redactStepParams, REDACTION_PATHS } from '#core/logging/redaction.js';
import type { RedactConfig } from '#core/logging/redaction.js';

describe('redaction', () => {
  it('REDACTION_PATHS has minimum entries', () => {
    expect(REDACTION_PATHS.length).toBeGreaterThanOrEqual(10);
  });

  it('all paths are valid pino redact format', () => {
    // Each path must match either:
    //   *.field       — wildcard depth redaction
    //   path.to.field — specific nested path
    // Validated via string splitting instead of regex to avoid ReDoS.
    for (const path of REDACTION_PATHS) {
      const segments = path.split('.');
      expect(segments.length).toBeGreaterThanOrEqual(2);

      const first = segments[0] ?? '';
      expect(first.length).toBeGreaterThan(0);
      expect(first === '*' || /^\w+$/.test(first)).toBe(true);

      for (const segment of segments.slice(1)) {
        expect(segment).toMatch(/^\w+$/);
      }
    }
  });

  it('createRedactConfig returns correct shape', () => {
    const config: RedactConfig = createRedactConfig();

    expect(Array.isArray(config.paths)).toBe(true);
    expect(config.paths.length).toBeGreaterThan(0);
    expect(typeof config.censor).toBe('string');
  });

  it('censor string is [Redacted]', () => {
    const config = createRedactConfig();
    expect(config.censor).toBe('[Redacted]');
  });

  it('known sensitive fields covered', () => {
    const knownSensitiveFields = [
      '*.password',
      '*.token',
      '*.apiKey',
      '*.secret',
      '*.accessToken',
      '*.refreshToken',
      '*.bearerToken',
    ];

    for (const field of knownSensitiveFields) {
      expect(REDACTION_PATHS).toContain(field);
    }
  });
});

// ── Step-param redaction (Playwright 1.63 `TestStep.params`) ───────────────
//
// Playwright populates `params` for a `fill()` step as
// `{ locator: "getByLabel('Password')", value: 'secret' }` — its own type doc
// says so. The pino paths above cannot catch it: they match field *names* like
// `*.password`, and the leaking key is `value`. Reporters export these params
// (the OTel reporter over the network), so the redactor is a security gate.

describe('redactStepParams', () => {
  it('drops a typed password carried in the `value` key', () => {
    const redacted = redactStepParams({
      locator: "getByLabel('Password')",
      value: 'hunter2',
    });

    expect(JSON.stringify(redacted)).not.toContain('hunter2');
    expect(redacted).not.toHaveProperty('value');
  });

  it('keeps the allow-listed diagnostic keys', () => {
    const redacted = redactStepParams({
      locator: "getByRole('button')",
      url: 'https://sap.example.com/index.html',
    });

    expect(redacted).toEqual({
      locator: "getByRole('button')",
      url: 'https://sap.example.com/index.html',
    });
  });

  it('keeps the Praman marker keys', () => {
    const redacted = redactStepParams({
      praman: true,
      module: 'UI5Handler',
      action: 'click',
    });

    expect(redacted).toEqual({ praman: 'true', module: 'UI5Handler', action: 'click' });
  });

  it('drops any key not on the allow-list, not just known-bad ones', () => {
    // Allow-list, not deny-list: an unknown key Playwright adds in a future
    // minor must default to dropped rather than exported.
    const redacted = redactStepParams({ somethingNew: 'payload', value: 'secret' });

    expect(redacted).toEqual({});
  });

  it('returns undefined for absent params (PW 1.57-1.62)', () => {
    expect(redactStepParams(undefined)).toBeUndefined();
  });

  it('JSON-encodes an object value instead of "[object Object]"', () => {
    const redacted = redactStepParams({ controlType: { name: 'sap.m.Button' } });

    expect(redacted?.['controlType']).toBe('{"name":"sap.m.Button"}');
  });

  it('skips an allow-listed key whose value is undefined', () => {
    // The key is present but carries nothing — emitting `"undefined"` as an
    // attribute value would be worse than omitting it.
    const redacted = redactStepParams({ locator: undefined, url: 'https://x.test' });

    expect(redacted).toEqual({ url: 'https://x.test' });
  });

  it('encodes a null value as null rather than dropping it', () => {
    expect(redactStepParams({ url: null })?.['url']).toBe('null');
  });

  it('stringifies values so OTel string attributes are satisfied', () => {
    const redacted = redactStepParams({ praman: true });

    expect(typeof redacted?.['praman']).toBe('string');
  });

  it('adds *.value to the pino redaction paths', () => {
    expect(REDACTION_PATHS).toContain('*.value');
  });
});
