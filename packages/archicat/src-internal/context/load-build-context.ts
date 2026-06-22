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
  const appFiles = discoverDefinitionFiles(
    loadedConfig.rootDir,
    loadedConfig.resolvedConfig.apps.include,
    'archicat.app.ts',
  );

  if (moduleFiles.length === 0 && libraryFiles.length === 0 && appFiles.length === 0) {
    throw new Error('No Archicat definition files matched configured include roots.');
  }

  const loadedDefinitions: LoadedArchicatDefinition[] = [
    ...(await Promise.all(moduleFiles.map((file) => loadArchicatDefinition(file, 'module')))),
    ...(await Promise.all(libraryFiles.map((file) => loadArchicatDefinition(file, 'library')))),
    ...(await Promise.all(appFiles.map((file) => loadArchicatDefinition(file, 'app')))),
  ];

  return resolveArchicatProject(loadedConfig, loadedDefinitions);
}
