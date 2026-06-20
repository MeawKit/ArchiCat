import assert from 'node:assert/strict';
import path from 'node:path';
import test from 'node:test';

import { cleanupConsumerProjects, createConsumerProject, createModule } from './helpers/consumer-project.mjs';
import { assertFileExists, readJson, readText, writeFile } from './helpers/files.mjs';
import { runArchicat } from './helpers/run-archicat.mjs';

test.after(() => {
  cleanupConsumerProjects();
});

test('generate builds a Nuxt-like module mirror from explicit module contracts', () => {
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
    dependencies: ['account'],
    implIndex: `
      import type { AccountSessionContext } from '@account/session/context';
      export type EventsSession = AccountSessionContext;
    `,
  });

  const result = runArchicat(root, 'generate');

  assert.equal(result.status, 0, result.stderr);

  assertFileExists(path.join(root, '.archicat/manifest.json'));
  assertFileExists(path.join(root, '.archicat/tsconfig.json'));
  assertFileExists(path.join(root, '.archicat/generated/composition.ts'));
  assertFileExists(path.join(root, '.archicat/generated/modules.ts'));
  assertFileExists(path.join(root, '.archicat/report/module-graph.json'));
  assertFileExists(path.join(root, '.archicat/report/module-graph.mmd'));

  const manifest = readJson(path.join(root, '.archicat/manifest.json'));
  assert.deepEqual(
    manifest.modules.map((module) => ({ id: module.id, alias: module.alias, dependencies: module.dependencies })),
    [
      { id: 'account', alias: '@account', dependencies: [] },
      { id: 'events', alias: '@events', dependencies: ['account'] },
    ],
  );

  const tsconfig = readJson(path.join(root, '.archicat/tsconfig.json'));
  assert.deepEqual(tsconfig.compilerOptions.paths['@account'], ['.archicat/modules/account/api/index.ts']);
  assert.deepEqual(tsconfig.compilerOptions.paths['@account/*'], ['.archicat/modules/account/api/*']);
  assert.deepEqual(tsconfig.compilerOptions.paths['#archicat/*'], ['.archicat/generated/*']);

  const mirroredIndex = readText(path.join(root, '.archicat/modules/account/api/index.ts'));
  const mirroredReader = readText(path.join(root, '.archicat/modules/account/api/reader.ts'));
  const mirroredContext = readText(path.join(root, '.archicat/modules/account/api/session/context.ts'));

  assert.match(mirroredIndex, /export \* from/);
  assert.match(mirroredIndex, /export \{ default \} from/);
  assert.match(mirroredReader, /export \{ default \} from/);
  assert.match(mirroredContext, /export \* from/);

  const composition = readText(path.join(root, '.archicat/generated/modules.ts'));
  assert.match(composition, /\.\.\/modules\/account\/impl\/index\.js/);
  assert.match(composition, /\.\.\/modules\/events\/impl\/index\.js/);
});

test('generate creates stable empty API and no-op implementation mirrors for omitted surfaces', () => {
  const root = createConsumerProject('generate-empty-surfaces');
  createModule(root, { id: 'account', api: false, impl: false });

  const result = runArchicat(root, 'generate');

  assert.equal(result.status, 0, result.stderr);

  assert.match(readText(path.join(root, '.archicat/modules/account/api/index.ts')), /export \{\};/);
  assert.match(readText(path.join(root, '.archicat/modules/account/impl/index.ts')), /ArchicatModuleImplementation/);

  const tsconfig = readJson(path.join(root, '.archicat/tsconfig.json'));
  assert.deepEqual(tsconfig.compilerOptions.paths['@account'], ['.archicat/modules/account/api/index.ts']);
  assert.deepEqual(tsconfig.compilerOptions.paths['@account/*'], ['.archicat/modules/account/api/*']);
});
