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
 * import { controlId, viewName, bindingPath, cssSelector, appId } from '#core/types/branded.js';
 *
 * const id = controlId('myButton');
 * const view = viewName('my.app.View1');
 * const path = bindingPath('/Products(1)/Name');
 * const css = cssSelector('.sapMBtn');
 * const app = appId('PurchaseOrder-manage');
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

/**
 * A CSS selector string (e.g., `'.sapMBtn'`, `'#myControl'`).
 *
 * @example
 * ```typescript
 * import type { CSSSelector } from '#core/types/branded.js';
 *
 * function findElement(selector: CSSSelector): void { }
 * ```
 */
export type CSSSelector = Brand<string, 'CSSSelector'>;

/**
 * An XPath expression string (e.g., `'//button[@id="submit"]'`).
 *
 * @example
 * ```typescript
 * import type { XPathSelector } from '#core/types/branded.js';
 *
 * function findByXPath(xpath: XPathSelector): void { }
 * ```
 */
export type XPathSelector = Brand<string, 'XPathSelector'>;

/**
 * An OData service URL (e.g., `'/sap/opu/odata/sap/API_PURCHASEORDER_PROCESS_SRV'`).
 *
 * @example
 * ```typescript
 * import type { ODataUrl } from '#core/types/branded.js';
 *
 * function connectToService(url: ODataUrl): void { }
 * ```
 */
export type ODataUrl = Brand<string, 'ODataUrl'>;

/**
 * A Fiori Launchpad application ID (e.g., `'PurchaseOrder-manage'`).
 *
 * @example
 * ```typescript
 * import type { AppId } from '#core/types/branded.js';
 *
 * function launchApp(id: AppId): void { }
 * ```
 */
export type AppId = Brand<string, 'AppId'>;

// ── Template literal types ───────────────────────────────────────────────────

/**
 * An OData resource path that must start with a forward slash.
 *
 * @remarks
 * Used for OData service paths like `'/Products'`, `'/PurchaseOrders(123)'`,
 * or `'/SalesOrderSet?$filter=Status eq "Open"'`.
 * The leading slash distinguishes absolute OData paths from relative property paths.
 *
 * @example
 * ```typescript
 * import type { ODataPath } from '#core/types/branded.js';
 *
 * const products: ODataPath = '/Products';
 * const order: ODataPath = '/PurchaseOrders(123)';
 * const filtered: ODataPath = '/SalesOrderSet?$filter=Status eq "Open"';
 * ```
 */
export type ODataPath = `/${string}`;

/**
 * A semantic object-action pair for SAP Fiori intent-based navigation.
 *
 * @remarks
 * Format: `'SemanticObject-action'` (e.g., `'PurchaseOrder-manage'`).
 * The hyphen separates the semantic object from the action.
 * Used by SAP Fiori Launchpad (FLP) for cross-app navigation.
 *
 * @example
 * ```typescript
 * import type { SemanticObjectAction } from '#core/types/branded.js';
 *
 * const manage: SemanticObjectAction = 'PurchaseOrder-manage';
 * const display: SemanticObjectAction = 'SalesOrder-display';
 * const create: SemanticObjectAction = 'Material-create';
 * ```
 */
export type SemanticObjectAction = `${string}-${string}`;

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

/**
 * Create a branded {@link CSSSelector} from a raw string.
 *
 * @param selector - Raw CSS selector string.
 * @returns Branded CSS selector.
 * @example
 * ```typescript
 * const btn = cssSelector('.sapMBtn');
 * ```
 */
export function cssSelector(selector: string): CSSSelector {
  return selector as CSSSelector;
}

/**
 * Create a branded {@link XPathSelector} from a raw string.
 *
 * @param xpath - Raw XPath expression string.
 * @returns Branded XPath selector.
 * @example
 * ```typescript
 * const btn = xpathSelector('//button[@id="submit"]');
 * ```
 */
export function xpathSelector(xpath: string): XPathSelector {
  return xpath as XPathSelector;
}

/**
 * Create a branded {@link ODataUrl} from a raw string.
 *
 * @param url - Raw OData service URL string.
 * @returns Branded OData URL.
 * @example
 * ```typescript
 * const svc = odataUrl('/sap/opu/odata/sap/API_PURCHASEORDER_PROCESS_SRV');
 * ```
 */
export function odataUrl(url: string): ODataUrl {
  return url as ODataUrl;
}

/**
 * Create a branded {@link AppId} from a raw string.
 *
 * @param id - Raw FLP application ID string.
 * @returns Branded FLP app ID.
 * @example
 * ```typescript
 * const app = appId('PurchaseOrder-manage');
 * ```
 */
export function appId(id: string): AppId {
  return id as AppId;
}
