import type { ArchicatCliCommandLine, ArchicatCliCommandOptions, ArchicatCliCommandResult } from '../commands/index.js';
import { ArchicatPipelineContext } from './archicat-pipeline-context.js';

// MARK: - Public

export interface ArchicatPipelineStep {
  readonly name: string;
  run(context: ArchicatPipelineContext): Promise<ArchicatCliCommandResult>;
}

export class ArchicatPipeline {
  private readonly steps: ArchicatPipelineStep[] = [];

  private constructor(private readonly name: string) {}

  public static build(name: string): ArchicatPipeline {
    return new ArchicatPipeline(name);
  }

  public use(step: ArchicatPipelineStep): this {
    this.steps.push(step);
    return this;
  }

  public async run(options: ArchicatCliCommandOptions): Promise<ArchicatCliCommandResult> {
    const context = new ArchicatPipelineContext(options);
    const startedAt = Date.now();
    const lines: ArchicatCliCommandLine[] = [{ kind: 'info', message: `Archicat ${this.name}` }, { kind: 'info', message: '' }];

    for (const step of this.steps) {
      const result = await step.run(context);
      lines.push(...result.lines);

      if (result.exitCode !== 0) {
        lines.push({ kind: 'info', message: '' });
        lines.push({ kind: 'error', message: `Failed in ${Date.now() - startedAt}ms` });
        return { exitCode: result.exitCode, lines };
      }
    }

    lines.push({ kind: 'info', message: '' });
    lines.push({ kind: 'success', message: `Done in ${Date.now() - startedAt}ms` });

    return { exitCode: 0, lines };
  }
}
