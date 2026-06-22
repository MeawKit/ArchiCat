import { doctorProject } from '@internal/doctor';
import { generateArtifacts } from '@internal/generator';
import { formatViolation, validateProject } from '@internal/validator';

import type { ArchicatCliCommandResult } from '../commands/index.js';
import type { ArchicatPipelineStep } from './archicat-pipeline.js';

// MARK: - Public

export function doctorStep(): ArchicatPipelineStep {
  return {
    name: 'doctor',
    async run(context): Promise<ArchicatCliCommandResult> {
      const issues = doctorProject(await context.getProject());

      if (issues.length === 0) {
        return successStep('doctor', 'Project diagnostics passed.');
      }

      const hasErrors = issues.some((issue) => issue.severity === 'error');

      return {
        exitCode: hasErrors ? 1 : 0,
        lines: [
          {
            kind: hasErrors ? 'error' : 'warning',
            message: formatStep('doctor', hasErrors ? 'Project diagnostics failed.' : 'Project diagnostics completed with warnings.'),
          },
          ...issues.map((issue) => ({
            kind: issue.severity === 'error' ? 'error' : 'warning',
            message: `  ${issue.message}`,
          }) as const),
        ],
      };
    },
  };
}

export function validateStep(): ArchicatPipelineStep {
  return {
    name: 'validate',
    async run(context): Promise<ArchicatCliCommandResult> {
      const violations = validateProject(await context.getProject());

      if (violations.length === 0) {
        return successStep('validate', 'Architecture boundaries passed.');
      }

      return {
        exitCode: 1,
        lines: [
          { kind: 'error', message: formatStep('validate', 'Architecture validation failed.') },
          ...violations.map((violation) => ({ kind: 'error' as const, message: formatViolation(violation) })),
        ],
      };
    },
  };
}

export function generateStep(): ArchicatPipelineStep {
  return {
    name: 'build',
    async run(context): Promise<ArchicatCliCommandResult> {
      const project = await context.getProject();
      generateArtifacts(project);

      return {
        exitCode: 0,
        lines: [
          { kind: 'success', message: formatStep('build', `Mirrored ${project.modules.length} modules.`) },
          { kind: 'success', message: formatStep('build', `Mirrored ${project.libraries.length} libraries.`) },
          { kind: 'success', message: formatStep('build', `Resolved ${project.apps.length} apps.`) },
        ],
      };
    },
  };
}

// MARK: - Private

function successStep(name: string, message: string): ArchicatCliCommandResult {
  return {
    exitCode: 0,
    lines: [{ kind: 'success', message: formatStep(name, message) }],
  };
}

function formatStep(name: string, message: string): string {
  return `${name.padEnd(10, ' ')} ${message}`;
}
