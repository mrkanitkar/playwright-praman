/**
 * Core type definitions barrel — re-exports for `#core/types`.
 *
 * @module types
 */

// ── Literal union types (config.ts) ─────────────────────────────────
export type {
  AIProvider,
  AuthStrategy,
  InteractionStrategy,
  LogLevel,
  TelemetryExporter,
} from './config.js';

// NOTE: PramanConfig is NOT re-exported from here.
// It lives in core/config/schema.ts to avoid circular dependency.
// Import it from '#core/config/schema.js' or '#core/config/index.js'.

// ── Selector types (selectors.ts) ───────────────────────────────────
export type {
  SerializedUI5Selector,
  UI5Interaction,
  UI5Selector,
  UI5SelectorString,
} from './selectors.js';
export { deserializeRegExpId, serializeSelectorForBrowser } from './selectors.js';

// ── Bridge types (bridge.ts) ────────────────────────────────────────
export type { BridgeMethodDescriptor, BridgeResult, BridgeReturnType } from './bridge.js';

// ── Validation types (validation.ts) ────────────────────────────────
export type { ValidationIssue } from './validation.js';

// ── Control types (controls.ts) — auto-generated, 170+ interfaces ───
// Wildcard re-export: all control interfaces, union types, and maps.
// New controls are picked up automatically when controls.ts is regenerated.
export type * from './controls.js';
