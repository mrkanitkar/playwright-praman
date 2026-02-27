---
sidebar_position: 12
title: 'ADR: Fixture Composition with mergeTests'
---

# ADR: Fixture Composition with mergeTests() (ACT-037)

| Property     | Value                                                                    |
| ------------ | ------------------------------------------------------------------------ |
| **Decision** | Use Playwright's `mergeTests()` to compose fixtures into a single export |
| **Status**   | ACCEPTED                                                                 |
| **Date**     | 2025-10-10                                                               |

## Context

Praman provides 14 fixture modules that expose SAP-specific test capabilities:

| Fixture Module    | Provides                                       |
| ----------------- | ---------------------------------------------- |
| `coreTest`        | `pramanConfig`, `logger`, `ui5` (base handler) |
| `moduleTest`      | Extended `ui5` with table, dialog, date, odata |
| `authTest`        | `sapAuth` (authentication)                     |
| `navTest`         | `ui5Navigation`, `btpWorkZone`                 |
| `stabilityTest`   | Auto-wait, request interception                |
| `feTest`          | `fe` (Fiori Elements helpers)                  |
| `aiTest`          | `pramanAI` (AI-assisted testing)               |
| `intentTest`      | `intent` (semantic intent execution)           |
| `shellFooterTest` | Shell footer operations                        |
| `flpLocksTest`    | FLP lock management                            |
| `flpSettingsTest` | FLP settings management                        |
| `testDataTest`    | Test data generation and cleanup               |

These fixtures have interdependencies: `authTest` depends on `coreTest`'s config,
`navTest` depends on `authTest`'s authenticated page, `feTest` depends on `moduleTest`'s
extended UI5 handler. The question is how to compose these into a single `test` object
that consumers import as `import { test } from 'playwright-praman'`.

## Decision

Use Playwright's `mergeTests()` API to compose all fixture modules into a single
unified `test` export:

```typescript
import { mergeTests } from '@playwright/test';

export const test = mergeTests(
  moduleTest, // config, logger, ui5 (extended)
  authTest, // sapAuth
  navTest, // ui5Navigation, btpWorkZone
  stabilityTest, // auto-wait, request interception
  feTest, // fe (Fiori Elements)
  aiTest, // pramanAI
  intentTest, // intent
  shellFooterTest,
  flpLocksTest,
  flpSettingsTest,
  testDataTest,
);
```

Each fixture module is built independently using `test.extend<Fixtures>()` and
can be tested in isolation. The merged `test` object combines all fixture scopes
into a single type-safe interface.

Individual fixture test objects are also re-exported for consumers who need only
a subset of fixtures (e.g., `import { authTest } from 'playwright-praman'`).

## Alternatives Considered

### Single monolithic `test.extend()`

Define all 14 fixture groups in a single `test.extend()` call with all dependencies
inlined. Rejected because it creates a 500+ line file with deeply nested dependency
resolution, makes individual fixture testing impossible, and violates the 300 LOC
module limit.

### Factory functions

Use factory functions that accept dependencies and return fixture definitions:
`createNavFixtures({ auth, config })`. Rejected because it moves dependency wiring
to user-land, requires manual ordering, and loses Playwright's automatic fixture
lifecycle management (setup/teardown ordering).

### Dependency Injection container

Use a DI container (e.g., tsyringe, inversify) to resolve fixture dependencies at
runtime. Rejected because it adds a runtime dependency, conflicts with Playwright's
own fixture DI system, and is overkill for 14 modules with known, static dependencies.

### Playwright's `test.extend()` chaining

Chain `test.extend()` calls: `coreTest.extend(authFixtures).extend(navFixtures)...`.
Rejected because chained extends create a linear dependency chain where every fixture
depends on all previous fixtures, even unrelated ones. `mergeTests()` preserves
independent scopes.

## Consequences

### Positive

- **Official API**: `mergeTests()` is Playwright's recommended approach for composing
  fixtures from multiple modules (introduced in Playwright 1.39)
- **Type-safe**: TypeScript infers the combined fixture type automatically; consumers
  get full autocompletion for all 14 fixture groups
- **Independent testing**: Each fixture module can be unit-tested in isolation by
  importing its individual test object (e.g., `authTest`)
- **Clear dependency graph**: Each fixture module declares its own dependencies via
  `test.extend<Fixtures, WorkerFixtures>()`, making the dependency chain explicit
- **Selective usage**: Consumers who need only authentication can import `authTest`
  instead of the full merged `test`, avoiding unnecessary fixture setup

### Negative

- **Order sensitivity**: The order of arguments to `mergeTests()` matters when fixtures
  share dependency names. A fixture defined later can shadow one defined earlier, leading
  to subtle bugs if ordering changes
- **Sibling references**: Fixtures in one module cannot directly reference fixtures from
  another module at definition time. Cross-module dependencies must flow through
  Playwright's fixture resolution (via `use`)
- **Documentation overhead**: Users must understand which fixtures come from which module,
  especially when debugging fixture setup failures. The merged `test` hides the module
  boundaries
- **Startup cost**: All 14 fixture modules are loaded and initialized even if a test
  only uses `ui5` and `sapAuth`. Unused fixtures still execute their setup/teardown
  (though Playwright skips fixtures not referenced in the test signature)

## References

- [`src/fixtures/index.ts`](https://github.com/nicolo-ribaudo/praman/blob/main/src/fixtures/index.ts) -- fixture assembly
- [Playwright `mergeTests()` docs](https://playwright.dev/docs/test-fixtures#combining-fixtures-from-multiple-modules) -- official API
- [Playwright fixture DI](https://playwright.dev/docs/test-fixtures) -- fixture dependency injection
