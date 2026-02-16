/**
 * Framework-agnostic validation types.
 *
 * @remarks
 * Decouples error classes from Zod. The `core/errors/` layer imports these
 * types instead of `zod` directly, preserving the dependency rule:
 * errors imports from `core/types/` only.
 *
 * @module types
 */

/**
 * Framework-agnostic validation issue.
 *
 * @remarks
 * Wraps Zod's `ZodIssue` shape without importing zod.
 * Used by {@link ConfigError} to report schema validation failures.
 *
 * @example
 * ```typescript
 * import type { ValidationIssue } from '#core/types/validation.js';
 *
 * const issue: ValidationIssue = {
 *   path: ['auth', 'strategy'],
 *   message: 'Invalid enum value',
 *   code: 'invalid_enum_value',
 * };
 * ```
 */
export interface ValidationIssue {
  /** JSON path to the invalid field. */
  readonly path: readonly (string | number)[];
  /** Human-readable error message. */
  readonly message: string;
  /** Validation error code (mirrors Zod issue codes). */
  readonly code: string;
}
