---
sidebar_position: 6
title: 'ADR: Registry Discovery Strategy'
---

# ADR: Registry Discovery Strategy (REG-EVAL)

| Property     | Value                                                                                                                    |
| ------------ | ------------------------------------------------------------------------------------------------------------------------ |
| **Decision** | Keep registry strategy as-is in `discovery-factory.ts` -- `sap.ui.core.Element.registry` offers no significant advantage |
| **Status**   | DECIDED                                                                                                                  |
| **Date**     | 2026-02-23                                                                                                               |

## Context

Praman's control discovery mechanism locates UI5 controls in the browser by evaluating
JavaScript in the page context. The current implementation in `discovery-factory.ts` uses
the established `sap.ui.getCore().byId()` approach to find controls by their ID.

SAP UI5 1.67+ introduced `sap.ui.core.Element.registry` as a newer API surface for accessing
the same underlying element registry. The evaluation question is whether migrating to
`Element.registry` would provide advantages in reliability, performance, or API stability.

### API Comparison

| Aspect              | `sap.ui.getCore().byId(id)`                | `sap.ui.core.Element.registry`          |
| ------------------- | ------------------------------------------ | --------------------------------------- |
| Available since     | UI5 1.0                                    | UI5 1.67                                |
| Underlying store    | Internal element registry (Map)            | Same internal element registry (Map)    |
| Lookup by ID        | `byId(id)` returns Element or undefined    | `get(id)` returns Element or undefined  |
| Enumerate all       | Not directly (requires `byFieldGroupId`)   | `forEach(callback)`, `filter(callback)` |
| Deprecation status  | `sap.ui.getCore()` deprecated in UI5 1.118 | Current, not deprecated                 |
| Minimum UI5 version | Any                                        | 1.67+                                   |

### Key Finding

Both APIs access the **same underlying internal registry**. The `Element.registry` API is a
modern facade over the same data structure. There is no performance difference, no data
difference, and no reliability difference between the two.

## Decision

Keep the current registry strategy in `discovery-factory.ts` using `sap.ui.getCore().byId()`.
The `sap.ui.core.Element.registry` API does not provide a significant advantage that justifies
the migration effort.

However, acknowledge that `sap.ui.getCore()` is deprecated as of UI5 1.118. The discovery
factory should be prepared for a future migration when Praman drops support for UI5 versions
below 1.67.

## Rationale

- **Same underlying registry**: Both APIs read from and write to the same internal Map. Switching
  APIs does not change behavior, performance, or reliability.
- **Broader compatibility**: `sap.ui.getCore().byId()` works with all UI5 versions. The registry
  API requires UI5 1.67+. While 1.67 is old (released 2019), some enterprise SAP systems run
  even older versions.
- **Discovery factory abstracts the API**: The factory pattern in `discovery-factory.ts` already
  isolates the registry access behind an abstraction. Swapping the implementation later is a
  one-line change, not a refactor.
- **No enumeration need**: Praman's primary discovery pattern is lookup-by-ID and
  lookup-by-type-and-properties, not enumeration. The `forEach`/`filter` methods on
  `Element.registry` are not needed for current use cases.
- **Deprecation is not removal**: `sap.ui.getCore()` is deprecated in UI5 1.118 but still
  functional. SAP maintains backward compatibility for deprecated APIs across many versions.

## Consequences

### Positive

- No migration effort required -- no code changes, no test updates, no risk of regressions
- Maintains compatibility with the broadest range of UI5 versions
- Discovery factory abstraction already provides the right seam for future migration
- Development time saved can be invested in higher-value features

### Negative

- Static analysis tools (UI5 linter) may flag `sap.ui.getCore()` usage as deprecated when
  targeting UI5 1.118+
- If SAP removes `sap.ui.getCore()` in a future major version, migration will become mandatory

### Mitigations

- Add a TODO comment in `discovery-factory.ts` referencing this ADR for the future migration path
- When Praman's minimum supported UI5 version reaches 1.67, revisit this decision
- The migration path is well-defined: replace `sap.ui.getCore().byId(id)` with
  `sap.ui.require('sap/ui/core/Element').registry.get(id)` inside the factory function
- Track SAP's UI5 deprecation timeline in the project's compatibility matrix
