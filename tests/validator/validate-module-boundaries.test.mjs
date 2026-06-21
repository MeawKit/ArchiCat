import assert from 'node:assert/strict';
import test from 'node:test';

import { cleanupConsumerProjects, createConsumerProject, createLibrary, createModule } from '../fixtures/consumer-project.mjs';
import { runArchicat } from '../fixtures/run-archicat.mjs';

test.after(() => {
  cleanupConsumerProjects();
});

test('should allow alias imports when the target module api is declared', () => {
  const root = createConsumerProject('validate-declared-module-dependency');

  createModule(root, { id: 'account' });
  createModule(root, {
    id: 'media',
    dependencies: ['module.account.api'],
    implIndex: `
      import { accountApi } from '@module/account';
      export const mediaImpl = accountApi;
    `,
  });

  assert.equal(runArchicat(root, 'generate').status, 0);

  const result = runArchicat(root, 'check');

  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /Architecture check passed/);
});

test('should allow module implementation to import own api without declaring itself', () => {
  const root = createConsumerProject('validate-own-api');

  createModule(root, {
    id: 'account',
    implIndex: `
      import { accountApi } from '@module/account';
      export const accountImpl = accountApi;
    `,
  });

  assert.equal(runArchicat(root, 'generate').status, 0);

  const result = runArchicat(root, 'check');

  assert.equal(result.status, 0, result.stderr);
});

test('should reject alias imports that are not declared as dependencies', () => {
  const root = createConsumerProject('validate-missing-dependency');

  createModule(root, { id: 'account' });
  createModule(root, {
    id: 'media',
    implIndex: `
      import { accountApi } from '@module/account';
      export const mediaImpl = accountApi;
    `,
  });

  assert.equal(runArchicat(root, 'generate').status, 0);

  const result = runArchicat(root, 'check');

  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /imports "module\.account\.api" but does not declare it in dependencies/);
});

test('should reject cross-module source imports even when dependency is declared', () => {
  const root = createConsumerProject('validate-relative-source-import');

  createModule(root, { id: 'account' });
  createModule(root, {
    id: 'media',
    dependencies: ['module.account.api'],
    implIndex: `
      import { accountApi } from '../../account/api/index.js';
      export const mediaImpl = accountApi;
    `,
  });

  assert.equal(runArchicat(root, 'generate').status, 0);

  const result = runArchicat(root, 'check');

  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /imports module "account" through a source path/);
});

test('should validate library aliases as declared dependencies', () => {
  const root = createConsumerProject('validate-library-dependency', {
    config: {
      librariesInclude: ['./src/libraries'],
    },
  });

  createLibrary(root, { id: 'backend' });
  createModule(root, {
    id: 'media',
    dependencies: ['library.backend.api'],
    implIndex: `
      import { backendLibrary } from '@library/backend';
      export const mediaImpl = backendLibrary;
    `,
  });

  assert.equal(runArchicat(root, 'generate').status, 0);

  const result = runArchicat(root, 'check');

  assert.equal(result.status, 0, result.stderr);
});
