import type { Logger } from '@holz/core';

import type { Context } from './config';

const TRACE_ID_BYTES = 16;
const SPAN_ID_BYTES = 8;

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

/**
 * Create a span and announce its data to the processor. Starts a new trace
 * unless given the `traceId` of an existing one.
 */
export const createSpan = (
  name: string,
  context: Context,
  traceId = context.getRandomBytes(TRACE_ID_BYTES),
): SpanHandle => {
  // The handler goes unused until spans can apply actions.
  context.processor({
    name,
    traceId,
    spanId: context.getRandomBytes(SPAN_ID_BYTES),
  });

  return {
    log: context.log,
    child: (childName) => createSpan(childName, context, traceId),
  };
};
