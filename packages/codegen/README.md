# ArchiCat

**Modular Mirroring for clean architecture.**

ArchiCat is a 2M architecture framework: **Modular Mirroring**.

It generates a `.archicat` project layer from module definitions, exposes public module mirrors through aliases like `@account`, and checks that module imports respect declared dependencies.

```bash
npm i -D archicat
```

## Why

Clean architecture breaks when private implementation files become convenient imports.

ArchiCat keeps modules honest:

```txt
api   public surface
impl  private implementation
```

Other modules import the generated public mirror:

```ts
import { AccountReader } from '@account';
import type { AccountSessionContext } from '@account/session/context';
```

They do not import source implementation paths:

```ts
import { AccountRepository } from '../../account/impl/repository'; // blocked
```

Use the mirror, not the machinery.

## Setup

Create `archicat.config.ts`:

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

Define a module:

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

Missing `api` creates an empty public API mirror.

Missing `impl` creates a no-op implementation mirror.

## Generated layer

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

```bash
archicat generate   generate the mirror layer
archicat check      validate module boundaries
archicat graph      generate graph reports
archicat doctor     inspect project setup
```

## What ArchiCat does

```txt
defines module boundaries
mirrors public module APIs
generates aliases
generates composition entries
checks declared dependencies
blocks cross-module source imports
outputs module graph reports
```

## What ArchiCat does not do

ArchiCat does not generate business logic, repositories, routes, schemas, controllers, or domain models.

It builds and checks the architecture layer. Your application stays yours.
