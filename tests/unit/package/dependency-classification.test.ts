/**
 * @license
 * Copyright (c) ZesTest 2025-2030. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0
 *
 * This file may contain AI-assisted code.
 * See LICENSE and NOTICE files for details.
 */

/**
 * Tests for `package.json` dependency classification.
 *
 * @remarks
 * Verifies that production dependencies do not include dev-only packages,
 * optional dependencies use semver ranges (not exact pins), and
 * dev-only packages are correctly placed in devDependencies.
 */
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { describe, expect, it } from 'vitest';

const dirName = dirname(fileURLToPath(import.meta.url));
const pkgPath = join(dirName, '../../../package.json');
const pkg = JSON.parse(readFileSync(pkgPath, 'utf-8')) as {
  dependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
  optionalDependencies?: Record<string, string>;
};

describe('package.json dependency classification', () => {
  // ── Production dependencies must not include dev-only packages ────────
  it('dependencies does NOT contain dotenv', () => {
    expect(pkg.dependencies?.['dotenv']).toBeUndefined();
  });

  it('dependencies does NOT contain zod-to-json-schema', () => {
    expect(pkg.dependencies?.['zod-to-json-schema']).toBeUndefined();
  });

  // ── Dev-only packages must be in devDependencies ─────────────────────
  it('devDependencies contains dotenv', () => {
    expect(pkg.devDependencies?.['dotenv']).toBeDefined();
  });

  it('devDependencies contains zod-to-json-schema', () => {
    expect(pkg.devDependencies?.['zod-to-json-schema']).toBeDefined();
  });

  // ── Optional dependencies must use semver ranges (not exact pins) ────
  it('openai in optionalDependencies uses a semver range (^)', () => {
    const openaiVersion = pkg.optionalDependencies?.['openai'];
    expect(openaiVersion).toBeDefined();
    expect(openaiVersion).toMatch(/^\^/);
  });

  it('dotenv in devDependencies uses a semver range (^)', () => {
    const dotenvVersion = pkg.devDependencies?.['dotenv'];
    expect(dotenvVersion).toBeDefined();
    expect(dotenvVersion).toMatch(/^\^/);
  });

  it('zod-to-json-schema in devDependencies uses a semver range (^)', () => {
    const zodVersion = pkg.devDependencies?.['zod-to-json-schema'];
    expect(zodVersion).toBeDefined();
    expect(zodVersion).toMatch(/^\^/);
  });

  // ── opentelemetry still in optionalDependencies ──────────────────────
  it('optionalDependencies still contains @opentelemetry packages', () => {
    const apiVersion = pkg.optionalDependencies?.['@opentelemetry/api'];
    expect(apiVersion).toBeDefined();
  });
});
