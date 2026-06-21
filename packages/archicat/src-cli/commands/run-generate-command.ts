import { generate } from '@internal/generator';

import type { ArchicatCliCommandOptions, ArchicatCliCommandResult } from './command-result.js';
import { successResult } from './command-result.js';

// MARK: - Public

export async function runGenerateCommand(options: ArchicatCliCommandOptions): Promise<ArchicatCliCommandResult> {
  const project = await generate(options.config);

  return successResult([
    `Mirrored modules: ${project.modules.length}`,
    `Mirrored libraries: ${project.libraries.length}`,
  ]);
}
