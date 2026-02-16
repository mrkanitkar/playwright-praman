/**
 * Literal union types for configuration fields.
 *
 * @remarks
 * These types are imported by `core/config/schema.ts` to build the Zod schema.
 * Consumers import them from here for type annotations.
 *
 * DO NOT re-export PramanConfig from this file — that creates a circular dependency.
 * PramanConfig is exported from `core/config/schema.js`, NOT re-exported here.
 *
 * Flow:
 * - `config.ts` (this file) defines literal unions (LogLevel, AuthStrategy, etc.)
 * - `schema.ts` imports literal values from HERE and defines PramanConfigSchema
 * - `schema.ts` exports `PramanConfig = z.output of PramanConfigSchema`
 * - Consumers import PramanConfig from `#core/config/schema.js` or `#core/config/index.js`
 *
 * @module types
 */

/**
 * Log level options for pino logger.
 *
 * @example
 * ```typescript
 * import type { LogLevel } from '#core/types/config.js';
 * const level: LogLevel = 'info';
 * ```
 */
export type LogLevel = 'error' | 'warn' | 'info' | 'debug' | 'verbose';

/**
 * Control interaction strategy variants.
 *
 * @remarks
 * - `playwright` — Pure Playwright web-first actions
 * - `dom-first` — Direct DOM manipulation (legacy compatibility)
 * - `opa5` — SAP OPA5 framework (test automation)
 * - `hybrid` — Adaptive strategy (recommended default)
 *
 * @example
 * ```typescript
 * import type { InteractionStrategy } from '#core/types/config.js';
 * const strategy: InteractionStrategy = 'hybrid';
 * ```
 */
export type InteractionStrategy = 'playwright' | 'dom-first' | 'opa5' | 'hybrid';

/**
 * Authentication strategy variants for SAP system login.
 *
 * @remarks
 * - `btp-saml` — SAP BTP with SAML IdP
 * - `basic` — HTTP basic auth (development only)
 * - `office365` — Microsoft Office 365 SSO
 * - `custom` — User-provided auth handler
 *
 * @example
 * ```typescript
 * import type { AuthStrategy } from '#core/types/config.js';
 * const auth: AuthStrategy = 'btp-saml';
 * ```
 */
export type AuthStrategy = 'btp-saml' | 'basic' | 'office365' | 'custom';

/**
 * Supported AI providers for LLM-powered test generation.
 *
 * @example
 * ```typescript
 * import type { AIProvider } from '#core/types/config.js';
 * const provider: AIProvider = 'azure-openai';
 * ```
 */
export type AIProvider = 'azure-openai' | 'openai';

/**
 * Telemetry exporter backends for OpenTelemetry.
 *
 * @example
 * ```typescript
 * import type { TelemetryExporter } from '#core/types/config.js';
 * const exporter: TelemetryExporter = 'otlp';
 * ```
 */
export type TelemetryExporter = 'otlp' | 'azure-monitor' | 'jaeger';
