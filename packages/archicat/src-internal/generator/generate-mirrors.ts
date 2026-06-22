import path from 'node:path';

import type {
  ResolvedArchicatDefinition,
  ResolvedArchicatLibrary,
  ResolvedArchicatModule,
  ResolvedArchicatSurface,
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
        generateLibraryMirror(definition);
        break;
    }
  }
}

// MARK: - Private

function generateModuleMirror(module: ResolvedArchicatModule): void {
  generateApiMirror(module.api);
  generateImplMirror(module, 'module');
}

function generateLibraryMirror(library: ResolvedArchicatLibrary): void {
  generateApiMirror(library.api);
  generateImplMirror(library, 'library');
}

function generateApiMirror(surface: ResolvedArchicatSurface): void {
  if (!surface.rootPath) {
    writeTextFile(path.join(surface.mirrorRootPath, 'index.ts'), `${makeMirrorHeader()}export {};
`);
    return;
  }

  const apiFiles = listTypeScriptFiles(surface.rootPath);
  const mirroredRelativePaths = new Set<string>();

  for (const sourceFilePath of apiFiles) {
    const relativePath = normalizePath(path.relative(surface.rootPath, sourceFilePath));
    mirroredRelativePaths.add(relativePath);
    writeMirrorFile(path.join(surface.mirrorRootPath, relativePath), sourceFilePath);
  }

  if (!mirroredRelativePaths.has('index.ts')) {
    writeTextFile(path.join(surface.mirrorRootPath, 'index.ts'), `${makeMirrorHeader()}export {};
`);
  }
}

function generateImplMirror(definition: ResolvedArchicatModule | ResolvedArchicatLibrary, kind: 'module' | 'library'): void {
  const implIndexPath = definition.impl.rootPath ? findIndexFile(definition.impl.rootPath) : undefined;

  if (!implIndexPath) {
    const constName = kind === 'module' ? 'ArchicatModuleImplementation' : 'ArchicatLibraryImplementation';
    const content = `${makeMirrorHeader()}
export const ${constName} = {
  name: '${definition.name}',
  assemblies: [],
  schemas: [],
  routes: [],
} as const;

export default ${constName};
`;

    writeTextFile(path.join(definition.impl.mirrorRootPath, 'index.ts'), content);
    return;
  }

  writeMirrorFile(path.join(definition.impl.mirrorRootPath, 'index.ts'), implIndexPath);
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
