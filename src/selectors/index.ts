/**
 * Selectors module — parsing, serialization, validation, and engine for UI5 selectors.
 *
 * @module selectors
 */

export {
  isUI5SelectorString,
  parseUI5Selector,
  serializeUI5Selector,
  validateUI5Selector,
} from './selector-parser.js';
export type { UI5SelectorEngineScript } from './ui5-selector-engine.js';
export { createUI5SelectorEngineScript } from './ui5-selector-engine.js';
