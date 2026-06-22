export type { DependencyOwner, DependencyOwnerKind, DependencyOwnerSurface, ParsedDependencyTarget } from './dependency-target.js';
export { assertNoDependencyCycles } from './detect-dependency-cycles.js';
export { formatTargetKind, parseDependencyTarget } from './parse-dependency-target.js';
export { formatOwner, isAllowedDependency, validateDeclaredDependency } from './validate-dependency-rules.js';
