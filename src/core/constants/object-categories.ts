/**
 * UI5 object category detection for AI context classification.
 *
 * @remarks
 * Source: mk v2.5.0 object classification logic. Classifies non-control
 * UI5 objects into semantic categories so the AI layer can provide contextual
 * assistance. Categories include model, router, controller, binding, context,
 * event, formatter, validator, type, component, manifest, i18n, and unknown.
 *
 * Detection is based on type name pattern matching against well-known UI5
 * naming conventions. The order of checks matters -- more specific patterns
 * (e.g. `.model.type.` for `'type'` category) are checked before broader
 * patterns (e.g. `.model.` for `'model'` category).
 *
 * @example
 * ```typescript
 * import { detectObjectCategory } from '#core/constants/object-categories.js';
 * import type { UI5ObjectCategory } from '#core/constants/object-categories.js';
 *
 * const category: UI5ObjectCategory = detectObjectCategory('sap.ui.model.json.JSONModel');
 * // category === 'model'
 *
 * const binding = detectObjectCategory('sap.ui.model.odata.v4.ODataListBinding');
 * // binding === 'binding'
 * ```
 *
 * @module constants
 */

/**
 * Semantic categories for non-control UI5 objects.
 *
 * @remarks
 * Used by the AI layer to provide contextual assistance based on the kind
 * of UI5 object being inspected or interacted with.
 */
export type UI5ObjectCategory =
  | 'model'
  | 'router'
  | 'controller'
  | 'binding'
  | 'context'
  | 'event'
  | 'formatter'
  | 'validator'
  | 'type'
  | 'component'
  | 'manifest'
  | 'i18n'
  | 'unknown';

/**
 * Category detection rules in priority order.
 *
 * @remarks
 * Each rule has a `test` function that checks the type name and a `category`
 * to return on match. Rules are evaluated top-to-bottom; the first match wins.
 * More specific patterns must come before broader ones.
 */
const CATEGORY_RULES: readonly {
  readonly test: (typeName: string) => boolean;
  readonly category: UI5ObjectCategory;
}[] = [
  // Binding must precede model -- "sap.ui.model.ListBinding" is a binding, not a model
  { test: (t) => t.endsWith('Binding') || t.includes('.model.Binding'), category: 'binding' },
  // Context must precede model -- "sap.ui.model.Context" and "sap.ui.model.odata.v4.Context"
  { test: (t) => t.includes('.model.') && t.endsWith('Context'), category: 'context' },
  // Type must precede model -- "sap.ui.model.type.String" is a type
  { test: (t) => t.includes('.model.type.'), category: 'type' },
  // Router
  { test: (t) => t.includes('.routing.Router'), category: 'router' },
  // Controller
  { test: (t) => t.endsWith('Controller'), category: 'controller' },
  // Event
  { test: (t) => t.includes('.base.Event'), category: 'event' },
  // Formatter
  { test: (t) => t.endsWith('Formatter'), category: 'formatter' },
  // Validator
  { test: (t) => t.endsWith('Validator'), category: 'validator' },
  // Component (check UIComponent and .core.Component / suffix Component)
  { test: (t) => t.includes('UIComponent') || t.endsWith('Component'), category: 'component' },
  // Manifest
  { test: (t) => t.includes('Manifest'), category: 'manifest' },
  // i18n / ResourceBundle
  { test: (t) => t.includes('ResourceBundle') || t.includes('i18n'), category: 'i18n' },
  // Model (broadest -- must come after binding, context, type)
  { test: (t) => t.includes('.model.'), category: 'model' },
];

/**
 * Detects the semantic category of a UI5 object based on its type name.
 *
 * @param typeName - Fully qualified UI5 type name (e.g. `'sap.ui.model.json.JSONModel'`)
 * @returns The detected {@link UI5ObjectCategory}, or `'unknown'` if no pattern matches
 *
 * @example
 * ```typescript
 * import { detectObjectCategory } from '#core/constants/object-categories.js';
 *
 * detectObjectCategory('sap.ui.model.json.JSONModel');           // 'model'
 * detectObjectCategory('sap.ui.core.routing.Router');            // 'router'
 * detectObjectCategory('my.app.controller.MainController');      // 'controller'
 * detectObjectCategory('sap.ui.model.odata.v4.ODataListBinding'); // 'binding'
 * detectObjectCategory('sap.m.ObjectStatus');                    // 'unknown'
 * ```
 */
export function detectObjectCategory(typeName: string): UI5ObjectCategory {
  for (const rule of CATEGORY_RULES) {
    if (rule.test(typeName)) {
      return rule.category;
    }
  }
  return 'unknown';
}
