import type { KnipConfig } from 'knip';

const config: KnipConfig = {
  // Entry points are auto-detected from package.json "exports" and "bin" fields.
  // Do NOT add a manual "entry" array — knip already discovers:
  //   src/index.ts, src/ai/index.ts, src/intents/index.ts,
  //   src/vocabulary/index.ts, src/fe/index.ts, src/reporters/index.ts, src/cli/index.ts
  project: ['src/**/*.ts'],
  ignore: [
    'src/**/*.d.ts',
    'src/proxy/typed/*.generated.ts',
    'src/core/examples/**',
    'src/auth/index.ts',
    'src/auth/auth-setup.ts',
    'src/auth/auth-teardown.ts',
    'src/bridge/index.ts',
    'src/bridge/interaction-strategies/index.ts',
    'src/bridge/browser-scripts/*.ts',
    'src/core/compat/index.ts',
    'src/core/compat/path-helpers.ts',
    'src/core/config/index.ts',
    'src/core/errors/index.ts',
    'src/core/index.ts',
    'src/core/logging/index.ts',
    'src/core/telemetry/index.ts',
    'src/core/types/index.ts',
    'src/core/utils/index.ts',
    'src/fixtures/index.ts',
    'src/fixtures/module-fixtures.ts',
    'src/matchers/index.ts',
    'src/modules/index.ts',
    'src/proxy/index.ts',
    'src/selectors/index.ts',
  ],
  ignoreDependencies: [
    'pino-pretty',
    'zod-to-json-schema',
    'release-please',
    // MCP server used by Claude Code tooling, not by project code
    '@ui5/mcp-server',
  ],
  ignoreBinaries: ['docusaurus', 'playwright-praman'],
  rules: {
    unlisted: 'off',
    unresolved: 'off',
    // Public API types exported for package consumers are not consumed internally.
    // Barrel index files (in ignore list above) re-export these types, but knip
    // cannot trace re-exports through ignored files, so they appear as unused.
    types: 'off',
  },
};

export default config;
