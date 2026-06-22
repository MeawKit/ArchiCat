import fs from 'node:fs';
import path from 'node:path';

import ts from 'typescript';

import type { ResolvedArchicatProject } from '@internal/model';
import { normalizePath } from '@internal/path';

import { writeJsonFile } from '@internal/generator/file-writer';

// MARK: - Public

export function generateTsconfig(project: ResolvedArchicatProject): void {
  const userTsconfig = project.tsconfigPath ? readUserTsconfig(project.tsconfigPath) : {};
  const userCompilerOptions = readCompilerOptions(userTsconfig);
  const userPaths = readPaths(userCompilerOptions, project.tsconfigPath);

  if (Object.keys(userPaths).length > 0) {
    throw new Error('Root tsconfig compilerOptions.paths is not supported by Archicat. Move aliases into archicat.config.ts alias.');
  }

  const userAliasPaths = rewriteConfiguredAliases(project);
  const archicatPaths = makeArchicatPaths(project);

  assertNoAliasConflicts(project, userAliasPaths, archicatPaths);

  const compilerOptions = {
    ...rewriteCompilerPathOptions(project, omit(userCompilerOptions, ['baseUrl', 'paths'])),
    paths: {
      ...userAliasPaths,
      ...archicatPaths,
    },
  };

  const tsconfig = {
    compilerOptions,
    include: ['../src/**/*.ts', './**/*.ts', './types/**/*.d.ts'],
    exclude: ['../node_modules', '../dist'],
  };

  writeJsonFile(path.join(project.outDir, 'tsconfig.json'), tsconfig);
}

// MARK: - Private paths

function makeArchicatPaths(project: ResolvedArchicatProject): Record<string, string[]> {
  const paths: Record<string, string[]> = {};
  const includeImplementationAliases = project.apps.length > 0;

  for (const definition of project.definitions) {
    paths[definition.alias] = [makeRelativeTsconfigPath(project.outDir, path.join(definition.api.mirrorRootPath, 'index.ts'))];
    paths[definition.aliasGlob] = [makeRelativeTsconfigPath(project.outDir, path.join(definition.api.mirrorRootPath, '*'))];

    if (includeImplementationAliases && definition.implAlias && definition.implAliasGlob) {
      paths[definition.implAlias] = [makeRelativeTsconfigPath(project.outDir, path.join(definition.impl.mirrorRootPath, 'index.ts'))];
      paths[definition.implAliasGlob] = [makeRelativeTsconfigPath(project.outDir, path.join(definition.impl.mirrorRootPath, '*'))];
    }
  }

  return paths;
}

function rewriteConfiguredAliases(project: ResolvedArchicatProject): Record<string, string[]> {
  const result: Record<string, string[]> = {};

  for (const [alias, target] of Object.entries(project.config.alias)) {
    const absolute = path.isAbsolute(target) ? target : path.resolve(project.rootDir, target);
    result[alias] = [makeRelativeTsconfigPath(project.outDir, absolute)];
  }

  return result;
}

// MARK: - Private read

function readUserTsconfig(tsconfigPath: string): Record<string, unknown> {
  const raw = fs.readFileSync(tsconfigPath, 'utf8');
  const parsed = ts.parseConfigFileTextToJson(tsconfigPath, raw);

  if (parsed.error) {
    throw new Error(formatTsDiagnostic(parsed.error));
  }

  if (parsed.config == null || typeof parsed.config !== 'object' || Array.isArray(parsed.config)) {
    throw new Error(`Invalid tsconfig object: ${tsconfigPath}`);
  }

  return parsed.config as Record<string, unknown>;
}

function readCompilerOptions(tsconfig: Record<string, unknown>): Record<string, unknown> {
  const compilerOptions = tsconfig.compilerOptions;
  return compilerOptions && typeof compilerOptions === 'object' && !Array.isArray(compilerOptions)
    ? (compilerOptions as Record<string, unknown>)
    : {};
}

function readPaths(compilerOptions: Record<string, unknown>, tsconfigPath: string | undefined): Record<string, string[]> {
  const paths = compilerOptions.paths;

  if (!paths || typeof paths !== 'object' || Array.isArray(paths)) {
    return {};
  }

  const result: Record<string, string[]> = {};

  for (const [key, value] of Object.entries(paths)) {
    if (!Array.isArray(value) || !value.every((entry) => typeof entry === 'string')) {
      throw new Error(`Tsconfig paths.${key} must be an array of strings${tsconfigPath ? `: ${tsconfigPath}` : ''}.`);
    }

    result[key] = [...value];
  }

  return result;
}

// MARK: - Private rewrite

function rewriteCompilerPathOptions(
  project: ResolvedArchicatProject,
  compilerOptions: Record<string, unknown>,
): Record<string, unknown> {
  if (!project.tsconfigPath) {
    return compilerOptions;
  }

  const tsconfigDir = path.dirname(project.tsconfigPath);
  const rewritten = { ...compilerOptions };

  for (const key of ['rootDir', 'outDir', 'declarationDir'] as const) {
    const value = rewritten[key];

    if (typeof value === 'string') {
      const absolute = path.isAbsolute(value) ? value : path.resolve(tsconfigDir, value);
      rewritten[key] = makeRelativeTsconfigPath(project.outDir, absolute);
    }
  }

  return rewritten;
}

function makeRelativeTsconfigPath(fromDir: string, targetPath: string): string {
  let relative = normalizePath(path.relative(fromDir, targetPath));

  if (!relative.startsWith('.')) {
    relative = `./${relative}`;
  }

  return relative;
}

// MARK: - Private validate

function assertNoAliasConflicts(
  project: ResolvedArchicatProject,
  userAliases: Record<string, string[]>,
  archicatPaths: Record<string, string[]>,
): void {
  const configuredAliases = Object.keys(userAliases);
  const archicatAliases = Object.keys(archicatPaths);
  const reservedPrefixes = Object.values(project.config.prefixes);

  for (const alias of configuredAliases) {
    if (archicatAliases.includes(alias)) {
      throw new Error(`Alias conflict: archicat.config.ts alias already defines "${alias}", but Archicat needs it.`);
    }

    for (const prefix of reservedPrefixes) {
      if (alias === prefix || alias === `${prefix}/*` || alias.startsWith(`${prefix}/`)) {
        throw new Error(
          `Alias conflict: archicat.config.ts alias "${alias}" is inside Archicat reserved prefix "${prefix}". Remove the alias or configure another Archicat prefix.`,
        );
      }
    }
  }
}

function formatTsDiagnostic(diagnostic: ts.Diagnostic): string {
  const message = ts.flattenDiagnosticMessageText(diagnostic.messageText, '\n');

  if (diagnostic.file && diagnostic.start !== undefined) {
    const position = diagnostic.file.getLineAndCharacterOfPosition(diagnostic.start);
    return `${diagnostic.file.fileName}:${position.line + 1}:${position.character + 1} - ${message}`;
  }

  return message;
}

function omit<T extends Record<string, unknown>, Key extends keyof T>(input: T, keys: readonly Key[]): Omit<T, Key> {
  const result = { ...input };

  for (const key of keys) {
    delete result[key];
  }

  return result;
}
