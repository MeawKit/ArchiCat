import path from 'node:path';

import type { ArchicatManifest, ResolvedArchicatProject } from '@internal/model';
import { makeRelativeDisplayPath } from '@internal/path';

import { writeJsonFile } from '@internal/generator/file-writer';

// MARK: - Public

export function generateManifest(project: ResolvedArchicatProject): ArchicatManifest {
  const manifest: ArchicatManifest = {
    generatedBy: 'archicat',
    version: 1,
    rootDir: project.rootDir,
    outDir: project.outDir,
    modules: project.modules.map((module) => ({
      id: module.id,
      alias: module.alias,
      dependencies: module.dependencies,
      contractFilePath: makeRelativeDisplayPath(project.rootDir, module.contractFilePath),
      moduleDir: makeRelativeDisplayPath(project.rootDir, module.moduleDir),
      ...(module.apiRootPath ? { apiRootPath: makeRelativeDisplayPath(project.rootDir, module.apiRootPath) } : {}),
      ...(module.implRootPath ? { implRootPath: makeRelativeDisplayPath(project.rootDir, module.implRootPath) } : {}),
      mirrorApiRootPath: makeRelativeDisplayPath(project.rootDir, module.mirrorApiRootPath),
      mirrorImplRootPath: makeRelativeDisplayPath(project.rootDir, module.mirrorImplRootPath),
    })),
  };

  writeJsonFile(path.join(project.outDir, 'manifest.json'), manifest);
  return manifest;
}
