import path from 'node:path';

import type { ArchicatLibraryContract, ArchicatModuleContract } from '@/configs';
import { createJiti } from 'jiti';

import type {
  LoadedArchicatDefinition,
  LoadedArchicatLibrary,
  LoadedArchicatModule,
} from '@internal/model';

// MARK: - Public

export async function loadArchicatDefinition(filePath: string, kind: 'module' | 'library'): Promise<LoadedArchicatDefinition> {
  switch (kind) {
    case 'module':
      return loadArchicatModule(filePath);
    case 'library':
      return loadArchicatLibrary(filePath);
  }
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

// MARK: - Private import

async function importDefault<T>(filePath: string, rootDir: string): Promise<T> {
  const jiti = createJiti(rootDir, {
    interopDefault: true,
    extensions: ['.js', '.cjs', '.mjs', '.ts', '.cts', '.mts', '.json'],
  });

  const imported = await jiti.import(filePath, { default: true });
  return imported as T;
}

// MARK: - Private validation

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

function capitalize(value: string): string {
  return `${value.charAt(0).toUpperCase()}${value.slice(1)}`;
}
