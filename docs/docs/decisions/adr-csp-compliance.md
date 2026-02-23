---
sidebar_position: 7
title: 'ADR: CSP Compliance'
---

# ADR: CSP Compliance (CSP-ASSESS)

| Property     | Value                                                             |
| ------------ | ----------------------------------------------------------------- |
| **Decision** | Document CSP implications; do NOT implement nonce-based injection |
| **Status**   | DECIDED                                                           |
| **Date**     | 2026-02-23                                                        |

## Context

Content Security Policy (CSP) is a browser security mechanism that restricts the sources from
which scripts, styles, and other resources can load. SAP systems frequently deploy CSP headers
to prevent cross-site scripting (XSS) attacks, particularly in production and pre-production
landscapes. A strict CSP configuration might include:

```http
Content-Security-Policy: script-src 'self' 'nonce-abc123'; object-src 'none';
```

Praman's bridge layer injects JavaScript into the SAP UI5 page via `page.evaluate()` to
interact with the UI5 runtime (`sap.ui.getCore()`, control discovery, method execution). This
raises the question: does CSP block Praman's injected scripts?

### How `page.evaluate()` works

Playwright's `page.evaluate()` does **not** inject a `<script>` tag into the DOM. Instead, it
uses the Chrome DevTools Protocol (CDP) / browser automation protocol to execute JavaScript
directly in the page's V8 execution context. This mechanism:

1. Bypasses the DOM entirely -- no `<script>` element is created
2. Executes in the page's main world (same context as the page's own scripts)
3. Is **exempt from CSP restrictions** by design -- CSP governs document-level resource loading,
   not debugger-protocol-level code injection
4. Works identically regardless of `script-src`, `nonce`, or `strict-dynamic` directives

This is not a loophole -- it is how browser DevTools and automation protocols are designed.
The W3C WebDriver specification and CDP intentionally operate outside the CSP sandbox because
they represent a privileged automation context, not an untrusted content source.

### `new Function()` usage

Praman also uses `new Function()` to construct executable functions from script strings (for
bridge injection and proxy method forwarding). These `new Function()` calls happen in two
contexts:

1. **Node.js side** (test runner process): CSP does not apply. Node.js has no CSP mechanism.
2. **Browser side** (inside `page.evaluate()`): The function is already executing in the
   privileged CDP context, so CSP `script-src` restrictions do not block `new Function()`.

Across 17 bridge files, Praman makes 45 `page.evaluate()` calls and uses `new Function()` in
10 locations. None are affected by page-level CSP headers.

## Decision

Document CSP implications thoroughly. Do NOT implement nonce-based injection or any CSP
workaround. Playwright's automation protocol is intentionally exempt from CSP.

## Rationale

### Nonce injection is unnecessary

A nonce-based approach would require:

1. Reading the CSP `nonce` from the server response headers
2. Injecting `<script nonce="...">` tags instead of using `page.evaluate()`
3. Handling nonce rotation on subsequent navigations
4. Managing race conditions between CSP header parsing and script injection

This adds significant complexity for zero benefit, since `page.evaluate()` already works
through CSP without any workaround.

### All major test frameworks share this design

| Framework   | Injection Method             | CSP Exempt                |
| ----------- | ---------------------------- | ------------------------- |
| Playwright  | CDP `Runtime.evaluate`       | Yes                       |
| Cypress     | Proxied page context         | Yes (removes CSP headers) |
| WebDriverIO | WebDriver `executeScript`    | Yes                       |
| wdi5        | `page.evaluate()` (via wdio) | Yes                       |
| Selenium    | WebDriver `executeScript`    | Yes                       |

Praman does not need to deviate from the industry standard approach.

### SAP-specific CSP considerations

SAP Cloud Platform and SAP BTP deploy CSP headers on Fiori Launchpad and Fiori Elements apps.
Testing confirms that `page.evaluate()` works without modification on:

- SAP Fiori Launchpad with strict CSP (`script-src 'self' 'nonce-...'`)
- SAP BTP apps with `Content-Security-Policy-Report-Only` headers
- S/4HANA Cloud with default CSP configuration

## Future Consideration: `respectCSP` Config Placeholder

If a future Playwright version or browser change alters the CDP/CSP relationship (unlikely
given the W3C spec), Praman reserves a configuration placeholder:

```typescript
// praman.config.ts — hypothetical future option
const config: PramanConfig = {
  bridge: {
    // Reserved for future use. Currently has no effect because
    // page.evaluate() is inherently CSP-exempt.
    respectCSP: false,
  },
};
```

This option is **not implemented today**. It exists only as a documented placeholder so that
if CSP behavior changes in the future, the config surface already has a natural home for the
setting without a breaking change.

## Consequences

### Positive

- No CSP-related configuration burden for users
- Bridge injection works identically across all SAP landscapes regardless of CSP policy
- No dependency on server-side nonce values or CSP header parsing
- Simpler, more reliable bridge implementation

### Negative

- Users may initially worry that strict CSP will block Praman -- documentation must address
  this proactively
- If a future browser or protocol change breaks the CDP CSP exemption, a migration would be
  required (extremely unlikely given the W3C WebDriver specification)

### Mitigations

- This ADR serves as the authoritative reference for CSP questions
- The getting-started guide links here when discussing SAP system prerequisites
- The `respectCSP` placeholder ensures forward compatibility without breaking changes
