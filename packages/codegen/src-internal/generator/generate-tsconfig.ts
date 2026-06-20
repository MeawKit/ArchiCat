import fs from 'node:fs';
import path from 'node:path';

import type { ResolvedArchicatProject } from '@internal/model';
import { normalizePath } from '@internal/path';

import { writeJsonFile } from '@internal/generator/file-writer';

// MARK: - Public

export function generateTsconfig(project: ResolvedArchicatProject): void {
  const paths: Record<string, string[]> = {
    '#archicat/*': ['.archicat/generated/*'],
  };

  for (const module of project.modules) {
    paths[module.alias] = [normalizePath(path.relative(project.rootDir, path.join(module.mirrorApiRootPath, 'index.ts')))];
    paths[`${module.alias}/*`] = [normalizePath(path.relative(project.rootDir, path.join(module.mirrorApiRootPath, '*')))];
  }

  const baseConfigPath = path.join(project.rootDir, 'tsconfig.base.json');
  const extendsValue = fs.existsSync(baseConfigPath) ? '../tsconfig.base.json' : undefined;

  const tsconfig = {
    ...(extendsValue ? { extends: extendsValue } : {}),
    compilerOptions: {
      baseUrl: '..',
      paths,
    },
    include: ['../src/**/*.ts', './**/*.ts'],
    exclude: ['../node_modules', '../dist'],
  };

  writeJsonFile(path.join(project.outDir, 'tsconfig.json'), tsconfig);
}
