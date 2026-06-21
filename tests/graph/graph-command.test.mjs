import assert from 'node:assert/strict';
import test from 'node:test';

import { cleanupConsumerProjects, createConsumerProject, createLibrary, createModule } from '../fixtures/consumer-project.mjs';
import { runArchicat } from '../fixtures/run-archicat.mjs';

test.after(() => {
  cleanupConsumerProjects();
});

test('should print resolved modules, libraries, and dependsOn graph without writing files', () => {
  const root = createConsumerProject('graph-command', {
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

  const result = runArchicat(root, 'graph');

  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /Modules: 2/);
  assert.match(result.stdout, /account\n  api: module\.account\.api\n  impl: module\.account\.impl/);
  assert.match(result.stdout, /dependsOn:\n    module\.account\.api \(derived\)/);
  assert.match(result.stdout, /media\n  api: module\.media\.api\n  impl: module\.media\.impl/);
  assert.match(result.stdout, /module\.account\.api/);
  assert.match(result.stdout, /library\.backend\.api/);
  assert.match(result.stdout, /Libraries: 1/);
  assert.match(result.stdout, /backend\n  api: library\.backend\.api/);
});
