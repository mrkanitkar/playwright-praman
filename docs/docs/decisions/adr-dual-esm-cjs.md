---
sidebar_position: 9
title: 'ADR: Dual ESM+CJS Build'
---

# ADR: Dual ESM+CJS Build (ACT-027)

| Property     | Value                                                           |
| ------------ | --------------------------------------------------------------- |
| **Decision** | Ship both ESM and CJS outputs via tsup with conditional exports |
| **Status**   | ACCEPTED                                                        |
| **Date**     | 2025-10-15                                                      |

## Context

Praman is an ESM-first package (`"type": "module"` in `package.json`). However, the Node.js
ecosystem still has significant CJS usage. The question is whether to ship ESM-only or produce
dual ESM+CJS outputs.

Key factors driving this decision:

1. **Jest users need CJS.** Jest's ESM support is still experimental (`--experimental-vm-modules`).
   Many SAP enterprise teams use Jest for their application tests and import Praman utilities
   (config types, error classes) in those test files.
2. **Enterprise CI tooling.** Corporate build pipelines, SAP Build Workzone integrations, and
   legacy Node.js tooling (e.g., Webpack 4, older ts-node versions) often resolve only CJS.
3. **Playwright itself ships dual.** Playwright's own `@playwright/test` package provides both
   ESM and CJS, setting the precedent for test framework packages.
4. **Six sub-path exports.** Praman exposes `.`, `./ai`, `./intents`, `./vocabulary`, `./fe`,
   and `./reporters` -- each must resolve correctly in both module systems.

## Decision

Produce dual ESM + CJS output using tsup with the following configuration:

```typescript
// tsup.config.ts
export default defineConfig({
  format: ['esm', 'cjs'],
  cjsInterop: true,
  shims: true,
  dts: true,
  splitting: true,
  treeshake: true,
});
```

Each sub-path export uses conditional exports in `package.json`:

```json
{
  ".": {
    "types": { "import": "./dist/index.d.ts", "require": "./dist/index.d.cts" },
    "import": "./dist/index.js",
    "require": "./dist/index.cjs",
    "default": "./dist/index.js"
  }
}
```

Validation is enforced by `@arethetypeswrong/cli` (attw) in CI to ensure every export
resolves correctly for both ESM and CJS consumers.

## Alternatives Considered

### ESM-only

Simpler build, smaller package. Rejected because it would break Jest users and enterprise
CI pipelines that cannot yet consume pure ESM. The Node.js ecosystem is migrating to ESM
but has not completed that transition.

### Separate CJS wrapper package

Publish `playwright-praman-cjs` as a thin CJS wrapper around the ESM package. Rejected
because it doubles the maintenance burden, creates version synchronization issues, and
confuses users about which package to install.

### Bundling with Rollup instead of tsup

Rollup produces clean output, but tsup (built on esbuild) is significantly faster for
7 entry points and provides `cjsInterop` and `shims` out of the box, handling
`__dirname`/`__filename`, `import.meta.url`, and default export interop automatically.

## Consequences

### Positive

- Jest users can `require('playwright-praman')` without `--experimental-vm-modules`
- Enterprise CI pipelines with older Node.js tooling work out of the box
- `@arethetypeswrong/cli` validates every release, catching resolution bugs before publish
- tsup's `treeshake` ensures CJS output does not include unused code
- Separate `.d.ts` / `.d.cts` type declarations prevent TypeScript resolution mismatches

### Negative

- Package size roughly doubles (~180 KB ESM + ~200 KB CJS instead of ~180 KB ESM-only)
- `cjsInterop: true` injects shim code for `__dirname`, `__filename`, and `import.meta.url`
  which adds ~1 KB per entry point
- Two sets of declaration files (`.d.ts` + `.d.cts`) must be validated and maintained
- Build time increases from ~1.5s (ESM-only) to ~3s (dual) -- acceptable for CI

## References

- [`tsup.config.ts`](https://github.com/nicolo-ribaudo/praman/blob/main/tsup.config.ts) -- build configuration
- [`package.json` exports](https://github.com/nicolo-ribaudo/praman/blob/main/package.json) -- conditional exports map
- [Node.js Conditional Exports](https://nodejs.org/api/packages.html#conditional-exports) -- official documentation
- [@arethetypeswrong/cli](https://github.com/arethetypeswrong/arethetypeswrong.github.io) -- export validation tool
- [tsup cjsInterop](https://tsup.egoist.dev/#interop-with-commonjs) -- CJS interop documentation
