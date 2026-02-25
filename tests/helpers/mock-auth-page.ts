/**
 * @license
 * Copyright (c) ZesTest 2025-2030. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0
 *
 * This file may contain AI-assisted code.
 * See LICENSE and NOTICE files for details.
 */

/**
 * Mock Playwright page with SAP authentication form simulation.
 *
 * @remarks
 * Provides pre-configured locator mocks for SAP login forms:
 * OnPrem (#USERNAME_FIELD-inner, #PASSWORD_FIELD-inner, #LOGIN_LINK),
 * Cloud SAML (#j_username, #j_password, #logOnFormSubmit),
 * Office365 (input[name="loginfmt"], input[name="passwd"]).
 *
 * @example
 * ```typescript
 * import { createMockAuthPage } from '../../helpers/mock-auth-page.js';
 *
 * const page = createMockAuthPage({ authenticated: true });
 * ```
 *
 * @module test-helpers
 */

import type { Mock } from 'vitest';
import { vi } from 'vitest';

import type { AuthPage } from '../../src/auth/auth-types.js';

/** Mock Playwright Locator with chainable methods for auth testing. */
export interface MockLocator {
  readonly fill: ReturnType<typeof vi.fn>;
  readonly click: ReturnType<typeof vi.fn>;
  readonly isVisible: ReturnType<typeof vi.fn>;
  readonly waitFor: ReturnType<typeof vi.fn>;
}

/** Options for configuring mock auth page behavior. */
export interface MockAuthPageOptions {
  /** If true, shell header isVisible returns true (authenticated state). */
  readonly authenticated?: boolean;
  /** If true, login form selectors are visible. Defaults to true. */
  readonly loginFormVisible?: boolean;
  /** Controls shell header visibility independently. */
  readonly shellHeaderVisible?: boolean;
}

/**
 * Mock Playwright page with SAP auth-specific support.
 *
 * @remarks
 * Extends `AuthPage` so it can be passed directly to auth strategy
 * methods without type errors. Uses intersection types with `Mock`
 * to allow `.mockResolvedValue()` and other Vitest mock methods.
 */
export interface MockAuthPage extends AuthPage {
  readonly goto: Mock<(...args: Parameters<AuthPage['goto']>) => ReturnType<AuthPage['goto']>> &
    AuthPage['goto'];
  readonly url: Mock<() => string> & AuthPage['url'];
  readonly waitForSelector: Mock<
    (...args: Parameters<AuthPage['waitForSelector']>) => ReturnType<AuthPage['waitForSelector']>
  > &
    AuthPage['waitForSelector'];
  readonly waitForURL: Mock<
    (...args: Parameters<AuthPage['waitForURL']>) => ReturnType<AuthPage['waitForURL']>
  > &
    AuthPage['waitForURL'];
  readonly waitForLoadState: Mock<
    (...args: Parameters<AuthPage['waitForLoadState']>) => ReturnType<AuthPage['waitForLoadState']>
  > &
    AuthPage['waitForLoadState'];
  readonly waitForFunction: Mock<
    (...args: Parameters<AuthPage['waitForFunction']>) => ReturnType<AuthPage['waitForFunction']>
  > &
    AuthPage['waitForFunction'];
  readonly evaluate: Mock<(...args: any[]) => any> & AuthPage['evaluate'];
  readonly locator: Mock<(selector: string) => MockLocator> & AuthPage['locator'];
}

/**
 * Creates a mock locator with default resolved stubs.
 *
 * @param options - Visibility options for isVisible mock.
 * @returns A MockLocator with all methods stubbed.
 *
 * @example
 * ```typescript
 * const locator = createMockLocator({ isVisible: true });
 * await locator.fill('test');
 * ```
 */
export function createMockLocator(options?: { readonly isVisible?: boolean }): MockLocator {
  return {
    fill: vi.fn().mockResolvedValue(undefined),
    click: vi.fn().mockResolvedValue(undefined),
    isVisible: vi.fn().mockResolvedValue(options?.isVisible ?? false),
    waitFor: vi.fn().mockResolvedValue(undefined),
  };
}

/** Selectors that indicate a shell header (authenticated state). */
const SHELL_HEADER_SELECTORS = new Set(['#shell-header', '#shell-hdr']);

/** Selectors that belong to SAP login forms. */
const LOGIN_FORM_SELECTORS = new Set([
  '#USERNAME_FIELD-inner',
  '#PASSWORD_FIELD-inner',
  '#LOGIN_LINK',
  '#j_username',
  '#j_password',
  '#logOnFormSubmit',
  'input[name="loginfmt"]',
  'input[name="passwd"]',
  'input[type="submit"]',
]);

/**
 * Creates a mock Playwright Page with SAP authentication form simulation.
 *
 * @param options - Configuration for authentication state and form visibility.
 * @returns MockAuthPage with locator mocks that respond to SAP auth selectors.
 *
 * @example
 * ```typescript
 * const page = createMockAuthPage({ authenticated: true });
 * const header = page.locator('#shell-header');
 * const visible = await header.isVisible(); // true
 * ```
 */
export function createMockAuthPage(options?: MockAuthPageOptions): MockAuthPage {
  const authenticated = options?.authenticated ?? false;
  const loginFormVisible = options?.loginFormVisible ?? true;
  const shellHeaderVisible = options?.shellHeaderVisible ?? authenticated;

  const locatorFactory = vi.fn().mockImplementation((selector: string) => {
    if (SHELL_HEADER_SELECTORS.has(selector)) {
      return createMockLocator({ isVisible: shellHeaderVisible });
    }

    if (LOGIN_FORM_SELECTORS.has(selector)) {
      return createMockLocator({ isVisible: loginFormVisible });
    }

    // Unknown selector — return default non-visible locator
    return createMockLocator();
  });

  return {
    goto: vi.fn().mockResolvedValue(undefined),
    url: vi.fn().mockReturnValue('https://sap.example.com'),
    waitForSelector: vi.fn().mockResolvedValue(undefined),
    waitForURL: vi.fn().mockResolvedValue(undefined),
    waitForLoadState: vi.fn().mockResolvedValue(undefined),
    waitForFunction: vi.fn().mockResolvedValue(undefined),
    locator: locatorFactory,
    evaluate: vi.fn().mockResolvedValue(undefined),
  } as MockAuthPage;
}
