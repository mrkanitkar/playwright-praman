---
sidebar_label: "Changelog"
sidebar_position: 100
title: Changelog
---

# Changelog

## [1.2.0] - 2026-04-01

### Features

- **deps:** upgrade Playwright to 1.59.0, add feature flags for screencast, ariaSnapshotDepth, setStorageState, locatorNormalize, urlPatternMatcher
- **deps:** upgrade TypeScript 5.9.3 → 6.0.2, add TS 5.9/6.0 compat CI matrix
- **deps:** raise minimum Node.js to 22, drop EOL Node 20
- **selectors:** unify UI5 selector engine with fontoxpath + css-selector-parser; add `:not()`, `:labeled()`, positional and sibling selectors
- **cli:** implement interactive `inspect` command for live UI5 control discovery
- **cli:** add `config` command to display resolved configuration
- **cli:** add `init-agents` command for lightweight IDE-specific agent installation
- **config:** add nested env var support for auth, ai, telemetry, odataTracing
- **errors:** add docs URL to error messages, JSON, and AI context
- **core:** add extension system and matcher registry
- **ci:** add Playwright canary (next) to integration matrix
- **docs:** 100% TSDoc coverage — zero TypeDoc warnings

### Bug Fixes

- **deps:** resolve all npm audit vulnerabilities (0 remaining)
- **deps:** resolve docs vulnerabilities (0 remaining)
- **selectors:** preserve array types, align area node name, handle negative nth-child
- **selectors:** fix ui5:property() type fidelity, error surfacing, and tree builder gaps
- **ci:** remove export validation from ts-compat job
- **ci:** skip DTS in ts-compat job for TS 5.9
- **ci:** add missing commit scopes (deps, release, adapter)
- **ci:** handle corrupted npm on macOS ARM64 runners
- **ci:** regenerate lockfile and fix docs broken links
- **docs:** fix documentation accuracy — eliminate fictional APIs across 42 files

### Breaking Changes

- The `enableXpathEngine` configuration field has been removed. The unified selector engine handles all selector styles automatically.
- Minimum Node.js version raised from 20 to 22.

---

## [1.0.1] - 2026-02-23

### Added

- LICENSE copyright holder updated
- NOTICE file for Apache 2.0 attribution
- SECURITY.md vulnerability disclosure policy
- Package metadata improvements (author, files)

## 1.0.0 (2026-02-16)

### Breaking Changes

- Build output now includes CJS alongside ESM

### Features

- **eslint:** add comprehensive best practices configuration ([ea794d6](https://github.com/mrkanitkar/playwright-praman/commit/ea794d6809e9b4b9aec8bc22d58d1da6901b5573))
- multi-OS, multi-IDE, dual ESM+CJS build, AI agents support ([860d52c](https://github.com/mrkanitkar/playwright-praman/commit/860d52c4cad11c2a227c2254920f1a23625beed5))

### Bug Fixes

- **ci:** add docs-check job, security eslint, sbom step, fix defineConfig export ([8d8a74c](https://github.com/mrkanitkar/playwright-praman/commit/8d8a74ca3f1177ab650e5686e19835a0c7cb4df3))
- **ci:** resolve all GitHub Actions workflow failures ([5c3f212](https://github.com/mrkanitkar/playwright-praman/commit/5c3f21237b8ef61ceb3f8a509c7e0d64b0556d60))
- **ci:** set coverage thresholds to 0% for initial release ([5b35d37](https://github.com/mrkanitkar/playwright-praman/commit/5b35d37afb05fe78c2f79f6938acc6d56c1e8072))
- **ci:** update husky hooks to use tsx instead of deleted bash script ([bee1620](https://github.com/mrkanitkar/playwright-praman/commit/bee1620afe278317b6d1a52fe937a199f78ec3e6))

---

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

Automated via [release-please](https://github.com/googleapis/release-please) from Conventional Commits.
