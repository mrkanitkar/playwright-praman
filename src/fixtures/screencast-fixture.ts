/**
 * @license
 * Copyright (c) ZesTest 2025-2030. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0
 *
 * This file may contain AI-assisted code.
 * See LICENSE and NOTICE files for details.
 */

/**
 * Screencast fixture — Playwright 1.59 screencast API integration.
 *
 * @ai
 * @aiContext Wraps `page.screencast` (Playwright 1.59+) to provide structured
 * video recording with action annotations, UI5 control-tree overlays, and
 * real-time frame streaming for AI vision pipelines.
 *
 * @remarks
 * Provides the `screencast` fixture with four capabilities:
 *
 * 1. **Chapters** — `showChapter(title)` marks logical sections in the video.
 *    Designed to be called inside `test.step()` bodies so the video matches
 *    the test structure.
 *
 * 2. **Actions** — `showActions(options?)` enables DOM-level action annotations
 *    (click, fill, etc.) in the video stream.
 *
 * 3. **UI5 overlay** — `showUI5ControlTree(enabled?)` toggles a visual overlay
 *    of the current UI5 control tree on each video frame (Phase 1: state only).
 *
 * 4. **Frame streaming** — `onFrame(handler)` registers a callback for every
 *    raw video frame (JPEG/PNG buffer) enabling AI vision analysis in real-time.
 *    Internally starts `page.screencast.start({ onFrame })` if not yet active.
 *
 * Cross-fixture dependency: `rootLogger` is declared as a `{ option: true }`
 * placeholder (PW-MERGE-1) so it can be provided by `coreTest` via `mergeTests()`.
 *
 * @example
 * ```typescript
 * import { screencastTest } from '#fixtures/screencast-fixture.js';
 * import { mergeTests } from '@playwright/test';
 * import { coreTest } from '#fixtures/core-fixtures.js';
 *
 * const test = mergeTests(coreTest, screencastTest);
 *
 * test('purchase order workflow', async ({ page, screencast }) => {
 *   await screencast.showChapter('Navigate to PO list');
 *   await page.goto('/fiori#PurchaseOrder-manage');
 *
 *   await screencast.showChapter('Create new PO');
 *   screencast.onFrame(async (frame) => {
 *     // Send frame to AI vision pipeline
 *   });
 * });
 * ```
 *
 * @module fixtures
 */

import type { Buffer } from 'node:buffer';

import { test as base } from '@playwright/test';
import type { Page, Screencast } from '@playwright/test';
import type { Logger } from 'pino';

import { PramanError } from '#core/errors/base.js';
import { ErrorCode } from '#core/errors/codes.js';
import { createLogger } from '#core/logging/index.js';

// ── Types ───────────────────────────────────────────────────────────────────

/**
 * Raw video frame data passed to `onFrame` handlers.
 *
 * @example
 * ```typescript
 * screencast.onFrame(async ({ buffer, timestamp }) => {
 *   await sendToAIVision(buffer);
 * });
 * ```
 */
export interface ScreencastFrame {
  /** Raw JPEG frame data as returned by `page.screencast.start({ onFrame })`. */
  readonly buffer: Buffer;
  /** Monotonic timestamp in milliseconds since the fixture was set up. */
  readonly timestamp: number;
}

/** Callback type for frame streaming. */
export type ScreencastFrameHandler = (frame: ScreencastFrame) => Promise<void> | void;

/**
 * Options for `showActions()`.
 *
 * @remarks
 * Mirrors the Playwright 1.59 `Screencast.showActions()` options object.
 *
 * @example
 * ```typescript
 * screencast.showActions({ position: 'bottom', duration: 1000 });
 * ```
 */
export interface ShowActionsOptions {
  /** How long each annotation is displayed in milliseconds. Defaults to `500`. */
  readonly duration?: number;
  /** Font size of the action title in pixels. Defaults to `24`. */
  readonly fontSize?: number;
  /** Position of the action title overlay. Defaults to `'top-right'`. */
  readonly position?: 'top-left' | 'top' | 'top-right' | 'bottom-left' | 'bottom' | 'bottom-right';
}

/**
 * The `screencast` fixture API exposed to test bodies.
 *
 * @remarks
 * All methods are safe to call even when `page.screencast` is not available in
 * older Playwright versions — they degrade gracefully with a debug log.
 *
 * @intent Provide structured video recording with AI-first frame streaming
 * @capability screencast, video-chapters, ui5-overlay, ai-vision
 *
 * @example
 * ```typescript
 * test('purchase order', async ({ screencast }) => {
 *   await screencast.showChapter('Login');
 *   await screencast.showActions({ position: 'bottom' });
 *   screencast.onFrame(async (frame) => {
 *     await analyzeWithAI(frame.buffer);
 *   });
 * });
 * ```
 */
export interface ScreencastFixture {
  /**
   * Marks a new chapter in the video at the current timestamp.
   *
   * @remarks
   * Chapters create labelled overlays in the video. Call at the start of each
   * logical test section. Requires Playwright 1.59+ — silently no-ops on older
   * versions.
   *
   * @param title - Human-readable chapter title shown in the video overlay.
   * @returns Promise that resolves once the chapter marker is applied.
   *
   * @example
   * ```typescript
   * await screencast.showChapter('Open purchase order form');
   * await page.goto('/fiori#PurchaseOrder-create');
   * ```
   */
  showChapter: (title: string) => Promise<void>;

  /**
   * Enables DOM action annotations in the video.
   *
   * @remarks
   * Playwright 1.59+ only. Annotates click, fill, and keyboard events on the
   * video frames. Uses the Playwright `showActions()` options object.
   *
   * @param options - Optional display configuration.
   * @returns Promise that resolves once actions are enabled.
   *
   * @example
   * ```typescript
   * await screencast.showActions({ position: 'bottom', duration: 800 });
   * await page.getByRole('button', { name: 'Save' }).click();
   * ```
   */
  showActions: (options?: ShowActionsOptions) => Promise<void>;

  /**
   * Enables or disables the UI5 control-tree overlay on video frames.
   *
   * @remarks
   * When enabled, records a flag that downstream frame handlers or a bridge
   * extension can use to annotate each frame with the current UI5 control tree.
   * Phase 1 implementation — overlay injection is handled by frame handlers.
   *
   * @param enabled - `true` to enable, `false` to disable (default).
   *
   * @example
   * ```typescript
   * screencast.showUI5ControlTree(true);
   * ```
   */
  showUI5ControlTree: (enabled?: boolean) => void;

  /**
   * Registers a handler called for every raw video frame.
   *
   * @remarks
   * Handlers receive a {@link ScreencastFrame} with a JPEG buffer and a
   * monotonic timestamp. Multiple handlers can be registered; they are called
   * in registration order. Errors from handlers are caught and logged at
   * `debug` level (non-fatal). Calling this method starts
   * `page.screencast.start({ onFrame })` if it has not been started yet.
   *
   * @param handler - Async function or sync function receiving each frame.
   *
   * @example
   * ```typescript
   * screencast.onFrame(async ({ buffer }) => {
   *   const analysis = await aiVision.analyze(buffer);
   *   if (analysis.anomaly) { throw new Error(analysis.reason); }
   * });
   * ```
   */
  onFrame: (handler: ScreencastFrameHandler) => void;
}

/**
 * Test-scoped fixture types for the screencast layer.
 *
 * @example
 * ```typescript
 * import type { ScreencastFixtures } from '#fixtures/screencast-fixture.js';
 * ```
 */
export interface ScreencastFixtures {
  /** Screencast controller for the current test. */
  screencast: ScreencastFixture;
}

/**
 * Worker-level dependencies provided by coreTest via mergeTests.
 */
export interface ScreencastWorkerDeps {
  /** Root pino logger (PW-MERGE-1 placeholder). */
  rootLogger: Logger;
}

// ── Internal Playwright 1.59 screencast shape ─────────────────────────────

/**
 * Minimal safe structural accessor for the Playwright Screencast object.
 *
 * @remarks
 * Used only to check for the presence of methods at runtime without
 * extending the actual `Screencast` interface (which would trigger
 * `TS2430` if signatures differ from the real Playwright types).
 */
type ScreencastApi = Pick<Screencast, 'showChapter' | 'showActions' | 'start' | 'stop'>;

// ── Fixture definition ──────────────────────────────────────────────────────

/**
 * Playwright test object extended with the `screencast` fixture.
 *
 * @remarks
 * Extends the base Playwright test with a `screencast` test-scoped fixture
 * wrapping the Playwright 1.59 `page.screencast` API.
 *
 * Compose with `coreTest` via `mergeTests()` to inject `rootLogger`:
 *
 * ```typescript
 * const test = mergeTests(coreTest, screencastTest);
 * ```
 *
 * @intent Provide structured video recording with real-time AI frame streaming
 * @capability screencast-fixture
 *
 * @example
 * ```typescript
 * import { screencastTest } from 'playwright-praman';
 *
 * screencastTest('UI5 form workflow', async ({ screencast }) => {
 *   await screencast.showChapter('Open form');
 *   await screencast.showActions({ position: 'bottom' });
 * });
 * ```
 */
export const screencastTest = base.extend<ScreencastFixtures, ScreencastWorkerDeps>({
  // ── Cross-fixture option placeholder (PW-MERGE-1) ──────────────────────
  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion -- PW-MERGE-1: placeholder overridden by mergeTests with coreTest
  rootLogger: [undefined!, { option: true, scope: 'worker' }],

  // ── screencast fixture ───────────────────────────────────────────────────
  screencast: async (
    { page, rootLogger }: { page: Page; rootLogger: Logger },
    use: (value: ScreencastFixture) => Promise<void>,
  ) => {
    // Use fallback logger when rootLogger is the undefined! placeholder (standalone usage)
    const log: Logger =
      // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition, eqeqeq -- rootLogger may be undefined at runtime when used without mergeTests(coreTest)
      rootLogger != null ? createLogger('screencast', rootLogger) : createLogger('screencast');

    // Access the Playwright 1.59 screencast API.
    // `Page` from `@playwright/test` does not yet declare `screencast` in its typings,
    // but `playwright-core` exposes it at runtime in 1.59+. A single intersection cast
    // informs TypeScript that `screencast` may be present — this is NOT a double-cast.
    // The `?` makes it optional to handle gracefully on Playwright < 1.59.
    const pwScreencast = (page as Page & { screencast?: ScreencastApi }).screencast;

    // State tracking
    let ui5OverlayEnabled = false;
    const frameHandlers: ScreencastFrameHandler[] = [];
    let screencastStarted = false;
    let startTimestamp = 0;

    /**
     * Internal frame dispatcher — called by the Playwright `onFrame` callback.
     * Forwards frames to all registered handlers in registration order.
     */
    const dispatchFrame = (data: { data: Buffer }): void => {
      if (frameHandlers.length === 0) return;
      const frame: ScreencastFrame = {
        buffer: data.data,
        timestamp: Date.now() - startTimestamp,
      };
      for (const handler of frameHandlers) {
        void (async () => {
          try {
            await handler(frame);
          } catch (error: unknown) {
            log.debug({ err: error }, 'Screencast frame handler failed (non-fatal)');
          }
        })();
      }
    };

    // ── Public API ────────────────────────────────────────────────────────

    const showChapter = async (title: string): Promise<void> => {
      log.debug({ title }, 'Screencast chapter');

      // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition, eqeqeq -- runtime check for optional Playwright 1.59 API
      if (pwScreencast?.showChapter == null) {
        log.debug(
          { title },
          'page.screencast.showChapter() unavailable (Playwright 1.59+ required) — skipped',
        );
        return;
      }

      try {
        await pwScreencast.showChapter(title);
      } catch (error: unknown) {
        throw new PramanError({
          code: ErrorCode.ERR_SCREENCAST_CHAPTER_FAILED,
          message: `showChapter('${title}') failed: ${error instanceof Error ? error.message : String(error)}`,
          attempted: `Set screencast chapter title to "${title}"`,
          retryable: false,
          ...(error instanceof Error ? { cause: error } : {}),
          suggestions: [
            'Verify Playwright 1.59+ is installed',
            'Check that the page is not in a closed/destroyed state',
          ],
          details: { title },
        });
      }
    };

    const showActions = async (options?: ShowActionsOptions): Promise<void> => {
      log.debug({ options }, 'Screencast action annotations');

      // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition, eqeqeq -- runtime check for optional Playwright 1.59 API
      if (pwScreencast?.showActions == null) {
        log.debug(
          { options },
          'page.screencast.showActions() unavailable (Playwright 1.59+ required) — skipped',
        );
        return;
      }

      await pwScreencast.showActions(options);
    };

    const showUI5ControlTree = (enabled = true): void => {
      ui5OverlayEnabled = enabled;
      log.debug({ enabled }, 'Screencast UI5 control tree overlay');
      // Phase 1: stores the flag for frame handlers and future bridge extension.
    };

    const onFrame = (handler: ScreencastFrameHandler): void => {
      // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition, eqeqeq -- runtime check for optional Playwright 1.59 API
      if (pwScreencast == null) {
        throw new PramanError({
          code: ErrorCode.ERR_SCREENCAST_NOT_STARTED,
          message:
            'page.screencast is not available — cannot register frame handler (requires Playwright 1.59+)',
          attempted: 'Register screencast frame handler via onFrame()',
          retryable: false,
          suggestions: [
            'Upgrade Playwright to 1.59 or later: npm install -D @playwright/test@latest',
          ],
          details: { playwrightScreencastAvailable: 'false' },
        });
      }

      frameHandlers.push(handler);
      log.debug({ handlerCount: frameHandlers.length }, 'Screencast frame handler registered');

      // Start the screencast lazily when the first frame handler is registered
      if (!screencastStarted) {
        screencastStarted = true;
        startTimestamp = Date.now();
        void (async () => {
          try {
            await pwScreencast.start({ onFrame: dispatchFrame });
          } catch (error: unknown) {
            throw new PramanError({
              code: ErrorCode.ERR_SCREENCAST_FRAME_HANDLER,
              message: `page.screencast.start() failed: ${error instanceof Error ? error.message : String(error)}`,
              attempted: 'Start screencast for frame streaming via page.screencast.start()',
              retryable: false,
              ...(error instanceof Error ? { cause: error } : {}),
              suggestions: [
                'Verify Playwright 1.59+ is installed',
                'Check that the page supports screencast (Chromium only in PW 1.59)',
              ],
              details: { handlerCount: String(frameHandlers.length) },
            });
          }
        })();
      }
    };

    try {
      await use({ showChapter, showActions, showUI5ControlTree, onFrame });
    } finally {
      // Teardown: stop screencast if started
      // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition, eqeqeq -- runtime check for optional Playwright 1.59 API
      if (screencastStarted && pwScreencast?.stop != null) {
        try {
          await pwScreencast.stop();
        } catch (error: unknown) {
          log.debug({ err: error }, 'page.screencast.stop() failed during teardown (non-fatal)');
        }
      }

      log.debug(
        { ui5OverlayEnabled, frameHandlerCount: frameHandlers.length, screencastStarted },
        'Screencast fixture teardown complete',
      );
    }
  },
});
