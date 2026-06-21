import fs from 'node:fs';
import path from 'node:path';

import type { ResolvedArchicatProject } from '@internal/model';
import { normalizePath } from '@internal/path';

import { writeJsonFile } from '@internal/generator/file-writer';

// MARK: - Public

export function generateTsconfig(project: ResolvedArchicatProject): void {
  const userTsconfig = project.tsconfigPath ? readUserTsconfig(project.tsconfigPath) : {};
  const userCompilerOptions = readCompilerOptions(userTsconfig);
  const userPaths = readPaths(userCompilerOptions);
  const archicatPaths = makeArchicatPaths(project);

  assertNoAliasConflicts(project, userPaths, archicatPaths);

  const compilerOptions = {
    ...rewriteCompilerPathOptions(project, omit(userCompilerOptions, ['baseUrl', 'paths'])),
    paths: {
      ...rewriteUserPaths(project, userPaths),
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

// MARK: - Private

function makeArchicatPaths(project: ResolvedArchicatProject): Record<string, string[]> {
  const paths: Record<string, string[]> = {};

  for (const definition of project.definitions) {
    paths[definition.alias] = [makeRelativeTsconfigPath(project.outDir, path.join(definition.mirrorApiRootPath, 'index.ts'))];
    paths[definition.aliasGlob] = [makeRelativeTsconfigPath(project.outDir, path.join(definition.mirrorApiRootPath, '*'))];
  }

  return paths;
}

function readUserTsconfig(tsconfigPath: string): Record<string, unknown> {
  const raw = fs.readFileSync(tsconfigPath, 'utf8');
  return JSON.parse(stripJsonComments(raw)) as Record<string, unknown>;
}

function readCompilerOptions(tsconfig: Record<string, unknown>): Record<string, unknown> {
  const compilerOptions = tsconfig.compilerOptions;
  return compilerOptions && typeof compilerOptions === 'object' && !Array.isArray(compilerOptions)
    ? (compilerOptions as Record<string, unknown>)
    : {};
}

function readPaths(compilerOptions: Record<string, unknown>): Record<string, string[]> {
  const paths = compilerOptions.paths;

  if (!paths || typeof paths !== 'object' || Array.isArray(paths)) {
    return {};
  }

  const result: Record<string, string[]> = {};

  for (const [key, value] of Object.entries(paths)) {
    if (!Array.isArray(value) || !value.every((entry) => typeof entry === 'string')) {
      throw new Error(`Tsconfig paths.${key} must be an array of strings.`);
    }

    result[key] = [...value];
  }

  return result;
}

function rewriteUserPaths(project: ResolvedArchicatProject, userPaths: Record<string, string[]>): Record<string, string[]> {
  if (!project.tsconfigPath) {
    return userPaths;
  }

  const tsconfigDir = path.dirname(project.tsconfigPath);
  const rewritten: Record<string, string[]> = {};

  for (const [alias, values] of Object.entries(userPaths)) {
    rewritten[alias] = values.map((value) => rewriteUserPathValue(project.outDir, tsconfigDir, value));
  }

  return rewritten;
}

function rewriteUserPathValue(outDir: string, tsconfigDir: string, value: string): string {
  if (path.isAbsolute(value)) {
    return makeRelativeTsconfigPath(outDir, value);
  }

  const absolute = path.resolve(tsconfigDir, value);
  return makeRelativeTsconfigPath(outDir, absolute);
}

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

function assertNoAliasConflicts(
  project: ResolvedArchicatProject,
  userPaths: Record<string, string[]>,
  archicatPaths: Record<string, string[]>,
): void {
  const userAliases = Object.keys(userPaths);
  const archicatAliases = Object.keys(archicatPaths);
  const reservedPrefixes = Object.values(project.config.prefixes);

  for (const userAlias of userAliases) {
    if (archicatAliases.includes(userAlias)) {
      throw new Error(`Tsconfig alias conflict: user tsconfig already defines "${userAlias}", but Archicat needs it.`);
    }

    for (const prefix of reservedPrefixes) {
      if (userAlias === prefix || userAlias === `${prefix}/*` || userAlias.startsWith(`${prefix}/`)) {
        throw new Error(
          `Tsconfig alias conflict: user tsconfig already defines "${userAlias}" inside Archicat reserved prefix "${prefix}". Remove the alias or configure another Archicat prefix.`,
        );
      }
    }
  }
}

function stripJsonComments(input: string): string {
  return input
    .replace(/\/\*[\s\S]*?\*\//gu, '')
    .replace(/(^|[^:])\/\/.*$/gmu, '$1');
}

function omit<T extends Record<string, unknown>, Key extends keyof T>(input: T, keys: readonly Key[]): Omit<T, Key> {
  const result = { ...input };

  for (const key of keys) {
    delete result[key];
  }

  return result;
}
