import type { ArchicatLibraryContract, ArchicatLibraryInput } from './library-config.js';

/**
 * @description Defines one Archicat library.
 */
export function defineLibrary(library: ArchicatLibraryInput): ArchicatLibraryContract {
  return Object.freeze({
    kind: 'library',
    id: library.id,
    ...(library.api === undefined ? {} : { api: library.api }),
    dependencies: Object.freeze([...(library.dependencies ?? [])]),
  });
}
