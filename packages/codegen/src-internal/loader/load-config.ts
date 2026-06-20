import fs from 'node:fs';
import path from 'node:path';

import type { ArchicatConfig, ArchicatModuleContract } from '@/definition';
import { createJiti } from 'jiti';

import type { LoadedArchicatConfig, LoadedArchicatModule } from '@internal/model';

// MARK: - Public

export async function loadArchicatConfig(configFileName = 'archicat.config.ts'): Promise<LoadedArchicatConfig> {
  const cwd = process.cwd();
  const configFilePath = path.resolve(cwd, configFileName);

  if (!fs.existsSync(configFilePath)) {
    throw new Error(`ArchiCat config was not found: ${configFilePath}`);
  }

  const config = await importDefault<ArchicatConfig>(configFilePath, cwd);
  assertArchicatConfig(config, configFilePath);

  return {
    configFilePath,
    rootDir: path.resolve(cwd, config.root),
    outDir: path.resolve(cwd, config.outDir),
    config,
  };
}

export async function loadArchicatModule(filePath: string): Promise<LoadedArchicatModule> {
  const module = await importDefault<ArchicatModuleContract>(filePath, path.dirname(filePath));
  assertArchicatModule(module, filePath);

  return {
    contractFilePath: filePath,
    moduleDir: path.dirname(filePath),
    contract: module,
  };
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

function assertArchicatConfig(input: unknown, filePath: string): asserts input is ArchicatConfig {
  if (input == null || typeof input !== 'object') {
    throw new Error(`Invalid ArchiCat config: ${filePath}`);
  }

  const config = input as Partial<ArchicatConfig>;

  if (typeof config.root !== 'string' || config.root.trim() === '') {
    throw new Error(`ArchiCat config must define a non-empty root string: ${filePath}`);
  }

  if (typeof config.outDir !== 'string' || config.outDir.trim() === '') {
    throw new Error(`ArchiCat config must define a non-empty outDir string: ${filePath}`);
  }

  if (!config.modules || !Array.isArray(config.modules.include)) {
    throw new Error(`ArchiCat config must define modules.include: ${filePath}`);
  }
}

function assertArchicatModule(input: unknown, filePath: string): asserts input is ArchicatModuleContract {
  if (input == null || typeof input !== 'object') {
    throw new Error(`Invalid ArchiCat module contract: ${filePath}`);
  }

  const module = input as Partial<ArchicatModuleContract>;

  if (typeof module.id !== 'string' || module.id.trim() === '') {
    throw new Error(`ArchiCat module must define a non-empty id: ${filePath}`);
  }

  if (module.api !== undefined && typeof module.api !== 'string') {
    throw new Error(`ArchiCat module api must be a string when defined: ${filePath}`);
  }

  if (module.impl !== undefined && typeof module.impl !== 'string') {
    throw new Error(`ArchiCat module impl must be a string when defined: ${filePath}`);
  }

  if (!Array.isArray(module.dependencies)) {
    throw new Error(`ArchiCat module dependencies must be an array: ${filePath}`);
  }
}
