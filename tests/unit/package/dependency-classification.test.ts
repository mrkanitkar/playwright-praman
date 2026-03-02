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
 * optional peer dependencies are correctly declared, and
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
  peerDependencies?: Record<string, string>;
  peerDependenciesMeta?: Record<string, { optional?: boolean }>;
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

  // ── AI/OTel SDKs must be optional peerDependencies (not optionalDependencies) ──
  it('openai is an optional peerDependency', () => {
    expect(pkg.peerDependencies?.['openai']).toBeDefined();
    expect(pkg.peerDependenciesMeta?.['openai']?.optional).toBe(true);
  });

  it('@opentelemetry/api is an optional peerDependency', () => {
    expect(pkg.peerDependencies?.['@opentelemetry/api']).toBeDefined();
    expect(pkg.peerDependenciesMeta?.['@opentelemetry/api']?.optional).toBe(true);
  });

  it('@opentelemetry/sdk-node is an optional peerDependency', () => {
    expect(pkg.peerDependencies?.['@opentelemetry/sdk-node']).toBeDefined();
    expect(pkg.peerDependenciesMeta?.['@opentelemetry/sdk-node']?.optional).toBe(true);
  });

  it('@anthropic-ai/sdk is an optional peerDependency', () => {
    expect(pkg.peerDependencies?.['@anthropic-ai/sdk']).toBeDefined();
    expect(pkg.peerDependenciesMeta?.['@anthropic-ai/sdk']?.optional).toBe(true);
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

  // ── No optionalDependencies field (moved to peerDependencies) ────────
  it('does NOT have an optionalDependencies field', () => {
    expect((pkg as Record<string, unknown>)['optionalDependencies']).toBeUndefined();
  });
});
