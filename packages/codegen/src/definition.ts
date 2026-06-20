// MARK: - Public types

export interface ArchicatModuleRootConfig {
  include: readonly string[];
}

export interface ArchicatConfigInput {
  root: string;
  outDir: string;
  modules: ArchicatModuleRootConfig;
}

export type ArchicatConfig = Readonly<{
  root: string;
  outDir: string;
  modules: Readonly<{
    include: readonly string[];
  }>;
}>;

export interface ArchicatModuleInput {
  id: string;
  api?: string;
  impl?: string;
  dependencies?: readonly string[];
}

export type ArchicatModuleContract = Readonly<{
  id: string;
  api?: string;
  impl?: string;
  dependencies: readonly string[];
}>;

// MARK: - Public DSL

export function defineArchicatConfig(config: ArchicatConfigInput): ArchicatConfig {
  return Object.freeze({
    root: config.root,
    outDir: config.outDir,
    modules: Object.freeze({
      include: Object.freeze([...config.modules.include]),
    }),
  });
}

export function defineModule(module: ArchicatModuleInput): ArchicatModuleContract {
  return Object.freeze({
    id: module.id,
    ...(module.api === undefined ? {} : { api: module.api }),
    ...(module.impl === undefined ? {} : { impl: module.impl }),
    dependencies: Object.freeze([...(module.dependencies ?? [])]),
  });
}
