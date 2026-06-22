import path from 'node:path';
import { afterAll, describe, expect, test } from 'vitest';

import { cleanupConsumerProjects, createConsumerProject, createModule } from '../fixtures/consumer-project';
import { readJson } from '../fixtures/files';
import { runArchicat } from '../fixtures/run-archicat';

describe('tsconfig generation', () => {
  afterAll(() => {
    cleanupConsumerProjects();
  });

  test('should generate TypeScript 6 compatible paths without baseUrl', () => {
    const root = createConsumerProject('generate-tsconfig-paths');

    createModule(root, { name: 'account' });

    const result = runArchicat(root, 'generate');

    expect(result.status, result.stderr).toBe(0);

    const tsconfig = readJson(path.join(root, '.archicat/tsconfig.json')) as any;

    expect('baseUrl' in tsconfig.compilerOptions).toBe(false);
    expect(tsconfig.compilerOptions.paths['@module/account']).toEqual(['./modules/account/api/index.ts']);
    expect(tsconfig.compilerOptions.paths['@module/account/*']).toEqual(['./modules/account/api/*']);
  });

  test('should parse JSONC tsconfig and generate configured aliases', () => {
    const root = createConsumerProject('generate-tsconfig-jsonc-alias', {
      config: {
        alias: {
          '@app/*': './src/*',
        },
      },
      tsconfigBase: `
        {
          "compilerOptions": {
            // Valid JSONC comment.
            "target": "ES2024",
            "module": "NodeNext",
            "moduleResolution": "NodeNext",
            "strict": true,
            "rootDir": ".",
          }
        }
      `,
    });

    createModule(root, { name: 'account' });

    const result = runArchicat(root, 'generate');

    expect(result.status, result.stderr).toBe(0);

    const tsconfig = readJson(path.join(root, '.archicat/tsconfig.json')) as any;

    expect(tsconfig.compilerOptions.rootDir).toBe('..');
    expect(tsconfig.compilerOptions.paths['@app/*']).toEqual(['../src/*']);
    expect(tsconfig.compilerOptions.paths['@module/account']).toEqual(['./modules/account/api/index.ts']);
  });

  test('should reject root tsconfig paths', () => {
    const root = createConsumerProject('generate-tsconfig-root-paths', {
      tsconfigBase: `
        {
          "compilerOptions": {
            "target": "ES2024",
            "module": "NodeNext",
            "moduleResolution": "NodeNext",
            "strict": true,
            "paths": {
              "@app/*": ["src/*"]
            }
          }
        }
      `,
    });

    createModule(root, { name: 'account' });

    const result = runArchicat(root, 'generate');

    expect(result.status).not.toBe(0);
    expect(result.stderr).toMatch(/Move aliases into archicat.config.ts alias/);
  });

  test('should reject configured aliases inside the reserved Archicat prefix', () => {
    const root = createConsumerProject('generate-tsconfig-conflict', {
      config: {
        alias: {
          '@module/*': './src/module/*',
        },
      },
    });

    createModule(root, { name: 'account' });

    const result = runArchicat(root, 'generate');

    expect(result.status).not.toBe(0);
    expect(result.stderr).toMatch(/Alias conflict/);
  });
});
