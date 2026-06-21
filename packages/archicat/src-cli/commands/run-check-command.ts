import { validate } from '@internal/validator';

import type { ArchicatCliCommandOptions, ArchicatCliCommandResult } from './command-result.js';
import { failureResult, successResult } from './command-result.js';

// MARK: - Public

export async function runCheckCommand(options: ArchicatCliCommandOptions): Promise<ArchicatCliCommandResult> {
  const violations = await validate(options.config);

  if (violations.length === 0) {
    return successResult(['Architecture check passed.']);
  }

  return failureResult(violations.map((violation) => `${violation.filePath}\n  import: ${violation.importPath}\n  ${violation.message}`));
}
