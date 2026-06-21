import fs from 'node:fs';
import path from 'node:path';

import { loadArchicatBuildContext } from '@internal/build';
import type { ArchicatDoctorIssue, ResolvedArchicatProject } from '@internal/model';

// MARK: - Public

export async function doctor(configFileName?: string): Promise<ArchicatDoctorIssue[]> {
  const project = await loadArchicatBuildContext(configFileName);
  return [...checkGeneratedTsconfig(project), ...checkRootTsconfig(project), ...checkPhysicalOmissions(project)];
}

// MARK: - Private

function checkGeneratedTsconfig(project: ResolvedArchicatProject): ArchicatDoctorIssue[] {
  const generatedTsconfig = path.join(project.outDir, 'tsconfig.json');

  if (fs.existsSync(generatedTsconfig)) {
    return [];
  }

  return [{ severity: 'warning', message: `Generated tsconfig does not exist yet: ${generatedTsconfig}. Run archicat generate.` }];
}

function checkRootTsconfig(project: ResolvedArchicatProject): ArchicatDoctorIssue[] {
  const rootTsconfig = path.join(project.rootDir, 'tsconfig.json');

  if (!fs.existsSync(rootTsconfig)) {
    return [{ severity: 'warning', message: `Root tsconfig.json was not found: ${rootTsconfig}` }];
  }

  try {
    const parsed = JSON.parse(fs.readFileSync(rootTsconfig, 'utf8')) as { extends?: string; compilerOptions?: { rootDir?: string } };
    const issues: ArchicatDoctorIssue[] = [];

    if (parsed.extends !== './.archicat/tsconfig.json' && parsed.extends !== '.archicat/tsconfig.json') {
      issues.push({
        severity: 'warning',
        message: 'Root tsconfig.json should extend ./.archicat/tsconfig.json for Archicat aliases to work like Nuxt.',
      });
    }

    if (parsed.compilerOptions?.rootDir === 'src' || parsed.compilerOptions?.rootDir === './src') {
      issues.push({
        severity: 'warning',
        message: 'compilerOptions.rootDir is set to src. Generated .archicat files live outside src and may break tsc.',
      });
    }

    return issues;
  } catch (error) {
    return [{ severity: 'warning', message: `Failed to parse root tsconfig.json: ${error}` }];
  }
}

function checkPhysicalOmissions(project: ResolvedArchicatProject): ArchicatDoctorIssue[] {
  const issues: ArchicatDoctorIssue[] = [];

  for (const module of project.modules) {
    const apiPath = path.join(module.definitionDir, 'api');
    const implPath = path.join(module.definitionDir, 'impl');

    if (!module.apiRootPath && fs.existsSync(apiPath)) {
      issues.push({
        severity: 'warning',
        message: `Module "${module.id}" has a physical api directory but its contract omits api. Archicat treats the public API as empty.`,
      });
    }

    if (!module.implRootPath && fs.existsSync(implPath)) {
      issues.push({
        severity: 'warning',
        message: `Module "${module.id}" has a physical impl directory but its contract omits impl. Archicat treats the implementation as no-op.`,
      });
    }
  }

  return issues;
}
