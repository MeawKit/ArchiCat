import { ArchicatPipeline, doctorStep, generateStep, validateStep } from '../pipeline/index.js';
import type { ArchicatCliCommandOptions, ArchicatCliCommandResult } from './command-result.js';

// MARK: - Public

export async function runBuildCommand(options: ArchicatCliCommandOptions): Promise<ArchicatCliCommandResult> {
  return await ArchicatPipeline.build('build').use(doctorStep()).use(validateStep()).use(generateStep()).run(options);
}
