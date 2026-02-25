/**
 * @license
 * Copyright (c) ZesTest 2025-2030. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0
 *
 * This file may contain AI-assisted code.
 * See LICENSE and NOTICE files for details.
 */

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
