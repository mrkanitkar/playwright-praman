---
sidebar_position: 3
title: 'ADR: Circuit Breaker Pattern'
---

# ADR: Circuit Breaker Pattern (P4-016)

| Property     | Value                                                                                             |
| ------------ | ------------------------------------------------------------------------------------------------- |
| **Decision** | Do NOT implement circuit breaker -- Playwright's built-in retries and test timeout are sufficient |
| **Status**   | DECIDED                                                                                           |
| **Date**     | 2026-02-23                                                                                        |

## Context

The circuit breaker pattern (popularized by Michael Nygard's "Release It!") prevents cascading
failures by tracking error rates and short-circuiting requests when a failure threshold is
exceeded. The question is whether Praman should implement a circuit breaker around SAP system
interactions (OData calls, UI5 bridge commands, authentication requests).

In a typical microservices architecture, circuit breakers protect service-to-service calls where:

1. The caller makes many concurrent requests to the same downstream service
2. A failing downstream can consume caller resources (threads, connections)
3. The caller has alternative paths or degraded-mode responses

Playwright test execution differs fundamentally from this model:

1. Tests run sequentially within a worker (one browser context per worker)
2. Each test has an independent timeout (`test.setTimeout()`) that kills hung operations
3. Playwright's `retries` configuration already retries failed tests from scratch
4. There is no "degraded mode" -- a test either passes or fails
5. Test isolation means one test's failure does not consume resources needed by another

## Decision

Do NOT implement a circuit breaker pattern. Playwright's built-in retry mechanism and
per-test timeout provide equivalent protection against the failure modes that circuit
breakers address.

## Rationale

### Playwright retries already handle transient failures

```typescript
// playwright.config.ts
export default defineConfig({
  retries: 2, // Retry failed tests up to 2 times
  timeout: 60_000, // Kill any test after 60 seconds
  expect: { timeout: 10_000 }, // Assertion timeout
});
```

Each retry creates a fresh browser context, which is more thorough than a circuit breaker's
"wait and retry" approach -- it eliminates any corrupted browser state.

### Test timeout handles hung SAP systems

If the SAP system becomes unresponsive, Playwright's test timeout fires after the configured
duration, failing the test cleanly. This is functionally equivalent to a circuit breaker's
"open" state, but without the complexity of tracking error rates and state transitions.

### No shared resource pool to protect

Circuit breakers protect shared connection pools and thread pools. In Playwright, each worker
has its own browser instance and each test gets its own context. There is no shared resource
that a failing SAP system could exhaust.

### Additional complexity is not justified

A circuit breaker would require:

- Error rate tracking across tests within a worker
- State machine (closed/open/half-open) with configurable thresholds
- Timer-based transition from open to half-open
- Configuration surface (failure threshold, timeout duration, half-open probe count)

This adds cognitive overhead for test authors and debugging complexity for failures, with
no measurable benefit over Playwright's existing mechanisms.

## Consequences

### Positive

- No additional configuration surface for users to learn or misconfigure
- Failure behavior is entirely governed by Playwright's well-documented retry and timeout settings
- Simpler debugging -- test failures map directly to Playwright's retry traces
- No risk of circuit breaker masking real SAP system issues (e.g., incorrectly staying "open")

### Negative

- If a SAP system is completely down, all tests in a suite will individually timeout rather
  than failing fast after a threshold. This means a full suite run against a dead system takes
  `N tests * timeout` instead of failing early.

### Mitigations

- Document the recommended `globalTimeout` setting for CI pipelines to cap total suite duration
- Praman's health-check fixture can be used as a setup project to fail fast before the main suite
- Users can configure Playwright's `maxFailures` to stop the suite after N failures:
  ```typescript
  // playwright.config.ts
  export default defineConfig({
    maxFailures: 5, // Stop after 5 test failures
  });
  ```
