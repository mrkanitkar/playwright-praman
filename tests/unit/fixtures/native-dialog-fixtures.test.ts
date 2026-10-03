/**
 * @license
 * Copyright (c) ZesTest 2025-2030. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0
 *
 * This file may contain AI-assisted code.
 * See LICENSE and NOTICE files for details.
 */

/**
 * Unit tests for `src/fixtures/native-dialog-fixtures.ts`.
 *
 * @remarks
 * The property that matters: installing the fixture must call `observe()` and
 * never `register()`. Observation attaches only `dialogclosed`; registering a
 * rule would attach `dialog`, which stops Playwright auto-dismissing and makes
 * Praman responsible for every dialog on the page. A fixture that did that
 * implicitly could freeze a test that never asked for dialog handling.
 */

import type { Buffer } from 'node:buffer';

import { beforeEach, describe, expect, it, vi } from 'vitest';

import { createMockTestExtend } from '../../helpers/mock-playwright-test.js';

const mockTestExtend = createMockTestExtend();

vi.mock('@playwright/test', () => ({
  test: { extend: mockTestExtend },
}));

const mockObserve = vi.fn();
const mockRegister = vi.fn();
const mockDispose = vi.fn();
let mockRecords: unknown[] = [];

const mockNativeDialogHandler = vi.fn().mockImplementation(function mockHandler(
  this: Record<string, unknown>,
) {
  this['observe'] = mockObserve;
  this['register'] = mockRegister;
  this['dispose'] = mockDispose;
  Object.defineProperty(this, 'records', { get: () => mockRecords });
});

vi.mock('../../../src/fixtures/native-dialog-handler.js', () => ({
  NativeDialogHandler: mockNativeDialogHandler,
}));

const { nativeDialogTest } = await import('#fixtures/native-dialog-fixtures.js');

const fixtures = (nativeDialogTest as unknown as { _fixtureDefinitions: Record<string, unknown> })
  ._fixtureDefinitions;

function extractFixtureFn(definition: unknown): (...args: unknown[]) => Promise<void> {
  if (Array.isArray(definition)) {
    return definition[0] as (...args: unknown[]) => Promise<void>;
  }
  return definition as (...args: unknown[]) => Promise<void>;
}

interface MockTestInfo {
  attach: ReturnType<typeof vi.fn>;
}

function createTestInfo(): MockTestInfo {
  return { attach: vi.fn().mockResolvedValue(undefined) };
}

/** Runs the fixture through its full setup/teardown cycle. */
async function runFixture(testInfo: MockTestInfo = createTestInfo()): Promise<{
  captured: unknown;
  testInfo: MockTestInfo;
}> {
  const fn = extractFixtureFn(fixtures['nativeDialogs']);
  let captured: unknown;
  const useFn = async (value: unknown): Promise<void> => {
    captured = value;
    await Promise.resolve();
  };

  await fn({ page: { on: vi.fn(), off: vi.fn() } }, useFn, testInfo);
  return { captured, testInfo };
}

describe('nativeDialogTest', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockRecords = [];
  });

  it('declares the nativeDialogs fixture', () => {
    expect(fixtures['nativeDialogs']).toBeDefined();
  });

  it('is not an auto fixture — a test must ask for it', () => {
    // An auto fixture would attach dialogclosed to every test in the suite.
    const definition = fixtures['nativeDialogs'];
    const options = Array.isArray(definition)
      ? (definition[1] as { auto?: boolean } | undefined)
      : undefined;

    expect(options?.auto).not.toBe(true);
  });

  it('installs in detect-only mode: observe, never register', async () => {
    await runFixture();

    expect(mockObserve).toHaveBeenCalledOnce();
    expect(mockRegister).not.toHaveBeenCalled();
  });

  it('provides the handler to the test', async () => {
    const { captured } = await runFixture();

    expect(captured).toBeDefined();
    expect(mockNativeDialogHandler).toHaveBeenCalledOnce();
  });

  it('disposes the handler on teardown', async () => {
    await runFixture();

    expect(mockDispose).toHaveBeenCalledOnce();
  });

  it('attaches records when a dialog was seen', async () => {
    mockRecords = [
      { type: 'beforeunload', message: '', handledBy: 'observed', action: 'observed' },
    ];

    const { testInfo } = await runFixture();

    expect(testInfo.attach).toHaveBeenCalledOnce();
    const callArgs = testInfo.attach.mock.calls[0] as unknown[];
    expect(callArgs[0]).toBe('native-dialogs');
    const opts = callArgs[1] as { contentType: string; body: Buffer };
    expect(opts.contentType).toBe('application/json');
    expect(JSON.parse(opts.body.toString('utf8'))).toHaveLength(1);
  });

  it('attaches nothing when no dialog appeared', async () => {
    const { testInfo } = await runFixture();

    expect(testInfo.attach).not.toHaveBeenCalled();
  });

  it('still disposes when the attachment fails', async () => {
    // Diagnostics are a convenience; a failed attachment must not strand the
    // dialog listener on the page.
    mockRecords = [{ type: 'confirm', message: 'x', handledBy: 'observed', action: 'observed' }];
    const testInfo = createTestInfo();
    testInfo.attach.mockRejectedValue(new Error('testInfo unavailable'));

    await runFixture(testInfo);

    expect(mockDispose).toHaveBeenCalledOnce();
  });
});
