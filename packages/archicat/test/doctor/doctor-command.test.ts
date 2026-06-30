import { afterAll, describe, expect, test } from 'vitest';

import { cleanupConsumerProjects, createConsumerProject, createModule } from '@test/fixtures/consumer-project';
import { runArchicat } from '@test/fixtures/run-archicat';

describe('doctor command', () => {
  afterAll(() => {
    cleanupConsumerProjects();
  });

  test('should pass before generate when source setup is clean', () => {
    const root = createConsumerProject('doctor-before-generate');

    createModule(root, { name: 'account' });

    const result = runArchicat(root, 'doctor');

    expect(result.status, result.stderr).toBe(0);
  });

  test('should pass after build when setup is clean', () => {
    const root = createConsumerProject('doctor-after-build');

    createModule(root, { name: 'account' });

    expect(runArchicat(root, 'build').status).toBe(0);

    const result = runArchicat(root, 'doctor');

    expect(result.status, result.stderr).toBe(0);
  });
});
