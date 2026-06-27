import { ArchicatPipeline, validateStep } from '../pipeline/index.js';
import type { ArchicatCliCommandOptions, ArchicatCliCommandResult } from './command-result.js';

// MARK: - Public

export async function runValidateCommand(options: ArchicatCliCommandOptions): Promise<ArchicatCliCommandResult> {
  return await ArchicatPipeline.make('validate').use(validateStep()).run(options);
}
