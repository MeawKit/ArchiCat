import assert from 'node:assert/strict';
import test from 'node:test';

import * as publicApi from '../packages/archicat/dist/src/index.mjs';

test('public package API exposes only the consumer-facing ArchiCat DSL', () => {
  assert.deepEqual(Object.keys(publicApi).sort(), ['defineArchicatConfig', 'defineModule']);
});

test('defineModule creates an immutable module contract with safe defaults', () => {
  const module = publicApi.defineModule({ id: 'account' });

  assert.deepEqual(module, {
    id: 'account',
    dependencies: [],
  });

  assert.throws(() => {
    module.dependencies.push('events');
  });
});

test('defineArchicatConfig creates an immutable root build contract', () => {
  const config = publicApi.defineArchicatConfig({
    root: '.',
    outDir: './.archicat',
    modules: {
      include: ['./src/modules/*/archicat.module.ts'],
    },
  });

  assert.equal(config.root, '.');
  assert.equal(config.outDir, './.archicat');
  assert.deepEqual(config.modules.include, ['./src/modules/*/archicat.module.ts']);

  assert.throws(() => {
    config.modules.include.push('./other.ts');
  });
});
