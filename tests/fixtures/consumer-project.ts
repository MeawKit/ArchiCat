import fs from 'node:fs';
import path from 'node:path';

import { writeFile } from './files';
import { archicatPackageRoot, tmpRoot } from './paths';

// MARK: - Types

export interface ConsumerProjectOptions {
  readonly config?: ConsumerProjectConfig;
  readonly tsconfigBase?: string;
}

export interface ConsumerProjectConfig {
  readonly modulesInclude?: readonly string[];
  readonly librariesInclude?: readonly string[];
  readonly appsInclude?: readonly string[];
  readonly tsconfig?: string;
  readonly prefixes?: Record<string, string>;
  readonly alias?: Record<string, string>;
}

export interface DefinitionFixtureOptions {
  readonly name: string;
  readonly api?: false;
  readonly impl?: false;
  readonly apiDependencies?: readonly string[];
  readonly implDependencies?: readonly string[];
  readonly dependencies?: readonly string[];
  readonly apiIndex?: string;
  readonly implIndex?: string;
}

export interface AppFixtureOptions {
  readonly name: string;
  readonly dependencies?: readonly string[];
  readonly index?: string;
}

// MARK: - Public

export function createConsumerProject(name: string, options: ConsumerProjectOptions = {}): string {
  fs.mkdirSync(tmpRoot, { recursive: true });

  const root = fs.mkdtempSync(path.join(tmpRoot, `${name}-`));

  linkArchicatPackage(root);
  writeRootConfig(root, options.config ?? {});
  writeTsconfig(root, options.tsconfigBase ?? undefined);

  return root;
}

export function createModule(root: string, options: DefinitionFixtureOptions): string {
  const name = options.name;
  const moduleDir = path.join(root, 'src/modules', name);
  const fields = [`name: '${name}'`];

  if (options.api !== false) {
    const api = makeSurface('./api', options.apiDependencies ?? []);
    fields.push(`api: ${api}`);
    writeFile(path.join(moduleDir, 'api/index.ts'), options.apiIndex ?? `export const ${toIdentifier(name)}Api = '${name}';`);
  }

  if (options.impl !== false) {
    const impl = makeSurface('./impl', options.implDependencies ?? options.dependencies ?? []);
    fields.push(`impl: ${impl}`);
    writeFile(path.join(moduleDir, 'impl/index.ts'), options.implIndex ?? `export const ${toIdentifier(name)}Impl = '${name}';`);
  }

  writeFile(path.join(moduleDir, 'archicat.module.ts'), `
    import { defineModule } from 'archicat';

    export default defineModule({
      ${fields.join(',\n      ')},
    });
  `);

  return moduleDir;
}

export function createLibrary(root: string, options: DefinitionFixtureOptions): string {
  const name = options.name;
  const libraryDir = path.join(root, 'src/libraries', name);
  const fields = [`name: '${name}'`];

  if (options.api !== false) {
    const api = makeSurface('./api', options.apiDependencies ?? []);
    fields.push(`api: ${api}`);
    writeFile(path.join(libraryDir, 'api/index.ts'), options.apiIndex ?? `export const ${toIdentifier(name)}Library = '${name}';`);
  }

  if (options.impl !== false) {
    const impl = makeSurface('./impl', options.implDependencies ?? options.dependencies ?? []);
    fields.push(`impl: ${impl}`);
    writeFile(path.join(libraryDir, 'impl/index.ts'), options.implIndex ?? `export const ${toIdentifier(name)}LibraryImpl = '${name}';`);
  }

  writeFile(path.join(libraryDir, 'archicat.library.ts'), `
    import { defineLibrary } from 'archicat';

    export default defineLibrary({
      ${fields.join(',\n      ')},
    });
  `);

  return libraryDir;
}

export function createApp(root: string, options: AppFixtureOptions): string {
  const name = options.name;
  const appDir = path.join(root, 'src/apps', name);
  const fields = [`name: '${name}'`, `root: './'`];

  if (options.dependencies?.length) {
    fields.push(`dependencies: [${options.dependencies.map((dependency) => `'${dependency}'`).join(', ')}]`);
  }

  writeFile(path.join(appDir, 'index.ts'), options.index ?? `export const ${toIdentifier(name)}App = '${name}';`);
  writeFile(path.join(appDir, 'archicat.app.ts'), `
    import { defineApp } from 'archicat';

    export default defineApp({
      ${fields.join(',\n      ')},
    });
  `);

  return appDir;
}

export function cleanupConsumerProjects(): void {
  fs.rmSync(tmpRoot, { recursive: true, force: true });
}

// MARK: - Private

function linkArchicatPackage(root: string): void {
  const nodeModulesDir = path.join(root, 'node_modules');
  const linkPath = path.join(nodeModulesDir, 'archicat');

  fs.mkdirSync(nodeModulesDir, { recursive: true });
  fs.rmSync(linkPath, { recursive: true, force: true });
  fs.symlinkSync(archicatPackageRoot, linkPath, 'junction');
}

function writeRootConfig(root: string, config: ConsumerProjectConfig): void {
  const modulesInclude = config.modulesInclude ?? ['./src/modules'];
  const librariesInclude = config.librariesInclude ?? [];
  const appsInclude = config.appsInclude ?? [];
  const tsconfig = config.tsconfig ?? './tsconfig.base.json';
  const prefixBlock = config.prefixes
    ? `\n      prefixes: ${formatObjectLiteral(config.prefixes)},`
    : '';
  const aliasBlock = config.alias
    ? `\n      alias: ${formatObjectLiteral(config.alias, true)},`
    : '';

  writeFile(path.join(root, 'archicat.config.ts'), `
    import { defineArchicatConfig } from 'archicat';

    export default defineArchicatConfig({
      tsconfig: '${tsconfig}',${prefixBlock}${aliasBlock}
      modules: {
        include: ${JSON.stringify(modulesInclude)},
      },
      libraries: {
        include: ${JSON.stringify(librariesInclude)},
      },
      apps: {
        include: ${JSON.stringify(appsInclude)},
      },
    });
  `);
}

function writeTsconfig(root: string, tsconfigBase?: string): void {
  writeFile(path.join(root, 'tsconfig.base.json'), tsconfigBase ?? `
    {
      "compilerOptions": {
        "target": "ES2024",
        "module": "NodeNext",
        "moduleResolution": "NodeNext",
        "strict": true
      }
    }
  `);

  writeFile(path.join(root, 'tsconfig.json'), `
    {
      "extends": "./.archicat/tsconfig.json"
    }
  `);
}

function makeSurface(root: string, dependencies: readonly string[]): string {
  if (!dependencies.length) {
    return `'${root}'`;
  }

  return `{ root: '${root}', dependencies: [${dependencies.map((dependency) => `'${dependency}'`).join(', ')}] }`;
}

function toIdentifier(value: string): string {
  return value.replace(/-([a-z0-9])/gu, (_, char: string) => char.toUpperCase());
}

function formatObjectLiteral(value: Record<string, string>, quoteKeys = false): string {
  return JSON.stringify(value, null, 8).replace(/"([^"\\]+)":/gu, quoteKeys ? "'$1':" : '$1:');
}
