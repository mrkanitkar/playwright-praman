/**
 * Branded types for SAP domain values.
 *
 * @remarks
 * Prevents accidental mixing of structurally identical strings
 * (control IDs, view names, binding paths) at the type level.
 * Each branded type carries a unique phantom `__brand` property
 * that only exists at compile time — zero runtime overhead.
 *
 * Use the factory functions to create branded values from raw strings.
 *
 * @example
 * ```typescript
 * import { controlId, viewName, bindingPath } from '#core/types/branded.js';
 *
 * const id = controlId('myButton');
 * const view = viewName('my.app.View1');
 * const path = bindingPath('/Products(1)/Name');
 * ```
 *
 * @module types
 */

// ── Brand symbol ──────────────────────────────────────────────────────────────

/** Unique symbol used as the phantom brand key. */
// eslint-disable-next-line @typescript-eslint/naming-convention -- __brand is a phantom symbol, not a regular variable
declare const __brand: unique symbol;

/** Generic branded type — `TBase` is the base type, `TBrand` is the brand tag. */
type Brand<TBase, TBrand extends string> = TBase & { readonly [__brand]: TBrand };

// ── Branded string types ──────────────────────────────────────────────────────

/**
 * A UI5 control ID.
 *
 * @example
 * ```typescript
 * import type { ControlId } from '#core/types/branded.js';
 *
 * function findControl(id: ControlId): void { }
 * ```
 */
export type ControlId = Brand<string, 'ControlId'>;

/**
 * A UI5 view name (fully qualified, e.g., `'my.app.View1'`).
 *
 * @example
 * ```typescript
 * import type { ViewName } from '#core/types/branded.js';
 *
 * function navigateToView(name: ViewName): void { }
 * ```
 */
export type ViewName = Brand<string, 'ViewName'>;

/**
 * An OData binding path (e.g., `'/Products(1)/Name'`).
 *
 * @example
 * ```typescript
 * import type { BindingPath } from '#core/types/branded.js';
 *
 * function readBinding(path: BindingPath): void { }
 * ```
 */
export type BindingPath = Brand<string, 'BindingPath'>;

/**
 * A semantic object for intent-based navigation (e.g., `'PurchaseOrder'`).
 *
 * @example
 * ```typescript
 * import type { SemanticObject } from '#core/types/branded.js';
 *
 * function navigate(obj: SemanticObject, action: string): void { }
 * ```
 */
export type SemanticObject = Brand<string, 'SemanticObject'>;

/**
 * An OData entity set name (e.g., `'Products'`, `'PurchaseOrders'`).
 *
 * @example
 * ```typescript
 * import type { EntitySetName } from '#core/types/branded.js';
 *
 * function queryEntity(entitySet: EntitySetName): void { }
 * ```
 */
export type EntitySetName = Brand<string, 'EntitySetName'>;

// ── Factory functions ─────────────────────────────────────────────────────────

/**
 * Create a branded {@link ControlId} from a raw string.
 *
 * @param id - Raw control ID string.
 * @returns Branded control ID.
 *
 * @example
 * ```typescript
 * import { controlId } from '#core/types/branded.js';
 *
 * const id = controlId('submitButton');
 * ```
 */
export function controlId(id: string): ControlId {
  return id as ControlId;
}

/**
 * Create a branded {@link ViewName} from a raw string.
 *
 * @param name - Raw view name string.
 * @returns Branded view name.
 *
 * @example
 * ```typescript
 * import { viewName } from '#core/types/branded.js';
 *
 * const view = viewName('my.app.Main');
 * ```
 */
export function viewName(name: string): ViewName {
  return name as ViewName;
}

/**
 * Create a branded {@link BindingPath} from a raw string.
 *
 * @param path - Raw binding path string.
 * @returns Branded binding path.
 *
 * @example
 * ```typescript
 * import { bindingPath } from '#core/types/branded.js';
 *
 * const path = bindingPath('/Products(1)/Name');
 * ```
 */
export function bindingPath(path: string): BindingPath {
  return path as BindingPath;
}

/**
 * Create a branded {@link SemanticObject} from a raw string.
 *
 * @param obj - Raw semantic object string.
 * @returns Branded semantic object.
 *
 * @example
 * ```typescript
 * import { semanticObject } from '#core/types/branded.js';
 *
 * const so = semanticObject('PurchaseOrder');
 * ```
 */
export function semanticObject(obj: string): SemanticObject {
  return obj as SemanticObject;
}

/**
 * Create a branded {@link EntitySetName} from a raw string.
 *
 * @param name - Raw entity set name string.
 * @returns Branded entity set name.
 *
 * @example
 * ```typescript
 * import { entitySetName } from '#core/types/branded.js';
 *
 * const es = entitySetName('Products');
 * ```
 */
export function entitySetName(name: string): EntitySetName {
  return name as EntitySetName;
}
