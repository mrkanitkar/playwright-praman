/**
 * Tests for `src/bridge/interaction-strategies/strategy.ts`.
 *
 * @remarks
 * Validates the InteractionStrategy interface shape and contract.
 */
import { describe, expectTypeOf, it } from 'vitest';

import type { InteractionStrategy } from '#bridge/interaction-strategies/strategy.js';

describe('InteractionStrategy', () => {
  it('has press method', () => {
    expectTypeOf<InteractionStrategy>().toHaveProperty('press');
  });

  it('has enterText method', () => {
    expectTypeOf<InteractionStrategy>().toHaveProperty('enterText');
  });

  it('has select method', () => {
    expectTypeOf<InteractionStrategy>().toHaveProperty('select');
  });

  it('has name property', () => {
    expectTypeOf<InteractionStrategy>().toHaveProperty('name');
    expectTypeOf<InteractionStrategy['name']>().toBeString();
  });
});
