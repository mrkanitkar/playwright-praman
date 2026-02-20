import tsconfigPaths from 'vite-tsconfig-paths';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  plugins: [tsconfigPaths()],
  test: {
    name: 'integration',
    include: ['tests/integration/**/*.int.ts'],
    globals: false,
    environment: 'node',
    testTimeout: 30_000,
    hookTimeout: 30_000,
  },
});
