/**
 * Factory for creating interaction strategies based on configuration.
 *
 * @remarks
 * Maps the `InteractionStrategyName` enum to concrete strategy instances.
 *
 * @module interaction-strategies
 */

import { DomFirstStrategy } from './dom-first-strategy.js';
import type { Opa5StrategyConfig } from './opa5-strategy.js';
import { Opa5Strategy } from './opa5-strategy.js';
import type { InteractionStrategy } from './strategy.js';
import { UI5NativeStrategy } from './ui5-native-strategy.js';

/**
 * Creates an InteractionStrategy instance based on the strategy name.
 *
 * @param strategyName - The strategy name from config (`'ui5-native'`, `'dom-first'`, `'opa5'`).
 * @param opa5Config - Optional OPA5-specific configuration (only used when `strategyName` is `'opa5'`).
 * @returns A concrete InteractionStrategy implementation.
 *
 * @example
 * ```typescript
 * const strategy = createInteractionStrategy('ui5-native');
 * await strategy.press(page, 'btnSubmit');
 * ```
 */
export function createInteractionStrategy(
  strategyName: string,
  opa5Config?: Opa5StrategyConfig,
): InteractionStrategy {
  switch (strategyName) {
    case 'dom-first':
      return new DomFirstStrategy();
    case 'opa5':
      return new Opa5Strategy(opa5Config);
    case 'ui5-native':
    default:
      return new UI5NativeStrategy();
  }
}
