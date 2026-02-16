/**
 * Config module barrel — re-exports schema, loader, and types.
 *
 * @module config
 */

// ── Schema ───────────────────────────────────────────────────────────
export { PramanConfigSchema } from './schema.js';
export type { PramanConfig, PramanConfigInput } from './schema.js';

// ── Loader ───────────────────────────────────────────────────────────
export { defineConfig, loadConfig } from './loader.js';
export type { LoadConfigOptions } from './loader.js';
