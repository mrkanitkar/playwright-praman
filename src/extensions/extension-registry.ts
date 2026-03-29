/**
 * @license
 * Copyright (c) ZesTest 2025-2030. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0
 *
 * This file may contain AI-assisted code.
 * See LICENSE and NOTICE files for details.
 */

/**
 * Extension registry — singleton store for custom UI5Handler sub-namespace extensions.
 *
 * @remarks
 * Extensions are registered at module scope (before tests run) via
 * {@link extendUI5Handler}. During fixture creation, all registered
 * extensions are applied to the handler instance.
 *
 * @example
 * ```typescript
 * import { extendUI5Handler } from 'playwright-praman';
 *
 * extendUI5Handler('approval', (ctx) => ({
 *   async approve(id: string) {
 *     await ctx.handler.click({ id });
 *   },
 * }));
 * ```
 *
 * @module extensions
 */

import type {
  ExtensionFactory,
  ExtensionMethods,
  ExtensionRegistration,
} from './extension-types.js';
import { RESERVED_NAMESPACES } from './extension-types.js';

import { ErrorCode } from '#core/errors/codes.js';
import { PluginError } from '#core/errors/plugin-error.js';
import { createLogger } from '#core/logging/index.js';

const logger = createLogger('extensions');

/** Module-level registry of extensions. */
const registry: ExtensionRegistration[] = [];

/**
 * Registers a custom sub-namespace extension on the `ui5` handler.
 *
 * @remarks
 * Extensions are applied during fixture creation. Each extension becomes
 * a sub-namespace on `ui5` (e.g., `ui5.approval.approve()`), following
 * the same pattern as built-in sub-namespaces like `ui5.table` and `ui5.dialog`.
 *
 * All extension methods are automatically wrapped with the UI5 stability
 * guard and appear as named steps in the Playwright trace viewer.
 *
 * Call this at module scope (outside tests), similar to `Cypress.Commands.add()`.
 *
 * For TypeScript type safety, use module augmentation:
 *
 * ```typescript
 * declare module 'playwright-praman' {
 *   interface ExtendedUI5Handler {
 *     readonly approval: {
 *       approve(id: string): Promise<void>;
 *     };
 *   }
 * }
 * ```
 *
 * @typeParam T - The shape of the methods object returned by the factory.
 * @param name - Unique namespace name. Must be non-empty and not conflict
 *   with built-in namespaces or UI5Handler method names.
 * @param factory - Function that receives an {@link ExtensionContext} and
 *   returns an object of async methods.
 * @throws PluginError if the name is empty, reserved, or already registered,
 *   or if the factory is not a function.
 *
 * @example
 * ```typescript
 * import { extendUI5Handler } from 'playwright-praman';
 *
 * extendUI5Handler('approval', (ctx) => ({
 *   async approveWorkflow(workflowId: string): Promise<void> {
 *     const btn = await ctx.handler.control({ id: workflowId });
 *     await btn.press();
 *     await ctx.handler.waitForUI5();
 *   },
 *   async getApprovalStatus(controlId: string): Promise<string> {
 *     return ctx.handler.getText({ id: controlId });
 *   },
 * }));
 * ```
 */
export function extendUI5Handler<T extends ExtensionMethods>(
  name: string,
  factory: ExtensionFactory<T>,
): void {
  if (typeof name !== 'string' || name.trim() === '') {
    throw new PluginError({
      code: ErrorCode.ERR_PLUGIN_EXTENSION_INVALID,
      message: 'Extension name must be a non-empty string',
      attempted: 'Register extension with empty name',
      pluginName: name,
      suggestions: [
        'Provide a meaningful namespace name (e.g., "approval", "workflow")',
        'The name becomes the sub-namespace: ui5.<name>.method()',
      ],
    });
  }

  if (typeof factory !== 'function') {
    throw new PluginError({
      code: ErrorCode.ERR_PLUGIN_EXTENSION_INVALID,
      message: `Extension factory for '${name}' must be a function`,
      attempted: `Register extension '${name}' with non-function factory`,
      pluginName: name,
      suggestions: [
        'The factory must be a function: (ctx) => ({ async method() { ... } })',
        'Check that you are passing a function, not the result of calling it',
      ],
    });
  }

  if (RESERVED_NAMESPACES.has(name)) {
    throw new PluginError({
      code: ErrorCode.ERR_PLUGIN_EXTENSION_INVALID,
      message: `Extension name '${name}' is reserved by Praman`,
      attempted: `Register extension with reserved name '${name}'`,
      pluginName: name,
      suggestions: [
        `'${name}' is a built-in namespace or handler method`,
        'Choose a different name for your extension',
        'Reserved names: table, dialog, date, odata, control, controls, click, fill, press, ...',
      ],
    });
  }

  if (registry.some((ext) => ext.name === name)) {
    throw new PluginError({
      code: ErrorCode.ERR_PLUGIN_EXTENSION_DUPLICATE,
      message: `Extension '${name}' is already registered`,
      attempted: `Register duplicate extension '${name}'`,
      pluginName: name,
      suggestions: [
        'Each extension name must be unique',
        'If you need to replace an extension, call clearExtensions() first (test only)',
      ],
    });
  }

  registry.push({ name, factory: factory as ExtensionFactory<ExtensionMethods> });
  logger.debug({ extensionName: name }, 'Extension registered');
}

/**
 * Returns all registered extensions in registration order.
 *
 * @returns Readonly array of extension registrations.
 *
 * @example
 * ```typescript
 * const extensions = getExtensions();
 * for (const ext of extensions) {
 *   logger.info(`Extension: ${ext.name}`);
 * }
 * ```
 */
export function getExtensions(): readonly ExtensionRegistration[] {
  return registry;
}

/**
 * Checks whether an extension with the given name is registered.
 *
 * @param name - The extension name to check.
 * @returns `true` if registered, `false` otherwise.
 *
 * @example
 * ```typescript
 * if (hasExtension('approval')) {
 *   logger.info('Approval extension is available');
 * }
 * ```
 */
export function hasExtension(name: string): boolean {
  return registry.some((ext) => ext.name === name);
}

/**
 * Removes all registered extensions. Intended for test teardown only.
 *
 * @remarks
 * Clears the module-level registry so tests can start with a clean slate.
 * Do NOT call this in production code — extensions should be registered once
 * at module scope and persist for the lifetime of the test run.
 *
 * @example
 * ```typescript
 * afterEach(() => {
 *   clearExtensions();
 * });
 * ```
 */
export function clearExtensions(): void {
  registry.length = 0;
  logger.debug('All extensions cleared');
}
