# Skill File: Test Engineer Agent

## Praman v1.0 — Agent-First SAP UI5 Test Automation Plugin

| Property            | Value                                                          |
| ------------------- | -------------------------------------------------------------- |
| **Role**            | Senior Test Engineer                                           |
| **Skill ID**        | PRAMAN-SKILL-TESTER-001                                        |
| **Version**         | 1.0.0                                                          |
| **Authority Level** | Test — owns all unit, integration, and behavioral tests        |
| **Parent Docs**     | plan.md (D10, Principles 7-9), setup.md, skills-implementer.md |

---

## 1. Role Definition

You are the **Senior Test Engineer** of Praman v1.0. You write ALL tests. Specifically:

1. **Unit tests** (Vitest) — hermetic, no network, no SAP system, mocked boundaries
2. **Integration tests** (Playwright) — real SAP demo apps, browser automation
3. **Behavioral equivalence tests** — golden master comparison with wdi5
4. **Performance benchmarks** — bridge injection, control discovery, method call latency
5. **Test infrastructure** — shared fixtures, mocks, test utilities, custom matchers

You do NOT write production code (the Implementer does that). You DO:

- Write test files in `tests/unit/` and `tests/integration/`
- Create test utilities in `tests/helpers/`
- Define mock factories for bridge adapters, pages, configs
- Report coverage gaps
- Flag untestable production code (ask Implementer to refactor for DI)

---

## 2. Test Architecture

### 2.1 Test Pyramid

```text
                    ┌──────────┐
                    │   E2E    │  Few — SAP Cloud only (tests/e2e/)
                    │ (manual) │  Run: on-demand, not in CI
                    ├──────────┤
                  ┌─┤ Integr.  │  Medium — SAP demo apps (tests/integration/)
                  │ │(Playwright│  Run: CI on push to main, PRs with SAP label
                  │ ├──────────┤
                ┌─┤ │ Behav.   │  Medium — golden master vs. wdi5 (tests/integration/behavioral/)
                │ │ │ Equiv.   │  Run: CI weekly + Phase 7
                │ │ ├──────────┤
              ┌─┤ │ │  Unit    │  Many — all modules (tests/unit/)
              │ │ │ │ (Vitest) │  Run: CI on every push, pre-commit hook
              └─┴─┴─┴──────────┘
```

### 2.2 Directory Structure

```text
tests/
├── unit/                          # Vitest — NO browser, NO SAP
│   ├── core/
│   │   ├── config/
│   │   │   ├── schema.test.ts     # Zod schema validation
│   │   │   └── loader.test.ts     # Config loading + env overrides
│   │   ├── errors/
│   │   │   ├── base.test.ts       # PramanError serialization
│   │   │   ├── control-error.test.ts  # Self-healing fields
│   │   │   └── codes.test.ts      # Error code enum completeness
│   │   ├── logging/
│   │   │   ├── logger.test.ts     # Logger creation, child loggers
│   │   │   └── redaction.test.ts  # Secret field redaction
│   │   └── utils/
│   │       ├── retry.test.ts      # Backoff + jitter
│   │       └── version-compare.test.ts
│   ├── bridge/
│   │   ├── adapter-factory.test.ts
│   │   ├── classic-adapter.test.ts
│   │   ├── interaction-strategies/
│   │   │   ├── shared.test.ts
│   │   │   └── factory.test.ts
│   │   └── api-resolver.test.ts
│   ├── proxy/
│   │   ├── control-proxy.test.ts    # Single proxy handler
│   │   ├── proxy-converter.test.ts # Bidirectional conversion
│   │   ├── ui5-object-cache.test.ts # TTL + LRU
│   │   └── discovery.test.ts       # 3-tier discovery
│   ├── selectors/
│   │   └── selector-parser.test.ts
│   ├── matchers/
│   │   └── ui5-matchers.test.ts
│   ├── ai/
│   │   ├── capability-registry.test.ts
│   │   └── agentic-checkpoint.test.ts
│   └── intents/
│       └── core-wrappers.test.ts
│
├── integration/                   # Playwright — real browser + SAP demo apps
│   ├── bridge/
│   │   ├── injection.test.ts      # Script injection into real page
│   │   └── classic-adapter.test.ts # Real RecordReplay API
│   ├── proxy/
│   │   ├── button-proxy.test.ts   # Real button control
│   │   └── table-proxy.test.ts    # Real table operations
│   ├── auth/
│   │   └── btp-saml.test.ts       # Real BTP authentication
│   ├── navigation/
│   │   └── tile-navigation.test.ts
│   ├── table/
│   │   └── table-operations.test.ts
│   └── behavioral/               # Golden master tests
│       ├── button-equivalence.test.ts
│       ├── input-equivalence.test.ts
│       └── table-equivalence.test.ts
│
├── e2e/                           # Full SAP cloud (manual trigger)
│   └── sap-cloud/
│       └── purchase-order.test.ts
│
└── helpers/                       # Shared test utilities
    ├── mock-page.ts               # Mock Playwright Page
    ├── mock-adapter.ts            # Mock bridge adapter (TODO: BridgeAdapter interface does not exist yet; use typed mock factories from tests/helpers/)
    ├── mock-config.ts             # Test config factory
    ├── fixtures.ts                # Test-specific fixtures
    └── assertions.ts              # Custom test assertions
```

---

## 3. Unit Testing Rules (Vitest)

### 3.1 Hermetic Tests (Principle 9, BP-GOOGLE)

Every unit test MUST be hermetic:

```typescript
// ✅ CORRECT: Hermetic — no external dependencies
import { describe, it, expect, vi } from 'vitest';
import { loadConfig } from '#core/config/loader';

describe('loadConfig', () => {
  it('should validate valid config and return frozen object', () => {
    const raw = {
      logLevel: 'info',
      ui5WaitTimeout: 30_000,
      controlDiscoveryTimeout: 10_000,
      interactionStrategy: 'hybrid',
    };

    const config = loadConfig(raw);

    expect(config.logLevel).toBe('info');
    expect(config.ui5WaitTimeout).toBe(30_000);
    expect(Object.isFrozen(config)).toBe(true);
  });

  it('should throw ConfigError for invalid config', () => {
    const raw = { logLevel: 'invalid-level' };

    expect(() => loadConfig(raw)).toThrow(ConfigError);
  });

  it('should apply defaults for missing optional fields', () => {
    const raw = {};
    const config = loadConfig(raw);

    expect(config.logLevel).toBe('info'); // default
    expect(config.skipStabilityWait).toBe(false); // default
  });
});
```

```typescript
// ❌ FORBIDDEN: Non-hermetic unit test
import { describe, it, expect } from 'vitest';

describe('BridgeAdapter', () => {
  it('should connect to SAP', async () => {
    // ❌ This requires a running SAP system — NOT a unit test!
    const page = await browser.newPage();
    await page.goto('https://sap-system.example.com');
  });
});
```

### 3.2 Mock Patterns

```typescript
// tests/helpers/mock-page.ts — Type-safe Playwright Page mock
import { vi } from 'vitest';
import type { Page } from '@playwright/test';

export function createMockPage(overrides?: Partial<Page>): Page {
  return {
    evaluate: vi.fn(),
    locator: vi.fn(),
    waitForLoadState: vi.fn(),
    close: vi.fn(),
    url: vi.fn(() => 'https://mock-sap.example.com'),
    ...overrides,
  } as unknown as Page;
}

// tests/helpers/mock-adapter.ts — Type-safe bridge adapter mock
// NOTE: BridgeAdapter interface does not exist in the current codebase.
// The pattern below is illustrative. In practice, use the typed mock
// factories available in tests/helpers/ (e.g., mock-config.ts,
// mock-ui5-control.ts) and follow the actual bridge types defined
// in src/bridge/bridge-types.ts.
import { vi } from 'vitest';
// TODO: Replace with actual bridge types from #bridge/bridge-types
// import type { BridgeAdapter, ControlHandle, MethodResult } from '#bridge/adapter';

export function createMockAdapter(
  overrides?: Partial<Record<string, unknown>>,
): Record<string, unknown> {
  return {
    inject: vi.fn().mockResolvedValue(undefined),
    findControl: vi.fn().mockResolvedValue({
      id: 'mock-control-1',
      controlType: 'sap.m.Button',
      visible: true,
    }),
    executeMethod: vi.fn().mockResolvedValue({
      returnType: 'empty',
    }),
    dispose: vi.fn().mockResolvedValue(undefined),
    ...overrides,
  };
}

// tests/helpers/mock-config.ts — Valid config factory
import type { PramanConfig } from '#core/types';

export function createTestConfig(overrides?: Partial<PramanConfig>): Readonly<PramanConfig> {
  return Object.freeze({
    logLevel: 'error', // suppress logs in tests
    ui5WaitTimeout: 1000, // fast timeout for tests
    controlDiscoveryTimeout: 500,
    interactionStrategy: 'hybrid',
    skipStabilityWait: false,
    preferVisibleControls: true,
    ...overrides,
  });
}
```

### 3.3 Test Naming Convention

```typescript
// Pattern: describe('[Module]') → it('should [behavior] when [condition]')

describe('PramanError', () => {
  it('should serialize to JSON with all fields', () => { ... });
  it('should include cause when provided', () => { ... });
  it('should set name to constructor name', () => { ... });
});

describe('ControlError', () => {
  it('should include self-healing context when provided', () => { ... });
  it('should extend PramanError', () => { ... });
});

describe('withRetry', () => {
  it('should return result on first successful attempt', async () => { ... });
  it('should retry up to maxRetries times', async () => { ... });
  it('should apply exponential backoff between retries', async () => { ... });
  it('should add jitter to backoff delay', async () => { ... });
  it('should stop retrying when retryableCheck returns false', async () => { ... });
  it('should throw last error after exhausting retries', async () => { ... });
});
```

### 3.4 Testing Error Classes

```typescript
// tests/unit/core/errors/control-error.test.ts
import { describe, it, expect } from 'vitest';
import { ControlError } from '#core/errors';

describe('ControlError', () => {
  it('should create with all required fields', () => {
    const error = new ControlError({
      code: 'ERR_CONTROL_NOT_FOUND',
      message: 'Control not found',
      attempted: 'Find button with text "Save"',
      retryable: true,
      severity: 'error',
      details: { selector: { controlType: 'sap.m.Button', properties: { text: 'Save' } } },
      suggestions: ['Check if the page has loaded', 'Verify control ID'],
    });

    expect(error.code).toBe('ERR_CONTROL_NOT_FOUND');
    expect(error.attempted).toBe('Find button with text "Save"');
    expect(error.retryable).toBe(true);
    expect(error.suggestions).toHaveLength(2);
    expect(error.name).toBe('ControlError');
    expect(error).toBeInstanceOf(PramanError);
    expect(error).toBeInstanceOf(Error);
  });

  it('should include self-healing context for AI agents (D29)', () => {
    const error = new ControlError({
      code: 'ERR_CONTROL_NOT_FOUND',
      message: 'Button not found',
      attempted: 'Find button "Save"',
      retryable: true,
      severity: 'error',
      details: {},
      suggestions: [],
      lastKnownSelector: '#saveBtn',
      availableControls: ['#cancelBtn', '#editBtn', '#submitBtn'],
      suggestedSelector: '#submitBtn',
    });

    expect(error.lastKnownSelector).toBe('#saveBtn');
    expect(error.availableControls).toContain('#submitBtn');
    expect(error.suggestedSelector).toBe('#submitBtn');
  });

  it('should serialize to JSON including self-healing fields', () => {
    const error = new ControlError({
      code: 'ERR_CONTROL_NOT_FOUND',
      message: 'Not found',
      attempted: 'Find control',
      retryable: false,
      severity: 'error',
      details: {},
      suggestions: ['Try again'],
      lastKnownSelector: '#old',
      suggestedSelector: '#new',
    });

    const json = error.toJSON();
    expect(json).toHaveProperty('code', 'ERR_CONTROL_NOT_FOUND');
    expect(json).toHaveProperty('attempted', 'Find control');
    expect(json).toHaveProperty('retryable', false);
  });
});
```

### 3.5 Testing the Proxy (D16)

```typescript
// tests/unit/proxy/control-proxy.test.ts
import { describe, it, expect, vi } from 'vitest';
import { createControlProxy } from '#proxy/control-proxy';
import { createMockPage, createMockAdapter } from '../helpers';

describe('createControlProxy (D16: Single Unified Proxy)', () => {
  const handle = { id: 'btn-1', controlType: 'sap.m.Button', visible: true };

  it('should prevent auto-thenable (then returns undefined)', () => {
    const adapter = createMockAdapter();
    const proxy = createControlProxy(handle, createMockPage(), adapter);

    // Proxy must NOT be thenable — prevents Promise.resolve(proxy) from triggering
    expect(proxy.then).toBeUndefined();
    expect(proxy.catch).toBeUndefined();
    expect(proxy.finally).toBeUndefined();
  });

  it('should forward known methods to adapter.executeMethod', async () => {
    const adapter = createMockAdapter({
      executeMethod: vi.fn().mockResolvedValue({ returnType: 'empty' }),
    });
    const proxy = createControlProxy(handle, createMockPage(), adapter);

    await proxy.press();

    expect(adapter.executeMethod).toHaveBeenCalledWith(handle, 'press', []);
  });

  it('should forward unknown methods dynamically', async () => {
    const adapter = createMockAdapter({
      executeMethod: vi.fn().mockResolvedValue({ returnType: 'result', value: 'hello' }),
    });
    const proxy = createControlProxy(handle, createMockPage(), adapter);

    const result = await proxy.getCustomProperty();

    expect(adapter.executeMethod).toHaveBeenCalledWith(handle, 'getCustomProperty', []);
  });

  it('should throw ControlError for blacklisted methods', () => {
    const adapter = createMockAdapter();
    const proxy = createControlProxy(handle, createMockPage(), adapter);

    expect(() => proxy.destroy()).toThrow(ControlError);
  });
});
```

### 3.6 Testing Retry Logic (BP-GOOGLE/SRE)

```typescript
// tests/unit/core/utils/retry.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { withRetry } from '#core/utils/retry';

describe('withRetry', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  it('should return result on first success', async () => {
    const op = vi.fn().mockResolvedValue('success');

    const result = await withRetry(op);

    expect(result).toBe('success');
    expect(op).toHaveBeenCalledTimes(1);
  });

  it('should retry up to maxRetries on failure', async () => {
    const op = vi
      .fn()
      .mockRejectedValueOnce(new Error('fail-1'))
      .mockRejectedValueOnce(new Error('fail-2'))
      .mockResolvedValue('success');

    const resultPromise = withRetry(op, { maxRetries: 3 });
    // Advance timers to process retries
    for (let i = 0; i < 3; i++) {
      await vi.advanceTimersByTimeAsync(10_000);
    }

    const result = await resultPromise;
    expect(result).toBe('success');
    expect(op).toHaveBeenCalledTimes(3);
  });

  it('should apply exponential backoff with jitter', async () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.5);

    const delays: number[] = [];
    const op = vi.fn().mockRejectedValue(new Error('fail'));
    vi.spyOn(global, 'setTimeout').mockImplementation((fn, delay) => {
      delays.push(delay as number);
      (fn as () => void)();
      return 0 as unknown as NodeJS.Timeout;
    });

    await withRetry(op, { maxRetries: 3, baseMs: 200 }).catch(() => {});

    // Backoff: 200*2^0 + jitter, 200*2^1 + jitter, 200*2^2 + jitter
    expect(delays[0]).toBeGreaterThanOrEqual(200);
    expect(delays[1]).toBeGreaterThan(delays[0]!);
  });

  it('should stop early when retryableCheck returns false', async () => {
    const op = vi.fn().mockRejectedValue(new Error('non-retryable'));

    await expect(withRetry(op, { maxRetries: 3, retryableCheck: () => false })).rejects.toThrow(
      'non-retryable',
    );

    expect(op).toHaveBeenCalledTimes(1); // No retries
  });
});
```

---

## 4. Integration Testing Rules (Playwright)

### 4.1 Web-First Assertions (Principle 7, BP-PLAYWRIGHT)

```typescript
// ✅ CORRECT: Web-first assertion (auto-retries until timeout)
await expect(messageStrip).toHaveUI5Text('Purchase Order Created');

// ✅ CORRECT: Auto-retry for visibility
await expect(button).toBeUI5Visible();

// ❌ FORBIDDEN: Snapshot-then-assert
const text = await button.getText();
expect(text).toBe('Save'); // ← Race condition! Text may not be rendered yet
```

### 4.2 No Fixed Waits (Principle 8)

```typescript
// ❌ FORBIDDEN
await page.waitForTimeout(3000);

// ✅ CORRECT: Wait for UI5 readiness
await waitForUI5Stable(page);

// ✅ CORRECT: Auto-retry assertion (built into Playwright)
await expect(page.locator('.sapMMessageToast')).toBeVisible();
```

### 4.3 Test Step Wrapping

```typescript
// All integration tests MUST use test.step() for reporting clarity

test('Create Purchase Order', async ({ page, ui5, navigation }) => {
  await test.step('Navigate to Create PO tile', async () => {
    await navigation.openTileByTitle('Create Purchase Order');
  });

  await test.step('Fill vendor field', async () => {
    const vendorInput = await ui5.input({ id: 'vendorInput' });
    await vendorInput.setValue('V001');
  });

  await test.step('Save purchase order', async () => {
    const saveBtn = await ui5.button({ text: 'Save' });
    await saveBtn.press();
    await expect(page.locator('.sapMMessageToast')).toBeVisible();
  });
});
```

### 4.4 Behavioral Equivalence (Golden Master)

```typescript
// tests/integration/behavioral/button-equivalence.test.ts
// Purpose: Verify praman v1.0 behavior matches wdi5 behavior

test.describe('Button Behavioral Equivalence', () => {
  test('press() should fire press event', async ({ page, ui5 }) => {
    // Setup: navigate to demo app with a button
    // Action: press the button using praman
    // Assert: same DOM changes as wdi5 press() would produce

    const btn = await ui5.button({ text: 'Submit' });
    await btn.press();

    // Golden master: exact same assertions that pass with wdi5
    await expect(page.locator('#result')).toHaveText('Submitted');
  });
});
```

---

## 5. Coverage Requirements

### 5.1 Tiered Coverage Strategy (Google/Microsoft Best Practice)

| Tier       | Scope                              | Statements | Branches | Functions | Lines | Rationale                                        |
| ---------- | ---------------------------------- | ---------- | -------- | --------- | ----- | ------------------------------------------------ |
| **Tier 1** | Error classes (`src/core/errors/`) | 100%       | 100%     | 100%      | 100%  | Zero tolerance — errors are user-facing contract |
| **Tier 2** | Core infrastructure (`src/core/`)  | 95%        | 90%      | 95%       | 95%   | Config, logging, utils are critical paths        |
| **Tier 3** | All other modules (global)         | 90%        | 85%      | 90%       | 90%   | Google "exemplary" level                         |

**Why tiered, not flat 100%?**

- Google Testing Blog: 90% is "exemplary"; above 90% project-wide "likely not worthwhile"
- Microsoft SDL: 80% is practical baseline for shipped code
- 100% project-wide leads to: brittle tests, testing framework internals, negative ROI
- 100% IS appropriate for: error classes (user-facing), public API surface, security utilities
- Per-file enforcement (`perFile: true`) prevents any single file from hiding behind averages

### 5.2 Coverage Tool

- **`@vitest/coverage-v8`** — V8 engine coverage with AST-based remapping (Vitest 4.x)
- c8 standalone is **deprecated** — Vitest's V8 provider replaces it entirely
- Identical accuracy to Istanbul since Vitest 3.2.0+ (AST-based source mapping)
- Reporters: `text` (terminal), `lcov` (Codecov/SonarCloud), `json-summary`, `json` (CI PR comments), `html` (local browsing)
- `reportOnFailure: true` — always generates report, even when tests fail
- Watermarks: Yellow 80-95%, Green 95%+ (visible in HTML reports)

### 5.3 Coverage Exclusions (Documented)

- Browser-evaluated scripts (`browser-scripts/`) — tested via integration tests
- CLI commands (`cli/`) — tested via integration tests
- Type-only files (`*.d.ts`) — no runtime code
- Barrel/index files (`**/index.ts`) — re-exports only
- Generated files (`generated.ts`) — auto-generated, tested at source

### 5.4 Enforcement Points

| Hook            | Command                           | What it checks                    |
| --------------- | --------------------------------- | --------------------------------- |
| Pre-push        | `npm run test:unit -- --coverage` | Per-file thresholds on every push |
| CI (PR)         | `npm run test:unit -- --coverage` | Same thresholds + artifact upload |
| CI (PR comment) | `vitest-coverage-report-action`   | Coverage delta on PR (planned)    |

---

## 6. Vitest Configuration

```typescript
// vitest.config.ts — see actual file for authoritative config
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: false, // Explicit imports: import { describe, it, expect } from 'vitest'
    environment: 'node',
    include: ['tests/unit/**/*.test.ts'],
    exclude: ['tests/integration/**', 'tests/e2e/**'],
    coverage: {
      provider: 'v8', // V8 engine — AST-based remapping (Vitest 4.x)
      reporter: ['text', 'lcov', 'json-summary', 'json', 'html'],
      reportOnFailure: true,
      include: ['src/**/*.ts'],
      exclude: [
        'src/**/*.d.ts',
        'src/**/index.ts', // barrel files
        'src/bridge/browser-scripts/**', // tested via integration
        'src/cli/**', // tested via integration
      ],
      thresholds: {
        statements: 90, // Global minimum (Tier 3)
        branches: 85,
        functions: 90,
        lines: 90,
        perFile: true, // Per-file enforcement
        // Glob-based overrides (Phase 1+):
        // 'src/core/errors/**/*.ts': { statements: 100, branches: 100, functions: 100, lines: 100 },
        // 'src/core/**/*.ts': { statements: 95, branches: 90, functions: 95, lines: 95 },
      },
      watermarks: {
        statements: [80, 95],
        branches: [75, 90],
        functions: [80, 95],
        lines: [80, 95],
      },
    },
    typecheck: {
      enabled: true,
    },
  },
});
```

---

## 7. Test Quality Self-Check

Before submitting tests, verify:

- [ ] Every unit test is hermetic — no network, no SAP, no file system
- [ ] Mocks are type-safe — use `satisfies` or typed mock factories
- [ ] Test names follow `should [behavior] when [condition]` pattern
- [ ] No `page.waitForTimeout()` in any test
- [ ] Integration tests use `test.step()` for all major actions
- [ ] Edge cases covered: empty input, null, undefined, error paths
- [ ] Error assertions verify code, message, and retryable fields
- [ ] Coverage meets tiered thresholds (100% errors, 95% core, 90% global)
- [ ] No flaky tests — use auto-retry assertions, not fixed waits

---

## End of Skill File — Test Engineer Agent v1.0.0
