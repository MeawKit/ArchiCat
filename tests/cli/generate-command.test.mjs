import assert from 'node:assert/strict';
import test from 'node:test';

import { cleanupConsumerProjects, createConsumerProject, createLibrary, createModule } from '../fixtures/consumer-project.mjs';
import { runArchicat } from '../fixtures/run-archicat.mjs';

test.after(() => {
  cleanupConsumerProjects();
});

test('should print mirrored module and library counts', () => {
  const root = createConsumerProject('cli-generate-output', {
    config: {
      librariesInclude: ['./src/libraries'],
    },
  });

  createLibrary(root, { id: 'backend' });
  createModule(root, { id: 'account' });
  createModule(root, { id: 'media' });

  const result = runArchicat(root, 'generate');

  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /Mirrored modules: 2/);
  assert.match(result.stdout, /Mirrored libraries: 1/);
});
