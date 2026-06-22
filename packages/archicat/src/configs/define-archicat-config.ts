import type { ArchicatConfig, ArchicatConfigInput } from './archicat-config.js';

/**
 * @description Defines the root Archicat config.
 */
export function defineArchicatConfig(config: ArchicatConfigInput = {}): ArchicatConfig {
  return Object.freeze({
    ...(config.root === undefined ? {} : { root: config.root }),
    ...(config.outDir === undefined ? {} : { outDir: config.outDir }),
    ...(config.tsconfig === undefined ? {} : { tsconfig: config.tsconfig }),
    ...(config.alias === undefined ? {} : { alias: Object.freeze({ ...config.alias }) }),
    ...(config.prefixes === undefined
      ? {}
      : {
          prefixes: Object.freeze({
            ...(config.prefixes.module === undefined ? {} : { module: config.prefixes.module }),
            ...(config.prefixes.library === undefined ? {} : { library: config.prefixes.library }),
          }),
        }),
    ...(config.modules === undefined
      ? {}
      : {
          modules: Object.freeze({
            ...(config.modules.include === undefined
              ? {}
              : { include: Object.freeze([...config.modules.include]) }),
          }),
        }),
    ...(config.libraries === undefined
      ? {}
      : {
          libraries: Object.freeze({
            ...(config.libraries.include === undefined
              ? {}
              : { include: Object.freeze([...config.libraries.include]) }),
          }),
        }),
    ...(config.apps === undefined
      ? {}
      : {
          apps: Object.freeze({
            ...(config.apps.include === undefined
              ? {}
              : { include: Object.freeze([...config.apps.include]) }),
          }),
        }),
  });
}
