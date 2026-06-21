import assert from 'node:assert/strict';
import path from 'node:path';
import test from 'node:test';

import { cleanupConsumerProjects, createConsumerProject, createModule } from '../fixtures/consumer-project.mjs';
import { readJson } from '../fixtures/files.mjs';
import { runArchicat } from '../fixtures/run-archicat.mjs';

test.after(() => {
  cleanupConsumerProjects();
});

test('should generate TypeScript 6 compatible paths without baseUrl', () => {
  const root = createConsumerProject('generate-tsconfig-paths');

  createModule(root, { id: 'account' });

  const result = runArchicat(root, 'generate');

  assert.equal(result.status, 0, result.stderr);

  const tsconfig = readJson(path.join(root, '.archicat/tsconfig.json'));

  assert.equal('baseUrl' in tsconfig.compilerOptions, false);
  assert.deepEqual(tsconfig.compilerOptions.paths['@module/account'], ['./modules/account/api/index.ts']);
  assert.deepEqual(tsconfig.compilerOptions.paths['@module/account/*'], ['./modules/account/api/*']);
});

test('should merge and rewrite user tsconfig paths relative to generated tsconfig', () => {
  const root = createConsumerProject('generate-tsconfig-merge', {
    tsconfigBase: `
      {
        "compilerOptions": {
          "target": "ES2024",
          "module": "NodeNext",
          "moduleResolution": "NodeNext",
          "strict": true,
          "rootDir": ".",
          "paths": {
            "@app/*": ["src/*"]
          }
        }
      }
    `,
  });

  createModule(root, { id: 'account' });

  const result = runArchicat(root, 'generate');

  assert.equal(result.status, 0, result.stderr);

  const tsconfig = readJson(path.join(root, '.archicat/tsconfig.json'));

  assert.equal(tsconfig.compilerOptions.rootDir, '..');
  assert.deepEqual(tsconfig.compilerOptions.paths['@app/*'], ['../src/*']);
  assert.deepEqual(tsconfig.compilerOptions.paths['@module/account'], ['./modules/account/api/index.ts']);
});

test('should reject user aliases inside the reserved Archicat prefix', () => {
  const root = createConsumerProject('generate-tsconfig-conflict', {
    tsconfigBase: `
      {
        "compilerOptions": {
          "target": "ES2024",
          "module": "NodeNext",
          "moduleResolution": "NodeNext",
          "strict": true,
          "paths": {
            "@module/*": ["src/module/*"]
          }
        }
      }
    `,
  });

  createModule(root, { id: 'account' });

  const result = runArchicat(root, 'generate');

  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /Tsconfig alias conflict/);
});
