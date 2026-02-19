/**
 * Tests for `src/auth/auth-checks.ts` — Authentication status check functions.
 *
 * @remarks
 * Verifies that each check function correctly evaluates page state
 * and handles errors gracefully by returning `false`.
 */
import { beforeEach, describe, expect, it, vi } from 'vitest';

import {
  isAuthenticated,
  isLoginPageVisible,
  isShellVisible,
  isUI5Loaded,
  isUserMenuVisible,
} from '../../../src/auth/auth-checks.js';
import type { AuthPage } from '../../../src/auth/auth-types.js';

/** Mock page with a mocked evaluate method for auth check tests. */
interface MockEvaluatePage {
  readonly evaluate: ReturnType<typeof vi.fn>;
}

/**
 * Creates a mock page for auth check tests.
 *
 * @returns A mock page with `evaluate` stubbed, typed as both mock and AuthPage.
 */
function createMockAuthPage(): MockEvaluatePage & AuthPage {
  return {
    evaluate: vi.fn(),
  } as unknown as MockEvaluatePage & AuthPage;
}

describe('isShellVisible', () => {
  let page: MockEvaluatePage & AuthPage;

  beforeEach(() => {
    page = createMockAuthPage();
  });

  it('returns true when shell header exists', async () => {
    page.evaluate.mockResolvedValue(true);

    const result = await isShellVisible(page);

    expect(result).toBe(true);
  });

  it('returns false when shell header is missing', async () => {
    page.evaluate.mockResolvedValue(false);

    const result = await isShellVisible(page);

    expect(result).toBe(false);
  });

  it('returns false on evaluate error', async () => {
    page.evaluate.mockRejectedValue(new Error('Navigation interrupted'));

    const result = await isShellVisible(page);

    expect(result).toBe(false);
  });
});

describe('isUserMenuVisible', () => {
  let page: MockEvaluatePage & AuthPage;

  beforeEach(() => {
    page = createMockAuthPage();
  });

  it('returns true when user menu button exists', async () => {
    page.evaluate.mockResolvedValue(true);

    const result = await isUserMenuVisible(page);

    expect(result).toBe(true);
  });

  it('returns false when user menu button is missing', async () => {
    page.evaluate.mockResolvedValue(false);

    const result = await isUserMenuVisible(page);

    expect(result).toBe(false);
  });

  it('returns false on evaluate error', async () => {
    page.evaluate.mockRejectedValue(new Error('Page closed'));

    const result = await isUserMenuVisible(page);

    expect(result).toBe(false);
  });
});

describe('isUI5Loaded', () => {
  let page: MockEvaluatePage & AuthPage;

  beforeEach(() => {
    page = createMockAuthPage();
  });

  it('returns true when UI5 framework is loaded', async () => {
    page.evaluate.mockResolvedValue(true);

    const result = await isUI5Loaded(page);

    expect(result).toBe(true);
  });

  it('returns false when UI5 framework is not loaded', async () => {
    page.evaluate.mockResolvedValue(false);

    const result = await isUI5Loaded(page);

    expect(result).toBe(false);
  });

  it('returns false on evaluate error', async () => {
    page.evaluate.mockRejectedValue(new Error('Execution context destroyed'));

    const result = await isUI5Loaded(page);

    expect(result).toBe(false);
  });
});

describe('isLoginPageVisible', () => {
  let page: MockEvaluatePage & AuthPage;

  beforeEach(() => {
    page = createMockAuthPage();
  });

  it('returns true when login form is visible', async () => {
    page.evaluate.mockResolvedValue(true);

    const result = await isLoginPageVisible(page);

    expect(result).toBe(true);
  });

  it('returns false when no login form is visible', async () => {
    page.evaluate.mockResolvedValue(false);

    const result = await isLoginPageVisible(page);

    expect(result).toBe(false);
  });

  it('returns false on evaluate error', async () => {
    page.evaluate.mockRejectedValue(new Error('Target closed'));

    const result = await isLoginPageVisible(page);

    expect(result).toBe(false);
  });
});

describe('isAuthenticated', () => {
  let page: MockEvaluatePage & AuthPage;

  beforeEach(() => {
    page = createMockAuthPage();
  });

  it('returns true when shell is visible and login page is not visible', async () => {
    page.evaluate
      .mockResolvedValueOnce(true) // isShellVisible check
      .mockResolvedValueOnce(false); // isLoginPageVisible check

    const result = await isAuthenticated(page);

    expect(result).toBe(true);
  });

  it('returns false when shell is not visible', async () => {
    page.evaluate
      .mockResolvedValueOnce(false) // isShellVisible check
      .mockResolvedValueOnce(false); // isLoginPageVisible check

    const result = await isAuthenticated(page);

    expect(result).toBe(false);
  });

  it('returns false when login page is visible despite shell being visible', async () => {
    page.evaluate
      .mockResolvedValueOnce(true) // isShellVisible check
      .mockResolvedValueOnce(true); // isLoginPageVisible check

    const result = await isAuthenticated(page);

    expect(result).toBe(false);
  });

  it('returns false when evaluate throws', async () => {
    page.evaluate.mockRejectedValue(new Error('Page crashed'));

    const result = await isAuthenticated(page);

    expect(result).toBe(false);
  });
});
