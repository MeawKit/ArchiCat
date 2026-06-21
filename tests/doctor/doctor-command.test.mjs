import assert from 'node:assert/strict';
import test from 'node:test';

import { cleanupConsumerProjects, createConsumerProject, createModule } from '../fixtures/consumer-project.mjs';
import { runArchicat } from '../fixtures/run-archicat.mjs';

test.after(() => {
  cleanupConsumerProjects();
});

test('should warn when generated tsconfig does not exist yet', () => {
  const root = createConsumerProject('doctor-before-generate');

  createModule(root, { id: 'account' });

  const result = runArchicat(root, 'doctor');

  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stderr, /Generated tsconfig does not exist yet/);
});

test('should pass after generate when setup is clean', () => {
  const root = createConsumerProject('doctor-after-generate');

  createModule(root, { id: 'account' });

  assert.equal(runArchicat(root, 'generate').status, 0);

  const result = runArchicat(root, 'doctor');

  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /Doctor found no issues/);
});
