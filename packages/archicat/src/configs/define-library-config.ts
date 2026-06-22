import type { ArchicatLibraryContract, ArchicatLibraryInput } from './library-config.js';
import type { ArchicatSurfaceContract, ArchicatSurfaceInput } from './surface-config.js';

/**
 * @description Defines one Archicat library.
 */
export function defineLibrary(library: ArchicatLibraryInput): ArchicatLibraryContract {
  return Object.freeze({
    kind: 'library',
    name: library.name,
    api: defineSurface(library.api),
    impl: defineSurface(library.impl),
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
