/**
 * Mock config factory for unit tests.
 *
 * @remarks
 * Creates `Readonly<PramanConfig>` instances with all defaults applied.
 * Accepts partial overrides for specific test scenarios.
 *
 * @example
 * ```typescript
 * import { createMockConfig } from '../../helpers/mock-config.js';
 *
 * const config = createMockConfig({ logLevel: 'debug' });
 * ```
 *
 * @module test-helpers
 */

import { PramanConfigSchema } from '#core/config/schema.js';
import type { PramanConfig, PramanConfigInput } from '#core/config/schema.js';

/**
 * Creates a valid, frozen PramanConfig with overrides.
 *
 * @param overrides - Partial config input to merge with defaults.
 * @returns Frozen PramanConfig with all defaults applied.
 * @throws If overrides produce an invalid config (should not happen in tests).
 *
 * @example
 * ```typescript
 * const config = createMockConfig({ logLevel: 'verbose', ui5WaitTimeout: 5000 });
 * ```
 */
export function createMockConfig(overrides?: PramanConfigInput): Readonly<PramanConfig> {
  const result = PramanConfigSchema.safeParse(overrides ?? {});
  if (!result.success) {
    throw new Error(`Invalid mock config: ${result.error.message}`);
  }
  return Object.freeze(result.data);
}

/**
 * Default mock config with all Zod defaults applied.
 *
 * @example
 * ```typescript
 * import { DEFAULT_MOCK_CONFIG } from '../../helpers/mock-config.js';
 * ```
 */
export const DEFAULT_MOCK_CONFIG: Readonly<PramanConfig> = createMockConfig();
