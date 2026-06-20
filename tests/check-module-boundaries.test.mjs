import assert from 'node:assert/strict';
import test from 'node:test';

import { cleanupConsumerProjects, createConsumerProject, createModule } from './helpers/consumer-project.mjs';
import { runArchicat } from './helpers/run-archicat.mjs';

test.after(() => {
  cleanupConsumerProjects();
});

test('check allows alias imports when the target module is an explicit dependency', () => {
  const root = createConsumerProject('check-declared-dependency');

  createModule(root, { id: 'account' });
  createModule(root, {
    id: 'events',
    dependencies: ['account'],
    implIndex: `
      import { accountApi } from '@account';
      export const eventsImpl = accountApi;
    `,
  });

  assert.equal(runArchicat(root, 'generate').status, 0);

  const result = runArchicat(root, 'check');

  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /Architecture check passed/);
});

test('check rejects alias imports that are not declared as dependencies', () => {
  const root = createConsumerProject('check-missing-dependency');

  createModule(root, { id: 'account' });
  createModule(root, {
    id: 'events',
    implIndex: `
      import { accountApi } from '@account';
      export const eventsImpl = accountApi;
    `,
  });

  assert.equal(runArchicat(root, 'generate').status, 0);

  const result = runArchicat(root, 'check');

  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /Module "events" imports "account" but does not declare it in dependencies/);
});

test('check rejects cross-module source imports even when the dependency is declared', () => {
  const root = createConsumerProject('check-relative-source-import');

  createModule(root, { id: 'account' });
  createModule(root, {
    id: 'events',
    dependencies: ['account'],
    implIndex: `
      import { accountApi } from '../../account/api/index.js';
      export const eventsImpl = accountApi;
    `,
  });

  assert.equal(runArchicat(root, 'generate').status, 0);

  const result = runArchicat(root, 'check');

  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /imports module "account" through a source path/);
});

test('check rejects declared module dependency cycles', () => {
  const root = createConsumerProject('check-dependency-cycle');

  createModule(root, { id: 'account', dependencies: ['events'] });
  createModule(root, { id: 'events', dependencies: ['account'] });

  assert.equal(runArchicat(root, 'generate').status, 0);

  const result = runArchicat(root, 'check');

  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /Cyclic ArchiCat module dependency/);
});
