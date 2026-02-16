/**
 * Type-level tests for `src/core/types/validation.ts`.
 *
 * @remarks
 * Verifies ValidationIssue interface shape and readonly constraints.
 */
import { describe, expectTypeOf, it } from 'vitest';

import type { ValidationIssue } from '#core/types/validation.js';

describe('ValidationIssue', () => {
  it('matches the expected shape', () => {
    const issue: ValidationIssue = {
      path: ['auth', 'strategy'],
      message: 'Invalid enum value',
      code: 'invalid_enum_value',
    };
    expectTypeOf(issue).toExtend<ValidationIssue>();
  });

  it('requires all three fields', () => {
    expectTypeOf<ValidationIssue>().toHaveProperty('path');
    expectTypeOf<ValidationIssue>().toHaveProperty('message');
    expectTypeOf<ValidationIssue>().toHaveProperty('code');
  });

  it('accepts numeric path segments for array indices', () => {
    const issue: ValidationIssue = {
      path: ['items', 0, 'quantity'],
      message: 'Expected number, received string',
      code: 'invalid_type',
    };
    expectTypeOf(issue.path).toExtend<readonly (string | number)[]>();
  });
});
