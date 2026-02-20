/**
 * Tests for step-decorator.ts with mocked Playwright test context.
 *
 * @remarks
 * These tests mock `@playwright/test` to simulate being inside a Playwright
 * test runner context, exercising code paths that require `isInsideTestContext()`
 * to return true. This is a separate file from `step-decorator.test.ts` because
 * `vi.mock()` applies module-wide and would interfere with the existing tests
 * that rely on the real `@playwright/test` behavior (always returning false).
 *
 * @module utils
 */
import { beforeEach, describe, expect, it, vi } from 'vitest';

// Use vi.hoisted() so the mock variable is available when vi.mock() factory runs
// (vi.mock is hoisted above all imports; regular const declarations are not)
const { mockStep } = vi.hoisted(() => ({
  mockStep: vi.fn(),
}));

vi.mock('@playwright/test', () => ({
  test: {
    info: vi.fn().mockReturnValue({ title: 'mock test' }),
    step: mockStep,
  },
}));

// Import AFTER the vi.mock() call so the mock takes effect
import { isInsideTestContext, ui5Step, withStep } from '#core/utils/step-decorator.js';

describe('isInsideTestContext (mocked — returns true)', () => {
  it('returns true when test.info() succeeds', () => {
    expect(isInsideTestContext()).toBe(true);
  });

  it('returns a boolean value', () => {
    expect(typeof isInsideTestContext()).toBe('boolean');
  });
});

describe('withStep (mocked — inside test context)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Default: mockStep executes the provided function
    mockStep.mockImplementation(async (_name: string, fn: () => Promise<unknown>) => fn());
  });

  it('calls test.step() when inside test context', async () => {
    const fn = vi.fn().mockResolvedValue('result');

    await withStep('my step', fn);

    expect(mockStep).toHaveBeenCalledOnce();
    expect(mockStep).toHaveBeenCalledWith('my step', fn, { box: true });
  });

  it('propagates return value through test.step()', async () => {
    const result = await withStep('value step', async () => Promise.resolve(42));

    expect(result).toBe(42);
  });

  it('propagates errors from fn through test.step()', async () => {
    await expect(
      withStep('error step', async () => await Promise.reject(new Error('inner-error'))),
    ).rejects.toThrow('inner-error');
  });

  it('passes { box: true } options to test.step()', async () => {
    await withStep('boxed step', async () => Promise.resolve('ok'));

    const callArgs = mockStep.mock.calls[0] as unknown[];
    expect(callArgs[2]).toStrictEqual({ box: true });
  });
});

describe('ui5Step (mocked — inside test context)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Default: mockStep executes the provided function
    mockStep.mockImplementation(async (_name: string, fn: () => Promise<unknown>) => fn());
  });

  it('calls test.step() with generated step name', async () => {
    class TestHandler {
      @ui5Step
      async click(selector: { id: string }): Promise<string> {
        return Promise.resolve(`clicked ${selector.id}`);
      }
    }

    const handler = new TestHandler();
    await handler.click({ id: 'saveBtn' });

    expect(mockStep).toHaveBeenCalledOnce();
    // generateStepName('TestHandler', 'click', [{ id: 'saveBtn' }]) => 'Click { id: "saveBtn" }'
    const callArgs = mockStep.mock.calls[0] as unknown[];
    expect(callArgs[0]).toBe('Click { id: "saveBtn" }');
  });

  it('passes { box: true } to test.step()', async () => {
    class TestHandler {
      @ui5Step
      async getValue(): Promise<string> {
        return Promise.resolve('val');
      }
    }

    const handler = new TestHandler();
    await handler.getValue();

    const callArgs = mockStep.mock.calls[0] as unknown[];
    expect(callArgs[2]).toStrictEqual({ box: true });
  });

  it('propagates return value through test.step()', async () => {
    class TestHandler {
      @ui5Step
      async compute(): Promise<number> {
        return Promise.resolve(99);
      }
    }

    const handler = new TestHandler();
    const result = await handler.compute();

    expect(result).toBe(99);
  });

  it('preserves this context through test.step()', async () => {
    class TestHandler {
      readonly label = 'my-handler';

      @ui5Step
      async getLabel(): Promise<string> {
        return Promise.resolve(this.label);
      }
    }

    const handler = new TestHandler();
    const result = await handler.getLabel();

    expect(result).toBe('my-handler');
  });

  it('propagates errors from the decorated method through test.step()', async () => {
    class TestHandler {
      @ui5Step
      async failingMethod(): Promise<never> {
        return await Promise.reject(new Error('decorated-error'));
      }
    }

    const handler = new TestHandler();
    await expect(handler.failingMethod()).rejects.toThrow('decorated-error');
  });

  it('passes arguments through to the target method', async () => {
    class TestHandler {
      @ui5Step
      async add(a: number, b: number): Promise<number> {
        return Promise.resolve(a + b);
      }
    }

    const handler = new TestHandler();
    const result = await handler.add(10, 20);

    expect(result).toBe(30);
  });

  it('generates correct step name for methods without arguments', async () => {
    class TestHandler {
      @ui5Step
      async waitForUI5(): Promise<void> {
        await Promise.resolve();
      }
    }

    const handler = new TestHandler();
    await handler.waitForUI5();

    const callArgs = mockStep.mock.calls[0] as unknown[];
    // generateStepName('TestHandler', 'waitForUI5', []) => 'Wait for UI5'
    expect(callArgs[0]).toBe('Wait for UI5');
  });

  it('generates correct step name for unknown methods via camelCase conversion', async () => {
    class TestHandler {
      @ui5Step
      async customMethodName(): Promise<string> {
        return Promise.resolve('custom');
      }
    }

    const handler = new TestHandler();
    await handler.customMethodName();

    const callArgs = mockStep.mock.calls[0] as unknown[];
    // camelCaseToReadable('customMethodName') => 'Custom method name'
    expect(callArgs[0]).toBe('Custom method name');
  });

  it('handles test.step() rejecting by propagating the error', async () => {
    mockStep.mockRejectedValueOnce(new Error('step-failed'));

    class TestHandler {
      @ui5Step
      async doWork(): Promise<string> {
        return Promise.resolve('done');
      }
    }

    const handler = new TestHandler();
    await expect(handler.doWork()).rejects.toThrow('step-failed');
  });
});
