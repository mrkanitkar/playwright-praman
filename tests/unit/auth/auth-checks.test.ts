/**
 * @license
 * Copyright (c) ZesTest 2025-2030. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0
 *
 * This file may contain AI-assisted code.
 * See LICENSE and NOTICE files for details.
 */

/**
 * Tests for `src/auth/auth-checks.ts` — Authentication status check functions.
 *
 * @remarks
 * Verifies that each check function correctly evaluates page state
 * and handles errors gracefully by returning `false`.
 *
 * The evaluate callbacks are exercised by making the mock invoke
 * the callback with a minimal DOM stub, covering the browser-context
 * branches that V8 would otherwise mark uncovered.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

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

/**
 * Creates a mock page whose `evaluate` invokes the passed callback
 * instead of returning a canned value. This exercises the browser-
 * context code inside `page.evaluate()` calls for V8 coverage.
 *
 * @param domSetup - A function that installs stubs on `globalThis`
 *   before the callback executes (e.g. `document.querySelector`).
 * @returns Mock page and a cleanup function.
 */
function createCallbackInvokingPage(domSetup: () => () => void): {
  page: MockEvaluatePage & AuthPage;
  cleanup: () => void;
} {
  const cleanup = domSetup();
  const page = {
    // eslint-disable-next-line @typescript-eslint/promise-function-async -- mock must call callback synchronously then wrap in Promise
    evaluate: vi.fn().mockImplementation((fn: (...args: never[]) => unknown) => {
      try {
        return Promise.resolve(fn());
      } catch (error: unknown) {
        return Promise.reject(error instanceof Error ? error : new Error(String(error)));
      }
    }),
  } as unknown as MockEvaluatePage & AuthPage;
  return { page, cleanup };
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

  describe('evaluate callback coverage', () => {
    let cleanup: () => void;

    afterEach(() => {
      cleanup();
    });

    it('returns true when #shell-header is visible', async () => {
      const setup = createCallbackInvokingPage(() => {
        const origDocument = globalThis.document;
        const mockElement = {} as unknown as Element;
        const mockStyle = { display: 'block', visibility: 'visible' };
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment -- minimal DOM stub for evaluate callback
        globalThis.document = {
          querySelector: vi.fn().mockReturnValue(mockElement),
        } as any;
        globalThis.window = {
          // eslint-disable-next-line @typescript-eslint/no-misused-spread -- intentional shallow copy of Window for test mock
          ...globalThis.window,
          getComputedStyle: vi.fn().mockReturnValue(mockStyle),
        } as unknown as Window & typeof globalThis;
        return () => {
          globalThis.document = origDocument;
        };
      });
      cleanup = setup.cleanup;

      const result = await isShellVisible(setup.page);
      expect(result).toBe(true);
    });

    it('returns false when shell header is null', async () => {
      const setup = createCallbackInvokingPage(() => {
        const origDocument = globalThis.document;
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment -- minimal DOM stub
        globalThis.document = {
          querySelector: vi.fn().mockReturnValue(null),
        } as any;
        return () => {
          globalThis.document = origDocument;
        };
      });
      cleanup = setup.cleanup;

      const result = await isShellVisible(setup.page);
      expect(result).toBe(false);
    });

    it('returns false when display is none', async () => {
      const setup = createCallbackInvokingPage(() => {
        const origDocument = globalThis.document;
        const mockElement = {} as unknown as Element;
        const mockStyle = { display: 'none', visibility: 'visible' };
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment -- minimal DOM stub
        globalThis.document = {
          querySelector: vi.fn().mockReturnValue(mockElement),
        } as any;
        globalThis.window = {
          // eslint-disable-next-line @typescript-eslint/no-misused-spread -- intentional shallow copy of Window for test mock
          ...globalThis.window,
          getComputedStyle: vi.fn().mockReturnValue(mockStyle),
        } as unknown as Window & typeof globalThis;
        return () => {
          globalThis.document = origDocument;
        };
      });
      cleanup = setup.cleanup;

      const result = await isShellVisible(setup.page);
      expect(result).toBe(false);
    });

    it('returns false when visibility is hidden', async () => {
      const setup = createCallbackInvokingPage(() => {
        const origDocument = globalThis.document;
        const mockElement = {} as unknown as Element;
        const mockStyle = { display: 'block', visibility: 'hidden' };
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment -- minimal DOM stub
        globalThis.document = {
          querySelector: vi.fn().mockReturnValue(mockElement),
        } as any;
        globalThis.window = {
          // eslint-disable-next-line @typescript-eslint/no-misused-spread -- intentional shallow copy of Window for test mock
          ...globalThis.window,
          getComputedStyle: vi.fn().mockReturnValue(mockStyle),
        } as unknown as Window & typeof globalThis;
        return () => {
          globalThis.document = origDocument;
        };
      });
      cleanup = setup.cleanup;

      const result = await isShellVisible(setup.page);
      expect(result).toBe(false);
    });

    it('uses .sapUshellShellHead fallback when #shell-header is null', async () => {
      const setup = createCallbackInvokingPage(() => {
        const origDocument = globalThis.document;
        const mockElement = {} as unknown as Element;
        const mockStyle = { display: 'block', visibility: 'visible' };
        const querySelectorMock = vi.fn().mockImplementation((sel: string) => {
          if (sel === '#shell-header') return null;
          if (sel === '.sapUshellShellHead') return mockElement;
          return null;
        });
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment -- minimal DOM stub
        globalThis.document = {
          querySelector: querySelectorMock,
        } as any;
        globalThis.window = {
          // eslint-disable-next-line @typescript-eslint/no-misused-spread -- intentional shallow copy of Window for test mock
          ...globalThis.window,
          getComputedStyle: vi.fn().mockReturnValue(mockStyle),
        } as unknown as Window & typeof globalThis;
        return () => {
          globalThis.document = origDocument;
        };
      });
      cleanup = setup.cleanup;

      const result = await isShellVisible(setup.page);
      expect(result).toBe(true);
    });
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

  describe('evaluate callback coverage', () => {
    let cleanup: () => void;

    afterEach(() => {
      cleanup();
    });

    it('returns true when #meAreaHeaderButton is visible', async () => {
      const setup = createCallbackInvokingPage(() => {
        const origDocument = globalThis.document;
        const mockElement = {} as unknown as Element;
        const mockStyle = { display: 'block', visibility: 'visible' };
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment -- minimal DOM stub
        globalThis.document = {
          querySelector: vi.fn().mockReturnValue(mockElement),
        } as any;
        globalThis.window = {
          // eslint-disable-next-line @typescript-eslint/no-misused-spread -- intentional shallow copy of Window for test mock
          ...globalThis.window,
          getComputedStyle: vi.fn().mockReturnValue(mockStyle),
        } as unknown as Window & typeof globalThis;
        return () => {
          globalThis.document = origDocument;
        };
      });
      cleanup = setup.cleanup;

      const result = await isUserMenuVisible(setup.page);
      expect(result).toBe(true);
    });

    it('returns false when user menu element is null', async () => {
      const setup = createCallbackInvokingPage(() => {
        const origDocument = globalThis.document;
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment -- minimal DOM stub
        globalThis.document = {
          querySelector: vi.fn().mockReturnValue(null),
        } as any;
        return () => {
          globalThis.document = origDocument;
        };
      });
      cleanup = setup.cleanup;

      const result = await isUserMenuVisible(setup.page);
      expect(result).toBe(false);
    });

    it('returns false when display is none', async () => {
      const setup = createCallbackInvokingPage(() => {
        const origDocument = globalThis.document;
        const mockElement = {} as unknown as Element;
        const mockStyle = { display: 'none', visibility: 'visible' };
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment -- minimal DOM stub
        globalThis.document = {
          querySelector: vi.fn().mockReturnValue(mockElement),
        } as any;
        globalThis.window = {
          // eslint-disable-next-line @typescript-eslint/no-misused-spread -- intentional shallow copy of Window for test mock
          ...globalThis.window,
          getComputedStyle: vi.fn().mockReturnValue(mockStyle),
        } as unknown as Window & typeof globalThis;
        return () => {
          globalThis.document = origDocument;
        };
      });
      cleanup = setup.cleanup;

      const result = await isUserMenuVisible(setup.page);
      expect(result).toBe(false);
    });

    it('uses .sapUshellMeAreaHeaderButton fallback', async () => {
      const setup = createCallbackInvokingPage(() => {
        const origDocument = globalThis.document;
        const mockElement = {} as unknown as Element;
        const mockStyle = { display: 'block', visibility: 'visible' };
        const querySelectorMock = vi.fn().mockImplementation((sel: string) => {
          if (sel === '#meAreaHeaderButton') return null;
          if (sel === '.sapUshellMeAreaHeaderButton') return mockElement;
          return null;
        });
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment -- minimal DOM stub
        globalThis.document = {
          querySelector: querySelectorMock,
        } as any;
        globalThis.window = {
          // eslint-disable-next-line @typescript-eslint/no-misused-spread -- intentional shallow copy of Window for test mock
          ...globalThis.window,
          getComputedStyle: vi.fn().mockReturnValue(mockStyle),
        } as unknown as Window & typeof globalThis;
        return () => {
          globalThis.document = origDocument;
        };
      });
      cleanup = setup.cleanup;

      const result = await isUserMenuVisible(setup.page);
      expect(result).toBe(true);
    });
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

  describe('evaluate callback coverage', () => {
    let cleanup: () => void;

    afterEach(() => {
      cleanup();
    });

    it('returns true when sap.ui.require is a function', async () => {
      const setup = createCallbackInvokingPage(() => {
        const origSap = (globalThis as Record<string, unknown>)['sap'];
        (globalThis as Record<string, unknown>)['sap'] = {
          ui: { require: vi.fn() },
        };
        return () => {
          (globalThis as Record<string, unknown>)['sap'] = origSap;
        };
      });
      cleanup = setup.cleanup;

      const result = await isUI5Loaded(setup.page);
      expect(result).toBe(true);
    });

    it('returns false when sap is undefined', async () => {
      const setup = createCallbackInvokingPage(() => {
        const origSap = (globalThis as Record<string, unknown>)['sap'];
        delete (globalThis as Record<string, unknown>)['sap'];
        return () => {
          (globalThis as Record<string, unknown>)['sap'] = origSap;
        };
      });
      cleanup = setup.cleanup;

      const result = await isUI5Loaded(setup.page);
      expect(result).toBe(false);
    });

    it('returns false when sap.ui is undefined', async () => {
      const setup = createCallbackInvokingPage(() => {
        const origSap = (globalThis as Record<string, unknown>)['sap'];
        (globalThis as Record<string, unknown>)['sap'] = {};
        return () => {
          (globalThis as Record<string, unknown>)['sap'] = origSap;
        };
      });
      cleanup = setup.cleanup;

      const result = await isUI5Loaded(setup.page);
      expect(result).toBe(false);
    });

    it('returns false when sap.ui.require is not a function', async () => {
      const setup = createCallbackInvokingPage(() => {
        const origSap = (globalThis as Record<string, unknown>)['sap'];
        (globalThis as Record<string, unknown>)['sap'] = {
          ui: { require: 'not-a-function' },
        };
        return () => {
          (globalThis as Record<string, unknown>)['sap'] = origSap;
        };
      });
      cleanup = setup.cleanup;

      const result = await isUI5Loaded(setup.page);
      expect(result).toBe(false);
    });
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

  describe('evaluate callback coverage', () => {
    let cleanup: () => void;

    afterEach(() => {
      cleanup();
    });

    it('returns true when a login selector matches', async () => {
      const setup = createCallbackInvokingPage(() => {
        const origDocument = globalThis.document;
        const mockElement = {} as unknown as Element;
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment -- minimal DOM stub
        globalThis.document = {
          querySelector: vi.fn().mockImplementation((sel: string) => {
            if (sel === '#USERNAME_FIELD-inner') return mockElement;
            return null;
          }),
        } as any;
        return () => {
          globalThis.document = origDocument;
        };
      });
      cleanup = setup.cleanup;

      const result = await isLoginPageVisible(setup.page);
      expect(result).toBe(true);
    });

    it('returns false when no login selectors match', async () => {
      const setup = createCallbackInvokingPage(() => {
        const origDocument = globalThis.document;
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment -- minimal DOM stub
        globalThis.document = {
          querySelector: vi.fn().mockReturnValue(null),
        } as any;
        return () => {
          globalThis.document = origDocument;
        };
      });
      cleanup = setup.cleanup;

      const result = await isLoginPageVisible(setup.page);
      expect(result).toBe(false);
    });

    it('returns true when j_username selector matches', async () => {
      const setup = createCallbackInvokingPage(() => {
        const origDocument = globalThis.document;
        const mockElement = {} as unknown as Element;
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment -- minimal DOM stub
        globalThis.document = {
          querySelector: vi.fn().mockImplementation((sel: string) => {
            if (sel === '#j_username') return mockElement;
            return null;
          }),
        } as any;
        return () => {
          globalThis.document = origDocument;
        };
      });
      cleanup = setup.cleanup;

      const result = await isLoginPageVisible(setup.page);
      expect(result).toBe(true);
    });

    it('returns true when loginfmt selector matches', async () => {
      const setup = createCallbackInvokingPage(() => {
        const origDocument = globalThis.document;
        const mockElement = {} as unknown as Element;
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment -- minimal DOM stub
        globalThis.document = {
          querySelector: vi.fn().mockImplementation((sel: string) => {
            if (sel === 'input[name="loginfmt"]') return mockElement;
            return null;
          }),
        } as any;
        return () => {
          globalThis.document = origDocument;
        };
      });
      cleanup = setup.cleanup;

      const result = await isLoginPageVisible(setup.page);
      expect(result).toBe(true);
    });
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

  it('does not call isLoginPageVisible when shell is not visible', async () => {
    page.evaluate.mockResolvedValueOnce(false); // isShellVisible returns false

    const result = await isAuthenticated(page);

    expect(result).toBe(false);
    // Only one evaluate call — isLoginPageVisible never called
    expect(page.evaluate).toHaveBeenCalledTimes(1);
  });
});
