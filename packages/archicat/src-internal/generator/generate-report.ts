import path from 'node:path';

import type { ArchicatBuildReport, ResolvedArchicatDefinition, ResolvedArchicatProject } from '@internal/model';
import { makeRelativeDisplayPath } from '@internal/path';

import { writeJsonFile } from '@internal/generator/file-writer';

// MARK: - Public

export function generateReport(project: ResolvedArchicatProject): void {
  writeJsonFile(path.join(project.reportDir, 'build.json'), makeBuildReport(project));
}

// MARK: - Private

function makeBuildReport(project: ResolvedArchicatProject): ArchicatBuildReport {
  return {
    generatedBy: 'archicat',
    schemaVersion: 1,
    prefixes: project.config.prefixes,
    targets: project.graph.targets.map((target) => target.key),
    definitions: project.definitions.map((definition) => makeDefinitionReport(project, definition)),
    dependencies: project.graph.dependencies,
  };
}

function makeDefinitionReport(project: ResolvedArchicatProject, definition: ResolvedArchicatDefinition): ArchicatBuildReport['definitions'][number] {
  if (definition.kind === 'module') {
    return {
      kind: definition.kind,
      id: definition.id,
      targets: {
        api: definition.apiTarget,
        impl: definition.implTarget,
      },
      aliases: {
        api: definition.alias,
      },
      dependencies: definition.dependencies,
      contractFilePath: makeRelativeDisplayPath(project.rootDir, definition.contractFilePath),
      source: {
        root: makeRelativeDisplayPath(project.rootDir, definition.definitionDir),
        api: definition.apiRootPath ? makeRelativeDisplayPath(project.rootDir, definition.apiRootPath) : undefined,
        impl: definition.implRootPath ? makeRelativeDisplayPath(project.rootDir, definition.implRootPath) : undefined,
      },
      mirror: {
        api: makeRelativeDisplayPath(project.rootDir, definition.mirrorApiRootPath),
        impl: makeRelativeDisplayPath(project.rootDir, definition.mirrorImplRootPath),
      },
    };
  }

  return {
    kind: definition.kind,
    id: definition.id,
    targets: {
      api: definition.apiTarget,
    },
    aliases: {
      api: definition.alias,
    },
    dependencies: definition.dependencies,
    contractFilePath: makeRelativeDisplayPath(project.rootDir, definition.contractFilePath),
    source: {
      root: makeRelativeDisplayPath(project.rootDir, definition.definitionDir),
      api: definition.apiRootPath ? makeRelativeDisplayPath(project.rootDir, definition.apiRootPath) : undefined,
    },
    mirror: {
      api: makeRelativeDisplayPath(project.rootDir, definition.mirrorApiRootPath),
    },
  };
}
