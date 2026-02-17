/**
 * Praman ESLint Plugin — UI5 Deprecated API Detection
 *
 * Two rules:
 * - no-deprecated-ui5-globals: Warns on sap.ui.getCore(), jQuery.sap.*, etc.
 * - no-deprecated-ui5-api: Warns on deprecated property/method names in bridge API calls.
 *
 * Both rules are warn-only and non-blocking in CI.
 */

import noDeprecatedUi5Globals from './no-deprecated-ui5-globals.js';
import noDeprecatedUi5Api from './no-deprecated-ui5-api.js';

export default {
  rules: {
    'no-deprecated-ui5-globals': noDeprecatedUi5Globals,
    'no-deprecated-ui5-api': noDeprecatedUi5Api,
  },
};
