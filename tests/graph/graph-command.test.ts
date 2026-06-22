import { afterAll, describe, expect, test } from 'vitest';

import { cleanupConsumerProjects, createApp, createConsumerProject, createLibrary, createModule } from '../fixtures/consumer-project';
import { runArchicat } from '../fixtures/run-archicat';

describe('graph command', () => {
  afterAll(() => {
    cleanupConsumerProjects();
  });

  test('should print resolved modules, libraries, and dependsOn graph without writing files', () => {
    const root = createConsumerProject('graph-command', {
      config: {
        librariesInclude: ['./src/libraries'],
        appsInclude: ['./src/apps'],
      },
    });

    createLibrary(root, { name: 'backend' });
    createModule(root, { name: 'account' });
    createModule(root, {
      name: 'media',
      dependencies: ['module.account.api', 'library.backend.api'],
    });
    createApp(root, { name: 'main-api', dependencies: ['module.media.impl', 'library.backend.impl'] });

    const result = runArchicat(root, 'graph');

    expect(result.status, result.stderr).toBe(0);
    expect(result.stdout).toMatch(/Modules: 2/);
    expect(result.stdout).toMatch(/account\n  api: module\.account\.api\n  api dependsOn: none\n  impl: module\.account\.impl/);
    expect(result.stdout).toMatch(/impl dependsOn:\n    module\.account\.api \(derived\)/);
    expect(result.stdout).toMatch(/media\n  api: module\.media\.api\n  api dependsOn: none\n  impl: module\.media\.impl/);
    expect(result.stdout).toMatch(/module\.account\.api/);
    expect(result.stdout).toMatch(/library\.backend\.api/);
    expect(result.stdout).toMatch(/Libraries: 1/);
    expect(result.stdout).toMatch(/backend\n  api: library\.backend\.api\n  api dependsOn: none\n  impl: library\.backend\.impl/);
    expect(result.stdout).toMatch(/Apps: 1/);
    expect(result.stdout).toMatch(/main-api/);
    expect(result.stdout).toMatch(/module\.media\.impl/);
  });
});
