/**
 * @module compat
 *
 * @remarks
 * Cross-platform compatibility utilities for ESM/CJS dual-format support,
 * OS-agnostic path handling, and module resolution helpers.
 */
export {
  getModuleDirname,
  getModuleFilename,
  resolveFromPackageRoot,
  joinPath,
  PATH_SEPARATOR,
} from './path-helpers.js';
