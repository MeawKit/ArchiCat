import { createConsola } from 'consola';
import { colors } from 'consola/utils';

// MARK: - Public

export interface ConsolePanelRow {
  readonly label: string;
  readonly value: string | number;
}

export class ConsoleOutput {
  public static readonly color = colors;

  public static title(product: string, command: string, rows: readonly ConsolePanelRow[] = []): void {
    printPanel({
      title: `${product} ${command}`.trim(),
      renderedTitle: `${colors.cyan(colors.bold(product))} ${colors.dim(command)}`,
      rows: rows,
      formatValue: colors.green,
    });
  }

  public static panel(title: string, rows: readonly ConsolePanelRow[], badge?: string | number): void {
    printPanel({
      title: badge === undefined ? title : `${title} ${badge}`,
      renderedTitle: `${colors.cyan(colors.bold(title))}${badge === undefined ? '' : ` ${colors.green(String(badge))}`}`,
      rows: rows,
      formatValue: colors.green,
    });
  }

  public static step(label: string, message: string): string {
    return `${colors.cyan(label.padEnd(STEP_LABEL_WIDTH, ' '))}${message}`;
  }

  public static duration(ms: number): string {
    return ms < 1000 ? `${ms}ms` : `${(ms / 1000).toFixed(2)}s`;
  }

  public static emptyLine(): void {
    consoleOutput.log('');
  }

  public static log(message?: unknown, ...args: readonly unknown[]): void {
    consoleOutput.log(message, ...args);
  }

  public static info(message?: unknown, ...args: readonly unknown[]): void {
    consoleOutput.info(message, ...args);
  }

  public static success(message?: unknown, ...args: readonly unknown[]): void {
    consoleOutput.success(message, ...args);
  }

  public static warn(message?: unknown, ...args: readonly unknown[]): void {
    consoleOutput.warn(message, ...args);
  }

  public static error(message?: unknown, ...args: readonly unknown[]): void {
    consoleOutput.error(message, ...args);
  }
}

// MARK: - Private

interface PanelDefinition {
  readonly title: string;
  readonly renderedTitle: string;
  readonly rows: readonly ConsolePanelRow[];
  readonly formatValue: (value: string) => string;
}

const consoleOutput = createConsola({
  level: +999,
  formatOptions: {
    colors: true,
    date: false,
  },
});

const ANSI_PATTERN = /\u001B\[[0-9;]*m/g;
const PANEL_LABEL_WIDTH = 14;
const PANEL_MIN_WIDTH = 48;
const STEP_LABEL_WIDTH = 10;

function printPanel(definition: PanelDefinition): void {
  const width = getPanelWidth(definition.title, definition.rows);

  consoleOutput.log(
    [
      formatPanelTop(definition, width),
      ...definition.rows.map((row) => formatPanelRow(row, width, definition.formatValue)),
      formatPanelBottom(width),
    ].join('\n'),
  );
}

function formatPanelTop(definition: PanelDefinition, width: number): string {
  const gap = Math.max(1, width - visibleLength(definition.title) - 5);

  return `${colors.dim('╭─')} ${definition.renderedTitle} ${colors.dim('─'.repeat(gap))}${colors.dim('╮')}`;
}

function formatPanelBottom(width: number): string {
  return `${colors.dim('╰')}${colors.dim('─'.repeat(width - 2))}${colors.dim('╯')}`;
}

function formatPanelRow(row: ConsolePanelRow, width: number, formatValue: (value: string) => string): string {
  const label = row.label.padEnd(PANEL_LABEL_WIDTH, ' ');
  const value = String(row.value);
  const rowWidth = visibleLength(`${label}${value}`);
  const padding = Math.max(0, width - rowWidth - 4);

  return `${colors.dim('│')} ${colors.blue(label)}${formatValue(value)}${' '.repeat(padding)} ${colors.dim('│')}`;
}

function getPanelWidth(title: string, rows: readonly ConsolePanelRow[]): number {
  const titleWidth = visibleLength(title) + 6;
  const rowWidth = Math.max(0, ...rows.map((row) => PANEL_LABEL_WIDTH + visibleLength(String(row.value)) + 4));

  return Math.max(PANEL_MIN_WIDTH, titleWidth, rowWidth);
}

function visibleLength(value: string): number {
  return value.replace(ANSI_PATTERN, '').length;
}
