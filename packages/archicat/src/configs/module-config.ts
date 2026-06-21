import type { ArchicatDependency } from './archicat-project-graph.js';

/**
 * @description User-facing module definition input.
 */
export interface ArchicatModuleInput {
  /**
   * @description Stable module id used in the Archicat project graph.
   */
  readonly id: string;

  /**
   * @description Module public API root, relative to the module definition file.
   * @default Generates an empty public API mirror.
   */
  readonly api?: string;

  /**
   * @description Module implementation root, relative to the module definition file.
   * @default Generates a no-op implementation mirror.
   */
  readonly impl?: string;

  /**
   * @description Public graph dependencies this module may import.
   * @default []
   */
  readonly dependencies?: readonly ArchicatDependency[];
}

/**
 * @description Immutable module definition contract loaded by Archicat.
 */
export type ArchicatModuleContract = Readonly<{
  readonly kind: 'module';
  readonly id: string;
  readonly api?: string;
  readonly impl?: string;
  readonly dependencies: readonly ArchicatDependency[];
}>;
