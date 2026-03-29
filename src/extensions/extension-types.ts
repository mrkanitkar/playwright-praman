/**
 * @license
 * Copyright (c) ZesTest 2025-2030. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0
 *
 * This file may contain AI-assisted code.
 * See LICENSE and NOTICE files for details.
 */

/**
 * Type definitions for the Praman extension system.
 *
 * @remarks
 * Provides the types needed to register custom sub-namespace extensions
 * on the `ui5` handler. Extensions are factory functions that receive
 * an {@link ExtensionContext} and return an object of async methods.
 *
 * @example
 * ```typescript
 * import type { ExtensionContext, ExtensionFactory } from 'playwright-praman';
 *
 * const myFactory: ExtensionFactory<{
 *   doSomething(): Promise<void>;
 * }> = (ctx) => ({
 *   async doSomething() {
 *     await ctx.handler.waitForUI5();
 *   },
 * });
 * ```
 *
 * @module extensions
 */

import type { Page } from '@playwright/test';

import type { PramanConfig } from '#core/config/index.js';
import type { UI5Handler } from '#fixtures/ui5-handler.js';

/**
 * Context provided to extension factories during handler creation.
 *
 * @remarks
 * Each test gets its own context with a fresh handler instance.
 * The `page` and `handler` are test-scoped; `config` is worker-scoped
 * and frozen.
 *
 * @example
 * ```typescript
 * extendUI5Handler('myExt', (ctx: ExtensionContext) => ({
 *   async myMethod() {
 *     const btn = await ctx.handler.control({ id: 'btn1' });
 *     await btn.press();
 *   },
 * }));
 * ```
 */
export interface ExtensionContext {
  /** Playwright Page for direct browser interactions. */
  readonly page: Page;
  /** The base UI5Handler instance for control discovery and interaction. */
  readonly handler: UI5Handler;
  /** Validated, frozen Praman configuration. */
  readonly config: Readonly<PramanConfig>;
}

/**
 * Constraint for extension method objects — all values must be async functions.
 *
 * @remarks
 * Used as a generic constraint on {@link ExtensionFactory} to ensure
 * that extension factories return objects whose methods are all async.
 */
export type ExtensionMethods = Record<string, (...args: never[]) => Promise<unknown>>;

/**
 * Factory function that creates extension methods from a context.
 *
 * @typeParam T - The shape of the methods object returned by this factory.
 *
 * @example
 * ```typescript
 * const factory: ExtensionFactory<{
 *   approve(id: string): Promise<void>;
 * }> = (ctx) => ({
 *   async approve(id: string) {
 *     await ctx.handler.click({ id });
 *   },
 * });
 * ```
 */
export type ExtensionFactory<T extends ExtensionMethods> = (context: ExtensionContext) => T;

/**
 * Stored registration entry for a single extension.
 *
 * @example
 * ```typescript
 * const reg: ExtensionRegistration = {
 *   name: 'approval',
 *   factory: (ctx) => ({ async approve() { /* ... *\/ } }),
 * };
 * ```
 */
export interface ExtensionRegistration {
  /** Unique namespace name for this extension (e.g., `'approval'`). */
  readonly name: string;
  /** Factory that produces the methods object. */
  readonly factory: ExtensionFactory<ExtensionMethods>;
}

/**
 * Namespace names reserved by Praman — extensions cannot use these.
 *
 * @remarks
 * Includes built-in sub-namespaces (`table`, `dialog`, `date`, `odata`)
 * and all public `UI5Handler` method names. Using a reserved name throws
 * a `PluginError` with code `ERR_PLUGIN_EXTENSION_INVALID`.
 */
export const RESERVED_NAMESPACES: ReadonlySet<string> = new Set([
  // Built-in sub-namespaces
  'table',
  'dialog',
  'date',
  'odata',
  // UI5Handler public methods
  'control',
  'controls',
  'click',
  'fill',
  'press',
  'select',
  'check',
  'uncheck',
  'clear',
  'getText',
  'getValue',
  'waitForUI5',
  'waitFor',
  'inspect',
  'clearCache',
  'destroy',
]);
