import babel from '@rolldown/plugin-babel';
import { defineConfig } from 'vitest/config';

/** TC39 decorator support — see vitest.config.ts for rationale. */
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
  plugins: [babel({ presets: [tc39Decorators()] })],
  resolve: {
    tsconfigPaths: true,
  },
  test: {
    name: 'integration',
    include: ['tests/integration/**/*.int.ts'],
    globals: false,
    environment: 'node',
    testTimeout: 30_000,
    hookTimeout: 30_000,
  },
});
