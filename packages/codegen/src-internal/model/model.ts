import type { ArchicatConfig, ArchicatModuleContract } from '@/definition';

// MARK: - Public

export interface LoadedArchicatConfig {
  configFilePath: string;
  rootDir: string;
  outDir: string;
  config: ArchicatConfig;
}

export interface LoadedArchicatModule {
  contractFilePath: string;
  moduleDir: string;
  contract: ArchicatModuleContract;
}

export interface ResolvedArchicatModule {
  id: string;
  alias: string;
  dependencies: string[];
  contractFilePath: string;
  moduleDir: string;
  apiRootPath?: string;
  implRootPath?: string;
  mirrorApiRootPath: string;
  mirrorImplRootPath: string;
}

export interface ResolvedArchicatProject {
  rootDir: string;
  outDir: string;
  configFilePath: string;
  modules: ResolvedArchicatModule[];
}

export interface ArchicatManifest {
  generatedBy: 'archicat';
  version: 1;
  rootDir: string;
  outDir: string;
  modules: Array<{
    id: string;
    alias: string;
    dependencies: string[];
    contractFilePath: string;
    moduleDir: string;
    apiRootPath?: string;
    implRootPath?: string;
    mirrorApiRootPath: string;
    mirrorImplRootPath: string;
  }>;
}

export interface ArchicatViolation {
  filePath: string;
  importPath: string;
  message: string;
}

export interface ArchicatDoctorIssue {
  severity: 'warning' | 'error';
  message: string;
}
