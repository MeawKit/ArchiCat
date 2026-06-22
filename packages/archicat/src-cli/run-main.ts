import type { ArchicatCliCommandOptions, ArchicatCliCommandResult } from './commands/index.js';
import {
  runBuildCommand,
  runCheckCommand,
  runDoctorCommand,
  runGenerateCommand,
  runGraphCommand,
  runValidateCommand,
} from './commands/index.js';
import { ArchicatCliLogger } from './logger/cli-logger.js';

// MARK: - Public

export async function runMain(argv = process.argv.slice(2)): Promise<void> {
  const [command, ...rest] = argv;
  const logger = new ArchicatCliLogger();

  try {
    const options = parseOptions(rest);
    const result = await runCommand(command, options, logger);

    if (!result) {
      return;
    }

    logger.result(result);
    process.exitCode = result.exitCode;
  } catch (error) {
    logger.line({ kind: 'error', message: error instanceof Error ? error.message : String(error) });
    process.exitCode = 1;
  }
}

// MARK: - Private command routing

async function runCommand(
  command: string | undefined,
  options: ArchicatCliCommandOptions,
  logger: ArchicatCliLogger,
): Promise<ArchicatCliCommandResult | undefined> {
  switch (command) {
    case 'build':
      return await runBuildCommand(options);
    case 'generate':
      return await runGenerateCommand(options);
    case 'validate':
      return await runValidateCommand(options);
    case 'check':
      return await runCheckCommand(options);
    case 'graph':
      return await runGraphCommand(options);
    case 'doctor':
      return await runDoctorCommand(options);
    case 'help':
    case '--help':
    case '-h':
    case undefined:
      logger.help();
      return undefined;
    default:
      logger.line({ kind: 'error', message: `Unknown command: ${command}` });
      logger.help();
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
