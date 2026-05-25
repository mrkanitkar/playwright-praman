/**
 * @license
 * Copyright (c) ZesTest 2025-2030. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0
 *
 * This file may contain AI-assisted code.
 * See LICENSE and NOTICE files for details.
 */
import type { Page } from '@playwright/test';
import { afterEach, describe, expect, it, vi } from 'vitest';

import type { InteractionStrategy } from '#bridge/interaction-strategies/strategy.js';
import type { ControlProxyState } from '#proxy/control-proxy.js';

const { mockHasFeature } = vi.hoisted(() => ({ mockHasFeature: vi.fn<(f: string) => boolean>() }));
vi.mock('#core/compat/index.js', () => ({ hasFeature: mockHasFeature }));

const { createControlProxy } = await import('#proxy/control-proxy.js');
const { setHighlightState } = await import('#core/highlight/highlight-controller.js');

interface PressProxy {
  press(): Promise<void>;
}

function makeStrategy(): InteractionStrategy {
  return {
    name: 'mock',
    press: vi.fn<(...a: unknown[]) => Promise<void>>().mockResolvedValue(undefined),
    enterText: vi.fn<(...a: unknown[]) => Promise<void>>().mockResolvedValue(undefined),
    select: vi.fn<(...a: unknown[]) => Promise<void>>().mockResolvedValue(undefined),
  };
}

interface Harness {
  state: ControlProxyState;
  page: Page;
  highlight: ReturnType<typeof vi.fn>;
  hideHighlight: ReturnType<typeof vi.fn>;
  locator: ReturnType<typeof vi.fn>;
}

function makeHarness(): Harness {
  const highlight = vi.fn().mockResolvedValue(undefined);
  const locator = vi.fn().mockReturnValue({ highlight });
  const hideHighlight = vi.fn().mockResolvedValue(undefined);
  const page = {
    evaluate: vi.fn().mockResolvedValue('dom-id'),
    locator,
    hideHighlight,
  } as unknown as Page;
  const state: ControlProxyState = {
    id: 'saveBtn',
    controlType: 'sap.m.Button',
    methods: new Set<string>(),
    page,
    interactionStrategy: makeStrategy(),
  };
  return { state, page, highlight, hideHighlight, locator };
}

describe('control-proxy highlight hook', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it('highlights the control before press() when enabled (PW 1.60)', async () => {
    mockHasFeature.mockReturnValue(true);
    const h = makeHarness();
    setHighlightState(h.page, { enabled: true, style: 'outline: 1px' });

    const proxy = createControlProxy(h.state) as unknown as PressProxy;
    await proxy.press();

    expect(h.hideHighlight).toHaveBeenCalled();
    expect(h.locator).toHaveBeenCalledWith('[id="dom-id"]');
    expect(h.highlight).toHaveBeenCalledWith({ style: 'outline: 1px' });
  });

  it('does NOT highlight when no highlight state is set', async () => {
    mockHasFeature.mockReturnValue(true);
    const h = makeHarness();

    const proxy = createControlProxy(h.state) as unknown as PressProxy;
    await proxy.press();

    expect(h.highlight).not.toHaveBeenCalled();
  });

  it('does NOT highlight when hasLocatorHighlightStyle is false', async () => {
    mockHasFeature.mockReturnValue(false);
    const h = makeHarness();
    setHighlightState(h.page, { enabled: true });

    const proxy = createControlProxy(h.state) as unknown as PressProxy;
    await proxy.press();

    expect(h.highlight).not.toHaveBeenCalled();
  });
});
