/**
 * Tests for `src/bridge/browser-scripts/inject-ui5.ts`.
 *
 * @remarks
 * Validates the core bridge injection script contains all required
 * initialization logic: namespace setup, module loading, version detection,
 * helper functions, and version-split APIs (A.5, A.7, A.9).
 */
import { describe, expect, it } from 'vitest';

import { assertValidScript } from '../../../helpers/browser-script-tester.js';

import { createBridgeInjectionScript } from '#bridge/browser-scripts/inject-ui5.js';

describe('createBridgeInjectionScript', () => {
  const script = createBridgeInjectionScript();

  it('returns a non-empty string', () => {
    expect(typeof script).toBe('string');
    expect(script.trim().length).toBeGreaterThan(0);
  });

  it('is syntactically valid JavaScript', () => {
    expect(() => {
      assertValidScript(script);
    }).not.toThrow();
  });

  it('sets up __praman_bridge namespace', () => {
    expect(script).toContain('__praman_bridge');
  });

  it('contains sap.ui.require for module loading', () => {
    expect(script).toContain('sap.ui.require');
  });

  it('has idempotency check to prevent re-injection', () => {
    expect(script).toContain('__praman_ready');
  });

  it('contains version detection via sap.ui.version', () => {
    expect(script).toContain('sap.ui.version');
  });

  it('initializes objectMap', () => {
    expect(script).toContain('objectMap');
  });

  it('contains getById resolver (D19 3-tier API resolution)', () => {
    expect(script).toContain('getById');
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

  it('contains isPrimitive helper', () => {
    expect(script).toContain('isPrimitive');
  });

  it('contains getCircularReplacer for JSON safety', () => {
    expect(script).toContain('getCircularReplacer');
  });

  it('contains try-catch error handling', () => {
    expect(script).toContain('try');
    expect(script).toContain('catch');
  });

  it('does not contain console.log', () => {
    expect(script).not.toContain('console.log');
  });
});
