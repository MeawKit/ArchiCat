import { describe, expect, test } from 'vitest';

import * as publicApi from '../../packages/archicat/dist/src/index.mjs';

describe('public API', () => {
  test('should expose the consumer-facing Archicat DSL', () => {
    expect(Object.keys(publicApi).sort()).toEqual([
      'defineApp',
      'defineArchicatConfig',
      'defineLibrary',
      'defineModule',
    ]);
  });

  test('should define immutable module contract with safe defaults', () => {
    const module = publicApi.defineModule({ name: 'account' });

    expect(module).toEqual({
      kind: 'module',
      name: 'account',
      api: { dependencies: [] },
      impl: { dependencies: [] },
    });

    expect(() => {
      module.impl.dependencies.push('module.events.api');
    }).toThrow();
  });

  test('should define immutable library contract with safe defaults', () => {
    const library = publicApi.defineLibrary({ name: 'backend' });

    expect(library).toEqual({
      kind: 'library',
      name: 'backend',
      api: { dependencies: [] },
      impl: { dependencies: [] },
    });
  });

  test('should define immutable app contract with safe defaults', () => {
    const app = publicApi.defineApp({ name: 'main-api' });

    expect(app).toEqual({
      kind: 'app',
      name: 'main-api',
      dependencies: [],
    });
  });

  test('should define immutable root config with optional input', () => {
    const config = publicApi.defineArchicatConfig({
      modules: {
        include: ['./src/modules'],
      },
    });

    expect(config.modules.include).toEqual(['./src/modules']);

    expect(() => {
      config.modules.include.push('./other');
    }).toThrow();
  });
});
