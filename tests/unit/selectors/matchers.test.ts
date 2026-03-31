/**
 * @license
 * Copyright (c) ZesTest 2025-2030. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0
 *
 * This file may contain AI-assisted code.
 * See LICENSE and NOTICE files for details.
 */

/**
 * Tests for `src/bridge/browser-scripts/find-control-matchers.ts`.
 *
 * @remarks
 * Covers property operators, ancestor matching, descendant matching,
 * i18N text matching, subclass type matching, and the expanded matchesSelector.
 */
import { describe, expect, it } from 'vitest';

import {
  getMethodFn,
  hasMatchingType,
  hasMatchingTypeWithSubclasses,
  matchesAncestor,
  matchesBindingPath,
  matchesDescendant,
  matchesI18NText,
  matchesProperties,
  matchesSelector,
} from '../../../src/bridge/browser-scripts/find-control-matchers.js';

/** Typed accessor for UI5 objects in the browser. */
type UI5Record = Record<string, unknown>;

/**
 * Creates a mock UI5 control with optional metadata, parent, and properties.
 *
 * @param opts - Control configuration options.
 * @returns A mock UI5Record that mimics a UI5 control.
 */
function createMockControl(opts: {
  typeName?: string;
  properties?: Record<string, unknown>;
  parent?: UI5Record | null;
  children?: UI5Record[];
  i18nBundle?: Record<string, string>;
  metadataParent?: { name: string; parent?: { name: string } };
}): UI5Record {
  const properties = opts.properties ?? {};
  const typeName = opts.typeName ?? 'sap.m.Button';

  // Build metadata chain for subclass support
  const buildMetaChain = (): UI5Record => {
    const parentMeta = opts.metadataParent;
    let parentMetaObj: UI5Record | null = null;

    if (parentMeta !== undefined) {
      const grandparentMeta: UI5Record | null =
        parentMeta.parent !== undefined
          ? {
              getName: () => parentMeta.parent?.name,
              getParent: () => null,
            }
          : null;

      parentMetaObj = {
        getName: () => parentMeta.name,
        getParent: () => grandparentMeta,
      };
    }

    return {
      getName: () => typeName,
      getParent: () => parentMetaObj,
    };
  };

  const ctrl: UI5Record = {
    getMetadata: () => buildMetaChain(),
    getParent: () => opts.parent ?? null,
    findAggregatedObjects: () => opts.children ?? [],
  };

  // Add property getters
  for (const propName of Object.keys(properties)) {
    const getterName = 'get' + propName.charAt(0).toUpperCase() + propName.slice(1);
    ctrl[getterName] = () => properties[propName];
  }

  // Add i18n model if specified
  if (opts.i18nBundle !== undefined) {
    const bundle = opts.i18nBundle;
    ctrl['getModel'] = (modelName: string) => {
      if (modelName === 'i18n') {
        return {
          getResourceBundle: () => ({
            getText: (key: string) => {
              const text: string | undefined = bundle[key];
              return text ?? key;
            },
          }),
        };
      }
      return null;
    };
  }

  return ctrl;
}

describe('getMethodFn', () => {
  it('returns function when method exists', () => {
    const obj: UI5Record = { getText: () => 'hello' };
    const fn = getMethodFn(obj, 'getText');
    expect(fn).toBeDefined();
    expect(fn?.call(obj)).toBe('hello');
  });

  it('returns undefined when method does not exist', () => {
    const obj: UI5Record = { text: 'hello' };
    expect(getMethodFn(obj, 'getText')).toBeUndefined();
  });
});

describe('hasMatchingType', () => {
  it('returns true for matching type', () => {
    const ctrl = createMockControl({ typeName: 'sap.m.Button' });
    expect(hasMatchingType(ctrl, 'sap.m.Button')).toBe(true);
  });

  it('returns false for non-matching type', () => {
    const ctrl = createMockControl({ typeName: 'sap.m.Input' });
    expect(hasMatchingType(ctrl, 'sap.m.Button')).toBe(false);
  });
});

describe('matchesProperties', () => {
  describe('strict equality', () => {
    it('matches single property', () => {
      const ctrl = createMockControl({ properties: { text: 'Save' } });
      expect(matchesProperties(ctrl, { text: 'Save' })).toBe(true);
    });

    it('rejects mismatched property', () => {
      const ctrl = createMockControl({ properties: { text: 'Cancel' } });
      expect(matchesProperties(ctrl, { text: 'Save' })).toBe(false);
    });

    it('matches multiple properties', () => {
      const ctrl = createMockControl({ properties: { text: 'Save', enabled: true } });
      expect(matchesProperties(ctrl, { text: 'Save', enabled: true })).toBe(true);
    });

    it('rejects when getter is missing', () => {
      const ctrl = createMockControl({ properties: {} });
      expect(matchesProperties(ctrl, { text: 'Save' })).toBe(false);
    });
  });

  describe('operator-based matching', () => {
    it('matches contains operator', () => {
      const ctrl = createMockControl({ properties: { text: 'Save Draft' } });
      expect(matchesProperties(ctrl, { text: { value: 'Draft', operator: 'contains' } })).toBe(
        true,
      );
    });

    it('rejects contains when substring not found', () => {
      const ctrl = createMockControl({ properties: { text: 'Cancel' } });
      expect(matchesProperties(ctrl, { text: { value: 'Save', operator: 'contains' } })).toBe(
        false,
      );
    });

    it('matches startsWith operator', () => {
      const ctrl = createMockControl({ properties: { text: 'Save Draft' } });
      expect(matchesProperties(ctrl, { text: { value: 'Save', operator: 'startsWith' } })).toBe(
        true,
      );
    });

    it('rejects startsWith when prefix does not match', () => {
      const ctrl = createMockControl({ properties: { text: 'Draft Save' } });
      expect(matchesProperties(ctrl, { text: { value: 'Save', operator: 'startsWith' } })).toBe(
        false,
      );
    });

    it('matches endsWith operator', () => {
      const ctrl = createMockControl({ properties: { text: 'Save Draft' } });
      expect(matchesProperties(ctrl, { text: { value: 'Draft', operator: 'endsWith' } })).toBe(
        true,
      );
    });

    it('rejects endsWith when suffix does not match', () => {
      const ctrl = createMockControl({ properties: { text: 'Draft Save' } });
      expect(matchesProperties(ctrl, { text: { value: 'Draft', operator: 'endsWith' } })).toBe(
        false,
      );
    });

    it('matches regex operator', () => {
      const ctrl = createMockControl({ properties: { text: 'Item 42' } });
      expect(matchesProperties(ctrl, { text: { value: 'Item \\d+', operator: 'regex' } })).toBe(
        true,
      );
    });

    it('rejects regex operator when pattern does not match', () => {
      const ctrl = createMockControl({ properties: { text: 'Item ABC' } });
      expect(matchesProperties(ctrl, { text: { value: '^Item \\d+$', operator: 'regex' } })).toBe(
        false,
      );
    });
  });
});

describe('matchesAncestor', () => {
  it('returns true when a parent matches the ancestor selector', () => {
    const grandparent = createMockControl({ typeName: 'sap.m.Page', parent: null });
    const parent = createMockControl({ typeName: 'sap.m.Dialog', parent: grandparent });
    const ctrl = createMockControl({ typeName: 'sap.m.Button', parent });
    expect(matchesAncestor(ctrl, { controlType: 'sap.m.Dialog' })).toBe(true);
  });

  it('returns true when grandparent matches', () => {
    const grandparent = createMockControl({ typeName: 'sap.m.Page', parent: null });
    const parent = createMockControl({ typeName: 'sap.m.VBox', parent: grandparent });
    const ctrl = createMockControl({ typeName: 'sap.m.Button', parent });
    expect(matchesAncestor(ctrl, { controlType: 'sap.m.Page' })).toBe(true);
  });

  it('returns false when no ancestor matches', () => {
    const parent = createMockControl({ typeName: 'sap.m.VBox', parent: null });
    const ctrl = createMockControl({ typeName: 'sap.m.Button', parent });
    expect(matchesAncestor(ctrl, { controlType: 'sap.m.Dialog' })).toBe(false);
  });

  it('returns false when control has no parent', () => {
    const ctrl = createMockControl({ typeName: 'sap.m.Button', parent: null });
    expect(matchesAncestor(ctrl, { controlType: 'sap.m.Dialog' })).toBe(false);
  });
});

describe('matchesDescendant', () => {
  it('returns true when a child matches the descendant selector', () => {
    const child = createMockControl({
      typeName: 'sap.m.Text',
      properties: { text: 'Hello' },
    });
    const ctrl = createMockControl({ typeName: 'sap.m.VBox', children: [child] });
    expect(
      matchesDescendant(ctrl, { controlType: 'sap.m.Text', properties: { text: 'Hello' } }),
    ).toBe(true);
  });

  it('returns false when no child matches', () => {
    const child = createMockControl({ typeName: 'sap.m.Input' });
    const ctrl = createMockControl({ typeName: 'sap.m.VBox', children: [child] });
    expect(matchesDescendant(ctrl, { controlType: 'sap.m.Text' })).toBe(false);
  });

  it('returns false when control has no children', () => {
    const ctrl = createMockControl({ typeName: 'sap.m.VBox', children: [] });
    expect(matchesDescendant(ctrl, { controlType: 'sap.m.Text' })).toBe(false);
  });

  it('returns false when findAggregatedObjects is not available', () => {
    const ctrl: UI5Record = {
      getMetadata: () => ({ getName: () => 'sap.m.VBox', getParent: () => null }),
    };
    expect(matchesDescendant(ctrl, { controlType: 'sap.m.Text' })).toBe(false);
  });
});

describe('matchesI18NText', () => {
  it('matches when i18n text resolves to control property value', () => {
    const ctrl = createMockControl({
      properties: { text: 'Save Changes' },
      i18nBundle: { SAVE_BUTTON: 'Save Changes' },
    });
    expect(matchesI18NText(ctrl, { text: 'SAVE_BUTTON' })).toBe(true);
  });

  it('rejects when i18n text does not match property value', () => {
    const ctrl = createMockControl({
      properties: { text: 'Cancel' },
      i18nBundle: { SAVE_BUTTON: 'Save Changes' },
    });
    expect(matchesI18NText(ctrl, { text: 'SAVE_BUTTON' })).toBe(false);
  });

  it('rejects when i18n model is not available', () => {
    const ctrl = createMockControl({ properties: { text: 'Save' } });
    expect(matchesI18NText(ctrl, { text: 'SAVE_BUTTON' })).toBe(false);
  });

  it('rejects when property getter does not exist', () => {
    const ctrl = createMockControl({
      properties: {},
      i18nBundle: { SAVE_BUTTON: 'Save Changes' },
    });
    expect(matchesI18NText(ctrl, { text: 'SAVE_BUTTON' })).toBe(false);
  });

  it('matches multiple i18n properties', () => {
    const ctrl = createMockControl({
      properties: { text: 'Save Changes', tooltip: 'Click to save' },
      i18nBundle: { SAVE_BUTTON: 'Save Changes', SAVE_TOOLTIP: 'Click to save' },
    });
    expect(matchesI18NText(ctrl, { text: 'SAVE_BUTTON', tooltip: 'SAVE_TOOLTIP' })).toBe(true);
  });
});

describe('hasMatchingTypeWithSubclasses', () => {
  it('matches the exact type', () => {
    const ctrl = createMockControl({ typeName: 'sap.m.Button' });
    expect(hasMatchingTypeWithSubclasses(ctrl, 'sap.m.Button')).toBe(true);
  });

  it('matches a parent type in the inheritance chain', () => {
    const ctrl = createMockControl({
      typeName: 'sap.m.SegmentedButton',
      metadataParent: { name: 'sap.ui.core.Control' },
    });
    expect(hasMatchingTypeWithSubclasses(ctrl, 'sap.ui.core.Control')).toBe(true);
  });

  it('matches a grandparent type in the inheritance chain', () => {
    const ctrl = createMockControl({
      typeName: 'sap.m.semantic.SemanticButton',
      metadataParent: {
        name: 'sap.m.Button',
        parent: { name: 'sap.ui.core.Control' },
      },
    });
    expect(hasMatchingTypeWithSubclasses(ctrl, 'sap.ui.core.Control')).toBe(true);
  });

  it('rejects when type is not in inheritance chain', () => {
    const ctrl = createMockControl({
      typeName: 'sap.m.Button',
      metadataParent: { name: 'sap.ui.core.Control' },
    });
    expect(hasMatchingTypeWithSubclasses(ctrl, 'sap.m.Input')).toBe(false);
  });
});

describe('matchesSelector (expanded)', () => {
  it('matches with controlType only', () => {
    const ctrl = createMockControl({ typeName: 'sap.m.Button' });
    expect(matchesSelector(ctrl, { controlType: 'sap.m.Button' })).toBe(true);
  });

  it('matches with properties', () => {
    const ctrl = createMockControl({
      typeName: 'sap.m.Button',
      properties: { text: 'Save' },
    });
    expect(
      matchesSelector(ctrl, { controlType: 'sap.m.Button', properties: { text: 'Save' } }),
    ).toBe(true);
  });

  it('matches with matchSubclasses: true', () => {
    const ctrl = createMockControl({
      typeName: 'sap.m.SegmentedButton',
      metadataParent: { name: 'sap.ui.core.Control' },
    });
    expect(
      matchesSelector(ctrl, {
        controlType: 'sap.ui.core.Control',
        matchSubclasses: true,
      }),
    ).toBe(true);
  });

  it('rejects subclass when matchSubclasses is not set', () => {
    const ctrl = createMockControl({
      typeName: 'sap.m.SegmentedButton',
      metadataParent: { name: 'sap.ui.core.Control' },
    });
    expect(matchesSelector(ctrl, { controlType: 'sap.ui.core.Control' })).toBe(false);
  });

  it('matches with ancestor selector', () => {
    const parent = createMockControl({ typeName: 'sap.m.Dialog', parent: null });
    const ctrl = createMockControl({
      typeName: 'sap.m.Button',
      properties: { text: 'OK' },
      parent,
    });
    expect(
      matchesSelector(ctrl, {
        controlType: 'sap.m.Button',
        properties: { text: 'OK' },
        ancestor: { controlType: 'sap.m.Dialog' },
      }),
    ).toBe(true);
  });

  it('rejects when ancestor does not match', () => {
    const parent = createMockControl({ typeName: 'sap.m.VBox', parent: null });
    const ctrl = createMockControl({
      typeName: 'sap.m.Button',
      properties: { text: 'OK' },
      parent,
    });
    expect(
      matchesSelector(ctrl, {
        controlType: 'sap.m.Button',
        ancestor: { controlType: 'sap.m.Dialog' },
      }),
    ).toBe(false);
  });

  it('matches with descendant selector', () => {
    const child = createMockControl({ typeName: 'sap.m.Text', properties: { text: 'Info' } });
    const ctrl = createMockControl({ typeName: 'sap.m.VBox', children: [child] });
    expect(
      matchesSelector(ctrl, {
        controlType: 'sap.m.VBox',
        descendant: { controlType: 'sap.m.Text' },
      }),
    ).toBe(true);
  });

  it('matches with i18NText', () => {
    const ctrl = createMockControl({
      typeName: 'sap.m.Button',
      properties: { text: 'Save Changes' },
      i18nBundle: { SAVE_BUTTON: 'Save Changes' },
    });
    expect(
      matchesSelector(ctrl, {
        controlType: 'sap.m.Button',
        i18NText: { text: 'SAVE_BUTTON' },
      }),
    ).toBe(true);
  });

  it('matches with property operators in selector', () => {
    const ctrl = createMockControl({
      typeName: 'sap.m.Button',
      properties: { text: 'Save Draft' },
    });
    expect(
      matchesSelector(ctrl, {
        controlType: 'sap.m.Button',
        properties: { text: { value: 'Save', operator: 'startsWith' } },
      }),
    ).toBe(true);
  });

  it('matches with bindingPath', () => {
    const ctrl = createMockControl({ typeName: 'sap.m.Input' });
    ctrl['getBinding'] = (bindingName: string) => {
      if (bindingName === 'value') {
        return { getPath: () => '/Products/Name' };
      }
      return null;
    };
    expect(
      matchesSelector(ctrl, {
        controlType: 'sap.m.Input',
        bindingPath: { path: '/Products/Name' },
      }),
    ).toBe(true);
  });

  it('returns true when selector is empty (matches all)', () => {
    const ctrl = createMockControl({ typeName: 'sap.m.Button' });
    expect(matchesSelector(ctrl, {})).toBe(true);
  });

  it('rejects when any criterion fails', () => {
    const ctrl = createMockControl({
      typeName: 'sap.m.Button',
      properties: { text: 'Cancel' },
    });
    expect(
      matchesSelector(ctrl, {
        controlType: 'sap.m.Button',
        properties: { text: 'Save' },
      }),
    ).toBe(false);
  });
});

describe('matchesBindingPath', () => {
  it('matches value binding path', () => {
    const ctrl: UI5Record = {
      getBinding: (name: string) => {
        if (name === 'value') return { getPath: () => '/Order/Amount' };
        return null;
      },
    };
    expect(matchesBindingPath(ctrl, { path: '/Order/Amount' })).toBe(true);
  });

  it('falls back to text binding', () => {
    const ctrl: UI5Record = {
      getBinding: (name: string) => {
        if (name === 'text') return { getPath: () => '/Order/Status' };
        return null;
      },
    };
    expect(matchesBindingPath(ctrl, { path: '/Order/Status' })).toBe(true);
  });

  it('rejects when path does not match', () => {
    const ctrl: UI5Record = {
      getBinding: (name: string) => {
        if (name === 'value') return { getPath: () => '/Other/Path' };
        return null;
      },
    };
    expect(matchesBindingPath(ctrl, { path: '/Order/Amount' })).toBe(false);
  });
});
