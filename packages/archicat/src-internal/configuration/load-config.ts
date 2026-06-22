import fs from 'node:fs';
import path from 'node:path';

import type { ArchicatConfig } from '@/configs';
import { createJiti } from 'jiti';

import { ArchicatDefaults } from '@internal/configuration/archicat-defaults';
import type { LoadedArchicatConfig, ResolvedArchicatConfig } from '@internal/model';

// MARK: - Public

export async function loadArchicatConfig(configFileName = 'archicat.config.ts'): Promise<LoadedArchicatConfig> {
  const cwd = process.cwd();
  const configFilePath = path.resolve(cwd, configFileName);

  if (!fs.existsSync(configFilePath)) {
    throw new Error(`Archicat config was not found: ${configFilePath}`);
  }

  const config = await importDefault<ArchicatConfig>(configFilePath, cwd);
  assertArchicatConfig(config, configFilePath);

  const resolvedConfig = resolveConfig(config);
  const rootDir = path.resolve(cwd, resolvedConfig.root);
  const outDir = path.resolve(rootDir, resolvedConfig.outDir);
  const reportsDir = path.resolve(outDir, 'reports');
  const tsconfigPath = resolveTsconfigPath(rootDir, resolvedConfig.tsconfig);

  return {
    configFilePath,
    rootDir,
    outDir,
    reportsDir,
    ...(tsconfigPath ? { tsconfigPath } : {}),
    config,
    resolvedConfig,
  };
}

// MARK: - Private import

async function importDefault<T>(filePath: string, rootDir: string): Promise<T> {
  const jiti = createJiti(rootDir, {
    interopDefault: true,
    extensions: ['.js', '.cjs', '.mjs', '.ts', '.cts', '.mts', '.json'],
  });

  const imported = await jiti.import(filePath, { default: true });
  return imported as T;
}

// MARK: - Private resolve

function resolveConfig(config: ArchicatConfig): ResolvedArchicatConfig {
  return {
    root: config.root ?? ArchicatDefaults.root,
    outDir: config.outDir ?? ArchicatDefaults.outDir,
    alias: { ...ArchicatDefaults.alias, ...(config.alias ?? {}) },
    ...(config.tsconfig === undefined ? {} : { tsconfig: config.tsconfig }),
    prefixes: {
      module: config.prefixes?.module ?? ArchicatDefaults.prefixes.module,
      library: config.prefixes?.library ?? ArchicatDefaults.prefixes.library,
    },
    modules: {
      include: [...(config.modules?.include ?? ArchicatDefaults.modules.include)],
    },
    libraries: {
      include: [...(config.libraries?.include ?? ArchicatDefaults.libraries.include)],
    },
    apps: {
      include: [...(config.apps?.include ?? ArchicatDefaults.apps.include)],
    },
  };
}

function resolveTsconfigPath(rootDir: string, configuredTsconfig: string | undefined): string | undefined {
  if (configuredTsconfig) {
    const resolved = path.resolve(rootDir, configuredTsconfig);

    if (!fs.existsSync(resolved)) {
      throw new Error(`Configured Archicat tsconfig was not found: ${resolved}`);
    }

    return resolved;
  }

  const candidates = ['tsconfig.base.json', 'tsconfig.json'].map((fileName) => path.join(rootDir, fileName));
  return candidates.find((candidate) => fs.existsSync(candidate));
}

// MARK: - Private validate

function assertArchicatConfig(input: unknown, filePath: string): asserts input is ArchicatConfig {
  if (input == null || typeof input !== 'object') {
    throw new Error(`Invalid Archicat config: ${filePath}`);
  }

  const config = input as Partial<ArchicatConfig>;

  assertOptionalNonEmptyString(config.root, 'root', filePath);
  assertOptionalNonEmptyString(config.outDir, 'outDir', filePath);
  assertOptionalNonEmptyString(config.tsconfig, 'tsconfig', filePath);

  assertOptionalInclude(config.modules?.include, 'modules.include', filePath);
  assertOptionalInclude(config.libraries?.include, 'libraries.include', filePath);
  assertOptionalInclude(config.apps?.include, 'apps.include', filePath);
  assertOptionalAlias(config.alias, 'alias', filePath);

  assertOptionalPrefix(config.prefixes?.module, 'prefixes.module', filePath);
  assertOptionalPrefix(config.prefixes?.library, 'prefixes.library', filePath);
}

function assertOptionalNonEmptyString(value: unknown, key: string, filePath: string): void {
  if (value !== undefined && (typeof value !== 'string' || value.trim() === '')) {
    throw new Error(`Archicat ${key} must be a non-empty string when defined: ${filePath}`);
  }
}

function assertOptionalInclude(value: unknown, key: string, filePath: string): void {
  if (value !== undefined && (!Array.isArray(value) || value.some((entry) => typeof entry !== 'string' || entry.trim() === ''))) {
    throw new Error(`Archicat config ${key} must be an array of non-empty strings: ${filePath}`);
  }
}

function assertOptionalPrefix(value: unknown, key: string, filePath: string): void {
  if (value === undefined) {
    return;
  }

  if (typeof value !== 'string' || value.trim() === '' || value.includes('*') || value.endsWith('/')) {
    throw new Error(`Archicat config ${key} must be a non-empty prefix without wildcard or trailing slash: ${filePath}`);
  }
}

function assertOptionalAlias(value: unknown, key: string, filePath: string): void {
  if (value === undefined) {
    return;
  }

  if (value == null || typeof value !== 'object' || Array.isArray(value)) {
    throw new Error(`Archicat config ${key} must be an object of non-empty string aliases: ${filePath}`);
  }

  for (const [alias, target] of Object.entries(value)) {
    if (alias.trim() === '' || typeof target !== 'string' || target.trim() === '') {
      throw new Error(`Archicat config ${key} must contain non-empty string aliases: ${filePath}`);
    }
  }
}
