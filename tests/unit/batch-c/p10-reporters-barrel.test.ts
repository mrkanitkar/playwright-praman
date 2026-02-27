/**
 * @license
 * Copyright (c) ZesTest 2025-2030. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0
 *
 * This file may contain AI-assisted code.
 * See LICENSE and NOTICE files for details.
 */

/**
 * P10: Verify @internal utility functions are NOT re-exported from the reporters barrel.
 *
 * @remarks
 * `extractEntitySet` and `parseODataQueryParams` are marked `@internal` in
 * `odata-trace-reporter.ts`. Internal utilities must not be exported from
 * the public barrel `src/reporters/index.ts` per Google TS Style:
 * "no barrel re-exports of internals".
 *
 * @module batch-c
 */

import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { describe, expect, it } from 'vitest';

/** Resolved path to the reporters barrel. */
const BARREL_PATH = join(__dirname, '..', '..', '..', 'src', 'reporters', 'index.ts');

/** Reads the reporters barrel file content. */
function readBarrel(): string {
  // eslint-disable-next-line security/detect-non-literal-fs-filename -- test utility: path built from __dirname + literal segments
  return readFileSync(BARREL_PATH, 'utf8');
}

describe('P10: reporters barrel @internal audit', () => {
  it('does not re-export extractEntitySet from the reporters barrel', () => {
    const content = readBarrel();

    // extractEntitySet is @internal — should not appear in exports
    expect(content).not.toMatch(/export\s*\{[^}]*extractEntitySet[^}]*\}/s);
  });

  it('does not re-export parseODataQueryParams from the reporters barrel', () => {
    const content = readBarrel();

    // parseODataQueryParams is @internal — should not appear in exports
    expect(content).not.toMatch(/export\s*\{[^}]*parseODataQueryParams[^}]*\}/s);
  });

  it('still exports ComplianceReporter from the reporters barrel', () => {
    const content = readBarrel();

    expect(content).toContain('ComplianceReporter');
  });

  it('still exports ODataTraceReporter from the reporters barrel', () => {
    const content = readBarrel();

    expect(content).toContain('ODataTraceReporter');
  });
});
