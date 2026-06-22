import path from 'node:path';
import { afterAll, describe, expect, test } from 'vitest';

import { cleanupConsumerProjects, createConsumerProject, createLibrary, createModule } from '../fixtures/consumer-project';
import { assertFileExists, readJson } from '../fixtures/files';
import { runArchicat } from '../fixtures/run-archicat';

describe('report generation', () => {
  afterAll(() => {
    cleanupConsumerProjects();
  });

  test('should generate build report with modules, libraries, targets, and dependency origins', () => {
    const root = createConsumerProject('generate-build-report', {
      config: {
        librariesInclude: ['./src/libraries'],
      },
    });

    createLibrary(root, { name: 'backend' });
    createModule(root, { name: 'account' });
    createModule(root, {
      name: 'media',
      dependencies: ['module.account.api', 'library.backend.api'],
    });

    const result = runArchicat(root, 'generate');

    expect(result.status, result.stderr).toBe(0);
    assertFileExists(path.join(root, '.archicat/reports/build.report.json'));
    assertFileExists(path.join(root, '.archicat/reports/graph.report.json'));

    const report = readJson(path.join(root, '.archicat/reports/build.report.json')) as any;

    expect(report.schemaVersion).toBe(1);
    expect(report.prefixes).toEqual({
      module: '@module',
      library: '@library',
    });
    expect(report.targets).toContain('module.account.api');
    expect(report.targets).toContain('module.account.impl');
    expect(report.targets).toContain('module.media.api');
    expect(report.targets).toContain('module.media.impl');
    expect(report.targets).toContain('library.backend.api');
    expect(report.targets).toContain('library.backend.impl');
    expect(report.dependencies.some((dependency: any) => dependency.origin === 'derived')).toBe(true);
    expect(report.dependencies.some((dependency: any) => dependency.origin === 'declared')).toBe(true);
  });
});
