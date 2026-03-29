/**
 * @license
 * Copyright (c) ZesTest 2025-2030. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0
 *
 * This file may contain AI-assisted code.
 * See LICENSE and NOTICE files for details.
 */

/**
 * Tests for `src/extensions/extension-registry.ts`.
 *
 * @remarks
 * Validates extension registration, retrieval, validation, and cleanup.
 */
import { afterEach, describe, expect, it } from 'vitest';

import { PluginError } from '#core/errors/plugin-error.js';
import {
  clearExtensions,
  extendUI5Handler,
  getExtensions,
  hasExtension,
} from '#extensions/extension-registry.js';
import { RESERVED_NAMESPACES } from '#extensions/extension-types.js';

/** Minimal factory for testing — returns a no-op async method. */
const dummyFactory = (): { doSomething: () => Promise<string> } => ({
  // eslint-disable-next-line @typescript-eslint/require-await -- test stub
  async doSomething(): Promise<string> {
    return 'done';
  },
});

describe('extendUI5Handler', () => {
  afterEach(() => {
    clearExtensions();
  });

  it('registers an extension successfully', () => {
    extendUI5Handler('myExt', dummyFactory);

    const extensions = getExtensions();
    expect(extensions).toHaveLength(1);
    expect(extensions[0]?.name).toBe('myExt');
  });

  it('registers multiple extensions in order', () => {
    extendUI5Handler('first', dummyFactory);
    extendUI5Handler('second', dummyFactory);

    const extensions = getExtensions();
    expect(extensions).toHaveLength(2);
    expect(extensions[0]?.name).toBe('first');
    expect(extensions[1]?.name).toBe('second');
  });

  it('rejects empty extension names', () => {
    expect(() => {
      extendUI5Handler('', dummyFactory);
    }).toThrow(PluginError);
    expect(() => {
      extendUI5Handler('', dummyFactory);
    }).toThrow('non-empty string');
  });

  it('rejects whitespace-only extension names', () => {
    expect(() => {
      extendUI5Handler('   ', dummyFactory);
    }).toThrow(PluginError);
  });

  it('rejects non-function factories', () => {
    const notAFunction = 'not-a-function' as never;
    expect(() => {
      extendUI5Handler('bad', notAFunction);
    }).toThrow(PluginError);
    expect(() => {
      extendUI5Handler('bad', notAFunction);
    }).toThrow('must be a function');
  });

  it('rejects duplicate extension names', () => {
    extendUI5Handler('myExt', dummyFactory);

    expect(() => {
      extendUI5Handler('myExt', dummyFactory);
    }).toThrow(PluginError);
    expect(() => {
      extendUI5Handler('myExt', dummyFactory);
    }).toThrow('already registered');
  });

  it('sets ERR_PLUGIN_EXTENSION_DUPLICATE code for duplicates', () => {
    extendUI5Handler('dup', dummyFactory);

    try {
      extendUI5Handler('dup', dummyFactory);
      expect.unreachable('Should have thrown');
    } catch (error: unknown) {
      expect(error).toBeInstanceOf(PluginError);
      expect((error as PluginError).code).toBe('ERR_PLUGIN_EXTENSION_DUPLICATE');
    }
  });

  it('sets ERR_PLUGIN_EXTENSION_INVALID code for reserved names', () => {
    try {
      extendUI5Handler('table', dummyFactory);
      expect.unreachable('Should have thrown');
    } catch (error: unknown) {
      expect(error).toBeInstanceOf(PluginError);
      expect((error as PluginError).code).toBe('ERR_PLUGIN_EXTENSION_INVALID');
    }
  });

  it('rejects all reserved namespace names', () => {
    for (const reserved of RESERVED_NAMESPACES) {
      expect(() => {
        extendUI5Handler(reserved, dummyFactory);
      }).toThrow(PluginError);
    }
  });

  it('includes pluginName in thrown PluginError', () => {
    try {
      extendUI5Handler('table', dummyFactory);
      expect.unreachable('Should have thrown');
    } catch (error: unknown) {
      expect(error).toBeInstanceOf(PluginError);
      expect((error as PluginError).pluginName).toBe('table');
    }
  });
});

describe('getExtensions', () => {
  afterEach(() => {
    clearExtensions();
  });

  it('returns empty array when no extensions registered', () => {
    expect(getExtensions()).toHaveLength(0);
  });

  it('returns readonly array', () => {
    extendUI5Handler('ext1', dummyFactory);
    const extensions = getExtensions();
    expect(Array.isArray(extensions)).toBe(true);
  });
});

describe('hasExtension', () => {
  afterEach(() => {
    clearExtensions();
  });

  it('returns true for registered extension', () => {
    extendUI5Handler('myExt', dummyFactory);
    expect(hasExtension('myExt')).toBe(true);
  });

  it('returns false for unregistered extension', () => {
    expect(hasExtension('nonexistent')).toBe(false);
  });
});

describe('clearExtensions', () => {
  it('removes all registered extensions', () => {
    extendUI5Handler('ext1', dummyFactory);
    extendUI5Handler('ext2', dummyFactory);
    expect(getExtensions()).toHaveLength(2);

    clearExtensions();
    expect(getExtensions()).toHaveLength(0);
  });

  it('allows re-registration after clear', () => {
    extendUI5Handler('myExt', dummyFactory);
    clearExtensions();
    extendUI5Handler('myExt', dummyFactory);
    expect(hasExtension('myExt')).toBe(true);
  });
});
