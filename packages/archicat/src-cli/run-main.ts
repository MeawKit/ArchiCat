import type { ArchicatCliCommandLine, ArchicatCliCommandOptions, ArchicatCliCommandResult } from './commands/index.js';
import { runCheckCommand, runDoctorCommand, runGenerateCommand, runGraphCommand } from './commands/index.js';

// MARK: - Public

export async function runMain(argv = process.argv.slice(2)): Promise<void> {
  const [command, ...rest] = argv;

  try {
    const options = parseOptions(rest);
    const result = await runCommand(command, options);

    if (!result) {
      return;
    }

    printResult(result);
    process.exitCode = result.exitCode;
  } catch (error) {
    printLine({ kind: 'error', message: error instanceof Error ? error.message : String(error) });
    process.exitCode = 1;
  }
}

// MARK: - Private command routing

async function runCommand(
  command: string | undefined,
  options: ArchicatCliCommandOptions,
): Promise<ArchicatCliCommandResult | undefined> {
  switch (command) {
    case 'generate':
      return runGenerateCommand(options);
    case 'check':
      return runCheckCommand(options);
    case 'graph':
      return runGraphCommand(options);
    case 'doctor':
      return runDoctorCommand(options);
    case 'help':
    case '--help':
    case '-h':
    case undefined:
      printHelp();
      return undefined;
    default:
      printLine({ kind: 'error', message: `Unknown command: ${command}` });
      printHelp();
      return { exitCode: 1, lines: [] };
  }
}

// MARK: - Private options

function parseOptions(args: string[]): ArchicatCliCommandOptions {
  const options: { config?: string } = {};

  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];

    if (arg === '--config' || arg === '-c') {
      const value = args[index + 1];

      if (!value) {
        throw new Error(`${arg} requires a value.`);
      }

      options.config = value;
      index += 1;
    }
  }

  return options;
}

// MARK: - Private output

function printResult(result: ArchicatCliCommandResult): void {
  for (const line of result.lines) {
    printLine(line);
  }
}

function printHelp(): void {
  console.log([
    'Archicat',
    '',
    'Usage:',
    '  archicat generate [--config archicat.config.ts]',
    '  archicat check [--config archicat.config.ts]',
    '  archicat graph [--config archicat.config.ts]',
    '  archicat doctor [--config archicat.config.ts]',
    '',
  ].join('\n'));
}

function printLine(line: ArchicatCliCommandLine): void {
  switch (line.kind) {
    case 'success':
      console.log(`✓ ${line.message}`);
      return;
    case 'warning':
      console.warn(`! ${line.message}`);
      return;
    case 'error':
      console.error(`✗ ${line.message}`);
      return;
    case 'info':
      console.log(line.message);
      return;
  }
}
