import { afterAll, describe, expect, test } from 'vitest';

import { cleanupConsumerProjects, createConsumerProject, createLibrary, createModule } from '../fixtures/consumer-project';
import { runArchicat } from '../fixtures/run-archicat';

describe('library dependencies', () => {
  afterAll(() => {
    cleanupConsumerProjects();
  });

  test('should allow library implementation to depend on library api', () => {
    const root = createConsumerProject('library-impl-depends-library-api', {
      config: {
        librariesInclude: ['./src/libraries'],
      },
    });

    createLibrary(root, { name: 'error' });
    createLibrary(root, { name: 'cache', implDependencies: ['library.error.api'] });

    const result = runArchicat(root, 'generate');

    expect(result.status, result.stderr).toBe(0);
  });

  test('should reject library dependency on module api', () => {
    const root = createConsumerProject('library-rejects-module-api', {
      config: {
        librariesInclude: ['./src/libraries'],
      },
    });

    createModule(root, { name: 'account' });
    createLibrary(root, { name: 'email', implDependencies: ['module.account.api'] });

    const result = runArchicat(root, 'generate');

    expect(result.status).not.toBe(0);
    expect(result.stderr).toMatch(/Library "email" impl cannot depend on module.api/);
  });

  test('should reject library dependency on library impl', () => {
    const root = createConsumerProject('library-rejects-library-impl', {
      config: {
        librariesInclude: ['./src/libraries'],
      },
    });

    createLibrary(root, { name: 'redis' });
    createLibrary(root, { name: 'cache', implDependencies: ['library.redis.impl'] });

    const result = runArchicat(root, 'generate');

    expect(result.status).not.toBe(0);
    expect(result.stderr).toMatch(/Library "cache" impl cannot depend on library.impl/);
  });
});
