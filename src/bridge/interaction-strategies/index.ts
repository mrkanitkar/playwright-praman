/**
 * Interaction strategies for UI5 control interaction.
 *
 * @remarks
 * Provides the strategy pattern for press, enterText, and select
 * operations using different approaches (UI5 native, DOM-first, OPA5).
 *
 * @module interaction-strategies
 */

export type { InteractionStrategy } from './strategy.js';
export { UI5NativeStrategy } from './ui5-native-strategy.js';
export { DomFirstStrategy } from './dom-first-strategy.js';
export type { Opa5StrategyConfig } from './opa5-strategy.js';
export { Opa5Strategy } from './opa5-strategy.js';
export { createInteractionStrategy } from './strategy-factory.js';
