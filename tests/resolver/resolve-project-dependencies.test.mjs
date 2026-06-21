import assert from 'node:assert/strict';
import path from 'node:path';
import test from 'node:test';

import { cleanupConsumerProjects, createConsumerProject, createModule } from '../fixtures/consumer-project.mjs';
import { readJson } from '../fixtures/files.mjs';
import { runArchicat } from '../fixtures/run-archicat.mjs';

test.after(() => {
  cleanupConsumerProjects();
});

test('should derive module implementation dependency on own api', () => {
  const root = createConsumerProject('resolve-derived-own-api');

  createModule(root, { id: 'account' });

  const result = runArchicat(root, 'generate');

  assert.equal(result.status, 0, result.stderr);

  const report = readJson(path.join(root, 'archicat-report/build.json'));

  assert.deepEqual(report.dependencies.find((dependency) => dependency.from === 'module.account.impl'), {
    from: 'module.account.impl',
    to: 'module.account.api',
    origin: 'derived',
  });
});

test('should resolve declared module dependencies to project graph targets', () => {
  const root = createConsumerProject('resolve-declared-dependency');

  createModule(root, { id: 'account' });
  createModule(root, { id: 'media', dependencies: ['module.account.api'] });

  const result = runArchicat(root, 'generate');

  assert.equal(result.status, 0, result.stderr);

  const report = readJson(path.join(root, 'archicat-report/build.json'));

  assert.ok(report.dependencies.some((dependency) => (
    dependency.from === 'module.media.impl'
    && dependency.to === 'module.account.api'
    && dependency.origin === 'declared'
  )));
});

test('should reject unknown dependency targets', () => {
  const root = createConsumerProject('resolve-unknown-dependency');

  createModule(root, { id: 'media', dependencies: ['module.account.api'] });

  const result = runArchicat(root, 'generate');

  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /unknown dependency "module\.account\.api"/);
});

test('should reject declared module dependency cycles', () => {
  const root = createConsumerProject('resolve-dependency-cycle');

  createModule(root, { id: 'account', dependencies: ['module.media.api'] });
  createModule(root, { id: 'media', dependencies: ['module.account.api'] });

  const result = runArchicat(root, 'generate');

  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /Cyclic Archicat module dependency/);
});
