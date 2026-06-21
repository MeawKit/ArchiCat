import { spawnSync } from 'node:child_process';

import { cliPath } from './paths.mjs';

export function runArchicat(cwd, command, args = []) {
  return spawnSync(process.execPath, [cliPath, command, ...args], {
    cwd,
    encoding: 'utf8',
    env: {
      ...process.env,
      FORCE_COLOR: '0',
    },
  });
}
