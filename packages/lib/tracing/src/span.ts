import type { Logger } from '@holz/core';

import type { Context } from './config';
import { SpanAlreadyEnteredError, SpanAlreadyExitedError } from './errors';

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

/** A span whose work has started. */
export interface EnteredSpan extends Span {
  /** When the work happened. */
  readonly time: Readonly<{
    /** Unix epoch in milliseconds, fractional digits included. */
    started: number;
  }>;
}

/** A span whose work has finished. */
export interface ExitedSpan extends EnteredSpan {
  /** When the work happened. */
  readonly time: EnteredSpan['time'] &
    Readonly<{
      /** Unix epoch in milliseconds, fractional digits included. */
      ended: number;
    }>;
}

/** The API for instrumenting a unit of work. */
export interface SpanHandle {
  /** Logs on behalf of this span. */
  readonly log: Logger;

  /** Create a span nested under this one. */
  child: (name: string) => SpanHandle;

  /**
   * Mark the start of the work this span measures. Returns the function that
   * marks its end.
   */
  enter: () => () => void;
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

  let state: 'pending' | 'entered' | 'exited' = 'pending';
  const onAction = context.processor(span);

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

    enter: () => {
      if (state !== 'pending') throw new SpanAlreadyEnteredError(name);
      state = 'entered';

      const entered: EnteredSpan = {
        ...span,
        time: {
          started: context.getCurrentTime(),
        },
      };

      onAction({ type: 'enter', span: entered });

      return () => {
        if (state === 'exited') throw new SpanAlreadyExitedError(name);
        state = 'exited';

        const exited: ExitedSpan = {
          ...entered,
          time: {
            started: entered.time.started,
            ended: context.getCurrentTime(),
          },
        };

        onAction({ type: 'exit', span: exited });
      };
    },
  };
};
