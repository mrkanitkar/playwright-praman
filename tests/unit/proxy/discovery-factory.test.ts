/**
 * @license
 * Copyright (c) ZesTest 2025-2030. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0
 *
 * This file may contain AI-assisted code.
 * See LICENSE and NOTICE files for details.
 */

/**
 * Tests for `src/proxy/discovery-factory.ts`.
 *
 * @remarks
 * Validates the discovery strategy priority builder that determines
 * the order of control lookup approaches.
 */
import { describe, expect, it } from 'vitest';

import type { DiscoveryStrategy } from '#proxy/discovery-factory.js';
import { getDiscoveryPriorities } from '#proxy/discovery-factory.js';

describe('discovery-factory', () => {
  it('always prepends cache as first strategy', () => {
    const priorities = getDiscoveryPriorities({ controlType: 'sap.m.Button' }, ['recordreplay']);
    expect(priorities[0]).toBe('cache');
  });

  it('appends configured strategies after cache', () => {
    const priorities = getDiscoveryPriorities({ controlType: 'sap.m.Button' }, [
      'recordreplay',
      'direct-id',
    ]);
    expect(priorities).toEqual(['cache', 'recordreplay', 'direct-id']);
  });

  it('uses direct-id first for ID-only selectors', () => {
    const priorities = getDiscoveryPriorities({ id: 'btn1' }, ['recordreplay', 'direct-id']);
    expect(priorities[1]).toBe('direct-id');
  });

  it('uses recordreplay first for controlType selectors', () => {
    const priorities = getDiscoveryPriorities({ controlType: 'sap.m.Button' }, [
      'recordreplay',
      'direct-id',
    ]);
    expect(priorities[1]).toBe('recordreplay');
  });

  it('deduplicates cache if user provides it', () => {
    const priorities = getDiscoveryPriorities({ id: 'btn1' }, ['recordreplay', 'direct-id']);
    const cacheCount = priorities.filter((s: DiscoveryStrategy) => s === 'cache').length;
    expect(cacheCount).toBe(1);
  });

  it('returns only cache for empty strategy list', () => {
    const priorities = getDiscoveryPriorities({ id: 'btn1' }, []);
    expect(priorities).toEqual(['cache']);
  });

  it('handles registry strategy', () => {
    const priorities = getDiscoveryPriorities({ controlType: 'sap.m.Table' }, ['registry']);
    expect(priorities).toEqual(['cache', 'registry']);
  });

  it('preserves user-defined order', () => {
    const priorities = getDiscoveryPriorities({ controlType: 'sap.m.Button' }, [
      'direct-id',
      'recordreplay',
      'registry',
    ]);
    expect(priorities).toEqual(['cache', 'direct-id', 'recordreplay', 'registry']);
  });
});
