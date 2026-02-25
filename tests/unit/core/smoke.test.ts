/**
 * @license
 * Copyright (c) ZesTest 2025-2030. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0
 *
 * This file may contain AI-assisted code.
 * See LICENSE and NOTICE files for details.
 */

import process from 'node:process';

import { describe, expect, it } from 'vitest';

describe('workspace smoke test', () => {
  it('should verify project is configured correctly', () => {
    expect(true).toBe(true);
  });

  it('should have correct Node.js version', () => {
    const major = parseInt(process.version.slice(1).split('.')[0] ?? '0', 10);
    expect(major).toBeGreaterThanOrEqual(20);
  });
});
