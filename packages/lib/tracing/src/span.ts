import type { Logger } from '@holz/core';

import type { Context } from './config';

const TRACE_ID_BYTES = 16;
const SPAN_ID_BYTES = 8;

/** A named unit of work within a trace. */
export interface Span {
  /** Identifies the trace. Shared by a root span and all its descendants. */
  readonly traceId: Uint8Array;

  /** Identifies this span within its trace. */
  readonly spanId: Uint8Array;

  /** Logs on behalf of this span. */
  readonly log: Logger;

  /** Create a span nested under this one. */
  child: (name: string) => Span;
}

/**
 * Create a span and announce it to the processor. Starts a new trace unless
 * given the `traceId` of an existing one.
 */
export const createSpan = (
  _name: string,
  context: Context,
  traceId = context.getRandomBytes(TRACE_ID_BYTES),
): Span => {
  const span: Span = {
    traceId,
    spanId: context.getRandomBytes(SPAN_ID_BYTES),
    log: context.log,
    child: (childName) => createSpan(childName, context, traceId),
  };

  // The handler goes unused until spans can apply actions.
  context.processor(span);

  return span;
};
