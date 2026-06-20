# ArchiCat

Contract-first module boundaries for TypeScript moduliths.

ArchiCat generates a `.archicat` project layer from explicit module contracts. It gives a single TypeScript backend project Gradle-like `api` / `impl` boundaries without splitting every module into a package.

## What ArchiCat does

- generates public module aliases such as `@account` and `@account/session/context`
- mirrors module API folders into `.archicat/modules/*/api`
- hides module implementations from other modules
- validates declared module dependencies
- blocks cross-module source imports
- generates a module graph and runtime composition entries

ArchiCat does not generate business logic, repositories, routes, schemas, or domain models.

## Repository layout

```txt
packages/codegen/
  src/           public API for consumers
  src-cli/       CLI runner
  src-internal/  generator, checker, loader, graph, scanner
  bin/           archicat binary
```

The public package API is intentionally small:

```ts
import { defineArchicatConfig, defineModule } from 'archicat';
```

## Root config

Create `archicat.config.ts` in your project root:

```ts
import { defineArchicatConfig } from 'archicat';

export default defineArchicatConfig({
  root: '.',
  outDir: './.archicat',
  modules: {
    include: ['./src/modules/*/archicat.module.ts'],
  },
});
```

## Module contract

Each module has an explicit contract:

```ts
import { defineModule } from 'archicat';

export default defineModule({
  id: 'account',
  api: './api',
  impl: './impl',
  dependencies: ['media'],
});
```

Only `id` is required.

If `api` is omitted, ArchiCat generates an empty public API mirror.  
If `impl` is omitted, ArchiCat generates a no-op implementation mirror.

## Module imports

Import other modules through generated public aliases:

```ts
import { AccountReader } from '@account';
import type { AccountSessionContext } from '@account/session/context';
```

Do not import another module through source paths:

```ts
import { AccountReader } from '../../account/api/index.js'; // invalid
import { AccountRepository } from '../../account/impl/index.js'; // invalid
```

A module may import another module only when it declares that module as a dependency.

## Generated output

Running `archicat generate` creates:

```txt
.archicat/
  tsconfig.json
  manifest.json
  modules/
    account/
      api/
      impl/
  generated/
    modules.ts
    composition.ts
  report/
    module-graph.json
    module-graph.mmd
```

Your root `tsconfig.json` should extend the generated config:

```json
{
  "extends": "./.archicat/tsconfig.json"
}
```

## Commands

```txt
archicat generate   generate the .archicat project layer
archicat check      validate module boundaries
archicat graph      generate graph outputs
archicat doctor     check project setup
```


## Release

ArchiCat uses manual package versioning. Update `packages/codegen/package.json` yourself, push the change, and run the `Publish Packages` GitHub Action manually.

The workflow publishes `archicat` to npm, creates a `vX.Y.Z` git tag from the published version, and creates a GitHub Release from that tag.

```txt
npm package     archicat@0.1.0
git tag         v0.1.0
GitHub Release  v0.1.0
```

## Development

```txt
pnpm install
pnpm run build
pnpm run typecheck
pnpm run test
```

Tests create temporary consumer projects, link the built `archicat` package, run the real CLI, and verify generated output plus boundary failures.

## Package status

The npm package is published as `archicat`. Verify name availability before the first publish.
