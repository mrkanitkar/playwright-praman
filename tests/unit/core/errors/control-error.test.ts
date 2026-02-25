/**
 * @license
 * Copyright (c) ZesTest 2025-2030. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0
 *
 * This file may contain AI-assisted code.
 * See LICENSE and NOTICE files for details.
 */

/**
 * Tests for `src/core/errors/control-error.ts`.
 */
import { describe, expect, it } from 'vitest';

import { runBaseErrorTests } from '../../../helpers/error-test-runner.js';

import { PramanError } from '#core/errors/base.js';
import { ErrorCode } from '#core/errors/codes.js';
import { ControlError } from '#core/errors/control-error.js';

describe('ControlError', () => {
  runBaseErrorTests(
    ControlError,
    {
      message: 'Control not found',
      attempted: 'Find control with ID: submitBtn',
    },
    {
      expectedName: 'ControlError',
      expectedDefaultCode: ErrorCode.ERR_CONTROL_NOT_FOUND,
      expectedDefaultRetryable: true,
    },
  );

  it('extends PramanError', () => {
    const error = new ControlError({
      message: 'Control not found',
      attempted: 'Find control',
    });
    expect(error).toBeInstanceOf(PramanError);
  });

  it('accepts custom error code', () => {
    const error = new ControlError({
      code: ErrorCode.ERR_CONTROL_NOT_VISIBLE,
      message: 'Control not visible',
      attempted: 'Check visibility',
    });
    expect(error.code).toBe(ErrorCode.ERR_CONTROL_NOT_VISIBLE);
  });

  it('stores lastKnownSelector from options', () => {
    const selector = { id: 'oldBtn' };
    const error = new ControlError({
      message: 'Control not found',
      attempted: 'Find control',
      lastKnownSelector: selector,
    });
    expect(error.lastKnownSelector).toEqual(selector);
  });

  it('stores availableControls from options', () => {
    const controls = ['btn1', 'btn2', 'btn3'];
    const error = new ControlError({
      message: 'Control not found',
      attempted: 'Find control',
      availableControls: controls,
    });
    expect(error.availableControls).toEqual(controls);
  });

  it('defaults availableControls to empty array', () => {
    const error = new ControlError({
      message: 'Control not found',
      attempted: 'Find control',
    });
    expect(error.availableControls).toEqual([]);
  });

  it('stores suggestedSelector from options', () => {
    const suggested = { id: 'submitBtn', controlType: 'sap.m.Button' };
    const error = new ControlError({
      message: 'Control not found',
      attempted: 'Find control',
      suggestedSelector: suggested,
    });
    expect(error.suggestedSelector).toEqual(suggested);
  });

  it('includes self-healing fields in toJSON()', () => {
    const error = new ControlError({
      message: 'Control not found',
      attempted: 'Find control',
      lastKnownSelector: { id: 'oldBtn' },
      availableControls: ['btn1'],
      suggestedSelector: { id: 'btn1' },
    });
    const json = error.toJSON();
    expect(json).toHaveProperty('lastKnownSelector');
    expect(json).toHaveProperty('availableControls', ['btn1']);
    expect(json).toHaveProperty('suggestedSelector');
  });

  it('includes self-healing fields in toAIContext()', () => {
    const error = new ControlError({
      message: 'Control not found',
      attempted: 'Find control',
      suggestedSelector: { id: 'btn1' },
    });
    const ctx = error.toAIContext();
    expect(ctx).toHaveProperty('suggestedSelector');
  });
});
