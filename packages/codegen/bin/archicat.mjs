#!/usr/bin/env node
import { fileURLToPath } from 'node:url';

import { runMain } from '../dist/cli/index.mjs';

globalThis.__archicat_cli__ = {
  startTime: Date.now(),
  entry: fileURLToPath(import.meta.url),
};

await runMain();
