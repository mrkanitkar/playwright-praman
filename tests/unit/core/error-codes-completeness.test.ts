/**
 * @license
 * Copyright (c) ZesTest 2025-2030. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0
 *
 * This file may contain AI-assisted code.
 * See LICENSE and NOTICE files for details.
 */

/**
 * Completeness test: every `ErrorCode` value must appear in the docs page.
 *
 * @remarks
 * This test prevents documentation drift. If a new error code is added to
 * `src/core/errors/codes.ts` but not documented in `docs/docs/guides/error-codes.md`,
 * this test will fail with a list of the missing codes.
 *
 * Run as part of `npm run test:unit`. Fails fast if the docs file is missing.
 */
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { describe, expect, it } from 'vitest';

import { ErrorCode } from '#core/errors/codes.js';

describe('error codes documentation completeness', () => {
  it('every ErrorCode has an entry in error-codes.md', () => {
    const docsPath = resolve('docs/docs/guides/error-codes.md');
    const docsContent = readFileSync(docsPath, 'utf8');
    const codes = Object.values(ErrorCode);

    const missing: string[] = [];
    for (const code of codes) {
      if (!docsContent.includes(code)) {
        missing.push(code);
      }
    }

    expect(missing, `Missing error codes in docs: ${missing.join(', ')}`).toEqual([]);
  });
});
