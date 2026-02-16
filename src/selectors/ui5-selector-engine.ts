/**
 * Playwright selector engine for `ui5=...` selectors.
 *
 * @remarks
 * Phase 1 provides a DOM attribute-based fallback that queries elements
 * by `data-sap-ui` (ID) and `data-sap-ui-type` (control type) attributes.
 * This engine script is designed to be registered with Playwright's
 * `selectors.register()` in a later phase.
 *
 * The engine script is self-contained (no imports, no Node.js APIs)
 * because it runs inside the browser context.
 *
 * @module selectors
 */

/**
 * The shape of a UI5 selector engine script for Playwright registration.
 *
 * @remarks
 * Implements the Playwright custom selector engine interface with `query`
 * and `queryAll` methods that operate on DOM elements.
 *
 * @example
 * ```typescript
 * import type { UI5SelectorEngineScript } from './ui5-selector-engine.js';
 *
 * const engine: UI5SelectorEngineScript = createUI5SelectorEngineScript();
 * const el = engine.query(document.body, '#myButton');
 * ```
 */
export interface UI5SelectorEngineScript {
  /**
   * Finds the first matching element within the root for the given selector.
   *
   * @param root - The root element to search within
   * @param selector - The selector body (without `ui5=` prefix)
   * @returns The first matching element, or `null` if none found
   */
  query(root: HTMLElement, selector: string): HTMLElement | null;

  /**
   * Finds all matching elements within the root for the given selector.
   *
   * @param root - The root element to search within
   * @param selector - The selector body (without `ui5=` prefix)
   * @returns An array of all matching elements
   */
  queryAll(root: HTMLElement, selector: string): HTMLElement[];
}

/**
 * Builds a CSS attribute selector string from an ID and/or control type.
 *
 * @param id - The SAP UI5 control ID (matches `data-sap-ui` attribute)
 * @param controlType - The SAP UI5 control type (matches `data-sap-ui-type` attribute)
 * @returns A CSS attribute selector string
 */
function buildAttributeSelector(id: string | undefined, controlType: string | undefined): string {
  let cssSelector = '';

  if (id !== undefined) {
    cssSelector += `[data-sap-ui="${id}"]`;
  }

  if (controlType !== undefined) {
    cssSelector += `[data-sap-ui-type="${controlType}"]`;
  }

  return cssSelector;
}

/**
 * Parses a minimal selector string into ID and controlType components.
 *
 * @remarks
 * This is an inline lightweight parser for the browser context.
 * It does not depend on the full `parseUI5Selector` function.
 *
 * Supports:
 * - `#id` - ID-only selector
 * - `controlType` - Type-only selector
 * - `controlType#id` - Combined selector
 *
 * @param selector - The selector body (without `ui5=` prefix)
 * @returns An object with optional `id` and `controlType` fields
 */
function parseInlineSelector(selector: string): {
  id: string | undefined;
  controlType: string | undefined;
} {
  const hashIndex = selector.indexOf('#');

  if (hashIndex === 0) {
    // ID-only: "#myButton"
    return { id: selector.slice(1), controlType: undefined };
  }

  if (hashIndex > 0) {
    // Combined: "sap.m.Button#myButton"
    return {
      controlType: selector.slice(0, hashIndex),
      id: selector.slice(hashIndex + 1),
    };
  }

  // Type-only: "sap.m.Button"
  return { id: undefined, controlType: selector };
}

/**
 * Creates a UI5 selector engine script for Playwright registration.
 *
 * @remarks
 * Phase 1 implementation uses DOM attribute-based queries:
 * - `data-sap-ui` attribute for control ID matching
 * - `data-sap-ui-type` attribute for control type matching
 *
 * The returned object conforms to the Playwright custom selector engine
 * interface and can be passed to `selectors.register('ui5', engine)`.
 *
 * @returns A selector engine script with `query` and `queryAll` methods
 *
 * @example
 * ```typescript
 * import { createUI5SelectorEngineScript } from './ui5-selector-engine.js';
 *
 * const engine = createUI5SelectorEngineScript();
 * // Later: selectors.register('ui5', engine);
 * ```
 */
export function createUI5SelectorEngineScript(): UI5SelectorEngineScript {
  return {
    query(root: HTMLElement, selector: string): HTMLElement | null {
      const { id, controlType } = parseInlineSelector(selector);
      const cssSelector = buildAttributeSelector(id, controlType);

      /* v8 ignore start -- defensive guard: parseInlineSelector always returns a non-empty field */
      if (cssSelector.length === 0) {
        return null;
      }
      /* v8 ignore stop */

      return root.querySelector<HTMLElement>(cssSelector);
    },

    queryAll(root: HTMLElement, selector: string): HTMLElement[] {
      const { id, controlType } = parseInlineSelector(selector);
      const cssSelector = buildAttributeSelector(id, controlType);

      /* v8 ignore start -- defensive guard: parseInlineSelector always returns a non-empty field */
      if (cssSelector.length === 0) {
        return [];
      }
      /* v8 ignore stop */

      return [...root.querySelectorAll<HTMLElement>(cssSelector)];
    },
  };
}
