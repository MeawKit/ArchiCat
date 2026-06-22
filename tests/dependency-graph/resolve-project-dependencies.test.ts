import path from 'node:path';
import { afterAll, describe, expect, test } from 'vitest';

import { cleanupConsumerProjects, createConsumerProject, createModule } from '../fixtures/consumer-project';
import { readJson } from '../fixtures/files';
import { runArchicat } from '../fixtures/run-archicat';

describe('dependency graph', () => {
  afterAll(() => {
    cleanupConsumerProjects();
  });

  test('should derive module implementation dependency on own api', () => {
    const root = createConsumerProject('resolve-derived-own-api');

    createModule(root, { name: 'account' });

    const result = runArchicat(root, 'generate');

    expect(result.status, result.stderr).toBe(0);

    const report = readJson(path.join(root, '.archicat/reports/build.report.json')) as any;

    expect(report.dependencies.find((dependency: any) => dependency.from === 'module.account.impl')).toEqual({
      from: 'module.account.impl',
      to: 'module.account.api',
      origin: 'derived',
    });
  });

  test('should resolve declared module dependencies to project graph targets', () => {
    const root = createConsumerProject('resolve-declared-dependency');

    createModule(root, { name: 'account' });
    createModule(root, { name: 'media', dependencies: ['module.account.api'] });

    const result = runArchicat(root, 'generate');

    expect(result.status, result.stderr).toBe(0);

    const report = readJson(path.join(root, '.archicat/reports/build.report.json')) as any;

    expect(report.dependencies.some((dependency: any) => (
      dependency.from === 'module.media.impl'
      && dependency.to === 'module.account.api'
      && dependency.origin === 'declared'
    ))).toBe(true);
  });

  test('should reject unknown dependency targets', () => {
    const root = createConsumerProject('resolve-unknown-dependency');

    createModule(root, { name: 'media', dependencies: ['module.account.api'] });

    const result = runArchicat(root, 'generate');

    expect(result.status).not.toBe(0);
    expect(result.stderr).toMatch(/unknown dependency "module\.account\.api"/);
  });

  test('should reject declared module dependency cycles', () => {
    const root = createConsumerProject('resolve-dependency-cycle');

    createModule(root, { name: 'account', apiDependencies: ['module.media.api'] });
    createModule(root, { name: 'media', apiDependencies: ['module.account.api'] });

    const result = runArchicat(root, 'generate');

    expect(result.status).not.toBe(0);
    expect(result.stderr).toMatch(/Cyclic Archicat dependency/);
  });
});
