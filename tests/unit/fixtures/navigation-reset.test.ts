/**
 * @license
 * Copyright (c) ZesTest 2025-2030. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0
 *
 * This file may contain AI-assisted code.
 * See LICENSE and NOTICE files for details.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('#bridge/injection.js', () => ({
  resetPageInjection: vi.fn(),
}));

import { resetPageInjection } from '#bridge/injection.js';
import { attachBridgeNavigationReset } from '#fixtures/navigation-reset.js';

interface MockPage {
  mainFrame: () => { id: string };
  on: ReturnType<typeof vi.fn>;
  off: ReturnType<typeof vi.fn>;
  emit: (event: string, ...args: unknown[]) => void;
  mainFrameRef: { id: string };
}

function createMockPage(): MockPage {
  const listeners = new Map<string, ((...args: unknown[]) => void)[]>();
  const mainFrame = { id: 'main' };
  return {
    mainFrame: () => mainFrame,
    on: vi.fn((event: string, fn: (...args: unknown[]) => void) => {
      const existing = listeners.get(event) ?? [];
      existing.push(fn);
      listeners.set(event, existing);
    }),
    off: vi.fn((event: string, fn: (...args: unknown[]) => void) => {
      const fns = listeners.get(event);
      if (fns !== undefined) {
        listeners.set(event, fns.filter(f => f !== fn));
      }
    }),
    emit(event: string, ...args: unknown[]): void {
      for (const fn of listeners.get(event) ?? []) fn(...args);
    },
    mainFrameRef: mainFrame,
  };
}

describe('attachBridgeNavigationReset', () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it('registers a framenavigated listener on the page', () => {
    const page = createMockPage();
    attachBridgeNavigationReset(page as never);
    expect(page.on).toHaveBeenCalledWith('framenavigated', expect.any(Function));
  });

  it('calls resetPageInjection when main frame navigates', () => {
    const page = createMockPage();
    attachBridgeNavigationReset(page as never);
    page.emit('framenavigated', page.mainFrameRef);
    expect(resetPageInjection).toHaveBeenCalledWith(page);
  });

  it('does not call resetPageInjection for sub-frame navigation', () => {
    const page = createMockPage();
    attachBridgeNavigationReset(page as never);
    page.emit('framenavigated', { id: 'child-frame' });
    expect(resetPageInjection).not.toHaveBeenCalled();
  });

  it('returns a cleanup function that removes the listener', () => {
    const page = createMockPage();
    const detach = attachBridgeNavigationReset(page as never);
    detach();
    expect(page.off).toHaveBeenCalledWith('framenavigated', expect.any(Function));
  });

  it('passes optional logger debug message on main-frame navigation', () => {
    const page = createMockPage();
    const mockLogger = { debug: vi.fn() };
    attachBridgeNavigationReset(page as never, mockLogger as never);
    page.emit('framenavigated', page.mainFrameRef);
    expect(mockLogger.debug).toHaveBeenCalledWith(
      'Main frame navigated — clearing bridge injection state',
    );
  });

  it('does not throw when no logger is provided', () => {
    const page = createMockPage();
    attachBridgeNavigationReset(page as never);
    expect(() => {
      page.emit('framenavigated', page.mainFrameRef);
    }).not.toThrow();
  });
});
