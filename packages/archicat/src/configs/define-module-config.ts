import type { ArchicatModuleContract, ArchicatModuleInput } from './module-config.js';

/**
 * @description Defines one Archicat module.
 */
export function defineModule(module: ArchicatModuleInput): ArchicatModuleContract {
  return Object.freeze({
    kind: 'module',
    id: module.id,
    ...(module.api === undefined ? {} : { api: module.api }),
    ...(module.impl === undefined ? {} : { impl: module.impl }),
    dependencies: Object.freeze([...(module.dependencies ?? [])]),
  });
}
