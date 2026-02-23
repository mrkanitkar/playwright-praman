---
sidebar_position: 2
title: 'ADR: Dry-Run Capability'
---

# ADR: Dry-Run Capability (P4-013)

| Property     | Value                                                                    |
| ------------ | ------------------------------------------------------------------------ |
| **Decision** | Use option (c) -- test listing via `--list` + action preview via logging |
| **Status**   | DECIDED                                                                  |
| **Date**     | 2026-02-23                                                               |

## Context

Users requested a dry-run capability to preview which tests would execute and what actions
they would perform, without actually running against a live SAP system. This is valuable for
validating test configurations before committing to long-running E2E suites.

Three options were evaluated:

| Option | Approach                                               | Risk | Complexity |
| ------ | ------------------------------------------------------ | ---- | ---------- |
| (a)    | `--dry-run` flag intercepting Playwright runner        | High | High       |
| (b)    | Parallel execution model with mock backend             | High | Very High  |
| (c)    | Test listing via `--list` + action preview via logging | Low  | Low        |

**Option (a)** would require intercepting Playwright's internal test runner to prevent actual
browser actions while still executing test logic. This is brittle because it depends on
Playwright internals that may change across versions, and partially-executed tests can leave
state in an unpredictable condition.

**Option (b)** would spin up a parallel execution environment with a mock SAP backend. While
comprehensive, this introduces significant complexity in maintaining mock fidelity and adds
a new failure surface area unrelated to actual test correctness.

**Option (c)** leverages Playwright's existing `--list` flag to enumerate tests without
execution, combined with structured logging of planned actions during a preview phase. This
requires no Playwright internals and composes naturally with existing CLI workflows.

## Decision

Use option (c) -- test listing via Playwright's built-in `--list` flag combined with
action preview via structured logging.

- **Test listing**: `npx playwright test --list` enumerates all tests that match the current
  configuration, filters, and grep patterns. No browser is launched.
- **Action preview**: When a `PRAMAN_DRY_RUN=true` environment variable is set, fixture
  actions log their intended operations (e.g., "Would navigate to /sap/bc/ui5_ui5/...") via
  pino at `info` level instead of executing them.

## Rationale

- **Low risk**: `--list` is a stable, documented Playwright CLI feature
- **No internal coupling**: Does not depend on Playwright runner internals or test lifecycle hooks
- **Composable**: Integrates with existing CI pipelines (`npx playwright test --list | wc -l`)
- **Incremental**: Action preview via logging can be added per-fixture without framework changes
- **Familiar**: Follows the same pattern as `terraform plan`, `kubectl --dry-run`, and `npm publish --dry-run`

## Consequences

### Positive

- Zero maintenance burden from Playwright version upgrades
- Users get immediate value from `--list` without any Praman-specific code
- Action preview logging doubles as documentation of what each fixture does
- CI pipelines can validate test counts before committing to expensive E2E runs

### Negative

- Action preview is opt-in per fixture -- new fixtures must remember to add logging guards
- `--list` only shows test names, not the SAP-specific actions within each test
- No single unified `--dry-run` command -- users need to understand both mechanisms

### Mitigations

- Document the dry-run workflow in the getting-started guide
- Add a `PRAMAN_DRY_RUN` check helper to the fixture base class so new fixtures inherit preview behavior
