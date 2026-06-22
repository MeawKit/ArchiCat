import { spawnSync, type SpawnSyncReturns } from 'node:child_process';

import { cliPath } from './paths';

// MARK: - Public

export function runArchicat(cwd: string, command: string, args: readonly string[] = []): SpawnSyncReturns<string> {
  return spawnSync(process.execPath, [cliPath, command, ...args], {
    cwd: cwd,
    encoding: 'utf8',
    env: {
      ...process.env,
      FORCE_COLOR: '0',
    },
  });
}
