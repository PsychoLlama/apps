import { level, type LogLevel } from '@lib/observability';

/** Semantic color the `@lib/ui` Badge accepts. */
type BadgeColor = 'accent' | 'neutral' | 'danger' | 'warning' | 'success';

/** How a severity reads in the viewer: a short label and a badge color. */
export interface LevelDisplay {
  /** Uppercase short name, e.g. `WARN`. */
  label: string;
  /** Badge color carrying the severity at a glance. */
  color: BadgeColor;
}

// Total over `LogLevel`, so adding a severity upstream surfaces here as a
// type error rather than a missing badge.
const DISPLAY: Record<LogLevel, LevelDisplay> = {
  [level.fatal]: { label: 'FATAL', color: 'danger' },
  [level.error]: { label: 'ERROR', color: 'danger' },
  [level.warn]: { label: 'WARN', color: 'warning' },
  [level.info]: { label: 'INFO', color: 'accent' },
  [level.debug]: { label: 'DEBUG', color: 'neutral' },
  [level.trace]: { label: 'TRACE', color: 'neutral' },
};

/** How to render a log's severity in the viewer. */
export const levelDisplay = (severity: LogLevel): LevelDisplay =>
  DISPLAY[severity];
