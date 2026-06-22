import { afterAll, describe, expect, test } from 'vitest';

import { cleanupConsumerProjects, createConsumerProject, createModule } from '../fixtures/consumer-project';
import { runArchicat } from '../fixtures/run-archicat';

describe('import boundary validator', () => {
  afterAll(() => {
    cleanupConsumerProjects();
  });

  test('should reject cross-module source imports', () => {
    const root = createConsumerProject('validator-cross-module-source-import');

    createModule(root, { name: 'account' });
    createModule(root, {
      name: 'media',
      implDependencies: ['module.account.api'],
      implIndex: `
        import { accountApi } from '../../account/api/index.js';
        export const mediaImpl = accountApi;
      `,
    });

    expect(runArchicat(root, 'generate').status).toBe(0);

    const result = runArchicat(root, 'check');

    expect(result.status).not.toBe(0);
    expect(result.stderr).toMatch(/imports Module "account"/);
  });
});
