import { resolve } from 'node:path';

import { defineConfig } from 'vitest/config';

const rootDir = import.meta.dirname;

export default defineConfig({
  resolve: {
    alias: [
      { find: /^@\/(.*)$/, replacement: `${resolve(rootDir, 'src')}/$1` },
      { find: /^@cli\/(.*)$/, replacement: `${resolve(rootDir, 'src-cli')}/$1` },
      { find: /^@internal\/(.*)$/, replacement: `${resolve(rootDir, 'src-internal')}/$1` },
      { find: /^@test\/(.*)$/, replacement: `${resolve(rootDir, 'test')}/$1` },
    ],
  },
  test: {
    globals: false,
    fileParallelism: false,
    pool: 'forks',
    environment: 'node',
    include: ['test/**/*.test.ts'],
  },
});
