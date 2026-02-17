/**
 * Bridge integration smoke tests — Sub-Phase 2.1 GATE.
 *
 * @remarks
 * Validates the bridge layer against real UI5 demo apps (no auth required).
 * Each test exercises a different bridge capability: injection, version
 * detection, stability, control discovery, and method execution.
 *
 * Target apps:
 * - Shopping Cart: `https://ui5.sap.com/test-resources/sap/m/demokit/cart/webapp/index.html`
 * - Worklist: `https://ui5.sap.com/test-resources/sap/m/demokit/worklist/webapp/test/mockServer.html`
 */
import type { Page } from '@playwright/test';
import { expect, test } from '@playwright/test';

import type { BridgePage } from '../../src/bridge/adapter.js';
import { BRIDGE_GLOBALS } from '../../src/bridge/bridge-constants.js';
import { ClassicUI5Adapter } from '../../src/bridge/classic-adapter.js';

const CART_URL = 'https://ui5.sap.com/test-resources/sap/m/demokit/cart/webapp/index.html';
const WORKLIST_URL =
  'https://ui5.sap.com/test-resources/sap/m/demokit/worklist/webapp/test/mockServer.html';

const UI5_WAIT = 'typeof sap !== "undefined" && sap.ui && typeof sap.ui.require === "function"';

/** Wraps a Playwright Page into a BridgePage for the adapter. */
function asBridgePage(page: Page): BridgePage {
  return {
    evaluate: async (script: string | (() => unknown)): Promise<unknown> =>
      page.evaluate(script as string),
    waitForFunction: async (
      fn: string | (() => unknown),
      options?: { readonly timeout?: number; readonly polling?: number },
    ): Promise<void> => {
      await page.waitForFunction(fn as string, undefined, {
        ...(options?.timeout !== undefined ? { timeout: options.timeout } : {}),
        ...(options?.polling !== undefined ? { polling: options.polling } : {}),
      });
    },
  } as BridgePage;
}

/** Navigate and wait for UI5 framework to be available. */
async function gotoAndWaitForUI5(page: Page, url: string): Promise<void> {
  await page.goto(url);
  await page.waitForFunction(UI5_WAIT, { timeout: 30_000 });
}

/** Navigate, init adapter, wait for UI5 stable. */
async function initAdapter(page: Page, url: string): Promise<ClassicUI5Adapter> {
  await gotoAndWaitForUI5(page, url);
  const bridgePage = asBridgePage(page);
  const adapter = new ClassicUI5Adapter();
  await adapter.init(bridgePage);
  await adapter.waitForUI5Stable(10_000);
  return adapter;
}

test.describe('Bridge smoke tests (UI5 demo apps)', () => {
  test.describe.configure({ mode: 'serial' });

  test('navigates to Shopping Cart and page loads', async ({ page }) => {
    await gotoAndWaitForUI5(page, CART_URL);
    const title = await page.title();
    expect(title).toBeTruthy();
  });

  test('injects bridge and confirms readiness', async ({ page }) => {
    await gotoAndWaitForUI5(page, CART_URL);
    const bridgePage = asBridgePage(page);
    const adapter = new ClassicUI5Adapter();
    await adapter.init(bridgePage);
    const ready = await adapter.isReady();
    expect(ready).toBe(true);
    const ns = BRIDGE_GLOBALS.NAMESPACE;
    const bridgeReady = await page.evaluate(`!!(window.${ns} && window.${ns}.ready)`);
    expect(bridgeReady).toBe(true);
  });

  test('detects UI5 version as valid semver', async ({ page }) => {
    await gotoAndWaitForUI5(page, CART_URL);
    const bridgePage = asBridgePage(page);
    const adapter = new ClassicUI5Adapter();
    await adapter.init(bridgePage);
    const version = await adapter.getUI5Version();
    expect(version).toMatch(/^\d+\.\d+\.\d+/);
  });

  test('waitForUI5Stable resolves', async ({ page }) => {
    const adapter = await initAdapter(page, CART_URL);
    expect(await adapter.isReady()).toBe(true);
  });

  test('finds control by controlType', async ({ page }) => {
    const adapter = await initAdapter(page, CART_URL);
    const controls = await adapter.findControls({ controlType: 'sap.m.Button' });
    expect(controls.length).toBeGreaterThan(0);
    expect(controls[0]?.controlType).toBe('sap.m.Button');
  });

  test('finds control in Worklist app', async ({ page }) => {
    const adapter = await initAdapter(page, WORKLIST_URL);
    const tables = await adapter.findControls({ controlType: 'sap.m.Table' });
    expect(tables.length).toBeGreaterThan(0);
  });

  test('executes getText on a Button control', async ({ page }) => {
    const adapter = await initAdapter(page, CART_URL);
    const buttons = await adapter.findControls({ controlType: 'sap.m.Button' });
    expect(buttons.length).toBeGreaterThan(0);
    const firstId = buttons[0]?.id;
    expect(firstId).toBeDefined();
    const result = await adapter.executeControlMethod(firstId ?? '', 'getText', []);
    expect(typeof result).toBe('string');
  });

  test('describeControl returns metadata', async ({ page }) => {
    const adapter = await initAdapter(page, CART_URL);
    const buttons = await adapter.findControls({ controlType: 'sap.m.Button' });
    expect(buttons.length).toBeGreaterThan(0);
    const btnId = buttons[0]?.id ?? '';
    const desc = await adapter.describeControl(btnId);
    expect(desc).toHaveProperty('id');
    expect(desc).toHaveProperty('controlType');
    expect(desc).toHaveProperty('properties');
  });

  test('getAvailableMethods returns method list', async ({ page }) => {
    const adapter = await initAdapter(page, CART_URL);
    const buttons = await adapter.findControls({ controlType: 'sap.m.Button' });
    expect(buttons.length).toBeGreaterThan(0);
    const btnId = buttons[0]?.id ?? '';
    const methods = await adapter.getAvailableMethods(btnId);
    expect(methods.length).toBeGreaterThan(0);
    expect(methods).toContain('getText');
  });

  test('adapter destroy cleans up', async ({ page }) => {
    await gotoAndWaitForUI5(page, CART_URL);
    const bridgePage = asBridgePage(page);
    const adapter = new ClassicUI5Adapter();
    await adapter.init(bridgePage);
    await adapter.destroy();
    const ready = await adapter.isReady();
    expect(ready).toBe(false);
  });

  test('isWebComponent returns false for classic app', async ({ page }) => {
    await gotoAndWaitForUI5(page, CART_URL);
    const bridgePage = asBridgePage(page);
    const adapter = new ClassicUI5Adapter();
    await adapter.init(bridgePage);
    expect(await adapter.isWebComponent()).toBe(false);
  });

  test('getControlProperty returns a value', async ({ page }) => {
    const adapter = await initAdapter(page, CART_URL);
    const buttons = await adapter.findControls({ controlType: 'sap.m.Button' });
    expect(buttons.length).toBeGreaterThan(0);
    const btnId = buttons[0]?.id ?? '';
    const text = await adapter.getControlProperty(btnId, 'text');
    expect(typeof text).toBe('string');
  });
});
