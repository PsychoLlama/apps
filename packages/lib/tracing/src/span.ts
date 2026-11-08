import type { Logger } from '@holz/core';

/** A named unit of work within a trace. */
export interface Span {
  /** What this span measures. */
  readonly name: string;

  /** Logs on behalf of this span. */
  readonly log: Logger;
}
