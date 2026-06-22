import fs from 'node:fs';
import path from 'node:path';

import { loadArchicatBuildContext } from '@internal/context';
import type { ResolvedArchicatProject } from '@internal/model';

import { resetDirectory } from '@internal/generator/file-writer';
import { generateGraphTypes } from '@internal/generator/generate-graph-types';
import { generateMirrors } from '@internal/generator/generate-mirrors';
import { generateReport } from '@internal/generator/generate-report';
import { generateTsconfig } from '@internal/generator/generate-tsconfig';

// MARK: - Artifact generation

export async function generate(configFileName?: string): Promise<ResolvedArchicatProject> {
  const project = await loadArchicatBuildContext(configFileName);

  if (path.resolve(project.outDir) === path.resolve(project.rootDir)) {
    throw new Error('Archicat outDir cannot be the project root.');
  }

  resetDirectory(project.outDir);
  fs.mkdirSync(path.join(project.outDir, 'modules'), { recursive: true });
  fs.mkdirSync(path.join(project.outDir, 'libraries'), { recursive: true });
  fs.mkdirSync(path.join(project.outDir, 'types'), { recursive: true });
  fs.mkdirSync(project.reportsDir, { recursive: true });
  generateMirrors(project.definitions);
  generateGraphTypes(project);
  generateTsconfig(project);
  generateReport(project);

  return project;
}
