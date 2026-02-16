/**
 * Tests for `src/core/logging/redaction.ts` -- redaction configuration for pino logger.
 *
 * @remarks
 * Verifies that REDACTION_PATHS covers all known sensitive fields,
 * paths conform to pino's redaction format, and createRedactConfig
 * returns the expected shape with correct censor value.
 */
import { describe, expect, it } from 'vitest';

import { createRedactConfig, REDACTION_PATHS } from '#core/logging/redaction.js';
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
