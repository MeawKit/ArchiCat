import assert from 'node:assert/strict';
import test from 'node:test';

import * as publicApi from '../../packages/archicat/dist/src/index.mjs';

test('should expose the consumer-facing Archicat DSL', () => {
  assert.deepEqual(Object.keys(publicApi).sort(), [
    'defineArchicatConfig',
    'defineLibrary',
    'defineModule',
  ]);
});

test('should define immutable module contract with safe defaults', () => {
  const module = publicApi.defineModule({ id: 'account' });

  assert.deepEqual(module, {
    kind: 'module',
    id: 'account',
    dependencies: [],
  });

  assert.throws(() => {
    module.dependencies.push('module.events.api');
  });
});

test('should define immutable library contract with safe defaults', () => {
  const library = publicApi.defineLibrary({ id: 'backend' });

  assert.deepEqual(library, {
    kind: 'library',
    id: 'backend',
    dependencies: [],
  });
});

test('should define immutable root config with optional input', () => {
  const config = publicApi.defineArchicatConfig({
    modules: {
      include: ['./src/modules'],
    },
  });

  assert.deepEqual(config.modules.include, ['./src/modules']);

  assert.throws(() => {
    config.modules.include.push('./other');
  });
});
