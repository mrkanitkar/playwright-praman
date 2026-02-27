/**
 * @license
 * Copyright (c) ZesTest 2025-2030. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0
 *
 * This file may contain AI-assisted code.
 * See LICENSE and NOTICE files for details.
 */

/**
 * Canonical UI5 selector types for control discovery.
 *
 * @remarks
 * {@link UI5Selector} is the ONE type used everywhere for selector representation.
 * {@link SerializedUI5Selector} is the wire format for `page.evaluate()` transport
 * (RegExp is NOT JSON-serializable — serialized as `{ source, flags }`).
 *
 * @module types
 */

/**
 * UI5 control selector — the primary type for control discovery.
 *
 * @remarks
 * All selector fields are optional; at least one must be provided for a valid query.
 * The `ancestor` and `descendant` fields are recursive for hierarchical matching.
 *
 * When `searchOpenDialogs` is `true`, the selector engine also searches controls
 * rendered inside the UI5 static area (sap.ui.core.UIArea for open dialogs,
 * popovers, and message boxes). This is essential for interacting with dialog
 * controls, which exist outside the main view DOM hierarchy.
 *
 * @example Basic selector
 * ```typescript
 * import type { UI5Selector } from '#core/types/selectors.js';
 *
 * const selector: UI5Selector = {
 *   controlType: 'sap.m.Button',
 *   properties: { text: 'Save' },
 * };
 * ```
 *
 * @example Searching inside open dialogs
 * ```typescript
 * import type { UI5Selector } from '#core/types/selectors.js';
 *
 * // Find a button inside an open confirmation dialog
 * const dialogButton: UI5Selector = {
 *   controlType: 'sap.m.Button',
 *   properties: { text: 'OK' },
 *   searchOpenDialogs: true,
 * };
 *
 * // Find an input field inside a value help dialog
 * const valueHelpInput: UI5Selector = {
 *   controlType: 'sap.m.Input',
 *   searchOpenDialogs: true,
 *   ancestor: {
 *     controlType: 'sap.ui.comp.valuehelpdialog.ValueHelpDialog',
 *   },
 * };
 * ```
 */
export interface UI5Selector {
  /** UI5 fully qualified control type, e.g., `'sap.m.Button'`. */
  readonly controlType?: string;
  /** Control ID or RegExp pattern for ID matching. */
  readonly id?: string | RegExp;
  /** Owning view name for scoped discovery. */
  readonly viewName?: string;
  /** Owning view ID for scoped discovery. */
  readonly viewId?: string;
  /** Key-value property matchers evaluated against `control.getProperty()`. */
  readonly properties?: Readonly<Record<string, unknown>>;
  /** OData binding path matchers for data-bound controls. */
  readonly bindingPath?: Readonly<Record<string, string>>;
  /** i18n text matchers (property name to expected translated value). */
  readonly i18NText?: Readonly<Record<string, string>>;
  /** Recursive ancestor selector — control must be inside a matching ancestor. */
  readonly ancestor?: UI5Selector;
  /** Recursive descendant selector — control must contain a matching descendant. */
  readonly descendant?: UI5Selector;
  /** Sub-control interaction target (idSuffix, domChildWith). */
  readonly interaction?: UI5Interaction;
  /** When true, also searches controls inside open dialogs/popovers. */
  readonly searchOpenDialogs?: boolean;
}

/**
 * Serializable selector for transport to browser context via `page.evaluate()`.
 *
 * @remarks
 * RegExp is NOT JSON-serializable — serialized as `{ source, flags }` object.
 * Used by the selector engine's browser-side `query()` method.
 *
 * @example
 * ```typescript
 * import type { SerializedUI5Selector } from '#core/types/selectors.js';
 *
 * const serialized: SerializedUI5Selector = {
 *   controlType: 'sap.m.Button',
 *   id: { source: '^submit', flags: 'i' },
 * };
 * ```
 */
export interface SerializedUI5Selector {
  readonly controlType?: string;
  readonly id?: string | { readonly source: string; readonly flags: string };
  readonly viewName?: string;
  readonly viewId?: string;
  readonly properties?: Readonly<Record<string, unknown>>;
  readonly searchOpenDialogs?: boolean;
}

/**
 * Sub-control interaction target within a composite UI5 control.
 *
 * @remarks
 * Used to target inner DOM elements of a UI5 control (e.g., the arrow button
 * inside a ComboBox, or a specific column header in a Table).
 *
 * @example
 * ```typescript
 * import type { UI5Interaction } from '#core/types/selectors.js';
 *
 * const interaction: UI5Interaction = { idSuffix: 'arrow' };
 * ```
 */
export interface UI5Interaction {
  /** ID suffix appended to the control ID to target a sub-element. */
  readonly idSuffix?: string;
  /** CSS-like attribute selector for a DOM child of the control. */
  readonly domChildWith?: Readonly<Record<string, string>>;
}

/**
 * Template literal type for UI5 selector strings.
 *
 * @remarks
 * Format: `"ui5=controlType:sap.m.Button#id[prop=val]"`.
 * Parsed by `selector-parser.ts` into a {@link UI5Selector} object.
 *
 * @example
 * ```typescript
 * import type { UI5SelectorString } from '#core/types/selectors.js';
 *
 * const str: UI5SelectorString = 'ui5=sap.m.Button#submitBtn[text=Save]';
 * ```
 */
export type UI5SelectorString = `ui5=${string}`;

/**
 * Serializes a {@link UI5Selector} for transport to the browser via `page.evaluate()`.
 *
 * @remarks
 * Converts RegExp id fields to `{ source, flags }` objects since RegExp
 * is not JSON-serializable across the Playwright browser boundary.
 *
 * @param selector - The UI5 selector to serialize
 * @returns A browser-safe serialized selector
 *
 * @example
 * ```typescript
 * import { serializeSelectorForBrowser } from '#core/types/selectors.js';
 *
 * const serialized = serializeSelectorForBrowser({
 *   controlType: 'sap.m.Button',
 *   id: /^submit/i,
 * });
 * // { controlType: 'sap.m.Button', id: { source: '^submit', flags: 'i' } }
 * ```
 */
export function serializeSelectorForBrowser(selector: UI5Selector): SerializedUI5Selector {
  const serializedId =
    selector.id instanceof RegExp
      ? { source: selector.id.source, flags: selector.id.flags }
      : selector.id;

  return {
    ...(selector.controlType !== undefined && { controlType: selector.controlType }),
    ...(serializedId !== undefined && { id: serializedId }),
    ...(selector.viewName !== undefined && { viewName: selector.viewName }),
    ...(selector.viewId !== undefined && { viewId: selector.viewId }),
    ...(selector.properties !== undefined && { properties: selector.properties }),
    ...(selector.searchOpenDialogs !== undefined && {
      searchOpenDialogs: selector.searchOpenDialogs,
    }),
  };
}

/**
 * Deserializes a RegExp id field from the serialized `{ source, flags }` format.
 *
 * @param id - A string or serialized RegExp object
 * @returns The original string or a reconstructed RegExp
 *
 * @example
 * ```typescript
 * import { deserializeRegExpId } from '#core/types/selectors.js';
 *
 * const re = deserializeRegExpId({ source: '^submit', flags: 'i' });
 * // /^submit/i
 * ```
 */
export function deserializeRegExpId(
  id: string | { readonly source: string; readonly flags: string },
): string | RegExp {
  if (typeof id === 'string') {
    return id;
  }
  // eslint-disable-next-line security/detect-non-literal-regexp -- Reconstructing from serialized source/flags
  return new RegExp(id.source, id.flags);
}
