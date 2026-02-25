/**
 * @license
 * Copyright (c) ZesTest 2025-2030. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0
 *
 * This file may contain AI-assisted code.
 * See LICENSE and NOTICE files for details.
 */

/**
 * Tests for `src/core/errors/navigation-error.ts`.
 */
import { describe, expect, it } from 'vitest';

import { runBaseErrorTests } from '../../../helpers/error-test-runner.js';

import { PramanError } from '#core/errors/base.js';
import { ErrorCode } from '#core/errors/codes.js';
import { NavigationError } from '#core/errors/navigation-error.js';

describe('NavigationError', () => {
  runBaseErrorTests(
    NavigationError,
    {
      message: 'Route failed',
      attempted: 'Navigate to purchase order app',
    },
    {
      expectedName: 'NavigationError',
      expectedDefaultCode: ErrorCode.ERR_NAV_ROUTE_FAILED,
      expectedDefaultRetryable: true,
    },
  );

  it('extends PramanError', () => {
    const error = new NavigationError({
      message: 'Route failed',
      attempted: 'Navigate',
    });
    expect(error).toBeInstanceOf(PramanError);
  });

  it('accepts custom error code', () => {
    const error = new NavigationError({
      code: ErrorCode.ERR_NAV_TILE_NOT_FOUND,
      message: 'Tile not found',
      attempted: 'Find FLP tile',
    });
    expect(error.code).toBe(ErrorCode.ERR_NAV_TILE_NOT_FOUND);
  });

  it('stores targetUrl from options', () => {
    const error = new NavigationError({
      message: 'Route failed',
      attempted: 'Navigate',
      targetUrl: 'https://sap.example.com/app/po',
    });
    expect(error.targetUrl).toBe('https://sap.example.com/app/po');
  });

  it('stores currentUrl from options', () => {
    const error = new NavigationError({
      message: 'Route failed',
      attempted: 'Navigate',
      currentUrl: 'https://sap.example.com/flp',
    });
    expect(error.currentUrl).toBe('https://sap.example.com/flp');
  });

  it('includes subclass fields in toJSON()', () => {
    const error = new NavigationError({
      message: 'Route failed',
      attempted: 'Navigate',
      targetUrl: 'https://sap.example.com/app',
      currentUrl: 'https://sap.example.com/flp',
    });
    const json = error.toJSON();
    expect(json).toHaveProperty('targetUrl');
    expect(json).toHaveProperty('currentUrl');
  });
});
