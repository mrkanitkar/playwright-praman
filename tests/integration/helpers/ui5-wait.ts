/**
 * @license
 * Copyright (c) ZesTest 2025-2030. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0
 *
 * This file may contain AI-assisted code.
 * See LICENSE and NOTICE files for details.
 */

import type { Page } from '@playwright/test';

/**
 * Navigates to a URL and waits for the UI5 framework to become available.
 *
 * Waits for `sap.ui.require` — the same check used by `injectBridge()`.
 * Uses `domcontentloaded` instead of `load` because UI5 continues async
 * loading after DOMContentLoaded.
 */
export async function navigateAndWaitForUI5(
  page: Page,
  url: string,
  options?: { timeout?: number },
): Promise<void> {
  const timeout = options?.timeout ?? 30_000;
  await page.goto(url, { waitUntil: 'domcontentloaded', timeout });

  // Phase 1: Wait for UI5 framework to load
  await page.waitForFunction(
    'typeof sap !== "undefined" && sap.ui && typeof sap.ui.require === "function"',
    { timeout },
  );

  // Phase 2: Wait for actual UI controls to render (not just infrastructure)
  // UI5 apps load async: ComponentContainer → XMLView → actual controls.
  // Infrastructure controls (ComponentContainer, XMLView, TitleProvider) appear early;
  // real UI controls (sap.m.*, sap.f.*) appear only after the component bootstraps its views.
  await page.waitForFunction(
    `(function() {
    if (!sap.ui.core || !sap.ui.core.Element) return false;
    var reg = sap.ui.core.Element.registry;
    if (!reg || !reg.all) return false;
    var all = reg.all();
    for (var id in all) {
      var ctrl = all[id];
      if (ctrl.getMetadata) {
        var name = ctrl.getMetadata().getName();
        if (name.indexOf('sap.m.') === 0 || name.indexOf('sap.f.') === 0) {
          return true;
        }
      }
    }
    return false;
  })()`,
    { timeout },
  );
}
