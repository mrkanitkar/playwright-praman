/**
 * @license
 * Copyright (c) ZesTest 2025-2030. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0
 *
 * This file may contain AI-assisted code.
 * See LICENSE and NOTICE files for details.
 */

/**
 * Tests for CSS-to-XPath conversion in `src/selectors/browser/ui5-engine.ts`.
 *
 * @remarks
 * Tests the {@link cssToXPath} pure function, which converts CSS-style UI5 selectors
 * into XPath expressions. These are unit tests of the conversion pipeline only —
 * no browser context or DOM required.
 */
import { describe, expect, it } from 'vitest';

import { cssToXPath } from '../../../src/selectors/browser/ui5-engine.js';

// ── Existing Features (regression tests) ────────────────────────────────

describe('cssToXPath — basic selectors', () => {
  it('converts simple type selector', () => {
    const xpath = cssToXPath('sap.m.Button');
    expect(xpath).toBe('//sap.m.Button');
  });

  it('converts wildcard selector', () => {
    const xpath = cssToXPath('*');
    expect(xpath).toBe('//*');
  });

  it('converts type with ID', () => {
    const xpath = cssToXPath('sap.m.Button#saveBtn');
    expect(xpath).toContain("[@id='saveBtn']");
  });

  it('converts type with property', () => {
    const xpath = cssToXPath("sap.m.Button[text='Save']");
    expect(xpath).toContain("string(ui5:property(.,'text'))='Save'");
  });

  it('converts property with starts-with operator', () => {
    const xpath = cssToXPath("sap.m.Button[text^='Save']");
    expect(xpath).toContain("starts-with(string(ui5:property(.,'text')),'Save')");
  });

  it('converts property with ends-with operator', () => {
    const xpath = cssToXPath("sap.m.Button[text$='Draft']");
    expect(xpath).toContain("ends-with(string(ui5:property(.,'text')),'Draft')");
  });

  it('converts property with contains operator', () => {
    const xpath = cssToXPath("sap.m.Button[text*='ave']");
    expect(xpath).toContain("contains(string(ui5:property(.,'text')),'ave')");
  });
});

describe('cssToXPath — combinators', () => {
  it('converts descendant combinator (space)', () => {
    const xpath = cssToXPath('sap.m.Panel sap.m.Button');
    expect(xpath).toBe('//sap.m.Panel//sap.m.Button');
  });

  it('converts child combinator (>)', () => {
    const xpath = cssToXPath('sap.m.Panel > sap.m.Button');
    expect(xpath).toBe('//sap.m.Panel/sap.m.Button');
  });
});

describe('cssToXPath — :has() pseudo-class', () => {
  it('converts :has() to XPath predicate', () => {
    const xpath = cssToXPath('sap.m.Panel:has(sap.m.Button)');
    expect(xpath).toContain('[.//sap.m.Button]');
  });
});

describe('cssToXPath — ::subclass pseudo-element', () => {
  it('converts ::subclass to ui5:subclass-of function', () => {
    const xpath = cssToXPath('sap.m.InputBase::subclass');
    expect(xpath).toContain("ui5:subclass-of(.,'sap.m.InputBase')");
  });
});

describe('cssToXPath — comma-separated selectors', () => {
  it('converts comma-separated selectors to XPath union', () => {
    const xpath = cssToXPath('sap.m.Button, sap.m.Input');
    expect(xpath).toBe('//sap.m.Button | //sap.m.Input');
  });

  it('handles three selectors', () => {
    const xpath = cssToXPath('sap.m.Button, sap.m.Input, sap.m.Link');
    expect(xpath).toBe('//sap.m.Button | //sap.m.Input | //sap.m.Link');
  });
});

// ── GAP 2: :not() pseudo-class ──────────────────────────────────────────

describe('cssToXPath — :not() pseudo-class', () => {
  it('converts :not(type) to XPath not(self::type)', () => {
    const xpath = cssToXPath('*:not(sap.m.Button)');
    expect(xpath).toContain('not(self::sap.m.Button)');
  });

  it('converts :not with property to XPath negation', () => {
    const xpath = cssToXPath("sap.m.Button:not([enabled='false'])");
    expect(xpath).toContain('not(');
    expect(xpath).toContain("string(ui5:property(.,'enabled'))='false'");
  });

  it('converts :not with combined type and property', () => {
    const xpath = cssToXPath("*:not(sap.m.Button[text='Cancel'])");
    expect(xpath).toContain('not(');
    expect(xpath).toContain('self::sap.m.Button');
    expect(xpath).toContain("string(ui5:property(.,'text'))='Cancel'");
  });

  it('converts :not with subclass', () => {
    const xpath = cssToXPath('*:not(sap.m.InputBase::subclass)');
    expect(xpath).toContain('not(');
    expect(xpath).toContain("ui5:subclass-of(.,'sap.m.InputBase')");
  });

  it('supports :not with comma-separated inner selectors (union negation)', () => {
    const xpath = cssToXPath('*:not(sap.m.Button, sap.m.Link)');
    expect(xpath).toContain('not(');
    expect(xpath).toContain('self::sap.m.Button');
    expect(xpath).toContain('self::sap.m.Link');
    expect(xpath).toContain(' or ');
  });
});

// ── GAP 3: Positional pseudo-classes ────────────────────────────────────

describe('cssToXPath — positional pseudo-classes', () => {
  it('converts :first-child', () => {
    const xpath = cssToXPath('sap.m.Button:first-child');
    expect(xpath).toContain('not(preceding-sibling::*)');
  });

  it('converts :last-child', () => {
    const xpath = cssToXPath('sap.m.Button:last-child');
    expect(xpath).toContain('not(following-sibling::*)');
  });

  it('converts :only-child', () => {
    const xpath = cssToXPath('sap.m.Button:only-child');
    expect(xpath).toContain('not(preceding-sibling::*)');
    expect(xpath).toContain('not(following-sibling::*)');
  });

  it('converts :nth-child(3) to position predicate', () => {
    const xpath = cssToXPath('sap.m.Button:nth-child(3)');
    expect(xpath).toContain('count(preceding-sibling::*)+1=3');
  });

  it('converts :nth-child(2n+1) for odd children', () => {
    const xpath = cssToXPath('sap.m.Button:nth-child(2n+1)');
    expect(xpath).toContain('mod 2=1');
  });

  it('converts :nth-child(2n) for even children', () => {
    const xpath = cssToXPath('sap.m.Button:nth-child(2n)');
    expect(xpath).toContain('mod 2=0');
  });

  it('converts :nth-child(n) to match all (no predicate)', () => {
    const xpath = cssToXPath('sap.m.Button:nth-child(n)');
    // :nth-child(n) matches all — should not add a restrictive predicate
    expect(xpath).toBe('//sap.m.Button');
  });

  it('converts :nth-child(-n+3) to first 3 children', () => {
    const xpath = cssToXPath('sap.m.Button:nth-child(-n+3)');
    expect(xpath).toContain('<=3');
  });

  it('converts :nth-child(-2n+6) to even positions up to 6', () => {
    const xpath = cssToXPath('sap.m.Button:nth-child(-2n+6)');
    expect(xpath).toContain('<=6');
    expect(xpath).toContain('mod 2=0');
  });
});

// ── GAP 4: Sibling combinators ──────────────────────────────────────────

describe('cssToXPath — sibling combinators', () => {
  it('converts + adjacent sibling combinator', () => {
    const xpath = cssToXPath('sap.m.Label + sap.m.Input');
    expect(xpath).toContain('following-sibling::*[1]/self::sap.m.Input');
  });

  it('converts ~ general sibling combinator', () => {
    const xpath = cssToXPath('sap.m.Label ~ sap.m.Input');
    expect(xpath).toContain('following-sibling::sap.m.Input');
  });

  it('combines sibling with property predicate', () => {
    const xpath = cssToXPath("sap.m.Label + sap.m.Input[required='true']");
    expect(xpath).toContain('following-sibling::*[1]/self::sap.m.Input');
    expect(xpath).toContain("string(ui5:property(.,'required'))='true'");
  });

  it('chains multiple combinators', () => {
    const xpath = cssToXPath('sap.m.VBox > sap.m.Label + sap.m.Input');
    expect(xpath).toContain('//sap.m.VBox/sap.m.Label');
    expect(xpath).toContain('following-sibling::*[1]/self::sap.m.Input');
  });
});

// ── GAP 5: :labeled() pseudo-class ──────────────────────────────────────

describe('cssToXPath — :labeled() pseudo-class', () => {
  it('converts :labeled() to XPath ui5:labeled-by predicate', () => {
    const xpath = cssToXPath("sap.m.Input:labeled('Username')");
    expect(xpath).toContain("ui5:labeled-by(.,'Username')");
  });

  it('converts :labeled() with double quotes', () => {
    const xpath = cssToXPath('sap.m.Input:labeled("Email Address")');
    expect(xpath).toContain("ui5:labeled-by(.,'Email Address')");
  });

  it('combines :labeled() with other predicates', () => {
    const xpath = cssToXPath("sap.m.Input:labeled('Username')[required='true']");
    expect(xpath).toContain("ui5:labeled-by(.,'Username')");
    expect(xpath).toContain("string(ui5:property(.,'required'))='true'");
  });
});

// ── Complex combinations ────────────────────────────────────────────────

describe('cssToXPath — complex selector combinations', () => {
  it('combines :not() with :has()', () => {
    const xpath = cssToXPath('sap.m.Panel:not(:has(sap.m.Button))');
    expect(xpath).toContain('not(');
    expect(xpath).toContain('sap.m.Button');
  });

  it('combines sibling with :first-child', () => {
    const xpath = cssToXPath('sap.m.Label + sap.m.Input:first-child');
    expect(xpath).toContain('following-sibling');
    expect(xpath).toContain('not(preceding-sibling::*)');
  });

  it('combines child combinator with :not()', () => {
    const xpath = cssToXPath("sap.m.VBox > sap.m.Button:not([enabled='false'])");
    expect(xpath).toContain('//sap.m.VBox/sap.m.Button');
    expect(xpath).toContain('not(');
  });
});

// ── GAP-S3: Error surfacing ────────────────────────────────────────────

describe('cssToXPath — error surfacing (GAP-S3)', () => {
  it('throws on completely invalid CSS selector', () => {
    expect(() => cssToXPath('[')).toThrow();
  });

  it('throws on unknown pseudo-class', () => {
    expect(() => cssToXPath('sap.m.Button:unknown')).toThrow();
  });

  it('throws on malformed attribute selector', () => {
    expect(() => cssToXPath('sap.m.Button[=')).toThrow();
  });

  it('does not throw on valid type selector', () => {
    expect(() => cssToXPath('sap.m.Button')).not.toThrow();
  });

  it('does not throw on valid property selector', () => {
    expect(() => cssToXPath("sap.m.Button[text='Save']")).not.toThrow();
  });

  it('does not throw on valid pseudo-element', () => {
    expect(() => cssToXPath('sap.m.InputBase::subclass')).not.toThrow();
  });
});

// ── GAP-S1: ui5:property() return type ──────────────────────────────────

describe('cssToXPath — property type handling (GAP-S1)', () => {
  it('generates EBV-based presence check without operator', () => {
    const xpath = cssToXPath('sap.m.Button[enabled]');
    expect(xpath).toContain("[ui5:property(.,'enabled')]");
    expect(xpath).not.toContain("!=''");
  });

  it('wraps property in string() for equality comparison', () => {
    const xpath = cssToXPath("sap.m.Button[enabled='true']");
    expect(xpath).toContain("string(ui5:property(.,'enabled'))='true'");
  });

  it('wraps property in string() for starts-with', () => {
    const xpath = cssToXPath("sap.m.Button[text^='Sa']");
    expect(xpath).toContain("starts-with(string(ui5:property(.,'text')),'Sa')");
  });

  it('wraps property in string() for ends-with', () => {
    const xpath = cssToXPath("sap.m.Button[text$='ve']");
    expect(xpath).toContain("ends-with(string(ui5:property(.,'text')),'ve')");
  });

  it('wraps property in string() for contains', () => {
    const xpath = cssToXPath("sap.m.Button[text*='av']");
    expect(xpath).toContain("contains(string(ui5:property(.,'text')),'av')");
  });
});
