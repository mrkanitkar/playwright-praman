/**
 * @license
 * Copyright (c) ZesTest 2025-2030. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0
 *
 * This file may contain AI-assisted code.
 * See LICENSE and NOTICE files for details.
 */

/**
 * Config module barrel — re-exports schema, loader, and types.
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
