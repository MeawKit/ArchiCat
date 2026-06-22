// MARK: - Internal

export const ArchicatDefaults = Object.freeze({
  root: '.',
  outDir: '.archicat',
  alias: Object.freeze({}),
  prefixes: Object.freeze({
    module: '@module',
    library: '@library',
  }),
  modules: Object.freeze({
    include: Object.freeze(['./src/modules'] as const),
  }),
  libraries: Object.freeze({
    include: Object.freeze([] as const),
  }),
  apps: Object.freeze({
    include: Object.freeze([] as const),
  }),
});
