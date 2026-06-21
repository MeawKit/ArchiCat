import type { ArchicatConfig, ArchicatLibraryContract, ArchicatModuleContract } from '@/configs';

// MARK: - Public configuration model

export interface ResolvedArchicatConfig {
  root: string;
  outDir: string;
  reportDir: string;
  tsconfig?: string;
  prefixes: {
    module: string;
    library: string;
  };
  modules: {
    include: string[];
  };
  libraries: {
    include: string[];
  };
}

export interface LoadedArchicatConfig {
  configFilePath: string;
  rootDir: string;
  outDir: string;
  reportDir: string;
  tsconfigPath?: string;
  config: ArchicatConfig;
  resolvedConfig: ResolvedArchicatConfig;
}

// MARK: - Public loaded definitions

export interface LoadedArchicatModule {
  kind: 'module';
  contractFilePath: string;
  definitionDir: string;
  contract: ArchicatModuleContract;
}

export interface LoadedArchicatLibrary {
  kind: 'library';
  contractFilePath: string;
  definitionDir: string;
  contract: ArchicatLibraryContract;
}

export type LoadedArchicatDefinition = LoadedArchicatModule | LoadedArchicatLibrary;

// MARK: - Public graph model

export type ArchicatDefinitionKind = 'module' | 'library';
export type ArchicatSurface = 'api' | 'impl';

export interface ArchicatGraphTarget {
  key: string;
  kind: ArchicatDefinitionKind;
  id: string;
  surface: ArchicatSurface;
}

export interface ArchicatGraphDependency {
  from: string;
  to: string;
  implicit: boolean;
}

export interface ResolvedArchicatModule {
  kind: 'module';
  id: string;
  apiTarget: string;
  implTarget: string;
  alias: string;
  aliasGlob: string;
  dependencies: string[];
  contractFilePath: string;
  definitionDir: string;
  apiRootPath?: string;
  implRootPath?: string;
  mirrorApiRootPath: string;
  mirrorImplRootPath: string;
}

export interface ResolvedArchicatLibrary {
  kind: 'library';
  id: string;
  apiTarget: string;
  alias: string;
  aliasGlob: string;
  dependencies: string[];
  contractFilePath: string;
  definitionDir: string;
  apiRootPath?: string;
  mirrorApiRootPath: string;
}

export type ResolvedArchicatDefinition = ResolvedArchicatModule | ResolvedArchicatLibrary;

export interface ArchicatProjectGraph {
  targets: ArchicatGraphTarget[];
  dependencies: ArchicatGraphDependency[];
}

export interface ResolvedArchicatProject {
  rootDir: string;
  outDir: string;
  reportDir: string;
  tsconfigPath?: string;
  configFilePath: string;
  config: ResolvedArchicatConfig;
  modules: ResolvedArchicatModule[];
  libraries: ResolvedArchicatLibrary[];
  definitions: ResolvedArchicatDefinition[];
  graph: ArchicatProjectGraph;
}

export interface ArchicatBuildReport {
  generatedBy: 'archicat';
  schemaVersion: 1;
  prefixes: {
    module: string;
    library: string;
  };
  targets: string[];
  definitions: Array<{
    kind: ArchicatDefinitionKind;
    id: string;
    targets: Record<string, string>;
    aliases: Record<string, string>;
    dependencies: string[];
    contractFilePath: string;
    source: Record<string, string | undefined>;
    mirror: Record<string, string | undefined>;
  }>;
  dependencies: ArchicatGraphDependency[];
}

// MARK: - Public diagnostics

export interface ArchicatViolation {
  filePath: string;
  importPath: string;
  message: string;
}

export interface ArchicatDoctorIssue {
  severity: 'warning' | 'error';
  message: string;
}
