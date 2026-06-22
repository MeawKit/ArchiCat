import { consola } from 'consola';

import type { ArchicatCliCommandLine, ArchicatCliCommandResult } from '../commands/index.js';

// MARK: - Public

export class ArchicatCliLogger {
  public result(result: ArchicatCliCommandResult): void {
    for (const line of result.lines) {
      this.line(line);
    }
  }

  public line(line: ArchicatCliCommandLine): void {
    if (line.message.length === 0) {
      consola.log('');
      return;
    }

    switch (line.kind) {
      case 'success':
        consola.success(line.message);
        return;
      case 'warning':
        consola.warn(line.message);
        return;
      case 'error':
        consola.error(line.message);
        return;
      case 'info':
        consola.info(line.message);
        return;
    }
  }

  public help(): void {
    consola.log([
      'Archicat',
      '',
      'Usage:',
      '  archicat build [--config archicat.config.ts]',
      '  archicat validate [--config archicat.config.ts]',
      '  archicat graph [--config archicat.config.ts]',
      '  archicat doctor [--config archicat.config.ts]',
      '',
      'Aliases:',
      '  archicat generate -> archicat build',
      '  archicat check    -> archicat validate',
      '',
    ].join('\n'));
  }
}
