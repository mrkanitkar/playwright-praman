/**
 * Tests for `src/bridge/bridge-constants.ts`.
 *
 * @remarks
 * Verifies bridge global names, timeout values, and XHR ignore patterns.
 */
import { describe, expect, it } from 'vitest';

import { BRIDGE_GLOBALS, BRIDGE_TIMEOUTS, XHR_IGNORE_PATTERNS } from '#bridge/bridge-constants.js';

describe('BRIDGE_GLOBALS', () => {
  it('has expected namespace', () => {
    expect(BRIDGE_GLOBALS.NAMESPACE).toBe('__praman_bridge');
  });

  it('has expected ready flag', () => {
    expect(BRIDGE_GLOBALS.READY_FLAG).toBe('__praman_ready');
  });

  it('has expected object map key', () => {
    expect(BRIDGE_GLOBALS.OBJECT_MAP).toBe('__praman_objectMap');
  });

  it('is frozen', () => {
    expect(Object.isFrozen(BRIDGE_GLOBALS)).toBe(true);
  });
});

describe('BRIDGE_TIMEOUTS', () => {
  it('has positive integer values', () => {
    for (const value of Object.values(BRIDGE_TIMEOUTS)) {
      expect(value).toBeGreaterThan(0);
      expect(Number.isInteger(value)).toBe(true);
    }
  });

  it('has expected default values', () => {
    expect(BRIDGE_TIMEOUTS.INJECTION).toBe(30_000);
    expect(BRIDGE_TIMEOUTS.CONTROL_FIND).toBe(10_000);
    expect(BRIDGE_TIMEOUTS.UI5_STABLE).toBe(30_000);
    expect(BRIDGE_TIMEOUTS.POLLING_INTERVAL).toBe(100);
    expect(BRIDGE_TIMEOUTS.OBJECT_TTL).toBe(300_000);
  });

  it('is frozen', () => {
    expect(Object.isFrozen(BRIDGE_TIMEOUTS)).toBe(true);
  });
});

describe('XHR_IGNORE_PATTERNS', () => {
  it('contains common analytics patterns', () => {
    expect(XHR_IGNORE_PATTERNS).toContain('walkme');
    expect(XHR_IGNORE_PATTERNS).toContain('analytics');
    expect(XHR_IGNORE_PATTERNS).toContain('sentry');
  });

  it('has at least 15 patterns', () => {
    expect(XHR_IGNORE_PATTERNS.length).toBeGreaterThanOrEqual(15);
  });

  it('is frozen', () => {
    expect(Object.isFrozen(XHR_IGNORE_PATTERNS)).toBe(true);
  });
});
