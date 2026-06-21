import type { ArchicatDependency } from './archicat-project-graph.js';

/**
 * @description User-facing library definition input.
 */
export interface ArchicatLibraryInput {
  /**
   * @description Stable library id used in the Archicat project graph.
   */
  readonly id: string;

  /**
   * @description Library public API root, relative to the library definition file.
   * @default Generates an empty public API mirror.
   */
  readonly api?: string;

  /**
   * @description Public graph dependencies this library may import.
   * @default []
   */
  readonly dependencies?: readonly ArchicatDependency[];
}

/**
 * @description Immutable library definition contract loaded by Archicat.
 */
export type ArchicatLibraryContract = Readonly<{
  readonly kind: 'library';
  readonly id: string;
  readonly api?: string;
  readonly dependencies: readonly ArchicatDependency[];
}>;
