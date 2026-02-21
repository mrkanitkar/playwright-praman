/**
 * Playwright selector engine for `ui5=...` selectors.
 *
 * @remarks
 * Phase 1 provides a DOM attribute-based fallback that queries elements
 * by `data-sap-ui` (ID) and `data-sap-ui-type` (control type) attributes.
 * Registered with Playwright's `selectors.register('ui5', createUI5SelectorEngineScript)`
 * in the `selectorRegistration` worker-scoped fixture.
 *
 * The engine factory is self-contained (no imports, no Node.js APIs, no
 * module-level closures) because Playwright serializes it via `.toString()`
 * and evaluates it inside the browser context.
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
 * Creates a UI5 selector engine factory for Playwright registration.
 *
 * @remarks
 * Phase 1 implementation uses DOM attribute-based queries:
 * - `data-sap-ui` attribute for control ID matching
 * - `data-sap-ui-type` attribute for control type matching
 *
 * All helper functions are **inlined inside this factory** because Playwright
 * serializes the function via `.toString()` and evaluates it in browser context.
 * Module-level closures are NOT available after serialization.
 *
 * Pass this factory directly to `selectors.register('ui5', createUI5SelectorEngineScript)`.
 *
 * @returns A selector engine with `query` and `queryAll` methods
 *
 * @example
 * ```typescript
 * import { createUI5SelectorEngineScript } from './ui5-selector-engine.js';
 *
 * // In a worker-scoped fixture:
 * await playwright.selectors.register('ui5', createUI5SelectorEngineScript);
 * ```
 */
export function createUI5SelectorEngineScript(): UI5SelectorEngineScript {
  // ── Inlined helpers (must live inside factory for browser serialization) ──

  function parseInlineSelector(selector: string): {
    id: string | undefined;
    controlType: string | undefined;
  } {
    const hashIndex = selector.indexOf('#');
    if (hashIndex === 0) {
      return { id: selector.slice(1), controlType: undefined };
    }
    if (hashIndex > 0) {
      return {
        controlType: selector.slice(0, hashIndex),
        id: selector.slice(hashIndex + 1),
      };
    }
    return { id: undefined, controlType: selector };
  }

  function buildAttributeSelector(id: string | undefined, controlType: string | undefined): string {
    let css = '';
    if (id !== undefined) {
      css += `[data-sap-ui="${id}"]`;
    }
    if (controlType !== undefined) {
      css += `[data-sap-ui-type="${controlType}"]`;
    }
    return css;
  }

  // ── Engine methods ────────────────────────────────────────────────────────

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
