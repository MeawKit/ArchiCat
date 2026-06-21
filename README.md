# Archicat

**M²: Modular Mirroring.**

The generative architecture framework for clean architecture.

Archicat generates a module mirror from your source code. Public APIs become aliases. Implementations stay private. The mirror is the boundary.

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
  id: 'media',
  api: './api',
  impl: './impl',
  dependencies: ['module.account.api'],
});
```

Archicat mirrors it:

```txt
.archicat/modules/media/
  api/
  impl/
```

You import the mirror:

```ts
import { AccountReader } from '@module/account';
```

Not the machinery:

```ts
import { AccountRepository } from '@module/account/impl'; // does not exist
import { AccountRepository } from '../../account/impl/repository'; // blocked
```

## Config

```ts
import { defineArchicatConfig } from 'archicat';

export default defineArchicatConfig({
  modules: {
    include: ['./src/modules'],
  },
});
```

## Output

```txt
.archicat/
  tsconfig.json
  modules/
  types/

archicat-report/
  build.json
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
