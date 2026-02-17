/**
 * Tests for `src/proxy/playwright-api.ts`.
 *
 * @remarks
 * Validates the Playwright Locator method allowlist that the proxy uses
 * to route calls to Playwright instead of the UI5 bridge.
 */
import { describe, expect, it } from 'vitest';

import { isPlaywrightMethod, PLAYWRIGHT_API_METHODS } from '#proxy/playwright-api.js';

describe('playwright-api', () => {
  describe('PLAYWRIGHT_API_METHODS', () => {
    it('is a ReadonlySet', () => {
      expect(PLAYWRIGHT_API_METHODS).toBeInstanceOf(Set);
    });

    it('contains core Playwright Locator methods', () => {
      expect(PLAYWRIGHT_API_METHODS.has('click')).toBe(true);
      expect(PLAYWRIGHT_API_METHODS.has('fill')).toBe(true);
      expect(PLAYWRIGHT_API_METHODS.has('isVisible')).toBe(true);
      expect(PLAYWRIGHT_API_METHODS.has('isEnabled')).toBe(true);
      expect(PLAYWRIGHT_API_METHODS.has('textContent')).toBe(true);
    });

    it('contains input interaction methods', () => {
      expect(PLAYWRIGHT_API_METHODS.has('type')).toBe(true);
      expect(PLAYWRIGHT_API_METHODS.has('press')).toBe(true);
      expect(PLAYWRIGHT_API_METHODS.has('selectOption')).toBe(true);
      expect(PLAYWRIGHT_API_METHODS.has('check')).toBe(true);
      expect(PLAYWRIGHT_API_METHODS.has('uncheck')).toBe(true);
    });

    it('contains assertion-related methods', () => {
      expect(PLAYWRIGHT_API_METHODS.has('isChecked')).toBe(true);
      expect(PLAYWRIGHT_API_METHODS.has('isDisabled')).toBe(true);
      expect(PLAYWRIGHT_API_METHODS.has('isHidden')).toBe(true);
      expect(PLAYWRIGHT_API_METHODS.has('isEditable')).toBe(true);
    });

    it('contains DOM query methods', () => {
      expect(PLAYWRIGHT_API_METHODS.has('innerHTML')).toBe(true);
      expect(PLAYWRIGHT_API_METHODS.has('innerText')).toBe(true);
      expect(PLAYWRIGHT_API_METHODS.has('getAttribute')).toBe(true);
      expect(PLAYWRIGHT_API_METHODS.has('inputValue')).toBe(true);
    });

    it('contains action methods', () => {
      expect(PLAYWRIGHT_API_METHODS.has('hover')).toBe(true);
      expect(PLAYWRIGHT_API_METHODS.has('focus')).toBe(true);
      expect(PLAYWRIGHT_API_METHODS.has('blur')).toBe(true);
      expect(PLAYWRIGHT_API_METHODS.has('dblclick')).toBe(true);
      expect(PLAYWRIGHT_API_METHODS.has('scrollIntoViewIfNeeded')).toBe(true);
    });

    it('does not contain UI5 methods', () => {
      expect(PLAYWRIGHT_API_METHODS.has('getText')).toBe(false);
      expect(PLAYWRIGHT_API_METHODS.has('getEnabled')).toBe(false);
      expect(PLAYWRIGHT_API_METHODS.has('firePress')).toBe(false);
    });
  });

  describe('isPlaywrightMethod', () => {
    it('returns true for Playwright methods', () => {
      expect(isPlaywrightMethod('click')).toBe(true);
      expect(isPlaywrightMethod('fill')).toBe(true);
    });

    it('returns false for UI5 methods', () => {
      expect(isPlaywrightMethod('getText')).toBe(false);
      expect(isPlaywrightMethod('firePress')).toBe(false);
    });

    it('returns false for unknown methods', () => {
      expect(isPlaywrightMethod('foobar')).toBe(false);
    });
  });
});
