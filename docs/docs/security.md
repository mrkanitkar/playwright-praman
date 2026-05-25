---
sidebar_label: 'Security Policy'
sidebar_position: 101
title: Security Policy
---

# Security Policy

## Reporting a Vulnerability

Please do NOT report security vulnerabilities through public GitHub issues.

Instead, email `security@zestest.in` with:

- Description of the vulnerability
- Steps to reproduce
- Impact assessment

## Supported Versions

| Version | Supported |
| ------- | --------- |
| 1.x     | Yes       |

## Security Model

### Browser-Context Code Execution

The `exec()` method on typed control proxies (`src/proxy/control-proxy.ts`) uses
`new Function()` to deserialize user-provided arrow functions inside Playwright's
`page.evaluate()` browser context. This is a deliberate architectural choice -- not
a vulnerability -- for the following reasons:

- **Input source**: The function body comes from `fn.toString()` on a function the
  test author wrote in their own test file. No external or untrusted input flows
  into this code path.
- **Execution sandbox**: The deserialized function runs inside Chromium's isolated
  page context (via Playwright's `page.evaluate()`), not in the Node.js process.
  It has no access to the filesystem, environment variables, or Node.js APIs.
- **No escalation path**: Even if a malicious function were injected, it could only
  interact with the browser DOM and the SAP UI5 framework -- the same access a
  Playwright test already has via `page.evaluate()`.

The relevant ESLint rules (`no-new-func`, `@typescript-eslint/no-implied-eval`,
`sonarjs/code-eval`) are suppressed with an inline justification comment at the
call site.

### Browser-Side Console Statements

A small number of `console.warn` and `console.error` calls exist in bridge
injection scripts (`src/bridge/injection.ts`, `src/bridge/browser-scripts/inject-ui5.ts`)
and the OPA5 interaction strategy (`src/bridge/interaction-strategies/opa5-strategy.ts`).
These run exclusively in the **browser context** (inside `page.evaluate()` or
`addInitScript()` template strings), not in the Node.js process. They surface
diagnostics in the browser DevTools console for debugging UI5 framework issues.

## Data Handling

### Log Redaction

All structured logging uses [pino](https://github.com/pinojs/pino) with automatic
field redaction enabled. The following paths are redacted (replaced with `[Redacted]`):

- `*.password`
- `*.secret`
- `*.credentials`
- `auth.password`

No plaintext credentials are ever written to log output, test reports, or error
messages. Error objects include `details` and `suggestions` fields but never
propagate raw authentication data.

### Environment Variables

SAP credentials are loaded from environment variables (`.env` files) at runtime.
The `.env` file is excluded from version control (`.gitignore`) and from the
published npm package (`files` field + `.npmignore`).

## Dependency Security

| Measure            | Implementation                                                                                                |
| ------------------ | ------------------------------------------------------------------------------------------------------------- |
| npm audit          | `audit: true` in `.npmrc`; `npm audit --audit-level=high` in CI                                               |
| SBOM               | CycloneDX 1.5 format (`npm run generate:sbom`)                                                                |
| npm provenance     | `npm publish --provenance` in release workflow                                                                |
| GitHub Actions     | All actions SHA-pinned (not tag-referenced)                                                                   |
| ESLint security    | 3 security-focused plugins: `eslint-plugin-security`, `@microsoft/eslint-plugin-sdl`, `eslint-plugin-sonarjs` |
| Dependency count   | 5 production dependencies (`commander`, `css-selector-parser`, `fontoxpath`, `pino`, `zod`); 4 optional       |
| License compliance | `license-report.json` generated; all deps MIT or Apache-2.0 compatible                                        |
