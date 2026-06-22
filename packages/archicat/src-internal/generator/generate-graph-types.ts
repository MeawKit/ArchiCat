import path from 'node:path';

import type { ResolvedArchicatProject } from '@internal/model';

import { writeTextFile } from '@internal/generator/file-writer';

// MARK: - Public

export function generateGraphTypes(project: ResolvedArchicatProject): void {
  const moduleApiDependencies = [...project.modules.map((module) => module.apiTarget), ...project.libraries.map((library) => library.apiTarget)];
  const moduleImplDependencies = moduleApiDependencies;
  const libraryApiDependencies = project.libraries.map((library) => library.apiTarget);
  const libraryImplDependencies = libraryApiDependencies;
  const appDependencies = project.graph.targets.map((target) => target.key);

  const content = `import 'archicat';

declare module 'archicat' {
${renderInterface('ArchicatModuleApiDependencies', moduleApiDependencies)}

${renderInterface('ArchicatModuleImplDependencies', moduleImplDependencies)}

${renderInterface('ArchicatLibraryApiDependencies', libraryApiDependencies)}

${renderInterface('ArchicatLibraryImplDependencies', libraryImplDependencies)}

${renderInterface('ArchicatAppDependencies', appDependencies)}
}

export {};
`;

  writeTextFile(path.join(project.outDir, 'types', 'graph.d.ts'), content);
}

// MARK: - Private

function renderInterface(name: string, entries: readonly string[]): string {
  const body = Array.from(new Set(entries)).sort((a, b) => a.localeCompare(b)).map((entry) => `    '${entry}': true;`).join('\n');

  return `  interface ${name} {\n${body}\n  }`;
}
