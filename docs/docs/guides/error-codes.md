---
title: Error Code Reference
description: 'Complete reference for all 77 Praman ERR_* codes across 17 categories, with troubleshooting guidance for each.'
sidebar_position: 99
keywords:
  - praman error codes
  - ERR_ codes
  - sap ui5 test errors
  - playwright praman troubleshooting
---

# Error Code Reference

Every Praman error carries a machine-readable `code` field on the error object.
This page maps each of the 77 `ERR_*` codes to its meaning and troubleshooting steps.

For the broader error system (hierarchy, properties, serialization), see
[Error Reference](./errors.md). For step-by-step diagnostics, see
[Troubleshooting](./troubleshooting.md).

Codes follow the pattern `ERR_<CATEGORY>_<REASON>`.

---

## Config Errors

Configuration is validated at startup. These errors indicate a problem with your
`pramanConfig` block in `playwright.config.ts`.

| Code                   | Meaning                                                                                 | Fix                                                                                                                           |
| ---------------------- | --------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------- |
| `ERR_CONFIG_INVALID`   | Zod schema validation failed — a required field is missing or a value is the wrong type | Compare your config against the [Configuration guide](./configuration.md); look at `error.details` for the specific Zod issue |
| `ERR_CONFIG_NOT_FOUND` | Praman could not locate a config file at the expected path                              | Ensure `pramanConfig` is exported from `playwright.config.ts` or that a config file path resolves correctly                   |
| `ERR_CONFIG_PARSE`     | Config file exists but could not be parsed (JSON/TS syntax error)                       | Open the config file and fix any syntax errors; run `tsc --noEmit` to surface TypeScript issues                               |

---

## Bridge Errors

The bridge injects a script into the SAP page to expose UI5 internals to Playwright.
These errors occur when that injection or communication fails.

| Code                   | Meaning                                                              | Fix                                                                                        |
| ---------------------- | -------------------------------------------------------------------- | ------------------------------------------------------------------------------------------ |
| `ERR_BRIDGE_TIMEOUT`   | Bridge injection did not complete within the configured timeout      | Increase `bridgeTimeout`; check network speed and whether the SAP page is loading slowly   |
| `ERR_BRIDGE_INJECTION` | Bridge script failed to inject into the page (CSP or frame mismatch) | Check Content-Security-Policy headers; verify you are targeting the correct frame          |
| `ERR_BRIDGE_NOT_READY` | Bridge injected but UI5 has not finished bootstrapping               | Call `waitForUI5Stable()` before interacting; ensure the app's bootstrap script has loaded |
| `ERR_BRIDGE_VERSION`   | The running UI5 version is below the minimum supported version       | Praman requires UI5 1.71+; check the UI5 version of your target app                        |
| `ERR_BRIDGE_EXECUTION` | A bridge script call threw an exception in the browser context       | Inspect `error.details.scriptError`; often a UI5 API was called on a destroyed control     |

---

## Control Errors

These errors occur when Praman locates, reads, or interacts with a UI5 control.

| Code                             | Meaning                                                                      | Fix                                                                                                                                           |
| -------------------------------- | ---------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| `ERR_CONTROL_NOT_FOUND`          | No control matched the given selector within the timeout                     | Verify the control ID or type exists in the current view; try `waitForUI5Stable()` first; use `controlType + properties` instead of a bare ID |
| `ERR_CONTROL_NOT_VISIBLE`        | Control was found in the UI5 registry but its DOM element is not visible     | Check if the control is inside a hidden panel or not yet rendered; wait for the parent container to become visible                            |
| `ERR_CONTROL_NOT_ENABLED`        | Control is visible but its `enabled` property is `false`                     | Your test may be running before business logic enables the control; assert a prerequisite state first                                         |
| `ERR_CONTROL_NOT_INTERACTABLE`   | Control exists and is visible but cannot receive user interactions           | Check for overlapping elements or a loading spinner; use `searchOpenDialogs: true` if the control is in a dialog                              |
| `ERR_CONTROL_NOT_UI5`            | The DOM element found is not a managed SAP UI5 control                       | Use Playwright native locators for non-UI5 elements (plain HTML inputs, custom web components)                                                |
| `ERR_CONTROL_PROPERTY`           | Reading or writing a UI5 control property failed                             | Verify the property name via UI5 API docs; check if the property is read-only at runtime                                                      |
| `ERR_CONTROL_AGGREGATION`        | Accessing a UI5 control aggregation (e.g., `items`) failed                   | Ensure the aggregation is bound and the model data has loaded; check `error.details.aggregationName`                                          |
| `ERR_CONTROL_METHOD`             | Invoking a method on the UI5 control failed or the method is on the denylist | Only call UI5 public API methods; check the denylist in `PramanConfig.methodDenyList`                                                         |
| `ERR_CONTROL_INTERACTION_FAILED` | A click, type, or select operation on the control failed mid-execution       | Retry the test; if consistent, check for race conditions between animations and interactions                                                  |
| `ERR_CONTROL_NO_DOM_REF`         | The UI5 control has no rendered DOM reference                                | The control may not be rendered yet; call `waitForUI5Stable()` and verify the control is in the active view                                   |

---

## Auth Errors

These errors occur during the authentication phase (typically in `globalSetup` / `auth.setup.ts`).

| Code                        | Meaning                                                                  | Fix                                                                                                       |
| --------------------------- | ------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------- |
| `ERR_AUTH_FAILED`           | Authentication was rejected — wrong credentials or invalid SSO token     | Check your credentials; ensure your `SAP_PASSWORD` / `SAP_USER` env vars are set correctly                |
| `ERR_AUTH_TIMEOUT`          | The login page did not respond or complete within the configured timeout | Increase `authTimeout` in config; check network connectivity to the SAP system                            |
| `ERR_AUTH_SESSION_EXPIRED`  | The stored authentication session has expired (default session: 30 min)  | Re-run `globalSetup` to refresh the session; reduce test suite parallelism if sessions expire too quickly |
| `ERR_AUTH_STRATEGY_INVALID` | The `authStrategy` value in config is unknown or misconfigured           | Valid strategies: `form`, `saml`, `basic`, `oauth`; see [Authentication guide](./authentication.md)       |

---

## Navigation Errors

These errors occur when navigating within the SAP Fiori Launchpad or via hash routes.

| Code                     | Meaning                                                   | Fix                                                                                           |
| ------------------------ | --------------------------------------------------------- | --------------------------------------------------------------------------------------------- |
| `ERR_NAV_TILE_NOT_FOUND` | An FLP tile with the given title could not be found       | Verify the tile title matches exactly (case-sensitive); check the user's role-based access    |
| `ERR_NAV_ROUTE_FAILED`   | Hash-based navigation did not resolve to the expected app | Check the intent hash; ensure the app is deployed and the user has the required catalog entry |
| `ERR_NAV_TIMEOUT`        | Navigation did not complete within the configured timeout | Increase `navigationTimeout`; check for slow network or heavy app initialization              |

---

## OData Errors

These errors occur when Praman makes OData service calls (e.g., for data seeding or validation).

| Code                       | Meaning                                                         | Fix                                                                                                        |
| -------------------------- | --------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------- |
| `ERR_ODATA_REQUEST_FAILED` | The HTTP request to the OData service returned a non-2xx status | Inspect `error.details.status` and `error.details.body`; check service availability and user authorization |
| `ERR_ODATA_PARSE`          | The OData response body could not be parsed as valid JSON/XML   | The service may be returning an error page (HTML) instead of data; check the raw response                  |
| `ERR_ODATA_CSRF`           | CSRF token fetch or re-use validation failed                    | The session may have expired; ensure the CSRF fetch HEAD request succeeds before mutating requests         |
| `ERR_ODATA_TRACE`          | OData trace/logging request failed                              | Only relevant when `odataTrace: true`; check if the `sap-statistics` header is supported by the backend    |

---

## Selector Errors

These errors occur when parsing or resolving a Praman selector object.

| Code                     | Meaning                                                                   | Fix                                                                                                         |
| ------------------------ | ------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------- |
| `ERR_SELECTOR_INVALID`   | The selector object is malformed — missing required fields or wrong types | Ensure you pass at least one of `id`, `controlType`, or `properties`; see [Selectors guide](./selectors.md) |
| `ERR_SELECTOR_AMBIGUOUS` | Multiple UI5 controls matched the selector                                | Add more specific `properties` to narrow the match; use `index` to pick a specific instance                 |
| `ERR_SELECTOR_PARSE`     | A selector string (e.g., from a shorthand) could not be parsed            | Check the selector string syntax; prefer object selectors over string shorthands                            |

---

## Timeout Errors

These errors surface when a wait condition exceeds the configured duration.

| Code                            | Meaning                                                            | Fix                                                                                                      |
| ------------------------------- | ------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------- |
| `ERR_TIMEOUT_UI5_STABLE`        | `waitForUI5Stable()` timed out — UI5 did not reach a stable state  | Increase `ui5StabilityTimeout`; check for pending XHR/OData requests that never resolve                  |
| `ERR_TIMEOUT_CONTROL_DISCOVERY` | Control discovery loop timed out before finding the target control | Increase `controlDiscoveryTimeout`; verify the control is actually rendered in the current view          |
| `ERR_TIMEOUT_OPERATION`         | A generic Praman operation exceeded its configured timeout         | Inspect `error.details.operation` to identify which step timed out; increase the relevant timeout config |

---

## AI Errors

These errors occur in the AI-assisted test layer (requires `playwright-praman/ai`).

| Code                           | Meaning                                                                   | Fix                                                                                                |
| ------------------------------ | ------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------- |
| `ERR_AI_PROVIDER_UNAVAILABLE`  | The configured LLM provider endpoint is not reachable                     | Check network connectivity to the provider; verify API base URL in `aiConfig.provider`             |
| `ERR_AI_RESPONSE_INVALID`      | The LLM returned a response that does not match the expected schema       | The provider may have changed its output format; check for model version changes                   |
| `ERR_AI_TOKEN_LIMIT`           | The prompt exceeded the model's context window limit                      | Reduce the page context sent to the model; use `contextStrategy: 'minimal'` in AI config           |
| `ERR_AI_RATE_LIMITED`          | The LLM provider rejected the request due to rate limiting                | Back off and retry; reduce test parallelism when using AI-assisted steps                           |
| `ERR_AI_NOT_CONFIGURED`        | AI features were called but no AI provider is configured                  | Add an `aiConfig` block to your Praman config with a valid provider and API key                    |
| `ERR_AI_LLM_CALL_FAILED`       | The LLM API call itself failed (network error, 5xx response)              | Retry the test; check provider status page; inspect `error.details.cause` for the underlying error |
| `ERR_AI_RESPONSE_PARSE_FAILED` | The LLM response body could not be parsed into the expected structure     | Enable `aiConfig.debugResponses: true` to log raw LLM output for inspection                        |
| `ERR_AI_CONTEXT_BUILD_FAILED`  | Building the page context payload for the LLM failed                      | The page may not have loaded correctly; ensure `waitForUI5Stable()` is called before AI steps      |
| `ERR_AI_STEP_INTERPRET_FAILED` | The AI could not interpret a natural-language step into a concrete action | Rephrase the step description; add domain vocabulary via `vocabularyPath`                          |
| `ERR_AI_INVALID_REQUEST`       | The AI request object is malformed or missing required fields             | Check the `performIntent()` or `aiStep()` call arguments                                           |
| `ERR_AI_CAPABILITY_NOT_FOUND`  | The requested capability is not registered in the capabilities registry   | Ensure the capability name matches an entry in `capabilities.yaml`                                 |

---

## Plugin Errors

These errors occur when loading or initializing a Praman plugin.

| Code                             | Meaning                                                       | Fix                                                                                                  |
| -------------------------------- | ------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------- |
| `ERR_PLUGIN_LOAD`                | The plugin module could not be resolved or imported           | Check the plugin path in `plugins[]` config; ensure the package is installed                         |
| `ERR_PLUGIN_INIT`                | The plugin's `init()` hook threw an error                     | Check the plugin's own error message in `error.details.cause`; see the plugin's documentation        |
| `ERR_PLUGIN_INCOMPATIBLE`        | The plugin declares an incompatible `pramanVersion` range     | Update the plugin or downgrade Praman to a compatible version; check the plugin's `peerDependencies` |
| `ERR_PLUGIN_EXTENSION_DUPLICATE` | Two plugins register the same extension point key             | Rename one extension or remove the duplicate plugin                                                  |
| `ERR_PLUGIN_EXTENSION_INVALID`   | A plugin extension does not conform to the required interface | Check the plugin's extension implementation against the Praman extension API                         |

---

## Vocabulary Errors

These errors occur in the business vocabulary system (`playwright-praman/vocabulary`).

| Code                           | Meaning                                                          | Fix                                                                                     |
| ------------------------------ | ---------------------------------------------------------------- | --------------------------------------------------------------------------------------- |
| `ERR_VOCAB_TERM_NOT_FOUND`     | A business term was not found in the loaded vocabulary           | Add the term to your domain vocabulary JSON file; check spelling and locale             |
| `ERR_VOCAB_DOMAIN_LOAD_FAILED` | The vocabulary domain JSON file failed to load                   | Check the `vocabularyPath` in config; ensure the file exists and is readable            |
| `ERR_VOCAB_JSON_INVALID`       | The domain vocabulary JSON file is malformed                     | Validate the JSON syntax; compare against the vocabulary schema in the documentation    |
| `ERR_VOCAB_AMBIGUOUS_MATCH`    | Multiple vocabulary terms matched with similar confidence scores | Make the term more specific; use the full canonical term name from your vocabulary file |

---

## Intent Errors

These errors occur in the intent/action API (`playwright-praman/intents`).

| Code                           | Meaning                                                         | Fix                                                                                            |
| ------------------------------ | --------------------------------------------------------------- | ---------------------------------------------------------------------------------------------- |
| `ERR_INTENT_FIELD_NOT_FOUND`   | A form field referenced by an intent was not found on the page  | Verify the field name maps to an actual UI5 control; check the field's vocabulary mapping      |
| `ERR_INTENT_ACTION_FAILED`     | The intent action (fill, select, submit) could not be completed | Inspect `error.details` for the underlying cause; often a `ERR_CONTROL_*` error wrapped inside |
| `ERR_INTENT_NAVIGATION_FAILED` | Intent-driven navigation to an app or tile failed               | Check that the target app is accessible for the test user; see Navigation Errors above         |
| `ERR_INTENT_VALIDATION_FAILED` | Intent input validation rejected a provided value               | Check that the value matches the field's type and any business rule constraints                |

---

## FLP Errors

These errors occur when interacting with the SAP Fiori Launchpad shell.

| Code                        | Meaning                                                                | Fix                                                                                         |
| --------------------------- | ---------------------------------------------------------------------- | ------------------------------------------------------------------------------------------- |
| `ERR_FLP_SHELL_NOT_FOUND`   | The FLP shell container element was not found in the DOM               | Ensure you have navigated to the FLP URL before calling FLP APIs; check the base URL config |
| `ERR_FLP_PERMISSION_DENIED` | The test user does not have permission for the requested FLP operation | Assign the correct role/catalog to the test user in the SAP system                          |
| `ERR_FLP_API_UNAVAILABLE`   | The FLP UShell JavaScript API is not available on the page             | The app may not be running inside the FLP container; check the URL and app embedding        |
| `ERR_FLP_INVALID_USER`      | The FLP user context is invalid or missing                             | Re-authenticate; check that `globalSetup` ran successfully and the stored session is valid  |
| `ERR_FLP_OPERATION_TIMEOUT` | An FLP operation (tile click, app launch) timed out                    | Increase `flpTimeout` in config; check for slow system response or heavy tile loading       |

---

## Matcher Errors

These errors occur when registering or using custom Playwright matchers added by Praman.

| Code                    | Meaning                                                                      | Fix                                                                                                      |
| ----------------------- | ---------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------- |
| `ERR_MATCHER_DUPLICATE` | A custom matcher with the same name was registered twice                     | Remove the duplicate `extendMatchers()` call; each matcher name must be unique                           |
| `ERR_MATCHER_INVALID`   | The matcher definition is missing required fields (e.g., no `pass` function) | Check the matcher object passed to `extendMatchers()`; see [Custom Matchers guide](./custom-matchers.md) |
| `ERR_MATCHER_FROZEN`    | Attempting to register a matcher after the registry has been locked          | Call `extendMatchers()` before test execution begins, in `globalSetup` or at the fixture level           |

---

## Browser Bind Errors

These errors occur in the browser binding layer used by Playwright's `exposeFunction` integration.

| Code                     | Meaning                                                               | Fix                                                                                                      |
| ------------------------ | --------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------- |
| `ERR_BIND_NOT_SUPPORTED` | The requested browser binding is not supported in the current context | Some bindings require a specific Playwright context type; check the bridge adapter documentation         |
| `ERR_BIND_FAILED`        | Registering the browser binding via `exposeFunction` failed           | Ensure the binding is registered before page navigation; check for name conflicts with existing bindings |

---

## Screencast Errors

These errors occur in the screencast/video chapter recording feature.

| Code                            | Meaning                                                              | Fix                                                                                                       |
| ------------------------------- | -------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------- |
| `ERR_SCREENCAST_NOT_STARTED`    | A screencast chapter was marked without an active screencast session | Ensure `screencast: true` is set in your Playwright context options and Praman is configured to use it    |
| `ERR_SCREENCAST_CHAPTER_FAILED` | Adding a chapter marker to the screencast failed                     | Check that the screencast session is still active; inspect `error.details.cause` for the underlying error |
| `ERR_SCREENCAST_FRAME_HANDLER`  | The screencast frame handler threw an error during capture           | Likely a transient issue; retry the test; if persistent, disable screencast to isolate the problem        |

---

## Telemetry Errors

These errors occur in the optional OpenTelemetry integration (`playwright-praman/reporters`).

| Code                                | Meaning                                                         | Fix                                                                                                    |
| ----------------------------------- | --------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------ |
| `ERR_TELEMETRY_INIT_FAILED`         | The OpenTelemetry SDK failed to initialize                      | Check your OTLP endpoint URL and credentials; ensure the `@opentelemetry/*` peer deps are installed    |
| `ERR_TELEMETRY_PEER_DEP_MISSING`    | A required OpenTelemetry peer dependency is not installed       | Run `npm install @opentelemetry/sdk-node @opentelemetry/exporter-otlp-grpc` (or the relevant packages) |
| `ERR_TELEMETRY_EXPORTER_FAILED`     | The OTLP exporter could not send spans/metrics to the collector | Check network connectivity to the collector; verify the endpoint and authentication headers            |
| `ERR_TELEMETRY_SHUTDOWN_FAILED`     | The telemetry SDK did not shut down cleanly at end of test run  | Usually benign; if consistent, call `sdk.shutdown()` explicitly in `globalTeardown`                    |
| `ERR_TELEMETRY_METRICS_INIT_FAILED` | The metrics pipeline (MeterProvider) failed to initialize       | Check your metrics exporter config; ensure `metricsInterval` is a positive integer                     |

---

## See Also

- [Error Reference](./errors.md) — error hierarchy, properties, and serialization
- [Troubleshooting](./troubleshooting.md) — step-by-step diagnostic guide
- [Configuration](./configuration.md) — all `pramanConfig` fields and defaults
- [Debugging](./debugging.md) — how to inspect bridge state and control discovery
