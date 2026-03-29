/**
 * @license
 * Copyright (c) ZesTest 2025-2030. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0
 *
 * This file may contain AI-assisted code.
 * See LICENSE and NOTICE files for details.
 */

/**
 * Extension system barrel — public API for custom UI5Handler extensions.
 *
 * @module extensions
 */

export {
  clearExtensions,
  extendUI5Handler,
  getExtensions,
  hasExtension,
} from './extension-registry.js';
export type {
  ExtensionContext,
  ExtensionFactory,
  ExtensionMethods,
  ExtensionRegistration,
} from './extension-types.js';
export { RESERVED_NAMESPACES } from './extension-types.js';
