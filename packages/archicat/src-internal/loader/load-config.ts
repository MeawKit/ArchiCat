import fs from 'node:fs';
import path from 'node:path';

import type { ArchicatConfig, ArchicatLibraryContract, ArchicatModuleContract } from '@/configs';
import { ArchicatDefaults } from '@internal/configuration/archicat-defaults';
import { createJiti } from 'jiti';

import type {
  LoadedArchicatConfig,
  LoadedArchicatDefinition,
  LoadedArchicatLibrary,
  LoadedArchicatModule,
  ResolvedArchicatConfig,
} from '@internal/model';

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
  const reportDir = path.resolve(rootDir, resolvedConfig.reportDir);
  const tsconfigPath = resolveTsconfigPath(rootDir, resolvedConfig.tsconfig);

  return {
    configFilePath,
    rootDir,
    outDir,
    reportDir,
    ...(tsconfigPath ? { tsconfigPath } : {}),
    config,
    resolvedConfig,
  };
}

export async function loadArchicatModule(filePath: string): Promise<LoadedArchicatModule> {
  const contract = await importDefault<ArchicatModuleContract>(filePath, path.dirname(filePath));
  assertArchicatDefinition(contract, filePath, 'module');

  return {
    kind: 'module',
    contractFilePath: filePath,
    definitionDir: path.dirname(filePath),
    contract,
  };
}

export async function loadArchicatLibrary(filePath: string): Promise<LoadedArchicatLibrary> {
  const contract = await importDefault<ArchicatLibraryContract>(filePath, path.dirname(filePath));
  assertArchicatDefinition(contract, filePath, 'library');

  return {
    kind: 'library',
    contractFilePath: filePath,
    definitionDir: path.dirname(filePath),
    contract,
  };
}

export async function loadArchicatDefinition(filePath: string, kind: 'module' | 'library'): Promise<LoadedArchicatDefinition> {
  switch (kind) {
    case 'module':
      return loadArchicatModule(filePath);
    case 'library':
      return loadArchicatLibrary(filePath);
  }
}

// MARK: - Private

async function importDefault<T>(filePath: string, rootDir: string): Promise<T> {
  const jiti = createJiti(rootDir, {
    interopDefault: true,
    extensions: ['.js', '.cjs', '.mjs', '.ts', '.cts', '.mts', '.json'],
  });

  const imported = await jiti.import(filePath, { default: true });
  return imported as T;
}

function resolveConfig(config: ArchicatConfig): ResolvedArchicatConfig {
  return {
    root: config.root ?? ArchicatDefaults.root,
    outDir: config.outDir ?? ArchicatDefaults.outDir,
    reportDir: config.reportDir ?? ArchicatDefaults.reportDir,
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

function assertArchicatConfig(input: unknown, filePath: string): asserts input is ArchicatConfig {
  if (input == null || typeof input !== 'object') {
    throw new Error(`Invalid Archicat config: ${filePath}`);
  }

  const config = input as Partial<ArchicatConfig>;

  assertOptionalNonEmptyString(config.root, 'root', filePath);
  assertOptionalNonEmptyString(config.outDir, 'outDir', filePath);
  assertOptionalNonEmptyString(config.reportDir, 'reportDir', filePath);
  assertOptionalNonEmptyString(config.tsconfig, 'tsconfig', filePath);

  assertOptionalInclude(config.modules?.include, 'modules.include', filePath);
  assertOptionalInclude(config.libraries?.include, 'libraries.include', filePath);

  assertOptionalPrefix(config.prefixes?.module, 'prefixes.module', filePath);
  assertOptionalPrefix(config.prefixes?.library, 'prefixes.library', filePath);
}

function assertArchicatDefinition(
  input: unknown,
  filePath: string,
  expectedKind: 'module' | 'library',
): asserts input is ArchicatModuleContract | ArchicatLibraryContract {
  if (input == null || typeof input !== 'object') {
    throw new Error(`Invalid Archicat ${expectedKind} definition: ${filePath}`);
  }

  const definition = input as Partial<ArchicatModuleContract | ArchicatLibraryContract>;

  if (definition.kind !== expectedKind) {
    throw new Error(`Archicat ${expectedKind} file must export define${capitalize(expectedKind)}(...): ${filePath}`);
  }

  if (typeof definition.id !== 'string' || definition.id.trim() === '') {
    throw new Error(`Archicat ${expectedKind} must define a non-empty id: ${filePath}`);
  }

  assertOptionalNonEmptyString(definition.api, 'api', filePath);

  if (expectedKind === 'module') {
    assertOptionalNonEmptyString((definition as Partial<ArchicatModuleContract>).impl, 'impl', filePath);
  }

  if (!Array.isArray(definition.dependencies)) {
    throw new Error(`Archicat ${expectedKind} dependencies must be an array: ${filePath}`);
  }
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

function capitalize(value: string): string {
  return `${value.charAt(0).toUpperCase()}${value.slice(1)}`;
}
