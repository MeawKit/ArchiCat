import { check } from '@internal/checker';
import { doctor } from '@internal/checker/doctor';
import { generate } from '@internal/generator';

// MARK: - Public

export async function runMain(argv = process.argv.slice(2)): Promise<void> {
  const [command, ...rest] = argv;
  const options = parseOptions(rest);

  try {
    switch (command) {
      case 'generate': {
        const project = await generate(options.config);
        logSuccess(`Generated ${project.modules.length} module(s) into ${project.outDir}`);
        return;
      }

      case 'check': {
        const violations = await check(options.config);

        if (violations.length === 0) {
          logSuccess('Architecture check passed.');
          return;
        }

        for (const violation of violations) {
          logError(`${violation.filePath}\n  import: ${violation.importPath}\n  ${violation.message}`);
        }

        process.exitCode = 1;
        return;
      }

      case 'graph': {
        const project = await generate(options.config);
        logSuccess(`Generated graph for ${project.modules.length} module(s).`);
        return;
      }

      case 'doctor': {
        const issues = await doctor(options.config);

        if (issues.length === 0) {
          logSuccess('Doctor found no issues.');
          return;
        }

        for (const issue of issues) {
          if (issue.severity === 'error') {
            logError(issue.message);
            continue;
          }

          logWarn(issue.message);
        }

        return;
      }

      case 'help':
      case '--help':
      case '-h':
      case undefined: {
        printHelp();
        return;
      }

      default: {
        logError(`Unknown command: ${command}`);
        printHelp();
        process.exitCode = 1;
      }
    }
  } catch (error) {
    logError(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  }
}

// MARK: - Private

interface CliOptions {
  config?: string;
}

function parseOptions(args: string[]): CliOptions {
  const options: CliOptions = {};

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

function printHelp(): void {
  console.log([
    'ArchiCat',
    '',
    'Usage:',
    '  archicat generate [--config archicat.config.ts]',
    '  archicat check [--config archicat.config.ts]',
    '  archicat graph [--config archicat.config.ts]',
    '  archicat doctor [--config archicat.config.ts]',
    '',
  ].join('\n'));
}

function logSuccess(message: string): void {
  console.log(`✓ ${message}`);
}

function logWarn(message: string): void {
  console.warn(`! ${message}`);
}

function logError(message: string): void {
  console.error(`✗ ${message}`);
}
