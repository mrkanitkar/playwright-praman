/**
 * ShellHandler -- shell header operations for SAP Fiori Launchpad.
 *
 * @remarks
 * Thin wrapper over `page.evaluate()` that targets well-known Fiori shell
 * header DOM elements: `#shell-header`, `#shell-header-logo`, and the
 * user avatar button (`#meAreaHeaderButton`).
 *
 * Uses {@link NavigationError} for all failures (shell is a navigation concern).
 *
 * @example
 * ```typescript
 * import { ShellHandler } from '#fixtures/shell-handler.js';
 *
 * const shell = new ShellHandler({ page });
 * await shell.expectShellHeader();
 * await shell.clickHome();
 * await shell.openUserMenu();
 * ```
 *
 * @module fixtures
 */

import type { Page } from '@playwright/test';
import type { Logger } from 'pino';

import { BRIDGE_GLOBALS, BRIDGE_TIMEOUTS } from '#bridge/bridge-constants.js';
import { ensureBridgeInjected } from '#bridge/injection.js';
import { ErrorCode } from '#core/errors/codes.js';
import { NavigationError } from '#core/errors/navigation-error.js';
import { createLogger } from '#core/logging/logger.js';
import { ui5Step } from '#core/utils/step-decorator.js';

/**
 * Options for constructing a ShellHandler.
 *
 * @ai
 * @aiContext Configuration for creating a ShellHandler instance.
 *
 * @example
 * ```typescript
 * const options: ShellHandlerOptions = { page };
 * ```
 */
export interface ShellHandlerOptions {
  readonly page: Page;
}

/**
 * Shell header operations for SAP Fiori Launchpad.
 *
 * @ai
 * @aiContext Use for FLP shell header actions: home, user menu, notifications.
 *
 * @remarks
 * Provides methods to verify the shell header visibility, navigate home,
 * and open the user menu. All operations use `page.evaluate()` for
 * browser-side DOM queries targeting well-known Fiori shell selectors.
 *
 * @example
 * ```typescript
 * const shell = new ShellHandler({ page });
 * await shell.expectShellHeader();
 * await shell.clickHome();
 * ```
 */
export class ShellHandler {
  private readonly page: Page;
  private readonly log: Logger;

  constructor(options: ShellHandlerOptions) {
    this.page = options.page;
    this.log = createLogger('shell-handler');
  }

  /**
   * Verifies the shell header is visible on the page.
   *
   * @ai
   * @aiContext Use to assert the FLP shell header is rendered.
   *
   * @throws NavigationError if the shell header element is not found.
   *
   * @example
   * ```typescript
   * await shell.expectShellHeader();
   * ```
   */
  @ui5Step
  async expectShellHeader(): Promise<void> {
    this.log.debug('Checking shell header visibility');

    const visible = await this.page.evaluate(
      /* v8 ignore start -- browser-context function */
      () => {
        const el =
          document.querySelector('#shell-header') ?? document.querySelector('.sapUshellShellHead');
        return el !== null;
      },
      /* v8 ignore stop */
    );

    if (!visible) {
      throw new NavigationError({
        code: ErrorCode.ERR_NAV_ROUTE_FAILED,
        message: 'Shell header is not visible on the page',
        attempted: 'Verify Fiori Launchpad shell header is present',
        retryable: true,
        suggestions: [
          'Ensure the page is a Fiori Launchpad application',
          'Wait for the page to fully load before checking the shell',
          'Verify the user is authenticated and the FLP has rendered',
        ],
      });
    }
  }

  /**
   * Clicks the shell home button to navigate to the FLP home page.
   *
   * @ai
   * @aiContext Use to navigate to the FLP home page via shell logo.
   *
   * @remarks
   * Targets `#shell-header-logo` or `.sapUshellShellHeadItm` (Fiori 2.0/3.0).
   * Waits for UI5 stability after clicking.
   *
   * @example
   * ```typescript
   * await shell.clickHome();
   * ```
   */
  @ui5Step
  async clickHome(): Promise<void> {
    this.log.debug('Clicking shell home button');

    await this.page.evaluate(
      /* v8 ignore start -- browser-context function */
      () => {
        const btn =
          document.querySelector('#shell-header-logo') ??
          document.querySelector('.sapUshellShellHeadItm');
        if (btn instanceof HTMLElement) {
          btn.click();
        }
      },
      /* v8 ignore stop */
    );

    await this.waitForUI5Stable();
  }

  /**
   * Waits for UI5 to become stable via page.waitForFunction().
   */
  private async waitForUI5Stable(): Promise<void> {
    await ensureBridgeInjected(this.page);
    const ns = BRIDGE_GLOBALS.NAMESPACE;
    await this.page.waitForFunction(
      `(function() {
        var bridge = window.${ns};
        if (!bridge) return false;
        if (typeof sap === 'undefined' || !sap.ui) return false;
        try {
          var pending = sap.ui.getCore().getUIDirty();
          return !pending;
        } catch (e) {
          return true;
        }
      })()`,
      { timeout: BRIDGE_TIMEOUTS.UI5_STABLE },
    );
  }

  /**
   * Opens the notifications panel by clicking the notifications icon.
   *
   * @ai
   * @aiContext Use to open the FLP notifications panel.
   *
   * @throws NavigationError if the notifications icon is not found.
   *
   * @example
   * ```typescript
   * await shell.openNotifications();
   * ```
   */
  @ui5Step
  async openNotifications(): Promise<void> {
    this.log.debug('Opening notifications panel');

    const found = await this.page.evaluate(
      /* v8 ignore start -- browser-context function */
      () => {
        const btn =
          document.querySelector('#NotificationsCountButton') ??
          document.querySelector('.sapUshellNotificationsCountButton') ??
          document.querySelector('#shell-header-notifications');
        if (btn instanceof HTMLElement) {
          btn.click();
          return true;
        }
        return false;
      },
      /* v8 ignore stop */
    );

    if (!found) {
      throw new NavigationError({
        code: ErrorCode.ERR_NAV_ROUTE_FAILED,
        message: 'Notifications icon not found in shell header',
        attempted: 'Open notifications panel via shell header',
        retryable: true,
        suggestions: [
          'Verify the shell header is visible (use expectShellHeader() first)',
          'Check if notifications are enabled in the Fiori Launchpad configuration',
          'Ensure the user has permissions to view notifications',
        ],
      });
    }
  }

  /**
   * Opens the user menu by clicking the user avatar button.
   *
   * @ai
   * @aiContext Use to open the user menu for profile or settings access.
   *
   * @throws NavigationError if the user avatar button is not found.
   *
   * @example
   * ```typescript
   * await shell.openUserMenu();
   * ```
   */
  @ui5Step
  async openUserMenu(): Promise<void> {
    this.log.debug('Opening user menu');

    const found = await this.page.evaluate(
      /* v8 ignore start -- browser-context function */
      () => {
        const avatar =
          document.querySelector('#meAreaHeaderButton') ??
          document.querySelector('.sapUshellMeAreaHeaderButton');
        if (avatar instanceof HTMLElement) {
          avatar.click();
          return true;
        }
        return false;
      },
      /* v8 ignore stop */
    );

    if (!found) {
      throw new NavigationError({
        code: ErrorCode.ERR_NAV_ROUTE_FAILED,
        message: 'User avatar button not found in shell header',
        attempted: 'Open user menu via shell header avatar',
        retryable: true,
        suggestions: [
          'Verify the shell header is visible (use expectShellHeader() first)',
          'Check if the Fiori Launchpad uses a custom shell configuration',
          'Ensure the user has permissions to access the user menu',
        ],
      });
    }
  }
}
