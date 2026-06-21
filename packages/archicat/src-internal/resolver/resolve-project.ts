import fs from 'node:fs';
import path from 'node:path';

import type {
  ArchicatGraphDependency,
  ArchicatGraphTarget,
  LoadedArchicatConfig,
  LoadedArchicatDefinition,
  LoadedArchicatLibrary,
  LoadedArchicatModule,
  ResolvedArchicatDefinition,
  ResolvedArchicatLibrary,
  ResolvedArchicatModule,
  ResolvedArchicatProject,
} from '@internal/model';

// MARK: - Public

export function resolveArchicatProject(
  loadedConfig: LoadedArchicatConfig,
  loadedDefinitions: readonly LoadedArchicatDefinition[],
): ResolvedArchicatProject {
  const modules = loadedDefinitions
    .filter((definition): definition is LoadedArchicatModule => definition.kind === 'module')
    .map((definition) => resolveModule(loadedConfig, definition));
  const libraries = loadedDefinitions
    .filter((definition): definition is LoadedArchicatLibrary => definition.kind === 'library')
    .map((definition) => resolveLibrary(loadedConfig, definition));
  const definitions: ResolvedArchicatDefinition[] = [...modules, ...libraries];

  assertUniqueDefinitionIds(definitions);
  const graph = buildGraph(definitions);
  assertDependencyReferences(definitions, graph.targets);
  assertNoDependencyCycles(definitions);

  return {
    rootDir: loadedConfig.rootDir,
    outDir: loadedConfig.outDir,
    reportDir: loadedConfig.reportDir,
    ...(loadedConfig.tsconfigPath ? { tsconfigPath: loadedConfig.tsconfigPath } : {}),
    configFilePath: loadedConfig.configFilePath,
    config: loadedConfig.resolvedConfig,
    modules,
    libraries,
    definitions,
    graph,
  };
}

// MARK: - Private resolve

function resolveModule(loadedConfig: LoadedArchicatConfig, loadedModule: LoadedArchicatModule): ResolvedArchicatModule {
  const { contract, contractFilePath, definitionDir } = loadedModule;

  assertValidId(contract.id, contractFilePath, 'module');

  const apiRootPath = contract.api ? resolveDeclaredRoot(definitionDir, contract.api, 'api', contract.id) : undefined;
  const implRootPath = contract.impl ? resolveDeclaredRoot(definitionDir, contract.impl, 'impl', contract.id) : undefined;

  const alias = `${loadedConfig.resolvedConfig.prefixes.module}/${contract.id}`;

  return {
    kind: 'module',
    id: contract.id,
    apiTarget: `module.${contract.id}.api`,
    implTarget: `module.${contract.id}.impl`,
    alias,
    aliasGlob: `${alias}/*`,
    dependencies: [...contract.dependencies],
    contractFilePath,
    definitionDir,
    apiRootPath,
    implRootPath,
    mirrorApiRootPath: path.join(loadedConfig.outDir, 'modules', contract.id, 'api'),
    mirrorImplRootPath: path.join(loadedConfig.outDir, 'modules', contract.id, 'impl'),
  };
}

function resolveLibrary(loadedConfig: LoadedArchicatConfig, loadedLibrary: LoadedArchicatLibrary): ResolvedArchicatLibrary {
  const { contract, contractFilePath, definitionDir } = loadedLibrary;

  assertValidId(contract.id, contractFilePath, 'library');

  const apiRootPath = contract.api ? resolveDeclaredRoot(definitionDir, contract.api, 'api', contract.id) : undefined;
  const alias = `${loadedConfig.resolvedConfig.prefixes.library}/${contract.id}`;

  return {
    kind: 'library',
    id: contract.id,
    apiTarget: `library.${contract.id}.api`,
    alias,
    aliasGlob: `${alias}/*`,
    dependencies: [...contract.dependencies],
    contractFilePath,
    definitionDir,
    apiRootPath,
    mirrorApiRootPath: path.join(loadedConfig.outDir, 'libraries', contract.id, 'api'),
  };
}

function resolveDeclaredRoot(definitionDir: string, relativeRoot: string, kind: 'api' | 'impl', id: string): string {
  const resolved = path.resolve(definitionDir, relativeRoot);

  if (!fs.existsSync(resolved)) {
    throw new Error(`Definition "${id}" declares ${kind} root that does not exist: ${resolved}`);
  }

  if (!fs.statSync(resolved).isDirectory()) {
    throw new Error(`Definition "${id}" declares ${kind} root that is not a directory: ${resolved}`);
  }

  return resolved;
}

// MARK: - Private graph

function buildGraph(definitions: readonly ResolvedArchicatDefinition[]): {
  targets: ArchicatGraphTarget[];
  dependencies: ArchicatGraphDependency[];
} {
  const targets = definitions.flatMap((definition): ArchicatGraphTarget[] => {
    if (definition.kind === 'module') {
      return [
        { key: definition.apiTarget, kind: definition.kind, id: definition.id, surface: 'api' },
        { key: definition.implTarget, kind: definition.kind, id: definition.id, surface: 'impl' },
      ];
    }

    return [{ key: definition.apiTarget, kind: definition.kind, id: definition.id, surface: 'api' }];
  });

  const explicitDependencies = definitions.flatMap((definition) => {
    const from = definition.kind === 'module' ? definition.implTarget : definition.apiTarget;
    return definition.dependencies.map((dependency) => ({ from, to: dependency, origin: 'declared' as const }));
  });

  const derivedDependencies = definitions
    .filter((definition): definition is ResolvedArchicatModule => definition.kind === 'module')
    .map((module) => ({ from: module.implTarget, to: module.apiTarget, origin: 'derived' as const }));

  return {
    targets,
    dependencies: [...derivedDependencies, ...explicitDependencies],
  };
}

// MARK: - Private validation

function assertValidId(id: string, filePath: string, kind: string): void {
  if (!/^[a-z][a-z0-9-]*$/u.test(id)) {
    throw new Error(`Invalid Archicat ${kind} id "${id}" in ${filePath}. Use ^[a-z][a-z0-9-]*$`);
  }
}

function assertUniqueDefinitionIds(definitions: readonly ResolvedArchicatDefinition[]): void {
  const seen = new Map<string, string>();

  for (const definition of definitions) {
    const key = `${definition.kind}.${definition.id}`;
    const current = seen.get(key);

    if (current) {
      throw new Error(`Duplicate Archicat ${definition.kind} id "${definition.id}" in ${current} and ${definition.contractFilePath}`);
    }

    seen.set(key, definition.contractFilePath);
  }
}

function assertDependencyReferences(
  definitions: readonly ResolvedArchicatDefinition[],
  targets: readonly ArchicatGraphTarget[],
): void {
  const targetKeys = new Set(targets.map((target) => target.key));

  for (const definition of definitions) {
    for (const dependency of definition.dependencies) {
      if (!targetKeys.has(dependency)) {
        throw new Error(`${formatDefinition(definition)} declares unknown dependency "${dependency}".`);
      }

      const target = targets.find((candidate) => candidate.key === dependency);

      if (target && target.kind === definition.kind && target.id === definition.id) {
        throw new Error(`${formatDefinition(definition)} cannot depend on itself: ${dependency}`);
      }
    }
  }
}

function assertNoDependencyCycles(definitions: readonly ResolvedArchicatDefinition[]): void {
  const moduleByApiTarget = new Map(
    definitions
      .filter((definition): definition is ResolvedArchicatModule => definition.kind === 'module')
      .map((module) => [module.apiTarget, module] as const),
  );

  const visiting = new Set<string>();
  const visited = new Set<string>();

  const visit = (module: ResolvedArchicatModule, stack: string[]): void => {
    if (visited.has(module.id)) {
      return;
    }

    if (visiting.has(module.id)) {
      throw new Error(`Cyclic Archicat module dependency detected: ${[...stack, module.id].join(' -> ')}`);
    }

    visiting.add(module.id);

    for (const dependency of module.dependencies) {
      const dependencyModule = moduleByApiTarget.get(dependency);

      if (dependencyModule) {
        visit(dependencyModule, [...stack, module.id]);
      }
    }

    visiting.delete(module.id);
    visited.add(module.id);
  };

  for (const module of moduleByApiTarget.values()) {
    visit(module, []);
  }
}

function formatDefinition(definition: ResolvedArchicatDefinition): string {
  return `${definition.kind} "${definition.id}"`;
}
