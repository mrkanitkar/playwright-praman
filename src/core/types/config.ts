/**
 * Literal union types for configuration fields.
 *
 * @remarks
 * These types define standalone config value unions (LogLevel, AuthStrategy, etc.).
 *
 * Strategy types (`InteractionStrategyName`, `DiscoveryStrategyName`) are derived
 * from Zod (D11) and live in `config/schema.ts` — re-exported via `types/index.ts`.
 *
 * DO NOT re-export PramanConfig from this file — that creates a circular dependency.
 * PramanConfig is exported from `core/config/schema.js`, NOT re-exported here.
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
export type AIProvider = 'azure-openai' | 'openai' | 'anthropic';

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
