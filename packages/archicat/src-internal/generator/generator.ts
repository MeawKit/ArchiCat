import path from 'node:path';

import { loadResolvedArchicatProject } from '@internal/configuration';
import { generateGraph } from '@internal/graph';
import type { ResolvedArchicatProject } from '@internal/model';

import { resetDirectory } from '@internal/generator/file-writer';
import { generateComposition } from '@internal/generator/generate-composition';
import { generateManifest } from '@internal/generator/generate-manifest';
import { generateModuleMirrors } from '@internal/generator/generate-mirrors';
import { generateTsconfig } from '@internal/generator/generate-tsconfig';

// MARK: - Public

export async function generate(configFileName?: string): Promise<ResolvedArchicatProject> {
  const project = await loadResolvedArchicatProject(configFileName);

  if (path.resolve(project.outDir) === path.resolve(project.rootDir)) {
    throw new Error('ArchiCat outDir cannot be the project root.');
  }

  resetDirectory(project.outDir);
  generateModuleMirrors(project.modules);
  generateTsconfig(project);
  generateManifest(project);
  generateComposition(project);
  generateGraph(project);

  return project;
}
