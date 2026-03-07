---
title: Error Reference
description: 'Complete Praman error reference: 14 error classes, 58 error codes with retryable flags and actionable suggestions for SAP UI5 testing.'
keywords:
  - praman error codes
  - sap ui5 test debugging
  - playwright sap error handling
  - sap ui5 test automation
---

Praman provides 14 typed error classes with 58 machine-readable error codes. Every error includes
the attempted operation, a `retryable` flag, and actionable recovery `suggestions`.

## Error Hierarchy

All errors extend `PramanError`, which extends `Error`:

```text
Error
 └── PramanError
      ├── AIError          (11 codes)
      ├── AuthError        (4 codes)
      ├── BridgeError      (5 codes)
      ├── ConfigError      (3 codes)
      ├── ControlError     (8 codes)
      ├── FLPError         (5 codes)
      ├── IntentError      (4 codes)
      ├── NavigationError  (3 codes)
      ├── ODataError       (3 codes)
      ├── PluginError      (3 codes)
      ├── SelectorError    (3 codes)
      ├── TimeoutError     (3 codes)
      └── VocabularyError  (4 codes)
```

## Error Codes

### Config Errors

| Code                   | Description                                    | Retryable |
| ---------------------- | ---------------------------------------------- | --------- |
| `ERR_CONFIG_INVALID`   | Zod schema validation failed                   | No        |
| `ERR_CONFIG_NOT_FOUND` | Config file not found at expected path         | No        |
| `ERR_CONFIG_PARSE`     | Config file could not be parsed (syntax error) | No        |

### Bridge Errors

| Code                   | Description                              | Retryable |
| ---------------------- | ---------------------------------------- | --------- |
| `ERR_BRIDGE_TIMEOUT`   | Bridge injection exceeded timeout        | Yes       |
| `ERR_BRIDGE_INJECTION` | Bridge script failed to inject into page | Yes       |
| `ERR_BRIDGE_NOT_READY` | Bridge not ready (UI5 not loaded)        | Yes       |
| `ERR_BRIDGE_VERSION`   | UI5 version mismatch or unsupported      | No        |
| `ERR_BRIDGE_EXECUTION` | Bridge script execution failed           | Yes       |

### Control Errors

| Code                             | Description                                     | Retryable |
| -------------------------------- | ----------------------------------------------- | --------- |
| `ERR_CONTROL_NOT_FOUND`          | Control not found with given selector           | Yes       |
| `ERR_CONTROL_NOT_VISIBLE`        | Control exists but is not visible               | Yes       |
| `ERR_CONTROL_NOT_ENABLED`        | Control is visible but disabled                 | No        |
| `ERR_CONTROL_NOT_INTERACTABLE`   | Control cannot receive interactions             | No        |
| `ERR_CONTROL_PROPERTY`           | Property read/write failed                      | No        |
| `ERR_CONTROL_AGGREGATION`        | Aggregation access failed                       | No        |
| `ERR_CONTROL_METHOD`             | Method invocation failed (possibly blacklisted) | No        |
| `ERR_CONTROL_INTERACTION_FAILED` | Click/type/select operation failed              | Yes       |

### Auth Errors

| Code                        | Description                               | Retryable |
| --------------------------- | ----------------------------------------- | --------- |
| `ERR_AUTH_FAILED`           | Authentication failed (wrong credentials) | No        |
| `ERR_AUTH_TIMEOUT`          | Login page did not respond in time        | Yes       |
| `ERR_AUTH_SESSION_EXPIRED`  | Session expired (default: 30 min)         | Yes       |
| `ERR_AUTH_STRATEGY_INVALID` | Unknown or misconfigured auth strategy    | No        |

### Navigation Errors

| Code                     | Description                         | Retryable |
| ------------------------ | ----------------------------------- | --------- |
| `ERR_NAV_TILE_NOT_FOUND` | FLP tile not found by title         | No        |
| `ERR_NAV_ROUTE_FAILED`   | Hash navigation did not resolve     | Yes       |
| `ERR_NAV_TIMEOUT`        | Navigation did not complete in time | Yes       |

### OData Errors

| Code                       | Description                           | Retryable |
| -------------------------- | ------------------------------------- | --------- |
| `ERR_ODATA_REQUEST_FAILED` | HTTP request to OData service failed  | Yes       |
| `ERR_ODATA_PARSE`          | OData response could not be parsed    | No        |
| `ERR_ODATA_CSRF`           | CSRF token fetch or validation failed | Yes       |

### Selector Errors

| Code                     | Description                          | Retryable |
| ------------------------ | ------------------------------------ | --------- |
| `ERR_SELECTOR_INVALID`   | Selector object is malformed         | No        |
| `ERR_SELECTOR_AMBIGUOUS` | Multiple controls match the selector | No        |
| `ERR_SELECTOR_PARSE`     | Selector string could not be parsed  | No        |

### Timeout Errors

| Code                            | Description                        | Retryable |
| ------------------------------- | ---------------------------------- | --------- |
| `ERR_TIMEOUT_UI5_STABLE`        | UI5 did not reach stable state     | Yes       |
| `ERR_TIMEOUT_CONTROL_DISCOVERY` | Control discovery exceeded timeout | Yes       |
| `ERR_TIMEOUT_OPERATION`         | Generic operation timeout          | Yes       |

### AI Errors

| Code                           | Description                          | Retryable |
| ------------------------------ | ------------------------------------ | --------- |
| `ERR_AI_PROVIDER_UNAVAILABLE`  | LLM provider not reachable           | Yes       |
| `ERR_AI_RESPONSE_INVALID`      | LLM returned invalid response format | Yes       |
| `ERR_AI_TOKEN_LIMIT`           | Prompt exceeded token limit          | No        |
| `ERR_AI_RATE_LIMITED`          | Provider rate limit hit              | Yes       |
| `ERR_AI_NOT_CONFIGURED`        | AI provider not configured           | No        |
| `ERR_AI_LLM_CALL_FAILED`       | LLM API call failed                  | Yes       |
| `ERR_AI_RESPONSE_PARSE_FAILED` | Could not parse LLM response         | Yes       |
| `ERR_AI_CONTEXT_BUILD_FAILED`  | Page context build failed            | Yes       |
| `ERR_AI_STEP_INTERPRET_FAILED` | Step interpretation failed           | No        |
| `ERR_AI_INVALID_REQUEST`       | Invalid or malformed AI request      | No        |
| `ERR_AI_CAPABILITY_NOT_FOUND`  | Requested capability not in registry | No        |

### Plugin Errors

| Code                      | Description                       | Retryable |
| ------------------------- | --------------------------------- | --------- |
| `ERR_PLUGIN_LOAD`         | Plugin module could not be loaded | No        |
| `ERR_PLUGIN_INIT`         | Plugin initialization failed      | Yes       |
| `ERR_PLUGIN_INCOMPATIBLE` | Plugin version incompatible       | No        |

### Vocabulary Errors

| Code                           | Description                             | Retryable |
| ------------------------------ | --------------------------------------- | --------- |
| `ERR_VOCAB_TERM_NOT_FOUND`     | Business term not in vocabulary         | No        |
| `ERR_VOCAB_DOMAIN_LOAD_FAILED` | Domain JSON failed to load              | Yes       |
| `ERR_VOCAB_JSON_INVALID`       | Domain vocabulary JSON malformed        | No        |
| `ERR_VOCAB_AMBIGUOUS_MATCH`    | Multiple terms match with similar score | No        |

### Intent Errors

| Code                           | Description                          | Retryable |
| ------------------------------ | ------------------------------------ | --------- |
| `ERR_INTENT_FIELD_NOT_FOUND`   | Form field not found for intent      | No        |
| `ERR_INTENT_ACTION_FAILED`     | Intent action could not be completed | Yes       |
| `ERR_INTENT_NAVIGATION_FAILED` | Intent navigation to app failed      | Yes       |
| `ERR_INTENT_VALIDATION_FAILED` | Intent input validation failed       | No        |

### FLP Errors

| Code                        | Description                   | Retryable |
| --------------------------- | ----------------------------- | --------- |
| `ERR_FLP_SHELL_NOT_FOUND`   | FLP shell container not found | Yes       |
| `ERR_FLP_PERMISSION_DENIED` | Insufficient FLP permissions  | No        |
| `ERR_FLP_API_UNAVAILABLE`   | FLP UShell API not available  | Yes       |
| `ERR_FLP_INVALID_USER`      | FLP user context invalid      | No        |
| `ERR_FLP_OPERATION_TIMEOUT` | FLP operation timed out       | Yes       |

## Using Errors in Tests

### Catch and Inspect

```typescript
import { test } from 'playwright-praman';
import { ControlError } from 'playwright-praman';

test('handle control not found', async ({ ui5 }) => {
  try {
    await ui5.control({ id: 'nonExistent' });
  } catch (error) {
    if (error instanceof ControlError) {
      console.log(error.code); // 'ERR_CONTROL_NOT_FOUND'
      console.log(error.retryable); // true
      console.log(error.suggestions); // ['Verify the control ID...', ...]
      console.log(error.toUserMessage()); // Human-readable
      console.log(error.toAIContext()); // Machine-readable for AI agents
    }
  }
});
```

### Error Properties

Every `PramanError` includes:

| Property      | Type        | Description                                             |
| ------------- | ----------- | ------------------------------------------------------- |
| `code`        | `ErrorCode` | Machine-readable code (e.g., `'ERR_CONTROL_NOT_FOUND'`) |
| `message`     | `string`    | Human-readable description                              |
| `attempted`   | `string`    | What operation was attempted                            |
| `retryable`   | `boolean`   | Whether the operation can be retried                    |
| `suggestions` | `string[]`  | 2-4 actionable recovery steps                           |
| `details`     | `Record`    | Additional context (selector, timeout, etc.)            |
| `timestamp`   | `string`    | ISO-8601 timestamp                                      |

### Serialization

```typescript
// For humans
error.toUserMessage();
// "Control not found: #saveBtn. Try: Verify the control ID exists..."

// For logging (JSON)
error.toJSON();
// { code, message, attempted, retryable, suggestions, details, timestamp }

// For AI agents
error.toAIContext();
// Structured context optimized for LLM consumption
```
