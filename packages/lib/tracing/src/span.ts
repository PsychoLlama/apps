import type { Logger } from '@holz/core';

import type { Context } from './config';

/** Plain data describing a span. This is what processors receive. */
export interface Span {
  /** What this span measures. */
  readonly name: string;

  /** Identifies the trace. Shared by a root span and all its descendants. */
  readonly traceId: Uint8Array;

  /** Identifies this span within its trace. */
  readonly spanId: Uint8Array;
}

/** The API for instrumenting a unit of work. */
export interface SpanHandle {
  /** Logs on behalf of this span. */
  readonly log: Logger;

  /** Create a span nested under this one. */
  child: (name: string) => SpanHandle;
}

/** What a span inherits. Passed from a span to its children. */
interface SpanContext extends Context {
  /** The trace this span belongs to. */
  readonly traceId: Uint8Array;
}

/** Create a span and announce its data to the processor. */
export const createSpan = (name: string, context: SpanContext): SpanHandle => {
  const span: Span = {
    name,
    traceId: context.traceId,
    spanId: context.getRandomBytes(8),
  };

  // The handler goes unused until spans can apply actions.
  context.processor(span);

  return {
    log: context.log,
    child: (childName) => createSpan(childName, context),
  };
};
