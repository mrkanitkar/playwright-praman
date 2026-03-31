/**
 * @license
 * Copyright (c) ZesTest 2025-2030. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0
 *
 * This file may contain AI-assisted code.
 * See LICENSE and NOTICE files for details.
 */

/**
 * Unified UI5 selector engine for Playwright content-based registration.
 *
 * @remarks
 * Replaces the separate css-engine.ts and xpath-engine.ts with a single engine
 * that handles both CSS-style selectors (e.g., `sap.m.Button#id[text=Save]`)
 * and XPath selectors (e.g., `//sap.m.Button[ui5:property(.,'text')='Save']`).
 *
 * CSS selectors are parsed via `css-selector-parser`, converted to XPath, and
 * then evaluated via `fontoxpath` against an in-memory XML DOM built from the
 * UI5 control tree. XPath selectors are passed directly to fontoxpath.
 *
 * The XML tree mirrors the UI5 control hierarchy: each control becomes an element
 * named after its type (e.g., `<sap.m.Button id="btn1">`), with child controls
 * nested inside their parent elements. This is closely modeled on the playwright-ui5
 * approach (https://github.com/DetachHead/playwright-ui5).
 *
 * This module is bundled by esbuild as a CJS IIFE for browser injection.
 * It must NOT use any Node.js APIs.
 *
 * **LOC exception**: This module exceeds 300 LOC because it unifies CSS parsing,
 * CSS-to-XPath conversion, XML tree building, fontoxpath function registration,
 * and query execution into a single cohesive pipeline. Splitting across files
 * would break the esbuild IIFE bundling model where all code must be self-contained.
 *
 * @module selectors/browser
 */

/* eslint-disable max-lines -- LOC exception documented above */
/* eslint-disable @typescript-eslint/no-unnecessary-condition -- browser globals may be absent */

import type { AstRule, AstSelector } from 'css-selector-parser';
import { createParser } from 'css-selector-parser';
import {
  evaluateXPathToFirstNode,
  evaluateXPathToNodes,
  registerCustomXPathFunction,
} from 'fontoxpath';

import type { Ui5ControlRef, Ui5Registry } from './common.js';
import { Ui5SelectorEngineError, getRegistry, isUi5Loaded } from './common.js';

// ── Types ─────────────────────────────────────────────────────────────────

/** Playwright's SelectorEngine contract. */
interface SelectorEngine {
  query(root: Element | Document, selector: string): Element | undefined;
  queryAll(root: Element | Document, selector: string): Element[];
}

/** Tree model node representing a UI5 control in the XML tree. */
interface TreeModelNode {
  readonly id: string;
  readonly controlType: string;
  readonly children: TreeModelNode[];
}

// ── Constants ─────────────────────────────────────────────────────────────

/** Namespace URI for custom UI5 XPath functions. */
const UI5_NS = 'urn:praman:ui5';

// ── State ─────────────────────────────────────────────────────────────────

/** Whether custom XPath functions have been registered (once per page load). */
let functionsRegistered = false;

/**
 * Mapping from control ID to its {@link Ui5ControlRef} for the current query.
 * Rebuilt on every query/queryAll call so the mapping stays fresh.
 */
let controlMap = new Map<string, Ui5ControlRef>();

// ── CSS Parser Configuration ──────────────────────────────────────────────

/**
 * CSS selector parser configured for UI5 control selectors.
 *
 * @remarks
 * Uses classNames to handle dots in tag names (e.g., `sap.m.Button` parses as
 * tag=`sap` with classNames=[`m`, `Button`], which we rejoin).
 */
const parseCss = createParser({
  syntax: {
    baseSyntax: 'progressive',
    tag: { wildcard: true },
    ids: true,
    classNames: true,
    attributes: {
      operators: ['=', '^=', '$=', '*=', '~=', '|='],
    },
    pseudoElements: {
      definitions: { NoArgument: ['subclass'] },
      notation: 'doubleColon',
      unknown: 'reject',
    },
    pseudoClasses: {
      definitions: {
        Selector: ['has'],
      },
      unknown: 'reject',
    },
  },
});

// ── Phase 1: Selector Type Detection ──────────────────────────────────────

/**
 * Detects whether a selector string is XPath or CSS.
 *
 * @param selector - The raw selector string
 * @returns `true` if the selector is XPath, `false` if CSS
 *
 * @example
 * ```typescript
 * isXPathSelector('//sap.m.Button');  // true
 * isXPathSelector('./child');         // true
 * isXPathSelector('sap.m.Button');    // false
 * ```
 */
function isXPathSelector(selector: string): boolean {
  const trimmed = selector.trimStart();
  return trimmed.startsWith('/') || trimmed.startsWith('.');
}

// ── Phase 2: CSS → XPath Conversion ──────────────────────────────────────

/**
 * Processes a single AST rule item and accumulates XPath predicates.
 *
 * @param item - A single CSS AST rule item
 * @param tagName - Current tag name (mutated via return)
 * @param predicates - Current predicates string (mutated via return)
 * @param useSubclass - Current subclass flag (mutated via return)
 * @returns Updated [tagName, predicates, useSubclass]
 */
function processRuleItem(
  item: AstRule['items'][number],
  tagName: string,
  predicates: string,
  useSubclass: boolean,
): [string, string, boolean] {
  switch (item.type) {
    case 'TagName':
      return [item.name, predicates, useSubclass];
    case 'ClassName':
      return [`${tagName}.${item.name}`, predicates, useSubclass];
    case 'WildcardTag':
      return ['*', predicates, useSubclass];
    case 'Id':
      return [tagName, `${predicates}[@id='${escapeXPathString(item.name)}']`, useSubclass];
    case 'Attribute':
      return [tagName, `${predicates}${attributeToXPathPredicate(item)}`, useSubclass];
    case 'PseudoElement':
      return [tagName, predicates, item.name === 'subclass' ? true : useSubclass];
    case 'PseudoClass': {
      if (item.name === 'has' && item.argument?.type === 'Selector') {
        const innerXPath = selectorToXPath(item.argument);
        return [tagName, `${predicates}[.${innerXPath}]`, useSubclass];
      }
      return [tagName, predicates, useSubclass];
    }
    case 'NestingSelector':
      return [tagName, predicates, useSubclass];
  }
}

/**
 * Builds an XPath step expression from tag, predicates, and subclass flag.
 */
function buildStep(
  axis: string,
  tagName: string,
  predicates: string,
  useSubclass: boolean,
): string {
  if (tagName === '*') {
    return `${axis}*${predicates}`;
  }
  if (useSubclass) {
    return `${axis}*[ui5:subclass-of(.,'${escapeXPathString(tagName)}')]${predicates}`;
  }
  return `${axis}${tagName}${predicates}`;
}

/**
 * Converts a parsed CSS AST rule to an XPath expression.
 *
 * @param rule - The parsed CSS AST rule
 * @returns An XPath expression string
 *
 * @example
 * ```typescript
 * const ast = parseCss('sap.m.Button#myId[text=Save]');
 * ruleToXPath(ast.rules[0]); // "//sap.m.Button[@id='myId'][ui5:property(.,'text')='Save']"
 * ```
 */
function ruleToXPath(rule: AstRule): string {
  let tagName = '*';
  let predicates = '';
  let useSubclass = false;

  for (const item of rule.items) {
    [tagName, predicates, useSubclass] = processRuleItem(item, tagName, predicates, useSubclass);
  }

  let step = buildStep('//', tagName, predicates, useSubclass);

  if (rule.nestedRule !== undefined) {
    step = `${step}${nestedRuleToXPath(rule.nestedRule)}`;
  }

  return step;
}

/**
 * Converts a nested CSS rule (one with a combinator) to XPath.
 *
 * @param rule - The nested rule with combinator
 * @returns XPath fragment for the nested portion
 */
function nestedRuleToXPath(rule: AstRule): string {
  let tagName = '*';
  let predicates = '';
  let useSubclass = false;

  for (const item of rule.items) {
    [tagName, predicates, useSubclass] = processRuleItem(item, tagName, predicates, useSubclass);
  }

  const combinator = rule.combinator ?? ' ';
  const axis = combinator === '>' ? '/' : '//';
  let step = buildStep(axis, tagName, predicates, useSubclass);

  if (rule.nestedRule !== undefined) {
    step = `${step}${nestedRuleToXPath(rule.nestedRule)}`;
  }

  return step;
}

/**
 * Converts an attribute AST node to an XPath predicate using `ui5:property()`.
 *
 * @param attr - The parsed CSS attribute node
 * @returns An XPath predicate string
 */
function attributeToXPathPredicate(attr: {
  readonly name: string;
  readonly operator?: string;
  readonly value?: { readonly type: string; readonly value?: string };
}): string {
  const propName = attr.name;
  const value = attr.value !== undefined && 'value' in attr.value ? (attr.value.value ?? '') : '';
  const escaped = escapeXPathString(value);
  const propExpr = `ui5:property(.,'${escapeXPathString(propName)}')`;

  if (attr.operator === undefined) {
    return `[${propExpr}!='']`;
  }

  switch (attr.operator) {
    case '=':
      return `[${propExpr}='${escaped}']`;
    case '^=':
      return `[starts-with(${propExpr},'${escaped}')]`;
    case '$=':
      return `[ends-with(${propExpr},'${escaped}')]`;
    case '*=':
      return `[contains(${propExpr},'${escaped}')]`;
    case '~=':
      return `[contains(concat(' ',${propExpr},' '),' ${escaped} ')]`;
    case '|=':
      return `[${propExpr}='${escaped}' or starts-with(${propExpr},'${escaped}-')]`;
    default:
      return `[${propExpr}='${escaped}']`;
  }
}

/**
 * Converts a full CSS selector AST to an XPath expression.
 *
 * @param ast - The parsed CSS selector AST
 * @returns An XPath expression (union of all rules)
 *
 * @example
 * ```typescript
 * const ast = parseCss('sap.m.Button, sap.m.Input');
 * selectorToXPath(ast); // "//sap.m.Button | //sap.m.Input"
 * ```
 */
function selectorToXPath(ast: AstSelector): string {
  if (ast.rules.length === 0) {
    return '//*';
  }
  if (ast.rules.length === 1) {
    const firstRule = ast.rules[0];
    if (firstRule === undefined) return '//*';
    return ruleToXPath(firstRule);
  }
  return ast.rules.map((r) => ruleToXPath(r)).join(' | ');
}

/**
 * Escapes a string value for safe use inside XPath string literals.
 *
 * @param value - The string to escape
 * @returns The escaped string (single quotes escaped via HTML entity)
 */
function escapeXPathString(value: string): string {
  if (!value.includes("'")) {
    return value;
  }
  return value.replaceAll("'", '&#39;');
}

/**
 * Converts a CSS selector string to XPath by parsing it and converting the AST.
 *
 * @param selector - A CSS-style UI5 selector string
 * @returns An XPath expression string
 *
 * @example
 * ```typescript
 * cssToXPath('sap.m.Button[text=Save]');
 * // "//sap.m.Button[ui5:property(.,'text')='Save']"
 * ```
 */
function cssToXPath(selector: string): string {
  const ast = parseCss(selector);
  return selectorToXPath(ast);
}

// ── Phase 3: Tree Building (DOM-walking, hierarchical) ────────────────────

/**
 * Walks the DOM starting from a root element, building tree model nodes
 * for all UI5 controls found via `data-sap-ui` attributes.
 *
 * @param element - The DOM element to walk
 * @param registry - The UI5 Element registry
 * @returns An array of tree model nodes representing the control hierarchy
 */
function createTreeModelNodes(element: Element, registry: Ui5Registry): TreeModelNode[] {
  const nodes: TreeModelNode[] = [];

  let child: Element | null = element.firstElementChild;
  while (child !== null) {
    const id = child.getAttribute('data-sap-ui');
    if (id !== null && id.length > 0) {
      const control = registry.get(id);
      if (control !== undefined) {
        const controlType = control.getMetadata().getName();
        controlMap.set(id, control);
        const childNodes = createTreeModelNodes(child, registry);
        nodes.push({ id, controlType, children: childNodes });
      } else {
        nodes.push(...createTreeModelNodes(child, registry));
      }
    } else {
      nodes.push(...createTreeModelNodes(child, registry));
    }
    child = child.nextElementSibling;
  }

  return nodes;
}

/**
 * Adds tree model nodes as XML elements to a parent element in the XML document.
 *
 * @remarks
 * Each control becomes an XML element named after its type (e.g., `<sap.m.Button>`),
 * with an `id` attribute. Children are nested inside their parent elements.
 * Uses the browser-native `document.createElement()` API — no Node.js dependencies.
 *
 * @param xmlDoc - The XML document used to create elements
 * @param parent - The parent XML element to append children to
 * @param treeNodes - The tree model nodes to convert
 */
function addNodesToXml(
  xmlDoc: Document,
  parent: Element,
  treeNodes: readonly TreeModelNode[],
): void {
  for (const node of treeNodes) {
    const el = xmlDoc.createElement(node.controlType);
    el.setAttribute('id', node.id);
    if (node.children.length > 0) {
      addNodesToXml(xmlDoc, el, node.children);
    }
    parent.appendChild(el);
  }
}

/**
 * Builds an XML DOM from the UI5 control tree by walking the page DOM.
 *
 * @remarks
 * Uses `document.implementation.createDocument()` to build the XML DOM
 * entirely with browser-native APIs. No Node.js dependencies required.
 *
 * @param root - The root DOM element to walk (typically document or document.body)
 * @param registry - The UI5 Element registry
 * @returns An XML Document with a `<root>` element containing the control hierarchy
 */
function buildXmlDom(root: Element | Document, registry: Ui5Registry): Document {
  controlMap = new Map();

  const xmlDoc = document.implementation.createDocument(null, 'root', null);
  const xmlRoot = xmlDoc.documentElement;
  // eslint-disable-next-line sonarjs/different-types-comparison -- documentElement is Element | null per DOM spec
  if (xmlRoot === null) return xmlDoc;

  const domRoot = root instanceof Document ? root.documentElement : root;
  // eslint-disable-next-line sonarjs/different-types-comparison -- documentElement is Element | null per DOM spec
  if (domRoot === null) return xmlDoc;

  const treeNodes = createTreeModelNodes(domRoot, registry);
  addNodesToXml(xmlDoc, xmlRoot, treeNodes);

  return xmlDoc;
}

// ── Phase 4: fontoxpath Custom Functions ──────────────────────────────────

/**
 * Reads a UI5 property value from the control backing an XML element.
 *
 * @param element - XML element with an `id` attribute
 * @param propName - Name of the UI5 property to read
 * @returns String representation of the property value
 */
function readUi5Property(element: Element, propName: string): string {
  const id = element.getAttribute('id') ?? '';
  const ctrl = controlMap.get(id);
  if (ctrl === undefined) return '';
  const val: unknown = ctrl.getProperty(propName);
  if (val === null || val === undefined) return '';
  if (Array.isArray(val)) return val.map(String).join(',');
  return typeof val === 'object' ? JSON.stringify(val) : String(val as string | number | boolean);
}

/**
 * Checks if the UI5 control backing an XML element is a subclass of a type.
 *
 * @param element - XML element with an `id` attribute
 * @param typeName - Fully qualified UI5 type name
 * @returns `true` if the control is an instance of the type
 */
function checkSubclassOf(element: Element, typeName: string): boolean {
  const id = element.getAttribute('id') ?? '';
  const ctrl = controlMap.get(id);
  if (ctrl === undefined) return false;
  return ctrl.isA(typeName);
}

/**
 * Registers custom UI5 XPath functions with fontoxpath.
 *
 * @remarks
 * Called once per page load. Functions are registered in the `urn:praman:ui5`
 * namespace and can be invoked in XPath expressions as `ui5:property()`, etc.
 *
 * Registered functions:
 * - `ui5:property(element, name)` — Reads a property value from the UI5 control
 * - `ui5:subclass-of(element, type)` — Checks if control isA(type) via metadata chain
 * - `ui5:debug-xml(element)` — Throws an error displaying the element's XML (debugging aid)
 */
function registerUi5Functions(): void {
  if (functionsRegistered) return;
  functionsRegistered = true;

  const ns = { namespaceURI: UI5_NS, localName: '' };

  // ui5:property(element, name) — read property from the UI5 control backing the element
  registerCustomXPathFunction(
    { ...ns, localName: 'property' },
    ['element()', 'xs:string'],
    'xs:string',
    (_ctx: unknown, element: Element, propName: string) => {
      try {
        return readUi5Property(element, propName);
      } catch {
        return '';
      }
    },
  );

  // ui5:subclass-of(element, type) — check if control isA(type) via metadata
  registerCustomXPathFunction(
    { ...ns, localName: 'subclass-of' },
    ['element()', 'xs:string'],
    'xs:boolean',
    (_ctx: unknown, element: Element, typeName: string) => {
      try {
        return checkSubclassOf(element, typeName);
      } catch {
        return false;
      }
    },
  );

  // ui5:debug-xml(element) — throw error with element outerHTML for debugging
  registerCustomXPathFunction(
    { ...ns, localName: 'debug-xml' },
    ['element()'],
    'xs:string',
    (_ctx: unknown, element: Element) => {
      throw new Ui5SelectorEngineError(`[ui5:debug-xml] ${element.outerHTML}`);
    },
  );
}

/**
 * Namespace resolver for XPath evaluation.
 * Maps the `ui5` prefix to the custom function namespace.
 */
function namespaceResolver(prefix: string): string | null {
  if (prefix === 'ui5') return UI5_NS;
  return null;
}

// ── Phase 5: Query Execution ──────────────────────────────────────────────

/**
 * Maps an XML element from the control tree back to its HTML DOM element.
 *
 * @param xmlElement - The XML element from fontoxpath results
 * @param root - The root DOM element to constrain results to
 * @returns The corresponding HTML element, or `null` if not found or not within root
 */
function resolveToHtml(xmlElement: Element, root: Element | Document): HTMLElement | null {
  const controlId = xmlElement.getAttribute('id');
  if (controlId === null || controlId.length === 0) return null;

  const ctrl = controlMap.get(controlId);
  if (ctrl === undefined) return null;

  try {
    const domRef = ctrl.getDomRef();
    if (domRef === null) return null;

    const rootElement = root instanceof Document ? root.documentElement : root;
    if (!rootElement?.contains(domRef)) return null;

    return domRef;
  } catch {
    return null;
  }
}

/**
 * Adjusts selector context: if selector starts with `/` and root is not Document,
 * prepend `.` to make it relative (same as Playwright's xpath engine behavior).
 */
function fixSelectorContext(root: Element | Document, selector: string): string {
  if (!(root instanceof Document) && selector.startsWith('/')) {
    return `.${selector}`;
  }
  return selector;
}

/**
 * Executes an XPath expression against the XML control tree and returns matching HTML elements.
 *
 * @param root - The root DOM element to scope results to
 * @param xpath - The XPath expression to evaluate
 * @param findFirst - If `true`, return only the first match
 * @returns An array of matching HTML elements
 */
function executeXPath(root: Element | Document, xpath: string, findFirst: boolean): HTMLElement[] {
  const registry = getRegistry();
  if (registry === null) return [];

  registerUi5Functions();
  const xmlDoc = buildXmlDom(root, registry);
  const contextNode = xmlDoc.documentElement;
  // eslint-disable-next-line sonarjs/different-types-comparison -- documentElement is Element | null per DOM spec
  if (contextNode === null) return [];

  const adjustedXPath = fixSelectorContext(root, xpath);

  if (findFirst) {
    const node = evaluateXPathToFirstNode<Element>(adjustedXPath, contextNode, null, null, {
      namespaceResolver,
    });

    if (node === null) return [];
    const htmlEl = resolveToHtml(node, root);
    return htmlEl !== null ? [htmlEl] : [];
  }

  const nodes = evaluateXPathToNodes<Element>(adjustedXPath, contextNode, null, null, {
    namespaceResolver,
  });

  const results: HTMLElement[] = [];
  for (const node of nodes) {
    const htmlEl = resolveToHtml(node, root);
    if (htmlEl !== null) {
      results.push(htmlEl);
    }
  }
  return results;
}

// ── Exported SelectorEngine ───────────────────────────────────────────────

/**
 * Unified UI5 selector engine for Playwright.
 *
 * @remarks
 * Supports both CSS-style and XPath selectors:
 * - CSS: `sap.m.Button[text=Save]`, `sap.m.Input#myId`, `*::subclass[enabled=true]`
 * - XPath: `//sap.m.Button[ui5:property(.,'text')='Save']`, `.//sap.m.Input`
 *
 * Selector type is auto-detected: if it starts with `/`, `//`, or `.`, it is
 * treated as XPath; otherwise it is parsed as CSS and converted to XPath.
 *
 * Registered with Playwright via `selectors.register('ui5', { content })`.
 *
 * @example
 * ```typescript
 * // CSS-style selector
 * const btn = page.locator("ui5=sap.m.Button[text=Save]");
 * await btn.click();
 *
 * // XPath selector
 * const input = page.locator("ui5=//sap.m.Input[ui5:property(.,'value')='Hello']");
 * await input.fill('World');
 * ```
 */
const ui5Engine: SelectorEngine = {
  query(root: Element | Document, selector: string): Element | undefined {
    if (!isUi5Loaded()) return undefined;

    try {
      const xpath = isXPathSelector(selector) ? selector : cssToXPath(selector);
      const results = executeXPath(root, xpath, true);
      return results[0];
    } catch {
      return undefined;
    }
  },

  queryAll(root: Element | Document, selector: string): Element[] {
    if (!isUi5Loaded()) return [];

    try {
      const xpath = isXPathSelector(selector) ? selector : cssToXPath(selector);
      return executeXPath(root, xpath, false);
    } catch {
      return [];
    }
  },
};

export default ui5Engine;
