/**
 * @license
 * Copyright (c) ZesTest 2025-2030. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0
 *
 * This file may contain AI-assisted code.
 * See LICENSE and NOTICE files for details.
 */

/**
 * @module compat
 *
 * @remarks
 * Cross-platform compatibility utilities for ESM/CJS dual-format support,
 * OS-agnostic path handling, module resolution helpers, and Playwright
 * version detection with feature flags.
 */
export {
  getModuleDirname,
  getModuleFilename,
  resolveFromPackageRoot,
  joinPath,
  PATH_SEPARATOR,
} from './path-helpers.js';

export type { PlaywrightVersion, PlaywrightFeatures } from './playwright-compat.js';

export {
  parsePlaywrightVersion,
  detectFeatures,
  getPlaywrightVersion,
  getPlaywrightFeatures,
  hasFeature,
  assertMinVersion,
} from './playwright-compat.js';
