/**
 * @license
 * Copyright (c) ZesTest 2025-2030. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0
 *
 * This file may contain AI-assisted code.
 * See LICENSE and NOTICE files for details.
 */

/**
 * Exhaustive type narrowing utility for switch/if-else chains.
 *
 * @remarks
 * When used as a `default` case in a switch statement on a discriminated union,
 * TypeScript will raise a compile-time error if any union variant is unhandled.
 * At runtime, it throws an error as a safety net.
 *
 * @example
 * ```typescript
 * type Status = 'active' | 'inactive';
 *
 * function handleStatus(status: Status): string {
 *   switch (status) {
 *     case 'active': return 'ON';
 *     case 'inactive': return 'OFF';
 *     default: return assertNever(status);
 *   }
 * }
 * ```
 *
 * @module utils
 */

/**
 * Asserts that a value is of type `never`, indicating all cases are handled.
 *
 * @param value - A value that should be unreachable.
 * @returns Never — always throws.
 * @throws Error with a descriptive message including the unexpected value.
 *
 * @example
 * ```typescript
 * switch (action) {
 *   case 'create': return handleCreate();
 *   case 'delete': return handleDelete();
 *   default: return assertNever(action);
 * }
 * ```
 */
export function assertNever(value: never): never {
  // eslint-disable-next-line @typescript-eslint/restrict-template-expressions -- deliberately stringifying for diagnostics
  throw new Error(`Unexpected value: ${value}`);
}
