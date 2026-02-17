/**
 * ESLint rule: praman/no-deprecated-ui5-globals
 *
 * Warns on deprecated SAP UI5 global API patterns:
 * - sap.ui.getCore() — deprecated in UI5 2.x
 * - jQuery.sap.* / $.sap.* — deprecated since UI5 1.58
 * - sap.ui.define() / sap.ui.require() — use ES module imports
 */

/**
 * Walks a MemberExpression (or ChainExpression) chain and collects
 * property names from right to left. Handles optional chaining and
 * TSAsExpression nodes (e.g., `(window as any).sap`).
 *
 * @param {import('estree').Node} node
 * @returns {string[]} e.g., ['window', 'sap', 'ui', 'getCore']
 */
function getChainNames(node) {
  const names = [];
  let current = node;

  while (current) {
    // Strip TypeScript type assertions: (window as any)
    if (current.type === 'TSAsExpression' || current.type === 'TSTypeAssertion') {
      current = current.expression;
      continue;
    }

    // Unwrap ChainExpression (optional chaining wrapper)
    if (current.type === 'ChainExpression') {
      current = current.expression;
      continue;
    }

    if (current.type === 'MemberExpression') {
      if (current.property.type === 'Identifier') {
        names.unshift(current.property.name);
      }
      current = current.object;
      continue;
    }

    if (current.type === 'CallExpression') {
      current = current.callee;
      continue;
    }

    if (current.type === 'Identifier') {
      names.unshift(current.name);
      break;
    }

    // Unrecognized node type — stop walking
    break;
  }

  return names;
}

/** @type {import('eslint').Rule.RuleModule} */
const rule = {
  meta: {
    type: 'suggestion',
    docs: {
      description: 'Warn on deprecated SAP UI5 global API usage',
      category: 'UI5 Deprecation',
    },
    schema: [],
    messages: {
      getCore:
        'sap.ui.getCore() is deprecated in UI5 2.x. Use sap/ui/core/Rendering for pending tasks or sap/ui/core/Element.getElementById() for control lookup.',
      jquerySap:
        'jQuery.sap.* is deprecated since UI5 1.58. Use the corresponding module import instead (e.g., sap/base/Log, sap/ui/dom/*).',
      sapUiDefine:
        'sap.ui.define() is a legacy global. Use ES module imports instead.',
      sapUiRequire:
        'sap.ui.require() as a global is deprecated. Use ES module imports or dynamic import() instead.',
    },
  },

  create(context) {
    return {
      CallExpression(node) {
        const chain = getChainNames(node.callee);
        const joined = chain.join('.');

        // sap.ui.getCore() or *.sap.ui.getCore() (e.g., window.sap.ui.getCore())
        if (joined.endsWith('sap.ui.getCore')) {
          context.report({ node, messageId: 'getCore' });
          return;
        }

        // sap.ui.define()
        if (joined.endsWith('sap.ui.define')) {
          context.report({ node, messageId: 'sapUiDefine' });
          return;
        }

        // sap.ui.require()
        if (joined.endsWith('sap.ui.require')) {
          context.report({ node, messageId: 'sapUiRequire' });
        }
      },

      MemberExpression(node) {
        // Only check the outermost MemberExpression to avoid duplicate reports
        if (node.parent.type === 'MemberExpression') return;
        // Skip if this is a callee (handled by CallExpression visitor)
        if (node.parent.type === 'CallExpression' && node.parent.callee === node) return;

        const chain = getChainNames(node);
        const joined = chain.join('.');

        // jQuery.sap.* or $.sap.*
        if (/(?:^|\.)(?:jQuery|[$])\.sap(?:\.|$)/.test(joined)) {
          context.report({ node, messageId: 'jquerySap' });
        }
      },
    };
  },
};

export default rule;
