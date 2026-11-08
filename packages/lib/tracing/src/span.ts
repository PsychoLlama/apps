import type { Logger } from '@holz/core';

import type { Context } from './config';

/** A named unit of work within a trace. */
export interface Span {
  /** What this span measures. */
  readonly name: string;

  /** Logs on behalf of this span. */
  readonly log: Logger;

  /** Create a span nested under this one. */
  child: (name: string) => Span;
}

/** Create a span and announce it to the processor. */
export const createSpan = (name: string, context: Context): Span => {
  const span: Span = {
    name,
    log: context.log,
    child: (childName) => createSpan(childName, context),
  };

  // The handler goes unused until spans can apply actions.
  context.processor(span);

  return span;
};
