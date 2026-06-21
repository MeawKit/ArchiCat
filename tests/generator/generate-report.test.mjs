import assert from 'node:assert/strict';
import path from 'node:path';
import test from 'node:test';

import { cleanupConsumerProjects, createConsumerProject, createLibrary, createModule } from '../fixtures/consumer-project.mjs';
import { assertFileExists, readJson } from '../fixtures/files.mjs';
import { runArchicat } from '../fixtures/run-archicat.mjs';

test.after(() => {
  cleanupConsumerProjects();
});

test('should generate build report with modules, libraries, targets, and dependency origins', () => {
  const root = createConsumerProject('generate-build-report', {
    config: {
      librariesInclude: ['./src/libraries'],
    },
  });

  createLibrary(root, { id: 'backend' });
  createModule(root, { id: 'account' });
  createModule(root, {
    id: 'media',
    dependencies: ['module.account.api', 'library.backend.api'],
  });

  const result = runArchicat(root, 'generate');

  assert.equal(result.status, 0, result.stderr);
  assertFileExists(path.join(root, 'archicat-report/build.json'));

  const report = readJson(path.join(root, 'archicat-report/build.json'));

  assert.equal(report.schemaVersion, 1);
  assert.deepEqual(report.prefixes, {
    module: '@module',
    library: '@library',
  });
  assert.ok(report.targets.includes('module.account.api'));
  assert.ok(report.targets.includes('module.account.impl'));
  assert.ok(report.targets.includes('module.media.api'));
  assert.ok(report.targets.includes('module.media.impl'));
  assert.ok(report.targets.includes('library.backend.api'));
  assert.ok(report.dependencies.some((dependency) => dependency.origin === 'derived'));
  assert.ok(report.dependencies.some((dependency) => dependency.origin === 'declared'));
});
