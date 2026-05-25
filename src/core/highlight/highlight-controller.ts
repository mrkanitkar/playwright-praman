/**
 * @license
 * Copyright (c) ZesTest 2025-2030. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0
 *
 * This file may contain AI-assisted code.
 * See LICENSE and NOTICE files for details.
 */

/**
 * Page-keyed highlight state shared between the screencast fixture (writer) and
 * the control proxy (reader). Lives in `#core` so the proxy can read it without
 * importing the fixtures layer (preserves layer boundaries). Keyed by `Page`
 * via a `WeakMap` — per-page (parallel-safe) and auto-collected.
 *
 * @module core/highlight
 */

import type { Page } from '@playwright/test';

/**
 * Highlight toggle for a page.
 *
 * @example
 * ```typescript
 * const state: HighlightState = { enabled: true, style: 'outline: 3px solid red' };
 * ```
 */
export interface HighlightState {
  /** Whether control interactions should auto-highlight. */
  readonly enabled: boolean;
  /** Inline CSS string or CSS-property map passed to `locator.highlight({ style })`. */
  readonly style?: string | Record<string, string | number>;
}

/** Default highlight style (Praman accent outline). */
export const DEFAULT_HIGHLIGHT_STYLE = 'outline: 3px solid #e8482b; outline-offset: 2px';

const registry = new WeakMap<Page, HighlightState>();

/**
 * Sets the highlight state for a page.
 *
 * @param page - The Playwright page.
 * @param state - The highlight state to store.
 *
 * @example
 * ```typescript
 * setHighlightState(page, { enabled: true, style: DEFAULT_HIGHLIGHT_STYLE });
 * ```
 */
export function setHighlightState(page: Page, state: HighlightState): void {
  registry.set(page, state);
}

/**
 * Reads the highlight state for a page.
 *
 * @param page - The Playwright page.
 * @returns The stored state, or `undefined` if none.
 *
 * @example
 * ```typescript
 * const state = getHighlightState(page);
 * ```
 */
export function getHighlightState(page: Page): HighlightState | undefined {
  return registry.get(page);
}

/**
 * Clears the highlight state for a page.
 *
 * @param page - The Playwright page.
 *
 * @example
 * ```typescript
 * clearHighlightState(page);
 * ```
 */
export function clearHighlightState(page: Page): void {
  registry.delete(page);
}
