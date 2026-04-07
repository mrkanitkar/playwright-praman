import type { KnipConfig } from 'knip';

const config: KnipConfig = {
  // Entry points are auto-detected from package.json "exports" and "bin" fields.
  // Do NOT add a manual "entry" array — knip already discovers:
  //   src/index.ts, src/ai/index.ts, src/intents/index.ts,
  //   src/vocabulary/index.ts, src/fe/index.ts, src/reporters/index.ts, src/cli/index.ts
  project: ['src/**/*.ts'],
  ignore: [
    'src/core/examples/**',
    'src/auth/index.ts',
    'src/auth/auth-setup.ts',
    'src/auth/auth-teardown.ts',
    'src/bridge/index.ts',
    'src/bridge/control-tree-types.ts',
    'src/bridge/interaction-strategies/index.ts',
    'src/bridge/browser-scripts/*.ts',
    'src/core/compat/index.ts',
    'src/core/config/index.ts',
    'src/core/errors/index.ts',
    'src/core/index.ts',
    'src/core/logging/index.ts',
    'src/core/telemetry/index.ts',
    'src/core/types/index.ts',
    'src/core/utils/index.ts',
    'src/extensions/index.ts',
    'src/fixtures/index.ts',
    'src/fixtures/module-fixtures.ts',
    'src/matchers/index.ts',
    'src/modules/index.ts',
    'src/proxy/index.ts',
    'src/selectors/index.ts',
    // Browser-injected script — loaded via file path, not imported as a module
    'src/selectors/browser/ui5-engine.ts',
  ],
  ignoreDependencies: [
    'pino-pretty',
    'zod-to-json-schema',
    'release-please',
    // MCP server used by Claude Code tooling, not by project code
    '@ui5/mcp-server',
    // Optional peer dep kept in devDeps for testing telemetry integration
    '@opentelemetry/sdk-node',
    // Peer dep + devDep used in CLI init commands; knip can't trace dynamic usage
    '@playwright/cli',
    // Loaded dynamically by @rolldown/plugin-babel via string name, not import
    '@babel/plugin-proposal-decorators',
    // Used in scripts/capability-validation-utils.ts — outside knip's project scope
    'glob',
  ],
  ignoreBinaries: ['docusaurus', 'playwright-praman'],
  rules: {
    unlisted: 'off',
    unresolved: 'off',
    // Public API types exported for package consumers are not consumed internally.
    // Barrel index files (in ignore list above) re-export these types, but knip
    // cannot trace re-exports through ignored files, so they appear as unused.
    types: 'off',
    // @anthropic-ai/sdk and openai are intentionally optional peer dependencies.
    // Code references them via dynamic import() with graceful fallbacks.
    optionalPeerDependencies: 'off',
  },
};

export default config;
