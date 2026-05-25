/**
 * @license
 * Copyright (c) ZesTest 2025-2030. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0
 *
 * This file may contain AI-assisted code.
 * See LICENSE and NOTICE files for details.
 */
import type { Page } from '@playwright/test';
import { describe, expect, it } from 'vitest';

import {
  clearHighlightState,
  DEFAULT_HIGHLIGHT_STYLE,
  getHighlightState,
  setHighlightState,
} from '#core/highlight/highlight-controller.js';

const fakePage = (): Page => ({}) as unknown as Page;

describe('highlight-controller', () => {
  it('round-trips state per page', () => {
    const p = fakePage();
    expect(getHighlightState(p)).toBeUndefined();
    setHighlightState(p, { enabled: true, style: 'outline: 1px' });
    expect(getHighlightState(p)).toEqual({ enabled: true, style: 'outline: 1px' });
  });

  it('isolates state between pages', () => {
    const a = fakePage();
    const b = fakePage();
    setHighlightState(a, { enabled: true });
    expect(getHighlightState(b)).toBeUndefined();
  });

  it('clears state', () => {
    const p = fakePage();
    setHighlightState(p, { enabled: true });
    clearHighlightState(p);
    expect(getHighlightState(p)).toBeUndefined();
  });

  it('exposes a default style string', () => {
    expect(typeof DEFAULT_HIGHLIGHT_STYLE).toBe('string');
  });
});
