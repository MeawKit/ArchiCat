// MARK: - Public

export interface ArchicatCliCommandOptions {
  readonly config?: string;
}

export interface ArchicatCliCommandLine {
  readonly kind: 'success' | 'info' | 'warning' | 'error';
  readonly message: string;
}

export interface ArchicatCliCommandResult {
  readonly exitCode: number;
  readonly lines: readonly ArchicatCliCommandLine[];
}

export function successResult(messages: readonly string[]): ArchicatCliCommandResult {
  return {
    exitCode: 0,
    lines: messages.map((message) => ({ kind: 'success', message })),
  };
}

export function failureResult(messages: readonly string[]): ArchicatCliCommandResult {
  return {
    exitCode: 1,
    lines: messages.map((message) => ({ kind: 'error', message })),
  };
}
