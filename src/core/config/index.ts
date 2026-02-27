/**
 * @license
 * Copyright (c) ZesTest 2025-2030. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0
 *
 * This file may contain AI-assisted code.
 * See LICENSE and NOTICE files for details.
 */

/**
 * Config module — schema validation, config loading, and type exports.
 *
 * @remarks
 * Re-exports the Zod-based config schema (`PramanConfigSchema`), the
 * file-system config loader (`loadConfig`), the convenience `defineConfig`
 * helper, and all configuration-related TypeScript types.
 *
 * This is the single entry point for all config operations in Praman.
 *
 * @example
 * ```typescript
 * import { loadConfig, defineConfig } from '#core/config/index.js';
 * import type { PramanConfig } from '#core/config/index.js';
 *
 * // Load with defaults
 * const config: Readonly<PramanConfig> = await loadConfig();
 *
 * // Define inline (for tests)
 * const testConfig = defineConfig({ logLevel: 'debug' });
 * ```
 *
 * @module config
 */

// ── Schema ───────────────────────────────────────────────────────────
export { PramanConfigSchema } from './schema.js';
export type {
  DiscoveryStrategyName,
  InteractionStrategyName,
  PramanConfig,
  PramanConfigInput,
} from './schema.js';

// ── Loader ───────────────────────────────────────────────────────────
export { defineConfig, loadConfig } from './loader.js';
export type { LoadConfigOptions } from './loader.js';
