import type { Logger } from '@holz/core';

import type { TraceProcessor } from './processor';

/** A named unit of work within a trace. */
export interface Span {
  /** What this span measures. */
  readonly name: string;

  /** Logs on behalf of this span. */
  readonly log: Logger;

  /** Create a span nested under this one. */
  child: (name: string) => Span;
}

/** What a span inherits from its tracer. */
interface SpanContext {
  log: Logger;
  processor: TraceProcessor;
}

/** Create a span and announce it to the processor. */
export const createSpan = (name: string, context: SpanContext): Span => {
  const span: Span = {
    name,
    log: context.log,
    child: (childName) => createSpan(childName, context),
  };

  // The handler goes unused until spans can apply actions.
  context.processor(span);

  return span;
};
