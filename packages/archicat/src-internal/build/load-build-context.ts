import { loadArchicatConfig } from '@internal/configuration';
import { discoverDefinitionFiles, loadArchicatDefinition } from '@internal/definitions';
import type { LoadedArchicatDefinition, ResolvedArchicatProject } from '@internal/model';
import { resolveArchicatProject } from '@internal/resolver';

// MARK: - Public

export async function loadArchicatBuildContext(configFileName?: string): Promise<ResolvedArchicatProject> {
  const loadedConfig = await loadArchicatConfig(configFileName);
  const moduleFiles = discoverDefinitionFiles(
    loadedConfig.rootDir,
    loadedConfig.resolvedConfig.modules.include,
    'archicat.module.ts',
  );
  const libraryFiles = discoverDefinitionFiles(
    loadedConfig.rootDir,
    loadedConfig.resolvedConfig.libraries.include,
    'archicat.library.ts',
  );

  if (moduleFiles.length === 0) {
    throw new Error('No Archicat module definitions matched modules.include.');
  }

  const loadedDefinitions: LoadedArchicatDefinition[] = [
    ...(await Promise.all(moduleFiles.map((file) => loadArchicatDefinition(file, 'module')))),
    ...(await Promise.all(libraryFiles.map((file) => loadArchicatDefinition(file, 'library')))),
  ];

  return resolveArchicatProject(loadedConfig, loadedDefinitions);
}
