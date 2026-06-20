import fs from 'node:fs';
import path from 'node:path';

import type { LoadedArchicatConfig, LoadedArchicatModule, ResolvedArchicatModule, ResolvedArchicatProject } from '@internal/model';

// MARK: - Public

export function resolveArchicatProject(
  loadedConfig: LoadedArchicatConfig,
  loadedModules: readonly LoadedArchicatModule[],
): ResolvedArchicatProject {
  const modules = loadedModules.map((module) => resolveModule(loadedConfig.outDir, module));

  assertUniqueModules(modules);
  assertDependencyReferences(modules);

  return {
    rootDir: loadedConfig.rootDir,
    outDir: loadedConfig.outDir,
    configFilePath: loadedConfig.configFilePath,
    modules,
  };
}

// MARK: - Private

function resolveModule(outDir: string, loadedModule: LoadedArchicatModule): ResolvedArchicatModule {
  const { contract, contractFilePath, moduleDir } = loadedModule;

  assertValidModuleId(contract.id, contractFilePath);

  const apiRootPath = contract.api ? resolveDeclaredRoot(moduleDir, contract.api, 'api', contract.id) : undefined;
  const implRootPath = contract.impl ? resolveDeclaredRoot(moduleDir, contract.impl, 'impl', contract.id) : undefined;

  return {
    id: contract.id,
    alias: `@${contract.id}`,
    dependencies: [...contract.dependencies],
    contractFilePath,
    moduleDir,
    apiRootPath,
    implRootPath,
    mirrorApiRootPath: path.join(outDir, 'modules', contract.id, 'api'),
    mirrorImplRootPath: path.join(outDir, 'modules', contract.id, 'impl'),
  };
}

function resolveDeclaredRoot(moduleDir: string, relativeRoot: string, kind: 'api' | 'impl', moduleId: string): string {
  const resolved = path.resolve(moduleDir, relativeRoot);

  if (!fs.existsSync(resolved)) {
    throw new Error(`Module "${moduleId}" declares ${kind} root that does not exist: ${resolved}`);
  }

  if (!fs.statSync(resolved).isDirectory()) {
    throw new Error(`Module "${moduleId}" declares ${kind} root that is not a directory: ${resolved}`);
  }

  return resolved;
}

function assertValidModuleId(id: string, contractFilePath: string): void {
  if (!/^[a-z][a-z0-9-]*$/u.test(id)) {
    throw new Error(`Invalid ArchiCat module id "${id}" in ${contractFilePath}. Use ^[a-z][a-z0-9-]*$`);
  }
}

function assertUniqueModules(modules: readonly ResolvedArchicatModule[]): void {
  const seen = new Map<string, string>();

  for (const module of modules) {
    const current = seen.get(module.id);

    if (current) {
      throw new Error(`Duplicate ArchiCat module id "${module.id}" in ${current} and ${module.contractFilePath}`);
    }

    seen.set(module.id, module.contractFilePath);
  }
}

function assertDependencyReferences(modules: readonly ResolvedArchicatModule[]): void {
  const moduleIds = new Set(modules.map((module) => module.id));

  for (const module of modules) {
    for (const dependency of module.dependencies) {
      if (dependency === module.id) {
        throw new Error(`Module "${module.id}" cannot depend on itself.`);
      }

      if (!moduleIds.has(dependency)) {
        throw new Error(`Module "${module.id}" declares unknown dependency "${dependency}".`);
      }
    }
  }
}
