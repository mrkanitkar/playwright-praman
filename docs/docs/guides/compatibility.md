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

| Playwright Version | Status        | CI-Tested | Notes                                          |
| ------------------ | ------------- | --------- | ---------------------------------------------- |
| 1.57.x             | Supported     | Yes       | Minimum supported version                      |
| 1.58.x             | Supported     | Yes       |                                                |
| 1.59.x             | Supported     | Yes       | Screencast, CLI agents, `ariaSnapshotDepth`    |
| 1.60.x             | Recommended   | Yes       | ARIA snapshots, highlight styles, `test.abort` |
| 2.x                | Not supported | No        | Breaking API changes expected                  |

Praman is tested on every CI run against the Playwright version pinned in
`package.json` devDependencies. The matrix above is updated with each release.

## TypeScript Version Matrix

| TypeScript Version | Status      | CI-Tested | Notes                                  |
| ------------------ | ----------- | --------- | -------------------------------------- |
| 5.5 – 5.9          | Supported   | No        | Compatible, not actively tested        |
| 6.x                | Supported   | Yes       | Published types compiled with TS 6.0.3 |
| 7.x                | Recommended | Yes       | Full inference, strict mode validated  |

## Tech Stack

| Component     | Version                      |
| ------------- | ---------------------------- |
| Playwright    | 1.60.0 (peer: >=1.57.0)      |
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

| Feature                      | Required Version | Detection Key              |
| ---------------------------- | ---------------- | -------------------------- |
| Clock API                    | 1.45+            | `hasClockAPI`              |
| ARIA snapshots               | 1.49+            | `hasAriaSnapshot`          |
| Screencast API               | 1.59+            | `hasScreencastAPI`         |
| ARIA snapshot depth          | 1.59+            | `hasAriaSnapshotDepth`     |
| Set storage state            | 1.59+            | `hasSetStorageState`       |
| Locator normalize            | 1.59+            | `hasLocatorNormalize`      |
| URL pattern matcher          | 1.59+            | `hasURLPatternMatcher`     |
| Test abort                   | 1.60+            | `hasTestAbort`             |
| `getByRole({ description })` | 1.60+            | `hasGetByRoleDescription`  |
| Page ARIA snapshot           | 1.60+            | `hasPageAriaSnapshot`      |
| ARIA snapshot boxes          | 1.60+            | `hasAriaSnapshotBoxes`     |
| Tracing HAR                  | 1.60+            | `hasTracingHAR`            |
| Locator drop                 | 1.60+            | `hasLocatorDrop`           |
| Locator highlight style      | 1.60+            | `hasLocatorHighlightStyle` |
| Browser context event        | 1.60+            | `hasBrowserContextEvent`   |

If a feature is unavailable, Praman degrades gracefully rather than failing.

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
