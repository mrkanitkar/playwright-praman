import tsconfigPaths from 'vite-tsconfig-paths';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  plugins: [tsconfigPaths()],
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
      exclude: [
        'src/**/index.ts',
        'src/**/*.d.ts',
        'src/cli/**',
        'src/bridge/browser-scripts/**',
        // Type-only files — erased at compile time, no runtime code to cover
        'src/core/types/bridge.ts',
        'src/core/types/config.ts',
        'src/core/types/controls.ts',
        'src/core/types/validation.ts',
        // Interface-only — no runtime implementation in Phase 1
        'src/bridge/adapter.ts',
        // Playwright runtime files — run in Playwright test runner, not Vitest
        'src/auth/auth-setup.ts',
        'src/auth/auth-teardown.ts',
        // Example/documentation file — not production code
        'src/core/examples/**',
      ],
      // ── Tiered coverage thresholds (Google/Microsoft best practice) ──────
      // See CLAUDE.md and skills-tester.md for rationale.
      thresholds: {
        // ── Tier 3: Global minimum (90%) ───────────────────────────────────
        statements: 90,
        branches: 85,
        functions: 90,
        lines: 90,
        perFile: true,
        // ── Tier 1: Error classes + public API (100%) ──────────────────────
        'src/core/errors/**/*.ts': {
          statements: 100,
          branches: 100,
          functions: 100,
          lines: 100,
        },
        // ── Tier 2: Core infrastructure (95/90/95/95) ──────────────────────
        'src/core/config/**/*.ts': {
          statements: 95,
          branches: 90,
          functions: 95,
          lines: 95,
        },
        'src/core/logging/**/*.ts': {
          statements: 95,
          branches: 90,
          functions: 95,
          lines: 95,
        },
        'src/core/telemetry/**/*.ts': {
          statements: 95,
          branches: 90,
          functions: 95,
          lines: 95,
        },
        'src/core/utils/**/*.ts': {
          statements: 95,
          branches: 85,
          functions: 90,
          lines: 95,
        },
        'src/core/compat/**/*.ts': {
          statements: 95,
          branches: 90,
          functions: 95,
          lines: 95,
        },
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
