/**
 * @license
 * Copyright (c) ZesTest 2025-2030. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0
 *
 * This file may contain AI-assisted code.
 * See LICENSE and NOTICE files for details.
 */

/**
 * Unit tests for `src/fixtures/native-dialog-handler.ts`.
 *
 * @remarks
 * The load-bearing property here is a safety one, not a feature one. Playwright
 * auto-dismisses native dialogs **only while no `dialog` listener exists**;
 * registering one makes the listener responsible for every dialog, and a
 * dialog left unanswered freezes the page so that every later action times
 * out. So the tests below care most about two things: that observation does
 * not register a `dialog` listener, and that once a policy is registered no
 * dialog can go unanswered.
 */

import type { Logger } from 'pino';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const mockHasFeature = vi.fn();
vi.mock('#core/compat/playwright-compat.js', () => ({
  hasFeature: mockHasFeature,
}));

const { NativeDialogHandler } = await import('#fixtures/native-dialog-handler.js');
type HandlerPage = ConstructorParameters<typeof NativeDialogHandler>[0]['page'];

type Listener = (dialog: MockDialog) => unknown;

interface MockDialog {
  type: () => string;
  message: () => string;
  accept: ReturnType<typeof vi.fn>;
  dismiss: ReturnType<typeof vi.fn>;
}

interface MockPage {
  on: ReturnType<typeof vi.fn>;
  off: ReturnType<typeof vi.fn>;
  listeners: Map<string, Listener[]>;
  emit: (event: string, dialog: MockDialog) => Promise<void>;
}

function createMockDialog(type = 'confirm', message = 'Discard changes?'): MockDialog {
  return {
    type: () => type,
    message: () => message,
    accept: vi.fn().mockResolvedValue(undefined),
    dismiss: vi.fn().mockResolvedValue(undefined),
  };
}

function createMockPage(): MockPage {
  const listeners = new Map<string, Listener[]>();
  const page: MockPage = {
    listeners,
    on: vi.fn((event: string, fn: Listener) => {
      const existing = listeners.get(event) ?? [];
      existing.push(fn);
      listeners.set(event, existing);
    }),
    off: vi.fn((event: string, fn: Listener) => {
      const existing = listeners.get(event) ?? [];
      listeners.set(
        event,
        existing.filter((f) => f !== fn),
      );
    }),
    emit: async (event, dialog) => {
      for (const fn of listeners.get(event) ?? []) {
        await fn(dialog);
      }
    },
  };
  return page;
}

function createMockLogger(): Logger {
  const logger = {
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    child: vi.fn(),
  };
  logger.child.mockReturnValue(logger);
  return logger as unknown as Logger;
}

/** Builds a handler over a fresh mock page. */
function createHandler(): {
  handler: InstanceType<typeof NativeDialogHandler>;
  page: MockPage;
  logger: Logger;
} {
  const page = createMockPage();
  const logger = createMockLogger();
  // The handler takes Playwright's Page; the mock supplies the subset it uses.
  const handler = new NativeDialogHandler({
    page: page as unknown as HandlerPage,
    logger,
  });
  return { handler, page, logger };
}

describe('NativeDialogHandler.observe', () => {
  beforeEach(() => {
    mockHasFeature.mockReset();
    mockHasFeature.mockReturnValue(true);
  });

  it('never registers a dialog listener, so auto-dismissal is preserved', () => {
    // The whole point of detect-only: registering 'dialog' would make
    // Playwright stop auto-dismissing and hand us the responsibility.
    const { handler, page } = createHandler();

    handler.observe();

    expect(page.listeners.get('dialog')).toBeUndefined();
    expect(page.listeners.get('dialogclosed')?.length).toBe(1);
  });

  it('records a dialog that Playwright auto-dismissed', async () => {
    const { handler, page } = createHandler();
    handler.observe();

    await page.emit('dialogclosed', createMockDialog('confirm', 'Discard changes?'));

    expect(handler.records).toHaveLength(1);
    expect(handler.records[0]).toMatchObject({
      type: 'confirm',
      message: 'Discard changes?',
      action: 'observed',
    });
  });

  it('records a beforeunload, the SAP unsaved-changes case', async () => {
    const { handler, page } = createHandler();
    handler.observe();

    await page.emit('dialogclosed', createMockDialog('beforeunload', ''));

    expect(handler.records[0]?.type).toBe('beforeunload');
  });

  it('never touches the dialog while observing', async () => {
    const { handler, page } = createHandler();
    handler.observe();
    const dialog = createMockDialog();

    await page.emit('dialogclosed', dialog);

    expect(dialog.accept).not.toHaveBeenCalled();
    expect(dialog.dismiss).not.toHaveBeenCalled();
  });

  it('degrades to no diagnostics below Playwright 1.63', () => {
    // dialogclosed is 1.63+. There is no floor equivalent for *observing* a
    // dialog without taking responsibility for it, so this degrades to
    // silence rather than throwing — observation is additive.
    mockHasFeature.mockReturnValue(false);
    const { handler, page, logger } = createHandler();

    handler.observe();

    expect(page.on).not.toHaveBeenCalled();
    expect(handler.records).toHaveLength(0);
    expect(logger.debug).toHaveBeenCalled();
  });

  it('is idempotent — observing twice does not double-record', async () => {
    const { handler, page } = createHandler();
    handler.observe();
    handler.observe();

    await page.emit('dialogclosed', createMockDialog());

    expect(handler.records).toHaveLength(1);
  });
});

describe('NativeDialogHandler.register', () => {
  beforeEach(() => {
    mockHasFeature.mockReset();
    mockHasFeature.mockReturnValue(true);
  });

  it('answers a matching dialog with the rule action', async () => {
    const { handler, page } = createHandler();
    handler.register({ name: 'discard', types: ['confirm'], action: 'accept' });
    const dialog = createMockDialog('confirm');

    await page.emit('dialog', dialog);

    expect(dialog.accept).toHaveBeenCalledOnce();
    expect(dialog.dismiss).not.toHaveBeenCalled();
    expect(handler.records[0]).toMatchObject({ handledBy: 'discard', action: 'accept' });
  });

  it('dismisses an UNMATCHED dialog rather than leaving the page frozen', async () => {
    // The critical safety case. Once any 'dialog' listener exists, Playwright
    // no longer auto-dismisses — so a dialog that matches no rule must still
    // be answered, or every later action on the page times out.
    const { handler, page, logger } = createHandler();
    handler.register({ name: 'discard', types: ['confirm'], action: 'accept' });
    const alert = createMockDialog('alert', 'Session expired');

    await page.emit('dialog', alert);

    expect(alert.dismiss).toHaveBeenCalledOnce();
    expect(handler.records[0]).toMatchObject({ handledBy: 'unmatched', action: 'dismiss' });
    // Loud, because an unmatched dialog means the policy is incomplete.
    expect(logger.warn).toHaveBeenCalled();
  });

  it('passes promptText when accepting a prompt', async () => {
    const { handler, page } = createHandler();
    handler.register({
      name: 'name-prompt',
      types: ['prompt'],
      action: 'accept',
      promptText: 'TESTUSER',
    });

    const dialog = createMockDialog('prompt', 'Your name?');
    await page.emit('dialog', dialog);

    expect(dialog.accept).toHaveBeenCalledWith('TESTUSER');
    expect(handler.records[0]).toMatchObject({ handledBy: 'name-prompt' });
  });

  it('accepts without arguments when no promptText is given', async () => {
    const { handler, page } = createHandler();
    handler.register({ name: 'ok', types: ['confirm'], action: 'accept' });
    const dialog = createMockDialog('confirm');

    await page.emit('dialog', dialog);

    expect(dialog.accept).toHaveBeenCalledWith();
  });

  it('honours the times cap and then falls back to dismissing', async () => {
    const { handler, page } = createHandler();
    handler.register({ name: 'once', types: ['confirm'], action: 'accept', times: 1 });

    const first = createMockDialog('confirm');
    const second = createMockDialog('confirm');
    await page.emit('dialog', first);
    await page.emit('dialog', second);

    expect(first.accept).toHaveBeenCalledOnce();
    // Still answered — a spent rule must not mean an unanswered dialog.
    expect(second.accept).not.toHaveBeenCalled();
    expect(second.dismiss).toHaveBeenCalledOnce();
  });

  it('matches the first registered rule covering the type', async () => {
    const { handler, page } = createHandler();
    handler.register({ name: 'first', types: ['confirm'], action: 'accept' });
    handler.register({ name: 'second', types: ['confirm'], action: 'dismiss' });

    await page.emit('dialog', createMockDialog('confirm'));

    expect(handler.records[0]?.handledBy).toBe('first');
  });

  it('registers exactly one dialog listener however many rules are added', () => {
    const { handler, page } = createHandler();
    handler.register({ name: 'a', types: ['confirm'], action: 'accept' });
    handler.register({ name: 'b', types: ['alert'], action: 'dismiss' });

    expect(page.listeners.get('dialog')?.length).toBe(1);
  });

  it('works below 1.63 — page.on(dialog) exists at the floor', async () => {
    // Unlike observation, answering dialogs needs no feature gate.
    mockHasFeature.mockReturnValue(false);
    const { handler, page } = createHandler();
    handler.register({ name: 'discard', types: ['confirm'], action: 'dismiss' });
    const dialog = createMockDialog('confirm');

    await page.emit('dialog', dialog);

    expect(dialog.dismiss).toHaveBeenCalledOnce();
  });

  it('still answers the dialog when the action itself rejects', async () => {
    const { handler, page } = createHandler();
    handler.register({ name: 'discard', types: ['confirm'], action: 'accept' });
    const dialog = createMockDialog('confirm');
    dialog.accept.mockRejectedValue(new Error('target closed'));

    await expect(page.emit('dialog', dialog)).resolves.toBeUndefined();
    expect(handler.records[0]?.error).toContain('target closed');
  });

  it('rejects a rule with no dialog types', () => {
    const { handler } = createHandler();

    expect(() => {
      handler.register({ name: 'empty', types: [], action: 'dismiss' });
    }).toThrow();
  });

  it('rejects a duplicate rule name', () => {
    const { handler } = createHandler();
    handler.register({ name: 'dup', types: ['confirm'], action: 'dismiss' });

    expect(() => {
      handler.register({ name: 'dup', types: ['alert'], action: 'dismiss' });
    }).toThrow();
  });
});

describe('NativeDialogHandler.dispose', () => {
  beforeEach(() => {
    mockHasFeature.mockReset();
    mockHasFeature.mockReturnValue(true);
  });

  it('removes every listener it added', () => {
    const { handler, page } = createHandler();
    handler.observe();
    handler.register({ name: 'discard', types: ['confirm'], action: 'dismiss' });

    handler.dispose();

    expect(page.listeners.get('dialog')?.length ?? 0).toBe(0);
    expect(page.listeners.get('dialogclosed')?.length ?? 0).toBe(0);
  });

  it('restores auto-dismissal by removing the dialog listener', async () => {
    // After dispose, Playwright owns dialogs again — so a later dialog must
    // not be recorded by us, and must not hang.
    const { handler, page } = createHandler();
    handler.register({ name: 'discard', types: ['confirm'], action: 'dismiss' });
    handler.dispose();

    await page.emit('dialog', createMockDialog('confirm'));

    expect(handler.records).toHaveLength(0);
  });

  it('is safe to call without having registered anything', () => {
    const { handler } = createHandler();

    expect(() => {
      handler.dispose();
    }).not.toThrow();
  });
});
