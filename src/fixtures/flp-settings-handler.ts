/**
 * @license
 * Copyright (c) ZesTest 2025-2030. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0
 *
 * This file may contain AI-assisted code.
 * See LICENSE and NOTICE files for details.
 */

/**
 * FLP Settings handler -- reads SAP Fiori Launchpad user settings.
 *
 * @ai
 * @aiContext Reads FLP user settings (language, date/time/number formats, timezone) from the
 * UShell Container API via page.evaluate(). Use getAllSettings() for bulk retrieval.
 *
 * @remarks
 * Reads user settings (language, date/time/number formats, timezone) from
 * the UShell Container API via `page.evaluate()`. Throws {@link FLPError}
 * when the Container API is unavailable.
 *
 * All public methods are decorated with `@ui5Step` for Playwright
 * trace/report integration.
 *
 * @example
 * ```typescript
 * import { FLPSettingsHandler } from '#fixtures/flp-settings-handler.js';
 *
 * const settings = new FLPSettingsHandler({ page });
 * const lang = await settings.getLanguage();
 * const all = await settings.getAllSettings();
 * ```
 *
 * @module fixtures
 */

import type { Page } from '@playwright/test';
import type { Logger } from 'pino';

import { ErrorCode } from '#core/errors/codes.js';
import { FLPError } from '#core/errors/flp-error.js';
import { createLogger } from '#core/logging/logger.js';
import { ui5Step } from '#core/utils/step-decorator.js';

/**
 * Options for constructing an FLPSettingsHandler.
 *
 * @example
 * ```typescript
 * const options: FLPSettingsHandlerOptions = { page, timeout: 5000 };
 * ```
 */
export interface FLPSettingsHandlerOptions {
  readonly page: Page;
  /** Timeout for page.evaluate calls in ms. Defaults to 10 000. */
  readonly timeout?: number;
}

/**
 * User settings retrieved from the FLP UShell Container.
 *
 * @example
 * ```typescript
 * const settings: FLPUserSettings = await handler.getAllSettings();
 * logger.info(settings.language); // 'EN'
 * ```
 */
export interface FLPUserSettings {
  readonly language: string;
  readonly dateFormat: string;
  readonly timeFormat: string;
  readonly timezone: string;
  readonly numberFormat: string;
}

/** Default timeout for page.evaluate calls (ms). */
const DEFAULT_TIMEOUT = 10_000;

/** Shared suggestions for FLP Container errors. */
const FLP_CONTAINER_SUGGESTIONS: readonly string[] = [
  'Ensure the page is a Fiori Launchpad application',
  'Wait for the FLP shell to fully load',
  'Verify the user is authenticated',
];

/** Shared FLP service name. */
const FLP_SERVICE = 'UShell Container';

/**
 * FLP Settings handler -- reads user settings from the UShell Container API.
 *
 * @remarks
 * Provides individual getters for each setting (language, date format,
 * time format, timezone, number format) and a bulk `getAllSettings()` method.
 * Each getter calls a single `page.evaluate()` targeting
 * `sap.ushell.Container.getUser()`.
 *
 * @capability flpSettings.getLanguage
 *
 * @example
 * ```typescript
 * const handler = new FLPSettingsHandler({ page });
 * const lang = await handler.getLanguage();
 * const all = await handler.getAllSettings();
 * ```
 */
export class FLPSettingsHandler {
  private readonly page: Page;
  private readonly timeout: number;
  private readonly log: Logger;

  constructor(options: FLPSettingsHandlerOptions) {
    this.page = options.page;
    this.timeout = options.timeout ?? DEFAULT_TIMEOUT;
    this.log = createLogger('flp-settings');
  }

  /**
   * Returns the user's configured language from the FLP shell.
   *
   * @returns Language code (e.g. `'EN'`, `'DE'`).
   * @throws FLPError when the UShell Container is not available.
   *
   * @example
   * ```typescript
   * const lang = await handler.getLanguage();
   * ```
   */
  @ui5Step
  async getLanguage(): Promise<string> {
    return this.readUserSetting('getLanguage', 'language');
  }

  /**
   * Returns the user's configured date format from the FLP shell.
   *
   * @returns Date format string (e.g. `'1'` for dd.MM.yyyy).
   * @throws FLPError when the UShell Container is not available.
   *
   * @example
   * ```typescript
   * const fmt = await handler.getDateFormat();
   * ```
   */
  @ui5Step
  async getDateFormat(): Promise<string> {
    return this.readUserSetting('getDateFormat', 'date format');
  }

  /**
   * Returns the user's configured time format from the FLP shell.
   *
   * @returns Time format string (e.g. `'0'` for 12-hour, `'1'` for 24-hour).
   * @throws FLPError when the UShell Container is not available.
   *
   * @example
   * ```typescript
   * const fmt = await handler.getTimeFormat();
   * ```
   */
  @ui5Step
  async getTimeFormat(): Promise<string> {
    return this.readUserSetting('getTimeFormat', 'time format');
  }

  /**
   * Returns the user's configured timezone from the FLP shell.
   *
   * @returns Timezone identifier (e.g. `'Europe/Berlin'`, `'UTC'`).
   * @throws FLPError when the UShell Container is not available.
   *
   * @example
   * ```typescript
   * const tz = await handler.getTimezone();
   * ```
   */
  @ui5Step
  async getTimezone(): Promise<string> {
    return this.readUserSetting('getTimezone', 'timezone');
  }

  /**
   * Returns the user's configured number format from the FLP shell.
   *
   * @returns Number format string (e.g. `' '` for spaces, `','` for commas).
   * @throws FLPError when the UShell Container is not available.
   *
   * @example
   * ```typescript
   * const fmt = await handler.getNumberFormat();
   * ```
   */
  @ui5Step
  async getNumberFormat(): Promise<string> {
    return this.readUserSetting('getNumberFormat', 'number format');
  }

  /**
   * Returns all user settings from the FLP shell in a single evaluate call.
   *
   * @returns All user settings as an {@link FLPUserSettings} object.
   * @throws FLPError when the UShell Container is not available.
   *
   * @example
   * ```typescript
   * const settings = await handler.getAllSettings();
   * logger.info(settings.language, settings.timezone);
   * ```
   */
  @ui5Step
  async getAllSettings(): Promise<FLPUserSettings> {
    this.log.debug('Reading all FLP user settings');

    let result: FLPUserSettings | null;
    try {
      result = await this.page.evaluate(
        /* v8 ignore start -- browser-context function */
        () => {
          // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition, @typescript-eslint/strict-boolean-expressions -- runtime guard: sap global may not exist in browser
          if (typeof sap === 'undefined' || !sap.ushell?.Container) {
            return null;
          }
          const user = sap.ushell.Container.getUser();
          return {
            language: user.getLanguage(),
            dateFormat: user.getDateFormat(),
            timeFormat: user.getTimeFormat(),
            timezone: user.getTimezone(),
            numberFormat: user.getNumberFormat(),
          };
        },
        /* v8 ignore stop */
      );
    } catch (error: unknown) {
      const opts = {
        code: ErrorCode.ERR_FLP_API_UNAVAILABLE,
        message: `Failed to read FLP user settings: ${error instanceof Error ? error.message : String(error)}`,
        attempted: 'Read all user settings from sap.ushell.Container',
        retryable: true,
        flpService: FLP_SERVICE,
        suggestions: [...FLP_CONTAINER_SUGGESTIONS],
      } as const;
      throw new FLPError(error instanceof Error ? { ...opts, cause: error } : opts);
    }

    if (result === null) {
      throw new FLPError({
        code: ErrorCode.ERR_FLP_SHELL_NOT_FOUND,
        message: 'UShell Container not available — cannot read user settings',
        attempted: 'Read all user settings from sap.ushell.Container',
        retryable: true,
        flpService: FLP_SERVICE,
        suggestions: [...FLP_CONTAINER_SUGGESTIONS],
      });
    }

    this.log.debug({ settings: result }, 'FLP user settings retrieved');
    return result;
  }

  /**
   * Reads a single user setting from the UShell Container API.
   *
   * @param getter - Method name on the User object (e.g. `'getLanguage'`).
   * @param settingName - Human-readable name for error messages.
   * @returns The setting value as a string.
   */
  private async readUserSetting(getter: string, settingName: string): Promise<string> {
    this.log.debug({ getter }, `Reading FLP user ${settingName}`);

    let result: string | null;
    try {
      result = await this.page.evaluate(
        /* v8 ignore start -- browser-context function */
        (g: string) => {
          // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition, @typescript-eslint/strict-boolean-expressions -- runtime guard: sap global may not exist in browser
          if (typeof sap === 'undefined' || !sap.ushell?.Container) {
            return null;
          }
          const user = sap.ushell.Container.getUser();
          // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-member-access, security/detect-object-injection -- browser context: User object has dynamic getter methods (getLanguage, getDateFormat, etc.) not in ambient types; getter name is from internal API, not user input
          const fn = (user as any)[g] as (() => unknown) | undefined;
          return fn !== undefined ? String(fn()) : null;
        },
        /* v8 ignore stop */
        getter,
      );
    } catch (error: unknown) {
      const opts = {
        code: ErrorCode.ERR_FLP_API_UNAVAILABLE,
        message: `Failed to read user ${settingName}: ${error instanceof Error ? error.message : String(error)}`,
        attempted: `Read user ${settingName} from sap.ushell.Container`,
        retryable: true,
        flpService: FLP_SERVICE,
        suggestions: [...FLP_CONTAINER_SUGGESTIONS],
      } as const;
      throw new FLPError(error instanceof Error ? { ...opts, cause: error } : opts);
    }

    if (result === null) {
      throw new FLPError({
        code: ErrorCode.ERR_FLP_SHELL_NOT_FOUND,
        message: `UShell Container not available — cannot read user ${settingName}`,
        attempted: `Read user ${settingName} from sap.ushell.Container`,
        retryable: true,
        flpService: FLP_SERVICE,
        suggestions: [...FLP_CONTAINER_SUGGESTIONS],
      });
    }

    return result;
  }
}
