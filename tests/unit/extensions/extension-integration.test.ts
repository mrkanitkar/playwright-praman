/**
 * @license
 * Copyright (c) ZesTest 2025-2030. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0
 *
 * This file may contain AI-assisted code.
 * See LICENSE and NOTICE files for details.
 */

/**
 * Integration tests for the extension system with fixture application.
 *
 * @remarks
 * Tests that extension factories receive correct context and that
 * the `withStability` wrapping pattern works with custom extensions.
 */
import { afterEach, describe, expect, it, vi } from 'vitest';

import {
  clearExtensions,
  extendUI5Handler,
  getExtensions,
} from '#extensions/extension-registry.js';
import type { ExtensionContext } from '#extensions/extension-types.js';
import { withStability } from '#fixtures/module-fixtures.js';

describe('Extension integration', () => {
  afterEach(() => {
    clearExtensions();
  });

  it('factory receives ExtensionContext and returns methods', () => {
    const factorySpy = vi.fn((ctx: ExtensionContext) => ({
      // eslint-disable-next-line @typescript-eslint/require-await -- test stub
      async myMethod(): Promise<string> {
        return `page:${typeof ctx.page},handler:${typeof ctx.handler}`;
      },
    }));

    extendUI5Handler('testExt', factorySpy);

    const extensions = getExtensions();
    expect(extensions).toHaveLength(1);

    // Simulate fixture creation: call factory with mock context
    const mockContext: ExtensionContext = {
      page: {} as ExtensionContext['page'],
      handler: {} as ExtensionContext['handler'],
      config: {} as ExtensionContext['config'],
    };

    const ext = extensions[0];
    expect(ext).toBeDefined();
    if (ext !== undefined) {
      const methods = ext.factory(mockContext);
      expect(typeof methods['myMethod']).toBe('function');
    }
  });

  it('factory methods are callable and return expected values', async () => {
    const factory = (): { add: (a: number, b: number) => Promise<number> } => ({
      // eslint-disable-next-line @typescript-eslint/require-await -- test stub
      async add(a: number, b: number): Promise<number> {
        return a + b;
      },
    });

    extendUI5Handler('calc', factory);

    const methods = factory();
    const result = await methods.add(2, 3);
    expect(result).toBe(5);
  });

  it('withStability wraps extension methods with guard', async () => {
    const guardCalls: string[] = [];
    const guard = async (): Promise<void> => {
      guardCalls.push('guard');
      await Promise.resolve();
    };

    const methods = {
      // eslint-disable-next-line @typescript-eslint/require-await -- test stub
      async doWork(): Promise<string> {
        return 'result';
      },
    };

    const wrapped = withStability(methods, guard, 'myExt');
    const result = await wrapped.doWork();

    expect(result).toBe('result');
    expect(guardCalls).toHaveLength(1);
  });

  it('multiple extensions coexist independently', () => {
    extendUI5Handler('ext1', () => ({
      // eslint-disable-next-line @typescript-eslint/require-await -- test stub
      async method1(): Promise<string> {
        return 'from-ext1';
      },
    }));
    extendUI5Handler('ext2', () => ({
      // eslint-disable-next-line @typescript-eslint/require-await -- test stub
      async method2(): Promise<string> {
        return 'from-ext2';
      },
    }));

    const extensions = getExtensions();
    expect(extensions).toHaveLength(2);
    expect(extensions[0]?.name).toBe('ext1');
    expect(extensions[1]?.name).toBe('ext2');
  });

  it('extension factory has access to config', () => {
    const receivedConfig: unknown[] = [];

    extendUI5Handler('configReader', (ctx) => {
      receivedConfig.push(ctx.config);
      return {
        async noop(): Promise<void> {
          // no-op
        },
      };
    });

    const mockConfig = { logLevel: 'info' } as ExtensionContext['config'];
    const ext = getExtensions()[0];
    expect(ext).toBeDefined();
    ext?.factory({
      page: {} as ExtensionContext['page'],
      handler: {} as ExtensionContext['handler'],
      config: mockConfig,
    });

    expect(receivedConfig).toHaveLength(1);
    expect(receivedConfig[0]).toBe(mockConfig);
  });
});
