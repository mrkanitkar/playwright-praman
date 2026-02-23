---
sidebar_position: 8
title: 'ADR: Security Audit'
---

# ADR: Security Audit (SEC-AUDIT)

| Property     | Value                                                |
| ------------ | ---------------------------------------------------- |
| **Decision** | Document security posture; all audited controls pass |
| **Status**   | DECIDED                                              |
| **Date**     | 2026-02-23                                           |

## Context

Praman is a test automation library that injects JavaScript into browser contexts, handles
authentication credentials, and interacts with enterprise SAP systems. This combination
demands a rigorous security posture. This ADR documents the security controls in place, known
security-relevant code patterns, and audit results.

## Security Controls

### 1. Dependency Auditing

**Tool**: `npm audit` (built-in) + Snyk (CI integration)

```bash
# Local audit
npm audit --audit-level=moderate

# CI pipeline (Snyk)
npx snyk test --severity-threshold=high
```

Praman maintains zero known high/critical vulnerabilities in production dependencies. Dev
dependencies are audited but not gated (e.g., a vulnerability in a build tool does not ship
to users).

**SBOM generation** uses CycloneDX format for supply chain transparency:

```bash
npx @cyclonedx/cyclonedx-npm --output-file sbom.json
```

The SBOM is generated in CI and attached as a release artifact. Consumers can feed it into
their own vulnerability scanners (SAP Cloud ALM, Mend, Black Duck).

### 2. Static Analysis (ESLint Security Plugins)

Two security-focused ESLint plugins run on every lint pass with zero-tolerance policy:

| Plugin                         | Focus                                                        |
| ------------------------------ | ------------------------------------------------------------ |
| `eslint-plugin-security`       | Detects unsafe RegExp, non-literal require, object injection |
| `@microsoft/eslint-plugin-sdl` | Microsoft SDL rules: no unsafe innerHTML, eval guards        |

Both plugins are configured in `eslint.config.mjs` and enforced at error level. The CI
pipeline fails on any security rule violation.

```typescript
// eslint.config.mjs (excerpt)
import security from 'eslint-plugin-security';
import sdl from '@microsoft/eslint-plugin-sdl';

export default [
  security.configs.recommended,
  ...sdl.configs.recommended,
  // ... other configs
];
```

### 3. Secret Redaction (pino)

Praman uses pino for structured logging with automatic secret redaction. The redaction
configuration strips sensitive values from all log output:

```typescript
// src/core/logging/redaction.ts
export const REDACTION_PATHS: readonly string[] = [
  '*.password',
  '*.token',
  '*.apiKey',
  '*.secret',
  '*.authorization',
  '*.cookie',
  // ... 10+ redaction paths
];
```

This prevents accidental credential leakage in CI logs, Playwright trace files, and custom
reporter output. The redaction operates at the serialization layer -- even if application code
passes a full credentials object to the logger, sensitive fields are replaced with `[REDACTED]`
before they reach any output transport.

### 4. No `console.log`

The codebase enforces `no-console` via ESLint. All logging goes through the pino logger,
which applies redaction. This eliminates the risk of `console.log(credentials)` slipping
through code review.

### 5. TypeScript Strict Mode

TypeScript's `strict: true` with additional strict flags (`noUncheckedIndexedAccess`,
`exactOptionalPropertyTypes`, `verbatimModuleSyntax`) prevents common vulnerability classes:

- No implicit `any` that could mask type-confusion bugs
- No unchecked property access that could lead to prototype pollution
- Strict null checks prevent null-pointer dereferences

## Documented Security-Relevant Patterns

### `new Function()` in Bridge Injection

Praman uses `new Function()` in 10 locations across the bridge layer to construct executable
functions from script template strings. This pattern is flagged by `eslint-plugin-security`
as `security/detect-eval-like` and is explicitly suppressed with inline comments.

**Why `new Function()` is used**:

The bridge layer generates JavaScript that runs inside `page.evaluate()`. These scripts must
be self-contained string functions (closures, imports, and module-level references are not
available in the serialized context). `new Function()` constructs these from template strings
with named parameters.

```typescript
// Example from src/bridge/browser-scripts/find-control.ts
// eslint-disable-next-line security/detect-eval-like -- bridge script construction
const findFn = new Function('selector', scriptBody);
const result = await page.evaluate(findFn, selector);
```

**Why this is acceptable**:

1. The script bodies are **compile-time constants** -- they are string literals in source code,
   not user-provided input
2. The constructed functions execute inside `page.evaluate()`, which runs in the browser
   context (isolated from the Node.js test runner)
3. No user input ever flows into the `new Function()` body -- parameters are passed via
   `page.evaluate(fn, args)` serialization, not string interpolation
4. Each usage is individually reviewed and annotated with an eslint-disable comment explaining
   the justification

### Authentication Credential Handling

Praman's auth fixtures accept credentials via:

1. **Environment variables** (`SAP_USER`, `SAP_PASSWORD`) -- recommended for CI
2. **Config file** (`praman.config.ts`) -- for local development (gitignored)
3. **Playwright project `use` config** -- per-project credentials

Credentials are:

- Never logged (pino redaction covers `*.password`, `*.token`, `*.authorization`)
- Never stored in Playwright trace files (custom serialization excludes credential fields)
- Never included in reporter output (ComplianceReporter and ODataTraceReporter strip auth headers)

## Audit Results

| Check                       | Tool                           | Result | Notes                                              |
| --------------------------- | ------------------------------ | ------ | -------------------------------------------------- |
| Dependency vulnerabilities  | `npm audit`                    | Pass   | 0 high/critical in production deps                 |
| Dependency vulnerabilities  | Snyk                           | Pass   | 0 high/critical                                    |
| Static security analysis    | `eslint-plugin-security`       | Pass   | 10 intentional suppression comments (new Function) |
| SDL compliance              | `@microsoft/eslint-plugin-sdl` | Pass   | 0 violations                                       |
| Secret redaction            | pino redaction config          | Pass   | 10+ redaction paths configured                     |
| SBOM generation             | CycloneDX                      | Pass   | JSON SBOM generated per release                    |
| TypeScript strict mode      | `tsc --noEmit`                 | Pass   | All strict flags enabled                           |
| No console.log              | ESLint `no-console`            | Pass   | 0 violations                                       |
| `new Function()` documented | Code review                    | Pass   | All 10 usages annotated                            |
| Credential handling         | Code review                    | Pass   | No credential leakage paths identified             |

## Consequences

### Positive

- Security posture is documented and auditable
- Multiple defense layers (static analysis, runtime redaction, type safety) provide defense in depth
- SBOM enables downstream consumers to run their own vulnerability scans
- All `new Function()` usages are individually justified and annotated

### Negative

- `eslint-disable` comments for `security/detect-eval-like` may concern auditors unfamiliar
  with the bridge injection pattern -- each comment includes a justification
- SBOM generation adds a CI step (~10s overhead)

### Mitigations

- This ADR serves as the security reference document for auditors
- Each `eslint-disable` comment includes a `--` justification explaining why the suppression
  is safe
- The SBOM is attached to GitHub releases for easy access by security teams
