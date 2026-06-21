# ArchiCat

**M²: Modular Mirroring.**

The generative architecture framework for clean architecture.

ArchiCat generates a module mirror from your source code. Public APIs become aliases. Implementations stay private. The mirror is the boundary.

```bash
npm i -D archicat
```

## Why

Architecture should be enforceable.

Your code stays yours.

## M²

**M²** means **Modular Mirroring**.

```txt
source modules
  -> module definitions
  -> generated mirror
  -> checked boundaries
```

You define the module:

```ts
import { defineModule } from 'archicat';

export default defineModule({
  id: 'account',
  api: './api',
  impl: './impl',
  dependencies: ['media'],
});
```

ArchiCat mirrors it:

```txt
.archicat/modules/account/
  api/
  impl/
```

You import the mirror:

```ts
import { AccountReader } from '@account';
```

Not the machinery:

```ts
import { AccountRepository } from '@account/impl'; // does not exist
import { AccountRepository } from '../../account/impl/repository'; // blocked
```

## Config

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

## Output

```txt
.archicat/
  tsconfig.json
  manifest.json
  modules/
  generated/
  report/
```

Extend the generated config:

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
