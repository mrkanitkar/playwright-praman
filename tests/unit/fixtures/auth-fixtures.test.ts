/**
 * Tests for `src/fixtures/auth-fixtures.ts` — Playwright auth fixtures.
 *
 * @remarks
 * Uses vitest with mocked `@playwright/test` and auth module dependencies.
 * Fixture definitions are captured via `createMockTestExtend()` and executed
 * directly to verify behavior without requiring a Playwright test runner.
 *
 * @module fixtures
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { createMockTestExtend } from '../../helpers/mock-playwright-test.js';

// ── Mock dependencies ────────────────────────────────────────────────

const mockStrategy = {
  name: 'onprem',
  authenticate: vi.fn().mockResolvedValue(undefined),
  isAuthenticated: vi.fn().mockResolvedValue(false),
};

const mockCloudStrategy = {
  name: 'cloud-saml',
  authenticate: vi.fn().mockResolvedValue(undefined),
  isAuthenticated: vi.fn().mockResolvedValue(false),
};

const mockCreateAuthStrategy = vi.fn().mockReturnValue(mockStrategy);

const mockSAPAuthHandler = vi.fn().mockImplementation(function mockAuthHandler(
  this: Record<string, unknown>,
  options: { readonly strategy: unknown; readonly logger: unknown },
) {
  this['strategy'] = options.strategy;
  this['logger'] = options.logger;
  this['sessionInfo'] = null;
  this['loginTimestamp'] = null;
  this['login'] = vi.fn().mockResolvedValue(undefined);
  this['logout'] = vi.fn().mockResolvedValue(undefined);
  this['isAuthenticated'] = vi.fn().mockResolvedValue(false);
  this['isSessionExpired'] = vi.fn().mockReturnValue(true);
  this['getSessionInfo'] = vi.fn().mockReturnValue(null);
});

vi.mock('../../../src/auth/auth-factory.js', () => ({
  createAuthStrategy: mockCreateAuthStrategy,
}));

vi.mock('../../../src/auth/auth-handler.js', () => ({
  SAPAuthHandler: mockSAPAuthHandler,
}));

const mockTestExtend = createMockTestExtend();

vi.mock('@playwright/test', () => ({
  test: {
    extend: mockTestExtend,
  },
}));

// ── Import after mocks ──────────────────────────────────────────────

const { authTest } = await import('#fixtures/auth-fixtures.js');

// ── Helpers ─────────────────────────────────────────────────────────

/**
 * Extracts the fixture function from a fixture definition.
 *
 * @param definition - The fixture definition from `_fixtureDefinitions`
 * @returns The fixture function
 *
 * @example
 * ```typescript
 * const fn = extractFixtureFn(fixtures.sapAuth);
 * ```
 */
function extractFixtureFn(definition: unknown): (...args: unknown[]) => Promise<void> {
  if (Array.isArray(definition)) {
    return definition[0] as (...args: unknown[]) => Promise<void>;
  }
  return definition as (...args: unknown[]) => Promise<void>;
}

/**
 * Extracts fixture options from a fixture definition tuple.
 *
 * @param definition - The fixture definition from `_fixtureDefinitions`
 * @returns The fixture options or undefined if bare function
 *
 * @example
 * ```typescript
 * const opts = extractFixtureOptions(fixtures.sapAuthConfig);
 * ```
 */
function extractFixtureOptions(definition: unknown): Record<string, unknown> | undefined {
  if (Array.isArray(definition) && definition.length > 1) {
    return definition[1] as Record<string, unknown>;
  }
  return undefined;
}

/**
 * Runs a fixture function and captures the value passed to `use()`.
 *
 * @remarks
 * Simulates Playwright's `use()` callback for fixture testing.
 * The fixture function runs setup, use(), and teardown.
 *
 * @param fn - The fixture function to execute
 * @param deps - Dependencies to pass as the first argument
 * @returns The value passed to `use()`
 *
 * @example
 * ```typescript
 * const handler = await runFixture(fixtureFn, { sapAuthConfig: config });
 * ```
 */
async function runFixture<T>(
  fn: (deps: Record<string, unknown>, use: (value: T) => Promise<void>) => Promise<void>,
  deps: Record<string, unknown>,
): Promise<T> {
  let captured: T | undefined;
  const useFn = async (value: T): Promise<void> => {
    captured = value;
    await Promise.resolve();
  };
  await fn(deps, useFn);
  return captured as T;
}

// ── Fixture definitions reference ───────────────────────────────────

const fixtures = (authTest as unknown as { _fixtureDefinitions: Record<string, unknown> })
  ._fixtureDefinitions;

// ── Tests ───────────────────────────────────────────────────────────

describe('auth-fixtures fixture declarations', () => {
  it('authTest exports fixture definitions with sapAuth', () => {
    expect(fixtures).toHaveProperty('sapAuth');
  });

  it('authTest exports fixture definitions with sapAuthConfig', () => {
    expect(fixtures).toHaveProperty('sapAuthConfig');
  });

  it('authTest exports fixture definitions with pramanConfig placeholder', () => {
    expect(fixtures).toHaveProperty('pramanConfig');
  });
});

describe('auth-fixtures sapAuthConfig option', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockCreateAuthStrategy.mockReturnValue(mockStrategy);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('is declared as a fixture option', () => {
    const options = extractFixtureOptions(fixtures['sapAuthConfig']);

    expect(options).toBeDefined();
    expect(options?.['option']).toBe(true);
  });

  it('has default empty config values', () => {
    const definition = fixtures['sapAuthConfig'];

    expect(definition).toBeDefined();
    // Fixture options have the form [defaultValue, { option: true }]
    expect(Array.isArray(definition)).toBe(true);
    const defaultValue = (definition as unknown[])[0] as Record<string, unknown>;
    expect(defaultValue).toHaveProperty('url');
    expect(defaultValue).toHaveProperty('username');
    expect(defaultValue).toHaveProperty('password');
  });
});

describe('auth-fixtures pramanConfig placeholder', () => {
  it('is declared as a fixture option (cross-fixture dependency via mergeTests)', () => {
    const options = extractFixtureOptions(fixtures['pramanConfig']);

    expect(options).toBeDefined();
    expect(options?.['option']).toBe(true);
  });
});

describe('auth-fixtures sapAuth fixture', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockCreateAuthStrategy.mockReturnValue(mockStrategy);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  // Test 1: sapAuth fixture creates SAPAuthHandler
  it('creates SAPAuthHandler with strategy from factory', async () => {
    const fn = extractFixtureFn(fixtures['sapAuth']);
    // eslint-disable-next-line sonarjs/no-hardcoded-passwords -- Test fixtures use known values
    const config = { url: 'https://sap.example.com', username: 'admin', password: 'secret' };

    await runFixture(fn, { sapAuthConfig: config });

    expect(mockCreateAuthStrategy).toHaveBeenCalledWith(config);
    expect(mockSAPAuthHandler).toHaveBeenCalledWith(
      expect.objectContaining({
        strategy: mockStrategy,
      }),
    );
  });

  // Test 2: sapAuth does NOT auto-login
  it('does NOT auto-login (authenticated starts false)', async () => {
    const fn = extractFixtureFn(fixtures['sapAuth']);
    // eslint-disable-next-line sonarjs/no-hardcoded-passwords -- Test fixtures use known values
    const config = { url: 'https://sap.example.com', username: 'admin', password: 'secret' };

    const handler = await runFixture(fn, { sapAuthConfig: config });

    // The handler should be provided but login() should NOT have been called
    expect(handler).toBeDefined();
    const handlerInstance = handler as { login: ReturnType<typeof vi.fn> };
    expect(handlerInstance.login).not.toHaveBeenCalled();
  });

  // Test 3: sapAuth does NOT auto-logout on cleanup
  it('does NOT auto-logout on teardown', async () => {
    const fn = extractFixtureFn(fixtures['sapAuth']);
    // eslint-disable-next-line sonarjs/no-hardcoded-passwords -- Test fixtures use known values
    const config = { url: 'https://sap.example.com', username: 'admin', password: 'secret' };

    let capturedHandler: unknown;
    const useFn = async (value: unknown): Promise<void> => {
      capturedHandler = value;
      await Promise.resolve();
    };

    await fn({ sapAuthConfig: config }, useFn);

    // After teardown, logout should NOT have been called
    const handlerInstance = capturedHandler as { logout: ReturnType<typeof vi.fn> };
    expect(handlerInstance.logout).not.toHaveBeenCalled();
  });

  // Test 4: sapAuth initializes strategy from config
  it('initializes strategy from config via createAuthStrategy', async () => {
    const fn = extractFixtureFn(fixtures['sapAuth']);
    const config = {
      url: 'https://sap.example.com',
      username: 'admin',
      // eslint-disable-next-line sonarjs/no-hardcoded-passwords -- Test fixtures use known values
      password: 'secret',
      strategy: 'onprem',
    };

    await runFixture(fn, { sapAuthConfig: config });

    expect(mockCreateAuthStrategy).toHaveBeenCalledWith(config);
  });

  // Test 6: Strategy auto-detected from URL (cloud URL -> CloudSAML)
  it('auto-detects strategy from cloud URL via factory', async () => {
    mockCreateAuthStrategy.mockReturnValue(mockCloudStrategy);

    const fn = extractFixtureFn(fixtures['sapAuth']);
    const config = {
      url: 'https://my-tenant.s4hana.cloud.sap',
      username: 'user@example.com',
      // eslint-disable-next-line sonarjs/no-hardcoded-passwords -- Test fixtures use known values
      password: 'cloud-secret',
    };

    await runFixture(fn, { sapAuthConfig: config });

    expect(mockCreateAuthStrategy).toHaveBeenCalledWith(config);
    expect(mockSAPAuthHandler).toHaveBeenCalledWith(
      expect.objectContaining({
        strategy: mockCloudStrategy,
      }),
    );
  });

  // Test 7: Strategy explicit override
  it('passes explicit strategy override to factory', async () => {
    const fn = extractFixtureFn(fixtures['sapAuth']);
    const config = {
      url: 'https://sap.example.com',
      username: 'admin',
      // eslint-disable-next-line sonarjs/no-hardcoded-passwords -- Test fixtures use known values
      password: 'secret',
      strategy: 'onprem',
    };

    await runFixture(fn, { sapAuthConfig: config });

    expect(mockCreateAuthStrategy).toHaveBeenCalledWith(
      expect.objectContaining({
        strategy: 'onprem',
      }),
    );
  });

  // Test 8: Empty config uses defaults
  it('creates handler with default empty config', async () => {
    const fn = extractFixtureFn(fixtures['sapAuth']);
    const config = { url: '', username: '', password: '' };

    await runFixture(fn, { sapAuthConfig: config });

    expect(mockCreateAuthStrategy).toHaveBeenCalledWith(config);
    expect(mockSAPAuthHandler).toHaveBeenCalledOnce();
  });

  // Test 9: Fixture teardown does not call logout
  it('fixture teardown does not invoke handler.logout()', async () => {
    const fn = extractFixtureFn(fixtures['sapAuth']);
    // eslint-disable-next-line sonarjs/no-hardcoded-passwords -- Test fixtures use known values
    const config = { url: 'https://sap.example.com', username: 'admin', password: 'secret' };

    let capturedHandler: unknown;
    const useFn = async (value: unknown): Promise<void> => {
      capturedHandler = value;
      await Promise.resolve();
    };

    // Run fixture including teardown
    await fn({ sapAuthConfig: config }, useFn);

    const handlerInstance = capturedHandler as { logout: ReturnType<typeof vi.fn> };
    expect(handlerInstance.logout).not.toHaveBeenCalled();
  });

  // Test: sapAuth provides a handler with logger
  it('constructs handler with a logger object', async () => {
    const fn = extractFixtureFn(fixtures['sapAuth']);
    // eslint-disable-next-line sonarjs/no-hardcoded-passwords -- Test fixtures use known values
    const config = { url: 'https://sap.example.com', username: 'admin', password: 'secret' };

    await runFixture(fn, { sapAuthConfig: config });

    expect(mockSAPAuthHandler).toHaveBeenCalledWith(
      expect.objectContaining({
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment -- vitest expect.objectContaining returns any
        logger: expect.objectContaining({
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment -- vitest expect.any returns any
          info: expect.any(Function),
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment -- vitest expect.any returns any
          error: expect.any(Function),
        }),
      }),
    );
  });

  // Test: fixtureLogger no-op functions execute without error
  it('fixtureLogger.info() is a no-op that does not throw', async () => {
    const fn = extractFixtureFn(fixtures['sapAuth']);
    // eslint-disable-next-line sonarjs/no-hardcoded-passwords -- Test fixtures use known values
    const config = { url: 'https://sap.example.com', username: 'admin', password: 'secret' };

    await runFixture(fn, { sapAuthConfig: config });

    // Extract the logger passed to SAPAuthHandler constructor
    const constructorCall = mockSAPAuthHandler.mock.calls[0] as [
      { readonly strategy: unknown; readonly logger: { info(): void; error(): void } },
    ];
    const logger = constructorCall[0].logger;

    // Calling no-op info should not throw
    expect(() => {
      logger.info();
    }).not.toThrow();
  });

  it('fixtureLogger.warn() is a no-op that does not throw', async () => {
    const fn = extractFixtureFn(fixtures['sapAuth']);
    // eslint-disable-next-line sonarjs/no-hardcoded-passwords -- Test fixtures use known values
    const config = { url: 'https://sap.example.com', username: 'admin', password: 'secret' };

    await runFixture(fn, { sapAuthConfig: config });

    const constructorCall = mockSAPAuthHandler.mock.calls[0] as [
      {
        readonly strategy: unknown;
        readonly logger: { info(): void; warn(): void; error(): void };
      },
    ];
    const logger = constructorCall[0].logger;

    expect(() => {
      logger.warn();
    }).not.toThrow();
  });

  it('fixtureLogger.error() is a no-op that does not throw', async () => {
    const fn = extractFixtureFn(fixtures['sapAuth']);
    // eslint-disable-next-line sonarjs/no-hardcoded-passwords -- Test fixtures use known values
    const config = { url: 'https://sap.example.com', username: 'admin', password: 'secret' };

    await runFixture(fn, { sapAuthConfig: config });

    // Extract the logger passed to SAPAuthHandler constructor
    const constructorCall = mockSAPAuthHandler.mock.calls[0] as [
      { readonly strategy: unknown; readonly logger: { info(): void; error(): void } },
    ];
    const logger = constructorCall[0].logger;

    // Calling no-op error should not throw
    expect(() => {
      logger.error();
    }).not.toThrow();
  });
});

describe('auth-fixtures type exports', () => {
  it('exports AuthFixtures type with sapAuth property', async () => {
    const mod = await import('#fixtures/auth-fixtures.js');
    // Type-level check: AuthFixtures should exist as an export
    expect(mod).toHaveProperty('authTest');
  });

  it('exports AuthFixtureOptions type via module', async () => {
    // Module export check — type-only exports won't show at runtime,
    // but the authTest object should be available
    const mod = await import('#fixtures/auth-fixtures.js');
    expect(typeof mod.authTest).not.toBe('undefined');
  });
});
