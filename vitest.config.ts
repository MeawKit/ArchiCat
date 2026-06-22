import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: false,
    fileParallelism: false,
    pool: 'forks',
    projects: [
      {
        test: {
          name: 'configs',
          environment: 'node',
          include: ['tests/configs/**/*.test.ts'],
        },
      },
      {
        test: {
          name: 'module',
          environment: 'node',
          include: ['tests/module/**/*.test.ts'],
        },
      },
      {
        test: {
          name: 'library',
          environment: 'node',
          include: ['tests/library/**/*.test.ts'],
        },
      },
      {
        test: {
          name: 'app',
          environment: 'node',
          include: ['tests/app/**/*.test.ts'],
        },
      },
      {
        test: {
          name: 'dependency-graph',
          environment: 'node',
          include: ['tests/dependency-graph/**/*.test.ts'],
        },
      },
      {
        test: {
          name: 'generator',
          environment: 'node',
          include: ['tests/generator/**/*.test.ts'],
        },
      },
      {
        test: {
          name: 'validator',
          environment: 'node',
          include: ['tests/validator/**/*.test.ts'],
        },
      },
      {
        test: {
          name: 'graph',
          environment: 'node',
          include: ['tests/graph/**/*.test.ts'],
        },
      },
      {
        test: {
          name: 'doctor',
          environment: 'node',
          include: ['tests/doctor/**/*.test.ts'],
        },
      },
      {
        test: {
          name: 'cli',
          environment: 'node',
          include: ['tests/cli/**/*.test.ts'],
        },
      },
    ],
  },
});
