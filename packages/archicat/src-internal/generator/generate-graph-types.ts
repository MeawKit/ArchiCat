import path from 'node:path';

import type { ResolvedArchicatProject } from '@internal/model';

import { writeTextFile } from '@internal/generator/file-writer';

// MARK: - Public

export function generateGraphTypes(project: ResolvedArchicatProject): void {
  const entries = project.graph.targets.map((target) => `    '${target.key}': true;`).join('\n');
  const content = `declare module 'archicat' {
  interface ArchicatProjectGraph {
${entries}
  }
}

export {};
`;

  writeTextFile(path.join(project.outDir, 'types', 'graph.d.ts'), content);
}
