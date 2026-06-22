import fs from 'node:fs';
import path from 'node:path';

import ts from 'typescript';

import { loadArchicatBuildContext } from '@internal/context';
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

  const parsed = ts.parseConfigFileTextToJson(rootTsconfig, fs.readFileSync(rootTsconfig, 'utf8'));

  if (parsed.error) {
    return [{ severity: 'warning', message: `Failed to parse root tsconfig.json: ${ts.flattenDiagnosticMessageText(parsed.error.messageText, '\n')}` }];
  }

  const config = parsed.config as { extends?: string; compilerOptions?: { rootDir?: string; paths?: unknown } };
  const issues: ArchicatDoctorIssue[] = [];

  if (config.extends !== './.archicat/tsconfig.json' && config.extends !== '.archicat/tsconfig.json') {
    issues.push({
      severity: 'warning',
      message: 'Root tsconfig.json should extend ./.archicat/tsconfig.json for Archicat aliases to work like Nuxt.',
    });
  }

  if (config.compilerOptions?.rootDir === 'src' || config.compilerOptions?.rootDir === './src') {
    issues.push({
      severity: 'warning',
      message: 'compilerOptions.rootDir is set to src. Generated .archicat files live outside src and may break tsc.',
    });
  }

  if (config.compilerOptions?.paths !== undefined) {
    issues.push({
      severity: 'warning',
      message: 'compilerOptions.paths should move to archicat.config.ts alias. Root tsconfig paths can override generated Archicat aliases.',
    });
  }

  return issues;
}

function checkPhysicalOmissions(project: ResolvedArchicatProject): ArchicatDoctorIssue[] {
  const issues: ArchicatDoctorIssue[] = [];

  for (const definition of project.definitions) {
    const apiPath = path.join(definition.definitionDir, 'api');
    const implPath = path.join(definition.definitionDir, 'impl');

    if (!definition.api.rootPath && fs.existsSync(apiPath)) {
      issues.push({
        severity: 'warning',
        message: `${capitalize(definition.kind)} "${definition.name}" has a physical api directory but its contract omits api.root. Archicat treats the public API as empty.`,
      });
    }

    if (!definition.impl.rootPath && fs.existsSync(implPath)) {
      issues.push({
        severity: 'warning',
        message: `${capitalize(definition.kind)} "${definition.name}" has a physical impl directory but its contract omits impl.root. Archicat treats the implementation as no-op.`,
      });
    }
  }

  return issues;
}

function capitalize(value: string): string {
  return `${value.charAt(0).toUpperCase()}${value.slice(1)}`;
}
