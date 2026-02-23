---
sidebar_position: 4
title: 'ADR: Graceful Shutdown'
---

# ADR: Graceful Shutdown (P4-018)

| Property     | Value                                                                             |
| ------------ | --------------------------------------------------------------------------------- |
| **Decision** | Do NOT implement explicit signal handlers -- Playwright handles shutdown natively |
| **Status**   | DECIDED                                                                           |
| **Date**     | 2026-02-23                                                                        |

## Context

The question is whether Praman should register explicit `SIGINT` and `SIGTERM` signal handlers
to perform cleanup operations (closing browser contexts, logging out of SAP sessions, flushing
trace data) when a test run is interrupted.

Graceful shutdown handlers are standard practice in long-running server processes where:

1. The process owns resources that must be released (database connections, file locks)
2. In-flight work must be completed or rolled back (transaction commits, queue acknowledgments)
3. The process lifecycle is managed externally (systemd, Kubernetes, Docker)

Playwright test runners have a fundamentally different lifecycle model:

1. Playwright already registers its own signal handlers for `SIGINT` and `SIGTERM`
2. On receiving a signal, Playwright cancels running tests and invokes fixture teardown
3. Fixture teardown (`use()` cleanup) is the designated place for resource cleanup
4. Browser processes are child processes of the Playwright runner, killed on parent exit

## Decision

Do NOT implement explicit `SIGINT`/`SIGTERM` signal handlers. Playwright's native shutdown
sequence correctly invokes fixture teardown, which is where all Praman cleanup logic belongs.

## Rationale

### Playwright's shutdown sequence is well-defined

When Playwright receives `SIGINT` (Ctrl+C) or `SIGTERM`:

1. It stops scheduling new tests
2. It waits for currently running tests to reach their next `await` point
3. It invokes fixture teardown functions in reverse order
4. It closes all browser contexts and browser instances
5. It writes the test report

This sequence guarantees that Praman fixtures' cleanup code runs, provided cleanup is
implemented in the `use()` callback pattern:

```typescript
export const sapSession = test.extend<{ sapSession: SapSession }>({
  sapSession: async ({ page }, use) => {
    const session = await SapSession.create(page);
    await use(session); // Test runs here
    await session.logout(); // Cleanup runs on shutdown
    await session.flushTraces(); // Also runs on shutdown
  },
});
```

### Custom signal handlers would conflict with Playwright

Node.js signal handlers are additive -- multiple handlers can be registered for the same
signal. However, Playwright's handler calls `process.exit()` after its cleanup sequence.
A Praman handler registered before Playwright's would race with it; one registered after
would never execute because `process.exit()` does not trigger subsequent handlers.

The only reliable pattern would be to wrap Playwright's handler, which requires accessing
Playwright internals -- exactly the kind of coupling Praman avoids (see ADR: Dry-Run Capability).

### Fixture teardown is the correct abstraction

Praman's architecture uses Playwright fixtures for all resource lifecycle management. Adding
a parallel signal-handler-based cleanup path would create two code paths for the same logic,
violating the single responsibility principle and creating subtle bugs when the two paths
diverge.

## Consequences

### Positive

- No signal handler registration code to maintain or test
- No risk of handler ordering bugs between Praman and Playwright
- Single cleanup code path (fixture teardown) -- easier to reason about and debug
- Works correctly across platforms (SIGINT/SIGTERM behavior differs on Windows)

### Negative

- If a user's SAP system requires explicit logout on session termination, a hard kill
  (`kill -9` / `SIGKILL`) will skip fixture teardown, leaving the session active on the
  SAP server until it times out.
- Praman cannot perform cleanup outside of Playwright's test lifecycle (e.g., in a
  standalone script context).

### Mitigations

- Document that `SIGKILL` bypasses all cleanup -- this is true for any Node.js process
- SAP sessions have server-side timeouts (typically 30 minutes) that handle abandoned sessions
- For standalone scripts (outside Playwright), users can call cleanup methods explicitly
- Document the fixture teardown pattern as the canonical way to add cleanup logic
