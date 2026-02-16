import type { KnipConfig } from 'knip';

const config: KnipConfig = {
  entry: [
    'src/index.ts',
    'src/ai/index.ts',
    'src/intents/index.ts',
    'src/vocabulary/index.ts',
    'src/fe/index.ts',
    'src/reporters/index.ts',
    'src/cli/index.ts',
  ],
  project: ['src/**/*.ts'],
  ignore: [
    'src/**/*.d.ts',
    'src/proxy/typed/*.generated.ts',
    'src/core/examples/**',
    'src/auth/index.ts',
    'src/bridge/index.ts',
    'src/bridge/interaction-strategies/index.ts',
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
    'src/matchers/index.ts',
    'src/modules/index.ts',
    'src/proxy/index.ts',
    'src/selectors/index.ts',
  ],
  ignoreDependencies: [
    'pino-pretty',
    'dotenv',
    'pino',
    'zod',
    'zod-to-json-schema',
    'release-please',
    '@eslint/js',
  ],
  ignoreBinaries: [
    'run',
    'docusaurus',
  ],
  rules: {
    unlisted: 'off',
    unresolved: 'off',
  },
};

export default config;
