/**
 * Tests for `src/selectors/ui5-selector-engine.ts`.
 *
 * @remarks
 * Verifies the UI5 selector engine script shape and its query/queryAll
 * logic using minimal DOM mocks. Phase 1 tests DOM attribute-based fallback only.
 */
import { describe, expect, it, vi } from 'vitest';

import { createUI5SelectorEngineScript } from '../../../src/selectors/ui5-selector-engine.js';

/**
 * Minimal mock interface matching the HTMLElement subset used by the engine.
 */
interface MockElement {
  getAttribute(name: string): string | null;
  querySelector(selector: string): Element | null;
  querySelectorAll(selector: string): NodeListOf<Element>;
}

/**
 * Matches a CSS attribute selector against a mock element's attributes.
 *
 * @remarks
 * Parses `[attr="value"]` pairs from the selector string using indexOf-based
 * parsing instead of regex to avoid sonarjs/slow-regex warnings.
 */
function matchesCssSelector(element: MockElement, selector: string): boolean {
  let position = 0;

  while (position < selector.length) {
    const openBracket = selector.indexOf('[', position);
    if (openBracket < 0) {
      break;
    }
    const closeBracket = selector.indexOf(']', openBracket + 1);
    if (closeBracket < 0) {
      break;
    }

    const content = selector.slice(openBracket + 1, closeBracket);
    const eqIndex = content.indexOf('=');
    if (eqIndex >= 0) {
      const attrName = content.slice(0, eqIndex);
      // Strip surrounding quotes from value
      let attrValue = content.slice(eqIndex + 1);
      if (attrValue.startsWith('"') && attrValue.endsWith('"')) {
        attrValue = attrValue.slice(1, -1);
      }
      if (element.getAttribute(attrName) !== attrValue) {
        return false;
      }
    }

    position = closeBracket + 1;
  }
  return true;
}

/**
 * Creates a mock element with the given attributes.
 */
function createMockElement(attrs: Record<string, string>): MockElement {
  return {
    getAttribute: (name: string) => {
      const value: string | undefined = attrs[name];
      return value ?? null;
    },
    querySelector: vi.fn().mockReturnValue(null),
    querySelectorAll: vi.fn().mockReturnValue([]),
  };
}

/**
 * Creates a mock root element that queries among the given children.
 */
function createMockRoot(children: readonly MockElement[]): MockElement {
  return {
    getAttribute: () => null,
    querySelectorAll: vi
      .fn()
      .mockImplementation((selector: string) =>
        children.filter((child) => matchesCssSelector(child, selector)),
      ),
    querySelector: vi
      .fn()
      .mockImplementation(
        (selector: string) => children.find((child) => matchesCssSelector(child, selector)) ?? null,
      ),
  };
}

describe('createUI5SelectorEngineScript', () => {
  it('returns an object with query and queryAll methods', () => {
    const engine = createUI5SelectorEngineScript();
    expect(engine).toHaveProperty('query');
    expect(engine).toHaveProperty('queryAll');
    expect(typeof engine.query).toBe('function');
    expect(typeof engine.queryAll).toBe('function');
  });

  it('query finds element by ID attribute', () => {
    const child = createMockElement({ 'data-sap-ui': 'myButton' });
    const root = createMockRoot([child]);

    const engine = createUI5SelectorEngineScript();
    const result = engine.query(root as unknown as HTMLElement, '#myButton');
    expect(result).toBe(child);
  });

  it('query finds element by controlType attribute', () => {
    const child = createMockElement({ 'data-sap-ui-type': 'sap.m.Button' });
    const root = createMockRoot([child]);

    const engine = createUI5SelectorEngineScript();
    const result = engine.query(root as unknown as HTMLElement, 'sap.m.Button');
    expect(result).toBe(child);
  });

  it('query returns null when no element found', () => {
    const root = createMockRoot([]);

    const engine = createUI5SelectorEngineScript();
    const result = engine.query(root as unknown as HTMLElement, '#nonexistent');
    expect(result).toBeNull();
  });

  it('queryAll returns all matching elements', () => {
    const child1 = createMockElement({ 'data-sap-ui-type': 'sap.m.Button' });
    const child2 = createMockElement({ 'data-sap-ui-type': 'sap.m.Button' });
    const root = createMockRoot([child1, child2]);

    const engine = createUI5SelectorEngineScript();
    const results = engine.queryAll(root as unknown as HTMLElement, 'sap.m.Button');
    expect(results).toHaveLength(2);
    expect(results[0]).toBe(child1);
    expect(results[1]).toBe(child2);
  });

  it('queryAll returns empty array when none found', () => {
    const root = createMockRoot([]);

    const engine = createUI5SelectorEngineScript();
    const results = engine.queryAll(root as unknown as HTMLElement, 'sap.m.Input');
    expect(results).toHaveLength(0);
  });

  it('query handles type-only selector without hash', () => {
    const child = createMockElement({ 'data-sap-ui-type': 'sap.m.Text' });
    const root = createMockRoot([child]);

    const engine = createUI5SelectorEngineScript();
    const result = engine.query(root as unknown as HTMLElement, 'sap.m.Text');
    expect(result).toBe(child);
  });

  it('query handles ID-only selector with hash prefix', () => {
    const child = createMockElement({ 'data-sap-ui': 'saveBtn' });
    const root = createMockRoot([child]);

    const engine = createUI5SelectorEngineScript();
    const result = engine.query(root as unknown as HTMLElement, '#saveBtn');
    expect(result).toBe(child);
  });
});
