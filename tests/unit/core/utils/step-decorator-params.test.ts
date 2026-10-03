/**
 * @license
 * Copyright (c) ZesTest 2025-2030. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0
 *
 * This file may contain AI-assisted code.
 * See LICENSE and NOTICE files for details.
 */

/**
 * Unit tests for the Playwright 1.63 step-params path in `step-decorator.ts`.
 *
 * @remarks
 * Kept separate from `step-decorator.test.ts` because this file mocks
 * `hasFeature`, which the sibling file deliberately does not. Both the
 * flag-on (1.63) and flag-off (1.57-1.62) paths are asserted: a one-sided
 * test is how a degrade silently becomes a no-op.
 */

import { beforeEach, describe, expect, it, vi } from 'vitest';

const mockHasFeature = vi.fn();
vi.mock('#core/compat/playwright-compat.js', () => ({
  hasFeature: mockHasFeature,
}));

const { buildStepOptions } = await import('#core/utils/step-decorator.js');

/** Makes `hasFeature` answer per-flag rather than uniformly. */
function withFlags(flags: Readonly<Record<string, boolean>>): void {
  mockHasFeature.mockImplementation((flag: string) => flags[flag] ?? false);
}

describe('buildStepOptions', () => {
  beforeEach(() => {
    mockHasFeature.mockReset();
  });

  // ── Playwright 1.63 — structured params available ────────────────────────

  it('emits the praman marker when hasStepParams is on', () => {
    withFlags({ hasStepParams: true, hasBoxedStep: true });

    const options = buildStepOptions({ praman: true, module: 'UI5Handler', action: 'click' });

    expect(options.params).toEqual({ praman: true, module: 'UI5Handler', action: 'click' });
  });

  it('emits the marker even with no module or action supplied', () => {
    // Every `withStep` call site benefits without changing its arguments:
    // the marker alone is what the compliance reporter classifies on.
    withFlags({ hasStepParams: true, hasBoxedStep: true });

    expect(buildStepOptions().params).toEqual({ praman: true });
  });

  it('passes through a subtitle when one is supplied', () => {
    withFlags({ hasStepParams: true, hasBoxedStep: true });

    const options = buildStepOptions({ praman: true }, '{ id: "save" }');

    expect(options.subtitle).toBe('{ id: "save" }');
  });

  it('omits subtitle rather than emitting an empty string', () => {
    withFlags({ hasStepParams: true, hasBoxedStep: true });

    expect(buildStepOptions({ praman: true }, '')).not.toHaveProperty('subtitle');
  });

  // ── Playwright 1.57-1.62 — floor path ────────────────────────────────────

  it('emits no params key at all when hasStepParams is off', () => {
    withFlags({ hasStepParams: false, hasBoxedStep: true });

    const options = buildStepOptions({ praman: true, module: 'UI5Handler', action: 'click' });

    expect(options).not.toHaveProperty('params');
    expect(options).not.toHaveProperty('subtitle');
  });

  it('still boxes the step on the floor, preserving existing behaviour', () => {
    withFlags({ hasStepParams: false, hasBoxedStep: true });

    expect(buildStepOptions()).toEqual({ box: true });
  });

  it('emits an empty object when neither flag is available', () => {
    withFlags({});

    expect(buildStepOptions({ praman: true }, 'x')).toEqual({});
  });

  it('does not box when hasBoxedStep is off but params is on', () => {
    withFlags({ hasStepParams: true, hasBoxedStep: false });

    const options = buildStepOptions();

    expect(options).not.toHaveProperty('box');
    expect(options.params).toEqual({ praman: true });
  });
});
