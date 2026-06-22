import fs from 'node:fs';
import path from 'node:path';

import { loadArchicatBuildContext } from '@internal/context';
import type { ResolvedArchicatProject } from '@internal/model';
import { formatViolation, validateProject } from '@internal/validator';

import { resetDirectory } from '@internal/generator/file-writer';
import { generateGraphTypes } from '@internal/generator/generate-graph-types';
import { generateMirrors } from '@internal/generator/generate-mirrors';
import { generateReport } from '@internal/generator/generate-report';
import { generateTsconfig } from '@internal/generator/generate-tsconfig';

// MARK: - Artifact generation

export async function generate(configFileName?: string): Promise<ResolvedArchicatProject> {
  const project = await loadArchicatBuildContext(configFileName);
  assertBuildableProject(project);

  const violations = validateProject(project);

  if (violations.length > 0) {
    throw new Error(['Architecture validation failed.', ...violations.map(formatViolation)].join('\n'));
  }

  generateArtifacts(project);
  return project;
}

export function generateArtifacts(project: ResolvedArchicatProject): void {
  assertBuildableProject(project);

  resetDirectory(project.outDir);
  fs.mkdirSync(path.join(project.outDir, 'modules'), { recursive: true });
  fs.mkdirSync(path.join(project.outDir, 'libraries'), { recursive: true });
  fs.mkdirSync(path.join(project.outDir, 'types'), { recursive: true });
  fs.mkdirSync(project.reportsDir, { recursive: true });
  generateMirrors(project.definitions);
  generateGraphTypes(project);
  generateTsconfig(project);
  generateReport(project);
}

// MARK: - Private

function assertBuildableProject(project: ResolvedArchicatProject): void {
  if (path.resolve(project.outDir) === path.resolve(project.rootDir)) {
    throw new Error('Archicat outDir cannot be the project root.');
  }
}
