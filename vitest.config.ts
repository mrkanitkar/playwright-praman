import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['tests/unit/**/*.test.ts'],
    exclude: ['tests/integration/**', 'tests/e2e/**'],
    globals: false,
    environment: 'node',
    coverage: {
      provider: 'v8',
      reporter: ['text', 'lcov', 'json-summary', 'json', 'html'],
      reportOnFailure: true,
      include: ['src/**/*.ts'],
      exclude: ['src/**/index.ts', 'src/**/*.d.ts', 'src/cli/**', 'src/bridge/browser-scripts/**'],
      // ── Tiered coverage thresholds (Google/Microsoft best practice) ──────
      // Phase 0 scaffold: global thresholds at 0 — no real implementation code yet.
      // Phase 1+ targets enforced per-file with glob-based tiers:
      //   Tier 1 (100%): Error classes, public API — zero tolerance for untested paths
      //   Tier 2 (95%):  Core infrastructure — config, logging, utils, selectors, matchers
      //   Tier 3 (90%):  All other modules — Google "exemplary" level
      // See CLAUDE.md and skills-tester.md for rationale.
      thresholds: {
        // Global minimums (Phase 0: 0, Phase 1+: uncomment targets below)
        statements: 0,
        branches: 0,
        functions: 0,
        lines: 0,
        perFile: true,
        // ── Tier 1: Error classes + public API (100%) ──────────────────────
        // 'src/core/errors/**/*.ts': {
        //   statements: 100,
        //   branches: 100,
        //   functions: 100,
        //   lines: 100,
        // },
        // ── Tier 2: Core infrastructure (95%) ──────────────────────────────
        // 'src/core/**/*.ts': {
        //   statements: 95,
        //   branches: 90,
        //   functions: 95,
        //   lines: 95,
        // },
        // ── Tier 3: Global minimum (90%) ───────────────────────────────────
        // Uncomment global thresholds above: statements: 90, branches: 85, functions: 90, lines: 90
      },
      watermarks: {
        statements: [80, 95],
        branches: [75, 90],
        functions: [80, 95],
        lines: [80, 95],
      },
    },
    typecheck: {
      enabled: true,
    },
  },
});
