---
title: Playwright Compatibility
description: Supported Playwright and TypeScript versions for playwright-praman with CI-tested compatibility matrix.
keywords:
  - playwright version compatibility
  - playwright-praman supported versions
  - playwright version matrix
  - typescript 7 playwright
  - typescript 6 playwright
---

# Playwright Compatibility

Praman declares `@playwright/test` as a peer dependency with the range `>=1.57.0 <2.0.0`.
This page documents which versions are actively tested and recommended.

## Playwright Version Matrix

| Playwright Version | Status        | CI-Tested | Notes                                           |
| ------------------ | ------------- | --------- | ----------------------------------------------- |
| 1.57.x             | Supported     | Yes       | Minimum supported version                       |
| 1.58.x             | Supported     | No        | Compatible, between the tested floor and top    |
| 1.59.x             | Supported     | No        | Screencast, CLI agents, `ariaSnapshotDepth`     |
| 1.60.x             | Supported     | No        | ARIA snapshots, highlight styles, `test.abort`  |
| 1.61.x             | Supported     | No        | Web Storage API, soft poll, video retain modes  |
| 1.62.x             | Supported     | No        | `locator.waitForFunction`, WebP, `AbortSignal`  |
| 1.63.x             | Recommended   | Yes       | Test locks, subtree `frameLocator`, step params |
| 2.x                | Not supported | No        | Breaking API changes expected                   |

Two jobs bound this range on every CI run: `Playwright Floor (1.57.0)` pins the
declared minimum, and `Playwright Ceiling (latest)` installs
`@playwright/test@latest`. The ceiling job also **fails when Playwright
publishes a minor Praman has not yet catalogued**, so this table cannot quietly
fall behind the code again. Versions between the floor and the ceiling are
supported via feature detection but are not individually exercised — only
1.57.0 and `latest` are, plus 1.57.0 and 1.63.0 in the integration matrix.

## TypeScript Version Matrix

| TypeScript Version | Status      | CI-Tested | Notes                                  |
| ------------------ | ----------- | --------- | -------------------------------------- |
| 5.5 – 5.9          | Supported   | No        | Compatible, not actively tested        |
| 6.x                | Supported   | Yes       | Published types compiled with TS 6.0.3 |
| 7.x                | Recommended | Yes       | Full inference, strict mode validated  |

## Tech Stack

| Component     | Version                      |
| ------------- | ---------------------------- |
| Playwright    | 1.63.0 (peer: >=1.57.0)      |
| TypeScript    | 6.0.3 (supports 7.x)         |
| Node.js       | >=22                         |
| ESLint        | 10.4.0 (11 plugins)          |
| Zod           | 4.4.3                        |
| Pino          | 10.3.1                       |
| Build         | tsup 8.5.1 (ESM + CJS)       |
| Test Runner   | Vitest 4.1.7                 |
| AI SDKs       | Anthropic 0.98.0, OpenAI 6.x |
| OpenTelemetry | SDK 0.218.0 (optional)       |

## Minimum Version Enforcement

At startup, Praman calls `assertMinVersion('1.57.0')` from the internal
compatibility layer. If an older version is detected, a clear error is thrown
before any tests execute.

## Feature Detection

Praman uses runtime feature detection (not version checks) to enable
capabilities introduced in newer Playwright releases:

| Feature                      | Required Version | Detection Key               |
| ---------------------------- | ---------------- | --------------------------- |
| Clock API                    | 1.45+            | `hasClockAPI`               |
| ARIA snapshots               | 1.49+            | `hasAriaSnapshot`           |
| Screencast API               | 1.59+            | `hasScreencastAPI`          |
| ARIA snapshot depth          | 1.59+            | `hasAriaSnapshotDepth`      |
| Set storage state            | 1.59+            | `hasSetStorageState`        |
| Locator normalize            | 1.59+            | `hasLocatorNormalize`       |
| URL pattern matcher          | 1.59+            | `hasURLPatternMatcher`      |
| Test abort                   | 1.60+            | `hasTestAbort`              |
| `getByRole({ description })` | 1.60+            | `hasGetByRoleDescription`   |
| Page ARIA snapshot           | 1.60+            | `hasPageAriaSnapshot`       |
| ARIA snapshot boxes          | 1.60+            | `hasAriaSnapshotBoxes`      |
| Tracing HAR                  | 1.60+            | `hasTracingHAR`             |
| Locator drop                 | 1.60+            | `hasLocatorDrop`            |
| Locator highlight style      | 1.60+            | `hasLocatorHighlightStyle`  |
| Browser context event        | 1.60+            | `hasBrowserContextEvent`    |
| WebAuthn credentials         | 1.61+            | `hasWebAuthnCredentials`    |
| Web Storage API              | 1.61+            | `hasWebStorageAPI`          |
| Soft poll                    | 1.61+            | `hasSoftPoll`               |
| Screencast timestamp         | 1.61+            | `hasScreencastTimestamp`    |
| Video retain modes           | 1.61+            | `hasVideoRetainModes`       |
| `locator.waitForFunction()`  | 1.62+            | `hasLocatorWaitForFunction` |
| WebP screenshots             | 1.62+            | `hasWebPScreenshots`        |
| `retryStrategy: 'isolated'`  | 1.62+            | `hasRetryStrategyIsolated`  |
| `AbortSignal` support        | 1.62+            | `hasAbortSignal`            |
| Test locks                   | 1.63+            | `hasTestLocks`              |
| Subtree `frameLocator()`     | 1.63+            | `hasSubtreeFrameLocator`    |
| `locator.visible()`          | 1.63+            | `hasVisibleLocator`         |
| Step `params` / `subtitle`   | 1.63+            | `hasStepParams`             |
| `ariaSnapshotJSON()`         | 1.63+            | `hasAriaSnapshotJSON`       |
| `dialogclosed` event         | 1.63+            | `hasDialogClosedEvent`      |
| OPFS in storage state        | 1.63+            | `hasOpfsStorageState`       |

Praman's behaviour when a feature is unavailable depends on whether the floor
has an equivalent — the policy is stated once in
`src/core/compat/playwright-compat.ts` and applies to every flag above:

- **An equivalent exists** → degrade transparently and log at `debug` which
  path was taken. `locator.waitForFunction` is the reference case: a
  page-scoped `page.waitForFunction` expresses the same predicate.
- **No equivalent on the floor** → throw `ERR_COMPAT_FEATURE_UNAVAILABLE`,
  naming the required version. The Web Storage API is the reference case:
  there is no older `page.localStorage`, so degrading would silently give
  wrong results instead of an actionable error.

A special case worth knowing: `hasConsoleMessageFilter` guards an _option_,
not a method. `page.consoleMessages()` exists at the 1.57 floor but takes no
arguments, and JavaScript ignores surplus arguments — so passing `{ filter }`
on an older runtime returns every message while the caller believes it was
filtered. Always guard the option, not the call.

## How to Upgrade Playwright

```bash
npm install --save-dev @playwright/test@latest
npx playwright install
```

After upgrading, run your test suite to verify compatibility:

```bash
npx playwright test --reporter=list
```

## Reporting Issues

If you encounter a compatibility issue with a specific Playwright version,
please open a GitHub issue with:

- The exact Playwright version (`npx playwright --version`)
- The Praman version (`npm ls playwright-praman`)
- The error message or unexpected behavior
