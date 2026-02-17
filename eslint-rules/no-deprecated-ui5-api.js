/**
 * ESLint rule: praman/no-deprecated-ui5-api
 *
 * Warns when deprecated UI5 method/property names are passed as string
 * literals to bridge-style API calls like getProperty(), setProperty(),
 * executeControlMethod(), or invokeMethod().
 *
 * Reads the generated deprecation report from
 * scripts/data/deprecated-ui5-apis.json for the list of deprecated names.
 */

import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPORT_PATH = join(__dirname, '..', 'scripts', 'data', 'deprecated-ui5-apis.json');

/**
 * Methods where the FIRST argument is the property/method name to check.
 */
const FIRST_ARG_METHODS = new Set([
  'getProperty',
  'setProperty',
  'getAggregation',
  'getBindingInfo',
  'isBound',
]);

/**
 * Methods where the SECOND argument is the method name to check.
 * (First argument is typically a control ID.)
 */
const SECOND_ARG_METHODS = new Set([
  'executeControlMethod',
  'invokeMethod',
  'getControlProperty',
  'setControlProperty',
  'getControlAggregation',
]);

/**
 * Load and parse the deprecation report. Build lookup structures.
 * Returns null if the report doesn't exist (rule becomes a no-op).
 */
function loadDeprecationData() {
  try {
    const raw = readFileSync(REPORT_PATH, 'utf-8');
    const data = JSON.parse(raw);

    const deprecatedSet = new Set(data.deprecatedNames ?? []);

    // Build a reverse lookup: name → [{ control, since, text }]
    const detailsMap = new Map();
    for (const [control, entries] of Object.entries(data.controls ?? {})) {
      for (const entry of entries) {
        if (!detailsMap.has(entry.name)) {
          detailsMap.set(entry.name, []);
        }
        detailsMap.get(entry.name).push({
          control,
          since: entry.since,
          text: entry.text,
        });
      }
    }

    return { deprecatedSet, detailsMap };
  } catch {
    // Report not generated yet — rule is a no-op
    return null;
  }
}

/** @type {import('eslint').Rule.RuleModule} */
const rule = {
  meta: {
    type: 'suggestion',
    docs: {
      description: 'Warn on deprecated UI5 property/method names in bridge API string arguments',
      category: 'UI5 Deprecation',
    },
    schema: [],
  },

  create(context) {
    const data = loadDeprecationData();
    if (!data) return {};

    const { deprecatedSet, detailsMap } = data;

    /**
     * Get the method name from a CallExpression callee.
     * Handles both obj.method() and obj?.method() patterns.
     */
    function getCalleeName(node) {
      const callee = node.callee;
      if (callee.type === 'MemberExpression' && callee.property.type === 'Identifier') {
        return callee.property.name;
      }
      // ChainExpression wraps optional member access
      if (callee.type === 'ChainExpression' && callee.expression.type === 'MemberExpression') {
        const prop = callee.expression.property;
        if (prop.type === 'Identifier') return prop.name;
      }
      return null;
    }

    /**
     * Check if a node is a string literal and return its value, or null.
     */
    function getStringValue(node) {
      if (!node) return null;
      if (node.type === 'Literal' && typeof node.value === 'string') {
        return node.value;
      }
      // Template literal with no expressions
      if (node.type === 'TemplateLiteral' && node.expressions.length === 0 && node.quasis.length === 1) {
        return node.quasis[0].value.cooked;
      }
      return null;
    }

    /**
     * Build a descriptive warning message for a deprecated name.
     */
    function buildMessage(name) {
      const details = detailsMap.get(name);
      if (details && details.length > 0) {
        const first = details[0];
        const controlList = details.map((d) => d.control).join(', ');
        const sinceStr = first.since ? ` (deprecated since UI5 ${first.since})` : '';
        const textStr = first.text ? ` ${first.text}` : '';
        return `'${name}' is a deprecated UI5 API${sinceStr} on ${controlList}.${textStr}`;
      }
      return `'${name}' is a deprecated UI5 API. Check SAP UI5 documentation for alternatives.`;
    }

    return {
      CallExpression(node) {
        const calleeName = getCalleeName(node);
        if (!calleeName) return;

        // Check first argument for getProperty/setProperty/etc.
        if (FIRST_ARG_METHODS.has(calleeName)) {
          const argValue = getStringValue(node.arguments[0]);
          if (argValue !== null && deprecatedSet.has(argValue)) {
            context.report({
              node: node.arguments[0],
              message: buildMessage(argValue),
            });
          }
          return;
        }

        // Check second argument for executeControlMethod/invokeMethod/etc.
        if (SECOND_ARG_METHODS.has(calleeName)) {
          const argValue = getStringValue(node.arguments[1]);
          if (argValue !== null && deprecatedSet.has(argValue)) {
            context.report({
              node: node.arguments[1],
              message: buildMessage(argValue),
            });
          }
        }
      },
    };
  },
};

export default rule;
