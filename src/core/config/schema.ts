/**
 * @license
 * Copyright (c) ZesTest 2025-2030. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0
 *
 * This file may contain AI-assisted code.
 * See LICENSE and NOTICE files for details.
 */

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

import { z } from 'zod';

// ── Auth sub-schema ──────────────────────────────────────────────────
const authSchema = z.object({
  /**
   * Auth strategy for SAP login.
   *
   * @remarks
   * - `basic`: On-premise form-based login (onprem-strategy)
   * - `btp-saml`: BTP Cloud SAML via IAS (cloud-saml-strategy)
   * - `office365`: Microsoft 365 / Azure AD SSO (office365-strategy)
   * - `custom`: User-provided login function
   *
   * For API-based, certificate, or multi-tenant auth, see the
   * authentication guide — these are configured programmatically.
   */
  strategy: z.enum(['btp-saml', 'basic', 'office365', 'custom']).default('basic'),
  baseUrl: z.url().optional(),
  username: z.string().optional(),
  password: z.string().optional(),
  client: z.string().default('100'),
  language: z.string().default('EN'),
});

// ── AI sub-schema ────────────────────────────────────────────────────
const aiSchema = z.object({
  provider: z.enum(['azure-openai', 'openai', 'anthropic']).default('azure-openai'),
  apiKey: z.string().optional(),
  model: z.string().optional(),
  temperature: z.number().min(0).max(2).default(0.3),
  maxTokens: z.number().int().positive().optional(),
  // Azure OpenAI-specific fields (W2: azure-openai + openai supported; W14: anthropic added)
  endpoint: z.url().optional(), // Azure: resource endpoint URL
  deployment: z.string().optional(), // Azure: deployment name
  apiVersion: z.string().optional(), // Azure: API version e.g. '2024-02-01'
  // Anthropic-specific fields (W14: separate key for security clarity)
  anthropicApiKey: z.string().optional(), // Anthropic: API key (distinct from openai apiKey)
});

// ── Telemetry sub-schema ─────────────────────────────────────────────

/**
 * Telemetry configuration sub-schema.
 *
 * @remarks
 * Phase 1: All telemetry operations use a NoOpTracer regardless of configuration.
 * Setting `openTelemetry: true` will log a warning but produce no trace data.
 * Real OTel SDK integration (Phase 2) is tracked as milestone M2.
 */
const telemetrySchema = z.object({
  openTelemetry: z.boolean().default(false),
  exporter: z.enum(['otlp', 'azure-monitor', 'jaeger']).default('otlp'),
  endpoint: z.url().optional(),
  serviceName: z.string().default('playwright-praman'),
});

// ── Selectors sub-schema ─────────────────────────────────────────────
const selectorsSchema = z.object({
  /** @deprecated Use top-level `controlDiscoveryTimeout` instead. */
  defaultTimeout: z.number().int().positive().default(10_000),
  preferVisibleControls: z.boolean().default(true),
  skipStabilityWait: z.boolean().default(false),
});

// ── Strategy enums (D11: single source of truth) ────────────────────

/**
 * Named Zod enum for interaction strategy values.
 *
 * @remarks
 * `InteractionStrategyName` is derived from this via `z.infer<>`.
 * Values: `'ui5-native'` (default), `'dom-first'`, `'opa5'`.
 * `'hybrid'` and `'playwright'` were removed (W15/W21, pre-release).
 */
const interactionStrategyEnum = z.enum(['ui5-native', 'dom-first', 'opa5']);

/**
 * Named Zod enum for discovery strategy values.
 *
 * @remarks
 * `DiscoveryStrategyName` is derived from this via `z.infer<>`.
 * Values: `'direct-id'`, `'recordreplay'`, `'registry'` (Phase 3+).
 * `'cache'` is internal (D9) — not user-configurable.
 */
const discoveryStrategyEnum = z.enum(['direct-id', 'recordreplay', 'registry']);

/**
 * Interaction strategy config type — string literal union derived from Zod.
 *
 * @remarks
 * This is the CONFIG type (which strategy to use). Not to be confused with
 * `InteractionStrategy` (runtime interface in `bridge/interaction-strategies/strategy.ts`).
 */
export type InteractionStrategyName = z.infer<typeof interactionStrategyEnum>;

/**
 * Discovery strategy config type — string literal union derived from Zod.
 *
 * @remarks
 * Used in `PramanConfig.discoveryStrategies` as an ordered priority chain.
 */
export type DiscoveryStrategyName = z.infer<typeof discoveryStrategyEnum>;

// ── OData tracing sub-schema ─────────────────────────────────────────
const odataTracingSchema = z.object({
  enabled: z.boolean().default(false),
  urlPatterns: z.array(z.string()).default([]),
});

// ── Control tree capture sub-schema ──────────────────────────────────
const controlTreeCaptureSchema = z.object({
  enabled: z.boolean().default(true),
  maxDepth: z.number().int().positive().default(10),
  maxControls: z.number().int().positive().default(5_000),
});

// ── OPA5 sub-schema (D7) ────────────────────────────────────────────
const opa5Schema = z.object({
  interactionTimeout: z.number().int().positive().default(5_000),
  autoWait: z.boolean().default(true),
  debug: z.boolean().default(false),
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
    interactionStrategy: interactionStrategyEnum.default('ui5-native'),
    discoveryStrategies: z
      .array(discoveryStrategyEnum)
      .min(1)
      .default(['direct-id', 'recordreplay']),
    skipStabilityWait: z.boolean().default(false),
    preferVisibleControls: z.boolean().default(true),
    ignoreAutoWaitUrls: z.array(z.string()).default([]),
    auth: authSchema.optional(),
    ai: aiSchema.optional(),
    telemetry: telemetrySchema.optional(),
    selectors: selectorsSchema.optional(),
    opa5: opa5Schema.optional(),
    odataTracing: odataTracingSchema.optional(),
    controlTreeCapture: controlTreeCaptureSchema.optional(),
    /** Default value for matchSubclasses on selectors that don't specify it. */
    defaultMatchSubclasses: z.boolean().default(false),
    /**
     * Whether to auto-capture diagnostic artifacts (screenshot, control tree, page context)
     * on test failure.
     *
     * @remarks
     * When `true` (default), the failure artifacts fixture automatically attaches
     * a screenshot (PNG), UI5 control tree snapshot (JSON), and page metadata (JSON)
     * to the test report on any test failure. Set to `false` to disable.
     */
    captureFailureArtifacts: z.boolean().default(true),
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
