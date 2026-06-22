import fs from 'node:fs';
import path from 'node:path';
import { afterAll, describe, expect, test } from 'vitest';

import { cleanupConsumerProjects, createConsumerProject, createModule } from '../fixtures/consumer-project';
import { assertFileExists, readText, writeFile } from '../fixtures/files';
import { runArchicat } from '../fixtures/run-archicat';

describe('mirror generation', () => {
  afterAll(() => {
    cleanupConsumerProjects();
  });

  test('should generate module api and implementation mirrors', () => {
    const root = createConsumerProject('generate-module-mirrors');

    createModule(root, {
      name: 'account',
      apiIndex: `
        export { default } from './reader.js';
        export * from './session/context.js';
      `,
    });

    writeFile(path.join(root, 'src/modules/account/api/reader.ts'), `
      export default class AccountReader {}
    `);

    writeFile(path.join(root, 'src/modules/account/api/session/context.ts'), `
      export interface AccountSessionContext {
        accountId: string;
      }
    `);

    const result = runArchicat(root, 'generate');

    expect(result.status, result.stderr).toBe(0);

    assertFileExists(path.join(root, '.archicat/modules/account/api/index.ts'));
    assertFileExists(path.join(root, '.archicat/modules/account/api/reader.ts'));
    assertFileExists(path.join(root, '.archicat/modules/account/api/session/context.ts'));
    assertFileExists(path.join(root, '.archicat/modules/account/impl/index.ts'));

    const mirroredIndex = readText(path.join(root, '.archicat/modules/account/api/index.ts'));
    const mirroredReader = readText(path.join(root, '.archicat/modules/account/api/reader.ts'));
    const mirroredContext = readText(path.join(root, '.archicat/modules/account/api/session/context.ts'));

    expect(mirroredIndex).toMatch(/^\/\/ Mirrored by Archicat\./);
    expect(mirroredIndex).toMatch(/export \* from/);
    expect(mirroredIndex).toMatch(/export \{ default \} from/);
    expect(mirroredReader).toMatch(/export \{ default \} from/);
    expect(mirroredContext).toMatch(/export \* from/);
  });

  test('should generate empty api and no-op implementation mirrors when surfaces are omitted', () => {
    const root = createConsumerProject('generate-empty-surfaces');

    createModule(root, { name: 'account', api: false, impl: false });

    const result = runArchicat(root, 'generate');

    expect(result.status, result.stderr).toBe(0);
    expect(readText(path.join(root, '.archicat/modules/account/api/index.ts'))).toMatch(/export \{\};/);
    expect(readText(path.join(root, '.archicat/modules/account/impl/index.ts'))).toMatch(/ArchicatModuleImplementation/);
  });

  test('should generate clean output tree', () => {
    const root = createConsumerProject('generate-clean-output');

    createModule(root, { name: 'account' });

    const result = runArchicat(root, 'generate');

    expect(result.status, result.stderr).toBe(0);

    expect(readDirectoryNames(path.join(root, '.archicat')).sort()).toEqual([
      'libraries',
      'modules',
      'reports',
      'tsconfig.json',
      'types',
    ]);

    expect(readDirectoryNames(path.join(root, '.archicat/reports')).sort()).toEqual([
      'build.report.json',
      'graph.report.json',
    ]);
  });
});

function readDirectoryNames(directoryPath: string): string[] {
  return fs.readdirSync(directoryPath);
}
