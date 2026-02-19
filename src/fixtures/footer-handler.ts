/**
 * FooterHandler -- footer bar button operations for SAP Fiori apps.
 *
 * @remarks
 * Thin wrapper over `page.evaluate()` that clicks well-known footer bar
 * buttons by their text content. Targets `.sapMBarChild .sapMBtn` elements
 * in the footer bar area.
 *
 * Uses {@link ControlError} for button-not-found failures (footer buttons
 * are UI5 controls).
 *
 * @example
 * ```typescript
 * import { FooterHandler } from '#fixtures/footer-handler.js';
 *
 * const footer = new FooterHandler({ page });
 * await footer.clickSave();
 * await footer.clickCancel();
 * ```
 *
 * @module fixtures
 */

import type { Page } from '@playwright/test';
import type { Logger } from 'pino';

import { ControlError } from '#core/errors/control-error.js';
import { createLogger } from '#core/logging/logger.js';

/**
 * Options for constructing a FooterHandler.
 *
 * @example
 * ```typescript
 * const options: FooterHandlerOptions = { page };
 * ```
 */
export interface FooterHandlerOptions {
  readonly page: Page;
}

/**
 * Footer bar button operations for SAP Fiori apps.
 *
 * @remarks
 * Provides convenience methods for common footer bar actions: Save, Apply,
 * Cancel, Edit, Delete, Create. Each method delegates to a shared
 * `clickFooterButton` that finds buttons by text content in the footer bar.
 *
 * @example
 * ```typescript
 * const footer = new FooterHandler({ page });
 * await footer.clickSave();
 * await footer.clickEdit();
 * ```
 */
export class FooterHandler {
  private readonly page: Page;
  private readonly log: Logger;

  constructor(options: FooterHandlerOptions) {
    this.page = options.page;
    this.log = createLogger('footer-handler');
  }

  /**
   * Clicks a footer bar button by its visible text.
   *
   * @param buttonText - The text content of the button to click.
   * @throws ControlError if no button with the given text is found.
   *
   * @example
   * ```typescript
   * await footer['clickFooterButton']('Save');
   * ```
   */
  private async clickFooterButton(buttonText: string): Promise<void> {
    this.log.debug({ buttonText }, 'Clicking footer button');

    const found = await this.page.evaluate(
      /* v8 ignore start -- browser-context function */
      (text: string) => {
        const buttons = document.querySelectorAll('.sapMBarChild .sapMBtn');
        for (const btn of buttons) {
          if (btn.textContent.trim() === text && btn instanceof HTMLElement) {
            btn.click();
            return true;
          }
        }
        return false;
      },
      /* v8 ignore stop */
      buttonText,
    );

    if (!found) {
      throw new ControlError({
        message: `Footer button "${buttonText}" not found`,
        attempted: `Click footer bar button with text: ${buttonText}`,
        suggestions: [
          `Verify the "${buttonText}" button exists in the footer bar`,
          'Check if the page has fully loaded (waitForUI5Stable)',
          'Ensure the view is in the correct mode (display vs edit)',
        ],
      });
    }
  }

  /**
   * Clicks the Save button in the footer bar.
   *
   * @throws ControlError if the Save button is not found.
   *
   * @example
   * ```typescript
   * await footer.clickSave();
   * ```
   */
  async clickSave(): Promise<void> {
    await this.clickFooterButton('Save');
  }

  /**
   * Clicks the Apply button in the footer bar.
   *
   * @throws ControlError if the Apply button is not found.
   *
   * @example
   * ```typescript
   * await footer.clickApply();
   * ```
   */
  async clickApply(): Promise<void> {
    await this.clickFooterButton('Apply');
  }

  /**
   * Clicks the Cancel button in the footer bar.
   *
   * @throws ControlError if the Cancel button is not found.
   *
   * @example
   * ```typescript
   * await footer.clickCancel();
   * ```
   */
  async clickCancel(): Promise<void> {
    await this.clickFooterButton('Cancel');
  }

  /**
   * Clicks the Edit button in the footer bar.
   *
   * @throws ControlError if the Edit button is not found.
   *
   * @example
   * ```typescript
   * await footer.clickEdit();
   * ```
   */
  async clickEdit(): Promise<void> {
    await this.clickFooterButton('Edit');
  }

  /**
   * Clicks the Delete button in the footer bar.
   *
   * @throws ControlError if the Delete button is not found.
   *
   * @example
   * ```typescript
   * await footer.clickDelete();
   * ```
   */
  async clickDelete(): Promise<void> {
    await this.clickFooterButton('Delete');
  }

  /**
   * Clicks the Create button in the footer bar.
   *
   * @throws ControlError if the Create button is not found.
   *
   * @example
   * ```typescript
   * await footer.clickCreate();
   * ```
   */
  async clickCreate(): Promise<void> {
    await this.clickFooterButton('Create');
  }
}
