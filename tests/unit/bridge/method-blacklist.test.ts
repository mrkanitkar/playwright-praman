/**
 * @license
 * Copyright (c) ZesTest 2025-2030. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0
 *
 * This file may contain AI-assisted code.
 * See LICENSE and NOTICE files for details.
 */

/**
 * Tests for `src/bridge/method-blacklist.ts`.
 *
 * @remarks
 * Verifies the method blacklist contents (71 explicit items + 2 dynamic rules),
 * isBlacklisted() dynamic rules, filterMethods() array filtering,
 * and that commonly-needed methods are intentionally unblocked.
 */
import { describe, expect, it } from 'vitest';

import { METHOD_BLACKLIST, filterMethods, isBlacklisted } from '#bridge/method-blacklist.js';

describe('METHOD_BLACKLIST', () => {
  it('contains exactly 71 explicit items', () => {
    expect(METHOD_BLACKLIST.size).toBe(71);
  });

  it('blocks wdi5 bridge-reserved methods', () => {
    expect(METHOD_BLACKLIST.has('$')).toBe(true);
    expect(METHOD_BLACKLIST.has('getAggregation')).toBe(true);
    expect(METHOD_BLACKLIST.has('constructor')).toBe(true);
    expect(METHOD_BLACKLIST.has('fireEvent')).toBe(true);
    expect(METHOD_BLACKLIST.has('init')).toBe(true);
  });

  it('blocks lifecycle methods', () => {
    expect(METHOD_BLACKLIST.has('clone')).toBe(true);
    expect(METHOD_BLACKLIST.has('exit')).toBe(true);
    expect(METHOD_BLACKLIST.has('onInit')).toBe(true);
    expect(METHOD_BLACKLIST.has('onExit')).toBe(true);
    expect(METHOD_BLACKLIST.has('applySettings')).toBe(true);
  });

  it('blocks rendering internals', () => {
    expect(METHOD_BLACKLIST.has('rerender')).toBe(true);
    expect(METHOD_BLACKLIST.has('invalidate')).toBe(true);
    expect(METHOD_BLACKLIST.has('render')).toBe(true);
    expect(METHOD_BLACKLIST.has('placeAt')).toBe(true);
  });

  it('blocks event system internals', () => {
    expect(METHOD_BLACKLIST.has('attachEvent')).toBe(true);
    expect(METHOD_BLACKLIST.has('detachEvent')).toBe(true);
    expect(METHOD_BLACKLIST.has('attachBrowserEvent')).toBe(true);
    expect(METHOD_BLACKLIST.has('detachBrowserEvent')).toBe(true);
    expect(METHOD_BLACKLIST.has('getEventingParent')).toBe(true);
  });

  it('blocks aggregation manipulation methods (mk)', () => {
    const aggregationMethods = [
      'setAggregation',
      'addAggregation',
      'removeAggregation',
      'removeAllAggregation',
      'insertAggregation',
      'indexOfAggregation',
      'destroyAggregation',
      'validateAggregation',
      'propagateProperties',
      'findAggregatedObjects',
    ] as const;

    for (const method of aggregationMethods) {
      expect(METHOD_BLACKLIST.has(method), `expected '${method}' to be blacklisted`).toBe(true);
    }
  });

  it('blocks association methods (mk)', () => {
    const associationMethods = [
      'getAssociation',
      'setAssociation',
      'addAssociation',
      'removeAssociation',
      'removeAllAssociation',
    ] as const;

    for (const method of associationMethods) {
      expect(METHOD_BLACKLIST.has(method), `expected '${method}' to be blacklisted`).toBe(true);
    }
  });

  it('blocks property validation (mk)', () => {
    expect(METHOD_BLACKLIST.has('validateProperty')).toBe(true);
  });

  it('blocks delegate management methods (mk)', () => {
    expect(METHOD_BLACKLIST.has('addDelegate')).toBe(true);
    expect(METHOD_BLACKLIST.has('removeDelegate')).toBe(true);
  });

  it('blocks state methods (mk)', () => {
    expect(METHOD_BLACKLIST.has('isActive')).toBe(true);
    expect(METHOD_BLACKLIST.has('isDestroyStarted')).toBe(true);
  });

  it('blocks debug/inspection methods (mk)', () => {
    expect(METHOD_BLACKLIST.has('inspect')).toBe(true);
    expect(METHOD_BLACKLIST.has('data')).toBe(true);
  });

  it('blocks explicit internal methods (also caught by _ prefix rule)', () => {
    const internalMethods = [
      '_getBindingContext',
      '_setBindingContext',
      '_getPropertiesToPropagate',
      '_callMethodInManagedObject',
      '_observeChanges',
      '_propagateProperties',
    ] as const;

    for (const method of internalMethods) {
      expect(METHOD_BLACKLIST.has(method), `expected '${method}' to be blacklisted`).toBe(true);
    }
  });

  it('blocks binding internals', () => {
    expect(METHOD_BLACKLIST.has('bindElement')).toBe(true);
    expect(METHOD_BLACKLIST.has('unbindElement')).toBe(true);
    expect(METHOD_BLACKLIST.has('bindAggregation')).toBe(true);
    expect(METHOD_BLACKLIST.has('unbindAggregation')).toBe(true);
    expect(METHOD_BLACKLIST.has('bindProperty')).toBe(true);
    expect(METHOD_BLACKLIST.has('unbindProperty')).toBe(true);
  });

  it('does NOT blacklist destroy (needed for test cleanup)', () => {
    expect(METHOD_BLACKLIST.has('destroy')).toBe(false);
  });

  it('does NOT blacklist getMetadata (needed for control inspection)', () => {
    expect(METHOD_BLACKLIST.has('getMetadata')).toBe(false);
  });

  it('does NOT blacklist getInterface (standard interface access)', () => {
    expect(METHOD_BLACKLIST.has('getInterface')).toBe(false);
  });

  it('does NOT blacklist busy state methods (needed for wait assertions)', () => {
    expect(METHOD_BLACKLIST.has('getBusy')).toBe(false);
    expect(METHOD_BLACKLIST.has('setBusy')).toBe(false);
  });

  it('does NOT blacklist tooltip methods (needed for a11y tests)', () => {
    expect(METHOD_BLACKLIST.has('getTooltip')).toBe(false);
    expect(METHOD_BLACKLIST.has('setTooltip')).toBe(false);
  });

  it('does NOT blacklist custom data methods (needed for data-driven tests)', () => {
    expect(METHOD_BLACKLIST.has('getCustomData')).toBe(false);
    expect(METHOD_BLACKLIST.has('addCustomData')).toBe(false);
    expect(METHOD_BLACKLIST.has('removeCustomData')).toBe(false);
  });

  it('does not contain common safe methods', () => {
    expect(METHOD_BLACKLIST.has('getText')).toBe(false);
    expect(METHOD_BLACKLIST.has('setValue')).toBe(false);
    expect(METHOD_BLACKLIST.has('getProperty')).toBe(false);
    expect(METHOD_BLACKLIST.has('getId')).toBe(false);
  });
});

describe('isBlacklisted', () => {
  it('returns true for static blacklist items', () => {
    expect(isBlacklisted('constructor')).toBe(true);
    expect(isBlacklisted('fireEvent')).toBe(true);
  });

  it('returns true for mk aggregation methods', () => {
    expect(isBlacklisted('setAggregation')).toBe(true);
    expect(isBlacklisted('destroyAggregation')).toBe(true);
    expect(isBlacklisted('findAggregatedObjects')).toBe(true);
  });

  it('returns true for mk association methods', () => {
    expect(isBlacklisted('getAssociation')).toBe(true);
    expect(isBlacklisted('removeAllAssociation')).toBe(true);
  });

  it('returns true for mk state and delegate methods', () => {
    expect(isBlacklisted('isActive')).toBe(true);
    expect(isBlacklisted('isDestroyStarted')).toBe(true);
    expect(isBlacklisted('addDelegate')).toBe(true);
    expect(isBlacklisted('removeDelegate')).toBe(true);
  });

  it('returns true for underscore-prefixed methods', () => {
    expect(isBlacklisted('_getBindingContext')).toBe(true);
    expect(isBlacklisted('_internal')).toBe(true);
    expect(isBlacklisted('_anyPrivateMethod')).toBe(true);
  });

  it('returns true for Render-suffixed methods', () => {
    expect(isBlacklisted('onAfterRender')).toBe(true);
    expect(isBlacklisted('customRender')).toBe(true);
  });

  it('returns false for safe methods', () => {
    expect(isBlacklisted('getText')).toBe(false);
    expect(isBlacklisted('getProperty')).toBe(false);
    expect(isBlacklisted('getId')).toBe(false);
    expect(isBlacklisted('firePress')).toBe(false);
    expect(isBlacklisted('setValue')).toBe(false);
  });

  it('returns false for unblocked methods', () => {
    expect(isBlacklisted('destroy')).toBe(false);
    expect(isBlacklisted('getMetadata')).toBe(false);
    expect(isBlacklisted('getInterface')).toBe(false);
    expect(isBlacklisted('getBusy')).toBe(false);
    expect(isBlacklisted('setBusy')).toBe(false);
    expect(isBlacklisted('getTooltip')).toBe(false);
    expect(isBlacklisted('setTooltip')).toBe(false);
    expect(isBlacklisted('getCustomData')).toBe(false);
    expect(isBlacklisted('addCustomData')).toBe(false);
    expect(isBlacklisted('removeCustomData')).toBe(false);
  });
});

describe('filterMethods', () => {
  it('removes blacklisted methods but keeps unblocked ones', () => {
    const input = ['getText', 'constructor', 'setValue', 'destroy'];
    const result = filterMethods(input);
    expect(result).toEqual(['getText', 'setValue', 'destroy']);
  });

  it('removes mk-sourced blacklisted methods', () => {
    const input = ['getText', 'setAggregation', 'getAssociation', 'isActive', 'setValue'];
    const result = filterMethods(input);
    expect(result).toEqual(['getText', 'setValue']);
  });

  it('removes underscore-prefixed methods', () => {
    const input = ['getText', '_internal', 'setValue'];
    const result = filterMethods(input);
    expect(result).toEqual(['getText', 'setValue']);
  });

  it('preserves order of non-blacklisted methods', () => {
    const input = ['setValue', 'getText', 'getProperty', 'getId'];
    const result = filterMethods(input);
    expect(result).toEqual(['setValue', 'getText', 'getProperty', 'getId']);
  });

  it('returns empty array when all methods are blacklisted', () => {
    const input = ['constructor', 'setAggregation', '_private'];
    const result = filterMethods(input);
    expect(result).toEqual([]);
  });

  it('keeps unblocked methods that were previously blacklisted', () => {
    const input = ['getMetadata', 'getInterface', 'getBusy', 'getTooltip', 'getCustomData'];
    const result = filterMethods(input);
    expect(result).toEqual([
      'getMetadata',
      'getInterface',
      'getBusy',
      'getTooltip',
      'getCustomData',
    ]);
  });

  it('handles empty input', () => {
    expect(filterMethods([])).toEqual([]);
  });
});
