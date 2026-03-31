/**
 * @license
 * Copyright (c) ZesTest 2025-2030. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0
 *
 * This file may contain AI-assisted code.
 * See LICENSE and NOTICE files for details.
 */

/**
 * Shared browser-side helpers for UI5 selector engines.
 *
 * @remarks
 * These helpers run inside the browser context (injected via esbuild IIFE bundle).
 * They must NOT import any Node.js APIs.
 *
 * @module selectors/browser
 */

/**
 * Error thrown by selector engines when a query fails.
 *
 * @example
 * ```typescript
 * throw new Ui5SelectorEngineError('UI5 runtime not loaded');
 * ```
 */
export class Ui5SelectorEngineError extends Error {
  /** @internal */
  override readonly name = 'Ui5SelectorEngineError';

  constructor(message: string) {
    super(message);
    // Restore prototype chain for instanceof checks in bundled environments
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

/**
 * Checks whether the UI5 runtime is loaded in the current page.
 *
 * @returns `true` if `sap.ui.core.Element.registry` is available
 *
 * @example
 * ```typescript
 * if (!isUi5Loaded()) return null;
 * ```
 */
export function isUi5Loaded(): boolean {
  try {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-explicit-any -- browser global
    return typeof (globalThis as any).sap?.ui?.core?.Element?.registry?.all === 'function';
  } catch {
    return false;
  }
}

/** UI5 control reference from the registry. */
export interface Ui5ControlRef {
  readonly getId: () => string;
  readonly getDomRef: () => HTMLElement | null;
  readonly getMetadata: () => Ui5Metadata;
  readonly getParent: () => Ui5ControlRef | null;
  readonly getProperty: (name: string) => unknown;
  readonly findAggregatedObjects: (deep: boolean) => Ui5ControlRef[];
  readonly getModel: (name?: string) => Ui5ModelRef | null;
  readonly isA: (type: string) => boolean;
  readonly isOpen?: () => boolean;
  readonly getBinding?: (name: string) => { readonly getPath: () => string } | null;
}

/** UI5 metadata reference. */
export interface Ui5Metadata {
  readonly getName: () => string;
  readonly getParent: () => Ui5Metadata | null;
}

/** UI5 model reference for i18n resource bundles. */
export interface Ui5ModelRef {
  readonly getResourceBundle?: () => Ui5ResourceBundle | null;
}

/** UI5 resource bundle for i18n lookups. */
export interface Ui5ResourceBundle {
  readonly getText: (key: string, args?: readonly string[]) => string;
}

/**
 * Returns the UI5 Element registry, or `null` if UI5 is not loaded.
 *
 * @returns The registry object with `all()` and `filter()` methods
 *
 * @example
 * ```typescript
 * const registry = getRegistry();
 * if (!registry) return [];
 * const allControls = registry.all();
 * ```
 */
export function getRegistry(): Ui5Registry | null {
  try {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-explicit-any -- browser global
    const registry = (globalThis as any).sap?.ui?.core?.Element?.registry as
      | Ui5Registry
      | undefined;
    return registry ?? null;
  } catch {
    return null;
  }
}

/** UI5 Element registry shape. */
export interface Ui5Registry {
  readonly all: () => Record<string, Ui5ControlRef>;
  readonly filter: (predicate: (control: Ui5ControlRef) => boolean) => Ui5ControlRef[];
  readonly get: (id: string) => Ui5ControlRef | undefined;
}
