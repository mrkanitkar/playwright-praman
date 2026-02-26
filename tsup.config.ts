import { defineConfig } from 'tsup';
import pkg from './package.json' with { type: 'json' };

const external = [...Object.keys(pkg.peerDependencies), ...Object.keys(pkg.optionalDependencies)];

export default defineConfig({
  entry: {
    index: 'src/index.ts',
    'ai/index': 'src/ai/index.ts',
    'intents/index': 'src/intents/index.ts',
    'vocabulary/index': 'src/vocabulary/index.ts',
    'fe/index': 'src/fe/index.ts',
    'reporters/index': 'src/reporters/index.ts',
    'cli/index': 'src/cli/index.ts',
  },
  define: {
    __PRAMAN_VERSION__: JSON.stringify(pkg.version),
  },
  format: ['esm', 'cjs'],
  tsconfig: 'tsconfig.build.json',
  dts: true,
  sourcemap: true,
  clean: true,
  target: 'node20',
  splitting: true,
  treeshake: true,
  cjsInterop: true,
  shims: true,
  external,
});
