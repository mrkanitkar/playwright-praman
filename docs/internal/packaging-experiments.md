# Packaging Experiments — Wave 2

Date: 2026-06-11

## Baseline

- **dist/ total:** 10,668 KB (10M)
- **Tarball:** 1.1 MB package / 5.5 MB unpacked / 122 files
- **splitting:** `false` (all shared code inlined into each entry)

### Key file sizes (raw)

| File                      | Size   |
| ------------------------- | ------ |
| dist/index.js             | 662 KB |
| dist/index.cjs            | 669 KB |
| dist/ai/index.js          | 167 KB |
| dist/ai/index.cjs         | 168 KB |
| dist/fe/index.js          | 77 KB  |
| dist/fe/index.cjs         | 78 KB  |
| dist/reporters/index.js   | 62 KB  |
| dist/reporters/index.cjs  | 63 KB  |
| dist/intents/index.js     | 36 KB  |
| dist/intents/index.cjs    | 37 KB  |
| dist/vocabulary/index.js  | 24 KB  |
| dist/vocabulary/index.cjs | 25 KB  |

### Key file sizes (brotli, via size-limit)

| File                      | Brotli   |
| ------------------------- | -------- |
| dist/index.js             | 96.88 KB |
| dist/index.cjs            | 97.43 KB |
| dist/ai/index.js          | 27.84 KB |
| dist/ai/index.cjs         | 28.08 KB |
| dist/fe/index.js          | 11.93 KB |
| dist/fe/index.cjs         | 12.08 KB |
| dist/reporters/index.js   | 12.86 KB |
| dist/reporters/index.cjs  | 12.99 KB |
| dist/intents/index.js     | 3.27 KB  |
| dist/intents/index.cjs    | 3.32 KB  |
| dist/vocabulary/index.js  | 5.41 KB  |
| dist/vocabulary/index.cjs | 5.62 KB  |

### attw: all green (node10, node16-cjs, node16-esm, bundler)

---

## Experiment (a): ESM splitting: true

**Change:** `tsup.config.ts` — `splitting: false` to `splitting: true`

`splitting: true` enables code splitting for ESM output. Shared code between
entry points is extracted into `chunk-*.js` files instead of being duplicated
in every entry bundle. CJS output also gets `chunk-*.cjs` files.

### Result: ADOPTED

### Measurements

| Metric             | Baseline  | After    | Delta        |
| ------------------ | --------- | -------- | ------------ |
| dist/ total        | 10,668 KB | 8,276 KB | -22.4%       |
| Tarball (packed)   | 1.1 MB    | 981.2 KB | -10.8%       |
| Tarball (unpacked) | 5.5 MB    | 4.7 MB   | -14.5%       |
| Total files        | 122       | 174      | +52 (chunks) |

### Entry point sizes after splitting (brotli)

| File                      | Before   | After    | Delta  |
| ------------------------- | -------- | -------- | ------ |
| dist/index.js             | 96.88 KB | 51.90 KB | -46.4% |
| dist/index.cjs            | 97.43 KB | 52.46 KB | -46.2% |
| dist/ai/index.js          | 27.84 KB | 8.46 KB  | -69.6% |
| dist/ai/index.cjs         | 28.08 KB | 8.57 KB  | -69.5% |
| dist/fe/index.js          | 11.93 KB | 3.66 KB  | -69.3% |
| dist/fe/index.cjs         | 12.08 KB | 3.90 KB  | -67.7% |
| dist/reporters/index.js   | 12.86 KB | 6.38 KB  | -50.4% |
| dist/reporters/index.cjs  | 12.99 KB | 6.41 KB  | -50.7% |
| dist/intents/index.js     | 3.27 KB  | 3.25 KB  | -0.6%  |
| dist/intents/index.cjs    | 3.32 KB  | 3.31 KB  | -0.3%  |
| dist/vocabulary/index.js  | 5.41 KB  | 3.02 KB  | -44.2% |
| dist/vocabulary/index.cjs | 5.62 KB  | 3.11 KB  | -44.7% |

### Validation

- **attw (`check:exports`):** all green, no problems found
- **size-limit:** all entries well within limits
- **Chunk files in tarball:** confirmed via `npm pack --dry-run`

### Decision rationale

Total dist 22.4% smaller (exceeds the 15% threshold). All validation checks
pass. Shared chunks are properly included in the npm tarball. The trade-off is
52 additional files (chunks), but tarball size is smaller because gzip/brotli
compresses unique content better than duplicated content.

---

## Experiment (b): Declaration diet (.d.cts removal)

**Change:** In `package.json` exports, for each subpath's `require.types`,
pointed at `.d.ts` instead of `.d.cts` to eliminate duplicate CTS type
declarations (~600 KB of `.d.cts` files).

### Result: REVERTED

### Validation

- **attw (`check:exports`):** FAILED
  - All 6 subpaths reported `Masquerading as ESM` (FalseESM) in the
    `node16 (from CJS)` column
  - Root cause: the package has `"type": "module"`, so `.d.ts` files are
    interpreted as ESM type declarations. When a CJS consumer (`require`)
    resolves types to a `.d.ts` file, TypeScript sees ESM types paired with
    CJS runtime code — a module kind mismatch

### Decision rationale

The `.d.cts` files are structurally required for correct CJS type resolution in
`node16`/`nodenext` module resolution. There is no safe way to eliminate them
without breaking CJS consumers. The ~600 KB of duplicate declarations is the
cost of dual ESM+CJS packaging.

**Alternative explored but not pursued:** excluding `.d.cts` from the tarball
via `files` glob exclusion would break `require` consumers entirely.

---

## Final state

| Metric             | Baseline  | Final    | Delta        |
| ------------------ | --------- | -------- | ------------ |
| dist/ total        | 10,668 KB | 8,276 KB | -22.4%       |
| Tarball (packed)   | 1.1 MB    | 981.2 KB | -10.8%       |
| Tarball (unpacked) | 5.5 MB    | 4.7 MB   | -14.5%       |
| Total files        | 122       | 174      | +52 (chunks) |

### Changes committed

- `tsup.config.ts`: `splitting: true` (was `false`)
- `package.json`: unchanged (experiment (b) reverted)
- `.size-limit.json`: unchanged (entry paths did not change)
