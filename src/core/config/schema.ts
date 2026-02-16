/**
 * PramanConfigSchema — Zod schema defining the complete Praman configuration.
 *
 * @remarks
 * Single source of truth for config validation. All fields have defaults.
 * Uses `z.object().strict()` to reject unknown fields.
 *
 * The `PramanConfig` type is derived from this schema via `z.output<>`.
 * Do NOT create a manual interface — use the Zod-derived type.
 *
 * M8: `controlDiscoveryTimeout` (top-level) and `selectors.defaultTimeout`
 * both default to 10_000ms. Top-level takes precedence during resolution
 * in the config loader. Both are preserved for backwards compatibility.
 *
 * @example
 * ```typescript
 * import { PramanConfigSchema } from '#core/config/schema.js';
 *
 * const result = PramanConfigSchema.safeParse({ logLevel: 'debug' });
 * if (result.success) {
 *   const config = result.data; // PramanConfig
 * }
 * ```
 *
 * @module config
 */

import { z } from 'zod/v4';

// ── Auth sub-schema ──────────────────────────────────────────────────
const authSchema = z.object({
  strategy: z.enum(['btp-saml', 'basic', 'office365', 'custom']).default('basic'),
  baseUrl: z.url(),
  username: z.string().optional(),
  password: z.string().optional(),
  client: z.string().default('100'),
  language: z.string().default('EN'),
});

// ── AI sub-schema ────────────────────────────────────────────────────
const aiSchema = z.object({
  provider: z.enum(['azure-openai', 'openai']).default('azure-openai'),
  apiKey: z.string().optional(),
  model: z.string().optional(),
  temperature: z.number().min(0).max(2).default(0.3),
  maxTokens: z.number().int().positive().optional(),
});

// ── Telemetry sub-schema ─────────────────────────────────────────────
const telemetrySchema = z.object({
  openTelemetry: z.boolean().default(false),
  exporter: z.enum(['otlp', 'azure-monitor', 'jaeger']).default('otlp'),
  endpoint: z.url().optional(),
  serviceName: z.string().default('playwright-praman'),
});

// ── Selectors sub-schema ─────────────────────────────────────────────
const selectorsSchema = z.object({
  defaultTimeout: z.number().int().positive().default(10_000),
  preferVisibleControls: z.boolean().default(true),
  skipStabilityWait: z.boolean().default(false),
});

// ── Root schema ──────────────────────────────────────────────────────

/**
 * Zod schema for complete Praman configuration.
 *
 * @remarks
 * All top-level fields have defaults so `{}` is a valid input.
 * Nested sections (`auth`, `ai`, `telemetry`, `selectors`) are optional.
 *
 * @example
 * ```typescript
 * const result = PramanConfigSchema.safeParse({});
 * // result.success === true, all defaults applied
 * ```
 */
export const PramanConfigSchema = z
  .object({
    logLevel: z.enum(['error', 'warn', 'info', 'debug', 'verbose']).default('info'),
    ui5WaitTimeout: z.number().int().positive().default(30_000),
    controlDiscoveryTimeout: z.number().int().positive().default(10_000),
    interactionStrategy: z.enum(['playwright', 'dom-first', 'opa5', 'hybrid']).default('hybrid'),
    skipStabilityWait: z.boolean().default(false),
    preferVisibleControls: z.boolean().default(true),
    ignoreAutoWaitUrls: z.array(z.string()).default([]),
    auth: authSchema.optional(),
    ai: aiSchema.optional(),
    telemetry: telemetrySchema.optional(),
    selectors: selectorsSchema.optional(),
  })
  .strict();

/**
 * Validated, defaults-applied Praman configuration type.
 *
 * @remarks
 * Derived from the Zod schema. Do NOT create a manual interface.
 * Import this type from `#core/config/schema.js` or `#core/config/index.js`.
 */
export type PramanConfig = z.output<typeof PramanConfigSchema>;

/**
 * User-facing input type for Praman configuration (pre-defaults).
 *
 * @remarks
 * All fields are optional. Used by `defineConfig()` and `loadConfig()`.
 */
export type PramanConfigInput = z.input<typeof PramanConfigSchema>;
