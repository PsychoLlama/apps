import type { Logger } from '@holz/core';

import type { Context } from './config';

// Mirrors holz's log context, minus its `error` field. Spans are plain data,
// and a failure is an outcome of the span rather than a detail describing it.
/** A span attribute value. Anything JSON-serializable, nesting included. */
type AttributeValue =
  | string
  | number
  | boolean
  | null
  | undefined
  | ReadonlyArray<AttributeValue>
  | { readonly [key: string]: AttributeValue };

/** Plain data describing a span. This is what processors receive. */
export type Span = Readonly<{
  /**
   * What this span measures. Low cardinality: use a string literal, with no
   * interpolation.
   */
  name: string;

  /** Identifies this span within its trace. 8 bytes. */
  id: Uint8Array;

  /** Details for the parent span. Null when it's the top level span. */
  parent: null | Readonly<{
    /** The parent's span ID. 8 bytes. */
    id: Uint8Array;
  }>;

  /** Details for the trace, shared by a root span and all its descendants. */
  trace: Readonly<{
    /** Identifies the trace. 16 bytes. */
    id: Uint8Array;
  }>;

  /** Key-value details about this span. */
  attrs: Readonly<Record<string, AttributeValue>>;
}>;

/** The API for instrumenting a unit of work. */
export interface SpanHandle {
  /** Logs on behalf of this span. */
  readonly log: Logger;

  /** Create a span nested under this one. */
  child: (name: string) => SpanHandle;
}

/** What a span inherits. Passed from a span to its children. */
interface SpanContext extends Context, Pick<Span, 'parent' | 'trace'> {}

/** Create a span and announce its data to the processor. */
export const createSpan = (name: string, context: SpanContext): SpanHandle => {
  const span: Span = {
    name,
    id: context.getRandomBytes(8),
    parent: context.parent,
    trace: context.trace,
    attrs: {},
  };

  // The handler goes unused until spans can apply actions.
  context.processor(span);

  return {
    log: context.log,
    child: (childName) => {
      return createSpan(childName, {
        ...context,
        parent: {
          id: span.id,
        },
      });
    },
  };
};
