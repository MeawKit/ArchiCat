import path from 'node:path';

import { loadArchicatBuildContext } from '@internal/build';
import type {
  ArchicatViolation,
  ResolvedArchicatDefinition,
  ResolvedArchicatProject,
} from '@internal/model';
import { isPathInside, makeRelativeDisplayPath, stripKnownExtension } from '@internal/path';
import { listTypeScriptFiles, scanImports } from '@internal/scanner';

// MARK: - Public

export async function validate(configFileName?: string): Promise<ArchicatViolation[]> {
  const project = await loadArchicatBuildContext(configFileName);
  return validateImports(project);
}

// MARK: - Private

function validateImports(project: ResolvedArchicatProject): ArchicatViolation[] {
  const violations: ArchicatViolation[] = [];
  const sourceFiles = project.definitions.flatMap((definition) => getDefinitionSourceFiles(definition));

  for (const filePath of sourceFiles) {
    const owner = findOwnerDefinition(project.definitions, filePath);

    if (!owner) {
      continue;
    }

    for (const scannedImport of scanImports(filePath)) {
      const violation = validateImport(project, owner, filePath, scannedImport.moduleSpecifier);

      if (violation) {
        violations.push(violation);
      }
    }
  }

  return violations;
}

function getDefinitionSourceFiles(definition: ResolvedArchicatDefinition): string[] {
  if (definition.kind === 'module') {
    return [
      ...(definition.apiRootPath ? listTypeScriptFiles(definition.apiRootPath) : []),
      ...(definition.implRootPath ? listTypeScriptFiles(definition.implRootPath) : []),
    ];
  }

  return definition.apiRootPath ? listTypeScriptFiles(definition.apiRootPath) : [];
}

function validateImport(
  project: ResolvedArchicatProject,
  owner: ResolvedArchicatDefinition,
  filePath: string,
  importPath: string,
): ArchicatViolation | undefined {
  const targetAlias = resolvePublicAlias(project, importPath);

  if (targetAlias) {
    if (targetAlias.kind === owner.kind && targetAlias.id === owner.id) {
      return undefined;
    }

    if (!owner.dependencies.includes(targetAlias.target)) {
      return makeViolation(
        project,
        filePath,
        importPath,
        `${capitalize(owner.kind)} "${owner.id}" imports "${targetAlias.target}" but does not declare it in dependencies.`,
      );
    }

    return undefined;
  }

  if (importPath.startsWith('.') || importPath.startsWith('/')) {
    return validateRelativeImport(project, owner, filePath, importPath);
  }

  return undefined;
}

function validateRelativeImport(
  project: ResolvedArchicatProject,
  owner: ResolvedArchicatDefinition,
  filePath: string,
  importPath: string,
): ArchicatViolation | undefined {
  const targetPath = resolveImportPath(filePath, importPath);
  const targetOwner = findOwnerDefinition(project.definitions, targetPath);

  if (!targetOwner || (targetOwner.kind === owner.kind && targetOwner.id === owner.id)) {
    return undefined;
  }

  return makeViolation(
    project,
    filePath,
    importPath,
    `${capitalize(owner.kind)} "${owner.id}" imports ${targetOwner.kind} "${targetOwner.id}" through a source path. Use "${targetOwner.alias}" instead.`,
  );
}

function resolveImportPath(filePath: string, importPath: string): string {
  return stripKnownExtension(importPath.startsWith('/') ? importPath : path.resolve(path.dirname(filePath), importPath));
}

function findOwnerDefinition(
  definitions: readonly ResolvedArchicatDefinition[],
  filePath: string,
): ResolvedArchicatDefinition | undefined {
  const extensionless = stripKnownExtension(filePath);

  return definitions.find((definition) => {
    const roots = getDefinitionRoots(definition).filter((root): root is string => !!root);
    return roots.some((root) => isPathInside(extensionless, stripKnownExtension(root)));
  });
}

function getDefinitionRoots(definition: ResolvedArchicatDefinition): Array<string | undefined> {
  if (definition.kind === 'module') {
    return [definition.apiRootPath, definition.implRootPath, definition.definitionDir];
  }

  return [definition.apiRootPath, definition.definitionDir];
}

function resolvePublicAlias(
  project: ResolvedArchicatProject,
  importPath: string,
): { kind: 'module' | 'library'; id: string; target: string } | undefined {
  for (const definition of project.definitions) {
    if (importPath === definition.alias || importPath.startsWith(`${definition.alias}/`)) {
      return {
        kind: definition.kind,
        id: definition.id,
        target: definition.apiTarget,
      };
    }
  }

  return undefined;
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

function capitalize(value: string): string {
  return `${value.charAt(0).toUpperCase()}${value.slice(1)}`;
}
