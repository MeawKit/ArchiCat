import type { ArchicatGraphDependency, ResolvedArchicatProject } from '@internal/model';

// MARK: - Public

export function formatProjectGraph(project: ResolvedArchicatProject): string[] {
  const lines: string[] = [`Modules: ${project.modules.length}`, ''];

  for (const module of project.modules) {
    lines.push(module.id);
    lines.push(`  api: ${module.apiTarget}`);
    lines.push(`  impl: ${module.implTarget}`);
    pushDependencies(lines, project.graph.dependencies.filter((dependency) => dependency.from === module.implTarget));
    lines.push('');
  }

  lines.push(`Libraries: ${project.libraries.length}`);

  if (project.libraries.length > 0) {
    lines.push('');
  }

  for (const library of project.libraries) {
    lines.push(library.id);
    lines.push(`  api: ${library.apiTarget}`);
    pushDependencies(lines, project.graph.dependencies.filter((dependency) => dependency.from === library.apiTarget));
    lines.push('');
  }

  return trimTrailingEmptyLines(lines);
}

// MARK: - Private

function pushDependencies(lines: string[], dependencies: readonly ArchicatGraphDependency[]): void {
  if (dependencies.length === 0) {
    lines.push('  dependsOn: none');
    return;
  }

  lines.push('  dependsOn:');

  for (const dependency of dependencies) {
    const suffix = dependency.origin === 'derived' ? ' (derived)' : '';
    lines.push(`    ${dependency.to}${suffix}`);
  }
}

function trimTrailingEmptyLines(lines: string[]): string[] {
  const result = [...lines];

  while (result.at(-1) === '') {
    result.pop();
  }

  return result;
}
