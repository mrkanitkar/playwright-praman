/**
 * @license
 * Copyright (c) ZesTest 2025-2030. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0
 *
 * This file may contain AI-assisted code.
 * See LICENSE and NOTICE files for details.
 */

/**
 * Tests for `src/bridge/interaction-strategies/strategy-factory.ts`.
 *
 * @remarks
 * Validates the factory function that creates the appropriate
 * InteractionStrategy based on config.
 */
import { describe, expect, it } from 'vitest';

import { DomFirstStrategy } from '#bridge/interaction-strategies/dom-first-strategy.js';
import { Opa5Strategy } from '#bridge/interaction-strategies/opa5-strategy.js';
import { createInteractionStrategy } from '#bridge/interaction-strategies/strategy-factory.js';
import { UI5NativeStrategy } from '#bridge/interaction-strategies/ui5-native-strategy.js';

describe('createInteractionStrategy', () => {
  it('returns UI5NativeStrategy for "ui5-native"', () => {
    const strategy = createInteractionStrategy('ui5-native');
    expect(strategy).toBeInstanceOf(UI5NativeStrategy);
  });

  it('returns DomFirstStrategy for "dom-first"', () => {
    const strategy = createInteractionStrategy('dom-first');
    expect(strategy).toBeInstanceOf(DomFirstStrategy);
  });

  it('returns Opa5Strategy for "opa5"', () => {
    const strategy = createInteractionStrategy('opa5');
    expect(strategy).toBeInstanceOf(Opa5Strategy);
  });

  it('returns UI5NativeStrategy as default', () => {
    const strategy = createInteractionStrategy('ui5-native');
    expect(strategy.name).toBe('ui5-native');
  });

  it('passes opa5 config to Opa5Strategy', () => {
    const strategy = createInteractionStrategy('opa5', {
      interactionTimeout: 10_000,
      autoWait: false,
      debug: true,
    });
    expect(strategy).toBeInstanceOf(Opa5Strategy);
    expect(strategy.name).toBe('opa5');
  });
});
