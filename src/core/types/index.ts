/**
 * Core type definitions barrel — re-exports for `#core/types`.
 *
 * @module types
 */

// ── Literal union types (config.ts) ─────────────────────────────────
export type { AIProvider, AuthStrategy, LogLevel, TelemetryExporter } from './config.js';

// ── Strategy types derived from Zod (D11) — config/schema.ts ────────
export type { DiscoveryStrategyName, InteractionStrategyName } from '../config/schema.js';

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

// ── Branded types (branded.ts) ────────────────────────────────────
export type { BindingPath, ControlId, EntitySetName, SemanticObject, ViewName } from './branded.js';
export { bindingPath, controlId, entitySetName, semanticObject, viewName } from './branded.js';

// ── Template literal types ──────────────────────────────────────────

/**
 * OData entity set path format: `/EntitySetName` or `/EntitySetName(key)`.
 *
 * @remarks
 * Enforces that OData model paths always start with a leading `/`.
 * Used by OData module functions that read data from the UI5 model layer.
 *
 * @example
 * ```typescript
 * import type { ODataEntityPath } from '#core/types/index.js';
 *
 * const path: ODataEntityPath = '/Products(1)/Name';
 * const set: ODataEntityPath = '/SalesOrders';
 * ```
 */
export type ODataEntityPath = `/${string}`;

/**
 * OData binding path format used in UI5 models.
 *
 * @remarks
 * Covers both absolute paths (`/EntitySet/Property`) and
 * binding expression syntax (`{modelName>/path}`).
 *
 * @example
 * ```typescript
 * import type { ODataBindingPath } from '#core/types/index.js';
 *
 * const absolute: ODataBindingPath = '/Products(1)/Name';
 * const expression: ODataBindingPath = '{myModel>/Products}';
 * ```
 */
export type ODataBindingPath = `/${string}` | `{${string}}`;

/**
 * SAP semantic object action format: `SemanticObject-action`.
 *
 * @remarks
 * Represents the FLP intent hash used for intent-based navigation,
 * e.g. `'PurchaseOrder-manage'` or `'SalesOrder-create'`.
 * The hyphen separates the semantic object from the action.
 *
 * @example
 * ```typescript
 * import type { IntentString } from '#core/types/index.js';
 *
 * const intent: IntentString = 'PurchaseOrder-manage';
 * const home: IntentString = 'Shell-home';
 * ```
 */
export type IntentString = `${string}-${string}`;

/**
 * UI5 fully-qualified control type name, e.g. `sap.m.Button`.
 *
 * @remarks
 * All UI5 control types start with the `sap.` namespace prefix.
 * Used in selectors and control discovery to specify the target control class.
 *
 * @example
 * ```typescript
 * import type { UI5ControlTypeName } from '#core/types/index.js';
 *
 * const button: UI5ControlTypeName = 'sap.m.Button';
 * const input: UI5ControlTypeName = 'sap.m.Input';
 * const smartField: UI5ControlTypeName = 'sap.ui.comp.smartfield.SmartField';
 * ```
 */
export type UI5ControlTypeName = `sap.${string}`;

// ── Control types (controls.ts) — auto-generated, 170+ interfaces ───
// Wildcard re-export: all control interfaces, union types, and maps.
// New controls are picked up automatically when controls.ts is regenerated.
export type * from './controls.js';
