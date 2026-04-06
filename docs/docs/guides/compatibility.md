---
title: Playwright Compatibility
description: Supported Playwright versions for playwright-praman with CI-tested compatibility matrix.
keywords:
  - playwright version compatibility
  - playwright-praman supported versions
  - playwright version matrix
---

# Playwright Compatibility

Praman declares `@playwright/test` as a peer dependency with the range `>=1.57.0 <2.0.0`.
This page documents which versions are actively tested and recommended.

## Version Matrix

| Playwright Version | Status        | CI-Tested | Notes                         |
| ------------------ | ------------- | --------- | ----------------------------- |
| 1.57.x             | Supported     | Yes       | Minimum supported version     |
| 1.58.x             | Supported     | Yes       |                               |
| 1.59.x             | Recommended   | Yes       | CLI agents support added      |
| 2.x                | Not supported | No        | Breaking API changes expected |

Praman is tested on every CI run against the Playwright version pinned in
`package.json` devDependencies. The matrix above is updated with each release.

## Minimum Version Enforcement

At startup, Praman calls `assertMinVersion('1.57.0')` from the internal
compatibility layer. If an older version is detected, a clear error is thrown
before any tests execute.

## Feature Detection

Praman uses runtime feature detection (not version checks) to enable
capabilities introduced in newer Playwright releases:

| Feature        | Required Version | Detection Key     |
| -------------- | ---------------- | ----------------- |
| Clock API      | 1.57+            | `hasClockAPI`     |
| ARIA snapshots | 1.57+            | `hasAriaSnapshot` |

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
