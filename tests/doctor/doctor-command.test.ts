import { afterAll, describe, expect, test } from 'vitest';

import { cleanupConsumerProjects, createConsumerProject, createModule } from '../fixtures/consumer-project';
import { runArchicat } from '../fixtures/run-archicat';

describe('doctor command', () => {
  afterAll(() => {
    cleanupConsumerProjects();
  });

  test('should warn when generated tsconfig does not exist yet', () => {
    const root = createConsumerProject('doctor-before-generate');

    createModule(root, { name: 'account' });

    const result = runArchicat(root, 'doctor');

    expect(result.status, result.stderr).toBe(0);
    expect(result.stderr).toMatch(/Generated tsconfig does not exist yet/);
  });

  test('should pass after generate when setup is clean', () => {
    const root = createConsumerProject('doctor-after-generate');

    createModule(root, { name: 'account' });

    expect(runArchicat(root, 'generate').status).toBe(0);

    const result = runArchicat(root, 'doctor');

    expect(result.status, result.stderr).toBe(0);
    expect(result.stdout).toMatch(/Doctor found no issues/);
  });
});
