import { compactConfig } from './compact-config.js';
import type { ArchicatSurfaceContract, ArchicatSurfaceInput } from './surface-config.js';

// MARK: - Surface config normalization

export function defineSurface<Dependency extends string>(
  surface: ArchicatSurfaceInput<Dependency> | undefined,
): ArchicatSurfaceContract<Dependency> {
  if (typeof surface === 'string') {
    return Object.freeze({
      root: surface,
      dependencies: Object.freeze([]),
    });
  }

  return compactConfig({
    root: surface?.root,
    dependencies: Object.freeze([...(surface?.dependencies ?? [])]),
  });
}
