# Archicat

**M²: Modular Mirroring.**

The generative architecture framework for clean architecture.

Archicat generates a mirror from your source code. APIs become aliases. Implementations stay behind architecture rules.

```bash
npm i -D archicat
```

## Why

TypeScript asks: will this import resolve?
Archicat asks: should this import exist?

One is a compiler. The other is an architect.

## Definitions

### Module

Business/application unit.

```ts
import { defineModule } from 'archicat';

export default defineModule({
  name: 'media',

  api: {
    root: './api',
    dependencies: ['module.account.api', 'library.error.api'],
  },

  impl: {
    root: './impl',
    dependencies: ['module.account.api', 'library.backend.api'],
  },
});
```

### Library

Lower reusable unit.

```ts
import { defineLibrary } from 'archicat';

export default defineLibrary({
  name: 'backend',

  api: './api',
  impl: './impl',
});
```

### App

Composition root.

```ts
import { defineApp } from 'archicat';

export default defineApp({
  name: 'main-api',
  root: './src/app',

  dependencies: [
    'module.media.impl',
    'library.backend.impl',
  ],
});
```

## Dependency rules

### Module

| Source | Can depend on | Cannot depend on |
|---|---|---|
| `module.*.api` | `module.*.api`, `library.*.api` | `module.*.impl`, `library.*.impl` |
| `module.*.impl` | own `module.*.api`, `module.*.api`, `library.*.api` | `module.*.impl`, `library.*.impl` |

### Library

| Source | Can depend on | Cannot depend on |
|---|---|---|
| `library.*.api` | `library.*.api` | `module.*`, `library.*.impl` |
| `library.*.impl` | own `library.*.api`, `library.*.api` | `module.*`, `library.*.impl` |

### App

| Source | Can depend on | Cannot depend on |
|---|---|---|
| `app.*` | `module.*.api`, `module.*.impl`, `library.*.api`, `library.*.impl` | nothing inside the Archicat graph |

> [!IMPORTANT]
> Implementation targets are wired by app composition. Normal modules and libraries depend on API targets.

## Imports

Public API import:

```ts
import { AccountReader } from '@module/account';
```

App composition import:

```ts
import { mediaAssembly } from '@module/media/impl';
```

Blocked outside app composition:

```ts
import { MediaRepository } from '@module/media/impl';
import { MediaRepository } from '../../media/impl/repository';
```

## Config

```ts
import { defineArchicatConfig } from 'archicat';

export default defineArchicatConfig({
  typescript: {
    tsConfig: {
      extends: '../../tsconfig.node.json',
      include: ['bootstrap.ts', 'src/app', 'src/libraries', 'src/modules', 'types'],
      exclude: ['node_modules', 'dist'],
    },
  },

  alias: {
    '@app': './src/app/index.ts',
    '@app/*': './src/app/*',
  },

  modules: {
    include: ['./src/modules'],
  },

  libraries: {
    include: ['./src/libraries'],
  },

  apps: {
    include: ['./src/app'],
  },
});
```

App `tsconfig.json`:

```json
{
  "extends": "./.archicat/tsconfig.json",
  "compilerOptions": {
    "rootDir": ".",
    "outDir": "./dist"
  }
}
```

> [!IMPORTANT]
> Generated `.archicat/tsconfig.json` extends `typescript.tsConfig.extends`, therefore put user aliases in `archicat.config.ts`, not in `compilerOptions.paths`.

## Output

```txt
.archicat/
  tsconfig.json
  modules/
  libraries/
  types/
  reports/
    build.report.json
    graph.report.json
```

## Commands

```bash
archicat build
archicat validate
archicat graph
archicat doctor
```
