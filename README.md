# ArchiCat

**Modular Mirroring for clean architecture.**

ArchiCat is a 2M architecture framework: **Modular Mirroring**.

It takes explicit module definitions and generates a `.archicat` project layer with public module mirrors, aliases, dependency checks, graph output, and runtime composition entries.

```bash
npm i -D archicat
```

## Why

Clean architecture usually starts well.

Then imports happen.

One module reaches into another module's private folder. A route imports a repository directly. A helper reaches across features because the relative path was easy. Suddenly the architecture exists only in a diagram nobody opens.

ArchiCat makes the module boundary part of the build.

```txt
source modules
  -> ArchiCat module definitions
  -> generated module mirrors
  -> checked imports
  -> clean architecture that can actually hold
```

## 2M: Modular Mirroring

A module has two sides:

```txt
api   public surface other modules may use
impl  private implementation hidden behind the mirror
```

ArchiCat mirrors the public API into `.archicat` and exposes it through generated aliases.

```ts
import { AccountReader } from '@account';
import type { AccountSessionContext } from '@account/session/context';
```

Other modules do not import source folders directly.

```ts
import { AccountRepository } from '../../account/impl/repository'; // blocked
```

The rule is simple:

```txt
use the mirror, not the machinery
```

## Package

```txt
packages/codegen
  src/           consumer-facing public API
  src-cli/       CLI runner
  src-internal/  generator, checker, loader, graph, scanner
  bin/           archicat binary
```

Consumer API:

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

## Module definition

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

If `api` is missing, ArchiCat generates an empty public API mirror.

If `impl` is missing, ArchiCat generates a no-op implementation mirror.

## Generated output

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

```bash
archicat generate
archicat check
archicat graph
archicat doctor
```

## Development

```bash
pnpm install
pnpm run build
pnpm run typecheck
pnpm run test
```

Tests create temporary consumer projects, link the built `archicat` package, run the real CLI, and verify generated output plus boundary failures.

## Release

ArchiCat uses manual package versioning.

Update `packages/codegen/package.json` yourself, push the change, and run the `Publish Packages` GitHub Action manually.

The workflow publishes `archicat` to npm, creates a `vX.Y.Z` git tag, and creates a GitHub Release from that tag.

```txt
npm package     archicat@0.0.2
git tag         v0.0.2
GitHub Release  v0.0.2
```

Publishing uses npm Trusted Publishing / OIDC. No npm token is committed.
