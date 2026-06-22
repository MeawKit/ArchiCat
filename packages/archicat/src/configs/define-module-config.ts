import type { ArchicatModuleContract, ArchicatModuleInput } from './module-config.js';
import type { ArchicatSurfaceContract, ArchicatSurfaceInput } from './surface-config.js';

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

// MARK: - Private

function defineSurface<Dependency extends string>(surface: ArchicatSurfaceInput<Dependency> | undefined): ArchicatSurfaceContract<Dependency> {
  if (typeof surface === 'string') {
    return Object.freeze({
      root: surface,
      dependencies: Object.freeze([]),
    });
  }

  return Object.freeze({
    ...(surface?.root === undefined ? {} : { root: surface.root }),
    dependencies: Object.freeze([...(surface?.dependencies ?? [])]),
  });
}
