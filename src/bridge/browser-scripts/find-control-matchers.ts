/**
 * Browser-side selector matching helpers for UI5 control discovery (GAP-02).
 *
 * @remarks
 * These functions run in the browser context via `page.evaluate()`.
 * They provide property, viewName, bindingPath, and RegExp ID matching
 * for the Tier 2 registry scan in `find-control-fn.ts`.
 *
 * Type assertions (`as string`, `as Record<string, unknown>`) throughout this file
 * narrow untyped values from UI5 selector records and `.call()` on dynamically-resolved
 * browser-side methods. These casts are safe: selector keys are constrained by the
 * UI5Selector type, and method names are known UI5 API contracts.
 *
 * @module bridge/browser-scripts
 */

/** Typed accessor for UI5 objects in the browser. */
type UI5Record = Record<string, unknown>;

/**
 * Resolves a method from a record if it exists as a function.
 *
 * @param obj - The object to inspect.
 * @param name - The method name to look up.
 * @returns The method function, or `undefined` if not found.
 *
 * @example
 * ```typescript
 * const fn = getMethodFn(ctrl, 'getText');
 * if (fn) { const text = fn.call(ctrl); }
 * ```
 */
export function getMethodFn(
  obj: UI5Record,
  name: string,
): ((...a: unknown[]) => unknown) | undefined {
  // eslint-disable-next-line security/detect-object-injection -- name is from trusted params
  const val = obj[name];
  return typeof val === 'function' ? (val as (...a: unknown[]) => unknown) : undefined;
}

/**
 * Checks if a control has a matching type name.
 *
 * @param ctrl - The UI5 control record.
 * @param expectedType - The expected fully qualified type name.
 * @returns True if the control's metadata name matches.
 *
 * @example
 * ```typescript
 * if (hasMatchingType(ctrl, 'sap.m.Button')) { ... }
 * ```
 */
export function hasMatchingType(ctrl: UI5Record, expectedType: string): boolean {
  const getMetaFn = getMethodFn(ctrl, 'getMetadata');
  if (getMetaFn === undefined) return false;
  const meta = getMetaFn.call(ctrl) as UI5Record | null;
  if (meta === null) return false;
  const getNameFn = getMethodFn(meta, 'getName');
  return getNameFn !== undefined ? (getNameFn.call(meta) as string) === expectedType : false;
}

/**
 * Checks whether a control's ID matches a RegExp pattern string like `/pattern/`.
 *
 * @param ctrlId - The control's actual ID.
 * @param patternStr - The pattern string in `/pattern/` format.
 * @returns True if the ID matches the pattern.
 *
 * @example
 * ```typescript
 * isRegExpIdMatch('page--submitButton', '/submit/'); // true
 * ```
 */
export function isRegExpIdMatch(ctrlId: string, patternStr: string): boolean {
  const inner = patternStr.slice(1, -1);
  // eslint-disable-next-line security/detect-non-literal-regexp -- Reconstructing from serialized user-provided pattern
  const pattern = new RegExp(inner);
  return pattern.test(ctrlId);
}

/**
 * Checks whether a control matches all specified property matchers.
 *
 * @param ctrl - The UI5 control record.
 * @param properties - Map of property names to expected values.
 * @returns True if all properties match.
 *
 * @example
 * ```typescript
 * matchesProperties(ctrl, { text: 'Save', enabled: true });
 * ```
 */
export function matchesProperties(ctrl: UI5Record, properties: Record<string, unknown>): boolean {
  for (const propName of Object.keys(properties)) {
    const getterName = 'get' + propName.charAt(0).toUpperCase() + propName.slice(1);
    const getterFn = getMethodFn(ctrl, getterName);
    if (getterFn === undefined) return false;
    const actualValue: unknown = getterFn.call(ctrl);
    // eslint-disable-next-line security/detect-object-injection -- iterating known keys from Object.keys
    if (actualValue !== properties[propName]) return false;
  }
  return true;
}

/**
 * Checks whether a control is inside a view with the given name.
 *
 * @remarks
 * Traverses the parent chain checking each ancestor's metadata name.
 *
 * @param ctrl - The UI5 control record.
 * @param viewName - The expected view type name.
 * @returns True if an ancestor with the matching name is found.
 *
 * @example
 * ```typescript
 * isInView(ctrl, 'sap.ui.core.mvc.View');
 * ```
 */
export function isInView(ctrl: UI5Record, viewName: string): boolean {
  let current: UI5Record | null = ctrl;
  while (current !== null) {
    const getMetaFn = getMethodFn(current, 'getMetadata');
    if (getMetaFn !== undefined) {
      const meta = getMetaFn.call(current) as UI5Record | null;
      if (meta !== null) {
        const getNameFn = getMethodFn(meta, 'getName');
        if (getNameFn !== undefined && (getNameFn.call(meta) as string) === viewName) {
          return true;
        }
      }
    }
    const getParentFn = getMethodFn(current, 'getParent');
    current = getParentFn !== undefined ? (getParentFn.call(current) as UI5Record | null) : null;
  }
  return false;
}

/**
 * Checks whether a control's binding path matches the expected path.
 *
 * @remarks
 * Tries `'value'` binding first, then `'text'` binding.
 *
 * @param ctrl - The UI5 control record.
 * @param bindingPath - Object with a `path` property to match against.
 * @returns True if the binding path matches.
 *
 * @example
 * ```typescript
 * matchesBindingPath(ctrl, { path: '/Products/Name' });
 * ```
 */
export function matchesBindingPath(ctrl: UI5Record, bindingPath: Record<string, unknown>): boolean {
  const expectedPath = bindingPath['path'] as string | undefined;
  if (expectedPath === undefined) return false;
  const getBindingFn = getMethodFn(ctrl, 'getBinding');
  if (getBindingFn === undefined) return false;
  // Try 'value' binding first, then 'text'
  // Runtime UI5 controls may return null or undefined for absent bindings
  let binding: UI5Record | null = getBindingFn.call(ctrl, 'value') as UI5Record | null;
  binding ??= getBindingFn.call(ctrl, 'text') as UI5Record | null;
  if (binding === null) return false;
  const getPathFn = getMethodFn(binding, 'getPath');
  if (getPathFn === undefined) return false;
  const actualPath = getPathFn.call(binding) as string;
  return actualPath === expectedPath;
}

/**
 * Checks whether a control matches the full selector criteria.
 *
 * @remarks
 * Evaluates controlType, properties, viewName, and bindingPath in order.
 * Returns false on the first mismatch for short-circuit efficiency.
 *
 * @param ctrl - The UI5 control record.
 * @param selector - The selector with optional matching criteria.
 * @returns True if all specified criteria match.
 *
 * @example
 * ```typescript
 * matchesSelector(ctrl, { controlType: 'sap.m.Button', properties: { text: 'Save' } });
 * ```
 */
export function matchesSelector(ctrl: UI5Record, selector: UI5Record): boolean {
  const expectedType = selector['controlType'] as string | undefined;
  if (expectedType !== undefined && !hasMatchingType(ctrl, expectedType)) return false;

  const properties = selector['properties'] as Record<string, unknown> | undefined;
  if (properties !== undefined && !matchesProperties(ctrl, properties)) return false;

  const viewName = selector['viewName'] as string | undefined;
  if (viewName !== undefined && !isInView(ctrl, viewName)) return false;

  const bindingPath = selector['bindingPath'] as Record<string, unknown> | undefined;
  if (bindingPath !== undefined && !matchesBindingPath(ctrl, bindingPath)) return false;

  return true;
}
