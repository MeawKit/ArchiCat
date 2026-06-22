import { ArchicatPipeline, doctorStep } from '../pipeline/index.js';
import type { ArchicatCliCommandOptions, ArchicatCliCommandResult } from './command-result.js';

// MARK: - Public

export async function runDoctorCommand(options: ArchicatCliCommandOptions): Promise<ArchicatCliCommandResult> {
  return await ArchicatPipeline.build('doctor').use(doctorStep()).run(options);
}
