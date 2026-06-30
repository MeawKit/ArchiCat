import path from 'node:path';
import { fileURLToPath } from 'node:url';

// MARK: - Fixture paths

const testFixturesRoot = path.dirname(fileURLToPath(import.meta.url));

export const archicatPackageRoot = path.resolve(testFixturesRoot, '../..');
export const repoRoot = path.resolve(archicatPackageRoot, '../..');
export const cliPath = path.join(archicatPackageRoot, 'bin/archicat.mjs');
export const tmpRoot = path.join(archicatPackageRoot, 'test/.tmp');
