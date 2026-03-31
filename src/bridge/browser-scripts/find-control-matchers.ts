/**
 * @license
 * Copyright (c) ZesTest 2025-2030. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0
 *
 * This file may contain AI-assisted code.
 * See LICENSE and NOTICE files for details.
 */

/**
 * Browser-side selector matching helpers for UI5 control discovery (GAP-02).
 *
 * @remarks
 * These functions run in the browser context via `page.evaluate()`.
 * They provide property, viewName, bindingPath, RegExp ID, ancestor, descendant,
 * i18N text, subclass, and property operator matching for the Tier 2 registry
 * scan in `find-control-fn.ts`.
 *
 * Type assertions (`as string`, `as Record<string, unknown>`) throughout this file
 * narrow untyped values from UI5 selector records and `.call()` on dynamically-resolved
 * browser-side methods. These casts are safe: selector keys are constrained by the
 * UI5Selector type, and method names are known UI5 API contracts.
 *
 * **LOC exception**: This file exceeds 300 LOC (~440 lines) because `matchesSelector`,
 * `matchesAncestor`, and `matchesDescendant` form a mutually recursive call graph
 * that cannot be split across files without creating circular imports.
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
 * Shape for property matchers with comparison operators.
 *
 * @remarks
 * When a property value in the selector is an object with `value` and `operator`,
 * operator-based matching is used instead of strict equality.
 *
 * @example
 * ```typescript
 * const matcher: PropertyMatcherShape = { value: 'Save', operator: 'contains' };
 * ```
 */
interface PropertyMatcherShape {
  readonly value: string;
  readonly operator: 'contains' | 'startsWith' | 'endsWith' | 'regex';
}

/**
 * Checks if a value is a {@link PropertyMatcherShape} object.
 *
 * @param val - The value to inspect.
 * @returns True if the value has `value` and `operator` fields.
 *
 * @example
 * ```typescript
 * isPropertyMatcher({ value: 'Save', operator: 'contains' }); // true
 * isPropertyMatcher('Save'); // false
 * ```
 */
function isPropertyMatcher(val: unknown): val is PropertyMatcherShape {
  if (typeof val !== 'object' || val === null) return false;
  const rec = val as Record<string, unknown>;
  return typeof rec['value'] === 'string' && typeof rec['operator'] === 'string';
}

/**
 * Matches a single property value using operator-based comparison.
 *
 * @param actual - The actual property value from the control.
 * @param matcher - The property matcher with operator and expected value.
 * @returns True if the actual value satisfies the operator condition.
 *
 * @example
 * ```typescript
 * matchesPropertyOperator('Save Draft', { value: 'Save', operator: 'startsWith' }); // true
 * ```
 */
function matchesPropertyOperator(actual: unknown, matcher: PropertyMatcherShape): boolean {
  const actualStr = String(actual);
  switch (matcher.operator) {
    case 'contains':
      return actualStr.includes(matcher.value);
    case 'startsWith':
      return actualStr.startsWith(matcher.value);
    case 'endsWith':
      return actualStr.endsWith(matcher.value);
    case 'regex': {
      // eslint-disable-next-line security/detect-non-literal-regexp -- Pattern from user-provided selector
      const re = new RegExp(matcher.value);
      return re.test(actualStr);
    }
    default:
      return false;
  }
}

/**
 * Checks whether a control matches all specified property matchers.
 *
 * @remarks
 * Supports both strict equality and operator-based matching.
 * When a property value is a {@link PropertyMatcherShape} object (has `value` and `operator`),
 * operator-based comparison is used. Otherwise, strict `===` equality applies.
 *
 * @param ctrl - The UI5 control record.
 * @param properties - Map of property names to expected values or property matchers.
 * @returns True if all properties match.
 *
 * @example
 * ```typescript
 * // Strict equality
 * matchesProperties(ctrl, { text: 'Save', enabled: true });
 *
 * // Operator-based matching
 * matchesProperties(ctrl, { text: { value: 'Sav', operator: 'startsWith' } });
 * ```
 */
export function matchesProperties(ctrl: UI5Record, properties: Record<string, unknown>): boolean {
  for (const propName of Object.keys(properties)) {
    const getterName = 'get' + propName.charAt(0).toUpperCase() + propName.slice(1);
    const getterFn = getMethodFn(ctrl, getterName);
    if (getterFn === undefined) return false;
    const actualValue: unknown = getterFn.call(ctrl);
    // eslint-disable-next-line security/detect-object-injection -- iterating known keys from Object.keys
    const expected: unknown = properties[propName];
    if (isPropertyMatcher(expected)) {
      if (!matchesPropertyOperator(actualValue, expected)) return false;
    } else {
      if (actualValue !== expected) return false;
    }
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
 * Checks whether a control has an ancestor matching the given selector.
 *
 * @remarks
 * Walks up the `getParent()` chain and recursively calls {@link matchesSelector}
 * on each ancestor. Returns true if any ancestor matches.
 *
 * @param ctrl - The UI5 control record.
 * @param ancestorSelector - The selector to match against ancestor controls.
 * @returns True if any ancestor matches the selector.
 *
 * @example
 * ```typescript
 * matchesAncestor(ctrl, { controlType: 'sap.m.Dialog' });
 * ```
 */
export function matchesAncestor(ctrl: UI5Record, ancestorSelector: UI5Record): boolean {
  let current: UI5Record | null = ctrl;
  const getParentFn = getMethodFn(current, 'getParent');
  current = getParentFn !== undefined ? (getParentFn.call(current) as UI5Record | null) : null;
  while (current !== null) {
    if (matchesSelector(current, ancestorSelector)) return true;
    const parentFn = getMethodFn(current, 'getParent');
    current = parentFn !== undefined ? (parentFn.call(current) as UI5Record | null) : null;
  }
  return false;
}

/**
 * Checks whether a control has a descendant matching the given selector.
 *
 * @remarks
 * Uses `findAggregatedObjects(true)` to get all nested child controls,
 * then recursively calls {@link matchesSelector} on each.
 *
 * @param ctrl - The UI5 control record.
 * @param descendantSelector - The selector to match against descendant controls.
 * @returns True if any descendant matches the selector.
 *
 * @example
 * ```typescript
 * matchesDescendant(ctrl, { controlType: 'sap.m.Text', properties: { text: 'Hello' } });
 * ```
 */
export function matchesDescendant(ctrl: UI5Record, descendantSelector: UI5Record): boolean {
  const findAggFn = getMethodFn(ctrl, 'findAggregatedObjects');
  if (findAggFn === undefined) return false;
  const children = findAggFn.call(ctrl, true) as UI5Record[];
  for (const child of children) {
    if (matchesSelector(child, descendantSelector)) return true;
  }
  return false;
}

/**
 * Checks whether a control's property matches an i18n text resource key.
 *
 * @remarks
 * Resolves the i18n resource bundle via `control.getModel("i18n").getResourceBundle()`,
 * then compares `bundle.getText(key)` against the control's property value.
 * The `i18NText` map is `{ propertyName: i18nKey }`.
 *
 * @param ctrl - The UI5 control record.
 * @param i18NText - Map of property names to i18n resource keys.
 * @returns True if all i18n text properties match.
 *
 * @example
 * ```typescript
 * matchesI18NText(ctrl, { text: 'SAVE_BUTTON' }); // checks ctrl.getText() === bundle.getText('SAVE_BUTTON')
 * ```
 */
export function matchesI18NText(ctrl: UI5Record, i18NText: Record<string, string>): boolean {
  const getModelFn = getMethodFn(ctrl, 'getModel');
  if (getModelFn === undefined) return false;
  const i18nModel = getModelFn.call(ctrl, 'i18n') as UI5Record | null;
  if (i18nModel === null) return false;
  const getBundleFn = getMethodFn(i18nModel, 'getResourceBundle');
  if (getBundleFn === undefined) return false;
  const bundle = getBundleFn.call(i18nModel) as UI5Record | null;
  if (bundle === null) return false;
  const getTextFn = getMethodFn(bundle, 'getText');
  if (getTextFn === undefined) return false;

  for (const propName of Object.keys(i18NText)) {
    // eslint-disable-next-line security/detect-object-injection -- iterating known keys from Object.keys
    const i18nKey = i18NText[propName];
    if (i18nKey === undefined) continue;
    const expectedText = getTextFn.call(bundle, i18nKey) as string;
    const getterName = 'get' + propName.charAt(0).toUpperCase() + propName.slice(1);
    const getterFn = getMethodFn(ctrl, getterName);
    if (getterFn === undefined) return false;
    const actualValue = getterFn.call(ctrl) as string;
    if (actualValue !== expectedText) return false;
  }
  return true;
}

/**
 * Checks if a control's type matches the expected type, including subclasses.
 *
 * @remarks
 * Walks the metadata parent chain via `getMetadata().getParent()` to check
 * if any type in the inheritance hierarchy matches the expected type.
 *
 * @param ctrl - The UI5 control record.
 * @param expectedType - The expected fully qualified type name.
 * @returns True if the control or any of its superclasses match.
 *
 * @example
 * ```typescript
 * hasMatchingTypeWithSubclasses(ctrl, 'sap.ui.core.Control'); // true for any UI5 control
 * ```
 */
export function hasMatchingTypeWithSubclasses(ctrl: UI5Record, expectedType: string): boolean {
  const getMetaFn = getMethodFn(ctrl, 'getMetadata');
  if (getMetaFn === undefined) return false;
  let meta: UI5Record | null = getMetaFn.call(ctrl) as UI5Record | null;
  while (meta !== null) {
    const getNameFn = getMethodFn(meta, 'getName');
    if (getNameFn !== undefined && (getNameFn.call(meta) as string) === expectedType) {
      return true;
    }
    const getParentMetaFn = getMethodFn(meta, 'getParent');
    meta = getParentMetaFn !== undefined ? (getParentMetaFn.call(meta) as UI5Record | null) : null;
  }
  return false;
}

/**
 * Checks whether a control matches the full selector criteria.
 *
 * @remarks
 * Evaluates controlType (with optional subclass matching), properties (with operator support),
 * viewName, bindingPath, i18NText, ancestor, and descendant in order.
 * Returns false on the first mismatch for short-circuit efficiency.
 * The `searchOpenDialogs` field is handled at the discovery level by the caller,
 * not within this matcher.
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
  if (!matchesControlType(ctrl, selector)) return false;

  const properties = selector['properties'] as Record<string, unknown> | undefined;
  if (properties !== undefined && !matchesProperties(ctrl, properties)) return false;

  const viewName = selector['viewName'] as string | undefined;
  if (viewName !== undefined && !isInView(ctrl, viewName)) return false;

  const bindingPath = selector['bindingPath'] as Record<string, unknown> | undefined;
  if (bindingPath !== undefined && !matchesBindingPath(ctrl, bindingPath)) return false;

  const i18NText = selector['i18NText'] as Record<string, string> | undefined;
  if (i18NText !== undefined && !matchesI18NText(ctrl, i18NText)) return false;

  const ancestorSelector = selector['ancestor'] as UI5Record | undefined;
  if (ancestorSelector !== undefined && !matchesAncestor(ctrl, ancestorSelector)) return false;

  const descendantSelector = selector['descendant'] as UI5Record | undefined;
  if (descendantSelector !== undefined && !matchesDescendant(ctrl, descendantSelector))
    return false;

  return true;
}

/**
 * Checks whether a control matches the controlType criterion in a selector.
 *
 * @remarks
 * When `matchSubclasses` is true, walks the inheritance chain.
 * Otherwise, performs exact type name comparison.
 *
 * @param ctrl - The UI5 control record.
 * @param selector - The selector containing optional controlType and matchSubclasses.
 * @returns True if the type matches or no type constraint is specified.
 *
 * @example
 * ```typescript
 * matchesControlType(ctrl, { controlType: 'sap.m.Button', matchSubclasses: true });
 * ```
 */
function matchesControlType(ctrl: UI5Record, selector: UI5Record): boolean {
  const expectedType = selector['controlType'] as string | undefined;
  if (expectedType === undefined) return true;
  const matchSubclasses = selector['matchSubclasses'] as boolean | undefined;
  return matchSubclasses === true
    ? hasMatchingTypeWithSubclasses(ctrl, expectedType)
    : hasMatchingType(ctrl, expectedType);
}
