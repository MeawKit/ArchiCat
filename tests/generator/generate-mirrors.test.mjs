import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';

import { cleanupConsumerProjects, createConsumerProject, createModule } from '../fixtures/consumer-project.mjs';
import { assertFileExists, readText, writeFile } from '../fixtures/files.mjs';
import { runArchicat } from '../fixtures/run-archicat.mjs';

test.after(() => {
  cleanupConsumerProjects();
});

test('should generate module api and implementation mirrors', () => {
  const root = createConsumerProject('generate-module-mirrors');

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

  const result = runArchicat(root, 'generate');

  assert.equal(result.status, 0, result.stderr);

  assertFileExists(path.join(root, '.archicat/modules/account/api/index.ts'));
  assertFileExists(path.join(root, '.archicat/modules/account/api/reader.ts'));
  assertFileExists(path.join(root, '.archicat/modules/account/api/session/context.ts'));
  assertFileExists(path.join(root, '.archicat/modules/account/impl/index.ts'));

  const mirroredIndex = readText(path.join(root, '.archicat/modules/account/api/index.ts'));
  const mirroredReader = readText(path.join(root, '.archicat/modules/account/api/reader.ts'));
  const mirroredContext = readText(path.join(root, '.archicat/modules/account/api/session/context.ts'));

  assert.match(mirroredIndex, /^\/\/ Mirrored by Archicat\./);
  assert.match(mirroredIndex, /export \* from/);
  assert.match(mirroredIndex, /export \{ default \} from/);
  assert.match(mirroredReader, /export \{ default \} from/);
  assert.match(mirroredContext, /export \* from/);
});

test('should generate empty api and no-op implementation mirrors when surfaces are omitted', () => {
  const root = createConsumerProject('generate-empty-surfaces');

  createModule(root, { id: 'account', api: false, impl: false });

  const result = runArchicat(root, 'generate');

  assert.equal(result.status, 0, result.stderr);
  assert.match(readText(path.join(root, '.archicat/modules/account/api/index.ts')), /export \{\};/);
  assert.match(readText(path.join(root, '.archicat/modules/account/impl/index.ts')), /ArchicatModuleImplementation/);
});

test('should generate clean output tree', () => {
  const root = createConsumerProject('generate-clean-output');

  createModule(root, { id: 'account' });

  const result = runArchicat(root, 'generate');

  assert.equal(result.status, 0, result.stderr);

  assert.deepEqual(readDirectoryNames(path.join(root, '.archicat')).sort(), [
    'modules',
    'tsconfig.json',
    'types',
  ]);

  assert.deepEqual(readDirectoryNames(path.join(root, 'archicat-report')).sort(), [
    'build.json',
  ]);
});

function readDirectoryNames(directoryPath) {
  return fs.readdirSync(directoryPath);
}
