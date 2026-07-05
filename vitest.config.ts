import babel from '@rolldown/plugin-babel';
import { defineConfig } from 'vitest/config';

/**
 * Babel preset that lowers TC39 Stage 3 decorators (`@ui5Step`) for Vite 8.
 *
 * Vite 8 replaced esbuild with OXC for TS transforms. OXC does not yet
 * support TC39 decorators (oxc-project/oxc#9170). The official migration
 * path is `@rolldown/plugin-babel` with a code filter so only files
 * containing `@` are processed — minimal perf impact.
 */
function tc39Decorators() {
  return {
    preset: () => ({
      plugins: [['@babel/plugin-proposal-decorators', { version: '2023-11' }]],
    }),
    rolldown: {
      filter: { code: '@' },
    },
  };
}

export default defineConfig({
  define: {
    __PRAMAN_VERSION__: JSON.stringify('0.0.0-test'),
  },
  plugins: [babel({ presets: [tc39Decorators()] })],
  // Vite 8 natively resolves tsconfig paths — replaces vite-tsconfig-paths plugin
  resolve: {
    tsconfigPaths: true,
  },
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
        'src/cli/capabilities-command.ts',
        'src/cli/config-show.ts',
        'src/cli/doctor.ts',
        'src/cli/ide-detector.ts',
        'src/cli/index.ts',
        'src/cli/init-agents.ts',
        'src/cli/init.ts',
        'src/cli/logger.ts',
        'src/cli/program.ts',
        'src/cli/scaffolder.ts',
        'src/cli/snapshot-command.ts',
        'src/cli/snapshot-formatters.ts',
        'src/cli/validator.ts',
        'src/cli/verify-spec-command.ts',
        'src/cli/version.ts',
        'src/cli/vscode-copilot-installer.ts',
        'src/bridge/browser-scripts/**',
        // Browser-injected selector engine — runs in Playwright browser context, not Vitest
        'src/selectors/browser/**',
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
        // Build-time constant — tsup `define` replaces __PRAMAN_VERSION__ at compile time;
        // the ternary fallback branch is unreachable in vitest (Vite also defines it).
        'src/version.ts',
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
          branches: 90,
          functions: 95,
          lines: 95,
        },
        'src/core/constants/**/*.ts': {
          statements: 95,
          branches: 90,
          functions: 95,
          lines: 95,
        },
        'src/core/compat/**/*.ts': {
          statements: 95,
          branches: 90,
          functions: 95,
          lines: 95,
        },
        // ── CLI files un-excluded for coverage ────────────────────────────
        'src/cli/ide-installer.ts': {
          lines: 85,
          statements: 85,
          functions: 85,
          branches: 80,
        },
        'src/cli/uninstall.ts': {
          lines: 85,
          statements: 85,
          functions: 85,
          branches: 80,
        },
        'src/cli/preuninstall.ts': {
          lines: 85,
          statements: 85,
          functions: 85,
          branches: 80,
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
