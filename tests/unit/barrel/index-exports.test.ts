/**
 * @license
 * Copyright (c) ZesTest 2025-2030. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0
 *
 * This file may contain AI-assisted code.
 * See LICENSE and NOTICE files for details.
 */

/**
 * Tests for `src/index.ts` — barrel export verification.
 *
 * @remarks
 * Verifies that the public API barrel:
 * - Does NOT export internal implementation symbols (32 removed in A2)
 * - DOES export user-facing error classes including VocabularyError, IntentError
 * - DOES export 4 new types (verified at type level)
 */
import { describe, expect, expectTypeOf, it } from 'vitest';

import * as barrel from '../../../src/index.js';
import type {
  NavigationOptions,
  UI5ControlBase,
  UI5ControlMap,
  UI5NavigationAPI,
  UI5Selector,
} from '../../../src/index.js';

describe('src/index.ts barrel', () => {
  // ── Removed bridge internals ─────────────────────────────────────────
  it('does NOT export bridge internals', () => {
    const b = barrel as Record<string, unknown>;
    expect(b['ensureBridgeInjected']).toBeUndefined();
    expect(b['isBridgeReady']).toBeUndefined();
    expect(b['waitForBridgeReady']).toBeUndefined();
  });

  // ── Removed proxy internals ──────────────────────────────────────────
  it('does NOT export proxy internals', () => {
    const b = barrel as Record<string, unknown>;
    expect(b['createControlProxy']).toBeUndefined();
    expect(b['ControlProxyCache']).toBeUndefined();
    expect(b['discoverControl']).toBeUndefined();
    expect(b['UI5Object']).toBeUndefined();
    expect(b['UI5ObjectCache']).toBeUndefined();
  });

  // ── Removed logging/telemetry/compat internals ───────────────────────
  it('does NOT export logging internals', () => {
    const b = barrel as Record<string, unknown>;
    expect(b['createLogger']).toBeUndefined();
    expect(b['createRootLogger']).toBeUndefined();
    expect(b['initTelemetry']).toBeUndefined();
  });

  it('exports compat version detection and feature flags', () => {
    expect(typeof barrel.parsePlaywrightVersion).toBe('function');
    expect(typeof barrel.detectFeatures).toBe('function');
    expect(typeof barrel.getPlaywrightVersion).toBe('function');
    expect(typeof barrel.getPlaywrightFeatures).toBe('function');
    expect(typeof barrel.hasFeature).toBe('function');
    expect(typeof barrel.assertMinVersion).toBe('function');
  });

  // ── Removed selector engine internals ───────────────────────────────
  it('does NOT export selector engine internals', () => {
    const b = barrel as Record<string, unknown>;
    expect(b['createUI5SelectorEngineScript']).toBeUndefined();
    expect(b['isUI5SelectorString']).toBeUndefined();
    expect(b['parseUI5Selector']).toBeUndefined();
    expect(b['serializeUI5Selector']).toBeUndefined();
    expect(b['validateUI5Selector']).toBeUndefined();
  });

  // ── Removed matcher implementations ─────────────────────────────────
  it('does NOT export matcher implementation functions', () => {
    const b = barrel as Record<string, unknown>;
    expect(b['checkUI5Binding']).toBeUndefined();
    expect(b['checkUI5CellText']).toBeUndefined();
    expect(b['checkUI5ControlType']).toBeUndefined();
    expect(b['checkUI5Enabled']).toBeUndefined();
    expect(b['checkUI5Property']).toBeUndefined();
    expect(b['checkUI5RowCount']).toBeUndefined();
    expect(b['checkUI5SelectedRows']).toBeUndefined();
    expect(b['checkUI5Text']).toBeUndefined();
    expect(b['checkUI5ValueState']).toBeUndefined();
    expect(b['checkUI5Visible']).toBeUndefined();
  });

  // ── Removed implementation constants ────────────────────────────────
  it('does NOT export implementation constants', () => {
    const b = barrel as Record<string, unknown>;
    expect(b['DIALOG_CONTROL_TYPES']).toBeUndefined();
  });

  // ── Removed auth implementation ──────────────────────────────────────
  it('does NOT export auth implementation symbols', () => {
    const b = barrel as Record<string, unknown>;
    expect(b['createAuthStrategy']).toBeUndefined();
    expect(b['SAPAuthHandler']).toBeUndefined();
  });

  // ── Error classes exported (including Phase 5 additions) ─────────────
  it('exports all error classes', () => {
    expect(typeof barrel.PramanError).toBe('function');
    expect(typeof barrel.AIError).toBe('function');
    expect(typeof barrel.VocabularyError).toBe('function');
    expect(typeof barrel.IntentError).toBe('function');
    expect(typeof barrel.ErrorCode).toBe('object');
  });

  // ── User-facing utils still exported ────────────────────────────────
  it('exports user-facing utilities', () => {
    expect(typeof barrel.retry).toBe('function');
    expect(typeof barrel.waitForUI5Stable).toBe('function');
    expect(typeof barrel.waitForUI5Bootstrap).toBe('function');
    expect(barrel.DEFAULT_TIMEOUTS).toBeDefined();
  });

  // ── Navigation functions exported ────────────────────────────────────
  it('exports navigation functions', () => {
    expect(typeof barrel.navigateToApp).toBe('function');
    expect(typeof barrel.navigateToTile).toBe('function');
  });

  // ── Version exported ─────────────────────────────────────────────────
  it('exports PACKAGE_NAME and VERSION', () => {
    expect(typeof barrel.PACKAGE_NAME).toBe('string');
    expect(typeof barrel.VERSION).toBe('string');
  });

  // ── Type-level verification for new type exports ─────────────────────
  it('exports UI5Selector, UI5ControlBase, NavigationOptions, UI5NavigationAPI types', () => {
    // These imports compile only if the types are exported from the barrel.
    // Assigning to expectTypeOf verifies they are not `never` or `any`.
    expectTypeOf<UI5Selector>().not.toBeNever();
    expectTypeOf<UI5ControlBase>().not.toBeNever();
    expectTypeOf<UI5ControlMap>().not.toBeNever();
    expectTypeOf<NavigationOptions>().not.toBeNever();
    expectTypeOf<UI5NavigationAPI>().not.toBeNever();
  });
});
