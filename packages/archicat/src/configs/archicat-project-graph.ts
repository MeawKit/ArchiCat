/**
 * @description Generated Archicat project graph declaration surface.
 */
export interface ArchicatProjectGraph {}

/**
 * @description Dependency reference from the generated Archicat project graph.
 */
export type ArchicatDependency = keyof ArchicatProjectGraph extends never ? string : keyof ArchicatProjectGraph;
