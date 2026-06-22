import type { ArchicatCliCommandOptions, ArchicatCliCommandResult } from './command-result.js';
import { runValidateCommand } from './run-validate-command.js';

// MARK: - Public

export async function runCheckCommand(options: ArchicatCliCommandOptions): Promise<ArchicatCliCommandResult> {
  return await runValidateCommand(options);
}
