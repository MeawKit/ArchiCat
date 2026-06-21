import path from 'node:path';

import { writeJsonFile, writeTextFile } from '@internal/generator/file-writer';
import type { ResolvedArchicatProject } from '@internal/model';

// MARK: - Public

export function generateGraph(project: ResolvedArchicatProject): void {
  const graph = {
    modules: project.modules.map((module) => ({
      id: module.id,
      dependencies: module.dependencies,
    })),
  };

  writeJsonFile(path.join(project.outDir, 'report', 'module-graph.json'), graph);
  writeTextFile(path.join(project.outDir, 'report', 'module-graph.mmd'), generateMermaid(project));
}

// MARK: - Private

function generateMermaid(project: ResolvedArchicatProject): string {
  const lines = ['graph TD'];

  for (const module of project.modules) {
    lines.push(`  ${sanitize(module.id)}[${module.id}]`);

    for (const dependency of module.dependencies) {
      lines.push(`  ${sanitize(module.id)} --> ${sanitize(dependency)}`);
    }
  }

  return `${lines.join('\n')}\n`;
}

function sanitize(value: string): string {
  return value.replace(/[^a-zA-Z0-9_]/gu, '_');
}
