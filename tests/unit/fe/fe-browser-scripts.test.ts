/**
 * Tests for `src/fe/fe-browser-scripts.ts` — browser-side OPA5 string constants.
 *
 * @remarks
 * These tests verify that each exported constant is a non-empty string
 * containing expected keywords. They do NOT execute the scripts in a browser.
 *
 * @module fe
 */
import { describe, expect, it } from 'vitest';

import {
  FE_ADD_TO_QUEUE_SCRIPT,
  FE_DETECT_WORKZONE_SCRIPT,
  FE_EMPTY_QUEUE_SCRIPT,
  FE_INIT_OPA_SCRIPT,
  FE_LOAD_LIBRARIES_SCRIPT,
} from '../../../src/fe/fe-browser-scripts.js';

describe('FE_LOAD_LIBRARIES_SCRIPT', () => {
  it('is a non-empty string', () => {
    expect(typeof FE_LOAD_LIBRARIES_SCRIPT).toBe('string');
    expect(FE_LOAD_LIBRARIES_SCRIPT.length).toBeGreaterThan(0);
  });

  it('contains sap/fe/test module paths', () => {
    expect(FE_LOAD_LIBRARIES_SCRIPT).toContain('sap/fe/test/ListReport');
    expect(FE_LOAD_LIBRARIES_SCRIPT).toContain('sap/fe/test/ObjectPage');
    expect(FE_LOAD_LIBRARIES_SCRIPT).toContain('sap/fe/test/Shell');
  });
});

describe('FE_INIT_OPA_SCRIPT', () => {
  it('is a non-empty string', () => {
    expect(typeof FE_INIT_OPA_SCRIPT).toBe('string');
    expect(FE_INIT_OPA_SCRIPT.length).toBeGreaterThan(0);
  });

  it('contains Opa5 createPageObjects', () => {
    expect(FE_INIT_OPA_SCRIPT).toContain('createPageObjects');
  });
});

describe('FE_ADD_TO_QUEUE_SCRIPT', () => {
  it('is a non-empty string', () => {
    expect(typeof FE_ADD_TO_QUEUE_SCRIPT).toBe('string');
    expect(FE_ADD_TO_QUEUE_SCRIPT.length).toBeGreaterThan(0);
  });

  it('handles Given/When/Then scopes', () => {
    expect(FE_ADD_TO_QUEUE_SCRIPT).toContain('arrangements');
    expect(FE_ADD_TO_QUEUE_SCRIPT).toContain('actions');
    expect(FE_ADD_TO_QUEUE_SCRIPT).toContain('assertions');
  });
});

describe('FE_EMPTY_QUEUE_SCRIPT', () => {
  it('is a non-empty string', () => {
    expect(typeof FE_EMPTY_QUEUE_SCRIPT).toBe('string');
    expect(FE_EMPTY_QUEUE_SCRIPT.length).toBeGreaterThan(0);
  });

  it('calls emptyQueue', () => {
    expect(FE_EMPTY_QUEUE_SCRIPT).toContain('emptyQueue');
  });
});

describe('FE_DETECT_WORKZONE_SCRIPT', () => {
  it('is a non-empty string', () => {
    expect(typeof FE_DETECT_WORKZONE_SCRIPT).toBe('string');
    expect(FE_DETECT_WORKZONE_SCRIPT.length).toBeGreaterThan(0);
  });

  it('checks for shell and iframe indicators', () => {
    expect(FE_DETECT_WORKZONE_SCRIPT).toContain('shell');
    expect(FE_DETECT_WORKZONE_SCRIPT).toContain('iframe');
  });
});
