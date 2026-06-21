import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';

import { cleanupConsumerProjects, createConsumerProject, createModule } from './helpers/consumer-project.mjs';
import { assertFileExists, readJson, readText, writeFile } from './helpers/files.mjs';
import { runArchicat } from './helpers/run-archicat.mjs';

test.after(() => {
  cleanupConsumerProjects();
});

test('generate builds a module mirror, project graph, report, and graph types', () => {
  const root = createConsumerProject('generate-module-mirror');

  createModule(root, {
    id: 'account',
    apiIndex: `
      export { default } from './reader.js';
      export * from './session/context.js';
    `,
  });

  writeFile(path.join(root, 'src/modules/account/api/reader.ts'), `
    export default class AccountReader {}
  `);

  writeFile(path.join(root, 'src/modules/account/api/session/context.ts'), `
    export interface AccountSessionContext {
      accountId: string;
    }
  `);

  createModule(root, {
    id: 'events',
    dependencies: ['module.account.api'],
    implIndex: `
      import type { AccountSessionContext } from '@module/account/session/context';
      export type EventsSession = AccountSessionContext;
    `,
  });

  const result = runArchicat(root, 'generate');

  assert.equal(result.status, 0, result.stderr);

  assertFileExists(path.join(root, '.archicat/tsconfig.json'));
  assertFileExists(path.join(root, '.archicat/types/graph.d.ts'));
  assertFileExists(path.join(root, '.archicat/modules/account/api/index.ts'));
  assertFileExists(path.join(root, '.archicat/modules/account/impl/index.ts'));
  assertFileExists(path.join(root, 'archicat-report/build.json'));
  assertFileExists(path.join(root, 'archicat-report/graph.mmd'));

  assert.equal(fs.existsSync(path.join(root, '.archicat/manifest.json')), false);
  assert.equal(fs.existsSync(path.join(root, '.archicat/generated')), false);
  assert.equal(fs.existsSync(path.join(root, '.archicat/report')), false);

  const report = readJson(path.join(root, 'archicat-report/build.json'));
  assert.equal(report.schemaVersion, 1);
  assert.deepEqual(report.prefixes, {
    module: '@module',
    library: '@library',
  });
  assert.deepEqual(report.targets, [
    'module.account.api',
    'module.account.impl',
    'module.events.api',
    'module.events.impl',
  ]);

  const tsconfig = readJson(path.join(root, '.archicat/tsconfig.json'));
  assert.equal('baseUrl' in tsconfig.compilerOptions, false);
  assert.deepEqual(tsconfig.compilerOptions.paths['@module/account'], ['./modules/account/api/index.ts']);
  assert.deepEqual(tsconfig.compilerOptions.paths['@module/account/*'], ['./modules/account/api/*']);

  const graphTypes = readText(path.join(root, '.archicat/types/graph.d.ts'));
  assert.match(graphTypes, /interface ArchicatProjectGraph/);
  assert.match(graphTypes, /'module\.account\.api': true/);
  assert.match(graphTypes, /'module\.account\.impl': true/);

  const mirroredIndex = readText(path.join(root, '.archicat/modules/account/api/index.ts'));
  const mirroredReader = readText(path.join(root, '.archicat/modules/account/api/reader.ts'));
  const mirroredContext = readText(path.join(root, '.archicat/modules/account/api/session/context.ts'));

  assert.match(mirroredIndex, /^\/\/ Mirrored by Archicat\./);
  assert.match(mirroredIndex, /export \* from/);
  assert.match(mirroredIndex, /export \{ default \} from/);
  assert.match(mirroredReader, /export \{ default \} from/);
  assert.match(mirroredContext, /export \* from/);
});

test('generate creates stable empty API and no-op implementation mirrors for omitted surfaces', () => {
  const root = createConsumerProject('generate-empty-surfaces');
  createModule(root, { id: 'account', api: false, impl: false });

  const result = runArchicat(root, 'generate');

  assert.equal(result.status, 0, result.stderr);

  assert.match(readText(path.join(root, '.archicat/modules/account/api/index.ts')), /export \{\};/);
  assert.match(readText(path.join(root, '.archicat/modules/account/impl/index.ts')), /ArchicatModuleImplementation/);

  const tsconfig = readJson(path.join(root, '.archicat/tsconfig.json'));
  assert.deepEqual(tsconfig.compilerOptions.paths['@module/account'], ['./modules/account/api/index.ts']);
  assert.deepEqual(tsconfig.compilerOptions.paths['@module/account/*'], ['./modules/account/api/*']);
});

test('generate merges user tsconfig paths and rejects Archicat prefix conflicts', () => {
  const root = createConsumerProject('generate-tsconfig-merge', {
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

  createModule(root, { id: 'account' });

  const result = runArchicat(root, 'generate');
  assert.equal(result.status, 0, result.stderr);

  const tsconfig = readJson(path.join(root, '.archicat/tsconfig.json'));
  assert.deepEqual(tsconfig.compilerOptions.paths['@app/*'], ['../src/*']);
  assert.deepEqual(tsconfig.compilerOptions.paths['@module/account'], ['./modules/account/api/index.ts']);

  const conflictRoot = createConsumerProject('generate-tsconfig-conflict', {
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

  createModule(conflictRoot, { id: 'account' });

  const conflict = runArchicat(conflictRoot, 'generate');
  assert.notEqual(conflict.status, 0);
  assert.match(conflict.stderr, /Tsconfig alias conflict/);
});
