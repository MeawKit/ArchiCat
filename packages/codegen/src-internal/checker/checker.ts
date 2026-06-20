import path from 'node:path';

import { loadResolvedArchicatProject } from '@internal/configuration';
import type { ArchicatViolation, ResolvedArchicatModule, ResolvedArchicatProject } from '@internal/model';
import { isPathInside, makeRelativeDisplayPath, stripKnownExtension } from '@internal/path';
import { listTypeScriptFiles, scanImports } from '@internal/scanner';

// MARK: - Public

export async function check(configFileName?: string): Promise<ArchicatViolation[]> {
  const project = await loadResolvedArchicatProject(configFileName);
  return [...checkImports(project), ...checkCycles(project)];
}

// MARK: - Private

function checkImports(project: ResolvedArchicatProject): ArchicatViolation[] {
  const violations: ArchicatViolation[] = [];
  const sourceFiles = project.modules.flatMap((module) => getModuleSourceFiles(module));

  for (const filePath of sourceFiles) {
    const owner = findOwnerModule(project.modules, filePath);

    if (!owner) {
      continue;
    }

    for (const scannedImport of scanImports(filePath)) {
      const violation = checkImport(project, owner, filePath, scannedImport.moduleSpecifier);

      if (violation) {
        violations.push(violation);
      }
    }
  }

  return violations;
}

function getModuleSourceFiles(module: ResolvedArchicatModule): string[] {
  return [
    ...(module.apiRootPath ? listTypeScriptFiles(module.apiRootPath) : []),
    ...(module.implRootPath ? listTypeScriptFiles(module.implRootPath) : []),
  ];
}

function checkImport(
  project: ResolvedArchicatProject,
  owner: ResolvedArchicatModule,
  filePath: string,
  importPath: string,
): ArchicatViolation | undefined {
  const targetAlias = resolveModuleAlias(project.modules, importPath);

  if (targetAlias) {
    if (targetAlias.id === owner.id) {
      return undefined;
    }

    if (!owner.dependencies.includes(targetAlias.id)) {
      return makeViolation(
        project,
        filePath,
        importPath,
        `Module "${owner.id}" imports "${targetAlias.id}" but does not declare it in dependencies.`,
      );
    }

    return undefined;
  }

  if (importPath.startsWith('#archicat/')) {
    return undefined;
  }

  if (importPath.startsWith('.') || importPath.startsWith('/')) {
    return checkRelativeImport(project, owner, filePath, importPath);
  }

  return undefined;
}

function checkRelativeImport(
  project: ResolvedArchicatProject,
  owner: ResolvedArchicatModule,
  filePath: string,
  importPath: string,
): ArchicatViolation | undefined {
  const targetPath = resolveImportPath(filePath, importPath);
  const targetModule = findOwnerModule(project.modules, targetPath);

  if (!targetModule || targetModule.id === owner.id) {
    return undefined;
  }

  return makeViolation(
    project,
    filePath,
    importPath,
    `Module "${owner.id}" imports module "${targetModule.id}" through a source path. Use "${targetModule.alias}" instead.`,
  );
}

function resolveImportPath(filePath: string, importPath: string): string {
  return stripKnownExtension(importPath.startsWith('/') ? importPath : path.resolve(path.dirname(filePath), importPath));
}

function findOwnerModule(modules: readonly ResolvedArchicatModule[], filePath: string): ResolvedArchicatModule | undefined {
  const extensionless = stripKnownExtension(filePath);

  return modules.find((module) => {
    const roots = [module.apiRootPath, module.implRootPath, module.moduleDir].filter((root): root is string => !!root);
    return roots.some((root) => isPathInside(extensionless, stripKnownExtension(root)));
  });
}

function resolveModuleAlias(
  modules: readonly ResolvedArchicatModule[],
  importPath: string,
): ResolvedArchicatModule | undefined {
  return modules.find((module) => importPath === module.alias || importPath.startsWith(`${module.alias}/`));
}

function checkCycles(project: ResolvedArchicatProject): ArchicatViolation[] {
  const violations: ArchicatViolation[] = [];
  const moduleById = new Map(project.modules.map((module) => [module.id, module] as const));
  const visiting = new Set<string>();
  const visited = new Set<string>();

  const visit = (module: ResolvedArchicatModule, stack: string[]): void => {
    if (visited.has(module.id)) {
      return;
    }

    if (visiting.has(module.id)) {
      violations.push({
        filePath: makeRelativeDisplayPath(project.rootDir, module.contractFilePath),
        importPath: module.id,
        message: `Cyclic ArchiCat module dependency detected: ${[...stack, module.id].join(' -> ')}`,
      });
      return;
    }

    visiting.add(module.id);

    for (const dependencyId of module.dependencies) {
      const dependency = moduleById.get(dependencyId);

      if (dependency) {
        visit(dependency, [...stack, module.id]);
      }
    }

    visiting.delete(module.id);
    visited.add(module.id);
  };

  for (const module of project.modules) {
    visit(module, []);
  }

  return violations;
}

function makeViolation(
  project: ResolvedArchicatProject,
  filePath: string,
  importPath: string,
  message: string,
): ArchicatViolation {
  return {
    filePath: makeRelativeDisplayPath(project.rootDir, filePath),
    importPath,
    message,
  };
}
