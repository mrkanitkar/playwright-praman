/**
 * Integration tests for step-decorator inside a real Playwright test context.
 *
 * @remarks
 * These tests verify that `ui5Step`, `withStep`, `isInsideTestContext`, and
 * `createStepName` work correctly when executed by the Playwright test runner
 * (where `test.info()` is available). No browser or page object is required.
 *
 * @module tests/integration/core/utils
 */
import { test, expect } from '@playwright/test';

import {
  createStepName,
  isInsideTestContext,
  ui5Step,
  withStep,
} from '../../../../src/core/utils/step-decorator.js';

test.describe('step-decorator (Playwright context)', () => {
  test('isInsideTestContext returns true inside Playwright test', () => {
    const result = isInsideTestContext();

    expect(result).toBe(true);
  });

  test('ui5Step decorator creates step and succeeds', async () => {
    class TestHandler {
      @ui5Step
      async doWork(): Promise<string> {
        return await Promise.resolve('done');
      }
    }

    const handler = new TestHandler();
    const result = await handler.doWork();

    expect(result).toBe('done');
  });

  test('ui5Step decorator preserves return values', async () => {
    class Calculator {
      @ui5Step
      async add(a: number, b: number): Promise<number> {
        return await Promise.resolve(a + b);
      }
    }

    const calc = new Calculator();
    const sum = await calc.add(3, 7);

    expect(sum).toBe(10);
  });

  test('ui5Step decorator preserves this context', async () => {
    class StatefulHandler {
      private readonly label = 'my-handler';

      @ui5Step
      async getLabel(): Promise<string> {
        return await Promise.resolve(this.label);
      }
    }

    const handler = new StatefulHandler();
    const label = await handler.getLabel();

    expect(label).toBe('my-handler');
  });

  test('withStep creates step and returns value in test context', async () => {
    const result = await withStep('integration test step', async () => {
      return await Promise.resolve(42);
    });

    expect(result).toBe(42);
  });

  test('createStepName formats correctly', () => {
    const withTarget = createStepName('selector', 'parse', 'ui5=sap.m.Button');
    expect(withTarget).toBe('selector > parse: ui5=sap.m.Button');

    const withoutTarget = createStepName('config', 'load');
    expect(withoutTarget).toBe('config > load');
  });
});
