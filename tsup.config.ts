import { defineConfig } from 'tsup';

export default defineConfig({
  entry: {
    'index': 'src/index.ts',
    'ai/index': 'src/ai/index.ts',
    'intents/index': 'src/intents/index.ts',
    'vocabulary/index': 'src/vocabulary/index.ts',
    'fe/index': 'src/fe/index.ts',
    'reporters/index': 'src/reporters/index.ts',
  },
  format: ['esm'],
  tsconfig: 'tsconfig.build.json',
  dts: true,
  sourcemap: true,
  clean: true,
  target: 'node20',
  splitting: true,
  treeshake: true,
  external: [
    '@playwright/test',
    'openai',
    '@opentelemetry/api',
    '@opentelemetry/sdk-node',
  ],
});
