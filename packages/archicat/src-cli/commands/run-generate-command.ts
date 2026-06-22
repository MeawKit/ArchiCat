import type { ArchicatCliCommandOptions, ArchicatCliCommandResult } from './command-result.js';
import { runBuildCommand } from './run-build-command.js';

// MARK: - Public

export async function runGenerateCommand(options: ArchicatCliCommandOptions): Promise<ArchicatCliCommandResult> {
  return await runBuildCommand(options);
}
