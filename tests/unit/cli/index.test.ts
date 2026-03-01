/**
 * @license
 * Copyright (c) ZesTest 2025-2030. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0
 *
 * This file may contain AI-assisted code.
 * See LICENSE and NOTICE files for details.
 */

/**
 * Tests for `src/cli/index.ts` — thin CLI entry point.
 *
 * @remarks
 * The thin entry file only imports `program` from `./program.js` and calls
 * `.parse()`. Real command routing is tested in `program.test.ts`.
 * This file verifies that the program module exports are accessible.
 *
 * @module cli/index
 */

import { describe, expect, it } from 'vitest';

// ── Tests ───────────────────────────────────────────────────────────────────

describe('cli/index', () => {
  it('program module exports createProgram factory function', async () => {
    const mod = await import('../../../src/cli/program.js');

    expect(mod.createProgram).toBeTypeOf('function');
  });

  it('program module exports singleton program instance', async () => {
    const mod = await import('../../../src/cli/program.js');

    expect(mod.program).toBeDefined();
    expect(mod.program.name()).toBe('playwright-praman');
  });
});
