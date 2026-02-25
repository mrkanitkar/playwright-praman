/**
 * @license
 * Copyright (c) ZesTest 2025-2030. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0
 *
 * This file may contain AI-assisted code.
 * See LICENSE and NOTICE files for details.
 */

/**
 * Function-form browser script for UI5 control discovery (GAP-01/GAP-02/GAP-21).
 *
 * @remarks
 * Passed to `page.evaluate(fn, args)` using CDP `Runtime.callFunctionOn`.
 * See `find-control.ts` for the string-form variant.
 *
 * Type assertions (`as string`, `as boolean`, `as Record<...>`) throughout this file
 * narrow untyped UI5 API return values from `.call()` on dynamically-resolved methods.
 * UI5's runtime API is inherently untyped in the browser context — `.call()` returns
 * `unknown`. These casts are safe because the method names are known UI5 API contracts
 * (getId, getMetadata, getName, getDomRef, getVisible).
 *
 * @module bridge/browser-scripts
 */

import type { ControlDiscoveryResult } from '../bridge-types.js';

import {
  getMethodFn,
  hasMatchingType,
  isRegExpIdMatch,
  matchesSelector,
} from './find-control-matchers.js';

/**
 * Parameters for the function-form control discovery.
 *
 * @example
 * ```typescript
 * const params: BrowserFindControlParams = {
 *   selector: { id: 'btn1' },
 *   bridgeNs: '__praman_bridge',
 *   preferVisibleControls: true,
 * };
 * ```
 */
export interface BrowserFindControlParams {
  /** UI5Selector serialized to a plain object. */
  readonly selector: Record<string, unknown>;
  /** Window namespace of the injected bridge (e.g., `'__praman_bridge'`). */
  readonly bridgeNs: string;
  /** When true, prefer visible controls over hidden ones in registry scan. */
  readonly preferVisibleControls?: boolean;
  /** When true, force full registry scan (skip Tier 1 direct-id). */
  readonly forceRegistryScan?: boolean;
}

/** Typed accessor for UI5 objects in the browser. */
type UI5Record = Record<string, unknown>;

/** Empty discovery result constant shape. */
const EMPTY_RESULT: ControlDiscoveryResult = Object.freeze({
  id: '',
  controlType: 'unknown',
  methods: [],
  domId: null,
  visible: false,
});

/** Extracts method names from a UI5 control's prototype chain. */
function extractMethods(ctrl: UI5Record): string[] {
  const methods: string[] = [];
  let proto: UI5Record | null = Object.getPrototypeOf(ctrl) as UI5Record | null;
  while (proto !== null && proto !== Object.prototype) {
    for (const name of Object.getOwnPropertyNames(proto)) {
      if (
        // eslint-disable-next-line security/detect-object-injection -- iterating own property names
        typeof proto[name] === 'function' &&
        !methods.includes(name) &&
        !name.startsWith('_') &&
        !name.includes('Render')
      ) {
        methods.push(name);
      }
    }
    proto = Object.getPrototypeOf(proto) as UI5Record | null;
  }
  return methods;
}

/** Builds a discovery result from a UI5 control. */
function buildResult(ctrl: UI5Record): ControlDiscoveryResult {
  const getIdFn = getMethodFn(ctrl, 'getId');
  const id = getIdFn !== undefined ? (getIdFn.call(ctrl) as string) : '';
  const getMetaFn = getMethodFn(ctrl, 'getMetadata');
  const meta = getMetaFn !== undefined ? (getMetaFn.call(ctrl) as UI5Record | null) : null;
  const getNameFn = meta !== null ? getMethodFn(meta, 'getName') : undefined;
  const controlType = getNameFn !== undefined ? (getNameFn.call(meta) as string) : 'unknown';
  const getDomRefFn = getMethodFn(ctrl, 'getDomRef');
  const domRef =
    getDomRefFn !== undefined ? (getDomRefFn.call(ctrl) as { id: string } | null) : null;
  const domId = domRef !== null ? domRef.id : null;
  const getVisibleFn = getMethodFn(ctrl, 'getVisible');
  const visible = getVisibleFn !== undefined ? (getVisibleFn.call(ctrl) as boolean) : true;
  return { id, controlType, methods: extractMethods(ctrl), domId, visible };
}

/**
 * Function-form browser script for finding a single UI5 control.
 *
 * @remarks
 * Uses 3-tier discovery: getById, registry scan (enhanced GAP-02/GAP-21),
 * and RecordReplay. Passed to `page.evaluate(fn, args)`.
 *
 * @param params - Selector, bridge namespace, and discovery options.
 * @returns Discovery result or empty result if not found.
 *
 * @example
 * ```typescript
 * const result = await page.evaluate(browserFindControl, {
 *   selector: { id: 'btn1' },
 *   bridgeNs: '__praman_bridge',
 *   preferVisibleControls: true,
 * });
 * ```
 */
export async function browserFindControl(
  params: BrowserFindControlParams,
): Promise<ControlDiscoveryResult> {
  try {
    const bridge = Reflect.get(window, params.bridgeNs) as UI5Record | undefined;
    if (bridge === undefined) return EMPTY_RESULT;

    const getById = getMethodFn(bridge, 'getById') as
      | ((id: string) => UI5Record | null)
      | undefined;
    if (getById === undefined) return EMPTY_RESULT;

    const selectorId = params.selector['id'] as string | undefined;
    const hasId = selectorId !== undefined && selectorId !== '';

    // Tier 1: Direct ID lookup (exact match) - skipped when forceRegistryScan
    if (params.forceRegistryScan !== true && hasId) {
      const tier1 = tryDirectIdLookup(getById, selectorId, params.selector);
      if (tier1 !== null) return tier1;
    }

    // Tier 2: Registry scan
    const tier2 = tryRegistryScan(hasId ? selectorId : undefined, params);
    if (tier2 !== null) return tier2;

    // Tier 3: RecordReplay
    return await tryRecordReplay(bridge, params.selector);
  } catch {
    return EMPTY_RESULT;
  }
}

/** Tier 1: Direct ID lookup via getById. */
function tryDirectIdLookup(
  getById: (id: string) => UI5Record | null,
  selectorId: string,
  selector: UI5Record,
): ControlDiscoveryResult | null {
  const directCtrl = getById(selectorId);
  if (directCtrl === null) return null;
  const expectedType = selector['controlType'] as string | undefined;
  if (expectedType !== undefined && !hasMatchingType(directCtrl, expectedType)) return null;
  return buildResult(directCtrl);
}

/** Tier 2: Route to registry scan with appropriate parameters. */
function tryRegistryScan(
  selectorId: string | undefined,
  params: BrowserFindControlParams,
): ControlDiscoveryResult | null {
  const preferVisible = params.preferVisibleControls !== false;
  if (params.forceRegistryScan === true) {
    return scanRegistry(selectorId, params.selector, preferVisible);
  }
  if (selectorId !== undefined) {
    return scanRegistry(selectorId, params.selector, preferVisible);
  }
  return null;
}

/** Resolves the UI5 element registry from browser globals. */
function getElementRegistry(): UI5Record | undefined {
  const sapGlobal = Reflect.get(window, 'sap') as UI5Record | undefined;
  if (sapGlobal === undefined) return undefined;
  const ui = sapGlobal['ui'] as UI5Record | undefined;
  if (ui === undefined) return undefined;
  const core = ui['core'] as UI5Record | undefined;
  if (core === undefined) return undefined;
  const element = core['Element'] as UI5Record | undefined;
  return element !== undefined
    ? (element['registry'] as UI5Record | undefined)
    : (core['ElementRegistry'] as UI5Record | undefined);
}

/** Checks whether a control's ID matches via exact or suffix match. */
function isIdMatch(ctrl: UI5Record, selectorId: string, suffix: string): boolean {
  const getIdFn = getMethodFn(ctrl, 'getId');
  if (getIdFn === undefined) return false;
  const ctrlId = getIdFn.call(ctrl) as string;
  return ctrlId === selectorId || (ctrlId.length > suffix.length && ctrlId.endsWith(suffix));
}

/** Checks if an ID matches using exact, suffix, or RegExp strategy. */
function isIdMatchByStrategy(
  regId: string,
  ctrl: UI5Record,
  selectorId: string,
  suffix: string,
  useRegExp: boolean,
): boolean {
  if (useRegExp) return isRegExpIdMatch(regId, selectorId);
  return isIdMatch(ctrl, selectorId, suffix);
}

/** Checks if a control is visible (defaults to true if no getVisible method). */
function isControlVisible(ctrl: UI5Record): boolean {
  const getVisibleFn = getMethodFn(ctrl, 'getVisible');
  return getVisibleFn !== undefined ? (getVisibleFn.call(ctrl) as boolean) : true;
}

/** Checks if a registry entry matches ID and selector criteria. */
function matchesRegistryEntry(
  regId: string,
  regCtrl: UI5Record,
  selector: UI5Record,
  selectorId: string | undefined,
  suffix: string,
  useRegExp: boolean,
): boolean {
  if (
    selectorId !== undefined &&
    !isIdMatchByStrategy(regId, regCtrl, selectorId, suffix, useRegExp)
  ) {
    return false;
  }
  return matchesSelector(regCtrl, selector);
}

/** Scans the UI5 registry for controls matching the selector (GAP-02/GAP-21). */
function scanRegistry(
  selectorId: string | undefined,
  selector: UI5Record,
  preferVisible: boolean,
): ControlDiscoveryResult | null {
  const allMap = getRegistryMap();
  if (allMap === null) return null;
  const suffix = selectorId !== undefined ? '--' + selectorId : '';
  const isRe =
    selectorId !== undefined &&
    selectorId.startsWith('/') &&
    selectorId.endsWith('/') &&
    selectorId.length > 2;
  let firstMatch: UI5Record | null = null;
  let visibleMatch: UI5Record | null = null;
  for (const regId of Object.keys(allMap)) {
    // eslint-disable-next-line security/detect-object-injection -- iterating known keys from Object.keys
    const regCtrl: UI5Record | undefined = allMap[regId];
    if (regCtrl === undefined) continue;
    if (!matchesRegistryEntry(regId, regCtrl, selector, selectorId, suffix, isRe)) continue;
    if (!preferVisible) return buildResult(regCtrl);
    firstMatch ??= regCtrl;
    if (isControlVisible(regCtrl)) visibleMatch ??= regCtrl;
  }
  const bestMatch = visibleMatch ?? firstMatch;
  return bestMatch !== null ? buildResult(bestMatch) : null;
}

/** Gets the full registry map, or null if unavailable. */
function getRegistryMap(): Record<string, UI5Record> | null {
  const registry = getElementRegistry();
  if (registry === undefined) return null;
  const allFn = getMethodFn(registry, 'all');
  return allFn !== undefined ? (allFn.call(registry) as Record<string, UI5Record>) : null;
}

/** Attempts RecordReplay discovery. */
async function tryRecordReplay(
  bridge: UI5Record,
  selector: UI5Record,
): Promise<ControlDiscoveryResult> {
  const recordReplay = bridge['RecordReplay'] as UI5Record | undefined;
  if (recordReplay === undefined) return EMPTY_RESULT;

  try {
    const findFn = recordReplay['findDOMElementByControlSelector'] as
      | ((opts: { selector: UI5Record }) => Promise<Element | null>)
      | undefined;
    if (findFn === undefined) return EMPTY_RESULT;

    const domElement = await findFn.call(recordReplay, { selector });
    if (domElement === null) return EMPTY_RESULT;

    const ui5Ctrl = resolveControlFromDom(domElement);
    if (ui5Ctrl !== null) return buildResult(ui5Ctrl);
  } catch {
    // RecordReplay failed
  }
  return EMPTY_RESULT;
}

/** Resolves a UI5 control from a DOM element. */
function resolveControlFromDom(domElement: Element): UI5Record | null {
  const sapGlobal = Reflect.get(window, 'sap') as UI5Record | undefined;
  if (sapGlobal !== undefined) {
    const ui = sapGlobal['ui'] as UI5Record | undefined;
    const core = ui !== undefined ? (ui['core'] as UI5Record | undefined) : undefined;
    const element = core !== undefined ? (core['Element'] as UI5Record | undefined) : undefined;
    if (element !== undefined) {
      const closestTo = element['closestTo'] as ((el: Element) => UI5Record | null) | undefined;
      if (closestTo !== undefined) return closestTo(domElement);
    }
  }

  const jQueryGlobal = Reflect.get(window, 'jQuery') as
    | ((...args: unknown[]) => UI5Record)
    | undefined;
  if (jQueryGlobal !== undefined) {
    const jqEl = jQueryGlobal(domElement);
    const controlFn = jqEl['control'] as ((index: number) => UI5Record | null) | undefined;
    if (controlFn !== undefined) return controlFn.call(jqEl, 0);
  }

  return null;
}
