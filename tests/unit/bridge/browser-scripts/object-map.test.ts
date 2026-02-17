/**
 * Tests for `src/bridge/browser-scripts/object-map.ts`.
 *
 * @remarks
 * Validates that the generated object-map browser scripts are syntactically
 * valid JavaScript containing UUID-based storage and TTL cleanup logic.
 */
import { describe, expect, it } from 'vitest';

import { assertValidScript } from '../../../helpers/browser-script-tester.js';

import {
  createObjectCleanupScript,
  createObjectMapScript,
} from '#bridge/browser-scripts/object-map.js';

describe('createObjectMapScript', () => {
  const script = createObjectMapScript();

  it('returns a non-empty string', () => {
    expect(typeof script).toBe('string');
    expect(script.trim().length).toBeGreaterThan(0);
  });

  it('is syntactically valid JavaScript', () => {
    expect(() => {
      assertValidScript(script);
    }).not.toThrow();
  });

  it('references the bridge namespace', () => {
    expect(script).toContain('__praman_bridge');
  });

  it('contains UUID generation logic', () => {
    expect(script).toContain('randomUUID');
  });

  it('contains saveObject function', () => {
    expect(script).toContain('saveObject');
  });

  it('contains getObject function', () => {
    expect(script).toContain('getObject');
  });

  it('contains deleteObject function', () => {
    expect(script).toContain('deleteObject');
  });

  it('contains idempotency check', () => {
    expect(script).toContain('objectMap');
  });

  it('does not contain console.log', () => {
    expect(script).not.toContain('console.log');
  });
});

describe('createObjectCleanupScript', () => {
  const script = createObjectCleanupScript();

  it('returns a non-empty string', () => {
    expect(typeof script).toBe('string');
    expect(script.trim().length).toBeGreaterThan(0);
  });

  it('is syntactically valid JavaScript', () => {
    expect(() => {
      assertValidScript(script);
    }).not.toThrow();
  });

  it('references the bridge namespace', () => {
    expect(script).toContain('__praman_bridge');
  });

  it('contains TTL-based expiry logic', () => {
    expect(script).toContain('Date.now');
  });

  it('deletes expired entries', () => {
    expect(script).toContain('delete');
  });

  it('returns cleanup count', () => {
    expect(script).toContain('return');
  });
});
