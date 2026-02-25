/**
 * @license
 * Copyright (c) ZesTest 2025-2030. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0
 *
 * This file may contain AI-assisted code.
 * See LICENSE and NOTICE files for details.
 */

/**
 * InteractionStrategy interface for UI5 control interaction.
 *
 * @remarks
 * Defines the contract for all interaction strategies. Each strategy
 * provides press, enterText, and select operations using different
 * approaches (UI5 native events, DOM events, OPA5 RecordReplay).
 *
 * @module interaction-strategies
 */

import type { Page } from '@playwright/test';

/**
 * Contract for control interaction strategies.
 *
 * @remarks
 * Implementations: UI5NativeStrategy, DomFirstStrategy, Opa5Strategy.
 * Each strategy has its own internal fallback chain (D2).
 *
 * @example
 * ```typescript
 * const strategy: InteractionStrategy = new UI5NativeStrategy();
 * await strategy.press(page, 'btnSubmit');
 * ```
 */
export interface InteractionStrategy {
  /** Strategy name identifier. */
  readonly name: string;

  /**
   * Press/click a control.
   *
   * @param page - The browser page.
   * @param controlId - UI5 control ID.
   */
  press(page: Page, controlId: string): Promise<void>;

  /**
   * Enter text into a control.
   *
   * @param page - The browser page.
   * @param controlId - UI5 control ID.
   * @param text - Text to enter.
   */
  enterText(page: Page, controlId: string, text: string): Promise<void>;

  /**
   * Select an item in a control.
   *
   * @param page - The browser page.
   * @param controlId - UI5 control ID.
   * @param itemId - ID or key of the item to select.
   */
  select(page: Page, controlId: string, itemId: string): Promise<void>;
}
