import path from 'node:path';

import type {
  ResolvedArchicatDefinition,
  ResolvedArchicatLibrary,
  ResolvedArchicatModule,
} from '@internal/model';
import { normalizePath, toPosixRelativeImport } from '@internal/path';
import { hasDefaultExport, listTypeScriptFiles } from '@internal/scanner';

import { writeTextFile } from '@internal/generator/file-writer';

// MARK: - Public

export function generateMirrors(definitions: readonly ResolvedArchicatDefinition[]): void {
  for (const definition of definitions) {
    switch (definition.kind) {
      case 'module':
        generateModuleMirror(definition);
        break;
      case 'library':
        generateApiMirror(definition);
        break;
    }
  }
}

// MARK: - Private

function generateModuleMirror(module: ResolvedArchicatModule): void {
  generateApiMirror(module);
  generateImplMirror(module);
}

function generateApiMirror(definition: ResolvedArchicatModule | ResolvedArchicatLibrary): void {
  if (!definition.apiRootPath) {
    writeTextFile(path.join(definition.mirrorApiRootPath, 'index.ts'), `${makeMirrorHeader()}export {};
`);
    return;
  }

  const apiFiles = listTypeScriptFiles(definition.apiRootPath);
  const mirroredRelativePaths = new Set<string>();

  for (const sourceFilePath of apiFiles) {
    const relativePath = normalizePath(path.relative(definition.apiRootPath, sourceFilePath));
    mirroredRelativePaths.add(relativePath);
    writeMirrorFile(path.join(definition.mirrorApiRootPath, relativePath), sourceFilePath);
  }

  if (!mirroredRelativePaths.has('index.ts')) {
    writeTextFile(path.join(definition.mirrorApiRootPath, 'index.ts'), `${makeMirrorHeader()}export {};
`);
  }
}

function generateImplMirror(module: ResolvedArchicatModule): void {
  const implIndexPath = module.implRootPath ? findIndexFile(module.implRootPath) : undefined;

  if (!implIndexPath) {
    const content = `${makeMirrorHeader()}
export const ArchicatModuleImplementation = {
  id: '${module.id}',
  assemblies: [],
  schemas: [],
  routes: [],
} as const;

export default ArchicatModuleImplementation;
`;

    writeTextFile(path.join(module.mirrorImplRootPath, 'index.ts'), content);
    return;
  }

  writeMirrorFile(path.join(module.mirrorImplRootPath, 'index.ts'), implIndexPath);
}

function writeMirrorFile(targetFilePath: string, sourceFilePath: string): void {
  const sourceImport = toPosixRelativeImport(targetFilePath, sourceFilePath);
  const defaultExport = hasDefaultExport(sourceFilePath) ? `export { default } from '${sourceImport}';\n` : '';
  const content = `${makeMirrorHeader()}
export * from '${sourceImport}';
${defaultExport}`;

  writeTextFile(targetFilePath, content);
}

function findIndexFile(rootPath: string): string | undefined {
  const candidates = ['index.ts', 'index.mts', 'index.cts', 'index.tsx'];

  for (const candidate of candidates) {
    const candidatePath = path.join(rootPath, candidate);

    if (listTypeScriptFiles(candidatePath).length > 0) {
      return candidatePath;
    }
  }

  return undefined;
}

function makeMirrorHeader(): string {
  return '// Mirrored by Archicat.\n';
}
