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

import { ErrorCode } from '#core/errors/codes.js';
import { ControlError } from '#core/errors/control-error.js';
import { createLogger } from '#core/logging/logger.js';
import { ui5Step } from '#core/utils/step-decorator.js';

/**
 * Options for constructing a FooterHandler.
 *
 * @ai
 * @aiContext Configuration for creating a FooterHandler instance.
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
 * @ai
 * @aiContext Use to click standard footer bar buttons (Save, Edit, etc.).
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
          // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition -- textContent is string | null per DOM spec; TypeDoc strict mode requires null guard
          if ((btn.textContent ?? '').trim() === text && btn instanceof HTMLElement) {
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
        code: ErrorCode.ERR_CONTROL_NOT_FOUND,
        message: `Footer button "${buttonText}" not found`,
        attempted: `Click footer bar button with text: ${buttonText}`,
        retryable: true,
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
   * @ai
   * @aiContext Use to save the current document or form.
   *
   * @throws ControlError if the Save button is not found.
   *
   * @example
   * ```typescript
   * await footer.clickSave();
   * ```
   */
  @ui5Step
  async clickSave(): Promise<void> {
    await this.clickFooterButton('Save');
  }

  /**
   * Clicks the Apply button in the footer bar.
   *
   * @ai
   * @aiContext Use to apply changes without closing the current view.
   *
   * @throws ControlError if the Apply button is not found.
   *
   * @example
   * ```typescript
   * await footer.clickApply();
   * ```
   */
  @ui5Step
  async clickApply(): Promise<void> {
    await this.clickFooterButton('Apply');
  }

  /**
   * Clicks the Cancel button in the footer bar.
   *
   * @ai
   * @aiContext Use to cancel and discard changes in the current view.
   *
   * @throws ControlError if the Cancel button is not found.
   *
   * @example
   * ```typescript
   * await footer.clickCancel();
   * ```
   */
  @ui5Step
  async clickCancel(): Promise<void> {
    await this.clickFooterButton('Cancel');
  }

  /**
   * Clicks the Edit button in the footer bar.
   *
   * @ai
   * @aiContext Use to switch from display mode to edit mode.
   *
   * @throws ControlError if the Edit button is not found.
   *
   * @example
   * ```typescript
   * await footer.clickEdit();
   * ```
   */
  @ui5Step
  async clickEdit(): Promise<void> {
    await this.clickFooterButton('Edit');
  }

  /**
   * Clicks the Delete button in the footer bar.
   *
   * @ai
   * @aiContext Use to delete the current document or record.
   *
   * @throws ControlError if the Delete button is not found.
   *
   * @example
   * ```typescript
   * await footer.clickDelete();
   * ```
   */
  @ui5Step
  async clickDelete(): Promise<void> {
    await this.clickFooterButton('Delete');
  }

  /**
   * Clicks the Create button in the footer bar.
   *
   * @ai
   * @aiContext Use to create a new document or record.
   *
   * @throws ControlError if the Create button is not found.
   *
   * @example
   * ```typescript
   * await footer.clickCreate();
   * ```
   */
  @ui5Step
  async clickCreate(): Promise<void> {
    await this.clickFooterButton('Create');
  }
}
