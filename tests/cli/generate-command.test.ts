import { afterAll, describe, expect, test } from 'vitest';

import { cleanupConsumerProjects, createApp, createConsumerProject, createLibrary, createModule } from '../fixtures/consumer-project';
import { runArchicat } from '../fixtures/run-archicat';

describe('generate command', () => {
  afterAll(() => {
    cleanupConsumerProjects();
  });

  test('should print mirrored module and library counts', () => {
    const root = createConsumerProject('cli-generate-output', {
      config: {
        librariesInclude: ['./src/libraries'],
        appsInclude: ['./src/apps'],
      },
    });

    createLibrary(root, { name: 'backend' });
    createModule(root, { name: 'account' });
    createModule(root, { name: 'media' });
    createApp(root, { name: 'main-api' });

    const result = runArchicat(root, 'generate');

    expect(result.status, result.stderr).toBe(0);
    expect(result.stdout).toMatch(/Mirrored modules: 2/);
    expect(result.stdout).toMatch(/Mirrored libraries: 1/);
    expect(result.stdout).toMatch(/Resolved apps: 1/);
  });
});
