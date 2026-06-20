import path from 'node:path';
import { fileURLToPath } from 'node:url';

export const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
export const cliPath = path.join(repoRoot, 'packages/codegen/bin/archicat.mjs');
export const codegenPackageRoot = path.join(repoRoot, 'packages/codegen');
export const tmpRoot = path.join(repoRoot, 'tests/.tmp');
