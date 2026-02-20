/**
 * Context builder — enriches bulk-discovered page state with UI5 version.
 *
 * @remarks
 * Orchestrates `discoverPage()` with an additional `page.evaluate()` call to
 * read the UI5 framework version string from the browser. The version is
 * merged into the `PageContext` via a conditional spread so that the
 * `ui5Version` field is only set when the browser call succeeds.
 *
 * @module ai
 */

import { discoverPage } from './bulk-discovery.js';
import type { DiscoveryPage } from './bulk-discovery.js';
import type { AiResponse, PageContext } from './types.js';

import type { PramanConfig } from '#core/config/schema.js';

// ── Helper: read UI5 version from browser ─────────────────────────────────

/**
 * Attempts to read the UI5 framework version from the browser.
 *
 * @remarks
 * Returns `undefined` when the browser call fails (e.g., non-UI5 page).
 *
 * @param page - Playwright page (or structural equivalent).
 * @returns UI5 version string, or `undefined` on failure.
 */
async function readUi5Version(page: DiscoveryPage): Promise<string | undefined> {
  try {
    const rawVersion = await page.evaluate(
      /* v8 ignore start -- browser-context: executed in Chromium, not Node.js */
      (() => {
        interface SapWindow {
          sap?: {
            ui?: {
              version?: string;
              getVersionInfo?: () => { version?: string } | undefined;
            };
          };
        }
        const w = window as unknown as SapWindow;
        const direct = w.sap?.ui?.version;
        if (typeof direct === 'string' && direct.length > 0) return direct;
        try {
          const info = w.sap?.ui?.getVersionInfo?.();
          const v = info?.version;
          if (typeof v === 'string' && v.length > 0) return v;
        } catch {
          // ignore
        }
        return undefined;
      }) as (...args: never[]) => unknown,
      /* v8 ignore stop */
    );
    return typeof rawVersion === 'string' ? rawVersion : undefined;
  } catch {
    // Version detection is best-effort — silently omit on failure
    return undefined;
  }
}

// ── Main export ────────────────────────────────────────────────────────────

/**
 * Builds a complete AI `PageContext` from the current Playwright page state.
 *
 * @remarks
 * Combines bulk control discovery with UI5 version detection. The UI5 version
 * is read via a separate `page.evaluate()` call and merged into the returned
 * `PageContext` only when it is available. If the version call fails (e.g. the
 * page is not a UI5 application), the context is still returned successfully
 * without `ui5Version`.
 *
 * Uses `config.controlDiscoveryTimeout` as the discovery timeout.
 *
 * @param page - Playwright `Page` instance (or any structural equivalent).
 * @param config - Readonly Praman configuration (used for timeout).
 * @returns `AiResponse<PageContext>` — matches the shape returned by
 *   `discoverPage()`, potentially enriched with `ui5Version`.
 *
 * @intent Build AI context from current page UI5 state
 * @capability ai-context-building
 * @sapModule All
 *
 * @example
 * ```typescript
 * import { buildPageContext } from '#ai/context-builder.js';
 *
 * const response = await buildPageContext(page, config);
 * if (response.status === 'success') {
 *   console.log('UI5 version:', response.data.ui5Version ?? 'unknown');
 *   console.log('Controls found:', response.data.controls.length);
 * }
 * ```
 */
export async function buildPageContext(
  page: DiscoveryPage,
  config: Readonly<PramanConfig>,
): Promise<AiResponse<PageContext>> {
  const timeout = config.controlDiscoveryTimeout;

  // ── Step 1: Bulk discovery ─────────────────────────────────────────────
  const discoveryResult = await discoverPage(page, { timeout });

  if (discoveryResult.status !== 'success') {
    return discoveryResult;
  }

  // ── Step 2: UI5 version detection (best-effort) ────────────────────────
  const ui5Version = await readUi5Version(page);

  // ── Step 3: Enrich PageContext with ui5Version ─────────────────────────
  const enrichedContext: PageContext = {
    ...discoveryResult.data,
    ...(ui5Version !== undefined && { ui5Version }),
  };

  return {
    status: 'success',
    data: enrichedContext,
    metadata: discoveryResult.metadata,
  };
}
