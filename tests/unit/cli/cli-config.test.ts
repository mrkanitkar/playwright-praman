/**
 * @license
 * Copyright (c) ZesTest 2025-2030. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0
 *
 * This file may contain AI-assisted code.
 * See LICENSE and NOTICE files for details.
 */

/**
 * Tests for `examples/praman-cli.config.json` — CLI config template validation.
 *
 * @remarks
 * Reads the CLI config template from the examples directory and validates
 * that it is well-formed JSON with the expected top-level structure.
 *
 * @module cli/cli-config
 */

import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import process from 'node:process';

import { describe, expect, it } from 'vitest';

// ── Helpers ─────────────────────────────────────────────────────────────────

const CONFIG_PATH = join(process.cwd(), 'examples', 'praman-cli.config.json');
// eslint-disable-next-line security/detect-non-literal-fs-filename -- test fixture with known path
const rawContent = readFileSync(CONFIG_PATH, 'utf8');

// ── Tests ───────────────────────────────────────────────────────────────────

describe('examples/praman-cli.config.json — CLI config template', () => {
  it('is valid JSON', () => {
    expect(() => JSON.parse(rawContent) as unknown).not.toThrow();
  });

  it('has browser.initScript as an array', () => {
    const config = JSON.parse(rawContent) as Record<string, unknown>;
    const browser = config['browser'] as Record<string, unknown>;

    expect(browser).toBeDefined();
    expect(Array.isArray(browser['initScript'])).toBe(true);
  });

  it('has browser.browserName as a string', () => {
    const config = JSON.parse(rawContent) as Record<string, unknown>;
    const browser = config['browser'] as Record<string, unknown>;

    expect(browser).toBeDefined();
    expect(typeof browser['browserName']).toBe('string');
  });

  it('has timeouts.navigation as a number', () => {
    const config = JSON.parse(rawContent) as Record<string, unknown>;
    const timeouts = config['timeouts'] as Record<string, unknown>;

    expect(timeouts).toBeDefined();
    expect(typeof timeouts['navigation']).toBe('number');
  });
});
