import { defineConfig } from 'tsup';
import pkg from './package.json' with { type: 'json' };

const external = [...Object.keys(pkg.dependencies), ...Object.keys(pkg.peerDependencies)];

export default defineConfig({
  entry: {
    index: 'src/index.ts',
    'ai/index': 'src/ai/index.ts',
    'intents/index': 'src/intents/index.ts',
    'vocabulary/index': 'src/vocabulary/index.ts',
    'fe/index': 'src/fe/index.ts',
    'reporters/index': 'src/reporters/index.ts',
    'cli/index': 'src/cli/index.ts',
    'cli/preuninstall': 'src/cli/preuninstall.ts',
  },
  define: {
    __PRAMAN_VERSION__: JSON.stringify(pkg.version),
  },
  format: ['esm', 'cjs'],
  tsconfig: 'tsconfig.build.json',
  dts: {
    // tsup's DTS rollup plugin injects `baseUrl: "."` unconditionally (rollup.js:6837).
    // TS 6.0 deprecated baseUrl, causing DTS build failure. This silences the
    // deprecation until tsup releases a fix. Our own tsconfigs have no baseUrl.
    compilerOptions: { ignoreDeprecations: '6.0' },
  },
  sourcemap: true,
  clean: true,
  target: 'node22',
  splitting: false,
  treeshake: true,
  cjsInterop: true,
  shims: true,
  external,
});
