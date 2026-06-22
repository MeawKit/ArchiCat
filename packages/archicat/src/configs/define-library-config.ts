import type { ArchicatLibraryContract, ArchicatLibraryInput } from './library-config.js';
import { defineSurface } from './define-surface-config.js';

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
