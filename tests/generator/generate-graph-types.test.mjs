import assert from 'node:assert/strict';
import path from 'node:path';
import test from 'node:test';

import { cleanupConsumerProjects, createConsumerProject, createLibrary, createModule } from '../fixtures/consumer-project.mjs';
import { readText } from '../fixtures/files.mjs';
import { runArchicat } from '../fixtures/run-archicat.mjs';

test.after(() => {
  cleanupConsumerProjects();
});

test('should generate project graph dependency types', () => {
  const root = createConsumerProject('generate-graph-types', {
    config: {
      librariesInclude: ['./src/libraries'],
    },
  });

  createLibrary(root, { id: 'backend' });
  createModule(root, { id: 'account' });

  const result = runArchicat(root, 'generate');

  assert.equal(result.status, 0, result.stderr);

  const graphTypes = readText(path.join(root, '.archicat/types/graph.d.ts'));

  assert.match(graphTypes, /interface ArchicatProjectGraph/);
  assert.match(graphTypes, /'module\.account\.api': true/);
  assert.match(graphTypes, /'module\.account\.impl': true/);
  assert.match(graphTypes, /'library\.backend\.api': true/);
});
