import type { ArchicatModuleContract, ArchicatModuleInput } from './module-config.js';
import { defineSurface } from './define-surface-config.js';

/**
 * @description Defines one Archicat module.
 */
export function defineModule(module: ArchicatModuleInput): ArchicatModuleContract {
  return Object.freeze({
    kind: 'module',
    name: module.name,
    api: defineSurface(module.api),
    impl: defineSurface(module.impl),
  });
}
