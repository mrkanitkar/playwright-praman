/**
 * @license
 * Copyright (c) ZesTest 2025-2030. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0
 *
 * This file may contain AI-assisted code.
 * See LICENSE and NOTICE files for details.
 */

/**
 * Interactive UI5 control inspector for the Praman CLI.
 *
 * @remarks
 * Launches a headed browser, navigates to the target URL, injects the Praman
 * bridge, and activates a click-capture overlay. When the user clicks a UI5
 * control the inspector retrieves full metadata (type, properties, bindings,
 * selectors) and displays a formatted report in the terminal.
 *
 * @module cli/inspect
 */

import process from 'node:process';

import type { Browser, BrowserContext, Page } from '@playwright/test';
import { chromium, firefox, webkit } from '@playwright/test';

import type { ControlMetaResult, InspectorState } from './inspect-commands.js';
import {
  buildSelectors,
  dispatchInspectorKey,
  parseViewport,
  printReport,
} from './inspect-commands.js';
import { logBanner, logError, logSuccess, logWarn } from './logger.js';
import { getVersion } from './version.js';

import { createInspectControlScript } from '#bridge/browser-scripts/inspect-control.js';
import { injectBridge } from '#bridge/injection.js';

// ── Types ─────────────────────────────────────────────────────────────────────

/**
 * Options for the `inspect` CLI command.
 *
 * @example
 * ```typescript
 * const opts: InspectOptions = {
 *   url: 'https://my-sap.example.com/Fiori',
 *   auth: '.auth/user.json',
 *   browser: 'chromium',
 *   timeout: 30_000,
 *   viewport: '1920x1080',
 * };
 * ```
 */
export interface InspectOptions {
  /** Target URL to open. Falls back to `PRAMAN_BASE_URL` env var when omitted. */
  readonly url?: string;
  /** Path to a Playwright storageState JSON file for authentication. */
  readonly auth?: string;
  /** Browser engine to use. Defaults to `chromium`. */
  readonly browser?: 'chromium' | 'firefox' | 'webkit';
  /** UI5 bootstrap timeout in milliseconds. Defaults to `30_000`. */
  readonly timeout?: number;
  /** Viewport as `WIDTHxHEIGHT` string. Defaults to `1920x1080`. */
  readonly viewport?: string;
}

/** Click message when a UI5 control was found. */
interface ClickFoundMessage {
  readonly found: true;
  readonly id: string;
  readonly controlType: string;
}

/** Click message when the element is not a UI5 control. */
interface ClickMissMessage {
  readonly found: false;
  readonly tagName: string;
  readonly id: string | null;
}

/** Shape of the JSON payload the click overlay sends via `console.log`. */
type ClickMessage = ClickFoundMessage | ClickMissMessage;

// ── Constants ─────────────────────────────────────────────────────────────────

const INSPECT_MARKER = '__PRAMAN_INSPECT__:';
const READY_MARKER = '__PRAMAN_INSPECTOR_READY__';

/** Browser-side IIFE: intercepts clicks, resolves UI5 controls, sends JSON to Node. */
const CLICK_OVERLAY_SCRIPT = `(function() {
  if (window.__praman_inspect_active) { return; }
  window.__praman_inspect_active = true;

  function hl(el) {
    var p = document.getElementById('__praman_hl');
    if (p) { p.remove(); }
    if (!el) { return; }
    var r = el.getBoundingClientRect();
    var d = document.createElement('div');
    d.id = '__praman_hl';
    d.style.cssText = 'position:fixed;border:2px solid #0070f3;background:rgba(0,112,243,0.08);' +
      'pointer-events:none;z-index:2147483647;top:' + r.top + 'px;left:' + r.left + 'px;' +
      'width:' + r.width + 'px;height:' + r.height + 'px;';
    document.body.appendChild(d);
  }

  function findCtrl(el) {
    try {
      if (typeof sap === 'undefined' || !sap.ui) { return null; }
      if (sap.ui.core && sap.ui.core.Element &&
          typeof sap.ui.core.Element.closestTo === 'function') {
        var c = sap.ui.core.Element.closestTo(el, true);
        if (c) { return c; }
      }
      var cur = el;
      while (cur && cur !== document.documentElement) {
        if (cur.id) {
          var reg = (sap.ui.core && sap.ui.core.Element && sap.ui.core.Element.registry) ||
                    (sap.ui.core && sap.ui.core.ElementRegistry);
          var f = reg ? reg.get(cur.id) : (sap.ui.getCore ? sap.ui.getCore().byId(cur.id) : null);
          if (f) { return f; }
        }
        cur = cur.parentElement;
      }
    } catch (_) {}
    return null;
  }

  document.addEventListener('click', function(e) {
    e.preventDefault(); e.stopPropagation();
    var ctrl = findCtrl(e.target);
    if (ctrl) {
      var dr = typeof ctrl.getDomRef === 'function' ? ctrl.getDomRef() : null;
      hl(dr || e.target);
      var id = typeof ctrl.getId === 'function' ? ctrl.getId() : null;
      var t = ctrl.getMetadata ? ctrl.getMetadata().getName() : 'unknown';
      console.log('__PRAMAN_INSPECT__:' + JSON.stringify({ found: true, id: id, controlType: t }));
    } else {
      hl(e.target);
      console.log('__PRAMAN_INSPECT__:' + JSON.stringify({ found: false, tagName: e.target.tagName, id: e.target.id || null }));
    }
  }, true);

  console.log('__PRAMAN_INSPECTOR_READY__');
})();`;

// ── Helpers ───────────────────────────────────────────────────────────────────

function resolveBrowserType(name: string | undefined): typeof chromium {
  if (name === 'firefox') return firefox;
  if (name === 'webkit') return webkit;
  return chromium;
}

async function handleConsoleMsg(text: string, page: Page, state: InspectorState): Promise<void> {
  if (text === READY_MARKER) {
    logSuccess('Inspector overlay ready — click elements in the browser');
    return;
  }
  if (!text.startsWith(INSPECT_MARKER)) {
    return;
  }

  let clickMsg: ClickMessage;
  try {
    clickMsg = JSON.parse(text.slice(INSPECT_MARKER.length)) as ClickMessage;
  } catch {
    return;
  }

  if (!clickMsg.found) {
    logWarn(`Clicked non-UI5 element: <${clickMsg.tagName}>`);
    return;
  }

  const controlId = clickMsg.id;
  if (controlId.length === 0) {
    return;
  }

  try {
    const script = createInspectControlScript().replace(
      /\)\(\)$/,
      `)(${JSON.stringify(controlId)})`,
    );
    const raw = await page.evaluate(script);
    const meta = raw as ControlMetaResult | null;
    if (meta === null) {
      logWarn(`No metadata for: ${controlId}`);
      return;
    }
    state.lastMeta = meta;
    state.lastSelectors = buildSelectors(meta);
    printReport(meta, state.lastSelectors);
  } catch (err: unknown) {
    logError(`Inspection failed: ${err instanceof Error ? err.message : String(err)}`);
  }
}

// ── Main Command ──────────────────────────────────────────────────────────────

/**
 * Runs the interactive `inspect` command in a headed browser session.
 *
 * @remarks
 * Launches a Playwright browser (headed), navigates to the target URL,
 * waits for UI5 to load, injects the Praman bridge, and activates a
 * click capture overlay. Blocks until the user presses `q`, Ctrl-C, or
 * closes the browser window.
 *
 * @param opts - Inspector configuration: URL, auth, browser, timeout, viewport.
 * @throws Error when no URL is provided and `PRAMAN_BASE_URL` is not set.
 *
 * @example
 * ```typescript
 * await runInspect({
 *   url: 'https://my-sap.example.com/Fiori',
 *   auth: '.auth/user.json',
 * });
 * ```
 */
export async function runInspect(opts: InspectOptions): Promise<void> {
  const targetUrl = opts.url ?? process.env['PRAMAN_BASE_URL'] ?? '';
  if (targetUrl.length === 0) {
    throw new Error(
      'No URL provided. Pass a URL argument or set PRAMAN_BASE_URL environment variable.',
    );
  }

  logBanner('Praman Inspector', getVersion());

  const state: InspectorState = { lastMeta: null, lastSelectors: [] };
  const browserType = resolveBrowserType(opts.browser);
  const viewport = parseViewport(opts.viewport ?? '1920x1080');

  let browser: Browser | undefined;
  let context: BrowserContext | undefined;
  let page: Page | undefined;

  const cleanup = async (): Promise<void> => {
    if (process.stdin.isTTY) {
      process.stdin.setRawMode(false);
    }
    process.stdin.pause();
    await browser?.close();
  };

  try {
    browser = await browserType.launch({ headless: false });

    context = await browser.newContext(
      opts.auth !== undefined ? { viewport, storageState: opts.auth } : { viewport },
    );

    page = await context.newPage();
    await page.goto(targetUrl);
    await injectBridge(page);
    await page.evaluate(CLICK_OVERLAY_SCRIPT);
    logSuccess('Bridge injected. Press h for help, q to quit.');

    const activePage = page;
    activePage.on('console', (msg) => {
      void handleConsoleMsg(msg.text(), activePage, state);
    });

    if (process.stdin.isTTY) {
      process.stdin.setRawMode(true);
    }
    process.stdin.resume();
    process.stdin.setEncoding('utf8');

    await new Promise<void>((resolve) => {
      process.stdin.on('data', (key: string) => {
        dispatchInspectorKey(key, page, state, resolve);
      });
      if (browser !== undefined) {
        browser.on('disconnected', () => {
          resolve();
        });
      }
    });
  } finally {
    await cleanup();
  }
}
