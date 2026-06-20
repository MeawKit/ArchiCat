import { loadArchicatConfig, loadArchicatModule, resolveModuleContractPatterns } from '@internal/loader';
import type { ResolvedArchicatProject } from '@internal/model';

import { resolveArchicatProject } from '@internal/configuration/resolve-project';

// MARK: - Public

export async function loadResolvedArchicatProject(configFileName?: string): Promise<ResolvedArchicatProject> {
  const loadedConfig = await loadArchicatConfig(configFileName);
  const moduleFiles = resolveModuleContractPatterns(loadedConfig.rootDir, loadedConfig.config.modules.include);

  if (moduleFiles.length === 0) {
    throw new Error('No ArchiCat module contracts matched modules.include.');
  }

  const loadedModules = await Promise.all(moduleFiles.map((file) => loadArchicatModule(file)));
  return resolveArchicatProject(loadedConfig, loadedModules);
}
