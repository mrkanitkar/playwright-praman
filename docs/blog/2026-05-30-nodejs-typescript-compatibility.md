---
title: 'Praman Compatibility: Node.js 22–26 and TypeScript 5–7'
authors: [maheshwar]
tags: [praman, compatibility, nodejs, typescript-5, typescript-6, typescript-7]
date: 2026-05-30
description: >
  How playwright-praman ensures compatibility across Node.js 22, 24, and 26,
  TypeScript 5.x through 6.x, and forward-readiness for TypeScript 7.0 —
  backed by CI evidence across 3 operating systems.
keywords:
  - playwright-praman nodejs compatibility
  - playwright-praman typescript 7
  - sap ui5 test automation nodejs 26
  - playwright plugin node 26
  - typescript 7 playwright
  - nodejs 26 compatibility
  - typescript 6 sap testing
  - node 22 lts playwright
---

# Praman Compatibility: Node.js 22–26 and TypeScript 5–7

**Praman v1.3** is CI-tested on **Node.js 22, 24, and 26** across three operating systems, ships published types compiled with **TypeScript 6.0.3**, validates against **TS 5.9** and **TS 6.0** on every push, and passes a clean typecheck against the **TypeScript 7.0 beta** (`tsgo`). This post documents the evidence behind each compatibility claim so your team can adopt Praman with confidence.

<!-- truncate -->

---

## Node.js 22, 24, 26 — CI-Verified

Praman declares `"engines": { "node": ">=22" }` in `package.json` and enforces it with `engine-strict=true` in `.npmrc` — npm will refuse to install on any Node version below 22.

### CI Test Matrix

Every push runs **4,476 unit tests** across a 9-cell matrix:

|             | Node.js 22 LTS | Node.js 24 LTS | Node.js 26 Current |
| ----------- | -------------- | -------------- | ------------------ |
| **Ubuntu**  | Pass           | Pass           | Pass               |
| **Windows** | Pass           | Pass           | Pass               |
| **macOS**   | Pass           | Pass           | Pass               |

Additionally, the **Install Matrix** workflow tests `npm`, `yarn`, and `pnpm` across all three OSes — verifying CJS `require()`, ESM `import()`, and CLI execution for each combination.

### Why It Just Works

**Zero native dependencies.** All five runtime dependencies are pure JavaScript:

| Dependency          | Purpose                 | Native Code |
| ------------------- | ----------------------- | ----------- |
| commander           | CLI argument parsing    | No          |
| css-selector-parser | CSS selector analysis   | No          |
| fontoxpath          | XPath evaluation        | No          |
| pino                | Structured JSON logging | No          |
| zod                 | Schema validation       | No          |

No native addons means no recompilation when you switch Node versions, no `node-gyp` failures on CI, and no N-API version mismatches.

**ESM-first with CJS fallback.** Praman ships `"type": "module"` and uses `node:` prefixed imports throughout (`node:path`, `node:fs`, `node:url`). The build produces dual-format output via tsup:

- **ESM**: `dist/*.js` + `dist/*.d.ts` — primary format
- **CJS**: `dist/*.cjs` + `dist/*.d.cts` — Node.js compatibility

Both formats are validated by [`@arethetypeswrong/cli`](https://www.npmjs.com/package/@arethetypeswrong/cli) on every build to ensure correct export resolution.

**Build target: `node22`.** The transpiled output targets Node 22 syntax — it uses top-level `await`, `import.meta.url`, and other ES2022+ features natively supported by all three versions.

### What Each Version Brings

| Version    | Status     | Release    | Key Highlights                                                  |
| ---------- | ---------- | ---------- | --------------------------------------------------------------- |
| Node.js 22 | Active LTS | April 2024 | Baseline — `import.meta.resolve()`, stable test runner          |
| Node.js 24 | Active LTS | April 2025 | URLPattern, V8 13.6, npm 11 bundled                             |
| Node.js 26 | Current    | April 2026 | Temporal API, V8 14.6, `Iterator.concat()`, `Map.getOrInsert()` |

All three versions work identically with Praman — no conditional code paths, no polyfills, no version-specific workarounds.

---

## TypeScript 5.x — Compatible

The CI `ts-compat` job validates Praman against **TypeScript 5.9.3** on every push. The codebase uses modern TypeScript features that have been stable since the 5.x era:

| Feature                | Introduced | Usage in Praman                                         |
| ---------------------- | ---------- | ------------------------------------------------------- |
| `verbatimModuleSyntax` | TS 5.0     | Enabled in tsconfig — preserves `import type` in output |
| `satisfies` operator   | TS 4.9     | Used for type-safe config presets without widening      |
| `import type`          | TS 3.8     | 241 type-only imports across 114 files                  |
| `as const` assertions  | TS 3.4     | 53+ usages for frozen literals and tuples               |

**No deprecated patterns.** The codebase contains zero enums, zero decorators, zero namespaces, and zero `import ... assert {}` statements — all patterns that have been deprecated or removed in later TypeScript versions. This ensures a clean upgrade path from 5.x to 6.x or 7.x.

If your project uses TypeScript 5.5 or later, Praman's types will work out of the box. No additional configuration needed.

---

## TypeScript 6.x — Full Support

Praman's published types are compiled with **TypeScript 6.0.3** (the latest stable release). The CI `ts-compat` job validates against **TS 6.0.2** on every push, ensuring types remain correct across minor patch differences.

### TS 6.0 Requirements — Already Adopted

TypeScript 6.0 introduced breaking changes that catch many libraries off guard. Praman addressed these proactively:

| TS 6.0 Requirement                              | Praman Status       | Config           |
| ----------------------------------------------- | ------------------- | ---------------- |
| Explicit `types` field (auto-discovery removed) | `"types": ["node"]` | `tsconfig.json`  |
| `noUncheckedSideEffectImports` recommended      | Enabled as `true`   | `tsconfig.json`  |
| `with {}` syntax replaces `assert {}`           | Used throughout     | `tsup.config.ts` |

**Migration from TS 5.x was zero source changes** — only `tsconfig.json` adjustments. If you're upgrading your project from TS 5.x to 6.x, Praman won't be the thing that breaks.

---

## TypeScript 7.0 Beta — Forward-Ready

TypeScript 7.0 is a [ground-up rewrite in Go](https://devblogs.microsoft.com/typescript/announcing-typescript-7-0-beta/), delivering approximately **10x faster** type checking. It's published as `@typescript/native-preview` with the `tsgo` CLI.

### Verification Result

We installed `@typescript/native-preview@beta` (version `7.0.0-dev.20260421.2`) and ran:

```bash
npx tsgo --noEmit
# Exit code: 0 — zero errors, zero warnings
```

The entire Praman codebase — 187 TypeScript files in `src/`, plus tests — passes a clean typecheck under TypeScript 7.0 beta with no modifications.

### Breaking Change Compatibility

TS 7.0 removes several deprecated features. Here's how Praman maps against each:

| TS 7.0 Breaking Change                  | Impact on Praman                | Status    |
| --------------------------------------- | ------------------------------- | --------- |
| `baseUrl` removed                       | Not used in tsconfig            | No impact |
| `moduleResolution: node/node10` removed | Uses `Node16` (still supported) | No impact |
| `types` defaults to `[]`                | Already explicit: `["node"]`    | No impact |
| `strict` defaults to `true`             | Already enabled                 | No impact |
| `rootDir` defaults to `"./"`            | Already set to `"."`            | No impact |
| `esModuleInterop` cannot be `false`     | Already `true`                  | No impact |
| `target: es5` removed                   | Uses `ES2022`                   | No impact |
| `assert {}` syntax removed              | Uses `with {}`                  | No impact |
| `amd/umd/systemjs/none` module removed  | Uses `Node16`                   | No impact |
| `alwaysStrict` cannot be `false`        | Already strict                  | No impact |

**Every breaking change in TS 7.0 has zero impact on Praman.** The codebase was already aligned with TS 7.0's stricter defaults.

### What This Means for You

- If you adopt `tsgo` today, Praman's types work immediately with full inference
- Published `.d.ts` files are structurally identical whether consumed by `tsc` 6.x or `tsgo` 7.0
- The `strict: true` tsconfig is enforced throughout — all generics, narrowing, and inference behave correctly under TS 7 semantics

### Known Caveat

The tsup bundler's DTS rollup plugin internally injects `baseUrl: "."` during declaration generation. This is a [tsup upstream issue](https://github.com/egoist/tsup) — Praman's own `tsconfig.json` has no `baseUrl`. The workaround (`ignoreDeprecations: '6.0'` in the DTS config) is already in place and does not affect consumers.

---

## How We Ensure Compatibility

Praman's CI pipeline runs 5 parallel validation stages on every push:

```
quality ─────── lint + typecheck + spell + knip + markdownlint
unit-tests ──── 9-cell matrix (3 Node × 3 OS) + coverage
build ────────── dual ESM+CJS + smoke tests + attw + size-limit
ts-compat ───── TS 5.9.3 + TS 6.0.2 typecheck + build
install-test ── npm/yarn/pnpm × 3 OSes (CJS + ESM + CLI)
```

### Key Safeguards

| Mechanism                 | What It Catches                                 |
| ------------------------- | ----------------------------------------------- |
| `engine-strict=true`      | Prevents install on unsupported Node versions   |
| `attw` export validation  | Broken ESM/CJS resolution, missing types        |
| 9-cell unit test matrix   | Platform-specific path or timing bugs           |
| Install matrix (9 cells)  | Package manager resolution differences          |
| Runtime feature detection | Graceful degradation across Playwright versions |

**Runtime feature detection** deserves special mention. Praman uses 15 feature flags to detect Playwright capabilities at runtime — not version string comparisons. This means new Playwright features are adopted progressively without breaking older installations:

| Feature                 | Required PW Version | Detection Key              |
| ----------------------- | ------------------- | -------------------------- |
| Clock API               | 1.45+               | `hasClockAPI`              |
| ARIA snapshots          | 1.49+               | `hasAriaSnapshot`          |
| Screencast API          | 1.59+               | `hasScreencastAPI`         |
| Test abort              | 1.60+               | `hasTestAbort`             |
| Full-page ARIA snapshot | 1.60+               | `hasPageAriaSnapshot`      |
| Locator highlight style | 1.60+               | `hasLocatorHighlightStyle` |

_(6 of 15 flags shown — see the [full compatibility guide](/docs/guides/compatibility) for the complete list.)_

---

## Quick Verification

Run these commands to confirm your environment is compatible:

```bash
# Check Node.js version (>=22 required)
node --version

# Check TypeScript version (5.5+ / 6.x supported)
npx tsc --version

# Install Praman
npm install playwright-praman@latest

# Verify CLI works
npx playwright-praman --version

# Run your tests
npx playwright test
```

---

## Summary Compatibility Matrix

| Dimension          | Supported Range       | CI-Tested         | Status        |
| ------------------ | --------------------- | ----------------- | ------------- |
| Node.js 22         | LTS (Active)          | Yes — 3 OSes      | Supported     |
| Node.js 24         | LTS (Active)          | Yes — 3 OSes      | Supported     |
| Node.js 26         | Current               | Yes — 3 OSes      | Supported     |
| TypeScript 5.5–5.9 | Stable                | 5.9.3             | Compatible    |
| TypeScript 6.x     | Stable                | 6.0.2             | Full support  |
| TypeScript 7.0     | Beta                  | Verified (`tsgo`) | Forward-ready |
| Playwright         | 1.57–1.60             | Yes               | Supported     |
| Operating Systems  | Linux, Windows, macOS | Yes               | All three     |
| Package Managers   | npm, yarn, pnpm       | Yes               | All three     |

---

## Related Resources

- [Playwright Compatibility Guide](/docs/guides/compatibility) — full feature detection table and version matrix
- [Getting Started](/docs/guides/getting-started) — install and run your first test
- [Praman v1.3 Release Notes](/blog/2026/05/26/v1-3-release) — TypeScript 7, Playwright 1.60, ARIA grounding
- [TypeScript 7.0 Beta Announcement](https://devblogs.microsoft.com/typescript/announcing-typescript-7-0-beta/) — Microsoft DevBlogs
- [Node.js 26.2.0 Release](https://nodejs.org/en/blog/release/v26.2.0) — Node.js official blog
