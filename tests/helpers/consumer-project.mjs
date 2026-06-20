import fs from 'node:fs';
import path from 'node:path';

import { codegenPackageRoot, tmpRoot } from './paths.mjs';
import { writeFile } from './files.mjs';

export function createConsumerProject(name) {
  fs.mkdirSync(tmpRoot, { recursive: true });

  const root = fs.mkdtempSync(path.join(tmpRoot, `${name}-`));

  linkCodegenPackage(root);
  writeRootConfig(root);
  writeTsconfig(root);

  return root;
}

export function createModule(root, options) {
  const moduleDir = path.join(root, 'src/modules', options.id);
  const fields = [`id: '${options.id}'`];

  if (options.api !== false) {
    fields.push("api: './api'");
    writeFile(path.join(moduleDir, 'api/index.ts'), options.apiIndex ?? `export const ${toIdentifier(options.id)}Api = '${options.id}';`);
  }

  if (options.impl !== false) {
    fields.push("impl: './impl'");
    writeFile(path.join(moduleDir, 'impl/index.ts'), options.implIndex ?? `export const ${toIdentifier(options.id)}Impl = '${options.id}';`);
  }

  if (options.dependencies?.length) {
    fields.push(`dependencies: [${options.dependencies.map((dependency) => `'${dependency}'`).join(', ')}]`);
  }

  writeFile(path.join(moduleDir, 'archicat.module.ts'), `
    import { defineModule } from 'archicat';

    export default defineModule({
      ${fields.join(',\n      ')},
    });
  `);

  return moduleDir;
}

export function cleanupConsumerProjects() {
  fs.rmSync(tmpRoot, { recursive: true, force: true });
}

function linkCodegenPackage(root) {
  const nodeModulesDir = path.join(root, 'node_modules');
  const linkPath = path.join(nodeModulesDir, 'archicat');

  fs.mkdirSync(nodeModulesDir, { recursive: true });
  fs.rmSync(linkPath, { recursive: true, force: true });
  fs.symlinkSync(codegenPackageRoot, linkPath, 'junction');
}

function writeRootConfig(root) {
  writeFile(path.join(root, 'archicat.config.ts'), `
    import { defineArchicatConfig } from 'archicat';

    export default defineArchicatConfig({
      root: '.',
      outDir: './.archicat',
      modules: {
        include: ['./src/modules/*/archicat.module.ts'],
      },
    });
  `);
}

function writeTsconfig(root) {
  writeFile(path.join(root, 'tsconfig.base.json'), `
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

function toIdentifier(value) {
  return value.replace(/-([a-z0-9])/g, (_, char) => char.toUpperCase());
}
