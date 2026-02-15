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
  ],
  ignoreDependencies: [
    'pino-pretty',
  ],
};

export default config;
