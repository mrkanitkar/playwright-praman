/**
 * @license
 * Copyright (c) ZesTest 2025-2030. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0
 *
 * This file may contain AI-assisted code.
 * See LICENSE and NOTICE files for details.
 */

/**
 * Parser and serializer for `ui5=...` selector strings.
 *
 * @remarks
 * Converts between string-format selectors (`ui5=sap.m.Button#id[prop=val]`)
 * and structured {@link UI5Selector} objects. Also provides validation and
 * type-guard utilities.
 *
 * **LOC exception**: This module exceeds the 300 LOC guideline (currently ~380 LOC)
 * because the parser, serializer, and validator share internal state and helper
 * functions that would lose cohesion if split across files. Splitting would increase
 * coupling without reducing complexity.
 *
 * @module selectors
 */

import { ErrorCode } from '#core/errors/codes.js';
import { SelectorError } from '#core/errors/selector-error.js';
import type { PropertyMatcher, UI5Selector } from '#core/types/selectors.js';

/** Coerced property value — either a primitive string, number, or boolean. */
type CoercedValue = string | number | boolean;

/**
 * Maximum allowed length for a selector string.
 *
 * @remarks
 * Prevents denial-of-service via excessively large selector strings.
 */
const MAX_SELECTOR_LENGTH = 10_000;

/**
 * The required prefix for all UI5 selector strings.
 */
const UI5_PREFIX = 'ui5=';

/**
 * Human-readable description of the parse operation for error messages.
 */
const PARSE_ATTEMPTED = 'Parse UI5 selector string';

/**
 * Pattern for valid dot-separated UI5 control type namespaces.
 *
 * @remarks
 * Matches `sap.m.Button`, `sap.ui.comp.smarttable.SmartTable`, etc.
 */
// eslint-disable-next-line security/detect-unsafe-regex -- Bounded pattern: requires at least one dot separator
const CONTROL_TYPE_PATTERN = /^\w+(?:\.\w+)+$/;

/**
 * Coerces a raw string property value to its typed equivalent.
 *
 * @remarks
 * Converts `"true"` to `true`, `"false"` to `false`, and numeric strings
 * to `number`. All other strings remain as-is.
 *
 * @param value - The raw string value from the selector
 * @returns The coerced value
 *
 * @example
 * ```typescript
 * coercePropertyValue('true');  // true
 * coercePropertyValue('42');    // 42
 * coercePropertyValue('hello'); // 'hello'
 * ```
 */
function coercePropertyValue(value: string): CoercedValue {
  if (value === 'true') {
    return true;
  }
  if (value === 'false') {
    return false;
  }

  if (value.length > 0) {
    const asNumber = Number(value);
    if (!Number.isNaN(asNumber) && String(asNumber) === value) {
      return asNumber;
    }
  }

  return value;
}

/**
 * Finds the index of the unescaped closing `]` starting from `start`.
 *
 * @remarks
 * Skips over `\]` sequences so that property values like `foo\]bar` are
 * treated as a single value rather than ending the block early.
 *
 * @param body - The full property body string
 * @param start - The index immediately after the opening `[`
 * @returns The index of the unescaped `]`, or `-1` if not found
 */
function findUnescapedClose(body: string, start: number): number {
  let i = start;
  while (i < body.length) {
    // eslint-disable-next-line security/detect-object-injection -- Controlled loop index over string chars
    if (body[i] === '\\' && i + 1 < body.length) {
      i += 2; // Skip escaped character
      continue;
    }
    // eslint-disable-next-line security/detect-object-injection -- Controlled loop index over string chars
    if (body[i] === ']') {
      return i;
    }
    i++;
  }
  return -1;
}

/**
 * Removes backslash escapes from a property value.
 *
 * @remarks
 * Converts `\]` → `]` and `\[` → `[` while preserving other characters.
 * This is the inverse of {@link escapePropertyValue}.
 *
 * @param value - The raw value from the selector (may contain `\]` or `\[`)
 * @returns The unescaped value
 */
function unescapePropertyValue(value: string): string {
  return value.replaceAll(/\\([\][])/g, '$1');
}

/**
 * Escapes `[` and `]` in a property value for safe embedding in selector strings.
 *
 * @remarks
 * Converts `]` → `\]` and `[` → `\[` so that the serialized selector
 * can be round-tripped through {@link parseUI5Selector}.
 *
 * @param value - The property value string
 * @returns The escaped value
 */
function escapePropertyValue(value: string): string {
  return value.replaceAll(/([\][])/g, '\\$1');
}

/**
 * Parses property blocks from a selector body string.
 *
 * @remarks
 * Extracts `[key=value]` pairs from the string. The first `=` in each block
 * is the delimiter; subsequent `=` characters are part of the value.
 * Escaped brackets (`\]`, `\[`) inside values are supported and unescaped.
 *
 * @param body - The portion of the selector after controlType and ID
 * @returns A record of property key-value pairs, or undefined if none found
 *
 * @example
 * ```typescript
 * parseProperties('[text=Save][enabled=true]');
 * // { text: 'Save', enabled: true }
 *
 * parseProperties('[text=foo\]bar]');
 * // { text: 'foo]bar' }
 * ```
 */
function parseProperties(
  body: string,
): Readonly<Record<string, string | number | boolean>> | undefined {
  const properties: Record<string, string | number | boolean> = {};
  let hasProperties = false;
  let position = 0;

  while (position < body.length) {
    const openBracket = body.indexOf('[', position);
    if (openBracket < 0) {
      break;
    }
    const closeBracket = findUnescapedClose(body, openBracket + 1);
    if (closeBracket < 0) {
      break;
    }

    const content = body.slice(openBracket + 1, closeBracket);
    const eqIndex = content.indexOf('=');
    if (eqIndex >= 0) {
      const key = content.slice(0, eqIndex);
      const rawValue = unescapePropertyValue(content.slice(eqIndex + 1));
      if (key.length > 0) {
        // eslint-disable-next-line security/detect-object-injection -- Building properties from parsed selector keys
        properties[key] = coercePropertyValue(rawValue);
        hasProperties = true;
      }
    }

    position = closeBracket + 1;
  }

  return hasProperties ? properties : undefined;
}

/**
 * Finds the end position of the controlType within a selector body.
 *
 * @param body - The selector body after the `ui5=` prefix
 * @returns Index where the controlType ends (at `#`, `[`, or end of string)
 */
function findControlTypeEnd(body: string): number {
  const hashIndex = body.indexOf('#');
  const bracketIndex = body.indexOf('[');

  if (hashIndex >= 0 && bracketIndex >= 0) {
    return Math.min(hashIndex, bracketIndex);
  }
  if (hashIndex >= 0) {
    return hashIndex;
  }
  if (bracketIndex >= 0) {
    return bracketIndex;
  }
  return body.length;
}

/**
 * Extracts the ID and remaining string from a body that starts with `#`.
 *
 * @param body - The selector body starting at the `#` character
 * @returns Tuple of [id, remaining] where remaining starts at the first `[`
 */
function extractId(body: string): readonly [string, string] {
  const afterHash = body.slice(1);
  const bracketIndex = afterHash.indexOf('[');
  if (bracketIndex >= 0) {
    return [afterHash.slice(0, bracketIndex), afterHash.slice(bracketIndex)] as const;
  }
  return [afterHash, ''] as const;
}

/**
 * Validates the raw selector string and throws on invalid input.
 *
 * @param selectorString - The raw selector string to validate
 * @throws {@link SelectorError} on empty, oversized, or missing-prefix input
 */
function validateRawSelector(selectorString: string): void {
  if (selectorString.length === 0) {
    throw new SelectorError({
      code: ErrorCode.ERR_SELECTOR_PARSE,
      message: 'Selector string must not be empty',
      attempted: PARSE_ATTEMPTED,
      retryable: false,
      selectorString,
      suggestions: [
        'Provide a non-empty selector string',
        'Use the format: ui5=controlType#id[prop=value]',
      ],
    });
  }

  if (selectorString.length > MAX_SELECTOR_LENGTH) {
    throw new SelectorError({
      code: ErrorCode.ERR_SELECTOR_PARSE,
      message: `Selector string exceeds maximum length of ${String(MAX_SELECTOR_LENGTH)} characters`,
      attempted: PARSE_ATTEMPTED,
      retryable: false,
      selectorString: selectorString.slice(0, 100) + '...',
      suggestions: [
        'Reduce the selector length',
        'Use more specific selectors instead of overly detailed ones',
      ],
    });
  }

  if (!selectorString.startsWith(UI5_PREFIX)) {
    throw new SelectorError({
      code: ErrorCode.ERR_SELECTOR_PARSE,
      message: `Selector string must start with "${UI5_PREFIX}" prefix`,
      attempted: PARSE_ATTEMPTED,
      retryable: false,
      selectorString,
      suggestions: [`Prefix your selector with "${UI5_PREFIX}"`, 'Example: ui5=sap.m.Button#myId'],
    });
  }
}

/**
 * Parses a `ui5=...` selector string into a structured {@link UI5Selector} object.
 *
 * @remarks
 * The selector format is: `ui5=controlType#id[prop1=value1][prop2=value2]`.
 * All parts are optional except the `ui5=` prefix plus at least some content.
 *
 * Boolean string values (`"true"`, `"false"`) are coerced to booleans.
 * Numeric strings that round-trip through `Number()` are coerced to numbers.
 *
 * @param selectorString - The raw selector string (must start with `ui5=`)
 * @returns A parsed UI5Selector object
 * @throws {@link SelectorError} with code `ERR_SELECTOR_PARSE` if the string
 *   is empty, missing the `ui5=` prefix, or exceeds 10,000 characters
 * @throws {@link SelectorError} with code `ERR_SELECTOR_INVALID` if the content
 *   after the prefix is empty
 *
 * @example
 * ```typescript
 * import { parseUI5Selector } from './selector-parser.js';
 *
 * const selector = parseUI5Selector('ui5=sap.m.Button#saveBtn[text=Save]');
 * // { controlType: 'sap.m.Button', id: 'saveBtn', properties: { text: 'Save' } }
 * ```
 */
export function parseUI5Selector(selectorString: string): UI5Selector {
  validateRawSelector(selectorString);

  const body = selectorString.slice(UI5_PREFIX.length);

  if (body.length === 0) {
    throw new SelectorError({
      code: ErrorCode.ERR_SELECTOR_INVALID,
      message: 'Selector content after "ui5=" prefix must not be empty',
      attempted: PARSE_ATTEMPTED,
      retryable: false,
      selectorString,
      suggestions: [
        'Provide a controlType, ID, or properties after the prefix',
        'Example: ui5=sap.m.Button or ui5=#myId',
      ],
    });
  }

  // Extract controlType: everything before first # or [
  const controlTypeEnd = findControlTypeEnd(body);
  const rawControlType = body.slice(0, controlTypeEnd);
  const controlType = rawControlType.length > 0 ? rawControlType : undefined;
  let remaining = body.slice(controlTypeEnd);

  // Extract ID: after #, up to first [ or end
  let id: string | undefined;
  if (remaining.startsWith('#')) {
    const [extractedId, rest] = extractId(remaining);
    id = extractedId;
    remaining = rest;
  }

  // Extract properties from remaining [key=value] blocks
  const properties = parseProperties(remaining);

  return {
    ...(controlType !== undefined && { controlType }),
    ...(id !== undefined && { id }),
    ...(properties !== undefined && { properties }),
  };
}

/**
 * Serializes a {@link UI5Selector} object into a `ui5=...` selector string.
 *
 * @remarks
 * This is the inverse of {@link parseUI5Selector}. It builds a string in the format
 * `ui5=controlType#id[key=value]`. Undefined fields are omitted.
 * RegExp `id` values are serialized using their `.source` property.
 *
 * @param selector - The UI5Selector to serialize
 * @returns The serialized selector string
 *
 * @example
 * ```typescript
 * import { serializeUI5Selector } from './selector-parser.js';
 *
 * const str = serializeUI5Selector({
 *   controlType: 'sap.m.Button',
 *   id: 'saveBtn',
 *   properties: { text: 'Save' },
 * });
 * // 'ui5=sap.m.Button#saveBtn[text=Save]'
 * ```
 */
export function serializeUI5Selector(selector: UI5Selector): string {
  let result = UI5_PREFIX;

  if (selector.controlType !== undefined) {
    result += selector.controlType;
  }

  if (selector.id !== undefined) {
    const idString = selector.id instanceof RegExp ? selector.id.source : selector.id;
    result += `#${idString}`;
  }

  if (selector.properties !== undefined) {
    for (const [key, value] of Object.entries(selector.properties)) {
      let stringValue: string;
      if (value instanceof RegExp) {
        stringValue = value.source;
      } else if (typeof value === 'object' && 'value' in value) {
        stringValue = escapePropertyValue(String(value.value));
      } else {
        stringValue = escapePropertyValue(String(value));
      }
      result += `[${key}=${stringValue}]`;
    }
  }

  return result;
}

/**
 * Validates a {@link UI5Selector} and returns an array of error messages.
 *
 * @remarks
 * An empty array indicates a valid selector. Checks include:
 * - At least one of `controlType`, `id`, or `properties` must be present
 * - `controlType` must be a dot-separated namespace (e.g., `sap.m.Button`)
 * - `id` must not be an empty string if provided
 *
 * @param selector - The UI5Selector to validate
 * @returns A readonly array of validation error strings (empty if valid)
 *
 * @example
 * ```typescript
 * import { validateUI5Selector } from './selector-parser.js';
 *
 * const errors = validateUI5Selector({ controlType: 'Button' });
 * // ['controlType must be a dot-separated namespace (e.g., sap.m.Button)']
 * ```
 */
export function validateUI5Selector(selector: UI5Selector): readonly string[] {
  const errors: string[] = [];

  const hasControlType = selector.controlType !== undefined;
  const hasId = selector.id !== undefined;
  const hasProperties =
    selector.properties !== undefined && Object.keys(selector.properties).length > 0;

  if (!hasControlType && !hasId && !hasProperties) {
    errors.push('Selector must specify at least one of: controlType, id, or properties');
  }

  if (hasControlType && !CONTROL_TYPE_PATTERN.test(selector.controlType ?? '')) {
    errors.push('controlType must be a dot-separated namespace (e.g., sap.m.Button)');
  }

  if (hasId && typeof selector.id === 'string' && selector.id.length === 0) {
    errors.push('id must not be an empty string');
  }

  return errors;
}

/**
 * Checks whether a string is a `ui5=...` selector string.
 *
 * @param value - The string to check
 * @returns `true` if the string starts with `ui5=`, `false` otherwise
 *
 * @example
 * ```typescript
 * import { isUI5SelectorString } from './selector-parser.js';
 *
 * isUI5SelectorString('ui5=sap.m.Button'); // true
 * isUI5SelectorString('sap.m.Button');     // false
 * ```
 */
export function isUI5SelectorString(value: string): boolean {
  return value.startsWith(UI5_PREFIX);
}

/**
 * Checks whether a property value is a {@link PropertyMatcher} object.
 *
 * @param val - The value to inspect
 * @returns `true` if the value has `value` and `operator` fields
 *
 * @example
 * ```typescript
 * isPropertyMatcherObject({ value: 'Save', operator: 'contains' }); // true
 * ```
 */
function isPropertyMatcherObject(val: unknown): val is PropertyMatcher {
  if (typeof val !== 'object' || val === null) return false;
  return 'value' in val && 'operator' in val;
}

/**
 * Maps a {@link PropertyMatcher} operator to the CSS pseudo-class name.
 *
 * @param operator - The property matcher operator
 * @returns The pseudo-class name (e.g., `'prop-contains'`)
 *
 * @example
 * ```typescript
 * operatorToPseudo('contains'); // 'prop-contains'
 * ```
 */
function operatorToPseudo(operator: NonNullable<PropertyMatcher['operator']>): string {
  switch (operator) {
    case 'equals':
      return 'prop';
    case 'contains':
      return 'prop-contains';
    case 'startsWith':
      return 'prop-starts-with';
    case 'endsWith':
      return 'prop-ends-with';
    case 'regex':
      return 'prop-regex';
  }
}

/**
 * Serializes a single property entry to a CSS pseudo-class fragment.
 *
 * @param key - Property name
 * @param value - Property value (string, number, boolean, RegExp, or PropertyMatcher)
 * @returns CSS pseudo-class fragment
 */
function serializePropertyEntry(key: string, value: unknown): string {
  if (isPropertyMatcherObject(value)) {
    const pseudo = operatorToPseudo(value.operator ?? 'equals');
    return `:${pseudo}(${key}, "${String(value.value)}")`;
  }
  if (value instanceof RegExp) {
    return `:prop-regex(${key}, "${value.source}")`;
  }
  return `:prop(${key}, "${String(value)}")`;
}

/**
 * Serializes a nested {@link UI5Selector} into CSS pseudo-class syntax (recursive helper).
 *
 * @param selector - The UI5 selector to serialize
 * @returns The CSS pseudo-class string without outer wrapping
 *
 * @example
 * ```typescript
 * serializeSelectorSegments({ controlType: 'sap.m.Button' });
 * // ':type(sap.m.Button)'
 * ```
 */
/**
 * Serializes a record of key-value pairs into CSS pseudo-class fragments.
 *
 * @param record - Map of string key-value pairs
 * @param pseudo - Pseudo-class name (e.g., `'binding'`, `'i18n'`)
 * @returns Concatenated pseudo-class fragments
 */
function serializeRecordEntries(
  record: Readonly<Record<string, string>> | undefined,
  pseudo: string,
): string {
  if (record === undefined) return '';
  let result = '';
  for (const [key, value] of Object.entries(record)) {
    result += `:${pseudo}(${key}, "${value}")`;
  }
  return result;
}

function serializeSelectorSegments(selector: UI5Selector): string {
  let result = '';

  if (selector.controlType !== undefined) {
    result += `:type(${selector.controlType})`;
  }

  if (selector.id !== undefined) {
    const idString = selector.id instanceof RegExp ? selector.id.source : selector.id;
    result += `#${idString}`;
  }

  if (selector.matchSubclasses === true) {
    result += ':subclass';
  }

  if (selector.properties !== undefined) {
    for (const [key, value] of Object.entries(selector.properties)) {
      result += serializePropertyEntry(key, value);
    }
  }

  if (selector.viewName !== undefined) {
    result += `:view(${selector.viewName})`;
  }

  result += serializeRecordEntries(selector.bindingPath, 'binding');
  result += serializeRecordEntries(selector.i18NText, 'i18n');

  if (selector.ancestor !== undefined) {
    result += `:ancestor(${serializeSelectorSegments(selector.ancestor)})`;
  }

  if (selector.descendant !== undefined) {
    result += `:descendant(${serializeSelectorSegments(selector.descendant)})`;
  }

  if (selector.searchOpenDialogs === true) {
    result += ':open-dialog';
  }

  return result;
}

/**
 * Converts a structured {@link UI5Selector} into a CSS-like pseudo-class selector string.
 *
 * @capability selectors.serializeUI5SelectorToCSS
 *
 * @remarks
 * This is the inverse of what the CSS selector engine parses. The output format
 * uses pseudo-class syntax like `:type(sap.m.Button):prop(text, "Save")`.
 *
 * @param selector - The UI5 selector to serialize
 * @returns The CSS-like pseudo-class selector string
 *
 * @example
 * ```typescript
 * import { serializeUI5SelectorToCSS } from './selector-parser.js';
 *
 * const css = serializeUI5SelectorToCSS({
 *   controlType: 'sap.m.Button',
 *   id: 'saveBtn',
 *   properties: { text: 'Save' },
 *   ancestor: { controlType: 'sap.m.Panel' },
 * });
 * // ':type(sap.m.Button)#saveBtn:prop(text, "Save"):ancestor(:type(sap.m.Panel))'
 * ```
 */
export function serializeUI5SelectorToCSS(selector: UI5Selector): string {
  return serializeSelectorSegments(selector);
}
