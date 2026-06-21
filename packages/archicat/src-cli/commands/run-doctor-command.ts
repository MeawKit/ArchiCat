import { doctor } from '@internal/doctor';

import type { ArchicatCliCommandOptions, ArchicatCliCommandResult } from './command-result.js';
import { successResult } from './command-result.js';

// MARK: - Public

export async function runDoctorCommand(options: ArchicatCliCommandOptions): Promise<ArchicatCliCommandResult> {
  const issues = await doctor(options.config);

  if (issues.length === 0) {
    return successResult(['Doctor found no issues.']);
  }

  return {
    exitCode: issues.some((issue) => issue.severity === 'error') ? 1 : 0,
    lines: issues.map((issue) => ({
      kind: issue.severity === 'error' ? 'error' : 'warning',
      message: issue.message,
    })),
  };
}
