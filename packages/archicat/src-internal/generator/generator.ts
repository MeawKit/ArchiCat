import path from 'node:path';

import { loadArchicatBuildContext } from '@internal/build';
import type { ResolvedArchicatProject } from '@internal/model';

import { resetDirectory } from '@internal/generator/file-writer';
import { generateGraphTypes } from '@internal/generator/generate-graph-types';
import { generateMirrors } from '@internal/generator/generate-mirrors';
import { generateReport } from '@internal/generator/generate-report';
import { generateTsconfig } from '@internal/generator/generate-tsconfig';

// MARK: - Public

export async function generate(configFileName?: string): Promise<ResolvedArchicatProject> {
  const project = await loadArchicatBuildContext(configFileName);

  if (path.resolve(project.outDir) === path.resolve(project.rootDir)) {
    throw new Error('Archicat outDir cannot be the project root.');
  }

  if (path.resolve(project.reportDir) === path.resolve(project.rootDir)) {
    throw new Error('Archicat reportDir cannot be the project root.');
  }

  resetDirectory(project.outDir);
  resetDirectory(project.reportDir);
  generateMirrors(project.definitions);
  generateGraphTypes(project);
  generateTsconfig(project);
  generateReport(project);

  return project;
}
